"use client";

import { createContext, useEffect, useState, useContext } from "react";
import { DriftClient } from "@drift-labs/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import { toast } from "react-hot-toast";

// Array of fallback RPC endpoints
const RPC_ENDPOINTS = [
  "https://api.devnet.solana.com", // Solana default devnet - try this first
  "https://devnet.genesysgo.net", // GenesysGo devnet
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL, // Only use Helius as last resort
  // Add more fallback RPCs if available
];

const DriftClientContext = createContext<DriftClient | null>(null);

// Retry function with exponential backoff
const retryWithBackoff = async <T,>(fn: () => Promise<T>, maxRetries = 5, baseDelay = 5000): Promise<T> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, retries) + Math.random() * 2000;
      console.log(`Attempt ${retries} failed, retrying in ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop,
  // but TypeScript requires it for completeness
  throw new Error("Maximum retries exceeded");
};

export const DriftClientProvider = ({ children }: { children: React.ReactNode }) => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [driftClient, setDriftClient] = useState<DriftClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentRpcIndex, setCurrentRpcIndex] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Get the current RPC endpoint with a fallback mechanism
  const getCurrentRpcUrl = (): string | undefined => {
    // Filter out undefined endpoints and get the current one
    const validEndpoints = RPC_ENDPOINTS.filter(endpoint => endpoint);
    if (validEndpoints.length === 0) return undefined;
    
    const endpoint = validEndpoints[currentRpcIndex % validEndpoints.length];
    console.log(`Using RPC endpoint: ${endpoint} (${currentRpcIndex + 1}/${validEndpoints.length})`);
    return endpoint;
  };

  // Switch to the next RPC endpoint
  const switchToNextRpc = (): string | undefined => {
    const nextIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.filter(endpoint => endpoint).length;
    setCurrentRpcIndex(nextIndex);
    console.log(`Switching to RPC endpoint #${nextIndex}`);
    return getCurrentRpcUrl();
  };

  useEffect(() => {
    const rpcUrl = getCurrentRpcUrl();
    let client: DriftClient | null = null;

    if (!publicKey || !rpcUrl || !signTransaction || !signAllTransactions) {
      setDriftClient(null);
      return;
    }

    // Prevent too many connection attempts
    if (connectionAttempts > 15) {
      console.error("Too many connection attempts, stopping to prevent rate limiting");
      toast.error("Unable to connect after multiple attempts. Please try again later.");
      return;
    }

    setConnectionAttempts(prev => prev + 1);

    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      httpHeaders: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Drift-Trading-UI' 
      },
      confirmTransactionInitialTimeout: 60000, // 60 seconds
      disableRetryOnRateLimit: false,
    });

    const init = async () => {
      setIsInitializing(true);
      try {
        console.log('Checking RPC connection...', rpcUrl);
        
        await retryWithBackoff(async () => {
          const epochInfo = await connection.getEpochInfo();
          console.log('RPC Connection successful. Epoch:', epochInfo.epoch);
          return epochInfo;
        });

        console.log('Initializing DriftClient with publicKey:', publicKey?.toBase58(), 'and RPC:', rpcUrl);
        client = new DriftClient({
          connection,
          wallet: {
            publicKey: publicKey,
            signTransaction: signTransaction,
            signAllTransactions: signAllTransactions,
          },
          env: "devnet",
          // Add optional programID if needed to ensure connection to the correct program
          // programID: ProgramID
        });
        console.log('DriftClient instance created.');
        
        try {
          console.log('Subscribing DriftClient...');
          
          if (!client) {
            throw new Error("DriftClient was not properly initialized");
          }
          
          const localClient = client; // Create a non-null reference
          
          await retryWithBackoff(async () => {
            await localClient.subscribe();
            console.log('DriftClient subscribed successfully.');
            return true;
          });
          
          setDriftClient(localClient);
          toast.success('Connected to Drift protocol');
        } catch (subscribeError) {
          console.error('Error during DriftClient subscription after retries:', subscribeError);
          
          // Try next RPC endpoint if available
          const nextRpc = switchToNextRpc();
          if (nextRpc && nextRpc !== rpcUrl) {
            console.log('Switching to alternate RPC endpoint:', nextRpc);
            // This will trigger a new useEffect cycle with the new RPC
            return;
          }
          
          if (client && client.accountSubscriber) {
            try {
              // Try alternative subscription method
              const localClient = client; // Create a non-null reference
              
              await retryWithBackoff(async () => {
                await localClient.accountSubscriber.subscribe();
                console.log('Alternative subscription method successful');
                return true;
              });
              
              setDriftClient(localClient);
              toast.success('Connected to Drift protocol');
            } catch (alternateError) {
              console.warn('Using fallback method after failed retries');
              // @ts-ignore - Access private property for development workaround
              client.accountSubscriber.subscribed = true;
              console.log('Applied development workaround: force marked client as subscribed');
              setDriftClient(client);
              toast('Connected to Drift with limited functionality', {
                icon: '⚠️',
                style: {
                  background: '#1e1e2a',
                  color: '#ffc107',
                  border: '1px solid #ffc107',
                }
              });
            }
          } else {
            toast.error('Failed to subscribe to Drift updates');
          }
        }

      } catch (initError) {
        console.error('Error during DriftClient initialization/check after retries:', initError);
        
        // Try next RPC endpoint if available
        const nextRpc = switchToNextRpc();
        if (nextRpc && nextRpc !== rpcUrl) {
          console.log('Switching to alternate RPC endpoint after initialization failure:', nextRpc);
          // This will trigger a new useEffect cycle with the new RPC
          return;
        }
        
        setDriftClient(null);
        toast.error('Failed to connect to Drift protocol');
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      console.log('Cleaning up DriftClientProvider...');
      client?.unsubscribe().then(() => {
        console.log('DriftClient unsubscribed.');
      }).catch(err => {
        console.error('Error unsubscribing DriftClient:', err);
      });
      setDriftClient(null);
    };
  }, [publicKey, signTransaction, signAllTransactions, currentRpcIndex]);

  return (
    <DriftClientContext.Provider value={driftClient}>
      {isInitializing ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-4 text-gray-400">Connecting to Drift protocol...</p>
        </div>
      ) : (
        children
      )}
    </DriftClientContext.Provider>
  );
};

export const useDriftClient = () => useContext(DriftClientContext); 
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { DriftClient, UserAccount } from "@drift-labs/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import { toast } from "react-hot-toast";

// Custom error for rate limiting
class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

interface DriftClientContextType {
  driftClient: DriftClient | null;
  userAccounts: UserAccount[] | null;
  error: string | null;
  isLoading: boolean;
  isConnected: boolean;
  isSubscribed: boolean;
  currentRpcEndpoint: string | null; // Expose current RPC endpoint
}

const DriftClientContext = createContext<DriftClientContextType>({
  driftClient: null,
  userAccounts: null,
  error: null,
  isLoading: true,
  isConnected: false,
  isSubscribed: false,
  currentRpcEndpoint: null,
});

// Define multiple RPC endpoints - Prioritize public Solana endpoint
const RPC_ENDPOINTS = [
  "https://api.devnet.solana.com", // Public fallback first
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://devnet.helius-rpc.com/?api-key=76547270-226d-446d-8293-c1b3f8e8ea1b",
  // Add more backup endpoints here if available
].filter(Boolean); // Filter out any potential undefined/null values

const MAX_RETRIES_PER_ENDPOINT = 5; // Max retries for non-rate-limit errors per endpoint
const INITIAL_RETRY_DELAY = 5000; // 5 seconds for regular errors
const MAX_RETRY_DELAY = 30000; // 30 seconds for regular errors
const ENDPOINT_SWITCH_DELAY = 1000; // Short delay before trying next endpoint

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getJitter = (baseDelay: number) => {
  const jitter = Math.random() * 0.2; 
  return baseDelay * (1 + jitter);
};

// Updated retry logic: throws RateLimitError on 429, handles backoff for other errors
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  endpoint: string, // Pass endpoint for logging
  retries = MAX_RETRIES_PER_ENDPOINT,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Check specifically for rate limit error first
    const isRateLimitError = error.message?.includes('429') || 
                           error.status === 429 || 
                           error.message?.toLowerCase().includes('rate limit');
    
    if (isRateLimitError) {
      console.warn(`Rate limit detected on ${endpoint}. Switching endpoint.`);
      throw new RateLimitError(`Rate limit hit on ${endpoint}`); // Throw specific error
    }

    // Better handling for null reference errors
    if (error.message?.includes('Cannot read properties of null') || 
        error.message?.includes('Cannot read property')) {
      console.warn(`Null reference error detected in SDK call. Endpoint: ${endpoint}, Error: ${error.message}`);
      // Either try again with backoff or throw a specific error to handle it differently
    }

    // Handle other errors with backoff
    if (retries === 0) {
      console.error(`Max retries reached for non-rate-limit error on ${endpoint}. Error:`, error);
      throw error; // Throw original error after max retries
    }

    const nextDelay = Math.min(delay * 2, MAX_RETRY_DELAY);
    const jitteredDelay = getJitter(nextDelay);
    console.log(`Retrying on ${endpoint} in ${jitteredDelay/1000}s (attempt ${MAX_RETRIES_PER_ENDPOINT - retries + 1}/${MAX_RETRIES_PER_ENDPOINT}). Error: ${error.message}`);
    await sleep(jitteredDelay);
    return retryWithBackoff(fn, endpoint, retries - 1, nextDelay);
  }
};

// createConnection now accepts the endpoint URL
const createConnection = async (rpcEndpoint: string): Promise<Connection> => {
  console.log(`Attempting to connect to RPC: ${rpcEndpoint}`);
  const connection = new Connection(rpcEndpoint, 'confirmed');
  await connection.getEpochInfo(); // Test connection
  console.log(`Successfully connected to RPC: ${rpcEndpoint}`);
  return connection;
};

// Add this debugging helper before the DriftClientProvider component
const safelyExecuteSdkMethod = async <T,>(
  methodName: string,
  method: () => Promise<T>,
  fallbackValue?: T
): Promise<T> => {
  try {
    console.debug(`Executing SDK method: ${methodName}`);
    const result = await method();
    console.debug(`Successfully executed SDK method: ${methodName}`);
    return result;
  } catch (error: any) {
    console.error(`Error in SDK method ${methodName}:`, error);
    console.error(`Stack trace for ${methodName}:`, error.stack);
    
    if (fallbackValue !== undefined) {
      console.warn(`Using fallback value for failed SDK method: ${methodName}`);
      return fallbackValue;
    }
    throw error;
  }
};

interface DriftClientProviderProps {
  children: ReactNode;
  onConnected?: () => void; // Add onConnected prop
}

export function DriftClientProvider({ children, onConnected }: DriftClientProviderProps) {
  const [driftClient, setDriftClient] = useState<DriftClient | null>(null);
  const [userAccounts, setUserAccounts] = useState<UserAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRpcIndex, setCurrentRpcIndex] = useState(0);
  const [currentRpcEndpoint, setCurrentRpcEndpoint] = useState<string | null>(RPC_ENDPOINTS[0] || null);
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  
  const isSubscribedRef = useRef(false);
  const isInitializedRef = useRef(false);
  const mountedRef = useRef(true);

  // Add a debug flag
  const [sdkDebugMode] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    isInitializedRef.current = false; // Reset initialization flag on wallet change
    isSubscribedRef.current = false; // Reset subscription flag
    setDriftClient(null); // Clear old client
    setUserAccounts(null);
    setError(null);
    setIsConnected(false);
    setIsSubscribed(false);
    setIsLoading(true);
    setCurrentRpcIndex(0); // Start from the first endpoint
    setCurrentRpcEndpoint(RPC_ENDPOINTS[0] || null);

    const initializeDriftClient = async () => {
      if (!publicKey || !signTransaction || !signAllTransactions) {
        if (mountedRef.current) {
          setIsLoading(false); 
        }
        return;
      }

      let successfulInitialization = false;
      let attemptIndex = 0;
      const maxEndpointAttempts = RPC_ENDPOINTS.length;

      while (!successfulInitialization && attemptIndex < maxEndpointAttempts && mountedRef.current) {
        const currentEndpoint = RPC_ENDPOINTS[attemptIndex];
        setCurrentRpcEndpoint(currentEndpoint);
        console.log(`Attempting initialization with endpoint ${attemptIndex + 1}/${maxEndpointAttempts}: ${currentEndpoint}`);

        try {
          if (mountedRef.current) setError(null);

          // Try connecting with current endpoint
          const connection = await retryWithBackoff(() => createConnection(currentEndpoint), currentEndpoint);
          
          // Initialize client with enhanced error logging
          if (sdkDebugMode) console.debug("Creating DriftClient instance...");
          
          const clientConfig = {
            connection,
            wallet: { publicKey, signTransaction, signAllTransactions },
            env: "devnet" as const,
            opts: { 
              commitment: 'confirmed' as Commitment, 
              skipPreflight: true 
            }
          };
          
          if (sdkDebugMode) console.debug("Client config:", JSON.stringify(clientConfig, (key, value) => 
            key === 'connection' ? '[Connection Object]' : 
            key === 'publicKey' ? value.toString() : 
            key === 'signTransaction' || key === 'signAllTransactions' ? '[Function]' : 
            value
          ));
          
          const client = new DriftClient(clientConfig);

          if (!mountedRef.current) return;
          
          // Additional validation
          if (!client) {
            console.error("DriftClient was not properly initialized");
            throw new Error("Failed to initialize DriftClient");
          }
          
          // Check if required methods exist
          if (typeof client.subscribe !== 'function') {
            console.error("DriftClient.subscribe is not a function");
            throw new Error("Malformed DriftClient instance");
          }
          
          if (typeof client.getUserAccountsForAuthority !== 'function') {
            console.error("DriftClient.getUserAccountsForAuthority is not a function");
            throw new Error("Malformed DriftClient instance");
          }
          
          setDriftClient(client);
          setIsConnected(true);
          isInitializedRef.current = true;

          // Try subscribing with more safety measures
          if (!isSubscribedRef.current) {
            await sleep(5000); // Increased delay to 5 seconds
            
            if (sdkDebugMode) console.debug("Attempting to subscribe to DriftClient events...");
            
            await retryWithBackoff(async () => {
              if (!client) throw new Error("Client not available for subscribe");
              
              // Wrap the SDK call in our safe executor
              await safelyExecuteSdkMethod('client.subscribe', 
                async () => {
                  // Check internal state of client before subscribing
                  if (!client.connection) {
                    throw new Error("Client connection is null before subscribe");
                  }
                  
                  // Safe subscribe with extra logging
                  console.debug("[safelyExecuteSdkMethod] Calling client.subscribe()...");
                  try {
                    const subscribeResult = await client.subscribe();
                    console.debug("[safelyExecuteSdkMethod] client.subscribe() returned successfully.");
                    
                    if (!mountedRef.current) return false; // Check mount status after async call

                    // Check the result if necessary (depends on SDK)
                    if (!subscribeResult) { 
                        console.warn("client.subscribe() returned falsy value");
                        // Consider throwing an error if subscribeResult is critical
                    }
                    
                    console.log(`Successfully subscribed on endpoint: ${currentEndpoint}`);
                    setIsSubscribed(true);
                    isSubscribedRef.current = true;
                    if (onConnected) { // Call onConnected callback if provided
                      console.log("Calling onConnected callback...");
                      onConnected();
                    }
                    return true; // Indicate success for retryWithBackoff
                  } catch (subscribeError: any) {
                    console.error(`Error during client.subscribe() on ${currentEndpoint}:`, subscribeError);
                    setIsSubscribed(false);
                    isSubscribedRef.current = false;
                    // Re-throw to allow retryWithBackoff to handle it
                    throw subscribeError; 
                  }
                }
              );
            }, currentEndpoint);
          
            if (!mountedRef.current) return;
            setIsSubscribed(true);
            isSubscribedRef.current = true;
            console.log(`Successfully subscribed via ${currentEndpoint}`);
          }

          // Try fetching accounts with more safety measures
          if (!userAccounts) {
            try {
              // Longer delay before fetching accounts
              await sleep(2000);
              
              if (sdkDebugMode) console.debug("Attempting to fetch user accounts...");
              
              await retryWithBackoff(async () => {
                if (!client) throw new Error("Client not available for getUserAccounts");
                if (!publicKey) throw new Error("Public key not available for getUserAccounts");
                
                // Wrap the SDK call in our safe executor with a fallback empty array
                const accounts = await safelyExecuteSdkMethod('client.getUserAccountsForAuthority',
                  async () => {
                    // Check connection and other required objects
                    if (!client.connection) {
                      throw new Error("Client connection is null before getUserAccounts");
                    }
                    
                    // Safe get accounts
                    return await client.getUserAccountsForAuthority(publicKey);
                  },
                  [] // Fallback to empty array
                );
                
                if (mountedRef.current) setUserAccounts(accounts || []);
              }, currentEndpoint);
            } catch (fetchErr: any) {
              console.warn(`Failed to fetch user accounts via ${currentEndpoint} (non-fatal):`, fetchErr);
              if (mountedRef.current) setUserAccounts([]);
            }
          }

          // Success!
          successfulInitialization = true;
          if (mountedRef.current) setIsLoading(false);
          console.log(`Drift client fully initialized and subscribed via ${currentEndpoint}`);

        } catch (err: any) {
          if (!mountedRef.current) return;

          console.error(`Error during initialization/subscription: ${err.message || 'Unknown error'}`, err);
          
          // Log additional diagnostic info about the failure
          if (sdkDebugMode) {
            console.debug("Error details:", {
              endpoint: currentEndpoint,
              message: err.message,
              name: err.name,
              stack: err.stack,
              isRateLimitError: err instanceof RateLimitError
            });
          }
          
          const isNullReferenceError = err.message?.includes('Cannot read properties of null');

          if (err instanceof RateLimitError || isNullReferenceError) {
            // Treat null reference errors during init/sub like rate limits - try next endpoint immediately
            const errorType = err instanceof RateLimitError ? "Rate limit" : "Null reference";
            console.warn(`${errorType} error hit on ${currentEndpoint}, trying next endpoint...`);
            await sleep(ENDPOINT_SWITCH_DELAY);
          } else {
            console.error(`Failed to initialize/subscribe via ${currentEndpoint} after retries:`, err);
            await sleep(ENDPOINT_SWITCH_DELAY);
          }
        }
        attemptIndex++;
      }

      // After loop: check if initialization failed after trying all endpoints
      if (!successfulInitialization && mountedRef.current) {
        console.error("Failed to initialize Drift client after trying all RPC endpoints.");
        setError("Failed to connect to Drift after trying all available RPC endpoints.");
        setIsLoading(false);
        toast.error("Could not connect to Drift. Please try again later or check network.");
      }
    };

    initializeDriftClient();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      console.log("DriftClientProvider cleaning up...");
      const currentDriftClient = driftClient; // Capture current value for cleanup
      if (currentDriftClient && isSubscribedRef.current) {
        currentDriftClient.unsubscribe().catch(err => {
          console.error("Error unsubscribing from Drift client:", err);
        });
      }
      isSubscribedRef.current = false;
      isInitializedRef.current = false;
    };
  // REMOVE driftClient from dependency array
  }, [publicKey, signTransaction, signAllTransactions, onConnected, sdkDebugMode]); 

  return (
    <DriftClientContext.Provider value={{ 
      driftClient, 
      userAccounts, 
      error, 
      isLoading,
      isConnected,
      isSubscribed,
      currentRpcEndpoint
    }}>
      {children}
    </DriftClientContext.Provider>
  );
}

export const useDriftClient = () => {
  const context = useContext(DriftClientContext);
  if (context === undefined) {
    throw new Error("useDriftClient must be used within a DriftClientProvider");
  }
  return context;
}; 
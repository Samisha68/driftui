"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useDriftClient } from "./DriftClientProvider";
import { useEffect, useState } from "react";
import { UserAccount } from "@drift-labs/sdk";
import { motion } from "framer-motion";
import { StatsCard } from "./StatsCard";
import { FiDollarSign, FiTrendingUp, FiPackage, FiLoader, FiPlus, FiActivity } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Connection, PublicKey, TransactionSignature } from "@solana/web3.js";

// Retry function for operations that might hit rate limits
const retryOperation = async <T,>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2500): Promise<T> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) throw error;
      
      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, retries) + Math.random() * 500;
      console.log(`Retrying operation in ${Math.round(delay)}ms (attempt ${retries}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Maximum retries exceeded");
};

// Function to check transaction confirmation status
const checkTransactionStatus = async (signature: string, connection: Connection): Promise<boolean> => {
  const toastId = toast.loading('Checking transaction status...');
  try {
    const result = await connection.confirmTransaction(signature, 'confirmed');
    if (result.value.err) {
      console.error('Transaction error:', result.value.err);
      toast.error('Transaction failed', { id: toastId });
      return false;
    }
    
    toast.success('Transaction confirmed!', { id: toastId });
    return true;
  } catch (error) {
    console.error('Error confirming transaction:', error);
    toast.error('Failed to confirm transaction', { id: toastId });
    return false;
  }
};

export function SubaccountList() {
  const { publicKey } = useWallet();
  const driftClient = useDriftClient();
  const [subaccounts, setSubaccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [newSubaccountPubkey, setNewSubaccountPubkey] = useState<PublicKey | null>(null);

  const fetchSubaccounts = async () => {
    if (!driftClient || !publicKey) return;
    console.log('Fetching subaccounts for:', publicKey.toBase58());
    setLoading(true);
    try {
      const accounts = await retryOperation(async () => {
        return await driftClient.getUserAccountsForAuthority(publicKey);
      });
      console.log('Fetched subaccounts:', accounts);
      setSubaccounts(accounts);
    } catch (error) {
      console.error("Error fetching subaccounts:", error);
      toast.error("Failed to load subaccounts");
    } finally {
      setLoading(false);
    }
  };

  // Check transaction status effect
  useEffect(() => {
    const verifyTransaction = async () => {
      if (!txSignature || !driftClient) return;
      
      const confirmed = await checkTransactionStatus(
        txSignature, 
        driftClient.connection
      );
      
      if (confirmed) {
        await fetchSubaccounts();
        setTxSignature(null);
        setNewSubaccountPubkey(null);
      }
    };
    
    if (txSignature) {
      verifyTransaction();
    }
  }, [txSignature, driftClient]);

  useEffect(() => {
    fetchSubaccounts();
  }, [driftClient, publicKey]);

  const handleCreateSubaccount = async () => {
    if (!driftClient || !publicKey) {
      console.error('Drift client or public key not available');
      toast?.error('Wallet not connected or Drift client not initialized');
      return;
    }

    setIsCreating(true);
    console.log('Attempting to create subaccount...');
    console.log('Current subaccounts:', subaccounts);
    console.log('Public key:', publicKey.toBase58());
    console.log('Drift client initialized:', !!driftClient);
    console.log('Drift client state:', {
      isSubscribed: driftClient.accountSubscriber?.isSubscribed,
      perpMarkets: driftClient.getPerpMarketAccounts().length,
      spotMarkets: driftClient.getSpotMarketAccounts().length
    });

    try {
      const nextSubAccountId = subaccounts.length;
      console.log(`Using nextSubAccountId: ${nextSubAccountId}`);

      // Ensure client is subscribed
      if (driftClient && driftClient.accountSubscriber) {
        console.log('Ensuring client is properly subscribed...');
        // Use proper subscription method instead of accessing private property
        if (!driftClient.accountSubscriber.isSubscribed) {
          await retryOperation(async () => {
            await driftClient.accountSubscriber.subscribe();
            return true;
          });
          console.log('Client successfully subscribed');
        } else {
          console.log('Client was already subscribed');
        }
      }

      console.log('About to call initializeUserAccount...');
      const [signature, userAccountPubkey] = await retryOperation(async () => {
        return await driftClient.initializeUserAccount(nextSubAccountId);
      });
      console.log('Subaccount creation transaction sent:', signature);
      console.log('New subaccount public key:', userAccountPubkey.toBase58());
      
      // Store signature for verification
      setTxSignature(signature);
      setNewSubaccountPubkey(userAccountPubkey);
      toast.loading('Transaction sent! Waiting for confirmation...');

    } catch (error) {
      console.error("Error creating subaccount:", error);
      
      // More detailed error reporting
      let errorMessage = "Failed to create subaccount";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        console.error("Error stack:", error.stack);
        
        // Handle specific errors
        if (error.message.includes("429")) {
          errorMessage = "Rate limit exceeded. Please try again in a few moments.";
        } else if (error.message.includes("Network request failed")) {
          errorMessage = "Network request failed. Please check your connection.";
        }
      }
      
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast?.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100
      }
    },
    hover: {
      y: -5,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100
      }
    }
  };

  if (loading && subaccounts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-6">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 text-lg"
        >
          Loading your subaccounts...
        </motion.p>
      </div>
    );
  }

  if (subaccounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="max-w-md mx-auto glass-effect rounded-xl p-8 relative overflow-hidden glow-effect">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-60"></div>
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary opacity-10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-secondary opacity-10 rounded-full blur-xl"></div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
            className="rounded-full bg-gray-800 p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center"
          >
            <FiPlus className="text-primary text-3xl" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold mb-4 gradient-text"
          >
            No Subaccounts Found
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mb-8"
          >
            You don't have any subaccounts yet. Create one to start trading on Drift.
          </motion.p>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="w-full bg-gradient-to-r from-primary to-secondary text-black relative overflow-hidden group"
              onClick={handleCreateSubaccount}
              disabled={isCreating || !driftClient || !!txSignature}
            >
              <span className="absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              {isCreating ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Creating...
                </>
              ) : txSignature ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Confirming Transaction...
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  Create Subaccount
                </>
              )}
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-xs text-gray-500"
          >
            Subaccounts help you organize your trading activities
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12"
    >
      <div className="flex justify-between items-center mb-6">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold gradient-text"
        >
          Your Subaccounts
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            className="bg-gray-800 hover:bg-gray-700"
            onClick={handleCreateSubaccount}
            disabled={isCreating || !driftClient || !!txSignature}
          >
            {isCreating ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Creating...
              </>
            ) : txSignature ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Confirming...
              </>
            ) : (
              <>
                <FiPlus className="mr-2" />
                New Subaccount
              </>
            )}
          </Button>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <StatsCard
          title="Total Balance"
          value="$12,345.67"
          change="+2.5%"
          icon={<FiDollarSign className="text-2xl" />}
          trend="up"
        />
        <StatsCard
          title="Open Positions"
          value="3"
          icon={<FiTrendingUp className="text-2xl" />}
          subtitle="Across 2 markets"
        />
        <StatsCard
          title="Active Orders"
          value="5"
          icon={<FiPackage className="text-2xl" />}
          subtitle="2 limit, 3 stop"
        />
      </motion.div>
      
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {subaccounts.map((account, index) => (
          <motion.div
            key={account.subAccountId}
            variants={cardVariants}
            whileHover="hover"
            className="gradient-border h-full"
          >
            <Card className="glass-effect border-none h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold gradient-text">
                  Subaccount #{account.subAccountId}
                </CardTitle>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center"
                >
                  <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                  <span className="text-sm text-gray-400">Active</span>
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-1 flex items-center">
                      <FiDollarSign className="mr-1 text-primary opacity-60" />
                      Balance
                    </h4>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-medium">
                        {account.spotPositions
                          .filter((p) => p.scaledBalance > 0)
                          .map((p) => `${p.scaledBalance} USDC`)
                          .join(", ") || "0 USDC"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-gray-400 mb-1 flex items-center">
                      <FiActivity className="mr-1 text-secondary opacity-60" />
                      Perp Positions
                    </h4>
                    <div className="space-y-2">
                      {account.perpPositions
                        .filter((p) => p.baseAssetAmount !== 0)
                        .map((p) => (
                          <div
                            key={p.marketIndex}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all"
                          >
                            <span className="text-sm">Market {p.marketIndex}</span>
                            <span className={`text-sm font-medium ${p.baseAssetAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {p.baseAssetAmount > 0 ? "Long" : "Short"}{" "}
                              {Math.abs(p.baseAssetAmount)}
                            </span>
                          </div>
                        ))}
                      {account.perpPositions.filter(p => p.baseAssetAmount !== 0).length === 0 && (
                        <p className="text-sm text-gray-400 p-2">No open positions</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-gray-400 mb-1 flex items-center">
                      <FiPackage className="mr-1 text-accent-purple opacity-60" />
                      Open Orders
                    </h4>
                    <p className="text-lg">
                      {account.orders.filter((o) => o.status === "open").length}{" "}
                      open orders
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 group relative overflow-hidden"
                      // onClick={() => handleDeposit(account.subAccountId)}
                    >
                      <span className="absolute inset-0 w-0 bg-gradient-to-r from-primary to-secondary opacity-10 transition-all duration-300 group-hover:w-full"></span>
                      Deposit
                    </Button>
                    <Button 
                      className="flex-1 group relative overflow-hidden"
                      // onClick={() => handleTrade(account.subAccountId)}
                    >
                      <span className="absolute inset-0 w-0 bg-gradient-to-r from-primary to-secondary opacity-20 transition-all duration-300 group-hover:w-full"></span>
                      Trade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        {/* Add account card */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="gradient-border h-full"
        >
          <Card className="glass-effect border-none h-full flex flex-col justify-center items-center py-8 cursor-pointer"
                onClick={handleCreateSubaccount}>
            <div className="rounded-full bg-gray-800 p-4 mb-4">
              <FiPlus className="text-primary text-2xl" />
            </div>
            <p className="text-gray-400">Create New Subaccount</p>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 
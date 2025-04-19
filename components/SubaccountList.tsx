"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useDriftClient } from "./DriftClientProvider";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { UserAccount } from "@drift-labs/sdk";
import { motion, AnimatePresence } from "framer-motion";
import { StatsCard } from "./StatsCard";
import { FiDollarSign, FiTrendingUp, FiPackage, FiLoader, FiPlus, FiActivity } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Connection, PublicKey, TransactionSignature } from "@solana/web3.js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TransferModal } from "./TransferModal";
import { TradeModal } from "./TradeModal";
import { AdvancedOrderModal } from "./AdvancedOrderModal";
import BN from "bn.js";

// Simple retry utility (can be enhanced)
const retryOperation = async <T,>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2500): Promise<T> => {
  let retries = 0;
  let delay = initialDelay;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      retries++;
      if (retries > maxRetries) {
        console.error("Max retries reached for operation.", error);
        throw error;
      }
      const isRateLimitError = error.message?.includes('429') || error.status === 429;
      const waitTime = isRateLimitError ? delay * 2 : delay; // Longer wait for rate limits
      console.log(`Operation failed (attempt ${retries}/${maxRetries}). Retrying after ${waitTime/1000}s delay... Error: ${error.message}`);
      await sleep(waitTime);
      delay = waitTime; // Exponential backoff might be better here
    }
  }
};

// Function to check transaction confirmation status
const checkTransactionStatus = async (signature: string, connection: Connection): Promise<boolean> => {
  let confirmed = false;
  let retries = 10; // Approx 30 seconds with 3s interval
  while (!confirmed && retries > 0) {
    try {
      const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
      if (status && status.value && (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized')) {
        console.log(`Transaction ${signature} confirmed with status: ${status.value.confirmationStatus}`);
        confirmed = true;
      } else {
        console.log(`Transaction ${signature} not confirmed yet. Status:`, status?.value?.confirmationStatus, `Retries left: ${retries - 1}`);
        await sleep(3000); // Wait 3 seconds before retrying
      }
    } catch (error) {
      console.error(`Error checking transaction status for ${signature}:`, error);
      break; 
    }
    retries--;
  }
  return confirmed;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function SubaccountList() {
  const { driftClient, userAccounts, isLoading, isSubscribed, error: providerError } = useDriftClient();
  const { publicKey } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [newSubaccountPubkey, setNewSubaccountPubkey] = useState<PublicKey | null>(null);
  const [isViewingOtherWallet, setIsViewingOtherWallet] = useState(false);
  const [viewWalletAddress, setViewWalletAddress] = useState("");
  const [viewedAccounts, setViewedAccounts] = useState<UserAccount[] | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    const verifyTransaction = async () => {
      if (!txSignature || !driftClient) return;
  
      toast.loading('Verifying transaction...'); 
      const confirmed = await checkTransactionStatus(txSignature, driftClient.connection);
      
      if (confirmed) {
        toast.success('Transaction confirmed! Subaccount created.');
        setTxSignature(null);
        setNewSubaccountPubkey(null);
      } else {
        toast.error('Transaction confirmation failed or timed out.');
        setTxSignature(null);
        setNewSubaccountPubkey(null);
      }
    };
    
    if (txSignature) {
      verifyTransaction();
    }
  }, [txSignature, driftClient]);

  const handleCreateSubaccount = async () => {
    if (isLoading || !isSubscribed || !driftClient || !publicKey) {
       const reason = isLoading ? "Client loading" :
                      !isSubscribed ? "Client not subscribed" :
                      !driftClient ? "Client not available" :
                      !publicKey ? "Wallet not connected" : "Unknown reason";
      console.error(`Create subaccount prerequisites not met: ${reason}`);
      toast?.error(`Cannot create subaccount: ${reason}`);
      return;
    }

    setIsCreating(true);
    console.log('Attempting to create subaccount...');
    
    try {
      const currentAccounts = userAccounts || [];
      const existingIds = currentAccounts.map(acc => acc.subAccountId).sort((a, b) => a - b);
      let nextSubAccountId = 0;
      while (existingIds.includes(nextSubAccountId)) {
        nextSubAccountId++;
      }
      console.log(`Using nextSubAccountId: ${nextSubAccountId}`);

      console.log('About to call initializeUserAccount...');
      const [signature, userAccountPubkey] = await retryOperation(async () => {
        return await driftClient.initializeUserAccount();
      });
      console.log('Subaccount creation transaction sent:', signature);
      console.log('New subaccount public key:', userAccountPubkey.toBase58());
      
      setTxSignature(signature);
      setNewSubaccountPubkey(userAccountPubkey);
      toast.loading('Transaction sent! Waiting for confirmation...');

    } catch (error) {
      console.error("Error creating subaccount:", error);
      let errorMessage = "Failed to create subaccount";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      toast?.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeposit = (subAccountId: number) => {
    console.log(`Deposit clicked for subaccount: ${subAccountId}`);
    toast(`Deposit action for subaccount ${subAccountId} (Not implemented yet)`);
    // TODO: Implement deposit modal/logic
  };

  const handleWithdraw = (subAccountId: number) => {
    console.log(`Withdraw clicked for subaccount: ${subAccountId}`);
    toast.error(`Withdraw action for subaccount ${subAccountId} (Not implemented yet)`);
    // TODO: Implement withdraw modal/logic
  };

  const handleTrade = (subAccountId: number) => {
    console.log(`Trade clicked for subaccount: ${subAccountId}`);
    toast.success(`Navigate to trade for subaccount ${subAccountId} (Not implemented yet)`);
    // TODO: Implement navigation to trading view
  };

  const handleViewWallet = async (address: string) => {
    if (!driftClient) {
      toast.error("Drift client not initialized");
      return;
    }

    try {
      const pubkey = new PublicKey(address);
      setViewLoading(true);
      setViewedAccounts(null);
      const accounts = await retryOperation(async () => {
        return await driftClient.getUserAccountsForAuthority(pubkey);
      }, 5, 1000);
      setViewedAccounts(accounts);
      setIsViewingOtherWallet(true);
      toast.success(`Viewing subaccounts for wallet: ${address.substring(0,6)}...`);
    } catch (error) {
      console.error("Error viewing wallet:", error);
      setViewedAccounts(null);
      toast.error("Could not fetch accounts for this address.");
    } finally {
      setViewLoading(false);
    }
  };

  const resetToConnectedWallet = () => {
    setIsViewingOtherWallet(false);
    setViewedAccounts(null);
    setViewWalletAddress("");
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

  // Determine which accounts to display
  const displayAccounts = isViewingOtherWallet ? viewedAccounts : userAccounts;
  const displayLoading = isViewingOtherWallet ? viewLoading : isLoading;

  if (displayLoading && (!displayAccounts || displayAccounts.length === 0)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-6">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 text-lg"
        >
          {isViewingOtherWallet ? "Loading specified wallet accounts..." : "Loading your subaccounts..."}
        </motion.p>
      </div>
    );
  }

  if (!displayLoading && (!displayAccounts || displayAccounts.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="max-w-md mx-auto glass-effect rounded-xl p-8 relative overflow-hidden glow-effect">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-60"></div>
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary opacity-10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-secondary opacity-10 rounded-full blur-xl"></div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
            className="rounded-full bg-gray-800 p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center"
          >
            <FiPackage className="text-primary text-3xl" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold mb-4 gradient-text"
          >
            {isViewingOtherWallet ? "No Subaccounts Found for Address" : "No Subaccounts Found"}
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mb-8"
          >
            {isViewingOtherWallet ? 
             `The wallet ${viewWalletAddress.substring(0,6)}... has no Drift subaccounts.` :
             "You don't have any subaccounts yet. Create one to start trading on Drift."
            }
          </motion.p>
          
          {!isViewingOtherWallet && (
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
                disabled={isCreating || isLoading || !isSubscribed || !publicKey || !!txSignature}
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
          )}
          
          {isViewingOtherWallet && (
            <Button 
              variant="outline" 
              onClick={resetToConnectedWallet}
              className="flex items-center gap-2"
            >
              <FiActivity className="text-lg" />
              Back to My Wallet
            </Button>
          )}

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
          {isViewingOtherWallet ? `Viewing: ${viewWalletAddress.substring(0,6)}...` : "Your Subaccounts"}
        </motion.h2>
        
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FiActivity className="text-lg" />
                View Other Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>View Wallet Subaccounts</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet-address">Wallet Address</Label>
                  <Input
                    id="wallet-address"
                    placeholder="Enter Solana wallet address"
                    value={viewWalletAddress}
                    onChange={(e) => setViewWalletAddress(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleViewWallet(viewWalletAddress)}
                  disabled={!viewWalletAddress || viewLoading}
                >
                  {viewLoading ? <FiLoader className="animate-spin mr-2" /> : null}
                  {viewLoading ? "Loading..." : "View Subaccounts"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {isViewingOtherWallet && (
            <Button 
              variant="outline" 
              onClick={resetToConnectedWallet}
              className="flex items-center gap-2"
            >
              <FiActivity className="text-lg" />
              Back to My Wallet
            </Button>
          )}

          <Button 
            className="bg-gray-800 hover:bg-gray-700"
            onClick={handleCreateSubaccount}
            disabled={isCreating || isLoading || !isSubscribed || !publicKey || !!txSignature}
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
        </div>
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
        {displayAccounts && displayAccounts.map((account, index) => (
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
                          .filter((p) => p.scaledBalance.gt(new BN(0)))
                          .map((p) => `${p.scaledBalance.toString()} USDC`)
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
                        .filter((p) => !p.baseAssetAmount.isZero())
                        .map((p) => (
                          <div
                            key={p.marketIndex}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all"
                          >
                            <span className="text-sm">Market {p.marketIndex}</span>
                            <span className={`text-sm font-medium ${p.baseAssetAmount.gt(new BN(0)) ? 'text-green-400' : 'text-red-400'}`}>
                              {p.baseAssetAmount.gt(new BN(0)) ? "Long" : "Short"} {p.baseAssetAmount.abs().toString()}
                            </span>
                          </div>
                        ))}
                      {account.perpPositions.filter(p => !p.baseAssetAmount.isZero()).length === 0 && (
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
                    <TransferModal
                      subAccountId={account.subAccountId}
                      type="deposit"
                      trigger={
                        <Button 
                          variant="outline" 
                          className="flex-1 group relative overflow-hidden"
                        >
                          <span className="absolute inset-0 w-0 bg-gradient-to-r from-primary to-secondary opacity-10 transition-all duration-300 group-hover:w-full"></span>
                          Deposit
                        </Button>
                      }
                    />
                    <TransferModal
                      subAccountId={account.subAccountId}
                      type="withdraw"
                      trigger={
                        <Button
                          variant="outline"
                          className="flex-1 group relative overflow-hidden border-red-500/50 text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/80"
                        >
                          <span className="absolute inset-0 w-0 bg-gradient-to-r from-red-500 to-pink-600 opacity-10 transition-all duration-300 group-hover:w-full"></span>
                          Withdraw
                        </Button>
                      }
                    />
                  </div>
                  <div className="flex space-x-2">
                    <TradeModal
                      subAccountId={account.subAccountId}
                      trigger={
                        <Button
                          className="flex-1 group relative overflow-hidden bg-gradient-to-r from-primary to-secondary text-black"
                        >
                          <span className="absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                          Trade
                        </Button>
                      }
                    />
                    <AdvancedOrderModal
                      subAccountId={account.subAccountId}
                      trigger={
                        <Button
                          variant="outline"
                          className="flex-1 group relative overflow-hidden border-purple-500/50 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 hover:border-purple-500/80"
                        >
                          <span className="absolute inset-0 w-0 bg-gradient-to-r from-purple-500 to-pink-600 opacity-10 transition-all duration-300 group-hover:w-full"></span>
                          Advanced
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        {/* Add account card */}
        {!isViewingOtherWallet && (
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
        )}
      </motion.div>

      <AnimatePresence>
        {providerError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="error-banner bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-md">
            <p><span className="font-semibold">Provider Error:</span> {providerError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 
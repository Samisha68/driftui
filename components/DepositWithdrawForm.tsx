"use client";

import React, { useState } from 'react';
import { useDriftClient } from './DriftClientProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN, QUOTE_SPOT_MARKET_INDEX } from '@drift-labs/sdk';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'react-hot-toast';

export function DepositWithdrawForm({ subAccountId }: { subAccountId: number }) {
  const { driftClient, isSubscribed, error: providerError } = useDriftClient();
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    if (!driftClient || !isSubscribed) {
      toast.error("Not connected or subscribed to Drift protocol");
      return;
    }
    if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    setIsLoading(true);
    try {
      // Assuming USDC (6 decimals)
      const depositAmount = new BN(parseFloat(amount) * 10 ** 6);
      // Add missing arguments: amount, marketIndex, authority, subAccountId?
      const txSig = await driftClient.deposit(
         depositAmount, 
         QUOTE_SPOT_MARKET_INDEX, 
         publicKey, 
         subAccountId 
      );
      await driftClient.connection.confirmTransaction(txSig, 'confirmed');
      toast.success(`Successfully deposited ${amount} USDC. Tx: ${txSig.substring(0, 8)}...`);
      setAmount(""); // Clear input
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast.error(`Deposit failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!driftClient || !isSubscribed) {
      toast.error("Not connected or subscribed to Drift protocol");
      return;
    }
     if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    // Check if the client's active subaccount matches the target
    if (driftClient.activeSubAccountId !== subAccountId) {
      toast.error(`Please ensure subaccount ${subAccountId} is selected as active before withdrawing.`);
      console.warn(`Withdraw attempt failed: Active subaccount (${driftClient.activeSubAccountId}) does not match target (${subAccountId})`);
      return;
    }

    setIsLoading(true);
    try {
      // Assuming USDC (6 decimals)
      const withdrawAmount = new BN(parseFloat(amount) * 10 ** 6);
      // Call withdraw WITHOUT subAccountId, relying on activeSubAccountId
      const txSig = await driftClient.withdraw(
        withdrawAmount, 
        QUOTE_SPOT_MARKET_INDEX, 
        publicKey 
        // No subAccountId argument here
      );
      await driftClient.connection.confirmTransaction(txSig, 'confirmed');
      toast.success(`Successfully withdrew ${amount} USDC. Tx: ${txSig.substring(0, 8)}...`);
      setAmount(""); // Clear input
    } catch (error: any) {
      console.error("Withdraw error:", error);
      toast.error(`Withdraw failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount (USDC)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 100"
          disabled={isLoading}
        />
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleDeposit} disabled={isLoading || !isSubscribed} className="flex-1">
          {isLoading ? "Depositing..." : "Deposit"}
        </Button>
        <Button onClick={handleWithdraw} disabled={isLoading || !isSubscribed} variant="outline" className="flex-1">
          {isLoading ? "Withdrawing..." : "Withdraw"}
        </Button>
      </div>
       {providerError && <p className="text-xs text-red-500">Provider Error: {providerError}</p>}
    </div>
  );
} 
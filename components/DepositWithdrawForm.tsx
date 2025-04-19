"use client";

import { useState } from "react";
import { useDriftClient } from "./DriftClientProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "react-hot-toast";

export const DepositWithdrawForm = () => {
  const driftClient = useDriftClient();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    if (!driftClient || !driftClient.accountSubscriber?.subscribed) {
      toast.error("Not connected to Drift protocol");
      return;
    }

    try {
      setIsLoading(true);
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const tx = await driftClient.deposit(amountNum);
      toast.success(`Deposited ${amountNum} USDC`);
      console.log("Deposit transaction:", tx);
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to deposit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!driftClient || !driftClient.accountSubscriber?.subscribed) {
      toast.error("Not connected to Drift protocol");
      return;
    }

    try {
      setIsLoading(true);
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const tx = await driftClient.withdraw(amountNum);
      toast.success(`Withdrawn ${amountNum} USDC`);
      console.log("Withdraw transaction:", tx);
    } catch (error) {
      console.error("Withdraw error:", error);
      toast.error("Failed to withdraw. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Deposit/Withdraw</h3>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USDC)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleDeposit}
          disabled={isLoading || !amount}
          className="flex-1"
        >
          {isLoading ? "Processing..." : "Deposit"}
        </Button>
        <Button
          onClick={handleWithdraw}
          disabled={isLoading || !amount}
          variant="outline"
          className="flex-1"
        >
          {isLoading ? "Processing..." : "Withdraw"}
        </Button>
      </div>
    </div>
  );
}; 
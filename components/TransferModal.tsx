"use client";

import { useState } from "react";
import { useDriftClient } from "./DriftClientProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "react-hot-toast";
import { BN, QUOTE_SPOT_MARKET_INDEX } from "@drift-labs/sdk";

export const TransferModal = ({ subAccountId }: { subAccountId: number }) => {
  // Destructure driftClient from the context
  const { driftClient: client, isSubscribed } = useDriftClient(); 
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"deposit" | "withdraw">("deposit");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleTransfer = async () => {
    // Use the destructured client object
    if (!client || !isSubscribed) { 
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
      const amountBN = new BN(parseFloat(amount) * 10 ** 6); // Assume 6 decimals for USDC
      let txSig: string;

      if (type === "deposit") {
        // Call deposit on the client object
        txSig = await client.deposit(
          amountBN,
          QUOTE_SPOT_MARKET_INDEX, // Use imported constant for USDC market index
          publicKey,
          subAccountId
        );
        toast.success(`Deposited ${amount} USDC successfully`);
      } else { // Withdraw
        // Check active subaccount ID before withdrawing
        if (client.activeSubAccountId !== subAccountId) {
          toast.error(`Please ensure subaccount ${subAccountId} is selected as active before withdrawing.`);
          setIsLoading(false);
          return;
        }
        // Call withdraw on the client object (without subAccountId)
        txSig = await client.withdraw(
          amountBN,
          QUOTE_SPOT_MARKET_INDEX,
          publicKey
        );
        toast.success(`Withdrawn ${amount} USDC successfully`);
      }

      console.log(`${type} transaction: ${txSig}`);
      await client.connection.confirmTransaction(txSig, 'confirmed');
      setAmount("");
      setIsOpen(false); // Close modal on success
    } catch (error: any) {
      console.error(`${type} error:`, error);
      toast.error(`Failed to ${type}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Deposit / Withdraw</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "deposit" ? "Deposit" : "Withdraw"} USDC to/from Subaccount #{subAccountId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center space-x-2">
            <Button 
              variant={type === "deposit" ? "default" : "outline"} 
              onClick={() => setType("deposit")}
              disabled={isLoading}
            >
              Deposit
            </Button>
            <Button 
              variant={type === "withdraw" ? "default" : "outline"}
              onClick={() => setType("withdraw")}
              disabled={isLoading}
            >
              Withdraw
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount</Label>
            <Input
              id="transfer-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 100"
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleTransfer} disabled={isLoading || !amount} className="w-full">
            {isLoading ? "Processing..." : `Confirm ${type}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
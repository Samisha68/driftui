import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDriftClient } from "./DriftClientProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@drift-labs/sdk";

interface TransferModalProps {
  subAccountId: number;
  type: "deposit" | "withdraw";
  trigger: React.ReactNode;
}

export function TransferModal({ subAccountId, type, trigger }: TransferModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const driftClient = useDriftClient();
  const { publicKey } = useWallet();

  const handleTransfer = async () => {
    if (!driftClient || !publicKey || !amount) return;

    try {
      setIsLoading(true);
      const amountBN = new BN(parseFloat(amount) * 1e6); // Convert to lamports (6 decimals for USDC)

      if (type === "deposit") {
        const tx = await driftClient.deposit(
          amountBN,
          subAccountId,
          publicKey
        );
        const signature = await driftClient.sendTransaction(tx);
        toast.loading("Confirming deposit...");
        await driftClient.connection.confirmTransaction(signature);
        toast.success("Deposit successful!");
      } else {
        const tx = await driftClient.withdraw(
          amountBN,
          subAccountId,
          publicKey
        );
        const signature = await driftClient.sendTransaction(tx);
        toast.loading("Confirming withdrawal...");
        await driftClient.connection.confirmTransaction(signature);
        toast.success("Withdrawal successful!");
      }
    } catch (error) {
      console.error(`Error during ${type}:`, error);
      toast.error(`Failed to ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "deposit" ? "Deposit Funds" : "Withdraw Funds"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.000001"
            />
          </div>
          <Button 
            className="w-full"
            onClick={handleTransfer}
            disabled={!amount || isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              type === "deposit" ? "Deposit" : "Withdraw"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
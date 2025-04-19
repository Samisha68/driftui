import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDriftClient } from "./DriftClientProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { BN, OrderParams, MarketType, OrderType, PositionDirection, OrderTriggerCondition } from "@drift-labs/sdk";
import { Transaction } from "@solana/web3.js";

interface TradeModalProps {
  subAccountId: number;
  trigger: React.ReactNode;
}

export function TradeModal({ subAccountId, trigger }: TradeModalProps) {
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [isLoading, setIsLoading] = useState(false);
  const { driftClient } = useDriftClient();
  const { publicKey } = useWallet();

  const handleTrade = async () => {
    if (!driftClient || !publicKey || !amount) return;

    try {
      setIsLoading(true);
      const amountBN = new BN(parseFloat(amount) * 1e6); // Convert to lamports
      const priceBN = orderType === "limit" ? new BN(parseFloat(price) * 1e6) : new BN(0);

      const order: OrderParams = {
        marketIndex: 0, // SOL-PERP
        marketType: MarketType.PERP,
        direction: direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT,
        baseAssetAmount: amountBN,
        price: priceBN,
        orderType: orderType === "market" ? OrderType.MARKET : OrderType.LIMIT,
        userOrderId: Math.floor(Math.random() * 1000000),
        reduceOnly: false,
        postOnly: false,
        immediateOrCancel: false,
        triggerPrice: null,
        triggerCondition: OrderTriggerCondition.ABOVE,
        oraclePriceOffset: null,
        auctionDuration: null,
        auctionStartPrice: null,
        auctionEndPrice: null,
        maxTs: null,
      };

      const tx = await driftClient.placeOrders([order]);
      const signature = await driftClient.sendTransaction(tx as unknown as Transaction);
      toast.loading("Confirming order...");
      await driftClient.connection.confirmTransaction(signature.toString(), 'confirmed');
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
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
          <DialogTitle>Place Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="direction">Direction</Label>
            <Select
              value={direction}
              onValueChange={(value: "long" | "short") => setDirection(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-type">Order Type</Label>
            <Select
              value={orderType}
              onValueChange={(value: "market" | "limit") => setOrderType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
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

          {orderType === "limit" && (
            <div className="space-y-2">
              <Label htmlFor="price">Price (USDC)</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.000001"
              />
            </div>
          )}

          <Button 
            className="w-full"
            onClick={handleTrade}
            disabled={!amount || (orderType === "limit" && !price) || isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
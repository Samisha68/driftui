"use client";

import { useState } from "react";
import { useDriftClient } from "./DriftClientProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "react-hot-toast";

const MARKETS = [
  { value: "SOL-PERP", label: "SOL-PERP" },
  { value: "BTC-PERP", label: "BTC-PERP" },
  { value: "ETH-PERP", label: "ETH-PERP" },
];

export const PlaceOrderForm = () => {
  const { driftClient, isSubscribed } = useDriftClient();
  const [market, setMarket] = useState("SOL-PERP");
  const [orderType, setOrderType] = useState("market");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!driftClient || !isSubscribed) {
      toast.error("Not connected or subscribed to Drift protocol");
      return;
    }

    try {
      setIsLoading(true);
      const sizeNum = parseFloat(size);
      if (isNaN(sizeNum) || sizeNum <= 0) {
        toast.error("Please enter a valid size");
        setIsLoading(false);
        return;
      }

      if (orderType === "limit" && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
         toast.error("Please enter a valid positive limit price");
         setIsLoading(false); 
         return;
      }

      const orderParams = {
        marketIndex: MARKETS.findIndex(m => m.value === market),
        direction: sizeNum > 0 ? "long" : "short",
        size: Math.abs(sizeNum),
        orderType: orderType === "market" ? "market" : "limit",
        price: orderType === "limit" ? parseFloat(price) : undefined,
      };

      console.log("Attempting to place order with params:", orderParams);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      const tx = `simulated_tx_${Date.now()}`;

      toast.success(`Order placed successfully (Simulated)`);
      console.log("Order transaction (Simulated):", tx);
      setSize("");
      setPrice("");
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(`Failed to place order: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Place Order</h3>
      
      <div className="space-y-2">
        <Label>Market</Label>
        <Select value={market} onValueChange={setMarket}>
          <SelectTrigger>
            <SelectValue placeholder="Select market" />
          </SelectTrigger>
          <SelectContent>
            {MARKETS.map((market) => (
              <SelectItem key={market.value} value={market.value}>
                {market.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Order Type</Label>
        <RadioGroup value={orderType} onValueChange={setOrderType}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="market" id="market" />
            <Label htmlFor="market">Market</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="limit" id="limit" />
            <Label htmlFor="limit">Limit</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">Size</Label>
        <Input
          id="size"
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Enter size"
          className="w-full"
        />
      </div>

      {orderType === "limit" && (
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            className="w-full"
          />
        </div>
      )}

      <Button
        onClick={handlePlaceOrder}
        disabled={isLoading || !size || (orderType === "limit" && !price)}
        className="w-full"
      >
        {isLoading ? "Processing..." : "Place Order"}
      </Button>
    </div>
  );
}; 
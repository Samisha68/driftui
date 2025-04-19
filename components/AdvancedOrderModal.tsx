import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDriftClient } from "./DriftClientProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { BN, OrderParams, MarketType, OrderTriggerCondition, OrderType, PositionDirection, standardizePrice, PRICE_PRECISION, BASE_PRECISION } from "@drift-labs/sdk";
import { Transaction } from "@solana/web3.js";
import { motion } from "framer-motion";

interface AdvancedOrderModalProps {
  subAccountId: number;
  trigger: React.ReactNode;
  marketIndex?: number;
}

export function AdvancedOrderModal({ subAccountId, trigger, marketIndex = 0 }: AdvancedOrderModalProps) {
  const [direction, setDirection] = useState<PositionDirection>(PositionDirection.LONG);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  const [addTpSl, setAddTpSl] = useState(false);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const { driftClient } = useDriftClient();
  const { publicKey } = useWallet();

  const handlePlaceOrder = async () => {
    toast.loading("Placing order logic needs to be implemented.");
    console.log("Placing order with:", {
      direction,
      orderType,
      amount,
      price,
      addTpSl,
      tpPrice,
      slPrice,
      marketIndex,
      subAccountId
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Place Advanced Order (Subaccount {subAccountId})</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={direction === PositionDirection.LONG ? "long" : "short"}
                onValueChange={(value: "long" | "short") => setDirection(value === "long" ? PositionDirection.LONG : PositionDirection.SHORT)}
              >
                <SelectTrigger id="direction">
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
                value={orderType === OrderType.LIMIT ? "limit" : "market"}
                onValueChange={(value: "limit" | "market") => setOrderType(value === "limit" ? OrderType.LIMIT : OrderType.MARKET)}
              >
                <SelectTrigger id="order-type">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Base Asset)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
            />
          </div>

          {orderType === OrderType.LIMIT && (
            <div className="space-y-2">
              <Label htmlFor="price">Limit Price (Quote Asset)</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter limit price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="any"
              />
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-gray-700">
             <div className="flex items-center space-x-2">
               <Checkbox 
                 id="add-tp-sl" 
                 checked={addTpSl} 
                 onCheckedChange={(checked: boolean | 'indeterminate') => setAddTpSl(Boolean(checked))}
               />
               <Label htmlFor="add-tp-sl" className="cursor-pointer text-base font-medium">
                 Add Take Profit / Stop Loss
               </Label>
             </div>

             {addTpSl && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="space-y-4 overflow-hidden"
               >
                 <div className="space-y-2">
                   <Label htmlFor="tp-price">Take Profit Trigger Price</Label>
                   <Input
                     id="tp-price"
                     type="number"
                     placeholder="Enter TP price"
                     value={tpPrice}
                     onChange={(e) => setTpPrice(e.target.value)}
                     min="0"
                     step="any"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="sl-price">Stop Loss Trigger Price</Label>
                   <Input
                     id="sl-price"
                     type="number"
                     placeholder="Enter SL price"
                     value={slPrice}
                     onChange={(e) => setSlPrice(e.target.value)}
                     min="0"
                     step="any"
                   />
                 </div>
               </motion.div>
             )}
           </div>

          <Button 
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={
              isLoading || 
              !amount || 
              (orderType === OrderType.LIMIT && !price) ||
              (addTpSl && (!tpPrice || !slPrice))
            }
          >
            {isLoading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              "Place Order"
            )}
            {addTpSl && tpPrice && slPrice && " with TP/SL"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
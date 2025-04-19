"use client";

import { useState, useEffect } from "react";
import { useDriftClient } from "./DriftClientProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import {
  BN, OrderParams, MarketType, OrderType, PositionDirection, OrderTriggerCondition, 
  QUOTE_SPOT_MARKET_INDEX, getUserAccountPublicKey, UserAccount, DriftClient
} from "@drift-labs/sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiCheck, FiX, FiLoader, FiClock } from "react-icons/fi";
import { PublicKey } from "@solana/web3.js";

type TestStepStatus = "idle" | "running" | "succeeded" | "failed";

interface TestStatus {
  subaccountCreation: TestStepStatus;
  deposit: TestStepStatus;
  trade: TestStepStatus;
  withdraw: TestStepStatus;
}

const DEVNET_SOL_PERP_MARKET_INDEX = 0;

export function SubaccountTester() {
  const { driftClient, isLoading, isSubscribed, error } = useDriftClient();
  const { publicKey } = useWallet();
  const [isTesting, setIsTesting] = useState(false);
  const [currentSubaccountId, setCurrentSubaccountId] = useState<number | null>(null);
  const [testStatus, setTestStatus] = useState<TestStatus>({
    subaccountCreation: "idle",
    deposit: "idle",
    trade: "idle",
    withdraw: "idle",
  });

  useEffect(() => {
    if (!publicKey) {
      setTestStatus({
        subaccountCreation: "idle",
        deposit: "idle",
        trade: "idle",
        withdraw: "idle",
      });
      setCurrentSubaccountId(null);
    }
  }, [publicKey]);

  const runTest = async () => {
    setIsTesting(true);
    setTestStatus({
      subaccountCreation: "running",
      deposit: "idle",
      trade: "idle",
      withdraw: "idle",
    });
    setCurrentSubaccountId(null);

    if (isLoading || !driftClient || !isSubscribed || !publicKey) {
      const message = isLoading ? "Drift client is still loading..." : 
                      !isSubscribed ? "Drift client is not subscribed yet..." :
                      !publicKey ? "Wallet not connected" :
                      "Drift client not available";
      console.error("Test prerequisites not met:", { isLoading, isSubscribed, driftClient: !!driftClient, publicKey: !!publicKey });
      toast.error(`Test prerequisites not met: ${message}`);
      setTestStatus(prev => ({ ...prev, subaccountCreation: "failed" }));
      setIsTesting(false);
      return;
    }

    let newSubaccountId = -1;

    try {
      toast.loading("Creating subaccount...");
      const [txSigInit, newUserAccountPk] = await driftClient.initializeUserAccount();
      await driftClient.connection.confirmTransaction(txSigInit, 'confirmed');
      console.log(`Initialize transaction confirmed: ${txSigInit}, Target UserAccount PK: ${newUserAccountPk.toBase58()}`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log("Finding subaccount ID for the new public key...");
      let foundId = false;
      for (let i = 0; i < 10; i++) {
        const potentialPk = await getUserAccountPublicKey(
          driftClient.program.programId,
          publicKey,
          i
        );
        console.log(`Checking ID ${i}, generated PK: ${potentialPk.toBase58()}`);
        if (potentialPk.equals(newUserAccountPk)) {
          newSubaccountId = i;
          foundId = true;
          console.log(`Found matching subaccount ID: ${newSubaccountId}`);
          break;
        }
      }

      if (!foundId) {
        throw new Error(`Could not determine subaccount ID for PK ${newUserAccountPk.toBase58()} after checking IDs 0-9.`);
      }
      setCurrentSubaccountId(newSubaccountId);

      setTestStatus(prev => ({ ...prev, subaccountCreation: "succeeded", deposit: "running" }));
      toast.success(`Subaccount ${newSubaccountId} created successfully!`);
      
      console.log(`Setting active subaccount ID to ${newSubaccountId}`);
      (driftClient as any).activeSubAccountId = newSubaccountId;

      toast.loading("Depositing test funds...");
      const depositAmount = new BN(10 * 10 ** 6);
      const depositTxSig = await driftClient.deposit(
        depositAmount, 
        QUOTE_SPOT_MARKET_INDEX,
        publicKey
      );
      await driftClient.connection.confirmTransaction(depositTxSig, 'confirmed');
      console.log(`Deposit transaction confirmed: ${depositTxSig}`);
      setTestStatus(prev => ({ ...prev, deposit: "succeeded", trade: "running" }));
      toast.success(`Deposited 10 USDC successfully!`);

      toast.loading("Placing test trade...");
      const orderParams: OrderParams = {
        orderType: OrderType.MARKET,
        marketType: MarketType.PERP,
        marketIndex: DEVNET_SOL_PERP_MARKET_INDEX,
        direction: PositionDirection.LONG,
        baseAssetAmount: new BN(0.01 * 10 ** 9),
        price: new BN(0),
        userOrderId: 1,
        reduceOnly: false,
        postOnly: false,
        immediateOrCancel: false,
        triggerPrice: new BN(0),
        triggerCondition: OrderTriggerCondition.ABOVE,
        oraclePriceOffset: 0,
        auctionDuration: 0,
        maxTs: new BN(0),
        auctionStartPrice: new BN(0),
        auctionEndPrice: new BN(0),
      };
      const tradeTxSig = await driftClient.placeOrders([orderParams]);
      await driftClient.connection.confirmTransaction(tradeTxSig, 'confirmed');
      console.log(`Trade transaction confirmed: ${tradeTxSig}`);
      setTestStatus(prev => ({ ...prev, trade: "succeeded", withdraw: "running" }));
      toast.success(`Placed SOL-PERP order successfully!`);

      toast.loading("Withdrawing funds...");
      const withdrawAmount = new BN(5 * 10 ** 6);
      const withdrawTxSig = await driftClient.withdraw(
        withdrawAmount, 
        QUOTE_SPOT_MARKET_INDEX,
        publicKey
      );
      await driftClient.connection.confirmTransaction(withdrawTxSig, 'confirmed');
      console.log(`Withdraw transaction confirmed: ${withdrawTxSig}`);
      setTestStatus(prev => ({ ...prev, withdraw: "succeeded" }));
      toast.success(`Withdrew 5 USDC successfully!`);

      toast.success("All tests completed successfully!");
    } catch (e: any) {
      console.error("Test failed:", e);
      const errorMessage = e.message || "An unknown error occurred";
      toast.error(`Test failed: ${errorMessage}`);
      setTestStatus(prev => {
        let newStatus = { ...prev };
        if (newStatus.subaccountCreation === "running") newStatus.subaccountCreation = "failed";
        else if (newStatus.deposit === "running") newStatus.deposit = "failed";
        else if (newStatus.trade === "running") newStatus.trade = "failed";
        else if (newStatus.withdraw === "running") newStatus.withdraw = "failed";
        return newStatus;
      });
    } finally {
      setIsTesting(false);
      if (driftClient && currentSubaccountId !== 0 && currentSubaccountId !== null) {
        try {
          console.log("Setting active subaccount ID back to 0");
          (driftClient as any).activeSubAccountId = 0;
        } catch (switchError) {
          console.error("Failed to set active subaccount ID back to 0:", switchError);
        }
      }
    }
  };

  const getStatusIcon = (status: TestStepStatus) => {
    switch (status) {
      case "running":
        return <FiLoader className="animate-spin text-blue-500" />;
      case "succeeded":
        return <FiCheck className="text-green-500" />;
      case "failed":
        return <FiX className="text-red-500" />;
      case "idle":
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subaccount Test Suite</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <div className="flex items-center space-x-2">
              {getStatusIcon(testStatus.subaccountCreation)}
              <span>Create Subaccount</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(testStatus.deposit)}
              <span>Deposit Funds</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(testStatus.trade)}
              <span>Place Trade</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(testStatus.withdraw)}
              <span>Withdraw Funds</span>
            </div>
          </div>
          <Button
            onClick={runTest}
            disabled={isTesting || isLoading || !isSubscribed}
            className="w-full mt-4"
          >
            {isTesting ? (
               <><FiLoader className="animate-spin mr-2" /> Testing...</>
            ) : (
               "Run Subaccount Test"
            )}
          </Button>
        </div>
        {error && <p className="mt-4 text-sm text-red-500 text-center">Provider Error: {error}</p>}
      </CardContent>
    </Card>
  );
} 
"use client";

import { useState } from "react";
import { useDriftClient } from "./DriftClientProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { FaWallet } from "react-icons/fa";

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin h-5 w-5 text-white ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    ></path>
  </svg>
);

export const WalletViewer = () => {
  const { driftClient } = useDriftClient();
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  const handleViewWallet = async () => {
    if (!driftClient) {
      toast.error("Drift client not initialized");
      return;
    }

    try {
      setIsLoading(true);
      const pubkey = new PublicKey(walletAddress);
      const userAccounts = await driftClient.getUserAccountsForAuthority(pubkey);
      setWalletData(userAccounts?.[0] || null);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to fetch wallet data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto shadow-lg rounded-lg border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center">
          <FaWallet className="mr-2" />
          <h3 className="text-lg font-semibold">View Wallet Data</h3>
        </div>
        <p className="text-sm mt-1">Enter a wallet address to view its data.</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="wallet">Wallet Address</Label>
          <Input
            id="wallet"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          onClick={handleViewWallet}
          disabled={isLoading || !walletAddress}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isLoading ? <Spinner className="mr-2" /> : "View Wallet Data"}
        </Button>

        {walletData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Wallet Data</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(walletData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-100 p-4 rounded-b-lg">
        <p className="text-xs text-gray-500">Powered by Drift Protocol</p>
      </CardFooter>
    </Card>
  );
}; 
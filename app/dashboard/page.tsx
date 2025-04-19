"use client";

import { Navigation } from "@/components/Navigation";
import { SubaccountList } from "@/components/SubaccountList";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FiCreditCard, FiArrowDown, FiActivity, FiTrendingUp, FiBarChart2, FiRefreshCw } from "react-icons/fi";
import Particles from "@/components/Particles";
import { SubaccountTester } from "@/components/SubaccountTester";
import { WalletViewer } from "@/components/WalletViewer";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { useDriftStore, SubAccountData, TokenBalance, PerpPosition, OpenOrder } from "@/store/useDriftStore";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useWallet } from "@solana/wallet-adapter-react";
import Overview from '@/components/Overview';

// Define variants outside the component so they are accessible to SubaccountDisplay
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Define 'safeNumber' function
const safeNumber = (value: number | undefined, defaultValue: number = 0): number => value !== undefined ? value : defaultValue;

export default function Dashboard() {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { 
    connectedWalletData, 
    selectedSubAccountId, 
    selectSubAccount,
    isClientLoading,
    clientError,
    isUserDataLoading,
    userDataError,
    userAccounts,
    viewedWalletData,
    isViewerLoading,
    viewerError,
    fetchDataForWallet,
    setWalletConnected,
    setWalletDisconnected
  } = useDriftStore();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isClient, setIsClient] = useState(false);
  const [viewWalletAddress, setViewWalletAddress] = useState("");
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey && signTransaction && signAllTransactions) {
      setWalletConnected({ publicKey, signTransaction, signAllTransactions });
    } else {
      setWalletDisconnected();
    }
  }, [connected, publicKey, signTransaction, signAllTransactions, setWalletConnected, setWalletDisconnected]);
  
  const handleFetchWallet = () => {
    if (viewWalletAddress) {
      fetchDataForWallet(viewWalletAddress);
    }
  };
  
  // Get the currently selected subaccount data from the store
  const currentSubAccount = connectedWalletData?.subAccounts.find(
    (sub: SubAccountData) => sub.id === selectedSubAccountId 
  );
  
  const tabVariants = {
    inactive: { 
      opacity: 0.7,
      y: 0
    },
    active: { 
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };
  
  const underlineVariants = {
    inactive: { 
      width: 0, 
      opacity: 0 
    },
    active: { 
      width: "100%", 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      <Particles />
      
      <div className="fixed inset-0 z-[-1] opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500 blur-[60px] animate-pulse" 
             style={{ animationDuration: '12s' }}/>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500 blur-[60px] animate-pulse"
             style={{ animationDuration: '18s' }}/>
      </div>
      
      <Navigation />
      
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-4 mb-8">
            <button
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "overview"
                  ? "bg-primary text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "viewer"
                  ? "bg-primary text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("viewer")}
            >
              Wallet Viewer
            </button>
          </div>

          {connected && connectedWalletData && connectedWalletData.subAccounts.length > 1 && (
            <div className="mb-6 max-w-xs">
              <Label htmlFor="subaccount-select">Select Subaccount</Label>
              <Select
                  value={selectedSubAccountId.toString()}
                  onValueChange={(value) => selectSubAccount(parseInt(value, 10))}
              >
                <SelectTrigger id="subaccount-select">
                  <SelectValue placeholder="Select subaccount" />
                </SelectTrigger>
                <SelectContent>
                  {connectedWalletData.subAccounts.map(sub => (
                    <SelectItem key={sub.id} value={sub.id.toString()}>
                      {sub.id} - {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Overview />
                
                {connected && currentSubAccount && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="relative mt-8"
                  >
                    <SubaccountDisplay data={currentSubAccount} /> 
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "viewer" && (
              <motion.div
                key="viewer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-4 p-4 border rounded-lg glass-effect">
                  <h3 className="text-lg font-semibold gradient-text">View Arbitrary Wallet Data</h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-grow space-y-2">
                      <Label htmlFor="wallet-address-input">Wallet Address</Label>
                      <Input
                        id="wallet-address-input"
                        value={viewWalletAddress}
                        onChange={(e) => setViewWalletAddress(e.target.value)}
                        placeholder="Enter wallet address (e.g., arbitraryWalletXYZ)"
                        className="w-full"
                      />
                    </div>
                    <Button onClick={handleFetchWallet} disabled={isViewerLoading || !viewWalletAddress}>
                      {isViewerLoading ? "Loading..." : "Fetch Data"}
                    </Button>
                  </div>
                  {viewerError && <p className="text-red-500">Error: {viewerError}</p>}
                  {viewedWalletData && (
                    <div className="mt-4 p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                      <h4 className="font-medium mb-2">Data for: {viewedWalletData.address}</h4>
                      {viewedWalletData.subAccounts.map(sub => (
                        <SubaccountDisplay key={sub.id} data={sub} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SubaccountDisplay({ data }: { data: SubAccountData }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="mb-8 p-6 rounded-xl shadow-lg glass-effect glow-effect-sm"
    >
      <h3 className="text-xl font-semibold mb-4 gradient-text">Subaccount {data.id}: {data.name}</h3>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-300 border-b border-gray-700 pb-1 mb-2">Balances</h4>
          {data.balances.length > 0 ? (
            data.balances.map((bal: TokenBalance) => (
              <div key={bal.symbol} className="flex justify-between text-sm">
                <span>{bal.symbol}:</span>
                <span className="font-mono">{bal.amount.toFixed(2)}</span>
              </div>
            ))
          ) : <p className="text-sm text-gray-500 italic">No balances</p>}
          <MockDepositWithdrawForm subAccountId={data.id} /> 
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-300 border-b border-gray-700 pb-1 mb-2">Perp Positions</h4>
          {data.positions.length > 0 ? (
            data.positions.map((pos: PerpPosition, i: number) => (
              <div key={i} className="text-sm p-2 bg-gray-800 rounded">
                <span className={`${pos.direction === 'Long' ? 'text-green-400' : 'text-red-400'}`}>{pos.direction}</span> {pos.market}
                <div>Size: {pos.size} @ ${pos.entryPrice.toFixed(2)}</div>
                {pos.pnl !== undefined && 
                  <div className={`${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>PnL: ${pos.pnl.toFixed(2)}</div>}
              </div>
            ))
          ) : <p className="text-sm text-gray-500 italic">No open positions</p>}
          <MockOrderForm subAccountId={data.id} />
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-300 border-b border-gray-700 pb-1 mb-2">Open Orders</h4>
          {data.orders.length > 0 ? (
            data.orders.map((order: OpenOrder, i: number) => (
              <div key={i} className="text-sm p-2 bg-gray-800 rounded">
                {order.type} <span className={`${order.direction === 'Long' ? 'text-green-400' : 'text-red-400'}`}>{order.direction}</span> {order.market}
                <div>Size: {order.size} {order.price ? `@ $${order.price}` : 'Market'} {order.triggerPrice ? `(Trigger: ${order.triggerPrice})` : ''}</div>
                <div>Status: {order.status}</div>
              </div>
            ))
          ) : <p className="text-sm text-gray-500 italic">No open orders</p>}
        </div>
      </div>
    </motion.div>
  );
}

function MockDepositWithdrawForm({ subAccountId }: { subAccountId: number }) {
  const [amount, setAmount] = useState("");
  const [symbol, setSymbol] = useState("USDC");
  const { mockDeposit, mockWithdraw } = useDriftStore();
  
  const handleDeposit = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      mockDeposit(numAmount, symbol);
      setAmount("");
    }
  };
  
  const handleWithdraw = () => {
     const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      mockWithdraw(numAmount, symbol);
      setAmount("");
    }
  };
  
  return (
    <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
      <Label className="text-xs text-gray-400">Simulate Deposit/Withdraw</Label>
      <div className="flex gap-2">
         <Input 
           type="number" 
           placeholder="Amount" 
           value={amount} 
           onChange={e => setAmount(e.target.value)} 
           className="flex-grow"
           min="0"
         />
         <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="SOL">SOL</SelectItem>
            </SelectContent>
          </Select>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleDeposit} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">Deposit</Button>
        <Button onClick={handleWithdraw} size="sm" className="flex-1" variant="destructive">Withdraw</Button>
      </div>
    </div>
  );
}

function MockOrderForm({ subAccountId }: { subAccountId: number }) {
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [type, setType] = useState<'Market' | 'Limit'>('Market');
  const [market, setMarket] = useState('SOL-PERP');
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const { placeMockOrder } = useDriftStore();

  const handleSubmit = () => {
    const numSize = parseFloat(size);
    const numPrice = parseFloat(price);
    if (!isNaN(numSize) && numSize > 0) {
      placeMockOrder({
        market,
        direction,
        type,
        size: numSize,
        price: safeNumber(numPrice),
        triggerPrice: 0,
        marketIndex: 0,
        marketType: 'PERP',
      });
      setSize("");
      setPrice("");
    }
  };
  
  return (
     <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
       <Label className="text-xs text-gray-400">Simulate Perp Order</Label>
       <div className="flex flex-col gap-3"> 
          <Select value={market} onValueChange={setMarket}>
            <SelectTrigger><SelectValue placeholder="Market" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SOL-PERP">SOL-PERP</SelectItem>
              <SelectItem value="BTC-PERP">BTC-PERP</SelectItem>
              <SelectItem value="ETH-PERP">ETH-PERP</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-3"> 
            <Select value={direction} onValueChange={(value: 'Long' | 'Short') => setDirection(value)}>
              <SelectTrigger><SelectValue placeholder="Side" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Long">Long</SelectItem>
                <SelectItem value="Short">Short</SelectItem>
              </SelectContent>
            </Select>
             <Select value={type} onValueChange={(value: 'Market' | 'Limit') => setType(value)}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Market">Market</SelectItem>
                <SelectItem value="Limit">Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <Input type="number" placeholder="Size" value={size} onChange={e => setSize(e.target.value)} min="0" />
           {type === 'Limit' && (
             <Input type="number" placeholder="Limit Price" value={price} onChange={e => setPrice(e.target.value)} min="0" />
           )}
       </div>
       <Button onClick={handleSubmit} size="sm" className="w-full">Place Mock Order</Button>
     </div>
  );
} 
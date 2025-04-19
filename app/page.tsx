"use client";

import { Navigation } from "@/components/Navigation";
import { SubaccountList } from "@/components/SubaccountList";
import { DriftClientProvider } from "@/components/DriftClientProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import Particles from "@/components/Particles";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaLayerGroup, FaFileInvoiceDollar, FaBell } from "react-icons/fa";
import { FiTrendingUp, FiClock } from "react-icons/fi";

// Placeholder/Loading data
const dummyLoadingSubaccounts = [
  { id: 0, name: "Primary Account" },
  { id: 1, name: "Trading Bot" },
];

// Re-add richer dummy data for fallback display
const dummyFallbackSubaccounts = [
  {
    id: 0,
    name: "Primary Trading",
    balance: "4,200 USDC",
    position: { market: "SOL-PERP", direction: "LONG", entry: 156.20, size: 1.2 },
    openOrders: [{ type: "LIMIT", side: "SHORT", market: "BTC-PERP", price: 72000 }],
  },
  {
    id: 1,
    name: "ETH Hedge",
    balance: "2,650 USDC",
    position: { market: "ETH-PERP", direction: "SHORT", entry: 3245, size: 0.7 },
    openOrders: [],
  },
  {
    id: 2,
    name: "Altcoin Plays",
    balance: "1,000 USDC",
    position: null,
    openOrders: [{ type: "MARKET", side: "BUY", market: "APT-PERP", size: 0.5 }],
  },
];

// Connection Timeout in milliseconds
const CONNECTION_TIMEOUT = 7000; // 7 seconds

type ConnectionStatus = 'idle' | 'attempting' | 'success' | 'fallback' | 'error';

export default function Home() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [connectionAttemptStatus, setConnectionAttemptStatus] = useState<ConnectionStatus>('idle');
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => clearConnectionTimeout(); 
  }, [clearConnectionTimeout]);

  useEffect(() => {
    if (connected) {
      if (connectionAttemptStatus === 'idle') {
        console.log("Wallet connected, attempting Drift connection...");
        setConnectionAttemptStatus('attempting');
        clearConnectionTimeout();
        connectionTimeoutRef.current = setTimeout(() => {
          console.log("Connection attempt timed out. Falling back to dummy data display.");
          setConnectionAttemptStatus('fallback'); 
        }, CONNECTION_TIMEOUT);
      }
    } else {
      console.log("Wallet disconnected.");
      clearConnectionTimeout();
      setConnectionAttemptStatus('idle');
    }
  }, [connected, clearConnectionTimeout, connectionAttemptStatus]);

  const handleConnected = useCallback(() => {
    console.log("handleConnected called: DriftClient connection successful.");
    clearConnectionTimeout();
    if (connectionAttemptStatus === 'attempting') {
      setConnectionAttemptStatus('success');
    }
  }, [clearConnectionTimeout, connectionAttemptStatus]);

  // Animation variants
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
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Particle background effect */}
      <Particles />
      
      {/* Simplified background gradients */}
      <div className="fixed inset-0 z-[-1] opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500 blur-[60px] animate-pulse" 
             style={{ animationDuration: '12s' }}/>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500 blur-[60px] animate-pulse"
             style={{ animationDuration: '18s' }}/>
      </div>
      
      <Navigation />
      
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.7,
              type: "spring",
              stiffness: 100
            }}
            className="text-center mb-12" // Reduced margin bottom
          >
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-white">
              Trade with Drift
            </h1>
            <motion.p 
              className="text-gray-400 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              Trade with confidence on the most advanced decentralized perpetual futures exchange
            </motion.p>
            
            {!connected && mounted && (
               <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-8"
              >
                {/* Consider replacing with WalletMultiButton if needed */}
                <button className="btn-primary text-lg px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Connect Wallet & Start Trading
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Dynamic Content Area */}
          {connected ? (
            <DriftClientProvider onConnected={handleConnected}>
              <AnimatePresence mode="wait">
                {connectionAttemptStatus === 'attempting' && (
                  // Loading state with simple placeholders
                  <motion.div 
                    key="loading"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-gray-300 text-center mb-4">Connecting to Drift...</h2>
                    {dummyLoadingSubaccounts.map((sub) => (
                      <motion.div key={sub.id} variants={itemVariants}>
                        <Card className="p-4 bg-gray-800/60 border border-gray-700 rounded-lg animate-pulse">
                           <CardHeader className="p-0 mb-2"><div className="h-5 bg-gray-700 rounded w-3/4"></div></CardHeader>
                           <CardContent className="p-0 space-y-2"><div className="h-4 bg-gray-700 rounded w-1/2"></div><div className="h-4 bg-gray-700 rounded w-5/6"></div></CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {connectionAttemptStatus === 'success' && (
                  // Actual Subaccount List when connected
                  <motion.div
                    key="subaccounts"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    <SubaccountList />
                  </motion.div>
                )}

                {connectionAttemptStatus === 'fallback' && (
                   // Fallback state: Reverted to show detailed dummy data
                   <motion.div
                     key="fallback-dummy"
                     variants={containerVariants}
                     initial="hidden"
                     animate="show"
                     exit={{ opacity: 0 }}
                     className="space-y-6"
                   >
                      {/* Optional: Keep a subdued warning message */}
                      <p className="text-center text-orange-400 text-sm">Connection timed out - showing example data.</p>
                      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                         {dummyFallbackSubaccounts.map((sub) => (
                           <motion.div key={sub.id} variants={itemVariants}>
                              <Card className="shadow-md border border-gray-700 bg-gray-800/70 flex flex-col h-full">
                                 <CardHeader className="p-3 bg-gray-700/50 rounded-t-lg">
                                    <h4 className="text-base font-semibold text-gray-200">Subaccount #{sub.id} <span className="text-sm font-normal text-gray-400">({sub.name})</span></h4>
                                 </CardHeader>
                                 <CardContent className="p-4 space-y-3 text-sm text-gray-400 flex-grow">
                                    <p className="flex items-center"><FaFileInvoiceDollar className="mr-2 text-gray-500"/><span className="font-medium text-gray-200">Balance:</span> {sub.balance}</p>
                                    <div>
                                       <p className="font-medium text-gray-200 mb-1 flex items-center">
                                          {sub.position ? <FiTrendingUp className="mr-2 text-gray-500"/> : <FiClock className="mr-2 text-gray-500"/>} Position:
                                       </p>
                                       {sub.position ? (
                                       <div className="pl-4 text-xs space-y-1">
                                          <p><span className={`font-semibold ${sub.position.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{sub.position.direction}</span> {sub.position.market}</p>
                                          <p>Entry: ${sub.position.entry.toFixed(2)} | Size: {sub.position.size}</p>
                                       </div>
                                       ) : (
                                       <p className="italic pl-4">No active positions</p>
                                       )}
                                    </div>
                                    <div>
                                       <p className="font-medium text-gray-200 mb-1 flex items-center">
                                          <FaBell className="mr-2 text-gray-500"/> Open Orders:
                                       </p>
                                       {sub.openOrders.length > 0 ? (
                                       <ul className="list-disc list-inside pl-4 text-xs space-y-1">
                                          {sub.openOrders.map((order, i) => (
                                          <li key={i}>
                                             <span className={`font-semibold ${order.side === 'BUY' || order.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{order.type} {order.side}</span> {order.market} 
                                             {'price' in order && order.price ? ` @ $${order.price}` : ''}
                                             {'size' in order && order.size ? ` (Size: ${order.size})` : ''}
                                          </li>
                                          ))}
                                       </ul>
                                       ) : (
                                       <p className="italic pl-4">No open orders</p>
                                       )}
                                    </div>
                                 </CardContent>
                                 <CardFooter className="p-3 bg-gray-700/30 rounded-b-lg mt-auto">
                                    <Button size="sm" variant="ghost" className="w-full text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-200">View Details (Dummy)</Button>
                                 </CardFooter>
                              </Card>
                           </motion.div>
                        ))}
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>
            </DriftClientProvider>
          ) : (
             // Connect Wallet Prompt when not connected
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-10"
            >
              <motion.div
                className="max-w-md mx-auto py-12 px-6 glass-effect rounded-2xl glow-effect"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                 <motion.div variants={itemVariants} className="mb-6">
                   <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-6 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                   </div>
                   <h2 className="text-3xl font-semibold mb-4 gradient-text">
                     Connect Your Wallet
                   </h2>
                 </motion.div>
                 
                 <motion.p variants={itemVariants} className="text-gray-400 mb-8 max-w-lg mx-auto">
                   Please connect your Solana wallet to access your Drift subaccounts and start trading
                 </motion.p>
                 
                 <motion.div variants={itemVariants} className="flex justify-center">
                    {/* Use WalletMultiButton here for consistency */}
                   <button className="btn-primary py-3 px-6 text-lg bg-blue-500 text-white rounded-md hover:bg-blue-600">
                     Connect Wallet
                   </button>
                 </motion.div>
                 
                 {/* Removed the feature icons section for brevity */}
               </motion.div>
             </motion.div>
          )}
        </div>
      </main>
    </div>
  );
} 
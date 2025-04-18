"use client";

import { Navigation } from "@/components/Navigation";
import { SubaccountList } from "@/components/SubaccountList";
import { DriftClientProvider } from "@/components/DriftClientProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FiCreditCard, FiArrowDown, FiActivity, FiTrendingUp, FiBarChart2, FiRefreshCw } from "react-icons/fi";
import Particles from "@/components/Particles";

export default function Dashboard() {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
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
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Particle background effect */}
      <Particles />
      
      {/* Animated background gradients */}
      <div className="fixed inset-0 z-[-1] opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary blur-[80px] animate-pulse" 
             style={{ animationDuration: '10s' }}/>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary blur-[80px] animate-pulse"
             style={{ animationDuration: '15s' }}/>
      </div>
      
      <Navigation />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-gray-400 mt-1">Manage your Drift trading subaccounts</p>
              </div>
              
              <div className="flex space-x-2">
                <motion.button 
                  className="btn-primary text-sm py-2 px-3 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiCreditCard className="text-lg" />
                  <span>Deposit</span>
                </motion.button>
                <motion.button 
                  className="btn-secondary text-sm py-2 px-3 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiArrowDown className="text-lg" />
                  <span>Withdraw</span>
                </motion.button>
                <motion.button 
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={refreshData}
                >
                  <FiRefreshCw className={`text-lg ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>
            
            {/* Dashboard Tabs */}
            <div className="mt-8 border-b border-gray-800">
              <div className="flex space-x-8">
                <motion.button
                  variants={tabVariants}
                  initial="inactive"
                  animate={activeTab === "overview" ? "active" : "inactive"}
                  className="relative pb-2 text-lg font-medium"
                  onClick={() => setActiveTab("overview")}
                >
                  <div className="flex items-center">
                    <FiActivity className="mr-2" />
                    Overview
                  </div>
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
                    variants={underlineVariants}
                  />
                </motion.button>
                
                <motion.button
                  variants={tabVariants}
                  initial="inactive"
                  animate={activeTab === "positions" ? "active" : "inactive"}
                  className="relative pb-2 text-lg font-medium text-gray-400"
                  onClick={() => setActiveTab("positions")}
                >
                  <div className="flex items-center">
                    <FiTrendingUp className="mr-2" />
                    Positions
                  </div>
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
                    variants={underlineVariants}
                  />
                </motion.button>
                
                <motion.button
                  variants={tabVariants}
                  initial="inactive"
                  animate={activeTab === "analysis" ? "active" : "inactive"}
                  className="relative pb-2 text-lg font-medium text-gray-400"
                  onClick={() => setActiveTab("analysis")}
                >
                  <div className="flex items-center">
                    <FiBarChart2 className="mr-2" />
                    Analysis
                  </div>
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
                    variants={underlineVariants}
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {connected ? (
                  <DriftClientProvider>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      <SubaccountList />
                    </motion.div>
                  </DriftClientProvider>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="text-center py-20 bg-gray-900/50 rounded-lg glow-effect"
                  >
                    <motion.div variants={itemVariants} className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-full gradient-border mx-auto p-1 mb-6">
                        <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-2xl font-semibold mb-4">
                        Connect Your Wallet
                      </h2>
                      <p className="text-gray-400 mb-8">
                        Please connect your Solana wallet to access your dashboard and Drift subaccounts
                      </p>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary px-6 py-3"
                      >
                        Connect Wallet
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {activeTab === "positions" && (
              <motion.div
                key="positions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center items-center min-h-[300px]"
              >
                <Card className="glass-effect max-w-md w-full">
                  <CardContent className="p-8 text-center">
                    <div className="mb-4 opacity-60">
                      <FiTrendingUp className="text-6xl mx-auto" />
                    </div>
                    <h2 className="text-xl mb-2">Positions View</h2>
                    <p className="text-gray-400">Position data will be available soon</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {activeTab === "analysis" && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center items-center min-h-[300px]"
              >
                <Card className="glass-effect max-w-md w-full">
                  <CardContent className="p-8 text-center">
                    <div className="mb-4 opacity-60">
                      <FiBarChart2 className="text-6xl mx-auto" />
                    </div>
                    <h2 className="text-xl mb-2">Analysis</h2>
                    <p className="text-gray-400">Trading analysis will be available soon</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
} 
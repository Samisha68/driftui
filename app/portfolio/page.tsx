"use client";

import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <motion.h1 
          className="text-4xl font-bold mb-10 gradient-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Portfolio
        </motion.h1>
        
        <div className="grid grid-cols-1 gap-8">
          {/* Positions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="gradient-border"
          >
            <Card className="glass-effect border-none">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Market</th>
                        <th className="text-left py-3 px-4">Size</th>
                        <th className="text-left py-3 px-4">Entry Price</th>
                        <th className="text-left py-3 px-4">Mark Price</th>
                        <th className="text-left py-3 px-4">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4">SOL-PERP</td>
                        <td className="py-3 px-4">+2.5</td>
                        <td className="py-3 px-4">$135.67</td>
                        <td className="py-3 px-4">$138.90</td>
                        <td className="py-3 px-4 text-green-400">+$8.08</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4">ETH-PERP</td>
                        <td className="py-3 px-4">-0.15</td>
                        <td className="py-3 px-4">$3,490.25</td>
                        <td className="py-3 px-4">$3,456.78</td>
                        <td className="py-3 px-4 text-green-400">+$5.02</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Orders Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="gradient-border"
          >
            <Card className="glass-effect border-none">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Open Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Market</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Side</th>
                        <th className="text-left py-3 px-4">Size</th>
                        <th className="text-left py-3 px-4">Price</th>
                        <th className="text-left py-3 px-4">Filled</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4">BTC-PERP</td>
                        <td className="py-3 px-4">Limit</td>
                        <td className="py-3 px-4 text-green-400">Buy</td>
                        <td className="py-3 px-4">0.05</td>
                        <td className="py-3 px-4">$67,200.00</td>
                        <td className="py-3 px-4">0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* History Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="gradient-border"
          >
            <Card className="glass-effect border-none">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Time</th>
                        <th className="text-left py-3 px-4">Market</th>
                        <th className="text-left py-3 px-4">Side</th>
                        <th className="text-left py-3 px-4">Size</th>
                        <th className="text-left py-3 px-4">Price</th>
                        <th className="text-left py-3 px-4">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4">2023-06-20 14:30</td>
                        <td className="py-3 px-4">SOL-PERP</td>
                        <td className="py-3 px-4 text-green-400">Buy</td>
                        <td className="py-3 px-4">2.5</td>
                        <td className="py-3 px-4">$135.67</td>
                        <td className="py-3 px-4">$0.34</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4">2023-06-19 11:45</td>
                        <td className="py-3 px-4">ETH-PERP</td>
                        <td className="py-3 px-4 text-red-400">Sell</td>
                        <td className="py-3 px-4">0.15</td>
                        <td className="py-3 px-4">$3,490.25</td>
                        <td className="py-3 px-4">$0.52</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 
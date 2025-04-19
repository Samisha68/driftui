"use client";

import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Particles from "@/components/Particles";

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <Particles />
      
      <div className="fixed inset-0 z-[-1] opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500 blur-[60px] animate-pulse" 
             style={{ animationDuration: '15s' }}/>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-teal-500 blur-[60px] animate-pulse"
             style={{ animationDuration: '20s' }}/>
      </div>

      <div className="relative z-10">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <motion.h1 
            className="text-4xl font-bold mb-10 gradient-text"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Markets
          </motion.h1>
          
          <div className="grid grid-cols-1 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="gradient-border"
            >
              <Card className="glass-effect border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Perpetual Markets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4">Market</th>
                          <th className="text-left py-3 px-4">Price</th>
                          <th className="text-left py-3 px-4">24h Change</th>
                          <th className="text-left py-3 px-4">24h Volume</th>
                          <th className="text-left py-3 px-4">Open Interest</th>
                          <th className="text-left py-3 px-4">Funding Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                          <td className="py-3 px-4">BTC-PERP</td>
                          <td className="py-3 px-4">$68,241.50</td>
                          <td className="py-3 px-4 text-green-400">+1.23%</td>
                          <td className="py-3 px-4">$1.2B</td>
                          <td className="py-3 px-4">$320M</td>
                          <td className="py-3 px-4">0.002%</td>
                        </tr>
                         <tr className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                           <td className="py-3 px-4">ETH-PERP</td>
                           <td className="py-3 px-4">$3,456.78</td>
                           <td className="py-3 px-4 text-red-400">-0.54%</td>
                           <td className="py-3 px-4">$765M</td>
                           <td className="py-3 px-4">$185M</td>
                           <td className="py-3 px-4">0.001%</td>
                         </tr>
                         <tr className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                           <td className="py-3 px-4">SOL-PERP</td>
                           <td className="py-3 px-4">$138.90</td>
                           <td className="py-3 px-4 text-green-400">+3.45%</td>
                           <td className="py-3 px-4">$350M</td>
                           <td className="py-3 px-4">$95M</td>
                           <td className="py-3 px-4">0.005%</td>
                         </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="gradient-border"
            >
               <Card className="glass-effect border-none">
                 <CardHeader>
                   <CardTitle className="text-xl font-semibold">Spot Markets</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead>
                         <tr className="border-b border-gray-700">
                           <th className="text-left py-3 px-4">Market</th>
                           <th className="text-left py-3 px-4">Price</th>
                           <th className="text-left py-3 px-4">24h Change</th>
                           <th className="text-left py-3 px-4">24h Volume</th>
                           <th className="text-left py-3 px-4">Market Cap</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                           <td className="py-3 px-4">BTC/USDC</td>
                           <td className="py-3 px-4">$68,235.75</td>
                           <td className="py-3 px-4 text-green-400">+1.20%</td>
                           <td className="py-3 px-4">$980M</td>
                           <td className="py-3 px-4">$1.32T</td>
                         </tr>
                         <tr className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                           <td className="py-3 px-4">ETH/USDC</td>
                           <td className="py-3 px-4">$3,452.10</td>
                           <td className="py-3 px-4 text-red-400">-0.58%</td>
                           <td className="py-3 px-4">$542M</td>
                           <td className="py-3 px-4">$416B</td>
                         </tr>
                         <tr className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                           <td className="py-3 px-4">SOL/USDC</td>
                           <td className="py-3 px-4">$139.05</td>
                           <td className="py-3 px-4 text-green-400">+3.50%</td>
                           <td className="py-3 px-4">$220M</td>
                           <td className="py-3 px-4">$59B</td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
} 
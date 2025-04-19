"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
// import { Badge } from "@/components/ui/badge";
import { FaWallet, FaLayerGroup, FaBell, FaNetworkWired, FaExchangeAlt, FaFileInvoiceDollar } from "react-icons/fa";
import { FiTrendingUp, FiTrendingDown, FiClock } from "react-icons/fi";

const dummyWallet = {
  address: "7gWk...Xd9E",
  balance: "$12,834.56",
  network: "Mainnet-Beta",
  transactions: 6,
};

const dummySubaccounts = [
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

const notifications = [
  "Your limit order on BTC-PERP has been placed.",
  "Order filled: LONG 1.2 SOL-PERP @ $156.20.",
  "Subaccount 2 is low on margin.",
];

const Overview = () => {
  return (
    <Card className="max-w-7xl mx-auto shadow-lg rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm mb-8">
      <CardHeader className="border-b border-gray-700 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-blue-300">
            <FaWallet className="mr-3 text-xl" />
            <h3 className="text-lg font-semibold text-gray-100">Wallet Overview</h3>
          </div>
          <span className="text-sm border border-blue-400 text-blue-300 px-2 py-0.5 rounded">
            {dummyWallet.network}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <FaNetworkWired className="text-gray-500" />
            <span><span className="font-medium text-gray-200">Address:</span> {dummyWallet.address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaFileInvoiceDollar className="text-gray-500" />
            <span><span className="font-medium text-gray-200">Balance:</span> {dummyWallet.balance}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaExchangeAlt className="text-gray-500" />
            <span><span className="font-medium text-gray-200">Transactions:</span> {dummyWallet.transactions}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center mb-4">
             <FaLayerGroup className="mr-3 text-xl text-indigo-300" />
             <h3 className="text-lg font-semibold text-gray-100">Subaccounts</h3>
          </div>
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dummySubaccounts.map((sub) => (
              <Card key={sub.id} className="shadow-md border border-gray-700 bg-gray-800/70 flex flex-col">
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
                   <Button size="sm" variant="outline" className="w-full text-xs">Manage</Button>
                 </CardFooter>
              </Card>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default Overview;

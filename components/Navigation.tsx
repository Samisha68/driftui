"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Navigation() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <nav className="glass-effect fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold gradient-text">Drift</span>
              <span className="text-white">Trading</span>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <Link href="/dashboard" passHref legacyBehavior>
              <Button asChild variant="ghost" className="text-gray-400 hover:text-white">
                <a>Dashboard</a>
              </Button>
            </Link>
            <Link href="/markets" passHref legacyBehavior>
              <Button asChild variant="ghost" className="text-gray-400 hover:text-white">
                <a>Markets</a>
              </Button>
            </Link>
            <Link href="/portfolio" passHref legacyBehavior>
              <Button asChild variant="ghost" className="text-gray-400 hover:text-white">
                <a>Portfolio</a>
              </Button>
            </Link>
            <div className="ml-4">
              {isClient && (
                <WalletMultiButton className="!bg-gradient-to-r from-primary to-secondary !text-black" />
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 
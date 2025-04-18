"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon?: React.ReactNode;
  className?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  className, 
  trend,
  subtitle 
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className={cn("gradient-border", className)}
    >
      <Card className="glass-effect border-none h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-sm text-gray-400">{title}</p>
              <div className="flex items-center mt-1">
                <p className="text-2xl font-bold">{value}</p>
                {trend === "up" && (
                  <FiArrowUp className="text-green-400 ml-2" />
                )}
                {trend === "down" && (
                  <FiArrowDown className="text-red-400 ml-2" />
                )}
              </div>
              {change && (
                <p
                  className={cn(
                    "text-sm mt-1",
                    change.startsWith("+") ? "text-green-400" : "text-red-400"
                  )}
                >
                  {change}
                </p>
              )}
              {subtitle && (
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
            {icon && (
              <div className="p-3 rounded-full bg-gray-800 bg-opacity-50 glow-effect">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 
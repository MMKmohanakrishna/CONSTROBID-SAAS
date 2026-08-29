"use client";

import React from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";

interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  meta?: string;
  icon?: any;
  className?: string;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
}

export default function StatsCard({
  label,
  value,
  meta,
  icon: Icon,
  className = "",
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  valueColor = "text-primary",
}: StatsCardProps) {
  const numericValue = typeof value === "number" ? value : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1">
          {/* Title */}
          <div className={`text-lg font-bold ${iconColor}`}>
            {label}
          </div>

          {/* Value */}
          <div className={`mt-2 text-4xl font-bold leading-none ${valueColor || iconColor}`}>
            {numericValue === null ? value : <CountUp end={numericValue} duration={0.9} separator="," preserveValue />}
          </div>

          {/* Subtitle */}
          {meta && (
            <div className="mt-3 text-lg font-semibold text-gray-600">
              {meta}
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <motion.div
            whileHover={{ rotate: -4, scale: 1.08 }}
            transition={{ duration: 0.2 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}
          >
            <Icon
              size={28}
              className={iconColor}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

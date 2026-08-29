"use client";

import { motion } from 'framer-motion';

export default function DashboardCard({ title, value, icon, accent }: { title: string; value: string | number; icon?: React.ReactNode; accent?: string }) {
  return (
    <motion.div whileHover={{ y: -6 }} className="p-4 rounded-xl border bg-white/5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-400">{title}</div>
          <div className="text-2xl font-extrabold mt-2 text-white">{value}</div>
        </div>
        <div className="text-3xl text-secondary">{icon}</div>
      </div>
    </motion.div>
  );
}

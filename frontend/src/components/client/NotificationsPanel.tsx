import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsPanel({ notifications = [] }: { notifications?: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-primary">Notifications</h4>
        <button className="text-xs text-primary font-semibold">View All</button>
      </div>
      <div className="mt-3 space-y-3 text-sm">
        {notifications.length === 0 ? (
          <div className="text-xs text-gray-400">No notifications</div>
        ) : (
          notifications.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.22 }}
              className="flex items-start gap-3 rounded-xl p-2 -mx-2 hover:bg-primary/5"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ delay: i * 0.08, duration: 0.8 }}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
              >
                <CheckCircle2 size={14} />
              </motion.div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{n.title}</div>
                <div className="text-[11px] text-gray-400">{n.time}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

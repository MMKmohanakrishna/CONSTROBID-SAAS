'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export interface NotificationType {
  type: 'success' | 'warning' | 'error';
  message: string;
}

interface NotificationContextType {
  notification: NotificationType | null;
  setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationType | null>(null);
  useEffect(() => {
  console.log("NOTIFICATION STATE:", notification);
}, [notification]);

  useEffect(() => {
    if (!notification) return;

    let duration = 3000;
    if (notification.type === 'warning') duration = 4000;
    if (notification.type === 'error') duration = 5000;

    const timer = setTimeout(() => {
      setNotification(null);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification]);

  return (
    <NotificationContext.Provider value={{ notification, setNotification }}>
      {children}
      
      <div className="fixed top-6 right-6 z-[9999] pointer-events-none flex flex-col gap-3 max-w-md w-full px-4 sm:px-0">
        <AnimatePresence mode="wait">
          {notification && (
            <motion.div
              layout
              initial={{ opacity: 0, x: 150 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 150 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border font-sans select-none ${
                notification.type === 'success'
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : notification.type === 'warning'
                  ? 'bg-[#efc975] border-[#dfb965] text-stone-900' // matches ConstroBID secondary yellow color
                  : 'bg-rose-600 border-rose-500 text-white'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
                {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-stone-900" />}
                {notification.type === 'error' && <XCircle className="w-5 h-5 text-white" />}
              </div>
              
              <div className="flex-1 text-sm font-semibold leading-relaxed break-words pr-2">
                {notification.message}
              </div>
              
              <button
                onClick={() => setNotification(null)}
                className={`flex-shrink-0 transition-opacity opacity-75 hover:opacity-100 ${
                  notification.type === 'warning' ? 'text-stone-900' : 'text-white'
                }`}
                aria-label="Dismiss notification"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

/**
 * Same as useNotification, but returns null instead of throwing when there is
 * no provider above. Lets shared components (sidebars, hooks) raise a toast
 * where one is available without requiring every layout to mount a provider.
 */
export function useOptionalNotification() {
  return useContext(NotificationContext) ?? null;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

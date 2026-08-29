'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from "react";
import { motion } from 'framer-motion';
import { Home, CheckSquare, MapPin, FileText, Monitor, CheckCircle, BarChart2, MessageSquare, User, ShieldAlert, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logoPng from "../../../assets/Logo-B&W.png";
import useUnreadMessages from "@/hooks/useUnreadMessages";

const items = [
  {
    href: "/inspection/dashboard",
    label: "Hub Overview",
    icon: Home,
  },
  {
    href: "/inspection/contractor-verification",
    label: "Contractor Verification",
    icon: CheckSquare,
  },
  {
    href: "/inspection/site-inspections",
    label: "Inspections & Reports",
    icon: MapPin,
  },
  {
    href: "/inspection/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  {
    href: "/inspection/design",
    label: "Designs",
    icon: FileText,
  },
  {
    href: "/inspection/bids",
    label: "Verify Bid Quotes",
    icon: CheckCircle,
  },
  {
    href: "/inspection/finance",
    label: "Contractor Finance",
    icon: Wallet,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useUnreadMessages();

  return (
    <motion.aside
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="hidden lg:flex w-64 bg-gradient-to-b from-primary via-primary to-primary text-white flex-col justify-between p-5 fixed top-0 bottom-0 left-0 shadow-2xl shadow-primary/25"
    >
      <div className="space-y-8">
        <Link href="/" className="block">
          <img
            src={logoPng.src}
            alt="ConstroBID"
            className="mx-auto w-[210px] max-w-full object-contain"
          />
        </Link>
      
      
        <nav className="space-y-2 mt-6">
          {items.map((it, index) => {
            const ActiveIcon = it.icon;
            const active = pathname === it.href;
            return (
              <motion.div
                key={it.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.22 }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={it.href}
                  className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    active ? 'bg-white/15 text-white shadow-md backdrop-blur' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="inspection-sidebar-active"
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-secondary"
                    />
                  )}
                  <div className="flex items-center justify-between w-full">

  <div className="flex items-center gap-3">
    <ActiveIcon size={16} />
    <span>{it.label}</span>
  </div>

  {it.label === "Messages" && unreadCount > 0 && (
    <span
      className="
      min-w-[20px]
      h-5
      px-1
      bg-red-500
      text-white
      text-[11px]
      font-bold
      rounded-full
      flex
      items-center
      justify-center
      "
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}

</div>
            
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 font-bold">
            {String((user?.profile?.fullName || user?.profile?.name || 'Inspector').split(' ').map((s: string) => s[0]).slice(0,2).join('')).toUpperCase()}
          </div>
          <div className="truncate">
            <span className="text-xs font-bold block truncate">{user?.profile?.fullName || user?.profile?.name || 'Inspector'}</span>
            <span className="text-[10px] text-white/80 block truncate">{user?.email}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-2.5 bg-white/10 text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
        >
          Logout Account
        </button>
      </div>
    </motion.aside>
  );
}

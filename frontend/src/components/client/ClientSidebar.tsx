'use client';

import { Building, FileSpreadsheet, Layout, MessageSquare, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useUnreadMessages from '@/hooks/useUnreadMessages';

const logoPng = new URL('../../../assets/Logo-B&W.png', import.meta.url);

export interface ClientSidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  displayName: string;
  user: any;
  logout: () => void;
}

const desktopItems = [
  { id: 'overview', label: 'Dashboard Overview', icon: Layout },
  { id: 'projects', label: 'My Projects', icon: Building },
  { id: 'bidding', label: 'Compare Quotations', icon: FileSpreadsheet },
  { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

const mobileItems = [
  { id: 'overview', label: 'Overview', icon: Layout },
  { id: 'projects', label: 'Projects', icon: Building },
  { id: 'bidding', label: 'Bids', icon: FileSpreadsheet },
  { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

export default function ClientSidebar({
  activeTab,
  setActiveTab,
  displayName,
  user,
  logout,
}: ClientSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [routeTab, setRouteTab] = useState('overview');
  const { unreadCount } = useUnreadMessages();
  const unreadLabel = unreadCount > 99 ? '99+' : unreadCount;

  useEffect(() => {
  if (pathname === '/client/messages') {
    setRouteTab('messages');
    return;
  }

  if (pathname.startsWith('/client/my-projects')) {
  setRouteTab('projects');
  return;
}

  if (pathname.startsWith('/client/dashboard')) {
    const tab = searchParams.get('tab');

    if (tab === 'bidding') {
      setRouteTab('bidding');
      return;
    }

    setRouteTab('overview');
    return;
  }

  setRouteTab('overview');
}, [pathname, searchParams]);

  const currentTab =
  pathname === "/client/quotations"
    ? "quotations"
    : activeTab || routeTab;
  if (pathname === "/client/quotations") {
  console.log("Current Route:", pathname);
  console.log("Current Tab:", routeTab);
}

  const initials = displayName
    ?.split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleNavigation = (id: string) => {
  if (id === 'overview') {
    router.push('/client/dashboard');
    return;
  }

  if (id === 'projects') {
    router.push('/client/my-projects');
    return;
  }

  if (id === 'bidding') {
    router.push('/client/dashboard?tab=bidding');
    return;
  }

  if (id === 'quotations') {
  router.push('/client/quotations');
  return;
}

  if (id === 'messages') {
    router.push('/client/messages');
    return;
  }
};

  return (
    <>
      {/* DESKTOP SIDEBAR (Width: 260px) */}
      <motion.aside
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="hidden lg:flex w-64 bg-gradient-to-b from-primary via-primary to-primary text-white flex-col justify-between p-5 fixed top-0 bottom-0 left-0 shadow-2xl shadow-primary/25"
      >
        <div className="space-y-8">
          <Link href="/" className="block">
            <img
              src={logoPng.href}
              alt="ConstroBID"
              className="mx-auto w-[210px] max-w-full object-contain"
            />
          </Link>

          <nav className="space-y-2 mt-6">
            {desktopItems.map((btn, index) => (
              <motion.button
                key={btn.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.22 }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigation(btn.id)}
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  currentTab === btn.id
                    ? 'bg-white/15 text-white shadow-md backdrop-blur'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {currentTab === btn.id && (
                  <motion.span
                    layoutId="client-sidebar-active"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-secondary"
                  />
                )}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <btn.icon size={16} />
                    <span>{btn.label}</span>
                  </div>

                  {btn.id === 'messages' && unreadCount > 0 && (
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
                      {unreadLabel}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 font-bold">
              {initials}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold block truncate">{displayName}</span>
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

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary text-white border-t border-white flex justify-between px-2 py-3.5 z-50 shadow-2xl">
        {mobileItems.map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleNavigation(btn.id)}
            className={`relative flex flex-1 min-w-0 flex-col items-center gap-1 px-0.5 text-[9px] sm:text-[10px] font-bold truncate ${
              currentTab === btn.id ? 'text-secondary' : 'text-white'
            }`}
          >
            <span className="relative">
              <btn.icon size={18} />

              {btn.id === 'messages' && unreadCount > 0 && (
                <span
                  className="
                  absolute
                  -top-1.5
                  -right-2
                  min-w-[16px]
                  h-4
                  px-1
                  bg-red-500
                  text-white
                  text-[9px]
                  font-bold
                  rounded-full
                  flex
                  items-center
                  justify-center
                  "
                >
                  {unreadLabel}
                </span>
              )}
            </span>
            {btn.label}
          </button>
        ))}
        <button
          onClick={logout}
          className="flex flex-1 min-w-0 flex-col items-center gap-1 px-0.5 text-[9px] sm:text-[10px] font-bold text-white truncate"
        >
          <X size={18} />
          Logout
        </button>
      </nav>
    </>
  );
}

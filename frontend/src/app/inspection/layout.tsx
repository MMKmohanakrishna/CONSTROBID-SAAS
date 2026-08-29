'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { NotificationProvider } from '@/context/NotificationContext';
import Sidebar from '@/components/inspection/Sidebar';

export default function InspectionLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (pathname && (pathname === '/inspection/login' || pathname.startsWith('/inspection/login') || pathname.startsWith('/inspection/auth'))) {
    return <NotificationProvider>{children}</NotificationProvider>;
  }

  if (!user || (user.role !== 'INSPECTION_TEAM' && user.role !== 'INSPECTOR')) {
    if (typeof window !== 'undefined') window.location.href = '/inspection/login';
    return null;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="lg:ml-64 min-h-screen">
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}


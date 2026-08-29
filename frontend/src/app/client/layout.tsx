'use client';

import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import ClientSidebar from '@/components/client/ClientSidebar';
import { useAuth } from '@/context/AuthContext';

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CLIENT')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const displayName = (() => {
    // /auth/profile returns { id, email, role, profile }; AuthContext stores
    // that whole object as user.profile, so the real Client record is one
    // level deeper — mirrors user?.profile?.profile?.companyName on the
    // contractor dashboard.
    const profile = (user as any)?.profile?.profile || (user as any)?.profile;
    if (!profile && !user) return 'Homeowner';
    if (profile?.name) return profile.name;
    if (profile?.firstName || profile?.lastName) return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    if ((user as any)?.name) return (user as any).name;
    if (user?.email) return user.email.split('@')[0];
    return 'Homeowner';
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      {/* ClientSidebar calls useSearchParams() internally (for active-tab
          highlighting) and it renders on every /client/* route via this
          layout — without this boundary, Next.js 15 fails static
          prerendering on every page under /client, not just the ones that
          use useSearchParams() themselves. */}
      <Suspense fallback={<div className="hidden lg:block w-64 shrink-0" />}>
        <ClientSidebar
          displayName={displayName}
          user={user}
          logout={logout}
        />
      </Suspense>

      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
}

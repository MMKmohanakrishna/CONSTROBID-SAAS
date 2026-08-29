'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InspectionIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inspection/dashboard');
  }, [router]);

  return null;
}
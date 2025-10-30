"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUtils } from '@/services/api-client';
import LoginPage from "./auth/page";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = apiUtils.isAuthenticated();
    
    if (isAuthenticated) {
      // Redirect authenticated users to dashboard
      router.push('/admin');
    }
  }, [router]);

  return <LoginPage />;
}

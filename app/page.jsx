"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useAuth';
import LoginPage from "./auth/page";

export default function Home() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();

  useEffect(() => {
    // Only redirect if we have valid user data (not just a token)
    // If there's an error, the token is likely expired, so don't redirect
    if (currentUser && !userError && !userLoading) {
      // Check for stored redirect URL
      const redirectUrl = localStorage.getItem('authRedirectUrl');
      if (redirectUrl && !redirectUrl.startsWith('/auth') && redirectUrl !== '/') {
        // Clear the stored redirect URL and redirect to it
        localStorage.removeItem('authRedirectUrl');
        router.push(redirectUrl);
      } else {
        // Default to admin page
        router.push('/admin');
      }
    } else if (userError) {
      // If there's an error fetching user (expired token), clear the token
      // This prevents redirect loops - the auth page will handle login
    }
  }, [router, currentUser, userError, userLoading]);

  return <LoginPage />;
}

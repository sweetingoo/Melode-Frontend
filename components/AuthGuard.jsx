"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useAuth';
import { apiUtils } from '@/services/api-client';
import { Loader2 } from 'lucide-react';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/'
];

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();

  useEffect(() => {
    const checkAuth = async () => {
      // Check if current route is public
      const isPublicRoute = PUBLIC_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      );

      // If it's a public route, allow access
      if (isPublicRoute) {
        setIsChecking(false);
        return;
      }

      // Check if user is authenticated
      const isAuthenticated = apiUtils.isAuthenticated();
      
      if (!isAuthenticated) {
        // Not authenticated and trying to access protected route
        console.log('AuthGuard: User not authenticated, redirecting to login');
        router.push('/auth');
        return;
      }

      // If authenticated but user data is still loading, wait
      if (userLoading) {
        console.log('AuthGuard: User authenticated but data loading...');
        return;
      }

      // If there's an error fetching user data (e.g., token expired)
      if (userError) {
        console.log('AuthGuard: Error fetching user data, redirecting to login');
        apiUtils.clearAuthToken();
        router.push('/auth');
        return;
      }

      // User is authenticated and data is loaded
      console.log('AuthGuard: User authenticated and data loaded');
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, userLoading, userError, currentUser]);

  // Show loading spinner while checking authentication
  if (isChecking || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's an error, don't render children (will redirect)
  if (userError) {
    return null;
  }

  // Render children if authenticated or on public route
  return children;
};

export default AuthGuard;

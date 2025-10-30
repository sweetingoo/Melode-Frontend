import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { apiUtils } from '@/services/api-client';
import tokenManager from '@/services/token-manager';
import { toast } from 'sonner';
import SessionContinuationModal from '@/components/SessionContinuationModal';

export const useTokenManager = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionModalCallbacks, setSessionModalCallbacks] = useState(null);

  const handleTokenRefresh = useCallback((event) => {
    console.log('Token refreshed successfully');
    // Optionally show a subtle notification
    toast.success('Session refreshed', {
      duration: 2000,
    });
  }, []);

  const handleTokenRefreshFailure = useCallback(() => {
    console.log('Token refresh failed, logging out');
    
    // Clear all cached data
    queryClient.clear();
    
    // Clear tokens
    apiUtils.clearAuthToken();
    
    // Show logout notification
    toast.error('Session expired', {
      description: 'Please log in again to continue',
    });
    
    // Redirect to login
    router.push('/auth');
  }, [queryClient, router]);

  const handleShowSessionModal = useCallback((event) => {
    const { onContinue, onLogout } = event.detail;
    setSessionModalCallbacks({ onContinue, onLogout });
    setShowSessionModal(true);
  }, []);

  const handleSessionContinue = useCallback(() => {
    if (sessionModalCallbacks?.onContinue) {
      sessionModalCallbacks.onContinue();
    }
    setShowSessionModal(false);
    setSessionModalCallbacks(null);
  }, [sessionModalCallbacks]);

  const handleSessionLogout = useCallback(() => {
    if (sessionModalCallbacks?.onLogout) {
      sessionModalCallbacks.onLogout();
    }
    setShowSessionModal(false);
    setSessionModalCallbacks(null);
  }, [sessionModalCallbacks]);

  useEffect(() => {
    // Only set up token management on client side
    if (typeof window === 'undefined') return;

    // Listen for token refresh events
    window.addEventListener('tokenRefreshed', handleTokenRefresh);
    window.addEventListener('tokenRefreshFailed', handleTokenRefreshFailure);
    window.addEventListener('showSessionModal', handleShowSessionModal);

    // Cleanup
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
      window.removeEventListener('tokenRefreshFailed', handleTokenRefreshFailure);
      window.removeEventListener('showSessionModal', handleShowSessionModal);
    };
  }, [handleTokenRefresh, handleTokenRefreshFailure, handleShowSessionModal]);

  // Manual refresh function
  const refreshToken = useCallback(async () => {
    try {
      return await tokenManager.forceRefresh();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      throw error;
    }
  }, []);

  return {
    refreshToken,
    sessionModal: (
      <SessionContinuationModal
        isOpen={showSessionModal}
        onContinue={handleSessionContinue}
        onLogout={handleSessionLogout}
        timeRemaining={30}
      />
    ),
  };
};

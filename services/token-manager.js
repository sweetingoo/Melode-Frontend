import { api } from "./api-client";
import { apiUtils } from "./api-client";

class TokenManager {
  constructor() {
    this.refreshPromise = null;
    this.activityTimeout = null;
    this.refreshTimeout = null;
    this.isRefreshing = false;
    this.lastActivity = Date.now();
    this.INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    this.TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry
    this.TOKEN_EXPIRY_BUFFER = 1 * 60 * 1000; // 1 minute buffer
    
    this.setupActivityListeners();
    this.setupTokenRefresh();
  }

  setupActivityListeners() {
    if (typeof window === "undefined") return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), true);
    });

    // Check for inactivity every minute
    setInterval(() => {
      this.checkInactivity();
    }, 60000);
  }

  handleActivity() {
    this.lastActivity = Date.now();
    
    // Clear existing timeout
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    // Set new timeout for inactivity check
    this.activityTimeout = setTimeout(() => {
      this.checkInactivity();
    }, this.INACTIVITY_THRESHOLD);
  }

  checkInactivity() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    
    if (timeSinceActivity > this.INACTIVITY_THRESHOLD) {
      console.log('User inactive for', Math.round(timeSinceActivity / 1000), 'seconds');
      // Don't auto-refresh if user is inactive
      return false;
    }
    
    return true;
  }

  setupTokenRefresh() {
    if (typeof window === "undefined") return;

    // Check token expiry every minute
    setInterval(() => {
      this.checkTokenExpiry();
    }, 60000);
  }

  getTokenExpiry() {
    const token = apiUtils.getAuthToken();
    if (!token) return null;

    try {
      // Decode JWT token to get expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  checkTokenExpiry() {
    if (!apiUtils.isAuthenticated()) return;

    const expiry = this.getTokenExpiry();
    if (!expiry) return;

    const now = Date.now();
    const timeUntilExpiry = expiry - now;

    // If token expires within the refresh threshold
    if (timeUntilExpiry <= this.TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
      console.log('Token expires in', Math.round(timeUntilExpiry / 1000), 'seconds');
      
      // Check if user is active
      if (this.checkInactivity()) {
        // User is active, auto-refresh token
        this.refreshToken();
      } else {
        // User is inactive, show session continuation prompt
        this.showSessionPrompt();
      }
    }
  }

  async refreshToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Refreshing token...');
      
      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      // Update tokens
      apiUtils.setAuthToken(access_token);
      this.setRefreshToken(newRefreshToken);
      
      console.log('Token refreshed successfully');
      
      // Notify components about successful refresh
      window.dispatchEvent(new CustomEvent('tokenRefreshed', { 
        detail: { access_token, refresh_token: newRefreshToken } 
      }));
      
      return { access_token, refresh_token: newRefreshToken };
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // If refresh fails, logout user
      this.handleRefreshFailure();
      
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  getRefreshToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem('refreshToken');
  }

  setRefreshToken(token) {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  showSessionPrompt() {
    // Don't show multiple prompts
    if (document.querySelector('#session-continuation-modal')) return;

    // Dispatch custom event to show modal
    window.dispatchEvent(new CustomEvent('showSessionModal', {
      detail: { 
        onContinue: () => this.handleSessionContinue(),
        onLogout: () => this.handleSessionLogout()
      }
    }));
  }

  handleSessionContinue() {
    console.log('User chose to continue session');
    this.lastActivity = Date.now(); // Reset activity timer
    this.refreshToken().catch(error => {
      console.error('Failed to refresh token after user confirmation:', error);
      this.handleRefreshFailure();
    });
  }

  handleSessionLogout() {
    console.log('User chose to logout');
    this.handleRefreshFailure();
  }

  handleRefreshFailure() {
    console.log('Handling refresh failure - logging out user');
    
    // Clear tokens
    apiUtils.clearAuthToken();
    this.setRefreshToken(null);
    
    // Notify components about logout
    window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
    
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = '/auth';
    }
  }

  // Public method to manually refresh token
  async forceRefresh() {
    return this.refreshToken();
  }

  // Cleanup method
  destroy() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

export default tokenManager;

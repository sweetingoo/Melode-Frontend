/**
 * Authentication Utilities
 * Handles token management, refresh, and automatic retry of failed requests
 */

const AuthUtils = {
    API_BASE_URL: 'http://127.0.0.1:8000/api/v1',

    /**
     * Get access token from localStorage
     */
    getAccessToken() {
        return localStorage.getItem('access_token');
    },

    /**
     * Get refresh token from localStorage
     */
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    },

    /**
     * Save tokens to localStorage
     */
    saveTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
    },

    /**
     * Clear all auth data and redirect to login
     */
    logout() {
        localStorage.clear();
        window.location.href = 'login.html';
    },

    /**
     * Check if token is expired or about to expire (within 5 minutes)
     */
    isTokenExpiring(token) {
        if (!token) return true;

        try {
            // Decode JWT token (basic decode, not verification)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

            return expirationTime - currentTime < bufferTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // Assume expired if we can't decode
        }
    },

    /**
     * Refresh the access token using refresh token
     */
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            console.error('No refresh token available');
            this.logout();
            return null;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });

            if (!response.ok) {
                console.error('Failed to refresh token:', response.status);
                this.logout();
                return null;
            }

            const data = await response.json();
            this.saveTokens(data.access_token, data.refresh_token);

            console.log('Token refreshed successfully');
            return data.access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.logout();
            return null;
        }
    },

    /**
     * Make an authenticated API request with automatic token refresh
     * @param {string} url - The API endpoint URL
     * @param {object} options - Fetch options (method, headers, body, etc.)
     * @param {boolean} isRetry - Internal flag to prevent infinite retry loops
     */
    async authenticatedFetch(url, options = {}, isRetry = false) {
        let accessToken = this.getAccessToken();

        // Check if token is expiring and refresh if needed
        if (!isRetry && this.isTokenExpiring(accessToken)) {
            console.log('Token expiring soon, refreshing...');
            accessToken = await this.refreshAccessToken();

            if (!accessToken) {
                throw new Error('Failed to refresh token');
            }
        }

        // Add authorization header
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': options.headers?.['Content-Type'] || 'application/json'
        };

        // Make the request
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // If we get a 401 and haven't retried yet, try to refresh and retry
            if (response.status === 401 && !isRetry) {
                console.log('Got 401, attempting token refresh...');
                const newToken = await this.refreshAccessToken();

                if (newToken) {
                    // Retry the request with new token
                    return this.authenticatedFetch(url, options, true);
                } else {
                    throw new Error('Authentication failed');
                }
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    /**
     * Convenience method for GET requests
     */
    async get(endpoint) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE_URL}${endpoint}`;
        return this.authenticatedFetch(url, { method: 'GET' });
    },

    /**
     * Convenience method for POST requests
     */
    async post(endpoint, data) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE_URL}${endpoint}`;
        return this.authenticatedFetch(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Convenience method for PUT requests
     */
    async put(endpoint, data) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE_URL}${endpoint}`;
        return this.authenticatedFetch(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Convenience method for DELETE requests
     */
    async delete(endpoint) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE_URL}${endpoint}`;
        return this.authenticatedFetch(url, { method: 'DELETE' });
    },

    /**
     * Initialize periodic token refresh check
     * Checks every minute if token needs refresh
     */
    startTokenRefreshTimer() {
        // Check immediately
        this.checkAndRefreshToken();

        // Then check every minute
        setInterval(() => {
            this.checkAndRefreshToken();
        }, 60000); // 60 seconds
    },

    /**
     * Check if token needs refresh and refresh if necessary
     */
    async checkAndRefreshToken() {
        const accessToken = this.getAccessToken();

        if (accessToken && this.isTokenExpiring(accessToken)) {
            console.log('Token expiring soon, proactively refreshing...');
            await this.refreshAccessToken();
        }
    },

    /**
     * Initialize auth utilities
     * Call this on page load for authenticated pages
     */
    init() {
        // Check if user is authenticated
        const accessToken = this.getAccessToken();
        const isAuthenticated = localStorage.getItem('is_authenticated') === 'true';

        if (!accessToken || !isAuthenticated) {
            // Don't redirect if we're already on login or signup pages
            const currentPage = window.location.pathname.split('/').pop();
            const publicPages = ['login.html', 'signup.html', 'reset-password.html', 'forgot-password.html', ''];

            if (!publicPages.includes(currentPage)) {
                console.log('Not authenticated, redirecting to login');
                this.logout();
            }
            return false;
        }

        // Start automatic token refresh
        this.startTokenRefreshTimer();

        return true;
    }
};

// Make available globally
window.AuthUtils = AuthUtils;

// Auto-initialize on page load for authenticated pages
document.addEventListener('DOMContentLoaded', function () {
    // Only initialize if not on public pages
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['login.html', 'signup.html', 'reset-password.html', 'forgot-password.html', 'index.html', ''];

    if (!publicPages.includes(currentPage) && localStorage.getItem('is_authenticated') === 'true') {
        AuthUtils.init();
    }
});


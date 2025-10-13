/**
 * Authentication utilities and session management
 */

class AuthManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.loadUserFromStorage();
    }

    /**
     * Load user data from localStorage
     */
    loadUserFromStorage() {
        const isAuthenticated = localStorage.getItem('is_authenticated') === 'true';
        const userData = localStorage.getItem('user_data');
        const accessToken = localStorage.getItem('access_token');

        if (isAuthenticated && accessToken) {
            this.isAuthenticated = true;
            if (userData) {
                try {
                    this.user = JSON.parse(userData);
                } catch (error) {
                    console.error('Failed to parse user data:', error);
                    this.user = null;
                }
            }
        } else {
            this.isAuthenticated = false;
            this.user = null;
        }
    }

    /**
     * Save user data to localStorage
     */
    saveUserData(userData) {
        this.user = userData;
        this.isAuthenticated = true;
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('is_authenticated', 'true');
    }

    /**
     * Clear user data from localStorage
     */
    clearUserData() {
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('user_data');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('is_authenticated');
        localStorage.removeItem('session_expires');
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        if (!this.user || !this.user.permissions) return false;
        return this.user.permissions.includes(permission);
    }

    /**
     * Check if user has specific role
     */
    hasRole(roleName) {
        if (!this.user || !this.user.roles) return false;
        return this.user.roles.some(role => role.name === roleName);
    }

    /**
     * Check if user is superadmin
     */
    isSuperadmin() {
        // Check both is_superuser flag and superadmin role
        if (this.user && this.user.is_superuser === true) {
            return true;
        }
        return this.hasRole('superadmin');
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.hasRole('admin') || this.isSuperadmin();
    }

    /**
     * Check if user is doctor/contractor
     */
    isDoctor() {
        return this.hasRole('doctor') || this.hasRole('contractor');
    }

    /**
     * Check if user is staff
     */
    isStaff() {
        return this.hasRole('staff');
    }

    /**
     * Check if user is patient
     */
    isPatient() {
        return this.hasRole('patient');
    }

    /**
     * Get user's display name
     */
    getDisplayName() {
        if (!this.user) return 'Guest';

        // Use backend's display_name if available, otherwise construct it
        if (this.user.display_name) {
            return this.user.display_name;
        }

        return `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() || this.user.username || this.user.email;
    }

    /**
     * Get user's initials for avatar
     */
    getInitials() {
        if (!this.user) return 'G';

        // Try to get initials from first and last name
        if (this.user.first_name && this.user.last_name) {
            return (this.user.first_name.charAt(0) + this.user.last_name.charAt(0)).toUpperCase();
        }

        // Try to get from first name only
        if (this.user.first_name) {
            return this.user.first_name.charAt(0).toUpperCase();
        }

        // Fall back to username
        if (this.user.username) {
            return this.user.username.charAt(0).toUpperCase();
        }

        // Fall back to email
        if (this.user.email) {
            return this.user.email.charAt(0).toUpperCase();
        }

        return 'U';
    }

    /**
     * Generate avatar placeholder SVG as data URL
     */
    generateAvatarPlaceholder(initials = null, size = 128) {
        const letters = initials || this.getInitials();
        const backgroundColor = '#3b82f6'; // Primary blue
        const textColor = '#ffffff';

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size / 8}"/>
                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
                      font-family="system-ui, -apple-system, sans-serif" 
                      font-size="${size / 2.5}" 
                      font-weight="600" 
                      fill="${textColor}">
                    ${letters}
                </text>
            </svg>
        `.trim();

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Get user's avatar URL
     */
    getAvatarUrl() {
        if (!this.user) {
            return this.generateAvatarPlaceholder('G');
        }

        // Use custom avatar URL if available
        if (this.user.avatar_url) {
            return this.user.avatar_url;
        }

        // Generate placeholder with user's initials
        return this.generateAvatarPlaceholder();
    }

    /**
     * Redirect to appropriate dashboard based on user role
     */
    redirectToDashboard() {
        if (!this.isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        // Redirect based on role hierarchy
        if (this.isSuperadmin()) {
            window.location.href = 'superadmin-dashboard.html';
        } else if (this.isPatient()) {
            window.location.href = 'patient-dashboard.html';
        } else {
            // All other users (admin, staff, nurse, doctor, etc.) go to permission-based dashboard
            window.location.href = 'index.html';
        }
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error) {
        console.error('Authentication error:', error);
        this.clearUserData();
        window.location.href = 'login.html';
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one digit');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Format phone number for display
     */
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';

        // Remove all non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Format UK phone number
        if (cleaned.startsWith('44')) {
            return `+${cleaned}`;
        } else if (cleaned.startsWith('0')) {
            return `+44${cleaned.substring(1)}`;
        }

        return phoneNumber;
    }

    /**
     * Check if session is valid
     */
    isSessionValid() {
        const token = localStorage.getItem('access_token');
        if (!token) return false;

        try {
            // Decode JWT token to check expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp > currentTime;
        } catch (error) {
            console.error('Failed to decode token:', error);
            return false;
        }
    }

    /**
     * Auto-logout if session is invalid
     */
    checkSession() {
        if (!this.isSessionValid()) {
            this.clearUserData();
            if (window.location.pathname !== '/login.html') {
                window.location.href = 'login.html';
            }
        }
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Check session validity on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (window.authManager) {
            window.authManager.checkSession();
        }
    } catch (error) {
        console.error('Auth manager initialization error:', error);
    }
});

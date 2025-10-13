/**
 * Unified Navigation Component
 * Dynamically shows/hides navigation items based on user permissions
 */

function navigationComponent() {
    return {
        // User data
        userName: 'Loading...',
        userAvatar: window.authManager ? window.authManager.generateAvatarPlaceholder('...', 32) : '',
        userEmail: '',
        userMenuOpen: false,
        mobileMenuOpen: false,

        // Navigation items with permission requirements
        navItems: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: 'fas fa-home',
                href: '',  // Will be set dynamically based on user role
                permission: null,  // Everyone can access their dashboard
                visible: true
            },
            {
                id: 'admin-panel',
                label: 'Admin Panel',
                icon: 'fas fa-crown',
                href: 'superadmin-dashboard.html',
                permission: null,  // Will be shown only for superusers
                visible: false,
                superuserOnly: true
            },
            {
                id: 'users',
                label: 'Users',
                icon: 'fas fa-users',
                href: 'user-management.html',
                permission: 'users:read',
                visible: false
            },
            {
                id: 'roles',
                label: 'Roles',
                icon: 'fas fa-shield-alt',
                href: 'role-management.html',
                permission: 'roles:read',
                visible: false
            },
            {
                id: 'permissions',
                label: 'Permissions',
                icon: 'fas fa-key',
                href: 'permissions-management.html',
                permission: 'permissions:read',
                visible: false
            },
            {
                id: 'invitations',
                label: 'Invitations',
                icon: 'fas fa-envelope',
                href: 'invitations.html',
                permission: 'invitations:read',
                visible: false
            },
            {
                id: 'profile',
                label: 'Profile',
                icon: 'fas fa-user',
                href: 'profile.html',
                permission: null,  // Everyone can access their profile
                visible: true
            }
        ],

        currentPage: '',

        /**
         * Initialize navigation
         */
        init() {
            this.loadUserData();
            this.determineCurrentPage();
            this.updateNavigationVisibility();
        },

        /**
         * Load user data from localStorage
         */
        loadUserData() {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    this.userName = this.getDisplayName(user);
                    this.userEmail = user.email || '';
                    this.userAvatar = user.avatar_url || this.generateAvatarUrl(this.userName);

                    // Set dashboard URL based on user role
                    this.setDashboardUrl(user);
                } catch (error) {
                    console.error('Failed to parse user data:', error);
                }
            }
        },

        /**
         * Get display name for user
         */
        getDisplayName(user) {
            if (user.first_name && user.last_name) {
                return user.first_name + ' ' + user.last_name;
            }
            return user.username || user.email || 'User';
        },

        /**
         * Generate avatar URL using local SVG
         */
        generateAvatarUrl(name) {
            // Use auth manager if available
            if (window.authManager && window.authManager.user) {
                return window.authManager.getAvatarUrl();
            }

            // Fallback: generate local SVG
            const initials = name ? name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : 'U';
            return this.generateAvatarPlaceholder(initials, 32);
        },

        /**
         * Generate avatar placeholder SVG
         */
        generateAvatarPlaceholder(initials, size = 32) {
            const backgroundColor = '#3b82f6';
            const textColor = '#ffffff';

            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size / 8}"/>
                    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
                          font-family="system-ui, -apple-system, sans-serif" 
                          font-size="${size / 2.5}" 
                          font-weight="600" 
                          fill="${textColor}">
                        ${initials}
                    </text>
                </svg>
            `.trim();

            return `data:image/svg+xml;base64,${btoa(svg)}`;
        },

        /**
         * Set dashboard URL based on user role
         */
        setDashboardUrl(user) {
            // Find dashboard nav item
            const dashboardItem = this.navItems.find(item => item.id === 'dashboard');
            if (!dashboardItem) return;

            // Check user roles and superuser flag
            const roles = user.roles || [];
            const isSuperAdmin = user.is_superuser === true || roles.some(role => role.name === 'superadmin');
            const isPatient = roles.some(role => role.name === 'patient');

            // Show/hide admin panel button for superusers
            const adminPanelItem = this.navItems.find(item => item.id === 'admin-panel');
            if (adminPanelItem) {
                adminPanelItem.visible = isSuperAdmin;
            }

            // Set appropriate dashboard
            if (isSuperAdmin) {
                dashboardItem.href = 'superadmin-dashboard.html';
            } else if (isPatient) {
                dashboardItem.href = 'patient-dashboard.html';
            } else {
                // All other users (admin, staff, nurse, doctor, etc.) get permission-based dashboard
                dashboardItem.href = 'index.html';
            }
        },

        /**
         * Determine current page to highlight active nav item
         */
        determineCurrentPage() {
            const path = window.location.pathname;
            const filename = path.substring(path.lastIndexOf('/') + 1);

            // Map filenames to nav item IDs
            const pageMap = {
                'superadmin-dashboard.html': 'admin-panel',
                'patient-dashboard.html': 'dashboard',
                'index.html': 'dashboard',
                'user-management.html': 'users',
                'role-management.html': 'roles',
                'permissions-management.html': 'permissions',
                'invitations.html': 'invitations',
                'profile.html': 'profile',
                'user-edit.html': 'users'
            };

            this.currentPage = pageMap[filename] || '';
        },

        /**
         * Update navigation visibility based on permissions
         */
        updateNavigationVisibility() {
            if (!window.permissionManager) {
                console.warn('Permission manager not loaded');
                return;
            }

            // Update visibility for each nav item
            this.navItems.forEach(item => {
                if (item.permission === null) {
                    // No permission required, always visible
                    item.visible = true;
                } else {
                    // Check if user has permission
                    item.visible = window.permissionManager.hasPermission(item.permission);
                }
            });
        },

        /**
         * Check if nav item is active
         */
        isActive(itemId) {
            return this.currentPage === itemId;
        },

        /**
         * Get CSS classes for nav link
         */
        getNavLinkClasses(itemId) {
            const baseClasses = 'px-3 py-2 rounded-md text-sm font-medium flex items-center';
            if (this.isActive(itemId)) {
                return baseClasses + ' text-primary-600 bg-primary-50';
            }
            return baseClasses + ' text-gray-500 hover:text-primary-600 hover:bg-gray-50';
        },

        /**
         * Handle logout
         */
        logout() {
            localStorage.clear();
            window.location.href = 'login.html';
        },

        /**
         * Toggle mobile menu
         */
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
        }
    };
}

// Make it globally available
window.navigationComponent = navigationComponent;


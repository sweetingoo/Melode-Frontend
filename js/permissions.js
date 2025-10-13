/**
 * Permission Management Utilities
 * Handles user permissions, role checking, and feature access control
 */

class PermissionManager {
    constructor() {
        this.user = null;
        this.permissions = [];
        this.roles = [];
    }

    /**
     * Initialize permission manager with user data
     */
    init(userData) {
        this.user = userData;
        this.roles = userData.roles || [];
        this.permissions = userData.permissions || [];

        // If user is superuser, give them all permissions
        if (userData.is_superuser) {
            this.permissions = ['*'];
        }

        console.log('PermissionManager initialized:', {
            user: this.user,
            is_superuser: userData.is_superuser,
            roles: this.roles,
            permissions: this.permissions
        });
    }

    /**
     * Check if user has a specific role
     */
    hasRole(roleName) {
        return this.roles.some(role => role.name === roleName);
    }

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(roleNames) {
        return roleNames.some(roleName => this.hasRole(roleName));
    }

    /**
     * Check if user has a specific permission
     */
    hasPermission(permissionName) {
        // Superuser has all permissions (backend returns ["*"])
        if (this.permissions.includes("*")) {
            return true;
        }

        return this.permissions.some(permission =>
            permission.name === permissionName ||
            permission === permissionName
        );
    }

    /**
     * Check if user has any of the specified permissions
     */
    hasAnyPermission(permissionNames) {
        return permissionNames.some(permissionName => this.hasPermission(permissionName));
    }

    /**
     * Check if user has all of the specified permissions
     */
    hasAllPermissions(permissionNames) {
        return permissionNames.every(permissionName => this.hasPermission(permissionName));
    }

    /**
     * Get user's role hierarchy level
     */
    getRoleLevel() {
        const roleHierarchy = {
            'superadmin': 100,
            'admin': 80,
            'doctor': 60,
            'contractor': 50,
            'staff': 40,
            'user': 10
        };

        let maxLevel = 0;
        this.roles.forEach(role => {
            const level = roleHierarchy[role.name] || 0;
            maxLevel = Math.max(maxLevel, level);
        });

        return maxLevel;
    }

    /**
     * Check if user can access a specific feature
     */
    canAccessFeature(feature) {
        const featurePermissions = {
            'dashboard': ['user:read'],
            'profile': ['user:read'],
            'invitations': ['invitation:read', 'invitation:list'],
            'create_invitation': ['invitation:create'],
            'delete_invitation': ['invitation:delete'],
            'user_management': ['user:list', 'user:read'],
            'system_settings': ['system:config', 'system:admin'],
            'audit_logs': ['system:monitor'],
            'reports': ['system:monitor'],
            'analytics': ['system:monitor']
        };

        const requiredPermissions = featurePermissions[feature] || [];

        // Superuser has access to everything (backend returns ["*"])
        if (this.permissions.includes("*")) {
            return true;
        }

        // Check if user has any of the required permissions
        return this.hasAnyPermission(requiredPermissions);
    }

    /**
     * Get accessible features for the user
     */
    getAccessibleFeatures() {
        const allFeatures = [
            'dashboard',
            'profile',
            'invitations',
            'create_invitation',
            'delete_invitation',
            'user_management',
            'system_settings',
            'audit_logs',
            'reports',
            'analytics'
        ];

        return allFeatures.filter(feature => this.canAccessFeature(feature));
    }

    /**
     * Get user type for routing
     */
    getUserType() {
        // Superuser has all permissions (backend returns ["*"])
        if (this.permissions.includes("*")) {
            return 'superadmin';
        }

        if (this.hasRole('superadmin')) {
            return 'superadmin';
        }

        if (this.hasRole('patient')) {
            return 'patient';
        }

        // Check if user has admin-level permissions
        if (this.hasAnyRole(['admin']) || this.hasAnyPermission(['user:list', 'system:admin'])) {
            return 'admin';
        }

        // Check if user has staff-level permissions
        if (this.hasAnyRole(['doctor', 'staff']) || this.hasAnyPermission(['invitation:create', 'invitation:read'])) {
            return 'staff';
        }

        // Default to regular user
        return 'user';
    }

    /**
     * Get navigation items based on user permissions
     */
    getNavigationItems() {
        const navigationItems = [
            { name: 'Dashboard', href: 'index.html', feature: 'dashboard' },
            { name: 'Profile', href: 'profile.html', feature: 'profile' },
            { name: 'Invitations', href: 'invitations.html', feature: 'invitations' }
        ];

        // Add admin-specific items
        if (this.canAccessFeature('user_management')) {
            navigationItems.push({ name: 'User Management', href: 'user-management.html', feature: 'user_management' });
        }

        if (this.canAccessFeature('system_settings')) {
            navigationItems.push({ name: 'Settings', href: 'settings.html', feature: 'system_settings' });
        }

        if (this.canAccessFeature('audit_logs')) {
            navigationItems.push({ name: 'Audit Logs', href: 'audit-logs.html', feature: 'audit_logs' });
        }

        if (this.canAccessFeature('reports')) {
            navigationItems.push({ name: 'Reports', href: 'reports.html', feature: 'reports' });
        }

        return navigationItems.filter(item => this.canAccessFeature(item.feature));
    }

    /**
     * Get quick actions based on user permissions
     */
    getQuickActions() {
        const quickActions = [];

        if (this.canAccessFeature('create_invitation')) {
            quickActions.push({
                title: 'Create Invitation',
                description: 'Send invitation to new staff member',
                href: 'invitations.html#create',
                icon: 'user-plus'
            });
        }

        if (this.canAccessFeature('user_management')) {
            quickActions.push({
                title: 'Manage Users',
                description: 'View and manage system users',
                href: 'user-management.html',
                icon: 'users'
            });
        }

        if (this.canAccessFeature('reports')) {
            quickActions.push({
                title: 'View Reports',
                description: 'Access system reports and analytics',
                href: 'reports.html',
                icon: 'chart-bar'
            });
        }

        if (this.canAccessFeature('system_settings')) {
            quickActions.push({
                title: 'System Settings',
                description: 'Configure system settings',
                href: 'settings.html',
                icon: 'cog'
            });
        }

        return quickActions;
    }
}

// Global permission manager instance
window.permissionManager = new PermissionManager();

// Utility functions for easy access
window.hasPermission = (permission) => window.permissionManager.hasPermission(permission);
window.hasRole = (role) => window.permissionManager.hasRole(role);
window.canAccessFeature = (feature) => window.permissionManager.canAccessFeature(feature);
window.getUserType = () => window.permissionManager.getUserType();

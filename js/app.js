/**
 * Main application functionality
 */

class MelodeApp {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    /**
     * Get current page name
     */
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('login.html')) return 'login';
        if (path.includes('patient-dashboard.html')) return 'patient-dashboard';
        if (path.includes('profile.html')) return 'profile';
        if (path.includes('invitations.html')) return 'invitations';
        return 'dashboard';
    }

    /**
     * Initialize the application
     */
    init() {
        // Check authentication
        if (this.currentPage !== 'login' && !window.authManager.isAuthenticated) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        // If user is authenticated and on login page, redirect to dashboard
        if (this.currentPage === 'login' && window.authManager.isAuthenticated) {
            console.log('User already authenticated, redirecting to dashboard');
            window.location.href = 'index.html';
            return;
        }

        // Initialize page-specific functionality
        this.initializePage();

        // Set up global event listeners
        this.setupEventListeners();
    }

    /**
     * Initialize page-specific functionality
     */
    initializePage() {
        switch (this.currentPage) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'profile':
                this.initializeProfile();
                break;
            case 'invitations':
                this.initializeInvitations();
                break;
            case 'patient-dashboard':
                this.initializePatientDashboard();
                break;
        }
    }

    /**
     * Initialize dashboard
     */
    initializeDashboard() {
        this.loadUserProfile();
        this.setupNavigation();
    }

    /**
     * Initialize profile page
     */
    initializeProfile() {
        this.loadUserProfile();
        this.setupProfileForm();
    }

    /**
     * Initialize invitations page
     */
    initializeInvitations() {
        this.loadInvitations();
        this.setupInvitationForm();
    }

    /**
     * Initialize patient dashboard
     */
    initializePatientDashboard() {
        this.loadPatientData();
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Logout functionality
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-logout]')) {
                this.handleLogout();
            }
        });

        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-nav]')) {
                this.handleNavigation(e.target.dataset.nav);
            }
        });
    }

    /**
     * Load user profile data
     */
    async loadUserProfile() {
        try {
            const profile = await window.apiClient.getProfile();
            this.updateUserInterface(profile);
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.showError('Failed to load user profile');
        }
    }

    /**
     * Update user interface with profile data
     */
    updateUserInterface(profile) {
        // Update user name in navigation
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = window.authManager.getDisplayName();
        });

        // Update user avatar
        const avatarElements = document.querySelectorAll('[data-user-avatar]');
        avatarElements.forEach(el => {
            el.src = window.authManager.getAvatarUrl();
        });

        // Update role-based navigation
        this.updateNavigation(profile);
    }

    /**
     * Update navigation based on user role
     */
    updateNavigation(profile) {
        const navItems = document.querySelectorAll('[data-nav-item]');
        navItems.forEach(item => {
            const requiredRole = item.dataset.requiredRole;
            const requiredPermission = item.dataset.requiredPermission;

            let shouldShow = true;

            if (requiredRole && !window.authManager.hasRole(requiredRole)) {
                shouldShow = false;
            }

            if (requiredPermission && !window.authManager.hasPermission(requiredPermission)) {
                shouldShow = false;
            }

            item.style.display = shouldShow ? 'block' : 'none';
        });
    }

    /**
     * Set up navigation
     */
    setupNavigation() {
        // Update active navigation item
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.replace('.html', ''))) {
                link.classList.add('text-primary-600', 'font-semibold');
                link.classList.remove('text-gray-500');
            }
        });
    }

    /**
     * Set up profile form
     */
    setupProfileForm() {
        const form = document.getElementById('profile-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProfileUpdate();
        });
    }

    /**
     * Handle profile update
     */
    async handleProfileUpdate() {
        const form = document.getElementById('profile-form');
        const formData = new FormData(form);

        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            title: formData.get('title'),
            phone_number: formData.get('phone_number')
        };

        try {
            await window.apiClient.updateProfile(profileData);
            this.showSuccess('Profile updated successfully');
            await this.loadUserProfile();
        } catch (error) {
            console.error('Profile update failed:', error);
            this.showError('Failed to update profile: ' + error.message);
        }
    }

    /**
     * Set up invitation form
     */
    setupInvitationForm() {
        const form = document.getElementById('invitation-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateInvitation();
        });
    }

    /**
     * Load invitations
     */
    async loadInvitations() {
        try {
            const invitations = await window.apiClient.getInvitations();
            this.displayInvitations(invitations);
        } catch (error) {
            console.error('Failed to load invitations:', error);
            this.showError('Failed to load invitations');
        }
    }

    /**
     * Display invitations in the UI
     */
    displayInvitations(invitations) {
        const container = document.getElementById('invitations-list');
        if (!container) return;

        if (invitations.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No invitations found</p>';
            return;
        }

        container.innerHTML = invitations.map(invitation => `
            <div class="bg-white shadow rounded-lg p-6 mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">${invitation.email}</h3>
                        <p class="text-sm text-gray-500">${invitation.suggested_first_name} ${invitation.suggested_last_name}</p>
                        <p class="text-sm text-gray-500">Role: ${invitation.role_name || 'Unknown'}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${invitation.is_used ? 'bg-green-100 text-green-800' :
                new Date(invitation.expires_at) < new Date() ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
            }">
                            ${invitation.is_used ? 'Used' :
                new Date(invitation.expires_at) < new Date() ? 'Expired' :
                    'Active'}
                        </span>
                        <button onclick="app.deleteInvitation(${invitation.id})" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Handle create invitation
     */
    async handleCreateInvitation() {
        const form = document.getElementById('invitation-form');
        const formData = new FormData(form);

        const invitationData = {
            email: formData.get('email'),
            role_id: parseInt(formData.get('role_id')),
            suggested_username: formData.get('suggested_username'),
            suggested_title: formData.get('suggested_title'),
            suggested_first_name: formData.get('suggested_first_name'),
            suggested_last_name: formData.get('suggested_last_name'),
            suggested_phone_number: formData.get('suggested_phone_number'),
            expires_in_days: parseInt(formData.get('expires_in_days'))
        };

        try {
            await window.apiClient.createInvitation(invitationData);
            this.showSuccess('Invitation created successfully');
            form.reset();
            await this.loadInvitations();
        } catch (error) {
            console.error('Create invitation failed:', error);
            this.showError('Failed to create invitation: ' + error.message);
        }
    }

    /**
     * Delete invitation
     */
    async deleteInvitation(invitationId) {
        if (!confirm('Are you sure you want to delete this invitation?')) {
            return;
        }

        try {
            await window.apiClient.deleteInvitation(invitationId);
            this.showSuccess('Invitation deleted successfully');
            await this.loadInvitations();
        } catch (error) {
            console.error('Delete invitation failed:', error);
            this.showError('Failed to delete invitation: ' + error.message);
        }
    }

    /**
     * Load patient data
     */
    async loadPatientData() {
        // Implement patient-specific data loading
        console.log('Loading patient data...');
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await window.apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            window.authManager.clearUserData();
            window.location.href = 'login.html';
        }
    }

    /**
     * Handle navigation
     */
    handleNavigation(page) {
        window.location.href = `${page}.html`;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message
     */
    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message-toast');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MelodeApp();
});

/**
 * Invitations page functionality
 */

function invitationsApp() {
    return {
        // User data
        userName: '',
        userAvatar: window.authManager ? window.authManager.generateAvatarPlaceholder('U', 32) : '',

        // Invitations data
        invitations: [],

        // Form data
        invitationData: {
            email: '',
            role_id: '',
            suggested_username: '',
            suggested_title: '',
            suggested_first_name: '',
            suggested_last_name: '',
            suggested_phone_number: '',
            expires_in_days: 7
        },

        // UI state
        isLoading: false,
        showCreateForm: false,
        showViewModal: false,
        selectedInvitation: null,

        /**
         * Initialize the invitations app
         */
        async init() {
            this.updateUserInterface();
            await this.loadInvitations();
            this.setupEventListeners();
        },

        /**
         * Update user interface
         */
        updateUserInterface() {
            this.userName = window.authManager.getDisplayName();
            this.userAvatar = window.authManager.getAvatarUrl();
        },

        /**
         * Set up event listeners
         */
        setupEventListeners() {
            // Create invitation form
            const form = document.getElementById('invitation-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleCreateInvitation();
                });
            }
        },

        /**
         * Load invitations from API
         */
        async loadInvitations() {
            try {
                this.invitations = await window.apiClient.getInvitations();
                this.displayInvitations();
            } catch (error) {
                console.error('Failed to load invitations:', error);
                this.showError('Failed to load invitations');
            }
        },

        /**
         * Display invitations in the UI
         */
        displayInvitations() {
            const container = document.getElementById('invitations-list');
            if (!container) return;

            if (this.invitations.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-envelope-open text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500">No invitations found</p>
                        <p class="text-sm text-gray-400 mt-2">Create your first invitation to get started</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.invitations.map(invitation => `
                <div class="bg-white border border-gray-200 rounded-lg p-6 mb-4 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <i class="fas fa-user text-gray-600"></i>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-lg font-medium text-gray-900">${invitation.email}</h3>
                                    <p class="text-sm text-gray-500">${invitation.suggested_first_name} ${invitation.suggested_last_name}</p>
                                    <p class="text-sm text-gray-500">Username: ${invitation.suggested_username}</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${invitation.is_used ? 'bg-green-100 text-green-800' :
                    new Date(invitation.expires_at) < new Date() ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                }">
                                ${invitation.is_used ? 'Used' :
                    new Date(invitation.expires_at) < new Date() ? 'Expired' :
                        'Active'}
                            </span>
                            <div class="flex space-x-2">
                                <button 
                                    onclick="app.viewInvitation(${invitation.id})" 
                                    class="text-primary-600 hover:text-primary-800 p-1"
                                    title="View details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button 
                                    onclick="app.deleteInvitation(${invitation.id})" 
                                    class="text-red-600 hover:text-red-800 p-1"
                                    title="Delete invitation">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 text-sm text-gray-500">
                        <p>Expires: ${new Date(invitation.expires_at).toLocaleDateString()}</p>
                        <p>Created: ${new Date(invitation.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            `).join('');
        },

        /**
         * Handle create invitation
         */
        async handleCreateInvitation() {
            this.isLoading = true;
            this.clearMessages();

            try {
                await window.apiClient.createInvitation(this.invitationData);
                this.showSuccess('Invitation created successfully');
                this.showCreateForm = false;
                this.resetForm();
                await this.loadInvitations();
            } catch (error) {
                console.error('Create invitation failed:', error);
                this.showError('Failed to create invitation: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * View invitation details
         */
        viewInvitation(invitationId) {
            const invitation = this.invitations.find(inv => inv.id === invitationId);
            if (invitation) {
                this.selectedInvitation = invitation;
                this.showViewModal = true;
            }
        },

        /**
         * Delete invitation
         */
        async deleteInvitation(invitationId) {
            if (!confirm('Are you sure you want to delete this invitation? This action cannot be undone.')) {
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
        },

        /**
         * Reset form
         */
        resetForm() {
            this.invitationData = {
                email: '',
                role_id: '',
                suggested_username: '',
                suggested_title: '',
                suggested_first_name: '',
                suggested_last_name: '',
                suggested_phone_number: '',
                expires_in_days: 7
            };
        },

        /**
         * Show success message
         */
        showSuccess(message) {
            this.showMessage(message, 'success');
        },

        /**
         * Show error message
         */
        showError(message) {
            this.showMessage(message, 'error');
        },

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
        },

        /**
         * Clear messages
         */
        clearMessages() {
            const existingMessages = document.querySelectorAll('.message-toast');
            existingMessages.forEach(msg => msg.remove());
        }
    };
}

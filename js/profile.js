/**
 * Profile page functionality
 */

function profileApp() {
    return {
        // User data
        user: {
            first_name: '',
            last_name: '',
            title: '',
            phone_number: '',
            email: '',
            username: ''
        },
        userName: '',
        userEmail: '',
        userUsername: '',
        userTitle: '',
        userAvatar: window.authManager ? window.authManager.generateAvatarPlaceholder('U', 32) : '',

        // Form data
        profileData: {
            bio: '',
            avatar_url: ''
        },
        passwordData: {
            current_password: '',
            new_password: '',
            confirm_password: ''
        },

        // UI state
        isLoading: false,
        passwordErrors: [],

        // MFA data
        mfaData: {
            is_enabled: false,
            backup_codes_remaining: 0
        },
        mfaSetup: {
            secret_key: '',
            qr_code_url: '',
            backup_codes: []
        },
        mfaVerificationToken: '',
        showMFASetupModal: false,
        showBackupCodesModal: false,
        backupCodes: [],

        /**
         * Initialize the profile app
         */
        async init() {
            await this.loadUserProfile();
            await this.loadMFAStatus();
            await this.loadCustomFields();
            this.setupEventListeners();
        },

        /**
         * Load user profile data
         */
        async loadUserProfile() {
            try {
                this.user = await window.apiClient.getProfile();
                this.updateUserInterface();
                this.populateForm();
            } catch (error) {
                console.error('Failed to load profile:', error);
                this.showError('Failed to load profile data');
            }
        },

        /**
         * Update user interface with profile data
         */
        updateUserInterface() {
            if (!this.user) return;

            this.userName = window.authManager.getDisplayName();
            this.userEmail = this.user.email;
            this.userUsername = this.user.username;
            this.userTitle = this.user.title || '';
            this.userAvatar = window.authManager.getAvatarUrl();
        },

        /**
         * Populate form with user data
         */
        populateForm() {
            if (!this.user) return;

            this.profileData = {
                bio: this.user.bio || '',
                avatar_url: this.user.avatar_url || ''
            };
        },

        /**
         * Load custom fields for the user
         */
        async loadCustomFields() {
            try {
                if (this.user && this.user.id) {
                    console.log('Loading custom fields for user ID:', this.user.id);
                    // Only initialize if not already initialized to prevent infinite loops
                    if (!window.customFieldsComponent.userId || window.customFieldsComponent.userId !== this.user.id) {
                        await window.customFieldsComponent.init(this.user.id);
                    }
                } else {
                    console.log('No user ID available for custom fields');
                }
            } catch (error) {
                console.error('Failed to load custom fields:', error);
                // Don't show error to user as custom fields are optional
            }
        },

        /**
         * Set up event listeners
         */
        setupEventListeners() {
            // Profile form submission
            const profileForm = document.getElementById('profile-form');
            if (profileForm) {
                profileForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleProfileUpdate();
                });
            }

            // Password form submission
            const passwordForm = document.getElementById('password-form');
            if (passwordForm) {
                passwordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handlePasswordChange();
                });
            }

            // Real-time password validation
            const newPasswordField = document.getElementById('new_password');
            if (newPasswordField) {
                newPasswordField.addEventListener('input', () => {
                    this.validatePassword();
                });
            }
        },

        /**
         * Handle profile update
         */
        async handleProfileUpdate() {
            this.isLoading = true;
            this.clearMessages();

            try {
                await window.apiClient.updateProfile(this.profileData);
                this.showSuccess('Profile updated successfully');
                await this.loadUserProfile();
            } catch (error) {
                console.error('Profile update failed:', error);
                this.showError('Failed to update profile: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Handle password change
         */
        async handlePasswordChange() {
            this.isLoading = true;
            this.clearMessages();

            // Validate passwords
            if (!this.validatePassword()) {
                this.isLoading = false;
                return;
            }

            if (this.passwordData.new_password !== this.passwordData.confirm_password) {
                this.showError('New passwords do not match');
                this.isLoading = false;
                return;
            }

            try {
                await window.apiClient.changePassword(
                    this.passwordData.current_password,
                    this.passwordData.new_password
                );
                this.showSuccess('Password changed successfully');
                this.passwordData = {
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                };
            } catch (error) {
                console.error('Password change failed:', error);
                this.showError('Failed to change password: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Validate password strength
         */
        validatePassword() {
            const password = this.passwordData.new_password;
            const validation = window.authManager.validatePassword(password);

            this.passwordErrors = validation.errors;
            return validation.isValid;
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
            messageDiv.className = `message-toast fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
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
        },

        /**
         * Load MFA status
         */
        async loadMFAStatus() {
            try {
                this.mfaData = await window.apiClient.getMfaStatus();
            } catch (error) {
                console.error('Failed to load MFA status:', error);
            }
        },

        /**
         * Setup MFA - initiate the setup process
         */
        async setupMFA() {
            this.isLoading = true;
            try {
                console.log('Setting up MFA...');
                this.mfaSetup = await window.apiClient.setupMfa();
                console.log('MFA setup response:', this.mfaSetup);
                console.log('Setting showMFASetupModal to true');
                this.showMFASetupModal = true;
                console.log('showMFASetupModal is now:', this.showMFASetupModal);
            } catch (error) {
                console.error('Failed to setup MFA:', error);
                this.showError('Failed to setup MFA: ' + (error.message || 'Unknown error'));
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Verify and enable MFA
         */
        async verifyAndEnableMFA() {
            if (!this.mfaVerificationToken || this.mfaVerificationToken.length !== 6) {
                this.showError('Please enter a valid 6-digit code');
                return;
            }

            this.isLoading = true;
            try {
                const result = await window.apiClient.verifyMfa(this.mfaVerificationToken);
                this.showSuccess(result.message || 'MFA enabled successfully');
                this.showMFASetupModal = false;
                this.mfaVerificationToken = '';
                await this.loadMFAStatus();
            } catch (error) {
                console.error('Failed to verify MFA:', error);
                this.showError('Failed to verify MFA');
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Disable MFA
         */
        async disableMFA() {
            if (!confirm('Are you sure you want to disable Multi-Factor Authentication? This will make your account less secure.')) {
                return;
            }

            const verificationToken = prompt('Please enter a 6-digit code from your authenticator app or a backup code:');
            if (!verificationToken) {
                return;
            }

            this.isLoading = true;
            try {
                const result = await window.apiClient.disableMfa(verificationToken);
                this.showSuccess(result.message || 'MFA disabled successfully');
                await this.loadMFAStatus();
            } catch (error) {
                console.error('Failed to disable MFA:', error);
                this.showError('Failed to disable MFA: ' + (error.message || 'Unknown error'));
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Regenerate backup codes
         */
        async regenerateBackupCodes() {
            if (!confirm('Are you sure you want to regenerate backup codes? Your old codes will no longer work.')) {
                return;
            }

            const verificationToken = prompt('Please enter a 6-digit code from your authenticator app:');
            if (!verificationToken) {
                return;
            }

            this.isLoading = true;
            try {
                const response = await window.AuthUtils.post('/mfa/backup-codes/regenerate', {
                    token: verificationToken
                });

                if (response.ok) {
                    const result = await response.json();
                    this.backupCodes = result.backup_codes;
                    this.showBackupCodesModal = true;
                    await this.loadMFAStatus();
                } else {
                    const error = await response.json();
                    this.showError(error.detail || 'Failed to regenerate backup codes');
                }
            } catch (error) {
                console.error('Failed to regenerate backup codes:', error);
                this.showError('Failed to regenerate backup codes');
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Copy backup codes to clipboard
         */
        copyBackupCodes() {
            let codesToCopy;
            if (this.showMFASetupModal && this.mfaSetup.backup_codes) {
                codesToCopy = this.mfaSetup.backup_codes;
            } else if (this.showBackupCodesModal && this.backupCodes) {
                codesToCopy = this.backupCodes;
            } else {
                return;
            }

            const codesText = codesToCopy.join('\n');

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(codesText).then(() => {
                    this.showSuccess('Backup codes copied to clipboard');
                }).catch(err => {
                    console.error('Failed to copy codes:', err);
                    this.showError('Failed to copy codes');
                });
            } else {
                // Fallback for browsers that don't support clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = codesText;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.showSuccess('Backup codes copied to clipboard');
                } catch (err) {
                    console.error('Failed to copy codes:', err);
                    this.showError('Failed to copy codes');
                }
                document.body.removeChild(textarea);
            }
        }
    };
}

/**
 * Login page functionality
 */

function loginApp() {
    return {
        // Form data
        loginForm: {
            email: '',
            password: '',
            mfa_token: '',
            remember_me: false
        },
        forgotPasswordForm: {
            email: ''
        },

        // UI state
        isLoading: false,
        showMfaField: false,
        showForgotPassword: false,
        errorMessage: '',
        successMessage: '',

        /**
         * Initialize the login app
         */
        init() {
            try {
                // Check if user is already logged in
                if (window.authManager && window.authManager.isAuthenticated) {
                    window.authManager.redirectToDashboard();
                }
            } catch (error) {
                console.error('Login initialization error:', error);
            }
        },

        /**
         * Handle login form submission
         */
        async handleLogin() {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            try {
                // Check if API client is available
                if (!window.apiClient) {
                    throw new Error('API client not available. Please refresh the page.');
                }

                const response = await window.apiClient.login(
                    this.loginForm.email,
                    this.loginForm.password,
                    this.loginForm.mfa_token || null
                );

                // Save user data
                if (window.authManager) {
                    window.authManager.saveUserData(response.user);
                }

                // Handle remember me logic
                if (this.loginForm.remember_me) {
                    // Set longer expiration for remember me
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + 30);
                    localStorage.setItem('session_expires', expirationDate.toISOString());
                }

                this.successMessage = 'Login successful! Redirecting...';

                // Redirect after short delay
                setTimeout(() => {
                    if (window.authManager) {
                        window.authManager.redirectToDashboard();
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);

            } catch (error) {
                console.error('Login failed:', error);

                // Handle MFA requirement
                const errorMsg = error.message.toLowerCase();
                if (errorMsg.includes('mfa token required') ||
                    errorMsg.includes('mfa required') ||
                    errorMsg.includes('multi-factor') ||
                    errorMsg.includes('invalid mfa token')) {
                    this.showMfaField = true;

                    if (errorMsg.includes('invalid mfa')) {
                        this.errorMessage = 'Invalid MFA token. Please check your authenticator app and try again.';
                    } else {
                        this.errorMessage = 'This account has MFA enabled. Please enter your verification code.';
                    }

                    // Focus the MFA input field after a short delay to ensure it's rendered
                    setTimeout(() => {
                        const mfaInput = this.$refs.mfaInput;
                        if (mfaInput) {
                            mfaInput.focus();
                        }
                    }, 100);
                } else {
                    this.errorMessage = error.message || 'Login failed. Please check your credentials.';
                }
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Handle forgot password
         */
        async handleForgotPassword() {
            this.isLoading = true;
            this.errorMessage = '';
            this.successMessage = '';

            try {
                if (!window.apiClient) {
                    throw new Error('API client not available. Please refresh the page.');
                }

                await window.apiClient.forgotPassword(this.forgotPasswordForm.email);
                this.successMessage = 'Password reset link sent to your email address.';
                this.showForgotPassword = false;
                this.forgotPasswordForm.email = '';
            } catch (error) {
                console.error('Forgot password failed:', error);
                this.errorMessage = error.message || 'Failed to send reset link. Please try again.';
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Clear error messages
         */
        clearMessages() {
            this.errorMessage = '';
            this.successMessage = '';
        },

    };
}

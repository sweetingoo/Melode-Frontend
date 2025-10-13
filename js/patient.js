/**
 * Patient dashboard functionality
 */

function patientApp() {
    return {
        // User data
        userName: '',
        userAvatar: 'https://via.placeholder.com/32',

        // Patient stats
        stats: {
            upcomingAppointments: 2,
            medicalRecords: 12,
            activeMedications: 3,
            notifications: 5
        },

        /**
         * Initialize the patient app
         */
        async init() {
            this.updateUserInterface();
            await this.loadPatientData();
            this.setupEventListeners();
            this.checkSessionValidity();
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
            // Check session validity every 5 minutes
            setInterval(() => {
                this.checkSessionValidity();
            }, 5 * 60 * 1000);
        },

        /**
         * Load patient data
         */
        async loadPatientData() {
            try {
                // Load patient-specific data from API
                // This would include appointments, medical records, etc.
                console.log('Loading patient data...');

                // Simulate loading patient stats
                await this.loadPatientStats();

            } catch (error) {
                console.error('Failed to load patient data:', error);
                this.showError('Failed to load patient data');
            }
        },

        /**
         * Load patient statistics
         */
        async loadPatientStats() {
            try {
                // This would be replaced with actual API calls
                // For now, we'll use mock data
                this.stats = {
                    upcomingAppointments: 2,
                    medicalRecords: 12,
                    activeMedications: 3,
                    notifications: 5
                };
            } catch (error) {
                console.error('Failed to load patient stats:', error);
            }
        },

        /**
         * Check session validity for 30-day patient sessions
         */
        checkSessionValidity() {
            const sessionExpires = localStorage.getItem('patient_session_expires');
            if (sessionExpires) {
                const expirationDate = new Date(sessionExpires);
                const now = new Date();

                if (now > expirationDate) {
                    // Session expired, redirect to login
                    this.showError('Your session has expired. Please log in again.');
                    setTimeout(() => {
                        window.authManager.clearUserData();
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    // Show remaining time
                    const remainingDays = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
                    console.log(`Patient session valid for ${remainingDays} more days`);
                }
            }
        },

        /**
         * Book new appointment
         */
        async bookAppointment() {
            try {
                // This would open a booking modal or redirect to booking page
                console.log('Opening appointment booking...');
                this.showSuccess('Redirecting to appointment booking...');
            } catch (error) {
                console.error('Failed to book appointment:', error);
                this.showError('Failed to book appointment');
            }
        },

        /**
         * View medical records
         */
        async viewMedicalRecords() {
            try {
                // This would open medical records view
                console.log('Opening medical records...');
                this.showSuccess('Opening medical records...');
            } catch (error) {
                console.error('Failed to load medical records:', error);
                this.showError('Failed to load medical records');
            }
        },

        /**
         * View medications
         */
        async viewMedications() {
            try {
                // This would open medications view
                console.log('Opening medications...');
                this.showSuccess('Opening medications...');
            } catch (error) {
                console.error('Failed to load medications:', error);
                this.showError('Failed to load medications');
            }
        },

        /**
         * Update patient profile
         */
        async updateProfile() {
            try {
                // This would open profile update form
                console.log('Opening profile update...');
                this.showSuccess('Opening profile update...');
            } catch (error) {
                console.error('Failed to open profile update:', error);
                this.showError('Failed to open profile update');
            }
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
        }
    };
}

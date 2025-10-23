/**
 * API Integration Layer for Melode Frontend
 * Handles all communication with the FastAPI backend
 */

class ApiClient {
    constructor() {
        // Get API base URL from config (requires config.js to be loaded first)
        this.baseURL = window.getApiBaseUrl ? window.getApiBaseUrl() : 'http://127.0.0.1:8000/api/v1';
        this.token = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    /**
     * Set authentication tokens
     */
    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }

    /**
     * Clear authentication tokens
     */
    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    }

    /**
     * Get authorization headers
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Get authorization headers for FormData (no Content-Type)
     */
    getAuthHeadersForFormData() {
        const headers = {};

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make HTTP request with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // Handle FormData differently - don't set Content-Type for FormData
        const isFormData = options.body instanceof FormData;
        const headers = isFormData ? this.getAuthHeadersForFormData() : this.getAuthHeaders();

        const config = {
            headers: {
                ...headers,
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            // Handle token refresh if needed
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the original request with new token
                    const retryHeaders = isFormData ? this.getAuthHeadersForFormData() : this.getAuthHeaders();
                    config.headers = {
                        ...retryHeaders,
                        ...options.headers,
                    };
                    const retryResponse = await fetch(url, config);
                    return this.handleResponse(retryResponse);
                }
            }

            return this.handleResponse(response);
        } catch (error) {
            console.error('API request failed:', error);
            throw new Error('Network error. Please check your connection.');
        }
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);

            // Use ErrorHandler if available, otherwise fallback to simple error
            if (window.ErrorHandler) {
                const message = window.ErrorHandler.parseApiError(errorData);
                const error = new Error(message);
                error.status = response.status;
                error.data = errorData;
                error.fieldErrors = window.ErrorHandler.getFieldErrors(errorData);
                throw error;
            } else {
                // Fallback if ErrorHandler not loaded
                const message = errorData?.detail || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
            }
        }

        return response.json();
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.setTokens(data.access_token, data.refresh_token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        this.clearTokens();
        return false;
    }

    // Authentication endpoints
    async login(email, password, mfaToken = null) {
        const data = { email, password };
        if (mfaToken) data.mfa_token = mfaToken;

        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        this.setTokens(response.access_token, response.refresh_token);
        return response;
    }

    async signup(invitationToken, password) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ invitation_token: invitationToken, password }),
        });
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword }),
        });
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.clearTokens();
        }
    }

    // Profile endpoints
    async getProfile() {
        return this.request('/profile/me');
    }

    async updateProfile(profileData) {
        return this.request('/profile/me', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/profile/change-password', {
            method: 'POST',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });
    }

    // Custom Fields endpoints
    async getCustomFieldsHierarchy(entityType, entityId) {
        return this.request(`/settings/entities/${entityType}/${entityId}/custom-fields/hierarchy`);
    }

    async getUserCustomFields(entityType, entityId) {
        return this.request(`/settings/entities/${entityType}/${entityId}/custom-fields`);
    }

    async setCustomFieldValue(entityType, entityId, fieldId, value, groupEntryId = null) {
        // The API expects value_data to be a dictionary, so we wrap the value
        const body = { value_data: value };
        if (groupEntryId) {
            body.group_entry_id = groupEntryId;
        }
        return this.request(`/settings/entities/${entityType}/${entityId}/custom-fields/${fieldId}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    async bulkUpdateCustomFields(entityType, entityId, values) {
        return this.request(`/settings/entities/${entityType}/${entityId}/custom-fields/bulk`, {
            method: 'PUT',
            body: JSON.stringify({ values }),
        });
    }

    async createGroupEntry(userId, entryData) {
        return this.request(`/settings/users/${userId}/group-entries`, {
            method: 'POST',
            body: JSON.stringify(entryData),
        });
    }

    async deleteGroupEntry(entryId) {
        return this.request(`/settings/group-entries/${entryId}`, {
            method: 'DELETE',
        });
    }

    async uploadCustomFieldFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Use the request method to ensure proper authentication and token refresh
        return this.request('/settings/files/upload', {
            method: 'POST',
            body: formData,
        });
    }

    async downloadCustomFieldFile(fileId) {
        return this.request(`/settings/files/${fileId}/download`);
    }

    // Invitation endpoints
    async getInvitations() {
        return this.request('/invitations/');
    }

    async getInvitation(invitationId) {
        return this.request(`/invitations/${invitationId}`);
    }

    async createInvitation(invitationData) {
        return this.request('/invitations/', {
            method: 'POST',
            body: JSON.stringify(invitationData),
        });
    }

    async deleteInvitation(invitationId) {
        return this.request(`/invitations/${invitationId}`, {
            method: 'DELETE',
        });
    }

    async validateInvitation(token) {
        return this.request(`/invitations/validate/${token}`);
    }

    // MFA endpoints
    async getMfaStatus() {
        return this.request('/mfa/status');
    }

    async setupMfa() {
        return this.request('/mfa/setup', {
            method: 'POST',
            body: JSON.stringify({})
        });
    }

    async verifyMfa(token) {
        return this.request('/mfa/verify', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async disableMfa(token) {
        return this.request('/mfa/disable', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create global API client instance
window.apiClient = new ApiClient();

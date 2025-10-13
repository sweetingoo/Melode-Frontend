/**
 * Error Handler Utility
 * Handles structured validation errors from FastAPI/Pydantic
 */

const ErrorHandler = {
    /**
     * Parse API error response and return user-friendly message
     * Handles both simple string errors and structured validation errors
     * 
     * @param {object} errorData - The error response from the API
     * @returns {string} User-friendly error message
     */
    parseApiError(errorData) {
        if (!errorData) {
            return 'An unexpected error occurred. Please try again.';
        }

        // Handle structured validation errors (array format)
        if (Array.isArray(errorData.detail)) {
            return this.parseValidationErrors(errorData.detail);
        }

        // Handle simple string error
        if (typeof errorData.detail === 'string') {
            return errorData.detail;
        }

        // Handle object with message
        if (errorData.message) {
            return errorData.message;
        }

        // Fallback
        return 'An error occurred. Please check your input and try again.';
    },

    /**
     * Parse validation errors from FastAPI/Pydantic
     * 
     * @param {array} errors - Array of validation error objects
     * @returns {string} Formatted error message
     */
    parseValidationErrors(errors) {
        if (!errors || errors.length === 0) {
            return 'Validation failed. Please check your input.';
        }

        // If single error, return a simple message
        if (errors.length === 1) {
            const error = errors[0];
            return this.formatValidationError(error);
        }

        // Multiple errors - format as list
        const errorMessages = errors.map(error => this.formatValidationError(error));
        return 'Please fix the following errors:\n• ' + errorMessages.join('\n• ');
    },

    /**
     * Format a single validation error
     * 
     * @param {object} error - Single validation error object
     * @returns {string} Formatted error message
     */
    formatValidationError(error) {
        const fieldName = this.getFieldName(error.loc);
        const message = error.msg || 'Invalid value';

        // Remove redundant prefixes from the message
        const cleanMessage = message
            .replace(/^Value error,?\s*/i, '')
            .replace(/^String should\s+/i, '')
            .replace(/^Input should be\s+/i, '');

        return `${fieldName}: ${cleanMessage}`;
    },

    /**
     * Extract field name from error location array
     * 
     * @param {array} loc - Error location array (e.g., ['body', 'suggested_phone_number'])
     * @returns {string} Human-readable field name
     */
    getFieldName(loc) {
        if (!loc || loc.length === 0) {
            return 'Field';
        }

        // Get the last item (actual field name)
        const fieldKey = loc[loc.length - 1];

        // Convert snake_case to Title Case
        return fieldKey
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    /**
     * Get field-specific errors for inline display
     * 
     * @param {object} errorData - The error response from the API
     * @returns {object} Map of field names to error messages
     */
    getFieldErrors(errorData) {
        const fieldErrors = {};

        if (errorData && Array.isArray(errorData.detail)) {
            errorData.detail.forEach(error => {
                if (error.loc && error.loc.length > 0) {
                    const fieldKey = error.loc[error.loc.length - 1];
                    const message = error.msg || 'Invalid value';
                    const cleanMessage = message.replace(/^Value error,?\s*/i, '');
                    fieldErrors[fieldKey] = cleanMessage;
                }
            });
        }

        return fieldErrors;
    },

    /**
     * Display error message in a toast/alert
     * 
     * @param {string} message - Error message to display
     * @param {string} type - Type of alert ('error', 'warning', 'info')
     */
    showError(message, type = 'error') {
        // Check if there's a custom error display element
        const errorElement = document.getElementById('global-error-message');

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.className = `alert alert-${type} show`;

            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorElement.className = `alert alert-${type}`;
            }, 5000);
        } else {
            // Fallback to alert
            alert(message);
        }
    },

    /**
     * Handle API response errors
     * 
     * @param {Response} response - Fetch API response object
     * @returns {Promise<never>} Throws an error with parsed message
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const message = this.parseApiError(errorData);

            const error = new Error(message);
            error.status = response.status;
            error.statusText = response.statusText;
            error.data = errorData;
            error.fieldErrors = this.getFieldErrors(errorData);

            throw error;
        }

        return response.json();
    }
};

// Make it available globally
window.ErrorHandler = ErrorHandler;


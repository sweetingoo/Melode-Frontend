/**
 * Utility function to extract error messages from API error responses
 * Handles various error response formats:
 * - { detail: "Error message" } (string)
 * - { detail: [{ msg: "Error", loc: [...] }] } (array)
 * - { message: "Error message" }
 * - { errors: { field: "Error" } }
 * 
 * @param {Error} error - The error object from axios/API call
 * @param {string} defaultMessage - Default message if no error message found
 * @returns {string} - The extracted error message
 */
export const extractErrorMessage = (error, defaultMessage = "An error occurred") => {
  if (!error?.response?.data) {
    return defaultMessage;
  }

  const errorData = error.response.data;

  // Handle detail as string (e.g., { detail: "Parent Job Role must have a department assigned" })
  if (errorData.detail && typeof errorData.detail === "string") {
    return errorData.detail;
  }

  // Handle detail as array (validation errors)
  if (errorData.detail && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
    // Get the first error message
    const firstError = errorData.detail[0];
    if (firstError.msg) {
      return firstError.msg;
    }
    // Fallback to string representation if msg doesn't exist
    if (typeof firstError === "string") {
      return firstError;
    }
  }

  // Handle message field
  if (errorData.message) {
    return errorData.message;
  }

  // Handle errors object (old format)
  if (errorData.errors) {
    if (typeof errorData.errors === "string") {
      return errorData.errors;
    }
    if (typeof errorData.errors === "object") {
      const errorMessages = Object.values(errorData.errors).flat();
      if (errorMessages.length > 0) {
        return errorMessages[0];
      }
    }
  }

  // Fallback to default message
  return defaultMessage;
};

/**
 * Extract multiple error messages (for validation errors with multiple fields)
 * @param {Error} error - The error object from axios/API call
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const extractValidationErrors = (error) => {
  const validationErrors = {};

  if (!error?.response?.data) {
    return validationErrors;
  }

  const errorData = error.response.data;

  // Handle detail as array (validation errors with field locations)
  if (errorData.detail && Array.isArray(errorData.detail)) {
    errorData.detail.forEach((errorItem) => {
      if (errorItem.loc && errorItem.loc.length > 1) {
        // Extract field name from location array (skip 'body' and get the field name)
        const fieldName = errorItem.loc[errorItem.loc.length - 1];
        validationErrors[fieldName] = errorItem.msg || errorItem.message || "Invalid value";
      } else if (errorItem.msg) {
        // If no location, use as general error
        validationErrors._general = errorItem.msg;
      }
    });
  }

  // Handle errors object (old format)
  if (errorData.errors && typeof errorData.errors === "object") {
    Object.assign(validationErrors, errorData.errors);
  }

  // Handle single detail string as general error
  if (errorData.detail && typeof errorData.detail === "string" && Object.keys(validationErrors).length === 0) {
    validationErrors._general = errorData.detail;
  }

  // Handle message field as general error if no other errors found
  if (errorData.message && Object.keys(validationErrors).length === 0) {
    validationErrors._general = errorData.message;
  }

  return validationErrors;
};

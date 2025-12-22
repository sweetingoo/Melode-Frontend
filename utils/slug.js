/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to convert to slug
 * @returns {string} - The slug
 */
export function generateSlug(text) {
    if (!text) return '';

    return text
        .toString()
        .toLowerCase()
        .trim()
        // Replace spaces with hyphens
        .replace(/\s+/g, '-')
        // Remove special characters except hyphens
        .replace(/[^\w\-]+/g, '')
        // Replace multiple hyphens with single hyphen
        .replace(/\-\-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Validate if a string is a valid slug format
 * @param {string} slug - The slug to validate
 * @returns {boolean} - True if valid slug format
 */
export function isValidSlug(slug) {
    if (!slug) return false;
    // Slug should only contain lowercase letters, numbers, and hyphens
    // Should not start or end with hyphen
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}


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

/**
 * Humanize a status value for display (e.g. "in_progress" → "In Progress").
 * Leaves already human-readable strings unchanged (e.g. "Awaiting Triage").
 * @param {string} status - The status value (may be snake_case or human-readable)
 * @returns {string} - Display label for end users
 */
export function humanizeStatusForDisplay(status) {
    if (status == null || typeof status !== 'string') return String(status ?? '');
    const s = status.trim();
    if (!s) return s;
    // If snake_case (contains underscore and all lowercase), humanize
    if (s.includes('_') && s === s.toLowerCase()) {
        return s.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return s;
}


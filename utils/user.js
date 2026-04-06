/**
 * User display helpers. Safe for full users, GET /users minimal rows, and GET /users/suggest rows.
 * Suggest includes optional `email`; minimal list users do not.
 */

/**
 * Get display name for a user from the list API (full or minimal response).
 * Prefer display_name so minimal response works everywhere.
 * @param {Object} user - User object (full or minimal from GET /users)
 * @returns {string}
 */
export function getUserDisplayName(user) {
  if (!user) return "";
  return (
    user.display_name ||
    (user.first_name || user.last_name
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "") ||
    user.email ||
    user.username ||
    (user.id != null ? `User #${user.id}` : "")
  );
}

/**
 * Check if a user object looks like minimal (no email/first_name/last_name).
 * Useful when search/filter by email is needed (minimal has no email).
 */
export function isMinimalUser(user) {
  return user && user.id != null && user.display_name != null && user.email == null;
}

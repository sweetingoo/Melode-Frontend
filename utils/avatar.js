import { filesService } from "@/services/files";

/**
 * Extract file reference from avatar value (URL or reference)
 * @param {string|number} value - Avatar URL or file reference
 * @returns {string|number|null} File reference (slug or ID) or null
 */
export function extractAvatarFileReference(value) {
  if (!value) return null;
  
  // If it's already a file reference (not a URL), return it
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // If it doesn't start with http, it's likely a file reference
    if (!value.startsWith('http')) {
      return value;
    }
    
    // If it's a URL, try to extract file reference
    try {
      const url = new URL(value);
      // Check if it's a file API endpoint: /files/{slug}/download or /files/{id}/download
      const match = url.pathname.match(/\/files\/([^\/]+)\/(download|url)/);
      if (match) {
        return match[1]; // Return the slug or ID
      }
    } catch {
      // Not a valid URL, might be a direct reference
      return value;
    }
  }
  
  return null;
}

/**
 * Get fresh avatar URL from file reference
 * @param {string|number|null} fileReference - File reference (slug or ID)
 * @returns {Promise<string|null>} Fresh pre-signed URL or null
 */
export async function getAvatarUrl(fileReference) {
  if (!fileReference) return null;
  
  try {
    const response = await filesService.getFileUrl(fileReference);
    return response?.url || null;
  } catch (error) {
    console.error('Failed to get avatar URL:', error);
    return null;
  }
}

/**
 * YouTube URL utility functions
 */

/**
 * Convert various YouTube URL formats to embed URL
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * 
 * @param {string} url - YouTube URL in any format
 * @returns {string|null} - Embed URL or null if invalid
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;

  let videoId = null;

  // Check if already an embed URL
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) {
    videoId = embedMatch[1];
  } else {
    // Extract video ID from watch URL
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    } else {
      // Extract from youtu.be short URL
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch) {
        videoId = shortMatch[1];
      } else {
        // Extract from /v/ URL
        const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/);
        if (vMatch) {
          videoId = vMatch[1];
        }
      }
    }
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return null;
};

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
export const getYouTubeVideoId = (url) => {
  if (!url) return null;

  const embedUrl = getYouTubeEmbedUrl(url);
  if (embedUrl) {
    const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  return null;
};

/**
 * Validate YouTube URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
export const isValidYouTubeUrl = (url) => {
  if (!url) return false;
  return getYouTubeEmbedUrl(url) !== null;
};

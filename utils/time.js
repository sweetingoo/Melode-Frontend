/**
 * Utility functions for time formatting and calculations
 */

/**
 * Parse a time string, handling timezone issues
 * If the string is ISO format without timezone, treat it as UTC
 */
export const parseTime = (timeString) => {
  if (!timeString) return null;

  if (typeof timeString === 'string') {
    // If the string is ISO format without timezone indicator, treat it as UTC
    if (timeString.includes('T') && !timeString.endsWith('Z') && !timeString.includes('+') && !timeString.match(/[+-]\d{2}:\d{2}$/)) {
      return new Date(timeString + 'Z');
    }
    return new Date(timeString);
  }

  return new Date(timeString);
};

/**
 * Format elapsed time in a human-readable format (days, hours, minutes)
 * @param {string|Date} clockInTime - The clock-in time
 * @returns {string} Formatted elapsed time (e.g., "5h 30m", "1d 5h 20m", "30m")
 */
export const formatElapsedTime = (clockInTime) => {
  if (!clockInTime) return "0m";

  const clockIn = parseTime(clockInTime);
  if (!clockIn || isNaN(clockIn.getTime())) return "0m";

  const now = new Date();
  const diffMs = now.getTime() - clockIn.getTime();

  if (diffMs < 0) return "0m"; // Negative time means future, return 0

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const parts = [];

  if (diffDays > 0) {
    parts.push(`${diffDays}d`);
  }

  const remainingHours = diffHours % 24;
  if (remainingHours > 0 || diffDays > 0) {
    parts.push(`${remainingHours}h`);
  }

  const remainingMinutes = diffMinutes % 60;
  if (remainingMinutes > 0 || parts.length === 0) {
    parts.push(`${remainingMinutes}m`);
  }

  return parts.join(' ') || '0m';
};

/**
 * Format elapsed time as HH:mm:ss (for timer displays)
 * @param {string|Date} clockInTime - The clock-in time
 * @returns {string} Formatted elapsed time (e.g., "05:30:45")
 */
export const formatElapsedTimeHHMMSS = (clockInTime) => {
  if (!clockInTime) return "00:00:00";

  const clockIn = parseTime(clockInTime);
  if (!clockIn || isNaN(clockIn.getTime())) return "00:00:00";

  const now = new Date();
  const diffMs = now.getTime() - clockIn.getTime();

  if (diffMs < 0) return "00:00:00"; // Negative time means future, return 0

  const diffSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Calculate elapsed hours (for comparisons and warnings)
 * @param {string|Date} clockInTime - The clock-in time
 * @returns {number} Elapsed hours as a decimal
 */
export const calculateElapsedHours = (clockInTime) => {
  if (!clockInTime) return 0;

  const clockIn = parseTime(clockInTime);
  if (!clockIn || isNaN(clockIn.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - clockIn.getTime();

  if (diffMs < 0) return 0; // Negative time means future, return 0

  return diffMs / (1000 * 60 * 60);
};

/**
 * Combine a date and time string into a Date object in the user's local timezone
 * @param {Date} date - The date object
 * @param {string} timeString - Time string in HH:mm format (e.g., "14:30")
 * @returns {Date} Date object with the combined date and time in local timezone
 */
export const combineDateAndTime = (date, timeString) => {
  if (!date || !timeString) return null;

  const [hours, minutes] = timeString.split(':').map(Number);
  const combinedDate = new Date(date);
  combinedDate.setHours(hours || 0, minutes || 0, 0, 0);
  return combinedDate;
};

/**
 * Format a date and time for API requests as ISO string in local timezone
 * This ensures the API receives the correct date/time without timezone shifts
 * @param {Date} date - The date object
 * @param {string} timeString - Time string in HH:mm format (e.g., "14:30")
 * @returns {string} ISO string formatted for API (YYYY-MM-DDTHH:mm:ss)
 */
export const formatDateTimeForAPI = (date, timeString) => {
  if (!date) return null;

  const combined = combineDateAndTime(date, timeString || "00:00");
  if (!combined) return null;

  // Format as YYYY-MM-DDTHH:mm:ss (local timezone, no Z suffix)
  // The API should interpret this in the user's timezone context
  const year = combined.getFullYear();
  const month = String(combined.getMonth() + 1).padStart(2, '0');
  const day = String(combined.getDate()).padStart(2, '0');
  const hours = String(combined.getHours()).padStart(2, '0');
  const minutes = String(combined.getMinutes()).padStart(2, '0');
  const seconds = String(combined.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Format a date for API requests (date only, no time)
 * This ensures we use the date in the user's local timezone to prevent day shifts
 * @param {Date} date - The date object
 * @returns {string} Date string in YYYY-MM-DD format (local timezone)
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;

  // Use local date components to ensure we get the correct date
  // regardless of timezone interpretation by the API
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Format date and time as a single ISO string with timezone offset
 * This is the most reliable way to send datetime to APIs
 * @param {Date} date - The date object
 * @param {string} timeString - Time string in HH:mm format (e.g., "14:30")
 * @returns {string} ISO string with timezone offset (e.g., "2025-12-17T14:30:00-08:00")
 */
export const formatDateTimeISOWithOffset = (date, timeString) => {
  if (!date) return null;

  const combined = combineDateAndTime(date, timeString || "00:00");
  if (!combined) return null;

  // Get timezone offset in minutes
  const offsetMs = combined.getTimezoneOffset() * 60 * 1000;
  const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
  const offsetMinutes = Math.floor((Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000));
  const offsetSign = offsetMs <= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  // Format as ISO string with timezone offset
  const year = combined.getFullYear();
  const month = String(combined.getMonth() + 1).padStart(2, '0');
  const day = String(combined.getDate()).padStart(2, '0');
  const hours = String(combined.getHours()).padStart(2, '0');
  const minutes = String(combined.getMinutes()).padStart(2, '0');
  const seconds = String(combined.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
};

/**
 * Adjust a date to account for timezone offset when API interprets dates as UTC
 * This is a workaround for APIs that interpret date-only strings as UTC
 * 
 * The issue: When backend combines end_date="2025-12-17" and end_time="23:59" and interprets as UTC,
 * it becomes 2025-12-17T23:59:00Z. In a timezone behind UTC (e.g., PST, UTC-8), this is actually
 * 2025-12-17T15:59:00 local time, which doesn't include the full day.
 * 
 * Solution: For end dates, if user is behind UTC, add a day so UTC interpretation covers full selected day.
 * For start dates, if user is ahead of UTC, subtract a day.
 * 
 * @param {Date} date - The date object in local timezone
 * @param {boolean} isEndDate - If true, adjusts for end of day; if false, adjusts for start of day
 * @returns {Date} Adjusted date that will be correct when interpreted as UTC
 */
export const adjustDateForUTCInterpretation = (date, isEndDate = false) => {
  if (!date) return null;

  // getTimezoneOffset() returns offset in minutes
  // Positive value means behind UTC (e.g., EST = UTC-5 returns 300)
  // Negative value means ahead of UTC (e.g., JST = UTC+9 returns -540)
  const offsetMinutes = date.getTimezoneOffset();
  const offsetHours = offsetMinutes / 60;

  // If offset is 0 (UTC), no adjustment needed
  if (offsetHours === 0) {
    return new Date(date);
  }

  const adjustedDate = new Date(date);

  if (offsetHours > 0) {
    // User is behind UTC (e.g., EST = UTC-5, offsetHours = 5)
    // When backend interprets dates as UTC, they appear earlier in user's local time
    // Example: User selects Dec 17, backend interprets as Dec 17 00:00 UTC = Dec 16 19:00 EST
    // For end date: Add a day so when backend interprets as UTC, it covers the full selected day in local time
    // Example: User wants Dec 17, send Dec 18, backend sees Dec 18 23:59 UTC = Dec 17 18:59 EST (covers full Dec 17)
    if (isEndDate) {
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    }
    // For start date behind UTC: No adjustment needed - backend will interpret start_date as UTC midnight
    // which is the previous day in local time, but that's actually what we want for start of day filtering
  } else if (offsetHours < 0) {
    // User is ahead of UTC (e.g., JST = UTC+9, offsetHours = -9)
    // When backend interprets dates as UTC, they appear later in user's local time
    // For start date: Subtract a day so when backend interprets as UTC, it covers the selected day in local time
    if (!isEndDate) {
      adjustedDate.setDate(adjustedDate.getDate() - 1);
    }
    // For end date ahead of UTC: No adjustment needed typically
  }

  return adjustedDate;
};

/**
 * Create a date at the start of day (00:00:00) in local timezone
 * @param {Date} date - The date object
 * @returns {Date} Date object set to start of day
 */
export const startOfDay = (date) => {
  if (!date) return null;
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Create a date at the end of day (23:59:59) in local timezone
 * @param {Date} date - The date object
 * @returns {Date} Date object set to end of day
 */
export const endOfDay = (date) => {
  if (!date) return null;
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

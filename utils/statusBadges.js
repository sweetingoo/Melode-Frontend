/**
 * Standardized status badge utilities
 * Provides consistent styling for status badges across the application
 */

/**
 * Get standardized status color classes
 * Returns className string with consistent pattern: bg-{color}-500/10 text-{color}-600 border-{color}-500/20
 * 
 * @param {string} status - The status value
 * @returns {string} - Tailwind CSS classes for the status badge
 */
export const getStatusColor = (status) => {
  if (!status) return "bg-muted text-muted-foreground border-muted";

  const statusLower = status.toLowerCase().trim();

  // Common status mappings
  const statusMap = {
    // Active/Enabled states
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    enabled: "bg-green-500/10 text-green-600 border-green-500/20",
    online: "bg-green-500/10 text-green-600 border-green-500/20",
    running: "bg-green-500/10 text-green-600 border-green-500/20",
    live: "bg-green-500/10 text-green-600 border-green-500/20",
    
    // Inactive/Disabled states
    inactive: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    disabled: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    offline: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    stopped: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    
    // Completed/Success states
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    done: "bg-green-500/10 text-green-600 border-green-500/20",
    finished: "bg-green-500/10 text-green-600 border-green-500/20",
    success: "bg-green-500/10 text-green-600 border-green-500/20",
    approved: "bg-green-500/10 text-green-600 border-green-500/20",
    resolved: "bg-green-500/10 text-green-600 border-green-500/20",
    compliant: "bg-green-500/10 text-green-600 border-green-500/20",
    
    // In Progress/Working states
    "in_progress": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "in progress": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    working: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    submitted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    reviewed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    
    // Pending/Waiting states
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    waiting: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    queued: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    scheduled: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    open: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    new: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    
    // Error/Failed/Rejected states
    failed: "bg-red-500/10 text-red-600 border-red-500/20",
    error: "bg-red-500/10 text-red-600 border-red-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    declined: "bg-red-500/10 text-red-600 border-red-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
    canceled: "bg-red-500/10 text-red-600 border-red-500/20",
    expired: "bg-red-500/10 text-red-600 border-red-500/20",
    overdue: "bg-red-500/10 text-red-600 border-red-500/20",
    
    // Warning/Attention states
    warning: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    maintenance: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    hold: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    blocked: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    "on_break": "bg-orange-500/10 text-orange-600 border-orange-500/20",
    "on break": "bg-orange-500/10 text-orange-600 border-orange-500/20",
    
    // Archived/Closed states
    archived: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    closed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    deleted: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };

  // Direct match
  if (statusMap[statusLower]) {
    return statusMap[statusLower];
  }

  // Keyword-based matching for custom statuses
  if (statusLower.includes("active") || statusLower.includes("enabled") || statusLower.includes("running")) {
    return "bg-green-500/10 text-green-600 border-green-500/20";
  }
  if (statusLower.includes("completed") || statusLower.includes("done") || statusLower.includes("finished") || 
      statusLower.includes("resolved") || statusLower.includes("approved") || statusLower.includes("success")) {
    return "bg-green-500/10 text-green-600 border-green-500/20";
  }
  if (statusLower.includes("progress") || statusLower.includes("working") || statusLower.includes("processing") ||
      statusLower.includes("submitted") || statusLower.includes("reviewed")) {
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  }
  if (statusLower.includes("pending") || statusLower.includes("waiting") || statusLower.includes("queued") ||
      statusLower.includes("draft") || statusLower.includes("open") || statusLower.includes("new")) {
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  }
  if (statusLower.includes("failed") || statusLower.includes("error") || statusLower.includes("rejected") ||
      statusLower.includes("declined") || statusLower.includes("cancelled") || statusLower.includes("canceled") ||
      statusLower.includes("expired") || statusLower.includes("overdue")) {
    return "bg-red-500/10 text-red-600 border-red-500/20";
  }
  if (statusLower.includes("warning") || statusLower.includes("maintenance") || statusLower.includes("hold") ||
      statusLower.includes("blocked") || statusLower.includes("break")) {
    return "bg-orange-500/10 text-orange-600 border-orange-500/20";
  }
  if (statusLower.includes("archived") || statusLower.includes("closed") || statusLower.includes("deleted") ||
      statusLower.includes("inactive") || statusLower.includes("disabled")) {
    return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }

  // Default fallback
  return "bg-muted text-muted-foreground border-muted";
};

/**
 * Get priority color classes
 * @param {string} priority - The priority value
 * @returns {string} - Tailwind CSS classes for the priority badge
 */
export const getPriorityColor = (priority) => {
  if (!priority) return "bg-muted text-muted-foreground border-muted";

  const priorityLower = priority.toLowerCase().trim();

  const priorityMap = {
    high: "bg-red-500/10 text-red-600 border-red-500/20",
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
    urgent: "bg-red-500/10 text-red-600 border-red-500/20",
    medium: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    normal: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    low: "bg-green-500/10 text-green-600 border-green-500/20",
  };

  if (priorityMap[priorityLower]) {
    return priorityMap[priorityLower];
  }

  // Keyword matching
  if (priorityLower.includes("high") || priorityLower.includes("critical") || priorityLower.includes("urgent")) {
    return "bg-red-500/10 text-red-600 border-red-500/20";
  }
  if (priorityLower.includes("medium") || priorityLower.includes("normal")) {
    return "bg-orange-500/10 text-orange-600 border-orange-500/20";
  }
  if (priorityLower.includes("low")) {
    return "bg-green-500/10 text-green-600 border-green-500/20";
  }

  return "bg-muted text-muted-foreground border-muted";
};

/**
 * Format status text for display
 * Converts status values to human-readable format
 * 
 * @param {string} status - The status value
 * @returns {string} - Formatted status text
 */
export const formatStatusText = (status) => {
  if (!status) return "N/A";

  // Handle common patterns
  const formatted = status
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formatted;
};

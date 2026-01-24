/**
 * Utility function to determine if a date field should show time based on field label/name
 * @param {string|object} field - Field object with field_label/name/label or just the label string
 * @returns {boolean} - True if time should be shown, false otherwise
 */
export const shouldShowTimeForDateField = (field) => {
  // Handle both string and object inputs
  const fieldLabel = typeof field === 'string' 
    ? field 
    : (field?.field_label || field?.label || field?.name || field?.field_name || '').toLowerCase();
  
  if (!fieldLabel) return false;
  
  // Normalize the label: replace underscores and handle camelCase
  const normalizedLabel = fieldLabel
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // Handle camelCase
    .toLowerCase();
  
  const timeKeywords = [
    'time', 'timestamp', 'at', 'when', 'created', 'updated', 'modified', 
    'last modified', 'last updated', 'datetime', 'date and time'
  ];
  
  const noTimeKeywords = [
    'birth', 'date of birth', 'dob', 'anniversary', 'start date', 
    'end date', 'due date', 'deadline', 'date of issue', 'date of expiry',
    'date of registration', 'date of vaccination', 'date of assessment',
    'next review date', 'next due date', 'renewal date', 'expiry date'
  ];
  
  // Check for explicit no-time keywords first (takes priority)
  // Check both original and normalized label
  const hasNoTimeKeyword = noTimeKeywords.some(keyword => 
    fieldLabel.includes(keyword) || normalizedLabel.includes(keyword)
  );
  
  if (hasNoTimeKeyword) {
    return false;
  }
  
  // Check for time-related keywords
  const hasTimeKeyword = timeKeywords.some(keyword => 
    fieldLabel.includes(keyword) || normalizedLabel.includes(keyword)
  );
  
  return hasTimeKeyword;
};

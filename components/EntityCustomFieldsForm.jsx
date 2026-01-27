"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, User, Shield } from "lucide-react";
import { toast } from "sonner";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { ComplianceFieldCard } from "@/components/ComplianceFieldCard";
import { ComplianceUploadModal } from "@/components/ComplianceUploadModal";
import { ComplianceHistory } from "@/components/ComplianceHistory";
import { useCustomFieldsHierarchy } from "@/hooks/useCustomFields";
import {
  useUserCustomFields,
  useUserCustomFieldsHierarchy,
  useBulkUpdateUserCustomFields,
  useUploadFile,
} from "@/hooks/useProfile";
import {
  useEntityCompliance,
  useUploadCompliance,
  useRenewCompliance,
  useComplianceHistory,
} from "@/hooks/useCompliance";
import { filesService } from "@/services/files";

/**
 * EntityCustomFieldsForm - A reusable component for displaying and submitting custom fields for any entity
 * 
 * @param {Object} props
 * @param {string} props.entityType - The type of entity (e.g., "user", "asset")
 * @param {string} props.entitySlug - The slug of the entity
 * @param {number} [props.entityId] - Optional entity ID (for user entities)
 * @param {boolean} [props.showTitle=true] - Whether to show the card title
 * @param {string} [props.title="Additional Information"] - Custom title for the card
 * @param {string} [props.description] - Custom description for the card
 * @param {Function} [props.onSubmitSuccess] - Callback when submission succeeds
 * @param {Function} [props.onSubmitError] - Callback when submission fails
 * @param {boolean} [props.readOnly=false] - Whether fields are read-only
 * @param {boolean} [props.showSaveButton=true] - Whether to show the save button
 * @param {string} [props.saveButtonText="Save Changes"] - Custom save button text
 * @param {string} [props.roleSlug] - Optional role slug for compliance fields filtering
 * @param {string} [props.assetTypeSlug] - Optional asset type slug for compliance fields filtering
 * @param {boolean} [props.showComplianceFields=true] - Whether to show compliance fields
 */
export default function EntityCustomFieldsForm({
  entityType = "user",
  entitySlug,
  entityId,
  showTitle = true,
  title = "Additional Information",
  description = "Complete your profile with additional details required by your organisation",
  onSubmitSuccess,
  onSubmitError,
  readOnly = false,
  showSaveButton = true,
  saveButtonText = "Save Changes",
  roleSlug = null,
  assetTypeSlug = null,
  showComplianceFields = true,
}) {
  // Fetch custom fields hierarchy
  const {
    data: customFieldsHierarchy,
    isLoading: customFieldsHierarchyLoading,
    error: customFieldsHierarchyError,
  } = useCustomFieldsHierarchy(entityType, entitySlug);

  // For user entities, also fetch current values using the user-specific hooks
  const {
    data: userCustomFieldsHierarchy,
    isLoading: userCustomFieldsHierarchyLoading,
  } = useUserCustomFieldsHierarchy(entityType === "user" ? entitySlug : null);

  // Fetch actual field values for user entities
  const {
    data: userCustomFieldsValues,
    isLoading: userCustomFieldsValuesLoading,
  } = useUserCustomFields(entityType === "user" ? entitySlug : null);

  // Use user-specific hierarchy if available, otherwise fall back to generic hierarchy
  const hierarchy = userCustomFieldsHierarchy || customFieldsHierarchy;
  const isLoading = customFieldsHierarchyLoading || (entityType === "user" && (userCustomFieldsHierarchyLoading || userCustomFieldsValuesLoading));

  // Form state
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [initialCustomFieldsData, setInitialCustomFieldsData] = useState({}); // Track initial values to detect changes
  const [customFieldsErrors, setCustomFieldsErrors] = useState({});
  const [hasCustomFieldsChanges, setHasCustomFieldsChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk update mutation (for user entities)
  const bulkUpdateUserCustomFieldsMutation = useBulkUpdateUserCustomFields();
  
  // File upload mutation
  const uploadFileMutation = useUploadFile({ silent: true });

  // Compliance fields
  const {
    data: complianceData,
    isLoading: complianceLoading,
    refetch: refetchCompliance,
  } = useEntityCompliance(entityType, entitySlug, roleSlug, assetTypeSlug);

  // Compliance state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedComplianceField, setSelectedComplianceField] = useState(null);
  const [selectedComplianceValue, setSelectedComplianceValue] = useState(null);
  const [isRenewal, setIsRenewal] = useState(false);

  // Compliance mutations
  const uploadComplianceMutation = useUploadCompliance();
  const renewComplianceMutation = useRenewCompliance();

  // Compliance handlers
  const handleComplianceUpload = (field) => {
    setSelectedComplianceField(field);
    setSelectedComplianceValue(null);
    setIsRenewal(false);
    setUploadModalOpen(true);
  };

  const handleComplianceRenew = (value, field) => {
    setSelectedComplianceValue(value);
    setSelectedComplianceField(field);
    setIsRenewal(true);
    setUploadModalOpen(true);
  };

  const handleComplianceViewHistory = async (field, value) => {
    if (!value || !value.id || value.id === 0) {
      return;
    }
    setSelectedComplianceField(field);
    setSelectedComplianceValue(value);
    setHistoryModalOpen(true);
  };

  const handleComplianceDownload = async (file) => {
    if (file.file_reference_id || file.id) {
      try {
        const response = await filesService.getFileUrl(file.file_reference_id || file.id);
        const url = response.url || response;
        if (url) {
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error("Failed to get file URL:", error);
        if (file.download_url) {
          window.open(file.download_url, "_blank");
        }
      }
    } else if (file.download_url) {
      window.open(file.download_url, "_blank");
    }
  };

  const handleComplianceUploadSubmit = async (uploadData) => {
    if (isRenewal && selectedComplianceValue) {
      // Try multiple possible property names for the slug
      const valueSlug = selectedComplianceValue.value_slug || 
                       selectedComplianceValue.slug || 
                       selectedComplianceValue.id?.toString(); // Fallback to ID as string
      
      if (!valueSlug) {
        console.error("No value slug found in compliance value:", {
          selectedComplianceValue,
          availableKeys: Object.keys(selectedComplianceValue || {}),
          value_slug: selectedComplianceValue?.value_slug,
          slug: selectedComplianceValue?.slug,
          id: selectedComplianceValue?.id
        });
        alert("Error: Unable to renew - missing value identifier. Please refresh the page and try again.");
        return;
      }
      
      console.log("Renewing compliance with valueSlug:", valueSlug);
      await renewComplianceMutation.mutateAsync({
        valueSlug: valueSlug,
        renewalData: uploadData,
      });
    } else {
      await uploadComplianceMutation.mutateAsync(uploadData);
    }
    setUploadModalOpen(false);
    refetchCompliance();
  };

  // Get history for selected compliance field
  const { data: complianceHistoryData, isLoading: complianceHistoryLoading } = useComplianceHistory(
    selectedComplianceField?.slug || selectedComplianceField?.field_slug || "",
    entityType,
    entitySlug || "",
    1,
    50
  );

  // Helper function to extract value from API response (similar to profile page)
  const extractValueFromAPIResponse = (field, apiValue) => {
    if (!apiValue) return '';

    const fieldType = field.field_type || field.type;

    switch (fieldType?.toLowerCase()) {
      case 'checkbox':
      case 'boolean':
        return apiValue.value === true || apiValue.value === 'true' || apiValue === true;
      
      case 'number':
      case 'integer':
      case 'decimal':
      case 'float':
        return apiValue.value !== undefined && apiValue.value !== null ? Number(apiValue.value) : '';
      
      case 'date':
      case 'datetime':
      case 'date_time':
      case 'time':
        return apiValue.value || '';
      
      case 'file':
        return apiValue.file_id || apiValue.value || '';
      
      case 'select':
      case 'dropdown':
      case 'radio':
      case 'radio_group':
        return apiValue.value || '';
      
      case 'multiselect':
        return Array.isArray(apiValue.value) ? apiValue.value : (apiValue.value ? [apiValue.value] : []);
      
      case 'json':
        return apiValue.value || '';
      
      default:
        return apiValue.value !== undefined && apiValue.value !== null ? String(apiValue.value) : '';
    }
  };

  // Initialize form data from values endpoint (for user entities) or hierarchy
  useEffect(() => {
    const initialData = {};
    
    if (entityType === "user" && userCustomFieldsValues?.sections) {
      // Use values from the values endpoint for user entities
      userCustomFieldsValues.sections.forEach((section) => {
        section.fields?.forEach((field) => {
          // For file fields, prioritize file_id over value_data
          const fieldType = field.field_type?.toLowerCase();
          if (fieldType === 'file') {
            // If file_id exists, use it (this means a file has been uploaded)
            if (field.file_id) {
              initialData[field.id] = field.file_id;
              console.log(`[FileField] Found uploaded file for field ${field.id} (${field.field_label}): file_id=${field.file_id}`);
            } else if (field.value_data) {
              // Fallback to value_data if file_id is not present
              const extractedValue = extractValueFromAPIResponse(field, field.value_data);
              // Filter out invalid values like [{}] or empty objects
              if (extractedValue !== undefined && extractedValue !== null && extractedValue !== '') {
                // Check if it's an array with only empty objects
                if (Array.isArray(extractedValue)) {
                  const validEntries = extractedValue.filter(v => 
                    v instanceof File || 
                    (v && typeof v === 'object' && (v.file instanceof File || Object.keys(v).length > 0))
                  );
                  if (validEntries.length > 0) {
                    initialData[field.id] = extractedValue;
                  }
                  // Skip if array is empty or only contains empty objects
                } else if (typeof extractedValue === 'object' && Object.keys(extractedValue).length > 0) {
                  // Only store non-empty objects
                  initialData[field.id] = extractedValue;
                } else if (typeof extractedValue !== 'object') {
                  // Store non-object values (strings, numbers, etc.)
                  initialData[field.id] = extractedValue;
                }
                // Skip empty objects
              }
            }
          } else if (field.value_data) {
            const extractedValue = extractValueFromAPIResponse(field, field.value_data);
            if (extractedValue !== undefined && extractedValue !== null && extractedValue !== '') {
              initialData[field.id] = extractedValue;
            }
          }
        });
      });
    } else if (hierarchy?.sections) {
      // Fallback to hierarchy if values endpoint not available
      hierarchy.sections.forEach((section) => {
        section.fields?.forEach((field) => {
          const fieldType = field.field_type?.toLowerCase();
          // For file fields, check both value and file_id
          if (fieldType === 'file' && field.file_id) {
            initialData[field.id] = field.file_id;
            console.log(`[FileField] Found uploaded file in hierarchy for field ${field.id} (${field.field_label}): file_id=${field.file_id}`);
          } else if (field.value !== undefined && field.value !== null) {
            initialData[field.id] = field.value;
          }
        });
      });
    }
    
    // For related fields, copy value from target field if related field has no value
    if (hierarchy?.sections) {
      hierarchy.sections.forEach((section) => {
        section.fields?.forEach((field) => {
          const relationshipConfig = field.relationship_config;
          if (relationshipConfig && relationshipConfig.target_field_id) {
            const targetFieldId = relationshipConfig.target_field_id;
            // If this related field has no value but the target field has a value, copy it
            if (!initialData[field.id] && initialData[targetFieldId]) {
              initialData[field.id] = initialData[targetFieldId];
            }
          }
        });
      });
    }
    
    console.log('[EntityCustomFieldsForm] Initial data set:', initialData);
    console.log('[EntityCustomFieldsForm] File fields in initialData:', 
      Object.entries(initialData).filter(([fieldId, value]) => {
        // Find the field to check if it's a file field
        const field = userCustomFieldsValues?.sections
          ?.flatMap(s => s.fields || [])
          .find(f => f.id === parseInt(fieldId));
        return field?.field_type?.toLowerCase() === 'file';
      })
    );
    
    setCustomFieldsData(initialData);
    setInitialCustomFieldsData(JSON.parse(JSON.stringify(initialData))); // Deep copy for comparison
    setHasCustomFieldsChanges(false);
  }, [hierarchy, userCustomFieldsValues, entityType]);

  // Handle field value changes
  const handleCustomFieldChange = (fieldId, value) => {
    if (readOnly) return;

    // Debug logging for file fields
    const field = hierarchy?.sections
      ?.flatMap(section => section.fields || [])
      ?.find(f => f.id === parseInt(fieldId));
    
    if (field && field.field_type?.toLowerCase() === 'file') {
      console.log(`[EntityCustomFieldsForm] handleCustomFieldChange for file field ${fieldId} (${field.field_label}):`, {
        value,
        valueType: typeof value,
        isFile: value instanceof File,
        isArray: Array.isArray(value),
        hasFileProperty: value && typeof value === 'object' && value.file instanceof File,
        previousValue: customFieldsData[fieldId],
        constructor: value?.constructor?.name,
      });
    }

    setCustomFieldsData((prev) => {
      const updated = {
        ...prev,
        [fieldId]: value,
      };
      
      // If this is a target/parent field, update all related fields that point to it
      if (hierarchy?.sections) {
        hierarchy.sections.forEach((section) => {
          section.fields?.forEach((field) => {
            const relationshipConfig = field.relationship_config;
            if (relationshipConfig && relationshipConfig.target_field_id === fieldId) {
              // Update related field with the target field's value
              updated[field.id] = value;
            }
          });
        });
      }
      
      // Debug: Log the updated state for file fields
      if (field && field.field_type?.toLowerCase() === 'file') {
        console.log(`[EntityCustomFieldsForm] Updated customFieldsData for file field ${fieldId}:`, {
          newValue: updated[fieldId],
          newValueType: typeof updated[fieldId],
          isFile: updated[fieldId] instanceof File,
        });
      }
      
      return updated;
    });
    setCustomFieldsErrors((prev) => ({
      ...prev,
      [fieldId]: null,
    }));
    setHasCustomFieldsChanges(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (hierarchy?.sections) {
      hierarchy.sections.forEach((section) => {
        section.fields?.forEach((field) => {
          if (field.is_required && !customFieldsData[field.id]) {
            errors[field.id] = `${field.field_label || field.name} is required`;
            isValid = false;
          }
        });
      });
    }

    setCustomFieldsErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (readOnly || !hasCustomFieldsChanges) return;

    if (!validateForm()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setIsSubmitting(true);

    try {
      if (entityType === "user" && entitySlug) {
        // Create a map of valid field IDs to slugs from the hierarchy (excluding compliance fields)
        const fieldIdToSlugMap = new Map();
        if (hierarchy?.sections) {
          hierarchy.sections
            .filter(section => section.is_active !== false)
            .forEach(section => {
              section.fields
                ?.filter(field => field.is_active !== false)
                .forEach(field => {
                  // Skip compliance fields
                  const isComplianceField = complianceData?.compliance_fields?.some(
                    cf => cf.custom_field_id === field.id
                  );
                  if (!isComplianceField && field.slug) {
                    fieldIdToSlugMap.set(field.id, field.slug);
                  }
                });
            });
        }

        // First, identify file fields that need uploading
        const fileFieldMap = new Map(); // Maps fieldId to the File object
        
        console.log('[FileUpload] Starting file detection. customFieldsData:', customFieldsData);
        
        // Find all file fields that have File objects
        Object.entries(customFieldsData).forEach(([fieldId, currentValue]) => {
          const fieldIdInt = parseInt(fieldId);
          if (!fieldIdToSlugMap.has(fieldIdInt)) {
            console.log(`[FileUpload] Field ${fieldId} not in fieldIdToSlugMap, skipping`);
            return;
          }
          
          // Get field definition to check if it's a file field
          const field = hierarchy?.sections
            ?.flatMap(section => section.fields || [])
            ?.find(f => f.id === fieldIdInt);
          
          if (!field) {
            console.log(`[FileUpload] Field ${fieldId} not found in hierarchy`);
            return;
          }
          
          if (field.field_type?.toLowerCase() !== 'file') {
            // Not a file field, skip
            return;
          }
          
          console.log(`[FileUpload] Checking file field ${fieldId} (${field.field_label}):`, {
            currentValue,
            valueType: typeof currentValue,
            isFile: currentValue instanceof File,
            isArray: Array.isArray(currentValue),
            isNumber: typeof currentValue === 'number',
            hasFileProperty: currentValue && typeof currentValue === 'object' && currentValue.file instanceof File,
            currentValueKeys: currentValue && typeof currentValue === 'object' ? Object.keys(currentValue) : null,
          });
          
          // Skip if value is already a file_id (number) - file already uploaded
          if (typeof currentValue === 'number') {
            console.log(`[FileUpload] Field ${fieldId} already has file_id: ${currentValue}, skipping upload`);
            return;
          }
          
          // Check if value is a File object or has a file property
          let fileToUpload = null;
          if (currentValue instanceof File) {
            console.log(`[FileUpload] Found File object directly for field ${fieldId}`);
            fileToUpload = currentValue;
          } else if (currentValue && typeof currentValue === 'object' && currentValue.file instanceof File) {
            console.log(`[FileUpload] Found File object in .file property for field ${fieldId}`);
            fileToUpload = currentValue.file;
          } else if (Array.isArray(currentValue) && currentValue.length > 0) {
            // Handle array of files (for multiple file fields)
            // Filter out empty objects like [{}] - these are invalid
            const files = currentValue.filter(v => 
              v instanceof File || 
              (v && typeof v === 'object' && v.file instanceof File) ||
              (v && typeof v === 'object' && Object.keys(v).length > 0 && v.file instanceof File)
            );
            if (files.length > 0) {
              console.log(`[FileUpload] Found ${files.length} file(s) in array for field ${fieldId}`);
              fileToUpload = files; // Array of files
            } else {
              console.log(`[FileUpload] Array for field ${fieldId} contains no valid files:`, currentValue);
            }
          }
          
          if (fileToUpload) {
            console.log(`[FileUpload] ✓ Found file to upload for field ${fieldId} (${field.field_label}):`, {
              isArray: Array.isArray(fileToUpload),
              fileName: Array.isArray(fileToUpload) ? fileToUpload.map(f => f.name || f.file?.name) : (fileToUpload.name || fileToUpload.file?.name),
              fileSize: Array.isArray(fileToUpload) ? fileToUpload.map(f => f.size || f.file?.size) : (fileToUpload.size || fileToUpload.file?.size),
              originalValue: currentValue,
            });
            fileFieldMap.set(fieldIdInt, fileToUpload);
          } else {
            // Log when we don't find a file to upload
            console.warn(`[FileUpload] ✗ No file to upload for field ${fieldId} (${field.field_label}):`, {
              currentValue,
              valueType: typeof currentValue,
              isArray: Array.isArray(currentValue),
              isFile: currentValue instanceof File,
              hasFileProperty: currentValue && typeof currentValue === 'object' && currentValue.file instanceof File,
              constructor: currentValue?.constructor?.name,
            });
          }
        });
        
        console.log(`[FileUpload] File detection complete. Found ${fileFieldMap.size} file(s) to upload:`, 
          Array.from(fileFieldMap.entries()).map(([fieldId, file]) => ({
            fieldId,
            fileName: Array.isArray(file) ? file.map(f => f.name || f.file?.name) : (file.name || file.file?.name),
          }))
        );
        
        // If no files to upload, proceed directly to bulk update
        if (fileFieldMap.size === 0) {
          console.log('[FileUpload] No files to upload, proceeding directly to bulk update');
        }
        
        // Upload all files first
        const uploadedFileIds = new Map(); // Maps fieldId to file_id
        for (const [fieldId, fileOrFiles] of fileFieldMap.entries()) {
          try {
            const field = hierarchy?.sections
              ?.flatMap(section => section.fields || [])
              ?.find(f => f.id === fieldId);
            
            console.log(`[FileUpload] Uploading file for field ${fieldId} (${field?.field_label || fieldId})...`);
            
            if (Array.isArray(fileOrFiles)) {
              // Multiple files - upload each one
              const fileIds = [];
              for (const fileItem of fileOrFiles) {
                const file = fileItem instanceof File ? fileItem : fileItem.file;
                const uploadResult = await uploadFileMutation.mutateAsync({
                  file: file,
                  field_id: fieldId.toString(),
                });
                const fileId = uploadResult.id || uploadResult.file_id;
                console.log(`[FileUpload] Uploaded file ${file.name}: file_id=${fileId}`);
                fileIds.push(fileId);
              }
              uploadedFileIds.set(fieldId, fileIds);
            } else {
              // Single file
              const file = fileOrFiles instanceof File ? fileOrFiles : fileOrFiles.file;
              const uploadResult = await uploadFileMutation.mutateAsync({
                file: file,
                field_id: fieldId.toString(),
              });
              const fileId = uploadResult.id || uploadResult.file_id;
              console.log(`[FileUpload] Uploaded file ${file.name}: file_id=${fileId}`);
              uploadedFileIds.set(fieldId, fileId);
            }
          } catch (error) {
            console.error(`[FileUpload] Failed to upload file for field ${fieldId}:`, error);
            toast.error(`Failed to upload file for ${field?.field_label || fieldId}`, {
              description: error.response?.data?.detail || error.message || "File upload failed",
            });
            throw error; // Stop submission if file upload fails
          }
        }
        
        console.log(`[FileUpload] Completed uploading ${uploadedFileIds.size} file(s)`);
        
        // Prepare updates array - only include fields that have actually changed
        // Compare current values with initial values to detect changes
        const updates = Object.entries(customFieldsData)
          .filter(([fieldId, currentValue]) => {
            const fieldIdInt = parseInt(fieldId);
            // Only include fields that are in the hierarchy and have slugs
            if (!fieldIdToSlugMap.has(fieldIdInt)) {
              return false;
            }
            
            // Get initial value for this field
            const initialValue = initialCustomFieldsData[fieldId];
            
            // For file fields, if we uploaded a file, it's a change
            if (uploadedFileIds.has(fieldIdInt)) {
              return true; // File was uploaded, this is a change
            }
            
            // Normalize values for comparison (handle null, undefined, empty string, empty objects/arrays)
            const normalizeValue = (val) => {
              if (val === null || val === undefined || val === '') return null;
              // Don't compare File objects - they're handled separately
              if (val instanceof File || (val && typeof val === 'object' && val.file instanceof File)) {
                return null; // File objects are handled via uploadedFileIds
              }
              // Filter out empty arrays like [{}] or empty objects
              if (Array.isArray(val)) {
                // Check if array contains only empty objects or invalid entries
                const validEntries = val.filter(v => 
                  v instanceof File || 
                  (v && typeof v === 'object' && v.file instanceof File) ||
                  (v && typeof v === 'object' && Object.keys(v).length > 0)
                );
                if (validEntries.length === 0) return null; // Empty or invalid array
                return val; // Has valid entries
              }
              if (val && typeof val === 'object' && Object.keys(val).length === 0) {
                return null; // Empty object
              }
              return val;
            };
            
            const normalizedCurrent = normalizeValue(currentValue);
            const normalizedInitial = normalizeValue(initialValue);
            
            // Only include if value has actually changed
            // Also exclude if current value is an invalid empty structure
            if (normalizedCurrent === null && normalizedInitial === null) {
              return false; // Both are null/invalid, no change
            }
            
            return normalizedCurrent !== normalizedInitial;
          })
          .map(([fieldId, value]) => {
            const fieldIdInt = parseInt(fieldId);
            const fieldSlug = fieldIdToSlugMap.get(fieldIdInt);
            
            // If this field has an uploaded file, use file_id instead of value
            if (uploadedFileIds.has(fieldIdInt)) {
              const fileId = uploadedFileIds.get(fieldIdInt);
              const finalFileId = Array.isArray(fileId) ? fileId[0] : fileId; // For now, use first file if array (TODO: support multiple files)
              
              // Get field definition to check if it has value_data that needs to be preserved
              const field = hierarchy?.sections
                ?.flatMap(section => section.fields || [])
                ?.find(f => f.id === fieldIdInt);
              
              // For file fields, preserve existing value_data if it has meaningful content (not just [{}])
              // This is important for compliance fields with sub-fields like notes, registration_number, etc.
              const updateItem = {
                field_slug: fieldSlug,
                file_id: finalFileId,
              };
              
              // Only preserve existing value_data if it has meaningful content (not just [{}])
              if (field && userCustomFieldsValues?.sections) {
                const existingField = userCustomFieldsValues.sections
                  .flatMap(s => s.fields || [])
                  .find(f => f.id === fieldIdInt);
                if (existingField?.value_data && typeof existingField.value_data === 'object') {
                  // Clean up the value_data - remove invalid empty arrays/objects
                  const valueData = existingField.value_data;
                  const cleanedValueData = {};
                  
                  Object.keys(valueData).forEach(key => {
                    const val = valueData[key];
                    
                    // Skip null, undefined, empty string
                    if (val === null || val === undefined || val === '') {
                      return;
                    }
                    
                    // Handle arrays - filter out empty objects
                    if (Array.isArray(val)) {
                      const validEntries = val.filter(v => {
                        if (v instanceof File) return true;
                        if (v && typeof v === 'object') {
                          // Only include objects with at least one key
                          return Object.keys(v).length > 0;
                        }
                        // Include non-object values
                        return v !== null && v !== undefined && v !== '';
                      });
                      if (validEntries.length > 0) {
                        cleanedValueData[key] = validEntries;
                      }
                    }
                    // Handle objects - only include if they have keys
                    else if (val && typeof val === 'object') {
                      if (Object.keys(val).length > 0) {
                        cleanedValueData[key] = val;
                      }
                    }
                    // Handle primitive values
                    else {
                      cleanedValueData[key] = val;
                    }
                  });
                  
                  // Only include if there's valid content after cleaning
                  if (Object.keys(cleanedValueData).length > 0) {
                    updateItem.value_data = cleanedValueData;
                    console.log(`[EntityCustomFieldsForm] Including cleaned value_data for ${fieldSlug}:`, cleanedValueData);
                  } else {
                    console.log(`[EntityCustomFieldsForm] Skipping invalid value_data for ${fieldSlug} (only empty arrays/objects)`);
                  }
                }
              }
              
              console.log(`[EntityCustomFieldsForm] File field update item for ${fieldSlug}:`, updateItem);
              return updateItem;
            }
            
            // For non-file fields, send the value
            // Filter out invalid values like [{}] or empty objects/arrays
            let finalValue = value;
            if (Array.isArray(value)) {
              // Check if array contains only empty objects
              const validEntries = value.filter(v => 
                v instanceof File || 
                (v && typeof v === 'object' && (v.file instanceof File || Object.keys(v).length > 0))
              );
              if (validEntries.length === 0) {
                finalValue = null; // Empty or invalid array
              }
            } else if (value && typeof value === 'object' && Object.keys(value).length === 0) {
              finalValue = null; // Empty object
            } else if (value === undefined || value === '') {
              finalValue = null;
            }
            
            // Get field definition to check if it's a file field
            const field = hierarchy?.sections
              ?.flatMap(section => section.fields || [])
              ?.find(f => f.id === fieldIdInt);
            
            // If this is a file field and we don't have a file_id, don't send invalid values
            if (field && field.field_type?.toLowerCase() === 'file' && !uploadedFileIds.has(fieldIdInt)) {
              // If value is not a File object and not a file_id, it's invalid - skip it
              // This prevents sending [{}] or other invalid structures
              const isValidFileValue = 
                finalValue instanceof File || 
                (finalValue && typeof finalValue === 'object' && finalValue.file instanceof File) ||
                typeof finalValue === 'number' || 
                finalValue === null;
              
              if (!isValidFileValue) {
                console.warn(`[EntityCustomFieldsForm] Skipping invalid file field value for ${fieldSlug}:`, {
                  value: finalValue,
                  valueType: typeof finalValue,
                  isArray: Array.isArray(finalValue),
                  fieldId: fieldIdInt,
                  fieldLabel: field.field_label,
                });
                return null; // Return null to filter this out
              }
            }
            
            return {
              field_slug: fieldSlug,
              value: finalValue,
            };
          })
          .filter(update => update !== null); // Remove null entries (filtered out invalid values)

        // Debug logging
        console.log('[EntityCustomFieldsForm] Submitting updates:', {
          totalUpdates: updates.length,
          fileUploads: uploadedFileIds.size,
          uploadedFileIds: Array.from(uploadedFileIds.entries()),
          customFieldsDataSnapshot: Object.entries(customFieldsData)
            .filter(([fieldId]) => {
              const fieldIdInt = parseInt(fieldId);
              return fieldIdToSlugMap.has(fieldIdInt);
            })
            .map(([fieldId, value]) => {
              const fieldIdInt = parseInt(fieldId);
              const field = hierarchy?.sections
                ?.flatMap(section => section.fields || [])
                ?.find(f => f.id === fieldIdInt);
              return {
                fieldId,
                fieldSlug: fieldIdToSlugMap.get(fieldIdInt),
                fieldLabel: field?.field_label,
                fieldType: field?.field_type,
                value,
                valueType: typeof value,
                isFile: value instanceof File,
                isFileId: typeof value === 'number',
                isArray: Array.isArray(value),
              };
            }),
          updates: updates.map(u => ({
            field_slug: u.field_slug,
            hasFileId: !!u.file_id,
            file_id: u.file_id,
            hasValue: u.value !== null && u.value !== undefined,
            value: u.value,
            valueType: typeof u.value,
          })),
        });

        if (updates.length === 0) {
          console.warn('[EntityCustomFieldsForm] No valid fields to update. Debug info:', {
            fieldIdToSlugMapSize: fieldIdToSlugMap.size,
            fieldIdToSlugMapEntries: Array.from(fieldIdToSlugMap.entries()),
            customFieldsDataKeys: Object.keys(customFieldsData),
            customFieldsDataEntries: Object.entries(customFieldsData),
            hierarchySections: hierarchy?.sections?.length || 0,
            uploadedFileIds: Array.from(uploadedFileIds.entries()),
          });
          toast.warning("No valid fields to update");
          setIsSubmitting(false);
          return;
        }

        await bulkUpdateUserCustomFieldsMutation.mutateAsync({
          userSlug: entitySlug,
          updates,
        });

        setHasCustomFieldsChanges(false);
        // Success toast is handled by the mutation hook

        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        // For other entity types, use the generic API
        // This would need to be implemented based on your API structure
        const updates = Object.entries(customFieldsData).map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value: value,
        }));

        // TODO: Implement generic entity custom fields update endpoint
        // await customFieldsService.updateEntityCustomFields(entityType, entitySlug, updates);
        toast.warning("Custom fields update for this entity type is not yet implemented");
      }
    } catch (error) {
      console.error("Failed to update custom fields:", error);
      // Error toast is handled by the mutation hook for user entities
      // For other entity types, show error here
      if (entityType !== "user" || !entitySlug) {
        toast.error("Failed to update custom fields", {
          description:
            error.response?.data?.detail ||
            error.response?.data?.message ||
            "An error occurred while updating custom fields.",
        });
      }

      if (onSubmitError) {
        onSubmitError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading || (showComplianceFields && complianceLoading)) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading custom fields...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (customFieldsHierarchyError) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">
              Failed to load custom fields
            </p>
            <p className="text-sm text-muted-foreground">
              {customFieldsHierarchyError.message || "An error occurred while loading custom fields"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!hierarchy?.sections || hierarchy.sections.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Additional Information Required</h3>
            <p className="text-muted-foreground mb-4">
              Your organisation hasn't configured any additional profile fields yet. Contact your administrator if you need to add more information.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render custom fields
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {(() => {
          // First, collect all fields from all sections to build a complete field map
          // This allows us to find parent fields even if they're in different sections
          const allFieldsMap = new Map();
          hierarchy.sections
            .filter((section) => section.is_active !== false)
            .forEach((section) => {
              (section.fields || []).forEach((field) => {
                if (field.is_active !== false) {
                  allFieldsMap.set(field.id, field);
                }
              });
            });
          
          return hierarchy.sections
            .filter((section) => section.is_active !== false)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((section) => {
              // Get all fields in this section (both compliance and non-compliance) from hierarchy
              const allFields = (section.fields || [])
                .filter((field) => field.is_active !== false)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

            // Create a map of compliance fields by field ID for quick lookup
            const complianceFieldsMap = new Map();
            if (showComplianceFields && complianceData?.compliance_fields) {
              complianceData.compliance_fields.forEach((cf) => {
                complianceFieldsMap.set(cf.custom_field_id, cf);
              });
            }

            // Don't render section if it has no fields at all
            if (allFields.length === 0) {
              return null;
            }

            return (
              <div key={section.id} className="space-y-4">
                {/* Section Header */}
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">{section.section_name}</h3>
                  {section.section_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.section_description}
                    </p>
                  )}
                  {section.subsections && section.subsections.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Subsections: {section.subsections.join(", ")}
                    </p>
                  )}
                </div>

                {/* All Fields - Render based on whether they're compliance or regular */}
                {/* Separate compliance and regular fields for proper layout */}
                {/* Group related fields together */}
                {(() => {
                  const complianceFieldsInSection = [];
                  const regularFieldsInSection = [];
                  
                  allFields.forEach((field) => {
                    const complianceFieldValue = complianceFieldsMap.get(field.id);
                    if (complianceFieldValue) {
                      complianceFieldsInSection.push({ field, complianceFieldValue });
                    } else {
                      regularFieldsInSection.push(field);
                    }
                  });
                  
                  // Group related fields by their target_field_id
                  const relatedFieldsGroups = new Map();
                  const standaloneFields = [];
                  const fieldsInGroups = new Set(); // Track which fields are already in groups
                  
                  // First pass: Identify all related fields and group them
                  regularFieldsInSection.forEach((field) => {
                    const relationshipConfig = field.relationship_config;
                    if (relationshipConfig && relationshipConfig.target_field_id) {
                      const targetFieldId = relationshipConfig.target_field_id;
                      // Find the parent field (could be in this section or another section)
                      const parentField = allFieldsMap.get(targetFieldId);
                      
                      if (!relatedFieldsGroups.has(targetFieldId)) {
                        relatedFieldsGroups.set(targetFieldId, {
                          parentField: parentField || null,
                          relatedFields: []
                        });
                      }
                      relatedFieldsGroups.get(targetFieldId).relatedFields.push(field);
                      fieldsInGroups.add(field.id); // Mark this field as in a group
                      
                      // Update parent field if we found it
                      if (parentField) {
                        if (!relatedFieldsGroups.get(targetFieldId).parentField) {
                          relatedFieldsGroups.get(targetFieldId).parentField = parentField;
                        }
                        fieldsInGroups.add(parentField.id); // Mark parent as in a group
                      }
                    }
                  });
                  
                  // Second pass: Identify parent fields that are in this section and add them to groups
                  regularFieldsInSection.forEach((field) => {
                    // Check if this field is a parent (has fields pointing to it)
                    const isParent = Array.from(allFieldsMap.values()).some(f => 
                      f.relationship_config?.target_field_id === field.id
                    );
                    if (isParent) {
                      // This is a parent field, ensure it's in a group
                      if (!relatedFieldsGroups.has(field.id)) {
                        relatedFieldsGroups.set(field.id, {
                          parentField: field,
                          relatedFields: []
                        });
                      } else {
                        relatedFieldsGroups.get(field.id).parentField = field;
                      }
                      fieldsInGroups.add(field.id); // Mark parent as in a group
                    }
                  });
                  
                  // Third pass: Add standalone fields (fields not in any group)
                  regularFieldsInSection.forEach((field) => {
                    if (!fieldsInGroups.has(field.id)) {
                      standaloneFields.push(field);
                    }
                  });
                  
                  return (
                    <>
                      {/* Standalone Fields in Grid Layout */}
                      {standaloneFields.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {standaloneFields.map((field) => {
                            // For file fields, default to null instead of empty string
                            // Empty string breaks file input handling
                            const isFileField = field.field_type?.toLowerCase() === 'file';
                            const defaultValue = isFileField ? null : "";
                            
                            // Get value from customFieldsData (populated from values endpoint) or fallback to field.value
                            let fieldValue = customFieldsData[field.id] !== undefined 
                              ? customFieldsData[field.id] 
                              : (field.value !== undefined ? field.value : defaultValue);
                            
                            // Debug logging for file fields
                            if (isFileField) {
                              console.log(`[EntityCustomFieldsForm] Rendering file field ${field.id} (${field.field_label}):`, {
                                fieldValue,
                                fieldValueType: typeof fieldValue,
                                customFieldsDataValue: customFieldsData[field.id],
                                fieldValueFromHierarchy: field.value,
                                fieldFileId: field.file_id, // This might not exist in hierarchy
                              });
                            }
                            
                            // If this is a related field (child) and has no value, use the parent/target field's value
                            // For file fields, check for null/undefined instead of empty string
                            const relationshipConfig = field.relationship_config;
                            const hasNoValue = isFileField 
                              ? (fieldValue === null || fieldValue === undefined)
                              : (!fieldValue || fieldValue === '');
                            if (relationshipConfig && relationshipConfig.target_field_id && hasNoValue) {
                              const targetFieldId = relationshipConfig.target_field_id;
                              const targetValue = customFieldsData[targetFieldId] !== undefined
                                ? customFieldsData[targetFieldId]
                                : (hierarchy?.sections?.flatMap(s => s.fields || []).find(f => f.id === targetFieldId)?.value);
                              if (targetValue !== undefined && targetValue !== null && targetValue !== '') {
                                fieldValue = targetValue;
                              }
                            }
                            
                            return (
                              <CustomFieldRenderer
                                key={field.id}
                                field={field}
                                value={fieldValue}
                                onChange={handleCustomFieldChange}
                                error={customFieldsErrors[field.id]}
                                readOnly={readOnly || field.is_editable === false}
                              />
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Related Fields Groups - Each group in its own distinct section */}
                      {Array.from(relatedFieldsGroups.entries()).map(([targetFieldId, group]) => {
                        const { parentField, relatedFields } = group;
                        
                        // Only render groups that have fields (skip empty groups)
                        if (!parentField && relatedFields.length === 0) {
                          return null;
                        }
                        
                        const allGroupFields = parentField 
                          ? [parentField, ...relatedFields]
                          : relatedFields;
                        
                        // Get parent field label for the group title
                        const groupTitle = parentField 
                          ? (parentField.field_label || parentField.field_name || "Related Fields")
                          : (relatedFields[0]?.field_label || relatedFields[0]?.field_name || "Related Fields");
                        
                        return (
                          <div 
                            key={`related-group-${targetFieldId}`} 
                            className="mt-6 space-y-4 border-2 border-primary/20 rounded-lg p-6 bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm"
                          >
                            <div className="border-b border-primary/10 pb-3 mb-4">
                              <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                                {groupTitle}
                                {relatedFields.length > 0 && (
                                  <span className="text-xs font-normal text-muted-foreground ml-2">
                                    ({allGroupFields.length} {allGroupFields.length === 1 ? 'field' : 'fields'})
                                  </span>
                                )}
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {allGroupFields.map((field) => {
                                // For related fields, use the target field's value if this field has no value
                                // For file fields, default to null instead of empty string
                                const isFileField = field.field_type?.toLowerCase() === 'file';
                                const defaultValue = isFileField ? null : "";
                                
                                let fieldValue = customFieldsData[field.id] !== undefined 
                                  ? customFieldsData[field.id] 
                                  : (field.value !== undefined ? field.value : defaultValue);
                                
                                // If this is a related field (child) and has no value, use the parent/target field's value
                                // For file fields, check for null/undefined instead of empty string
                                const relationshipConfig = field.relationship_config;
                                const hasNoValue = isFileField 
                                  ? (fieldValue === null || fieldValue === undefined)
                                  : (!fieldValue || fieldValue === '');
                                if (relationshipConfig && relationshipConfig.target_field_id && hasNoValue) {
                                  const targetFieldId = relationshipConfig.target_field_id;
                                  const targetValue = customFieldsData[targetFieldId] !== undefined
                                    ? customFieldsData[targetFieldId]
                                    : (hierarchy?.sections?.flatMap(s => s.fields || []).find(f => f.id === targetFieldId)?.value);
                                  if (targetValue !== undefined && targetValue !== null && targetValue !== '') {
                                    fieldValue = targetValue;
                                  }
                                }
                                
                                return (
                                  <CustomFieldRenderer
                                    key={field.id}
                                    field={field}
                                    value={fieldValue}
                                    onChange={handleCustomFieldChange}
                                    error={customFieldsErrors[field.id]}
                                    readOnly={readOnly || field.is_editable === false}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Compliance Fields as Full-Width Cards */}
                      {showComplianceFields && complianceFieldsInSection.length > 0 && (
                        <div className="space-y-4">
                          {complianceFieldsInSection.map(({ field, complianceFieldValue }) => {
                            const complianceField = {
                              id: complianceFieldValue.custom_field_id,
                              slug: complianceFieldValue.field_slug || complianceFieldValue.slug,
                              field_name: complianceFieldValue.field_name || field.field_name || "Unknown Field",
                              field_label: complianceFieldValue.field_label || field.field_label || complianceFieldValue.field_name || "Unknown Field",
                              field_description: complianceFieldValue.field_description || field.field_description,
                              requires_approval: complianceFieldValue.requires_approval,
                              compliance_config: complianceFieldValue.compliance_config || null,
                              sub_field_definitions: complianceFieldValue.sub_field_definitions || null,
                            };

                            return (
                              <ComplianceFieldCard
                                key={complianceFieldValue.id || complianceFieldValue.custom_field_id || field.id}
                                field={complianceField}
                                value={complianceFieldValue}
                                onUpload={handleComplianceUpload}
                                onRenew={handleComplianceRenew}
                                onViewHistory={handleComplianceViewHistory}
                                onDownload={handleComplianceDownload}
                                isAdmin={false}
                                canUpload={!readOnly}
                              />
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            );
          });
        })()}


        {showSaveButton && !readOnly && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {hasCustomFieldsChanges && (
                <span className="text-amber-600 font-medium">
                  You have unsaved changes
                </span>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasCustomFieldsChanges}
              variant={hasCustomFieldsChanges ? "default" : "outline"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {saveButtonText}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Compliance Modals */}
      {uploadModalOpen && (selectedComplianceField || (isRenewal && selectedComplianceValue)) && (
        <ComplianceUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          field={selectedComplianceField || (selectedComplianceValue ? {
            slug: selectedComplianceValue.field_slug || selectedComplianceValue.slug,
            field_name: selectedComplianceValue.field_name,
            field_label: selectedComplianceValue.field_label,
            field_description: selectedComplianceValue.field_description,
            compliance_config: selectedComplianceValue.compliance_config,
            sub_field_definitions: selectedComplianceValue.sub_field_definitions,
          } : null)}
          value={selectedComplianceValue}
          isRenewal={isRenewal}
          entityType={entityType}
          entitySlug={entitySlug}
          onSubmit={handleComplianceUploadSubmit}
          isSubmitting={uploadComplianceMutation.isPending || renewComplianceMutation.isPending}
        />
      )}

      {historyModalOpen && selectedComplianceField && (
        <ComplianceHistory
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          field={selectedComplianceField}
          entityType={entityType}
          entitySlug={entitySlug}
          historyData={complianceHistoryData}
          isLoading={complianceHistoryLoading}
        />
      )}
    </Card>
  );
}

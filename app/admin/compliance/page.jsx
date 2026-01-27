"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceSection } from "@/components/ComplianceSection";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { useCurrentUser } from "@/hooks/useAuth";
import { 
  useUserCustomFieldsHierarchy, 
  useUserCustomFields, 
  useBulkUpdateUserCustomFields,
  useUploadFile,
} from "@/hooks/useProfile";
import { useEntityCompliance } from "@/hooks/useCompliance";
import { Shield, Loader2, User, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CompliancePage() {
  const { data: currentUserData, isLoading: currentUserLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("compliance");
  const [activeSectionTab, setActiveSectionTab] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Custom Fields State
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [initialCustomFieldsData, setInitialCustomFieldsData] = useState({}); // Track initial values to detect changes
  const [customFieldsErrors, setCustomFieldsErrors] = useState({});
  const [hasCustomFieldsChanges, setHasCustomFieldsChanges] = useState(false);
  const [isUpdatingCustomFields, setIsUpdatingCustomFields] = useState(false);

  // Get user roles for the role selector
  const userRoles = currentUserData?.roles || [];
  const userSlug = currentUserData?.slug;

  // Fetch custom fields hierarchy and values
  const { data: customFieldsHierarchy, isLoading: customFieldsHierarchyLoading } = 
    useUserCustomFieldsHierarchy(userSlug);
  const { data: userCustomFields } = useUserCustomFields(userSlug);
  const bulkUpdateUserCustomFieldsMutation = useBulkUpdateUserCustomFields();
  const uploadFileMutation = useUploadFile({ silent: true });

  // Fetch compliance data to filter out compliance fields from custom fields
  const { data: complianceData } = useEntityCompliance(
    "user",
    userSlug,
    null,
    null
  );

  // Helper function to extract value from API response
  // Note: For file fields, file_id is a direct property of the field object, not in value_data
  const extractValueFromAPIResponse = (field, valueData) => {
    if (!valueData) return "";
    
    // Handle different field types
    // Note: file fields are handled separately in initialization using field.file_id directly
    if (field.field_type === "file" || field.field_type === "image") {
      // This shouldn't be called for file fields, but if it is, return null
      return null;
    }
    
    if (field.field_type === "select" || field.field_type === "multi_select") {
      return valueData.selected_options || valueData.value || "";
    }
    
    if (field.field_type === "date") {
      return valueData.date || valueData.value || "";
    }
    
    if (field.field_type === "boolean") {
      return valueData.value !== undefined ? valueData.value : "";
    }
    
    // Default: return the value directly or from value_data
    return valueData.value || valueData || "";
  };

  // Initialize custom fields data from API response
  useEffect(() => {
    if (userCustomFields && userCustomFields.sections) {
      const fieldsMap = {};
      userCustomFields.sections.forEach(section => {
        section.fields?.forEach(field => {
          const fieldType = field.field_type?.toLowerCase();
          
          // For file fields, prioritize file_id (which is a direct property of the field)
          if (fieldType === 'file' || fieldType === 'image') {
            // file_id is a direct property of the field object, not inside value_data
            if (field.file_id) {
              fieldsMap[field.id] = field.file_id;
              console.log(`[CompliancePage] Initialized file field ${field.id} (${field.field_label}) with file_id: ${field.file_id}`);
            } else {
              fieldsMap[field.id] = null;
            }
          } else if (field.value_data) {
            // For non-file fields, extract from value_data
            const extractedValue = extractValueFromAPIResponse(field, field.value_data);
            fieldsMap[field.id] = extractedValue;
          } else {
            // No value_data and not a file field
            fieldsMap[field.id] = "";
          }
        });
      });
      setCustomFieldsData(fieldsMap);
      // Deep copy for comparison - handle File objects and other non-serializable values
      const deepCopy = {};
      Object.entries(fieldsMap).forEach(([key, value]) => {
        // For File objects or complex objects, we can't deep copy them
        // Store a reference or a marker instead
        if (value instanceof File || (value && typeof value === 'object' && value.file instanceof File)) {
          // Don't store File objects in initial data - they're temporary
          deepCopy[key] = null;
        } else {
          try {
            deepCopy[key] = JSON.parse(JSON.stringify(value));
          } catch (e) {
            // If JSON serialization fails, store as-is (but this shouldn't happen for initial values)
            deepCopy[key] = value;
          }
        }
      });
      setInitialCustomFieldsData(deepCopy);
    }
  }, [userCustomFields]);

  // Check for changes in custom fields
  useEffect(() => {
    if (!customFieldsHierarchy?.sections) {
      setHasCustomFieldsChanges(false);
      return;
    }

    let hasChanges = false;
    customFieldsHierarchy.sections
      .filter(section => section.is_active !== false)
      .forEach(section => {
        section.fields
          ?.filter(field => field.is_active !== false)
          .forEach(field => {
            // Skip compliance fields
            const isComplianceField = complianceData?.compliance_fields?.some(
              cf => cf.custom_field_id === field.id
            );
            if (isComplianceField) return;

            const currentValue = customFieldsData[field.id];
            const initialValue = initialCustomFieldsData[field.id];
            
            // Normalize values for comparison
            const normalizeValue = (val) => {
              if (val === null || val === undefined || val === '') return null;
              // Don't compare File objects - they're handled separately
              if (val instanceof File || (val && typeof val === 'object' && val.file instanceof File)) {
                return null; // File objects will be uploaded, so we can't compare them directly
              }
              // Filter out empty arrays like [{}] or empty objects
              if (Array.isArray(val)) {
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
            
            // Only mark as changed if values are actually different
            if (normalizedCurrent !== normalizedInitial) {
              hasChanges = true;
            }
          });
      });

    setHasCustomFieldsChanges(hasChanges);
  }, [customFieldsHierarchy, initialCustomFieldsData, customFieldsData, complianceData]);

  // Set default active section tab on first load
  // This must be at the top level, not inside conditional rendering
  useEffect(() => {
    if (customFieldsHierarchy?.sections && !activeSectionTab) {
      const activeSections = customFieldsHierarchy.sections
        .filter(section => section.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      if (activeSections.length > 0) {
        setActiveSectionTab(activeSections[0].id.toString());
      }
    }
  }, [customFieldsHierarchy, activeSectionTab]);
  
  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCustomFieldChange = (fieldId, value) => {
    // Debug logging for file fields
    const field = customFieldsHierarchy?.sections
      ?.flatMap(section => section.fields || [])
      ?.find(f => f.id === parseInt(fieldId));
    
    if (field && field.field_type?.toLowerCase() === 'file') {
      console.log(`[CompliancePage] handleCustomFieldChange for file field ${fieldId} (${field.field_label}):`, {
        value,
        valueType: typeof value,
        isFile: value instanceof File,
        isArray: Array.isArray(value),
        hasFileProperty: value && typeof value === 'object' && value.file instanceof File,
        constructor: value?.constructor?.name,
        previousValue: customFieldsData[fieldId],
        initialValue: initialCustomFieldsData[fieldId],
      });
    }
    
    setCustomFieldsData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    setCustomFieldsErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  // Create a map of compliance fields by field ID for quick lookup
  // NOTE: All hooks must be called before any conditional returns
  const complianceFieldsMap = useMemo(() => {
    const map = new Map();
    if (complianceData?.compliance_fields) {
      complianceData.compliance_fields.forEach((cf) => {
        map.set(cf.custom_field_id, cf);
      });
    }
    return map;
  }, [complianceData]);

  // Create a map of ALL fields across ALL sections for parent field lookup
  const allSectionsFieldsMap = useMemo(() => {
    const map = new Map();
    if (customFieldsHierarchy?.sections) {
      customFieldsHierarchy.sections
        .filter(section => section.is_active !== false)
        .forEach(section => {
          (section.fields || [])
            .filter(field => field.is_active !== false)
            .filter(field => !complianceFieldsMap.has(field.id))
            .forEach(field => {
              map.set(field.id, field);
            });
        });
    }
    return map;
  }, [customFieldsHierarchy, complianceFieldsMap]);

  const handleCustomFieldsBulkUpdate = async () => {
    if (!userSlug) return;

    setIsUpdatingCustomFields(true);
    try {
      // Create a map of valid field IDs to slugs from the hierarchy (excluding compliance fields)
      const fieldIdToSlugMap = new Map();
      if (customFieldsHierarchy?.sections) {
        customFieldsHierarchy.sections
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
      
      console.log('[CompliancePage] Starting file detection. customFieldsData:', customFieldsData);
      
      // Find all file fields that have File objects
      Object.entries(customFieldsData).forEach(([fieldId, currentValue]) => {
        const fieldIdInt = parseInt(fieldId);
        if (!fieldIdToSlugMap.has(fieldIdInt)) return;
        
        // Get field definition to check if it's a file field
        const field = customFieldsHierarchy?.sections
          ?.flatMap(section => section.fields || [])
          ?.find(f => f.id === fieldIdInt);
        
        if (!field || field.field_type?.toLowerCase() !== 'file') return;
        
        // Skip if value is already a file_id (number) - file already uploaded
        if (typeof currentValue === 'number') {
          console.log(`[CompliancePage] Field ${fieldId} already has file_id: ${currentValue}, skipping upload`);
          return;
        }
        
        // Check if value is a File object or has a file property
        let fileToUpload = null;
        if (currentValue instanceof File) {
          console.log(`[CompliancePage] Found File object directly for field ${fieldId}`);
          fileToUpload = currentValue;
        } else if (currentValue && typeof currentValue === 'object' && currentValue.file instanceof File) {
          console.log(`[CompliancePage] Found File object in .file property for field ${fieldId}`);
          fileToUpload = currentValue.file;
        } else if (Array.isArray(currentValue) && currentValue.length > 0) {
          // Handle array of files (for multiple file fields)
          const files = currentValue.filter(v => 
            v instanceof File || 
            (v && typeof v === 'object' && v.file instanceof File)
          );
          if (files.length > 0) {
            console.log(`[CompliancePage] Found ${files.length} file(s) in array for field ${fieldId}`);
            fileToUpload = files;
          }
        }
        
        if (fileToUpload) {
          console.log(`[CompliancePage] ✓ Found file to upload for field ${fieldId} (${field.field_label}):`, {
            isArray: Array.isArray(fileToUpload),
            fileName: Array.isArray(fileToUpload) ? fileToUpload.map(f => f.name || f.file?.name) : (fileToUpload.name || fileToUpload.file?.name),
          });
          fileFieldMap.set(fieldIdInt, fileToUpload);
        } else {
          console.warn(`[CompliancePage] ✗ No file to upload for field ${fieldId} (${field.field_label}):`, {
            currentValue,
            valueType: typeof currentValue,
            isFile: currentValue instanceof File,
          });
        }
      });
      
      // Upload all files first
      const uploadedFileIds = new Map(); // Maps fieldId to file_id
      for (const [fieldId, fileOrFiles] of fileFieldMap.entries()) {
        try {
          const field = customFieldsHierarchy?.sections
            ?.flatMap(section => section.fields || [])
            ?.find(f => f.id === fieldId);
          
          console.log(`[CompliancePage] Uploading file for field ${fieldId} (${field?.field_label || fieldId})...`);
          
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
              console.log(`[CompliancePage] Uploaded file ${file.name}: file_id=${fileId}`);
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
            console.log(`[CompliancePage] Uploaded file ${file.name}: file_id=${fileId}`);
            uploadedFileIds.set(fieldId, fileId);
          }
        } catch (error) {
          console.error(`[CompliancePage] Failed to upload file for field ${fieldId}:`, error);
          toast.error(`Failed to upload file for ${field?.field_label || fieldId}`, {
            description: error.response?.data?.detail || error.message || "File upload failed",
          });
          throw error; // Stop submission if file upload fails
        }
      }
      
      console.log(`[CompliancePage] File upload complete. Uploaded ${uploadedFileIds.size} file(s)`);
      
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
          
          // Normalize values for comparison (handle null, undefined, empty string)
          const normalizeValue = (val) => {
            if (val === null || val === undefined || val === '') return null;
            // Don't compare File objects - they're handled separately
            if (val instanceof File || (val && typeof val === 'object' && val.file instanceof File)) {
              return null; // File objects are handled via uploadedFileIds
            }
            return val;
          };
          
          const normalizedCurrent = normalizeValue(currentValue);
          const normalizedInitial = normalizeValue(initialValue);
          
          // Only include if value has actually changed
          return normalizedCurrent !== normalizedInitial;
        })
        .map(([fieldId, value]) => {
          const fieldIdInt = parseInt(fieldId);
          const fieldSlug = fieldIdToSlugMap.get(fieldIdInt);
          
          // If this field has an uploaded file, use file_id instead of value
          if (uploadedFileIds.has(fieldIdInt)) {
            const fileId = uploadedFileIds.get(fieldIdInt);
            const finalFileId = Array.isArray(fileId) ? fileId[0] : fileId; // For now, use first file if array
            
            const updateItem = {
              field_slug: fieldSlug,
              file_id: finalFileId,
            };
            
            // Only preserve existing value_data if it has meaningful content (not just [{}])
            // This is important for compliance fields with sub-fields like notes, registration_number, etc.
            // For simple file fields without sub-fields, we don't need to include value_data
            if (userCustomFields?.sections) {
              const existingField = userCustomFields.sections
                .flatMap(s => s.fields || [])
                .find(f => f.id === fieldIdInt);
              
              // Only process if value_data exists and is an object (not null)
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
                  // Handle primitive values (strings, numbers, booleans)
                  else {
                    cleanedValueData[key] = val;
                  }
                });
                
                // Only include if there's valid content after cleaning
                // Don't include value_data if it's empty or only contains invalid data
                if (Object.keys(cleanedValueData).length > 0) {
                  updateItem.value_data = cleanedValueData;
                  console.log(`[CompliancePage] Including cleaned value_data for ${fieldSlug}:`, cleanedValueData);
                } else {
                  console.log(`[CompliancePage] Skipping invalid/empty value_data for ${fieldSlug} - field only needs file_id`);
                }
              } else {
                // value_data is null or doesn't exist - this is fine for simple file fields
                console.log(`[CompliancePage] No value_data to preserve for ${fieldSlug} - field only needs file_id`);
              }
            }
            
            console.log(`[CompliancePage] File field update item for ${fieldSlug}:`, updateItem);
            return updateItem;
          }
          
          // For non-file fields, send the value
          // Filter out invalid values like [{}] or empty objects/arrays
          let finalValue = value;
          if (Array.isArray(value)) {
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
          const field = customFieldsHierarchy?.sections
            ?.flatMap(section => section.fields || [])
            ?.find(f => f.id === fieldIdInt);
          
          // If this is a file field and we don't have a file_id, don't send invalid values
          if (field && field.field_type?.toLowerCase() === 'file' && !uploadedFileIds.has(fieldIdInt)) {
            const isValidFileValue = 
              finalValue instanceof File || 
              (finalValue && typeof finalValue === 'object' && finalValue.file instanceof File) ||
              typeof finalValue === 'number' || 
              finalValue === null;
            
            if (!isValidFileValue) {
              console.warn(`[CompliancePage] Skipping invalid file field value for ${fieldSlug}:`, finalValue);
              return null; // Filter this out
            }
          }
          
          return {
            field_slug: fieldSlug,
            value: finalValue,
          };
        })
        .filter(update => update !== null); // Remove null entries (filtered out invalid values)

      // Debug logging
      console.log('[CompliancePage] Submitting updates:', {
        totalUpdates: updates.length,
        fileUploads: uploadedFileIds.size,
        uploadedFileIds: Array.from(uploadedFileIds.entries()),
        updates: updates.map(u => ({
          field_slug: u.field_slug,
          hasFileId: !!u.file_id,
          file_id: u.file_id,
          hasValue: u.value !== null && u.value !== undefined,
          value: u.value,
        })),
      });
      
      if (updates.length === 0) {
        console.warn('[CompliancePage] No valid fields to update. Debug info:', {
          fieldIdToSlugMapSize: fieldIdToSlugMap.size,
          fieldIdToSlugMapEntries: Array.from(fieldIdToSlugMap.entries()),
          customFieldsDataKeys: Object.keys(customFieldsData),
          customFieldsDataEntries: Object.entries(customFieldsData),
          hierarchySections: customFieldsHierarchy?.sections?.length || 0,
          uploadedFileIds: Array.from(uploadedFileIds.entries()),
        });
      }

      if (updates.length === 0) {
        toast.warning("No valid fields to update");
        setIsUpdatingCustomFields(false);
        return;
      }

      await bulkUpdateUserCustomFieldsMutation.mutateAsync({
        userSlug,
        updates,
      });

      // After successful update, refresh the initial data to match current state
      // This prevents "unsaved changes" from showing after a successful save
      setInitialCustomFieldsData((prev) => {
        const updated = { ...prev };
        // Update initial values for fields that were updated
        updates.forEach(update => {
          // Find the field ID from the slug
          const fieldId = Array.from(fieldIdToSlugMap.entries())
            .find(([id, slug]) => slug === update.field_slug)?.[0];
          if (fieldId) {
            // Store the file_id or value as the new initial value
            if (update.file_id) {
              updated[fieldId] = update.file_id;
            } else {
              updated[fieldId] = update.value;
            }
          }
        });
        return updated;
      });
      
      setHasCustomFieldsChanges(false);
      // Success toast is handled by the mutation hook
    } catch (error) {
      console.error("Failed to update custom fields:", error);
      
      // Handle structured bulk update errors and show field-specific errors
      const errorData = error.response?.data?.detail;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Map field slugs back to field IDs for inline error display
        const slugToFieldIdMap = new Map();
        if (customFieldsHierarchy?.sections) {
          customFieldsHierarchy.sections
            .filter(section => section.is_active !== false)
            .forEach(section => {
              section.fields
                ?.filter(field => field.is_active !== false)
                .forEach(field => {
                  if (field.slug) {
                    slugToFieldIdMap.set(field.slug, field.id);
                  }
                });
            });
        }

        // Set field-specific errors for display
        const fieldErrors = {};
        errorData.errors.forEach((err) => {
          const fieldId = slugToFieldIdMap.get(err.field_slug);
          if (fieldId) {
            fieldErrors[fieldId] = err.error || "Failed to update this field";
          }
        });
        
        if (Object.keys(fieldErrors).length > 0) {
          setCustomFieldsErrors(fieldErrors);
        }
      }
      
      // Error toast is handled by the mutation hook, but we've added inline field errors above
    } finally {
      setIsUpdatingCustomFields(false);
    }
  };

  // Early returns after all hooks
  // Prevent hydration errors by showing consistent loading state
  if (!mounted || currentUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading user data...</span>
      </div>
    );
  }

  if (!currentUserData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Unable to load user data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="additional">Additional Information</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceSection
            entityType="user"
            entitySlug={userSlug}
            roleSlug={null}
            availableRoles={userRoles}
            isAdmin={false}
            canUpload={true}
          />
        </TabsContent>

        <TabsContent value="additional" className="space-y-6">
          {customFieldsHierarchyLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading custom fields...</span>
                </div>
              </CardContent>
            </Card>
          ) : customFieldsHierarchy?.sections && 
            customFieldsHierarchy.sections.filter(section => section.is_active !== false).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Complete your profile with additional details required by your organisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const activeSections = (customFieldsHierarchy.sections || [])
                    .filter(section => section.is_active !== false)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                  
                  if (activeSections.length === 0) {
                    return null;
                  }
                  
                  // If only one section, don't show tabs - just render it
                  if (activeSections.length === 1) {
                    const section = activeSections[0];
                    return (
                      <div className="space-y-6">
                        {(() => {
                          // Get all fields in this section, excluding compliance fields
                          const allFields = (section.fields || [])
                            .filter(field => field.is_active !== false)
                            .filter(field => !complianceFieldsMap.has(field.id));

                          // Don't render section if it has no fields
                          if (allFields.length === 0) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                No fields in this section
                              </div>
                            );
                          }

                          // Use the global map for parent field lookup (includes fields from all sections)
                          const allFieldsMap = allSectionsFieldsMap;

                          // Group related fields by their target_field_id
                          const relatedFieldsGroups = new Map();
                          const standaloneFields = [];
                          const fieldsInGroups = new Set();
                          
                          // First pass: Identify all related fields and group them
                          allFields.forEach((field) => {
                            const relationshipConfig = field.relationship_config;
                            if (relationshipConfig && relationshipConfig.target_field_id) {
                              const targetFieldId = relationshipConfig.target_field_id;
                              const parentField = allFieldsMap.get(targetFieldId);
                              
                              if (!relatedFieldsGroups.has(targetFieldId)) {
                                relatedFieldsGroups.set(targetFieldId, {
                                  parentField: parentField || null,
                                  relatedFields: []
                                });
                              }
                              relatedFieldsGroups.get(targetFieldId).relatedFields.push(field);
                              fieldsInGroups.add(field.id);
                              
                              if (parentField) {
                                if (!relatedFieldsGroups.get(targetFieldId).parentField) {
                                  relatedFieldsGroups.get(targetFieldId).parentField = parentField;
                                }
                                fieldsInGroups.add(parentField.id);
                              }
                            }
                          });
                          
                          // Second pass: Identify parent fields
                          allFields.forEach((field) => {
                            const isParent = Array.from(allFieldsMap.values()).some(f => 
                              f.relationship_config?.target_field_id === field.id
                            );
                            if (isParent) {
                              if (!relatedFieldsGroups.has(field.id)) {
                                relatedFieldsGroups.set(field.id, {
                                  parentField: field,
                                  relatedFields: []
                                });
                              } else {
                                relatedFieldsGroups.get(field.id).parentField = field;
                              }
                              fieldsInGroups.add(field.id);
                            }
                          });
                          
                          // Third pass: Add standalone fields
                          allFields.forEach((field) => {
                            if (!fieldsInGroups.has(field.id)) {
                              standaloneFields.push(field);
                            }
                          });

                          return (
                            <div className="space-y-4">
                              {section.section_description && (
                                <p className="text-sm text-muted-foreground">
                                  {section.section_description}
                                </p>
                              )}
                              
                              {/* Standalone Fields */}
                              {standaloneFields.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {standaloneFields.map((field) => (
                                    <CustomFieldRenderer
                                      key={field.id}
                                      field={field}
                                      value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                      onChange={handleCustomFieldChange}
                                      error={customFieldsErrors[field.id]}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Related Fields Groups */}
                              {Array.from(relatedFieldsGroups.entries()).map(([targetFieldId, group]) => {
                                const { parentField, relatedFields } = group;
                                
                                if (!parentField && relatedFields.length === 0) {
                                  return null;
                                }
                                
                                const allGroupFields = parentField 
                                  ? [parentField, ...relatedFields]
                                  : relatedFields;
                                
                                const groupTitle = parentField 
                                  ? (parentField.field_label || parentField.field_name || "Related Fields")
                                  : "Related Fields";
                                
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
                                      {allGroupFields.map((field) => (
                                        <CustomFieldRenderer
                                          key={field.id}
                                          field={field}
                                          value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                          onChange={handleCustomFieldChange}
                                          error={customFieldsErrors[field.id]}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }
                  
                  // Multiple sections - show tabs
                  const currentSectionIndex = activeSections.findIndex(s => s.id.toString() === activeSectionTab);
                  const hasPrevious = currentSectionIndex > 0;
                  const hasNext = currentSectionIndex < activeSections.length - 1;
                  
                  const handlePrevious = () => {
                    if (hasPrevious) {
                      setActiveSectionTab(activeSections[currentSectionIndex - 1].id.toString());
                    }
                  };
                  
                  const handleNext = () => {
                    if (hasNext) {
                      setActiveSectionTab(activeSections[currentSectionIndex + 1].id.toString());
                    }
                  };
                  
                  return (
                    <Tabs value={activeSectionTab || undefined} onValueChange={setActiveSectionTab} className="space-y-6">
                      <div className="flex items-center gap-2">
                        {/* Scrollable Tabs Container */}
                        <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                          <TabsList className="inline-flex min-w-max w-full">
                            {activeSections.map((section) => (
                              <TabsTrigger 
                                key={section.id} 
                                value={section.id.toString()}
                                className="text-sm whitespace-nowrap flex-shrink-0"
                              >
                                {section.section_name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </div>
                        
                        {/* Navigation Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={!hasPrevious}
                            className="flex items-center gap-1"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={!hasNext}
                            className="flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {activeSections.map((section) => (
                        <TabsContent key={section.id} value={section.id.toString()} className="space-y-6 mt-6">
                          {section.section_description && (
                            <p className="text-sm text-muted-foreground">
                              {section.section_description}
                            </p>
                          )}
                          
                          {(() => {
                            // Get all fields in this section, excluding compliance fields
                            const allFields = (section.fields || [])
                              .filter(field => field.is_active !== false)
                              .filter(field => !complianceFieldsMap.has(field.id));

                            if (allFields.length === 0) {
                              return (
                                <div className="text-center py-8 text-muted-foreground">
                                  No fields in this section
                                </div>
                              );
                            }

                            const allFieldsMap = allSectionsFieldsMap;
                            const relatedFieldsGroups = new Map();
                            const standaloneFields = [];
                            const fieldsInGroups = new Set();
                            
                            allFields.forEach((field) => {
                              const relationshipConfig = field.relationship_config;
                              if (relationshipConfig && relationshipConfig.target_field_id) {
                                const targetFieldId = relationshipConfig.target_field_id;
                                const parentField = allFieldsMap.get(targetFieldId);
                                
                                if (!relatedFieldsGroups.has(targetFieldId)) {
                                  relatedFieldsGroups.set(targetFieldId, {
                                    parentField: parentField || null,
                                    relatedFields: []
                                  });
                                }
                                relatedFieldsGroups.get(targetFieldId).relatedFields.push(field);
                                fieldsInGroups.add(field.id);
                                
                                if (parentField) {
                                  if (!relatedFieldsGroups.get(targetFieldId).parentField) {
                                    relatedFieldsGroups.get(targetFieldId).parentField = parentField;
                                  }
                                  fieldsInGroups.add(parentField.id);
                                }
                              }
                            });
                            
                            allFields.forEach((field) => {
                              const isParent = Array.from(allFieldsMap.values()).some(f => 
                                f.relationship_config?.target_field_id === field.id
                              );
                              if (isParent) {
                                if (!relatedFieldsGroups.has(field.id)) {
                                  relatedFieldsGroups.set(field.id, {
                                    parentField: field,
                                    relatedFields: []
                                  });
                                } else {
                                  relatedFieldsGroups.get(field.id).parentField = field;
                                }
                                fieldsInGroups.add(field.id);
                              }
                            });
                            
                            allFields.forEach((field) => {
                              if (!fieldsInGroups.has(field.id)) {
                                standaloneFields.push(field);
                              }
                            });

                            return (
                              <div className="space-y-4">
                                {standaloneFields.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {standaloneFields.map((field) => (
                                      <CustomFieldRenderer
                                        key={field.id}
                                        field={field}
                                        value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                        onChange={handleCustomFieldChange}
                                        error={customFieldsErrors[field.id]}
                                      />
                                    ))}
                                  </div>
                                )}

                                {Array.from(relatedFieldsGroups.entries()).map(([targetFieldId, group]) => {
                                  const { parentField, relatedFields } = group;
                                  
                                  if (!parentField && relatedFields.length === 0) {
                                    return null;
                                  }
                                  
                                  const allGroupFields = parentField 
                                    ? [parentField, ...relatedFields]
                                    : relatedFields;
                                  
                                  const groupTitle = parentField 
                                    ? (parentField.field_label || parentField.field_name || "Related Fields")
                                    : "Related Fields";
                                  
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
                                        {allGroupFields.map((field) => (
                                          <CustomFieldRenderer
                                            key={field.id}
                                            field={field}
                                            value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                            onChange={handleCustomFieldChange}
                                            error={customFieldsErrors[field.id]}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </TabsContent>
                      ))}
                      
                      {/* Section Navigation Footer */}
                      {activeSections.length > 1 && (() => {
                        const footerCurrentIndex = activeSections.findIndex(s => s.id.toString() === activeSectionTab);
                        const footerHasPrevious = footerCurrentIndex > 0;
                        const footerHasNext = footerCurrentIndex < activeSections.length - 1;
                        
                        return (
                          <div className="flex justify-between items-center pt-4 border-t mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (footerHasPrevious) {
                                  setActiveSectionTab(activeSections[footerCurrentIndex - 1].id.toString());
                                }
                              }}
                              disabled={!footerHasPrevious}
                              className="flex items-center gap-2"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span>Previous Section</span>
                            </Button>
                            
                            <div className="text-sm text-muted-foreground">
                              Section {footerCurrentIndex + 1} of {activeSections.length}
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (footerHasNext) {
                                  setActiveSectionTab(activeSections[footerCurrentIndex + 1].id.toString());
                                }
                              }}
                              disabled={!footerHasNext}
                              className="flex items-center gap-2"
                            >
                              <span>Next Section</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })()}
                    </Tabs>
                  );
                })()}
                
                {/* Save Changes Button - Always visible at the bottom */}
                <div className="flex justify-between items-center pt-6 mt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    {hasCustomFieldsChanges && (
                      <span className="text-amber-600 dark:text-amber-400">
                        You have unsaved changes
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleCustomFieldsBulkUpdate}
                    disabled={isUpdatingCustomFields || !hasCustomFieldsChanges}
                    variant={hasCustomFieldsChanges ? "default" : "outline"}
                  >
                    {isUpdatingCustomFields ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {hasCustomFieldsChanges ? "Save Changes" : "Save Custom Fields"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Complete your profile with additional details required by your organisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Additional Information Required</h3>
                  <p className="text-muted-foreground mb-4">
                    Your organisation hasn't configured any additional profile fields yet. Contact your administrator if you need to add more information to your profile.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

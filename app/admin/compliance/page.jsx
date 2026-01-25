"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceSection } from "@/components/ComplianceSection";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { useCurrentUser } from "@/hooks/useAuth";
import { 
  useUserCustomFieldsHierarchy, 
  useUserCustomFields, 
  useBulkUpdateUserCustomFields 
} from "@/hooks/useProfile";
import { useEntityCompliance } from "@/hooks/useCompliance";
import { Shield, Loader2, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CompliancePage() {
  const { data: currentUserData, isLoading: currentUserLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("compliance");

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

  // Fetch compliance data to filter out compliance fields from custom fields
  const { data: complianceData } = useEntityCompliance(
    "user",
    userSlug,
    null,
    null
  );

  // Helper function to extract value from API response
  const extractValueFromAPIResponse = (field, valueData) => {
    if (!valueData) return "";
    
    // Handle different field types
    if (field.field_type === "file" || field.field_type === "image") {
      return valueData.file_id || valueData.file_slug || "";
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
          if (field.value_data) {
            fieldsMap[field.id] = extractValueFromAPIResponse(field, field.value_data);
          } else {
            fieldsMap[field.id] = "";
          }
        });
      });
      setCustomFieldsData(fieldsMap);
      setInitialCustomFieldsData(JSON.parse(JSON.stringify(fieldsMap))); // Deep copy for comparison
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

            const currentValue = customFieldsData[field.id] || "";
            
            // Get the original value from userCustomFields (which has the actual values)
            let apiValue = "";
            if (userCustomFields && userCustomFields.sections) {
              const userField = userCustomFields.sections
                .flatMap(section => section.fields || [])
                .find(f => f.id === field.id);
              if (userField && userField.value_data) {
                apiValue = extractValueFromAPIResponse(userField, userField.value_data);
              }
            }
            
            if (currentValue !== apiValue) {
              hasChanges = true;
            }
          });
      });

    setHasCustomFieldsChanges(hasChanges);
  }, [customFieldsHierarchy, userCustomFields, customFieldsData, complianceData]);

  const handleCustomFieldChange = (fieldId, value) => {
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
          
          // Normalize values for comparison (handle null, undefined, empty string)
          const normalizeValue = (val) => {
            if (val === null || val === undefined || val === '') return null;
            return val;
          };
          
          const normalizedCurrent = normalizeValue(currentValue);
          const normalizedInitial = normalizeValue(initialValue);
          
          // Only include if value has actually changed
          return normalizedCurrent !== normalizedInitial;
        })
        .map(([fieldId, value]) => {
          const fieldIdInt = parseInt(fieldId);
          return {
            field_slug: fieldIdToSlugMap.get(fieldIdInt),
            value: value !== undefined && value !== '' ? value : null,
          };
        });

      // Debug logging if no updates
      if (updates.length === 0) {
        console.warn('No valid fields to update. Debug info:', {
          fieldIdToSlugMapSize: fieldIdToSlugMap.size,
          fieldIdToSlugMapEntries: Array.from(fieldIdToSlugMap.entries()),
          customFieldsDataKeys: Object.keys(customFieldsData),
          customFieldsDataEntries: Object.entries(customFieldsData),
          hierarchySections: customFieldsHierarchy?.sections?.length || 0,
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

  if (currentUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
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

  // Create a map of compliance fields by field ID for quick lookup
  const complianceFieldsMap = new Map();
  if (complianceData?.compliance_fields) {
    complianceData.compliance_fields.forEach((cf) => {
      complianceFieldsMap.set(cf.custom_field_id, cf);
    });
  }

  // Create a map of ALL fields across ALL sections for parent field lookup
  const allSectionsFieldsMap = React.useMemo(() => {
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
              <CardContent className="space-y-6">
                {(customFieldsHierarchy.sections || [])
                  .filter(section => section.is_active !== false)
                  .map((section) => {
                    // Get all fields in this section, excluding compliance fields
                    const allFields = (section.fields || [])
                      .filter(field => field.is_active !== false)
                      .filter(field => !complianceFieldsMap.has(field.id));

                    // Don't render section if it has no fields
                    if (allFields.length === 0) {
                      return null;
                    }

                    // Use the global map for parent field lookup (includes fields from all sections)
                    const allFieldsMap = allSectionsFieldsMap;

                    // Group related fields by their target_field_id
                    const relatedFieldsGroups = new Map();
                    const standaloneFields = [];
                    const fieldsInGroups = new Set(); // Track which fields are already in groups
                    
                    // First pass: Identify all related fields and group them
                    allFields.forEach((field) => {
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
                    allFields.forEach((field) => {
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
                    allFields.forEach((field) => {
                      if (!fieldsInGroups.has(field.id)) {
                        standaloneFields.push(field);
                      }
                    });

                    return (
                      <div key={section.id} className="space-y-4">
                        <div className="border-b pb-2">
                          <h3 className="text-lg font-semibold">{section.section_name}</h3>
                          {section.section_description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.section_description}
                            </p>
                          )}
                        </div>

                        {/* Standalone Fields in Grid Layout */}
                        {standaloneFields.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {standaloneFields.map((field) => (
                              <CustomFieldRenderer
                                key={field.id}
                                field={field}
                                value={customFieldsData[field.id] || ''}
                                onChange={handleCustomFieldChange}
                                error={customFieldsErrors[field.id]}
                              />
                            ))}
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
                                {allGroupFields.map((field) => (
                                  <CustomFieldRenderer
                                    key={field.id}
                                    field={field}
                                    value={customFieldsData[field.id] || ''}
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
                  })}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {hasCustomFieldsChanges && (
                      <span className="text-amber-600 font-medium">
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

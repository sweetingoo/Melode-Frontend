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
      // Prepare updates array
      const updates = Object.entries(customFieldsData).map(([fieldId, value]) => ({
        field_id: parseInt(fieldId),
        value: value || null,
      }));

      await bulkUpdateUserCustomFieldsMutation.mutateAsync({
        userSlug,
        updates,
      });

      setHasCustomFieldsChanges(false);
      toast.success("Custom fields updated successfully");
    } catch (error) {
      console.error("Failed to update custom fields:", error);
      toast.error("Failed to update custom fields");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Compliance & Additional Information
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your compliance documents and complete your profile information
        </p>
      </div>

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {allFields.map((field) => (
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

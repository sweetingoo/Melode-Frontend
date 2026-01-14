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
  const [customFieldsErrors, setCustomFieldsErrors] = useState({});
  const [hasCustomFieldsChanges, setHasCustomFieldsChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk update mutation (for user entities)
  const bulkUpdateUserCustomFieldsMutation = useBulkUpdateUserCustomFields();

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
      await renewComplianceMutation.mutateAsync({
        valueSlug: selectedComplianceValue.slug,
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
          if (field.value_data) {
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
          if (field.value !== undefined && field.value !== null) {
            initialData[field.id] = field.value;
          }
        });
      });
    }
    
    setCustomFieldsData(initialData);
    setHasCustomFieldsChanges(false);
  }, [hierarchy, userCustomFieldsValues, entityType]);

  // Handle field value changes
  const handleCustomFieldChange = (fieldId, value) => {
    if (readOnly) return;

    setCustomFieldsData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
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
      if (entityType === "user" && entityId) {
        // Use bulk update for user entities
        const updates = Object.entries(customFieldsData).map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value: value,
        }));

        await bulkUpdateUserCustomFieldsMutation.mutateAsync({
          userId: entityId,
          updates,
        });
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

      setHasCustomFieldsChanges(false);
      toast.success("Custom fields updated successfully!");

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Failed to update custom fields:", error);
      toast.error("Failed to update custom fields", {
        description:
          error.response?.data?.message ||
          "An error occurred while updating custom fields.",
      });

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
        {hierarchy.sections
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
                  
                  return (
                    <>
                      {/* Regular Fields in Grid Layout */}
                      {regularFieldsInSection.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {regularFieldsInSection.map((field) => {
                            // Get value from customFieldsData (populated from values endpoint) or fallback to field.value
                            const fieldValue = customFieldsData[field.id] !== undefined 
                              ? customFieldsData[field.id] 
                              : (field.value !== undefined ? field.value : "");
                            
                            return (
                              <CustomFieldRenderer
                                key={field.id}
                                field={field}
                                value={fieldValue}
                                onChange={handleCustomFieldChange}
                                error={customFieldsErrors[field.id]}
                                readOnly={readOnly}
                              />
                            );
                          })}
                        </div>
                      )}
                      
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
          })}


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

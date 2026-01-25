"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, RefreshCw, Shield } from "lucide-react";
import { ComplianceFieldCard } from "./ComplianceFieldCard";
import { ComplianceUploadModal } from "./ComplianceUploadModal";
import { ComplianceHistory } from "./ComplianceHistory";
import { useEntityCompliance, useUploadCompliance, useRenewCompliance, useComplianceHistory } from "@/hooks/useCompliance";
import { filesService } from "@/services/files";

export const ComplianceSection = ({
  entityType,
  entitySlug,
  roleSlug = null,
  assetTypeSlug = null,
  availableRoles = null, // Array of roles: [{ id, slug, name, ... }]
  isAdmin = false,
  canUpload = true,
}) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [isRenewal, setIsRenewal] = useState(false);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState(roleSlug);

  // Update selected role when roleSlug prop changes
  useEffect(() => {
    setSelectedRoleSlug(roleSlug);
  }, [roleSlug]);

  // Determine if we should show role selector (only for users with multiple roles)
  const showRoleSelector = entityType === "user" && availableRoles && availableRoles.length > 1;
  const effectiveRoleSlug = selectedRoleSlug || (availableRoles && availableRoles.length === 1 ? availableRoles[0].slug : null);

  // Debug logging
  useEffect(() => {
    console.log("ComplianceSection props:", {
      entityType,
      entitySlug,
      roleSlug,
      effectiveRoleSlug,
      assetTypeSlug,
      availableRoles,
    });
  }, [entityType, entitySlug, roleSlug, effectiveRoleSlug, assetTypeSlug, availableRoles]);

  const { data: complianceData, isLoading, error, refetch } = useEntityCompliance(
    entityType,
    entitySlug,
    effectiveRoleSlug,
    assetTypeSlug
  );

  // Debug logging for query state
  useEffect(() => {
    console.log("useEntityCompliance query state:", {
      isLoading,
      error,
      hasData: !!complianceData,
      entityType,
      entitySlug,
      effectiveRoleSlug,
    });
  }, [isLoading, error, complianceData, entityType, entitySlug, effectiveRoleSlug]);

  const uploadMutation = useUploadCompliance();
  const renewMutation = useRenewCompliance();

  const handleUpload = (field, existingValue = null) => {
    // The field object should already have sub_field_definitions from the API response
    // Just ensure we're passing it correctly
    console.log("=== handleUpload - Field received ===", {
      field_name: field.field_name,
      field_label: field.field_label,
      has_sub_field_definitions: !!field.sub_field_definitions,
      sub_field_definitions_count: field.sub_field_definitions?.length || 0,
      sub_field_definitions: field.sub_field_definitions,
      compliance_config: field.compliance_config,
      existingValue: existingValue,
      full_field: field
    });
    
    setSelectedField(field);
    setSelectedValue(existingValue || null);
    setIsRenewal(!!existingValue); // If there's an existing value, treat it as a renewal/update
    setUploadModalOpen(true);
  };

  const handleRenew = (value, field) => {
    setSelectedValue(value);
    setSelectedField(field);
    setIsRenewal(true);
    setUploadModalOpen(true);
  };

  const handleViewHistory = async (field, value) => {
    if (!value || !value.id || value.id === 0) {
      return; // No history for fields without values
    }
    setSelectedField(field);
    setSelectedValue(value);
    setHistoryModalOpen(true);
  };

  const handleUploadSubmit = async (uploadData) => {
    if (isRenewal && selectedValue) {
      await renewMutation.mutateAsync({
        valueSlug: selectedValue.slug,
        renewalData: uploadData,
      });
    } else {
      await uploadMutation.mutateAsync(uploadData);
    }
  };

  const handleDownload = async (file) => {
    if (file.file_reference_id || file.id) {
      try {
        const response = await filesService.getFileUrl(file.file_reference_id || file.id);
        const url = response.url || response;
        if (url) {
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error("Failed to get file URL:", error);
        // Fallback to download_url if available
        if (file.download_url) {
          window.open(file.download_url, "_blank");
        }
      }
    } else if (file.download_url) {
      window.open(file.download_url, "_blank");
    }
  };

  // Get history for selected field
  const { data: historyData, isLoading: historyLoading } = useComplianceHistory(
    selectedField?.slug || selectedField?.field_slug || "",
    entityType,
    entitySlug,
    1,
    50
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading compliance data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <span className="ml-2 text-destructive">
            Failed to load compliance data. Please try again.
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!complianceData || !complianceData.compliance_fields || complianceData.compliance_fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
          <CardDescription>No compliance fields configured for this entity.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group fields by section or show all
  const fields = complianceData.compliance_fields;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Compliance</CardTitle>
              </div>
              
              {/* Role Selector - Only show for users with multiple roles */}
              {showRoleSelector && (
                <div className="mb-3">
                  <Label htmlFor="role-selector" className="text-sm font-medium mb-2 block">
                    Select Job Role / Shift Role
                  </Label>
                  <Select
                    value={selectedRoleSlug || "all"}
                    onValueChange={(value) => {
                      setSelectedRoleSlug(value === "all" ? null : value);
                    }}
                  >
                    <SelectTrigger id="role-selector" className="w-full max-w-md">
                      <SelectValue placeholder="Select a role to view compliance requirements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles (General Compliance)</SelectItem>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id || role.slug} value={role.slug}>
                          {role.name || role.role_name || role.slug}
                          {role.shift_name && ` - ${role.shift_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Different roles may have different compliance requirements
                  </p>
                </div>
              )}

              <CardDescription>
                {complianceData.total_fields} field{complianceData.total_fields !== 1 ? "s" : ""}
                {effectiveRoleSlug && (
                  <span className="ml-2">
                    for {availableRoles?.find(r => r.slug === effectiveRoleSlug)?.name || "selected role"}
                  </span>
                )}
                {complianceData.compliant_count > 0 && (
                  <span className="ml-2">
                    • {complianceData.compliant_count} compliant
                  </span>
                )}
                {complianceData.expiring_count > 0 && (
                  <span className="ml-2 text-yellow-600">
                    • {complianceData.expiring_count} expiring soon
                  </span>
                )}
                {complianceData.expired_count > 0 && (
                  <span className="ml-2 text-red-600">
                    • {complianceData.expired_count} expired
                  </span>
                )}
                {complianceData.pending_approval_count > 0 && (
                  <span className="ml-2 text-orange-600">
                    • {complianceData.pending_approval_count} pending approval
                  </span>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((fieldValue) => {
              // Get sub_field_definitions from multiple sources
              let subFieldDefinitions = fieldValue.sub_field_definitions || null;
              
              // Fallback: If sub_field_definitions is not available, try getting from compliance_config
              if (!subFieldDefinitions && fieldValue.compliance_config) {
                if (fieldValue.compliance_config.has_sub_fields && fieldValue.compliance_config.sub_fields) {
                  subFieldDefinitions = fieldValue.compliance_config.sub_fields;
                }
              }
              
              // Field information is included in the response
              const field = {
                id: fieldValue.custom_field_id,
                slug: fieldValue.field_slug || fieldValue.slug,
                field_name: fieldValue.field_name || "Unknown Field",
                field_label: fieldValue.field_label || fieldValue.field_name || "Unknown Field",
                field_description: fieldValue.field_description,
                requires_approval: fieldValue.requires_approval,
                // Include compliance_config and sub_field_definitions for proper rendering
                compliance_config: fieldValue.compliance_config || null,
                sub_field_definitions: subFieldDefinitions,
              };

              return (
                <ComplianceFieldCard
                  key={fieldValue.id || fieldValue.custom_field_id}
                  field={field}
                  value={fieldValue}
                  onUpload={handleUpload}
                  onRenew={handleRenew}
                  onViewHistory={handleViewHistory}
                  onDownload={handleDownload}
                  isAdmin={isAdmin}
                  canUpload={canUpload}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {selectedField && (
        <ComplianceUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          field={selectedField}
          entityType={entityType}
          entitySlug={entitySlug}
          onUpload={handleUploadSubmit}
          isRenewal={isRenewal}
          existingValue={selectedValue}
        />
      )}

      {/* History Modal */}
      {selectedField && (
        <ComplianceHistory
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
          field={selectedField}
          history={historyData?.history || []}
          isLoading={historyLoading}
          onDownload={handleDownload}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
};

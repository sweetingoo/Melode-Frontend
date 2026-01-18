"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useComplianceItem, useComplianceHistory, useApproveCompliance } from "@/hooks/useCompliance";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { ResourceAuditLogs } from "@/components/ResourceAuditLogs";
import { ComplianceHistory } from "@/components/ComplianceHistory";
import { filesService } from "@/services/files";
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  User,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  X,
} from "lucide-react";
import { format } from "date-fns";

export default function ComplianceItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const valueSlug = params.valueSlug || params.slug;
  const [activeTab, setActiveTab] = useState("details");
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const { hasPermission } = usePermissionsCheck();
  const canManageCompliance = hasPermission("compliance_monitoring:manage");

  const { data: complianceItem, isLoading, error } = useComplianceItem(valueSlug);
  const approveMutation = useApproveCompliance();

  // Get compliance history
  const { data: historyData, isLoading: historyLoading } = useComplianceHistory(
    complianceItem?.field_slug || complianceItem?.field?.slug || "",
    complianceItem?.entity_type || "",
    complianceItem?.entity_slug || "",
    1,
    50
  );

  const handleApprove = () => {
    setApprovalNotes("");
    setApprovalModalOpen(true);
  };

  const handleApproveSubmit = async (approved) => {
    if (!complianceItem) return;

    setIsApproving(true);
    try {
      await approveMutation.mutateAsync({
        valueSlug: complianceItem.value_slug || valueSlug,
        approved,
        backendNotes: approvalNotes || null,
      });
      setApprovalModalOpen(false);
      setApprovalNotes("");
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownload = async (file) => {
    if (file?.id || file?.file_reference_id) {
      try {
        const fileId = file.id || file.file_reference_id;
        const response = await filesService.getFileUrl(fileId);
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
    } else if (file?.download_url) {
      window.open(file.download_url, "_blank");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "declined":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (item) => {
    if (item?.is_expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (!item?.is_expired && item?.days_until_expiry !== null && item?.days_until_expiry <= 30 && item?.days_until_expiry > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">Expiring Soon</Badge>;
    }
    if (item?.approval_status === "pending") {
      return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">Pending Approval</Badge>;
    }
    if (item?.approval_status === "approved") {
      return <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700">Approved</Badge>;
    }
    if (item?.approval_status === "declined") {
      return <Badge variant="destructive">Declined</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading compliance item...</span>
        </div>
      </div>
    );
  }

  if (error || !complianceItem) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Compliance Item Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The compliance item you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push("/admin/compliance-monitoring")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Compliance Monitoring
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const field = complianceItem.field || {};
  const history = historyData?.items || historyData || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/compliance-monitoring")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {getStatusIcon(complianceItem.approval_status)}
              {field.field_label || field.field_name || "Compliance Item"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {field.field_description || "Compliance document details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(complianceItem)}
          {complianceItem.approval_status === "pending" && canManageCompliance && (
            <Button onClick={handleApprove} variant="default">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Review
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">Compliance History</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Field Name</Label>
                  <p className="font-medium">{field.field_label || field.field_name || "—"}</p>
                </div>
                {field.field_description && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Description</Label>
                    <p className="text-sm">{field.field_description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground text-sm">Entity</Label>
                  <p className="font-medium">
                    {complianceItem.entity_name || `${complianceItem.entity_type} #${complianceItem.entity_id}`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Entity Type</Label>
                  <p className="font-medium capitalize">{complianceItem.entity_type || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Approval Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(complianceItem.approval_status)}
                    <span className="capitalize font-medium">{complianceItem.approval_status || "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates & Expiry */}
            <Card>
              <CardHeader>
                <CardTitle>Dates & Expiry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceItem.expiry_date && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Expiry Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(complianceItem.expiry_date), "dd MMM yyyy")}
                      </p>
                    </div>
                    {complianceItem.days_until_expiry !== null && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {complianceItem.days_until_expiry > 0
                          ? `${complianceItem.days_until_expiry} days remaining`
                          : `${Math.abs(complianceItem.days_until_expiry)} days ago`}
                      </p>
                    )}
                  </div>
                )}
                {complianceItem.renewal_date && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Renewal Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(complianceItem.renewal_date), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                {complianceItem.uploaded_at && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Uploaded</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(complianceItem.uploaded_at), "dd MMM yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
                {complianceItem.approved_at && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Approved</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(complianceItem.approved_at), "dd MMM yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Details */}
          {complianceItem.value_data && complianceItem.sub_field_definitions && complianceItem.sub_field_definitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {complianceItem.sub_field_definitions.map((subField) => {
                    const subValue = complianceItem.value_data?.[subField.field_name];
                    if (subValue === undefined || subValue === null || subValue === "") return null;
                    
                    let displayValue = subValue;
                    if (subField.field_type === "date" && subValue) {
                      try {
                        displayValue = format(new Date(subValue), "dd MMM yyyy");
                      } catch (e) {
                        displayValue = subValue;
                      }
                    }
                    
                    return (
                      <div key={subField.field_name} className="space-y-1">
                        <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          {subField.field_label}
                        </Label>
                        <p className="font-medium">{String(displayValue)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Information */}
          {complianceItem.file && (
            <Card>
              <CardHeader>
                <CardTitle>Document File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-md border">
                  <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{complianceItem.file.file_name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {complianceItem.file.content_type} • {(complianceItem.file.file_size_bytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(complianceItem.file)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {complianceItem.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{complianceItem.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Upload Information */}
          {(complianceItem.uploaded_by_name || complianceItem.uploaded_at) && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complianceItem.uploaded_by_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-muted-foreground text-sm">Uploaded by</Label>
                      <p className="font-medium">{complianceItem.uploaded_by_name}</p>
                    </div>
                  </div>
                )}
                {complianceItem.uploaded_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-muted-foreground text-sm">Uploaded on</Label>
                      <p className="font-medium">
                        {format(new Date(complianceItem.uploaded_at), "dd MMM yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approval Information */}
          {(complianceItem.approved_by_name || complianceItem.approved_at) && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complianceItem.approved_by_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-muted-foreground text-sm">Approved by</Label>
                      <p className="font-medium">{complianceItem.approved_by_name}</p>
                    </div>
                  </div>
                )}
                {complianceItem.approved_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-muted-foreground text-sm">Approved on</Label>
                      <p className="font-medium">
                        {format(new Date(complianceItem.approved_at), "dd MMM yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
                {complianceItem.backend_notes && canManageCompliance && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-muted-foreground text-sm">Admin Notes</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{complianceItem.backend_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance History</CardTitle>
              <CardDescription>
                Previous compliance renewals and archived records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading history...</span>
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={item.id || index} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {format(new Date(item.archived_at), "dd MMM yyyy HH:mm")}
                          </span>
                          {item.approval_status && (
                            <Badge
                              variant={
                                item.approval_status === "approved"
                                  ? "default"
                                  : item.approval_status === "declined"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {item.approval_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="capitalize">{item.archived_reason}</span>
                        {item.uploaded_by_name && (
                          <span className="ml-2">
                            by {item.uploaded_by_name}
                          </span>
                        )}
                      </div>
                      {item.expiry_date && (
                        <div className="text-sm text-muted-foreground">
                          Expired: {format(new Date(item.expiry_date), "dd MMM yyyy")}
                        </div>
                      )}
                      {item.value_data && item.sub_field_definitions && item.sub_field_definitions.length > 0 && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                          <h5 className="text-sm font-semibold mb-2">Field Values:</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {item.sub_field_definitions.map((subField) => {
                              const subValue = item.value_data?.[subField.field_name];
                              if (subValue === undefined || subValue === null || subValue === "") return null;
                              
                              let displayValue = subValue;
                              if (subField.field_type === "date" && subValue) {
                                try {
                                  displayValue = format(new Date(subValue), "dd MMM yyyy");
                                } catch (e) {
                                  displayValue = subValue;
                                }
                              }
                              
                              return (
                                <div key={subField.field_name} className="space-y-1">
                                  <span className="text-muted-foreground text-xs">{subField.field_label}:</span>
                                  <div className="font-medium">{String(displayValue)}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {canManageCompliance && item.backend_notes && (
                        <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                          <span className="font-semibold">Admin Notes:</span>
                          <p className="text-muted-foreground mt-1">{item.backend_notes}</p>
                        </div>
                      )}
                      {item.file && (
                        <div className="flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.file.file_name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item.file)}
                            className="h-6 px-2"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
                      {index < history.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No compliance history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <ResourceAuditLogs
            resource="compliance_value"
            resourceSlug={valueSlug}
            title="Compliance Item Activity History"
            pageSize={20}
          />
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Compliance Document</DialogTitle>
            <DialogDescription>
              {field.field_label || field.field_name} - {complianceItem.entity_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Backend Notes (Private)</Label>
              <Textarea
                id="notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add private notes about this compliance document..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleApproveSubmit(false)}
              disabled={isApproving}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              onClick={() => handleApproveSubmit(true)}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

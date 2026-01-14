"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ComplianceSection } from "@/components/ComplianceSection";
import { useExpiringCompliance, usePendingApprovals, useApproveCompliance } from "@/hooks/useCompliance";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, FileText, Download, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { filesService } from "@/services/files";
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

export default function ComplianceAdminPage() {
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const { data: expiringData, isLoading: expiringLoading } = useExpiringCompliance(30, 1, 50);
  const { data: pendingData, isLoading: pendingLoading } = usePendingApprovals(1, 50);
  const approveMutation = useApproveCompliance();

  const handleApprove = (item) => {
    setSelectedItem(item);
    setApprovalNotes("");
    setApprovalModalOpen(true);
  };

  const handleApproveSubmit = async (approved) => {
    if (!selectedItem) return;

    setIsApproving(true);
    try {
      await approveMutation.mutateAsync({
        valueSlug: selectedItem.value_slug,
        approved,
        backendNotes: approvalNotes || null,
      });
      setApprovalModalOpen(false);
      setSelectedItem(null);
      setApprovalNotes("");
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDownload = async (file) => {
    if (file?.id) {
      try {
        const response = await filesService.getFileUrl(file.id);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage compliance documents, approvals, and track expiring items
        </p>
      </div>

      <Tabs defaultValue="expiring" className="w-full">
        <TabsList>
          <TabsTrigger value="expiring">Expiring Items</TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Compliance Items</CardTitle>
              <CardDescription>
                Items expiring within the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : expiringData?.items && expiringData.items.length > 0 ? (
                <div className="space-y-4">
                  {expiringData.items.map((item) => {
                    const isExpanded = expandedItems.has(item.value_id);
                    return (
                      <Card key={item.value_id} className={item.is_expired ? "border-red-500" : ""}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {getStatusIcon(item.approval_status)}
                                <h3 className="font-semibold break-words">{item.field_label || item.field_name}</h3>
                                {item.is_expired && <Badge variant="destructive">Expired</Badge>}
                                {!item.is_expired && item.days_until_expiry <= 30 && (
                                  <Badge variant="warning">Expiring Soon</Badge>
                                )}
                              </div>
                              {item.field_description && (
                                <p className="text-sm text-muted-foreground mb-3">{item.field_description}</p>
                              )}
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>
                                  <span className="font-medium">Entity:</span> {item.entity_name || `${item.entity_type} #${item.entity_id}`}
                                </p>
                                {item.expiry_date && (
                                  <p>
                                    <span className="font-medium">Expiry Date:</span>{" "}
                                    {format(new Date(item.expiry_date), "dd MMM yyyy")}
                                    {item.days_until_expiry !== null && (
                                      <span className="ml-2">
                                        ({item.days_until_expiry > 0
                                          ? `${item.days_until_expiry} days`
                                          : `${Math.abs(item.days_until_expiry)} days ago`})
                                      </span>
                                    )}
                                  </p>
                                )}
                                {item.renewal_date && (
                                  <p>
                                    <span className="font-medium">Renewal Date:</span>{" "}
                                    {format(new Date(item.renewal_date), "dd MMM yyyy")}
                                  </p>
                                )}
                                {item.approval_status && (
                                  <p>
                                    <span className="font-medium">Status:</span>{" "}
                                    <span className="capitalize">{item.approval_status}</span>
                                  </p>
                                )}
                              </div>
                              
                              {/* Expanded Details */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t space-y-4">
                                  {/* Sub-field values */}
                                  {item.value_data && item.sub_field_definitions && item.sub_field_definitions.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Document Details</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
                                              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{subField.field_label}</span>
                                              <div className="font-medium text-foreground">{displayValue}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* File Information */}
                                  {item.file && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Document File</h4>
                                      <div className="flex items-center gap-3 text-sm p-3 bg-muted/20 rounded-md border">
                                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">{item.file.file_name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {item.file.content_type} • {(item.file.file_size_bytes / 1024).toFixed(1)} KB
                                          </p>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDownload(item.file)}
                                          className="flex-shrink-0"
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Download
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {item.notes && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Notes</h4>
                                      <p className="text-sm p-3 bg-muted/20 rounded-md border">{item.notes}</p>
                                    </div>
                                  )}

                                  {/* Upload Information */}
                                  {(item.uploaded_by_name || item.uploaded_at) && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Upload Information</h4>
                                      <div className="text-sm space-y-1">
                                        {item.uploaded_by_name && (
                                          <p>
                                            <User className="h-3 w-3 inline mr-1" />
                                            <span className="font-medium">Uploaded by:</span> {item.uploaded_by_name}
                                          </p>
                                        )}
                                        {item.uploaded_at && (
                                          <p>
                                            <Calendar className="h-3 w-3 inline mr-1" />
                                            <span className="font-medium">Uploaded on:</span> {format(new Date(item.uploaded_at), "dd MMM yyyy 'at' HH:mm")}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Approval Information */}
                                  {(item.approved_by_name || item.approved_at) && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Approval Information</h4>
                                      <div className="text-sm space-y-1">
                                        {item.approved_by_name && (
                                          <p>
                                            <User className="h-3 w-3 inline mr-1" />
                                            <span className="font-medium">Approved by:</span> {item.approved_by_name}
                                          </p>
                                        )}
                                        {item.approved_at && (
                                          <p>
                                            <Calendar className="h-3 w-3 inline mr-1" />
                                            <span className="font-medium">Approved on:</span> {format(new Date(item.approved_at), "dd MMM yyyy 'at' HH:mm")}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-start items-stretch sm:flex-shrink-0 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleExpand(item.value_id)}
                                className="flex-shrink-0"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Hide Details</span>
                                    <span className="sm:hidden">Hide</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">View Details</span>
                                    <span className="sm:hidden">Details</span>
                                  </>
                                )}
                              </Button>
                              {item.approval_status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(item)}
                                  className="flex-shrink-0"
                                >
                                  Review
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No expiring items found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Compliance documents awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : pendingData?.items && pendingData.items.length > 0 ? (
                <div className="space-y-4">
                  {pendingData.items.map((item) => {
                      const isExpanded = expandedItems.has(item.value_id);
                      return (
                        <Card key={item.value_id}>
                          <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <h3 className="font-semibold break-words">{item.field_label || item.field_name}</h3>
                                  <Badge variant="warning">Pending</Badge>
                                </div>
                                {item.field_description && (
                                  <p className="text-sm text-muted-foreground mb-3">{item.field_description}</p>
                                )}
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>
                                    <span className="font-medium">Entity:</span> {item.entity_name || `${item.entity_type} #${item.entity_id}`}
                                  </p>
                                  {item.expiry_date && (
                                    <p>
                                      <span className="font-medium">Expiry Date:</span>{" "}
                                      {format(new Date(item.expiry_date), "dd MMM yyyy")}
                                    </p>
                                  )}
                                  {item.renewal_date && (
                                    <p>
                                      <span className="font-medium">Renewal Date:</span>{" "}
                                      {format(new Date(item.renewal_date), "dd MMM yyyy")}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Expanded Details */}
                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t space-y-4">
                                    {/* Sub-field values */}
                                    {item.value_data && item.sub_field_definitions && item.sub_field_definitions.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Document Details</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
                                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{subField.field_label}</span>
                                                <div className="font-medium text-foreground">{displayValue}</div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* File Information */}
                                    {item.file && (
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Document File</h4>
                                        <div className="flex items-center gap-3 text-sm p-3 bg-muted/20 rounded-md border">
                                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.file.file_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {item.file.content_type} • {(item.file.file_size_bytes / 1024).toFixed(1)} KB
                                            </p>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(item.file)}
                                            className="flex-shrink-0"
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Notes */}
                                    {item.notes && (
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Notes</h4>
                                        <p className="text-sm p-3 bg-muted/20 rounded-md border">{item.notes}</p>
                                      </div>
                                    )}

                                    {/* Upload Information */}
                                    {(item.uploaded_by_name || item.uploaded_at) && (
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Upload Information</h4>
                                        <div className="text-sm space-y-1">
                                          {item.uploaded_by_name && (
                                            <p>
                                              <User className="h-3 w-3 inline mr-1" />
                                              <span className="font-medium">Uploaded by:</span> {item.uploaded_by_name}
                                            </p>
                                          )}
                                          {item.uploaded_at && (
                                            <p>
                                              <Calendar className="h-3 w-3 inline mr-1" />
                                              <span className="font-medium">Uploaded on:</span> {format(new Date(item.uploaded_at), "dd MMM yyyy 'at' HH:mm")}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:items-start items-stretch sm:flex-shrink-0 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleExpand(item.value_id)}
                                  className="flex-shrink-0"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      <span className="hidden sm:inline">Hide Details</span>
                                      <span className="sm:hidden">Hide</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      <span className="hidden sm:inline">View Details</span>
                                      <span className="sm:hidden">Details</span>
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(item)}
                                  className="flex-shrink-0"
                                >
                                  Review
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending approvals
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Compliance Document</DialogTitle>
            <DialogDescription>
              {selectedItem?.field_name} - {selectedItem?.entity_name}
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

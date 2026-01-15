"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  FileText,
  Download,
  History,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useUserCustomFieldValuesList } from "@/hooks/useProfile";
import { useComplianceHistory } from "@/hooks/useCompliance";
import { filesService } from "@/services/files";
import { toast } from "sonner";

export const UserComplianceData = ({ userSlug }) => {
  const [filters, setFilters] = useState({
    complianceOnly: null, // null = all, true = compliance only, false = non-compliance only
    fieldType: "all", // "all" = all types, otherwise specific type
    approvalStatus: "all", // "all" = all statuses, otherwise specific status
    searchTerm: "",
  });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);

  // Build query filters
  const queryFilters = useMemo(() => {
    const result = {};
    if (filters.complianceOnly !== null) {
      result.complianceOnly = filters.complianceOnly;
    }
    if (filters.fieldType && filters.fieldType !== "all") {
      result.fieldType = filters.fieldType;
    }
    if (filters.approvalStatus && filters.approvalStatus !== "all") {
      result.approvalStatus = filters.approvalStatus;
    }
    if (filters.searchTerm) {
      result.searchTerm = filters.searchTerm;
    }
    return result;
  }, [filters]);

  const { data, isLoading, error, refetch } = useUserCustomFieldValuesList(userSlug, queryFilters);
  const values = data?.values || [];

  // Get history for selected field
  const { data: historyData, isLoading: historyLoading } = useComplianceHistory(
    selectedField?.field_slug || "",
    "user",
    userSlug,
    1,
    50
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleViewHistory = (field) => {
    setSelectedField(field);
    setHistoryModalOpen(true);
  };

  const handleDownload = async (file) => {
    if (file?.id || file?.file_reference_id) {
      try {
        const response = await filesService.getFileUrl(file.id || file.file_reference_id);
        const url = response.url || response;
        if (url) {
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error("Failed to get file URL:", error);
        toast.error("Failed to download file", {
          description: "Could not retrieve the file. Please try again.",
        });
      }
    }
  };

  const getStatusBadge = (value) => {
    if (!value || !value.value_id) {
      return <Badge variant="outline">No Data</Badge>;
    }

    if (value.is_expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (value.approval_status === "pending") {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Approval</Badge>;
    }

    if (value.approval_status === "declined") {
      return <Badge variant="destructive">Declined</Badge>;
    }

    if (value.approval_status === "approved") {
      if (value.days_until_expiry !== null && value.days_until_expiry <= 30 && value.days_until_expiry > 0) {
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Expiring Soon</Badge>;
      }
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Compliant</Badge>;
    }

    return <Badge variant="outline">Unknown</Badge>;
  };

  const getStatusIcon = (value) => {
    if (!value || !value.value_id) {
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }

    if (value.is_expired) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }

    if (value.approval_status === "pending") {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }

    if (value.approval_status === "declined") {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }

    if (value.approval_status === "approved") {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }

    return null;
  };

  const formatValue = (value) => {
    if (!value || !value.value_data) return "—";

    // Handle different value types
    if (typeof value.value_data === "object") {
      // Check if it's a simple value object
      if (value.value_data.value !== undefined) {
        return String(value.value_data.value);
      }
      // Check for notes
      if (value.value_data.notes) {
        return value.value_data.notes;
      }
      // Return JSON string for complex objects
      return JSON.stringify(value.value_data);
    }

    return String(value.value_data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading custom field data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <span className="ml-2 text-destructive">
            Failed to load custom field data. Please try again.
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Fields & Compliance</CardTitle>
              <CardDescription>
                View all custom field submissions and compliance data for this user
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search fields..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="compliance-filter">Compliance</Label>
              <Select
                value={filters.complianceOnly === null ? "all" : filters.complianceOnly.toString()}
                onValueChange={(value) => {
                  if (value === "all") {
                    handleFilterChange("complianceOnly", null);
                  } else {
                    handleFilterChange("complianceOnly", value === "true");
                  }
                }}
              >
                <SelectTrigger id="compliance-filter">
                  <SelectValue placeholder="All Fields" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="true">Compliance Only</SelectItem>
                  <SelectItem value="false">Non-Compliance Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="field-type-filter">Field Type</Label>
              <Select
                value={filters.fieldType}
                onValueChange={(value) => handleFilterChange("fieldType", value)}
              >
                <SelectTrigger id="field-type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="approval-status-filter">Approval Status</Label>
              <Select
                value={filters.approvalStatus}
                onValueChange={(value) => handleFilterChange("approvalStatus", value)}
              >
                <SelectTrigger id="approval-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {values.length} field{values.length !== 1 ? "s" : ""}
          </div>

          {/* Table */}
          {values.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom field values found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values.map((value) => (
                    <TableRow key={value.value_id || value.field_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{value.field_label || value.field_name}</div>
                          {value.field_description && (
                            <div className="text-xs text-muted-foreground">{value.field_description}</div>
                          )}
                          {value.is_compliance && (
                            <Badge variant="outline" className="mt-1 text-xs">Compliance</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{value.field_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {value.file ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{value.file.file_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm">{formatValue(value)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(value)}
                          {getStatusBadge(value)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {value.expiry_date ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(value.expiry_date), "dd MMM yyyy")}
                            </div>
                            {value.days_until_expiry !== null && (
                              <div className={`text-xs mt-1 ${
                                value.is_expired ? "text-red-600" :
                                value.days_until_expiry <= 30 ? "text-yellow-600" :
                                "text-green-600"
                              }`}>
                                {value.is_expired
                                  ? `Expired ${Math.abs(value.days_until_expiry)} days ago`
                                  : `${value.days_until_expiry} days remaining`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {value.uploaded_at ? (
                          <div className="text-sm">
                            <div>{value.uploaded_by_name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(value.uploaded_at), "dd MMM yyyy")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {value.file && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(value.file)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {value.value_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(value)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>History: {selectedField?.field_label || selectedField?.field_name}</DialogTitle>
            <DialogDescription>
              View all historical submissions for this field
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {historyData?.history && historyData.history.length > 0 ? (
                historyData.history.map((historyItem) => (
                  <Card key={historyItem.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {format(new Date(historyItem.archived_at), "dd MMM yyyy HH:mm")}
                          </Badge>
                          <Badge variant="secondary">{historyItem.archived_reason}</Badge>
                        </div>
                        {historyItem.file && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{historyItem.file.file_name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(historyItem.file)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {historyItem.value_data && (
                          <div className="text-sm text-muted-foreground">
                            {JSON.stringify(historyItem.value_data)}
                          </div>
                        )}
                        {historyItem.uploaded_by_name && (
                          <div className="text-xs text-muted-foreground">
                            Uploaded by: {historyItem.uploaded_by_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No history available for this field.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

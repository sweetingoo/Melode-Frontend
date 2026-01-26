"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useExpiringCompliance, usePendingApprovals, useNonSubmittedCompliance, useApproveCompliance } from "@/hooks/useCompliance";
import { useRoles } from "@/hooks/useRoles";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Clock, FileText, Download, User, Calendar, Search, Filter, X, Eye, Package } from "lucide-react";
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

export default function ComplianceMonitoringPage() {
  const router = useRouter();
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState("expiring");
  
  // Days ahead for expiring items
  const [daysAhead, setDaysAhead] = useState(30);
  
  // Pagination state - separate for each tab
  const [expiringPage, setExpiringPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [nonSubmittedPage, setNonSubmittedPage] = useState(1);
  const pageSize = 50;
  
  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: "",
    approvalStatus: "all",
    entityType: "all",
    roleSlug: "all", // "all" = all roles, otherwise specific role slug
    isCompliance: null, // null = all, true = compliance only, false = non-compliance only
  });

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canManageCompliance = hasPermission("compliance_monitoring:manage");

  // Get roles for filter dropdown
  const { data: rolesData } = useRoles();
  const roles = Array.isArray(rolesData) 
    ? rolesData 
    : rolesData?.roles || rolesData?.items || [];

  // Build query filters (only include non-default values)
  const queryFilters = useMemo(() => {
    const result = {};
    if (filters.searchTerm) {
      result.searchTerm = filters.searchTerm;
    }
    if (filters.approvalStatus && filters.approvalStatus !== "all") {
      result.approvalStatus = filters.approvalStatus;
    }
    if (filters.entityType && filters.entityType !== "all") {
      result.entityType = filters.entityType;
    }
    if (filters.roleSlug && filters.roleSlug !== "all") {
      result.roleSlug = filters.roleSlug;
    }
    if (filters.isCompliance !== null) {
      result.isCompliance = filters.isCompliance;
    }
    return result;
  }, [filters]);

  // Reset to page 1 when filters or daysAhead change
  React.useEffect(() => {
    setExpiringPage(1);
    setPendingPage(1);
    setNonSubmittedPage(1);
  }, [filters, daysAhead]);

  const { data: expiringData, isLoading: expiringLoading, error: expiringError } = useExpiringCompliance(daysAhead, expiringPage, pageSize, queryFilters);
  const { data: pendingData, isLoading: pendingLoading, error: pendingError } = usePendingApprovals(pendingPage, pageSize, queryFilters);
  const { data: nonSubmittedData, isLoading: nonSubmittedLoading, error: nonSubmittedError } = useNonSubmittedCompliance(nonSubmittedPage, pageSize, queryFilters);
  const approveMutation = useApproveCompliance();

  // Extract pagination info - handle different response structures
  const expiringPagination = {
    page: expiringData?.page ?? expiringData?.pagination?.page ?? expiringPage,
    per_page: expiringData?.per_page ?? expiringData?.pagination?.per_page ?? pageSize,
    total: typeof expiringData?.total === 'number' ? expiringData.total :
      (typeof expiringData?.pagination?.total === 'number' ? expiringData.pagination.total :
      (expiringData?.items?.length || 0)),
    total_pages: typeof expiringData?.total_pages === 'number' ? expiringData.total_pages :
      (typeof expiringData?.pagination?.total_pages === 'number' ? expiringData.pagination.total_pages :
      (typeof expiringData?.total === 'number' ? Math.ceil(expiringData.total / pageSize) :
      (typeof expiringData?.pagination?.total === 'number' ? Math.ceil(expiringData.pagination.total / pageSize) : 1))),
  };
  
  const pendingPagination = {
    page: pendingData?.page ?? pendingData?.pagination?.page ?? pendingPage,
    per_page: pendingData?.per_page ?? pendingData?.pagination?.per_page ?? pageSize,
    total: typeof pendingData?.total === 'number' ? pendingData.total :
      (typeof pendingData?.pagination?.total === 'number' ? pendingData.pagination.total :
      (pendingData?.items?.length || 0)),
    total_pages: typeof pendingData?.total_pages === 'number' ? pendingData.total_pages :
      (typeof pendingData?.pagination?.total_pages === 'number' ? pendingData.pagination.total_pages :
      (typeof pendingData?.total === 'number' ? Math.ceil(pendingData.total / pageSize) :
      (typeof pendingData?.pagination?.total === 'number' ? Math.ceil(pendingData.pagination.total / pageSize) : 1))),
  };
  
  const nonSubmittedPagination = {
    page: nonSubmittedData?.page ?? nonSubmittedData?.pagination?.page ?? nonSubmittedPage,
    per_page: nonSubmittedData?.per_page ?? nonSubmittedData?.pagination?.per_page ?? pageSize,
    total: typeof nonSubmittedData?.total === 'number' ? nonSubmittedData.total :
      (typeof nonSubmittedData?.pagination?.total === 'number' ? nonSubmittedData.pagination.total :
      (nonSubmittedData?.items?.length || 0)),
    total_pages: typeof nonSubmittedData?.total_pages === 'number' ? nonSubmittedData.total_pages :
      (typeof nonSubmittedData?.pagination?.total_pages === 'number' ? nonSubmittedData.pagination.total_pages :
      (typeof nonSubmittedData?.total === 'number' ? Math.ceil(nonSubmittedData.total / pageSize) :
      (typeof nonSubmittedData?.pagination?.total === 'number' ? Math.ceil(nonSubmittedData.pagination.total / pageSize) : 1))),
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      approvalStatus: "all",
      entityType: "all",
      roleSlug: "all",
      isCompliance: null,
    });
  };

  const hasActiveFilters = filters.searchTerm || 
    filters.approvalStatus !== "all" || 
    filters.entityType !== "all" ||
    filters.roleSlug !== "all" ||
    filters.isCompliance !== null;

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

  const getStatusBadge = (item) => {
    if (item.is_expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (!item.is_expired && item.days_until_expiry !== null && item.days_until_expiry <= 30 && item.days_until_expiry > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">Expiring Soon</Badge>;
    }
    if (item.approval_status === "pending") {
      return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">Pending</Badge>;
    }
    if (item.approval_status === "approved") {
      return <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700">Approved</Badge>;
    }
    if (item.approval_status === "declined") {
      return <Badge variant="destructive">Declined</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const handleViewDetails = (item) => {
    if (item.value_slug) {
      router.push(`/admin/compliance-monitoring/${item.value_slug}`);
    }
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-1 px-1 sm:overflow-x-visible sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-max sm:w-auto">
            <TabsTrigger value="expiring">Expiring Items</TabsTrigger>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="non-submitted">Non-Submitted Items</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Items</CardTitle>
              <CardDescription>
                {filters.approvalStatus === "approved" 
                  ? "All approved/compliant items, sorted by expiry date (soonest first)"
                  : `Items expiring within the next ${daysAhead} days, sorted by expiry date (soonest first)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="days-ahead-filter-expiring">Days Ahead</Label>
                    <Select
                      value={daysAhead.toString()}
                      onValueChange={(value) => setDaysAhead(parseInt(value, 10))}
                    >
                      <SelectTrigger id="days-ahead-filter-expiring">
                        <SelectValue placeholder="30 days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-expiring">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-expiring"
                        placeholder="Search fields, entities..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approval-status-filter-expiring">Approval Status</Label>
                    <Select
                      value={filters.approvalStatus}
                      onValueChange={(value) => handleFilterChange("approvalStatus", value)}
                    >
                      <SelectTrigger id="approval-status-filter-expiring">
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
                  <div className="space-y-2">
                    <Label htmlFor="entity-type-filter-expiring">Entity Type</Label>
                    <Select
                      value={filters.entityType}
                      onValueChange={(value) => handleFilterChange("entityType", value)}
                    >
                      <SelectTrigger id="entity-type-filter-expiring">
                        <SelectValue placeholder="All Entities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-filter-expiring">Job Role</Label>
                    <Select
                      value={filters.roleSlug}
                      onValueChange={(value) => handleFilterChange("roleSlug", value)}
                    >
                      <SelectTrigger id="role-filter-expiring">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.slug || role.id} value={role.slug}>
                            {role.name || role.role_name || role.slug}
                            {role.shift_name && ` - ${role.shift_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compliance-filter-expiring">Is Compliance</Label>
                    <Select
                      value={filters.isCompliance === null ? "all" : filters.isCompliance.toString()}
                      onValueChange={(value) => {
                        if (value === "all") {
                          handleFilterChange("isCompliance", null);
                        } else {
                          handleFilterChange("isCompliance", value === "true");
                        }
                      }}
                    >
                      <SelectTrigger id="compliance-filter-expiring">
                        <SelectValue placeholder="All Fields" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="true">Compliance Only</SelectItem>
                        <SelectItem value="false">Non-Compliance Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              {expiringError ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-destructive font-medium mb-1">Failed to load expiring items</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {expiringError?.response?.data?.detail || 
                     expiringError?.message || 
                     "An error occurred while loading expiring compliance items"}
                  </p>
                </div>
              ) : expiringLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : (expiringData?.items && expiringData.items.length > 0) ? (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Showing {((expiringPagination.page - 1) * expiringPagination.per_page) + 1} - {Math.min(expiringPagination.page * expiringPagination.per_page, expiringPagination.total)} of {expiringPagination.total} item{expiringPagination.total !== 1 ? "s" : ""}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expiringData.items.map((item) => (
                      <Card 
                        key={item.value_id} 
                        className={cn(
                          "relative",
                          item.is_expired && "border-red-500 border-2",
                          !item.is_expired && item.days_until_expiry !== null && item.days_until_expiry <= 30 && item.days_until_expiry > 0 && "border-yellow-500 border-2"
                        )}
                      >
                        {/* Status Badge - Top Right */}
                        <div className="absolute top-4 right-4 z-10">
                          {getStatusBadge(item)}
                        </div>
                        
                        <CardHeader className="pb-3 pr-24">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(item.approval_status)}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-semibold">
                                {item.field_label || item.field_name}
                              </CardTitle>
                              {item.field_description && (
                                <CardDescription className="text-xs mt-1 line-clamp-2">
                                  {item.field_description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Entity:</span>
                              <span className="font-medium">{item.entity_name || `${item.entity_type} #${item.entity_id}`}</span>
                            </div>
                            
                            {item.expiry_date && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Expiry Date:</span>
                                <span className="font-medium">{format(new Date(item.expiry_date), "dd MMM yyyy")}</span>
                              </div>
                            )}
                            
                            {item.days_until_expiry !== null && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Days Until Expiry:</span>
                                <span className={cn(
                                  "font-medium",
                                  item.days_until_expiry < 0 && "text-red-600 dark:text-red-400",
                                  item.days_until_expiry > 0 && item.days_until_expiry <= 30 && "text-yellow-600 dark:text-yellow-400",
                                  item.days_until_expiry > 30 && "text-green-600 dark:text-green-400"
                                )}>
                                  {item.days_until_expiry > 0
                                    ? `${item.days_until_expiry} days`
                                    : `${Math.abs(item.days_until_expiry)} days ago`}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item)}
                              className="flex-1"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            {item.approval_status === "pending" && canManageCompliance && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(item)}
                                className="flex-1"
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {expiringPagination.total_pages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setExpiringPage((p) => Math.max(1, p - 1))}
                              className={
                                expiringPagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from({ length: expiringPagination.total_pages }, (_, i) => i + 1)
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === expiringPagination.total_pages ||
                                Math.abs(page - expiringPagination.page) <= 1
                            )
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setExpiringPage(page)}
                                    isActive={expiringPagination.page === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setExpiringPage((p) => Math.min(expiringPagination.total_pages, p + 1))}
                              className={
                                expiringPagination.page >= expiringPagination.total_pages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
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
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-pending">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-pending"
                        placeholder="Search fields, entities..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-type-filter-pending">Entity Type</Label>
                    <Select
                      value={filters.entityType}
                      onValueChange={(value) => handleFilterChange("entityType", value)}
                    >
                      <SelectTrigger id="entity-type-filter-pending">
                        <SelectValue placeholder="All Entities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-filter-pending">Job Role</Label>
                    <Select
                      value={filters.roleSlug}
                      onValueChange={(value) => handleFilterChange("roleSlug", value)}
                    >
                      <SelectTrigger id="role-filter-pending">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.slug || role.id} value={role.slug}>
                            {role.name || role.role_name || role.slug}
                            {role.shift_name && ` - ${role.shift_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compliance-filter-pending">Is Compliance</Label>
                    <Select
                      value={filters.isCompliance === null ? "all" : filters.isCompliance.toString()}
                      onValueChange={(value) => {
                        if (value === "all") {
                          handleFilterChange("isCompliance", null);
                        } else {
                          handleFilterChange("isCompliance", value === "true");
                        }
                      }}
                    >
                      <SelectTrigger id="compliance-filter-pending">
                        <SelectValue placeholder="All Fields" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="true">Compliance Only</SelectItem>
                        <SelectItem value="false">Non-Compliance Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              {pendingError ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-destructive font-medium mb-1">Failed to load pending approvals</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {pendingError?.response?.data?.detail || 
                     pendingError?.message || 
                     "An error occurred while loading pending compliance approvals"}
                  </p>
                </div>
              ) : pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : pendingData?.items && pendingData.items.length > 0 ? (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Showing {((pendingPagination.page - 1) * pendingPagination.per_page) + 1} - {Math.min(pendingPagination.page * pendingPagination.per_page, pendingPagination.total)} of {pendingPagination.total} item{pendingPagination.total !== 1 ? "s" : ""}
                  </div>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>Entity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingData.items.map((item) => (
                          <TableRow key={item.value_id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                <div>
                                  <div className="font-medium">{item.field_label || item.field_name}</div>
                                {item.field_description && (
                                    <div className="text-xs text-muted-foreground mt-1">{item.field_description}</div>
                                  )}
                                </div>
                                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {item.entity_name || `${item.entity_type} #${item.entity_id}`}
                                        </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">Pending</Badge>
                            </TableCell>
                            <TableCell>
                              {item.expiry_date ? (
                                <div className="text-sm">
                                  {format(new Date(item.expiry_date), "dd MMM yyyy")}
                                      </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.uploaded_at ? (
                                <div className="text-sm">
                                  {format(new Date(item.uploaded_at), "dd MMM yyyy")}
                                          </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDetails(item)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {canManageCompliance && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(item)}
                                  >
                                    Review
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {pendingPagination.total_pages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                              className={
                                pendingPagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from({ length: pendingPagination.total_pages }, (_, i) => i + 1)
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === pendingPagination.total_pages ||
                                Math.abs(page - pendingPagination.page) <= 1
                            )
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setPendingPage(page)}
                                    isActive={pendingPagination.page === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setPendingPage((p) => Math.min(pendingPagination.total_pages, p + 1))}
                              className={
                                pendingPagination.page >= pendingPagination.total_pages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending approvals
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="non-submitted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Non-Submitted Compliance Items</CardTitle>
              <CardDescription>
                Required compliance items that have not been submitted yet. These items are mandatory for the associated roles or asset types but have not been uploaded by the entities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-non-submitted">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-non-submitted"
                        placeholder="Search fields, entities..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-type-filter-non-submitted">Entity Type</Label>
                    <Select
                      value={filters.entityType}
                      onValueChange={(value) => handleFilterChange("entityType", value)}
                    >
                      <SelectTrigger id="entity-type-filter-non-submitted">
                        <SelectValue placeholder="All Entities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-filter-non-submitted">Job Role</Label>
                    <Select
                      value={filters.roleSlug}
                      onValueChange={(value) => handleFilterChange("roleSlug", value)}
                    >
                      <SelectTrigger id="role-filter-non-submitted">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.slug || role.id} value={role.slug}>
                            {role.name || role.role_name || role.slug}
                            {role.shift_name && ` - ${role.shift_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compliance-filter-non-submitted">Is Compliance</Label>
                    <Select
                      value={filters.isCompliance === null ? "all" : filters.isCompliance.toString()}
                      onValueChange={(value) => {
                        if (value === "all") {
                          handleFilterChange("isCompliance", null);
                        } else {
                          handleFilterChange("isCompliance", value === "true");
                        }
                      }}
                    >
                      <SelectTrigger id="compliance-filter-non-submitted">
                        <SelectValue placeholder="All Fields" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="true">Compliance Only</SelectItem>
                        <SelectItem value="false">Non-Compliance Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              {nonSubmittedError ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-destructive font-medium mb-1">Failed to load non-submitted items</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {nonSubmittedError?.response?.data?.detail || 
                     nonSubmittedError?.message || 
                     "An error occurred while loading non-submitted compliance items"}
                  </p>
                </div>
              ) : nonSubmittedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : nonSubmittedData?.items && nonSubmittedData.items.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const entityCount = new Set(nonSubmittedData.items.map(item => `${item.entity_type}-${item.entity_id}`)).size;
                        return (
                          <>
                            {entityCount} {entityCount === 1 ? 'entity' : 'entities'} with {nonSubmittedPagination.total} missing compliance {nonSubmittedPagination.total === 1 ? 'item' : 'items'}
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Page {nonSubmittedPagination.page} of {nonSubmittedPagination.total_pages}
                    </div>
                  </div>
                  
                  {/* Group by entity */}
                  {(() => {
                    // Group items by entity - use a more robust key
                    const groupedByEntity = nonSubmittedData.items.reduce((acc, item) => {
                      // Create a unique key combining entity_type, entity_id, and entity_slug if available
                      const entityKey = item.entity_slug 
                        ? `${item.entity_type}-${item.entity_slug}-${item.entity_id}`
                        : `${item.entity_type}-${item.entity_id}`;
                      
                      if (!acc[entityKey]) {
                        acc[entityKey] = {
                          entity_type: item.entity_type,
                          entity_id: item.entity_id,
                          entity_name: item.entity_name || `${item.entity_type} #${item.entity_id}`,
                          entity_slug: item.entity_slug,
                          items: []
                        };
                      }
                      acc[entityKey].items.push(item);
                      return acc;
                    }, {});

                    // Sort entity groups: users first, then assets, then others
                    // Within each type, sort by name
                    const entityGroups = Object.values(groupedByEntity).sort((a, b) => {
                      // First sort by entity type
                      const typeOrder = { user: 0, asset: 1 };
                      const aTypeOrder = typeOrder[a.entity_type] ?? 2;
                      const bTypeOrder = typeOrder[b.entity_type] ?? 2;
                      if (aTypeOrder !== bTypeOrder) {
                        return aTypeOrder - bTypeOrder;
                      }
                      // Then sort by name
                      const aName = (a.entity_name || '').toLowerCase();
                      const bName = (b.entity_name || '').toLowerCase();
                      return aName.localeCompare(bName);
                    });

                    return (
                      <div className="space-y-4">
                        {entityGroups.map((group, groupIndex) => {
                          // Create a truly unique key for each group
                          const groupKey = group.entity_slug 
                            ? `${group.entity_type}-${group.entity_slug}-${group.entity_id}-${groupIndex}`
                            : `${group.entity_type}-${group.entity_id}-${groupIndex}`;
                          
                          return (
                            <Card 
                              key={groupKey} 
                              className={
                                group.entity_type === "user"
                                  ? "border-blue-200 dark:border-blue-800 shadow-sm bg-blue-50/30 dark:bg-blue-950/20"
                                  : group.entity_type === "asset"
                                  ? "border-purple-200 dark:border-purple-800 shadow-sm bg-purple-50/30 dark:bg-purple-950/20"
                                  : "border-orange-200 dark:border-orange-800 shadow-sm"
                              }
                            >
                              <CardHeader className={
                                group.entity_type === "user"
                                  ? "pb-3 border-b border-blue-200 dark:border-blue-800 bg-blue-100/50 dark:bg-blue-900/30"
                                  : group.entity_type === "asset"
                                  ? "pb-3 border-b border-purple-200 dark:border-purple-800 bg-purple-100/50 dark:bg-purple-900/30"
                                  : "pb-3 border-b border-orange-100 dark:border-orange-900"
                              }>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {group.entity_type === "user" ? (
                                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 shrink-0">
                                        <User className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                                      </div>
                                    ) : group.entity_type === "asset" ? (
                                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 shrink-0">
                                        <Package className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                                      </div>
                                    ) : (
                                      <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <Badge 
                                          variant="secondary" 
                                          className={
                                            group.entity_type === "user" 
                                              ? "bg-blue-600 dark:bg-blue-500 text-white border-0 font-semibold text-xs px-2.5 py-1 shrink-0"
                                              : group.entity_type === "asset"
                                              ? "bg-purple-600 dark:bg-purple-500 text-white border-0 font-semibold text-xs px-2.5 py-1 shrink-0"
                                              : "text-xs shrink-0"
                                          }
                                        >
                                          {group.entity_type === "user" ? "👤 USER" : group.entity_type === "asset" ? "📦 ASSET" : group.entity_type.toUpperCase()}
                                        </Badge>
                                        <CardTitle className="text-base font-semibold">
                                          <span className={
                                            group.entity_type === "user"
                                              ? "text-blue-900 dark:text-blue-100"
                                              : group.entity_type === "asset"
                                              ? "text-purple-900 dark:text-purple-100"
                                              : ""
                                          }>
                                            {group.entity_name}
                                          </span>
                                        </CardTitle>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-4">
                                    <Badge variant="destructive" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                                      {group.items.length} {group.items.length === 1 ? 'Missing' : 'Missing'}
                                    </Badge>
                                    {group.entity_type === "user" && group.entity_slug ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          router.push(`/admin/people-management/${group.entity_slug}`);
                                        }}
                                        className="gap-1.5"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        View
                                      </Button>
                                    ) : group.entity_type === "asset" ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          router.push(`/admin/assets`);
                                        }}
                                        className="gap-1.5"
                                        title="Navigate to Assets page to find this asset"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        View Assets
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  {group.items.map((item, itemIndex) => {
                                    // Create unique key for each item
                                    const itemKey = `${item.field_id}-${item.entity_type}-${item.entity_id}-${itemIndex}`;
                                    return (
                                      <div
                                        key={itemKey}
                                        className="flex items-start gap-3 p-3 rounded-md bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100/50 dark:hover:bg-orange-950/30 transition-colors"
                                      >
                                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm">{item.field_label || item.field_name}</div>
                                          {item.field_description && (
                                            <div className="text-xs text-muted-foreground mt-1">{item.field_description}</div>
                                          )}
                                        </div>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          Required
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()}
                  
                  {/* Pagination */}
                  {nonSubmittedPagination.total_pages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setNonSubmittedPage((p) => Math.max(1, p - 1))}
                              className={
                                nonSubmittedPagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from({ length: nonSubmittedPagination.total_pages }, (_, i) => i + 1)
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === nonSubmittedPagination.total_pages ||
                                Math.abs(page - nonSubmittedPagination.page) <= 1
                            )
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setNonSubmittedPage(page)}
                                    isActive={nonSubmittedPagination.page === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setNonSubmittedPage((p) => Math.min(nonSubmittedPagination.total_pages, p + 1))}
                              className={
                                nonSubmittedPagination.page >= nonSubmittedPagination.total_pages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No non-submitted items found
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

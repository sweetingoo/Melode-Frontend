"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Plus,
  Search,
  Eye,
  Filter,
  Shield,
  Key,
  Settings,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePermissions,
  useResources,
  useActions,
  useRolesWithPermission,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  permissionUtils,
} from "@/hooks/usePermissions";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const PermissionsManagementPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPermission, setViewingPermission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    displayName: "",
    resource: "",
    action: "",
    description: "",
  });

  // API hooks
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();
  const { data: resourcesData, isLoading: resourcesLoading } = useResources();
  const { data: actionsData, isLoading: actionsLoading } = useActions();
  const createPermissionMutation = useCreatePermission();
  const updatePermissionMutation = useUpdatePermission();
  const deletePermissionMutation = useDeletePermission();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreatePermission = hasPermission("permission:create");
  const canUpdatePermission = hasPermission("permission:update");
  const canDeletePermission = hasPermission("permission:delete");

  // Transform API data
  const permissions = permissionsData
    ? permissionsData.map(permissionUtils.transformPermission)
    : [];
  const resources = resourcesData
    ? resourcesData.map(permissionUtils.transformResource)
    : [];
  const actions = actionsData
    ? actionsData.map(permissionUtils.transformAction)
    : [];

  // Get unique types for filters
  const types = [
    ...new Set(
      permissions.map((p) =>
        permissionUtils.getPermissionType(p.resource, p.action)
      )
    ),
  ];

  // Filter permissions based on search and filters
  const filteredPermissions = permissions.filter((permission) => {
    const permissionType = permissionUtils.getPermissionType(
      permission.resource,
      permission.action
    );

    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permissionType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesResource =
      !resourceFilter ||
      resourceFilter === "all" ||
      permission.resource === resourceFilter;
    const matchesType =
      !typeFilter || typeFilter === "all" || permissionType === typeFilter;

    return matchesSearch && matchesResource && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPermissions = filteredPermissions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, resourceFilter, typeFilter]);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreatePermission = async () => {
    if (!formData.displayName || !formData.resource || !formData.action) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate the pattern: ^[a-z_]+:[a-z_]+$
    const resourcePattern = /^[a-z_]+$/;
    const actionPattern = /^[a-z_]+$/;

    if (!resourcePattern.test(formData.resource)) {
      toast.error(
        "Resource must contain only lowercase letters and underscores"
      );
      return;
    }

    if (!actionPattern.test(formData.action)) {
      toast.error("Action must contain only lowercase letters and underscores");
      return;
    }

    try {
      // Generate the name in the correct format: resource:action
      const generatedName = `${formData.resource}:${formData.action}`;

      const permissionData = {
        display_name: formData.displayName,
        name: generatedName,
        resource: formData.resource,
        action: formData.action,
        description: formData.description,
      };

      console.log("Creating permission with data:", permissionData);
      await createPermissionMutation.mutateAsync(permissionData);

      setIsCreateModalOpen(false);
      setFormData({
        displayName: "",
        resource: "",
        action: "",
        description: "",
      });
    } catch (error) {
      console.error("Failed to create permission:", error);
    }
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setFormData({
      displayName: "",
      resource: "",
      action: "",
      description: "",
    });
  };

  const handleViewPermission = (permission) => {
    setViewingPermission(permission);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingPermission(null);
  };

  const getTypeColor = (type) => {
    return permissionUtils.getTypeColor(type);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Permissions Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage system permissions and access controls
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
          disabled={!canCreatePermission}
        >
          <Plus className="h-4 w-4" />
          Create Permission
        </Button>
      </div>

      {/* Loading State */}
      {permissionsLoading && (
        <div className="space-y-6">
          {/* Statistics Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 sm:w-48" />
                <Skeleton className="h-10 sm:w-48" />
              </div>
            </CardContent>
          </Card>

          {/* Table Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {permissionsError && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load permissions
              </h3>
              <p className="text-muted-foreground mb-4">
                {permissionsError?.response?.data?.message ||
                  "An error occurred while loading permissions"}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!permissionsLoading && !permissionsError && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{permissions.length}</p>
                    <p className="text-sm text-muted-foreground">
                      Total Permissions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{resources.length}</p>
                    <p className="text-sm text-muted-foreground">Resources</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{types.length}</p>
                    <p className="text-sm text-muted-foreground">Types</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {filteredPermissions.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Filtered Results
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Permissions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, resource, action, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="resource-filter">Filter by Resource</Label>
                  <Select
                    value={resourceFilter}
                    onValueChange={setResourceFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {resources.map((resource) => (
                        <SelectItem
                          key={resource.id || resource.name}
                          value={resource.name}
                        >
                          {resource.displayName || resource.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="type-filter">Filter by Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPermissions.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No permissions found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ||
                      resourceFilter !== "all" ||
                      typeFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by creating your first permission"}
                  </p>
                  {!searchTerm &&
                    resourceFilter === "all" &&
                    typeFilter === "all" && (
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Permission
                      </Button>
                    )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission Name</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPermissions.map((permission) => {
                      const permissionType = permissionUtils.getPermissionType(
                        permission.resource,
                        permission.action
                      );

                      return (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">
                            {permission.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {permission.resource}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${getTypeColor(
                                permissionType
                              )}`}
                            >
                              {permissionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewPermission(permission)}
                                title="View permission details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!permission.isSystem && canDeletePermission && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      title="Delete permission"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Permission
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the
                                        permission "{permission.name}"? This
                                        action cannot be undone and will remove
                                        the permission from all roles and users.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          deletePermissionMutation.mutate(
                                            permission.id
                                          )
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredPermissions.length)} of{" "}
                {filteredPermissions.length} permissions
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      className={
                        currentPage === totalPages
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
      )}

      {/* Create Permission Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="e.g., View Patient Records"
                value={formData.displayName}
                onChange={(e) =>
                  handleInputChange("displayName", e.target.value)
                }
              />
            </div>

            {/* Auto-generated Permission Name Preview */}
            {formData.resource && formData.action && (
              <div className="space-y-2">
                <Label>Permission Name (Auto-generated)</Label>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm font-mono text-primary">
                    {formData.resource}:{formData.action}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be automatically generated from the resource and
                  action you select.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="resource">
                Resource <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.resource}
                onValueChange={(value) => handleInputChange("resource", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  {resourcesLoading ? (
                    <SelectItem value="loading-resources" disabled>
                      Loading resources...
                    </SelectItem>
                  ) : (
                    resources.map((resource) => (
                      <SelectItem
                        key={resource.id || resource.name}
                        value={resource.name}
                      >
                        {resource.displayName || resource.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The resource this permission applies to (lowercase letters and
                underscores only)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">
                Action <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.action}
                onValueChange={(value) => handleInputChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actionsLoading ? (
                    <SelectItem value="loading-actions" disabled>
                      Loading actions...
                    </SelectItem>
                  ) : (
                    actions.map((action) => (
                      <SelectItem
                        key={action.id || action.name}
                        value={action.name}
                      >
                        {action.displayName || action.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The action this permission allows (lowercase letters and
                underscores only)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this permission allows"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleCreatePermission}>Create Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Permission Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Permission Details
            </DialogTitle>
          </DialogHeader>

          {viewingPermission && (
            <div className="space-y-6">
              {/* Permission Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingPermission.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permission ID: {viewingPermission.id}
                  </p>
                </div>
                <Badge
                  className={`text-sm ${getTypeColor(
                    permissionUtils.getPermissionType(
                      viewingPermission.resource,
                      viewingPermission.action
                    )
                  )}`}
                >
                  {permissionUtils.getPermissionType(
                    viewingPermission.resource,
                    viewingPermission.action
                  )}
                </Badge>
              </div>

              {/* Permission Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Resource
                    </Label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {viewingPermission.resource}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Action
                    </Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-sm">
                        {viewingPermission.action}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Permission Type
                    </Label>
                    <div className="mt-1">
                      <Badge
                        className={`text-sm ${getTypeColor(
                          permissionUtils.getPermissionType(
                            viewingPermission.resource,
                            viewingPermission.action
                          )
                        )}`}
                      >
                        {permissionUtils.getPermissionType(
                          viewingPermission.resource,
                          viewingPermission.action
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Created
                    </Label>
                    <p className="text-sm mt-1">
                      {viewingPermission.createdAt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingPermission.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Description
                  </Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {viewingPermission.description}
                  </p>
                </div>
              )}

              {/* Permission Usage Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Usage Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-xs text-muted-foreground">
                      Roles Using This Permission
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-xs text-muted-foreground">
                      Users With This Permission
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="text-2xl font-bold text-green-600">Active</p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseViewModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionsManagementPage;

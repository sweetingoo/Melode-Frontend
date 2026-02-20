"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  Network,
  Users,
} from "lucide-react";
import {
  useDepartments,
  useDeleteDepartment,
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/useDepartments";
import { useRolesAll, roleUtils } from "@/hooks/useRoles";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageSearchBar } from "@/components/admin/PageSearchBar";

const DepartmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const itemsPerPage = 10;

  // Debounce search term to avoid API calls on every keystroke
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // API hooks - use debounced search term
  const { data: departmentsResponse, isLoading, error, refetch } = useDepartments({
    page: currentPage,
    per_page: itemsPerPage,
    search: debouncedSearchTerm || undefined,
  });
  const deleteDepartmentMutation = useDeleteDepartment();
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateDepartment = hasPermission("department:create");
  const canUpdateDepartment = hasPermission("department:update");
  const canDeleteDepartment = hasPermission("department:delete");

  // Fetch all roles for hierarchy display
  const { data: rolesData } = useRolesAll();
  const allRoles = rolesData ? rolesData.map(roleUtils.transformRole) : [];

  // Group roles by department and job role
  const rolesByDepartment = React.useMemo(() => {
    const grouped = {};

    allRoles.forEach((role) => {
      if (role.roleType === "job_role" && role.departmentId) {
        const deptId = role.departmentId;
        if (!grouped[deptId]) {
          grouped[deptId] = {};
        }
        if (!grouped[deptId][role.id]) {
          grouped[deptId][role.id] = {
            jobRole: role,
            shiftRoles: [],
          };
        }
      } else if (role.roleType === "shift_role" && role.parentRoleId) {
        // Find the department of the parent job role
        const parentJobRole = allRoles.find((r) => r.id === role.parentRoleId && r.roleType === "job_role");
        if (parentJobRole && parentJobRole.departmentId) {
          const deptId = parentJobRole.departmentId;
          if (!grouped[deptId]) {
            grouped[deptId] = {};
          }
          if (!grouped[deptId][role.parentRoleId]) {
            grouped[deptId][role.parentRoleId] = {
              jobRole: parentJobRole,
              shiftRoles: [],
            };
          }
          grouped[deptId][role.parentRoleId].shiftRoles.push(role);
        }
      }
    });

    return grouped;
  }, [allRoles]);

  const toggleDepartmentExpansion = (departmentId) => {
    setExpandedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(departmentId)) {
        newSet.delete(departmentId);
      } else {
        newSet.add(departmentId);
      }
      return newSet;
    });
  };

  // Extract departments and pagination data from response
  const departments = departmentsResponse?.departments || departmentsResponse?.data || [];
  const pagination = {
    page: departmentsResponse?.page || 1,
    per_page: departmentsResponse?.per_page || itemsPerPage,
    total: departmentsResponse?.total || 0,
    total_pages: departmentsResponse?.total_pages || 1,
  };

  const totalPages = pagination.total_pages;

  // Filter departments based on search term (client-side for immediate feedback)
  const filteredDepartments = React.useMemo(() => {
    if (!searchTerm) return departments;
    const searchLower = searchTerm.toLowerCase();
    return departments.filter(
      (dept) =>
        dept.name?.toLowerCase().includes(searchLower) ||
        dept.code?.toLowerCase().includes(searchLower) ||
        dept.description?.toLowerCase().includes(searchLower)
    );
  }, [departments, searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    // Debounced search term will trigger API call and reset page
  };

  const handleDeleteDepartment = async (departmentSlug) => {
    try {
      await deleteDepartmentMutation.mutateAsync(departmentSlug);
      refetch();
    } catch (error) {
      console.error("Failed to delete department:", error);
    }
  };

  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setDepartmentFormData({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      is_active: department.is_active !== undefined ? department.is_active : true,
    });
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleCreateDepartment = () => {
    setSelectedDepartment(null);
    setDepartmentFormData({
      name: "",
      code: "",
      description: "",
      is_active: true,
    });
    setValidationErrors({});
    setIsCreateModalOpen(true);
  };

  const validateDepartmentForm = () => {
    const errors = {};

    if (!departmentFormData.name?.trim()) {
      errors.name = "Name is required";
    }

    if (!departmentFormData.code?.trim()) {
      errors.code = "Code is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitDepartment = () => {
    if (!validateDepartmentForm()) {
      return;
    }

    const departmentData = {
      name: departmentFormData.name.trim(),
      code: departmentFormData.code.trim(),
      description: departmentFormData.description?.trim() || "",
      is_active: departmentFormData.is_active,
    };

    if (selectedDepartment) {
      // Update existing department
      updateDepartmentMutation.mutate(
        { slug: selectedDepartment.slug, departmentData },
        {
          onSuccess: () => {
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
            setDepartmentFormData({
              name: "",
              code: "",
              description: "",
              is_active: true,
            });
            setValidationErrors({});
            refetch();
          },
          onError: (error) => {
            if (error.response?.status === 422 || error.response?.status === 400) {
              const errorData = error.response.data;
              const newValidationErrors = {};

              if (errorData?.detail && Array.isArray(errorData.detail)) {
                errorData.detail.forEach((errorItem) => {
                  if (errorItem.loc && errorItem.loc.length > 1) {
                    const fieldName = errorItem.loc[1];
                    newValidationErrors[fieldName] = errorItem.msg;
                  }
                });
              } else if (errorData?.errors) {
                Object.assign(newValidationErrors, errorData.errors);
              } else if (errorData?.message) {
                newValidationErrors._general = errorData.message;
              }

              if (Object.keys(newValidationErrors).length > 0) {
                setValidationErrors(newValidationErrors);
              }
            }
          },
        }
      );
    } else {
      // Create new department
      createDepartmentMutation.mutate(departmentData, {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          setDepartmentFormData({
            name: "",
            code: "",
            description: "",
            is_active: true,
          });
          setValidationErrors({});
          // The hook will handle refetching via refetchQueries
        },
        onError: (error) => {
          if (error.response?.status === 422 || error.response?.status === 400) {
            const errorData = error.response.data;
            const newValidationErrors = {};

            if (errorData?.detail && Array.isArray(errorData.detail)) {
              errorData.detail.forEach((errorItem) => {
                if (errorItem.loc && errorItem.loc.length > 1) {
                  const fieldName = errorItem.loc[1];
                  newValidationErrors[fieldName] = errorItem.msg;
                }
              });
            } else if (errorData?.errors) {
              Object.assign(newValidationErrors, errorData.errors);
            } else if (errorData?.message) {
              newValidationErrors._general = errorData.message;
            }

            if (Object.keys(newValidationErrors).length > 0) {
              setValidationErrors(newValidationErrors);
            }
          }
        },
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load departments
              </h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the department data. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    const currentApiPage = pagination.page;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentApiPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentApiPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentApiPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentApiPage - 1);
      const end = Math.min(totalPages - 1, currentApiPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentApiPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentApiPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentApiPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Search and Create */}
      <PageSearchBar
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search departments by name, code, or description..."
        showFilters={false}
        showCreateButton={canCreateDepartment}
        onCreateClick={handleCreateDepartment}
        createButtonText="Add Department"
        createButtonIcon={Plus}
      />

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No departments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search criteria."
                  : "Get started by creating your first department."}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateDepartment}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department) => {
                      const isExpanded = expandedDepartments.has(department.id);
                      const departmentRoles = rolesByDepartment[department.id] || {};
                      const jobRolesList = Object.values(departmentRoles);
                      const totalRoles = jobRolesList.reduce(
                        (sum, group) => sum + 1 + group.shiftRoles.length,
                        0
                      );

                      return (
                        <React.Fragment key={department.id}>
                          <TableRow>
                            <TableCell>
                              {jobRolesList.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleDepartmentExpansion(department.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {department.name}
                            </TableCell>
                            <TableCell>
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {department.code}
                              </code>
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {department.description || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {department.is_active !== false ? (
                                <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {totalRoles > 0 ? (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="mr-1 h-3 w-3" />
                                  {totalRoles} {totalRoles === 1 ? "role" : "roles"}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">No roles</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {canUpdateDepartment && (
                                    <DropdownMenuItem
                                      onClick={() => handleEditDepartment(department)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  (<> {canDeleteDepartment && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onSelect={(e) => e.preventDefault()}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete the department{" "}
                                            <strong>{department.name}</strong>. This action
                                            cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteDepartment(department.slug)
                                            }
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  </>)
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          {isExpanded && jobRolesList.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-muted/30 p-0">
                                <div className="p-4 space-y-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold">Roles Hierarchy</h4>
                                  </div>
                                  <div className="space-y-3">
                                    {jobRolesList.map((group) => (
                                      <div
                                        key={group.jobRole.id}
                                        className="border rounded-lg p-3 bg-background"
                                      >
                                        {/* Job Role */}
                                        <div className="flex items-center gap-2 mb-2">
                                          <Shield className="h-4 w-4 text-blue-600" />
                                          <span className="font-medium text-sm">
                                            {group.jobRole.name}
                                          </span>
                                          <Badge variant="default" className="text-[10px]">
                                            Job Role
                                          </Badge>
                                          {group.jobRole.userCount > 0 && (
                                            <Badge variant="outline" className="text-[10px]">
                                              <Users className="h-3 w-3 mr-1" />
                                              {group.jobRole.userCount} users
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Shift Roles */}
                                        {group.shiftRoles.length > 0 && (
                                          <div className="ml-6 mt-2 space-y-2 border-l-2 border-muted pl-3">
                                            {group.shiftRoles.map((shiftRole) => (
                                              <div
                                                key={shiftRole.id}
                                                className="flex items-center gap-2"
                                              >
                                                <Network className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                  {shiftRole.name}
                                                </span>
                                                <Badge variant="secondary" className="text-[10px]">
                                                  Shift Role
                                                </Badge>
                                                {shiftRole.userCount > 0 && (
                                                  <Badge variant="outline" className="text-[10px]">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {shiftRole.userCount} users
                                                  </Badge>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {group.shiftRoles.length === 0 && (
                                          <p className="ml-6 text-xs text-muted-foreground italic">
                                            No shift roles
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(1, pagination.page - 1))
                          }
                          className={
                            pagination.page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(totalPages, pagination.page + 1)
                            )
                          }
                          className={
                            pagination.page === totalPages
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
        </CardContent>
      </Card>

      {/* Create Department Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>
              Add a new department to your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={departmentFormData.name}
                onChange={(e) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Finance"
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={departmentFormData.code}
                onChange={(e) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., FIN"
                className={validationErrors.code ? "border-red-500" : ""}
              />
              {validationErrors.code && (
                <p className="text-sm text-red-500">{validationErrors.code}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={departmentFormData.description}
                onChange={(e) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Department description..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active Status</Label>
              <Switch
                id="is_active"
                checked={departmentFormData.is_active}
                onCheckedChange={(checked) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    is_active: checked,
                  })
                }
              />
            </div>
            {validationErrors._general && (
              <p className="text-sm text-red-500">
                {validationErrors._general}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setValidationErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDepartment}
              disabled={createDepartmentMutation.isPending}
            >
              {createDepartmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={departmentFormData.name}
                onChange={(e) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Finance"
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-code"
                value={departmentFormData.code}
                onChange={(e) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., FIN"
                className={validationErrors.code ? "border-red-500" : ""}
              />
              {validationErrors.code && (
                <p className="text-sm text-red-500">{validationErrors.code}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={departmentFormData.description}
                onChange={(e) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Department description..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-is_active">Active Status</Label>
              <Switch
                id="edit-is_active"
                checked={departmentFormData.is_active}
                onCheckedChange={(checked) =>
                  setDepartmentFormData({
                    ...departmentFormData,
                    is_active: checked,
                  })
                }
              />
            </div>
            {validationErrors._general && (
              <p className="text-sm text-red-500">
                {validationErrors._general}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedDepartment(null);
                setValidationErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDepartment}
              disabled={updateDepartmentMutation.isPending}
            >
              {updateDepartmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentsPage;


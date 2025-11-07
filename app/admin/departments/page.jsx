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
} from "lucide-react";
import {
  useDepartments,
  useDeleteDepartment,
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/useDepartments";
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

const DepartmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
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
  const itemsPerPage = 10;

  // API hooks
  const { data: departmentsResponse, isLoading, error, refetch } = useDepartments({
    page: currentPage,
    per_page: itemsPerPage,
    search: searchTerm || undefined,
  });
  const deleteDepartmentMutation = useDeleteDepartment();
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();

  // Extract departments and pagination data from response
  const departments = departmentsResponse?.departments || departmentsResponse?.data || [];
  const pagination = {
    page: departmentsResponse?.page || 1,
    per_page: departmentsResponse?.per_page || itemsPerPage,
    total: departmentsResponse?.total || 0,
    total_pages: departmentsResponse?.total_pages || 1,
  };

  const totalPages = pagination.total_pages;

  // Filter departments based on search term (client-side fallback)
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
    setCurrentPage(1); // Reset to first page on search
  };

  const handleDeleteDepartment = async (departmentId) => {
    try {
      await deleteDepartmentMutation.mutateAsync(departmentId);
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
        { id: selectedDepartment.id, departmentData },
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
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground mt-1">
              Manage departments and organizational structure.
            </p>
          </div>
        </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground mt-1">
              Manage departments and organizational structure.
            </p>
          </div>
        </div>
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
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">
            Manage departments and organizational structure.
          </p>
        </div>
        <Button onClick={handleCreateDepartment}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search departments by name, code, or description..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department) => (
                      <TableRow key={department.id}>
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
                              <DropdownMenuItem
                                onClick={() => handleEditDepartment(department)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
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
                                        handleDeleteDepartment(department.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
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
              Add a new department to your organization.
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
                placeholder="e.g., Engineering"
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
                placeholder="e.g., ENG"
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
                placeholder="e.g., Engineering"
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
                placeholder="e.g., ENG"
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


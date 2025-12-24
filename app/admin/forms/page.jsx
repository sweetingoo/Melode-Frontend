"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useForms,
  useDeleteForm,
} from "@/hooks/useForms";
import { useRoles } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { useActiveFormTypes } from "@/hooks/useFormTypes";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { format } from "date-fns";
import { Shield, Users, User } from "lucide-react";

const FormsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formTypeFilter, setFormTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active"); // Default to active forms
  const [assignmentFilter, setAssignmentFilter] = useState("all"); // "all", "role", "users", "none"

  const { data: rolesData } = useRoles();
  const { data: usersResponse } = useUsers();
  const { data: activeFormTypes = [] } = useActiveFormTypes();
  const roles = rolesData || [];
  const users = usersResponse?.users || usersResponse || [];

  const { data: formsResponse, isLoading } = useForms({
    page: currentPage,
    limit: 20,
  });

  const deleteFormMutation = useDeleteForm();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateForm = hasPermission("form:create");
  const canUpdateForm = hasPermission("form:update");
  const canDeleteForm = hasPermission("form:delete");

  // Handle different API response structures
  let forms = [];
  if (formsResponse) {
    if (Array.isArray(formsResponse)) {
      forms = formsResponse;
    } else if (formsResponse.forms && Array.isArray(formsResponse.forms)) {
      forms = formsResponse.forms;
    } else if (formsResponse.data && Array.isArray(formsResponse.data)) {
      forms = formsResponse.data;
    } else if (formsResponse.results && Array.isArray(formsResponse.results)) {
      forms = formsResponse.results;
    }
  }

  const pagination = {
    page: formsResponse?.page ?? currentPage,
    limit: formsResponse?.limit ?? 20,
    total: formsResponse?.total ?? forms.length,
    total_pages: formsResponse?.total_pages ?? Math.ceil(forms.length / 20),
  };

  // Filter forms
  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      !searchTerm ||
      form.form_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.form_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.form_description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      formTypeFilter === "all" || form.form_type === formTypeFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && form.is_active) ||
      (statusFilter === "inactive" && !form.is_active);

    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "role" && form.assigned_to_role_id) ||
      (assignmentFilter === "users" && form.assigned_user_ids && form.assigned_user_ids.length > 0) ||
      (assignmentFilter === "none" && !form.assigned_to_role_id && (!form.assigned_user_ids || form.assigned_user_ids.length === 0));

    return matchesSearch && matchesType && matchesStatus && matchesAssignment;
  });

  // Get form type info from active form types
  const getFormTypeInfo = (typeName) => {
    const formType = activeFormTypes.find((ft) => ft.name === typeName);
    if (formType) {
      return {
        displayName: formType.display_name || formType.name,
        icon: formType.icon || "",
        color: formType.color || "#6b7280",
      };
    }
    // Fallback for unknown types
    return {
      displayName: typeName ? typeName.charAt(0).toUpperCase() + typeName.slice(1) : "Unknown",
      icon: "",
      color: "#6b7280",
    };
  };

  const getFormTypeColor = (type) => {
    const formType = activeFormTypes.find((ft) => ft.name === type);
    if (formType && formType.color) {
      // Convert hex to rgba for background
      const hex = formType.color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `bg-[${formType.color}]/10 text-[${formType.color}] border-[${formType.color}]/20`;
    }
    // Fallback colors
    switch (type) {
      case "handover":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "assessment":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "incident":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "maintenance":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "general":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleDeleteForm = async (formId) => {
    try {
      await deleteFormMutation.mutateAsync(formId);
    } catch (error) {
      console.error("Failed to delete form:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage custom forms and templates
          </p>
        </div>
        {canCreateForm && (
          <Link href="/admin/forms/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {activeFormTypes
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((formType) => (
                      <SelectItem key={formType.name} value={formType.name}>
                        {formType.display_name || formType.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="role">Assigned to Role</SelectItem>
                  <SelectItem value="users">Assigned to Users</SelectItem>
                  <SelectItem value="none">Not Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Forms ({filteredForms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No forms found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || formTypeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first form to get started"}
              </p>
              {!searchTerm && formTypeFilter === "all" && statusFilter === "all" && (
                <Link href="/admin/forms/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Form
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/forms/${form.id}`}
                          className="hover:underline"
                        >
                          {form.form_title || form.form_name}
                        </Link>
                        {form.form_description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {form.form_description.length > 50
                              ? `${form.form_description.substring(0, 50)}...`
                              : form.form_description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {form.form_type ? (
                          <Badge className={getFormTypeColor(form.form_type)}>
                            {(() => {
                              const typeInfo = getFormTypeInfo(form.form_type);
                              return (
                                <>
                                  {typeInfo.icon && <span className="mr-1">{typeInfo.icon}</span>}
                                  {typeInfo.displayName}
                                </>
                              );
                            })()}
                          </Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {form.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {form.assigned_to_role_id ? (
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {roles.find(r => r.id === form.assigned_to_role_id)?.display_name ||
                                roles.find(r => r.id === form.assigned_to_role_id)?.name ||
                                "Role"}
                            </span>
                          </div>
                        ) : form.assigned_user_ids && form.assigned_user_ids.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {form.assigned_user_ids.length} user{form.assigned_user_ids.length !== 1 ? 's' : ''}
                              {form.create_individual_assignments && (
                                <span className="ml-1">(Individual)</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {form.is_template ? (
                          <Badge variant="outline">Template</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {form.created_at
                          ? format(new Date(form.created_at), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/forms/${form.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {canUpdateForm && (
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/forms/${form.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/forms/${form.id}/submit`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Submit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/forms/${form.id}/submissions`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Submissions
                              </Link>
                            </DropdownMenuItem>
                            {canDeleteForm && (
                              <>
                                <DropdownMenuSeparator />
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
                                      <AlertDialogTitle>Delete Form</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this form?
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteForm(form.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={
                    pagination.page <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.total_pages ||
                    Math.abs(page - pagination.page) <= 2
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
                        onClick={() => setCurrentPage(page)}
                        isActive={pagination.page === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.total_pages, prev + 1)
                    )
                  }
                  className={
                    pagination.page >= pagination.total_pages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default FormsPage;


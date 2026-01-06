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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Label,
} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useFormTypes,
  useCreateFormType,
  useUpdateFormType,
  useDeleteFormType,
} from "@/hooks/useFormTypes";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { format } from "date-fns";
import { toast } from "sonner";

const FormTypesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // system vs custom
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFormType, setEditingFormType] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteFormTypeId, setDeleteFormTypeId] = useState(null);

  // Permission checks
  const { hasPermission, hasWildcardPermissions, isSuperuser } = usePermissionsCheck();

  // For superusers, grant all permissions - always check isSuperuser first
  // If user is superuser, they have all permissions regardless of other checks
  const canCreate = !!isSuperuser || !!hasWildcardPermissions || hasPermission("form_type:create") || hasPermission("form_type:*");
  const canUpdate = !!isSuperuser || !!hasWildcardPermissions || hasPermission("form_type:update") || hasPermission("form_type:*");
  const canDelete = !!isSuperuser || !!hasWildcardPermissions || hasPermission("form_type:delete") || hasPermission("form_type:*");
  const canList = !!isSuperuser || !!hasWildcardPermissions || hasPermission("form_type:list") || hasPermission("form_type:read") || hasPermission("form_type:*");

  const { data: formTypesResponse, isLoading } = useFormTypes({
    search: searchTerm || undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    is_system: typeFilter === "all" ? undefined : typeFilter === "system",
  });

  const createMutation = useCreateFormType();
  const updateMutation = useUpdateFormType();
  const deleteMutation = useDeleteFormType();

  // Handle different API response structures
  let formTypes = [];
  if (formTypesResponse) {
    if (Array.isArray(formTypesResponse)) {
      formTypes = formTypesResponse;
    } else if (formTypesResponse.form_types && Array.isArray(formTypesResponse.form_types)) {
      formTypes = formTypesResponse.form_types;
    } else if (formTypesResponse.data && Array.isArray(formTypesResponse.data)) {
      formTypes = formTypesResponse.data;
    } else if (formTypesResponse.results && Array.isArray(formTypesResponse.results)) {
      formTypes = formTypesResponse.results;
    }
  }

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#3b82f6",
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      display_name: "",
      description: "",
      icon: "",
      color: "#3b82f6",
      sort_order: 0,
      is_active: true,
    });
    setEditingFormType(null);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (formType) => {
    setEditingFormType(formType);
    setFormData({
      name: formType.name,
      display_name: formType.display_name || "",
      description: formType.description || "",
      icon: formType.icon || "",
      color: formType.color || "#3b82f6",
      sort_order: formType.sort_order || 0,
      is_active: formType.is_active !== undefined ? formType.is_active : true,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingFormType) return;
    try {
      await updateMutation.mutateAsync({
        id: editingFormType.id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteFormTypeId) return;
    try {
      await deleteMutation.mutateAsync(deleteFormTypeId);
      setDeleteFormTypeId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredFormTypes = formTypes.filter((formType) => {
    const matchesSearch =
      !searchTerm ||
      formType.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formType.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formType.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (!canList) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view form types.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Form Types</h1>
              {canCreate && (
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetForm}
                    className="h-8 w-8"
                    title="Create Form Type"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Manage form types for your organisation
            </p>
          </div>
          {canCreate ? (
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Form Type
              </Button>
            </DialogTrigger>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Form Type
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>You do not have permission to create form types</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {canCreate && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Form Type</DialogTitle>
              <DialogDescription>
                Create a new form type for your organisation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., inspection"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, no spaces (used as identifier)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder="e.g., Inspection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this form type"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="e.g., 🔍"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || !formData.display_name || createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search form types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Form Types ({filteredFormTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFormTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No form types found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormTypes.map((formType) => (
                  <TableRow key={formType.id}>
                    <TableCell className="font-medium">{formType.name}</TableCell>
                    <TableCell>{formType.display_name || formType.name}</TableCell>
                    <TableCell>
                      {formType.icon ? (
                        <span className="text-2xl">{formType.icon}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: formType.color || "#6b7280" }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formType.color || "#6b7280"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formType.is_system ? (
                        <Badge variant="outline">
                          <Shield className="mr-1 h-3 w-3" />
                          System
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formType.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formType.sort_order || 0}</TableCell>
                    <TableCell>
                      {formType.created_at
                        ? format(new Date(formType.created_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(formType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteFormTypeId(formType.id)}
                                disabled={formType.is_system}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Form Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {formType.is_system
                                    ? "System form types cannot be deleted. You can only deactivate them."
                                    : `Are you sure you want to delete "${formType.display_name || formType.name}"? This action cannot be undone.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                {!formType.is_system && (
                                  <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                )}
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Form Type</DialogTitle>
            <DialogDescription>
              Update form type details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Name cannot be changed after creation
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display_name">Display Name *</Label>
              <Input
                id="edit-display_name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Input
                  id="edit-icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-is_active">Status</Label>
                <Select
                  value={formData.is_active ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_active: value === "active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.display_name || updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormTypesPage;


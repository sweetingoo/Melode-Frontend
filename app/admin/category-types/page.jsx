"use client";

import React, { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Shield,
  Tag,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCategoryTypes,
  useCreateCategoryType,
  useUpdateCategoryType,
  useDeleteCategoryType,
} from "@/hooks/useCategoryTypes";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { toast } from "sonner";

const CategoryTypesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [categoryTypeFormData, setCategoryTypeFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
    sort_order: 0,
  });

  const { data: categoryTypesResponse, isLoading, error: categoryTypesError } = useCategoryTypes();
  const createCategoryTypeMutation = useCreateCategoryType();
  const updateCategoryTypeMutation = useUpdateCategoryType();
  const deleteCategoryTypeMutation = useDeleteCategoryType();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canListCategoryTypes = hasPermission("category_type:list");
  const canReadCategoryType = hasPermission("category_type:read");
  const canCreateCategoryType = hasPermission("category_type:create");
  const canUpdateCategoryType = hasPermission("category_type:update");
  const canDeleteCategoryType = hasPermission("category_type:delete");

  // Extract category types from response
  let categoryTypes = [];
  if (categoryTypesResponse) {
    if (Array.isArray(categoryTypesResponse)) {
      categoryTypes = categoryTypesResponse;
    } else if (categoryTypesResponse.category_types && Array.isArray(categoryTypesResponse.category_types)) {
      categoryTypes = categoryTypesResponse.category_types;
    } else if (categoryTypesResponse.data && Array.isArray(categoryTypesResponse.data)) {
      categoryTypes = categoryTypesResponse.data;
    } else if (categoryTypesResponse.results && Array.isArray(categoryTypesResponse.results)) {
      categoryTypes = categoryTypesResponse.results;
    }
  }

  // Sort by sort_order, then by display_name
  const sortedCategoryTypes = [...categoryTypes].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  const handleCreateCategoryType = async () => {
    if (!categoryTypeFormData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    // Ensure name is generated from display name
    const autoName = categoryTypeFormData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!autoName) {
      toast.error("Display name must contain at least one letter or number");
      return;
    }
    
    try {
      await createCategoryTypeMutation.mutateAsync({
        ...categoryTypeFormData,
        name: autoName,
      });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create category type:", error);
    }
  };

  const handleUpdateCategoryType = async () => {
    if (!categoryTypeFormData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    try {
      // Don't send name in update - it's immutable after creation
      const { name, ...updateData } = categoryTypeFormData;
      await updateCategoryTypeMutation.mutateAsync({
        slug: selectedCategoryType.slug,
        categoryTypeData: updateData,
      });
      setIsEditModalOpen(false);
      setSelectedCategoryType(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update category type:", error);
    }
  };

  const handleDeleteCategoryType = async (slug) => {
    try {
      await deleteCategoryTypeMutation.mutateAsync(slug);
    } catch (error) {
      console.error("Failed to delete category type:", error);
    }
  };

  const resetForm = () => {
    setCategoryTypeFormData({
      name: "",
      display_name: "",
      description: "",
      icon: "",
      color: "#6B7280",
      sort_order: 0,
    });
  };

  const openEditModal = (categoryType) => {
    setSelectedCategoryType(categoryType);
    setCategoryTypeFormData({
      name: categoryType.name || "",
      display_name: categoryType.display_name || "",
      description: categoryType.description || "",
      icon: categoryType.icon || "",
      color: categoryType.color || "#6B7280",
      sort_order: categoryType.sort_order || 0,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Category Types</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage category types for assets, forms, messages, and templates
          </p>
        </div>
        {canCreateCategoryType ? (
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Category Type
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled size="sm" className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category Type
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>You do not have permission to create category types</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Category Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : categoryTypesError?.response?.status === 403 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                {categoryTypesError?.response?.data?.detail || "You do not have permission to view category types."}
              </p>
            </div>
          ) : sortedCategoryTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No category types found. Create your first category type to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCategoryTypes.map((categoryType) => (
                    <TableRow key={categoryType.id}>
                      <TableCell>
                        {categoryType.icon ? (
                          <span className="text-2xl">{categoryType.icon}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {categoryType.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {categoryType.display_name || categoryType.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {categoryType.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: categoryType.color || "#6B7280" }}
                          />
                          <span className="text-sm font-mono">
                            {categoryType.color || "#6B7280"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categoryType.is_system ? (
                          <Badge variant="outline" className="bg-blue-500/10">
                            <Shield className="mr-1 h-3 w-3" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {categoryType.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdateCategoryType && (
                              <DropdownMenuItem onClick={() => openEditModal(categoryType)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {!categoryType.is_system && canDeleteCategoryType && (
                              <>
                                {canUpdateCategoryType && <DropdownMenuSeparator />}
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
                                      <AlertDialogTitle>Delete Category Type</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this category type? This
                                        action cannot be undone. Make sure no active records are
                                        using this category type.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCategoryType(categoryType.slug)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {(!canUpdateCategoryType || (!categoryType.is_system && !canDeleteCategoryType)) && (
                              <DropdownMenuLabel className="text-xs text-muted-foreground">
                                No actions available
                              </DropdownMenuLabel>
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

      {/* Create Category Type Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category Type</DialogTitle>
            <DialogDescription>
              Create a new category type for categorising assets, forms, messages, and templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={categoryTypeFormData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                  setCategoryTypeFormData({
                    ...categoryTypeFormData,
                    display_name: displayName,
                    name: autoName,
                  });
                }}
                placeholder="e.g., Medical"
              />
            </div>
            <div>
              <Label htmlFor="name">Name (Unique Identifier) *</Label>
              <Input
                id="name"
                value={categoryTypeFormData.name}
                disabled
                className="font-mono bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from display name. Lowercase letters, numbers, and underscores only. Used internally.
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={categoryTypeFormData.description}
                onChange={(e) =>
                  setCategoryTypeFormData({
                    ...categoryTypeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this category type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={categoryTypeFormData.icon}
                  onChange={(e) =>
                    setCategoryTypeFormData({
                      ...categoryTypeFormData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="🏥"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={categoryTypeFormData.color}
                    onChange={(e) =>
                      setCategoryTypeFormData({
                        ...categoryTypeFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={categoryTypeFormData.color}
                    onChange={(e) =>
                      setCategoryTypeFormData({
                        ...categoryTypeFormData,
                        color: e.target.value,
                      })
                    }
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={categoryTypeFormData.sort_order}
                onChange={(e) =>
                  setCategoryTypeFormData({
                    ...categoryTypeFormData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower numbers appear first in lists.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategoryType}
              disabled={
                createCategoryTypeMutation.isPending ||
                !categoryTypeFormData.display_name
              }
            >
              {createCategoryTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Category Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Type Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Type</DialogTitle>
            <DialogDescription>
              Update category type details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-display_name">Display Name *</Label>
              <Input
                id="edit-display_name"
                value={categoryTypeFormData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  // Only auto-generate name if it's not a system type (system types keep their original name)
                  if (!selectedCategoryType?.is_system) {
                    const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                    setCategoryTypeFormData({
                      ...categoryTypeFormData,
                      display_name: displayName,
                      name: autoName,
                    });
                  } else {
                    setCategoryTypeFormData({
                      ...categoryTypeFormData,
                      display_name: displayName,
                    });
                  }
                }}
                placeholder="e.g., Medical"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name (Unique Identifier)</Label>
              <Input
                id="edit-name"
                value={categoryTypeFormData.name}
                disabled
                className="font-mono bg-muted"
              />
              {selectedCategoryType?.is_system ? (
                <p className="text-xs text-muted-foreground mt-1">
                  System category types cannot have their name changed.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from display name. Cannot be changed after creation.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={categoryTypeFormData.description}
                onChange={(e) =>
                  setCategoryTypeFormData({
                    ...categoryTypeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this category type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-icon">Icon (Emoji)</Label>
                <Input
                  id="edit-icon"
                  value={categoryTypeFormData.icon}
                  onChange={(e) =>
                    setCategoryTypeFormData({
                      ...categoryTypeFormData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="🏥"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={categoryTypeFormData.color}
                    onChange={(e) =>
                      setCategoryTypeFormData({
                        ...categoryTypeFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={categoryTypeFormData.color}
                    onChange={(e) =>
                      setCategoryTypeFormData({
                        ...categoryTypeFormData,
                        color: e.target.value,
                      })
                    }
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-sort_order">Sort Order</Label>
              <Input
                id="edit-sort_order"
                type="number"
                value={categoryTypeFormData.sort_order}
                onChange={(e) =>
                  setCategoryTypeFormData({
                    ...categoryTypeFormData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedCategoryType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategoryType}
              disabled={
                updateCategoryTypeMutation.isPending ||
                !categoryTypeFormData.display_name
              }
            >
              {updateCategoryTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Category Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryTypesPage;

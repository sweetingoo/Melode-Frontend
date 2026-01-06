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
  Package,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
  useDeleteAssetType,
} from "@/hooks/useAssetTypes";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { toast } from "sonner";

const AssetTypesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [assetTypeFormData, setAssetTypeFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
    sort_order: 0,
  });

  const { data: assetTypesResponse, isLoading, error: assetTypesError } = useAssetTypes();
  const createAssetTypeMutation = useCreateAssetType();
  const updateAssetTypeMutation = useUpdateAssetType();
  const deleteAssetTypeMutation = useDeleteAssetType();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateAssetType = hasPermission("asset_type:create");
  const canUpdateAssetType = hasPermission("asset_type:update");
  const canDeleteAssetType = hasPermission("asset_type:delete");

  // Extract asset types from response
  let assetTypes = [];
  if (assetTypesResponse) {
    if (Array.isArray(assetTypesResponse)) {
      assetTypes = assetTypesResponse;
    } else if (assetTypesResponse.asset_types && Array.isArray(assetTypesResponse.asset_types)) {
      assetTypes = assetTypesResponse.asset_types;
    } else if (assetTypesResponse.data && Array.isArray(assetTypesResponse.data)) {
      assetTypes = assetTypesResponse.data;
    } else if (assetTypesResponse.results && Array.isArray(assetTypesResponse.results)) {
      assetTypes = assetTypesResponse.results;
    }
  }

  // Sort by sort_order, then by display_name
  const sortedAssetTypes = [...assetTypes].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  const handleCreateAssetType = async () => {
    if (!assetTypeFormData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    // Ensure name is generated from display name
    const autoName = assetTypeFormData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!autoName) {
      toast.error("Display name must contain at least one letter or number");
      return;
    }
    
    try {
      await createAssetTypeMutation.mutateAsync({
        ...assetTypeFormData,
        name: autoName,
      });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create asset type:", error);
    }
  };

  const handleUpdateAssetType = async () => {
    if (!assetTypeFormData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    try {
      // Don't send name in update - it's immutable after creation
      const { name, ...updateData } = assetTypeFormData;
      await updateAssetTypeMutation.mutateAsync({
        slug: selectedAssetType.slug,
        assetTypeData: updateData,
      });
      setIsEditModalOpen(false);
      setSelectedAssetType(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update asset type:", error);
    }
  };

  const handleDeleteAssetType = async (slug) => {
    try {
      await deleteAssetTypeMutation.mutateAsync(slug);
    } catch (error) {
      console.error("Failed to delete asset type:", error);
    }
  };

  const resetForm = () => {
    setAssetTypeFormData({
      name: "",
      display_name: "",
      description: "",
      icon: "",
      color: "#6B7280",
      sort_order: 0,
    });
  };

  const openEditModal = (assetType) => {
    setSelectedAssetType(assetType);
    setAssetTypeFormData({
      name: assetType.name || "",
      display_name: assetType.display_name || "",
      description: assetType.description || "",
      icon: assetType.icon || "",
      color: assetType.color || "#6B7280",
      sort_order: assetType.sort_order || 0,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Asset Types</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage asset types for your organisation
          </p>
        </div>
        {canCreateAssetType ? (
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Asset Type
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled size="sm" className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Asset Type
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>You do not have permission to create asset types</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Asset Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : assetTypesError?.response?.status === 403 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                {assetTypesError?.response?.data?.detail || "You do not have permission to view asset types."}
              </p>
            </div>
          ) : sortedAssetTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No asset types found. Create your first asset type to get started.
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
                  {sortedAssetTypes.map((assetType) => (
                    <TableRow key={assetType.id}>
                      <TableCell>
                        {assetType.icon ? (
                          <span className="text-2xl">{assetType.icon}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {assetType.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {assetType.display_name || assetType.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {assetType.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: assetType.color || "#6B7280" }}
                          />
                          <span className="text-sm font-mono">
                            {assetType.color || "#6B7280"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assetType.is_system ? (
                          <Badge variant="outline" className="bg-blue-500/10">
                            <Shield className="mr-1 h-3 w-3" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {assetType.is_active ? (
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
                            {canUpdateAssetType && (
                              <DropdownMenuItem onClick={() => openEditModal(assetType)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {!assetType.is_system && canDeleteAssetType && (
                              <>
                                {canUpdateAssetType && <DropdownMenuSeparator />}
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
                                      <AlertDialogTitle>Delete Asset Type</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this asset type? This
                                        action cannot be undone. Make sure no active assets are
                                        using this asset type.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteAssetType(assetType.slug)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {(!canUpdateAssetType || (!assetType.is_system && !canDeleteAssetType)) && (
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

      {/* Create Asset Type Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Asset Type</DialogTitle>
            <DialogDescription>
              Create a new asset type for your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={assetTypeFormData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                  setAssetTypeFormData({
                    ...assetTypeFormData,
                    display_name: displayName,
                    name: autoName,
                  });
                }}
                placeholder="e.g., Fridge"
              />
            </div>
            <div>
              <Label htmlFor="name">Name (Unique Identifier) *</Label>
              <Input
                id="name"
                value={assetTypeFormData.name}
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
                value={assetTypeFormData.description}
                onChange={(e) =>
                  setAssetTypeFormData({
                    ...assetTypeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this asset type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={assetTypeFormData.icon}
                  onChange={(e) =>
                    setAssetTypeFormData({
                      ...assetTypeFormData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="🧊"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={assetTypeFormData.color}
                    onChange={(e) =>
                      setAssetTypeFormData({
                        ...assetTypeFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={assetTypeFormData.color}
                    onChange={(e) =>
                      setAssetTypeFormData({
                        ...assetTypeFormData,
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
                value={assetTypeFormData.sort_order}
                onChange={(e) =>
                  setAssetTypeFormData({
                    ...assetTypeFormData,
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
              onClick={handleCreateAssetType}
              disabled={
                createAssetTypeMutation.isPending ||
                !assetTypeFormData.display_name
              }
            >
              {createAssetTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Asset Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Type Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset Type</DialogTitle>
            <DialogDescription>
              Update asset type details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-display_name">Display Name *</Label>
              <Input
                id="edit-display_name"
                value={assetTypeFormData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  // Only auto-generate name if it's not a system type (system types keep their original name)
                  if (!selectedAssetType?.is_system) {
                    const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                    setAssetTypeFormData({
                      ...assetTypeFormData,
                      display_name: displayName,
                      name: autoName,
                    });
                  } else {
                    setAssetTypeFormData({
                      ...assetTypeFormData,
                      display_name: displayName,
                    });
                  }
                }}
                placeholder="e.g., Fridge"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name (Unique Identifier)</Label>
              <Input
                id="edit-name"
                value={assetTypeFormData.name}
                disabled
                className="font-mono bg-muted"
              />
              {selectedAssetType?.is_system ? (
                <p className="text-xs text-muted-foreground mt-1">
                  System asset types cannot have their name changed.
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
                value={assetTypeFormData.description}
                onChange={(e) =>
                  setAssetTypeFormData({
                    ...assetTypeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this asset type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-icon">Icon (Emoji)</Label>
                <Input
                  id="edit-icon"
                  value={assetTypeFormData.icon}
                  onChange={(e) =>
                    setAssetTypeFormData({
                      ...assetTypeFormData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="🧊"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={assetTypeFormData.color}
                    onChange={(e) =>
                      setAssetTypeFormData({
                        ...assetTypeFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={assetTypeFormData.color}
                    onChange={(e) =>
                      setAssetTypeFormData({
                        ...assetTypeFormData,
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
                value={assetTypeFormData.sort_order}
                onChange={(e) =>
                  setAssetTypeFormData({
                    ...assetTypeFormData,
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
                setSelectedAssetType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAssetType}
              disabled={
                updateAssetTypeMutation.isPending ||
                !assetTypeFormData.display_name
              }
            >
              {updateAssetTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Asset Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetTypesPage;

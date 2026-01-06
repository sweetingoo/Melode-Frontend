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
  Palette,
  MapPin,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useLocationTypes,
  useCreateLocationType,
  useUpdateLocationType,
  useDeleteLocationType,
} from "@/hooks/useLocationTypes";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { toast } from "sonner";

const LocationTypesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocationType, setSelectedLocationType] = useState(null);
  const [locationTypeFormData, setLocationTypeFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
    sort_order: 0,
  });

  const { data: locationTypesResponse, isLoading, error: locationTypesError } = useLocationTypes();
  const createLocationTypeMutation = useCreateLocationType();
  const updateLocationTypeMutation = useUpdateLocationType();
  const deleteLocationTypeMutation = useDeleteLocationType();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateLocationType = hasPermission("location_type:create");
  const canUpdateLocationType = hasPermission("location_type:update");
  const canDeleteLocationType = hasPermission("location_type:delete");

  // Extract location types from response
  let locationTypes = [];
  if (locationTypesResponse) {
    if (Array.isArray(locationTypesResponse)) {
      locationTypes = locationTypesResponse;
    } else if (locationTypesResponse.location_types && Array.isArray(locationTypesResponse.location_types)) {
      locationTypes = locationTypesResponse.location_types;
    } else if (locationTypesResponse.data && Array.isArray(locationTypesResponse.data)) {
      locationTypes = locationTypesResponse.data;
    } else if (locationTypesResponse.results && Array.isArray(locationTypesResponse.results)) {
      locationTypes = locationTypesResponse.results;
    }
  }

  // Sort by sort_order, then by display_name
  const sortedLocationTypes = [...locationTypes].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  const handleCreateLocationType = async () => {
    if (!locationTypeFormData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    // Ensure name is generated from display name
    const autoName = locationTypeFormData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!autoName) {
      toast.error("Display name must contain at least one letter or number");
      return;
    }
    
    try {
      await createLocationTypeMutation.mutateAsync({
        ...locationTypeFormData,
        name: autoName,
      });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create location type:", error);
    }
  };

  const handleUpdateLocationType = async () => {
    if (!locationTypeFormData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    try {
      // Don't send name in update - it's immutable after creation
      const { name, ...updateData } = locationTypeFormData;
      await updateLocationTypeMutation.mutateAsync({
        slug: selectedLocationType.slug,
        locationTypeData: updateData,
      });
      setIsEditModalOpen(false);
      setSelectedLocationType(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update location type:", error);
    }
  };

  const handleDeleteLocationType = async (slug) => {
    try {
      await deleteLocationTypeMutation.mutateAsync(slug);
    } catch (error) {
      console.error("Failed to delete location type:", error);
    }
  };

  const resetForm = () => {
    setLocationTypeFormData({
      name: "",
      display_name: "",
      description: "",
      icon: "",
      color: "#6B7280",
      sort_order: 0,
    });
  };

  const openEditModal = (locationType) => {
    setSelectedLocationType(locationType);
    setLocationTypeFormData({
      name: locationType.name || "",
      display_name: locationType.display_name || "",
      description: locationType.description || "",
      icon: locationType.icon || "",
      color: locationType.color || "#6B7280",
      sort_order: locationType.sort_order || 0,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Location Types</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage location types for your organisation
          </p>
        </div>
        {canCreateLocationType ? (
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Location Type
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled size="sm" className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Location Type
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>You do not have permission to create location types</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Location Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Location Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : locationTypesError?.response?.status === 403 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                {locationTypesError?.response?.data?.detail || "You do not have permission to view location types."}
              </p>
            </div>
          ) : sortedLocationTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No location types found. Create your first location type to get started.
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
                  {sortedLocationTypes.map((locationType) => (
                    <TableRow key={locationType.id}>
                      <TableCell>
                        {locationType.icon ? (
                          <span className="text-2xl">{locationType.icon}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {locationType.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {locationType.display_name || locationType.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {locationType.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: locationType.color || "#6B7280" }}
                          />
                          <span className="text-sm font-mono">
                            {locationType.color || "#6B7280"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {locationType.is_system ? (
                          <Badge variant="outline" className="bg-blue-500/10">
                            <Shield className="mr-1 h-3 w-3" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {locationType.is_active ? (
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
                            {canUpdateLocationType && (
                              <DropdownMenuItem onClick={() => openEditModal(locationType)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {!locationType.is_system && canDeleteLocationType && (
                              <>
                                {canUpdateLocationType && <DropdownMenuSeparator />}
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
                                      <AlertDialogTitle>Delete Location Type</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this location type? This
                                        action cannot be undone. Make sure no active locations are
                                        using this location type.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteLocationType(locationType.slug)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {(!canUpdateLocationType || (!locationType.is_system && !canDeleteLocationType)) && (
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

      {/* Create Location Type Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Location Type</DialogTitle>
            <DialogDescription>
              Create a new location type for your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={locationTypeFormData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                  setLocationTypeFormData({
                    ...locationTypeFormData,
                    display_name: displayName,
                    name: autoName,
                  });
                }}
                placeholder="e.g., Ward"
              />
            </div>
            <div>
              <Label htmlFor="name">Name (Unique Identifier) *</Label>
              <Input
                id="name"
                value={locationTypeFormData.name}
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
                value={locationTypeFormData.description}
                onChange={(e) =>
                  setLocationTypeFormData({
                    ...locationTypeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this location type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={locationTypeFormData.icon}
                  onChange={(e) =>
                    setLocationTypeFormData({
                      ...locationTypeFormData,
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
                    value={locationTypeFormData.color}
                    onChange={(e) =>
                      setLocationTypeFormData({
                        ...locationTypeFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={locationTypeFormData.color}
                    onChange={(e) =>
                      setLocationTypeFormData({
                        ...locationTypeFormData,
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
                value={locationTypeFormData.sort_order}
                onChange={(e) =>
                  setLocationTypeFormData({
                    ...locationTypeFormData,
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
              onClick={handleCreateLocationType}
              disabled={
                createLocationTypeMutation.isPending ||
                !locationTypeFormData.display_name
              }
            >
              {createLocationTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Location Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Type Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location Type</DialogTitle>
            <DialogDescription>
              Update location type details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-display_name">Display Name *</Label>
              <Input
                id="edit-display_name"
                value={locationTypeFormData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  // Only auto-generate name if it's not a system type (system types keep their original name)
                  if (!selectedLocationType?.is_system) {
                    const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                    setLocationTypeFormData({
                      ...locationTypeFormData,
                      display_name: displayName,
                      name: autoName,
                    });
                  } else {
                    setLocationTypeFormData({
                      ...locationTypeFormData,
                      display_name: displayName,
                    });
                  }
                }}
                placeholder="e.g., Ward"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name (Unique Identifier)</Label>
              <Input
                id="edit-name"
                value={locationTypeFormData.name}
                disabled
                className="font-mono bg-muted"
              />
              {selectedLocationType?.is_system ? (
                <p className="text-xs text-muted-foreground mt-1">
                  System location types cannot have their name changed.
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
                value={locationTypeFormData.description}
                onChange={(e) =>
                  setLocationTypeFormData({
                    ...locationTypeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this location type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-icon">Icon (Emoji)</Label>
                <Input
                  id="edit-icon"
                  value={locationTypeFormData.icon}
                  onChange={(e) =>
                    setLocationTypeFormData({
                      ...locationTypeFormData,
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
                    value={locationTypeFormData.color}
                    onChange={(e) =>
                      setLocationTypeFormData({
                        ...locationTypeFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={locationTypeFormData.color}
                    onChange={(e) =>
                      setLocationTypeFormData({
                        ...locationTypeFormData,
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
                value={locationTypeFormData.sort_order}
                onChange={(e) =>
                  setLocationTypeFormData({
                    ...locationTypeFormData,
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
                setSelectedLocationType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLocationType}
              disabled={
                updateLocationTypeMutation.isPending ||
                !locationTypeFormData.display_name
              }
            >
              {updateLocationTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Location Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationTypesPage;

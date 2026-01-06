"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Layers,
  FolderTree,
  Home,
  MapPin,
  ArrowLeft,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocations, useCreateLocation } from "@/hooks/useLocations";
import {
  useActiveLocationTypes,
  useCreateLocationType,
} from "@/hooks/useLocationTypes";
import { useQueryClient } from "@tanstack/react-query";
import { locationTypeKeys } from "@/hooks/useLocationTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AddLocationPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: locationTypes = [], isLoading: locationTypesLoading } = useActiveLocationTypes();
  const createLocationMutation = useCreateLocation();
  const createLocationTypeMutation = useCreateLocationType();

  // Quick create location type state
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
  });

  // Form data - matching API schema
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    description: "",
    location_type_id: null,
    parent_location_id: null,
    address: "",
    coordinates: "",
    capacity: 0,
    area_sqm: 0,
    status: "active",
    is_accessible: true,
    requires_access_control: false,
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    responsible_department: "",
    is_active: true,
  });

  const handleQuickCreateLocationType = async () => {
    if (!quickCreateData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    // Ensure name is generated from display name
    const autoName = quickCreateData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!autoName) {
      toast.error("Display name must contain at least one letter or number");
      return;
    }

    try {
      const result = await createLocationTypeMutation.mutateAsync({
        name: autoName,
        display_name: quickCreateData.display_name,
        description: quickCreateData.description || "",
        icon: quickCreateData.icon || "",
        color: quickCreateData.color || "#6B7280",
        sort_order: 0,
      });
      
      // Wait for query invalidation to complete, then auto-select the new one
      setTimeout(() => {
        setLocationFormData({
          ...locationFormData,
          location_type_id: result.id,
        });
      }, 100);
      
      setIsQuickCreateOpen(false);
      setQuickCreateData({
        name: "",
        display_name: "",
        description: "",
        icon: "",
        color: "#6B7280",
      });
    } catch (error) {
      console.error("Failed to create location type:", error);
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (
      !locationFormData.name ||
      !locationFormData.location_type_id ||
      !locationFormData.address
    ) {
      toast.error("Please fill in all required fields", {
        description: "Location name, type, and address are required.",
      });
      return;
    }

    createLocationMutation.mutate(locationFormData, {
      onSuccess: () => {
        toast.success("Location created successfully!", {
          description: "Redirecting to locations list...",
        });
        router.push("/admin/locations");
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Location
          </h1>
          <p className="text-muted-foreground">
            Add a new location to the system. Fill in all required information
            below.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="location-name">
                  Location Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location-name"
                  value={locationFormData.name}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Headquarters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={locationFormData.description}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Location description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location-type">
                    Location Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={locationFormData.location_type_id?.toString() || ""}
                      onValueChange={(value) =>
                        setLocationFormData({
                          ...locationFormData,
                          location_type_id: value ? parseInt(value) : null,
                        })
                      }
                      disabled={locationTypesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={locationTypesLoading ? "Loading types..." : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {locationTypesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading location types...
                          </SelectItem>
                        ) : locationTypes.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No location types available
                          </SelectItem>
                        ) : (
                          locationTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              <div className="flex items-center gap-2">
                                {type.icon && (
                                  <span className="text-base">{type.icon}</span>
                                )}
                                {type.display_name || type.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsQuickCreateOpen(true)}
                      title="Create new location type"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-location">Parent Location</Label>
                  <Select
                    value={
                      locationFormData.parent_location_id?.toString() ||
                      "__none__"
                    }
                    onValueChange={(value) =>
                      setLocationFormData({
                        ...locationFormData,
                        parent_location_id:
                          value === "__none__" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        None (Root Location)
                      </SelectItem>
                      {locationsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading locations...
                        </SelectItem>
                      ) : (
                        locations.map((location) => (
                          <SelectItem
                            key={location.id}
                            value={location.id.toString()}
                          >
                            {location.name}{" "}
                            {location.displayName &&
                              `(${location.displayName})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Address Information</h3>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={locationFormData.address}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      address: e.target.value,
                    })
                  }
                  placeholder="123 High Street"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinates">Coordinates</Label>
                <Input
                  id="coordinates"
                  value={locationFormData.coordinates}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      coordinates: e.target.value,
                    })
                  }
                  placeholder="40.7128,-74.0060 or GeoJSON format"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: GPS coordinates or GeoJSON format
                </p>
              </div>
            </div>

            {/* Physical Properties */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Physical Properties</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={locationFormData.capacity}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_sqm">Area (sqm)</Label>
                  <Input
                    id="area_sqm"
                    type="number"
                    step="0.01"
                    value={locationFormData.area_sqm}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        area_sqm: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Status & Access */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Status & Access</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={locationFormData.status}
                    onValueChange={(value) =>
                      setLocationFormData({
                        ...locationFormData,
                        status: value,
                      })
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

                <div className="space-y-2">
                  <Label htmlFor="responsible_department">
                    Responsible Department
                  </Label>
                  <Input
                    id="responsible_department"
                    value={locationFormData.responsible_department}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        responsible_department: e.target.value,
                      })
                    }
                    placeholder="IT, Operations, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_accessible"
                    checked={locationFormData.is_accessible}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        is_accessible: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <Label htmlFor="is_accessible" className="cursor-pointer">
                    Is Accessible
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_access_control"
                    checked={locationFormData.requires_access_control}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        requires_access_control: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <Label
                    htmlFor="requires_access_control"
                    className="cursor-pointer"
                  >
                    Requires Access Control
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={locationFormData.is_active}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      is_active: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Is Active
                </Label>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={locationFormData.contact_person}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        contact_person: e.target.value,
                      })
                    }
                    placeholder="Alex Brown"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={locationFormData.contact_phone}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        contact_phone: e.target.value,
                      })
                    }
                    placeholder="+44 20 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={locationFormData.contact_email}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        contact_email: e.target.value,
                      })
                    }
                    placeholder="alex.brown@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={createLocationMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createLocationMutation.isPending}
        >
          {createLocationMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Location"
          )}
        </Button>
      </div>

      {/* Quick Create Location Type Dialog */}
      <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Location Type</DialogTitle>
            <DialogDescription>
              Quickly create a new location type. It will be automatically selected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-display_name">Display Name *</Label>
              <Input
                id="quick-display_name"
                value={quickCreateData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                  setQuickCreateData({
                    ...quickCreateData,
                    display_name: displayName,
                    name: autoName,
                  });
                }}
                placeholder="e.g., Ward"
              />
            </div>
            <div>
              <Label htmlFor="quick-name">Name (Unique Identifier) *</Label>
              <Input
                id="quick-name"
                value={quickCreateData.name}
                disabled
                className="font-mono bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from display name. Lowercase letters, numbers, and underscores only.
              </p>
            </div>
            <div>
              <Label htmlFor="quick-description">Description</Label>
              <Textarea
                id="quick-description"
                value={quickCreateData.description}
                onChange={(e) =>
                  setQuickCreateData({
                    ...quickCreateData,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quick-icon">Icon (Emoji)</Label>
                <Input
                  id="quick-icon"
                  value={quickCreateData.icon}
                  onChange={(e) =>
                    setQuickCreateData({
                      ...quickCreateData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="🏥"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="quick-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="quick-color"
                    type="color"
                    value={quickCreateData.color}
                    onChange={(e) =>
                      setQuickCreateData({
                        ...quickCreateData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={quickCreateData.color}
                    onChange={(e) =>
                      setQuickCreateData({
                        ...quickCreateData,
                        color: e.target.value,
                      })
                    }
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickCreateOpen(false);
                setQuickCreateData({
                  name: "",
                  display_name: "",
                  description: "",
                  icon: "",
                  color: "#6B7280",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickCreateLocationType}
              disabled={
                createLocationTypeMutation.isPending ||
                !quickCreateData.name ||
                !quickCreateData.display_name
              }
            >
              {createLocationTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create & Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddLocationPage;

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
} from "lucide-react";
import { toast } from "sonner";
import { useLocations, useCreateLocation } from "@/hooks/useLocations";

const locationTypes = [
  { value: "site", label: "Site", icon: Building2 },
  { value: "building", label: "Building", icon: Building2 },
  { value: "room", label: "Room", icon: Home },
  { value: "area", label: "Area", icon: MapPin },
  { value: "zone", label: "Zone", icon: Layers },
  { value: "floor", label: "Floor", icon: Layers },
  { value: "wing", label: "Wing", icon: FolderTree },
];

const AddLocationPage = () => {
  const router = useRouter();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const createLocationMutation = useCreateLocation();

  // Form data - matching API schema
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    description: "",
    location_type: "",
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

  const handleSubmit = () => {
    // Validate required fields
    if (
      !locationFormData.name ||
      !locationFormData.location_type ||
      !locationFormData.address
    ) {
      toast.error("Please fill in all required fields", {
        description: "Location name, type, and address are required.",
      });
      return;
    }

    // Debug: Log form data before sending
    console.log("Form data before mutation:", locationFormData);

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
                  <Select
                    value={locationFormData.location_type}
                    onValueChange={(value) =>
                      setLocationFormData({
                        ...locationFormData,
                        location_type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
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
                  placeholder="123 Main Street"
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
                    placeholder="John Doe"
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
                    placeholder="+1 234 567 8900"
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
                    placeholder="john@example.com"
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
    </div>
  );
};

export default AddLocationPage;

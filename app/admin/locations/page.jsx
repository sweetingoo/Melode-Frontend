"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
// Dialog import removed - Create Location Dialog is now a dedicated page
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  MapPin,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  X,
  Building2,
  ChevronRight,
  ChevronDown,
  Move,
  Network,
  Layers,
  Home,
  ArrowRight,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";
import {
  useLocations,
  useRootLocations,
  useLocationStatistics,
  useUpdateLocation,
  useDeleteLocation,
  useMoveLocation,
  locationsUtils,
} from "@/hooks/useLocations";
import {
  useActiveLocationTypes,
  useCreateLocationType,
} from "@/hooks/useLocationTypes";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import MultiFileUpload from "@/components/MultiFileUpload";
import FileAttachmentList from "@/components/FileAttachmentList";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const LocationsPage = () => {
  const router = useRouter();
  // State management
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQuickCreateLocationTypeOpen, setIsQuickCreateLocationTypeOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [quickCreateLocationTypeData, setQuickCreateLocationTypeData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
  });

  // API hooks
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: rootLocations = [], isLoading: rootLocationsLoading } =
    useRootLocations();
  const { data: statistics, isLoading: statisticsLoading } =
    useLocationStatistics();
  const queryClient = useQueryClient();
  const { data: locationTypes = [], isLoading: locationTypesLoading } = useActiveLocationTypes();
  const createLocationTypeMutation = useCreateLocationType();
  // createLocationMutation removed - now handled in add-location page
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();
  const moveLocationMutation = useMoveLocation();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateLocation = hasPermission("location:create");
  const canUpdateLocation = hasPermission("location:update");
  const canDeleteLocation = hasPermission("location:delete");

  // Form data - matching API schema (kept for edit modal)
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

  // Compute statistics from API data
  const computedStats = React.useMemo(() => {
    if (statistics) {
      return {
        totalLocations: statistics.total_locations || statistics.total || 0,
        rootLocations:
          statistics.root_locations || statistics.roots || rootLocations.length,
        activeLocations: statistics.active_locations || statistics.active || 0,
        inactiveLocations:
          statistics.inactive_locations || statistics.inactive || 0,
        changePercentage: statistics.change_percentage || 0,
      };
    }
    // Fallback to computed from locations
    const active = locations.filter(
      (l) => l.isActive || l.status === "active"
    ).length;
    const inactive = locations.length - active;
    return {
      totalLocations: locations.length,
      rootLocations: rootLocations.length,
      activeLocations: active,
      inactiveLocations: inactive,
      changePercentage: 0,
    };
  }, [statistics, locations, rootLocations]);

  // Removed mock locations - using API data instead
  // Mock locations with hierarchy - commented out, using API data
  /*
  const mockLocations = [
    {
      id: 1,
      locationName: "Headquarters",
      locationCode: "HQ-001",
      locationType: "office",
      parentId: null,
      address: "123 High Street",
      city: "London",
      state: "Greater London",
      country: "United Kingdom",
      zipCode: "SW1A 1AA",
      status: "active",
      children: [
        {
          id: 2,
          locationName: "Floor 1",
          locationCode: "HQ-001-F1",
          locationType: "floor",
          parentId: 1,
      address: "123 High Street, Floor 1",
      city: "London",
      state: "Greater London",
      country: "United Kingdom",
      zipCode: "SW1A 1AA",
          status: "active",
          children: [
            {
              id: 3,
              locationName: "Office A",
              locationCode: "HQ-001-F1-OA",
              locationType: "office",
              parentId: 2,
      address: "123 High Street, Floor 1, Office A",
      city: "London",
      state: "Greater London",
      country: "United Kingdom",
      zipCode: "SW1A 1AA",
              status: "active",
              children: [],
            },
            {
              id: 4,
              locationName: "Office B",
              locationCode: "HQ-001-F1-OB",
              locationType: "office",
              parentId: 2,
      address: "123 High Street, Floor 1, Office B",
      city: "London",
      state: "Greater London",
      country: "United Kingdom",
      zipCode: "SW1A 1AA",
              status: "active",
              children: [],
            },
          ],
        },
        {
          id: 5,
          locationName: "Floor 2",
          locationCode: "HQ-001-F2",
          locationType: "floor",
          parentId: 1,
      address: "123 High Street, Floor 2",
      city: "London",
      state: "Greater London",
      country: "United Kingdom",
      zipCode: "SW1A 1AA",
          status: "active",
          children: [],
        },
      ],
    },
    {
      id: 6,
      locationName: "Distribution Centre",
      locationCode: "WH-001",
      locationType: "warehouse",
      parentId: null,
      address: "456 Industrial Way",
      city: "Manchester",
      state: "Greater Manchester",
      country: "United Kingdom",
      zipCode: "M1 1AA",
      status: "active",
      children: [
        {
          id: 7,
          locationName: "Section A",
          locationCode: "WH-001-SA",
          locationType: "section",
          parentId: 6,
      address: "456 Industrial Way, Section A",
      city: "Manchester",
      state: "Greater Manchester",
      country: "United Kingdom",
      zipCode: "M1 1AA",
          status: "active",
          children: [],
        },
      ],
    },
    {
      id: 8,
      locationName: "Remote Office",
      locationCode: "RO-001",
      locationType: "office",
      parentId: null,
      address: "789 Tech Park",
      city: "Edinburgh",
      state: "Scotland",
      country: "United Kingdom",
      zipCode: "EH1 1AA",
      status: "active",
      children: [],
    },
  ];
  */


  // No need to flatten - API returns flat array

  // Filter locations based on search and filters
  const filteredLocations = React.useMemo(() => {
    let filtered = locations;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (location) =>
          (location.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (location.displayName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (location.fullPath || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (location.address || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Type filter - use location_type_id if available, fallback to location_type string
    if (selectedType !== "all") {
      filtered = filtered.filter((location) => {
        // Try location_type_id first (new approach)
        if (location.locationTypeId || location.location_type_id) {
          const typeId = location.locationTypeId || location.location_type_id;
          return typeId.toString() === selectedType;
        }
        // Fallback to location_type string (backward compatibility)
        return (
          (location.locationType || location.location_type) === selectedType
        );
      });
    }

    return filtered;
  }, [searchQuery, selectedType, locations]);

  // Handlers
  const handleCreateLocation = () => {
    router.push("/admin/locations/add-location");
  };

  const handleEditLocation = (location) => {
    setSelectedLocation(location);
    setLocationFormData({
      name: location.name || location.locationName || "",
      description: location.description || "",
      location_type_id: location.locationTypeId || location.location_type_id || null,
      parent_location_id:
        location.parentLocationId || location.parentId || null,
      address: location.address || "",
      coordinates: location.coordinates || "",
      capacity: location.capacity || 0,
      area_sqm: location.areaSqm || location.area_sqm || 0,
      status: location.status || "active",
      is_accessible:
        location.isAccessible !== undefined ? location.isAccessible : true,
      requires_access_control:
        location.requiresAccessControl !== undefined
          ? location.requiresAccessControl
          : false,
      contact_person: location.contactPerson || location.contact_person || "",
      contact_phone: location.contactPhone || location.contact_phone || "",
      contact_email: location.contactEmail || location.contact_email || "",
      responsible_department:
        location.responsibleDepartment || location.responsible_department || "",
      is_active: location.isActive !== undefined ? location.isActive : true,
    });
    setIsEditModalOpen(true);
  };

  const handleViewLocation = (location) => {
    setSelectedLocation(location);
    setIsDetailModalOpen(true);
  };

  const handleViewHierarchy = (location) => {
    setSelectedLocation(location);
    setIsHierarchyModalOpen(true);
  };

  const handleMoveLocation = (location) => {
    setSelectedLocation(location);
    setIsMoveModalOpen(true);
  };

  const handleDeleteLocation = (location) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitEdit = () => {
    if (!selectedLocation) return;

    // Validate required fields
    if (!locationFormData.name || !locationFormData.location_type_id) {
      toast.error("Please fill in all required fields", {
        description: "Location name and type are required.",
      });
      return;
    }

    updateLocationMutation.mutate(
      {
        slug: selectedLocation.slug || selectedLocation.id,
        locationData: locationFormData,
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedLocation(null);
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!selectedLocation) return;

    deleteLocationMutation.mutate(selectedLocation.slug || selectedLocation.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedLocation(null);
      },
    });
  };

  const handleMove = (newParentId) => {
    if (!selectedLocation) return;

    moveLocationMutation.mutate(
      {
        id: selectedLocation.id,
        newParentId:
          newParentId === "__none__" || !newParentId
            ? null
            : typeof newParentId === "string"
              ? parseInt(newParentId)
              : newParentId,
      },
      {
        onSuccess: () => {
          setIsMoveModalOpen(false);
          setSelectedLocation(null);
        },
      }
    );
  };

  const handleQuickCreateLocationType = async () => {
    if (!quickCreateLocationTypeData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    // Ensure name is generated from display name
    const autoName = quickCreateLocationTypeData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!autoName) {
      toast.error("Display name must contain at least one letter or number");
      return;
    }

    try {
      const result = await createLocationTypeMutation.mutateAsync({
        name: autoName,
        display_name: quickCreateLocationTypeData.display_name,
        description: quickCreateLocationTypeData.description || "",
        icon: quickCreateLocationTypeData.icon || "",
        color: quickCreateLocationTypeData.color || "#6B7280",
        sort_order: 0,
      });
      
      // Wait for query invalidation to complete, then auto-select the new one
      setTimeout(() => {
        setLocationFormData({
          ...locationFormData,
          location_type_id: result.id,
        });
      }, 100);
      
      setIsQuickCreateLocationTypeOpen(false);
      setQuickCreateLocationTypeData({
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

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getLocationTypeIcon = (location) => {
    // Try to get icon from location_type_obj first
    if (location.locationTypeObj || location.location_type_obj) {
      const typeObj = location.locationTypeObj || location.location_type_obj;
      if (typeObj?.icon) {
        return typeObj.icon;
      }
    }
    // Fallback to default icon
    return Building2;
  };

  const getLocationTypeLabel = (location) => {
    // Try to get display_name from location_type_obj first
    if (location.locationTypeObj || location.location_type_obj) {
      const typeObj = location.locationTypeObj || location.location_type_obj;
      if (typeObj?.display_name) {
        return typeObj.display_name;
      }
      if (typeObj?.name) {
        return typeObj.name;
      }
    }
    // Fallback to location_type string or default
    return location.locationType || location.location_type || "Site";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-700 bg-green-50"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="outline"
            className="border-gray-500 text-gray-700 bg-gray-50"
          >
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render tree view
  const renderTreeNode = (location, depth = 0) => {
    const children = locations.filter(
      (l) => (l.parentLocationId || l.parentId) === location.id
    );
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(location.id.toString());
    const typeIcon = getLocationTypeIcon(location);
    const TypeIcon = typeof typeIcon === "string" ? Building2 : typeIcon;

    return (
      <div key={location.id} className="w-full">
        <div
          className={`flex items-center gap-2 p-3 hover:bg-muted/50 rounded-md transition-colors ${depth > 0 ? "ml-" + depth * 4 : ""
            }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleNode(location.id.toString())}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}
          {typeof typeIcon === "string" ? (
            <span className="text-base">{typeIcon}</span>
          ) : (
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{location.name}</span>
              {location.displayName && (
                <Badge variant="secondary" className="text-xs">
                  {location.displayName}
                </Badge>
              )}
              {getStatusBadge(location.status)}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {getLocationTypeLabel(location)}{" "}
              • {location.address || "N/A"}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewLocation(location)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewHierarchy(location)}>
                <Network className="mr-2 h-4 w-4" />
                View Hierarchy
              </DropdownMenuItem>
              {canUpdateLocation && (
                <DropdownMenuItem onClick={() => handleEditLocation(location)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Location
                </DropdownMenuItem>
              )}
              {canUpdateLocation && (
                <DropdownMenuItem onClick={() => handleMoveLocation(location)}>
                  <Move className="mr-2 h-4 w-4" />
                  Move Location
                </DropdownMenuItem>
              )}
              {canUpdateLocation && canDeleteLocation && <DropdownMenuSeparator />}
              {canDeleteLocation && (
                <DropdownMenuItem
                  onClick={() => handleDeleteLocation(location)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Location
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Locations Management
          </h1>
          <p className="text-muted-foreground">
            Manage organisational locations and their hierarchy efficiently.
          </p>
        </div>
        <Button onClick={handleCreateLocation}>
          <Plus className="mr-2 h-4 w-4" />
          Create Location
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Locations</p>
                <div className="text-2xl font-bold">
                  {locationsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    computedStats.totalLocations
                  )}
                </div>
                {!locationsLoading && computedStats.changePercentage > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">
                      {computedStats.changePercentage}%
                    </span>
                    <span>from last month</span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Root Locations</p>
                <div className="text-2xl font-bold">
                  {rootLocationsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    computedStats.rootLocations
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Top-level locations
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Active Locations</p>
                <div className="text-2xl font-bold">
                  {locationsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    computedStats.activeLocations
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Inactive Locations</p>
                <div className="text-2xl font-bold">
                  {locationsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    computedStats.inactiveLocations
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently inactive
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {locationTypesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading types...
                  </SelectItem>
                ) : (
                  locationTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.display_name || type.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {(searchQuery || selectedType !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("all");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Locations View - Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Locations</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredLocations.length}{" "}
                {filteredLocations.length === 1 ? "location" : "locations"}
              </span>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value)}>
            <TabsList>
              <TabsTrigger value="list">
                <Layers className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
              <TabsTrigger value="tree">
                <FolderTree className="h-4 w-4 mr-2" />
                Tree View
              </TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="mt-4">
              {locationsLoading ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No locations found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || selectedType !== "all"
                      ? "Try adjusting your filters to see more results."
                      : "Get started by creating your first location."}
                  </p>
                  {!searchQuery && selectedType === "all" && (
                    <Button onClick={handleCreateLocation}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Location
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocations.map((location) => {
                        const typeIcon = getLocationTypeIcon(location);
                        const TypeIcon = typeof typeIcon === "string" ? Building2 : typeIcon;
                        const parentLocation = locations.find(
                          (l) =>
                            l.id === location.parentLocationId ||
                            l.id === location.parentId
                        );
                        return (
                          <TableRow key={location.id}>
                            <TableCell className="font-medium">
                              {location.displayName || location.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {typeof typeIcon === "string" ? (
                                  <span className="text-base">{typeIcon}</span>
                                ) : (
                                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                )}
                                {location.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {getLocationTypeLabel(location)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(location.status)}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {location.address || "N/A"}
                            </TableCell>
                            <TableCell>
                              {parentLocation ? (
                                <span className="text-sm text-muted-foreground">
                                  {parentLocation.name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Root
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleViewLocation(location)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewHierarchy(location)
                                    }
                                  >
                                    <Network className="mr-2 h-4 w-4" />
                                    View Hierarchy
                                  </DropdownMenuItem>
                                  {canUpdateLocation && (
                                    <DropdownMenuItem
                                      onClick={() => handleEditLocation(location)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Location
                                    </DropdownMenuItem>
                                  )}
                                  {canUpdateLocation && (
                                    <DropdownMenuItem
                                      onClick={() => handleMoveLocation(location)}
                                    >
                                      <Move className="mr-2 h-4 w-4" />
                                      Move Location
                                    </DropdownMenuItem>
                                  )}
                                  {canUpdateLocation && canDeleteLocation && <DropdownMenuSeparator />}
                                  {canDeleteLocation && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteLocation(location)
                                      }
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Location
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="tree" className="mt-4">
              {rootLocationsLoading ? (
                <div className="rounded-md border p-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2 p-3">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                      {index < 2 && (
                        <div className="ml-8 space-y-2">
                          <div className="flex items-center gap-2 p-3">
                            <Skeleton className="h-6 w-6 rounded" />
                            <Skeleton className="h-4 w-4 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-4 w-56" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : rootLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No locations found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Get started by creating your first location.
                  </p>
                  <Button onClick={handleCreateLocation}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Location
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border p-4">
                  {rootLocations.map((location) => renderTreeNode(location))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Location Dialog - Removed, now uses dedicated page at /admin/locations/add-location */}

      {/* Edit Location Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location information. Make your changes below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location-name">Location Name *</Label>
              <Input
                id="edit-location-name"
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location-type">Location Type *</Label>
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
                    onClick={() => setIsQuickCreateLocationTypeOpen(true)}
                    title="Create new location type"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent-location">Parent Location</Label>
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
                    {locations
                      .filter((l) => l.id !== selectedLocation?.id)
                      .map((location) => (
                        <SelectItem
                          key={location.id}
                          value={location.id.toString()}
                        >
                          {location.name}
                          {location.displayName && ` (${location.displayName})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
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
              <Label htmlFor="edit-coordinates">Coordinates</Label>
              <Input
                id="edit-coordinates"
                value={locationFormData.coordinates}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    coordinates: e.target.value,
                  })
                }
                placeholder="40.7128,-74.0060 or GeoJSON format"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
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
                <Label htmlFor="edit-area_sqm">Area (sqm)</Label>
                <Input
                  id="edit-area_sqm"
                  type="number"
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
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={locationFormData.status}
                onValueChange={(value) =>
                  setLocationFormData({ ...locationFormData, status: value })
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateLocationMutation.isPending}
            >
              {updateLocationMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the selected location.
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Location Name</Label>
                  <p className="font-medium mt-1">{selectedLocation.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Display Name</Label>
                  <p className="font-medium mt-1">
                    {selectedLocation.displayName || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {getLocationTypeLabel(selectedLocation)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedLocation.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium mt-1">
                    {selectedLocation.address || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Coordinates</Label>
                  <p className="font-medium mt-1">
                    {selectedLocation.coordinates || "N/A"}
                  </p>
                </div>
                {selectedLocation.hierarchyPath && (
                  <div>
                    <Label className="text-muted-foreground">
                      Hierarchy Path
                    </Label>
                    <p className="font-medium mt-1">
                      {selectedLocation.hierarchyPath}
                    </p>
                  </div>
                )}
                {selectedLocation.fullPath && (
                  <div>
                    <Label className="text-muted-foreground">Full Path</Label>
                    <p className="font-medium mt-1">
                      {selectedLocation.fullPath}
                    </p>
                  </div>
                )}
                {(selectedLocation.parentLocationId ||
                  selectedLocation.parentId) && (
                    <div>
                      <Label className="text-muted-foreground">
                        Parent Location
                      </Label>
                      <p className="font-medium mt-1">
                        {locations.find(
                          (l) =>
                            l.id ===
                            (selectedLocation.parentLocationId ||
                              selectedLocation.parentId)
                        )?.name || "N/A"}
                      </p>
                    </div>
                  )}
                {selectedLocation.capacity > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Capacity</Label>
                    <p className="font-medium mt-1">
                      {selectedLocation.capacity}
                    </p>
                  </div>
                )}
                {selectedLocation.areaSqm > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Area (sqm)</Label>
                    <p className="font-medium mt-1">
                      {selectedLocation.areaSqm || selectedLocation.area_sqm}
                    </p>
                  </div>
                )}
                {selectedLocation.contactPerson && (
                  <div>
                    <Label className="text-muted-foreground">
                      Contact Person
                    </Label>
                    <p className="font-medium mt-1">
                      {selectedLocation.contactPerson ||
                        selectedLocation.contact_person}
                    </p>
                  </div>
                )}
                {selectedLocation.responsibleDepartment && (
                  <div>
                    <Label className="text-muted-foreground">
                      Responsible Department
                    </Label>
                    <p className="font-medium mt-1">
                      {selectedLocation.responsibleDepartment ||
                        selectedLocation.responsible_department}
                    </p>
                  </div>
                )}
              </div>

              {/* File Attachments */}
              <div className="pt-6 border-t space-y-4">
                <FileAttachmentList
                  entityType="location"
                  entityId={selectedLocation.id}
                  showTitle={true}
                />
                <MultiFileUpload
                  entityType="location"
                  entityId={selectedLocation.id}
                  maxFiles={10}
                  maxSizeMB={10}
                  onUploadComplete={() => {
                    // Files will be refreshed automatically via query invalidation
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsDetailModalOpen(false);
                handleEditLocation(selectedLocation);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Hierarchy Dialog */}
      <Dialog
        open={isHierarchyModalOpen}
        onOpenChange={setIsHierarchyModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Location Hierarchy
            </DialogTitle>
            <DialogDescription>
              View the complete hierarchy for this location.
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4 py-4">
              <div className="rounded-md border p-4">
                <div className="space-y-2">
                  <div className="font-medium">{selectedLocation.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLocation.displayName &&
                      `${selectedLocation.displayName} • `}
                    {getLocationTypeLabel(selectedLocation)}
                  </div>
                  {(() => {
                    const children = locations.filter(
                      (l) =>
                        (l.parentLocationId || l.parentId) ===
                        selectedLocation.id
                    );
                    return children.length > 0 ? (
                      <div className="mt-4 ml-4 border-l-2 pl-4">
                        <div className="text-sm font-medium mb-2">
                          Children ({children.length}):
                        </div>
                        {children.map((child) => (
                          <div key={child.id} className="ml-4 mb-2">
                            <ArrowRight className="h-4 w-4 inline mr-2" />
                            {child.name}
                            {child.displayName && ` (${child.displayName})`}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHierarchyModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Location Dialog */}
      <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Location</DialogTitle>
            <DialogDescription>
              Move this location to a different parent location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Location</Label>
              <div className="p-3 bg-muted rounded-md">
                {selectedLocation?.name}
                {selectedLocation?.displayName &&
                  ` (${selectedLocation.displayName})`}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-parent">New Parent Location</Label>
              <Select
                value={
                  selectedLocation?.parent_location_id?.toString() || "__none__"
                }
                onValueChange={(value) =>
                  handleMove(value === "__none__" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new parent location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    None (Make Root Location)
                  </SelectItem>
                  {locations
                    .filter((l) => l.id !== selectedLocation?.id)
                    .map((location) => (
                      <SelectItem
                        key={location.id}
                        value={location.id.toString()}
                      >
                        {location.name}
                        {location.displayName && ` (${location.displayName})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoveModalOpen(false)}
              disabled={moveLocationMutation.isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              location
              {selectedLocation && ` "${selectedLocation.name}"`} from the
              system.
              {(() => {
                const children = selectedLocation
                  ? locations.filter(
                    (l) =>
                      (l.parentLocationId || l.parentId) ===
                      selectedLocation.id
                  )
                  : [];
                return children.length > 0 ? (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-yellow-600 inline mr-2" />
                    <span className="text-sm text-yellow-800">
                      Warning: This location has {children.length} child
                      {children.length === 1 ? "" : "ren"}. Deleting it may
                      affect the hierarchy.
                    </span>
                  </div>
                ) : null;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Create Location Type Dialog */}
      <Dialog open={isQuickCreateLocationTypeOpen} onOpenChange={setIsQuickCreateLocationTypeOpen}>
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
                value={quickCreateLocationTypeData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                  setQuickCreateLocationTypeData({
                    ...quickCreateLocationTypeData,
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
                value={quickCreateLocationTypeData.name}
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
                value={quickCreateLocationTypeData.description}
                onChange={(e) =>
                  setQuickCreateLocationTypeData({
                    ...quickCreateLocationTypeData,
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
                  value={quickCreateLocationTypeData.icon}
                  onChange={(e) =>
                    setQuickCreateLocationTypeData({
                      ...quickCreateLocationTypeData,
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
                    value={quickCreateLocationTypeData.color}
                    onChange={(e) =>
                      setQuickCreateLocationTypeData({
                        ...quickCreateLocationTypeData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={quickCreateLocationTypeData.color}
                    onChange={(e) =>
                      setQuickCreateLocationTypeData({
                        ...quickCreateLocationTypeData,
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
                setIsQuickCreateLocationTypeOpen(false);
                setQuickCreateLocationTypeData({
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
                !quickCreateLocationTypeData.display_name
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

export default LocationsPage;

"use client";

import React, { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Settings,
  Activity,
  MapPin,
  Wrench,
  UserPlus,
  RefreshCw,
  FileText,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  X,
  User,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAssets,
  useAssetStatistics,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useAssignAsset,
  useUpdateAssetAttributes,
  useUpdateAssetSensorData,
  useAssetsNeedingMaintenance,
} from "@/hooks/useAssets";
import { useLocations, useCreateLocation } from "@/hooks/useLocations";
import { useUsers } from "@/hooks/useUsers";
import { useRoles, useCreateRole } from "@/hooks/useRoles";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";
import MultiFileUpload from "@/components/MultiFileUpload";
import FileAttachmentList from "@/components/FileAttachmentList";

const AssetsPage = () => {
  // State management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false);
  const [isSensorDataModalOpen, setIsSensorDataModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [showMaintenanceNeeded, setShowMaintenanceNeeded] = useState(false);
  const [assignData, setAssignData] = useState({
    assigned_to_user_id: null,
    assigned_to_role_id: null,
    location_id: null,
  });
  const [assignToType, setAssignToType] = useState("user"); // "user" or "role"
  const [attributesData, setAttributesData] = useState("");
  const [sensorDataInput, setSensorDataInput] = useState("");
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    priority: 50,
  });
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

  // API hooks
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: statistics, isLoading: statisticsLoading } =
    useAssetStatistics();
  const { data: locations = [] } = useLocations();
  const { data: maintenanceNeeded = [] } = useAssetsNeedingMaintenance();
  const { data: usersResponse, isLoading: usersLoading } = useUsers();
  const { data: rolesData } = useRoles();
  const users = usersResponse?.users || [];
  const roles = rolesData?.roles || rolesData || [];
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const deleteAssetMutation = useDeleteAsset();
  const assignAssetMutation = useAssignAsset();
  const updateAttributesMutation = useUpdateAssetAttributes();
  const updateSensorDataMutation = useUpdateAssetSensorData();
  const createRoleMutation = useCreateRole();
  const createLocationMutation = useCreateLocation();

  const userList = useUsers();

  // Form data - matching API schema
  const [assetFormData, setAssetFormData] = useState({
    asset_number: "",
    name: "",
    description: "",
    asset_type: "",
    category: "",
    subcategory: "",
    status: "active",
    condition: "",
    location_id: null,
    assigned_to_user_id: null,
    assigned_to_role_id: null,
    department: "",
    purchase_date: "",
    purchase_price: 0,
    supplier: "",
    warranty_expiry: "",
    last_maintenance_date: "",
    next_maintenance_date: "",
    compliance_status: "",
    has_sensors: false,
    automation_enabled: false,
    is_active: true,
    display_name: "",
    is_operational: true,
    needs_maintenance: false,
    is_compliant: true,
  });

  // Compute statistics from API data
  const computedStats = React.useMemo(() => {
    if (statistics) {
      return {
        totalAssets:
          statistics.total_assets || statistics.total || assets.length || 0,
        activeAssets:
          statistics.active_assets ||
          statistics.active ||
          assets.filter((a) => a.status === "active" || a.isActive).length ||
          0,
        maintenanceNeeded:
          statistics.maintenance_needed ||
          statistics.maintenance ||
          maintenanceNeeded.length ||
          0,
        assignedAssets:
          statistics.assigned_assets ||
          statistics.assigned ||
          assets.filter((a) => a.assignedToUserId || a.assignedToRoleId)
            .length ||
          0,
        totalValue: statistics.total_value || statistics.value || 0,
        changePercentage: statistics.change_percentage || 0,
      };
    }
    // Fallback to computed from assets
    const active = assets.filter(
      (a) => a.status === "active" || a.isActive
    ).length;
    const assigned = assets.filter(
      (a) => a.assignedToUserId || a.assignedToRoleId
    ).length;
    return {
      totalAssets: assets.length,
      activeAssets: active,
      maintenanceNeeded: maintenanceNeeded.length,
      assignedAssets: assigned,
      totalValue: 0,
      changePercentage: 0,
    };
  }, [statistics, assets, maintenanceNeeded]);

  // Filter assets based on search and filters
  const filteredAssets = React.useMemo(() => {
    let filtered = assets;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (asset) =>
          (asset.assetNumber || asset.asset_number || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (asset.name || asset.assetName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (asset.category || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (asset.displayName || asset.display_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter(
        (asset) =>
          (asset.locationId || asset.location_id)?.toString() ===
          selectedLocation ||
          (asset.currentLocation || asset.current_location) === selectedLocation
      );
    }

    // Maintenance filter
    if (showMaintenanceNeeded) {
      filtered = filtered.filter(
        (asset) => asset.needsMaintenance || asset.needs_maintenance
      );
    }

    return filtered;
  }, [searchQuery, selectedLocation, showMaintenanceNeeded, assets]);

  // Handlers
  const handleCreateAsset = () => {
    // Reset form
    setAssetFormData({
      asset_number: "",
      name: "",
      description: "",
      asset_type: "",
      category: "",
      subcategory: "",
      status: "active",
      condition: "",
      location_id: null,
      assigned_to_user_id: null,
      assigned_to_role_id: null,
      department: "",
      purchase_date: "",
      purchase_price: 0,
      supplier: "",
      warranty_expiry: "",
      last_maintenance_date: "",
      next_maintenance_date: "",
      compliance_status: "",
      has_sensors: false,
      automation_enabled: false,
      is_active: true,
      display_name: "",
      is_operational: true,
      needs_maintenance: false,
      is_compliant: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    setAssetFormData({
      asset_number: asset.asset_number || asset.assetNumber || "",
      name: asset.name || asset.assetName || "",
      description: asset.description || "",
      asset_type: asset.asset_type || asset.assetType || "",
      category: asset.category || "",
      subcategory: asset.subcategory || "",
      status: asset.status || "active",
      condition: asset.condition || "",
      location_id: asset.location_id || asset.locationId || null,
      assigned_to_user_id:
        asset.assigned_to_user_id || asset.assignedToUserId || null,
      assigned_to_role_id:
        asset.assigned_to_role_id || asset.assignedToRoleId || null,
      department: asset.department || "",
      purchase_date: asset.purchase_date || asset.purchaseDate || "",
      purchase_price: asset.purchase_price || asset.purchasePrice || 0,
      supplier: asset.supplier || "",
      warranty_expiry: asset.warranty_expiry || asset.warrantyExpiry || "",
      last_maintenance_date:
        asset.last_maintenance_date || asset.lastMaintenanceDate || "",
      next_maintenance_date:
        asset.next_maintenance_date || asset.nextMaintenanceDate || "",
      compliance_status:
        asset.compliance_status || asset.complianceStatus || "",
      has_sensors:
        asset.has_sensors !== undefined
          ? asset.has_sensors
          : asset.hasSensors || false,
      automation_enabled:
        asset.automation_enabled !== undefined
          ? asset.automation_enabled
          : asset.automationEnabled || false,
      is_active:
        asset.is_active !== undefined
          ? asset.is_active
          : asset.isActive !== undefined
            ? asset.isActive
            : true,
      display_name: asset.display_name || asset.displayName || "",
      is_operational:
        asset.is_operational !== undefined
          ? asset.is_operational
          : asset.isOperational !== undefined
            ? asset.isOperational
            : true,
      needs_maintenance:
        asset.needs_maintenance !== undefined
          ? asset.needs_maintenance
          : asset.needsMaintenance !== undefined
            ? asset.needsMaintenance
            : false,
      is_compliant:
        asset.is_compliant !== undefined
          ? asset.is_compliant
          : asset.isCompliant !== undefined
            ? asset.isCompliant
            : true,
    });
    setIsEditModalOpen(true);
  };

  const handleViewAsset = (asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleAssignAsset = (asset) => {
    setSelectedAsset(asset);
    const existingUserId = asset.assigned_to_user_id || asset.assignedToUserId;
    const existingRoleId = asset.assigned_to_role_id || asset.assignedToRoleId;
    setAssignData({
      assigned_to_user_id: existingUserId || null,
      assigned_to_role_id: existingRoleId || null,
      location_id: asset.location_id || asset.locationId || null,
    });
    // Set assignToType based on existing assignment
    if (existingRoleId) {
      setAssignToType("role");
    } else {
      setAssignToType("user");
    }
    setIsAssignModalOpen(true);
  };

  const handleCreateRole = async () => {
    if (!roleFormData.displayName || !roleFormData.roleName) {
      return;
    }

    try {
      const result = await createRoleMutation.mutateAsync({
        display_name: roleFormData.displayName,
        name: roleFormData.roleName,
        description: roleFormData.description,
        priority: roleFormData.priority,
      });
      setIsCreateRoleModalOpen(false);
      setRoleFormData({
        displayName: "",
        roleName: "",
        description: "",
        priority: 50,
      });
      // Auto-select the newly created role
      if (result && result.id) {
        setAssignData({ ...assignData, assigned_to_role_id: result.id });
      }
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  const handleCreateLocation = async () => {
    if (!locationFormData.name || !locationFormData.location_type || !locationFormData.address) {
      return;
    }

    try {
      const result = await createLocationMutation.mutateAsync(locationFormData);
      setIsCreateLocationModalOpen(false);
      setLocationFormData({
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
      // Auto-select the newly created location
      if (result && result.id) {
        setAssignData({ ...assignData, location_id: result.id });
      }
    } catch (error) {
      console.error("Failed to create location:", error);
    }
  };

  const handleUpdateAttributes = (asset) => {
    setSelectedAsset(asset);
    setAttributesData(JSON.stringify(asset.attributes || {}, null, 2));
    setIsAttributesModalOpen(true);
  };

  const handleUpdateSensorData = (asset) => {
    setSelectedAsset(asset);
    setSensorDataInput(
      JSON.stringify(asset.sensor_data || asset.sensorData || {}, null, 2)
    );
    setIsSensorDataModalOpen(true);
  };

  const handleDeleteAsset = (asset) => {
    setSelectedAsset(asset);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = () => {
    if (
      !assetFormData.asset_number ||
      !assetFormData.name ||
      !assetFormData.asset_type ||
      assetFormData.asset_type.trim().length === 0
    ) {
      toast.error("Please fill in all required fields", {
        description: "Asset number, name, and asset type are required.",
      });
      return;
    }

    createAssetMutation.mutate(assetFormData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setAssetFormData({
          asset_number: "",
          name: "",
          description: "",
          asset_type: "",
          category: "",
          subcategory: "",
          status: "active",
          condition: "",
          location_id: null,
          assigned_to_user_id: null,
          assigned_to_role_id: null,
          department: "",
          purchase_date: "",
          purchase_price: 0,
          supplier: "",
          warranty_expiry: "",
          last_maintenance_date: "",
          next_maintenance_date: "",
          compliance_status: "",
          has_sensors: false,
          automation_enabled: false,
          is_active: true,
          display_name: "",
          is_operational: true,
          needs_maintenance: false,
          is_compliant: true,
        });
      },
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedAsset) return;

    if (
      !assetFormData.asset_number ||
      !assetFormData.name ||
      !assetFormData.asset_type ||
      assetFormData.asset_type.trim().length === 0
    ) {
      toast.error("Please fill in all required fields", {
        description: "Asset number, name, and asset type are required.",
      });
      return;
    }

    updateAssetMutation.mutate(
      {
        id: selectedAsset.id,
        assetData: assetFormData,
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedAsset(null);
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!selectedAsset) return;

    deleteAssetMutation.mutate(selectedAsset.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedAsset(null);
      },
    });
  };

  const handleAssign = () => {
    if (!selectedAsset) return;

    // Validate that either user or role is selected
    if (!assignData.assigned_to_user_id && !assignData.assigned_to_role_id) {
      toast.error("Please select either a user or role to assign the asset to");
      return;
    }

    assignAssetMutation.mutate(
      {
        id: selectedAsset.id,
        assignData: assignData,
      },
      {
        onSuccess: () => {
          setIsAssignModalOpen(false);
          setSelectedAsset(null);
          setAssignData({
            assigned_to_user_id: null,
            assigned_to_role_id: null,
            location_id: null,
          });
          setAssignToType("user");
        },
      }
    );
  };

  const handleUpdateAttributesSubmit = () => {
    if (!selectedAsset) return;

    try {
      const attributes = JSON.parse(attributesData);
      updateAttributesMutation.mutate(
        {
          id: selectedAsset.id,
          attributes: attributes,
        },
        {
          onSuccess: () => {
            setIsAttributesModalOpen(false);
            setSelectedAsset(null);
            setAttributesData("");
          },
        }
      );
    } catch (error) {
      toast.error("Invalid JSON format", {
        description: "Please enter valid JSON for attributes.",
      });
    }
  };

  const handleUpdateSensorDataSubmit = () => {
    if (!selectedAsset) return;

    try {
      const sensorData = JSON.parse(sensorDataInput);
      updateSensorDataMutation.mutate(
        {
          id: selectedAsset.id,
          sensorData: sensorData,
        },
        {
          onSuccess: () => {
            setIsSensorDataModalOpen(false);
            setSelectedAsset(null);
            setSensorDataInput("");
          },
        }
      );
    } catch (error) {
      toast.error("Invalid JSON format", {
        description: "Please enter valid JSON for sensor data.",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="border-green-500/50 text-green-700 bg-green-500/10"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="outline"
            className="border-red-500/50 text-red-700 bg-red-500/10"
          >
            Inactive
          </Badge>
        );
      case "maintenance":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500/50 text-yellow-700 bg-yellow-500/10"
          >
            <Wrench className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date to show only date part (no time)
  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Handle ISO datetime strings (e.g., "2025-11-03T08:22:40.368Z")
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If it's not a valid date, try to extract date part from string
        if (dateString.includes("T")) {
          return dateString.split("T")[0];
        }
        return dateString;
      }
      // Format as YYYY-MM-DD
      return date.toISOString().split("T")[0];
    } catch (error) {
      // If it's already in YYYY-MM-DD format, return as is
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Assets Management
          </h1>
          <Button onClick={handleCreateAsset}>
            <Plus className="mr-2 h-4 w-4" />
            Create Asset
          </Button>
        </div>
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset number, name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                computedStats.totalAssets
              )}
            </div>
            {!statisticsLoading && computedStats.changePercentage > 0 && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">
                  {computedStats.changePercentage}%
                </span>
                <span>from last month</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Assets
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                computedStats.activeAssets
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance Needed
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statisticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                computedStats.maintenanceNeeded
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned Assets
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statisticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                computedStats.assignedAssets
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="w-[200px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name || location.locationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="maintenance-filter"
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  id="maintenance-filter"
                  type="checkbox"
                  checked={showMaintenanceNeeded}
                  onChange={(e) => setShowMaintenanceNeeded(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Maintenance Needed</span>
              </Label>
            </div>
            {(searchQuery ||
              selectedLocation !== "all" ||
              showMaintenanceNeeded) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLocation("all");
                    setShowMaintenanceNeeded(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assets List</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredAssets.length}{" "}
                {filteredAssets.length === 1 ? "asset" : "assets"}
              </span>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assetsLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Maintenance</TableHead>
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
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery ||
                  selectedLocation !== "all" ||
                  showMaintenanceNeeded
                  ? "Try adjusting your filters to see more results."
                  : "Get started by creating your first asset."}
              </p>
              {!searchQuery &&
                selectedLocation === "all" &&
                !showMaintenanceNeeded && (
                  <Button onClick={handleCreateAsset}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Asset
                  </Button>
                )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const locationName =
                      locations.find(
                        (l) => l.id === (asset.locationId || asset.location_id)
                      )?.name ||
                      asset.currentLocation ||
                      asset.current_location ||
                      "N/A";
                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          {asset.assetNumber || asset.asset_number}
                        </TableCell>
                        <TableCell>{asset.name || asset.assetName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {asset.category || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {locationName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {asset.assignedToUserId || asset.assignedToRoleId ? (
                            <div className="flex items-center gap-1">
                              <UserPlus className="h-3 w-3 text-muted-foreground" />
                              {asset.assignedTo || "Assigned"}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {asset.needsMaintenance || asset.needs_maintenance ? (
                            <Badge
                              variant="outline"
                              className="border-yellow-500/50 text-yellow-700 bg-yellow-500/10"
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              Needed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-green-500/50 text-green-700 bg-green-500/10"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
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
                                onClick={() => handleViewAsset(asset)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditAsset(asset)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Asset
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleAssignAsset(asset)}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Asset
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateAttributes(asset)}
                              >
                                <Settings className="mr-2 h-4 w-4" />
                                Update Attributes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateSensorData(asset)}
                              >
                                <Activity className="mr-2 h-4 w-4" />
                                Update Sensor Data
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteAsset(asset)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Asset
                              </DropdownMenuItem>
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
        </CardContent>
      </Card>

      {/* Create Asset Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to the system. Fill in the required information
              below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset-number">Asset Number *</Label>
                <Input
                  id="asset-number"
                  value={assetFormData.asset_number}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      asset_number: e.target.value,
                    })
                  }
                  placeholder="AST-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input
                  id="asset-name"
                  value={assetFormData.name}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Laptop Dell XPS 15"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={assetFormData.description}
                onChange={(e) =>
                  setAssetFormData({
                    ...assetFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Asset description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset-type">Asset Type *</Label>
                <Select
                  value={assetFormData.asset_type}
                  onValueChange={(value) =>
                    setAssetFormData({
                      ...assetFormData,
                      asset_type: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical_device">
                      Medical Device
                    </SelectItem>
                    <SelectItem value="fridge">Fridge</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={assetFormData.category}
                  onValueChange={(value) =>
                    setAssetFormData({ ...assetFormData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={assetFormData.status}
                  onValueChange={(value) =>
                    setAssetFormData({ ...assetFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={assetFormData.location_id?.toString() || ""}
                  onValueChange={(value) =>
                    setAssetFormData({
                      ...assetFormData,
                      location_id: value ? parseInt(value) : null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem
                        key={location.id}
                        value={location.id.toString()}
                      >
                        {location.name || location.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  value={assetFormData.purchase_date}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchase_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-price">Purchase Price</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  value={assetFormData.purchase_price}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchase_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty-expiry">Warranty Expiry</Label>
                <Input
                  id="warranty-expiry"
                  type="date"
                  value={assetFormData.warranty_expiry}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      warranty_expiry: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={createAssetMutation.isPending}
            >
              {createAssetMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Asset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update asset information. Make your changes below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-asset-number">Asset Number *</Label>
                <Input
                  id="edit-asset-number"
                  value={assetFormData.asset_number}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      asset_number: e.target.value,
                    })
                  }
                  placeholder="AST-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-asset-name">Asset Name *</Label>
                <Input
                  id="edit-asset-name"
                  value={assetFormData.name}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Laptop Dell XPS 15"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={assetFormData.description}
                onChange={(e) =>
                  setAssetFormData({
                    ...assetFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Asset description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-asset-type">Asset Type *</Label>
                <Select
                  value={assetFormData.asset_type}
                  onValueChange={(value) =>
                    setAssetFormData({
                      ...assetFormData,
                      asset_type: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical_device">
                      Medical Device
                    </SelectItem>
                    <SelectItem value="fridge">Fridge</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={assetFormData.category}
                  onValueChange={(value) =>
                    setAssetFormData({ ...assetFormData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={assetFormData.status}
                  onValueChange={(value) =>
                    setAssetFormData({ ...assetFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Select
                  value={assetFormData.location_id?.toString() || ""}
                  onValueChange={(value) =>
                    setAssetFormData({
                      ...assetFormData,
                      location_id: value ? parseInt(value) : null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem
                        key={location.id}
                        value={location.id.toString()}
                      >
                        {location.name || location.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purchase-date">Purchase Date</Label>
                <Input
                  id="edit-purchase-date"
                  type="date"
                  value={assetFormData.purchase_date}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchase_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchase-price">Purchase Price</Label>
                <Input
                  id="edit-purchase-price"
                  type="number"
                  value={assetFormData.purchase_price}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchase_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-warranty-expiry">Warranty Expiry</Label>
                <Input
                  id="edit-warranty-expiry"
                  type="date"
                  value={assetFormData.warranty_expiry}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      warranty_expiry: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateAssetMutation.isPending}
            >
              {updateAssetMutation.isPending ? (
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

      {/* Asset Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the selected asset.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Asset Number</Label>
                  <p className="font-medium mt-1">
                    {selectedAsset.assetNumber || selectedAsset.asset_number}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Asset Name</Label>
                  <p className="font-medium mt-1">
                    {selectedAsset.name || selectedAsset.assetName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <Badge variant="secondary" className="mt-1">
                    {selectedAsset.category || "N/A"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedAsset.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {locations.find(
                      (l) =>
                        l.id ===
                        (selectedAsset.locationId || selectedAsset.location_id)
                    )?.name ||
                      selectedAsset.currentLocation ||
                      selectedAsset.current_location ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assigned To</Label>
                  <p className="font-medium mt-1">
                    {selectedAsset.assignedTo ||
                      (selectedAsset.assignedToUserId ||
                        selectedAsset.assignedToRoleId
                        ? "Assigned"
                        : "Unassigned")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Purchase Date</Label>
                  <p className="font-medium mt-1">
                    {formatDateOnly(
                      selectedAsset.purchaseDate || selectedAsset.purchase_date
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Purchase Price
                  </Label>
                  <p className="font-medium mt-1">
                    £
                    {(
                      selectedAsset.purchasePrice ||
                      selectedAsset.purchase_price ||
                      0
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Warranty Expiry
                  </Label>
                  <p className="font-medium mt-1">
                    {formatDateOnly(
                      selectedAsset.warrantyExpiry ||
                      selectedAsset.warranty_expiry
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Last Maintenance
                  </Label>
                  <p className="font-medium mt-1">
                    {formatDateOnly(
                      selectedAsset.lastMaintenanceDate ||
                      selectedAsset.last_maintenance_date
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Next Maintenance
                  </Label>
                  <p className="font-medium mt-1">
                    {formatDateOnly(
                      selectedAsset.nextMaintenanceDate ||
                      selectedAsset.next_maintenance_date
                    )}
                  </p>
                </div>
              </div>

              {/* File Attachments */}
              <div className="pt-6 border-t space-y-4">
                <FileAttachmentList
                  entityType="asset"
                  entityId={selectedAsset.id}
                  showTitle={true}
                />
                <MultiFileUpload
                  entityType="asset"
                  entityId={selectedAsset.id}
                  maxFiles={10}
                  maxSizeMB={10}
                  onUploadComplete={() => {
                    // Files will be refreshed automatically via query invalidation
                  }}
                />
              </div>

              {/* Activity History */}
              <div className="pt-6 border-t">
                <ResourceAuditLogs
                  resource="asset"
                  resourceId={selectedAsset.id?.toString()}
                  title="Activity History"
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
                handleEditAsset(selectedAsset);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Asset Dialog */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Assign this asset to a user or location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Assign To (User or Role) *</Label>
              <Tabs value={assignToType} onValueChange={setAssignToType} className="w-full">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-2">
                    <TabsTrigger value="user" className="whitespace-nowrap">
                      <User className="mr-2 h-4 w-4" />
                      User
                    </TabsTrigger>
                    <TabsTrigger value="role" className="whitespace-nowrap">
                      <Shield className="mr-2 h-4 w-4" />
                      Role
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="user" className="mt-3">
                  <Select
                    value={assignData.assigned_to_user_id?.toString() || undefined}
                    onValueChange={(value) => {
                      setAssignData({
                        ...assignData,
                        assigned_to_user_id: value ? parseInt(value) : null,
                        assigned_to_role_id: null, // Clear role when user is selected
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading users...
                        </SelectItem>
                      ) : users.length === 0 ? (
                        <SelectItem value="no-users" disabled>
                          No users available
                        </SelectItem>
                      ) : (
                        users.map((user) => {
                          const fullName =
                            [user.first_name, user.last_name]
                              .filter(Boolean)
                              .join(" ") ||
                            user.username ||
                            user.email ||
                            "User";
                          return (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {fullName} {user.email && `(${user.email})`}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="role" className="mt-3">
                  <Select
                    value={assignData.assigned_to_role_id?.toString() || undefined}
                    onValueChange={(value) => {
                      setAssignData({
                        ...assignData,
                        assigned_to_role_id: value ? parseInt(value) : null,
                        assigned_to_user_id: null, // Clear user when role is selected
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.length === 0 ? (
                        <SelectItem value="no-roles" disabled>
                          No roles available
                        </SelectItem>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.display_name || role.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateRoleModalOpen(true)}
                    title="Create new role"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-location">Location</Label>
              <div className="flex gap-2">
                <Select
                  value={assignData.location_id?.toString() || "__none__"}
                  onValueChange={(value) => {
                    setAssignData({
                      ...assignData,
                      location_id: value === "__none__" ? null : parseInt(value),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No location</SelectItem>
                    {locations.map((location) => (
                      <SelectItem
                        key={location.id}
                        value={location.id.toString()}
                      >
                        {location.name || location.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreateLocationModalOpen(true)}
                  title="Create new location"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignAssetMutation.isPending}
            >
              {assignAssetMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Attributes Dialog */}
      <Dialog
        open={isAttributesModalOpen}
        onOpenChange={setIsAttributesModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Asset Attributes</DialogTitle>
            <DialogDescription>
              Modify custom attributes for this asset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="attributes">Attributes (JSON)</Label>
              <Textarea
                id="attributes"
                value={attributesData}
                onChange={(e) => setAttributesData(e.target.value)}
                placeholder='{"key": "value"}'
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAttributesModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAttributesSubmit}
              disabled={updateAttributesMutation.isPending}
            >
              {updateAttributesMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Attributes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Sensor Data Dialog */}
      <Dialog
        open={isSensorDataModalOpen}
        onOpenChange={setIsSensorDataModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Sensor Data</DialogTitle>
            <DialogDescription>
              Update sensor data for this asset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sensor-data">Sensor Data (JSON)</Label>
              <Textarea
                id="sensor-data"
                value={sensorDataInput}
                onChange={(e) => setSensorDataInput(e.target.value)}
                placeholder='{"temperature": 25, "humidity": 50}'
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSensorDataModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSensorDataSubmit}
              disabled={updateSensorDataMutation.isPending}
            >
              {updateSensorDataMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Sensor Data"
              )}
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
              asset
              {selectedAsset &&
                ` "${selectedAsset.name || selectedAsset.assetName}"`}{" "}
              from the system.
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

      {/* Create Role Modal */}
      <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-display-name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-display-name"
                placeholder="e.g., Senior Doctor"
                value={roleFormData.displayName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    displayName: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-name"
                placeholder="e.g., senior_doctor"
                value={roleFormData.roleName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    roleName: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores only. Cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe this role's purpose and responsibilities"
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    description: e.target.value,
                  })
                }
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-priority">Priority</Label>
              <Input
                id="role-priority"
                type="number"
                value={roleFormData.priority}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    priority: parseInt(e.target.value) || 50,
                  })
                }
                min="1"
                max="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRoleModalOpen(false);
                setRoleFormData({
                  displayName: "",
                  roleName: "",
                  description: "",
                  priority: 50,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={
                createRoleMutation.isPending ||
                !roleFormData.displayName ||
                !roleFormData.roleName
              }
            >
              {createRoleMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Location Modal */}
      <Dialog open={isCreateLocationModalOpen} onOpenChange={setIsCreateLocationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Location</DialogTitle>
            <DialogDescription>
              Add a new location to the system. Fill in all required information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
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
            <div>
              <Label htmlFor="location-description">Description</Label>
              <Textarea
                id="location-description"
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
              <div>
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
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="zone">Zone</SelectItem>
                    <SelectItem value="floor">Floor</SelectItem>
                    <SelectItem value="wing">Wing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
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
                    {locations.map((location) => (
                      <SelectItem
                        key={location.id}
                        value={location.id.toString()}
                      >
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="location-address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location-address"
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
            <div>
              <Label htmlFor="location-coordinates">Coordinates</Label>
              <Input
                id="location-coordinates"
                value={locationFormData.coordinates}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    coordinates: e.target.value,
                  })
                }
                placeholder="40.7128,-74.0060 or GeoJSON format"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: GPS coordinates or GeoJSON format
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-capacity">Capacity</Label>
                <Input
                  id="location-capacity"
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
              <div>
                <Label htmlFor="location-area">Area (sqm)</Label>
                <Input
                  id="location-area"
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
            <div>
              <Label htmlFor="location-status">
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="location-is-accessible"
                checked={locationFormData.is_accessible}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    is_accessible: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="location-is-accessible" className="cursor-pointer">
                Is Accessible
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="location-requires-access-control"
                checked={locationFormData.requires_access_control}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    requires_access_control: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="location-requires-access-control" className="cursor-pointer">
                Requires Access Control
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="location-is-active"
                checked={locationFormData.is_active}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    is_active: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="location-is-active" className="cursor-pointer">
                Is Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateLocationModalOpen(false);
                setLocationFormData({
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
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLocation}
              disabled={
                createLocationMutation.isPending ||
                !locationFormData.name ||
                !locationFormData.location_type ||
                !locationFormData.address
              }
            >
              {createLocationMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsPage;

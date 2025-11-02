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
} from "lucide-react";
import { toast } from "sonner";

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

  // Form data
  const [assetFormData, setAssetFormData] = useState({
    assetNumber: "",
    assetName: "",
    description: "",
    category: "",
    locationId: "",
    status: "active",
    purchaseDate: "",
    purchasePrice: "",
    warrantyExpiry: "",
    notes: "",
  });

  // Mock data for demonstration (will be replaced with API later)
  const mockStats = {
    totalAssets: 150,
    activeAssets: 120,
    maintenanceNeeded: 15,
    assignedAssets: 95,
    totalValue: 1250000,
    changePercentage: 5.2,
  };

  const mockAssets = [
    {
      id: 1,
      assetNumber: "AST-001",
      assetName: "Laptop Dell XPS 15",
      category: "Electronics",
      status: "active",
      location: "Office A",
      assignedTo: "John Doe",
      purchaseDate: "2024-01-15",
      purchasePrice: 1500,
      lastMaintenance: "2024-10-01",
      nextMaintenance: "2025-01-01",
      needsMaintenance: false,
    },
    {
      id: 2,
      assetNumber: "AST-002",
      assetName: "Office Chair Ergonomic",
      category: "Furniture",
      status: "active",
      location: "Office B",
      assignedTo: "Jane Smith",
      purchaseDate: "2024-02-20",
      purchasePrice: 350,
      lastMaintenance: "2024-09-15",
      nextMaintenance: "2024-12-15",
      needsMaintenance: true,
    },
    {
      id: 3,
      assetNumber: "AST-003",
      assetName: "Projector Epson",
      category: "Electronics",
      status: "active",
      location: "Conference Room",
      assignedTo: null,
      purchaseDate: "2023-11-10",
      purchasePrice: 800,
      lastMaintenance: "2024-08-20",
      nextMaintenance: "2024-11-20",
      needsMaintenance: true,
    },
    {
      id: 4,
      assetNumber: "AST-004",
      assetName: "Printer HP LaserJet",
      category: "Electronics",
      status: "inactive",
      location: "Storage",
      assignedTo: null,
      purchaseDate: "2023-05-05",
      purchasePrice: 450,
      lastMaintenance: "2024-03-10",
      nextMaintenance: null,
      needsMaintenance: false,
    },
  ];

  const mockLocations = [
    "All",
    "Office A",
    "Office B",
    "Conference Room",
    "Storage",
  ];

  // Filter assets based on search and filters
  const filteredAssets = React.useMemo(() => {
    let filtered = mockAssets;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (asset) =>
          asset.assetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter(
        (asset) => asset.location === selectedLocation
      );
    }

    // Maintenance filter
    if (showMaintenanceNeeded) {
      filtered = filtered.filter((asset) => asset.needsMaintenance);
    }

    return filtered;
  }, [searchQuery, selectedLocation, showMaintenanceNeeded]);

  // Handlers
  const handleCreateAsset = () => {
    // Reset form
    setAssetFormData({
      assetNumber: "",
      assetName: "",
      description: "",
      category: "",
      locationId: "",
      status: "active",
      purchaseDate: "",
      purchasePrice: "",
      warrantyExpiry: "",
      notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    setAssetFormData({
      assetNumber: asset.assetNumber,
      assetName: asset.assetName,
      description: asset.description || "",
      category: asset.category,
      locationId: asset.location,
      status: asset.status,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice?.toString() || "",
      warrantyExpiry: asset.warrantyExpiry || "",
      notes: asset.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleViewAsset = (asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleAssignAsset = (asset) => {
    setSelectedAsset(asset);
    setIsAssignModalOpen(true);
  };

  const handleUpdateAttributes = (asset) => {
    setSelectedAsset(asset);
    setIsAttributesModalOpen(true);
  };

  const handleUpdateSensorData = (asset) => {
    setSelectedAsset(asset);
    setIsSensorDataModalOpen(true);
  };

  const handleDeleteAsset = (asset) => {
    setSelectedAsset(asset);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = () => {
    // TODO: Implement API call
    toast.success("Asset created successfully!");
    setIsCreateModalOpen(false);
  };

  const handleSubmitEdit = () => {
    // TODO: Implement API call
    toast.success("Asset updated successfully!");
    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    // TODO: Implement API call
    toast.success("Asset deleted successfully!");
    setIsDeleteDialogOpen(false);
    setSelectedAsset(null);
  };

  const handleAssign = () => {
    // TODO: Implement API call
    toast.success("Asset assigned successfully!");
    setIsAssignModalOpen(false);
  };

  const handleUpdateAttributesSubmit = () => {
    // TODO: Implement API call
    toast.success("Asset attributes updated successfully!");
    setIsAttributesModalOpen(false);
  };

  const handleUpdateSensorDataSubmit = () => {
    // TODO: Implement API call
    toast.success("Sensor data updated successfully!");
    setIsSensorDataModalOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assets Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track all organizational assets efficiently.
          </p>
        </div>
        <Button onClick={handleCreateAsset}>
          <Plus className="mr-2 h-4 w-4" />
          Create Asset
        </Button>
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
            <div className="text-2xl font-bold">{mockStats.totalAssets}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">
                {mockStats.changePercentage}%
              </span>
              <span>from last month</span>
            </div>
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
            <div className="text-2xl font-bold">{mockStats.activeAssets}</div>
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
              {mockStats.maintenanceNeeded}
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
            <div className="text-2xl font-bold">{mockStats.assignedAssets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently assigned
            </p>
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
                  placeholder="Search by asset number, name, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="w-[200px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {mockLocations.map((location) => (
                  <SelectItem
                    key={location}
                    value={location === "All" ? "all" : location}
                  >
                    {location}
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
          {filteredAssets.length === 0 ? (
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
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.assetNumber}
                      </TableCell>
                      <TableCell>{asset.assetName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{asset.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {asset.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        {asset.assignedTo ? (
                          <div className="flex items-center gap-1">
                            <UserPlus className="h-3 w-3 text-muted-foreground" />
                            {asset.assignedTo}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.needsMaintenance ? (
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
                  ))}
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
                  value={assetFormData.assetNumber}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      assetNumber: e.target.value,
                    })
                  }
                  placeholder="AST-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input
                  id="asset-name"
                  value={assetFormData.assetName}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      assetName: e.target.value,
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
                  value={assetFormData.locationId}
                  onValueChange={(value) =>
                    setAssetFormData({ ...assetFormData, locationId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations
                      .filter((l) => l !== "All")
                      .map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
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
                  value={assetFormData.purchaseDate}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchaseDate: e.target.value,
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
                  value={assetFormData.purchasePrice}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchasePrice: e.target.value,
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
                  value={assetFormData.warrantyExpiry}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      warrantyExpiry: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={assetFormData.notes}
                onChange={(e) =>
                  setAssetFormData({ ...assetFormData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitCreate}>Create Asset</Button>
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
                  value={assetFormData.assetNumber}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      assetNumber: e.target.value,
                    })
                  }
                  placeholder="AST-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-asset-name">Asset Name *</Label>
                <Input
                  id="edit-asset-name"
                  value={assetFormData.assetName}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      assetName: e.target.value,
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
                  value={assetFormData.locationId}
                  onValueChange={(value) =>
                    setAssetFormData({ ...assetFormData, locationId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations
                      .filter((l) => l !== "All")
                      .map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
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
                  value={assetFormData.purchaseDate}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchaseDate: e.target.value,
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
                  value={assetFormData.purchasePrice}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      purchasePrice: e.target.value,
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
                  value={assetFormData.warrantyExpiry}
                  onChange={(e) =>
                    setAssetFormData({
                      ...assetFormData,
                      warrantyExpiry: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={assetFormData.notes}
                onChange={(e) =>
                  setAssetFormData({ ...assetFormData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit}>Save Changes</Button>
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
                    {selectedAsset.assetNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Asset Name</Label>
                  <p className="font-medium mt-1">{selectedAsset.assetName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <Badge variant="secondary" className="mt-1">
                    {selectedAsset.category}
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
                    {selectedAsset.location}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assigned To</Label>
                  <p className="font-medium mt-1">
                    {selectedAsset.assignedTo || "Unassigned"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Purchase Date</Label>
                  <p className="font-medium mt-1">
                    {selectedAsset.purchaseDate}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Purchase Price
                  </Label>
                  <p className="font-medium mt-1">
                    ${selectedAsset.purchasePrice?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Last Maintenance
                  </Label>
                  <p className="font-medium mt-1">
                    {selectedAsset.lastMaintenance || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Next Maintenance
                  </Label>
                  <p className="font-medium mt-1">
                    {selectedAsset.nextMaintenance || "N/A"}
                  </p>
                </div>
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
            <div className="space-y-2">
              <Label htmlFor="assign-to">Assign To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select user or location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">John Doe</SelectItem>
                  <SelectItem value="user2">Jane Smith</SelectItem>
                  <SelectItem value="location1">Office A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign}>Assign</Button>
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
            <Button onClick={handleUpdateAttributesSubmit}>
              Update Attributes
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
            <Button onClick={handleUpdateSensorDataSubmit}>
              Update Sensor Data
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
              {selectedAsset && ` "${selectedAsset.assetName}"`} from the
              system.
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
    </div>
  );
};

export default AssetsPage;

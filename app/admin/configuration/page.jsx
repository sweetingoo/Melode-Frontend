"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useSettings,
  useConfigurationCategories,
  useCategoryGroups,
  useCreateSetting,
  useUpdateSetting,
  useBulkUpdateSettings,
  useDeleteSetting,
  useOrganisation,
  useUpdateOrganisation,
  useDefaultRolePermissions,
  useUpdateDefaultRolePermissions,
} from "@/hooks/useConfiguration";
import { usePermissions } from "@/hooks/usePermissions";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { permissionsService } from "@/services/permissions";
import {
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  Building2,
  AlertCircle,
  Shield,
  Key,
  CheckSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ConfigurationPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [bulkUpdates, setBulkUpdates] = useState({});

  // Check if user is superuser or has configuration permissions
  const { data: currentUser } = useCurrentUser();
  const { isSuperuser, hasPermission } = usePermissionsCheck();
  const hasConfigurationPermission = hasPermission("configuration:read") ||
    hasPermission("configuration:*") ||
    hasPermission("configuration:write") ||
    hasPermission("configuration:update");

  // Allow access if superuser or has configuration permission
  const canAccessConfiguration = isSuperuser || hasConfigurationPermission;

  // Get categories
  const { data: categoriesData } = useConfigurationCategories();

  // Get groups for selected category
  const { data: groupsData } = useCategoryGroups(selectedCategory, {
    enabled: !!selectedCategory,
  });

  // Get settings with filters
  const settingsParams = {};
  if (selectedCategory) settingsParams.category = selectedCategory;
  if (selectedGroup) settingsParams.group = selectedGroup;
  if (searchTerm) settingsParams.search = searchTerm;

  const { data: settingsData, isLoading } = useSettings(settingsParams);
  // Ensure settings is always an array
  const settings = useMemo(() => {
    if (!settingsData) return [];
    // Handle paginated response with settings array (new format)
    if (Array.isArray(settingsData.settings)) {
      return settingsData.settings;
    }
    // Handle paginated response with items array (legacy format)
    if (Array.isArray(settingsData.items)) {
      return settingsData.items;
    }
    // Handle direct array response
    if (Array.isArray(settingsData)) {
      return settingsData;
    }
    // Fallback: return empty array if not an array
    return [];
  }, [settingsData]);

  // Get organisation data
  const { data: organisationResponse, isLoading: organisationLoading } = useOrganisation();

  // Mutations
  const createSettingMutation = useCreateSetting();
  const updateSettingMutation = useUpdateSetting();
  const bulkUpdateMutation = useBulkUpdateSettings();
  const deleteSettingMutation = useDeleteSetting();
  const updateOrganisationMutation = useUpdateOrganisation();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    setting_key: "",
    setting_category: "",
    setting_group: "",
    value_type: "string",
    value: "",
    display_name: "",
    description: "",
    is_active: true,
  });

  // Organisation form state - initialize from API response if available
  const [organisationData, setOrganisationData] = useState({
    organisation_name: "",
    organisation_code: "",
    description: "",
    is_active: true,
  });

  // Load organisation data when it's fetched from API
  useEffect(() => {
    if (organisationResponse) {
      setOrganisationData({
        organisation_name: organisationResponse.organisation_name || "",
        organisation_code: organisationResponse.organisation_code || "",
        description: organisationResponse.description || "",
        is_active: organisationResponse.is_active !== false,
      });
    }
  }, [organisationResponse]);

  // Group settings by group
  const groupedSettings = useMemo(() => {
    const groups = {};
    settings.forEach((setting) => {
      const group = setting.setting_group || "other";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(setting);
    });
    return groups;
  }, [settings]);

  // Helper function to extract value from nested structure
  // Handles both { value: actualValue } and direct value formats
  const extractValue = (value) => {
    if (value === null || value === undefined) return value;
    // Handle nested value structure: { value: actualValue }
    if (typeof value === 'object' && 'value' in value && !Array.isArray(value)) {
      return value.value;
    }
    return value;
  };

  // Handle bulk update value change
  const handleBulkValueChange = (settingKey, value) => {
    setBulkUpdates((prev) => ({
      ...prev,
      [settingKey]: value,
    }));
  };

  // Handle save bulk updates
  const handleSaveBulkUpdates = async () => {
    const updates = Object.entries(bulkUpdates).map(([setting_key, value]) => ({
      setting_key,
      value,
    }));

    if (updates.length === 0) {
      toast.error("No changes to save");
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({ settings: updates });
      setBulkUpdates({});
      setIsBulkEditMode(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle create setting
  const handleCreateSetting = async () => {
    if (!formData.setting_key || !formData.setting_category) {
      toast.error("Setting key and category are required");
      return;
    }

    try {
      await createSettingMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        setting_key: "",
        setting_category: "",
        setting_group: "",
        value_type: "string",
        value: "",
        display_name: "",
        description: "",
        is_active: true,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle edit setting
  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    // Extract value from nested structure if needed
    const settingValue = extractValue(setting.value);
    setFormData({
      setting_key: setting.setting_key,
      setting_category: setting.setting_category,
      setting_group: setting.setting_group || "",
      value_type: setting.value_type,
      value: settingValue?.toString() || "",
      display_name: setting.display_name || "",
      description: setting.description || "",
      is_active: setting.is_active !== false,
    });
    setIsEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingSetting) return;

    try {
      await updateSettingMutation.mutateAsync({
        settingKey: editingSetting.setting_key,
        settingData: {
          value: formData.value,
          display_name: formData.display_name,
          description: formData.description,
          is_active: formData.is_active,
        },
      });
      setIsEditDialogOpen(false);
      setEditingSetting(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle delete setting
  const handleDeleteSetting = async (settingKey) => {
    if (!confirm(`Are you sure you want to delete the setting "${settingKey}"?`)) {
      return;
    }

    try {
      await deleteSettingMutation.mutateAsync(settingKey);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Format value for display (user-readable)
  const formatValueForDisplay = (setting) => {
    const value = extractValue(setting.value);

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not set</span>;
    }

    switch (setting.value_type) {
      case "boolean":
        return (
          <Badge variant={value === true || value === "true" || value === "1" ? "default" : "secondary"}>
            {value === true || value === "true" || value === "1" ? "Enabled" : "Disabled"}
          </Badge>
        );
      case "integer":
      case "float":
        return <span className="font-mono">{value}</span>;
      default:
        return <span>{String(value)}</span>;
    }
  };

  // Render setting value input based on type
  const renderSettingValueInput = (setting, isBulk = false) => {
    const rawValue = isBulk
      ? bulkUpdates[setting.setting_key] !== undefined
        ? bulkUpdates[setting.setting_key]
        : setting.value
      : formData.value;

    // Extract value from nested structure if needed
    const value = extractValue(rawValue);

    const onChange = (newValue) => {
      if (isBulk) {
        handleBulkValueChange(setting.setting_key, newValue);
      } else {
        setFormData((prev) => ({ ...prev, value: newValue }));
      }
    };

    switch (setting.value_type || formData.value_type) {
      case "boolean":
        return (
          <Switch
            checked={value === true || value === "true" || value === "1"}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={!isBulk && !isEditDialogOpen}
          />
        );
      case "integer":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            disabled={!isBulk && !isEditDialogOpen}
            className="w-32"
          />
        );
      case "float":
        return (
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            disabled={!isBulk && !isEditDialogOpen}
            className="w-32"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={!isBulk && !isEditDialogOpen}
            className="w-64"
          />
        );
    }
  };

  if (!canAccessConfiguration) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configuration management is only available to Superusers or users with configuration permissions.
              Superuser privileges or configuration:read permission is required to manage configuration settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = categoriesData || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuration Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage system settings and organisation configuration
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkEditMode(!isBulkEditMode)}
            className="w-full sm:w-auto"
          >
            {isBulkEditMode ? "Cancel Bulk Edit" : "Bulk Edit"}
          </Button>
          {isBulkEditMode && (
            <Button onClick={handleSaveBulkUpdates} disabled={bulkUpdateMutation.isPending} className="w-full sm:w-auto">
              {bulkUpdateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Changes
                </>
              )}
            </Button>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Setting
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="organisation">Organisation</TabsTrigger>
          <TabsTrigger value="role-defaults">Role Defaults</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory || "all"} onValueChange={(value) => {
                    setSelectedCategory(value === "all" ? "" : value);
                    setSelectedGroup("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category} ({cat.count || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select
                    value={selectedGroup || "all"}
                    onValueChange={(value) => setSelectedGroup(value === "all" ? "" : value)}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All groups</SelectItem>
                      {groupsData?.map((group) => (
                        <SelectItem key={group.group} value={group.group}>
                          {group.group} ({group.count || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search settings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                {settings.length} setting{settings.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : settings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No settings found
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedSettings).map(([group, groupSettings]) => (
                    <div key={group} className="space-y-4">
                      <div className="border-b pb-2">
                        <h2 className="text-2xl font-bold capitalize">{group.replace(/_/g, ' ')}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {groupSettings.length} setting{groupSettings.length !== 1 ? 's' : ''} in this category
                        </p>
                      </div>
                      <div className="grid gap-4">
                        {groupSettings.map((setting) => (
                          <Card key={setting.setting_key} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold">
                                      {setting.display_name || setting.setting_key}
                                    </h3>
                                    <Badge variant={setting.is_active ? "default" : "secondary"} className="text-xs">
                                      {setting.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  {setting.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {setting.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 pt-2">
                                    <span className="text-sm font-medium text-muted-foreground">Current Value:</span>
                                    {isBulkEditMode ? (
                                      <div className="flex-1 max-w-xs">
                                        {renderSettingValueInput(setting, isBulkEditMode)}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        {formatValueForDisplay(setting)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {!isBulkEditMode && (
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditSetting(setting)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                    {!setting.is_system && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteSetting(setting.setting_key)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organisation Tab */}
        <TabsContent value="organisation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organisation Settings
              </CardTitle>
              <CardDescription>
                Create or update organisation information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {organisationLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading organisation data...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organisation Name</Label>
                    <Input
                      id="orgName"
                      value={organisationData.organisation_name}
                      onChange={(e) =>
                        setOrganisationData((prev) => ({
                          ...prev,
                          organisation_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgCode">Organisation Code</Label>
                    <Input
                      id="orgCode"
                      value={organisationData.organisation_code}
                      onChange={(e) =>
                        setOrganisationData((prev) => ({
                          ...prev,
                          organisation_code: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgDescription">Description</Label>
                    <Textarea
                      id="orgDescription"
                      value={organisationData.description}
                      onChange={(e) =>
                        setOrganisationData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        await updateOrganisationMutation.mutateAsync(organisationData);
                      } catch (error) {
                        // Error handled by mutation
                      }
                    }}
                    disabled={updateOrganisationMutation.isPending}
                  >
                    {updateOrganisationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Organisation Settings
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Defaults Tab */}
        <TabsContent value="role-defaults" className="space-y-4">
          <DefaultRolePermissionsSection />
        </TabsContent>
      </Tabs>

      {/* Create Setting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Setting</DialogTitle>
            <DialogDescription>
              Create a new configuration setting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="createSettingKey">
                Setting Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="createSettingKey"
                value={formData.setting_key}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, setting_key: e.target.value }))
                }
                placeholder="e.g., clock.auto_check_out.enabled"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="createCategory">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.setting_category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, setting_category: value }))
                  }
                >
                  <SelectTrigger id="createCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.category} value={cat.category}>
                        {cat.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="createGroup">Group</Label>
                <Input
                  id="createGroup"
                  value={formData.setting_group}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, setting_group: e.target.value }))
                  }
                  placeholder="e.g., auto_check_out"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createValueType">Value Type</Label>
              <Select
                value={formData.value_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, value_type: value }))
                }
              >
                <SelectTrigger id="createValueType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="integer">Integer</SelectItem>
                  <SelectItem value="float">Float</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createValue">Value</Label>
              {renderSettingValueInput({ value_type: formData.value_type }, false)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="createDisplayName">Display Name</Label>
              <Input
                id="createDisplayName"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, display_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createDescription">Description</Label>
              <Textarea
                id="createDescription"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSetting}
              disabled={createSettingMutation.isPending}
            >
              {createSettingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Setting Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update the setting value and metadata
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Setting Key</Label>
              <Input value={formData.setting_key} disabled />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              {renderSettingValueInput({ value_type: formData.value_type }, false)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Display Name</Label>
              <Input
                id="editDisplayName"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, display_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editIsActive"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="editIsActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateSettingMutation.isPending}>
              {updateSettingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Default Role Permissions Section Component
function DefaultRolePermissionsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [allPermissionsList, setAllPermissionsList] = useState([]);
  const [isLoadingAllPermissions, setIsLoadingAllPermissions] = useState(true);

  const { data: defaultPermissionIds = [], isLoading: isLoadingDefaults } = useDefaultRolePermissions();
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions({ page: 1, per_page: 50 });
  const updateDefaultPermissionsMutation = useUpdateDefaultRolePermissions();

  // Fetch all permissions across all pages
  useEffect(() => {
    const fetchAllPermissions = async () => {
      if (!permissionsData) return;

      setIsLoadingAllPermissions(true);
      try {
        const totalPages = permissionsData.total_pages || 1;
        const total = permissionsData.total || permissionsData.permissions?.length || 0;

        // If only one page, use the data we already have
        if (totalPages === 1) {
          const permissionsArray = permissionsData.permissions || (Array.isArray(permissionsData) ? permissionsData : []);
          setAllPermissionsList(permissionsArray.map((p) => ({
            id: p.id,
            name: p.display_name || p.name,
            resource: p.resource,
            action: p.action,
          })));
          setIsLoadingAllPermissions(false);
          return;
        }

        // Fetch all pages
        const allPermissions = [];

        // Start with the first page (already fetched)
        const firstPagePermissions = permissionsData.permissions || [];
        allPermissions.push(...firstPagePermissions);

        // Fetch remaining pages
        for (let page = 2; page <= totalPages; page++) {
          const response = await permissionsService.getPermissions({ page, per_page: 50 });
          const pagePermissions = response?.permissions || (Array.isArray(response) ? response : []);
          allPermissions.push(...pagePermissions);
        }

        // Transform and set all permissions
        setAllPermissionsList(allPermissions.map((p) => ({
          id: p.id,
          name: p.display_name || p.name,
          resource: p.resource,
          action: p.action,
        })));
      } catch (error) {
        console.error("Error fetching all permissions:", error);
        // Fallback to first page data
        const permissionsArray = permissionsData.permissions || (Array.isArray(permissionsData) ? permissionsData : []);
        setAllPermissionsList(permissionsArray.map((p) => ({
          id: p.id,
          name: p.display_name || p.name,
          resource: p.resource,
          action: p.action,
        })));
      } finally {
        setIsLoadingAllPermissions(false);
      }
    };

    if (!isLoadingPermissions && permissionsData) {
      fetchAllPermissions();
    }
  }, [permissionsData, isLoadingPermissions]);

  const allPermissions = allPermissionsList;

  // Initialize selected permissions from API
  useEffect(() => {
    if (!isLoadingDefaults && defaultPermissionIds.length > 0 && !isInitialized) {
      setSelectedPermissionIds(new Set(defaultPermissionIds));
      setIsInitialized(true);
    } else if (!isLoadingDefaults && defaultPermissionIds.length === 0 && !isInitialized) {
      setSelectedPermissionIds(new Set());
      setIsInitialized(true);
    }
  }, [defaultPermissionIds, isLoadingDefaults, isInitialized]);

  // Filter permissions based on search
  const filteredPermissions = allPermissions.filter((permission) =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedPermissionIds(new Set(filteredPermissions.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPermissionIds(new Set());
  };

  const handleSave = async () => {
    const permissionIds = Array.from(selectedPermissionIds);
    try {
      await updateDefaultPermissionsMutation.mutateAsync(permissionIds);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const hasChanges = useMemo(() => {
    if (!isInitialized) return false;
    const currentIds = Array.from(selectedPermissionIds).sort();
    const defaultIds = Array.from(defaultPermissionIds).sort();
    return JSON.stringify(currentIds) !== JSON.stringify(defaultIds);
  }, [selectedPermissionIds, defaultPermissionIds, isInitialized]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Default Role Permissions
        </CardTitle>
        <CardDescription>
          Configure default permissions that will be automatically assigned to new roles when no permissions are specified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingDefaults || isLoadingPermissions || isLoadingAllPermissions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading permissions...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Search and Actions */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Selected Count */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedPermissionIds.size} of {allPermissions.length} permissions selected
                </div>
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Unsaved changes
                  </Badge>
                )}
              </div>

              {/* Permissions List */}
              <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                {filteredPermissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No permissions found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredPermissions.map((permission) => {
                      const isSelected = selectedPermissionIds.has(permission.id);
                      return (
                        <div
                          key={permission.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleTogglePermission(permission.id)}
                        >
                          <div className="flex items-center justify-center h-5 w-5 rounded border-2 border-primary">
                            {isSelected && (
                              <CheckSquare className="h-4 w-4 text-primary fill-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {permission.resource}:{permission.action}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateDefaultPermissionsMutation.isPending}
                >
                  {updateDefaultPermissionsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Default Permissions
                    </>
                  )}
                </Button>
              </div>

              {/* Info Note */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>When creating a new role, if no permissions are specified, these default permissions will be automatically assigned.</li>
                      <li>If permissions are explicitly provided during role creation, the defaults will not be used.</li>
                      <li>If no default permissions are configured, new roles will be created with no permissions.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}




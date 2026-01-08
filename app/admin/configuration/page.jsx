"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Mail,
  Smartphone,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Plug,
} from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { useUploadFile } from "@/hooks/useProfile";
import { Upload, Image as ImageIcon } from "lucide-react";

function ConfigurationPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "settings");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [bulkUpdates, setBulkUpdates] = useState({});

  // Sync activeTab with URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

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
    integration_config: {
      sendgrid_api_key: null,
      twilio_account_sid: null,
      twilio_auth_token: null,
      twilio_from_number: null,
      from_email: null,
      from_name: null,
      app_name: null,
      domain_name: null,
      frontend_base_url: null,
      enable_two_way_communication: false,
      enable_email_replies: false,
      enable_sms_replies: false,
      list_unsubscribe_url: null,
      list_unsubscribe_mailto: null,
      list_unsubscribe_one_click: true,
      email_header_content: null,
      email_header_logo_url: null,
      email_primary_color: null,
      email_secondary_color: null,
      email_footer_content: null,
      email_footer_disclaimer: null,
      s3_storage: {
        enabled: false,
        access_key_id: null,
        secret_access_key: null,
        bucket_name: null,
        region: "eu-west-2",
      },
    },
  });

  // Track enabled state for Email, SMS, and S3
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [s3Enabled, setS3Enabled] = useState(false);
  
  // Store original values when disabling (to restore if re-enabled)
  const [originalEmailConfig, setOriginalEmailConfig] = useState(null);
  const [originalSMSConfig, setOriginalSMSConfig] = useState(null);
  const [originalS3Config, setOriginalS3Config] = useState(null);
  
  // Track if secret access key has been changed (for masking)
  const [s3SecretKeyChanged, setS3SecretKeyChanged] = useState(false);
  
  // Track which fields the user has actually modified (to only send changed fields)
  const [userModifiedFields, setUserModifiedFields] = useState(new Set());
  
  // File upload mutation for logo
  const uploadFileMutation = useUploadFile({ silent: true });
  const [logoUploading, setLogoUploading] = useState(false);

  // Helper function to detect if a value is masked (from backend sanitization)
  // Masked values contain "..." in the middle
  const isMaskedValue = (value) => {
    return typeof value === 'string' && value.includes('...');
  };

  // Helper function to build update payload - only includes fields user actually changed
  // Removes masked values and only includes modified fields
  const buildUpdatePayload = (config, modifiedFields) => {
    if (!config) return {};
    
    const payload = {};
    
    // Only include fields that the user actually modified
    // Never include masked values (they will be rejected by API)
    
    // Email styling fields (safe to send, not masked)
    if (modifiedFields.has('email_header_content')) {
      payload.email_header_content = config.email_header_content ?? null;
    }
    if (modifiedFields.has('email_header_logo_url')) {
      payload.email_header_logo_url = config.email_header_logo_url ?? null;
    }
    if (modifiedFields.has('email_primary_color')) {
      payload.email_primary_color = config.email_primary_color ?? null;
    }
    if (modifiedFields.has('email_secondary_color')) {
      payload.email_secondary_color = config.email_secondary_color ?? null;
    }
    if (modifiedFields.has('email_footer_content')) {
      payload.email_footer_content = config.email_footer_content ?? null;
    }
    if (modifiedFields.has('email_footer_disclaimer')) {
      payload.email_footer_disclaimer = config.email_footer_disclaimer ?? null;
    }
    
    // Sensitive fields - only include if user changed them AND they're not masked
    if (modifiedFields.has('sendgrid_api_key') && !isMaskedValue(config.sendgrid_api_key)) {
      payload.sendgrid_api_key = config.sendgrid_api_key;
    }
    if (modifiedFields.has('twilio_account_sid') && !isMaskedValue(config.twilio_account_sid)) {
      payload.twilio_account_sid = config.twilio_account_sid;
    }
    if (modifiedFields.has('twilio_auth_token') && !isMaskedValue(config.twilio_auth_token)) {
      payload.twilio_auth_token = config.twilio_auth_token;
    }
    if (modifiedFields.has('twilio_from_number') && !isMaskedValue(config.twilio_from_number)) {
      payload.twilio_from_number = config.twilio_from_number;
    }
    
    // Other non-sensitive fields
    if (modifiedFields.has('from_email')) {
      payload.from_email = config.from_email ?? null;
    }
    if (modifiedFields.has('from_name')) {
      payload.from_name = config.from_name ?? null;
    }
    if (modifiedFields.has('app_name')) {
      payload.app_name = config.app_name ?? null;
    }
    if (modifiedFields.has('domain_name')) {
      payload.domain_name = config.domain_name ?? null;
    }
    if (modifiedFields.has('frontend_base_url')) {
      payload.frontend_base_url = config.frontend_base_url ?? null;
    }
    if (modifiedFields.has('enable_two_way_communication')) {
      payload.enable_two_way_communication = config.enable_two_way_communication ?? false;
    }
    if (modifiedFields.has('enable_email_replies')) {
      payload.enable_email_replies = config.enable_email_replies ?? false;
    }
    if (modifiedFields.has('enable_sms_replies')) {
      payload.enable_sms_replies = config.enable_sms_replies ?? false;
    }
    if (modifiedFields.has('list_unsubscribe_url')) {
      payload.list_unsubscribe_url = config.list_unsubscribe_url ?? null;
    }
    if (modifiedFields.has('list_unsubscribe_mailto')) {
      payload.list_unsubscribe_mailto = config.list_unsubscribe_mailto ?? null;
    }
    if (modifiedFields.has('list_unsubscribe_one_click')) {
      payload.list_unsubscribe_one_click = config.list_unsubscribe_one_click !== false;
    }
    
    // Handle S3 storage nested object
    if (config.s3_storage) {
      const s3Modified = new Set();
      if (modifiedFields.has('s3_access_key_id')) s3Modified.add('access_key_id');
      if (modifiedFields.has('s3_secret_access_key')) s3Modified.add('secret_access_key');
      if (modifiedFields.has('s3_bucket_name')) s3Modified.add('bucket_name');
      if (modifiedFields.has('s3_region')) s3Modified.add('region');
      if (modifiedFields.has('s3_enabled')) s3Modified.add('enabled');
      
      if (s3Modified.size > 0) {
        payload.s3_storage = {};
        if (s3Modified.has('access_key_id') && !isMaskedValue(config.s3_storage.access_key_id)) {
          payload.s3_storage.access_key_id = config.s3_storage.access_key_id;
        }
        if (s3Modified.has('secret_access_key') && !isMaskedValue(config.s3_storage.secret_access_key)) {
          payload.s3_storage.secret_access_key = config.s3_storage.secret_access_key;
        }
        if (s3Modified.has('bucket_name')) {
          payload.s3_storage.bucket_name = config.s3_storage.bucket_name ?? null;
        }
        if (s3Modified.has('region')) {
          payload.s3_storage.region = config.s3_storage.region ?? "eu-west-2";
        }
        if (s3Modified.has('enabled')) {
          payload.s3_storage.enabled = config.s3_storage.enabled ?? false;
        }
      }
    }
    
    return payload;
  };
  
  // Helper to mark a field as modified
  const markFieldModified = (fieldName) => {
    setUserModifiedFields((prev) => new Set(prev).add(fieldName));
  };

  // Load organisation data when it's fetched from API
  useEffect(() => {
    if (organisationResponse) {
      const integrationConfig = organisationResponse.integration_config || {};
      const mergedIntegrationConfig = {
        sendgrid_api_key: integrationConfig.sendgrid_api_key || null,
        twilio_account_sid: integrationConfig.twilio_account_sid || null,
        twilio_auth_token: integrationConfig.twilio_auth_token || null,
        twilio_from_number: integrationConfig.twilio_from_number || null,
        from_email: integrationConfig.from_email || null,
        from_name: integrationConfig.from_name || null,
        app_name: integrationConfig.app_name || null,
        domain_name: integrationConfig.domain_name || null,
        frontend_base_url: integrationConfig.frontend_base_url || null,
        enable_two_way_communication: integrationConfig.enable_two_way_communication || false,
        enable_email_replies: integrationConfig.enable_email_replies || false,
        enable_sms_replies: integrationConfig.enable_sms_replies || false,
        list_unsubscribe_url: integrationConfig.list_unsubscribe_url || null,
        list_unsubscribe_mailto: integrationConfig.list_unsubscribe_mailto || null,
        list_unsubscribe_one_click: integrationConfig.list_unsubscribe_one_click !== false,
        email_header_content: integrationConfig.email_header_content || null,
        email_header_logo_url: integrationConfig.email_header_logo_url || null,
        email_primary_color: integrationConfig.email_primary_color || null,
        email_secondary_color: integrationConfig.email_secondary_color || null,
        email_footer_content: integrationConfig.email_footer_content || null,
        email_footer_disclaimer: integrationConfig.email_footer_disclaimer || null,
        s3_storage: integrationConfig.s3_storage || {
          enabled: false,
          access_key_id: null,
          secret_access_key: null,
          bucket_name: null,
          region: "eu-west-2",
        },
      };

      setOrganisationData({
        organisation_name: organisationResponse.organisation_name || "",
        organisation_code: organisationResponse.organisation_code || "",
        description: organisationResponse.description || "",
        is_active: organisationResponse.is_active !== false,
        integration_config: mergedIntegrationConfig,
      });

      // Set enabled state based on whether keys exist
      const hasEmailConfig = !!mergedIntegrationConfig.sendgrid_api_key;
      const hasSMSConfig = !!(mergedIntegrationConfig.twilio_account_sid && 
                              mergedIntegrationConfig.twilio_auth_token && 
                              mergedIntegrationConfig.twilio_from_number);
      
      setEmailEnabled(hasEmailConfig);
      setSmsEnabled(hasSMSConfig);
      
      // Set S3 enabled state
      const hasS3Config = !!(mergedIntegrationConfig.s3_storage?.enabled && 
                            mergedIntegrationConfig.s3_storage?.access_key_id && 
                            mergedIntegrationConfig.s3_storage?.secret_access_key && 
                            mergedIntegrationConfig.s3_storage?.bucket_name);
      setS3Enabled(hasS3Config);

      // Store original values (always store, even if null, so we can restore)
      setOriginalEmailConfig(mergedIntegrationConfig.sendgrid_api_key || null);
      setOriginalSMSConfig({
        twilio_account_sid: mergedIntegrationConfig.twilio_account_sid || null,
        twilio_auth_token: mergedIntegrationConfig.twilio_auth_token || null,
        twilio_from_number: mergedIntegrationConfig.twilio_from_number || null,
      });
      setOriginalS3Config(mergedIntegrationConfig.s3_storage || null);
      setS3SecretKeyChanged(false);
      // Reset modified fields when loading new data
      setUserModifiedFields(new Set());
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Configuration Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage system settings and organisation configuration
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsBulkEditMode(!isBulkEditMode)}
            size="sm"
            className="shrink-0"
          >
            {isBulkEditMode ? "Cancel Bulk Edit" : "Bulk Edit"}
          </Button>
          {isBulkEditMode && (
            <Button onClick={handleSaveBulkUpdates} disabled={bulkUpdateMutation.isPending} size="sm" className="shrink-0">
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
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Setting
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="organisation">Organisation</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
                        // Only send fields that user actually changed
                        const integrationConfigUpdate = buildUpdatePayload(
                          organisationData.integration_config,
                          userModifiedFields
                        );
                        
                        const payloadToSend = {
                          organisation_name: organisationData.organisation_name,
                          organisation_code: organisationData.organisation_code,
                          description: organisationData.description,
                          is_active: organisationData.is_active,
                          ...(Object.keys(integrationConfigUpdate).length > 0 && {
                            integration_config: integrationConfigUpdate,
                          }),
                        };
                        
                        await updateOrganisationMutation.mutateAsync(payloadToSend);
                        // Clear modified fields after successful save
                        setUserModifiedFields(new Set());
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

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Integration Configuration
              </CardTitle>
              <CardDescription>
                Configure SendGrid, Twilio, S3 Storage, and other integration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
              {/* SendGrid Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">SendGrid Email Configuration</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email-enabled" className="text-sm font-medium cursor-pointer">
                      {emailEnabled ? "Enabled" : "Disabled"}
                    </Label>
                    <Switch
                      id="email-enabled"
                      checked={emailEnabled}
                      onCheckedChange={(checked) => {
                        // Note: Enabling/disabling Email doesn't modify the fields themselves,
                        // it just shows/hides them. We don't need to mark fields as modified here.
                        setEmailEnabled(checked);
                        if (checked) {
                          // Enable: Restore original value if it exists and is not masked
                          const valueToRestore = originalEmailConfig && !isMaskedValue(originalEmailConfig) 
                            ? originalEmailConfig 
                            : null;
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              sendgrid_api_key: valueToRestore,
                            },
                          }));
                        } else {
                          // Disable: Clear the key and store current value (only if not masked)
                          const currentKey = organisationData.integration_config?.sendgrid_api_key;
                          if (currentKey && !isMaskedValue(currentKey)) {
                            setOriginalEmailConfig(currentKey);
                          }
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              sendgrid_api_key: null,
                            },
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                {emailEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid_api_key">
                      SendGrid API Key
                      {organisationData.integration_config?.sendgrid_api_key && (
                        <Badge variant="outline" className="ml-2">✓ Configured</Badge>
                      )}
                    </Label>
                    <Input
                      id="sendgrid_api_key"
                      type="password"
                      value={
                        (() => {
                          const key = organisationData.integration_config?.sendgrid_api_key;
                          // If masked, show placeholder; otherwise show actual value
                          if (key && isMaskedValue(key)) {
                            return "";
                          }
                          return key || "";
                        })()
                      }
                      onChange={(e) => {
                        markFieldModified('sendgrid_api_key');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            sendgrid_api_key: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder={
                        organisationData.integration_config?.sendgrid_api_key && isMaskedValue(organisationData.integration_config.sendgrid_api_key)
                          ? "•••••••• (Click to update)"
                          : "SG.xxxxxxxxxxxxxxxxxxxx"
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Required for sending emails. Get your API key from SendGrid dashboard.
                    </p>
                  </div>
                )}
                {!emailEnabled && (
                  <div className="p-4 bg-muted/50 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Email configuration is disabled. Enable it to configure SendGrid API key.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Twilio Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Twilio SMS Configuration</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sms-enabled" className="text-sm font-medium cursor-pointer">
                      {smsEnabled ? "Enabled" : "Disabled"}
                    </Label>
                    <Switch
                      id="sms-enabled"
                      checked={smsEnabled}
                      onCheckedChange={(checked) => {
                        // Note: Enabling/disabling SMS doesn't modify the fields themselves,
                        // it just shows/hides them. We don't need to mark fields as modified here.
                        setSmsEnabled(checked);
                        if (checked) {
                          // Enable: Restore original values if they exist and are not masked
                          const accountSid = originalSMSConfig?.twilio_account_sid && !isMaskedValue(originalSMSConfig.twilio_account_sid)
                            ? originalSMSConfig.twilio_account_sid
                            : null;
                          const authToken = originalSMSConfig?.twilio_auth_token && !isMaskedValue(originalSMSConfig.twilio_auth_token)
                            ? originalSMSConfig.twilio_auth_token
                            : null;
                          const fromNumber = originalSMSConfig?.twilio_from_number && !isMaskedValue(originalSMSConfig.twilio_from_number)
                            ? originalSMSConfig.twilio_from_number
                            : null;
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              twilio_account_sid: accountSid,
                              twilio_auth_token: authToken,
                              twilio_from_number: fromNumber,
                            },
                          }));
                        } else {
                          // Disable: Clear all SMS keys and store current values (only if not masked)
                          const currentConfig = {
                            twilio_account_sid: organisationData.integration_config?.twilio_account_sid,
                            twilio_auth_token: organisationData.integration_config?.twilio_auth_token,
                            twilio_from_number: organisationData.integration_config?.twilio_from_number,
                          };
                          // Only store if values exist and are not masked
                          if ((currentConfig.twilio_account_sid && !isMaskedValue(currentConfig.twilio_account_sid)) ||
                              (currentConfig.twilio_auth_token && !isMaskedValue(currentConfig.twilio_auth_token)) ||
                              (currentConfig.twilio_from_number && !isMaskedValue(currentConfig.twilio_from_number))) {
                            setOriginalSMSConfig({
                              twilio_account_sid: currentConfig.twilio_account_sid && !isMaskedValue(currentConfig.twilio_account_sid) ? currentConfig.twilio_account_sid : null,
                              twilio_auth_token: currentConfig.twilio_auth_token && !isMaskedValue(currentConfig.twilio_auth_token) ? currentConfig.twilio_auth_token : null,
                              twilio_from_number: currentConfig.twilio_from_number && !isMaskedValue(currentConfig.twilio_from_number) ? currentConfig.twilio_from_number : null,
                            });
                          }
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              twilio_account_sid: null,
                              twilio_auth_token: null,
                              twilio_from_number: null,
                            },
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                {smsEnabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="twilio_account_sid">Twilio Account SID</Label>
                        <Input
                          id="twilio_account_sid"
                          type="password"
                          value={
                            (() => {
                              const sid = organisationData.integration_config?.twilio_account_sid;
                              // If masked, show placeholder; otherwise show actual value
                              if (sid && isMaskedValue(sid)) {
                                return "";
                              }
                              return sid || "";
                            })()
                          }
                          onChange={(e) => {
                            markFieldModified('twilio_account_sid');
                            setOrganisationData((prev) => ({
                              ...prev,
                              integration_config: {
                                ...prev.integration_config,
                                twilio_account_sid: e.target.value || null,
                              },
                            }));
                          }}
                          placeholder={
                            organisationData.integration_config?.twilio_account_sid && isMaskedValue(organisationData.integration_config.twilio_account_sid)
                              ? "•••••••• (Click to update)"
                              : "ACxxxxxxxxxxxxxxxxxxxx"
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twilio_auth_token">Twilio Auth Token</Label>
                        <Input
                          id="twilio_auth_token"
                          type="password"
                          value={
                            (() => {
                              const token = organisationData.integration_config?.twilio_auth_token;
                              // If masked, show placeholder; otherwise show actual value
                              if (token && isMaskedValue(token)) {
                                return "";
                              }
                              return token || "";
                            })()
                          }
                          onChange={(e) => {
                            markFieldModified('twilio_auth_token');
                            setOrganisationData((prev) => ({
                              ...prev,
                              integration_config: {
                                ...prev.integration_config,
                                twilio_auth_token: e.target.value || null,
                              },
                            }));
                          }}
                          placeholder={
                            organisationData.integration_config?.twilio_auth_token && isMaskedValue(organisationData.integration_config.twilio_auth_token)
                              ? "•••••••• (Click to update)"
                              : "Your auth token"
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio_from_number">Twilio From Number</Label>
                      <Input
                        id="twilio_from_number"
                        type="password"
                        value={
                          (() => {
                            const number = organisationData.integration_config?.twilio_from_number;
                            // If masked, show placeholder; otherwise show actual value
                            if (number && isMaskedValue(number)) {
                              return "";
                            }
                            return number || "";
                          })()
                        }
                        onChange={(e) => {
                          markFieldModified('twilio_from_number');
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              twilio_from_number: e.target.value || null,
                            },
                          }));
                        }}
                        placeholder={
                          organisationData.integration_config?.twilio_from_number && isMaskedValue(organisationData.integration_config.twilio_from_number)
                            ? "•••••••• (Click to update)"
                            : "+1234567890"
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Required for sending SMS. Get credentials from Twilio console. Format: E.164 (e.g., +1234567890)
                      </p>
                    </div>
                  </>
                )}
                {!smsEnabled && (
                  <div className="p-4 bg-muted/50 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      SMS configuration is disabled. Enable it to configure Twilio credentials.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* S3 Storage Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">S3 Storage Configuration</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="s3-enabled" className="text-sm font-medium cursor-pointer">
                      {s3Enabled ? "Enabled" : "Disabled"}
                    </Label>
                    <Switch
                      id="s3-enabled"
                      checked={s3Enabled}
                      onCheckedChange={(checked) => {
                        if (!checked && s3Enabled) {
                          // Show warning when disabling
                          if (!confirm(
                            "Warning: Disabling S3 storage will affect file uploads. " +
                            "Existing files stored in S3 will continue to be accessible, " +
                            "but new files will be stored locally. Are you sure you want to disable S3 storage?"
                          )) {
                            return;
                          }
                        }
                        markFieldModified('s3_enabled');
                        setS3Enabled(checked);
                        if (checked) {
                          // Enable: Restore original values if they exist and are not masked
                          const accessKeyId = originalS3Config?.access_key_id && !isMaskedValue(originalS3Config.access_key_id)
                            ? originalS3Config.access_key_id
                            : null;
                          const secretAccessKey = originalS3Config?.secret_access_key && !isMaskedValue(originalS3Config.secret_access_key)
                            ? originalS3Config.secret_access_key
                            : null;
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              s3_storage: {
                                enabled: true,
                                access_key_id: accessKeyId,
                                secret_access_key: secretAccessKey,
                                bucket_name: originalS3Config?.bucket_name || null,
                                region: originalS3Config?.region || "eu-west-2",
                              },
                            },
                          }));
                        } else {
                          // Disable: Store current config and clear enabled flag (only if not masked)
                          const currentConfig = organisationData.integration_config?.s3_storage;
                          if (currentConfig) {
                            // Only store if values are not masked
                            setOriginalS3Config({
                              ...currentConfig,
                              access_key_id: currentConfig.access_key_id && !isMaskedValue(currentConfig.access_key_id) 
                                ? currentConfig.access_key_id 
                                : originalS3Config?.access_key_id || null,
                              secret_access_key: currentConfig.secret_access_key && !isMaskedValue(currentConfig.secret_access_key)
                                ? currentConfig.secret_access_key
                                : originalS3Config?.secret_access_key || null,
                            });
                          }
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              s3_storage: {
                                ...(prev.integration_config?.s3_storage || {}),
                                enabled: false,
                              },
                            },
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                {s3Enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="s3_access_key_id">
                          AWS Access Key ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="s3_access_key_id"
                          type="password"
                          value={
                            (() => {
                              const keyId = organisationData.integration_config?.s3_storage?.access_key_id;
                              // If masked, show placeholder; otherwise show actual value
                              if (keyId && isMaskedValue(keyId)) {
                                return "";
                              }
                              return keyId || "";
                            })()
                          }
                          onChange={(e) => {
                            markFieldModified('s3_access_key_id');
                            setOrganisationData((prev) => ({
                              ...prev,
                              integration_config: {
                                ...prev.integration_config,
                                s3_storage: {
                                  ...(prev.integration_config?.s3_storage || {
                                    enabled: true,
                                    secret_access_key: null,
                                    bucket_name: null,
                                    region: "eu-west-2",
                                  }),
                                  access_key_id: e.target.value || null,
                                },
                              },
                            }));
                          }}
                          placeholder={
                            organisationData.integration_config?.s3_storage?.access_key_id && isMaskedValue(organisationData.integration_config.s3_storage.access_key_id)
                              ? "•••••••• (Click to update)"
                              : "AKIAIOSFODNN7EXAMPLE"
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="s3_secret_access_key">
                          AWS Secret Access Key <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="s3_secret_access_key"
                            type={s3SecretKeyChanged ? "text" : "password"}
                            value={
                              (() => {
                                const secretKey = organisationData.integration_config?.s3_storage?.secret_access_key;
                                // If masked, show empty (will use placeholder); if changed, show actual value
                                if (s3SecretKeyChanged) {
                                  return secretKey || "";
                                }
                                // If masked, return empty so placeholder shows
                                if (secretKey && isMaskedValue(secretKey)) {
                                  return "";
                                }
                                // Otherwise show dots for password field
                                return secretKey ? "••••••••••••••••" : "";
                              })()
                            }
                            onChange={(e) => {
                              setS3SecretKeyChanged(true);
                              markFieldModified('s3_secret_access_key');
                              setOrganisationData((prev) => ({
                                ...prev,
                                integration_config: {
                                  ...prev.integration_config,
                                  s3_storage: {
                                    ...(prev.integration_config?.s3_storage || {
                                      enabled: true,
                                      access_key_id: null,
                                      bucket_name: null,
                                      region: "eu-west-2",
                                    }),
                                    secret_access_key: e.target.value || null,
                                  },
                                },
                              }));
                            }}
                            placeholder={
                              (() => {
                                const secretKey = organisationData.integration_config?.s3_storage?.secret_access_key;
                                if (secretKey && isMaskedValue(secretKey)) {
                                  return "•••••••• (Click to update)";
                                }
                                return "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
                              })()
                            }
                            className="pr-10"
                          />
                          {organisationData.integration_config?.s3_storage?.secret_access_key && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setS3SecretKeyChanged(!s3SecretKeyChanged)}
                            >
                              {s3SecretKeyChanged ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          )}
                        </div>
                        {!s3SecretKeyChanged && organisationData.integration_config?.s3_storage?.secret_access_key && isMaskedValue(organisationData.integration_config.s3_storage.secret_access_key) && (
                          <p className="text-xs text-muted-foreground">
                            Secret key is configured but masked. Click to enter a new value or update.
                          </p>
                        )}
                        {!s3SecretKeyChanged && organisationData.integration_config?.s3_storage?.secret_access_key && !isMaskedValue(organisationData.integration_config.s3_storage.secret_access_key) && (
                          <p className="text-xs text-muted-foreground">
                            Secret key is masked. Click the eye icon to view or update.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="s3_bucket_name">
                          S3 Bucket Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="s3_bucket_name"
                          value={organisationData.integration_config?.s3_storage?.bucket_name || ""}
                          onChange={(e) => {
                            markFieldModified('s3_bucket_name');
                            setOrganisationData((prev) => ({
                              ...prev,
                              integration_config: {
                                ...prev.integration_config,
                                s3_storage: {
                                  ...(prev.integration_config?.s3_storage || {
                                    enabled: true,
                                    access_key_id: null,
                                    secret_access_key: null,
                                    region: "eu-west-2",
                                  }),
                                  bucket_name: e.target.value || null,
                                },
                              },
                            }));
                          }}
                          placeholder="my-bucket-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="s3_region">
                          AWS Region <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="s3_region"
                          value={organisationData.integration_config?.s3_storage?.region || "eu-west-2"}
                          onChange={(e) => {
                            markFieldModified('s3_region');
                            setOrganisationData((prev) => ({
                              ...prev,
                              integration_config: {
                                ...prev.integration_config,
                                s3_storage: {
                                  ...(prev.integration_config?.s3_storage || {
                                    enabled: true,
                                    access_key_id: null,
                                    secret_access_key: null,
                                    bucket_name: null,
                                  }),
                                  region: e.target.value || "eu-west-2",
                                },
                              },
                            }));
                          }}
                          placeholder="eu-west-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Default: eu-west-2 (London)
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium mb-1">S3 Storage Information:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>When enabled, all file uploads will be stored in your S3 bucket</li>
                            <li>When disabled, files will be stored locally on the server</li>
                            <li>Existing files in S3 will remain accessible even after disabling</li>
                            <li>All required fields must be filled when enabling S3 storage</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {!s3Enabled && (
                  <div className="p-4 bg-muted/50 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      S3 storage is disabled. Enable it to configure AWS S3 for file storage.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Email Sender Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Sender Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={organisationData.integration_config?.from_email || ""}
                      onChange={(e) => {
                        markFieldModified('from_email');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            from_email: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      value={organisationData.integration_config?.from_name || ""}
                      onChange={(e) => {
                        markFieldModified('from_name');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            from_name: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder="Melode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_name">App Name</Label>
                    <Input
                      id="app_name"
                      value={organisationData.integration_config?.app_name || ""}
                      onChange={(e) => {
                        markFieldModified('app_name');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            app_name: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder="Melode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain_name">Domain Name</Label>
                    <Input
                      id="domain_name"
                      value={organisationData.integration_config?.domain_name || ""}
                      onChange={(e) => {
                        markFieldModified('domain_name');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            domain_name: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder="melode.co.uk"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="frontend_base_url">Frontend Base URL</Label>
                    <Input
                      id="frontend_base_url"
                      type="url"
                      value={organisationData.integration_config?.frontend_base_url || ""}
                      onChange={(e) => {
                        markFieldModified('frontend_base_url');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            frontend_base_url: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder="https://app.melode.co.uk"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Feature Flags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Feature Flags</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable_two_way_communication">Enable Two-Way Communication</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to reply to messages via email or SMS
                      </p>
                    </div>
                    <Switch
                      id="enable_two_way_communication"
                      checked={organisationData.integration_config?.enable_two_way_communication || false}
                      onCheckedChange={(checked) => {
                        markFieldModified('enable_two_way_communication');
                        if (checked === false) {
                          markFieldModified('enable_email_replies');
                          markFieldModified('enable_sms_replies');
                        }
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            enable_two_way_communication: checked,
                            // Disable reply features if two-way is disabled
                            ...(checked === false && {
                              enable_email_replies: false,
                              enable_sms_replies: false,
                            }),
                          },
                        }));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable_email_replies">Enable Email Replies</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to reply to messages via email
                      </p>
                    </div>
                    <Switch
                      id="enable_email_replies"
                      checked={organisationData.integration_config?.enable_email_replies || false}
                      onCheckedChange={(checked) => {
                        markFieldModified('enable_email_replies');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            enable_email_replies: checked,
                          },
                        }));
                      }}
                      disabled={!organisationData.integration_config?.enable_two_way_communication}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable_sms_replies">Enable SMS Replies</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to reply to messages via SMS
                      </p>
                    </div>
                    <Switch
                      id="enable_sms_replies"
                      checked={organisationData.integration_config?.enable_sms_replies || false}
                      onCheckedChange={(checked) => {
                        markFieldModified('enable_sms_replies');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            enable_sms_replies: checked,
                          },
                        }));
                      }}
                      disabled={!organisationData.integration_config?.enable_two_way_communication}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Unsubscribe Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Unsubscribe Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="list_unsubscribe_url">List-Unsubscribe URL</Label>
                    <Input
                      id="list_unsubscribe_url"
                      type="url"
                      value={organisationData.integration_config?.list_unsubscribe_url || ""}
                      onChange={(e) => {
                        markFieldModified('list_unsubscribe_url');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            list_unsubscribe_url: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder="https://app.melode.co.uk/unsubscribe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list_unsubscribe_mailto">List-Unsubscribe Mailto</Label>
                    <Input
                      id="list_unsubscribe_mailto"
                      type="email"
                      value={organisationData.integration_config?.list_unsubscribe_mailto || ""}
                      onChange={(e) => {
                        markFieldModified('list_unsubscribe_mailto');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            list_unsubscribe_mailto: e.target.value || null,
                          },
                        }));
                      }}
                      placeholder="mailto:unsubscribe@melode.co.uk"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="list_unsubscribe_one_click">Enable One-Click Unsubscribe</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to unsubscribe with one click
                    </p>
                  </div>
                  <Switch
                    id="list_unsubscribe_one_click"
                    checked={organisationData.integration_config?.list_unsubscribe_one_click !== false}
                    onCheckedChange={(checked) => {
                      markFieldModified('list_unsubscribe_one_click');
                      setOrganisationData((prev) => ({
                        ...prev,
                        integration_config: {
                          ...prev.integration_config,
                          list_unsubscribe_one_click: checked,
                        },
                      }));
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Email Styling Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Styling Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Customise the appearance of emails sent by the system. All fields are optional.
                </p>

                {/* Header Logo */}
                <div className="space-y-2">
                  <Label htmlFor="email_header_logo_url">Email Header Logo</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="email_header_logo_url"
                        type="url"
                        value={organisationData.integration_config?.email_header_logo_url || ""}
                        onChange={(e) => {
                          markFieldModified('email_header_logo_url');
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              email_header_logo_url: e.target.value || null,
                            },
                          }));
                        }}
                        placeholder="https://example.com/logo.png"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.setAttribute("type", "file");
                          input.setAttribute("accept", "image/*");
                          input.click();
                          input.onchange = async () => {
                            const file = input.files?.[0];
                            if (!file) return;
                            
                            // Check file size (max 10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error("Image size must be less than 10MB");
                              return;
                            }
                            
                            try {
                              setLogoUploading(true);
                              const uploadResult = await uploadFileMutation.mutateAsync({
                                file: file,
                              });
                              
                              const downloadUrl = uploadResult.download_url || uploadResult.url || uploadResult.file_url;
                              if (downloadUrl) {
                                markFieldModified('email_header_logo_url');
                                setOrganisationData((prev) => ({
                                  ...prev,
                                  integration_config: {
                                    ...prev.integration_config,
                                    email_header_logo_url: downloadUrl,
                                  },
                                }));
                                toast.success("Logo uploaded successfully");
                              } else {
                                throw new Error("No download URL received");
                              }
                            } catch (error) {
                              console.error("Logo upload failed:", error);
                              toast.error("Failed to upload logo", {
                                description: error?.response?.data?.detail || error?.message || "Please try again",
                              });
                            } finally {
                              setLogoUploading(false);
                            }
                          };
                        }}
                        disabled={logoUploading}
                      >
                        {logoUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                    </div>
                    {organisationData.integration_config?.email_header_logo_url && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate flex-1">
                          {organisationData.integration_config.email_header_logo_url}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            markFieldModified('email_header_logo_url');
                            setOrganisationData((prev) => ({
                              ...prev,
                              integration_config: {
                                ...prev.integration_config,
                                email_header_logo_url: null,
                              },
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload a logo file or enter a direct URL (must be http/https). Max 2,048 characters.
                    </p>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_primary_color">Primary Colour</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email_primary_color"
                        type="color"
                        value={organisationData.integration_config?.email_primary_color || "#11b9b7"}
                        onChange={(e) => {
                          markFieldModified('email_primary_color');
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              email_primary_color: e.target.value || null,
                            },
                          }));
                        }}
                        className="w-20 h-10"
                      />
                      <Input
                        value={organisationData.integration_config?.email_primary_color || ""}
                        onChange={(e) => {
                          markFieldModified('email_primary_color');
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              email_primary_color: e.target.value || null,
                            },
                          }));
                        }}
                        placeholder="#11b9b7"
                        className="flex-1 font-mono"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used for buttons and primary elements. Format: #RRGGBB
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_secondary_color">Secondary Colour</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email_secondary_color"
                        type="color"
                        value={organisationData.integration_config?.email_secondary_color || "#2c3e50"}
                        onChange={(e) => {
                          markFieldModified('email_secondary_color');
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              email_secondary_color: e.target.value || null,
                            },
                          }));
                        }}
                        className="w-20 h-10"
                      />
                      <Input
                        value={organisationData.integration_config?.email_secondary_color || ""}
                        onChange={(e) => {
                          markFieldModified('email_secondary_color');
                          setOrganisationData((prev) => ({
                            ...prev,
                            integration_config: {
                              ...prev.integration_config,
                              email_secondary_color: e.target.value || null,
                            },
                          }));
                        }}
                        placeholder="#2c3e50"
                        className="flex-1 font-mono"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used for secondary elements. Format: #RRGGBB
                    </p>
                  </div>
                </div>

                {/* Header Content */}
                <div className="space-y-2">
                  <Label htmlFor="email_header_content">Email Header Content (HTML)</Label>
                  <div className="border rounded-lg">
                    <RichTextEditor
                      value={organisationData.integration_config?.email_header_content || ""}
                      onChange={(html) => {
                        markFieldModified('email_header_content');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            email_header_content: html || null,
                          },
                        }));
                      }}
                      placeholder="Enter HTML content for email header..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Custom HTML content displayed at the top of emails. Max 50,000 characters.
                  </p>
                </div>

                {/* Footer Content */}
                <div className="space-y-2">
                  <Label htmlFor="email_footer_content">Email Footer Content (HTML)</Label>
                  <div className="border rounded-lg">
                    <RichTextEditor
                      value={organisationData.integration_config?.email_footer_content || ""}
                      onChange={(html) => {
                        markFieldModified('email_footer_content');
                        setOrganisationData((prev) => ({
                          ...prev,
                          integration_config: {
                            ...prev.integration_config,
                            email_footer_content: html || null,
                          },
                        }));
                      }}
                      placeholder="Enter HTML content for email footer..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Custom HTML content displayed at the bottom of emails. Max 50,000 characters.
                  </p>
                </div>

                {/* Footer Disclaimer */}
                <div className="space-y-2">
                  <Label htmlFor="email_footer_disclaimer">Footer Disclaimer</Label>
                  <Textarea
                    id="email_footer_disclaimer"
                    value={organisationData.integration_config?.email_footer_disclaimer || ""}
                    onChange={(e) => {
                      markFieldModified('email_footer_disclaimer');
                      setOrganisationData((prev) => ({
                        ...prev,
                        integration_config: {
                          ...prev.integration_config,
                          email_footer_disclaimer: e.target.value || null,
                        },
                      }));
                    }}
                    placeholder="Enter disclaimer text for email footer..."
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Plain text disclaimer displayed in email footer. Max 1,000 characters.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Status Indicators */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Configuration Status</h3>
                <div className="flex flex-wrap gap-2">
                  {organisationData.integration_config?.sendgrid_api_key ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Email Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Email Not Configured
                    </Badge>
                  )}
                  {organisationData.integration_config?.twilio_account_sid &&
                  organisationData.integration_config?.twilio_auth_token &&
                  organisationData.integration_config?.twilio_from_number ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      SMS Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      SMS Not Configured
                    </Badge>
                  )}
                  {organisationData.integration_config?.s3_storage?.enabled &&
                  organisationData.integration_config?.s3_storage?.access_key_id &&
                  organisationData.integration_config?.s3_storage?.secret_access_key &&
                  organisationData.integration_config?.s3_storage?.bucket_name ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      S3 Storage Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      S3 Storage Not Configured
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={async () => {
                  // Check if user modified any S3-related fields
                  const s3FieldsModified = userModifiedFields.has('s3_access_key_id') ||
                                         userModifiedFields.has('s3_secret_access_key') ||
                                         userModifiedFields.has('s3_bucket_name') ||
                                         userModifiedFields.has('s3_region') ||
                                         userModifiedFields.has('s3_enabled');
                  
                  // Only validate S3 configuration if user actually modified S3 fields
                  if (s3FieldsModified && s3Enabled) {
                    const s3Config = organisationData.integration_config?.s3_storage;
                    if (!s3Config?.access_key_id || !s3Config?.bucket_name || !s3Config?.region) {
                      toast.error("S3 Storage requires Access Key ID, Bucket Name, and Region");
                      return;
                    }
                    // If secret key hasn't been changed, keep the original (don't send empty string)
                    // But only if the original is not masked
                    if (!s3SecretKeyChanged && originalS3Config?.secret_access_key && !isMaskedValue(originalS3Config.secret_access_key)) {
                      setOrganisationData((prev) => ({
                        ...prev,
                        integration_config: {
                          ...prev.integration_config,
                          s3_storage: {
                            ...prev.integration_config.s3_storage,
                            secret_access_key: originalS3Config.secret_access_key,
                          },
                        },
                      }));
                    } else if (!s3Config?.secret_access_key || isMaskedValue(s3Config.secret_access_key)) {
                      // If the current value is masked, we need a new value
                      if (!s3SecretKeyChanged) {
                        toast.error("S3 Storage requires Secret Access Key. Please enter a new value.");
                        return;
                      }
                      if (!s3Config?.secret_access_key) {
                        toast.error("S3 Storage requires Secret Access Key");
                        return;
                      }
                    }
                  }
                  
                  try {
                    // Only send fields that user actually changed
                    const integrationConfigUpdate = buildUpdatePayload(
                      organisationData.integration_config,
                      userModifiedFields
                    );
                    
                    const payloadToSend = {
                      organisation_name: organisationData.organisation_name,
                      organisation_code: organisationData.organisation_code,
                      description: organisationData.description,
                      is_active: organisationData.is_active,
                      ...(Object.keys(integrationConfigUpdate).length > 0 && {
                        integration_config: integrationConfigUpdate,
                      }),
                    };
                    
                    await updateOrganisationMutation.mutateAsync(payloadToSend);
                    setS3SecretKeyChanged(false); // Reset after successful save
                    // Clear modified fields after successful save
                    setUserModifiedFields(new Set());
                  } catch (error) {
                    // Error handled by mutation
                  }
                }}
                disabled={updateOrganisationMutation.isPending}
                className="w-full"
              >
                {updateOrganisationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Integration Configuration
                  </>
                )}
              </Button>
              </div>
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

export default function ConfigurationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <ConfigurationPageContent />
    </Suspense>
  );
}




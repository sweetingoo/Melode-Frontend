import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetsService } from "@/services/assets";
import { toast } from "sonner";

export const assetsKeys = {
  all: ["assets"],
  lists: (params) => [...assetsKeys.all, "list", params],
  detail: (id) => [...assetsKeys.all, "detail", id],
  byNumber: (number) => [...assetsKeys.all, "number", number],
  search: (params) => [...assetsKeys.all, "search", params],
  byLocation: (locationSlug) => [...assetsKeys.all, "location", locationSlug],
  maintenanceNeeded: () => [...assetsKeys.all, "maintenance", "needed"],
  statistics: () => [...assetsKeys.all, "statistics"],
};

export const assetsUtils = {
  transformAsset: (asset) => ({
    id: asset.id,
    slug: asset.slug,
    assetNumber: asset.asset_number || asset.assetNumber,
    asset_number: asset.asset_number || asset.assetNumber,
    name: asset.name || asset.assetName,
    assetName: asset.name || asset.assetName,
    description: asset.description || "",
    // New: asset_type_id (required)
    assetTypeId: asset.asset_type_id || asset.assetTypeId || null,
    asset_type_id: asset.asset_type_id || asset.assetTypeId || null,
    // Deprecated: asset_type (for backward compatibility)
    assetType: asset.asset_type || asset.assetType || null,
    asset_type: asset.asset_type || asset.assetType || null,
    // New: asset type display fields from response
    assetTypeName: asset.asset_type_name || asset.assetTypeName || null,
    asset_type_name: asset.asset_type_name || asset.assetTypeName || null,
    assetTypeDisplayName: asset.asset_type_display_name || asset.assetTypeDisplayName || null,
    asset_type_display_name: asset.asset_type_display_name || asset.assetTypeDisplayName || null,
    category: asset.category || "",
    subcategory: asset.subcategory || "",
    status: asset.status || "active",
    condition: asset.condition || "",
    locationId: asset.location_id || asset.locationId || null,
    location_id: asset.location_id || asset.locationId || null,
    currentLocation: asset.current_location || asset.currentLocation || "",
    current_location: asset.current_location || asset.currentLocation || "",
    assignedToUserId:
      asset.assigned_to_user_id || asset.assignedToUserId || null,
    assigned_to_user_id:
      asset.assigned_to_user_id || asset.assignedToUserId || null,
    assignedToRoleId:
      asset.assigned_to_role_id || asset.assignedToRoleId || null,
    assigned_to_role_id:
      asset.assigned_to_role_id || asset.assignedToRoleId || null,
    department: asset.department || "",
    purchaseDate: asset.purchase_date || asset.purchaseDate || "",
    purchase_date: asset.purchase_date || asset.purchaseDate || "",
    purchasePrice: asset.purchase_price || asset.purchasePrice || 0,
    purchase_price: asset.purchase_price || asset.purchasePrice || 0,
    supplier: asset.supplier || "",
    warrantyExpiry: asset.warranty_expiry || asset.warrantyExpiry || "",
    warranty_expiry: asset.warranty_expiry || asset.warrantyExpiry || "",
    lastMaintenanceDate:
      asset.last_maintenance_date || asset.lastMaintenanceDate || "",
    last_maintenance_date:
      asset.last_maintenance_date || asset.lastMaintenanceDate || "",
    nextMaintenanceDate:
      asset.next_maintenance_date || asset.nextMaintenanceDate || "",
    next_maintenance_date:
      asset.next_maintenance_date || asset.nextMaintenanceDate || "",
    maintenanceSchedule:
      asset.maintenance_schedule || asset.maintenanceSchedule || {},
    maintenance_schedule:
      asset.maintenance_schedule || asset.maintenanceSchedule || {},
    complianceStatus: asset.compliance_status || asset.complianceStatus || "",
    compliance_status: asset.compliance_status || asset.complianceStatus || "",
    hasSensors: asset.has_sensors !== undefined ? asset.has_sensors : false,
    has_sensors: asset.has_sensors !== undefined ? asset.has_sensors : false,
    sensorData: asset.sensor_data || asset.sensorData || {},
    sensor_data: asset.sensor_data || asset.sensorData || {},
    automationEnabled:
      asset.automation_enabled !== undefined ? asset.automation_enabled : false,
    automation_enabled:
      asset.automation_enabled !== undefined ? asset.automation_enabled : false,
    attributes: asset.attributes || {},
    historicalValues: asset.historical_values || asset.historicalValues || {},
    historical_values: asset.historical_values || asset.historicalValues || {},
    tags: asset.tags || [],
    assetMetadata: asset.asset_metadata || asset.assetMetadata || {},
    asset_metadata: asset.asset_metadata || asset.assetMetadata || {},
    isActive: asset.is_active !== undefined ? asset.is_active : true,
    is_active: asset.is_active !== undefined ? asset.is_active : true,
    createdAt: asset.created_at || asset.createdAt,
    created_at: asset.created_at || asset.createdAt,
    updatedAt: asset.updated_at || asset.updatedAt,
    updated_at: asset.updated_at || asset.updatedAt,
    createdByUserId: asset.created_by_user_id || asset.createdByUserId || 0,
    created_by_user_id: asset.created_by_user_id || asset.createdByUserId || 0,
    displayName: asset.display_name || asset.displayName || "",
    display_name: asset.display_name || asset.displayName || "",
    isOperational:
      asset.is_operational !== undefined ? asset.is_operational : true,
    is_operational:
      asset.is_operational !== undefined ? asset.is_operational : true,
    needsMaintenance:
      asset.needs_maintenance !== undefined ? asset.needs_maintenance : false,
    needs_maintenance:
      asset.needs_maintenance !== undefined ? asset.needs_maintenance : false,
    isCompliant: asset.is_compliant !== undefined ? asset.is_compliant : true,
    is_compliant: asset.is_compliant !== undefined ? asset.is_compliant : true,
    // UI-friendly computed fields
    assignedTo: asset.assigned_to || "",
    location:
      asset.location || asset.current_location || asset.currentLocation || "",
  }),

  transformAssetForAPI: (asset) => {
    const data = {};

    // Required fields
    if (asset.hasOwnProperty("asset_number")) {
      data.asset_number = asset.asset_number;
    } else if (asset.hasOwnProperty("assetNumber")) {
      data.asset_number = asset.assetNumber;
    }

    if (asset.hasOwnProperty("name")) {
      data.name = asset.name;
    } else if (asset.hasOwnProperty("assetName")) {
      data.name = asset.assetName;
    }

    // Optional fields - only include if they exist and have a value
    if (asset.description !== undefined && asset.description !== "") {
      data.description = asset.description;
    }
    // Handle asset_type_id - REQUIRED field by API (new approach)
    // Check snake_case first (form uses asset_type_id), then camelCase
    // Priority: asset_type_id > assetTypeId
    const assetTypeId =
      asset.asset_type_id !== undefined
        ? asset.asset_type_id
        : asset.assetTypeId;
    if (assetTypeId !== undefined && assetTypeId !== null) {
      data.asset_type_id = assetTypeId;
    }

    // Handle asset_type - DEPRECATED but kept for backward compatibility
    // Only include if asset_type_id is not provided
    if (!data.asset_type_id) {
      if (asset.hasOwnProperty("asset_type") || asset.hasOwnProperty("assetType")) {
        const assetType = asset.asset_type || asset.assetType || "";
        if (assetType && assetType.trim().length > 0) {
          data.asset_type = assetType;
        } else if (asset.hasOwnProperty("asset_type")) {
          data.asset_type = assetType;
        }
      }
    }
    if (asset.category !== undefined && asset.category !== "") {
      data.category = asset.category;
    }
    if (asset.subcategory !== undefined && asset.subcategory !== "") {
      data.subcategory = asset.subcategory;
    }
    if (asset.status !== undefined) {
      data.status = asset.status;
    }
    // condition must be one of the enum values, so only include if it has a valid value
    if (asset.condition !== undefined && asset.condition !== "") {
      data.condition = asset.condition;
    }
    if (asset.location_id !== undefined || asset.locationId !== undefined) {
      const locationId =
        asset.location_id !== undefined ? asset.location_id : asset.locationId;
      if (locationId !== null && locationId !== "") {
        data.location_id = locationId;
      }
    }
    if (
      asset.assigned_to_user_id !== undefined ||
      asset.assignedToUserId !== undefined
    ) {
      const userId =
        asset.assigned_to_user_id !== undefined
          ? asset.assigned_to_user_id
          : asset.assignedToUserId;
      if (userId !== null && userId !== "") {
        data.assigned_to_user_id = userId;
      }
    }
    if (
      asset.assigned_to_role_id !== undefined ||
      asset.assignedToRoleId !== undefined
    ) {
      const roleId =
        asset.assigned_to_role_id !== undefined
          ? asset.assigned_to_role_id
          : asset.assignedToRoleId;
      if (roleId !== null && roleId !== "") {
        data.assigned_to_role_id = roleId;
      }
    }
    if (asset.department !== undefined && asset.department !== "") {
      data.department = asset.department;
    }
    // Only include date fields if they have a valid value
    if (asset.purchase_date !== undefined || asset.purchaseDate !== undefined) {
      const purchaseDate = asset.purchase_date || asset.purchaseDate || "";
      if (purchaseDate && purchaseDate.trim().length > 0) {
        data.purchase_date = purchaseDate;
      }
    }
    if (
      asset.purchase_price !== undefined ||
      asset.purchasePrice !== undefined
    ) {
      data.purchase_price =
        asset.purchase_price !== undefined
          ? asset.purchase_price
          : asset.purchasePrice;
    }
    if (asset.supplier !== undefined && asset.supplier !== "") {
      data.supplier = asset.supplier;
    }
    if (
      asset.warranty_expiry !== undefined ||
      asset.warrantyExpiry !== undefined
    ) {
      const warrantyExpiry =
        asset.warranty_expiry || asset.warrantyExpiry || "";
      if (warrantyExpiry && warrantyExpiry.trim().length > 0) {
        data.warranty_expiry = warrantyExpiry;
      }
    }
    // last_maintenance_date must be a valid datetime, so only include if it has a value
    if (
      asset.last_maintenance_date !== undefined ||
      asset.lastMaintenanceDate !== undefined
    ) {
      const lastMaintenanceDate =
        asset.last_maintenance_date || asset.lastMaintenanceDate || "";
      if (lastMaintenanceDate && lastMaintenanceDate.trim().length > 0) {
        data.last_maintenance_date = lastMaintenanceDate;
      }
    }
    // next_maintenance_date must be a valid datetime, so only include if it has a value
    if (
      asset.next_maintenance_date !== undefined ||
      asset.nextMaintenanceDate !== undefined
    ) {
      const nextMaintenanceDate =
        asset.next_maintenance_date || asset.nextMaintenanceDate || "";
      if (nextMaintenanceDate && nextMaintenanceDate.trim().length > 0) {
        data.next_maintenance_date = nextMaintenanceDate;
      }
    }
    if (
      asset.maintenance_schedule !== undefined ||
      asset.maintenanceSchedule !== undefined
    ) {
      data.maintenance_schedule =
        asset.maintenance_schedule || asset.maintenanceSchedule || {};
    }
    // compliance_status must be one of the enum values, so only include if it has a valid value
    if (
      asset.compliance_status !== undefined ||
      asset.complianceStatus !== undefined
    ) {
      const complianceStatus =
        asset.compliance_status || asset.complianceStatus || "";
      if (complianceStatus && complianceStatus.trim().length > 0) {
        data.compliance_status = complianceStatus;
      }
    }
    if (asset.has_sensors !== undefined || asset.hasSensors !== undefined) {
      data.has_sensors =
        asset.has_sensors !== undefined ? asset.has_sensors : asset.hasSensors;
    }
    if (asset.sensor_data !== undefined || asset.sensorData !== undefined) {
      data.sensor_data = asset.sensor_data || asset.sensorData || {};
    }
    if (
      asset.automation_enabled !== undefined ||
      asset.automationEnabled !== undefined
    ) {
      data.automation_enabled =
        asset.automation_enabled !== undefined
          ? asset.automation_enabled
          : asset.automationEnabled;
    }
    if (asset.attributes !== undefined) {
      data.attributes = asset.attributes || {};
    }
    if (
      asset.historical_values !== undefined ||
      asset.historicalValues !== undefined
    ) {
      data.historical_values =
        asset.historical_values || asset.historicalValues || {};
    }
    if (asset.tags !== undefined) {
      data.tags = asset.tags || [];
    }
    if (
      asset.asset_metadata !== undefined ||
      asset.assetMetadata !== undefined
    ) {
      data.asset_metadata = asset.asset_metadata || asset.assetMetadata || {};
    }
    if (asset.is_active !== undefined || asset.isActive !== undefined) {
      data.is_active =
        asset.is_active !== undefined ? asset.is_active : asset.isActive;
    }
    if (asset.display_name !== undefined || asset.displayName !== undefined) {
      const displayName = asset.display_name || asset.displayName || "";
      if (displayName && displayName.trim().length > 0) {
        data.display_name = displayName;
      }
    }
    if (
      asset.is_operational !== undefined ||
      asset.isOperational !== undefined
    ) {
      data.is_operational =
        asset.is_operational !== undefined
          ? asset.is_operational
          : asset.isOperational;
    }
    if (
      asset.needs_maintenance !== undefined ||
      asset.needsMaintenance !== undefined
    ) {
      data.needs_maintenance =
        asset.needs_maintenance !== undefined
          ? asset.needs_maintenance
          : asset.needsMaintenance;
    }
    if (asset.is_compliant !== undefined || asset.isCompliant !== undefined) {
      data.is_compliant =
        asset.is_compliant !== undefined
          ? asset.is_compliant
          : asset.isCompliant;
    }

    return data;
  },
};

// Hook to get all assets
export const useAssets = (params = {}) => {
  return useQuery({
    queryKey: assetsKeys.lists(params),
    queryFn: async () => {
      const response = await assetsService.getAssets(params);
      // Handle different response formats
      if (response?.assets && Array.isArray(response.assets)) {
        return response.assets.map(assetsUtils.transformAsset);
      } else if (Array.isArray(response)) {
        return response.map(assetsUtils.transformAsset);
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data.map(assetsUtils.transformAsset);
      } else if (response?.results && Array.isArray(response.results)) {
        return response.results.map(assetsUtils.transformAsset);
      } else {
        console.error("Unexpected response format:", response);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get a single asset by slug
export const useAsset = (slug) => {
  return useQuery({
    queryKey: assetsKeys.detail(slug),
    queryFn: async () => {
      const response = await assetsService.getAsset(slug);
      return assetsUtils.transformAsset(response);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get asset by number
export const useAssetByNumber = (assetNumber) => {
  return useQuery({
    queryKey: assetsKeys.byNumber(assetNumber),
    queryFn: async () => {
      const response = await assetsService.getAssetByNumber(assetNumber);
      return assetsUtils.transformAsset(response);
    },
    enabled: !!assetNumber,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to create an asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetData) => {
      const transformedData = assetsUtils.transformAssetForAPI(assetData);
      const response = await assetsService.createAsset(transformedData);
      return assetsUtils.transformAsset(response);
    },
    onSuccess: (data) => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({ queryKey: assetsKeys.all });
      queryClient.invalidateQueries({ queryKey: assetsKeys.statistics() });
      toast.success("Asset created successfully!");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to create asset";
      toast.error("Error creating asset", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Hook to update an asset
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, assetData }) => {
      const transformedData = assetsUtils.transformAssetForAPI(assetData);
      const response = await assetsService.updateAsset(slug || assetData.slug, transformedData);
      return assetsUtils.transformAsset(response);
    },
    onSuccess: (data, variables) => {
      // Update the specific asset in cache
      queryClient.setQueryData(assetsKeys.detail(variables.slug), data);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: assetsKeys.all });
      queryClient.invalidateQueries({ queryKey: assetsKeys.statistics() });
      toast.success("Asset updated successfully!");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to update asset";
      toast.error("Error updating asset", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Hook to delete an asset
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      await assetsService.deleteAsset(slug);
      return slug;
    },
    onSuccess: () => {
      // Invalidate all asset queries
      queryClient.invalidateQueries({ queryKey: assetsKeys.all });
      queryClient.invalidateQueries({ queryKey: assetsKeys.statistics() });
      toast.success("Asset deleted successfully!");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to delete asset";
      toast.error("Error deleting asset", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Hook to search assets
export const useSearchAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchData) => {
      const response = await assetsService.searchAssets(searchData);
      if (response?.assets && Array.isArray(response.assets)) {
        return response.assets.map(assetsUtils.transformAsset);
      } else if (Array.isArray(response)) {
        return response.map(assetsUtils.transformAsset);
      } else {
        return [];
      }
    },
    onSuccess: (data, variables) => {
      // Cache search results
      queryClient.setQueryData(assetsKeys.search(variables), data);
    },
  });
};

// Hook to update asset attributes
export const useUpdateAssetAttributes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, attributes }) => {
      const response = await assetsService.updateAssetAttributes(
        id,
        attributes
      );
      return assetsUtils.transformAsset(response);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(assetsKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: assetsKeys.all });
      toast.success("Asset attributes updated successfully!");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to update attributes";
      toast.error("Error updating attributes", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Hook to update asset sensor data
export const useUpdateAssetSensorData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sensorData }) => {
      const response = await assetsService.updateAssetSensorData(
        id,
        sensorData
      );
      return assetsUtils.transformAsset(response);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(assetsKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: assetsKeys.all });
      toast.success("Sensor data updated successfully!");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to update sensor data";
      toast.error("Error updating sensor data", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Hook to assign an asset
export const useAssignAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, assignData }) => {
      const response = await assetsService.assignAsset(id, assignData);
      return assetsUtils.transformAsset(response);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(assetsKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: assetsKeys.all });
      toast.success("Asset assigned successfully!");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to assign asset";
      toast.error("Error assigning asset", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Hook to get asset statistics
export const useAssetStatistics = () => {
  return useQuery({
    queryKey: assetsKeys.statistics(),
    queryFn: async () => {
      const response = await assetsService.getAssetStatistics();
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get assets by location
export const useAssetsByLocation = (locationSlug) => {
  return useQuery({
    queryKey: assetsKeys.byLocation(locationSlug),
    queryFn: async () => {
      const response = await assetsService.getAssetsByLocation(locationSlug);
      if (response?.assets && Array.isArray(response.assets)) {
        return response.assets.map(assetsUtils.transformAsset);
      } else if (Array.isArray(response)) {
        return response.map(assetsUtils.transformAsset);
      } else {
        return [];
      }
    },
    enabled: !!locationSlug,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get assets needing maintenance
export const useAssetsNeedingMaintenance = () => {
  return useQuery({
    queryKey: assetsKeys.maintenanceNeeded(),
    queryFn: async () => {
      const response = await assetsService.getAssetsNeedingMaintenance();
      if (response?.assets && Array.isArray(response.assets)) {
        return response.assets.map(assetsUtils.transformAsset);
      } else if (Array.isArray(response)) {
        return response.map(assetsUtils.transformAsset);
      } else {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locationsService } from "@/services/locations";
import { toast } from "sonner";

export const locationsKeys = {
  all: ["locations"],
  lists: (params) => [...locationsKeys.all, "list", params],
  detail: (id) => [...locationsKeys.all, "detail", id],
  hierarchy: (id) => [...locationsKeys.all, "hierarchy", id],
  search: (params) => [...locationsKeys.all, "search", params],
  byType: (type) => [...locationsKeys.all, "type", type],
  roots: () => [...locationsKeys.all, "roots"],
  children: (id) => [...locationsKeys.all, "children", id],
  descendants: (id) => [...locationsKeys.all, "descendants", id],
  statistics: () => [...locationsKeys.all, "statistics"],
};

export const locationsUtils = {
  transformLocation: (location) => ({
    id: location.id,
    slug: location.slug,
    name: location.name || location.locationName,
    locationName: location.name || location.locationName,
    locationCode: location.location_code || location.locationCode || "",
    description: location.description || "",
    // New: location_type_id (required)
    locationTypeId: location.location_type_id || location.locationTypeId || null,
    location_type_id: location.location_type_id || location.locationTypeId || null,
    // Deprecated: location_type (for backward compatibility)
    locationType: location.location_type || location.locationType || null,
    location_type: location.location_type || location.locationType || null,
    // New: location_type_obj (full LocationType object if included)
    locationTypeObj: location.location_type_obj || location.locationTypeObj || null,
    location_type_obj: location.location_type_obj || location.locationTypeObj || null,
    parentLocationId: location.parent_location_id || location.parentId || null,
    parentId: location.parent_location_id || location.parentId || null,
    address: location.address || "",
    coordinates: location.coordinates || "",
    capacity: location.capacity || 0,
    areaSqm: location.area_sqm || location.areaSqm || 0,
    status: location.status || "active",
    isAccessible:
      location.is_accessible !== undefined ? location.is_accessible : true,
    requiresAccessControl:
      location.requires_access_control !== undefined
        ? location.requires_access_control
        : false,
    contactPerson: location.contact_person || location.contactPerson || "",
    contactPhone: location.contact_phone || location.contactPhone || "",
    contactEmail: location.contact_email || location.contactEmail || "",
    responsibleDepartment:
      location.responsible_department || location.responsibleDepartment || "",
    isActive: location.is_active !== undefined ? location.is_active : true,
    createdAt: location.created_at || location.createdAt,
    updatedAt: location.updated_at || location.updatedAt,
    hierarchyPath: location.hierarchy_path || location.hierarchyPath || "",
    hierarchyLevel: location.hierarchy_level || location.hierarchyLevel || 0,
    createdByUserId:
      location.created_by_user_id || location.createdByUserId || 0,
    displayName: location.display_name || location.displayName || "",
    fullPath: location.full_path || location.fullPath || "",
    // Additional computed fields for UI
    city: location.city || "",
    state: location.state || "",
    country: location.country || "",
    zipCode: location.zip_code || location.zipCode || "",
    latitude: location.latitude || "",
    longitude: location.longitude || "",
    children: location.children || [],
  }),

  transformLocationForAPI: (location) => {
    const data = {};

    // Handle name - required field
    if (location.name !== undefined && location.name !== null) {
      data.name = location.name;
    }

    // Handle description
    if (location.description !== undefined) {
      data.description = location.description || "";
    }

    // Handle location_type_id - REQUIRED field by API (new approach)
    // Check snake_case first (form uses location_type_id), then camelCase
    // Priority: location_type_id > locationTypeId
    const locationTypeId =
      location.location_type_id !== undefined
        ? location.location_type_id
        : location.locationTypeId;
    if (locationTypeId !== undefined && locationTypeId !== null) {
      data.location_type_id = locationTypeId;
    }

    // Handle location_type - DEPRECATED but kept for backward compatibility
    // Only include if location_type_id is not provided
    if (!data.location_type_id) {
      if (location.hasOwnProperty("location_type")) {
        data.location_type = location.location_type;
      } else if (location.hasOwnProperty("locationType")) {
        data.location_type = location.locationType;
      }
    }

    // Handle parent_location_id - check both camelCase and snake_case
    const parentLocationId =
      location.parent_location_id !== undefined
        ? location.parent_location_id
        : location.parentLocationId;
    if (parentLocationId !== undefined && parentLocationId !== null) {
      data.parent_location_id = parentLocationId;
    }

    // Handle address
    if (location.address !== undefined) {
      data.address = location.address || "";
    }

    // Handle coordinates
    if (location.coordinates !== undefined) {
      data.coordinates = location.coordinates || "";
    }

    // Handle capacity
    if (location.capacity !== undefined) {
      data.capacity = location.capacity || 0;
    }

    // Handle area_sqm - check both camelCase and snake_case
    const areaSqm =
      location.area_sqm !== undefined ? location.area_sqm : location.areaSqm;
    if (areaSqm !== undefined) {
      data.area_sqm = areaSqm || 0;
    }

    // Handle status
    if (location.status !== undefined) {
      data.status = location.status || "active";
    }

    // Handle is_accessible - check both camelCase and snake_case
    const isAccessible =
      location.is_accessible !== undefined
        ? location.is_accessible
        : location.isAccessible;
    if (isAccessible !== undefined) {
      data.is_accessible = isAccessible !== false;
    }

    // Handle requires_access_control - check both camelCase and snake_case
    const requiresAccessControl =
      location.requires_access_control !== undefined
        ? location.requires_access_control
        : location.requiresAccessControl;
    if (requiresAccessControl !== undefined) {
      data.requires_access_control = requiresAccessControl || false;
    }

    // Handle contact_person - check both camelCase and snake_case
    const contactPerson =
      location.contact_person !== undefined
        ? location.contact_person
        : location.contactPerson;
    if (contactPerson !== undefined) {
      data.contact_person = contactPerson || "";
    }

    // Handle contact_phone - check both camelCase and snake_case
    const contactPhone =
      location.contact_phone !== undefined
        ? location.contact_phone
        : location.contactPhone;
    if (contactPhone !== undefined) {
      data.contact_phone = contactPhone || "";
    }

    // Handle contact_email - check both camelCase and snake_case
    const contactEmail =
      location.contact_email !== undefined
        ? location.contact_email
        : location.contactEmail;
    if (contactEmail !== undefined) {
      data.contact_email = contactEmail || "";
    }

    // Handle responsible_department - check both camelCase and snake_case
    const responsibleDepartment =
      location.responsible_department !== undefined
        ? location.responsible_department
        : location.responsibleDepartment;
    if (responsibleDepartment !== undefined) {
      data.responsible_department = responsibleDepartment || "";
    }

    // Handle is_active - check both camelCase and snake_case
    const isActive =
      location.is_active !== undefined ? location.is_active : location.isActive;
    if (isActive !== undefined) {
      data.is_active = isActive !== false;
    }

    return data;
  },
};

export const useLocations = (params = {}) => {
  return useQuery({
    queryKey: locationsKeys.lists(params),
    queryFn: async () => {
      const response = await locationsService.getLocations(params);
      // Handle paginated response format: {locations: [...], total: 0, page: 0, ...}
      if (response?.locations && Array.isArray(response.locations)) {
        return response.locations.map(locationsUtils.transformLocation);
      } else if (
        response?.data?.locations &&
        Array.isArray(response.data.locations)
      ) {
        return response.data.locations.map(locationsUtils.transformLocation);
      } else if (Array.isArray(response)) {
        return response.map(locationsUtils.transformLocation);
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data.map(locationsUtils.transformLocation);
      } else if (response?.results && Array.isArray(response.results)) {
        return response.results.map(locationsUtils.transformLocation);
      } else {
        console.error("Unexpected response format:", response);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useLocation = (slug) => {
  return useQuery({
    queryKey: locationsKeys.detail(slug),
    queryFn: async () => {
      const response = await locationsService.getLocation(slug);
      return locationsUtils.transformLocation(response);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData) => {
      const transformedData =
        locationsUtils.transformLocationForAPI(locationData);

      const response = await locationsService.createLocation(transformedData);
      return locationsUtils.transformLocation(response);
    },
    onSuccess: (data) => {
      // Get all existing location list queries and update them
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.findAll({
        queryKey: locationsKeys.all,
        exact: false,
      });

      allQueries.forEach((query) => {
        const queryKey = query.queryKey;
        // Only update "list" queries (skip detail, roots, etc.)
        if (queryKey.includes("list") && queryKey.length >= 3) {
          const currentData = query.state.data;
          if (Array.isArray(currentData)) {
            // Check if location already exists
            if (!currentData.some((loc) => loc.id === data.id)) {
              queryClient.setQueryData(queryKey, [...currentData, data]);
            }
          } else if (!currentData) {
            queryClient.setQueryData(queryKey, [data]);
          }
        }
      });

      // Optimistically update root locations cache if the new location is a root
      if (!data.parentLocationId && !data.parentId) {
        queryClient.setQueryData(locationsKeys.roots(), (oldData) => {
          if (!oldData || !Array.isArray(oldData)) return [data];
          // Check if already exists
          if (oldData.some((loc) => loc.id === data.id)) {
            return oldData;
          }
          return [...oldData, data];
        });
      }

      // Set the detail cache
      queryClient.setQueryData(locationsKeys.detail(data.slug), data);

      // Invalidate and refetch to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: locationsKeys.all });

      toast.success("Location created successfully!", {
        description: `Location "${data.name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Failed to create location:", error);
      toast.error("Failed to create location", {
        description:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "An error occurred while creating the location.",
      });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, locationData }) => {
      const transformedData =
        locationsUtils.transformLocationForAPI(locationData);
      const response = await locationsService.updateLocation(
        slug,
        transformedData
      );
      return locationsUtils.transformLocation(response);
    },
    onSuccess: (data, variables) => {
      // Update the specific location detail cache
      queryClient.setQueryData(locationsKeys.detail(variables.slug), data);

      // Get all existing location list queries and update them
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.findAll({
        queryKey: locationsKeys.all,
        exact: false,
      });

      allQueries.forEach((query) => {
        const queryKey = query.queryKey;
        // Only update "list" queries (skip detail, roots, etc.)
        if (queryKey.includes("list") && queryKey.length >= 3) {
          const currentData = query.state.data;
          if (Array.isArray(currentData)) {
            queryClient.setQueryData(
              queryKey,
              currentData.map((location) =>
                location.slug === variables.slug ? data : location
              )
            );
          }
        }
      });

      // Optimistically update the root locations cache
      queryClient.setQueryData(locationsKeys.roots(), (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;

        return oldData.map((location) =>
          location.slug === variables.slug ? data : location
        );
      });

      // Invalidate and refetch to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: locationsKeys.all });

      toast.success("Location updated successfully!", {
        description: `Location "${data.name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Failed to update location:", error);
      toast.error("Failed to update location", {
        description:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "An error occurred while updating the location.",
      });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await locationsService.deleteLocation(slug);
      return response.data || response;
    },
    onSuccess: (data, slug) => {
      queryClient.removeQueries({ queryKey: locationsKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: locationsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: locationsKeys.roots() });
      queryClient.invalidateQueries({ queryKey: locationsKeys.statistics() });
      toast.success("Location deleted successfully!", {
        description: "The location has been deleted.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete location:", error);
      toast.error("Failed to delete location", {
        description:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "An error occurred while deleting the location.",
      });
    },
  });
};

export const useRootLocations = () => {
  return useQuery({
    queryKey: locationsKeys.roots(),
    queryFn: async () => {
      const response = await locationsService.getRootLocations();
      if (Array.isArray(response)) {
        return response.map(locationsUtils.transformLocation);
      } else if (response?.locations && Array.isArray(response.locations)) {
        return response.locations.map(locationsUtils.transformLocation);
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data.map(locationsUtils.transformLocation);
      } else {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useLocationStatistics = () => {
  return useQuery({
    queryKey: locationsKeys.statistics(),
    queryFn: async () => {
      const response = await locationsService.getLocationStatistics();
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useMoveLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newParentId }) => {
      const response = await locationsService.moveLocation(id, newParentId);
      return locationsUtils.transformLocation(response);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: locationsKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: locationsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: locationsKeys.roots() });
      queryClient.invalidateQueries({
        queryKey: locationsKeys.hierarchy(variables.id),
      });
      toast.success("Location moved successfully!", {
        description: `Location "${data.name}" has been moved.`,
      });
    },
    onError: (error) => {
      console.error("Failed to move location:", error);
      toast.error("Failed to move location", {
        description:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "An error occurred while moving the location.",
      });
    },
  });
};

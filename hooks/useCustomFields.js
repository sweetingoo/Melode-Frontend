import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFieldsService } from "@/services/customFields";
import { toast } from "sonner";

// Query keys for custom field sections
export const customFieldSectionKeys = {
  all: ["custom-field-sections"],
  lists: () => [...customFieldSectionKeys.all, "list"],
  list: (params) => [...customFieldSectionKeys.lists(), params],
  details: () => [...customFieldSectionKeys.all, "detail"],
  detail: (id) => [...customFieldSectionKeys.details(), id],
  searches: () => [...customFieldSectionKeys.all, "search"],
  search: (searchData) => [...customFieldSectionKeys.searches(), searchData],
};

// Utility functions for data transformation
export const customFieldSectionUtils = {
  transformSection: (section) => ({
    id: section.id,
    sectionName: section.section_name,
    sectionDescription: section.section_description,
    entityType: section.entity_type,
    sortOrder: section.sort_order,
    organizationId: section.organization_id,
    isActive: section.is_active,
    createdAt: section.created_at,
    updatedAt: section.updated_at,
    // Additional computed fields for UI
    title:
      section.section_name
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()) || "Untitled Section",
    tag: section.entity_type
      ? section.entity_type.charAt(0).toUpperCase() +
        section.entity_type.slice(1)
      : "General",
    status: section.is_active ? "Active" : "Inactive",
    order: section.sort_order || 0,
  }),

  transformSectionForAPI: (section) => ({
    section_name: section.sectionName,
    section_description: section.sectionDescription,
    entity_type: section.entityType,
    sort_order: section.sortOrder || 0,
    organization_id: section.organizationId || 0,
    is_active: section.isActive !== undefined ? section.isActive : true,
  }),
};

// Get all custom field sections query
export const useCustomFieldSections = (params = {}) => {
  return useQuery({
    queryKey: customFieldSectionKeys.list(params),
    queryFn: async () => {
      const response = await customFieldsService.getCustomFieldSections(params);

      // Debug logging to see what we're getting
      console.log("Custom Fields API Response:", {
        response,
        params,
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        hasSections: !!response?.sections,
        hasDataSections: !!response?.data?.sections,
        type: typeof response,
        keys: response ? Object.keys(response) : "null",
      });

      // Handle the paginated response format: {sections: [...], total: 0, page: 0, ...}
      if (response?.sections && Array.isArray(response.sections)) {
        return response.sections;
      } else if (
        response?.data?.sections &&
        Array.isArray(response.data.sections)
      ) {
        return response.data.sections;
      } else if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        return response.results;
      } else {
        console.error("Unexpected response format:", response);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get custom field sections with pagination metadata
export const useCustomFieldSectionsPaginated = (params = {}) => {
  return useQuery({
    queryKey: customFieldSectionKeys.list({ ...params, paginated: true }),
    queryFn: async () => {
      const response = await customFieldsService.getCustomFieldSections(params);

      // Return the full paginated response
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single custom field section query
export const useCustomFieldSection = (id) => {
  return useQuery({
    queryKey: customFieldSectionKeys.detail(id),
    queryFn: async () => {
      const response = await customFieldsService.getCustomFieldSection(id);
      // Handle both direct object response and wrapped response
      return response.data || response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Search custom field sections query
export const useSearchCustomFieldSections = (searchData) => {
  return useQuery({
    queryKey: customFieldSectionKeys.search(searchData),
    queryFn: async () => {
      const response = await customFieldsService.searchCustomFieldSections(
        searchData
      );
      // Handle both direct array response and wrapped response
      return Array.isArray(response) ? response : response.data;
    },
    enabled: !!searchData && Object.keys(searchData).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create custom field section mutation
export const useCreateCustomFieldSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionData) => {
      const transformedData =
        customFieldSectionUtils.transformSectionForAPI(sectionData);
      const response = await customFieldsService.createCustomFieldSection(
        transformedData
      );
      return response.data || response;
    },
    onSuccess: (data) => {
      // Invalidate and refetch custom field sections
      queryClient.invalidateQueries({
        queryKey: customFieldSectionKeys.lists(),
      });

      toast.success("Custom field section created successfully!", {
        description: `Section "${data.section_name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Failed to create custom field section:", error);
      toast.error("Failed to create custom field section", {
        description:
          error.response?.data?.message ||
          "An error occurred while creating the section.",
      });
    },
  });
};

// Update custom field section mutation
export const useUpdateCustomFieldSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sectionData }) => {
      console.log("Update Section - Input:", { id, sectionData });
      const transformedData =
        customFieldSectionUtils.transformSectionForAPI(sectionData);
      console.log("Update Section - Transformed:", transformedData);
      const response = await customFieldsService.updateCustomFieldSection(
        id,
        transformedData
      );
      console.log("Update Section - Response:", response);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      // Update the specific section in cache
      queryClient.setQueryData(
        customFieldSectionKeys.detail(variables.id),
        data
      );

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: customFieldSectionKeys.lists(),
      });

      toast.success("Custom field section updated successfully!", {
        description: `Section "${data.section_name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Failed to update custom field section:", error);
      toast.error("Failed to update custom field section", {
        description:
          error.response?.data?.message ||
          "An error occurred while updating the section.",
      });
    },
  });
};

// Delete custom field section mutation (soft delete)
export const useDeleteCustomFieldSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await customFieldsService.deleteCustomFieldSection(id);
      return response.data || response;
    },
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: customFieldSectionKeys.detail(id),
      });

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: customFieldSectionKeys.lists(),
      });

      toast.success("Custom field section deleted successfully!", {
        description: "The section has been soft deleted.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete custom field section:", error);
      toast.error("Failed to delete custom field section", {
        description:
          error.response?.data?.message ||
          "An error occurred while deleting the section.",
      });
    },
  });
};

// Hard delete custom field section mutation
export const useHardDeleteCustomFieldSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await customFieldsService.hardDeleteCustomFieldSection(
        id
      );
      return response.data || response;
    },
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: customFieldSectionKeys.detail(id),
      });

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: customFieldSectionKeys.lists(),
      });

      toast.success("Custom field section permanently deleted!", {
        description: "The section has been permanently removed.",
      });
    },
    onError: (error) => {
      console.error("Failed to hard delete custom field section:", error);
      toast.error("Failed to permanently delete custom field section", {
        description:
          error.response?.data?.message ||
          "An error occurred while permanently deleting the section.",
      });
    },
  });
};

// Preview hooks
export const useCustomFieldsHierarchy = (entityType, entityId = 1) => {
  return useQuery({
    queryKey: [
      ...customFieldSectionKeys.all,
      "hierarchy",
      entityType,
      entityId,
    ],
    queryFn: async () => {
      const response = await customFieldsService.getCustomFieldsHierarchy(
        entityType,
        entityId
      );
      return response.data || response;
    },
    enabled: !!entityType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCustomFieldsPreview = (entityType, entityId = 1) => {
  return useQuery({
    queryKey: [...customFieldSectionKeys.all, "preview", entityType, entityId],
    queryFn: async () => {
      const response = await customFieldsService.getCustomFieldsPreview(
        entityType,
        entityId
      );
      return response.data || response;
    },
    enabled: !!entityType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

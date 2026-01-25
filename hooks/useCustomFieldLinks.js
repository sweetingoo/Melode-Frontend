import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFieldLinksService } from "@/services/customFieldLinks";
import { toast } from "sonner";

// Query keys
export const customFieldLinksKeys = {
  all: ["custom-field-links"],
  lists: () => [...customFieldLinksKeys.all, "list"],
  list: (filters) => [...customFieldLinksKeys.lists(), { filters }],
  details: () => [...customFieldLinksKeys.all, "detail"],
  detail: (slug) => [...customFieldLinksKeys.details(), slug],
  fieldLinks: (fieldId, entityType) => [
    ...customFieldLinksKeys.all,
    "field",
    fieldId,
    entityType,
  ],
};

// Get all custom field links
export const useCustomFieldLinks = (params = {}) => {
  return useQuery({
    queryKey: customFieldLinksKeys.list(params),
    queryFn: async () => {
      const response = await customFieldLinksService.getCustomFieldLinks(params);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get custom field link by slug
export const useCustomFieldLink = (slug, options = {}) => {
  return useQuery({
    queryKey: customFieldLinksKeys.detail(slug),
    queryFn: async () => {
      return await customFieldLinksService.getCustomFieldLink(slug);
    },
    enabled: !!slug && (options.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get links for a specific field
export const useFieldLinks = (customFieldId, entityType, options = {}) => {
  return useQuery({
    queryKey: customFieldLinksKeys.fieldLinks(customFieldId, entityType),
    queryFn: async () => {
      return await customFieldLinksService.getLinksForField(
        customFieldId,
        entityType
      );
    },
    enabled:
      !!customFieldId &&
      !!entityType &&
      (options.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Create custom field link mutation
export const useCreateCustomFieldLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkData) => {
      return await customFieldLinksService.createCustomFieldLink(linkData);
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: customFieldLinksKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: customFieldLinksKeys.fieldLinks(
          variables.custom_field_id,
          variables.entity_type
        ),
      });
      toast.success("Field visibility link created successfully!");
    },
    onError: (error) => {
      console.error("Create custom field link error:", error);
      toast.error("Failed to create field visibility link", {
        description:
          error.response?.data?.detail ||
          error.message ||
          "An error occurred",
      });
    },
  });
};

// Update custom field link mutation
export const useUpdateCustomFieldLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, linkData }) => {
      return await customFieldLinksService.updateCustomFieldLink(
        slug,
        linkData
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: customFieldLinksKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: customFieldLinksKeys.detail(variables.slug),
      });
      if (variables.linkData.custom_field_id && variables.linkData.entity_type) {
        queryClient.invalidateQueries({
          queryKey: customFieldLinksKeys.fieldLinks(
            variables.linkData.custom_field_id,
            variables.linkData.entity_type
          ),
        });
      }
      toast.success("Field visibility link updated successfully!");
    },
    onError: (error) => {
      console.error("Update custom field link error:", error);
      toast.error("Failed to update field visibility link", {
        description:
          error.response?.data?.detail ||
          error.message ||
          "An error occurred",
      });
    },
  });
};

// Delete custom field link mutation
export const useDeleteCustomFieldLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      return await customFieldLinksService.deleteCustomFieldLink(slug);
    },
    onSuccess: (data, variables) => {
      // Invalidate all field links queries - the link will be removed from all field queries
      queryClient.invalidateQueries({
        queryKey: customFieldLinksKeys.all,
      });
      toast.success("Field visibility link deleted successfully!");
    },
    onError: (error) => {
      console.error("Delete custom field link error:", error);
      toast.error("Failed to delete field visibility link", {
        description:
          error.response?.data?.detail ||
          error.message ||
          "An error occurred",
      });
    },
  });
};

// Search custom field links mutation
export const useSearchCustomFieldLinks = () => {
  return useMutation({
    mutationFn: async (searchData) => {
      return await customFieldLinksService.searchCustomFieldLinks(searchData);
    },
    onError: (error) => {
      console.error("Search custom field links error:", error);
      toast.error("Failed to search field visibility links", {
        description:
          error.response?.data?.detail ||
          error.message ||
          "An error occurred",
      });
    },
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFieldSectionLinksService } from "@/services/customFieldSectionLinks";
import { toast } from "sonner";

// Query keys
export const customFieldSectionLinksKeys = {
  all: ["custom-field-section-links"],
  lists: () => [...customFieldSectionLinksKeys.all, "list"],
  list: (filters) => [...customFieldSectionLinksKeys.lists(), { filters }],
  details: () => [...customFieldSectionLinksKeys.all, "detail"],
  detail: (slug) => [...customFieldSectionLinksKeys.details(), slug],
  sectionLinks: (sectionId, entityType) => [
    ...customFieldSectionLinksKeys.all,
    "section",
    sectionId,
    entityType,
  ],
};

// Get all custom field section links
export const useCustomFieldSectionLinks = (params = {}) => {
  return useQuery({
    queryKey: customFieldSectionLinksKeys.list(params),
    queryFn: async () => {
      const response = await customFieldSectionLinksService.getCustomFieldSectionLinks(params);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get custom field section link by slug
export const useCustomFieldSectionLink = (slug, options = {}) => {
  return useQuery({
    queryKey: customFieldSectionLinksKeys.detail(slug),
    queryFn: async () => {
      return await customFieldSectionLinksService.getCustomFieldSectionLink(slug);
    },
    enabled: !!slug && (options.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Get links for a specific section
export const useSectionLinks = (sectionId, entityType, options = {}) => {
  return useQuery({
    queryKey: customFieldSectionLinksKeys.sectionLinks(sectionId, entityType),
    queryFn: async () => {
      return await customFieldSectionLinksService.getLinksForSection(
        sectionId,
        entityType
      );
    },
    enabled:
      !!sectionId &&
      !!entityType &&
      (options.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Create custom field section link mutation
export const useCreateCustomFieldSectionLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkData) => {
      return await customFieldSectionLinksService.createCustomFieldSectionLink(linkData);
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: customFieldSectionLinksKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: customFieldSectionLinksKeys.sectionLinks(
          variables.section_id,
          variables.entity_type
        ),
      });
      toast.success("Section visibility link created successfully!");
    },
    onError: (error) => {
      console.error("Create custom field section link error:", error);
      toast.error("Failed to create section visibility link", {
        description:
          error.response?.data?.detail ||
          error.message ||
          "An error occurred",
      });
    },
  });
};

// Update custom field section link mutation
export const useUpdateCustomFieldSectionLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, linkData }) => {
      return await customFieldSectionLinksService.updateCustomFieldSectionLink(
        slug,
        linkData
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: customFieldSectionLinksKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: customFieldSectionLinksKeys.detail(variables.slug),
      });
      if (variables.linkData.section_id && variables.linkData.entity_type) {
        queryClient.invalidateQueries({
          queryKey: customFieldSectionLinksKeys.sectionLinks(
            variables.linkData.section_id,
            variables.linkData.entity_type
          ),
        });
      }
      toast.success("Section visibility link updated successfully!");
    },
    onError: (error) => {
      console.error("Update custom field section link error:", error);
      toast.error("Failed to update section visibility link", {
        description:
          error.response?.data?.detail ||
          error.message ||
          "An error occurred",
      });
    },
  });
};

// Delete custom field section link mutation
export const useDeleteCustomFieldSectionLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      return await customFieldSectionLinksService.deleteCustomFieldSectionLink(slug);
    },
    onSuccess: (data, variables) => {
      // Invalidate all section links queries
      queryClient.invalidateQueries({
        queryKey: customFieldSectionLinksKeys.all,
      });
      toast.success("Section visibility link deleted successfully!");
    },
    onError: (error) => {
      console.error("Delete custom field section link error:", error);
      toast.error("Failed to delete section visibility link", {
        description:
          error.response?.data?.detail ||
          error.message ||
          "An error occurred",
      });
    },
  });
};

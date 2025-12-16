import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFieldsFieldsService } from "@/services/customFieldsFields";
import { toast } from "sonner";

// Query keys for custom fields
export const customFieldsKeys = {
  all: ["custom-fields"],
  lists: () => [...customFieldsKeys.all, "list"],
  list: (params) => [...customFieldsKeys.lists(), params],
  details: () => [...customFieldsKeys.all, "detail"],
  detail: (id) => [...customFieldsKeys.details(), id],
  searches: () => [...customFieldsKeys.all, "search"],
  search: (searchData) => [...customFieldsKeys.searches(), searchData],
};

// Utility functions for data transformation
export const customFieldsUtils = {
  transformField: (field) => ({
    id: field.id,
    fieldName: field.field_name,
    fieldLabel: field.field_label,
    fieldDescription: field.field_description,
    fieldType: field.field_type,
    isRequired: field.is_required,
    isUnique: field.is_unique,
    maxLength: field.max_length,
    minValue: field.min_value,
    maxValue: field.max_value,
    fieldOptions: field.field_options,
    validationRules: field.validation_rules,
    relationshipConfig: field.relationship_config,
    entityType: field.entity_type,
    sortOrder: field.sort_order,
    organizationId: field.organization_id || field.organisation_id,
    sectionId: field.section_id,
    // Additional computed fields for UI
    name: field.field_label || field.field_name || "Untitled Field",
    type: field.field_type || "Text",
    required: field.is_required || false,
    unique: field.is_unique || false,
    section: field.section_name || "General", // This might need to be fetched separately
  }),

  transformFieldForAPI: (field) => ({
    field_name: field.field_name || field.fieldName,
    field_label: field.field_label || field.fieldLabel,
    field_description: field.field_description || field.fieldDescription,
    field_type: field.field_type || field.fieldType,
    is_required: field.is_required !== undefined ? field.is_required : (field.isRequired || false),
    is_unique: field.is_unique !== undefined ? field.is_unique : (field.isUnique || false),
    max_length: field.max_length !== undefined ? field.max_length : (field.maxLength || null),
    min_value: field.min_value !== undefined ? field.min_value : (field.minValue || null),
    max_value: field.max_value !== undefined ? field.max_value : (field.maxValue || null),
    field_options: field.field_options || field.fieldOptions || {},
    validation_rules: field.validation_rules || field.validationRules || {},
    relationship_config:
      (field.relationship_config && Object.keys(field.relationship_config).length > 0) ||
        (field.relationshipConfig && Object.keys(field.relationshipConfig).length > 0)
        ? (field.relationship_config || field.relationshipConfig)
        : null, // Send null instead of empty object
    entity_type: field.entity_type || field.entityType,
    sort_order: field.sort_order !== undefined ? field.sort_order : (field.sortOrder || 0),
    organization_id: field.organization_id !== undefined ? field.organization_id : (field.organisation_id !== undefined ? field.organisation_id : (field.organizationId !== undefined ? field.organizationId : (field.organisationId !== undefined ? field.organisationId : 0))),
    section_id: field.section_id !== undefined ? field.section_id : (field.sectionId || 0),
    is_active: field.is_active !== undefined ? field.is_active : (field.isActive !== undefined ? field.isActive : true),
  }),
};

// Get all custom fields query
export const useCustomFields = (params = {}) => {
  return useQuery({
    queryKey: customFieldsKeys.list(params),
    queryFn: async () => {
      const response = await customFieldsFieldsService.getCustomFields(params);

      // Debug logging to see what we're getting
      console.log("Custom Fields API Response:", {
        response,
        params,
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        hasFields: !!response?.fields,
        hasDataFields: !!response?.data?.fields,
        type: typeof response,
        keys: response ? Object.keys(response) : "null",
      });

      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response?.fields && Array.isArray(response.fields)) {
        return response.fields;
      } else if (
        response?.data?.fields &&
        Array.isArray(response.data.fields)
      ) {
        return response.data.fields;
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

// Get custom fields with pagination metadata
export const useCustomFieldsPaginated = (params = {}) => {
  return useQuery({
    queryKey: customFieldsKeys.list({ ...params, paginated: true }),
    queryFn: async () => {
      const response = await customFieldsFieldsService.getCustomFields(params);

      // Return the full paginated response
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single custom field query
export const useCustomField = (id) => {
  return useQuery({
    queryKey: customFieldsKeys.detail(id),
    queryFn: async () => {
      const response = await customFieldsFieldsService.getCustomField(id);
      // Handle both direct object response and wrapped response
      return response.data || response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Search custom fields query
export const useSearchCustomFields = (searchData) => {
  return useQuery({
    queryKey: customFieldsKeys.search(searchData),
    queryFn: async () => {
      const response = await customFieldsFieldsService.searchCustomFields(
        searchData
      );
      // Handle both direct array response and wrapped response
      return Array.isArray(response) ? response : response.data;
    },
    enabled: !!searchData && Object.keys(searchData).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create custom field mutation
export const useCreateCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldData) => {
      const transformedData = customFieldsUtils.transformFieldForAPI(fieldData);
      const response = await customFieldsFieldsService.createCustomField(
        transformedData
      );
      return response.data || response;
    },
    onSuccess: (data) => {
      // Invalidate and refetch custom fields
      queryClient.invalidateQueries({
        queryKey: customFieldsKeys.lists(),
      });

      toast.success("Custom field created successfully!", {
        description: `Field "${data.field_label}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Failed to create custom field:", error);
      toast.error("Failed to create custom field", {
        description:
          error.response?.data?.message ||
          "An error occurred while creating the field.",
      });
    },
  });
};

// Update custom field mutation
export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fieldData }) => {
      console.log("Update Field - Input:", { id, fieldData });
      const transformedData = customFieldsUtils.transformFieldForAPI(fieldData);
      console.log("Update Field - Transformed:", transformedData);
      const response = await customFieldsFieldsService.updateCustomField(
        id,
        transformedData
      );
      console.log("Update Field - Response:", response);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      // Update the specific field in cache
      queryClient.setQueryData(customFieldsKeys.detail(variables.id), data);

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: customFieldsKeys.lists(),
      });

      toast.success("Custom field updated successfully!", {
        description: `Field "${data.field_label}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Failed to update custom field:", error);
      toast.error("Failed to update custom field", {
        description:
          error.response?.data?.message ||
          "An error occurred while updating the field.",
      });
    },
  });
};

// Delete custom field mutation (soft delete)
export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await customFieldsFieldsService.deleteCustomField(id);
      return response.data || response;
    },
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: customFieldsKeys.detail(id),
      });

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: customFieldsKeys.lists(),
      });

      toast.success("Custom field deleted successfully!", {
        description: "The field has been soft deleted.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete custom field:", error);
      toast.error("Failed to delete custom field", {
        description:
          error.response?.data?.message ||
          "An error occurred while deleting the field.",
      });
    },
  });
};

// Hard delete custom field mutation
export const useHardDeleteCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await customFieldsFieldsService.hardDeleteCustomField(
        id
      );
      return response.data || response;
    },
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: customFieldsKeys.detail(id),
      });

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: customFieldsKeys.lists(),
      });

      toast.success("Custom field permanently deleted!", {
        description: "The field has been permanently removed.",
      });
    },
    onError: (error) => {
      console.error("Failed to hard delete custom field:", error);
      toast.error("Failed to permanently delete custom field", {
        description:
          error.response?.data?.message ||
          "An error occurred while permanently deleting the field.",
      });
    },
  });
};

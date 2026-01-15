import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { complianceService } from "../services/compliance";
import { profileService } from "../services/profile";

// Query keys
export const complianceKeys = {
  all: ["compliance"],
  entity: (entityType, entitySlug, roleSlug, assetTypeSlug) => [
    ...complianceKeys.all,
    "entity",
    entityType,
    entitySlug,
    roleSlug,
    assetTypeSlug,
  ],
  history: (fieldSlug, entityType, entitySlug) => [
    ...complianceKeys.all,
    "history",
    fieldSlug,
    entityType,
    entitySlug,
  ],
  expiring: (daysAhead) => [...complianceKeys.all, "expiring", daysAhead],
  roleFields: (roleSlug) => [...complianceKeys.all, "role", roleSlug],
  assetTypeFields: (assetTypeSlug) => [...complianceKeys.all, "asset-type", assetTypeSlug],
};

// Get compliance status for an entity
export const useEntityCompliance = (entityType, entitySlug, roleSlug = null, assetTypeSlug = null) => {
  const isEnabled = !!entityType && !!entitySlug;
  
  console.log("useEntityCompliance hook called:", {
    entityType,
    entitySlug,
    roleSlug,
    assetTypeSlug,
    isEnabled,
  });

  return useQuery({
    queryKey: complianceKeys.entity(entityType, entitySlug, roleSlug, assetTypeSlug),
    queryFn: async () => {
      console.log("useEntityCompliance queryFn executing with:", {
        entityType,
        entitySlug,
        roleSlug,
        assetTypeSlug,
      });
      if (!entityType || !entitySlug) {
        throw new Error("Entity type and slug are required");
      }
      const response = await complianceService.getEntityCompliance(entityType, entitySlug, roleSlug, assetTypeSlug);
      console.log("useEntityCompliance response:", response);
      return response;
    },
    enabled: isEnabled,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
  });
};

// Upload compliance document
// Uses generic upload endpoint first, then stores file_slug reference
export const useUploadCompliance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uploadData) => {
      let fileSlug = null;
      
      // If file is provided, upload it using the generic upload endpoint first
      if (uploadData.file) {
        const uploadResult = await profileService.uploadFile(uploadData.file);
        // The upload endpoint returns file with slug or id (file_slug)
        fileSlug = uploadResult.slug || uploadResult.id || uploadResult.file_slug;
        
        if (!fileSlug) {
          throw new Error("File upload failed: No file reference returned");
        }
      }

      // Now send the compliance data with file_slug instead of file
      const complianceData = {
        ...uploadData,
        fileSlug: fileSlug,
      };
      // Remove file from data - we only send file_slug
      delete complianceData.file;

      const response = await complianceService.uploadComplianceDocument(complianceData);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate entity compliance to refetch
      queryClient.invalidateQueries({
        queryKey: complianceKeys.entity(variables.entityType, variables.entitySlug),
      });

      toast.success("Compliance document uploaded successfully!", {
        description: variables.requiresApproval
          ? "Your document is pending approval."
          : "Your document has been uploaded.",
      });
    },
    onError: (error) => {
      console.error("Failed to upload compliance document:", error);
      toast.error("Upload failed", {
        description: error.response?.data?.detail || "Failed to upload compliance document. Please try again.",
      });
    },
  });
};

// Approve/decline compliance document
export const useApproveCompliance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ valueSlug, approved, backendNotes }) => {
      const response = await complianceService.approveComplianceDocument(valueSlug, approved, backendNotes);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate all compliance queries to refetch
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });

      toast.success(variables.approved ? "Compliance document approved" : "Compliance document declined", {
        description: variables.approved
          ? "The compliance document has been approved."
          : "The compliance document has been declined.",
      });
    },
    onError: (error) => {
      console.error("Failed to approve/decline compliance document:", error);
      toast.error("Action failed", {
        description: error.response?.data?.detail || "Failed to process approval. Please try again.",
      });
    },
  });
};

// Renew compliance field
// Uses generic upload endpoint first, then stores file_slug reference
export const useRenewCompliance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ valueSlug, renewalData }) => {
      let fileSlug = null;
      
      // If file is provided, upload it using the generic upload endpoint first
      if (renewalData.file) {
        const uploadResult = await profileService.uploadFile(renewalData.file);
        // The upload endpoint returns file with slug or id (file_slug)
        fileSlug = uploadResult.slug || uploadResult.id || uploadResult.file_slug;
        
        if (!fileSlug) {
          throw new Error("File upload failed: No file reference returned");
        }
      }

      // Now send the renewal data with file_slug instead of file
      const renewalDataWithSlug = {
        ...renewalData,
        fileSlug: fileSlug,
      };
      // Remove file from data - we only send file_slug
      delete renewalDataWithSlug.file;

      const response = await complianceService.renewComplianceField(valueSlug, renewalDataWithSlug);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate all compliance queries to refetch
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });

      toast.success("Compliance field renewed successfully!", {
        description: "Your compliance field has been renewed.",
      });
    },
    onError: (error) => {
      console.error("Failed to renew compliance field:", error);
      toast.error("Renewal failed", {
        description: error.response?.data?.detail || "Failed to renew compliance field. Please try again.",
      });
    },
  });
};

// Get compliance history
export const useComplianceHistory = (fieldSlug, entityType, entitySlug, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: [...complianceKeys.history(fieldSlug, entityType, entitySlug), page, perPage],
    queryFn: async () => {
      if (!fieldSlug || !entityType || !entitySlug) {
        throw new Error("All parameters are required for compliance history");
      }
      const response = await complianceService.getComplianceHistory(fieldSlug, entityType, entitySlug, page, perPage);
      return response;
    },
    enabled: !!fieldSlug && !!entityType && !!entitySlug && fieldSlug !== "",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get expiring compliance items (admin only)
export const useExpiringCompliance = (daysAhead = 30, page = 1, perPage = 50, filters = {}) => {
  return useQuery({
    queryKey: [...complianceKeys.expiring(daysAhead), page, perPage, filters],
    queryFn: async () => {
      const response = await complianceService.getExpiringCompliance(daysAhead, page, perPage, filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Prevent double API calls on mount (e.g., from React StrictMode)
  });
};

// Get pending compliance approvals (admin only)
export const usePendingApprovals = (page = 1, perPage = 50, filters = {}) => {
  return useQuery({
    queryKey: [...complianceKeys.all, "pending", page, perPage, filters],
    queryFn: async () => {
      const response = await complianceService.getPendingApprovals(page, perPage, filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Prevent double API calls on mount (e.g., from React StrictMode)
  });
};

// Link compliance field to role
export const useLinkComplianceToRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fieldSlug, roleSlug, isRequired }) => {
      console.log("useLinkComplianceToRole - Linking:", { fieldSlug, roleSlug, isRequired });
      const response = await complianceService.linkComplianceToRole(fieldSlug, roleSlug, isRequired);
      console.log("useLinkComplianceToRole - Response:", response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log("useLinkComplianceToRole - Success:", { data, variables });
      // Invalidate role fields query
      queryClient.invalidateQueries({ queryKey: complianceKeys.roleFields(variables.roleSlug) });
      // Also invalidate compliance links for the field
      queryClient.invalidateQueries({ queryKey: ["compliance-links", variables.fieldSlug] });

      toast.success("Compliance field linked to role", {
        description: "The compliance field has been successfully linked to the role.",
      });
    },
    onError: (error) => {
      console.error("Failed to link compliance to role:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("Link failed", {
        description: error.response?.data?.detail || "Failed to link compliance field to role. Please try again.",
      });
    },
  });
};

// Link compliance field to asset type
export const useLinkComplianceToAssetType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fieldSlug, assetTypeSlug, isRequired }) => {
      console.log("useLinkComplianceToAssetType - Linking:", { fieldSlug, assetTypeSlug, isRequired });
      const response = await complianceService.linkComplianceToAssetType(fieldSlug, assetTypeSlug, isRequired);
      console.log("useLinkComplianceToAssetType - Response:", response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log("useLinkComplianceToAssetType - Success:", { data, variables });
      // Invalidate asset type fields query
      queryClient.invalidateQueries({ queryKey: complianceKeys.assetTypeFields(variables.assetTypeSlug) });
      // Also invalidate compliance links for the field
      queryClient.invalidateQueries({ queryKey: ["compliance-links", variables.fieldSlug] });

      toast.success("Compliance field linked to asset type", {
        description: "The compliance field has been successfully linked to the asset type.",
      });
    },
    onError: (error) => {
      console.error("Failed to link compliance to asset type:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("Link failed", {
        description: error.response?.data?.detail || "Failed to link compliance field to asset type. Please try again.",
      });
    },
  });
};

// Get compliance fields for role
export const useComplianceFieldsForRole = (roleSlug) => {
  return useQuery({
    queryKey: complianceKeys.roleFields(roleSlug),
    queryFn: async () => {
      if (!roleSlug) {
        throw new Error("Role slug is required");
      }
      const response = await complianceService.getComplianceFieldsForRole(roleSlug);
      return response;
    },
    enabled: !!roleSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get compliance fields for asset type
export const useComplianceFieldsForAssetType = (assetTypeSlug) => {
  return useQuery({
    queryKey: complianceKeys.assetTypeFields(assetTypeSlug),
    queryFn: async () => {
      if (!assetTypeSlug) {
        throw new Error("Asset type slug is required");
      }
      const response = await complianceService.getComplianceFieldsForAssetType(assetTypeSlug);
      return response;
    },
    enabled: !!assetTypeSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

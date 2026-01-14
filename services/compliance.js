import { api } from "./api-client";

export const complianceService = {
  // Get compliance status for an entity
  getEntityCompliance: async (entityType, entitySlug, roleSlug = null, assetTypeSlug = null) => {
    try {
      const params = new URLSearchParams();
      if (roleSlug) params.append("role_slug", roleSlug);
      if (assetTypeSlug) params.append("asset_type_slug", assetTypeSlug);

      const queryString = params.toString();
      const url = `/compliance/entities/${entityType}/${entitySlug}${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return response.data || response;
    } catch (error) {
      console.error("Get entity compliance failed:", error);
      throw error;
    }
  },

  // Upload compliance document
  // Note: File should be uploaded separately using the generic upload endpoint
  // This endpoint expects file_slug (file reference ID) instead of the file itself
  uploadComplianceDocument: async (uploadData) => {
    try {
      const formData = new FormData();
      formData.append("field_slug", uploadData.fieldSlug);
      formData.append("entity_type", uploadData.entityType);
      formData.append("entity_slug", uploadData.entitySlug);
      if (uploadData.fileSlug) {
        formData.append("file_slug", uploadData.fileSlug);
      }
      if (uploadData.expiryDate) {
        formData.append("expiry_date", uploadData.expiryDate);
      }
      if (uploadData.renewalDate) {
        formData.append("renewal_date", uploadData.renewalDate);
      }
      if (uploadData.notes) {
        formData.append("notes", uploadData.notes);
      }
      if (uploadData.subFieldValues) {
        formData.append("sub_field_values", JSON.stringify(uploadData.subFieldValues));
      }

      const response = await api.post("/compliance/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data || response;
    } catch (error) {
      console.error("Upload compliance document failed:", error);
      throw error;
    }
  },

  // Approve compliance document
  approveComplianceDocument: async (valueSlug, approved, backendNotes = null) => {
    try {
      const response = await api.post(`/compliance/${valueSlug}/approve`, {
        approved,
        backend_notes: backendNotes,
      });
      return response.data || response;
    } catch (error) {
      console.error("Approve compliance document failed:", error);
      throw error;
    }
  },

  // Renew compliance field
  // Note: File should be uploaded separately using the generic upload endpoint
  // This endpoint expects file_slug (file reference ID) instead of the file itself
  renewComplianceField: async (valueSlug, renewalData) => {
    try {
      const formData = new FormData();
      if (renewalData.fileSlug) {
        formData.append("file_slug", renewalData.fileSlug);
      }
      if (renewalData.expiryDate) {
        formData.append("expiry_date", renewalData.expiryDate);
      }
      if (renewalData.renewalDate) {
        formData.append("renewal_date", renewalData.renewalDate);
      }
      if (renewalData.notes) {
        formData.append("notes", renewalData.notes);
      }

      const response = await api.post(`/compliance/${valueSlug}/renew`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data || response;
    } catch (error) {
      console.error("Renew compliance field failed:", error);
      throw error;
    }
  },

  // Get compliance history
  getComplianceHistory: async (fieldSlug, entityType, entitySlug, page = 1, perPage = 20) => {
    try {
      const params = new URLSearchParams({
        field_slug: fieldSlug,
        entity_type: entityType,
        entity_slug: entitySlug,
        page: page.toString(),
        per_page: perPage.toString(),
      });
      const response = await api.get(`/compliance/history?${params.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error("Get compliance history failed:", error);
      throw error;
    }
  },

  // Get expiring compliance items (admin only)
  getExpiringCompliance: async (daysAhead = 30, page = 1, perPage = 50) => {
    try {
      const params = new URLSearchParams({
        days_ahead: daysAhead.toString(),
        page: page.toString(),
        per_page: perPage.toString(),
      });
      const response = await api.get(`/compliance/expiring?${params.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error("Get expiring compliance failed:", error);
      throw error;
    }
  },

  // Get pending compliance approvals (admin only)
  getPendingApprovals: async (page = 1, perPage = 50) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      const response = await api.get(`/compliance/pending?${params.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error("Get pending approvals failed:", error);
      throw error;
    }
  },

  // Link compliance field to role
  linkComplianceToRole: async (fieldSlug, roleSlug, isRequired = false) => {
    try {
      const response = await api.post("/compliance/links/role", {
        custom_field_slug: fieldSlug,
        link_type: "role",
        link_slug: roleSlug,
        is_required: isRequired,
      });
      return response.data || response;
    } catch (error) {
      console.error("Link compliance to role failed:", error);
      throw error;
    }
  },

  // Link compliance field to asset type
  linkComplianceToAssetType: async (fieldSlug, assetTypeSlug, isRequired = false) => {
    try {
      const response = await api.post("/compliance/links/asset-type", {
        custom_field_slug: fieldSlug,
        link_type: "asset_type",
        link_slug: assetTypeSlug,
        is_required: isRequired,
      });
      return response.data || response;
    } catch (error) {
      console.error("Link compliance to asset type failed:", error);
      throw error;
    }
  },

  // Get compliance fields for role
  getComplianceFieldsForRole: async (roleSlug) => {
    try {
      const response = await api.get(`/compliance/links/role/${roleSlug}`);
      return response.data || response;
    } catch (error) {
      console.error("Get compliance fields for role failed:", error);
      throw error;
    }
  },

  // Get compliance fields for asset type
  getComplianceFieldsForAssetType: async (assetTypeSlug) => {
    try {
      const response = await api.get(`/compliance/links/asset-type/${assetTypeSlug}`);
      return response.data || response;
    } catch (error) {
      console.error("Get compliance fields for asset type failed:", error);
      throw error;
    }
  },

  // Get links for a specific compliance field
  getComplianceLinksForField: async (fieldSlug) => {
    try {
      const response = await api.get(`/compliance/links/field/${fieldSlug}`);
      return response.data || response;
    } catch (error) {
      console.error("Get compliance links for field failed:", error);
      throw error;
    }
  },

  // Bulk update compliance field links
  updateComplianceFieldLinks: async (fieldSlug, roleSlugs, assetTypeSlugs, roleRequiredFlags, assetTypeRequiredFlags) => {
    try {
      const response = await api.put(`/compliance/links/field/${fieldSlug}`, {
        field_slug: fieldSlug,
        role_slugs: roleSlugs,
        asset_type_slugs: assetTypeSlugs,
        role_required_flags: roleRequiredFlags,
        asset_type_required_flags: assetTypeRequiredFlags,
      });
      return response.data || response;
    } catch (error) {
      console.error("Update compliance field links failed:", error);
      throw error;
    }
  },
};

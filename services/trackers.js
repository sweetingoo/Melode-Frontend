import { api } from "./api-client";
import { generateSlug } from "../utils/slug";

// Helper function to slugify form_name (only alphanumeric, hyphens, underscores)
const slugifyFormName = (name) => {
  if (!name) return "";
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_\-]/g, "") // Remove special characters except hyphens and underscores
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/-{2,}/g, "-") // Replace multiple hyphens with single
    .replace(/^[_\-\s]+|[_\-\s]+$/g, ""); // Remove leading/trailing underscores/hyphens
};

// Helper functions to transform between tracker format and form format
const transformTrackerToForm = (trackerData) => {
  // Get the name/title - prefer name, then form_title, then form_name
  const name = trackerData.name || trackerData.form_title || trackerData.form_name || "";
  
  // Ensure tracker_config (including list_view_fields) is preserved when transforming to form_config
  const trackerConfig = trackerData.tracker_config || trackerData.form_config || {};
  
  // Transform tracker data to form data format
  const formData = {
    // form_name must be slugified (alphanumeric, hyphens, underscores only)
    form_name: trackerData.form_name 
      ? slugifyFormName(trackerData.form_name) 
      : slugifyFormName(name),
    // form_title can have spaces and special characters
    form_title: name || trackerData.form_title || trackerData.form_name || "",
    form_description: trackerData.description || trackerData.form_description,
    form_type: trackerData.form_type || "general", // Use "general" as default form type
    // Preserve entire tracker_config including list_view_fields
    form_config: trackerConfig,
    form_fields: trackerData.tracker_fields || trackerData.form_fields || { fields: [] },
    access_config: trackerData.access_config || {},
    is_active: trackerData.is_active !== undefined ? trackerData.is_active : true,
    is_tracker: true, // Always set to true for trackers
    organization_id: trackerData.organization_id,
    // Assignment fields
    assigned_to_role_id: trackerData.assigned_to_role_id,
    assigned_user_ids: trackerData.assigned_user_ids,
    create_individual_assignments: trackerData.create_individual_assignments,
  };

  // Remove undefined fields
  Object.keys(formData).forEach((key) => {
    if (formData[key] === undefined) {
      delete formData[key];
    }
  });

  return formData;
};

const transformFormToTracker = (formData) => {
  // Transform form data back to tracker format for frontend
  // Ensure form_config is properly mapped to tracker_config, preserving all properties including list_view_fields
  const trackerConfig = formData.form_config || formData.tracker_config || {};
  
  return {
    id: formData.id,
    name: formData.form_title || formData.form_name,
    slug: formData.slug || formData.form_name,
    description: formData.form_description,
    form_type: formData.form_type,
    tracker_config: trackerConfig, // Preserve all config including list_view_fields
    tracker_fields: formData.form_fields || { fields: [] },
    access_config: formData.access_config || {},
    is_active: formData.is_active,
    organization_id: formData.organization_id,
    created_at: formData.created_at,
    updated_at: formData.updated_at,
    // Assignment fields
    assigned_to_role_id: formData.assigned_to_role_id,
    assigned_user_ids: formData.assigned_user_ids,
    create_individual_assignments: formData.create_individual_assignments,
  };
};

// Trackers API service
export const trackersService = {
  // Get all trackers
  getTrackers: async (params = {}) => {
    try {
      const response = await api.get("/trackers", { params });
      // Transform response data
      // Backend returns: { forms: [...], total, page, per_page, total_pages }
      if (response.data && response.data.forms) {
        // Transform forms array - ensure list_view_fields is preserved in tracker_config
        response.data.forms = response.data.forms.map(transformFormToTracker);
        // Also add trackers alias for frontend compatibility
        response.data.trackers = response.data.forms;
      } else if (Array.isArray(response.data)) {
        response.data = response.data.map(transformFormToTracker);
      }
      return response;
    } catch (error) {
      console.error("Get trackers failed:", error);
      throw error;
    }
  },

  // Get tracker by slug
  getTracker: async (slug) => {
    try {
      const response = await api.get(`/trackers/${slug}`);
      // Transform response data
      if (response.data) {
        response.data = transformFormToTracker(response.data);
      }
      return response;
    } catch (error) {
      console.error(`Get tracker ${slug} failed:`, error);
      throw error;
    }
  },

  // Create tracker
  createTracker: async (trackerData) => {
    try {
      // Transform tracker data to form format
      const formData = transformTrackerToForm(trackerData);
      const response = await api.post("/trackers", formData);
      // Transform response back to tracker format
      if (response.data) {
        response.data = transformFormToTracker(response.data);
      }
      return response;
    } catch (error) {
      console.error("Create tracker failed:", error);
      throw error;
    }
  },

  // Update tracker
  updateTracker: async (slug, trackerData) => {
    try {
      // Transform tracker data to form format
      const formData = transformTrackerToForm(trackerData);
      const response = await api.put(`/trackers/${slug}`, formData);
      // Transform response back to tracker format
      if (response.data) {
        response.data = transformFormToTracker(response.data);
      }
      return response;
    } catch (error) {
      console.error(`Update tracker ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete tracker
  deleteTracker: async (slug) => {
    try {
      return await api.delete(`/trackers/${slug}`);
    } catch (error) {
      console.error(`Delete tracker ${slug} failed:`, error);
      throw error;
    }
  },

  // Search trackers
  searchTrackers: async (searchData) => {
    try {
      const response = await api.post("/trackers/search", searchData);
      // Transform response data
      if (response.data && response.data.forms) {
        response.data.forms = response.data.forms.map(transformFormToTracker);
      }
      return response;
    } catch (error) {
      console.error("Search trackers failed:", error);
      throw error;
    }
  },

  // Tracker Entries
  // Get all tracker entries
  getTrackerEntries: async (params = {}) => {
    try {
      return await api.post("/trackers/entries/search", params);
    } catch (error) {
      console.error("Get tracker entries failed:", error);
      throw error;
    }
  },

  // Get tracker entry by ID
  getTrackerEntry: async (entryId) => {
    try {
      return await api.get(`/trackers/entries/${entryId}`);
    } catch (error) {
      console.error(`Get tracker entry ${entryId} failed:`, error);
      throw error;
    }
  },

  // Create tracker entry
  createTrackerEntry: async (entryData) => {
    try {
      return await api.post("/trackers/entries", entryData);
    } catch (error) {
      console.error("Create tracker entry failed:", error);
      throw error;
    }
  },

  // Update tracker entry
  updateTrackerEntry: async (entryId, entryData) => {
    try {
      return await api.put(`/trackers/entries/${entryId}`, entryData);
    } catch (error) {
      console.error(`Update tracker entry ${entryId} failed:`, error);
      throw error;
    }
  },

  // Delete tracker entry
  deleteTrackerEntry: async (entryId) => {
    try {
      return await api.delete(`/trackers/entries/${entryId}`);
    } catch (error) {
      console.error(`Delete tracker entry ${entryId} failed:`, error);
      throw error;
    }
  },

  // Search tracker entries
  searchTrackerEntries: async (searchData) => {
    try {
      return await api.post("/trackers/entries/search", searchData);
    } catch (error) {
      console.error("Search tracker entries failed:", error);
      throw error;
    }
  },

  // Get tracker entry timeline
  getTrackerEntryTimeline: async (entryId) => {
    try {
      return await api.get(`/trackers/entries/${entryId}/timeline`);
    } catch (error) {
      console.error(`Get tracker entry timeline ${entryId} failed:`, error);
      throw error;
    }
  },

  // Get tracker entry audit logs
  getTrackerEntryAuditLogs: async (entryId, limit = 100) => {
    try {
      return await api.get(`/trackers/entries/${entryId}/audit-logs`, {
        params: { limit },
      });
    } catch (error) {
      console.error(`Get tracker entry audit logs ${entryId} failed:`, error);
      throw error;
    }
  },
};

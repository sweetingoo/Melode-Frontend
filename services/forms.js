import { api } from "./api-client";

// Forms API service
export const formsService = {
  // Get all forms
  getForms: async (params = {}) => {
    try {
      return await api.get("/settings/custom-forms", { params });
    } catch (error) {
      console.error("Get forms failed:", error);
      throw error;
    }
  },

  // Get form by ID
  getForm: async (id) => {
    try {
      return await api.get(`/settings/custom-forms/${id}`);
    } catch (error) {
      console.error(`Get form ${id} failed:`, error);
      throw error;
    }
  },

  // Get form by slug
  getFormBySlug: async (slug) => {
    try {
      return await api.get(`/settings/custom-forms/slug/${slug}`);
    } catch (error) {
      console.error(`Get form by slug ${slug} failed:`, error);
      throw error;
    }
  },

  // Create form
  createForm: async (formData) => {
    try {
      return await api.post("/settings/custom-forms", formData);
    } catch (error) {
      console.error("Create form failed:", error);
      throw error;
    }
  },

  // Update form
  updateForm: async (id, formData) => {
    try {
      return await api.put(`/settings/custom-forms/${id}`, formData);
    } catch (error) {
      console.error(`Update form ${id} failed:`, error);
      throw error;
    }
  },

  // Delete form
  deleteForm: async (id) => {
    try {
      return await api.delete(`/settings/custom-forms/${id}`);
    } catch (error) {
      console.error(`Delete form ${id} failed:`, error);
      throw error;
    }
  },

  // Search forms
  searchForms: async (searchData) => {
    try {
      return await api.post("/settings/custom-forms/search", searchData);
    } catch (error) {
      console.error("Search forms failed:", error);
      throw error;
    }
  },

  // Form Submissions
  // Get all form submissions
  getFormSubmissions: async (params = {}) => {
    try {
      return await api.get("/settings/form-submissions", { params });
    } catch (error) {
      console.error("Get form submissions failed:", error);
      throw error;
    }
  },

  // Get form submission by ID
  getFormSubmission: async (id) => {
    try {
      return await api.get(`/settings/form-submissions/${id}`);
    } catch (error) {
      console.error(`Get form submission ${id} failed:`, error);
      throw error;
    }
  },

  // Create form submission
  createFormSubmission: async (submissionData) => {
    try {
      return await api.post("/settings/form-submissions", submissionData);
    } catch (error) {
      console.error("Create form submission failed:", error);
      throw error;
    }
  },

  // Update form submission
  updateFormSubmission: async (id, submissionData) => {
    try {
      return await api.put(`/settings/form-submissions/${id}`, submissionData);
    } catch (error) {
      console.error(`Update form submission ${id} failed:`, error);
      throw error;
    }
  },

  // Search form submissions
  searchFormSubmissions: async (searchData) => {
    try {
      return await api.post("/settings/form-submissions/search", searchData);
    } catch (error) {
      console.error("Search form submissions failed:", error);
      throw error;
    }
  },
};


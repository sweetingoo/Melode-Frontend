import api from "./api-client";

/**
 * Form Types Service
 * Handles all form type related API calls
 */

export const formTypesService = {
  /**
   * Get all form types with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search term
   * @param {boolean} params.is_active - Filter by active status
   * @param {boolean} params.is_system - Filter by system status
   * @returns {Promise<Object>}
   */
  getFormTypes: async (params = {}) => {
    try {
      const response = await api.get("/form-types", { params });
      return response.data;
    } catch (error) {
      console.error("Get form types failed:", error);
      throw error;
    }
  },

  /**
   * Get all active form types (for dropdowns)
   * @returns {Promise<Array>}
   */
  getActiveFormTypes: async () => {
    try {
      const response = await api.get("/form-types/active/all");
      return response.data;
    } catch (error) {
      console.error("Get active form types failed:", error);
      throw error;
    }
  },

  /**
   * Get form type by ID
   * @param {number} id - Form type ID
   * @returns {Promise<Object>}
   */
  getFormType: async (id) => {
    try {
      const response = await api.get(`/form-types/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Get form type ${id} failed:`, error);
      throw error;
    }
  },

  /**
   * Get form type by name
   * @param {string} name - Form type name
   * @returns {Promise<Object>}
   */
  getFormTypeByName: async (name) => {
    try {
      const response = await api.get(`/form-types/name/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Get form type by name ${name} failed:`, error);
      throw error;
    }
  },

  /**
   * Create a new form type
   * @param {Object} formTypeData - Form type data
   * @returns {Promise<Object>}
   */
  createFormType: async (formTypeData) => {
    try {
      const response = await api.post("/form-types", formTypeData);
      return response.data;
    } catch (error) {
      console.error("Create form type failed:", error);
      throw error;
    }
  },

  /**
   * Update form type
   * @param {number} id - Form type ID
   * @param {Object} formTypeData - Updated form type data
   * @returns {Promise<Object>}
   */
  updateFormType: async (id, formTypeData) => {
    try {
      const response = await api.put(`/form-types/${id}`, formTypeData);
      return response.data;
    } catch (error) {
      console.error(`Update form type ${id} failed:`, error);
      throw error;
    }
  },

  /**
   * Delete form type (system types can only be deactivated)
   * @param {number} id - Form type ID
   * @returns {Promise<void>}
   */
  deleteFormType: async (id) => {
    try {
      const response = await api.delete(`/form-types/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete form type ${id} failed:`, error);
      throw error;
    }
  },

  /**
   * Search form types
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>}
   */
  searchFormTypes: async (searchParams) => {
    try {
      const response = await api.post("/form-types/search", searchParams);
      return response.data;
    } catch (error) {
      console.error("Search form types failed:", error);
      throw error;
    }
  },
};


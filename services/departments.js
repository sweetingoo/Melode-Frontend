import { api } from "./api-client";

// Departments API service
export const departmentsService = {
  // Get all departments
  getDepartments: async (params = {}) => {
    try {
      return await api.get("/departments", { params });
    } catch (error) {
      console.error("Get departments failed:", error);
      throw error;
    }
  },

  // Get department by slug
  getDepartment: async (slug) => {
    try {
      return await api.get(`/departments/${slug}`);
    } catch (error) {
      console.error(`Get department ${slug} failed:`, error);
      throw error;
    }
  },

  // Create department
  createDepartment: async (departmentData) => {
    try {
      return await api.post("/departments", departmentData);
    } catch (error) {
      console.error("Create department failed:", error);
      throw error;
    }
  },

  // Update department
  updateDepartment: async (slug, departmentData) => {
    try {
      return await api.put(`/departments/${slug}`, departmentData);
    } catch (error) {
      console.error(`Update department ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete department
  deleteDepartment: async (slug) => {
    try {
      return await api.delete(`/departments/${slug}`);
    } catch (error) {
      console.error(`Delete department ${slug} failed:`, error);
      throw error;
    }
  },
};


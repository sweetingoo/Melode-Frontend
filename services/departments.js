import { api } from "./api-client";

// Departments API service
export const departmentsService = {
  // Get all departments
  getDepartments: async (params = {}) => {
    try {
      return await api.get("/employees/departments", { params });
    } catch (error) {
      console.error("Get departments failed:", error);
      throw error;
    }
  },

  // Get department by ID
  getDepartment: async (id) => {
    try {
      return await api.get(`/employees/departments/${id}`);
    } catch (error) {
      console.error(`Get department ${id} failed:`, error);
      throw error;
    }
  },

  // Create department
  createDepartment: async (departmentData) => {
    try {
      return await api.post("/employees/departments", departmentData);
    } catch (error) {
      console.error("Create department failed:", error);
      throw error;
    }
  },

  // Update department
  updateDepartment: async (id, departmentData) => {
    try {
      return await api.put(`/employees/departments/${id}`, departmentData);
    } catch (error) {
      console.error(`Update department ${id} failed:`, error);
      throw error;
    }
  },

  // Delete department
  deleteDepartment: async (id) => {
    try {
      return await api.delete(`/employees/departments/${id}`);
    } catch (error) {
      console.error(`Delete department ${id} failed:`, error);
      throw error;
    }
  },
};


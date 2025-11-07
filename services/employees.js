import { api } from "./api-client";

// Employees API service
export const employeesService = {
  // Get all employees
  getEmployees: async (params = {}) => {
    try {
      return await api.get("/employees", { params });
    } catch (error) {
      console.error("Get employees failed:", error);
      throw error;
    }
  },

  // Get employee by ID
  getEmployee: async (id) => {
    try {
      return await api.get(`/employees/${id}`);
    } catch (error) {
      console.error(`Get employee ${id} failed:`, error);
      throw error;
    }
  },

  // Create employee
  createEmployee: async (employeeData) => {
    try {
      return await api.post("/employees", employeeData);
    } catch (error) {
      console.error("Create employee failed:", error);
      throw error;
    }
  },

  // Update employee
  updateEmployee: async (id, employeeData) => {
    try {
      return await api.put(`/employees/${id}`, employeeData);
    } catch (error) {
      console.error(`Update employee ${id} failed:`, error);
      throw error;
    }
  },

  // Delete employee
  deleteEmployee: async (id) => {
    try {
      return await api.delete(`/employees/${id}`);
    } catch (error) {
      console.error(`Delete employee ${id} failed:`, error);
      throw error;
    }
  },

  // Get hierarchy image
  getHierarchyImage: async () => {
    try {
      return await api.get("/employees/hierarchy/image", {
        responseType: "blob",
      });
    } catch (error) {
      console.error("Get hierarchy image failed:", error);
      throw error;
    }
  },
};


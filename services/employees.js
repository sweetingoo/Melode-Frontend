import { api } from "./api-client";

// Employees API service
// Note: Employee endpoints have been removed. Employee fields are now part of the User model.
// All employee operations now use the User API endpoints.
export const employeesService = {
  // Get all employees (users with employee fields)
  // Uses /users endpoint with filters for employment_status, etc.
  getEmployees: async (params = {}) => {
    try {
      return await api.get("/users", { params });
    } catch (error) {
      console.error("Get employees failed:", error);
      throw error;
    }
  },

  // Get employee by ID (user by ID)
  getEmployee: async (id) => {
    try {
      return await api.get(`/users/${id}`);
    } catch (error) {
      console.error(`Get employee ${id} failed:`, error);
      throw error;
    }
  },

  // Create employee (create user with employee fields)
  createEmployee: async (employeeData) => {
    try {
      return await api.post("/users", employeeData);
    } catch (error) {
      console.error("Create employee failed:", error);
      throw error;
    }
  },

  // Update employee (update user with employee fields)
  updateEmployee: async (id, employeeData) => {
    try {
      return await api.put(`/users/${id}`, employeeData);
    } catch (error) {
      console.error(`Update employee ${id} failed:`, error);
      throw error;
    }
  },

  // Delete employee (delete user)
  deleteEmployee: async (id) => {
    try {
      return await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Delete employee ${id} failed:`, error);
      throw error;
    }
  },

  // Get hierarchy image
  // Note: This endpoint might still be under /employees/hierarchy/image
  // If it's been moved, update this endpoint accordingly
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


import { api } from "./api-client";

// People API service
// Note: Employee endpoints have been removed. Employee fields are now part of the User model.
// All people operations now use the User API endpoints.
export const employeesService = {
  // Get all people (users with employee fields)
  // Uses /users endpoint with filters for employment_status, etc.
  getEmployees: async (params = {}) => {
    try {
      return await api.get("/users", { params });
    } catch (error) {
      console.error("Get people failed:", error);
      throw error;
    }
  },

  // Get person by ID (user by ID)
  getEmployee: async (id) => {
    try {
      return await api.get(`/users/${id}`);
    } catch (error) {
      console.error(`Get person ${id} failed:`, error);
      throw error;
    }
  },

  // Create person (create user with employee fields)
  createEmployee: async (employeeData) => {
    try {
      return await api.post("/users", employeeData);
    } catch (error) {
      console.error("Create person failed:", error);
      throw error;
    }
  },

  // Update person (update user with employee fields)
  updateEmployee: async (id, employeeData) => {
    try {
      return await api.put(`/users/${id}`, employeeData);
    } catch (error) {
      console.error(`Update person ${id} failed:`, error);
      throw error;
    }
  },

  // Delete person (delete user)
  deleteEmployee: async (id) => {
    try {
      return await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Delete person ${id} failed:`, error);
      throw error;
    }
  },

  // Get hierarchy image
  getHierarchyImage: async () => {
    try {
      return await api.get("/departments/hierarchy/image", {
        responseType: "blob",
      });
    } catch (error) {
      console.error("Get hierarchy image failed:", error);
      throw error;
    }
  },
};


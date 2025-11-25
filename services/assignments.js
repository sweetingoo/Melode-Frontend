import { api } from "./api-client";

// Employee-Department Assignments API service
export const assignmentsService = {
  // Get all assignments
  getAssignments: async (params = {}) => {
    try {
      return await api.get("/departments/assignments", { params });
    } catch (error) {
      console.error("Get assignments failed:", error);
      throw error;
    }
  },

  // Get assignment by ID
  getAssignment: async (id) => {
    try {
      return await api.get(`/departments/assignments/${id}`);
    } catch (error) {
      console.error(`Get assignment ${id} failed:`, error);
      throw error;
    }
  },

  // Get assignments for a specific employee
  getEmployeeAssignments: async (employeeId) => {
    try {
      return await api.get(`/departments/users/${employeeId}/departments`);
    } catch (error) {
      console.error(`Get employee assignments ${employeeId} failed:`, error);
      throw error;
    }
  },

  // Get assignments for a specific department
  getDepartmentAssignments: async (departmentId) => {
    try {
      return await api.get(`/departments/${departmentId}/users`);
    } catch (error) {
      console.error(
        `Get department assignments ${departmentId} failed:`,
        error
      );
      throw error;
    }
  },

  // Create assignment
  createAssignment: async (assignmentData) => {
    try {
      return await api.post("/departments/assignments", assignmentData);
    } catch (error) {
      console.error("Create assignment failed:", error);
      throw error;
    }
  },

  // Create bulk assignments
  createBulkAssignments: async (assignmentsData) => {
    try {
      return await api.post("/departments/assignments/bulk", assignmentsData);
    } catch (error) {
      console.error("Create bulk assignments failed:", error);
      throw error;
    }
  },

  // Update assignment
  updateAssignment: async (id, assignmentData) => {
    try {
      return await api.put(`/departments/assignments/${id}`, assignmentData);
    } catch (error) {
      console.error(`Update assignment ${id} failed:`, error);
      throw error;
    }
  },

  // Delete assignment
  deleteAssignment: async (employeeId, departmentId) => {
    try {
      return await api.delete(
        `/departments/assignments/${employeeId}/${departmentId}`
      );
    } catch (error) {
      console.error(
        `Delete assignment ${employeeId}/${departmentId} failed:`,
        error
      );
      throw error;
    }
  },
};


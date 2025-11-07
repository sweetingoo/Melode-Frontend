import { api } from "./api-client";

// Employee-Department Assignments API service
export const assignmentsService = {
  // Get all assignments
  getAssignments: async (params = {}) => {
    try {
      return await api.get("/employees/assignments", { params });
    } catch (error) {
      console.error("Get assignments failed:", error);
      throw error;
    }
  },

  // Get assignment by ID
  getAssignment: async (id) => {
    try {
      return await api.get(`/employees/assignments/${id}`);
    } catch (error) {
      console.error(`Get assignment ${id} failed:`, error);
      throw error;
    }
  },

  // Get assignments for a specific employee
  getEmployeeAssignments: async (employeeId) => {
    try {
      return await api.get(`/employees/assignments`, {
        params: { employee_id: employeeId },
      });
    } catch (error) {
      console.error(`Get employee assignments ${employeeId} failed:`, error);
      throw error;
    }
  },

  // Get assignments for a specific department
  getDepartmentAssignments: async (departmentId) => {
    try {
      return await api.get(`/employees/assignments`, {
        params: { department_id: departmentId },
      });
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
      return await api.post("/employees/assignments", assignmentData);
    } catch (error) {
      console.error("Create assignment failed:", error);
      throw error;
    }
  },

  // Update assignment
  updateAssignment: async (id, assignmentData) => {
    try {
      return await api.put(`/employees/assignments/${id}`, assignmentData);
    } catch (error) {
      console.error(`Update assignment ${id} failed:`, error);
      throw error;
    }
  },

  // Delete assignment
  deleteAssignment: async (id) => {
    try {
      return await api.delete(`/employees/assignments/${id}`);
    } catch (error) {
      console.error(`Delete assignment ${id} failed:`, error);
      throw error;
    }
  },
};


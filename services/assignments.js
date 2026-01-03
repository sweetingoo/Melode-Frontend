import { api } from "./api-client";

// Person-Department Assignments API service
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

  // Get assignment by slug
  getAssignment: async (slug) => {
    try {
      return await api.get(`/departments/assignments/${slug}`);
    } catch (error) {
      console.error(`Get assignment ${slug} failed:`, error);
      throw error;
    }
  },

  // Get assignments for a specific person
  getEmployeeAssignments: async (userSlug) => {
    try {
      return await api.get(`/departments/users/${userSlug}/departments`);
    } catch (error) {
      console.error(`Get person assignments ${userSlug} failed:`, error);
      throw error;
    }
  },

  // Get assignments for a specific department
  getDepartmentAssignments: async (departmentSlug) => {
    try {
      return await api.get(`/departments/${departmentSlug}/users`);
    } catch (error) {
      console.error(
        `Get department assignments ${departmentSlug} failed:`,
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
  updateAssignment: async (slug, assignmentData) => {
    try {
      return await api.put(`/departments/assignments/${slug}`, assignmentData);
    } catch (error) {
      console.error(`Update assignment ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete assignment
  deleteAssignment: async (userSlug, departmentSlug) => {
    try {
      return await api.delete(
        `/departments/assignments/${userSlug}/${departmentSlug}`
      );
    } catch (error) {
      console.error(
        `Delete assignment ${userSlug}/${departmentSlug} failed:`,
        error
      );
      throw error;
    }
  },
};


import { api } from "./api-client";

export const departmentContextService = {
  // Get all departments for the current user
  getUserDepartments: async () => {
    try {
      const response = await api.get("/profile/me/departments");
      return response.data || response;
    } catch (error) {
      console.error("Get user departments failed:", error);
      throw error;
    }
  },

  // Switch/validate active department
  switchDepartment: async (departmentId) => {
    try {
      const response = await api.post("/profile/me/departments/switch", {
        department_id: departmentId,
      });
      return response.data || response;
    } catch (error) {
      console.error("Switch department failed:", error);
      throw error;
    }
  },
};


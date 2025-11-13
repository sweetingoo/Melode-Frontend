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

  // Switch/validate active role (previously department switching)
  switchRole: async (roleId) => {
    try {
      const response = await api.post("/profile/me/roles/switch", {
        role_id: roleId,
      });
      return response.data || response;
    } catch (error) {
      console.error("Switch role failed:", error);
      throw error;
    }
  },
};


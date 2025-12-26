import { api } from "./api-client";

// Projects API service
export const projectsService = {
  // Get all projects with basic filters
  getProjects: async (params = {}) => {
    try {
      return await api.get("/projects", { params });
    } catch (error) {
      console.error("Get projects failed:", error);
      throw error;
    }
  },

  // Get project by ID
  getProject: async (id) => {
    try {
      return await api.get(`/projects/${id}`);
    } catch (error) {
      console.error(`Get project ${id} failed:`, error);
      throw error;
    }
  },

  // Create project
  createProject: async (projectData) => {
    try {
      return await api.post("/projects", projectData);
    } catch (error) {
      console.error("Create project failed:", error);
      throw error;
    }
  },

  // Update project
  updateProject: async (id, projectData) => {
    try {
      return await api.put(`/projects/${id}`, projectData);
    } catch (error) {
      console.error(`Update project ${id} failed:`, error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (id, force = false) => {
    try {
      return await api.delete(`/projects/${id}`, {
        params: { force: force },
      });
    } catch (error) {
      console.error(`Delete project ${id} failed:`, error);
      throw error;
    }
  },

  // Get tasks in project
  getProjectTasks: async (projectId, params = {}) => {
    try {
      return await api.get(`/projects/${projectId}/tasks`, { params });
    } catch (error) {
      console.error(`Get tasks for project ${projectId} failed:`, error);
      throw error;
    }
  },

  // Add task to project
  addTaskToProject: async (projectId, taskId) => {
    try {
      // task_id should be in the URL path, not in the request body
      return await api.post(`/projects/${projectId}/tasks/${taskId}`);
    } catch (error) {
      console.error(`Add task ${taskId} to project ${projectId} failed:`, error);
      throw error;
    }
  },

  // Remove task from project
  removeTaskFromProject: async (projectId, taskId) => {
    try {
      return await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    } catch (error) {
      console.error(`Remove task ${taskId} from project ${projectId} failed:`, error);
      throw error;
    }
  },

  // Get project members
  getProjectMembers: async (projectId) => {
    try {
      return await api.get(`/projects/${projectId}/members`);
    } catch (error) {
      console.error(`Get members for project ${projectId} failed:`, error);
      throw error;
    }
  },

  // Add member to project
  addMemberToProject: async (projectId, userId) => {
    try {
      return await api.post(`/projects/${projectId}/members`, { user_id: userId });
    } catch (error) {
      console.error(`Add member ${userId} to project ${projectId} failed:`, error);
      throw error;
    }
  },

  // Remove member from project
  removeMemberFromProject: async (projectId, userId) => {
    try {
      return await api.delete(`/projects/${projectId}/members/${userId}`);
    } catch (error) {
      console.error(`Remove member ${userId} from project ${projectId} failed:`, error);
      throw error;
    }
  },
};


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

  // Get project by slug
  getProject: async (slug) => {
    try {
      return await api.get(`/projects/${slug}`);
    } catch (error) {
      console.error(`Get project ${slug} failed:`, error);
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
  updateProject: async (slug, projectData) => {
    try {
      return await api.put(`/projects/${slug}`, projectData);
    } catch (error) {
      console.error(`Update project ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (slug, force = false) => {
    try {
      return await api.delete(`/projects/${slug}`, {
        params: { force: force },
      });
    } catch (error) {
      console.error(`Delete project ${slug} failed:`, error);
      throw error;
    }
  },

  // Get tasks in project
  getProjectTasks: async (projectSlug, params = {}) => {
    try {
      return await api.get(`/projects/${projectSlug}/tasks`, { params });
    } catch (error) {
      console.error(`Get tasks for project ${projectSlug} failed:`, error);
      throw error;
    }
  },

  // Add task to project
  addTaskToProject: async (projectSlug, taskSlug) => {
    try {
      // task_slug should be in the URL path, not in the request body
      return await api.post(`/projects/${projectSlug}/tasks/${taskSlug}`);
    } catch (error) {
      console.error(`Add task ${taskSlug} to project ${projectSlug} failed:`, error);
      throw error;
    }
  },

  // Remove task from project
  removeTaskFromProject: async (projectSlug, taskSlug) => {
    try {
      return await api.delete(`/projects/${projectSlug}/tasks/${taskSlug}`);
    } catch (error) {
      console.error(`Remove task ${taskSlug} from project ${projectSlug} failed:`, error);
      throw error;
    }
  },

  // Get project members
  getProjectMembers: async (projectSlug) => {
    try {
      return await api.get(`/projects/${projectSlug}/members`);
    } catch (error) {
      console.error(`Get members for project ${projectSlug} failed:`, error);
      throw error;
    }
  },

  // Add member to project
  addMemberToProject: async (projectSlug, userId) => {
    try {
      return await api.post(`/projects/${projectSlug}/members`, { user_id: userId });
    } catch (error) {
      console.error(`Add member ${userId} to project ${projectSlug} failed:`, error);
      throw error;
    }
  },

  // Remove member from project
  removeMemberFromProject: async (projectSlug, userSlug) => {
    try {
      return await api.delete(`/projects/${projectSlug}/members/${userSlug}`);
    } catch (error) {
      console.error(`Remove member ${userSlug} from project ${projectSlug} failed:`, error);
      throw error;
    }
  },
};


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsService } from "@/services/projects";
import { toast } from "sonner";

// Project query keys
export const projectKeys = {
  all: ["projects"],
  lists: () => [...projectKeys.all, "list"],
  list: (params) => [...projectKeys.lists(), params],
  details: () => [...projectKeys.all, "detail"],
  detail: (id) => [...projectKeys.details(), id],
  tasks: (projectId, params) => [...projectKeys.all, "tasks", projectId, params],
  members: (projectId) => [...projectKeys.all, "members", projectId],
};

// Get all projects query
export const useProjects = (params = {}, options = {}) => {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const response = await projectsService.getProjects(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single project query
export const useProject = (id) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await projectsService.getProject(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create project mutation
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData) => {
      const response = await projectsService.createProject(projectData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project created successfully", {
        description: `Project "${data.name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create project error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create project";
      toast.error("Failed to create project", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update project mutation
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectData }) => {
      const response = await projectsService.updateProject(id, projectData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(projectKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project updated successfully", {
        description: `Project "${data.name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update project error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update project";
      toast.error("Failed to update project", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, force = false }) => {
      await projectsService.deleteProject(id, force);
      return { id, force };
    },
    onSuccess: (data) => {
      const { id, force } = data;
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      if (force) {
        toast.success("Project permanently deleted", {
          description: "The project has been permanently removed from the database.",
        });
      } else {
        toast.success("Project deactivated", {
          description: "The project has been deactivated. You can restore it later if needed.",
        });
      }
    },
    onError: (error) => {
      console.error("Delete project error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete project";
      toast.error("Failed to delete project", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Get project tasks query
export const useProjectTasks = (projectId, params = {}, options = {}) => {
  return useQuery({
    queryKey: projectKeys.tasks(projectId, params),
    queryFn: async () => {
      const response = await projectsService.getProjectTasks(projectId, params);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Add task to project mutation
export const useAddTaskToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, taskId }) => {
      const response = await projectsService.addTaskToProject(projectId, taskId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task added to project successfully");
    },
    onError: (error) => {
      console.error("Add task to project error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to add task to project";
      toast.error("Failed to add task to project", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Remove task from project mutation
export const useRemoveTaskFromProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, taskId }) => {
      await projectsService.removeTaskFromProject(projectId, taskId);
      return { projectId, taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(data.projectId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task removed from project successfully");
    },
    onError: (error) => {
      console.error("Remove task from project error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to remove task from project";
      toast.error("Failed to remove task from project", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Get project members query
export const useProjectMembers = (projectId, options = {}) => {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: async () => {
      const response = await projectsService.getProjectMembers(projectId);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Add member to project mutation
export const useAddMemberToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }) => {
      const response = await projectsService.addMemberToProject(projectId, userId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      toast.success("Member added to project successfully");
    },
    onError: (error) => {
      console.error("Add member to project error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to add member to project";
      toast.error("Failed to add member to project", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Remove member from project mutation
export const useRemoveMemberFromProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }) => {
      await projectsService.removeMemberFromProject(projectId, userId);
      return { projectId, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(data.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.projectId) });
      toast.success("Member removed from project successfully");
    },
    onError: (error) => {
      console.error("Remove member from project error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to remove member from project";
      toast.error("Failed to remove member from project", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};


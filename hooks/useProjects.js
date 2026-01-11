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
export const useProject = (slug) => {
  return useQuery({
    queryKey: projectKeys.detail(slug),
    queryFn: async () => {
      const response = await projectsService.getProject(slug);
      return response.data;
    },
    enabled: !!slug,
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
    mutationFn: async ({ slug, projectData }) => {
      const response = await projectsService.updateProject(slug, projectData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(projectKeys.detail(variables.slug), data);
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
    mutationFn: async ({ slug, force = false }) => {
      await projectsService.deleteProject(slug, force);
      return { slug, force };
    },
    onSuccess: (data) => {
      const { slug, force } = data;
      queryClient.removeQueries({ queryKey: projectKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      if (force) {
        toast.success("Project permanently deleted", {
          description: "The project has been permanently removed from the database.",
        });
      } else {
        toast.success("Project archived", {
          description: "The project has been archived. You can restore it later if needed.",
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
export const useProjectTasks = (projectSlug, params = {}, options = {}) => {
  return useQuery({
    queryKey: projectKeys.tasks(projectSlug, params),
    queryFn: async () => {
      const response = await projectsService.getProjectTasks(projectSlug, params);
      return response.data;
    },
    enabled: !!projectSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Add task to project mutation
export const useAddTaskToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectSlug, taskSlug }) => {
      const response = await projectsService.addTaskToProject(projectSlug, taskSlug);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate project tasks queries (with and without params to match all variations)
      queryClient.invalidateQueries({ 
        queryKey: [...projectKeys.all, "tasks", variables.projectSlug],
        exact: false // Match all queries that start with this key
      });
      // Also invalidate the project detail to refresh task count
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectSlug) });
      // Invalidate all tasks queries
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
    mutationFn: async ({ projectSlug, taskSlug }) => {
      await projectsService.removeTaskFromProject(projectSlug, taskSlug);
      return { projectSlug, taskSlug };
    },
    onSuccess: (data, variables) => {
      // Invalidate project tasks queries (with and without params to match all variations)
      queryClient.invalidateQueries({ 
        queryKey: [...projectKeys.all, "tasks", variables.projectSlug],
        exact: false 
      });
      // Also invalidate the project detail to refresh task count
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectSlug) });
      // Invalidate all tasks queries
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
export const useProjectMembers = (projectSlug, options = {}) => {
  return useQuery({
    queryKey: projectKeys.members(projectSlug),
    queryFn: async () => {
      const response = await projectsService.getProjectMembers(projectSlug);
      return response.data;
    },
    enabled: !!projectSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Add member to project mutation
export const useAddMemberToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectSlug, userId }) => {
      const response = await projectsService.addMemberToProject(projectSlug, userId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(variables.projectSlug) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectSlug) });
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
    mutationFn: async ({ projectSlug, userSlug }) => {
      await projectsService.removeMemberFromProject(projectSlug, userSlug);
      return { projectSlug, userSlug };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(data.projectSlug) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.projectSlug) });
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


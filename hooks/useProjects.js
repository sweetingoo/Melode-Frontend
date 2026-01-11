import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsService } from "@/services/projects";
import { filesService } from "@/services/files";
import { auditLogsService } from "@/services/auditLogs";
import { commentsService } from "@/services/comments";
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
  files: (projectId) => [...projectKeys.all, "files", projectId],
  activity: (projectId, params) => [...projectKeys.all, "activity", projectId, params],
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

// Get project files query (includes files from project, tasks, and task comments)
export const useProjectFiles = (projectSlug, options = {}) => {
  return useQuery({
    queryKey: projectKeys.files(projectSlug),
    queryFn: async () => {
      const allFiles = [];
      
      // 1. Get files directly attached to the project
      try {
        const projectFilesResponse = await filesService.getEntityAttachments("project", projectSlug);
        const projectFiles = projectFilesResponse?.attachments || projectFilesResponse?.data || projectFilesResponse || [];
        projectFiles.forEach(file => {
          allFiles.push({
            ...file,
            source_type: "project",
            source_name: "Project",
          });
        });
      } catch (error) {
        console.warn("Failed to get project files:", error);
      }
      
      // 2. Get all tasks in the project (with pagination support)
      let tasks = [];
      try {
        let page = 1;
        let hasMore = true;
        const perPage = 100; // Use 100 until backend is deployed with 1000 limit
        
        while (hasMore) {
          const tasksResponse = await projectsService.getProjectTasks(projectSlug, {
            page,
            per_page: perPage,
          });
          const responseData = tasksResponse?.data || tasksResponse;
          const pageTasks = responseData?.tasks || tasksResponse?.tasks || tasksResponse || [];
          const total = responseData?.total || 0;
          const totalPages = responseData?.total_pages || 1;
          
          if (Array.isArray(pageTasks)) {
            tasks = [...tasks, ...pageTasks];
          }
          
          hasMore = page < totalPages && pageTasks.length === perPage;
          page++;
          
          // Safety limit: don't fetch more than 100 pages (10,000 tasks)
          if (page > 100) {
            console.warn("Project has more than 10,000 tasks. Limiting file aggregation to first 10,000 tasks.");
            break;
          }
        }
      } catch (error) {
        console.warn("Failed to get project tasks for files:", error);
      }
      
      // 3. For each task, get its files and comments
      for (const task of tasks) {
        const taskSlug = task.slug || task.id;
        if (!taskSlug) continue;
        
        // Get files attached to the task
        try {
          const taskFilesResponse = await filesService.getEntityAttachments("task", taskSlug);
          const taskFiles = taskFilesResponse?.attachments || taskFilesResponse?.data || taskFilesResponse || [];
          taskFiles.forEach(file => {
            allFiles.push({
              ...file,
              source_type: "task",
              source_name: task.title || `Task #${task.id}`,
              source_slug: taskSlug,
            });
          });
        } catch (error) {
          // Silently continue if task files can't be fetched
          console.warn(`Failed to get files for task ${taskSlug}:`, error);
        }
        
        // Get comments for the task
        let comments = [];
        try {
          const commentsResponse = await commentsService.getComments("task", taskSlug);
          comments = commentsResponse?.data?.comments || commentsResponse?.comments || commentsResponse || [];
          if (!Array.isArray(comments)) {
            comments = [];
          }
        } catch (error) {
          // Silently continue if comments can't be fetched
          console.warn(`Failed to get comments for task ${taskSlug}:`, error);
        }
        
        // 4. For each comment, get its files
        for (const comment of comments) {
          const commentSlug = comment.slug || comment.id;
          if (!commentSlug) continue;
          
          try {
            const commentFilesResponse = await filesService.getEntityAttachments("entity_comment", commentSlug);
            const commentFiles = commentFilesResponse?.attachments || commentFilesResponse?.data || commentFilesResponse || [];
            commentFiles.forEach(file => {
              allFiles.push({
                ...file,
                source_type: "comment",
                source_name: `Comment on ${task.title || `Task #${task.id}`}`,
                source_slug: commentSlug,
                task_title: task.title || `Task #${task.id}`,
                task_slug: taskSlug,
              });
            });
          } catch (error) {
            // Silently continue if comment files can't be fetched
            console.warn(`Failed to get files for comment ${commentSlug}:`, error);
          }
        }
      }
      
      // Remove duplicates based on file_id
      const uniqueFiles = [];
      const seenFileIds = new Set();
      for (const file of allFiles) {
        const fileId = file.file_id || file.id;
        if (fileId && !seenFileIds.has(fileId)) {
          seenFileIds.add(fileId);
          uniqueFiles.push(file);
        } else if (!fileId) {
          // If no file_id, include it anyway (shouldn't happen but handle gracefully)
          uniqueFiles.push(file);
        }
      }
      
      return {
        attachments: uniqueFiles,
        total: uniqueFiles.length,
      };
    },
    enabled: !!projectSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get project activity (task audit logs) query
export const useProjectActivity = (projectSlug, params = {}, options = {}) => {
  return useQuery({
    queryKey: projectKeys.activity(projectSlug, params),
    queryFn: async () => {
      // First, get all tasks in the project (with pagination support)
      let tasks = [];
      let page = 1;
      let hasMore = true;
      const perPage = 100; // Use 100 until backend is deployed with 1000 limit
      
      while (hasMore) {
        const tasksResponse = await projectsService.getProjectTasks(projectSlug, {
          page,
          per_page: perPage,
        });
        const responseData = tasksResponse?.data || tasksResponse;
        const pageTasks = responseData?.tasks || tasksResponse?.tasks || tasksResponse || [];
        const totalPages = responseData?.total_pages || 1;
        
        if (Array.isArray(pageTasks)) {
          tasks = [...tasks, ...pageTasks];
        }
        
        hasMore = page < totalPages && pageTasks.length === perPage;
        page++;
        
        // Safety limit: don't fetch more than 100 pages (10,000 tasks)
        if (page > 100) {
          console.warn("Project has more than 10,000 tasks. Limiting activity aggregation to first 10,000 tasks.");
          break;
        }
      }
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return {
          audit_logs: [],
          total: 0,
          permissionDenied: false,
        };
      }
      
      // Then, get audit logs for each task
      // Note: This requires SYSTEM_MONITOR permission
      let permissionDenied = false;
      const activityPromises = tasks.map(async (task) => {
        try {
          const auditResponse = await auditLogsService.getResourceAuditLogs(
            "task",
            task.slug || task.id,
            { page: 1, per_page: 50, ...params }
          );
          const logs = auditResponse?.data?.audit_logs || auditResponse?.audit_logs || [];
          return logs.map(log => ({
            ...log,
            task_title: task.title,
            task_slug: task.slug || task.id,
          }));
        } catch (error) {
          // If permission denied, mark it but continue
          if (error?.response?.status === 403) {
            permissionDenied = true;
            return [];
          }
          // If task doesn't exist, return empty array
          if (error?.response?.status === 404) {
            return [];
          }
          console.warn(`Failed to get audit logs for task ${task.slug || task.id}:`, error);
          return [];
        }
      });
      
      const allActivity = await Promise.all(activityPromises);
      // Flatten and sort by created_at (newest first)
      const flattened = allActivity.flat().sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
      });
      
      return {
        audit_logs: flattened,
        total: flattened.length,
        permissionDenied,
      };
    },
    enabled: !!projectSlug,
    staleTime: 1 * 60 * 1000, // 1 minute (activity changes frequently)
    retry: false, // Don't retry on permission errors
    ...options,
  });
};


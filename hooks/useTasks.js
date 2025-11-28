import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/services/tasks";
import { toast } from "sonner";

// Task query keys
export const taskKeys = {
  all: ["tasks"],
  lists: () => [...taskKeys.all, "list"],
  list: (params) => [...taskKeys.lists(), params],
  details: () => [...taskKeys.all, "detail"],
  detail: (id) => [...taskKeys.details(), id],
  myTasks: (params) => [...taskKeys.all, "my-tasks", params],
  userTasks: (userId, params) => [...taskKeys.all, "user", userId, params],
  assetTasks: (assetId, params) => [...taskKeys.all, "asset", assetId, params],
  overdue: (params) => [...taskKeys.all, "overdue", params],
  dueSoon: (params) => [...taskKeys.all, "due-soon", params],
  compliance: (params) => [...taskKeys.all, "compliance", params],
  automated: (params) => [...taskKeys.all, "automated", params],
  stats: () => [...taskKeys.all, "stats"],
  search: (params) => [...taskKeys.all, "search", params],
  recurringHistory: (taskId) => [...taskKeys.all, "recurring-history", taskId],
  bulkCreate: (roleId) => [...taskKeys.all, "bulk-create", roleId],
};

// Get all tasks query
export const useTasks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const response = await tasksService.getTasks(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single task query
export const useTask = (id) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await tasksService.getTask(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create task mutation
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData) => {
      const response = await tasksService.createTask(taskData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      toast.success("Task created successfully", {
        description: `Task "${data.title}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create task error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create task";
      toast.error("Failed to create task", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update task mutation
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskData }) => {
      const response = await tasksService.updateTask(id, taskData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(taskKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      toast.success("Task updated successfully", {
        description: `Task "${data.title}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update task error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update task";
      toast.error("Failed to update task", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete task mutation
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await tasksService.deleteTask(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      toast.success("Task deleted successfully", {
        description: "The task has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete task error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete task";
      toast.error("Failed to delete task", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Assign task mutation
export const useAssignTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, assignmentData }) => {
      const response = await tasksService.assignTask(id, assignmentData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(taskKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
      toast.success("Task assigned successfully", {
        description: "The task has been assigned.",
      });
    },
    onError: (error) => {
      console.error("Assign task error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to assign task";
      toast.error("Failed to assign task", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Complete task mutation
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completionData }) => {
      const response = await tasksService.completeTask(id, completionData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(taskKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      toast.success("Task completed successfully", {
        description: `Task "${data.title}" has been marked as completed.`,
      });
    },
    onError: (error) => {
      console.error("Complete task error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to complete task";
      toast.error("Failed to complete task", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Search tasks mutation
export const useSearchTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchData) => {
      const response = await tasksService.searchTasks(searchData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(taskKeys.search(variables), data);
    },
  });
};

// Get my tasks query
export const useMyTasks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: taskKeys.myTasks(params),
    queryFn: async () => {
      const response = await tasksService.getMyTasks(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get tasks by user query
export const useTasksByUser = (userId, params = {}) => {
  return useQuery({
    queryKey: taskKeys.userTasks(userId, params),
    queryFn: async () => {
      const response = await tasksService.getTasksByUser(userId, params);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get tasks by asset query
export const useTasksByAsset = (assetId, params = {}) => {
  return useQuery({
    queryKey: taskKeys.assetTasks(assetId, params),
    queryFn: async () => {
      const response = await tasksService.getTasksByAsset(assetId, params);
      return response.data;
    },
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get overdue tasks query
export const useOverdueTasks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: taskKeys.overdue(params),
    queryFn: async () => {
      const response = await tasksService.getOverdueTasks(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get due soon tasks query
export const useDueSoonTasks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: taskKeys.dueSoon(params),
    queryFn: async () => {
      const response = await tasksService.getDueSoonTasks(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get compliance tasks query
export const useComplianceTasks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: taskKeys.compliance(params),
    queryFn: async () => {
      const response = await tasksService.getComplianceTasks(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get automated tasks query
export const useAutomatedTasks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: taskKeys.automated(params),
    queryFn: async () => {
      const response = await tasksService.getAutomatedTasks(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get task statistics query
export const useTaskStats = () => {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: async () => {
      const response = await tasksService.getTaskStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get recurring task history query
export const useRecurringTaskHistory = (taskId, options = {}) => {
  return useQuery({
    queryKey: taskKeys.recurringHistory(taskId),
    queryFn: async () => {
      const response = await tasksService.getRecurringTaskHistory(taskId);
      return response.data;
    },
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Bulk create tasks for role mutation
export const useBulkCreateTasksForRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, taskTemplate }) => {
      const response = await tasksService.bulkCreateTasksForRole(roleId, taskTemplate);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      toast.success("Tasks created successfully", {
        description: `${data.tasks_created || 0} individual tasks created for ${data.total_users || 0} users.`,
      });
    },
    onError: (error) => {
      console.error("Bulk create tasks error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create tasks";
      toast.error("Failed to create tasks", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};


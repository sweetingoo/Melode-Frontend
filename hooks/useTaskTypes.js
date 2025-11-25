import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskTypesService } from "@/services/taskTypes";
import { toast } from "sonner";

// Task type query keys
export const taskTypeKeys = {
  all: ["task-types"],
  lists: () => [...taskTypeKeys.all, "list"],
  list: (params) => [...taskTypeKeys.lists(), params],
  active: () => [...taskTypeKeys.all, "active"],
  details: () => [...taskTypeKeys.all, "detail"],
  detail: (id) => [...taskTypeKeys.details(), id],
};

// Get active task types query (for dropdowns/selectors)
export const useActiveTaskTypes = () => {
  return useQuery({
    queryKey: taskTypeKeys.active(),
    queryFn: async () => {
      const response = await taskTypesService.getActiveTaskTypes();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all task types query (with pagination)
export const useTaskTypes = (params = {}) => {
  return useQuery({
    queryKey: taskTypeKeys.list(params),
    queryFn: async () => {
      const response = await taskTypesService.getTaskTypes(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single task type query
export const useTaskType = (id) => {
  return useQuery({
    queryKey: taskTypeKeys.detail(id),
    queryFn: async () => {
      const response = await taskTypesService.getTaskType(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create task type mutation
export const useCreateTaskType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskTypeData) => {
      const response = await taskTypesService.createTaskType(taskTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskTypeKeys.all });
      toast.success("Task type created successfully", {
        description: `Task type "${data.display_name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create task type error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create task type";
      toast.error("Failed to create task type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update task type mutation
export const useUpdateTaskType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskTypeData }) => {
      const response = await taskTypesService.updateTaskType(id, taskTypeData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(taskTypeKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: taskTypeKeys.all });
      toast.success("Task type updated successfully", {
        description: `Task type "${data.display_name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update task type error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update task type";
      toast.error("Failed to update task type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete task type mutation
export const useDeleteTaskType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await taskTypesService.deleteTaskType(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: taskTypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskTypeKeys.all });
      toast.success("Task type deleted successfully", {
        description: "The task type has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete task type error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete task type";
      toast.error("Failed to delete task type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};


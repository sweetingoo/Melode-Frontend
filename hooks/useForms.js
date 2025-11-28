import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formsService } from "@/services/forms";
import { toast } from "sonner";

// Form query keys
export const formKeys = {
  all: ["forms"],
  lists: () => [...formKeys.all, "list"],
  list: (params) => [...formKeys.lists(), params],
  details: () => [...formKeys.all, "detail"],
  detail: (id) => [...formKeys.details(), id],
  search: (params) => [...formKeys.all, "search", params],
  submissions: () => [...formKeys.all, "submissions"],
  submissionList: (params) => [...formKeys.submissions(), "list", params],
  submissionDetail: (id) => [...formKeys.submissions(), "detail", id],
  submissionSearch: (params) => [...formKeys.submissions(), "search", params],
};

// Get all forms query
export const useForms = (params = {}, options = {}) => {
  return useQuery({
    queryKey: formKeys.list(params),
    queryFn: async () => {
      const response = await formsService.getForms(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single form query
export const useForm = (id, options = {}) => {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: async () => {
      const response = await formsService.getForm(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Create form mutation
export const useCreateForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await formsService.createForm(formData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success("Form created successfully", {
        description: `Form "${data.form_title || data.form_name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create form error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create form";
      toast.error("Failed to create form", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update form mutation
export const useUpdateForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await formsService.updateForm(id, formData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(formKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success("Form updated successfully", {
        description: `Form "${data.form_title || data.form_name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update form error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update form";
      toast.error("Failed to update form", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete form mutation
export const useDeleteForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await formsService.deleteForm(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: formKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success("Form deleted successfully", {
        description: "The form has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete form error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete form";
      toast.error("Failed to delete form", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Search forms mutation
export const useSearchForms = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchData) => {
      const response = await formsService.searchForms(searchData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(formKeys.search(variables), data);
    },
  });
};

// Form Submissions
// Get all form submissions query
export const useFormSubmissions = (params = {}, options = {}) => {
  return useQuery({
    queryKey: formKeys.submissionList(params),
    queryFn: async () => {
      const response = await formsService.getFormSubmissions(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single form submission query
export const useFormSubmission = (id, options = {}) => {
  return useQuery({
    queryKey: formKeys.submissionDetail(id),
    queryFn: async () => {
      const response = await formsService.getFormSubmission(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Create form submission mutation
export const useCreateFormSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionData) => {
      const response = await formsService.createFormSubmission(submissionData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formKeys.submissionList() });
      queryClient.invalidateQueries({ queryKey: formKeys.detail(data.form_id) });
      
      // Check if tasks were created
      if (data.processing_result?.task_creation?.created) {
        const taskInfo = data.processing_result.task_creation;
        
        if (taskInfo.individual_tasks && taskInfo.tasks_created) {
          // Individual tasks mode
          toast.success("Form submitted successfully", {
            description: `${taskInfo.tasks_created} individual tasks created for users in the role.`,
            duration: 5000,
          });
        } else if (taskInfo.task_id) {
          // Single collaborative task
          toast.success("Form submitted successfully", {
            description: `Task created: ${taskInfo.task_title || `Task #${taskInfo.task_id}`}`,
          });
        } else {
          toast.success("Form submitted successfully", {
            description: "Form submitted and processed.",
          });
        }
      } else {
        toast.success("Form submitted successfully", {
          description: "Your form submission has been recorded.",
        });
      }
    },
    onError: (error) => {
      console.error("Create form submission error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to submit form";
      toast.error("Failed to submit form", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update form submission mutation
export const useUpdateFormSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, submissionData }) => {
      const response = await formsService.updateFormSubmission(id, submissionData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(formKeys.submissionDetail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: formKeys.submissionList() });
      toast.success("Form submission updated successfully");
    },
    onError: (error) => {
      console.error("Update form submission error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update form submission";
      toast.error("Failed to update form submission", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Search form submissions mutation
export const useSearchFormSubmissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchData) => {
      const response = await formsService.searchFormSubmissions(searchData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(formKeys.submissionSearch(variables), data);
    },
  });
};


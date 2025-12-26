"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  CheckSquare,
  Calendar,
  Clock,
  Loader2,
  Plus,
  X,
  User,
  Shield,
  Image as ImageIcon,
  Info,
  Repeat,
} from "lucide-react";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useProjectTasks,
  useProjectMembers,
  useAddTaskToProject,
  useRemoveTaskFromProject,
  useAddMemberToProject,
  useRemoveMemberFromProject,
} from "@/hooks/useProjects";
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { useActiveTaskTypes } from "@/hooks/useTaskTypes";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useLocations } from "@/hooks/useLocations";
import { useAssets } from "@/hooks/useAssets";
import { useRoles, useRoleUsers } from "@/hooks/useRoles";
import { useForms } from "@/hooks/useForms";

const ProjectDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [accumulatedTasks, setAccumulatedTasks] = useState([]);
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
  });
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    task_type: "",
    description: "",
    due_date: "",
    priority: "",
    status: "pending",
    location_id: "",
    assigned_to_user_id: "",
    assigned_user_ids: [],
    assigned_to_role_id: "",
    assigned_to_asset_id: "",
    form_id: "",
    form_submission_id: "",
    project_id: "", // Will be set to current project
  });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState("multiple-users"); // "role", "user", "asset", "multiple-users"
  const [assetAssignmentType, setAssetAssignmentType] = useState("user"); // "user" or "role" for asset assignment
  const [isRecurring, setIsRecurring] = useState(false);
  const [createIndividualTasks, setCreateIndividualTasks] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState({
    frequency: "daily",
    interval: 1,
    days_of_week: [],
    times: [],
  });
  const [newTime, setNewTime] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canUpdateProject = hasPermission("project:update");
  const canDeleteProject = hasPermission("project:delete");
  const canAddTask = hasPermission("project:add_task");
  const canRemoveTask = hasPermission("project:remove_task");
  const canAddMember = hasPermission("project:add_member");
  const canRemoveMember = hasPermission("project:remove_member");

  // API hooks
  const { data: project, isLoading, error } = useProject(projectId);
  const { data: projectTasksResponse, isLoading: tasksLoading } = useProjectTasks(projectId, {
    page: 1,
    per_page: 100,
  });
  // Note: We're not using useTasks with project_id filter because it may not be supported
  // Instead, we rely solely on the projectTasksResponse from the /projects/{id}/tasks endpoint
  // This avoids network errors from unsupported filter parameters
  const { data: membersResponse, isLoading: membersLoading } = useProjectMembers(projectId);
  // Fetch tasks (without project filter) for the "Add Existing Task" modal
  // Load in smaller batches with pagination
  const { data: allTasksResponse, error: allTasksError, isLoading: allTasksLoading } = useTasks({ 
    page: taskPage, 
    per_page: 20, // Load 20 tasks at a time
    search: taskSearchTerm || undefined, // Add search if term is provided
  }, {
    enabled: isAddTaskModalOpen, // Only fetch when modal is open
    retry: false, // Don't retry to avoid repeated network errors
    onError: (error) => {
      // Log error but don't break the UI
      console.warn("Failed to fetch tasks for 'Add Existing Task' modal:", error);
    },
  });
  const { data: usersResponse } = useUsers();

  const queryClient = useQueryClient();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const addTaskMutation = useAddTaskToProject();
  const removeTaskMutation = useRemoveTaskFromProject();
  const addMemberMutation = useAddMemberToProject();
  const removeMemberMutation = useRemoveMemberFromProject();
  const createTaskMutation = useCreateTask();
  const { data: activeTaskTypes } = useActiveTaskTypes();

  // Extract data from project tasks endpoint response
  const projectTasksFromEndpoint = projectTasksResponse?.tasks || projectTasksResponse?.data || projectTasksResponse || [];
  // Use only the project tasks from the dedicated endpoint (no need to merge with project_id filter)
  const projectTasks = Array.isArray(projectTasksFromEndpoint) ? projectTasksFromEndpoint : [];
  const members = membersResponse?.members || membersResponse?.data || membersResponse || [];
  
  // Extract allTasks - handle different API response structures (same as tasks page)
  let allTasks = [];
  if (allTasksResponse) {
    console.log("allTasksResponse structure:", allTasksResponse);
    if (Array.isArray(allTasksResponse)) {
      allTasks = allTasksResponse;
    } else if (allTasksResponse.tasks && Array.isArray(allTasksResponse.tasks)) {
      allTasks = allTasksResponse.tasks;
    } else if (allTasksResponse.data && Array.isArray(allTasksResponse.data)) {
      allTasks = allTasksResponse.data;
    } else if (allTasksResponse.results && Array.isArray(allTasksResponse.results)) {
      allTasks = allTasksResponse.results;
    }
    console.log("Extracted allTasks:", allTasks.length, "tasks");
  }
  
  // Accumulate tasks across pages and reset when search changes
  React.useEffect(() => {
    if (allTasksResponse && Array.isArray(allTasks)) {
      if (taskPage === 1 || taskSearchTerm) {
        // Reset accumulated tasks on first page or when searching
        setAccumulatedTasks(allTasks);
      } else {
        // Append new tasks when loading more pages
        setAccumulatedTasks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTasks = allTasks.filter(t => !existingIds.has(t.id));
          return [...prev, ...newTasks];
        });
      }
    }
  }, [allTasksResponse, allTasks, taskPage, taskSearchTerm]);
  
  // Reset search and page when modal closes
  React.useEffect(() => {
    if (!isAddTaskModalOpen) {
      setTaskSearchTerm("");
      setTaskPage(1);
      setAccumulatedTasks([]);
    }
  }, [isAddTaskModalOpen]);
  
  // Fetch additional data for comprehensive task creation modal
  const { data: locationsData } = useLocations();
  const { data: assetsData } = useAssets();
  const { data: rolesData } = useRoles();
  const { data: formsResponse } = useForms();
  
  const users = usersResponse?.users || usersResponse || [];
  
  // Extract task types
  let taskTypes = [];
  if (activeTaskTypes) {
    if (Array.isArray(activeTaskTypes)) {
      taskTypes = activeTaskTypes;
    } else if (activeTaskTypes.task_types && Array.isArray(activeTaskTypes.task_types)) {
      taskTypes = activeTaskTypes.task_types;
    } else if (activeTaskTypes.data && Array.isArray(activeTaskTypes.data)) {
      taskTypes = activeTaskTypes.data;
    } else if (activeTaskTypes.results && Array.isArray(activeTaskTypes.results)) {
      taskTypes = activeTaskTypes.results;
    }
  }
  
  // Extract locations
  let locations = [];
  if (locationsData) {
    if (Array.isArray(locationsData)) {
      locations = locationsData;
    } else if (locationsData.locations && Array.isArray(locationsData.locations)) {
      locations = locationsData.locations;
    } else if (locationsData.data && Array.isArray(locationsData.data)) {
      locations = locationsData.data;
    } else if (locationsData.results && Array.isArray(locationsData.results)) {
      locations = locationsData.results;
    }
  }
  
  // Extract assets
  let assets = [];
  if (assetsData) {
    if (Array.isArray(assetsData)) {
      assets = assetsData;
    } else if (assetsData.assets && Array.isArray(assetsData.assets)) {
      assets = assetsData.assets;
    } else if (assetsData.data && Array.isArray(assetsData.data)) {
      assets = assetsData.data;
    } else if (assetsData.results && Array.isArray(assetsData.results)) {
      assets = assetsData.results;
    }
  }
  
  // Extract roles
  let roles = [];
  if (rolesData) {
    if (Array.isArray(rolesData)) {
      roles = rolesData;
    } else if (rolesData.roles && Array.isArray(rolesData.roles)) {
      roles = rolesData.roles;
    } else if (rolesData.data && Array.isArray(rolesData.data)) {
      roles = rolesData.data;
    } else if (rolesData.results && Array.isArray(rolesData.results)) {
      roles = rolesData.results;
    }
  }
  
  // Extract forms
  let forms = [];
  if (formsResponse) {
    if (Array.isArray(formsResponse)) {
      forms = formsResponse;
    } else if (formsResponse.forms && Array.isArray(formsResponse.forms)) {
      forms = formsResponse.forms;
    } else if (formsResponse.data && Array.isArray(formsResponse.data)) {
      forms = formsResponse.data;
    } else if (formsResponse.results && Array.isArray(formsResponse.results)) {
      forms = formsResponse.results;
    }
  }
  
  // Get users for selected role (for role assignment info)
  const selectedRoleId = taskFormData.assigned_to_role_id
    ? parseInt(taskFormData.assigned_to_role_id)
    : null;
  const { data: roleUsersData } = useRoleUsers(selectedRoleId);
  
  // Extract role users
  let roleUsers = [];
  if (roleUsersData) {
    if (Array.isArray(roleUsersData)) {
      roleUsers = roleUsersData;
    } else if (roleUsersData.users && Array.isArray(roleUsersData.users)) {
      roleUsers = roleUsersData.users;
    } else if (roleUsersData.data && Array.isArray(roleUsersData.data)) {
      roleUsers = roleUsersData.data;
    } else if (roleUsersData.results && Array.isArray(roleUsersData.results)) {
      roleUsers = roleUsersData.results;
    }
  }
  
  // Count active users in selected role
  const activeRoleUsersCount = roleUsers.filter(user => user.is_active !== false).length;

  // Filter out tasks already in project (those with this project_id or already in projectTasks)
  // Use accumulatedTasks instead of allTasks to show all loaded tasks
  const availableTasks = useMemo(() => {
    const tasksToFilter = accumulatedTasks.length > 0 ? accumulatedTasks : allTasks;
    
    if (!Array.isArray(tasksToFilter) || tasksToFilter.length === 0) {
      return [];
    }
    
    const projectIdNum = parseInt(projectId);
    const projectTaskIds = new Set(
      Array.isArray(projectTasks) ? projectTasks.map(t => t.id) : []
    );
    
    return tasksToFilter.filter((task) => {
      if (!task || !task.id) return false;
      
      // Exclude if task is already in projectTasks list
      if (projectTaskIds.has(task.id)) {
        return false;
      }
      // Exclude if task already has this project_id
      const taskProjectId = task.project_id ? parseInt(task.project_id) : null;
      if (taskProjectId === projectIdNum) {
        return false;
      }
      return true;
    });
  }, [accumulatedTasks, allTasks, projectTasks, projectId]);
  
  // Get pagination info from response
  const tasksPagination = allTasksResponse?.pagination || allTasksResponse || {};
  const hasMoreTasks = tasksPagination.total_pages ? taskPage < tasksPagination.total_pages : false;
  const totalTasks = tasksPagination.total || 0;

  // Filter out users already in project
  const availableUsers = Array.isArray(users)
    ? users.filter(
        (member) =>
          !Array.isArray(members) ||
          !members.some((m) => (m.user_id || m.id) === (member.id || member.user_id))
      )
    : [];

  const openEditModal = () => {
    if (project) {
      setProjectFormData({
        name: project.name || "",
        description: project.description || "",
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProject = async () => {
    if (!projectFormData.name.trim() || !project) {
      return;
    }

    try {
      await updateProjectMutation.mutateAsync({
        id: projectId,
        projectData: {
          name: projectFormData.name.trim(),
          description: projectFormData.description?.trim() || "",
        },
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleDeleteProject = async (force = false) => {
    try {
      await deleteProjectMutation.mutateAsync({ id: projectId, force });
      router.push("/admin/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleAddTask = async () => {
    if (!selectedTaskId) return;

    try {
      await addTaskMutation.mutateAsync({
        projectId,
        taskId: parseInt(selectedTaskId),
      });
      // Invalidate queries to refresh the project tasks list
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Also refresh all tasks
      setIsAddTaskModalOpen(false);
      setSelectedTaskId("");
      setAccumulatedTasks([]); // Reset accumulated tasks
      setTaskPage(1); // Reset to first page
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleRemoveTask = async (taskId) => {
    try {
      await removeTaskMutation.mutateAsync({
        projectId,
        taskId,
      });
      // Invalidate queries to refresh the project tasks list
      queryClient.invalidateQueries({ 
        queryKey: [...projectKeys.all, "tasks", projectId],
        exact: false 
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Also refresh all tasks
    } catch (error) {
      console.error("Failed to remove task:", error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      await addMemberMutation.mutateAsync({
        projectId,
        userId: parseInt(selectedUserId),
      });
      setIsAddMemberModalOpen(false);
      setSelectedUserId("");
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeMemberMutation.mutateAsync({
        projectId,
        userId,
      });
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const validateForm = () => {
    const errors = {};

    // Title validation
    if (!taskFormData.title || taskFormData.title.trim().length === 0) {
      errors.title = "Title is required";
    } else if (taskFormData.title.trim().length > 255) {
      errors.title = "Title must be 255 characters or less";
    }

    // Task type validation
    if (!taskFormData.task_type) {
      errors.task_type = "Task type is required";
    }

    // Assignment validation
    if (assignmentMode === "multiple-users" && selectedUserIds.length === 0) {
      errors.assignment = "At least one user must be selected";
    } else if (assignmentMode === "user" && (!taskFormData.assigned_to_user_id || taskFormData.assigned_to_user_id === "none")) {
      errors.assignment = "A user must be selected";
    } else if (assignmentMode === "role" && (!taskFormData.assigned_to_role_id || taskFormData.assigned_to_role_id === "none")) {
      errors.assignment = "A role must be selected";
    } else if (assignmentMode === "asset") {
      if (!taskFormData.assigned_to_asset_id || taskFormData.assigned_to_asset_id === "none") {
        errors.asset_assignment = "An asset must be selected";
      } else if (assetAssignmentType === "user" && (!taskFormData.assigned_to_user_id || taskFormData.assigned_to_user_id === "")) {
        errors.asset_assignment = "A user must be selected when assigning to an asset";
      } else if (assetAssignmentType === "role" && (!taskFormData.assigned_to_role_id || taskFormData.assigned_to_role_id === "")) {
        errors.asset_assignment = "A role must be selected when assigning to an asset";
      }
    }

    // Recurring task validation
    if (isRecurring) {
      if (!recurrencePattern.frequency) {
        errors.recurrence = "Frequency is required for recurring tasks";
      }
      if (!recurrencePattern.interval || recurrencePattern.interval < 1) {
        errors.recurrence = "Interval must be at least 1";
      }
      if (recurrencePattern.frequency === "weekly" && recurrencePattern.days_of_week.length === 0) {
        errors.recurrence = "At least one day of week must be selected for weekly recurrence";
      }
      if ((recurrencePattern.frequency === "daily" || recurrencePattern.frequency === "weekly") && recurrencePattern.times.length === 0) {
        errors.recurrence = "At least one time must be specified for daily/weekly recurrence";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: "",
      task_type: "",
      description: "",
      due_date: "",
      priority: "",
      status: "pending",
      location_id: "",
      assigned_to_user_id: "",
      assigned_user_ids: [],
      assigned_to_role_id: "",
      assigned_to_asset_id: "",
      form_id: "",
      form_submission_id: "",
      project_id: projectId, // Always set to current project
    });
    setSelectedUserIds([]);
    setDueDate(null);
    setStartDate(null);
    setAssignmentMode("multiple-users");
    setAssetAssignmentType("user");
    setIsRecurring(false);
    setCreateIndividualTasks(false);
    setRecurrencePattern({
      frequency: "daily",
      interval: 1,
      days_of_week: [],
      times: [],
    });
    setNewTime("");
    setFormErrors({});
  };
  
  // Initialize project_id when modal opens
  React.useEffect(() => {
    if (isCreateTaskModalOpen) {
      setTaskFormData(prev => ({
        ...prev,
        project_id: projectId, // Ensure project_id is always set to current project
      }));
    }
  }, [isCreateTaskModalOpen, projectId]);

  const handleCreateTask = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const taskData = {
        title: taskFormData.title.trim(),
        task_type: taskFormData.task_type,
        status: taskFormData.status || "pending",
        project_id: parseInt(projectId), // Always set to current project
      };

      // Only include optional fields if they have valid values
      if (taskFormData.description) {
        taskData.description = taskFormData.description;
      }

      if (dueDate) {
        taskData.due_date = format(dueDate, "yyyy-MM-dd'T'HH:mm:ss");
      }

      // Include start_date - default to current date if not set
      if (startDate) {
        taskData.start_date = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
      } else {
        // Default to current date/time if not specified
        taskData.start_date = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
      }

      if (taskFormData.priority) {
        taskData.priority = taskFormData.priority;
      }

      // Handle assignment based on mode
      if (assignmentMode === "user") {
        // Single user assignment
        if (taskFormData.assigned_to_user_id && taskFormData.assigned_to_user_id !== "none") {
          const userId = parseInt(taskFormData.assigned_to_user_id);
          if (!isNaN(userId)) {
            taskData.assigned_to_user_id = userId;
          }
        }
      } else if (assignmentMode === "multiple-users") {
        // Multiple users assignment
        if (selectedUserIds.length > 0) {
          taskData.assigned_user_ids = selectedUserIds;
          // Add create_individual_tasks flag for multiple users
          if (createIndividualTasks) {
            taskData.create_individual_tasks = true;
          }
        }
      } else if (assignmentMode === "role") {
        // Role assignment
        if (taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "none") {
          const roleId = parseInt(taskFormData.assigned_to_role_id);
          if (!isNaN(roleId)) {
            taskData.assigned_to_role_id = roleId;
          }
        }
      } else if (assignmentMode === "asset") {
        // Asset assignment - requires both asset and either user or role
        if (taskFormData.assigned_to_asset_id && taskFormData.assigned_to_asset_id !== "none") {
          const assetId = parseInt(taskFormData.assigned_to_asset_id);
          if (!isNaN(assetId)) {
            taskData.assigned_to_asset_id = assetId;
          }
        }
        // Include user_id or role_id based on assetAssignmentType
        if (assetAssignmentType === "user" && taskFormData.assigned_to_user_id && taskFormData.assigned_to_user_id !== "") {
          const userId = parseInt(taskFormData.assigned_to_user_id);
          if (!isNaN(userId)) {
            taskData.assigned_to_user_id = userId;
          }
        } else if (assetAssignmentType === "role" && taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "") {
          const roleId = parseInt(taskFormData.assigned_to_role_id);
          if (!isNaN(roleId)) {
            taskData.assigned_to_role_id = roleId;
          }
        }
      }

      // Only include location_id if it has a valid value
      if (taskFormData.location_id && taskFormData.location_id !== "" && taskFormData.location_id !== "none") {
        const locationId = parseInt(taskFormData.location_id);
        if (!isNaN(locationId)) {
          taskData.location_id = locationId;
        }
      }

      // Only include form_id if it has a value
      if (taskFormData.form_id && taskFormData.form_id !== "" && taskFormData.form_id !== "none") {
        const formId = parseInt(taskFormData.form_id);
        if (!isNaN(formId)) {
          taskData.form_id = formId;
        }
      }

      // Only include form_submission_id if it has a value
      if (taskFormData.form_submission_id && taskFormData.form_submission_id !== "" && taskFormData.form_submission_id !== "none") {
        const submissionId = parseInt(taskFormData.form_submission_id);
        if (!isNaN(submissionId)) {
          taskData.form_submission_id = submissionId;
        }
      }

      // Recurring task configuration
      if (isRecurring) {
        taskData.is_recurring = true;
        taskData.recurrence_pattern = {
          frequency: recurrencePattern.frequency,
          interval: recurrencePattern.interval,
        };
        if (recurrencePattern.frequency === "weekly" && recurrencePattern.days_of_week.length > 0) {
          taskData.recurrence_pattern.days_of_week = recurrencePattern.days_of_week;
        }
        if ((recurrencePattern.frequency === "daily" || recurrencePattern.frequency === "weekly") && recurrencePattern.times.length > 0) {
          taskData.recurrence_pattern.times = recurrencePattern.times;
        }
      }

      await createTaskMutation.mutateAsync(taskData);
      // Invalidate project tasks queries to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: [...projectKeys.all, "tasks", projectId],
        exact: false 
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsCreateTaskModalOpen(false);
      resetTaskForm();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link href="/admin/projects">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Project not found or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{project.name}</h1>
            <p className="text-sm md:text-base text-muted-foreground">Project Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {canUpdateProject && (
            <Button
              variant="outline"
              onClick={openEditModal}
              className="h-11 min-h-[44px] px-3 sm:px-4 text-sm flex-shrink-0"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDeleteProject && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="h-11 min-h-[44px] px-3 sm:px-4 text-sm flex-shrink-0"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      Are you sure you want to delete "{project.name}"?
                    </p>
                    <div className="bg-muted p-3 rounded-md space-y-2">
                      <p className="text-sm font-medium">Soft Delete (Default):</p>
                      <p className="text-sm text-muted-foreground">
                        Deactivates the project. It can be restored later. 
                        Tasks will be unassigned from the project.
                      </p>
                      <p className="text-sm font-medium mt-3">Hard Delete (Permanent):</p>
                      <p className="text-sm text-destructive">
                        ⚠️ Permanently removes the project from the database. 
                        This action cannot be undone!
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteProject(false)}
                    className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                  >
                    Soft Delete
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={() => handleDeleteProject(true)}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  >
                    Hard Delete (Permanent)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="mt-1">{project.description || "No description provided"}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks
              </Label>
              <p className="mt-1 text-2xl font-bold">
                {Array.isArray(projectTasks) ? projectTasks.length : 0}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </Label>
              <p className="mt-1 text-2xl font-bold">
                {Array.isArray(members) ? members.length : 0}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </Label>
              <p className="mt-1">
                {project.created_at
                  ? format(new Date(project.created_at), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Tasks and Members */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">
            <CheckSquare className="mr-2 h-4 w-4" />
            Tasks ({Array.isArray(projectTasks) ? projectTasks.length : 0})
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members ({Array.isArray(members) ? members.length : 0})
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks in Project</CardTitle>
              {canAddTask && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsAddTaskModalOpen(true)}>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Add Existing Task
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsCreateTaskModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !Array.isArray(projectTasks) || projectTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tasks in this project</p>
                  {canAddTask && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Task
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsAddTaskModalOpen(true)}>
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Add Existing Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsCreateTaskModalOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Link
                              href={`/admin/tasks/${task.id}`}
                              className="font-medium hover:underline"
                            >
                              {task.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                task.status === "completed"
                                  ? "default"
                                  : task.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {task.status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.priority && (
                              <Badge variant="outline">{task.priority}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.due_date
                              ? format(new Date(task.due_date), "MMM dd, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            {canRemoveTask && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTask(task.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Members</CardTitle>
              {canAddMember && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddMemberModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !Array.isArray(members) || members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No members in this project</p>
                  {canAddMember && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsAddMemberModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => {
                        const user = users.find(
                          (u) => u.id === (member.user_id || member.id)
                        );
                        return (
                          <TableRow key={member.user_id || member.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {user?.display_name ||
                                  `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                                  user?.email ||
                                  "Unknown User"}
                              </div>
                            </TableCell>
                            <TableCell>{user?.email || "N/A"}</TableCell>
                            <TableCell>
                              {member.role && <Badge variant="outline">{member.role}</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              {canRemoveMember && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveMember(member.user_id || member.id)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details and information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-project-name">Project Name *</Label>
              <Input
                id="edit-project-name"
                value={projectFormData.name}
                onChange={(e) =>
                  setProjectFormData({ ...projectFormData, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="edit-project-description">Description</Label>
              <textarea
                id="edit-project-description"
                value={projectFormData.description}
                onChange={(e) =>
                  setProjectFormData({ ...projectFormData, description: e.target.value })
                }
                placeholder="Enter project description (optional)"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="h-10 min-h-[40px] px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProject}
              disabled={updateProjectMutation.isPending || !projectFormData.name.trim()}
              className="h-10 min-h-[40px] px-4"
            >
              {updateProjectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task to Project</DialogTitle>
            <DialogDescription>
              Select a task to add to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search Tasks</Label>
              <Input
                placeholder="Search tasks by title..."
                value={taskSearchTerm}
                onChange={(e) => {
                  setTaskSearchTerm(e.target.value);
                  setTaskPage(1); // Reset to first page when searching
                }}
                className="mb-2"
              />
            </div>
            <div>
              <Label>Task</Label>
              {allTasksError ? (
                <div className="p-4 border rounded-md bg-destructive/10 border-destructive/20">
                  <p className="text-sm text-destructive mb-2">
                    Failed to load tasks. This might be due to a network issue.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can still create a new task using the "Create New Task" option.
                  </p>
                </div>
              ) : allTasksLoading || !Array.isArray(allTasks) ? (
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">Loading tasks...</p>
                </div>
              ) : availableTasks.length === 0 && allTasks.length === 0 ? (
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {taskSearchTerm 
                      ? `No tasks found matching "${taskSearchTerm}". Try a different search term.`
                      : "No tasks available. Please create a task first from the Tasks page."}
                  </p>
                </div>
              ) : availableTasks.length === 0 ? (
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    All {accumulatedTasks.length > 0 ? accumulatedTasks.length : allTasks.length} task{(accumulatedTasks.length > 0 ? accumulatedTasks.length : allTasks.length) !== 1 ? 's' : ''} loaded {(accumulatedTasks.length > 0 ? accumulatedTasks.length : allTasks.length) !== 1 ? 'are' : 'is'} already in this project.
                    {hasMoreTasks && " Try searching or loading more tasks."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title || `Task #${task.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasMoreTasks && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>
                        Showing {availableTasks.length} of {totalTasks > 0 ? totalTasks : 'many'} available tasks
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTaskPage(prev => prev + 1)}
                        disabled={allTasksLoading}
                        className="h-7 text-xs"
                      >
                        {allTasksLoading ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTaskModalOpen(false);
                setSelectedTaskId("");
              }}
              className="h-10 min-h-[40px] px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={addTaskMutation.isPending || !selectedTaskId}
              className="h-10 min-h-[40px] px-4"
            >
              {addTaskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal - Using comprehensive modal from Tasks page */}
      <Dialog open={isCreateTaskModalOpen} onOpenChange={setIsCreateTaskModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to users, roles, or assets. This task will be added to the current project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={taskFormData.title}
                onChange={(e) => {
                  setTaskFormData({ ...taskFormData, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: null });
                  }
                }}
                placeholder="Enter task title"
                maxLength={255}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-red-600 mt-1">{formErrors.title}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task_type">Task Type *</Label>
                <Select
                  value={taskFormData.task_type || undefined}
                  onValueChange={(value) => {
                    setTaskFormData({ ...taskFormData, task_type: value });
                    if (formErrors.task_type) {
                      setFormErrors({ ...formErrors, task_type: null });
                    }
                  }}
                >
                  <SelectTrigger className={formErrors.task_type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.length === 0 ? (
                      <SelectItem value="none" disabled>Loading task types...</SelectItem>
                    ) : (
                      taskTypes.map((taskType) => (
                        <SelectItem key={taskType.id} value={taskType.name}>
                          <div className="flex items-center gap-2">
                            {taskType.icon && <span>{taskType.icon}</span>}
                            <span>{taskType.display_name || taskType.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.task_type && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.task_type}</p>
                )}
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskFormData.priority || undefined}
                  onValueChange={(value) =>
                    setTaskFormData({ ...taskFormData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskFormData.description}
                onChange={(e) =>
                  setTaskFormData({
                    ...taskFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter task description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date (defaults to now)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/* Project is pre-set, so we don't show the project selector */}
            <div className="p-3 bg-muted/50 border rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Project:</strong> {project?.name || "Current Project"}
              </p>
            </div>
            <div>
              <Label>Location</Label>
              <Select
                value={taskFormData.location_id && taskFormData.location_id !== "" ? taskFormData.location_id : undefined}
                onValueChange={(value) =>
                  setTaskFormData({ ...taskFormData, location_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Assignment Section */}
            <div>
              <Label className="mb-3 block">Task Assignment</Label>
              <Tabs value={assignmentMode} onValueChange={setAssignmentMode} className="w-full">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-4">
                    <TabsTrigger value="multiple-users" className="whitespace-nowrap">
                      <Users className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Multiple Users</span>
                      <span className="sm:hidden">Multiple</span>
                    </TabsTrigger>
                    <TabsTrigger value="role" className="whitespace-nowrap">
                      <Shield className="mr-2 h-4 w-4" />
                      Role
                    </TabsTrigger>
                    <TabsTrigger value="user" className="whitespace-nowrap">
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Single User</span>
                      <span className="sm:hidden">Single</span>
                    </TabsTrigger>
                    <TabsTrigger value="asset" className="whitespace-nowrap">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Asset
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Multiple Users Tab */}
                <TabsContent value="multiple-users" className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {createIndividualTasks
                            ? "Each selected user will receive their own individual task to complete separately."
                            : "All selected users will share the same collaborative task."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create_individual_tasks"
                      checked={createIndividualTasks}
                      onCheckedChange={(checked) => setCreateIndividualTasks(checked)}
                    />
                    <Label htmlFor="create_individual_tasks" className="cursor-pointer">
                      Create individual tasks
                    </Label>
                  </div>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No users available</p>
                    ) : (
                      <div className="space-y-2">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="h-4 w-4"
                            />
                            <label className="text-sm">
                              {user.display_name ||
                                `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                                user.email}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formErrors.assignment && assignmentMode === "multiple-users" && (
                    <p className="text-sm text-red-600">{formErrors.assignment}</p>
                  )}
                </TabsContent>

                {/* Role Tab */}
                <TabsContent value="role" className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Individual Tasks Mode
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          This will create individual tasks for all active users in this role. Each user will receive their own task in their "My Tasks" section.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Select
                    value={taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "" ? taskFormData.assigned_to_role_id : undefined}
                    onValueChange={(value) => {
                      setTaskFormData({
                        ...taskFormData,
                        assigned_to_role_id: value,
                        assigned_to_user_id: "",
                        assigned_to_asset_id: "",
                        assigned_user_ids: [],
                      });
                      setSelectedUserIds([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.display_name || role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "" && selectedRoleId && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200">
                        {activeRoleUsersCount > 0 ? (
                          <span>
                            <Badge variant="outline" className="mr-2">
                              {activeRoleUsersCount}
                            </Badge>
                            active {activeRoleUsersCount === 1 ? 'user' : 'users'} in this role will receive {activeRoleUsersCount === 1 ? 'a task' : 'tasks'}.
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">No active users found in this role.</span>
                        )}
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Single User Tab */}
                <TabsContent value="user" className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Assign this task to a single user. One task will be created for this user.
                      </p>
                    </div>
                  </div>
                  <Select
                    value={taskFormData.assigned_to_user_id && taskFormData.assigned_to_user_id !== "" ? taskFormData.assigned_to_user_id : undefined}
                    onValueChange={(value) => {
                      setTaskFormData({
                        ...taskFormData,
                        assigned_to_user_id: value,
                        assigned_to_role_id: "",
                        assigned_to_asset_id: "",
                        assigned_user_ids: [],
                      });
                      setSelectedUserIds([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.display_name ||
                            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                            user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>

                {/* Asset Tab */}
                <TabsContent value="asset" className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Assign this task to an asset. You must also select either a user or role to be responsible for this task.
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Asset *</Label>
                    <Select
                      value={taskFormData.assigned_to_asset_id && taskFormData.assigned_to_asset_id !== "" ? taskFormData.assigned_to_asset_id : undefined}
                      onValueChange={(value) => {
                        setTaskFormData({
                          ...taskFormData,
                          assigned_to_asset_id: value,
                        });
                        if (formErrors.asset_assignment) {
                          setFormErrors({ ...formErrors, asset_assignment: null });
                        }
                      }}
                    >
                      <SelectTrigger className={formErrors.asset_assignment ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            {asset.name || asset.asset_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Assign to (User or Role) *</Label>
                    <Tabs value={assetAssignmentType} onValueChange={setAssetAssignmentType} className="w-full">
                      <div className="overflow-x-auto scrollbar-hide">
                        <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-2">
                          <TabsTrigger value="user" className="whitespace-nowrap">
                            <User className="mr-2 h-4 w-4" />
                            User
                          </TabsTrigger>
                          <TabsTrigger value="role" className="whitespace-nowrap">
                            <Shield className="mr-2 h-4 w-4" />
                            Role
                          </TabsTrigger>
                        </TabsList>
                      </div>
                      <TabsContent value="user" className="mt-3">
                        <Select
                          value={taskFormData.assigned_to_user_id && taskFormData.assigned_to_user_id !== "" ? taskFormData.assigned_to_user_id : undefined}
                          onValueChange={(value) => {
                            setTaskFormData({
                              ...taskFormData,
                              assigned_to_user_id: value,
                              assigned_to_role_id: "",
                            });
                            if (formErrors.asset_assignment) {
                              setFormErrors({ ...formErrors, asset_assignment: null });
                            }
                          }}
                        >
                          <SelectTrigger className={formErrors.asset_assignment ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.display_name ||
                                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                                  user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TabsContent>
                      <TabsContent value="role" className="mt-3">
                        <Select
                          value={taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "" ? taskFormData.assigned_to_role_id : undefined}
                          onValueChange={(value) => {
                            setTaskFormData({
                              ...taskFormData,
                              assigned_to_role_id: value,
                              assigned_to_user_id: "",
                            });
                            if (formErrors.asset_assignment) {
                              setFormErrors({ ...formErrors, asset_assignment: null });
                            }
                          }}
                        >
                          <SelectTrigger className={formErrors.asset_assignment ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.display_name || role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "" && selectedRoleId && (
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md mt-3">
                            <p className="text-xs font-medium text-green-800 dark:text-green-200">
                              {activeRoleUsersCount > 0 ? (
                                <span>
                                  <Badge variant="outline" className="mr-2">
                                    {activeRoleUsersCount}
                                  </Badge>
                                  active {activeRoleUsersCount === 1 ? 'user' : 'users'} in this role will receive {activeRoleUsersCount === 1 ? 'a task' : 'tasks'}.
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">No active users found in this role.</span>
                              )}
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                  {formErrors.asset_assignment && (
                    <p className="text-sm text-red-600">{formErrors.asset_assignment}</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Recurring Task Configuration */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setIsRecurring(checked);
                    if (!checked) {
                      setFormErrors({ ...formErrors, recurrence: null });
                    }
                  }}
                />
                <Label htmlFor="is_recurring" className="cursor-pointer flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  This is a recurring task
                </Label>
              </div>

              {isRecurring && (
                <div className="border rounded-md p-4 space-y-4 bg-muted/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="frequency">Frequency *</Label>
                      <Select
                        value={recurrencePattern.frequency}
                        onValueChange={(value) => {
                          setRecurrencePattern({
                            ...recurrencePattern,
                            frequency: value,
                            days_of_week: value !== "weekly" ? [] : recurrencePattern.days_of_week,
                            times: (value !== "daily" && value !== "weekly") ? [] : recurrencePattern.times,
                          });
                          if (formErrors.recurrence) {
                            setFormErrors({ ...formErrors, recurrence: null });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="interval">Interval *</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={recurrencePattern.interval}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setRecurrencePattern({ ...recurrencePattern, interval: value });
                          if (formErrors.recurrence) {
                            setFormErrors({ ...formErrors, recurrence: null });
                          }
                        }}
                        placeholder="Every X"
                      />
                    </div>
                  </div>

                  {recurrencePattern.frequency === "weekly" && (
                    <div>
                      <Label>Days of Week *</Label>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day}`}
                              checked={recurrencePattern.days_of_week.includes(day)}
                              onCheckedChange={(checked) => {
                                const newDays = checked
                                  ? [...recurrencePattern.days_of_week, day]
                                  : recurrencePattern.days_of_week.filter((d) => d !== day);
                                setRecurrencePattern({ ...recurrencePattern, days_of_week: newDays });
                                if (formErrors.recurrence) {
                                  setFormErrors({ ...formErrors, recurrence: null });
                                }
                              }}
                            />
                            <Label htmlFor={`day-${day}`} className="cursor-pointer text-xs capitalize">
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(recurrencePattern.frequency === "daily" || recurrencePattern.frequency === "weekly") && (
                    <div>
                      <Label>Times * (HH:mm format)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          placeholder="HH:mm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (newTime && !recurrencePattern.times.includes(newTime)) {
                              setRecurrencePattern({
                                ...recurrencePattern,
                                times: [...recurrencePattern.times, newTime],
                              });
                              setNewTime("");
                              if (formErrors.recurrence) {
                                setFormErrors({ ...formErrors, recurrence: null });
                              }
                            }
                          }}
                        >
                          Add Time
                        </Button>
                      </div>
                      {recurrencePattern.times.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {recurrencePattern.times.map((time, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {time}
                              <button
                                type="button"
                                onClick={() => {
                                  setRecurrencePattern({
                                    ...recurrencePattern,
                                    times: recurrencePattern.times.filter((_, i) => i !== index),
                                  });
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {formErrors.recurrence && (
                    <p className="text-sm text-red-600">{formErrors.recurrence}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Link to Form</Label>
                <Select
                  value={taskFormData.form_id && taskFormData.form_id !== "" ? taskFormData.form_id : undefined}
                  onValueChange={(value) =>
                    setTaskFormData({
                      ...taskFormData,
                      form_id: value === "none" ? "" : value,
                      form_submission_id: value === "none" ? "" : taskFormData.form_submission_id,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select form (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id.toString()}>
                        {form.form_title || form.form_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Form Submission ID</Label>
                <Input
                  type="number"
                  value={taskFormData.form_submission_id || ""}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      form_submission_id: e.target.value,
                    })
                  }
                  placeholder="Optional submission ID"
                  disabled={!taskFormData.form_id || taskFormData.form_id === "none"}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTaskModalOpen(false);
                resetTaskForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Project</DialogTitle>
            <DialogDescription>
              Select a user to add to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available users
                    </SelectItem>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.display_name ||
                          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                          user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberModalOpen(false);
                setSelectedUserId("");
              }}
              className="h-10 min-h-[40px] px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending || !selectedUserId}
              className="h-10 min-h-[40px] px-4"
            >
              {addMemberMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetailPage;


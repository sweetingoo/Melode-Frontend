"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Flag,
  FileText,
  Loader2,
  X,
  Users,
  Building2,
  Image as ImageIcon,
  Info,
  Shield,
  Repeat,
} from "lucide-react";
import {
  useTasks,
  useDeleteTask,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useAssignTask,
  useTaskStats,
  useOverdueTasks,
  useDueSoonTasks,
  useComplianceTasks,
  useAutomatedTasks,
  useMyTasks,
} from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useLocations } from "@/hooks/useLocations";
import { useAssets } from "@/hooks/useAssets";
import { useRoles, useRoleUsers } from "@/hooks/useRoles";
import { useActiveTaskTypes } from "@/hooks/useTaskTypes";
import { useForms } from "@/hooks/useForms";
import { useCurrentUser } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState("all"); // all, my-tasks, overdue, due-soon, compliance, automated
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    task_type: "",
    assigned_to_user_id: "",
    is_overdue: "",
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
  });
  const [completionData, setCompletionData] = useState({
    completion_data: {},
    notes: "",
    progress_percentage: 100,
  });
  const [assignmentData, setAssignmentData] = useState({
    assigned_to_user_id: "",
    assigned_user_ids: [],
    assigned_to_role_id: "",
    assigned_to_asset_id: "",
  });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState("multiple-users"); // "role", "user", "asset", "multiple-users"
  const [editAssignmentMode, setEditAssignmentMode] = useState("multiple-users");
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

  const itemsPerPage = 20;

  // Clean filters - remove empty strings and convert to proper types
  const cleanFilters = React.useMemo(() => {
    const cleaned = {};
    if (filters.status) cleaned.status = filters.status;
    if (filters.priority) cleaned.priority = filters.priority;
    if (filters.task_type) cleaned.task_type = filters.task_type;
    if (filters.assigned_to_user_id) {
      const userId = parseInt(filters.assigned_to_user_id);
      if (!isNaN(userId)) cleaned.assigned_to_user_id = userId;
    }
    if (filters.is_overdue !== "") {
      if (filters.is_overdue === "true") cleaned.is_overdue = true;
      else if (filters.is_overdue === "false") cleaned.is_overdue = false;
    }
    return cleaned;
  }, [filters]);

  // API hooks - only enable the one needed for current view mode
  const { data: tasksResponse, isLoading, error, refetch } = useTasks({
    page: currentPage,
    per_page: itemsPerPage,
    ...cleanFilters,
  }, {
    enabled: viewMode === "all",
  });
  const { data: myTasksResponse } = useMyTasks({
    page: currentPage,
    per_page: itemsPerPage,
  }, {
    enabled: viewMode === "my-tasks",
  });
  const { data: overdueTasksResponse } = useOverdueTasks({
    page: currentPage,
    per_page: itemsPerPage,
  }, {
    enabled: viewMode === "overdue",
  });
  const { data: dueSoonTasksResponse } = useDueSoonTasks({
    page: currentPage,
    per_page: itemsPerPage,
  }, {
    enabled: viewMode === "due-soon",
  });
  const { data: complianceTasksResponse } = useComplianceTasks({
    page: currentPage,
    per_page: itemsPerPage,
  }, {
    enabled: viewMode === "compliance",
  });
  const { data: automatedTasksResponse } = useAutomatedTasks({
    page: currentPage,
    per_page: itemsPerPage,
  }, {
    enabled: viewMode === "automated",
  });
  const { data: statsData, isLoading: statsLoading, error: statsError } = useTaskStats();
  const { data: usersResponse } = useUsers();
  const { data: locationsData } = useLocations();
  const { data: assetsData } = useAssets();
  const { data: rolesData } = useRoles();
  const { data: activeTaskTypes } = useActiveTaskTypes();
  const { data: formsResponse } = useForms();
  const { data: currentUserData } = useCurrentUser();
  const isMobile = useIsMobile();

  // Get users for selected role (for role assignment info)
  const selectedRoleId = taskFormData.assigned_to_role_id
    ? parseInt(taskFormData.assigned_to_role_id)
    : null;
  const { data: roleUsersData } = useRoleUsers(selectedRoleId);

  // Permission checking
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions = currentUserData?.direct_permissions || [];

  // Extract permission names
  const userPermissionNames = React.useMemo(() => {
    const allPermissions = [...currentUserPermissions, ...currentUserDirectPermissions];
    return allPermissions.map((p) => {
      if (typeof p === "string") return p;
      if (typeof p === "object") {
        return p.permission || p.name || p.permission_id || p.id || "";
      }
      return String(p);
    }).filter(Boolean);
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Check if user has wildcard permissions
  const hasWildcardPermissions = userPermissionNames.includes("*");

  // Permission check helper
  const hasPermission = React.useCallback((permission) => {
    if (hasWildcardPermissions) return true;
    return userPermissionNames.some((perm) => {
      if (perm === permission) return true;
      // Resource match (e.g., task:create matches tasks:create)
      const permResource = perm.split(":")[0];
      const checkResource = permission.split(":")[0];
      if (permResource === checkResource || permResource === checkResource + "s" || permResource + "s" === checkResource) {
        return true;
      }
      return perm.includes(checkResource);
    });
  }, [userPermissionNames, hasWildcardPermissions]);

  // Task permissions
  const canCreateTask = hasPermission("task:create");
  const canUpdateTask = hasPermission("task:update");
  const canDeleteTask = hasPermission("task:delete");
  const canAssignTask = hasPermission("task:assign");
  const canListTasks = hasPermission("task:list") || hasPermission("task:read") || hasPermission("tasks:read");

  // Handle different API response structures for forms
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

  const deleteTaskMutation = useDeleteTask();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const completeTaskMutation = useCompleteTask();
  const assignTaskMutation = useAssignTask();

  // Get tasks based on view mode
  const getCurrentTasks = () => {
    switch (viewMode) {
      case "my-tasks":
        return myTasksResponse;
      case "overdue":
        return overdueTasksResponse;
      case "due-soon":
        return dueSoonTasksResponse;
      case "compliance":
        return complianceTasksResponse;
      case "automated":
        return automatedTasksResponse;
      default:
        return tasksResponse;
    }
  };

  const currentTasksResponse = getCurrentTasks();
  // Handle different API response structures
  let tasks = [];
  if (currentTasksResponse) {
    if (Array.isArray(currentTasksResponse)) {
      tasks = currentTasksResponse;
    } else if (currentTasksResponse.tasks && Array.isArray(currentTasksResponse.tasks)) {
      tasks = currentTasksResponse.tasks;
    } else if (currentTasksResponse.data && Array.isArray(currentTasksResponse.data)) {
      tasks = currentTasksResponse.data;
    } else if (currentTasksResponse.results && Array.isArray(currentTasksResponse.results)) {
      tasks = currentTasksResponse.results;
    }
  }

  // Only calculate pagination from actual API response, not from array length
  const pagination = {
    page: currentTasksResponse?.page ?? currentPage,
    per_page: currentTasksResponse?.per_page ?? itemsPerPage,
    total: typeof currentTasksResponse?.total === 'number' ? currentTasksResponse.total :
      (currentTasksResponse && !isLoading ? tasks.length : 0),
    total_pages: typeof currentTasksResponse?.total_pages === 'number' ? currentTasksResponse.total_pages :
      (typeof currentTasksResponse?.total === 'number' ? Math.ceil(currentTasksResponse.total / itemsPerPage) : 1),
  };

  // Extract users from response - handle different response structures
  let users = [];
  if (usersResponse) {
    if (Array.isArray(usersResponse)) {
      users = usersResponse;
    } else if (usersResponse.users && Array.isArray(usersResponse.users)) {
      users = usersResponse.users;
    } else if (usersResponse.data && Array.isArray(usersResponse.data)) {
      users = usersResponse.data;
    } else if (usersResponse.results && Array.isArray(usersResponse.results)) {
      users = usersResponse.results;
    }
  }

  // Extract locations from response
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

  // Extract assets from response
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

  // Extract roles from response
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

  // Extract task types from response
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

  // Extract role users from response
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

  // Filter tasks by search term
  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.task_type?.toLowerCase().includes(searchLower) ||
      task.assignee_display?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "cancelled":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "medium":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "low":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
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
      };

      // Only include optional fields if they have valid values
      if (taskFormData.description) {
        taskData.description = taskFormData.description;
      }

      if (dueDate) {
        taskData.due_date = format(dueDate, "yyyy-MM-dd'T'HH:mm:ss");
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

      // Only include form_id if it has a value (API accepts form_id: number | null)
      if (taskFormData.form_id && taskFormData.form_id !== "" && taskFormData.form_id !== "none") {
        const formId = parseInt(taskFormData.form_id);
        if (!isNaN(formId)) {
          taskData.form_id = formId;
        }
      }

      // Only include form_submission_id if it has a value (API accepts form_submission_id: number | null)
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
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTask = async () => {
    try {
      // Build task data object, only including fields with actual values
      const taskData = {};

      // Include required/always-updated fields
      if (taskFormData.title) taskData.title = taskFormData.title;
      if (taskFormData.task_type) taskData.task_type = taskFormData.task_type;
      if (taskFormData.description) taskData.description = taskFormData.description;
      if (taskFormData.priority) taskData.priority = taskFormData.priority;
      if (taskFormData.status) taskData.status = taskFormData.status;

      // Only include due_date if it's set
      if (dueDate) {
        taskData.due_date = format(dueDate, "yyyy-MM-dd'T'HH:mm:ss");
      } else if (taskFormData.due_date) {
        taskData.due_date = taskFormData.due_date;
      }

      // Only include location_id if it has a value
      if (taskFormData.location_id && taskFormData.location_id !== "" && taskFormData.location_id !== "none") {
        const locationId = parseInt(taskFormData.location_id);
        if (!isNaN(locationId)) {
          taskData.location_id = locationId;
        }
      }

      // Only include assigned_user_ids if there are selected users
      if (selectedUserIds.length > 0) {
        taskData.assigned_user_ids = selectedUserIds;
      }

      // Only include assigned_to_user_id if it has a value
      if (taskFormData.assigned_to_user_id && taskFormData.assigned_to_user_id !== "" && taskFormData.assigned_to_user_id !== "none") {
        const userId = parseInt(taskFormData.assigned_to_user_id);
        if (!isNaN(userId)) {
          taskData.assigned_to_user_id = userId;
        }
      }

      // Only include assigned_to_role_id if it has a value
      if (taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "" && taskFormData.assigned_to_role_id !== "none") {
        const roleId = parseInt(taskFormData.assigned_to_role_id);
        if (!isNaN(roleId)) {
          taskData.assigned_to_role_id = roleId;
        }
      }

      // Only include assigned_to_asset_id if it has a value
      if (taskFormData.assigned_to_asset_id && taskFormData.assigned_to_asset_id !== "" && taskFormData.assigned_to_asset_id !== "none") {
        const assetId = parseInt(taskFormData.assigned_to_asset_id);
        if (!isNaN(assetId)) {
          taskData.assigned_to_asset_id = assetId;
        }
      }

      // Only include form_id if it has a value (API accepts form_id: number | null)
      if (taskFormData.form_id && taskFormData.form_id !== "" && taskFormData.form_id !== "none") {
        const formId = parseInt(taskFormData.form_id);
        if (!isNaN(formId)) {
          taskData.form_id = formId;
        }
      } else if (taskFormData.hasOwnProperty('form_id')) {
        // If form_id was explicitly set to empty/none, send null to clear it
        taskData.form_id = null;
      }

      // Only include form_submission_id if it has a value (API accepts form_submission_id: number | null)
      if (taskFormData.form_submission_id && taskFormData.form_submission_id !== "" && taskFormData.form_submission_id !== "none") {
        const submissionId = parseInt(taskFormData.form_submission_id);
        if (!isNaN(submissionId)) {
          taskData.form_submission_id = submissionId;
        }
      } else if (taskFormData.hasOwnProperty('form_submission_id')) {
        // If form_submission_id was explicitly set to empty, send null to clear it
        taskData.form_submission_id = null;
      }

      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        taskData,
      });
      setIsEditModalOpen(false);
      setSelectedTask(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleAssignTask = async () => {
    try {
      // Build assignment object, only including fields with actual values
      const assignment = {};

      // Only include assigned_user_ids if there are selected users
      if (selectedUserIds.length > 0) {
        assignment.assigned_user_ids = selectedUserIds;
      }

      // Only include assigned_to_user_id if it has a value
      if (assignmentData.assigned_to_user_id && assignmentData.assigned_to_user_id !== "" && assignmentData.assigned_to_user_id !== "none") {
        const userId = parseInt(assignmentData.assigned_to_user_id);
        if (!isNaN(userId)) {
          assignment.assigned_to_user_id = userId;
        }
      }

      // Only include assigned_to_role_id if it has a value
      if (assignmentData.assigned_to_role_id && assignmentData.assigned_to_role_id !== "" && assignmentData.assigned_to_role_id !== "none") {
        const roleId = parseInt(assignmentData.assigned_to_role_id);
        if (!isNaN(roleId)) {
          assignment.assigned_to_role_id = roleId;
        }
      }

      // Only include assigned_to_asset_id if it has a value
      if (assignmentData.assigned_to_asset_id && assignmentData.assigned_to_asset_id !== "" && assignmentData.assigned_to_asset_id !== "none") {
        const assetId = parseInt(assignmentData.assigned_to_asset_id);
        if (!isNaN(assetId)) {
          assignment.assigned_to_asset_id = assetId;
        }
      }

      await assignTaskMutation.mutateAsync({
        id: selectedTask.id,
        assignmentData: assignment,
      });
      setIsAssignModalOpen(false);
      setSelectedTask(null);
      setAssignmentData({
        assigned_to_user_id: "",
        assigned_user_ids: [],
        assigned_to_role_id: "",
        assigned_to_asset_id: "",
      });
      setSelectedUserIds([]);
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };

  const handleCompleteTask = async () => {
    try {
      await completeTaskMutation.mutateAsync({
        id: selectedTask.id,
        completionData,
      });
      setIsCompleteModalOpen(false);
      setSelectedTask(null);
      setCompletionData({
        completion_data: {},
        notes: "",
        progress_percentage: 100,
      });
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const resetForm = () => {
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
    });
    setSelectedUserIds([]);
    setDueDate(null);
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

  const openEditModal = (task) => {
    setSelectedTask(task);
    setTaskFormData({
      title: task.title || "",
      task_type: task.task_type || "",
      description: task.description || "",
      due_date: task.due_date || "",
      priority: task.priority || "",
      status: task.status || "pending",
      location_id: task.location_id || "",
      assigned_to_user_id: task.assigned_to_user_id || "",
      assigned_user_ids: task.assigned_user_ids || [],
      assigned_to_role_id: task.assigned_to_role_id || "",
      assigned_to_asset_id: task.assigned_to_asset_id || "",
      form_id: task.form_id || "",
      form_submission_id: task.form_submission_id || "",
    });
    setSelectedUserIds(task.assigned_user_ids || []);
    setDueDate(task.due_date ? new Date(task.due_date) : null);

    // Determine assignment mode based on task data
    if (task.assigned_to_role_id) {
      setEditAssignmentMode("role");
    } else if (task.assigned_to_asset_id) {
      setEditAssignmentMode("asset");
      // Set asset assignment type based on existing assignment
      if (task.assigned_to_user_id) {
        setAssetAssignmentType("user");
      } else if (task.assigned_to_role_id) {
        setAssetAssignmentType("role");
      }
    } else if (task.assigned_to_user_id && !task.assigned_user_ids?.length) {
      setEditAssignmentMode("user");
    } else {
      setEditAssignmentMode("multiple-users");
    }

    setIsEditModalOpen(true);
  };

  const openAssignModal = (task) => {
    setSelectedTask(task);
    setAssignmentData({
      assigned_to_user_id: task.assigned_to_user_id || "",
      assigned_user_ids: task.assigned_user_ids || [],
      assigned_to_role_id: task.assigned_to_role_id || "",
      assigned_to_asset_id: task.assigned_to_asset_id || "",
    });
    setSelectedUserIds(task.assigned_user_ids || []);
    setIsAssignModalOpen(true);
  };

  const openCompleteModal = (task) => {
    setSelectedTask(task);
    setIsCompleteModalOpen(true);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tasks</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and track all tasks across your organization
          </p>
        </div>
        {canCreateTask && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {!statsLoading && !statsError && statsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof statsData.total_tasks === 'number' ? statsData.total_tasks :
                  typeof statsData.total === 'number' ? statsData.total : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof statsData.pending_count === 'number' ? statsData.pending_count :
                  typeof statsData.pending === 'number' ? statsData.pending : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {typeof statsData.overdue_count === 'number' ? statsData.overdue_count :
                  typeof statsData.overdue === 'number' ? statsData.overdue : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {typeof statsData.completed_count === 'number' ? statsData.completed_count :
                  typeof statsData.completed === 'number' ? statsData.completed : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {statsLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto pb-0">
        <div className="flex gap-2 min-w-max pb-2">
          <Button
            variant={viewMode === "all" ? "default" : "ghost"}
            onClick={() => setViewMode("all")}
            className="whitespace-nowrap"
          >
            All Tasks
          </Button>
          <Button
            variant={viewMode === "my-tasks" ? "default" : "ghost"}
            onClick={() => setViewMode("my-tasks")}
            className="whitespace-nowrap"
          >
            My Tasks
          </Button>
          <Button
            variant={viewMode === "overdue" ? "default" : "ghost"}
            onClick={() => setViewMode("overdue")}
            className="whitespace-nowrap"
          >
            Overdue
          </Button>
          <Button
            variant={viewMode === "due-soon" ? "default" : "ghost"}
            onClick={() => setViewMode("due-soon")}
            className="whitespace-nowrap"
          >
            Due Soon
          </Button>
          <Button
            variant={viewMode === "compliance" ? "default" : "ghost"}
            onClick={() => setViewMode("compliance")}
            className="whitespace-nowrap"
          >
            Compliance
          </Button>
          <Button
            variant={viewMode === "automated" ? "default" : "ghost"}
            onClick={() => setViewMode("automated")}
            className="whitespace-nowrap"
          >
            Automated
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value === "all" ? "" : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, priority: value === "all" ? "" : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.task_type || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, task_type: value === "all" ? "" : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {taskTypes.map((taskType) => (
                    <SelectItem key={taskType.id} value={taskType.name}>
                      <div className="flex items-center gap-2">
                        {taskType.icon && <span>{taskType.icon}</span>}
                        <span>{taskType.display_name || taskType.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filters.status || filters.priority || filters.task_type) && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      status: "",
                      priority: "",
                      task_type: "",
                      assigned_to_user_id: "",
                      is_overdue: "",
                    })
                  }
                  className="w-full sm:w-auto"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === "all"
              ? "All Tasks"
              : viewMode === "my-tasks"
                ? "My Tasks"
                : viewMode === "overdue"
                  ? "Overdue Tasks"
                  : viewMode === "due-soon"
                    ? "Due Soon Tasks"
                    : viewMode === "compliance"
                      ? "Compliance Tasks"
                      : "Automated Tasks"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    {/* Title and Badges */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/tasks/${task.id}`}
                          className="font-medium hover:underline flex-1"
                        >
                          {task.title}
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdateTask && (
                              <DropdownMenuItem
                                onClick={() => openEditModal(task)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canAssignTask && (
                              <DropdownMenuItem
                                onClick={() => openAssignModal(task)}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Assign
                              </DropdownMenuItem>
                            )}
                            {task.status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => openCompleteModal(task)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            {canDeleteTask && (
                              <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this task? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {task.is_recurring && (
                          <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-700 dark:text-purple-400">
                            <Repeat className="mr-1 h-3 w-3" />
                            Recurring
                          </Badge>
                        )}
                        {task.assigned_to_role_id && (
                          <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-700 dark:text-blue-400">
                            <Users className="mr-1 h-3 w-3" />
                            From Role
                          </Badge>
                        )}
                        {task.create_individual_tasks && task.assigned_user_ids?.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            Individual Tasks
                          </Badge>
                        )}
                        {!task.create_individual_tasks && task.assigned_user_ids?.length > 1 && (
                          <Badge variant="outline" className="text-xs border-green-500/50 text-green-700 dark:text-green-400">
                            <Users className="mr-1 h-3 w-3" />
                            Collaborative
                          </Badge>
                        )}
                        {task.form_id && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="mr-1 h-3 w-3" />
                            From Form
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Task Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="mt-1">
                          {(() => {
                            const taskType = taskTypes.find(tt => tt.name === task.task_type);
                            return taskType ? (
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: taskType.color || undefined,
                                  color: taskType.color || undefined
                                }}
                              >
                                {taskType.icon && <span className="mr-1">{taskType.icon}</span>}
                                {taskType.display_name || task.task_type}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">{task.task_type || "N/A"}</Badge>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">
                          <Badge className={cn("text-xs", getStatusColor(task.status))}>
                            {task.status || "N/A"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Priority:</span>
                        <div className="mt-1">
                          <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                            {task.priority || "N/A"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assigned:</span>
                        <div className="mt-1 flex items-center gap-1">
                          {task.assigned_user_ids?.length > 0 ? (
                            <>
                              <Users className="h-3 w-3" />
                              <span className="text-xs">
                                {task.assigned_user_ids.length} Users
                              </span>
                            </>
                          ) : task.assignee_display ? (
                            <>
                              <User className="h-3 w-3" />
                              <span className="text-xs truncate">{task.assignee_display}</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Due: {format(new Date(task.due_date), "MMM dd, yyyy")}
                        </span>
                        {task.is_overdue && (
                          <Badge variant="destructive" className="ml-auto">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="min-w-[120px]">Type</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Priority</TableHead>
                    <TableHead className="min-w-[150px]">Assigned To</TableHead>
                    <TableHead className="min-w-[150px]">Due Date</TableHead>
                    <TableHead className="min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/tasks/${task.id}`}
                            className="hover:underline"
                          >
                            {task.title}
                          </Link>
                          {task.is_recurring && (
                            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-700 dark:text-purple-400">
                              <Repeat className="mr-1 h-3 w-3" />
                              Recurring
                            </Badge>
                          )}
                          {task.assigned_to_role_id && (
                            <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-700 dark:text-blue-400">
                              <Users className="mr-1 h-3 w-3" />
                              From Role
                            </Badge>
                          )}
                          {task.create_individual_tasks && task.assigned_user_ids?.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="mr-1 h-3 w-3" />
                              Individual Tasks
                            </Badge>
                          )}
                          {!task.create_individual_tasks && task.assigned_user_ids?.length > 1 && (
                            <Badge variant="outline" className="text-xs border-green-500/50 text-green-700 dark:text-green-400">
                              <Users className="mr-1 h-3 w-3" />
                              Collaborative
                            </Badge>
                          )}
                          {task.form_id && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="mr-1 h-3 w-3" />
                              From Form
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const taskType = taskTypes.find(tt => tt.name === task.task_type);
                          return taskType ? (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: taskType.color || undefined,
                                color: taskType.color || undefined
                              }}
                            >
                              {taskType.icon && <span className="mr-1">{taskType.icon}</span>}
                              {taskType.display_name || task.task_type}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{task.task_type || "N/A"}</Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {task.assigned_user_ids?.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">
                                {task.assigned_user_ids.length} Users
                              </span>
                            </div>
                          ) : task.assignee_display ? (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span className="text-sm">{task.assignee_display}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.due_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(task.due_date), "MMM dd, yyyy")}
                            </span>
                            {task.is_overdue && (
                              <Badge variant="destructive" className="ml-2">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdateTask && (
                              <DropdownMenuItem
                                onClick={() => openEditModal(task)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canAssignTask && (
                              <DropdownMenuItem
                                onClick={() => openAssignModal(task)}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Assign
                              </DropdownMenuItem>
                            )}
                            {task.status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => openCompleteModal(task)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            {canDeleteTask && (
                              <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this task? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      className={
                        currentPage === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.total_pages ||
                        Math.abs(page - currentPage) <= 1
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <PaginationEllipsis />
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(pagination.total_pages, p + 1)
                        )
                      }
                      className={
                        currentPage === pagination.total_pages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to users, roles, or assets.
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="multiple-users">
                    <Users className="mr-2 h-4 w-4" />
                    Multiple Users
                  </TabsTrigger>
                  <TabsTrigger value="role">
                    <Shield className="mr-2 h-4 w-4" />
                    Role
                  </TabsTrigger>
                  <TabsTrigger value="user">
                    <User className="mr-2 h-4 w-4" />
                    Single User
                  </TabsTrigger>
                  <TabsTrigger value="asset">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Asset
                  </TabsTrigger>
                </TabsList>

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
                  {createIndividualTasks ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        Individual Tasks Mode: Each user gets their own task (must complete individually)
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200">
                        Collaborative Task Mode: All users share the same task
                      </p>
                    </div>
                  )}
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
                        // Clear other assignment types when role is selected
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
                        // Clear other assignment types when single user is selected
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
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="user">
                          <User className="mr-2 h-4 w-4" />
                          User
                        </TabsTrigger>
                        <TabsTrigger value="role">
                          <Shield className="mr-2 h-4 w-4" />
                          Role
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="user" className="mt-3">
                        <Select
                          value={taskFormData.assigned_to_user_id && taskFormData.assigned_to_user_id !== "" ? taskFormData.assigned_to_user_id : undefined}
                          onValueChange={(value) => {
                            setTaskFormData({
                              ...taskFormData,
                              assigned_to_user_id: value,
                              assigned_to_role_id: "", // Clear role when user is selected
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
                              assigned_to_user_id: "", // Clear user when role is selected
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
                      // Clear form_submission_id when form changes
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
                setIsCreateModalOpen(false);
                resetForm();
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

      {/* Edit Task Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={taskFormData.title}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-task_type">Task Type *</Label>
                <Select
                  value={taskFormData.task_type || undefined}
                  onValueChange={(value) =>
                    setTaskFormData({ ...taskFormData, task_type: value })
                  }
                >
                  <SelectTrigger>
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
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
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
            <div>
              <Label>Status</Label>
              <Select
                value={taskFormData.status}
                onValueChange={(value) =>
                  setTaskFormData({ ...taskFormData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Assignment Section */}
            <div>
              <Label className="mb-3 block">Task Assignment</Label>
              <Tabs value={editAssignmentMode} onValueChange={setEditAssignmentMode} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="multiple-users">
                    <Users className="mr-2 h-4 w-4" />
                    Multiple Users
                  </TabsTrigger>
                  <TabsTrigger value="role">
                    <Shield className="mr-2 h-4 w-4" />
                    Role
                  </TabsTrigger>
                  <TabsTrigger value="user">
                    <User className="mr-2 h-4 w-4" />
                    Single User
                  </TabsTrigger>
                  <TabsTrigger value="asset">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Asset
                  </TabsTrigger>
                </TabsList>

                {/* Multiple Users Tab */}
                <TabsContent value="multiple-users" className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Select multiple users to assign this task to. Each selected user will receive their own task.
                      </p>
                    </div>
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
                          Assigning to a role will create individual tasks for all active users in this role. Each user will receive their own task in their "My Tasks" section.
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
                        // Clear other assignment types when role is selected
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
                        // Clear other assignment types when single user is selected
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
                      }}
                    >
                      <SelectTrigger>
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
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="user">
                          <User className="mr-2 h-4 w-4" />
                          User
                        </TabsTrigger>
                        <TabsTrigger value="role">
                          <Shield className="mr-2 h-4 w-4" />
                          Role
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="user" className="mt-3">
                        <Select
                          value={taskFormData.assigned_to_user_id && taskFormData.assigned_to_user_id !== "" ? taskFormData.assigned_to_user_id : undefined}
                          onValueChange={(value) => {
                            setTaskFormData({
                              ...taskFormData,
                              assigned_to_user_id: value,
                              assigned_to_role_id: "", // Clear role when user is selected
                            });
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
                      <TabsContent value="role" className="mt-3">
                        <Select
                          value={taskFormData.assigned_to_role_id && taskFormData.assigned_to_role_id !== "" ? taskFormData.assigned_to_role_id : undefined}
                          onValueChange={(value) => {
                            setTaskFormData({
                              ...taskFormData,
                              assigned_to_role_id: value,
                              assigned_to_user_id: "", // Clear user when role is selected
                            });
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
                </TabsContent>
              </Tabs>
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
                      // Clear form_submission_id when form changes
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
                setIsEditModalOpen(false);
                setSelectedTask(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTask}
              disabled={updateTaskMutation.isPending || !taskFormData.title || !taskFormData.task_type}
            >
              {updateTaskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Task Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Assign this task to users, roles, or assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assign to Users (Multiple Selection)</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assign to Role</Label>
                <Select
                  value={assignmentData.assigned_to_role_id && assignmentData.assigned_to_role_id !== "" ? assignmentData.assigned_to_role_id : undefined}
                  onValueChange={(value) =>
                    setAssignmentData({
                      ...assignmentData,
                      assigned_to_role_id: value,
                    })
                  }
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
              </div>
              <div>
                <Label>Assign to Asset</Label>
                <Select
                  value={assignmentData.assigned_to_asset_id && assignmentData.assigned_to_asset_id !== "" ? assignmentData.assigned_to_asset_id : undefined}
                  onValueChange={(value) =>
                    setAssignmentData({
                      ...assignmentData,
                      assigned_to_asset_id: value,
                    })
                  }
                >
                  <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedTask(null);
                setSelectedUserIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTask}
              disabled={assignTaskMutation.isPending}
            >
              {assignTaskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Task Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark this task as completed and add completion notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="progress">Progress Percentage</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={completionData.progress_percentage}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    progress_percentage: parseInt(e.target.value) || 100,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Completion Notes</Label>
              <Textarea
                id="notes"
                value={completionData.notes}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    notes: e.target.value,
                  })
                }
                placeholder="Add completion notes..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCompleteModalOpen(false);
                setSelectedTask(null);
                setCompletionData({
                  completion_data: {},
                  notes: "",
                  progress_percentage: 100,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteTask}
              disabled={completeTaskMutation.isPending}
            >
              {completeTaskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;


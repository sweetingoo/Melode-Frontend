"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  FolderKanban,
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
import { useLocations, useCreateLocation } from "@/hooks/useLocations";
import {
  useActiveLocationTypes,
  useCreateLocationType,
} from "@/hooks/useLocationTypes";
import { useQueryClient } from "@tanstack/react-query";
import { useAssets } from "@/hooks/useAssets";
import { useRoles, useRoleUsers } from "@/hooks/useRoles";
import { useActiveTaskTypes, useCreateTaskType } from "@/hooks/useTaskTypes";
import { useForms } from "@/hooks/useForms";
import { useProjects } from "@/hooks/useProjects";
import { useCurrentUser } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UserMentionSelector from "@/components/UserMentionSelector";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const TasksPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState("all"); // all, my-tasks, overdue, due-soon, compliance, automated
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    task_type: "",
    assigned_to_user_id: "",
    is_overdue: "",
    project_id: "",
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
  const [startDate, setStartDate] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState("multiple-users"); // "role", "user", "asset", "multiple-users"
  const [editAssignmentMode, setEditAssignmentMode] = useState("multiple-users");
  const [assetAssignmentType, setAssetAssignmentType] = useState("user"); // "user" or "role" for asset assignment
  const [isRecurring, setIsRecurring] = useState(false);
  const [createIndividualTasks, setCreateIndividualTasks] = useState(false);
  const [isCreateTaskTypeModalOpen, setIsCreateTaskTypeModalOpen] = useState(false);
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [isQuickCreateLocationTypeOpen, setIsQuickCreateLocationTypeOpen] = useState(false);
  const [quickCreateLocationTypeData, setQuickCreateLocationTypeData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
  });
  const [taskTypeFormData, setTaskTypeFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
    sort_order: 0,
  });
  // Project lazy loading state
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [projectPage, setProjectPage] = useState(1);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    description: "",
    location_type_id: null,
    parent_location_id: null,
    address: "",
    coordinates: "",
    capacity: 0,
    area_sqm: 0,
    status: "active",
    is_accessible: true,
    requires_access_control: false,
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    responsible_department: "",
    is_active: true,
  });
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
  const queryClient = useQueryClient();
  const { data: locationTypes = [], isLoading: locationTypesLoading } = useActiveLocationTypes();
  const createLocationTypeMutation = useCreateLocationType();
  const { data: assetsData } = useAssets();
  const { data: rolesData } = useRoles();
  const { data: activeTaskTypes } = useActiveTaskTypes();
  const { data: formsResponse } = useForms();
  // Debounce search term
  const [debouncedProjectSearch, setDebouncedProjectSearch] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProjectSearch(projectSearchTerm);
      setProjectPage(1); // Reset to first page when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [projectSearchTerm]);
  
  // Lazy load projects - only fetch when dropdown is open, with debounced search
  const { data: projectsResponse, isLoading: projectsLoading, error: projectsError } = useProjects({ 
    page: projectPage,
    per_page: 50, // Reasonable page size (API max is 100)
    search: debouncedProjectSearch || undefined,
    is_active: true,
  }, {
    enabled: isProjectDropdownOpen, // Only fetch when dropdown is open
  });
  const { data: currentUserData } = useCurrentUser();
  const isMobile = useIsMobile();

  // Get users for selected role (for role assignment info)
  const selectedRoleId = taskFormData.assigned_to_role_id
    ? parseInt(taskFormData.assigned_to_role_id)
    : null;
  const selectedRole = rolesData?.find(r => r.id === selectedRoleId || r.slug === selectedRoleId);
  const { data: roleUsersData } = useRoleUsers(selectedRole?.slug || selectedRoleId);

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

  // Handle different API response structures for projects
  let projects = [];
  if (projectsResponse) {
    if (Array.isArray(projectsResponse)) {
      projects = projectsResponse;
    } else if (projectsResponse.projects && Array.isArray(projectsResponse.projects)) {
      projects = projectsResponse.projects;
    } else if (projectsResponse.data && Array.isArray(projectsResponse.data)) {
      projects = projectsResponse.data;
    } else if (projectsResponse.results && Array.isArray(projectsResponse.results)) {
      projects = projectsResponse.results;
    } else if (projectsResponse.items && Array.isArray(projectsResponse.items)) {
      projects = projectsResponse.items;
    }
  }
  
  // Get selected project for display
  const selectedProjectForDisplay = React.useMemo(() => {
    if (!taskFormData.project_id) return null;
    return projects.find(p => p.id.toString() === taskFormData.project_id.toString());
  }, [projects, taskFormData.project_id]);
  
  // Reset search and page when dropdown closes
  React.useEffect(() => {
    if (!isProjectDropdownOpen) {
      setProjectSearchTerm("");
      setProjectPage(1);
    }
  }, [isProjectDropdownOpen]);
  
  // Use projects for display
  const displayProjects = projects;
  const isLoadingProjects = projectsLoading;

  const deleteTaskMutation = useDeleteTask();
  const createTaskMutation = useCreateTask();
  const createTaskTypeMutation = useCreateTaskType();
  const createLocationMutation = useCreateLocation();
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

  const handleCreateTaskType = async () => {
    if (!taskTypeFormData.name || !taskTypeFormData.display_name) {
      return;
    }

    try {
      const result = await createTaskTypeMutation.mutateAsync(taskTypeFormData);
      setIsCreateTaskTypeModalOpen(false);
      // Reset form
      setTaskTypeFormData({
        name: "",
        display_name: "",
        description: "",
        icon: "",
        color: "#6B7280",
        sort_order: 0,
      });
      // Auto-select the newly created task type
      if (result && result.name) {
        setTaskFormData({ ...taskFormData, task_type: result.name });
      }
      // Refetch task types to update the dropdown
      // The mutation should already invalidate the cache, but we can force a refetch if needed
    } catch (error) {
      console.error("Failed to create task type:", error);
    }
  };

  const handleCreateLocation = async () => {
    if (!locationFormData.name || !locationFormData.location_type_id || !locationFormData.address) {
      return;
    }

    try {
      const result = await createLocationMutation.mutateAsync(locationFormData);
      setIsCreateLocationModalOpen(false);
      // Reset form
      setLocationFormData({
        name: "",
        description: "",
        location_type_id: null,
        parent_location_id: null,
        address: "",
        coordinates: "",
        capacity: 0,
        area_sqm: 0,
        status: "active",
        is_accessible: true,
        requires_access_control: false,
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        responsible_department: "",
        is_active: true,
      });
      // Auto-select the newly created location
      if (result && result.id) {
        setTaskFormData({ ...taskFormData, location_id: result.id.toString() });
      }
      // Refetch locations to update the dropdown
      // The mutation should already invalidate the cache, but we can force a refetch if needed
    } catch (error) {
      console.error("Failed to create location:", error);
    }
  };

  const handleQuickCreateLocationType = async () => {
    if (!quickCreateLocationTypeData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    // Ensure name is generated from display name
    const autoName = quickCreateLocationTypeData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!autoName) {
      toast.error("Display name must contain at least one letter or number");
      return;
    }

    try {
      const result = await createLocationTypeMutation.mutateAsync({
        name: autoName,
        display_name: quickCreateLocationTypeData.display_name,
        description: quickCreateLocationTypeData.description || "",
        icon: quickCreateLocationTypeData.icon || "",
        color: quickCreateLocationTypeData.color || "#6B7280",
        sort_order: 0,
      });
      
      // Wait for query invalidation to complete, then auto-select the new one
      setTimeout(() => {
        setLocationFormData({
          ...locationFormData,
          location_type_id: result.id,
        });
      }, 100);
      
      setIsQuickCreateLocationTypeOpen(false);
      setQuickCreateLocationTypeData({
        name: "",
        display_name: "",
        description: "",
        icon: "",
        color: "#6B7280",
      });
    } catch (error) {
      console.error("Failed to create location type:", error);
    }
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
      // Reset to first page to see the newly created task
      setCurrentPage(1);
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

      // Include start_date if set, otherwise use existing or default
      if (startDate) {
        taskData.start_date = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
      } else if (taskFormData.start_date) {
        taskData.start_date = taskFormData.start_date;
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
        slug: selectedTask.slug || selectedTask.id,
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
      project_id: task.project_id || "",
    });
    setSelectedUserIds(task.assigned_user_ids || []);
    setDueDate(task.due_date ? new Date(task.due_date) : null);
    setStartDate(task.start_date ? new Date(task.start_date) : null);

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Tasks</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and track all tasks across your organisation
          </p>
        </div>
        {canCreateTask && (
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {!statsLoading && !statsError && statsData && (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Total Tasks</p>
                  <p className="text-2xl font-bold">
                    {typeof statsData.total_tasks === 'number' ? statsData.total_tasks :
                      typeof statsData.total === 'number' ? statsData.total : 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold">
                    {typeof statsData.pending_count === 'number' ? statsData.pending_count :
                      typeof statsData.pending === 'number' ? statsData.pending : 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {typeof statsData.overdue_count === 'number' ? statsData.overdue_count :
                      typeof statsData.overdue === 'number' ? statsData.overdue : 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {typeof statsData.completed_count === 'number' ? statsData.completed_count :
                      typeof statsData.completed === 'number' ? statsData.completed : 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {statsLoading && (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Loading...</p>
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto pb-0">
        <div className="flex gap-1 min-w-max pb-1">
          <Button
            variant={viewMode === "all" ? "default" : "ghost"}
            onClick={() => setViewMode("all")}
            className="whitespace-nowrap h-8 text-xs"
            size="sm"
          >
            All Tasks
          </Button>
          <Button
            variant={viewMode === "my-tasks" ? "default" : "ghost"}
            onClick={() => setViewMode("my-tasks")}
            className="whitespace-nowrap h-8 text-xs"
            size="sm"
          >
            My Tasks
          </Button>
          <Button
            variant={viewMode === "overdue" ? "default" : "ghost"}
            onClick={() => setViewMode("overdue")}
            className="whitespace-nowrap h-8 text-xs"
            size="sm"
          >
            Overdue
          </Button>
          <Button
            variant={viewMode === "due-soon" ? "default" : "ghost"}
            onClick={() => setViewMode("due-soon")}
            className="whitespace-nowrap h-8 text-xs"
            size="sm"
          >
            Due Soon
          </Button>
          <Button
            variant={viewMode === "compliance" ? "default" : "ghost"}
            onClick={() => setViewMode("compliance")}
            className="whitespace-nowrap h-8 text-xs"
            size="sm"
          >
            Compliance
          </Button>
          <Button
            variant={viewMode === "automated" ? "default" : "ghost"}
            onClick={() => setViewMode("automated")}
            className="whitespace-nowrap h-8 text-xs"
            size="sm"
          >
            Automated
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="text-base">Filters</CardTitle>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isFiltersOpen && "rotate-180")} />
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <Select
                value={filters.project_id || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, project_id: value === "all" ? "" : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.assigned_to_user_id || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, assigned_to_user_id: value === "all" ? "" : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.display_name ||
                        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                        user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filters.status || filters.priority || filters.task_type || filters.project_id || filters.assigned_to_user_id) && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      status: "",
                      priority: "",
                      task_type: "",
                      assigned_to_user_id: "",
                      is_overdue: "",
                      project_id: "",
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
          </CollapsibleContent>
        </Collapsible>
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
        <CardContent className="overflow-x-auto">
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
                          href={`/admin/tasks/${task.slug || task.id}`}
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
                                        onClick={() => handleDeleteTask(task.slug || task.id)}
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
                        <span className="text-muted-foreground">Project:</span>
                        <div className="mt-1">
                          {task.project_id ? (
                            (() => {
                              const project = projects.find((p) => p.id === task.project_id);
                              return project ? (
                                <Link
                                  href={`/admin/projects/${project.slug || project.id}`}
                                  className="inline-flex items-center gap-1 hover:underline"
                                >
                                  <FolderKanban className="h-3 w-3" />
                                  <Badge variant="outline" className="text-xs">
                                    {project.name}
                                  </Badge>
                                </Link>
                              ) : (
                                <span className="text-xs text-muted-foreground">Unknown Project</span>
                              );
                            })()
                          ) : (
                            <span className="text-xs text-muted-foreground">No Project</span>
                          )}
                        </div>
                      </div>
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
                      {/* Progress */}
                      {task.progress_percentage !== undefined && task.progress_percentage !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-muted-foreground text-xs">Progress</span>
                            <span className="text-xs font-medium">{task.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{
                                width: `${task.progress_percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
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
            <div className="rounded-md border overflow-x-auto max-w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[18%]">Title</TableHead>
                    <TableHead className="w-[10%]">Project</TableHead>
                    <TableHead className="w-[10%]">Type</TableHead>
                    <TableHead className="w-[9%]">Status</TableHead>
                    <TableHead className="w-[9%]">Priority</TableHead>
                    <TableHead className="w-[10%]">Progress</TableHead>
                    <TableHead className="w-[13%]">Assigned To</TableHead>
                    <TableHead className="w-[11%]">Due Date</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium w-[20%]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/tasks/${task.slug || task.id}`}
                            className="hover:underline truncate max-w-full"
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
                        {task.project_id ? (
                          (() => {
                            const project = projects.find((p) => p.id === task.project_id);
                            return project ? (
                              <Link
                                href={`/admin/projects/${project.slug || project.id}`}
                                className="inline-flex items-center gap-1 hover:underline"
                              >
                                <FolderKanban className="h-3 w-3" />
                                <Badge variant="outline" className="text-xs">
                                  {project.name}
                                </Badge>
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unknown Project</span>
                            );
                          })()
                        ) : (
                          <span className="text-xs text-muted-foreground">No Project</span>
                        )}
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
                        {task.progress_percentage !== undefined && task.progress_percentage !== null ? (
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{
                                  width: `${task.progress_percentage}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{task.progress_percentage}%</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
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
                                        onClick={() => handleDeleteTask(task.slug || task.id)}
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
                <div className="flex gap-2">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateTaskTypeModalOpen(true)}
                    title="Create new task type"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
            <div>
              <Label>Project</Label>
              <Popover open={isProjectDropdownOpen} onOpenChange={setIsProjectDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedProjectForDisplay ? (
                      <span className="truncate">{selectedProjectForDisplay.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Select a project (optional)</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <Input
                        placeholder="Search projects..."
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {isLoadingProjects ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Loading projects...
                        </div>
                      ) : projectsError ? (
                        <div className="p-4 text-center text-sm text-destructive">
                          Error loading projects
                        </div>
                      ) : displayProjects.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {projectSearchTerm ? `No projects found matching "${projectSearchTerm}"` : "No projects available"}
                        </div>
                      ) : (
                        <>
                          <div
                            className="p-1 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                            onClick={() => {
                              setTaskFormData({
                                ...taskFormData,
                                project_id: "",
                              });
                              setIsProjectDropdownOpen(false);
                            }}
                          >
                            <div className={cn(
                              "px-2 py-1.5 rounded-sm",
                              !taskFormData.project_id && "bg-accent"
                            )}>
                              No Project
                            </div>
                          </div>
                          {displayProjects.map((project) => (
                            <div
                              key={project.id}
                              className="p-1 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                              onClick={() => {
                                setTaskFormData({
                                  ...taskFormData,
                                  project_id: project.id.toString(),
                                });
                                setIsProjectDropdownOpen(false);
                              }}
                            >
                              <div className={cn(
                                "px-2 py-1.5 rounded-sm",
                                taskFormData.project_id === project.id.toString() && "bg-accent"
                              )}>
                                {project.name}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Location</Label>
              <div className="flex gap-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreateLocationModalOpen(true)}
                  title="Create new location"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
                  <UserMentionSelector
                    users={users}
                    selectedUserIds={selectedUserIds}
                    onSelectionChange={setSelectedUserIds}
                    placeholder="Type to search and select users..."
                    className="w-full"
                  />
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
                  <UserMentionSelector
                    users={users}
                    selectedUserIds={taskFormData.assigned_to_user_id ? [parseInt(taskFormData.assigned_to_user_id)] : []}
                    onSelectionChange={(userIds) => {
                      const userId = userIds.length > 0 ? userIds[0].toString() : "";
                      setTaskFormData({
                        ...taskFormData,
                        assigned_to_user_id: userId,
                        // Clear other assignment types when single user is selected
                        assigned_to_role_id: "",
                        assigned_to_asset_id: "",
                        assigned_user_ids: [],
                      });
                      setSelectedUserIds([]);
                    }}
                    placeholder="Type to search and select a user..."
                    singleSelection={true}
                    className="w-full"
                  />
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
                        <UserMentionSelector
                          users={users}
                          selectedUserIds={taskFormData.assigned_to_user_id ? [parseInt(taskFormData.assigned_to_user_id)] : []}
                          onSelectionChange={(userIds) => {
                            const userId = userIds.length > 0 ? userIds[0].toString() : "";
                            setTaskFormData({
                              ...taskFormData,
                              assigned_to_user_id: userId,
                              assigned_to_role_id: "", // Clear role when user is selected
                            });
                            if (formErrors.asset_assignment) {
                              setFormErrors({ ...formErrors, asset_assignment: null });
                            }
                          }}
                          placeholder="Type to search and select a user..."
                          singleSelection={true}
                          className="w-full"
                        />
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
              <Label>Project</Label>
              <Popover open={isProjectDropdownOpen} onOpenChange={setIsProjectDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedProjectForDisplay ? (
                      <span className="truncate">{selectedProjectForDisplay.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Select a project (optional)</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <Input
                        placeholder="Search projects..."
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {isLoadingProjects ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Loading projects...
                        </div>
                      ) : projectsError ? (
                        <div className="p-4 text-center text-sm text-destructive">
                          Error loading projects
                        </div>
                      ) : displayProjects.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {projectSearchTerm ? `No projects found matching "${projectSearchTerm}"` : "No projects available"}
                        </div>
                      ) : (
                        <>
                          <div
                            className="p-1 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                            onClick={() => {
                              setTaskFormData({
                                ...taskFormData,
                                project_id: "",
                              });
                              setIsProjectDropdownOpen(false);
                            }}
                          >
                            <div className={cn(
                              "px-2 py-1.5 rounded-sm",
                              !taskFormData.project_id && "bg-accent"
                            )}>
                              No Project
                            </div>
                          </div>
                          {displayProjects.map((project) => (
                            <div
                              key={project.id}
                              className="p-1 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                              onClick={() => {
                                setTaskFormData({
                                  ...taskFormData,
                                  project_id: project.id.toString(),
                                });
                                setIsProjectDropdownOpen(false);
                              }}
                            >
                              <div className={cn(
                                "px-2 py-1.5 rounded-sm",
                                taskFormData.project_id === project.id.toString() && "bg-accent"
                              )}>
                                {project.name}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
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
                  <UserMentionSelector
                    users={users}
                    selectedUserIds={taskFormData.assigned_to_user_id ? [parseInt(taskFormData.assigned_to_user_id)] : []}
                    onSelectionChange={(userIds) => {
                      const userId = userIds.length > 0 ? userIds[0].toString() : "";
                      setTaskFormData({
                        ...taskFormData,
                        assigned_to_user_id: userId,
                        // Clear other assignment types when single user is selected
                        assigned_to_role_id: "",
                        assigned_to_asset_id: "",
                        assigned_user_ids: [],
                      });
                      setSelectedUserIds([]);
                    }}
                    placeholder="Type to search and select a user..."
                    singleSelection={true}
                    className="w-full"
                  />
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
                        <UserMentionSelector
                          users={users}
                          selectedUserIds={taskFormData.assigned_to_user_id ? [parseInt(taskFormData.assigned_to_user_id)] : []}
                          onSelectionChange={(userIds) => {
                            const userId = userIds.length > 0 ? userIds[0].toString() : "";
                            setTaskFormData({
                              ...taskFormData,
                              assigned_to_user_id: userId,
                              assigned_to_role_id: "", // Clear role when user is selected
                            });
                          }}
                          placeholder="Type to search and select a user..."
                          singleSelection={true}
                          className="w-full"
                        />
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

      {/* Create Task Type Modal */}
      <Dialog open={isCreateTaskTypeModalOpen} onOpenChange={setIsCreateTaskTypeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task Type</DialogTitle>
            <DialogDescription>
              Create a new task type for your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-type-name">Name (Unique Identifier) *</Label>
              <Input
                id="task-type-name"
                value={taskTypeFormData.name}
                onChange={(e) =>
                  setTaskTypeFormData({
                    ...taskTypeFormData,
                    name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
                placeholder="e.g., patient_care"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters, numbers, and underscores only. Used internally.
              </p>
            </div>
            <div>
              <Label htmlFor="task-type-display-name">Display Name *</Label>
              <Input
                id="task-type-display-name"
                value={taskTypeFormData.display_name}
                onChange={(e) =>
                  setTaskTypeFormData({
                    ...taskTypeFormData,
                    display_name: e.target.value,
                  })
                }
                placeholder="e.g., Patient Care"
              />
            </div>
            <div>
              <Label htmlFor="task-type-description">Description</Label>
              <Textarea
                id="task-type-description"
                value={taskTypeFormData.description}
                onChange={(e) =>
                  setTaskTypeFormData({
                    ...taskTypeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this task type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-type-icon">Icon (Emoji)</Label>
                <Input
                  id="task-type-icon"
                  value={taskTypeFormData.icon}
                  onChange={(e) =>
                    setTaskTypeFormData({
                      ...taskTypeFormData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="👨‍⚕️"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="task-type-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="task-type-color"
                    type="color"
                    value={taskTypeFormData.color}
                    onChange={(e) =>
                      setTaskTypeFormData({
                        ...taskTypeFormData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={taskTypeFormData.color}
                    onChange={(e) =>
                      setTaskTypeFormData({
                        ...taskTypeFormData,
                        color: e.target.value,
                      })
                    }
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="task-type-sort-order">Sort Order</Label>
              <Input
                id="task-type-sort-order"
                type="number"
                value={taskTypeFormData.sort_order}
                onChange={(e) =>
                  setTaskTypeFormData({
                    ...taskTypeFormData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower numbers appear first in lists.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTaskTypeModalOpen(false);
                setTaskTypeFormData({
                  name: "",
                  display_name: "",
                  description: "",
                  icon: "",
                  color: "#6B7280",
                  sort_order: 0,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTaskType}
              disabled={
                createTaskTypeMutation.isPending ||
                !taskTypeFormData.name ||
                !taskTypeFormData.display_name
              }
            >
              {createTaskTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Task Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Location Modal */}
      <Dialog open={isCreateLocationModalOpen} onOpenChange={setIsCreateLocationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Location</DialogTitle>
            <DialogDescription>
              Add a new location to the system. Fill in all required information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-name">
                Location Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location-name"
                value={locationFormData.name}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Headquarters"
              />
            </div>
            <div>
              <Label htmlFor="location-description">Description</Label>
              <Textarea
                id="location-description"
                value={locationFormData.description}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Location description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-type">
                  Location Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={locationFormData.location_type_id?.toString() || ""}
                  onValueChange={(value) =>
                    setLocationFormData({
                      ...locationFormData,
                      location_type_id: value ? parseInt(value) : null,
                    })
                  }
                  disabled={locationTypesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locationTypesLoading ? "Loading types..." : "Select type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading location types...
                      </SelectItem>
                    ) : locationTypes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No location types available
                      </SelectItem>
                    ) : (
                      locationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          <div className="flex items-center gap-2">
                            {type.icon && (
                              <span className="text-base">{type.icon}</span>
                            )}
                            {type.display_name || type.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="parent-location">Parent Location</Label>
                <Select
                  value={
                    locationFormData.parent_location_id?.toString() ||
                    "__none__"
                  }
                  onValueChange={(value) =>
                    setLocationFormData({
                      ...locationFormData,
                      parent_location_id:
                        value === "__none__" ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      None (Root Location)
                    </SelectItem>
                    {locations.map((location) => (
                      <SelectItem
                        key={location.id}
                        value={location.id.toString()}
                      >
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="location-address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location-address"
                value={locationFormData.address}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    address: e.target.value,
                  })
                }
                placeholder="123 High Street"
              />
            </div>
            <div>
              <Label htmlFor="location-coordinates">Coordinates</Label>
              <Input
                id="location-coordinates"
                value={locationFormData.coordinates}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    coordinates: e.target.value,
                  })
                }
                placeholder="40.7128,-74.0060 or GeoJSON format"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: GPS coordinates or GeoJSON format
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-capacity">Capacity</Label>
                <Input
                  id="location-capacity"
                  type="number"
                  value={locationFormData.capacity}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="location-area">Area (sqm)</Label>
                <Input
                  id="location-area"
                  type="number"
                  step="0.01"
                  value={locationFormData.area_sqm}
                  onChange={(e) =>
                    setLocationFormData({
                      ...locationFormData,
                      area_sqm: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location-status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={locationFormData.status}
                onValueChange={(value) =>
                  setLocationFormData({
                    ...locationFormData,
                    status: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="location-is-accessible"
                checked={locationFormData.is_accessible}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    is_accessible: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="location-is-accessible" className="cursor-pointer">
                Is Accessible
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="location-requires-access-control"
                checked={locationFormData.requires_access_control}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    requires_access_control: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="location-requires-access-control" className="cursor-pointer">
                Requires Access Control
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="location-is-active"
                checked={locationFormData.is_active}
                onChange={(e) =>
                  setLocationFormData({
                    ...locationFormData,
                    is_active: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="location-is-active" className="cursor-pointer">
                Is Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateLocationModalOpen(false);
                setLocationFormData({
                  name: "",
                  description: "",
                  location_type: "",
                  parent_location_id: null,
                  address: "",
                  coordinates: "",
                  capacity: 0,
                  area_sqm: 0,
                  status: "active",
                  is_accessible: true,
                  requires_access_control: false,
                  contact_person: "",
                  contact_phone: "",
                  contact_email: "",
                  responsible_department: "",
                  is_active: true,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLocation}
              disabled={
                createLocationMutation.isPending ||
                !locationFormData.name ||
                !locationFormData.location_type_id ||
                !locationFormData.address
              }
            >
              {createLocationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Location Type Dialog */}
      <Dialog open={isQuickCreateLocationTypeOpen} onOpenChange={setIsQuickCreateLocationTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Location Type</DialogTitle>
            <DialogDescription>
              Quickly create a new location type. It will be automatically selected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-display_name">Display Name *</Label>
              <Input
                id="quick-display_name"
                value={quickCreateLocationTypeData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                  setQuickCreateLocationTypeData({
                    ...quickCreateLocationTypeData,
                    display_name: displayName,
                    name: autoName,
                  });
                }}
                placeholder="e.g., Ward"
              />
            </div>
            <div>
              <Label htmlFor="quick-name">Name (Unique Identifier) *</Label>
              <Input
                id="quick-name"
                value={quickCreateLocationTypeData.name}
                disabled
                className="font-mono bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from display name. Lowercase letters, numbers, and underscores only.
              </p>
            </div>
            <div>
              <Label htmlFor="quick-description">Description</Label>
              <Textarea
                id="quick-description"
                value={quickCreateLocationTypeData.description}
                onChange={(e) =>
                  setQuickCreateLocationTypeData({
                    ...quickCreateLocationTypeData,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quick-icon">Icon (Emoji)</Label>
                <Input
                  id="quick-icon"
                  value={quickCreateLocationTypeData.icon}
                  onChange={(e) =>
                    setQuickCreateLocationTypeData({
                      ...quickCreateLocationTypeData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="🏥"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="quick-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="quick-color"
                    type="color"
                    value={quickCreateLocationTypeData.color}
                    onChange={(e) =>
                      setQuickCreateLocationTypeData({
                        ...quickCreateLocationTypeData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={quickCreateLocationTypeData.color}
                    onChange={(e) =>
                      setQuickCreateLocationTypeData({
                        ...quickCreateLocationTypeData,
                        color: e.target.value,
                      })
                    }
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickCreateLocationTypeOpen(false);
                setQuickCreateLocationTypeData({
                  name: "",
                  display_name: "",
                  description: "",
                  icon: "",
                  color: "#6B7280",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickCreateLocationType}
              disabled={
                createLocationTypeMutation.isPending ||
                !quickCreateLocationTypeData.name ||
                !quickCreateLocationTypeData.display_name
              }
            >
              {createLocationTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create & Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;


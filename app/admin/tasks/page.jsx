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
import { useRoles } from "@/hooks/useRoles";
import { useActiveTaskTypes } from "@/hooks/useTaskTypes";
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

  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...taskFormData,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd'T'HH:mm:ss") : null,
        assigned_user_ids: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      };
      await createTaskMutation.mutateAsync(taskData);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTask = async () => {
    try {
      const taskData = {
        ...taskFormData,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd'T'HH:mm:ss") : taskFormData.due_date,
        assigned_user_ids: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      };
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
      const assignment = {
        ...assignmentData,
        assigned_user_ids: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      };
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
    });
    setSelectedUserIds([]);
    setDueDate(null);
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
    });
    setSelectedUserIds(task.assigned_user_ids || []);
    setDueDate(task.due_date ? new Date(task.due_date) : null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all tasks across your organization
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
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
      <div className="flex gap-2 border-b">
        <Button
          variant={viewMode === "all" ? "default" : "ghost"}
          onClick={() => setViewMode("all")}
        >
          All Tasks
        </Button>
        <Button
          variant={viewMode === "my-tasks" ? "default" : "ghost"}
          onClick={() => setViewMode("my-tasks")}
        >
          My Tasks
        </Button>
        <Button
          variant={viewMode === "overdue" ? "default" : "ghost"}
          onClick={() => setViewMode("overdue")}
        >
          Overdue
        </Button>
        <Button
          variant={viewMode === "due-soon" ? "default" : "ghost"}
          onClick={() => setViewMode("due-soon")}
        >
          Due Soon
        </Button>
        <Button
          variant={viewMode === "compliance" ? "default" : "ghost"}
          onClick={() => setViewMode("compliance")}
        >
          Compliance
        </Button>
        <Button
          variant={viewMode === "automated" ? "default" : "ghost"}
          onClick={() => setViewMode("automated")}
        >
          Automated
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
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
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/tasks/${task.id}`}
                          className="hover:underline"
                        >
                          {task.title}
                        </Link>
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
                            <DropdownMenuItem
                              onClick={() => openEditModal(task)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openAssignModal(task)}
                            >
                              <User className="mr-2 h-4 w-4" />
                              Assign
                            </DropdownMenuItem>
                            {task.status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => openCompleteModal(task)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete
                              </DropdownMenuItem>
                            )}
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
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task_type">Task Type *</Label>
                <Select
                  value={taskFormData.task_type}
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
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskFormData.priority}
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
                value={taskFormData.location_id || "none"}
                onValueChange={(value) =>
                  setTaskFormData({ ...taskFormData, location_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
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
                  value={taskFormData.assigned_to_role_id || "none"}
                  onValueChange={(value) =>
                    setTaskFormData({
                      ...taskFormData,
                      assigned_to_role_id: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                  value={taskFormData.assigned_to_asset_id || "none"}
                  onValueChange={(value) =>
                    setTaskFormData({
                      ...taskFormData,
                      assigned_to_asset_id: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isPending || !taskFormData.title || !taskFormData.task_type}
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
                  value={taskFormData.task_type}
                  onValueChange={(value) =>
                    setTaskFormData({ ...taskFormData, task_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={taskFormData.priority}
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
                  value={assignmentData.assigned_to_role_id || "none"}
                  onValueChange={(value) =>
                    setAssignmentData({
                      ...assignmentData,
                      assigned_to_role_id: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                  value={assignmentData.assigned_to_asset_id || "none"}
                  onValueChange={(value) =>
                    setAssignmentData({
                      ...assignmentData,
                      assigned_to_asset_id: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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


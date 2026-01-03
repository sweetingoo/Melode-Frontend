"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Flag,
  Loader2,
  Eye,
  Edit,
  X,
  Users,
  FileText,
} from "lucide-react";
import {
  useMyTasks,
  useCompleteTask,
} from "@/hooks/useTasks";
import { format, isPast, parseISO } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { cn } from "@/lib/utils";

const MyTasksPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    is_overdue: "",
  });

  const itemsPerPage = 20;

  // Clean filters - remove empty strings and convert to proper types
  const cleanFilters = React.useMemo(() => {
    const cleaned = {};
    if (filters.status) cleaned.status = filters.status;
    if (filters.priority) cleaned.priority = filters.priority;
    if (filters.is_overdue !== "") {
      if (filters.is_overdue === "true") cleaned.is_overdue = true;
      else if (filters.is_overdue === "false") cleaned.is_overdue = false;
    }
    return cleaned;
  }, [filters]);

  const { data: tasksResponse, isLoading, error } = useMyTasks({
    page: currentPage,
    per_page: itemsPerPage,
    ...cleanFilters,
  });

  const completeTaskMutation = useCompleteTask();

  // Handle different API response structures
  let tasks = [];
  if (tasksResponse) {
    if (Array.isArray(tasksResponse)) {
      tasks = tasksResponse;
    } else if (tasksResponse.tasks && Array.isArray(tasksResponse.tasks)) {
      tasks = tasksResponse.tasks;
    } else if (tasksResponse.data && Array.isArray(tasksResponse.data)) {
      tasks = tasksResponse.data;
    } else if (tasksResponse.results && Array.isArray(tasksResponse.results)) {
      tasks = tasksResponse.results;
    }
  }

  const pagination = {
    page: tasksResponse?.page ?? currentPage,
    per_page: tasksResponse?.per_page ?? itemsPerPage,
    total: typeof tasksResponse?.total === 'number' ? tasksResponse.total : 
           (tasksResponse && !isLoading ? tasks.length : 0),
    total_pages: typeof tasksResponse?.total_pages === 'number' ? tasksResponse.total_pages : 
                 (typeof tasksResponse?.total === 'number' ? Math.ceil(tasksResponse.total / itemsPerPage) : 1),
  };

  // Filter tasks by search term
  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.task_type?.toLowerCase().includes(searchLower)
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
      case "critical":
        return "bg-red-600/10 text-red-700 border-red-600/20";
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

  const isTaskOverdue = (task) => {
    if (!task.due_date) return false;
    if (task.status === "completed" || task.status === "cancelled") return false;
    try {
      const dueDate = parseUTCDate(task.due_date);
      return dueDate ? isPast(dueDate) : false;
    } catch {
      return false;
    }
  };

  const handleCompleteTask = async (taskSlug) => {
    try {
      await completeTaskMutation.mutateAsync({
        slug: taskSlug,
        completionData: {
          completion_data: {},
          notes: "",
          progress_percentage: 100,
        },
      });
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const taskCount = pagination.total || filteredTasks.length;
  const overdueCount = filteredTasks.filter(isTaskOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Tasks assigned to you
          </p>
        </div>
        {taskCount > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold">{taskCount}</div>
            <div className="text-sm text-muted-foreground">
              {taskCount === 1 ? "task" : "tasks"} total
            </div>
            {overdueCount > 0 && (
              <div className="text-sm text-red-600 font-medium mt-1">
                {overdueCount} overdue
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
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
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.is_overdue || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, is_overdue: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Overdue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="true">Overdue Only</SelectItem>
                <SelectItem value="false">Not Overdue</SelectItem>
              </SelectContent>
            </Select>
            {(filters.status || filters.priority || filters.is_overdue) && (
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    status: "",
                    priority: "",
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

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Failed to load tasks. Please try again.
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchTerm || filters.status || filters.priority || filters.is_overdue
                  ? "No tasks match your filters"
                  : "You have no tasks assigned"}
              </div>
              {searchTerm || filters.status || filters.priority || filters.is_overdue ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({ status: "", priority: "", is_overdue: "" });
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const overdue = isTaskOverdue(task);
                return (
                  <Card
                    key={task.id}
                    className={cn(
                      "transition-all hover:shadow-md",
                      overdue && "border-red-500/50 bg-red-50/50 dark:bg-red-950/10"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Title and Badges */}
                          <div className="flex items-start gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold flex-1">
                              {task.title || "Untitled Task"}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getStatusColor(task.status)}>
                                {task.status || "pending"}
                              </Badge>
                              {task.priority && (
                                <Badge className={getPriorityColor(task.priority)}>
                                  <Flag className="mr-1 h-3 w-3" />
                                  {task.priority}
                                </Badge>
                              )}
                              {overdue && (
                                <Badge variant="destructive">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Overdue
                                </Badge>
                              )}
                              {task.assigned_to_role_id && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="mr-1 h-3 w-3" />
                                  From Role
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

                          {/* Description */}
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Task Type */}
                          {task.task_type && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Type:</span>
                              <Badge variant="outline" className="text-xs">
                                {task.task_type}
                              </Badge>
                            </div>
                          )}

                          {/* Due Date */}
                          <div className="flex items-center gap-4 flex-wrap text-sm">
                            {task.due_date ? (
                              <div className={cn(
                                "flex items-center gap-1",
                                overdue && "text-red-600 font-medium"
                              )}>
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Due: {format(parseUTCDate(task.due_date), "MMM dd, yyyy")}
                                </span>
                                {overdue && (() => {
                                  const dueDate = parseUTCDate(task.due_date);
                                  const daysOverdue = dueDate ? Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24)) : 0;
                                  return (
                                    <span className="text-xs">
                                      ({daysOverdue} days overdue)
                                    </span>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>No due date</span>
                              </div>
                            )}
                            {task.created_at && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Created: {format(parseUTCDate(task.created_at), "MMM dd, yyyy")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/tasks/${task.slug || task.id}?from=my-tasks`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {task.status !== "completed" && task.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() => handleCompleteTask(task.slug || task.id)}
                                  disabled={completeTaskMutation.isPending}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="mt-6">
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
    </div>
  );
};

export default MyTasksPage;


"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  User,
  Users,
  Calendar,
  Flag,
  FileText,
  Clock,
  AlertCircle,
  Building2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  useAssignTask,
} from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useLocations } from "@/hooks/useLocations";
import { useAssets } from "@/hooks/useAssets";
import { useRoles } from "@/hooks/useRoles";
import { format } from "date-fns";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TaskDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({});
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

  const { data: task, isLoading, error } = useTask(taskId);
  const { data: usersResponse } = useUsers();
  const { data: locationsData } = useLocations();
  const { data: assetsData } = useAssets();
  const { data: rolesData } = useRoles();

  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const completeTaskMutation = useCompleteTask();
  const assignTaskMutation = useAssignTask();

  const users = usersResponse?.users || usersResponse || [];
  const locations = Array.isArray(locationsData) ? locationsData : [];
  const assets = Array.isArray(assetsData) ? assetsData : [];
  const roles = rolesData || [];

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

  const openEditModal = () => {
    if (task) {
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
    }
  };

  const openAssignModal = () => {
    if (task) {
      setAssignmentData({
        assigned_to_user_id: task.assigned_to_user_id || "",
        assigned_user_ids: task.assigned_user_ids || [],
        assigned_to_role_id: task.assigned_to_role_id || "",
        assigned_to_asset_id: task.assigned_to_asset_id || "",
      });
      setSelectedUserIds(task.assigned_user_ids || []);
      setIsAssignModalOpen(true);
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
        id: taskId,
        taskData,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      router.push("/admin/tasks");
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
        id: taskId,
        assignmentData: assignment,
      });
      setIsAssignModalOpen(false);
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };

  const handleCompleteTask = async () => {
    try {
      await completeTaskMutation.mutateAsync({
        id: taskId,
        completionData,
      });
      setIsCompleteModalOpen(false);
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Link href="/admin/tasks">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Task Not Found</h3>
            <p className="text-muted-foreground">
              The task you're looking for doesn't exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignedUsers = users.filter((user) =>
    task.assigned_user_ids?.includes(user.id)
  );
  const assignedUser = users.find((user) => user.id === task.assigned_to_user_id);
  const assignedRole = roles.find((role) => role.id === task.assigned_to_role_id);
  const assignedAsset = assets.find((asset) => asset.id === task.assigned_to_asset_id);
  const location = locations.find((loc) => loc.id === task.location_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground">Task Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {task.status !== "completed" && (
            <Button onClick={() => setIsCompleteModalOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Task
            </Button>
          )}
          <Button variant="outline" onClick={openEditModal}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this task? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTask}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{task.description || "No description provided"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Task Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{task.task_type || "N/A"}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Progress</Label>
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${task.progress_percentage || 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm">{task.progress_percentage || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              {task.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assignments</CardTitle>
                <Button variant="outline" size="sm" onClick={openAssignModal}>
                  <User className="mr-2 h-4 w-4" />
                  Reassign
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.assigned_user_ids?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned Users ({task.assigned_user_ids.length})
                  </Label>
                  <div className="mt-2 space-y-2">
                    {assignedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 border rounded-md"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {user.display_name ||
                            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                            user.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {assignedUser && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned User
                  </Label>
                  <div className="mt-2 p-2 border rounded-md">
                    {assignedUser.display_name ||
                      `${assignedUser.first_name || ""} ${assignedUser.last_name || ""}`.trim() ||
                      assignedUser.email}
                  </div>
                </div>
              )}
              {assignedRole && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Assigned Role
                  </Label>
                  <div className="mt-2 p-2 border rounded-md">
                    {assignedRole.display_name || assignedRole.name}
                  </div>
                </div>
              )}
              {assignedAsset && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Assigned Asset
                  </Label>
                  <div className="mt-2 p-2 border rounded-md">
                    {assignedAsset.name || assignedAsset.asset_number}
                  </div>
                </div>
              )}
              {!task.assigned_user_ids?.length &&
                !assignedUser &&
                !assignedRole &&
                !assignedAsset && (
                  <p className="text-muted-foreground">No assignments</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.start_date && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Date
                  </Label>
                  <p className="mt-1">
                    {format(new Date(task.start_date), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              )}
              {task.due_date && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </Label>
                  <p className="mt-1">
                    {format(new Date(task.due_date), "MMM dd, yyyy HH:mm")}
                  </p>
                  {task.is_overdue && (
                    <Badge variant="destructive" className="mt-2">
                      Overdue
                    </Badge>
                  )}
                  {task.is_due_soon && (
                    <Badge variant="outline" className="mt-2">
                      Due Soon
                    </Badge>
                  )}
                </div>
              )}
              {task.completed_at && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed At
                  </Label>
                  <p className="mt-1">
                    {format(new Date(task.completed_at), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {location && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{location.name}</p>
                {location.address && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {location.address}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p>
                  {task.created_at
                    ? format(new Date(task.created_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p>
                  {task.updated_at
                    ? format(new Date(task.updated_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              onClick={() => setIsEditModalOpen(false)}
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
              onClick={() => setIsAssignModalOpen(false)}
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
              onClick={() => setIsCompleteModalOpen(false)}
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

export default TaskDetailPage;


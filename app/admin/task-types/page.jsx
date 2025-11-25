"use client";

import React, { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Shield,
  Palette,
  Type,
} from "lucide-react";
import {
  useTaskTypes,
  useCreateTaskType,
  useUpdateTaskType,
  useDeleteTaskType,
} from "@/hooks/useTaskTypes";

const TaskTypesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [taskTypeFormData, setTaskTypeFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
    sort_order: 0,
  });

  const { data: taskTypesResponse, isLoading } = useTaskTypes();
  const createTaskTypeMutation = useCreateTaskType();
  const updateTaskTypeMutation = useUpdateTaskType();
  const deleteTaskTypeMutation = useDeleteTaskType();

  // Extract task types from response
  let taskTypes = [];
  if (taskTypesResponse) {
    if (Array.isArray(taskTypesResponse)) {
      taskTypes = taskTypesResponse;
    } else if (taskTypesResponse.task_types && Array.isArray(taskTypesResponse.task_types)) {
      taskTypes = taskTypesResponse.task_types;
    } else if (taskTypesResponse.data && Array.isArray(taskTypesResponse.data)) {
      taskTypes = taskTypesResponse.data;
    } else if (taskTypesResponse.results && Array.isArray(taskTypesResponse.results)) {
      taskTypes = taskTypesResponse.results;
    }
  }

  // Sort by sort_order, then by display_name
  const sortedTaskTypes = [...taskTypes].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  const handleCreateTaskType = async () => {
    try {
      await createTaskTypeMutation.mutateAsync(taskTypeFormData);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create task type:", error);
    }
  };

  const handleUpdateTaskType = async () => {
    try {
      await updateTaskTypeMutation.mutateAsync({
        id: selectedTaskType.id,
        taskTypeData: taskTypeFormData,
      });
      setIsEditModalOpen(false);
      setSelectedTaskType(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update task type:", error);
    }
  };

  const handleDeleteTaskType = async (taskTypeId) => {
    try {
      await deleteTaskTypeMutation.mutateAsync(taskTypeId);
    } catch (error) {
      console.error("Failed to delete task type:", error);
    }
  };

  const resetForm = () => {
    setTaskTypeFormData({
      name: "",
      display_name: "",
      description: "",
      icon: "",
      color: "#6B7280",
      sort_order: 0,
    });
  };

  const openEditModal = (taskType) => {
    setSelectedTaskType(taskType);
    setTaskTypeFormData({
      name: taskType.name || "",
      display_name: taskType.display_name || "",
      description: taskType.description || "",
      icon: taskType.icon || "",
      color: taskType.color || "#6B7280",
      sort_order: taskType.sort_order || 0,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Types</h1>
          <p className="text-muted-foreground">
            Manage task types for your organization
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task Type
        </Button>
      </div>

      {/* Task Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Task Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sortedTaskTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No task types found. Create your first task type to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTaskTypes.map((taskType) => (
                    <TableRow key={taskType.id}>
                      <TableCell>
                        {taskType.icon ? (
                          <span className="text-2xl">{taskType.icon}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {taskType.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {taskType.display_name || taskType.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {taskType.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: taskType.color || "#6B7280" }}
                          />
                          <span className="text-sm font-mono">
                            {taskType.color || "#6B7280"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {taskType.is_system ? (
                          <Badge variant="outline" className="bg-blue-500/10">
                            <Shield className="mr-1 h-3 w-3" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {taskType.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
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
                            <DropdownMenuItem onClick={() => openEditModal(taskType)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {!taskType.is_system && (
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
                                      <AlertDialogTitle>Delete Task Type</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this task type? This
                                        action cannot be undone. Make sure no active tasks are
                                        using this task type.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteTaskType(taskType.id)}
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
        </CardContent>
      </Card>

      {/* Create Task Type Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task Type</DialogTitle>
            <DialogDescription>
              Create a new task type for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name (Unique Identifier) *</Label>
              <Input
                id="name"
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
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
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
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
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
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
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
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
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
                setIsCreateModalOpen(false);
                resetForm();
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

      {/* Edit Task Type Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task Type</DialogTitle>
            <DialogDescription>
              Update task type details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name (Unique Identifier)</Label>
              <Input
                id="edit-name"
                value={taskTypeFormData.name}
                disabled={selectedTaskType?.is_system}
                className="font-mono"
              />
              {selectedTaskType?.is_system && (
                <p className="text-xs text-muted-foreground mt-1">
                  System task types cannot have their name changed.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-display_name">Display Name *</Label>
              <Input
                id="edit-display_name"
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
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
                <Label htmlFor="edit-icon">Icon (Emoji)</Label>
                <Input
                  id="edit-icon"
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
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
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
              <Label htmlFor="edit-sort_order">Sort Order</Label>
              <Input
                id="edit-sort_order"
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
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTaskType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTaskType}
              disabled={
                updateTaskTypeMutation.isPending ||
                !taskTypeFormData.display_name
              }
            >
              {updateTaskTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Task Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskTypesPage;


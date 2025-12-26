"use client";

import React, { useState } from "react";
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
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  CheckSquare,
  Calendar,
  Loader2,
  Plus,
  X,
  User,
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
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProjectDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
  });

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
  const { data: membersResponse, isLoading: membersLoading } = useProjectMembers(projectId);
  const { data: allTasksResponse } = useTasks({ page: 1, per_page: 1000 });
  const { data: usersResponse } = useUsers();

  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const addTaskMutation = useAddTaskToProject();
  const removeTaskMutation = useRemoveTaskFromProject();
  const addMemberMutation = useAddMemberToProject();
  const removeMemberMutation = useRemoveMemberFromProject();

  // Extract data from responses
  const projectTasks = projectTasksResponse?.tasks || projectTasksResponse?.data || projectTasksResponse || [];
  const members = membersResponse?.members || membersResponse?.data || membersResponse || [];
  const allTasks = allTasksResponse?.tasks || allTasksResponse?.data || allTasksResponse || [];
  const users = usersResponse?.users || usersResponse || [];

  // Filter out tasks already in project
  const availableTasks = Array.isArray(allTasks)
    ? allTasks.filter(
        (task) => !Array.isArray(projectTasks) || !projectTasks.some((pt) => pt.id === task.id)
      )
    : [];

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
      setIsAddTaskModalOpen(false);
      setSelectedTaskId("");
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTaskModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
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
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsAddTaskModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
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
              <Label>Task</Label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available tasks
                    </SelectItem>
                  ) : (
                    availableTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.title}
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


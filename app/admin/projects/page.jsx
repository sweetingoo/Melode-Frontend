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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FolderKanban,
  Users,
  CheckSquare,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { cn } from "@/lib/utils";

const ProjectsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
  });

  const itemsPerPage = 20;

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateProject = hasPermission("project:create");
  const canUpdateProject = hasPermission("project:update");
  const canDeleteProject = hasPermission("project:delete");
  const canViewAllProjects = hasPermission("project:view_all");

  // API hooks
  const { data: projectsResponse, isLoading, error, refetch } = useProjects({
    page: currentPage,
    per_page: itemsPerPage,
    search: searchTerm || undefined,
  });

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Handle different API response structures
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
    }
  }

  const pagination = {
    page: projectsResponse?.page ?? currentPage,
    per_page: projectsResponse?.per_page ?? itemsPerPage,
    total: projectsResponse?.total ?? projects.length,
    total_pages: projectsResponse?.total_pages ?? Math.ceil((projectsResponse?.total ?? projects.length) / itemsPerPage),
  };

  const resetForm = () => {
    setProjectFormData({
      name: "",
      description: "",
    });
    setSelectedProject(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setProjectFormData({
      name: project.name || "",
      description: project.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleCreateProject = async () => {
    if (!projectFormData.name.trim()) {
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        name: projectFormData.name.trim(),
        description: projectFormData.description?.trim() || "",
      });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleUpdateProject = async () => {
    if (!projectFormData.name.trim() || !selectedProject) {
      return;
    }

    try {
      await updateProjectMutation.mutateAsync({
        slug: selectedProject.slug || selectedProject.id,
        projectData: {
          name: projectFormData.name.trim(),
          description: projectFormData.description?.trim() || "",
        },
      });
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleDeleteProject = async (projectSlug, force = false) => {
    try {
      await deleteProjectMutation.mutateAsync({ slug: projectSlug, force });
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load projects</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">Manage and organize your projects</p>
        </div>
        {canCreateProject && (
          <Button onClick={openCreateModal} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first project"}
              </p>
              {canCreateProject && !searchTerm && (
                <Button onClick={openCreateModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Link
                            href={`/admin/projects/${project.slug || project.id}`}
                            className="font-medium hover:underline"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {project.description || "No description"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <CheckSquare className="mr-1 h-3 w-3" />
                            {project.tasks_count || project.task_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Users className="mr-1 h-3 w-3" />
                            {project.members_count || project.member_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {project.created_at ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(parseUTCDate(project.created_at), "MMM dd, yyyy")}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/projects/${project.slug || project.id}`)}
                              >
                                View Details
                              </DropdownMenuItem>
                              {canUpdateProject && (
                                <DropdownMenuItem onClick={() => openEditModal(project)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteProject && (
                                <>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
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
                                          onClick={() => handleDeleteProject(project.slug || project.id, false)}
                                          className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                                        >
                                          Soft Delete
                                        </AlertDialogAction>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteProject(project.slug || project.id, true)}
                                          className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                        >
                                          Hard Delete (Permanent)
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

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={
                            currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
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
                            setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))
                          }
                          className={
                            currentPage === pagination.total_pages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Project Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize and group related tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={projectFormData.name}
                onChange={(e) =>
                  setProjectFormData({ ...projectFormData, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={projectFormData.description}
                onChange={(e) =>
                  setProjectFormData({ ...projectFormData, description: e.target.value })
                }
                placeholder="Enter project description (optional)"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="h-10 min-h-[40px] px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending || !projectFormData.name.trim()}
              className="h-10 min-h-[40px] px-4"
            >
              {createProjectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and information.
            </DialogDescription>
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
              <Textarea
                id="edit-project-description"
                value={projectFormData.description}
                onChange={(e) =>
                  setProjectFormData({ ...projectFormData, description: e.target.value })
                }
                placeholder="Enter project description (optional)"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}
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
    </div>
  );
};

export default ProjectsPage;


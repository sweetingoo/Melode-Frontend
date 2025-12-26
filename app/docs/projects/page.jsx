"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Plus, Users, Trash2, Edit, AlertCircle, CheckSquare } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProjectsDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Projects Management</h1>
        <p className="text-lg text-muted-foreground">
          Organise and manage tasks by grouping them into projects
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the projects management system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Projects?</h3>
              <p className="text-sm text-muted-foreground">
                Projects allow you to group related tasks together, making it easier to organise work,
                track progress, and manage team collaboration. Projects provide a high-level view of
                multiple tasks working toward a common goal.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Projects</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Projects" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/projects</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">projects:read</code> permission</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Projects List View</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The projects page displays all projects in a table format with the following information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Name:</strong> Clickable project name that links to the project details page</li>
                <li><strong>Description:</strong> Brief description of the project (truncated if long)</li>
                <li><strong>Tasks:</strong> Number of tasks associated with the project</li>
                <li><strong>Members:</strong> Number of team members assigned to the project</li>
                <li><strong>Created:</strong> Date when the project was created</li>
                <li><strong>Actions:</strong> Dropdown menu with options to view, edit, or delete the project</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Search Functionality</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use the search bar at the top of the projects page to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Search projects by name or description</li>
                <li>Filter results in real-time as you type</li>
                <li>Clear the search to view all projects again</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Empty State</h3>
              <p className="text-sm text-muted-foreground">
                When no projects exist or no search results are found, you'll see an empty state message
                with an option to create your first project (if you have the necessary permissions).
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Benefits of Using Projects</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Organise related tasks under a single project</li>
                <li>Track project-level progress and completion</li>
                <li>Filter tasks by project in the tasks list</li>
                <li>View all tasks associated with a project in one place</li>
                <li>Manage project members and assignments</li>
                <li>Better visibility into project status and workload</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Projects</CardTitle>
            </div>
            <CardDescription>How to create a new project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Project Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Project Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Create Project" button on the Projects page to open the project creation form.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Project Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The create project form includes the following fields:
                  </p>
                  <DialogMockup
                    title="Create New Project"
                    description="Create a new project to organise related tasks."
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Project
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Project Name"
                        type="text"
                        placeholder="Enter project name"
                        required
                        value="Q1 2024 Marketing Campaign"
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Describe the project goals and scope..."
                        rows={4}
                        value="Launch comprehensive marketing campaign for Q1 2024, including social media, email marketing, and content creation initiatives."
                      />
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Required Fields</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Project name (required) - Must be unique and descriptive</li>
                <li>Description (optional but recommended) - Helps team members understand the project's purpose and scope</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">After Creating a Project</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Once you create a project:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>The project will appear in the projects list immediately</li>
                <li>You can click on the project name to view its details page</li>
                <li>You can start associating tasks with the project when creating or editing tasks</li>
                <li>You can add members to the project from the project details page</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckSquare className="h-6 w-6 text-purple-600" />
              <CardTitle>Associating Tasks with Projects</CardTitle>
            </div>
            <CardDescription>How to link tasks to projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">When Creating a Task</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When creating a new task, you can associate it with a project:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open the "Create Task" dialog</li>
                <li>Find the "Project" field in the form</li>
                <li>Select a project from the dropdown, or leave it as "No Project"</li>
                <li>The task will be associated with the selected project</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">When Editing a Task</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can also associate or change a task's project when editing:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Open the task details page and click "Edit"</li>
                <li>Find the "Project" field in the edit form</li>
                <li>Select a different project or set it to "No Project" to remove the association</li>
                <li>Save your changes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Viewing Tasks by Project</h3>
              <p className="text-sm text-muted-foreground">
                Once tasks are associated with projects, you can:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Filter the tasks list by project using the Project filter dropdown</li>
                <li>View the project name in the Project column of the tasks table</li>
                <li>Click on a project name to navigate to the project details page</li>
                <li>View all tasks for a project on the project details page</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-orange-600" />
              <CardTitle>Managing Projects</CardTitle>
            </div>
            <CardDescription>Editing, viewing, and deleting projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Viewing Project Details</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can view project details in two ways:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-3">
                <li>Click on any project name in the projects list table</li>
                <li>Use the "View Details" option from the Actions dropdown menu</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-2">
                The project details page includes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Project name and description</li>
                <li>List of all tasks associated with the project</li>
                <li>Project members and their assignments</li>
                <li>Project activity and audit logs</li>
                <li>Options to edit or delete the project</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Editing Projects</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can edit a project in two ways:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-3">
                <li>From the projects list: Click the Actions menu (three dots) and select "Edit"</li>
                <li>From the project details page: Click the "Edit" button in the header</li>
              </ol>
              <p className="text-sm text-muted-foreground mb-2">
                The edit modal allows you to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Update the project name</li>
                <li>Modify the project description</li>
                <li>Save changes or cancel to discard modifications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Deleting Projects</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Projects can be deleted from either the projects list or the project details page:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-3">
                <li>From the projects list: Click the Actions menu (three dots) and select "Delete"</li>
                <li>From the project details page: Click the "Delete" button in the header</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-2">
                When deleting, you'll be presented with two options:
              </p>
              <div className="space-y-3 mt-3">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Soft Delete (Default)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Deactivates the project without permanently removing it. The project can be restored later.
                    All tasks associated with the project will have their project association removed (set to null).
                    This is the recommended option for most cases.
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg border border-destructive/20">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Hard Delete (Permanent)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-destructive">Warning:</strong> Permanently removes the project from the database.
                    This action cannot be undone! All tasks associated with the project will have their
                    project association removed. Use this option only when you're certain the project should
                    be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-indigo-600" />
              <CardTitle>Project Members</CardTitle>
            </div>
            <CardDescription>Managing team members in projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Adding Members to Projects</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can add team members to a project:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to the project details page</li>
                <li>Find the "Members" section</li>
                <li>Click "Add Member" or use the member management interface</li>
                <li>Select users to add to the project</li>
                <li>Members will have visibility into the project and its tasks</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Removing Members</h3>
              <p className="text-sm text-muted-foreground">
                Members can be removed from projects at any time. Removing a member doesn't affect
                tasks they're assigned to, but they'll no longer have project-level visibility.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Permissions</CardTitle>
            <CardDescription>Understanding who can do what with projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Viewing Projects</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">projects:read</code> permission can view projects.
                  Project members may also have visibility into projects they're assigned to.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Creating Projects</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">projects:create</code> permission can create new projects.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Editing Projects</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">projects:update</code> permission can edit project details.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Deleting Projects</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">projects:delete</code> permission can delete projects.
                  This is typically restricted to administrators or project managers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
            <CardDescription>Tips for effective project management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Project Organisation</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Use clear, descriptive project names that indicate the project's purpose</li>
                  <li>Add detailed descriptions to help team members understand project goals</li>
                  <li>Group related tasks under the same project for better organisation</li>
                  <li>Regularly review and update project descriptions as goals evolve</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Task Association</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Associate all related tasks with their appropriate project</li>
                  <li>Use project filtering to quickly view tasks for a specific project</li>
                  <li>Review project task lists regularly to ensure all relevant tasks are included</li>
                  <li>Consider project association when creating recurring tasks</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Project Lifecycle</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Use soft delete for completed or inactive projects to maintain historical data</li>
                  <li>Only use hard delete when absolutely necessary and data retention is not required</li>
                  <li>Keep project memberships up to date as team composition changes</li>
                  <li>Archive completed projects rather than deleting them when possible</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


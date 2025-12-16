"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus, Filter, Users, Calendar, AlertCircle, FileText, MapPin, Building2 } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect, StepIndicator } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function TasksDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Tasks Management</h1>
        <p className="text-lg text-muted-foreground">
          Create, assign, and manage tasks across your organisation
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckSquare className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the tasks management system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Tasks Management?</h3>
              <p className="text-sm text-muted-foreground">
                Tasks Management allows you to create, assign, track, and manage tasks throughout your organisation.
                This feature helps teams coordinate work, track progress, and ensure nothing falls through the cracks.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Tasks</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Tasks" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/tasks</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">tasks:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Tasks</CardTitle>
            </div>
            <CardDescription>How to create a new task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Task Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Task Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Create Task" button on the Tasks page to open the task creation form.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Task Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Create Task" button to open the dialog. You'll see the create task form with the following fields:
                  </p>
                  <DialogMockup
                    title="Create New Task"
                    description="Create a new task and assign it to users, roles, or assets."
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Task
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Task Title"
                        type="text"
                        placeholder="Enter task title"
                        required
                        value="Complete quarterly report"
                      />
                      <FormSelect
                        label="Task Type"
                        placeholder="Select task type"
                        required
                        value="report"
                        options={[
                          { value: "report", label: "Report" },
                          { value: "maintenance", label: "Maintenance" },
                          { value: "training", label: "Training" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Describe what needs to be done..."
                        rows={4}
                        value="Prepare and submit the quarterly financial report including revenue analysis, expenses, and projections for the next quarter."
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormSelect
                          label="Priority"
                          placeholder="Select priority"
                          value="high"
                          options={[
                            { value: "high", label: "High" },
                            { value: "medium", label: "Medium" },
                            { value: "low", label: "Low" },
                          ]}
                        />
                        <FormField
                          label="Due Date"
                          type="date"
                          value="2024-02-15"
                        />
                      </div>
                      <FormSelect
                        label="Assign To"
                        placeholder="Select assignee(s)"
                        required
                        value="user-1"
                        options={[
                          { value: "user-1", label: "John Doe" },
                          { value: "user-2", label: "Jane Smith" },
                          { value: "user-3", label: "Bob Johnson" },
                        ]}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormSelect
                          label="Department"
                          placeholder="Select department"
                          value="sales"
                          options={[
                            { value: "sales", label: "Sales" },
                            { value: "marketing", label: "Marketing" },
                            { value: "it", label: "IT" },
                          ]}
                        />
                        <FormSelect
                          label="Location"
                          placeholder="Select location"
                          value=""
                          options={[
                            { value: "office-1", label: "Main Office" },
                            { value: "warehouse", label: "Warehouse A" },
                          ]}
                        />
                      </div>
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Required Fields</h3>
              <p className="text-sm text-muted-foreground">
                While specific requirements may vary, typically you'll need to provide:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Task title (required)</li>
                <li>Task type (required)</li>
                <li>At least one assignee (required)</li>
                <li>Due date (may be required or optional)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              <CardTitle>Assigning Tasks</CardTitle>
            </div>
            <CardDescription>How to assign tasks to team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Single Assignment</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Assign a task to one person:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>When creating or editing a task, find the "Assignee" field</li>
                <li>Search for or select the team member</li>
                <li>The assignee will receive a notification about the new task</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Multiple Assignments</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Some tasks can be assigned to multiple people:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select multiple assignees from the assignee field</li>
                <li>All assignees will receive notifications</li>
                <li>Each assignee can update the task status independently</li>
                <li>Task completion may require all assignees to complete their parts</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Department Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Tasks can be assigned to entire departments, making them visible to all department members
                who can then claim or be assigned to specific tasks.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-orange-600" />
              <CardTitle>Viewing & Filtering Tasks</CardTitle>
            </div>
            <CardDescription>How to find and organize tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Task Views</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Tasks can be viewed in different formats:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>List View:</strong> Simple list of all tasks</li>
                <li><strong>Table View:</strong> Detailed table with sortable columns</li>
                <li><strong>Kanban View:</strong> Board view organized by status</li>
                <li><strong>Calendar View:</strong> Tasks displayed on a calendar by due date</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Filter Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Filter tasks by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Status:</strong> Pending, In Progress, Completed, etc.</li>
                <li><strong>Priority:</strong> High, Medium, Low</li>
                <li><strong>Assignee:</strong> Filter by who the task is assigned to</li>
                <li><strong>Task Type:</strong> Filter by type of task</li>
                <li><strong>Department:</strong> Filter by department</li>
                <li><strong>Due Date:</strong> Filter by due date range or overdue tasks</li>
                <li><strong>Created By:</strong> Filter by who created the task</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <CardTitle>Task Status & Updates</CardTitle>
            </div>
            <CardDescription>Managing task progress and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Updating Task Status</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Task status can be updated throughout the task lifecycle:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Pending:</strong> Task is created but not started</li>
                <li><strong>In Progress:</strong> Work has begun on the task</li>
                <li><strong>On Hold:</strong> Task is temporarily paused</li>
                <li><strong>Completed:</strong> Task is finished</li>
                <li><strong>Cancelled:</strong> Task is no longer needed</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Adding Comments</h3>
              <p className="text-sm text-muted-foreground">
                Keep stakeholders informed by adding comments to tasks. Comments can include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Progress updates</li>
                <li>Questions or clarifications</li>
                <li>Blockers or issues encountered</li>
                <li>Completion notes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Attachments</h3>
              <p className="text-sm text-muted-foreground">
                Attach files, images, or documents to tasks to provide additional context or deliverables.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <CardTitle>Task Priorities & Due Dates</CardTitle>
            </div>
            <CardDescription>Understanding task priorities and deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Priority Levels</h3>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">High Priority</h4>
                  <p className="text-xs text-muted-foreground">Urgent tasks that need immediate attention</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Medium Priority</h4>
                  <p className="text-xs text-muted-foreground">Important tasks with normal urgency</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Low Priority</h4>
                  <p className="text-xs text-muted-foreground">Tasks that can be completed when time permits</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Due Dates</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Due dates help track deadlines:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Set realistic due dates when creating tasks</li>
                <li>Tasks approaching their due date may be highlighted</li>
                <li>Overdue tasks are typically marked in red or with an alert</li>
                <li>Due dates can be updated if circumstances change</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring Tasks</CardTitle>
            <CardDescription>Creating tasks that repeat automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Setting Up Recurring Tasks</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Some tasks need to be completed regularly. You can set up recurring tasks:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Select "Recurring" option when creating a task</li>
                  <li>Choose the recurrence pattern (daily, weekly, monthly, etc.)</li>
                  <li>Set the end date or number of occurrences</li>
                  <li>New task instances will be created automatically</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Managing Recurring Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  You can view the history of recurring task instances and modify or cancel
                  the recurrence pattern at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Permissions</CardTitle>
            <CardDescription>Understanding who can do what with tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Viewing Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">tasks:read</code> permission can view tasks.
                  What they see depends on their role and department assignments.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Creating Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">tasks:create</code> permission can create new tasks.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Editing Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">tasks:update</code> permission can edit tasks.
                  Task assignees can typically update their assigned tasks.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Deleting Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  Users with <code className="bg-muted px-1 py-0.5 rounded">tasks:delete</code> permission can delete tasks.
                  This is typically restricted to administrators or task creators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


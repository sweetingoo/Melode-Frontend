"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, Clock, Filter, Search, Edit, MessageSquare } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect, FormTextarea } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MyTasksDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">My Tasks</h1>
        <p className="text-lg text-muted-foreground">
          View, manage, and track all tasks assigned to you
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the My Tasks feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is My Tasks?</h3>
              <p className="text-sm text-muted-foreground">
                My Tasks is your personal task management center where you can view all tasks assigned to you,
                track their progress, update their status, and manage your workload. This feature is available to all users.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing My Tasks</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "My Tasks" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/my-tasks</code> or <code className="bg-muted px-1 py-0.5 rounded">/my-tasks</code></li>
                <li>Available to all authenticated users</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <CardTitle>My Tasks View</CardTitle>
            </div>
            <CardDescription>How your tasks are displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Task List Interface</h3>
              <p className="text-sm text-muted-foreground mb-4">
                When you navigate to My Tasks, you'll see a list of all your assigned tasks:
              </p>
              <FormMockup
                title="My Tasks"
                description="All tasks assigned to you"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                        disabled
                        value=""
                      />
                    </div>
                    <FormSelect
                      placeholder="Filter by status"
                      value=""
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "pending", label: "Pending" },
                        { value: "in-progress", label: "In Progress" },
                        { value: "completed", label: "Completed" },
                      ]}
                      className="w-40"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">Complete quarterly report</h4>
                            <Badge variant="secondary" className="text-xs">High</Badge>
                            <Badge className="text-xs bg-yellow-500">Pending</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Prepare and submit the quarterly financial report...
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Due: Feb 15, 2024</span>
                            <span>•</span>
                            <span>Type: Report</span>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-muted rounded-md" disabled>
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg hover:bg-muted/50 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">Update website content</h4>
                            <Badge variant="secondary" className="text-xs">Medium</Badge>
                            <Badge className="text-xs bg-blue-500">In Progress</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Review and update the main website landing page...
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Due: Feb 20, 2024</span>
                            <span>•</span>
                            <span>Type: Content</span>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-muted rounded-md" disabled>
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4">Updating Task Status</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click on a task to view details and update its status. You'll see a dialog like this:
              </p>
              <DialogMockup
                title="Task Details"
                description="View and update task information"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Close
                    </FormButton>
                    <FormButton size="sm">
                      Save Changes
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Complete quarterly report</h4>
                    <p className="text-sm text-muted-foreground">
                      Prepare and submit the quarterly financial report including revenue analysis, expenses, and projections.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <FormSelect
                        value="in-progress"
                        options={[
                          { value: "pending", label: "Pending" },
                          { value: "in-progress", label: "In Progress" },
                          { value: "completed", label: "Completed" },
                          { value: "on-hold", label: "On Hold" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Priority</label>
                      <FormSelect
                        value="high"
                        options={[
                          { value: "high", label: "High" },
                          { value: "medium", label: "Medium" },
                          { value: "low", label: "Low" },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Add Comment</label>
                    <FormTextarea
                      placeholder="Add an update or comment..."
                      rows={3}
                      value=""
                    />
                    <FormButton size="sm" variant="outline" className="mt-2" icon={MessageSquare}>
                      Add Comment
                    </FormButton>
                  </div>
                </div>
              </DialogMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-purple-600" />
              <CardTitle>Filtering & Sorting</CardTitle>
            </div>
            <CardDescription>Organise and find tasks efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Filtering Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can filter your tasks by various criteria:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Status:</strong> Filter by task status (Pending, In Progress, Completed, etc.)</li>
                <li><strong>Priority:</strong> Filter by priority level (High, Medium, Low)</li>
                <li><strong>Due Date:</strong> Filter by due date range or overdue tasks</li>
                <li><strong>Task Type:</strong> Filter by the type of task</li>
                <li><strong>Department:</strong> Filter by department (if applicable)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sorting Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Tasks can be sorted by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Due date (ascending or descending)</li>
                <li>Priority (high to low or low to high)</li>
                <li>Status</li>
                <li>Creation date</li>
                <li>Last updated</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-orange-600" />
              <CardTitle>Searching Tasks</CardTitle>
            </div>
            <CardDescription>Find specific tasks quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Use the search functionality to find tasks by:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Task title or name</li>
              <li>Task description</li>
              <li>Task ID or reference number</li>
              <li>Assigned by (who created/assigned the task)</li>
              <li>Related keywords or tags</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-indigo-600" />
              <CardTitle>Task Details</CardTitle>
            </div>
            <CardDescription>Understanding task information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Task Information Displayed</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Title:</strong> The name of the task</li>
                <li><strong>Description:</strong> Detailed information about what needs to be done</li>
                <li><strong>Status:</strong> Current status of the task</li>
                <li><strong>Priority:</strong> Priority level (High, Medium, Low)</li>
                <li><strong>Due Date:</strong> When the task should be completed</li>
                <li><strong>Assigned By:</strong> Who created or assigned the task</li>
                <li><strong>Created Date:</strong> When the task was created</li>
                <li><strong>Last Updated:</strong> When the task was last modified</li>
                <li><strong>Attachments:</strong> Files or documents related to the task</li>
                <li><strong>Comments:</strong> Notes and updates from team members</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Viewing Task Details</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click on any task in the list</li>
                <li>A detailed view or modal will open showing all task information</li>
                <li>You can view, edit (if permitted), and update the task from this view</li>
                <li>Add comments, update status, or attach files as needed</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Actions</CardTitle>
            <CardDescription>What you can do with your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Update Status</h4>
                <p className="text-xs text-muted-foreground">Change the status of a task as you progress</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Add Comments</h4>
                <p className="text-xs text-muted-foreground">Provide updates or ask questions about the task</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Upload Attachments</h4>
                <p className="text-xs text-muted-foreground">Attach files, images, or documents related to the task</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Request Help</h4>
                <p className="text-xs text-muted-foreground">Request assistance or clarification from the task creator</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-1">View History</h4>
                <p className="text-xs text-muted-foreground">See the complete history of changes and updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Stay informed about your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You may receive notifications when:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
              <li>A new task is assigned to you</li>
              <li>A task's status is changed by someone else</li>
              <li>A task is approaching its due date</li>
              <li>A task becomes overdue</li>
              <li>Comments are added to your tasks</li>
              <li>Task details are updated</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


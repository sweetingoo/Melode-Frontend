"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Shield, Users, Plus, Search, Filter, Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PermissionsManagementDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Permissions Management</h1>
        <p className="text-lg text-muted-foreground">
          Configure and manage user permissions and access controls
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding permissions management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Permissions?</h3>
              <p className="text-sm text-muted-foreground">
                Permissions control what users can access and do in the system. They define actions like
                reading, creating, updating, and deleting resources. Permissions are typically assigned to roles,
                and users inherit permissions through their role assignments. Each permission follows the format:
                <code className="bg-muted px-1 py-0.5 rounded">resource:action</code> (e.g., <code className="bg-muted px-1 py-0.5 rounded">tasks:create</code>).
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Permissions Management</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Manage Permissions" in the sidebar under People & Access</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/permissions-management</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">permissions:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <CardTitle>Permissions Management Interface</CardTitle>
            </div>
            <CardDescription>Understanding the permissions page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Permissions List View</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The permissions management page displays all system permissions:
              </p>
              <FormMockup
                title="Permissions Management"
                description="Manage system permissions and access controls"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Permissions Management</h3>
                      <p className="text-xs text-muted-foreground">Manage system permissions and access controls</p>
                    </div>
                    <FormButton icon={Plus}>
                      Create Permission
                    </FormButton>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        className="w-full px-10 py-2 border rounded-md text-sm"
                        disabled
                        value=""
                      />
                    </div>
                    <FormSelect
                      placeholder="All Resources"
                      value=""
                      options={[
                        { value: "all", label: "All Resources" },
                        { value: "task", label: "Task" },
                        { value: "user", label: "User" },
                        { value: "form", label: "Form" },
                      ]}
                      className="w-40"
                    />
                    <FormSelect
                      placeholder="All Types"
                      value=""
                      options={[
                        { value: "all", label: "All Types" },
                        { value: "crud", label: "CRUD" },
                        { value: "custom", label: "Custom" },
                      ]}
                      className="w-32"
                    />
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left font-semibold">Display Name</th>
                          <th className="p-3 text-left font-semibold">Permission</th>
                          <th className="p-3 text-left font-semibold">Resource</th>
                          <th className="p-3 text-left font-semibold">Action</th>
                          <th className="p-3 text-left font-semibold">Type</th>
                          <th className="p-3 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t hover:bg-muted/30">
                          <td className="p-3">Create Tasks</td>
                          <td className="p-3">
                            <code className="bg-muted px-2 py-1 rounded text-xs">tasks:create</code>
                          </td>
                          <td className="p-3">task</td>
                          <td className="p-3">create</td>
                          <td className="p-3">
                            <Badge className="bg-blue-500 text-xs">CRUD</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button className="p-1 hover:bg-muted rounded" disabled>
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 hover:bg-muted rounded" disabled>
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-t hover:bg-muted/30">
                          <td className="p-3">View Users</td>
                          <td className="p-3">
                            <code className="bg-muted px-2 py-1 rounded text-xs">users:read</code>
                          </td>
                          <td className="p-3">user</td>
                          <td className="p-3">read</td>
                          <td className="p-3">
                            <Badge className="bg-blue-500 text-xs">CRUD</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button className="p-1 hover:bg-muted rounded" disabled>
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 hover:bg-muted rounded" disabled>
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-t hover:bg-muted/30">
                          <td className="p-3">System Monitor</td>
                          <td className="p-3">
                            <code className="bg-muted px-2 py-1 rounded text-xs">SYSTEM_MONITOR</code>
                          </td>
                          <td className="p-3">system</td>
                          <td className="p-3">monitor</td>
                          <td className="p-3">
                            <Badge className="bg-purple-500 text-xs">Custom</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button className="p-1 hover:bg-muted rounded" disabled>
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 hover:bg-muted rounded" disabled>
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">Showing 1-10 of 45 permissions</p>
                    <div className="flex items-center gap-2">
                      <FormButton variant="outline" size="sm">Previous</FormButton>
                      <span className="text-sm">Page 1 of 5</span>
                      <FormButton variant="outline" size="sm">Next</FormButton>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Permission Format</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Permissions follow a specific format:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Format:</strong> <code className="bg-muted px-1 py-0.5 rounded">resource:action</code></li>
                <li><strong>Resource:</strong> The entity type (tasks, users, forms, assets, etc.)</li>
                <li><strong>Action:</strong> The operation (create, read, update, delete, etc.)</li>
                <li><strong>Examples:</strong> <code className="bg-muted px-1 py-0.5 rounded">tasks:create</code>, <code className="bg-muted px-1 py-0.5 rounded">users:read</code>, <code className="bg-muted px-1 py-0.5 rounded">forms:update</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Permissions</CardTitle>
            </div>
            <CardDescription>How to create a new permission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Create Permission</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Click Create Permission</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Create Permission" button in the top right corner.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Permission Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The create permission form requires specific information:
                  </p>
                  <DialogMockup
                    title="Create New Permission"
                    description="Create a new system permission"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Permission
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Display Name"
                        type="text"
                        placeholder="Create Tasks"
                        required
                        value="Create Tasks"
                      />
                      <p className="text-xs text-muted-foreground">
                        Human-readable name for this permission
                      </p>

                      <FormSelect
                        label="Resource"
                        placeholder="Select resource"
                        required
                        value="task"
                        options={[
                          { value: "task", label: "Task" },
                          { value: "user", label: "User" },
                          { value: "form", label: "Form" },
                          { value: "asset", label: "Asset" },
                          { value: "location", label: "Location" },
                          { value: "department", label: "Department" },
                          { value: "role", label: "Role" },
                          { value: "permission", label: "Permission" },
                        ]}
                      />
                      <p className="text-xs text-muted-foreground">
                        The resource this permission applies to (lowercase letters and underscores only)
                      </p>

                      <FormSelect
                        label="Action"
                        placeholder="Select action"
                        required
                        value="create"
                        options={[
                          { value: "create", label: "Create" },
                          { value: "read", label: "Read" },
                          { value: "update", label: "Update" },
                          { value: "delete", label: "Delete" },
                          { value: "view_all", label: "View All" },
                          { value: "manage", label: "Manage" },
                        ]}
                      />
                      <p className="text-xs text-muted-foreground">
                        The action this permission allows (lowercase letters and underscores only)
                      </p>

                      <FormTextarea
                        label="Description"
                        placeholder="Describe what this permission allows"
                        rows={3}
                        value="Allows users to create new tasks in the system"
                      />

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-1">Generated Permission Name:</p>
                        <code className="text-xs">task:create</code>
                        <p className="text-xs text-muted-foreground mt-1">
                          This will be the internal permission identifier
                        </p>
                      </div>
                    </div>
                  </DialogMockup>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 3: Validation Rules</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Resource must contain only lowercase letters and underscores</li>
                    <li>Action must contain only lowercase letters and underscores</li>
                    <li>Display name is required and should be descriptive</li>
                    <li>Permission name is auto-generated as <code className="bg-muted px-1 py-0.5 rounded">resource:action</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-indigo-600" />
              <CardTitle>Viewing Permission Details</CardTitle>
            </div>
            <CardDescription>How to view detailed permission information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: View Permission Details</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Find the Permission</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use search or filters to find the permission you want to view.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click View</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the eye icon in the Actions column to open the details dialog.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Review Permission Information</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The details dialog shows comprehensive information:
                  </p>
                  <DialogMockup
                    title="Permission Details"
                    description="View detailed information about this permission"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Close
                        </FormButton>
                        <FormButton size="sm" icon={Edit}>
                          Edit Permission
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Create Tasks</h4>
                          <Badge className="bg-blue-500 text-xs">CRUD</Badge>
                        </div>
                        <code className="text-xs text-muted-foreground">tasks:create</code>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Resource</p>
                          <p className="text-sm font-medium">task</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Action</p>
                          <p className="text-sm font-medium">create</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Type</p>
                          <Badge className="bg-blue-500 text-xs">CRUD</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge className="bg-green-500 text-xs">Active</Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">Allows users to create new tasks in the system</p>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-2">Assigned to Roles</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span>Manager</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span>Administrator</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-purple-600" />
              <CardTitle>Editing Permissions</CardTitle>
            </div>
            <CardDescription>How to update permission information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How to Edit a Permission</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Find the permission in the list</li>
                <li>Click the edit icon in the Actions column</li>
                <li>Update the display name or description</li>
                <li><strong>Note:</strong> Resource and action cannot be changed after creation</li>
                <li>Click "Save Changes" to update</li>
              </ol>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Important:</strong> The resource and action fields cannot be modified after a permission
                is created. If you need to change these, you must create a new permission and delete the old one.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-green-600" />
              <CardTitle>Searching & Filtering</CardTitle>
            </div>
            <CardDescription>How to find specific permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Search Functionality</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use the search bar to find permissions by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Display name</li>
                <li>Permission name (resource:action format)</li>
                <li>Resource name</li>
                <li>Action name</li>
                <li>Description keywords</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Filter Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Filter permissions by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Resource:</strong> Filter by resource type (task, user, form, etc.)</li>
                <li><strong>Type:</strong> Filter by permission type (CRUD, Custom)</li>
                <li><strong>Action:</strong> Filter by action type (create, read, update, delete)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <CardTitle>Permission Types</CardTitle>
            </div>
            <CardDescription>Understanding different permission types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">CRUD Permissions</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Standard CRUD (Create, Read, Update, Delete) permissions:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code className="bg-muted px-1 py-0.5 rounded">resource:create</code> - Create new resources</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">resource:read</code> - View/read resources</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">resource:update</code> - Modify existing resources</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">resource:delete</code> - Remove resources</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Custom Permissions</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Custom permissions for specific actions:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code className="bg-muted px-1 py-0.5 rounded">SYSTEM_MONITOR</code> - Monitor system activity</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">resource:view_all</code> - View all resources (admin-level)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">resource:manage</code> - Full management access</li>
                <li>Other custom actions as defined by your organisation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Resources & Actions</CardTitle>
            <CardDescription>Standard permissions in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Common Resources</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">tasks</h4>
                  <p className="text-xs text-muted-foreground">Task management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">users</h4>
                  <p className="text-xs text-muted-foreground">User management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">forms</h4>
                  <p className="text-xs text-muted-foreground">Form management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">assets</h4>
                  <p className="text-xs text-muted-foreground">Asset management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">roles</h4>
                  <p className="text-xs text-muted-foreground">Role management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">permissions</h4>
                  <p className="text-xs text-muted-foreground">Permission management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">locations</h4>
                  <p className="text-xs text-muted-foreground">Location management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">departments</h4>
                  <p className="text-xs text-muted-foreground">Department management</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Common Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">create</h4>
                  <p className="text-xs text-muted-foreground">Create new resources</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">read</h4>
                  <p className="text-xs text-muted-foreground">View resources</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">update</h4>
                  <p className="text-xs text-muted-foreground">Modify resources</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">delete</h4>
                  <p className="text-xs text-muted-foreground">Remove resources</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">view_all</h4>
                  <p className="text-xs text-muted-foreground">View all resources</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">manage</h4>
                  <p className="text-xs text-muted-foreground">Full management</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagination</CardTitle>
            <CardDescription>Navigating through permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Pagination Controls</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When you have many permissions, use pagination:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Previous/Next buttons to navigate between pages</li>
                <li>Page numbers to jump to specific pages</li>
                <li>Items per page selector (10, 25, 50, 100)</li>
                <li>Total count display showing how many permissions match your filters</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

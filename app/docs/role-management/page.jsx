"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Plus, Edit, Users, Key } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";

export default function RoleManagementDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Role Management</h1>
        <p className="text-lg text-muted-foreground">
          Create and manage roles within your organisation
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding role management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Roles?</h3>
              <p className="text-sm text-muted-foreground">
                Roles define sets of permissions and responsibilities within your organisation.
                Users are assigned roles that determine what they can access and do in the system.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Role Management</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Manage Roles" in the sidebar under People & Access</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/role-management</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">roles:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Roles</CardTitle>
            </div>
            <CardDescription>How to create a new role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Role Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Role Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Create Role" or "New Role" button on the Role Management page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Role Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll see the create role form:
                  </p>
                  <DialogMockup
                    title="Create New Role"
                    description="Create a new role with specific permissions"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Role
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Role Name (Unique Identifier)"
                        type="text"
                        placeholder="project_manager"
                        required
                        value="project_manager"
                      />
                      <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only</p>
                      <FormField
                        label="Display Name"
                        type="text"
                        placeholder="Project Manager"
                        required
                        value="Project Manager"
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Role description..."
                        rows={3}
                        value="Manages projects and coordinates team activities"
                      />
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-2">Permissions</p>
                        <p className="text-xs text-muted-foreground">Select permissions for this role after creation</p>
                      </div>
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">How to Create a Role</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to Role Management</li>
                <li>Click "Create Role" or "New Role"</li>
                <li>Fill in role details including name, display name, and description</li>
                <li>Assign permissions to the role</li>
                <li>Click "Save" to create the role</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

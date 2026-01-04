"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Type, Plus, Edit, Trash2, Settings, FileText, Database, Key } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea } from "@/components/docs/FormMockup";

export default function FormTypesDocumentation() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Type className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Form Types</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Create and manage form types to organise and categorise your forms.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              Understanding form types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Form Types?</h3>
              <p className="text-sm text-muted-foreground">
                Form Types are categories that help organise and classify your forms. They allow you to group 
                related forms together, making it easier to find and manage forms. Each form must be assigned 
                to a form type.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Form Types</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Form Types" in the Organisation section of the sidebar</li>
                <li>URL: <code className="bg-muted px-1 rounded">/admin/form-types</code></li>
                <li>Requires <code className="bg-muted px-1 rounded">form_type:list</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Creating Form Types
            </CardTitle>
            <CardDescription>
              How to create a new form type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating a Form Type</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Navigate to Form Types page</li>
                <li>Click "Create Form Type" button</li>
                <li>Enter a name for the form type (e.g., "Employee Onboarding", "Safety Inspection")</li>
                <li>Optionally add a description</li>
                <li>Click "Create" to save the form type</li>
              </ol>
              <DialogMockup
                title="Create Form Type"
                description="Add a new form type to organise your forms"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">Cancel</FormButton>
                    <FormButton size="sm" icon={Plus}>Create Form Type</FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <FormField
                    label="Name"
                    type="text"
                    placeholder="Enter form type name"
                    required
                    value="Employee Onboarding"
                  />
                  <FormTextarea
                    label="Description"
                    placeholder="Optional description..."
                    rows={3}
                    value="Forms used during the employee onboarding process including paperwork, orientation, and initial training."
                  />
                </div>
              </DialogMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Form Type Properties</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li><strong>Name</strong>: Unique identifier for the form type (required)</li>
                <li><strong>Description</strong>: Optional description explaining the purpose of the form type</li>
                <li><strong>Slug</strong>: Auto-generated URL-friendly identifier</li>
              </ul>
              <FormMockup title="Form Types List" description="View and manage all form types">
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Type className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold">Employee Onboarding</p>
                          <p className="text-xs text-muted-foreground">Forms for new employee setup</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">12 forms</Badge>
                        <Edit className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Type className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold">Safety Inspections</p>
                          <p className="text-xs text-muted-foreground">Safety and compliance forms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">8 forms</Badge>
                        <Edit className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Managing Form Types
            </CardTitle>
            <CardDescription>
              Editing and organizing form types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Editing Form Types</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Edit" on any form type</li>
                <li>Update the name or description</li>
                <li>Save changes</li>
                <li>Changes affect all forms using that type</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Deleting Form Types</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Delete" on a form type</li>
                <li>Confirm deletion in the dialog</li>
                <li><strong>Note:</strong> Cannot delete form types that have forms assigned to them</li>
                <li>Reassign or delete all forms of that type first</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Viewing Forms by Type</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Form types help filter and organise forms</li>
                <li>When creating forms, you select a form type</li>
                <li>Forms can be filtered by form type in the forms list</li>
                <li>Form types appear in form management interfaces</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Use Cases
            </CardTitle>
            <CardDescription>
              Common use cases for form types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Organizational Examples</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Employee Onboarding</strong>: Forms for new employee setup</li>
                <li><strong>Safety Inspections</strong>: Safety and compliance forms</li>
                <li><strong>Performance Reviews</strong>: Employee evaluation forms</li>
                <li><strong>Incident Reports</strong>: Forms for reporting incidents</li>
                <li><strong>Leave Requests</strong>: Time-off and leave management forms</li>
                <li><strong>Asset Management</strong>: Forms for tracking assets</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Benefits of Form Types</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Better organisation of forms</li>
                <li>Easier form discovery and filtering</li>
                <li>Consistent categorisation across the organisation</li>
                <li>Simplified form management</li>
                <li>Reporting and analytics by form type</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Best Practices
            </CardTitle>
            <CardDescription>
              Tips for managing form types effectively
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Naming Conventions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Use clear, descriptive names</li>
                <li>Keep names concise but informative</li>
                <li>Avoid abbreviations unless widely understood</li>
                <li>Use consistent naming patterns across types</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Organization Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Create form types that align with your business processes</li>
                <li>Don't create too many types (aim for 5-15 main categories)</li>
                <li>Review and consolidate similar types periodically</li>
                <li>Use descriptions to clarify when a form type should be used</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>
              Required permissions for form type management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Form Type Permissions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><code className="bg-muted px-1 rounded">form_type:list</code> - View form types</li>
                <li><code className="bg-muted px-1 rounded">form_type:create</code> - Create new form types</li>
                <li><code className="bg-muted px-1 rounded">form_type:update</code> - Edit existing form types</li>
                <li><code className="bg-muted px-1 rounded">form_type:delete</code> - Delete form types</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


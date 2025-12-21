"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, Edit, Users, Settings } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";

export default function DepartmentsDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Departments</h1>
        <p className="text-lg text-muted-foreground">
          Organise your company into departments and manage organisational structure
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding department management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Departments?</h3>
              <p className="text-sm text-muted-foreground">
                Departments represent organisational units within your company, such as Operations, HR,
                Finance, IT, Administration, etc. Departments help organise people, tasks, resources,
                and reporting structures.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Departments</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Departments" in the sidebar under Organisation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/departments</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">departments:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Departments</CardTitle>
            </div>
            <CardDescription>How to create a new department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Department Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Department Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Add Department" or "New Department" button on the Departments page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Department Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll see the create department form:
                  </p>
                  <DialogMockup
                    title="Create New Department"
                    description="Add a new department to your organisation"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Department
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Department Name"
                        type="text"
                        placeholder="Operations"
                        icon={Building2}
                        required
                        value="Operations"
                      />
                      <FormField
                        label="Department Code"
                        type="text"
                        placeholder="OPS"
                        value="OPS"
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Department description..."
                        rows={3}
                        value="Responsible for operational activities and day-to-day management"
                      />
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">How to Create a Department</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to the Departments page</li>
                <li>Click "Add Department" or "New Department"</li>
                <li>Fill in department details including name, code, and description</li>
                <li>Click "Save" to create the department</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

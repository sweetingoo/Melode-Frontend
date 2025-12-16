"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Type, Plus, Edit, Settings } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";

export default function TaskTypesDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Task Types</h1>
        <p className="text-lg text-muted-foreground">
          Configure and manage different types of tasks
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Type className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding task types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Task Types?</h3>
              <p className="text-sm text-muted-foreground">
                Task types categorize different kinds of work in your organisation. They help organize tasks,
                apply specific workflows, and enable better reporting.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Task Types</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Task Types" in the sidebar under Settings</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/task-types</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">task_types:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Task Types</CardTitle>
            </div>
            <CardDescription>How to create a new task type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Task Type Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Task Type Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Create Task Type" or "New Task Type" button on the Task Types page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Task Type Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll see the create task type form:
                  </p>
                  <DialogMockup
                    title="Create New Task Type"
                    description="Create a new task type for your organisation"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Task Type
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Name (Unique Identifier)"
                        type="text"
                        placeholder="patient_care"
                        required
                        value="patient_care"
                      />
                      <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only. Used internally.</p>
                      <FormField
                        label="Display Name"
                        type="text"
                        placeholder="Patient Care"
                        required
                        value="Patient Care"
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Task type description..."
                        rows={3}
                        value="Tasks related to patient care and medical services"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value="#3B82F6" disabled className="w-12 h-10 rounded border" />
                            <span className="text-sm text-muted-foreground">#3B82F6</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Icon</label>
                          <div className="p-2 border rounded-md">
                            <Type className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">How to Create a Task Type</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to Task Types</li>
                <li>Click "Create Task Type" or "New Task Type"</li>
                <li>Fill in task type details including name, description, color, and icon</li>
                <li>Click "Save" to create the task type</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

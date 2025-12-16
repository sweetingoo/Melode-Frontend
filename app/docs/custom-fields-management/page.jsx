"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Edit, List, Trash2, Plus, Folder, Eye, Database, RefreshCw, Info, Check, MoreHorizontal, AlertCircle, Type } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect, FormCheckbox } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CustomFieldsManagementDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Custom Fields Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage and configure custom fields for your organisation
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding custom fields management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Custom Fields Management?</h3>
              <p className="text-sm text-muted-foreground">
                Custom Fields Management allows you to view, edit, and manage all custom fields in your system.
                You can update field properties, change field types, reorder fields, organize fields into sections,
                and delete fields that are no longer needed. This is where you have full control over your custom fields.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Custom Fields Management</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Manage Fields" in the sidebar under Custom Fields</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/custom-fields-admin</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">custom_fields:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-green-600" />
              <CardTitle>Custom Fields Management Interface</CardTitle>
            </div>
            <CardDescription>Understanding the management page layout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Management Page Layout</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The Custom Fields Management page is organized into sections and fields:
              </p>
              <FormMockup
                title="Custom Fields Management"
                description="Manage all custom fields organized by entity type and sections"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Custom Fields Management</h3>
                    <div className="flex items-center gap-2">
                      <FormSelect
                        placeholder="Select entity type"
                        value="user"
                        options={[
                          { value: "user", label: "User" },
                          { value: "task", label: "Task" },
                          { value: "form", label: "Form" },
                          { value: "asset", label: "Asset" },
                        ]}
                        className="w-40"
                      />
                      <FormButton icon={Plus} size="sm">
                        Create Section
                      </FormButton>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Folder className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold">Personal Details</h4>
                          <Badge variant="secondary" className="text-xs">3 fields</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 hover:bg-muted rounded" disabled>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 hover:bg-muted rounded" disabled>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 pl-7">
                        <div className="p-2 bg-muted/50 rounded flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Type className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Full Name</span>
                            <Badge variant="outline" className="text-xs">Text</Badge>
                            <Badge className="bg-red-500 text-xs">Required</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-3 w-3" />
                            </button>
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Edit className="h-3 w-3" />
                            </button>
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="p-2 bg-muted/50 rounded flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Type className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Date of Birth</span>
                            <Badge variant="outline" className="text-xs">Date</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-3 w-3" />
                            </button>
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Edit className="h-3 w-3" />
                            </button>
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Folder className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold">Contact Details</h4>
                          <Badge variant="secondary" className="text-xs">2 fields</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 hover:bg-muted rounded" disabled>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 hover:bg-muted rounded" disabled>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 pl-7">
                        <div className="p-2 bg-muted/50 rounded flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Type className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Phone Number</span>
                            <Badge variant="outline" className="text-xs">Phone</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-3 w-3" />
                            </button>
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Edit className="h-3 w-3" />
                            </button>
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Entity Types</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Custom fields can be created for different entity types:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>User:</strong> Custom fields for user profiles</li>
                <li><strong>Task:</strong> Custom fields for tasks</li>
                <li><strong>Form:</strong> Custom fields for forms</li>
                <li><strong>Asset:</strong> Custom fields for assets</li>
                <li><strong>Other:</strong> Additional entity types as configured</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Folder className="h-6 w-6 text-purple-600" />
              <CardTitle>Creating Sections</CardTitle>
            </div>
            <CardDescription>How to create custom field sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Create Section</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Select Entity Type</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose the entity type (User, Task, Form, Asset) from the dropdown at the top.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click Create Section</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Create Section" button to open the section creation dialog.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Fill in Section Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter section information:
                  </p>
                  <DialogMockup
                    title="Create Custom Field Section"
                    description="Create a new section to organize custom fields"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Section
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Section Name"
                        type="text"
                        placeholder="Personal Details"
                        required
                        value="Personal Details"
                      />
                      <FormTextarea
                        label="Section Description"
                        placeholder="Describe what this section contains..."
                        rows={3}
                        value="Personal information and identification details"
                      />
                      <FormSelect
                        label="Entity Type"
                        value="user"
                        options={[
                          { value: "user", label: "User" },
                          { value: "task", label: "Task" },
                          { value: "form", label: "Form" },
                          { value: "asset", label: "Asset" },
                        ]}
                      />
                      <FormField
                        label="Sort Order"
                        type="number"
                        placeholder="0"
                        value="0"
                      />
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
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Custom Fields</CardTitle>
            </div>
            <CardDescription>How to create individual custom fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Create Custom Field</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Select Section</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose the section where you want to add the field, or create a new section first.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click Create Field</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Create Field" within the section or use the main create button.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Fill in Field Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The create field form includes comprehensive options:
                  </p>
                  <DialogMockup
                    title="Create Custom Field"
                    description="Add a new custom field to your section"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Field
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Field Name (Internal)"
                        type="text"
                        placeholder="full_name"
                        required
                        value="full_name"
                      />
                      <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only</p>

                      <FormField
                        label="Field Label (Display)"
                        type="text"
                        placeholder="Full Name"
                        required
                        value="Full Name"
                      />

                      <FormTextarea
                        label="Field Description"
                        placeholder="What is this field for?"
                        rows={2}
                        value="Enter the person's full legal name"
                      />

                      <FormSelect
                        label="Field Type"
                        placeholder="Select field type"
                        required
                        value="text"
                        options={[
                          { value: "text", label: "Text" },
                          { value: "number", label: "Number" },
                          { value: "email", label: "Email" },
                          { value: "phone", label: "Phone" },
                          { value: "date", label: "Date" },
                          { value: "datetime", label: "DateTime" },
                          { value: "boolean", label: "Boolean (Checkbox)" },
                          { value: "select", label: "Select Dropdown" },
                          { value: "radio", label: "Radio Group" },
                          { value: "multiselect", label: "Multi Select" },
                          { value: "textarea", label: "Textarea" },
                          { value: "file", label: "File Upload" },
                          { value: "json", label: "JSON" },
                        ]}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormCheckbox label="Required Field" checked={true} />
                        <FormCheckbox label="Unique Value" checked={false} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="Min Length"
                          type="number"
                          placeholder="0"
                          value=""
                        />
                        <FormField
                          label="Max Length"
                          type="number"
                          placeholder="255"
                          value="255"
                        />
                      </div>

                      <FormField
                        label="Sort Order"
                        type="number"
                        placeholder="0"
                        value="0"
                      />
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Field Types Available</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Text</h4>
                  <p className="text-xs text-muted-foreground">Single-line text input</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Number</h4>
                  <p className="text-xs text-muted-foreground">Numeric input</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Email</h4>
                  <p className="text-xs text-muted-foreground">Email address with validation</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Phone</h4>
                  <p className="text-xs text-muted-foreground">Phone number input</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Date</h4>
                  <p className="text-xs text-muted-foreground">Date picker</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Select</h4>
                  <p className="text-xs text-muted-foreground">Dropdown with options</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">File Upload</h4>
                  <p className="text-xs text-muted-foreground">File attachment field</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">Textarea</h4>
                  <p className="text-xs text-muted-foreground">Multi-line text input</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-orange-600" />
              <CardTitle>Editing Fields & Sections</CardTitle>
            </div>
            <CardDescription>How to modify existing custom fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Edit Field</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Find the Field</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Navigate to the section containing the field you want to edit.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click Edit</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the edit icon next to the field name.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Update Field Properties</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The edit form is pre-filled with current values. Update any properties:
                  </p>
                  <DialogMockup
                    title="Edit Custom Field"
                    description="Update field properties and settings"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Edit}>
                          Save Changes
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Field Name (Internal)"
                        type="text"
                        value="full_name"
                        required
                      />
                      <FormField
                        label="Field Label (Display)"
                        type="text"
                        value="Full Legal Name"
                        required
                      />
                      <FormSelect
                        label="Field Type"
                        value="text"
                        options={[
                          { value: "text", label: "Text" },
                          { value: "textarea", label: "Textarea" },
                        ]}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormCheckbox label="Required Field" checked={true} />
                        <FormCheckbox label="Unique Value" checked={false} />
                      </div>
                      <FormField
                        label="Max Length"
                        type="number"
                        value="100"
                      />
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Editing Sections</h3>
              <p className="text-sm text-muted-foreground mb-2">
                To edit a section:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click the edit icon next to the section name</li>
                <li>Update the section name or description</li>
                <li>Change the sort order to reorder sections</li>
                <li>Click "Save" to apply changes</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trash2 className="h-6 w-6 text-red-600" />
              <CardTitle>Deleting Fields & Sections</CardTitle>
            </div>
            <CardDescription>How to remove custom fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Delete Field</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Find the Field</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Navigate to the section and find the field you want to delete.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click Delete</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the delete icon (trash) next to the field.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Confirm Deletion</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    A confirmation dialog will appear:
                  </p>
                  <FormMockup
                    title="Delete Custom Field Confirmation"
                    description="Confirm field deletion"
                  >
                    <div className="space-y-4">
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <h4 className="font-semibold text-sm">Are you sure?</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          This action cannot be undone. This will permanently delete:
                        </p>
                        <p className="text-sm font-medium">Field: Full Name</p>
                        <p className="text-xs text-muted-foreground">Section: Personal Details</p>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-1">Warning:</p>
                        <p className="text-xs text-muted-foreground">
                          Deleting this field will remove all data stored in this field for all records.
                          This cannot be recovered.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <FormButton variant="outline" className="flex-1">
                          Cancel
                        </FormButton>
                        <FormButton variant="destructive" className="flex-1" icon={Trash2}>
                          Delete Field
                        </FormButton>
                      </div>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Deleting Sections</h3>
              <p className="text-sm text-muted-foreground mb-2">
                To delete a section:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click the delete icon next to the section name</li>
                <li>Confirm deletion in the dialog</li>
                <li><strong>Warning:</strong> Deleting a section will delete all fields within it</li>
                <li>All data stored in those fields will be permanently lost</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-indigo-600" />
              <CardTitle>Previewing Custom Fields</CardTitle>
            </div>
            <CardDescription>How to preview how fields will appear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Field Preview</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use the preview feature to see how your custom fields will appear to users:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click the eye icon next to any field to preview it</li>
                <li>Preview shows the field as it will appear in forms</li>
                <li>You can test different field types and configurations</li>
                <li>Preview helps ensure fields are configured correctly before use</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <List className="h-6 w-6 text-blue-600" />
              <CardTitle>Reordering Fields</CardTitle>
            </div>
            <CardDescription>How to change the order of fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Changing Field Order</h3>
              <p className="text-sm text-muted-foreground mb-2">
                To reorder fields within a section:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Edit each field you want to reorder</li>
                <li>Change the "Sort Order" value (lower numbers appear first)</li>
                <li>Save the changes</li>
                <li>Fields will be displayed in order based on sort order values</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Reordering Sections</h3>
              <p className="text-sm text-muted-foreground">
                Similarly, edit sections and change their sort order to control the order in which
                sections appear on entity pages.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-purple-600" />
              <CardTitle>Field Configuration Options</CardTitle>
            </div>
            <CardDescription>Advanced field configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Field Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For select, radio, and multiselect fields, you can configure options:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Define the list of selectable options</li>
                <li>Set default values</li>
                <li>Configure whether multiple selections are allowed</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Validation Rules</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Configure validation for fields:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Required vs optional fields</li>
                <li>Min/max length for text fields</li>
                <li>Min/max values for number fields</li>
                <li>Pattern matching (regex) for text fields</li>
                <li>Custom validation rules</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">File Upload Fields</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For file upload fields, you can configure:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Allowed file types (images, documents, etc.)</li>
                <li>Maximum file size</li>
                <li>Whether multiple files are allowed</li>
                <li>File type restrictions (e.g., PDF only, images only)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tag, Plus, Edit, Trash2, Settings, Palette, List } from "lucide-react";

export default function CategoryTypesDocumentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Category Types</h1>
        <p className="text-muted-foreground text-lg">
          Configure and manage different types of categories for organising content
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <CardTitle>Overview</CardTitle>
          </div>
          <CardDescription>
            Category Types allow you to create custom category systems for organising various content types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Category Types are custom category systems that help you organise and classify different types
            of content within your organisation. They provide a structured way to create taxonomies for
            various entities, making it easier to categorise, search, and manage content.
          </p>
          <p>
            Each category type can have a name, display name, description, icon, colour, and sort order,
            allowing you to create customised classification systems that match your organisation's needs.
            Category types are used in forms and other features where categorisation is needed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Custom Taxonomies:</strong> Create category types that match your organisation's
              classification needs (e.g., Document Categories, Form Categories, Task Categories)
            </li>
            <li>
              <strong>Visual Identification:</strong> Assign icons and colours to category types for easy
              visual identification
            </li>
            <li>
              <strong>Sort Order:</strong> Control the display order of category types in lists and dropdowns
            </li>
            <li>
              <strong>Descriptions:</strong> Add detailed descriptions to help users understand each category
              type's purpose
            </li>
            <li>
              <strong>Permission-Based Access:</strong> Control who can create, update, or delete category
              types based on permissions
            </li>
            <li>
              <strong>Form Integration:</strong> Category types can be used in forms to provide structured
              category selection fields
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessing Category Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            To access the Category Types management page:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the Admin panel</li>
            <li>Go to <strong>Organisation Management</strong> section</li>
            <li>Click on <strong>Category Types</strong></li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> You need the <code className="bg-muted px-1 py-0.5 rounded">category_type:list</code> permission
            to view category types.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creating a Category Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To create a new category type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click the <Badge variant="outline" className="gap-1"><Plus className="h-3 w-3" /> Create Category Type</Badge> button</li>
            <li>Fill in the following fields:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>Name:</strong> Internal identifier (lowercase, no spaces, e.g., "document_category")</li>
                <li><strong>Display Name:</strong> User-friendly name shown in the UI (e.g., "Document Category")</li>
                <li><strong>Description:</strong> Optional description explaining the category type's purpose</li>
                <li><strong>Icon:</strong> Optional icon identifier for visual representation</li>
                <li><strong>Colour:</strong> Choose a colour for the category type (default: grey)</li>
                <li><strong>Sort Order:</strong> Numeric value to control display order (lower numbers appear first)</li>
              </ul>
            </li>
            <li>Click <strong>Create</strong> to save the category type</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">category_type:create</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editing a Category Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To edit an existing category type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Find the category type in the list</li>
            <li>Click the <Badge variant="outline" className="gap-1"><Edit className="h-3 w-3" /> Edit</Badge> button (three-dot menu)</li>
            <li>Modify the fields as needed</li>
            <li>Click <strong>Update</strong> to save changes</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">category_type:update</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deleting a Category Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To delete a category type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Find the category type in the list</li>
            <li>Click the <Badge variant="destructive" className="gap-1"><Trash2 className="h-3 w-3" /> Delete</Badge> button (three-dot menu)</li>
            <li>Confirm the deletion in the dialog</li>
          </ol>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Warning: Deleting a category type may affect forms and other content that use it. Make sure
              to update or remove affected content before deleting a category type.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">category_type:delete</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Using Category Types in Forms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Category types can be used in forms to provide structured category selection. When creating a form,
            you can add a category type field that allows users to select from predefined categories.
          </p>
          <p>
            To use a category type in a form:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Create or edit a form</li>
            <li>Add a new field and select the appropriate field type</li>
            <li>If the field type supports category types, select the category type to use</li>
            <li>Configure the field options as needed</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            See the <a href="/docs/forms" className="text-primary hover:underline">Forms Management</a> documentation
            for more information on creating forms with category types.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Use Clear Names:</strong> Choose descriptive names that clearly identify the category
              system (e.g., "document_category", "form_category", "task_category")
            </li>
            <li>
              <strong>Consistent Naming:</strong> Use a consistent naming convention (e.g., lowercase with
              underscores) for internal names
            </li>
            <li>
              <strong>Meaningful Display Names:</strong> Use user-friendly display names that are easy to
              understand (e.g., "Document Category", "Form Category", "Task Category")
            </li>
            <li>
              <strong>Colour Coding:</strong> Use distinct colours for different category types to make them
              easily distinguishable in lists and dropdowns
            </li>
            <li>
              <strong>Sort Order:</strong> Set sort orders to prioritise frequently used category types
              (lower numbers appear first)
            </li>
            <li>
              <strong>Descriptions:</strong> Add descriptions to help team members understand when to use
              each category type
            </li>
            <li>
              <strong>Plan Your Taxonomy:</strong> Think about how categories will be used before creating
              category types to ensure consistency across your organisation
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Related Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Forms Management:</strong> Category types are commonly used in forms for categorisation.
              See the <a href="/docs/forms" className="text-primary hover:underline">Forms Management</a> documentation
              for more information.
            </li>
            <li>
              <strong>Form Types:</strong> Similar to category types, form types help categorise forms.
              See the <a href="/docs/form-types" className="text-primary hover:underline">Form Types</a> documentation
              for more information.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Plus, Edit, Trash2, Settings, Palette, List } from "lucide-react";

export default function AssetTypesDocumentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Asset Types</h1>
        <p className="text-muted-foreground text-lg">
          Configure and manage different types of assets in your organisation
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle>Overview</CardTitle>
          </div>
          <CardDescription>
            Asset Types allow you to categorise and organise your organisational assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Asset Types are custom categories that help you classify and manage different types of assets
            within your organisation. They provide a structured way to organise assets, making it easier
            to track, search, and manage your asset inventory.
          </p>
          <p>
            Each asset type can have a name, display name, description, icon, colour, and sort order,
            allowing you to create a customised classification system that matches your organisation's needs.
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
              <strong>Custom Classification:</strong> Create asset types that match your organisation's
              asset categories (e.g., Equipment, Vehicles, IT Assets, Furniture)
            </li>
            <li>
              <strong>Visual Identification:</strong> Assign icons and colours to asset types for easy
              visual identification
            </li>
            <li>
              <strong>Sort Order:</strong> Control the display order of asset types in lists and dropdowns
            </li>
            <li>
              <strong>Descriptions:</strong> Add detailed descriptions to help users understand each asset
              type's purpose
            </li>
            <li>
              <strong>Permission-Based Access:</strong> Control who can create, update, or delete asset
              types based on permissions
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessing Asset Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            To access the Asset Types management page:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the Admin panel</li>
            <li>Go to <strong>Organisation Management</strong> section</li>
            <li>Click on <strong>Asset Types</strong></li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> You need the <code className="bg-muted px-1 py-0.5 rounded">asset_type:read</code> permission
            to view asset types.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creating an Asset Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To create a new asset type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click the <Badge variant="outline" className="gap-1"><Plus className="h-3 w-3" /> Create Asset Type</Badge> button</li>
            <li>Fill in the following fields:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>Name:</strong> Internal identifier (lowercase, no spaces, e.g., "it_equipment")</li>
                <li><strong>Display Name:</strong> User-friendly name shown in the UI (e.g., "IT Equipment")</li>
                <li><strong>Description:</strong> Optional description explaining the asset type's purpose</li>
                <li><strong>Icon:</strong> Optional icon identifier for visual representation</li>
                <li><strong>Colour:</strong> Choose a colour for the asset type (default: grey)</li>
                <li><strong>Sort Order:</strong> Numeric value to control display order (lower numbers appear first)</li>
              </ul>
            </li>
            <li>Click <strong>Create</strong> to save the asset type</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">asset_type:create</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editing an Asset Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To edit an existing asset type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Find the asset type in the list</li>
            <li>Click the <Badge variant="outline" className="gap-1"><Edit className="h-3 w-3" /> Edit</Badge> button (three-dot menu)</li>
            <li>Modify the fields as needed</li>
            <li>Click <strong>Update</strong> to save changes</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">asset_type:update</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deleting an Asset Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To delete an asset type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Find the asset type in the list</li>
            <li>Click the <Badge variant="destructive" className="gap-1"><Trash2 className="h-3 w-3" /> Delete</Badge> button (three-dot menu)</li>
            <li>Confirm the deletion in the dialog</li>
          </ol>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Warning: Deleting an asset type may affect assets that are assigned to it. Make sure
              to reassign or remove affected assets before deleting an asset type.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">asset_type:delete</code>
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
              <strong>Use Clear Names:</strong> Choose descriptive names that clearly identify the asset
              category (e.g., "vehicles", "office_furniture", "it_equipment")
            </li>
            <li>
              <strong>Consistent Naming:</strong> Use a consistent naming convention (e.g., lowercase with
              underscores) for internal names
            </li>
            <li>
              <strong>Meaningful Display Names:</strong> Use user-friendly display names that are easy to
              understand (e.g., "Vehicles", "Office Furniture", "IT Equipment")
            </li>
            <li>
              <strong>Colour Coding:</strong> Use distinct colours for different asset types to make them
              easily distinguishable in lists and visualisations
            </li>
            <li>
              <strong>Sort Order:</strong> Set sort orders to prioritise frequently used asset types
              (lower numbers appear first)
            </li>
            <li>
              <strong>Descriptions:</strong> Add descriptions to help team members understand when to use
              each asset type
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
              <strong>Assets Management:</strong> Asset types are used when creating and managing assets.
              See the <a href="/docs/assets" className="text-primary hover:underline">Assets</a> documentation
              for more information.
            </li>
            <li>
              <strong>Asset Types vs Assets:</strong> Asset types define the categories, while assets are
              the individual items within those categories.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

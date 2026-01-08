"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Plus, Edit, Trash2, Settings, Palette, List } from "lucide-react";

export default function LocationTypesDocumentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Location Types</h1>
        <p className="text-muted-foreground text-lg">
          Configure and manage different types of locations in your organisation
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Overview</CardTitle>
          </div>
          <CardDescription>
            Location Types allow you to categorise and organise your physical locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Location Types are custom categories that help you classify and manage different types of
            physical locations within your organisation. They provide a structured way to organise
            locations, making it easier to track, search, and manage your location inventory.
          </p>
          <p>
            Each location type can have a name, display name, description, icon, colour, and sort order,
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
              <strong>Custom Classification:</strong> Create location types that match your organisation's
              location categories (e.g., Office, Warehouse, Retail Store, Factory)
            </li>
            <li>
              <strong>Visual Identification:</strong> Assign icons and colours to location types for easy
              visual identification
            </li>
            <li>
              <strong>Sort Order:</strong> Control the display order of location types in lists and dropdowns
            </li>
            <li>
              <strong>Descriptions:</strong> Add detailed descriptions to help users understand each location
              type's purpose
            </li>
            <li>
              <strong>Permission-Based Access:</strong> Control who can create, update, or delete location
              types based on permissions
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessing Location Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            To access the Location Types management page:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the Admin panel</li>
            <li>Go to <strong>Organisation Management</strong> section</li>
            <li>Click on <strong>Location Types</strong></li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> You need the <code className="bg-muted px-1 py-0.5 rounded">location_type:read</code> permission
            to view location types.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creating a Location Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To create a new location type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click the <Badge variant="outline" className="gap-1"><Plus className="h-3 w-3" /> Create Location Type</Badge> button</li>
            <li>Fill in the following fields:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>Name:</strong> Internal identifier (lowercase, no spaces, e.g., "retail_store")</li>
                <li><strong>Display Name:</strong> User-friendly name shown in the UI (e.g., "Retail Store")</li>
                <li><strong>Description:</strong> Optional description explaining the location type's purpose</li>
                <li><strong>Icon:</strong> Optional icon identifier for visual representation</li>
                <li><strong>Colour:</strong> Choose a colour for the location type (default: grey)</li>
                <li><strong>Sort Order:</strong> Numeric value to control display order (lower numbers appear first)</li>
              </ul>
            </li>
            <li>Click <strong>Create</strong> to save the location type</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">location_type:create</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editing a Location Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To edit an existing location type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Find the location type in the list</li>
            <li>Click the <Badge variant="outline" className="gap-1"><Edit className="h-3 w-3" /> Edit</Badge> button (three-dot menu)</li>
            <li>Modify the fields as needed</li>
            <li>Click <strong>Update</strong> to save changes</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">location_type:update</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deleting a Location Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To delete a location type:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Find the location type in the list</li>
            <li>Click the <Badge variant="destructive" className="gap-1"><Trash2 className="h-3 w-3" /> Delete</Badge> button (three-dot menu)</li>
            <li>Confirm the deletion in the dialog</li>
          </ol>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Warning: Deleting a location type may affect locations that are assigned to it. Make sure
              to reassign or remove affected locations before deleting a location type.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Permission Required:</strong> <code className="bg-muted px-1 py-0.5 rounded">location_type:delete</code>
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
              <strong>Use Clear Names:</strong> Choose descriptive names that clearly identify the location
              category (e.g., "office", "warehouse", "retail_store", "factory")
            </li>
            <li>
              <strong>Consistent Naming:</strong> Use a consistent naming convention (e.g., lowercase with
              underscores) for internal names
            </li>
            <li>
              <strong>Meaningful Display Names:</strong> Use user-friendly display names that are easy to
              understand (e.g., "Office", "Warehouse", "Retail Store", "Factory")
            </li>
            <li>
              <strong>Colour Coding:</strong> Use distinct colours for different location types to make them
              easily distinguishable in lists and maps
            </li>
            <li>
              <strong>Sort Order:</strong> Set sort orders to prioritise frequently used location types
              (lower numbers appear first)
            </li>
            <li>
              <strong>Descriptions:</strong> Add descriptions to help team members understand when to use
              each location type
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
              <strong>Locations Management:</strong> Location types are used when creating and managing locations.
              See the <a href="/docs/locations" className="text-primary hover:underline">Locations</a> documentation
              for more information.
            </li>
            <li>
              <strong>Location Types vs Locations:</strong> Location types define the categories, while locations are
              the individual physical places within those categories.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

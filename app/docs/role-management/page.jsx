"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Plus, Edit, Users, Key } from "lucide-react";

export default function RoleManagementDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Role Management</h1>
        <p className="text-lg text-muted-foreground">
          Create and manage job roles, shift roles, and their hierarchical relationships
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>Role Hierarchy</CardTitle>
            </div>
            <CardDescription>Understand the structure of job roles and shift roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Roles in Melode are organised in a hierarchical structure with job roles containing shift roles.
            </p>
            <div>
              <h3 className="font-semibold mb-2">Role Types:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Job Roles:</strong> High-level roles that define a user's primary function (e.g., Receptionist, Manager)</li>
                <li><strong>Shift Roles:</strong> Specific roles within a job role that can change during a shift (e.g., General, Supervisor)</li>
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
            <CardDescription>Add new job roles and shift roles to your organisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating a Job Role:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click the "Create Role" button</li>
                <li>Enter the role name and description</li>
                <li>Set the priority level (higher numbers = higher priority)</li>
                <li>Optionally assign a parent role and department</li>
                <li>Configure permissions for the role</li>
                <li>Save the role</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Creating a Shift Role:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Navigate to the parent job role</li>
                <li>Click "Add Shift Role"</li>
                <li>Enter the shift role name</li>
                <li>Configure permissions if needed</li>
                <li>Save the shift role</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-orange-600" />
              <CardTitle>Managing Permissions</CardTitle>
            </div>
            <CardDescription>Assign and modify permissions for roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Each role can have specific permissions that control what users with that role can do in the system.
            </p>
            <div>
              <h3 className="font-semibold mb-2">Permission Management:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Click "Manage Permissions" on any role to view and edit its permissions</li>
                <li>Search and filter permissions by resource or action</li>
                <li>Select or deselect permissions as needed</li>
                <li>Changes are saved immediately</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              <CardTitle>Role Assignment</CardTitle>
            </div>
            <CardDescription>Assign roles to users and departments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Roles can be assigned to users individually or associated with departments for automatic assignment.
            </p>
            <div>
              <h3 className="font-semibold mb-2">Assignment Methods:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Direct Assignment:</strong> Assign roles directly to users in the user management section</li>
                <li><strong>Department Association:</strong> Link roles to departments for automatic assignment</li>
                <li><strong>Parent-Child Relationships:</strong> Child roles inherit certain properties from parent roles</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

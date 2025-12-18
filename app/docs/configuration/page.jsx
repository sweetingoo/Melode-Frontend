"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield } from "lucide-react";

export default function ConfigurationDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Configuration</h1>
        <p className="text-lg text-muted-foreground">
          Manage system settings, organisation details, and default role permissions
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>Configure application-wide settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The Configuration page allows superusers to manage system settings, organisation information, and default role permissions.
            </p>
            <div>
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>View and edit system settings by category</li>
                <li>Manage organisation details and information</li>
                <li>Configure default permissions for new roles</li>
                <li>Bulk update multiple settings at once</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-purple-600" />
              <CardTitle>Default Role Permissions</CardTitle>
            </div>
            <CardDescription>Set default permissions that are automatically assigned to new roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When creating a new role, if no permissions are specified, the default permissions configured here will be automatically assigned.
            </p>
            <div>
              <h3 className="font-semibold mb-2">How it works:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Default permissions are only used when creating roles without explicit permissions</li>
                <li>If permissions are explicitly provided during role creation, defaults are not used</li>
                <li>If no default permissions are configured, new roles will be created with no permissions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

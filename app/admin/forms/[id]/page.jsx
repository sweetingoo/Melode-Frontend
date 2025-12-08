"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Edit, FileText, CheckCircle, XCircle } from "lucide-react";
import { useForm } from "@/hooks/useForms";
import { useRoles } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { format } from "date-fns";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";
import { Shield, Users, User } from "lucide-react";

const FormDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params.id;

  const { data: form, isLoading, error } = useForm(formId);
  const { data: rolesData } = useRoles();
  const { data: usersResponse } = useUsers();
  const roles = rolesData || [];
  const users = usersResponse?.users || usersResponse || [];

  const getFormTypeColor = (type) => {
    switch (type) {
      case "handover":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "assessment":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "incident":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "maintenance":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "general":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="space-y-4">
        <Link href="/admin/forms">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Form Not Found</h3>
            <p className="text-muted-foreground">
              The form you're looking for doesn't exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{form.form_title || form.form_name}</h1>
            <p className="text-muted-foreground">Form Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/forms/${formId}/submit`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Submit Form
            </Button>
          </Link>
          <Link href={`/admin/forms/${formId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Form Information */}
          <Card>
            <CardHeader>
              <CardTitle>Form Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{form.form_description || "No description provided"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form Type</label>
                  <div className="mt-1">
                    <Badge className={getFormTypeColor(form.form_type)}>
                      {form.form_type || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {form.is_active ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Template</label>
                  <div className="mt-1">
                    {form.is_template ? (
                      <Badge variant="outline">Yes</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form Name</label>
                  <p className="mt-1 text-sm font-mono">{form.form_name}</p>
                </div>
              </div>
              
              {/* Assignment Information */}
              {(form.assigned_to_role_id || (form.assigned_user_ids && form.assigned_user_ids.length > 0)) && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Assignment</label>
                  {form.assigned_to_role_id ? (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Assigned to role: {roles.find(r => r.id === form.assigned_to_role_id)?.display_name || roles.find(r => r.id === form.assigned_to_role_id)?.name || `Role #${form.assigned_to_role_id}`}
                      </span>
                    </div>
                  ) : form.assigned_user_ids && form.assigned_user_ids.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Assigned to {form.assigned_user_ids.length} user{form.assigned_user_ids.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {form.create_individual_assignments ? (
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                          Individual Assignments
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                          Collaborative Assignment
                        </Badge>
                      )}
                      <div className="mt-2 space-y-1">
                        {form.assigned_user_ids.slice(0, 5).map((userId) => {
                          const user = users.find(u => u.id === userId);
                          return (
                            <div key={userId} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {user?.display_name || 
                               (user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "") || 
                               user?.email || 
                               `User #${userId}`}
                            </div>
                          );
                        })}
                        {form.assigned_user_ids.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            +{form.assigned_user_ids.length - 5} more user{form.assigned_user_ids.length - 5 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Fields */}
          {form.form_fields && (
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
              </CardHeader>
              <CardContent>
                {form.form_fields.fields && form.form_fields.fields.length > 0 ? (
                  <div className="space-y-4">
                    {form.form_fields.fields.map((field, index) => (
                      <div key={field.field_id || index} className="p-4 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.label || field.field_name}</span>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <Badge variant="outline">{field.field_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Field ID: {field.field_id || field.field_name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No fields defined</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Configuration */}
          {form.form_config && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(form.form_config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/forms/${formId}/submit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Form
                </Button>
              </Link>
              <Link href={`/admin/forms/${formId}/submissions`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Submissions
                </Button>
              </Link>
              <Link href={`/admin/forms/${formId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Form
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <label className="text-muted-foreground">Created</label>
                <p>
                  {form.created_at
                    ? format(new Date(form.created_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-muted-foreground">Last Updated</label>
                <p>
                  {form.updated_at
                    ? format(new Date(form.updated_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity History */}
      <ResourceAuditLogs
        resource="form"
        resourceId={formId}
        title="Activity History"
      />
    </div>
  );
};

export default FormDetailPage;


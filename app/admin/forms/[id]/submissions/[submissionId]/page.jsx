"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { useFormSubmission, useForm } from "@/hooks/useForms";
import { useUsers } from "@/hooks/useUsers";
import { format } from "date-fns";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";

const FormSubmissionDetailPage = () => {
  const params = useParams();
  const submissionId = params.submissionId;
  const formId = params.id;

  const { data: submission, isLoading: submissionLoading } =
    useFormSubmission(submissionId);
  const { data: form, isLoading: formLoading } = useForm(formId, {
    enabled: !!formId,
  });
  const { data: usersResponse } = useUsers();

  const users = usersResponse?.users || usersResponse || [];

  const getUserName = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    if (!user) return null;
    return (
      user.display_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email ||
      `User #${userId}`
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "reviewed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "approved":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "draft":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (submissionLoading || formLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-4">
        <Link href={`/admin/forms/${formId}/submissions`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Submission Not Found</h3>
            <p className="text-muted-foreground">
              The submission you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields = form?.form_fields?.fields || [];
  const submissionData = submission.submission_data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/forms/${formId}/submissions`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Submission #{submission.id}
            </h1>
            <p className="text-muted-foreground">
              {form?.form_title || form?.form_name || "Form Submission"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(submission.status)}>
            {submission.status || "N/A"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Submission Data */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length > 0 ? (
                <div className="space-y-4">
                  {fields.map((field) => {
                    const fieldId = field.field_id || field.field_name;
                    const value = submissionData[fieldId];

                    return (
                      <div key={fieldId} className="p-4 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-medium">
                            {field.label || fieldId}
                          </label>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          {value !== undefined && value !== null && value !== "" ? (
                            <p className="whitespace-pre-wrap">
                              {typeof value === "object"
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(submissionData).map(([key, value]) => (
                    <div key={key} className="p-4 border rounded-md">
                      <label className="font-medium text-sm text-muted-foreground">
                        {key}
                      </label>
                      <p className="mt-1">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Result */}
          {submission.processing_result && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Result</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.processing_result.task_creation?.created && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900 dark:text-green-100">
                        {submission.processing_result.task_creation.individual_tasks
                          ? "Individual Tasks Created"
                          : "Task Created"}
                      </span>
                    </div>
                    {submission.processing_result.task_creation.individual_tasks ? (
                      <div className="space-y-2">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {submission.processing_result.task_creation.tasks_created || 0} individual
                          tasks created for users in the role.
                        </p>
                        {submission.processing_result.task_creation.task_ids &&
                          submission.processing_result.task_creation.task_ids.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                                Created Task IDs:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {submission.processing_result.task_creation.task_ids
                                  .slice(0, 10)
                                  .map((taskId) => (
                                    <Link
                                      key={taskId}
                                      href={`/admin/tasks/${taskId}`}
                                    >
                                      <Button variant="outline" size="sm">
                                        Task #{taskId}
                                      </Button>
                                    </Link>
                                  ))}
                                {submission.processing_result.task_creation.task_ids.length > 10 && (
                                  <span className="text-xs text-green-700 dark:text-green-300 self-center">
                                    +{submission.processing_result.task_creation.task_ids.length - 10} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      submission.processing_result.task_creation.task_id && (
                        <div className="mt-2">
                          <Link
                            href={`/admin/tasks/${submission.processing_result.task_creation.task_id}`}
                          >
                            <Button variant="outline" size="sm">
                              View Task #
                              {submission.processing_result.task_creation.task_id}
                            </Button>
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {submission.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{submission.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <label className="text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(submission.status)}>
                    {submission.status || "N/A"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-muted-foreground">Submitted By</label>
                <div className="mt-1">
                  {submission.submitted_by_user_id ? (
                    <Link
                      href={`/admin/employee-management/${submission.submitted_by_user_id}`}
                      className="text-primary hover:underline"
                    >
                      {getUserName(submission.submitted_by_user_id) || `User #${submission.submitted_by_user_id}`}
                    </Link>
                  ) : (
                    <p className="text-muted-foreground">Anonymous</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-muted-foreground">Created</label>
                <p>
                  {submission.created_at
                    ? format(new Date(submission.created_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-muted-foreground">Last Updated</label>
                <p>
                  {submission.updated_at
                    ? format(new Date(submission.updated_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              {submission.reviewed_at && (
                <div>
                  <label className="text-muted-foreground">Reviewed At</label>
                  <p>
                    {format(
                      new Date(submission.reviewed_at),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </p>
                </div>
              )}
              {submission.reviewed_by_user_id && (
                <div>
                  <label className="text-muted-foreground">Reviewed By</label>
                  <div className="mt-1">
                    <Link
                      href={`/admin/employee-management/${submission.reviewed_by_user_id}`}
                      className="text-primary hover:underline"
                    >
                      {getUserName(submission.reviewed_by_user_id) || `User #${submission.reviewed_by_user_id}`}
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/forms/${formId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Form
                </Button>
              </Link>
              <Link href={`/admin/forms/${formId}/submissions`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  All Submissions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity History */}
      <ResourceAuditLogs
        resource="form_submission"
        resourceId={submissionId}
        title="Activity History"
      />
    </div>
  );
};

export default FormSubmissionDetailPage;


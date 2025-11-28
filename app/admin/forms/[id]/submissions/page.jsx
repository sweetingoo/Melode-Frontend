"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, Eye, FileText } from "lucide-react";
import { useForm, useFormSubmissions } from "@/hooks/useForms";
import { useUsers } from "@/hooks/useUsers";
import { format } from "date-fns";

const FormSubmissionsPage = () => {
  const params = useParams();
  const formId = params.id;

  const { data: form, isLoading: formLoading } = useForm(formId);
  const { data: submissionsResponse, isLoading: submissionsLoading } =
    useFormSubmissions({
      form_id: formId,
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

  // Handle different API response structures
  let submissions = [];
  if (submissionsResponse) {
    if (Array.isArray(submissionsResponse)) {
      submissions = submissionsResponse;
    } else if (
      submissionsResponse.submissions &&
      Array.isArray(submissionsResponse.submissions)
    ) {
      submissions = submissionsResponse.submissions;
    } else if (
      submissionsResponse.data &&
      Array.isArray(submissionsResponse.data)
    ) {
      submissions = submissionsResponse.data;
    } else if (
      submissionsResponse.results &&
      Array.isArray(submissionsResponse.results)
    ) {
      submissions = submissionsResponse.results;
    }
  }

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

  if (formLoading || submissionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/forms/${formId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {form?.form_title || form?.form_name || "Form"} Submissions
            </h1>
            <p className="text-muted-foreground">
              View all submissions for this form
            </p>
          </div>
        </div>
        <Link href={`/admin/forms/${formId}/submit`}>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            New Submission
          </Button>
        </Link>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
              <p className="text-muted-foreground mb-4">
                No one has submitted this form yet.
              </p>
              <Link href={`/admin/forms/${formId}/submit`}>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Create First Submission
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        #{submission.id}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.submitted_by_user_id ? (
                          <Link
                            href={`/admin/employee-management/${submission.submitted_by_user_id}`}
                            className="text-primary hover:underline"
                          >
                            {getUserName(submission.submitted_by_user_id) || `User #${submission.submitted_by_user_id}`}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.created_at
                          ? format(
                              new Date(submission.created_at),
                              "MMM dd, yyyy HH:mm"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/forms/${formId}/submissions/${submission.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormSubmissionsPage;


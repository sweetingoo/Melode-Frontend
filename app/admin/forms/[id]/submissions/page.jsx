"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Eye, FileText, Shield, Users, User, Link2, Tag, X } from "lucide-react";
import { useForm, useFormSubmissions } from "@/hooks/useForms";
import { useUsers } from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useAuth";
import { format } from "date-fns";

const FormSubmissionsPage = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params.id;
  const [filterType, setFilterType] = useState("all"); // "all" or "my"
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all", "uncategorized", or specific category
  const [statusFilter, setStatusFilter] = useState("all"); // "all" or specific status

  const { data: form, isLoading: formLoading } = useForm(formId);
  
  // Build query params
  const queryParams = {
    form_id: formId,
    ...(filterType === "my" ? { filter: "my" } : {}),
  };
  
  // Add category filter - backend should handle null for uncategorized
  if (categoryFilter !== "all") {
    if (categoryFilter === "uncategorized") {
      // For uncategorized, we'll filter client-side or backend should handle null
      queryParams.category = null;
    } else {
      queryParams.category = categoryFilter;
    }
  }
  
  // Add status filter
  if (statusFilter !== "all") {
    queryParams.status = statusFilter;
  }
  
  const { data: submissionsResponse, isLoading: submissionsLoading } =
    useFormSubmissions(queryParams);
  const { data: usersResponse } = useUsers();
  const { data: currentUser } = useCurrentUser();

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

  // Check user permissions
  const isFormOwner = useMemo(() => {
    if (!currentUser || !form) return false;
    return form.assigned_user_ids?.includes(currentUser.id) || false;
  }, [currentUser, form]);

  const hasViewPermissions = useMemo(() => {
    if (!currentUser || !form) return false;
    if (isFormOwner) return true; // Form owners can always view
    
    const accessConfig = form.access_config || {};
    const viewRoles = accessConfig.view_submissions_roles || [];
    const viewUsers = accessConfig.view_submissions_users || [];
    
    // Check if user has view role
    if (currentUser.role_name && viewRoles.includes(currentUser.role_name)) {
      return true;
    }
    if (currentUser.role_slug && viewRoles.includes(currentUser.role_slug)) {
      return true;
    }
    
    // Check if user is in view users list
    if (viewUsers.includes(currentUser.id)) {
      return true;
    }
    
    return false;
  }, [currentUser, form, isFormOwner]);

  const canViewAllSubmissions = isFormOwner || hasViewPermissions;

  // Get form categories
  const formCategories = form?.form_config?.categories || [];
  
  // Get available statuses (custom or defaults)
  const DEFAULT_STATUSES = ["draft", "submitted", "reviewed", "approved", "rejected"];
  const formStatuses = form?.form_config?.statuses && form.form_config.statuses.length > 0
    ? form.form_config.statuses
    : DEFAULT_STATUSES;
  
  // Filter submissions client-side if needed (backend should handle most filtering)
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    
    if (filterType === "my" && currentUser) {
      filtered = filtered.filter(
        (s) => s.submitted_by_user_id === currentUser.id
      );
    }
    
    // Additional client-side filtering for category and status if needed
    if (categoryFilter !== "all") {
      if (categoryFilter === "uncategorized") {
        filtered = filtered.filter((s) => !s.category);
      } else {
        filtered = filtered.filter((s) => s.category === categoryFilter);
      }
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }
    
    return filtered;
  }, [submissions, filterType, currentUser, categoryFilter, statusFilter]);

  // Count submissions
  const mySubmissionsCount = useMemo(() => {
    if (!currentUser) return 0;
    return submissions.filter((s) => s.submitted_by_user_id === currentUser.id).length;
  }, [submissions, currentUser]);

  // Smart status color mapping - handles both default and custom statuses
  const getStatusColor = (status) => {
    if (!status) return "bg-muted text-muted-foreground";
    
    const statusLower = status.toLowerCase();
    
    // Default statuses
    if (statusLower === "submitted") {
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
    if (statusLower === "reviewed" || statusLower === "approved") {
      return "bg-green-500/10 text-green-600 border-green-500/20";
    }
    if (statusLower === "rejected" || statusLower === "closed") {
      return "bg-red-500/10 text-red-600 border-red-500/20";
    }
    if (statusLower === "draft") {
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
    
    // Custom statuses - smart color mapping based on keywords
    if (statusLower.includes("open") || statusLower.includes("new") || statusLower.includes("pending")) {
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
    if (statusLower.includes("progress") || statusLower.includes("working") || statusLower.includes("active")) {
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
    if (statusLower.includes("resolved") || statusLower.includes("completed") || statusLower.includes("done") || statusLower.includes("fixed")) {
      return "bg-green-500/10 text-green-600 border-green-500/20";
    }
    if (statusLower.includes("closed") || statusLower.includes("cancelled") || statusLower.includes("rejected")) {
      return "bg-red-500/10 text-red-600 border-red-500/20";
    }
    if (statusLower.includes("waiting") || statusLower.includes("hold") || statusLower.includes("blocked")) {
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    }
    
    // Default for unknown statuses
    return "bg-muted text-muted-foreground";
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
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {form?.form_title || form?.form_name || "Form"} Submissions
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {canViewAllSubmissions ? (
                <p className="text-muted-foreground">
                  {submissions.length} total submission{submissions.length !== 1 ? "s" : ""}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {mySubmissionsCount} of my submission{mySubmissionsCount !== 1 ? "s" : ""}
                </p>
              )}
              {/* Permission Badges */}
              <div className="flex items-center gap-2">
                {isFormOwner && (
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Form Owner
                  </Badge>
                )}
                {hasViewPermissions && !isFormOwner && (
                  <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                    <Eye className="h-3 w-3 mr-1" />
                    Can View All Submissions
                  </Badge>
                )}
                {!canViewAllSubmissions && (
                  <Badge variant="secondary">
                    <User className="h-3 w-3 mr-1" />
                    View My Submissions Only
                  </Badge>
                )}
              </div>
            </div>
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
          <div className="flex items-center justify-between">
            <CardTitle>
              Submissions ({filteredSubmissions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {canViewAllSubmissions && (
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Submissions</SelectItem>
                    <SelectItem value="my">My Submissions Only</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {formCategories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {formCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {formStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(categoryFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
          {/* Active Filters */}
          {(categoryFilter !== "all" || statusFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-2">
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Category: {categoryFilter === "uncategorized" ? "Uncategorized" : categoryFilter}
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
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
                    {formCategories.length > 0 && <TableHead>Category</TableHead>}
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Task Link</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => {
                    // Check if submission is linked to a task
                    const taskId = submission.processing_result?.task_creation?.task_id ||
                                  submission.processing_result?.task_creation?.task_ids?.[0] ||
                                  submission.task_id ||
                                  null;
                    
                    return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        #{submission.id}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status || "N/A"}
                        </Badge>
                      </TableCell>
                      {formCategories.length > 0 && (
                        <TableCell>
                          {submission.category ? (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Tag className="h-3 w-3" />
                              {submission.category}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Uncategorized
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {submission.submitted_by_user_id ? (
                          <Link
                            href={`/admin/people-management/${submission.submitted_by_user_id}`}
                            className="text-primary hover:underline"
                          >
                            {getUserName(submission.submitted_by_user_id) || `User #${submission.submitted_by_user_id}`}
                          </Link>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Anonymous
                          </Badge>
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
                        {taskId ? (
                          <Link href={`/admin/tasks/${taskId}`}>
                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                              <Link2 className="h-3 w-3 mr-1" />
                              Task #{taskId}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
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
                    );
                  })}
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


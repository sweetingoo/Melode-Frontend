"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, CheckCircle, Download, Check, X, Mail, Phone, Link as LinkIcon, Calendar, Clock, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { useFormSubmission, useForm } from "@/hooks/useForms";
import { useUsers } from "@/hooks/useUsers";
import { useDownloadFile } from "@/hooks/useProfile";
import { format, formatDistance, formatDistanceToNow, differenceInHours, differenceInDays, differenceInMinutes } from "date-fns";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";

const FormSubmissionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id;

  const { data: submission, isLoading: submissionLoading } =
    useFormSubmission(submissionId);
  const { data: form, isLoading: formLoading } = useForm(
    submission?.form_id,
    {
      enabled: !!submission?.form_id,
    }
  );
  const { data: usersResponse } = useUsers();
  const downloadFileMutation = useDownloadFile();

  const users = usersResponse?.users || usersResponse || [];

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper to get file icon emoji based on file name/type
  const getFileIcon = (fileName, contentType) => {
    if (!fileName && !contentType) return "📎";
    
    const extension = fileName?.split(".").pop()?.toLowerCase();
    const type = contentType?.toLowerCase();
    
    if (type?.includes("pdf") || extension === "pdf") return "📄";
    if (type?.includes("word") || extension === "doc" || extension === "docx") return "📝";
    if (type?.includes("excel") || type?.includes("spreadsheet") || extension === "xls" || extension === "xlsx") return "📊";
    if (type?.includes("image") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) return "🖼️";
    if (type?.includes("zip") || extension === "zip" || extension === "rar") return "📦";
    if (type?.includes("video") || ["mp4", "mov", "avi", "webm"].includes(extension)) return "🎥";
    if (type?.includes("audio") || ["mp3", "wav", "ogg"].includes(extension)) return "🎵";
    if (type?.includes("text") || extension === "txt") return "📃";
    
    return "📎";
  };

  // Helper to handle file preview/view
  const handleFileView = (file) => {
    if (file.file_url || file.download_url || file.url) {
      // Open in new tab for preview
      window.open(file.file_url || file.download_url || file.url, '_blank');
    } else if (file.file_id || file.id) {
      // If we only have file ID, try to construct preview URL or download
      const fileId = file.file_id || file.id;
      window.open(`/api/v1/settings/files/${fileId}/download`, '_blank');
    }
  };

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

  // Calculate duration/delay from due date
  const calculateSubmissionTiming = () => {
    if (!submission) return null;
    
    const submissionDate = submission.submitted_at 
      ? new Date(submission.submitted_at) 
      : submission.created_at 
        ? new Date(submission.created_at) 
        : null;
    
    const dueDate = submission.due_date ? new Date(submission.due_date) : null;
    
    if (!submissionDate || !dueDate) return null;
    
    const diffMinutes = differenceInMinutes(submissionDate, dueDate);
    const diffHours = differenceInHours(submissionDate, dueDate);
    const diffDays = differenceInDays(submissionDate, dueDate);
    
    const isLate = diffMinutes > 0;
    const isEarly = diffMinutes < 0;
    const isOnTime = diffMinutes === 0;
    
    let durationText = "";
    if (Math.abs(diffDays) >= 1) {
      durationText = `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (Math.abs(diffHours) >= 1) {
      durationText = `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''}`;
    } else {
      durationText = `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''}`;
    }
    
    return {
      isLate,
      isEarly,
      isOnTime,
      diffMinutes,
      diffHours,
      diffDays,
      durationText,
      submissionDate,
      dueDate,
    };
  };

  const timingInfo = calculateSubmissionTiming();

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
        <Link href="/admin/forms">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
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
  // Use formatted_data for display, fall back to submission_data if not available
  const displayData = submission.formatted_data || submission.submission_data || {};
  const submissionData = submission.submission_data || {}; // Keep raw data for editing

  // Helper function to format field value for display
  const formatFieldValue = (field, value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const fieldType = field.field_type?.toLowerCase();

    // Handle file fields specifically
    if (fieldType === 'file') {
      // Handle arrays (multiple files)
      if (Array.isArray(value)) {
        if (value.length === 0) return null;
        
        // Check if it's file objects
        if (value[0] && typeof value[0] === 'object' && (value[0].file_id || value[0].id)) {
          return value.map((file) => ({
            file_id: file.file_id || file.id,
            file_name: file.file_name || file.name || `File #${file.file_id || file.id}`,
            file_url: file.file_url || file.download_url || file.url,
            file_size_bytes: file.file_size_bytes || file.file_size,
            content_type: file.content_type || file.mime_type,
          }));
        }
        
        // Check if it's an array of file IDs (numbers)
        if (typeof value[0] === 'number') {
          return value.map((fileId) => ({
            file_id: fileId,
            file_name: `File #${fileId}`,
            file_url: null,
            file_size_bytes: null,
            content_type: null,
          }));
        }
      }

      // Handle single file object
      if (typeof value === 'object') {
        if (value.file_id || value.id) {
          return {
            file_id: value.file_id || value.id,
            file_name: value.file_name || value.name || `File #${value.file_id || value.id}`,
            file_url: value.file_url || value.download_url || value.url,
            file_size_bytes: value.file_size_bytes || value.file_size,
            content_type: value.content_type || value.mime_type,
          };
        }
      }

      // Handle single file ID (number)
      if (typeof value === 'number') {
        return {
          file_id: value,
          file_name: `File #${value}`,
          file_url: null,
          file_size_bytes: null,
          content_type: null,
        };
      }
    }

    // Handle arrays (multiselect, etc.)
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      return value;
    }

    // Handle boolean
    if (fieldType === 'boolean' && typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // For other types, return as-is (already formatted by backend)
    return value;
  };

  // Helper to handle file download
  const handleFileDownload = (file) => {
    if (file.file_url) {
      // If we have a direct URL, open it
      window.open(file.file_url, '_blank');
    } else if (file.file_id) {
      // Otherwise use the download hook
      downloadFileMutation.mutate(file.file_id);
    }
  };

  // Helper to render field value with better visual representation
  const renderFieldValue = (field, value) => {
    const formatted = formatFieldValue(field, value);
    const fieldType = field.field_type?.toLowerCase();
    const isFileField = fieldType === 'file';
    
    if (formatted === null) {
      return <p className="text-muted-foreground italic">No value provided</p>;
    }

    // Handle file objects (single file) - check for file_id or id property
    if (isFileField && typeof formatted === 'object' && (formatted.file_id || formatted.id)) {
      const fileName = formatted.file_name || formatted.name || `File #${formatted.file_id || formatted.id}`;
      const fileSize = formatted.file_size_bytes || formatted.file_size;
      const contentType = formatted.content_type || formatted.mime_type;
      const hasViewUrl = !!(formatted.file_url || formatted.download_url || formatted.url);
      
      return (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border">
          <div className="text-2xl flex-shrink-0">
            {getFileIcon(fileName, contentType)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={fileName}>{fileName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {fileSize && <span>{formatFileSize(fileSize)}</span>}
              {contentType && <span>• {contentType}</span>}
              {!fileSize && !contentType && <span>File ID: {formatted.file_id || formatted.id}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasViewUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFileView(formatted)}
                title="View/Preview file"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFileDownload(formatted)}
              disabled={downloadFileMutation.isPending}
              title="Download file"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      );
    }

    // Handle arrays (multiselect, multiple files)
    if (Array.isArray(formatted)) {
      if (formatted.length === 0) {
        return <p className="text-muted-foreground italic">No values selected</p>;
      }
      
      // Check if it's file objects (for file fields)
      const isFileArray = isFileField && formatted[0] && typeof formatted[0] === 'object' && (formatted[0].file_id || formatted[0].id);
      if (isFileArray) {
        return (
          <div className="space-y-2">
            {formatted.map((file, index) => {
              const fileName = file.file_name || file.name || `File #${file.file_id || file.id}`;
              const fileSize = file.file_size_bytes || file.file_size;
              const contentType = file.content_type || file.mime_type;
              const hasViewUrl = !!(file.file_url || file.download_url || file.url);
              
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border">
                  <div className="text-2xl flex-shrink-0">
                    {getFileIcon(fileName, contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={fileName}>{fileName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {fileSize && <span>{formatFileSize(fileSize)}</span>}
                      {contentType && <span>• {contentType}</span>}
                      {!fileSize && !contentType && <span>File ID: {file.file_id || file.id}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasViewUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileView(file)}
                        title="View/Preview file"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileDownload(file)}
                      disabled={downloadFileMutation.isPending}
                      title="Download file"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      
      // Array of labels (multiselect)
      return (
        <div className="flex flex-wrap gap-2">
          {formatted.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-sm py-1 px-2">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    // Handle boolean
    if (fieldType === 'boolean' || formatted === 'Yes' || formatted === 'No') {
      const isYes = formatted === true || formatted === 'Yes';
      return (
        <div className="flex items-center gap-2">
          {isYes ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-red-600" />
          )}
          <Badge variant={isYes ? "default" : "destructive"} className="text-sm">
            {isYes ? 'Yes' : 'No'}
          </Badge>
        </div>
      );
    }

    // Handle email
    if (fieldType === 'email' && typeof formatted === 'string' && formatted.includes('@')) {
      return (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <a
            href={`mailto:${formatted}`}
            className="text-primary hover:underline"
          >
            {formatted}
          </a>
        </div>
      );
    }

    // Handle phone
    if (fieldType === 'phone' && typeof formatted === 'string') {
      return (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <a
            href={`tel:${formatted}`}
            className="text-primary hover:underline"
          >
            {formatted}
          </a>
        </div>
      );
    }

    // Handle URL
    if (fieldType === 'url' && typeof formatted === 'string' && (formatted.startsWith('http://') || formatted.startsWith('https://'))) {
      return (
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <a
            href={formatted}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate"
          >
            {formatted}
          </a>
        </div>
      );
    }

    // Handle date
    if (fieldType === 'date' && typeof formatted === 'string') {
      try {
        const date = new Date(formatted);
        if (!isNaN(date.getTime())) {
          return (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(date, "MMMM dd, yyyy")}</span>
            </div>
          );
        }
      } catch (e) {
        // Fall through to default display
      }
    }

    // Handle datetime
    if (fieldType === 'datetime' && typeof formatted === 'string') {
      try {
        const date = new Date(formatted);
        if (!isNaN(date.getTime())) {
          return (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(date, "MMMM dd, yyyy 'at' HH:mm")}</span>
            </div>
          );
        }
      } catch (e) {
        // Fall through to default display
      }
    }

    // Handle number with formatting
    if (fieldType === 'number' || fieldType === 'decimal') {
      const numValue = typeof formatted === 'number' ? formatted : parseFloat(formatted);
      if (!isNaN(numValue)) {
        return (
          <div className="font-mono text-base">
            {numValue.toLocaleString()}
          </div>
        );
      }
    }

    // Handle textarea (multiline text)
    if (fieldType === 'textarea') {
      return (
        <div className="p-3 bg-muted/30 rounded-md border">
          <p className="whitespace-pre-wrap text-sm">{String(formatted)}</p>
        </div>
      );
    }

    // Handle file field with just a number (file ID) - fallback case
    if (isFileField && typeof formatted === 'number') {
      return (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border">
          <div className="text-2xl flex-shrink-0">📎</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">File #{formatted}</p>
            <p className="text-xs text-muted-foreground">File ID: {formatted}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/v1/settings/files/${formatted}/download`, '_blank')}
              title="View/Preview file"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFileMutation.mutate(formatted)}
              disabled={downloadFileMutation.isPending}
              title="Download file"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      );
    }

    // Regular text values
    return (
      <p className="text-base">{String(formatted)}</p>
    );
  };

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
                    const fieldType = field.field_type?.toLowerCase();
                    
                    // Display-only field types that don't have submission data
                    const displayOnlyTypes = ['text_block', 'image_block', 'line_break', 'page_break'];
                    const isDisplayOnly = displayOnlyTypes.includes(fieldType);
                    
                    // For display-only fields, render them directly without submission data
                    if (isDisplayOnly) {
                      const mappedField = {
                        ...field,
                        id: fieldId,
                        field_label: field.label,
                        field_description: field.help_text,
                        field_type: field.field_type,
                        // Preserve display-only field properties
                        content: field.content,
                        image_url: field.image_url,
                        alt_text: field.alt_text,
                      };
                      
                      return (
                        <div key={fieldId}>
                          <CustomFieldRenderer
                            field={mappedField}
                            value={undefined}
                            onChange={undefined}
                            error={undefined}
                          />
                        </div>
                      );
                    }
                    
                    const value = displayData[fieldId];

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
                          {renderFieldValue(field, value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(displayData).map(([key, value]) => {
                    // Try to find field by ID to get field type
                    const field = fields.find(
                      (f) => (f.field_id || f.field_name) === key
                    );
                    return (
                    <div key={key} className="p-4 border rounded-md">
                      <label className="font-medium text-sm text-muted-foreground">
                          {field?.label || key}
                      </label>
                        <div className="mt-1 text-sm">
                          {renderFieldValue(field || { field_type: 'text' }, value)}
                        </div>
                    </div>
                    );
                  })}
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
                      href={`/admin/people-management/${submission.submitted_by_user_id}`}
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
                      href={`/admin/people-management/${submission.reviewed_by_user_id}`}
                      className="text-primary hover:underline"
                    >
                      {getUserName(submission.reviewed_by_user_id) || `User #${submission.reviewed_by_user_id}`}
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Due Date and Timing Information */}
              {submission.due_date && (
                <>
                  <div>
                    <label className="text-muted-foreground">Due Date</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>
                        {format(new Date(submission.due_date), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  
                  {timingInfo && (
                    <div>
                      <label className="text-muted-foreground">Submission Timing</label>
                      <div className="mt-1">
                        {timingInfo.isOnTime ? (
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                              Submitted on time
                            </span>
                          </div>
                        ) : timingInfo.isEarly ? (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Submitted {timingInfo.durationText} early
                              </span>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                Due: {format(timingInfo.dueDate, "MMM dd, yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                Submitted {timingInfo.durationText} late
                              </span>
                              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                                Due: {format(timingInfo.dueDate, "MMM dd, yyyy HH:mm")} • 
                                Submitted: {format(timingInfo.submissionDate, "MMM dd, yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {submission.form_id && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/admin/forms/${submission.form_id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    View Form
                  </Button>
                </Link>
                <Link
                  href={`/admin/forms/${submission.form_id}/submissions`}
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    All Submissions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormSubmissionDetailPage;


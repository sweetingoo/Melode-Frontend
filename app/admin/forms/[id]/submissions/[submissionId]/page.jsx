"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, FileText, CheckCircle, Download, Check, X, Mail, Phone, Link as LinkIcon, Calendar, Clock, Eye, File, AlertCircle, CheckCircle2, XCircle, Link2, Tag, Edit, Save, FileDown, User, Printer } from "lucide-react";
import { useFormSubmission, useForm, useUpdateFormSubmission } from "@/hooks/useForms";
import { useUsers } from "@/hooks/useUsers";
import { useDownloadFile } from "@/hooks/useProfile";
import { format, formatDistance, formatDistanceToNow, differenceInHours, differenceInDays, differenceInMinutes } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { shouldShowTimeForDateField } from "@/utils/dateFieldUtils";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import CommentThread from "@/components/CommentThread";
import { generateFormSubmissionPDFFromData } from "@/utils/pdf-generator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FormSubmissionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const submissionSlug = params.submissionId || params.slug;
  const formSlug = params.id || params.slug;

  const { data: submission, isLoading: submissionLoading, error: submissionError } =
    useFormSubmission(submissionSlug);
  const { data: form, isLoading: formLoading } = useForm(formSlug, {
    enabled: !!formSlug,
  });
  const { data: usersResponse } = useUsers();
  const downloadFileMutation = useDownloadFile();
  const updateSubmissionMutation = useUpdateFormSubmission();

  const users = usersResponse?.users || usersResponse || [];
  const formCategories = form?.form_config?.categories || [];
  
  // Get available statuses (custom or defaults)
  const DEFAULT_STATUSES = ["draft", "submitted", "reviewed", "approved", "rejected"];
  const formStatuses = form?.form_config?.statuses && form.form_config.statuses.length > 0
    ? form.form_config.statuses
    : DEFAULT_STATUSES;
  
  // State for update dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    category: null,
    status: "",
    notes: "",
    review_notes: "",
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
    } else if (file.file_slug || file.slug) {
      // Use slug for path parameter (preferred)
      const fileSlug = file.file_slug || file.slug;
      window.open(`/api/v1/settings/files/${fileSlug}/download`, '_blank');
    } else if (file.file_id || file.id) {
      // Fallback to ID only if slug is not available (for backward compatibility)
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

  // Smart status color mapping - handles both default and custom statuses
  const getStatusColor = (status) => {
    if (!status) return "bg-muted text-muted-foreground";
    const statusLower = status.toLowerCase();
    // NHS-style: blue = submitted, green = approved/success, red = rejected/alert
    if (statusLower === "submitted") return "bg-[#005eb8]/10 text-[#005eb8] border border-[#005eb8]/30";
    if (statusLower === "reviewed" || statusLower === "approved") return "bg-[#007f3b]/10 text-[#007f3b] border border-[#007f3b]/30";
    if (statusLower === "rejected" || statusLower === "closed") return "bg-[#da291c]/10 text-[#da291c] border border-[#da291c]/30";
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

  if (submissionLoading || formLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if error is 404 or permission denied
  const isNotFoundOrNoPermission = 
    submissionError?.message === "SUBMISSION_NOT_FOUND_OR_NO_PERMISSION" ||
    submissionError?.response?.status === 404 ||
    (!submission && !submissionLoading && submissionError);

  if (isNotFoundOrNoPermission) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center mb-6">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view this submission.
              </p>
            </div>
            <div className="bg-muted/50 rounded-md p-4 space-y-2">
              <p className="text-sm font-medium">Possible reasons:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>You didn't submit this form</li>
                <li>You're not a form owner</li>
                <li>You don't have view permissions for this form</li>
                <li>You didn't create a task linked to this submission</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
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
  // Use raw submission_data for conditional visibility so keys/values match submit form behaviour
  // Use raw submission_data for visibility so conditions match submit-page behaviour (same keys/values).
  const dataForVisibility = submission.submission_data || {};

  // Visibility helpers (same logic as submit page) so we show/hide by submission data
  const normalizeCond = (v) => {
    if (v === true || v === "true" || v === "True" || v === "TRUE") return true;
    if (v === false || v === "false" || v === "False" || v === "FALSE") return false;
    if (v === "yes" || v === "Yes" || v === "YES") return true;
    if (v === "no" || v === "No" || v === "NO") return false;
    return v;
  };
  const isConditionMet = (cv, data) => {
    if (!cv?.depends_on_field) return true;
    const { depends_on_field, show_when, value: expectedValue } = cv;
    const dependentValue = data?.[depends_on_field];
    if (show_when === "equals") return normalizeCond(dependentValue) === normalizeCond(expectedValue);
    if (show_when === "not_equals") return normalizeCond(dependentValue) !== normalizeCond(expectedValue);
    if (show_when === "contains") return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : String(dependentValue || "").includes(String(expectedValue || ""));
    if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
    if (show_when === "is_not_empty") return dependentValue != null && dependentValue !== "" && dependentValue !== false;
    return true;
  };
  const checkFieldVisibility = (field, data) => {
    if (!field?.conditional_visibility?.depends_on_field) return true;
    const met = isConditionMet(field.conditional_visibility, data);
    const action = (field.conditional_visibility?.action || "hide").toLowerCase();
    if (action === "disable") return true;
    return met;
  };
  const isGroupConditionMet = (condition, data) => {
    if (!condition?.depends_on_field) return false;
    return isConditionMet(condition, data);
  };
  const checkGroupVisibility = (group, data) => {
    const cv = group?.conditional_visibility;
    if (!cv) return true;
    const conditions = Array.isArray(cv.conditions) ? cv.conditions : null;
    if (conditions?.length) return conditions.some((c) => isGroupConditionMet(c, data));
    if (!cv.depends_on_field) return true;
    return isGroupConditionMet(cv, data);
  };
  const checkRowVisibility = (row, data) => {
    if (!row?.conditional_visibility?.depends_on_field) return true;
    return isConditionMet(row.conditional_visibility, data);
  };
  const isFieldInHiddenGroup = (fieldId, data) => {
    const formGroups = form?.form_fields?.groups || [];
    const fieldIdStr = fieldId != null ? String(fieldId) : "";
    const idInList = (list) => list && list.some((id) => String(id) === fieldIdStr);
    for (const group of formGroups) {
      if (!group?.conditional_visibility?.depends_on_field) continue;
      const fieldIds = group.fields || [];
      if (!idInList(fieldIds)) continue;
      if (!checkGroupVisibility(group, data)) return true;
    }
    const sections = form?.form_fields?.sections || [];
    for (const section of sections) {
      for (const group of section?.groups || []) {
        if (!group?.conditional_visibility?.depends_on_field) continue;
        const fieldIds = group.fields || [];
        if (!idInList(fieldIds)) continue;
        if (!checkGroupVisibility(group, data)) return true;
      }
    }
    return false;
  };

  // Build form layout for read-only view (same structure as submit page, all fields in one "page")
  const fullPageFields = (() => {
    const all = form?.form_fields?.fields || [];
    return all.filter((f) => (f.type || f.field_type || "")?.toLowerCase() !== "page_break");
  })();

  const fullLayout = (() => {
    const formGroups = form?.form_fields?.groups || [];
    const formSections = form?.form_fields?.sections || [];
    const hasFormGroups = formGroups.length > 0;
    const hasFormSections = formSections.length > 0 && !hasFormGroups;
    if (hasFormGroups) {
      const FORM_GRID_COLS = ["left", "center", "right"];
      const isGridSlotTable = (slot) => slot && typeof slot === "object" && (slot.layout || "") === "table" && Array.isArray(slot.table_rows);
      const isGridSlotTabs = (slot) => slot && typeof slot === "object" && (slot.layout || "") === "tabs" && Array.isArray(slot.tabs);
      const getGridSlotFieldIds = (slot) => {
        if (Array.isArray(slot)) return slot;
        if (isGridSlotTable(slot)) return (slot.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean));
        if (isGridSlotTabs(slot)) return (slot.tabs || []).flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || []));
        return [];
      };
      const gridFieldIds = (g) => (g.layout || "") === "grid" && (g.grid_rows || []).length > 0
        ? (g.grid_rows || []).flatMap((r) => FORM_GRID_COLS.flatMap((col) => getGridSlotFieldIds(r[col])))
        : (g.layout || "") === "grid" ? (g.fields || []) : [];
      const tabFieldIds = (g) => (g.layout === "tabs" && g.tabs?.length) ? (g.tabs || []).flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || [])) : [];
      const tableFieldIds = (g) => ((g.layout || "") === "table" && (g.table_rows || []).length > 0) ? (g.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : [];
      const fieldIdsInGroups = new Set(formGroups.flatMap((g) =>
        (g.layout === "tabs" && g.tabs?.length) ? tabFieldIds(g) : (g.layout || "") === "table" ? tableFieldIds(g) : (g.layout || "") === "grid" ? gridFieldIds(g) : (g.fields || [])
      ));
      const fieldsNotInAnyGroup = fullPageFields.filter((f) => !fieldIdsInGroups.has(f.id || f.field_id || f.name));
      const hasTableRows = (g) => (g.layout || "") === "table" && Array.isArray(g.table_rows) && g.table_rows.length > 0;
      const hasGridTable = (g) => (g.layout || "") === "grid" && (g.grid_rows || []).some((r) => FORM_GRID_COLS.some((col) => isGridSlotTable(r[col]) || isGridSlotTabs(r[col])));
      const groupsWithFields = formGroups
        .map((g) => {
          const fieldIds = (g.layout === "tabs" && g.tabs?.length) ? new Set(tabFieldIds(g)) : (g.layout || "") === "table" ? new Set(tableFieldIds(g)) : (g.layout || "") === "grid" ? new Set(gridFieldIds(g)) : new Set(g.fields || []);
          const groupFields = fullPageFields.filter((f) => fieldIds.has(f.id || f.field_id || f.name));
          return { group: g, fields: groupFields };
        })
        .filter((g) => (g.group.layout === "tabs" && g.group.tabs?.length) || g.fields.length > 0 || hasTableRows(g.group) || hasGridTable(g.group));
      return { fieldsNotInAnySection: fieldsNotInAnyGroup, sectionsWithContent: [{ sectionLabel: null, ungrouped: fieldsNotInAnyGroup, groupsWithFields }] };
    }
    if (hasFormSections) {
      const fieldIdsInSections = new Set(formSections.flatMap((s) => s.fields || []));
      const fieldsNotInAnySection = fullPageFields.filter((f) => !fieldIdsInSections.has(f.id || f.field_id || f.name));
      const groupFieldIds = (g) => ((g.layout || "") === "table" && (g.table_rows || []).length > 0) ? (g.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (g.fields || []);
      const sectionsWithContent = formSections.map((section) => {
        const sectionFieldIds = section.fields || [];
        const sectionFieldsOnPage = fullPageFields.filter((f) => sectionFieldIds.includes(f.id || f.field_id || f.name));
        if (sectionFieldsOnPage.length === 0) return null;
        const fieldIdsInGroups = new Set((section.groups || []).flatMap((g) => groupFieldIds(g)));
        const ungrouped = sectionFieldsOnPage.filter((f) => !fieldIdsInGroups.has(f.id || f.field_id || f.name));
        const hasTableRows = (g) => (g.layout || "") === "table" && Array.isArray(g.table_rows) && g.table_rows.length > 0;
        const groupsWithFields = (section.groups || []).map((g) => ({
          group: g,
          fields: sectionFieldsOnPage.filter((f) => groupFieldIds(g).includes(f.id || f.field_id || f.name)),
        })).filter((g) => g.fields.length > 0 || hasTableRows(g.group));
        return { sectionLabel: section.title || section.label || section.id || "Section", ungrouped, groupsWithFields };
      }).filter(Boolean);
      return { fieldsNotInAnySection, sectionsWithContent };
    }
    return null;
  })();

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
          }));
        }
        
        // Check if it's an array of file IDs (numbers)
        if (typeof value[0] === 'number') {
          return value.map((fileId) => ({
            file_id: fileId,
            file_name: `File #${fileId}`,
            file_url: null,
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
          };
        }
      }

      // Handle single file ID (number)
      if (typeof value === 'number') {
        return {
          file_id: value,
          file_name: `File #${value}`,
          file_url: null,
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

    // Handle people/user fields
    if (fieldType === 'people' || fieldType === 'user') {
      // If it's already a string (formatted by backend), return as-is
      if (typeof value === 'string') {
        return value;
      }
      // If it's an object, extract display name
      if (typeof value === 'object' && value !== null) {
        if (value.display_name) {
          return value.display_name;
        }
        // Build name from first_name and last_name
        const nameParts = [];
        if (value.first_name) nameParts.push(value.first_name);
        if (value.last_name) nameParts.push(value.last_name);
        if (nameParts.length > 0) {
          return nameParts.join(' ');
        }
        // Fallback to email
        if (value.email) {
          return value.email;
        }
        // Last resort: user ID
        if (value.id) {
          return `User #${value.id}`;
        }
      }
      // If it's a number (just user ID), return as-is (backend should format it)
      if (typeof value === 'number') {
        return value;
      }
    }

    // For other types, return as-is (already formatted by backend)
    return value;
  };

  // Helper to handle file download
  const handleFileDownload = (file) => {
    if (file.file_url) {
      // If we have a direct URL, open it
      window.open(file.file_url, '_blank');
    } else if (file.file_slug || file.slug) {
      // Use slug for path parameter (preferred)
      downloadFileMutation.mutate(file.file_slug || file.slug);
    } else if (file.file_id) {
      // Fallback to ID only if slug is not available (for backward compatibility)
      downloadFileMutation.mutate(file.file_id);
    }
  };

  // Helper to render field value with better visual representation
  const renderFieldValue = (field, value) => {
    const fieldType = field?.field_type?.toLowerCase();
    const isSignatureField = fieldType === 'signature';
    
    // Handle signature fields - display as image if it's a data URI
    if (isSignatureField && typeof value === 'string' && value.startsWith('data:image')) {
      return (
        <div className="mt-2">
          <img 
            src={value} 
            alt="Signature" 
            className="max-w-full h-auto border rounded-md bg-background"
            style={{ maxHeight: '200px' }}
          />
        </div>
      );
    }
    
    const formatted = formatFieldValue(field, value);
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

    // Handle file field with just a number (file ID) - fallback case
    // Note: This should ideally use file slug, but we handle ID for backward compatibility
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
              onClick={() => {
                // Use slug if available, fallback to ID for backward compatibility
                const fileSlug = formatted; // API should accept slug, but we pass ID as fallback
                window.open(`/api/v1/settings/files/${fileSlug}/download`, '_blank');
              }}
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
        const date = parseUTCDate(formatted);
        if (date && !isNaN(date.getTime())) {
          // Check if time should be shown based on field label
          const shouldShowTime = shouldShowTimeForDateField(field);
          const dateFormat = shouldShowTime ? "MMMM dd, yyyy 'at' HH:mm" : "MMMM dd, yyyy";
          const icon = shouldShowTime ? Clock : Calendar;
          const IconComponent = icon;
          
          return (
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              <span>{format(date, dateFormat)}</span>
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
        const date = parseUTCDate(formatted);
        if (date && !isNaN(date.getTime())) {
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

    // Handle people/user fields
    if (fieldType === 'people' || fieldType === 'user') {
      // If it's already a string (formatted by backend), display it
      if (typeof formatted === 'string') {
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{formatted}</span>
            </div>
          );
      }
      // If it's an object, extract display name
      if (typeof formatted === 'object' && formatted !== null) {
        let displayName = null;
        if (formatted.display_name) {
          displayName = formatted.display_name;
        } else {
          // Build name from first_name and last_name
          const nameParts = [];
          if (formatted.first_name) nameParts.push(formatted.first_name);
          if (formatted.last_name) nameParts.push(formatted.last_name);
          if (nameParts.length > 0) {
            displayName = nameParts.join(' ');
          } else if (formatted.email) {
            displayName = formatted.email;
          } else if (formatted.id) {
            displayName = `User #${formatted.id}`;
          }
        }
        if (displayName) {
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{displayName}</span>
            </div>
          );
        }
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

    // Fallback: Handle objects that weren't caught by specific handlers
    // This prevents "[object Object]" from being displayed
    if (typeof formatted === 'object' && formatted !== null && !Array.isArray(formatted)) {
      // Try to extract a meaningful string representation
      if (formatted.display_name || formatted.name || formatted.label) {
        return <p className="text-base">{formatted.display_name || formatted.name || formatted.label}</p>;
      }
      if (formatted.first_name || formatted.last_name || formatted.email) {
        const nameParts = [];
        if (formatted.first_name) nameParts.push(formatted.first_name);
        if (formatted.last_name) nameParts.push(formatted.last_name);
        const displayName = nameParts.length > 0 ? nameParts.join(' ') : formatted.email;
        return <p className="text-base">{displayName}</p>;
      }
      // Last resort: show JSON representation for debugging
      return <p className="text-base font-mono text-xs">{JSON.stringify(formatted, null, 2)}</p>;
    }

    // Regular text values
    return (
      <p className="text-base">{String(formatted)}</p>
    );
  };

  // Handle PDF download – use data-based generator (avoids html2canvas lab() color errors with modern CSS)
  const handleDownloadPDF = async () => {
    if (!submission || !form) {
      toast.error("Unable to generate PDF", {
        description: "Submission or form data is missing",
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const filename = `form-submission-${submission.id}-${form.form_title || form.form_name || "submission"}.pdf`.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      await generateFormSubmissionPDFFromData({
        submission,
        form,
        users,
        filename,
      });
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", {
        description: error.message || "An error occurred while generating the PDF",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintFormOnly = () => {
    window.print();
  };

  return (
    <>
      {/* Print: show only the form card (user can "Save as PDF" in print dialog) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .submission-print-form-only,
          .submission-print-form-only * { visibility: visible; }
          .submission-print-form-only {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background: #fff !important;
          }
        }
      `}} />
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
          {submission.category && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {submission.category}
            </Badge>
          )}
          <Badge className={getStatusColor(submission.status)}>
            {submission.status || "N/A"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintFormOnly}
            title="Print or save as PDF – shows only the form"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print / Save as PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUpdateData({
                category: submission.category || null,
                status: submission.status || "",
                notes: submission.notes || "",
                review_notes: submission.review_notes || "",
              });
              setIsUpdateDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Update
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Submission Data – form-style read-only view (PDF-like, NHS-friendly); only this shows when printing */}
          <Card className="submission-print-form-only overflow-hidden border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40 py-4">
              <CardTitle className="text-xl font-semibold text-[#005eb8]">
                {form?.form_title || form?.form_name || "Form"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Submission view – read only</p>
            </CardHeader>
            <CardContent className="p-0">
              {fullLayout ? (
                <div className="min-h-[400px] bg-muted/30">
                  <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                    {fullLayout.sectionsWithContent?.map(({ sectionLabel, ungrouped, groupsWithFields }, sectionIdx) => (
                      <React.Fragment key={sectionIdx}>
                        {sectionLabel && (
                          <div className="border-l-4 border-[#005eb8] pl-3 py-1">
                            <h3 className="text-sm font-semibold text-[#005eb8]">{sectionLabel}</h3>
                          </div>
                        )}
                        {groupsWithFields.map(({ group, fields: groupFields }) => {
                          if (!checkGroupVisibility(group, dataForVisibility)) return null;
                          const isTabs = (group.layout || "") === "tabs" && (group.tabs || []).length > 0;
                          const isGrid = (group.layout || "") === "grid" && (group.grid_rows || []).length > 0;
                          const isTable = (group.layout || "") === "table" && Array.isArray(group.table_rows) && group.table_rows.length > 0;
                          const allFormFields = form?.form_fields?.fields || [];
                          const getFieldById = (id) => allFormFields.find((f) => (f.field_id || f.id || f.name) === id);
                          const renderTable = (tableCols, tableRows, tableKey) => (
                            <div key={tableKey} className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="border-b border-[#005eb8] bg-[#005eb8]/5">
                                    {tableCols.map((col) => (
                                      <th key={col.id} className="text-left font-medium p-3 text-[#005eb8]">{col.label || col.id}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {tableRows.filter((row) => checkRowVisibility(row, dataForVisibility)).map((row, rIdx) => {
                                    const cells = (row.cells || []).slice(0, tableCols.length);
                                    while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                                    return (
                                      <tr key={rIdx} className="border-b border-border hover:bg-muted/30">
                                        {cells.map((cell, cIdx) => {
                                          const fieldId = cell.field_id ? String(cell.field_id) : null;
                                          const field = fieldId ? getFieldById(fieldId) : null;
                                          const isVisible = !field || (checkFieldVisibility(field, dataForVisibility) && !isFieldInHiddenGroup(fieldId, dataForVisibility));
                                          if (!isVisible) return <td key={cIdx} className="p-3 align-middle" />;
                                          const isDisplayOnly = field && ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes((field.type || field.field_type || "").toLowerCase());
                                          const optionsForField = field?.options || field?.field_options?.options || [];
                                          const mappedField = field ? { ...field, id: fieldId, field_label: field.label || field.field_label, label: field.label, name: field.name || field.field_name || fieldId, field_description: field.help_text, field_type: field.type || field.field_type, field_options: { ...(field.field_options || {}), options: optionsForField }, ...(optionsForField.length ? { options: optionsForField } : {}) } : null;
                                          return (
                                            <td key={cIdx} className="p-3 align-middle">
                                              <div className="space-y-1">
                                                {cell.text ? <span className="text-muted-foreground text-xs block">{cell.text}</span> : null}
                                                {mappedField && (
                                                  <CustomFieldRenderer field={mappedField} value={isDisplayOnly ? undefined : displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} hideLabel readOnly />
                                                )}
                                              </div>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                          if (isTabs) {
                            return (
                              <section key={group.id || group.label} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                                {group.label && (
                                  <div className="px-5 py-3 border-b border-border">
                                    <h4 className="font-semibold text-foreground">{group.label}</h4>
                                  </div>
                                )}
                                <div className="p-5 space-y-6">
                                  {(group.tabs || []).map((tab) => {
                                    const tabHasTable = (tab.layout || "") === "table" && Array.isArray(tab.table_rows) && tab.table_rows.length > 0;
                                    const tabLabel = tab.label || tab.id || "Tab";
                                    if (tabHasTable) {
                                      const tableCols = Array.isArray(tab.table_columns) && tab.table_columns.length > 0 ? tab.table_columns : [{ id: "col_1", label: "Column 1" }];
                                      const tableRows = tab.table_rows || [];
                                      return (
                                        <div key={tab.id || tab.label}>
                                          <h5 className="text-sm font-medium text-[#005eb8] border-l-4 border-[#005eb8] pl-3 mb-3">{tabLabel}</h5>
                                          {renderTable(tableCols, tableRows, `tab-${tab.id || tab.label}-table`)}
                                        </div>
                                      );
                                    }
                                    const tabFieldIds = new Set(tab.fields || []);
                                    const tabFields = groupFields.filter((f) => tabFieldIds.has(f.id || f.field_id || f.name));
                                    return (
                                      <div key={tab.id || tab.label}>
                                        <h5 className="text-sm font-medium text-[#005eb8] border-l-4 border-[#005eb8] pl-3 mb-3">{tabLabel}</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                          {tabFields.filter((f) => checkFieldVisibility(f, dataForVisibility) && !isFieldInHiddenGroup(f.id || f.field_id || f.name, dataForVisibility)).map((field) => {
                                            const fieldId = field.id || field.field_id || field.field_name || field.name;
                                            const isDisplayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes((field.type || field.field_type || "").toLowerCase());
                                            const optionsForField = field.options || field.field_options?.options || [];
                                            const mappedField = { ...field, id: fieldId, field_label: field.label || field.field_label, label: field.label, name: field.name || field.field_name || fieldId, field_description: field.help_text, field_type: field.type || field.field_type, field_options: { ...(field.field_options || {}), options: optionsForField }, ...(optionsForField.length ? { options: optionsForField } : {}) };
                                            return (
                                              <div key={fieldId} className={cn("py-2", isDisplayOnly && "md:col-span-2")}>
                                                <CustomFieldRenderer field={mappedField} value={isDisplayOnly ? undefined : displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} readOnly />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </section>
                            );
                          }
                          if (isTable) {
                            const tableCols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "Column 1" }];
                            const tableRows = group.table_rows || [];
                            return (
                              <section key={group.id || group.label} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                                {group.label && (
                                  <div className="px-5 py-3 border-b border-border">
                                    <h4 className="font-semibold text-foreground">{group.label}</h4>
                                  </div>
                                )}
                                <div className="p-5">
                                  {renderTable(tableCols, tableRows, `group-${group.id || group.label}-table`)}
                                </div>
                              </section>
                            );
                          }
                          const FORM_GRID_COLS = ["left", "center", "right"];
                          const isGridSlotTable = (slot) => slot && typeof slot === "object" && (slot.layout || "") === "table" && Array.isArray(slot.table_rows);
                          const isGridSlotTabs = (slot) => slot && typeof slot === "object" && (slot.layout || "") === "tabs" && Array.isArray(slot.tabs);
                          if (isGrid && (group.grid_rows || []).length > 0) {
                            const renderGridSlot = (slot, rowIdx, col) => {
                              if (isGridSlotTable(slot)) {
                                const tableCols = slot.table_columns?.length > 0 ? slot.table_columns : [{ id: "col_1", label: "Column 1" }];
                                const tableRows = slot.table_rows || [];
                                return renderTable(tableCols, tableRows, `grid-${rowIdx}-${col}`);
                              }
                              if (isGridSlotTabs(slot)) {
                                return (
                                  <div className="space-y-3">
                                    {(slot.tabs || []).map((tab) => {
                                      const tabHasTable = (tab.layout || "") === "table" && Array.isArray(tab.table_rows) && tab.table_rows.length > 0;
                                      const tabLabel = tab.label || tab.id || "Tab";
                                      if (tabHasTable) {
                                        const tableCols = tab.table_columns?.length > 0 ? tab.table_columns : [{ id: "col_1", label: "Column 1" }];
                                        const tableRows = tab.table_rows || [];
                                        return (
                                          <div key={tab.id || tab.label}>
                                            <h6 className="text-xs font-medium text-[#005eb8] mb-2">{tabLabel}</h6>
                                            {renderTable(tableCols, tableRows, `grid-tab-${tab.id || tab.label}`)}
                                          </div>
                                        );
                                      }
                                      const tabFieldIds = new Set(tab.fields || []);
                                      const tabFields = groupFields.filter((f) => tabFieldIds.has(f.id || f.field_id || f.name));
                                      return (
                                        <div key={tab.id || tab.label}>
                                          <h6 className="text-xs font-medium text-[#005eb8] mb-2">{tabLabel}</h6>
                                          <div className="space-y-2">
                                            {tabFields.filter((f) => checkFieldVisibility(f, dataForVisibility) && !isFieldInHiddenGroup(f.id || f.field_id || f.name, dataForVisibility)).map((field) => {
                                              const fieldId = field.id || field.field_id || field.field_name || field.name;
                                              const isDisplayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes((field.type || field.field_type || "").toLowerCase());
                                              const optionsForField = field.options || field.field_options?.options || [];
                                              const mappedField = { ...field, id: fieldId, field_label: field.label || field.field_label, label: field.label, name: field.name || field.field_name || fieldId, field_description: field.help_text, field_type: field.type || field.field_type, field_options: { ...(field.field_options || {}), options: optionsForField }, ...(optionsForField.length ? { options: optionsForField } : {}) };
                                              return (
                                                <div key={fieldId} className={cn("py-1", isDisplayOnly && "md:col-span-2")}>
                                                  <CustomFieldRenderer field={mappedField} value={isDisplayOnly ? undefined : displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} readOnly />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              const fieldIds = Array.isArray(slot) ? slot : [];
                              const slotFields = fieldIds.map((fid) => groupFields.find((f) => (f.id || f.field_id || f.name) === fid)).filter(Boolean);
                              return (
                                <div className="space-y-2">
                                  {slotFields.filter((f) => checkFieldVisibility(f, dataForVisibility) && !isFieldInHiddenGroup(f.id || f.field_id || f.name, dataForVisibility)).map((field) => {
                                    const fieldId = field.id || field.field_id || field.field_name || field.name;
                                    const isDisplayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes((field.type || field.field_type || "").toLowerCase());
                                    const optionsForField = field.options || field.field_options?.options || [];
                                    const mappedField = { ...field, id: fieldId, field_label: field.label || field.field_label, label: field.label, name: field.name || field.field_name || fieldId, field_description: field.help_text, field_type: field.type || field.field_type, field_options: { ...(field.field_options || {}), options: optionsForField }, ...(optionsForField.length ? { options: optionsForField } : {}) };
                                    return (
                                      <div key={fieldId} className={cn("py-1", isDisplayOnly && "md:col-span-2")}>
                                        <CustomFieldRenderer field={mappedField} value={isDisplayOnly ? undefined : displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} readOnly />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            };
                            const rows = group.grid_rows || [];
                            return (
                              <section key={group.id || group.label} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                                {group.label && (
                                  <div className="px-5 py-3 border-b border-border">
                                    <h4 className="font-semibold text-foreground">{group.label}</h4>
                                  </div>
                                )}
                                <div className="p-5 space-y-4">
                                  {rows.filter((gridRow) => checkRowVisibility(gridRow, dataForVisibility)).map((gridRow, rowIdx) => {
                                    const leftSlot = gridRow.left;
                                    const centerSlot = gridRow.center;
                                    const rightSlot = gridRow.right;
                                    const hasLeftOrRight = (Array.isArray(leftSlot) && leftSlot.length > 0) || (Array.isArray(rightSlot) && rightSlot.length > 0) || isGridSlotTable(leftSlot) || isGridSlotTable(rightSlot) || isGridSlotTabs(leftSlot) || isGridSlotTabs(rightSlot);
                                    const hasCenter = (Array.isArray(centerSlot) && centerSlot.length > 0) || isGridSlotTable(centerSlot) || isGridSlotTabs(centerSlot);
                                    return (
                                      <div key={`row-${rowIdx}`} className="space-y-4">
                                        {hasLeftOrRight && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>{renderGridSlot(leftSlot, rowIdx, "left")}</div>
                                            <div>{renderGridSlot(rightSlot, rowIdx, "right")}</div>
                                          </div>
                                        )}
                                        {hasCenter && <div className="w-full">{renderGridSlot(centerSlot, rowIdx, "center")}</div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </section>
                            );
                          }
                          return (
                            <section key={group.id || group.label} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                              {group.label && (
                                <div className="px-5 py-3 border-b border-border">
                                  <h4 className="font-semibold text-foreground">{group.label}</h4>
                                </div>
                              )}
                              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {groupFields.filter((f) => checkFieldVisibility(f, dataForVisibility) && !isFieldInHiddenGroup(f.id || f.field_id || f.name, dataForVisibility)).map((field) => {
                                  const fieldId = field.id || field.field_id || field.field_name || field.name;
                                  const isDisplayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes((field.type || field.field_type || "").toLowerCase());
                                  const optionsForField = field.options || field.field_options?.options || [];
                                  const mappedField = { ...field, id: fieldId, field_label: field.label || field.field_label, label: field.label, name: field.name || field.field_name || fieldId, field_description: field.help_text, field_type: field.type || field.field_type, field_options: { ...(field.field_options || {}), options: optionsForField }, ...(optionsForField.length ? { options: optionsForField } : {}) };
                                  return (
                                    <div key={fieldId} className={cn("py-2", isDisplayOnly && "md:col-span-2")}>
                                      <CustomFieldRenderer field={mappedField} value={isDisplayOnly ? undefined : displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} readOnly />
                                    </div>
                                  );
                                })}
                              </div>
                            </section>
                          );
                        })}
                        {ungrouped.length > 0 && (
                          <section className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              {ungrouped.filter((f) => checkFieldVisibility(f, dataForVisibility) && !isFieldInHiddenGroup(f.id || f.field_id || f.name, dataForVisibility)).map((field) => {
                                const fieldId = field.id || field.field_id || field.field_name || field.name;
                                const isDisplayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes((field.type || field.field_type || "").toLowerCase());
                                const optionsForField = field.options || field.field_options?.options || [];
                                const mappedField = { ...field, id: fieldId, field_label: field.label || field.field_label, label: field.label, name: field.name || field.field_name || fieldId, field_description: field.help_text, field_type: field.type || field.field_type, field_options: { ...(field.field_options || {}), options: optionsForField }, ...(optionsForField.length ? { options: optionsForField } : {}) };
                                return (
                                  <div key={fieldId} className={cn("py-2", isDisplayOnly && "md:col-span-2")}>
                                    <CustomFieldRenderer field={mappedField} value={isDisplayOnly ? undefined : displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} readOnly />
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        )}
                      </React.Fragment>
                    ))}
                    {fullLayout.fieldsNotInAnySection?.length > 0 && (
                      <section className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-border">
                          <h3 className="text-sm font-semibold text-[#005eb8] border-l-4 border-[#005eb8] pl-3">Details</h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {fullLayout.fieldsNotInAnySection
                            .filter((f) => checkFieldVisibility(f, dataForVisibility) && !isFieldInHiddenGroup(f.id || f.field_id || f.name, dataForVisibility))
                            .map((field) => {
                              const fieldId = field.id || field.field_id || field.field_name || field.name;
                              const isDisplayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes((field.type || field.field_type || "").toLowerCase());
                              const optionsForField = field.options || field.field_options?.options || [];
                              const mappedField = { ...field, id: fieldId, field_label: field.label || field.field_label, label: field.label, name: field.name || field.field_name || fieldId, field_description: field.help_text, field_type: field.type || field.field_type, field_options: { ...(field.field_options || {}), options: optionsForField }, ...(optionsForField.length ? { options: optionsForField } : {}) };
                              return (
                                <div key={fieldId} className={cn("py-2", isDisplayOnly && "md:col-span-2")}>
                                  <CustomFieldRenderer field={mappedField} value={isDisplayOnly ? undefined : displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} readOnly />
                                </div>
                              );
                            })}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              ) : fields.length > 0 ? (
                <div className="p-6 space-y-4 bg-muted/30">
                  {fields.map((field) => {
                    const fieldId = field.field_id || field.field_name;
                    const fieldType = field.field_type?.toLowerCase();
                    const displayOnlyTypes = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break"];
                    const isDisplayOnly = displayOnlyTypes.includes(fieldType);
                    if (isDisplayOnly) {
                      const mappedField = { ...field, id: fieldId, field_label: field.label, field_description: field.help_text, field_type: field.field_type, content: field.content, image_url: field.image_url, video_url: field.video_url, alt_text: field.alt_text };
                      return <div key={fieldId}><CustomFieldRenderer field={mappedField} value={undefined} readOnly /></div>;
                    }
                    const value = displayData[fieldId];
                    return (
                      <div key={fieldId} className="p-4 bg-card border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-medium text-foreground">{field.label || fieldId}</label>
                          {field.required && <Badge className="bg-[#da291c] text-white text-xs">Required</Badge>}
                        </div>
                        <div className="text-sm">{renderFieldValue(field, value)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 space-y-2 bg-muted/30">
                  {Object.entries(displayData).map(([key, value]) => {
                    const field = fields.find((f) => (f.field_id || f.field_name) === key);
                    return (
                      <div key={key} className="p-4 bg-card border border-border rounded-lg">
                        <label className="font-medium text-sm text-muted-foreground">{field?.label || key}</label>
                        <div className="mt-1 text-sm">{renderFieldValue(field || { field_type: "text" }, value)}</div>
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
                                  .map((taskId) => {
                                    // Note: task_ids from processing_result may still be IDs
                                    // If backend provides task_slugs array, use that instead
                                    const taskSlug = submission.processing_result?.task_creation?.task_slugs?.[submission.processing_result.task_creation.task_ids.indexOf(taskId)] || taskId;
                                    return (
                                      <Link
                                        key={taskId}
                                        href={`/admin/tasks/${taskSlug}`}
                                      >
                                        <Button variant="outline" size="sm">
                                          Task #{taskId}
                                        </Button>
                                      </Link>
                                    );
                                  })}
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
                            href={`/admin/tasks/${submission.processing_result.task_creation.task_slug || submission.processing_result.task_creation.task_id}`}
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
              {formCategories.length > 0 && (
                <div>
                  <label className="text-muted-foreground">Category</label>
                  <div className="mt-1">
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
                  </div>
                </div>
              )}
              <div>
                <label className="text-muted-foreground">Submitted By</label>
                <div className="mt-1">
                  {submission.submitted_by_user_id ? (
                    (submission.submitted_by_user?.slug || submission.submitted_by_user_slug) ? (
                      <Link
                        href={`/admin/people-management/${submission.submitted_by_user?.slug || submission.submitted_by_user_slug}`}
                        className="text-primary hover:underline"
                      >
                        {getUserName(submission.submitted_by_user_id) || `User #${submission.submitted_by_user_id}`}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {getUserName(submission.submitted_by_user_id) || `User #${submission.submitted_by_user_id}`}
                      </span>
                    )
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Anonymous
                    </Badge>
                  )}
                </div>
              </div>
              {/* Task Link */}
              {(submission.processing_result?.task_creation?.task_id ||
                submission.processing_result?.task_creation?.task_ids?.[0] ||
                submission.task_id) && (
                <div>
                  <label className="text-muted-foreground">Related Task</label>
                  <div className="mt-1">
                    <Link
                      href={`/admin/tasks/${
                        submission.processing_result?.task_creation?.task_id ||
                        submission.processing_result?.task_creation?.task_ids?.[0] ||
                        submission.task_id
                      }`}
                    >
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        <Link2 className="h-3 w-3 mr-1" />
                        Task #
                        {submission.processing_result?.task_creation?.task_id ||
                          submission.processing_result?.task_creation?.task_ids?.[0] ||
                          submission.task_id}
                      </Badge>
                    </Link>
                  </div>
                </div>
              )}
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
                    {(submission.reviewed_by_user?.slug || submission.reviewed_by_user_slug) ? (
                      <Link
                        href={`/admin/people-management/${submission.reviewed_by_user?.slug || submission.reviewed_by_user_slug}`}
                        className="text-primary hover:underline"
                      >
                        {getUserName(submission.reviewed_by_user_id) || `User #${submission.reviewed_by_user_id}`}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {getUserName(submission.reviewed_by_user_id) || `User #${submission.reviewed_by_user_id}`}
                      </span>
                    )}
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
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/forms/${formSlug}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Form
                </Button>
              </Link>
              <Link href={`/admin/forms/${formSlug}/submissions`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  All Submissions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comments Section */}
      <Card>
        <CardContent className="pt-6">
          <CommentThread
            entityType="form_submission"
            entitySlug={submission?.slug}
            showHeader={true}
          />
        </CardContent>
      </Card>

      {/* Activity History */}
      <ResourceAuditLogs
        resource="form_submission"
        resourceSlug={submission?.slug}
        resourceId={submission?.id}
        title="Activity History"
      />

      {/* Update Submission Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Submission</DialogTitle>
            <DialogDescription>
              Update the category, status, and notes for this submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formCategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="update_category">Category</Label>
                <Select
                  value={updateData.category || "uncategorized"}
                  onValueChange={(value) =>
                    setUpdateData({
                      ...updateData,
                      category: value === "uncategorized" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {formCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="update_status">Status</Label>
              <Select
                value={updateData.status}
                onValueChange={(value) =>
                  setUpdateData({ ...updateData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {formStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update_notes">Notes</Label>
              <Textarea
                id="update_notes"
                value={updateData.notes}
                onChange={(e) =>
                  setUpdateData({ ...updateData, notes: e.target.value })
                }
                placeholder="Add notes about this submission..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update_review_notes">Review Notes</Label>
              <Textarea
                id="update_review_notes"
                value={updateData.review_notes}
                onChange={(e) =>
                  setUpdateData({ ...updateData, review_notes: e.target.value })
                }
                placeholder="Add review notes..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await updateSubmissionMutation.mutateAsync({
                    slug: submissionSlug,
                    submissionData: {
                      category: updateData.category,
                      status: updateData.status,
                      notes: updateData.notes || undefined,
                      review_notes: updateData.review_notes || undefined,
                    },
                  });
                  setIsUpdateDialogOpen(false);
                } catch (error) {
                  console.error("Failed to update submission:", error);
                }
              }}
              disabled={updateSubmissionMutation.isPending}
            >
              {updateSubmissionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default FormSubmissionDetailPage;


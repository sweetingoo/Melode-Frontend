"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Edit, Save, X, Clock, MessageSquare, FileText, User as UserIcon, Calendar, ListTodo, Paperclip, Smartphone, ChevronRight } from "lucide-react";
import {
  useTrackerEntry,
  useTrackerEntryTimeline,
  useTrackerEntryAuditLogs,
  useUpdateTrackerEntry,
  useTrackers,
  useTrackerEntries,
} from "@/hooks/useTrackers";
import { useComments } from "@/hooks/useComments";
import { useCreateTask } from "@/hooks/useTasks";
import CommentThread from "@/components/CommentThread";
import { format, startOfDay } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { humanizeStatusForDisplay } from "@/utils/slug";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { filesService } from "@/services/files";
import { trackersService } from "@/services/trackers";
import { cn } from "@/lib/utils";

const TrackerEntryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissionsCheck();
  const canReadEntry = hasPermission("tracker_entry:read");
  const canUpdateEntry = hasPermission("tracker_entry:update");
  // Get slug from params - handle both 'slug' and 'entryId' for backward compatibility
  const entrySlug = params.slug || params.entryId;
  
  // Debug logging - this will help us see if the component is rendering
  useEffect(() => {
    console.log("🔍 TrackerEntryDetailPage - Component mounted");
    console.log("🔍 TrackerEntryDetailPage - params:", params);
    console.log("🔍 TrackerEntryDetailPage - entrySlug:", entrySlug);
    if (!entrySlug) {
      console.error("❌ TrackerEntryDetailPage - entrySlug is undefined/null!");
    }
  }, [params, entrySlug]);
  
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [entryData, setEntryData] = useState({});
  const [entryStatus, setEntryStatus] = useState("open");
  const [fieldErrors, setFieldErrors] = useState({});
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsActionFilter, setAuditLogsActionFilter] = useState("all");
  const auditLogsPerPage = 20;
  const [triageOutcome, setTriageOutcome] = useState("");
  const [triageSubmitting, setTriageSubmitting] = useState(false);
  const [rebookTaskSubmitting, setRebookTaskSubmitting] = useState(false);
  const createTaskMutation = useCreateTask();
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState({ title: "", due_date: "", task_type: "" });
  const [isSendSmsModalOpen, setIsSendSmsModalOpen] = useState(false);
  const [sendSmsTemplate, setSendSmsTemplate] = useState("please_contact_us");
  const [sendSmsSubmitting, setSendSmsSubmitting] = useState(false);
  const [stageChangePending, setStageChangePending] = useState(null);
  const [stageChangeNotes, setStageChangeNotes] = useState("");

  const { data: entry, isLoading: entryLoading, error: entryError } = useTrackerEntry(entrySlug);
  
  // Debug logging for API call
  useEffect(() => {
    console.log("TrackerEntryDetailPage - entrySlug:", entrySlug);
    console.log("TrackerEntryDetailPage - entryLoading:", entryLoading);
    console.log("TrackerEntryDetailPage - entry:", entry);
    console.log("TrackerEntryDetailPage - entryError:", entryError);
  }, [entrySlug, entryLoading, entry, entryError]);
  const [timelinePage, setTimelinePage] = useState(1);
  const timelinePerPage = 50;
  const [allTimelineEvents, setAllTimelineEvents] = useState([]);
  const [timelinePagination, setTimelinePagination] = useState({ total: 0, total_pages: 0 });
  const { data: timelineData, isLoading: timelineLoading } = useTrackerEntryTimeline(entrySlug, timelinePage, timelinePerPage);
  
  // Helper function to format People field values in timeline descriptions
  const formatTimelineDescription = (description, event) => {
    if (!description) return description;
    
    // Check if this is a field change event and if it contains People field data
    if (event.type === "field_change" || event.type === "date_field_change" || event.type === "select_field_change") {
      // Try to format People field values in the description
      // Pattern: "Field changed from X to Y" where Y might be a JSON object string
      const peopleFieldPattern = /changed from (.+?) to (\{.*?'id'.*?'display_name'.*?\}|.*?)$/;
      const match = description.match(peopleFieldPattern);
      
      if (match) {
        let oldValue = match[1].trim();
        let newValue = match[2].trim();
        
        // Helper to format a People field value
        const formatPeopleValue = (value) => {
          if (!value || value === "—") return value;
          
          // Try to parse if it looks like a JSON object
          if (value.startsWith("{") && (value.includes("'id'") || value.includes('"id"'))) {
            try {
              // Replace single quotes with double quotes for JSON parsing
              const jsonStr = value.replace(/'/g, '"');
              const parsed = JSON.parse(jsonStr);
              
              // Extract display name
              if (parsed.display_name) {
                return parsed.display_name;
              } else if (parsed.first_name || parsed.last_name) {
                return `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim();
              } else if (parsed.email) {
                return parsed.email;
              } else if (parsed.id) {
                return `User #${parsed.id}`;
              }
            } catch (e) {
              // If parsing fails, try to extract display_name directly from string
              const displayNameMatch = value.match(/(?:'|")display_name(?:'|"):\s*(?:'|")([^'"]+)(?:'|")/);
              if (displayNameMatch) {
                return displayNameMatch[1];
              }
            }
          }
          
          return value;
        };
        
        const formattedOld = formatPeopleValue(oldValue);
        const formattedNew = formatPeopleValue(newValue);
        
        return description.replace(match[0], `changed from ${formattedOld} to ${formattedNew}`);
      }
    }
    
    return description;
  };
  
  // Accumulate timeline events as pages are loaded
  useEffect(() => {
    if (timelineData?.events) {
      if (timelinePage === 1) {
        // First page - replace all events
        setAllTimelineEvents(timelineData.events);
      } else {
        // Subsequent pages - append new events
        setAllTimelineEvents((prev) => [...prev, ...timelineData.events]);
      }
      setTimelinePagination({
        total: timelineData.total || 0,
        total_pages: timelineData.total_pages || 0,
      });
    }
  }, [timelineData, timelinePage]);
  const { data: auditLogsResponse, isLoading: auditLogsLoading } = useTrackerEntryAuditLogs(
    entrySlug,
    { 
      page: auditLogsPage, 
      per_page: auditLogsPerPage,
      action: auditLogsActionFilter !== "all" ? auditLogsActionFilter : undefined
    }
  );
  
  // Reset page when filter changes
  useEffect(() => {
    setAuditLogsPage(1);
  }, [auditLogsActionFilter]);
  
  // Extract logs and pagination info from response
  const auditLogs = useMemo(() => {
    if (!auditLogsResponse) return [];
    return auditLogsResponse.logs || [];
  }, [auditLogsResponse]);
  
  const auditLogsPagination = useMemo(() => {
    if (!auditLogsResponse) return { page: 1, per_page: auditLogsPerPage, total: 0, total_pages: 0 };
    return {
      page: auditLogsResponse.page || 1,
      per_page: auditLogsResponse.per_page || auditLogsPerPage,
      total: auditLogsResponse.total || 0,
      total_pages: auditLogsResponse.total_pages || 0,
    };
  }, [auditLogsResponse]);
  // Use entry ID for comments (comments API might still use ID)
  const { data: commentsData } = useComments("tracker_entry", entry?.id?.toString() || entrySlug);
  const updateEntryMutation = useUpdateTrackerEntry();

  // Fetch attachments for this entry (Phase 4.4)
  const entitySlugForFiles = entry?.id?.toString() || entrySlug;
  useEffect(() => {
    if (!entitySlugForFiles) return;
    setAttachmentsLoading(true);
    filesService
      .getEntityAttachments("tracker_entry", entitySlugForFiles)
      .then((res) => setAttachments(res?.attachments || []))
      .catch(() => setAttachments([]))
      .finally(() => setAttachmentsLoading(false));
  }, [entitySlugForFiles]);
  
  // Fetch tracker form using form_id from entry
  const { data: trackersResponse } = useTrackers({ page: 1, per_page: 100 });
  const tracker = useMemo(() => {
    if (!entry?.form_id || !trackersResponse) return null;
    const trackers = Array.isArray(trackersResponse) 
      ? trackersResponse 
      : trackersResponse.trackers || trackersResponse.forms || [];
    const foundTracker = trackers.find((t) => t.id === entry.form_id);
    // Debug: Log tracker category
    if (foundTracker) {
      console.log("Tracker found:", { id: foundTracker.id, name: foundTracker.name, category: foundTracker.category });
    }
    return foundTracker;
  }, [entry?.form_id, trackersResponse]);

  // Use persistent tracker entry number from backend
  // This is calculated based on creation order within the tracker
  const entryNumber = entry?.tracker_entry_number || entry?.id || null;

  // Helper to format field value for header (simplified version)
  const formatValueForHeader = React.useCallback((field, value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    
    const fieldType = field?.type || field?.field_type;
    
    // Handle different field types
    if (fieldType === "date" && value) {
      try {
        return format(parseUTCDate(value), "MMM d, yyyy");
      } catch (e) {
        return String(value);
      }
    }
    
    if (fieldType === "datetime" && value) {
      try {
        return format(parseUTCDate(value), "MMM d, yyyy HH:mm");
      } catch (e) {
        return String(value);
      }
    }
    
    // Handle select fields - show label if available
    if ((fieldType === "select" || fieldType === "multiselect") && field?.options) {
      if (Array.isArray(value)) {
        return value.map(v => {
          const option = field.options.find(opt => String(opt.value) === String(v) || String(opt.label) === String(v));
          return option?.label || v;
        }).join(", ");
      } else {
        const option = field.options.find(opt => String(opt.value) === String(value) || String(opt.label) === String(value));
        return option?.label || value;
      }
    }
    
    // Handle people/user fields
    if ((fieldType === "people" || fieldType === "user") && typeof value === "object" && value !== null) {
      if (value.display_name) return value.display_name;
      const nameParts = [];
      if (value.first_name) nameParts.push(value.first_name);
      if (value.last_name) nameParts.push(value.last_name);
      if (nameParts.length > 0) return nameParts.join(" ");
      if (value.email) return value.email;
      if (value.id) return `User #${value.id}`;
    }
    
    // Default: return string value
    return String(value);
  }, []);

  // Find heading value to display in header (description, title, name, or tracker name)
  const headingValue = React.useMemo(() => {
    if (!entry || !tracker) return tracker?.name || "Tracker Entry";
    
    const trackerFields = tracker?.tracker_fields?.fields || [];
    const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
    
    // Priority order: description -> title -> name
    const priorityKeywords = ["description", "title", "name"];
    
    // Try to find field by priority keywords
    for (const keyword of priorityKeywords) {
      const field = trackerFields.find(f => {
        const fieldName = (f.name || "").toLowerCase();
        const fieldLabel = (f.label || "").toLowerCase();
        return fieldName.includes(keyword) || fieldLabel.includes(keyword);
      });
      
      if (field) {
        const fieldId = field.id || field.name || field.field_id;
        const value = fieldId ? displayData[fieldId] : null;
        if (value !== null && value !== undefined && value !== "" && String(value).trim()) {
          const formatted = formatValueForHeader(field, value);
          if (formatted) {
            // Limit length for header display
            return formatted.length > 100 ? formatted.substring(0, 100) + "..." : formatted;
          }
        }
      }
    }
    
    // If no description/title/name found, use tracker name
    return tracker.name || "Tracker Entry";
  }, [entry, tracker, formatValueForHeader]);

  // Initialize form data when entry loads
  useEffect(() => {
    if (entry) {
      // Use submission_data or formatted_data (API returns submission_data)
      setEntryData(entry.submission_data || entry.formatted_data || entry.entry_data || {});
      setEntryStatus(entry.status || "open");
    }
  }, [entry]);

  // Debug: Log field structure when entry and tracker are loaded
  useEffect(() => {
    if (entry && tracker) {
      const trackerFields = tracker?.tracker_fields?.fields || [];
      const displayData = entry.formatted_data || entry.submission_data || {};
      console.log("Tracker Entry Debug:", {
        entry_data_keys: Object.keys(displayData),
        tracker_fields_structure: trackerFields.map(f => ({
          id: f.id,
          field_id: f.field_id,
          name: f.name,
          label: f.label,
          type: f.type || f.field_type,
        })),
        sample_field_matching: trackerFields.slice(0, 2).map(f => {
          const fieldId = f.field_id || f.id || f.name;
          return {
            field: { id: f.id, field_id: f.field_id, name: f.name },
            fieldId_used: fieldId,
            value_found: fieldId ? displayData[fieldId] : null,
          };
        }),
      });
    }
  }, [entry, tracker]);

  // Show error if there's an API error
  if (entryError) {
    console.error("TrackerEntryDetailPage - API Error:", entryError);
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Error loading entry</h3>
        <p className="text-muted-foreground mb-4">
          {entryError?.response?.data?.detail || entryError?.message || "An error occurred"}
        </p>
        <Link href="/admin/trackers">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
      </div>
    );
  }

  if (entryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-muted-foreground">Loading entry {entrySlug}...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Entry not found</h3>
        <p className="text-muted-foreground mb-2">Slug: {entrySlug}</p>
        <p className="text-sm text-muted-foreground mb-4">
          The entry you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link href="/admin/trackers">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
      </div>
    );
  }

  // Check if user has permission to read this entry
  if (!canReadEntry) {
    return (
      <div className="space-y-4">
        <Link href="/admin/trackers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to view this tracker entry</p>
        </div>
      </div>
    );
  }

  const trackerFields = tracker?.tracker_fields?.fields || [];
  const trackerConfig = tracker?.tracker_config || {};
  // Sections can live in form_config (tracker_config) or in form_fields (tracker_fields) for patient-referral-style configs
  const sections = (trackerConfig.sections?.length ? trackerConfig.sections : tracker?.tracker_fields?.sections) || [];

  // Phase 5.4: Closed cases are read-only (no edit, no status change, no actions)
  const isClosed = Boolean(entry?.status && String(entry.status).startsWith("Closed"));
  const canEditCase = canUpdateEntry && !isClosed;

  // Phase 5.2: Can send SMS when case has phone + consent and not closed
  const submissionData = entry?.submission_data || entry?.formatted_data || {};
  const hasPhone = Boolean((submissionData.phone || "").toString().trim());
  const hasSmsConsent = submissionData.sms_consent === "yes" || submissionData.sms_consent === true;
  const canSendSms = canEditCase && tracker?.tracker_config?.is_patient_referral && hasPhone && hasSmsConsent;

  // Format field value for read-only display
  const formatFieldValue = (field, value) => {
    const fieldType = field.type || field.field_type;

    // Repeatable group: value is array of row objects
    if (fieldType === "repeatable_group") {
      const rows = Array.isArray(value) ? value : [];
      if (rows.length === 0) return "—";
      const childFields = field.fields || [];
      return (
        <div className="space-y-2 mt-1">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="rounded border p-2 bg-muted/30 text-sm">
              {childFields.map((child) => {
                const cid = child.id || child.name || child.field_id;
                const cval = row[cid];
                return (
                  <div key={cid}>
                    <span className="text-muted-foreground">{child.label || cid}: </span>
                    {cval != null && cval !== "" ? String(cval) : "—"}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    if (value === null || value === undefined || value === "") {
      return "—";
    }
    
    // Handle different field types
    if (fieldType === "date" && value) {
      try {
        return format(parseUTCDate(value), "MMM d, yyyy");
      } catch (e) {
        return String(value);
      }
    }
    
    if (fieldType === "datetime" && value) {
      try {
        return format(parseUTCDate(value), "MMM d, yyyy HH:mm");
      } catch (e) {
        return String(value);
      }
    }
    
    // Handle select fields - show label if available
    if ((fieldType === "select" || fieldType === "multiselect") && field.options) {
      if (Array.isArray(value)) {
        return value.map(v => {
          const option = field.options.find(opt => String(opt.value) === String(v) || String(opt.label) === String(v));
          return option?.label || v;
        }).join(", ");
      } else {
        const option = field.options.find(opt => String(opt.value) === String(value) || String(opt.label) === String(value));
        return option?.label || value;
      }
    }
    
    // Handle people/user fields
    if ((fieldType === "people" || fieldType === "user") && typeof value === "object" && value !== null) {
      // Extract display name from the user object
      if (value.display_name) {
        return value.display_name;
      }
      // Build name from first_name and last_name
      const nameParts = [];
      if (value.first_name) nameParts.push(value.first_name);
      if (value.last_name) nameParts.push(value.last_name);
      if (nameParts.length > 0) {
        return nameParts.join(" ");
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
    
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Group fields by section: use section.fields (list of field ids) when present, else field.section
  const fieldsBySection = sections.reduce((acc, section, index) => {
    const sectionKey = section.id ?? section.title ?? section.label ?? `section-${index}`;
    const sectionFields = (section.fields?.length)
      ? (section.fields || []).map((fid) => trackerFields.find((f) => (f.id || f.name || f.field_id) === fid)).filter(Boolean)
      : trackerFields.filter((field) => field.section === section.id || field.section === sectionKey);
    acc[sectionKey] = {
      ...section,
      id: section.id ?? sectionKey,
      fields: sectionFields,
    };
    return acc;
  }, {});

  // Fields without section (section: null or undefined)
  const fieldsWithoutSection = trackerFields.filter((field) => !field.section || field.section === null);

  const comments = commentsData?.comments || commentsData || [];

  // Handle field value changes
  const handleFieldChange = (fieldId, value) => {
    setEntryData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Validate form (field required + status guardrails when changing status)
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    trackerFields.forEach((field) => {
      const fieldId = field.id || field.name;
      const isRequired = field.required || false;
      const value = entryData[fieldId];

      if (isRequired && (value === undefined || value === null || value === "")) {
        errors[fieldId] = `${field.label || field.name} is required`;
        isValid = false;
      }
    });

    // Status guardrails: when setting a status that requires specific fields, validate them
    const statusGuardrails = tracker?.tracker_config?.status_guardrails || {};
    const guardrail = statusGuardrails[entryStatus];
    if (guardrail?.required_fields?.length) {
      guardrail.required_fields.forEach((fieldId) => {
        const value = entryData[fieldId];
        const isEmpty = value === undefined || value === null || (typeof value === "string" && !value.trim());
        if (isEmpty) {
          const label = fieldId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          errors[fieldId] = guardrail.message || `${label} is required when setting this status`;
          isValid = false;
        }
      });
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    // Status is only the tracker's default status (top "Change Status" dropdown). current_status in the form is just a normal field.
    try {
      await updateEntryMutation.mutateAsync({
        entryIdentifier: entrySlug,
        entryData: {
          submission_data: entryData,
          status: entryStatus,
        },
      });
      setIsEditing(false);
      toast.success("Entry updated successfully");
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === "object" ? detail?.message : detail;
      const guardrailErrors = typeof detail === "object" ? detail?.guardrail_errors : null;
      const toShow = message || (Array.isArray(guardrailErrors) ? guardrailErrors.join(" ") : String(detail || error?.message));
      if (toShow) toast.error(toShow);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset to original values
    if (entry) {
      // Use submission_data or formatted_data (API returns submission_data)
      setEntryData(entry.submission_data || entry.formatted_data || entry.entry_data || {});
      setEntryStatus(entry.status || "open");
    }
    setFieldErrors({});
    setIsEditing(false);
  };

  const stageMapping = tracker?.tracker_config?.stage_mapping || [];
  const currentStage = String(entry?.formatted_data?.derived_stage ?? "").trim();
  const currentStageIndex = stageMapping.findIndex((s) => String(s?.stage ?? s?.name ?? "").trim() === currentStage);
  const hasNextStage = currentStageIndex >= 0 && currentStageIndex < stageMapping.length - 1;
  const nextStageLabel = hasNextStage ? (stageMapping[currentStageIndex + 1]?.stage ?? stageMapping[currentStageIndex + 1]?.name ?? "Next stage") : null;

  const handleStageChange = (stageName) => {
    const name = (stageName ?? "").toString().trim();
    if (!name || stageMapping.length === 0) return;
    if (name === currentStage) return;
    setStageChangePending({ stageLabel: name, stageName: name });
    setStageChangeNotes("");
  };

  const handleNextStage = () => {
    if (!hasNextStage || !nextStageLabel) return;
    setStageChangePending({ stageLabel: nextStageLabel, stageName: nextStageLabel });
    setStageChangeNotes("");
  };

  const confirmStageChangeWithNotes = async () => {
    if (!stageChangePending) return;
    const { stageName } = stageChangePending;
    try {
      const entryDataPayload = { stage: stageName };
      if (stageChangeNotes != null && String(stageChangeNotes).trim() !== "")
        entryDataPayload.notes = String(stageChangeNotes).trim();
      await updateEntryMutation.mutateAsync({
        entryIdentifier: entrySlug,
        entryData: entryDataPayload,
      });
      setStageChangePending(null);
      setStageChangeNotes("");
      toast.success(`Moved to ${stageName}`);
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === "object" ? detail?.message : detail;
      toast.error(message || "Failed to move stage");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/trackers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {headingValue}
            </h1>
            <div className="space-y-1">
              {tracker && (
                <div className="flex items-center gap-2 flex-wrap">
                  {headingValue !== tracker.name && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {tracker.name}
                    </p>
                  )}
                  {tracker.category && (
                    <Badge variant="secondary" className="text-xs">
                      {tracker.category}
                    </Badge>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Created {entry.created_at ? format(parseUTCDate(entry.created_at), "PPp") : "—"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Select value={entryStatus} onValueChange={setEntryStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(tracker?.tracker_config?.statuses || ["open", "in_progress", "pending", "resolved", "closed"]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {humanizeStatusForDisplay(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSave} disabled={updateEntryMutation.isPending}>
                {updateEntryMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-sm">
                {humanizeStatusForDisplay(entry.status || "open")}
              </Badge>
              {canEditCase && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              )}
              {isClosed && (
                <Badge variant="secondary" className="text-xs">Read-only (closed)</Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Phase 4.1: Snapshot panel – Status, Chase Due, Next Appt, Owner (prominent for patient-referral) */}
      <Card className="border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Case #</span>
              <span className="font-semibold">#{entryNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge variant="outline" className="font-normal">{humanizeStatusForDisplay(entry?.status || "open")}</Badge>
            </div>
            {tracker?.tracker_config?.use_stages !== false && tracker?.tracker_config?.stage_mapping?.length > 0 && (
              <div className="w-full basis-full flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-muted-foreground shrink-0">Stages:</span>
                {(tracker.tracker_config.stage_mapping || []).map((item, index) => {
                  const stageName = item?.stage ?? item?.name ?? "";
                  if (!stageName) return null;
                  const isCurrent = (entry?.formatted_data?.derived_stage ?? "") === stageName;
                  const stages = tracker.tracker_config.stage_mapping || [];
                  const isLast = index === stages.length - 1;
                  return (
                    <React.Fragment key={stageName}>
                      <Badge
                        variant={isCurrent ? "default" : "outline"}
                        className={cn(
                          "font-normal",
                          isCurrent && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        {stageName}
                      </Badge>
                      {!isLast && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase 4.2 / 5.2: Actions – Change Status, Next stage, Add Note, Create Task, Send SMS (5.4: disabled when closed) */}
      {canEditCase && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Change Status
          </Button>
          {tracker?.tracker_config?.use_stages !== false && stageMapping.length > 0 && (
            <>
              {hasNextStage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextStage}
                  disabled={updateEntryMutation.isPending}
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Next stage
                </Button>
              )}
              <Select
                value={currentStage || ""}
                onValueChange={(value) => value && handleStageChange(value)}
              >
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {!currentStage && <SelectItem value="">—</SelectItem>}
                  {(tracker.tracker_config.stage_mapping || []).map((item) => {
                    const stageName = item?.stage ?? item?.name ?? "";
                    if (!stageName) return null;
                    const isCurrent = (entry?.formatted_data?.derived_stage ?? "") === stageName;
                    return (
                      <SelectItem key={stageName} value={stageName}>
                        {stageName}{isCurrent ? " (current)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("notes")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Add Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCreateTaskForm({
                title: `Task for case #${entryNumber}`,
                due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                task_type: "",
              });
              setIsCreateTaskModalOpen(true);
            }}
          >
            <ListTodo className="mr-2 h-4 w-4" />
            Create Task
          </Button>
          {canSendSms && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSendSmsTemplate("please_contact_us"); setIsSendSmsModalOpen(true); }}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Send SMS
            </Button>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-1 px-1 sm:overflow-x-visible sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-max sm:w-auto">
            <TabsTrigger value="details">
              <FileText className="mr-2 h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="mr-2 h-4 w-4" />
              Notes & Files ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="mr-2 h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {/* Complete Triage: when status is Awaiting Triage and tracker has triage_outcome */}
          {!isEditing && canEditCase && entry?.status === "Awaiting Triage" && tracker?.tracker_fields?.fields?.some((f) => (f.id || f.name) === "triage_outcome") && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle>Complete Triage</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select triage outcome and submit to move this case to Action Required (PSA).
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Triage outcome</Label>
                  <Select value={triageOutcome} onValueChange={setTriageOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct_to_procedure">Direct to test – procedure</SelectItem>
                      <SelectItem value="f2f_tc">F2F / TC appointment required</SelectItem>
                      <SelectItem value="requires_bloods">Requires bloods</SelectItem>
                      <SelectItem value="requires_further_info">Requires further information</SelectItem>
                      <SelectItem value="rejected">Rejected (refer back)</SelectItem>
                      <SelectItem value="onward_referred">Onward referred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  disabled={!triageOutcome || triageSubmitting}
                  onClick={async () => {
                    if (!triageOutcome) return;
                    setTriageSubmitting(true);
                    try {
                      const currentData = entry?.submission_data || entry?.formatted_data || {};
                      await updateEntryMutation.mutateAsync({
                        entryIdentifier: entrySlug,
                        entryData: {
                          submission_data: { ...currentData, triage_outcome: triageOutcome },
                          status: "Triage Completed – Action Required",
                        },
                      });
                      setTriageOutcome("");
                      toast.success("Triage completed. Case moved to Action Required.");
                    } catch (err) {
                      const d = err?.response?.data?.detail;
                      toast.error(typeof d === "object" ? d?.message : d || "Failed to complete triage");
                    } finally {
                      setTriageSubmitting(false);
                    }
                  }}
                >
                  {triageSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete Triage
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create rebook task: when status is DNA – Consultation or DNA – Procedure */}
          {!isEditing && canEditCase && (entry?.status === "DNA – Consultation" || entry?.status === "DNA – Procedure") && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle>Rebook</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create a task to rebook this patient after DNA.
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  disabled={rebookTaskSubmitting}
                  onClick={async () => {
                    setRebookTaskSubmitting(true);
                    try {
                      const due = new Date();
                      due.setDate(due.getDate() + 7);
                      await createTaskMutation.mutateAsync({
                        title: "Rebook patient (DNA)",
                        task_type: "rebook",
                        description: `Rebook after DNA – ${entry?.status || "DNA"}. Tracker entry: ${entrySlug}`,
                        form_submission_id: entry?.id,
                        form_id: entry?.form_id,
                        due_date: due.toISOString(),
                        status: "pending",
                        priority: "medium",
                      });
                      toast.success("Rebook task created.");
                    } catch (err) {
                      const d = err?.response?.data?.detail;
                      toast.error(typeof d === "object" ? d?.message : d || "Failed to create rebook task");
                    } finally {
                      setRebookTaskSubmitting(false);
                    }
                  }}
                >
                  {rebookTaskSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create rebook task
                </Button>
              </CardContent>
            </Card>
          )}

          {isEditing ? (
            <div className="space-y-4">
              {/* Render fields without sections first */}
              {fieldsWithoutSection.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fieldsWithoutSection.map((field) => {
                      const fieldId = field.id || field.name || field.field_id;
                      const value = entryData[fieldId];
                      return (
                        <CustomFieldRenderer
                          key={fieldId}
                          field={{
                            ...field,
                            type: field.type || field.field_type,
                            field_label: field.label || field.field_label || field.name, // Map label to field_label for CustomFieldRenderer
                            field_name: field.name || field.id, // Map name to field_name
                          }}
                          value={value}
                          onChange={handleFieldChange}
                          error={fieldErrors[fieldId]}
                          readOnly={false}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Render fields by section for editing */}
              {sections.length > 0 && (
                sections.map((section, sectionIndex) => {
                  const sectionKey = section.id ?? section.title ?? section.label ?? `section-${sectionIndex}`;
                  const sectionFields = fieldsBySection[sectionKey]?.fields || [];
                  if (sectionFields.length === 0) return null;

                  return (
                    <Card key={sectionKey}>
                      <CardHeader>
                        <CardTitle>{section.label || section.id}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sectionFields.map((field) => {
                          const fieldId = field.id || field.name || field.field_id;
                          const value = entryData[fieldId];
                          return (
                            <CustomFieldRenderer
                              key={fieldId}
                              field={{
                                ...field,
                                type: field.type || field.field_type,
                                field_label: field.label || field.field_label || field.name, // Map label to field_label for CustomFieldRenderer
                                field_name: field.name || field.id, // Map name to field_name
                              }}
                              value={value}
                              onChange={handleFieldChange}
                              error={fieldErrors[fieldId]}
                              readOnly={false}
                            />
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Fallback: If no sections and no fields without sections, show all fields */}
              {sections.length === 0 && fieldsWithoutSection.length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trackerFields.length > 0 ? (
                      trackerFields.map((field) => {
                        const fieldId = field.id || field.name || field.field_id;
                        const value = entryData[fieldId];
                        return (
                          <CustomFieldRenderer
                            key={fieldId}
                            field={{
                              ...field,
                              type: field.type || field.field_type,
                              field_label: field.label || field.field_label || field.name, // Map label to field_label for CustomFieldRenderer
                              field_name: field.name || field.id, // Map name to field_name
                            }}
                            value={value}
                            onChange={handleFieldChange}
                            error={fieldErrors[fieldId]}
                            readOnly={false}
                          />
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No fields defined for this tracker
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>
          ) : (
            <div className="space-y-4">
              {/* Render fields without sections first */}
              {fieldsWithoutSection.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fieldsWithoutSection.map((field) => {
                      // Prefer formatted_data for display, fallback to submission_data
                      const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                      
                      // Fields use 'id' or 'name' to match submission_data keys (not 'field_id')
                      // Priority: id -> name -> field_id (for backward compatibility)
                      const fieldId = field.id || field.name || field.field_id;
                      
                      // Get value from displayData using the field identifier
                      const value = fieldId ? displayData[fieldId] : null;
                      
                      return (
                        <div key={field.id || field.name || field.field_id}>
                          <label className="text-sm font-medium text-muted-foreground">
                            {field.label || "Untitled Field"}
                          </label>
                          <div className="mt-1">
                            <div className="text-sm">{formatFieldValue(field, value)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Render fields by section */}
              {sections.length > 0 ? (
                sections.map((section, sectionIndex) => {
                  const sectionKey = section.id ?? section.title ?? section.label ?? `section-${sectionIndex}`;
                  const sectionFields = fieldsBySection[sectionKey]?.fields || [];
                  if (sectionFields.length === 0) return null;

                  return (
                    <Card key={sectionKey}>
                      <CardHeader>
                        <CardTitle>{section.label || section.id}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sectionFields.map((field) => {
                          // Prefer formatted_data for display, fallback to submission_data
                          const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                          
                          // Fields use 'id' or 'name' to match submission_data keys (not 'field_id')
                          // Priority: id -> name -> field_id (for backward compatibility)
                          const fieldId = field.id || field.name || field.field_id;
                          
                          // Get value from displayData using the field identifier
                          const value = fieldId ? displayData[fieldId] : null;
                          
                          return (
                            <div key={field.id || field.name || field.field_id}>
                              <label className="text-sm font-medium text-muted-foreground">
                                {field.label || "Untitled Field"}
                              </label>
                              <div className="mt-1">
                                <div className="text-sm">{formatFieldValue(field, value)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              ) : null}
              
              {/* Fallback: If no sections and no fields without sections, show all fields */}
              {sections.length === 0 && fieldsWithoutSection.length === 0 ? (
                // If no sections, render all fields in a single card
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trackerFields.length > 0 ? (
                      trackerFields.map((field) => {
                        // Prefer formatted_data for display, fallback to submission_data
                        const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                        
                        // Fields use 'id' or 'name' to match submission_data keys (not 'field_id')
                        // Priority: id -> name -> field_id (for backward compatibility)
                        const fieldId = field.id || field.name || field.field_id;
                        
                        // Get value from displayData using the field identifier
                        const value = fieldId ? displayData[fieldId] : null;
                        
                        return (
                          <div key={field.id || field.name || field.field_id}>
                            <label className="text-sm font-medium text-muted-foreground">
                              {field.label || "Untitled Field"}
                            </label>
                            <div className="mt-1">
                              <div className="text-sm">{formatFieldValue(field, value)}</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No fields defined for this tracker
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

            </div>
          )}
        </TabsContent>

        {/* Notes & Files Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes, Comments & Files</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add comments and attach files. Files can be attached to specific comments for better context.
              </p>
            </CardHeader>
            <CardContent>
              <CommentThread
                entityType="tracker_entry"
                entitySlug={entry?.id?.toString() || entrySlug}
                noteCategories={tracker?.tracker_config?.note_categories || []}
              />
            </CardContent>
          </Card>

          {/* Phase 4.4: Attachments – Referral PDF and other files */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments
                </CardTitle>
                {canEditCase && (
                  <label className="cursor-pointer">
                    <span className="sr-only">Upload file</span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length || !entitySlugForFiles) return;
                        setAttachmentUploading(true);
                        try {
                          await filesService.attachFiles("tracker_entry", entitySlugForFiles, files);
                          const res = await filesService.getEntityAttachments("tracker_entry", entitySlugForFiles);
                          setAttachments(res?.attachments || []);
                          toast.success(`Uploaded ${files.length} file(s)`);
                        } catch (err) {
                          toast.error(err?.response?.data?.detail || "Upload failed");
                        } finally {
                          setAttachmentUploading(false);
                          e.target.value = "";
                        }
                      }}
                      disabled={attachmentUploading}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        {attachmentUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Upload
                      </span>
                    </Button>
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Referral PDF and other documents attached to this case.
              </p>
            </CardHeader>
            <CardContent>
              {attachmentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No attachments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between rounded border px-3 py-2">
                      <span className="text-sm truncate">{att.description || att.file_name || `File #${att.file_id}`}</span>
                      {att.download_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(att.download_url, "_blank")}
                        >
                          Download
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : allTimelineEvents && allTimelineEvents.length > 0 ? (
                <div className="relative">
                  {/* Vertical line in the center */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2" />
                  
                  {/* Timeline events */}
                  <div className="space-y-8">
                    {allTimelineEvents.map((event, index) => {
                      // Alternate between left and right (0 = left, 1 = right)
                      const isLeft = index % 2 === 0;
                      
                      return (
                        <div
                          key={event.id || index}
                          className={`relative flex ${isLeft ? "justify-start" : "justify-end"}`}
                        >
                          {/* Event content */}
                          <div className={`w-[45%] ${isLeft ? "pr-8 text-right" : "pl-8 text-left"}`}>
                            <div className="bg-card border rounded-lg p-4 shadow-sm">
                              <div className="flex flex-col">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium">{event.title}</h4>
                                    {event.note_category && (
                                      <Badge variant="secondary" className="text-xs">
                                        {event.note_category}
                                      </Badge>
                                    )}
                                    {(event.contact_method || event.contact_outcome) && (
                                      <span className="text-xs text-muted-foreground">
                                        {[event.contact_method, event.contact_outcome].filter(Boolean).join(" · ")}
                                      </span>
                                    )}
                                  </div>
                                  {(event.type === "field_updates" || event.type === "created_fields" || event.type === "created") && event.changes?.length > 0 ? (
                                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-none pl-0">
                                      {event.changes.map((c, i) => (
                                        <li key={c.field_id || i} className="break-words">
                                          {event.type === "field_updates"
                                            ? `${c.field_label}: ${c.old_value ?? "—"} → ${c.new_value ?? "—"}`
                                            : `${c.field_label}: ${c.new_value ?? "—"}`}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : event.description ? (
                                    <p className="text-sm text-muted-foreground mt-2 break-words">
                                      {formatTimelineDescription(event.description, event)}
                                    </p>
                                  ) : null}
                                </div>
                                <div className={`flex flex-col ${isLeft ? "items-end" : "items-start"} mt-3 pt-3 border-t`}>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(parseUTCDate(event.timestamp), "PPp")}
                          </span>
                                  {event.user_name && (
                                    <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                                      by {event.user_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Center dot */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background z-10" />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Load More button */}
                  {timelinePagination.total_pages > timelinePage && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setTimelinePage((prev) => prev + 1)}
                        disabled={timelineLoading}
                      >
                        {timelineLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          `Load More (${timelinePagination.total - allTimelineEvents.length} remaining)`
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No timeline events yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle>Audit History</CardTitle>
                <Select
                  value={auditLogsActionFilter}
                  onValueChange={setAuditLogsActionFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => {
                    // Helper to get field label from field ID
                    const getFieldLabel = (fieldId) => {
                      const field = trackerFields.find(
                        (f) => f.id === fieldId || f.name === fieldId || f.field_id === fieldId
                      );
                      return field?.label || fieldId;
                    };

                    // Format audit log changes
                    const formatAuditChanges = () => {
                      const changes = [];
                      
                      // Handle submission_data changes (tracker entry field changes)
                      if (log.old_values?.submission_data || log.new_values?.submission_data) {
                        const oldData = log.old_values?.submission_data || {};
                        const newData = log.new_values?.submission_data || {};
                        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
                        
                        allKeys.forEach((key) => {
                          const oldVal = oldData[key];
                          const newVal = newData[key];
                          
                          if (oldVal !== newVal) {
                            const field = trackerFields.find(
                              (f) => f.id === key || f.name === key || f.field_id === key
                            );
                            const fieldLabel = field?.label || key;
                            const formattedOld = field ? formatFieldValue(field, oldVal) : (oldVal ?? "—");
                            const formattedNew = field ? formatFieldValue(field, newVal) : (newVal ?? "—");
                            
                            changes.push({
                              field: fieldLabel,
                              old: formattedOld,
                              new: formattedNew,
                            });
                          }
                        });
                      }
                      
                      // Handle status changes
                      if (log.old_values?.status !== log.new_values?.status) {
                        changes.push({
                          field: "Status",
                          old: log.old_values?.status || "—",
                          new: log.new_values?.status || "—",
                        });
                      }
                      
                      // Handle submission_status changes
                      if (log.old_values?.submission_status !== log.new_values?.submission_status) {
                        changes.push({
                          field: "Status",
                          old: log.old_values?.submission_status || "—",
                          new: log.new_values?.submission_status || "—",
                        });
                      }
                      
                      // Handle other direct field changes (non-nested)
                      if (log.old_values || log.new_values) {
                        const oldVals = log.old_values || {};
                        const newVals = log.new_values || {};
                        const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
                        
                        allKeys.forEach((key) => {
                          // Skip submission_data, status, submission_status, form_id as they're handled above or not useful
                          if (key === "submission_data" || key === "status" || key === "submission_status" || key === "form_id") return;
                          
                          const oldVal = oldVals[key];
                          const newVal = newVals[key];
                          
                          // Only show changes, not when both are null/undefined
                          if (oldVal !== newVal && (oldVal != null || newVal != null)) {
                            const fieldLabel = getFieldLabel(key);
                            changes.push({
                              field: fieldLabel,
                              old: oldVal ?? "—",
                              new: newVal ?? "—",
                            });
                          }
                        });
                      }
                      
                      return changes;
                    };
                    
                    // Format details JSON nicely - only show if there are no field changes
                    const formatDetails = (hasChanges) => {
                      if (!log.details) return null;
                      
                      let detailsObj = log.details;
                      
                      // If details is a string, try to parse it
                      if (typeof log.details === "string") {
                        try {
                          detailsObj = JSON.parse(log.details);
                        } catch (e) {
                          // Not JSON, return as is
                          return log.details;
                        }
                      }
                      
                      // If details is not an object, return as is
                      if (typeof detailsObj !== "object" || detailsObj === null) {
                        return null;
                      }
                      
                      // If we have field changes, only show meaningful processing results
                      if (hasChanges) {
                        if (detailsObj.processing_results) {
                          const results = detailsObj.processing_results;
                          const parts = [];
                          if (results.task_creation?.created === true) {
                            parts.push("Task created");
                          }
                          if (results.email_notifications && Object.keys(results.email_notifications).length > 0) {
                            parts.push("Email notifications sent");
                          }
                          if (results.conditional_logic?.processed === true) {
                            parts.push("Conditional logic processed");
                          }
                          return parts.length > 0 ? parts.join(" • ") : null;
                        }
                        return null;
                      }
                      
                      // If no changes, show formatted metadata or a simple message
                      const parts = [];
                      
                      // Handle form metadata - only if it's different from current tracker
                      if (detailsObj.form_name && detailsObj.form_name !== tracker?.slug) {
                        parts.push(`Form: ${detailsObj.form_name}`);
                      }
                      
                      // Handle status - only if it's meaningful
                      if (detailsObj.submission_status && log.action !== "create") {
                        parts.push(`Status: ${detailsObj.submission_status}`);
                      }
                      
                      // Handle processing results
                      if (detailsObj.processing_results) {
                        const results = detailsObj.processing_results;
                        if (results.task_creation?.created === true) {
                          parts.push("Task created");
                        }
                        if (results.email_notifications && Object.keys(results.email_notifications).length > 0) {
                          parts.push("Email notifications sent");
                        }
                        if (results.conditional_logic?.processed === true) {
                          parts.push("Conditional logic processed");
                        }
                      }
                      
                      // If we have parts, return formatted string
                      if (parts.length > 0) {
                        return parts.join(" • ");
                      }
                      
                      // If no meaningful parts but details exist, show a simple message based on action
                      if (log.action === "update") {
                        return "Update called but no changes detected";
                      } else if (log.action === "read") {
                        return "Entry viewed";
                      }
                      
                      return null;
                    };

                    const changes = formatAuditChanges();
                    const formattedDetails = formatDetails(changes.length > 0);

                    return (
                    <div key={log.id || index} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.user?.full_name || log.user?.email || "System"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(parseUTCDate(log.created_at), "PPp")}
                        </span>
                      </div>
                        
                        {changes.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {changes.map((change, changeIndex) => (
                              <div key={changeIndex} className="text-sm">
                                <span className="font-medium text-foreground">{change.field}:</span>{" "}
                                <span className="text-muted-foreground line-through">{change.old}</span>{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                <span className="text-foreground font-medium">{change.new}</span>
                              </div>
                            ))}
                            {formattedDetails && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {formattedDetails}
                        </p>
                      )}
                    </div>
                        ) : formattedDetails ? (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formattedDetails}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audit logs available
                </p>
              )}
              
              {/* Pagination */}
              {auditLogsPagination.total_pages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (auditLogsPage > 1) {
                              setAuditLogsPage(auditLogsPage - 1);
                            }
                          }}
                          className={auditLogsPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: auditLogsPagination.total_pages }, (_, i) => i + 1).map((pageNum) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === auditLogsPagination.total_pages ||
                          (pageNum >= auditLogsPage - 1 && pageNum <= auditLogsPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setAuditLogsPage(pageNum);
                                }}
                                isActive={pageNum === auditLogsPage}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (pageNum === auditLogsPage - 2 || pageNum === auditLogsPage + 2) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (auditLogsPage < auditLogsPagination.total_pages) {
                              setAuditLogsPage(auditLogsPage + 1);
                            }
                          }}
                          className={
                            auditLogsPage >= auditLogsPagination.total_pages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Phase 4.2: Create Task modal */}
      <Dialog open={isCreateTaskModalOpen} onOpenChange={setIsCreateTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Create a task linked to this case. It will be associated with this tracker entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={createTaskForm.title}
                onChange={(e) => setCreateTaskForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                value={createTaskForm.due_date}
                onChange={(e) => setCreateTaskForm((p) => ({ ...p, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!createTaskForm.title?.trim()) {
                  toast.error("Title is required");
                  return;
                }
                try {
                  await createTaskMutation.mutateAsync({
                    title: createTaskForm.title.trim(),
                    form_submission_id: entry?.id,
                    form_id: entry?.form_id,
                    due_date: createTaskForm.due_date ? new Date(createTaskForm.due_date).toISOString() : undefined,
                    status: "pending",
                    priority: "medium",
                  });
                  setIsCreateTaskModalOpen(false);
                  setCreateTaskForm({ title: "", due_date: "", task_type: "" });
                  toast.success("Task created");
                } catch (err) {
                  toast.error(err?.response?.data?.detail || "Failed to create task");
                }
              }}
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase 5.2: Send SMS modal */}
      <Dialog open={isSendSmsModalOpen} onOpenChange={setIsSendSmsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS</DialogTitle>
            <DialogDescription>
              Send an SMS to the patient. Phone and SMS consent must be set on this case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Template</Label>
              <Select value={sendSmsTemplate} onValueChange={setSendSmsTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment_reminder">Appointment reminder</SelectItem>
                  <SelectItem value="prep_reminder">Prep reminder</SelectItem>
                  <SelectItem value="please_contact_us">Please contact us</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendSmsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setSendSmsSubmitting(true);
                try {
                  const res = await trackersService.sendSmsFromEntry(entrySlug, { template_key: sendSmsTemplate });
                  setIsSendSmsModalOpen(false);
                  if (res?.success) {
                    toast.success("SMS sent. A note has been added to the timeline.");
                  } else {
                    toast.error(res?.error || "SMS could not be sent (check Twilio config).");
                  }
                } catch (err) {
                  const d = err?.response?.data?.detail;
                  toast.error(typeof d === "string" ? d : d?.message || "Failed to send SMS");
                } finally {
                  setSendSmsSubmitting(false);
                }
              }}
              disabled={sendSmsSubmitting}
            >
              {sendSmsSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage change: "Any notes?" dialog before moving to next stage */}
      <Dialog
        open={!!stageChangePending}
        onOpenChange={(open) => {
          if (!open) {
            setStageChangePending(null);
            setStageChangeNotes("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to {stageChangePending?.stageLabel ?? "next stage"}?</DialogTitle>
            <DialogDescription>Optionally add a note for this stage change.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="stage-change-notes">Any notes?</Label>
            <Textarea
              id="stage-change-notes"
              placeholder="e.g. Called patient, rebooked for next week"
              value={stageChangeNotes}
              onChange={(e) => setStageChangeNotes(e.target.value)}
              className="min-h-[80px] resize-y"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStageChangePending(null); setStageChangeNotes(""); }}>
              Cancel
            </Button>
            <Button onClick={confirmStageChangeWithNotes} disabled={updateEntryMutation.isPending}>
              {updateEntryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackerEntryDetailPage;

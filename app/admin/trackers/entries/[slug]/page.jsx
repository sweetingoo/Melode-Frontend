"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Edit, Save, X, Clock, MessageSquare, FileText, User as UserIcon, Calendar, CalendarClock, Paperclip, Smartphone, ChevronRight, ChevronDown, Link2, Share2, Bell, Phone, Mail, Plus, Send, MessageCircle, Globe, CheckCircle, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useTrackerEntry,
  useTrackerEntryTimeline,
  useTrackerEntryAuditLogs,
  useTrackerEntryInboundMessages,
  useTrackerEntrySmsThread,
  useUpdateTrackerEntry,
  useCreateTrackerAction,
  useCompleteTrackerAction,
  useTrackerEntryAppointments,
  useCreateTrackerAppointment,
  useUpdateTrackerAppointment,
  useTrackers,
  useTrackerEntries,
  useTracker,
  useUpdateTracker,
} from "@/hooks/useTrackers";
import { useComments } from "@/hooks/useComments";
import { useCreateTask, useTasks } from "@/hooks/useTasks";
import CommentThread from "@/components/CommentThread";
import { format, startOfDay, differenceInDays, addDays } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { humanizeStatusForDisplay } from "@/utils/slug";
import { getStageColor } from "@/utils/stageColors";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { api } from "@/services/api-client";
import { filesService } from "@/services/files";
import { trackersService } from "@/services/trackers";
import { cn } from "@/lib/utils";
import { checkGroupConditionalVisibility as checkGroupVisibility, checkLayoutRowVisibility } from "@/lib/groupConditionalVisibility";
import { getTrackersListReturnHrefFromStorage } from "@/utils/trackersListReturn";
import { filterNonEmptyGridColumns, gridRowFieldIdsFlat, normalizeGridRowColumns, trackerGridRowColsClass } from "@/utils/trackerGridLayout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ENTRY_DATA_TAB = "__entry_data__";

/** Match Melode tracker_field_utils — audit display only */
const TRACKER_CASE_CLOSED_KEY = "__melode_case_closed";
const TRACKER_SUBMISSION_STAGE_KEY = "__melode_tracker_stage";

// Generate action type id from label (same logic as tracker edit page)
const generateActionTypeId = (label) => {
  if (!label) return "";
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 100);
};

const ENTRY_DETAIL_TABS = ["activity", "forms", "communication", "notes", "audit"];

const TrackerEntryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissionsCheck();
  const canReadEntry = hasPermission("tracker_entry:read");
  const canUpdateEntry = hasPermission("tracker_entry:update");
  const canManageTracker = hasPermission("tracker:update");
  // Get slug from params - handle both 'slug' and 'entryId' for backward compatibility
  const entrySlug = params.slug || params.entryId;
  const tabFromUrl = searchParams?.get("tab");

  const [trackersListReturnHref, setTrackersListReturnHref] = useState("/admin/trackers");
  useEffect(() => {
    setTrackersListReturnHref(getTrackersListReturnHrefFromStorage());
  }, []);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "activity";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t && ENTRY_DETAIL_TABS.includes(t) ? t : "activity";
  });
  useEffect(() => {
    if (tabFromUrl && ENTRY_DETAIL_TABS.includes(tabFromUrl)) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);
  const handleTabChange = (value) => {
    setActiveTab(value);
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.set("tab", value);
    router.replace(`/admin/trackers/entries/${entrySlug}?${sp.toString()}`, { scroll: false });
  };
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
  const [sendSmsTemplate, setSendSmsTemplate] = useState("general");
  const [sendSmsMessage, setSendSmsMessage] = useState("");
  const [sendSmsPhoneField, setSendSmsPhoneField] = useState("");
  const [sendSmsSubmitting, setSendSmsSubmitting] = useState(false);
  const [acknowledgingMessageId, setAcknowledgingMessageId] = useState(null);
  const [stageChangePending, setStageChangePending] = useState(null);
  const [stageChangeNotes, setStageChangeNotes] = useState("");
  const [stageChangeStatus, setStageChangeStatus] = useState("");
  const [isChangeStatusDialogOpen, setIsChangeStatusDialogOpen] = useState(false);
  const [changeStatusStage, setChangeStatusStage] = useState("");
  const [changeStatusNote, setChangeStatusNote] = useState("");
  const [editModeStage, setEditModeStage] = useState("");
  const [activeStageTab, setActiveStageTab] = useState("");
  const [formsSubTab, setFormsSubTab] = useState("entry_data");
  const [communicationsSubTab, setCommunicationsSubTab] = useState("sms");
  const smsThreadScrollRef = useRef(null);
  const [entryLinkCopied, setEntryLinkCopied] = useState(false);
  const [shareableLinkCopied, setShareableLinkCopied] = useState(false);
  const [isLogActionOpen, setIsLogActionOpen] = useState(false);
  const [logActionType, setLogActionType] = useState("");
  const [logActionFreeText, setLogActionFreeText] = useState("");
  const [addActionTypeOpen, setAddActionTypeOpen] = useState(false);
  const [newActionTypeLabel, setNewActionTypeLabel] = useState("");
  const [newActionTypeChaseDays, setNewActionTypeChaseDays] = useState("");
  const [logActionNote, setLogActionNote] = useState("");
  const [logActionChaseDate, setLogActionChaseDate] = useState("");
  const [logActionNoChase, setLogActionNoChase] = useState(false);
  const [isCloseCaseDialogOpen, setIsCloseCaseDialogOpen] = useState(false);
  const [isReopenCaseDialogOpen, setIsReopenCaseDialogOpen] = useState(false);
  const [logSheetTab, setLogSheetTab] = useState("actions");
  const [logAppointmentDate, setLogAppointmentDate] = useState("");
  const [logAppointmentTime, setLogAppointmentTime] = useState("");
  const [logAppointmentType, setLogAppointmentType] = useState("");
  const [logAppointmentLocation, setLogAppointmentLocation] = useState("__none__");
  const [logAppointmentDuration, setLogAppointmentDuration] = useState("");
  const [logAppointmentStatus, setLogAppointmentStatus] = useState("");
  const [logAppointmentNote, setLogAppointmentNote] = useState("");
  const [addAppointmentTypeOpen, setAddAppointmentTypeOpen] = useState(false);
  const [newAppointmentTypeLabel, setNewAppointmentTypeLabel] = useState("");
  const [addAppointmentLocationOpen, setAddAppointmentLocationOpen] = useState(false);
  const [newAppointmentLocationLabel, setNewAppointmentLocationLabel] = useState("");
  const [addAppointmentStatusOpen, setAddAppointmentStatusOpen] = useState(false);
  const [newAppointmentStatusLabel, setNewAppointmentStatusLabel] = useState("");

  const { data: entry, isLoading: entryLoading, error: entryError, refetch: refetchEntry } = useTrackerEntry(entrySlug);
  const createTrackerActionMutation = useCreateTrackerAction();
  const completeTrackerActionMutation = useCompleteTrackerAction();
  const { data: appointmentsList = [], refetch: refetchAppointments } = useTrackerEntryAppointments(entrySlug);
  const createTrackerAppointmentMutation = useCreateTrackerAppointment();
  const updateTrackerAppointmentMutation = useUpdateTrackerAppointment();
  
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
  const { data: timelineData, isLoading: timelineLoading, refetch: refetchTimeline } = useTrackerEntryTimeline(entrySlug, timelinePage, timelinePerPage, {
    refetchInterval: activeTab === "communication" ? 10000 : false, // poll every 10s when on Communications tab
  });
  
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

  // Activity tab: do not list Comments, Files, or SMS messages (they have their own tabs)
  const activityTimelineEvents = useMemo(() => {
    if (!allTimelineEvents?.length) return [];
    return allTimelineEvents.filter(
      (e) => e.type !== "comment" && e.type !== "attachment" && e.type !== "inbound_sms"
    );
  }, [allTimelineEvents]);

  const { data: auditLogsResponse, isLoading: auditLogsLoading } = useTrackerEntryAuditLogs(
    entrySlug,
    { 
      page: auditLogsPage, 
      per_page: auditLogsPerPage,
      action: auditLogsActionFilter !== "all" ? auditLogsActionFilter : undefined
    }
  );
  const { data: inboundMessages = [], isLoading: inboundMessagesLoading } = useTrackerEntryInboundMessages(entrySlug, {
    refetchInterval: activeTab === "communication" ? 10000 : false, // poll every 10s when on Communications tab
  });
  const { data: smsThreadData, isLoading: smsThreadLoading, refetch: refetchSmsThread } = useTrackerEntrySmsThread(entrySlug, {
    refetchInterval: activeTab === "communication" ? 10000 : false,
  });

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
  const { data: entryTasksData } = useTasks(
    { form_submission_id: entry?.id, per_page: 20, sort_by: "due_date", order: "asc" },
    { enabled: !!entry?.id }
  );
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

  // Full tracker (for adding action types) and update mutation
  const { data: fullTracker } = useTracker(tracker?.slug ?? null, { enabled: !!tracker?.slug });
  const updateTrackerMutation = useUpdateTracker();

  // Use persistent tracker entry number from backend
  // This is calculated based on creation order within the tracker
  const entryNumber = entry?.tracker_entry_number || entry?.id || null;

  // Files uploaded at case creation (form file fields) – show in Attachments so triage can view referral PDF
  // Must be before any early returns to keep hook order consistent.
  const formFileAttachments = useMemo(() => {
    const displayData = entry?.formatted_data || entry?.submission_data || {};
    const fields = tracker?.tracker_fields?.fields || [];
    const list = [];
    fields.forEach((field) => {
      const ft = (field.type || field.field_type || "").toLowerCase();
      if (ft !== "file") return;
      const fieldId = field.id || field.name || field.field_id;
      const value = fieldId ? displayData[fieldId] : null;
      const fileRefId = typeof value === "object" && value !== null ? value.file_reference_id : null;
      const fileId = typeof value === "object" && value !== null ? value.file_id : typeof value === "number" ? value : null;
      const identifier = fileRefId ?? fileId ?? (typeof value === "string" && value.trim() ? value.trim() : null);
      if (identifier == null) return;
      const fileName = typeof value === "object" && value !== null ? value.file_name : null;
      const fileUrlPath = typeof value === "object" && value !== null && value.file_url ? value.file_url : `/settings/files/${identifier}/download`;
      list.push({
        key: `form-file-${fieldId}-${identifier}`,
        label: field.label || field.name || fieldId || "File",
        file_name: fileName || `File #${identifier}`,
        file_id: fileId,
        file_reference_id: fileRefId,
        file_url_path: fileUrlPath,
      });
    });
    return list;
  }, [entry?.formatted_data, entry?.submission_data, tracker?.tracker_fields?.fields]);

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
    if ((fieldType === "select" || fieldType === "multiselect" || fieldType === "table_radio") && field?.options) {
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

  // Stage mapping and statuses for target stage (must be before any early return to satisfy Rules of Hooks)
  const stageMappingForMemo = tracker?.tracker_config?.stage_mapping || [];
  const allTrackerStatuses = useMemo(
    () => (Array.isArray(tracker?.tracker_config?.statuses) ? tracker.tracker_config.statuses : []),
    [tracker?.tracker_config?.statuses]
  );

  const statusesForTargetStage = useMemo(() => {
    if (!stageChangePending?.stageName || !stageMappingForMemo?.length) return [];
    const item = stageMappingForMemo.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === stageChangePending.stageName);
    const stageStatuses = (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
    return stageStatuses.length > 0 ? stageStatuses : allTrackerStatuses;
  }, [stageChangePending?.stageName, stageMappingForMemo, allTrackerStatuses]);

  // Statuses for the stage selected in the "Change status" dialog (Stage → Status flow)
  const statusesForChangeStatusStage = useMemo(() => {
    if (!changeStatusStage || !stageMappingForMemo?.length) return [];
    const item = stageMappingForMemo.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === changeStatusStage);
    const stageStatuses = (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
    return stageStatuses.length > 0 ? stageStatuses : allTrackerStatuses;
  }, [changeStatusStage, stageMappingForMemo, allTrackerStatuses]);

  // In Change status dialog, restrict statuses by current stage's allowed_next_statuses when set
  const statusesForChangeStatusStageFiltered = useMemo(() => {
    const currentStageName = (entry?.formatted_data?.derived_stage ?? "").toString().trim();
    if (!currentStageName || !stageMappingForMemo?.length) return statusesForChangeStatusStage;
    const currentConfig = stageMappingForMemo.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === currentStageName);
    const allowed = currentConfig?.allowed_next_statuses;
    if (!allowed || !Array.isArray(allowed) || allowed.length === 0) return statusesForChangeStatusStage;
    return statusesForChangeStatusStage.filter((s) => allowed.includes(s));
  }, [statusesForChangeStatusStage, stageMappingForMemo, entry?.formatted_data?.derived_stage]);

  // Statuses for the stage selected in edit mode header (Stage → Status); when stage has no statuses, show all tracker statuses
  const statusesForEditModeStage = useMemo(() => {
    if (!editModeStage || !stageMappingForMemo?.length) return [];
    const item = stageMappingForMemo.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === editModeStage);
    const stageStatuses = (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
    return stageStatuses.length > 0 ? stageStatuses : allTrackerStatuses;
  }, [editModeStage, stageMappingForMemo, allTrackerStatuses]);

  // When current entry stage has allowed_next_statuses, restrict status dropdown to those only (for move to next stage)
  const statusesForEditModeStageFiltered = useMemo(() => {
    const currentStageName = (entry?.formatted_data?.derived_stage ?? "").toString().trim();
    if (!currentStageName || !stageMappingForMemo?.length) return statusesForEditModeStage;
    const currentConfig = stageMappingForMemo.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === currentStageName);
    const allowed = currentConfig?.allowed_next_statuses;
    if (!allowed || !Array.isArray(allowed) || allowed.length === 0) return statusesForEditModeStage;
    return statusesForEditModeStage.filter((s) => allowed.includes(s));
  }, [statusesForEditModeStage, stageMappingForMemo, entry?.formatted_data?.derived_stage]);

  // Stages the entry can move to from current stage (only allowed_next_stages). Never show stages that are not allowed.
  const stagesForEditModeDropdown = useMemo(() => {
    if (!stageMappingForMemo?.length) return [];
    const currentStageName = (entry?.formatted_data?.derived_stage ?? "").toString().trim();
    if (!currentStageName) return stageMappingForMemo;
    const currentConfig = stageMappingForMemo.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === currentStageName);
    const allowedNext = currentConfig?.allowed_next_stages;
    if (!Array.isArray(allowedNext)) return stageMappingForMemo;
    if (allowedNext.length === 0) return [];
    return stageMappingForMemo.filter((s) => {
      const name = (s?.stage ?? s?.name ?? "").toString().trim();
      return name && allowedNext.some((a) => (typeof a === "string" ? a : (a?.stage ?? a?.name ?? "")).toString().trim() === name);
    });
  }, [stageMappingForMemo, entry?.formatted_data?.derived_stage]);

  // Initialize form data when entry loads
  useEffect(() => {
    if (entry) {
      // Use submission_data or formatted_data (API returns submission_data)
      setEntryData(entry.submission_data || entry.formatted_data || entry.entry_data || {});
      setEntryStatus(entry.status || "open");
    }
  }, [entry]);

  // Defaults for all tracker fields (first-load visibility and radio first-option)
  // Must be before any early return to keep hook order consistent (Rules of Hooks).
  const entryDefaults = useMemo(() => {
    const fields = tracker?.tracker_fields?.fields || [];
    const out = {};
    const opts = (f) => f.field_options?.options || f.options || [];
    const getNoneValue = (field) => {
      const options = opts(field);
      const o = options.find((opt) => String(opt?.value ?? "").toLowerCase().trim() === "none" || String(opt?.label ?? "").toLowerCase().trim() === "none");
      return o && (o.value != null && o.value !== "") ? o.value : "none";
    };
    const firstOptionValue = (field) => {
      const options = opts(field);
      const o = options[0];
      return o != null && (o.value != null && o.value !== "") ? o.value : o?.label;
    };
    fields.forEach((field) => {
      const fieldId = field.id || field.name || field.field_id;
      if (!fieldId) return;
      const type = (field.type || field.field_type || "").toLowerCase();
      if (type === "select" || type === "dropdown") out[fieldId] = getNoneValue(field);
      else if (type === "multiselect") out[fieldId] = [getNoneValue(field)];
      else if (type === "boolean" || type === "checkbox") out[fieldId] = false;
      else if ((type === "radio" || type === "radio_group") && opts(field).length > 0) out[fieldId] = firstOptionValue(field);
    });
    return out;
  }, [tracker?.id, tracker?.tracker_fields?.fields]);

  const effectiveEntryData = useMemo(() => ({ ...entryDefaults, ...entryData }), [entryDefaults, entryData]);

  useEffect(() => {
    if (!tracker || !entry || Object.keys(entryDefaults).length === 0) return;
    const raw = entry.submission_data || entry.formatted_data || entry.entry_data || {};
    if (Object.keys(raw).length > 0) return;
    setEntryData((prev) => {
      const merged = { ...entryDefaults, ...prev };
      if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
      return merged;
    });
  }, [tracker?.id, entry?.id, entryDefaults]);

  // When entering edit mode on a stage-styled tracker, set edit-mode stage to current stage
  useEffect(() => {
    if (isEditing && entry && tracker?.tracker_config?.stage_mapping?.length) {
      const cur = String(entry?.formatted_data?.derived_stage ?? "").trim();
      const firstStage = tracker.tracker_config.stage_mapping[0]?.stage ?? tracker.tracker_config.stage_mapping[0]?.name ?? "";
      setEditModeStage(cur || firstStage);
    }
  }, [isEditing, entry?.formatted_data?.derived_stage, entry?.id, tracker?.tracker_config?.stage_mapping]);

  // Default the stage tab to current stage when visiting the page (stage-styled trackers)
  useEffect(() => {
    if (!entry || !tracker?.tracker_config?.stage_mapping?.length) return;
    const cur = String(entry?.formatted_data?.derived_stage ?? "").trim();
    const firstStage = tracker.tracker_config.stage_mapping[0]?.stage ?? tracker.tracker_config.stage_mapping[0]?.name ?? "";
    setActiveStageTab((prev) => (prev === "" ? (cur || firstStage) : prev));
  }, [entry?.id, entry?.formatted_data?.derived_stage, tracker?.tracker_config?.stage_mapping]);

  // Default Forms sub-tab to current stage when entry loads (stage-styled trackers)
  useEffect(() => {
    if (!entry || !tracker?.tracker_config?.stage_mapping?.length) return;
    const stages = (tracker.tracker_config.stage_mapping || []).map((s) => String(s?.stage ?? s?.name ?? "").trim()).filter(Boolean);
    const cur = String(entry?.formatted_data?.derived_stage ?? "").trim();
    const validStage = cur && stages.includes(cur);
    setFormsSubTab((prev) => {
      if (prev !== "entry_data" && stages.includes(prev)) return prev;
      return validStage ? cur : "entry_data";
    });
  }, [entry?.id, entry?.formatted_data?.derived_stage, tracker?.tracker_config?.stage_mapping]);

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

  // Phone-like fields in entry (keys containing "phone" or "mobile") for Send SMS — only include values that are digits-only (optional leading +)
  const sendSmsPhoneCandidates = useMemo(() => {
    const isDigitsOnly = (s) => {
      if (!s || typeof s !== "string") return false;
      const normalized = s.trim().replace(/^\+/, "").replace(/[\s\-\.\(\)]/g, "");
      return /^\d+$/.test(normalized);
    };
    const data = entry?.submission_data || entry?.formatted_data || {};
    const formatted = entry?.formatted_data || {};
    const out = [];
    const seen = new Set();
    const keyMatches = (k) => (k || "").toLowerCase().includes("phone") || (k || "").toLowerCase().includes("mobile");
    Object.keys(data).forEach((key) => {
      if (!keyMatches(key) || seen.has(key)) return;
      const raw = data[key];
      const display = formatted[key];
      let value = null;
      if (typeof raw === "string" && raw.trim()) value = raw.trim();
      else if (raw && typeof raw === "object" && (raw.value || raw.display)) value = raw.value || raw.display;
      else if (display && typeof display === "string" && display.trim()) value = display.trim();
      else if (display && typeof display === "object" && (display.value || display.display)) value = display.value || display.display;
      if (value && isDigitsOnly(String(value))) {
        seen.add(key);
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        out.push({ fieldId: key, label, value: String(value).trim() });
      }
    });
    return out;
  }, [entry?.submission_data, entry?.formatted_data]);

  // Parse entry.notes into list of { date, stage, status, text } for stage change notes.
  // New format: "[YYYY-MM-DD HH:MM] Stage: X, Status: Y — text". Old: "[YYYY-MM-DD HH:MM] Stage change: text"
  const stageChangeNotesList = useMemo(() => {
    const raw = entry?.notes?.trim();
    if (!raw) return [];
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const newFormat = line.match(/^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]\s*Stage:\s*([^,]*),\s*Status:\s*([^—]+)\s*—\s*(.*)$/);
      if (newFormat) return { date: newFormat[1], stage: newFormat[2].trim(), status: newFormat[3].trim(), text: newFormat[4].trim() || "—" };
      const oldFormat = line.match(/^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]\s*Stage change:\s*(.*)$/);
      if (oldFormat) return { date: oldFormat[1], stage: null, status: null, text: oldFormat[2].trim() || "—" };
      return { date: null, stage: null, status: null, text: line };
    });
  }, [entry?.notes]);

  // Humanize action type for timeline display (e.g. patient_sms_received -> "Patient replied")
  const getActionTimelineTitle = (event) => {
    if (event.type !== "action") return event.title;
    const actionTypes = tracker?.tracker_config?.action_types || [];
    const configured = actionTypes.find((at) => (at.id || at.value) === event.action_type);
    if (configured?.label) return configured.label;
    const known = {
      patient_sms_received: "Patient replied",
      chase_phone: "Chase – Phone",
      chase_letter: "Chase – Letter",
    };
    if (known[event.action_type]) return known[event.action_type];
    if (event.action_type === "other" && event.free_text_label) return event.free_text_label;
    if (!event.action_type) return event.title || "Action";
    return event.action_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bSms\b/gi, "SMS");
  };

  // Chase dates: timeline actions with chase_date only (no standalone "Due" row — actions have their own dates and can be marked done).
  const chaseDatesList = useMemo(() => {
    const items = [];
    (allTimelineEvents || []).forEach((ev) => {
      const d = ev.chase_date;
      // Only show chase dates that come from real tracker actions.
      // This prevents standalone "Due" rows that can't be marked done from appearing in the sidebar.
      if (d && ev.type === "action") {
        const dateStr = typeof d === "string" ? d.split("T")[0] : d;
        const type = getActionTimelineTitle(ev);
        const actionId = ev.id?.startsWith("action_") ? Number(ev.id.slice(7)) : null;
        if (actionId == null) return;
        const completed = !!ev.completed_at;
        const actionSlug = ev.action_slug;
        items.push({ dateStr, type, actionId, actionSlug, completed });
      }
    });
    // Only pending chases in the sidebar — completed ones (e.g. SMS marked dealt with) clear from this list
    const pending = items.filter((x) => !x.completed);
    return pending.sort((a, b) => {
      if (a.dateStr !== b.dateStr) return a.dateStr < b.dateStr ? -1 : 1;
      return (a.actionId ?? 0) - (b.actionId ?? 0);
    });
  }, [allTimelineEvents, tracker?.tracker_config?.action_types]);

  // SMS thread from dedicated API (not timeline pagination) so Communications tab shows all messages
  const smsThread = useMemo(() => {
    const inbound = smsThreadData?.inbound ?? [];
    const sent = smsThreadData?.sent ?? [];
    const items = [];
    inbound.forEach((msg) => {
      const ackIdentifier = msg.slug ?? null;
      items.push({
        type: "inbound",
        id: `inbound_${msg.id}`,
        ackIdentifier,
        timestamp: msg.received_at,
        content: msg.content || "—",
        source_address: msg.source_address,
        acknowledged_at: msg.acknowledged_at ?? null,
      });
    });
    sent.forEach((c) => {
      const raw = c.comment_text || "";
      let content = "";
      const msgIdx = raw.indexOf("Message:");
      if (msgIdx !== -1) {
        content = raw.slice(msgIdx + 8).trim().replace(/\s*\[SID:.*$/, "").replace(/\s*\[Error:.*$/, "").trim();
      }
      if (!content) content = "—";
      items.push({
        type: "sent",
        id: `sent_${c.id}`,
        timestamp: c.created_at,
        content,
        user_name: c.user_name,
      });
    });
    items.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });
    return items;
  }, [smsThreadData]);

  // Count of inbound (patient) messages not yet marked "dealt with" — show on Communications tab badge
  const communicationsPendingCount = useMemo(() => {
    const inbound = smsThreadData?.inbound ?? [];
    return inbound.filter((m) => !m.acknowledged_at).length;
  }, [smsThreadData?.inbound]);

  // When opening the Communication tab, auto-mark older unacknowledged inbound messages as dealt with (seen).
  // The most recent inbound message is never auto-acknowledged — it must be replied to or manually marked.
  const autoAckInProgressRef = useRef(false);
  useEffect(() => {
    if (activeTab !== "communication" || !entrySlug || !smsThreadData?.inbound?.length || autoAckInProgressRef.current) return;
    const inbound = smsThreadData.inbound;
    const mostRecentId = inbound[inbound.length - 1]?.id;
    const unacknowledged = inbound.filter((m) => !m.acknowledged_at);
    const toAutoAck = (mostRecentId != null ? unacknowledged.filter((m) => m.id !== mostRecentId) : unacknowledged).filter((m) => m.slug);
    if (toAutoAck.length === 0) return;
    autoAckInProgressRef.current = true;
    (async () => {
      try {
        await Promise.all(
          toAutoAck.map((m) => trackersService.acknowledgeInboundMessage(entrySlug, m.slug))
        );
        refetchSmsThread?.();
        refetchTimeline?.();
        refetchEntry?.();
      } catch (err) {
        console.error("Auto-acknowledge inbound messages:", err);
      } finally {
        autoAckInProgressRef.current = false;
      }
    })();
  }, [activeTab, entrySlug, smsThreadData?.inbound, refetchSmsThread, refetchTimeline, refetchEntry]);

  // Scroll communication message thread to latest when opening the tab or when thread updates
  useEffect(() => {
    if (activeTab !== "communication" || communicationsSubTab !== "sms") return;
    const timeoutId = setTimeout(() => {
      const el = smsThreadScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [activeTab, communicationsSubTab, smsThread]);

  // When multiple phones exist, default to first for inline SMS composer
  useEffect(() => {
    if (sendSmsPhoneCandidates.length >= 2 && !sendSmsPhoneField) {
      setSendSmsPhoneField(sendSmsPhoneCandidates[0].fieldId);
    }
  }, [sendSmsPhoneCandidates, sendSmsPhoneField]);

  // Prefer fullTracker (GET by slug) for sections/fields so we have complete group layout (stack/grid/table)
  const displayTracker = fullTracker ?? tracker;
  const trackerFields = displayTracker?.tracker_fields?.fields || [];
  const trackerConfig = displayTracker?.tracker_config || {};
  // Use same source as tracker edit (Form → Fields per stage): prefer tracker_fields.sections, else tracker_config.sections (from GET /trackers/:slug)
  const sections = (displayTracker?.tracker_fields?.sections?.length ? displayTracker.tracker_fields.sections : trackerConfig.sections) || [];

  // Case closed: API `case_closed` / formatted_data (marker) or legacy status = master "Closed*" label.
  const isClosed = useMemo(() => {
    if (entry?.case_closed === true) return true;
    if (entry?.case_closed === false) return false;
    if (entry?.formatted_data?.case_closed === true) return true;
    if (entry?.formatted_data?.case_closed === false) return false;
    const st = entry?.status;
    if (st == null || st === "") return false;
    const master = tracker?.tracker_config?.statuses || [];
    const norm = String(st).trim();
    if (!Array.isArray(master) || master.length === 0) return norm.toLowerCase().startsWith("closed");
    return master.some((m) => String(m).trim() === norm && String(m).trim().toLowerCase().startsWith("closed"));
  }, [entry?.case_closed, entry?.formatted_data?.case_closed, entry?.status, tracker?.tracker_config?.statuses]);

  // Phase 5.4: Closed cases are read-only (no edit, no status change, no actions)
  const canEditCase = canUpdateEntry && !isClosed;

  // Phase 5.2: Send SMS only when tracker has an SMS sender number configured (backend also enforces)
  const hasSmsSenderNumber = !!(tracker?.tracker_config?.twilio_from_number?.trim());
  const canSendSms = canEditCase && hasSmsSenderNumber;

  // SMS quick-reply templates: use tracker's custom templates or single built-in "General" (no message)
  const smsTemplateOptions = useMemo(() => {
    const custom = (tracker?.tracker_config?.sms_templates || []).filter((t) => t.key);
    if (custom.length > 0) return custom.map((t) => ({ value: t.key, label: t.label || t.key }));
    return [{ value: "general", label: "General" }];
  }, [tracker?.tracker_config?.sms_templates]);
  const firstSmsTemplateValue = smsTemplateOptions[0]?.value ?? "general";
  useEffect(() => {
    if (smsTemplateOptions.length > 0 && !smsTemplateOptions.some((o) => o.value === sendSmsTemplate)) {
      setSendSmsTemplate(firstSmsTemplateValue);
    }
  }, [smsTemplateOptions, firstSmsTemplateValue, sendSmsTemplate]);

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

    // Handle file fields: show View/Download link (use file_reference_id for URL when available)
    if (fieldType === "file") {
      const fileRefId = typeof value === "object" && value !== null ? value.file_reference_id : null;
      const fileId = typeof value === "object" && value !== null ? value.file_id : typeof value === "number" ? value : null;
      const identifier = fileRefId ?? fileId ?? (typeof value === "string" && value.trim() ? value.trim() : null);
      const fileName = typeof value === "object" && value !== null ? value.file_name : null;
      const fileUrlPath = typeof value === "object" && value !== null && value.file_url ? value.file_url : identifier != null ? `/settings/files/${identifier}/download` : null;
      if (identifier == null && !fileUrlPath) return "—";
      const handleFileOpen = async (e) => {
        e.preventDefault();
        if (identifier == null) return;
        const apiPath = `/settings/files/${identifier}/download`;
        try {
          const res = await api.get(apiPath);
          const data = res?.data ?? res;
          const downloadUrl = data?.download_url;
          if (downloadUrl) window.open(downloadUrl, "_blank", "noopener,noreferrer");
          else toast.error("Could not open file");
        } catch (err) {
          toast.error("Could not open file");
        }
      };
      return (
        <span className="flex items-center gap-2">
          <Button type="button" variant="link" className="h-auto p-0 text-primary" onClick={handleFileOpen}>
            {fileName || `File #${identifier}`}
          </Button>
          <span className="text-xs text-muted-foreground">(View)</span>
        </span>
      );
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
    if ((fieldType === "select" || fieldType === "multiselect" || fieldType === "table_radio") && field.options) {
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

  // Group fields by section: use section.fields (list of field ids) when present, else field.section. Attach section.groups when present.
  const fieldsBySection = sections.reduce((acc, section, index) => {
    const sectionKey = section.id ?? section.title ?? section.label ?? `section-${index}`;
    const sectionFields = (section.fields?.length)
      ? (section.fields || []).map((fid) => trackerFields.find((f) => (f.id || f.name || f.field_id) === fid)).filter(Boolean)
      : trackerFields.filter((field) => field.section === section.id || field.section === sectionKey);
    acc[sectionKey] = {
      ...section,
      id: section.id ?? sectionKey,
      fields: sectionFields,
      groups: section.groups && Array.isArray(section.groups) ? section.groups : null,
    };
    return acc;
  }, {});

  // Fields without section (section: null or undefined)
  const fieldsWithoutSection = trackerFields.filter((field) => !field.section || field.section === null);

  // Form-entry-style read-only layout: sections with labels, ungrouped fields, and groups (like Forms submission view)
  const trackerReadOnlyLayout = useMemo(() => {
    return sections.map((section, index) => {
      const sectionKey = section.id ?? section.title ?? section.label ?? `section-${index}`;
      const sectionFields = (section.fields?.length)
        ? (section.fields || []).map((fid) => trackerFields.find((f) => (f.id || f.name || f.field_id) === fid)).filter(Boolean)
        : trackerFields.filter((f) => f.section === section.id || f.section === sectionKey);
      const groups = section.groups && Array.isArray(section.groups) ? section.groups : [];
      const sectionLabel = section.label || section.title || section.id || "Section";
      const hasId = (f, id) => String(f?.id || f?.name || f?.field_id) === String(id);
      let ungrouped = [];
      let groupsWithFields = [];
      if (groups.length > 0) {
        // Fields "in layout": in group.fields OR in table_rows[].cells[].field_id OR in grid_rows (columns or legacy slots)
        const fieldIdsInGroups = new Set(
          groups.flatMap((g) => {
            const fromFields = (g.fields || []).map(String);
            const fromTable = (g.table_rows || []).flatMap((row) => (row.cells || []).map((c) => c.field_id).filter(Boolean).map(String));
            const fromGrid = (g.grid_rows || []).flatMap((row) => gridRowFieldIdsFlat(row).map(String));
            return [...fromFields, ...fromTable, ...fromGrid];
          })
        );
        ungrouped = sectionFields.filter((f) => !fieldIdsInGroups.has(String(f?.id || f?.name || f?.field_id)));
        groupsWithFields = groups.map((g) => {
          // Include fields that are in group.fields OR in table_rows[].cells[].field_id OR in grid_rows (so table/grid cells resolve in view mode)
          const groupFieldIds = new Set([
            ...(g.fields || []).map(String),
            ...(g.table_rows || []).flatMap((row) => (row.cells || []).map((c) => c.field_id).filter(Boolean).map(String)),
            ...(g.grid_rows || []).flatMap((row) => gridRowFieldIdsFlat(row).map(String)),
          ]);
          return {
            group: g,
            fields: sectionFields.filter((f) => groupFieldIds.has(String(f?.id || f?.name || f?.field_id))),
          };
        });
      } else {
        ungrouped = sectionFields;
      }
      return { sectionKey, sectionLabel, ungrouped, groupsWithFields };
    });
  }, [sections, trackerFields]);

  const comments = commentsData?.comments || commentsData || [];
  // Notes & Files tab: exclude "SMS sent" (those belong in Communications)
  const notesAndFilesComments = useMemo(
    () => (comments || []).filter((c) => c.note_category !== "SMS sent"),
    [comments]
  );

  // Handle field value changes
  const handleFieldChange = (fieldId, value) => {
    setEntryData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Keep header Stage/Status in sync when user changes status (or stage) in the form
    const statusFieldId = tracker?.tracker_config?.status_field_id;
    if (statusFieldId && (fieldId === statusFieldId || String(fieldId) === String(statusFieldId))) {
      setEntryStatus(value ?? "");
    }
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
      const fieldId = field.id || field.name || field.field_id;
      if (!checkFieldVisibility(field, effectiveEntryData)) return;
      if (isFieldDisabledByCondition(field, effectiveEntryData)) return;
      const isRequired = field.required || false;
      const value = effectiveEntryData[fieldId];

      if (isRequired && (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0))) {
        errors[fieldId] = `${field.label || field.name} is required`;
        isValid = false;
      }
    });

    // Status guardrails: when setting a status that requires specific fields, validate them
    const statusGuardrails = tracker?.tracker_config?.status_guardrails || {};
    const guardrail = statusGuardrails[entryStatus];
    if (guardrail?.required_fields?.length) {
      guardrail.required_fields.forEach((fieldId) => {
        const value = effectiveEntryData[fieldId];
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
      const currentStage = String(entry?.formatted_data?.derived_stage ?? "").trim();
      const payload = { submission_data: effectiveEntryData, status: entryStatus };
      if (isStageStyledTracker && editModeStage && editModeStage.trim() !== currentStage) {
        payload.stage = editModeStage.trim();
      }
      const updatedEntry = await updateEntryMutation.mutateAsync({
        entryIdentifier: entrySlug,
        entryData: payload,
      });
      setIsEditing(false);
      // Sync UI to new stage so Forms tab and header show updated stage without refresh
      const newStage = (updatedEntry?.formatted_data?.derived_stage ?? editModeStage ?? "").toString().trim();
      if (newStage && isStageStyledTracker) {
        setActiveStageTab(newStage);
        setFormsSubTab(newStage);
        setEditModeStage(newStage);
      }
      if (updatedEntry?.status != null) setEntryStatus(updatedEntry.status);
      await refetchEntry?.();
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
  const formTabsList = useMemo(
    () => ["entry_data", ...(stageMapping || []).map((s) => String(s?.stage ?? s?.name ?? "").trim()).filter(Boolean)],
    [stageMapping]
  );
  const effectiveFormsSubTab = formTabsList.includes(formsSubTab) ? formsSubTab : "entry_data";
  const currentStage = String(entry?.formatted_data?.derived_stage ?? "").trim();
  const currentStageIndex = stageMapping.findIndex((s) => String(s?.stage ?? s?.name ?? "").trim() === currentStage);
  const hasNextStage = currentStageIndex >= 0 && currentStageIndex < stageMapping.length - 1;
  const nextStageLabel = hasNextStage ? (stageMapping[currentStageIndex + 1]?.stage ?? stageMapping[currentStageIndex + 1]?.name ?? "Next stage") : null;

  const handleStageChange = (stageName) => {
    const name = (stageName ?? "").toString().trim();
    if (!name || stageMapping.length === 0) return;
    if (name === currentStage) return;
    const item = stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === name);
    const statuses = (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
    setStageChangePending({ stageLabel: name, stageName: name });
    setStageChangeNotes("");
    setStageChangeStatus(statuses[0] ?? "");
  };

  const handleNextStage = () => {
    if (!hasNextStage || !nextStageLabel) return;
    const item = stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === nextStageLabel);
    const statuses = (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
    setStageChangePending({ stageLabel: nextStageLabel, stageName: nextStageLabel });
    setStageChangeNotes("");
    setStageChangeStatus(statuses[0] ?? "");
  };

  const confirmStageChangeWithNotes = async () => {
    if (!stageChangePending) return;
    const { stageName } = stageChangePending;
    const noteTrimmed = stageChangeNotes != null ? String(stageChangeNotes).trim() : "";
    if (!noteTrimmed) {
      toast.error("Note is required when moving to another stage.");
      return;
    }
    if (statusesForTargetStage.length > 0 && !stageChangeStatus) {
      toast.error("Please select a status for the target stage.");
      return;
    }
    try {
      const entryDataPayload = { stage: stageName, notes: noteTrimmed };
      if (stageChangeStatus) entryDataPayload.status = stageChangeStatus;
      await updateEntryMutation.mutateAsync({
        entryIdentifier: entrySlug,
        entryData: entryDataPayload,
      });
      setStageChangePending(null);
      setStageChangeNotes("");
      setStageChangeStatus("");
      setActiveStageTab(stageName);
      toast.success(`Moved to ${stageName}`);
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === "object" ? detail?.message : detail;
      toast.error(message || "Failed to move stage");
    }
  };

  const isStageStyledTracker = !!(tracker?.tracker_config?.use_stages !== false && stageMapping.length > 0);

  // For stage-styled trackers: when rendering the status form field in edit mode, only show statuses for the chosen stage (backend validates this; frontend should not offer invalid options).
  const getFieldWithStageFilteredStatusOptions = (field, statusesForStage) => {
    if (!isStageStyledTracker || !statusesForStage?.length) return field;
    const statusFieldId = tracker?.tracker_config?.status_field_id;
    if (!statusFieldId) return field;
    const fieldId = (field.id ?? field.field_id ?? field.name)?.toString().trim();
    if (!fieldId || fieldId !== String(statusFieldId).trim()) return field;
    const options = statusesForStage.map((s) => ({ value: s, label: humanizeStatusForDisplay(s) }));
    return {
      ...field,
      field_options: { ...(field.field_options || {}), options },
      options,
    };
  };

  const normalizeCondValue = (v) => {
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
    if (show_when === "equals") return normalizeCondValue(dependentValue) === normalizeCondValue(expectedValue);
    if (show_when === "not_equals") return normalizeCondValue(dependentValue) !== normalizeCondValue(expectedValue);
    if (show_when === "contains") return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : String(dependentValue || "").includes(String(expectedValue || ""));
    if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
    if (show_when === "is_not_empty") return dependentValue != null && dependentValue !== "" && dependentValue !== false;
    return true;
  };

  // Conditional visibility for tracker fields; when action is "disable", field is still visible
  const checkFieldVisibility = (field, data) => {
    if (!field?.conditional_visibility?.depends_on_field) return true;
    const met = isConditionMet(field.conditional_visibility, data);
    const action = (field.conditional_visibility.action || "hide").toLowerCase();
    if (action === "disable") return true;
    return met;
  };

  const isFieldDisabledByCondition = (field, data) => {
    if (!field?.conditional_visibility?.depends_on_field) return false;
    const met = isConditionMet(field.conditional_visibility, data);
    const action = (field.conditional_visibility.action || "hide").toLowerCase();
    return action === "disable" && !met;
  };

  const checkRowVisibility = checkLayoutRowVisibility;

  // Section fields visible for display (respects group visibility when section has groups)
  const getVisibleSectionFields = (sectionKey, data) => {
    const sectionData = fieldsBySection[sectionKey];
    if (!sectionData) return [];
    const fields = sectionData.fields || [];
    const groups = sectionData.groups;
    if (groups?.length) {
      const visibleIds = new Set();
      groups.forEach((g) => {
        if (checkGroupVisibility(g, data)) (g.fields || []).forEach((id) => visibleIds.add(id));
      });
      return fields.filter((f) => visibleIds.has(f.id || f.name || f.field_id));
    }
    return fields.filter((f) => checkFieldVisibility(f, data));
  };

  // For stage-styled trackers with stage tabs: which section to show in Details (section index matches stage index)
  const activeStageSectionIndex =
    isStageStyledTracker && activeStageTab && stageMapping.length && sections.length
      ? stageMapping.findIndex((s) => (s?.stage ?? s?.name ?? "").toString().trim() === (activeStageTab || "").toString().trim())
      : -1;
  const activeStageSection =
    activeStageSectionIndex >= 0 && sections[activeStageSectionIndex]
      ? sections[activeStageSectionIndex]
      : null;
  const showDetailsFilteredByStage = isStageStyledTracker && activeStageSection != null;

  // When showing all sections (e.g. Entry data tab), which section to expand: current stage from entry, or first
  const activeStageSectionIndexFromEntry =
    isStageStyledTracker && stageMapping.length
      ? stageMapping.findIndex((s) => (s?.stage ?? s?.name ?? "").toString().trim() === (entry?.formatted_data?.derived_stage ?? "").toString().trim())
      : -1;
  const expandedSectionIndex = activeStageSectionIndexFromEntry >= 0 ? activeStageSectionIndexFromEntry : 0;

  const openChangeStatusDialog = () => {
    const curStage = String(entry?.formatted_data?.derived_stage ?? "").trim();
    const initialStage = curStage || (stageMapping[0]?.stage ?? stageMapping[0]?.name ?? "");
    const stageItem = stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === initialStage);
    const statuses = (stageItem?.statuses ?? stageItem?.status_list ?? []).filter(Boolean);
    const curStatus = entry?.status ?? "";
    const defaultStatus = statuses.length && (statuses.includes(curStatus) ? curStatus : statuses[0]) || "";
    setChangeStatusStage(initialStage);
    setStageChangeStatus(defaultStatus);
    setChangeStatusNote("");
    setIsChangeStatusDialogOpen(true);
  };

  const confirmChangeStatus = async () => {
    const stageName = (changeStatusStage ?? "").toString().trim();
    const statuses = statusesForChangeStatusStageFiltered;
    if (statuses.length > 0 && !stageChangeStatus) {
      toast.error("Please select a status.");
      return;
    }
    try {
      const entryDataPayload = { status: stageChangeStatus };
      if (stageName) entryDataPayload.stage = stageName;
      const noteTrimmed = (changeStatusNote ?? "").toString().trim();
      if (noteTrimmed) entryDataPayload.notes = noteTrimmed;
      await updateEntryMutation.mutateAsync({
        entryIdentifier: entrySlug,
        entryData: entryDataPayload,
      });
      setIsChangeStatusDialogOpen(false);
      setChangeStatusStage("");
      setStageChangeStatus("");
      setChangeStatusNote("");
      if (stageName) setActiveStageTab(stageName);
      toast.success("Status updated");
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === "object" ? detail?.message : detail;
      toast.error(message || "Failed to update status");
    }
  };

  const handleChangeStatusStageSelect = (stageName) => {
    const name = (stageName ?? "").toString().trim();
    if (!name) return;
    setChangeStatusStage(name);
    const stageItem = stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === name);
    const statuses = (stageItem?.statuses ?? stageItem?.status_list ?? []).filter(Boolean);
    const curStatus = entry?.status ?? "";
    setStageChangeStatus(statuses.includes(curStatus) ? curStatus : (statuses[0] ?? ""));
  };

  const copyEntryLink = async () => {
    if (typeof window === "undefined") return;
    const link = window.location.origin + ["", "admin", "trackers", "entries", entrySlug].join("/");
    try {
      await navigator.clipboard.writeText(link);
      setEntryLinkCopied(true);
      toast.success("Link copied");
      setTimeout(() => setEntryLinkCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const copyShareableLink = async () => {
    const trackerSlug = tracker?.slug || tracker?.form_name;
    if (!trackerSlug || !(entry?.slug ?? entrySlug) || typeof window === "undefined") return;
    const path = ["", "forms", trackerSlug, "entry", entry?.slug ?? entrySlug, "submit"].join("/");
    const link = window.location.origin + path;
    try {
      await navigator.clipboard.writeText(link);
      setShareableLinkCopied(true);
      toast.success("Shareable link copied");
      setTimeout(() => setShareableLinkCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleOpenLogAction = () => {
    setLogSheetTab("actions");
    const types = tracker?.tracker_config?.action_types || [];
    setLogActionType(types.length ? "" : "other");
    setLogActionFreeText("");
    setLogActionNote("");
    setLogActionChaseDate("");
    setLogActionNoChase(false);
    setIsLogActionOpen(true);
  };

  const handleOpenLogAppointment = () => {
    setLogSheetTab("dates");
    const types = tracker?.tracker_config?.appointment_types ?? [];
    const statuses = tracker?.tracker_config?.appointment_statuses ?? [];
    setLogAppointmentDate(format(new Date(), "yyyy-MM-dd"));
    setLogAppointmentTime("09:00");
    setLogAppointmentType(types[0]?.id ?? "");
    setLogAppointmentLocation("__none__");
    setLogAppointmentDuration("");
    setLogAppointmentStatus(statuses[0]?.id ?? "");
    setLogAppointmentNote("");
    setIsLogActionOpen(true);
  };

  const handleChangeStatusOrEdit = () => {
    if (isStageStyledTracker) openChangeStatusDialog();
    else setIsEditing(true);
  };

  const handleOpenSendSms = () => {
    setSendSmsTemplate("general");
    setIsSendSmsModalOpen(true);
  };

  const handleCloseCase = async () => {
    try {
      await updateEntryMutation.mutateAsync({
        entryIdentifier: entrySlug,
        entryData: { case_closed: true },
      });
      setIsCloseCaseDialogOpen(false);
      toast.success("Case closed. The entry is now read-only.");
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : d?.message || "Failed to close case");
    }
  };

  const handleReopenCase = async () => {
    try {
      await updateEntryMutation.mutateAsync({
        entryIdentifier: entrySlug,
        entryData: { case_closed: false },
      });
      setIsReopenCaseDialogOpen(false);
      toast.success("Case reopened.");
    } catch (err) {
      const d = err?.response?.data?.detail;
      const msg =
        typeof d === "string"
          ? d
          : d?.message || (Array.isArray(d?.guardrail_errors) ? d.guardrail_errors[0] : null) || "Failed to reopen case";
      toast.error(msg);
    }
  };

  // Show error if there's an API error
  if (entryError) {
    console.error("TrackerEntryDetailPage - API Error:", entryError);
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Error loading entry</h3>
        <p className="text-muted-foreground mb-4">
          {entryError?.response?.data?.detail || entryError?.message || "An error occurred"}
        </p>
        <Link href={trackersListReturnHref}>
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
        <Link href={trackersListReturnHref}>
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
        <Link href={trackersListReturnHref}>
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

  // Case cockpit: assignee from entry data
  const fd = entry?.formatted_data || entry?.submission_data || {};
  const assignedToDisplay = (() => {
    const v = fd.assigned_to ?? fd.owner ?? fd.assigned_user;
    if (typeof v === "object" && v !== null) return v?.display_name || [v?.first_name, v?.last_name].filter(Boolean).join(" ") || v?.email || null;
    return v ? String(v) : null;
  })();

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Sticky case header – actions at core */}
      <header className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Link href={trackersListReturnHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate" title={headingValue}>{headingValue}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-sm text-muted-foreground">Case #{entryNumber}</span>
                <Badge variant="outline" className="text-xs font-normal">{humanizeStatusForDisplay(entry?.status || "open")}</Badge>
                {currentStage && (
                  <Badge variant="secondary" className="text-xs" style={getStageColor(tracker?.tracker_config?.stage_mapping || [], currentStage) ? { borderLeft: `3px solid ${getStageColor(tracker?.tracker_config?.stage_mapping || [], currentStage)}` } : undefined}>
                    {currentStage}
                  </Badge>
                )}
                {(communicationsPendingCount > 0 || (entry?.has_patient_message && smsThreadLoading)) && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:bg-opacity-40 dark:text-amber-200">
                    Patient messaged
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  {isStageStyledTracker && (
                    <>
                      <Select value={editModeStage || ""} onValueChange={(stageName) => { const name = (stageName ?? "").toString().trim(); if (!name) return; setEditModeStage(name); const stageItem = stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === name); const statuses = (stageItem?.statuses ?? stageItem?.status_list ?? []).filter(Boolean); setEntryStatus(statuses.includes(entry?.status ?? "") ? entry.status : (statuses[0] ?? "")); }}>
                        <SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Stage" /></SelectTrigger>
                        <SelectContent>{stagesForEditModeDropdown.map((item) => { const stageName = item?.stage ?? item?.name ?? ""; if (!stageName) return null; return <SelectItem key={stageName} value={stageName}>{stageName}</SelectItem>; })}</SelectContent>
                      </Select>
                      <Select value={statusesForEditModeStageFiltered.includes(entryStatus) ? entryStatus : (statusesForEditModeStageFiltered[0] ?? "")} onValueChange={setEntryStatus}>
                        <SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>{statusesForEditModeStageFiltered.map((s) => <SelectItem key={s} value={s}>{humanizeStatusForDisplay(s)}</SelectItem>)}</SelectContent>
                      </Select>
                    </>
                  )}
                  <Button onClick={handleSave} disabled={updateEntryMutation.isPending} size="sm">{updateEntryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" />Save</Button>
                  <Button onClick={handleCancel} variant="outline" size="sm"><X className="mr-2 h-4 w-4" />Cancel</Button>
                </>
              ) : (
                <>
                  {canEditCase && !isClosed && (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={handleOpenLogAction}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Action
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleOpenLogAppointment}>
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Add appointment
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleChangeStatusOrEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Change Status
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsCloseCaseDialogOpen(true)}>
                        <X className="mr-2 h-4 w-4" />
                        Close case
                      </Button>
                    </span>
                  )}
                  {tracker?.tracker_config?.allow_public_submit && (
                    <Button variant="outline" size="sm" onClick={copyShareableLink}>
                      <Share2 className="h-4 w-4 mr-1" />
                      {shareableLinkCopied ? "Copied" : "Share form link"}
                    </Button>
                  )}
                  {isClosed && (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <Badge
                        variant="destructive"
                        className="text-xs font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-red-600/40 dark:ring-red-400/35"
                      >
                        Read-only (closed)
                      </Badge>
                      {canUpdateEntry && (
                        <Button variant="outline" size="sm" onClick={() => setIsReopenCaseDialogOpen(true)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reopen case
                        </Button>
                      )}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Two-column full-width: Sidebar (Summary + Tasks) | Main (Timeline) – like Documents */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 w-full">
        {/* Left: Case summary, Appointments, Chase dates */}
        <aside className="space-y-3 order-2 lg:order-1 lg:col-span-3">
          <Card className="overflow-hidden">
            <CardHeader className="py-2.5 px-3">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Case summary</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground truncate">Case ID</dt>
                <dd className="font-medium truncate">#{entryNumber}</dd>
                <dt className="text-muted-foreground truncate">Status</dt>
                <dd>
                  <Badge variant="outline" className="font-normal text-[11px] py-0 px-1.5 h-5">{humanizeStatusForDisplay(entry?.status || "open")}</Badge>
                </dd>
                {currentStage && (
                  <>
                    <dt className="text-muted-foreground truncate">Stage</dt>
                    <dd className="font-medium truncate">{currentStage}</dd>
                  </>
                )}
                {assignedToDisplay && (
                  <>
                    <dt className="text-muted-foreground truncate col-span-2">Assigned to</dt>
                    <dd className="font-medium flex items-center gap-1 truncate col-span-2"><UserIcon className="h-3 w-3 shrink-0" />{assignedToDisplay}</dd>
                  </>
                )}
                <dt className="text-muted-foreground truncate">Opened</dt>
                <dd className="font-medium truncate">{entry?.created_at ? format(parseUTCDate(entry.created_at), "d MMM yyyy") : "—"}</dd>
                {(formFileAttachments.length + attachments.length) > 0 && (
                  <>
                    <dt className="text-muted-foreground truncate">Attachments</dt>
                    <dd className="font-medium truncate">{formFileAttachments.length + attachments.length} file(s)</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="py-2.5 px-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" /> Appointments
              </CardTitle>
              {canEditCase && (
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 -mr-1" onClick={handleOpenLogAppointment}>
                  <Plus className="h-3 w-3 mr-1 shrink-0" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              {appointmentsList.length > 0 ? (
                <ul className="space-y-1.5 max-h-[min(200px,32vh)] overflow-y-auto text-xs">
                  {appointmentsList.map((apt) => {
                    const typeLabel = (tracker?.tracker_config?.appointment_types ?? []).find((t) => t.id === apt.appointment_type)?.label ?? apt.appointment_type;
                    const locationLabel = (tracker?.tracker_config?.appointment_locations ?? []).find((l) => l.id === apt.location)?.label ?? apt.location ?? "—";
                    const statusOptions = tracker?.tracker_config?.appointment_statuses ?? [];
                    const statusLabel = statusOptions.find((s) => s.id === apt.status)?.label ?? apt.status;
                    const aptAt = apt.appointment_at ? (typeof apt.appointment_at === "string" ? new Date(apt.appointment_at) : apt.appointment_at) : null;
                    return (
                      <li key={apt.slug ?? `apt-${apt.id}`} className="flex items-start justify-between gap-2 py-1.5 border-b border-border/50 last:border-0 last:pb-0 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground leading-tight">
                            {aptAt ? format(aptAt, "d MMM HH:mm") : "—"}
                          </div>
                          <div className="text-muted-foreground mt-0.5 truncate">
                            {typeLabel}{locationLabel ? ` · ${locationLabel}` : ""}
                            {!canEditCase && statusLabel ? ` · ${statusLabel}` : ""}
                          </div>
                        </div>
                        {canEditCase && (
                          <Select
                            value={apt.status}
                            onValueChange={(value) => {
                              if (!apt.slug) return;
                              updateTrackerAppointmentMutation.mutate(
                                { entryIdentifier: entrySlug, appointmentId: apt.slug, body: { status: value } },
                                { onSuccess: () => refetchAppointments() }
                              );
                            }}
                            disabled={updateTrackerAppointmentMutation.isPending || !apt.slug}
                          >
                            <SelectTrigger className="h-6 text-[11px] w-[100px] py-0 shrink-0 border-muted-foreground/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground py-1">No appointments</p>
              )}
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="py-2.5 px-3">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chase dates</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              {chaseDatesList.length > 0 ? (
                <ul className="space-y-1.5 max-h-[min(240px,36vh)] overflow-y-auto text-xs">
                  {chaseDatesList.map((item, idx) => {
                    const reason = item.type.startsWith("Chase – ") ? item.type.slice(8).trim() : item.type;
                    const isAction = item.actionId != null;
                    const isPending = isAction && !item.completed;
                    return (
                      <li
                        key={isAction ? `action_${item.actionSlug ?? item.actionId}` : `due_${item.dateStr}_${idx}`}
                        className={cn(
                          "flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0 first:pt-0",
                          item.completed && "opacity-70"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <span className={cn("font-medium leading-tight", item.completed && "line-through text-muted-foreground")}>
                            {format(parseUTCDate(item.dateStr + "T12:00:00"), "d MMM yyyy")}
                          </span>
                          <div className="text-muted-foreground font-normal mt-0.5 truncate">{reason}</div>
                        </div>
                        {isPending && canEditCase && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] px-2 shrink-0"
                            disabled={completeTrackerActionMutation.isPending}
                            onClick={async () => {
                              const ident = item.actionSlug ?? item.actionId;
                              if (ident == null || !entrySlug) return;
                              await completeTrackerActionMutation.mutateAsync({ entryIdentifier: entrySlug, actionId: ident });
                              refetchTimeline();
                              refetchEntry?.();
                            }}
                          >
                            {completeTrackerActionMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Done"}
                          </Button>
                        )}
                        {isAction && item.completed && (
                          <Badge variant="secondary" className="text-[10px] font-normal shrink-0 py-0 px-1.5 h-5">
                            <CheckCircle className="h-3 w-3 mr-0.5 inline" />
                            Done
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground py-1">No chase dates</p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main: 5 tabs – Activity, Forms, Communication, Notes & Files, Audit */}
        <main className="space-y-3 order-1 lg:order-2 min-w-0 lg:col-span-9">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 min-w-0 w-full">
              <TabsList className="bg-muted/50 flex flex-nowrap gap-1 px-3 py-1 w-max min-w-full [&>*]:shrink-0">
                <TabsTrigger value="activity"><Clock className="mr-2 h-4 w-4" />Activity</TabsTrigger>
                <TabsTrigger value="forms"><FileText className="mr-2 h-4 w-4" />Forms</TabsTrigger>
                <TabsTrigger value="communication" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>Communications</span>
                  {communicationsPendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {communicationsPendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notes"><MessageSquare className="mr-2 h-4 w-4" />Notes & Files ({notesAndFilesComments.length})</TabsTrigger>
                <TabsTrigger value="audit"><FileText className="mr-2 h-4 w-4" />Audit</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {stageChangeNotesList.length > 0 && (
                <Collapsible defaultOpen={false} className="mb-4 group rounded-md border border-muted/60 bg-muted/40">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-colors">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stage change notes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{stageChangeNotesList.length} note{stageChangeNotesList.length === 1 ? "" : "s"}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="space-y-2 max-h-[160px] overflow-y-auto px-3 pb-3 pt-1 pr-2">
                      {stageChangeNotesList.map((item, idx) => (
                        <li key={idx} className="flex flex-col gap-1 text-xs border-l-2 border-primary/30 pl-2 py-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.date && (
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {format(parseUTCDate(item.date.replace(" ", "T") + ":00"), "d MMM yyyy, HH:mm")}
                              </span>
                            )}
                            {(item.stage != null && item.stage !== "") || (item.status != null && item.status !== "") ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {item.stage != null && item.stage !== "" && (
                                  <Badge variant="secondary" className="text-[10px] font-normal py-0 px-1.5 rounded-full">
                                    {item.stage}
                                  </Badge>
                                )}
                                {item.status != null && item.status !== "" && (
                                  <Badge variant="outline" className="text-[10px] font-normal py-0 px-1.5 rounded-full">
                                    {item.status}
                                  </Badge>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <p className="text-xs text-foreground break-words leading-snug">{item.text}</p>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
              <div className="max-h-[min(400px,50vh)] overflow-y-auto">
                {timelineLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : activityTimelineEvents?.length > 0 ? (
                  <div className="space-y-4">
                    {activityTimelineEvents.map((event, index) => {
                      const prevEvent = activityTimelineEvents[index - 1];
                      const daysBetween = index > 0 && prevEvent?.timestamp && event.timestamp ? Math.abs(differenceInDays(parseUTCDate(prevEvent.timestamp), parseUTCDate(event.timestamp))) : null;
                      return (
                        <div key={event.id || index} className="relative pl-5 border-l-2 border-border/70 ml-1">
                          <span className="absolute -left-[6px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary/70" />
                          {daysBetween != null && daysBetween > 0 && <span className="inline-block mb-2 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">{daysBetween} day{daysBetween === 1 ? "" : "s"} later</span>}
                          <div className="pb-4">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {(event.stage || event.status) && (<>{event.stage && <Badge variant="secondary" className="text-xs font-normal" style={getStageColor(tracker?.tracker_config?.stage_mapping || [], event.stage) ? { backgroundColor: getStageColor(tracker?.tracker_config?.stage_mapping || [], event.stage), color: "#fff" } : undefined}>{event.stage}</Badge>}{event.status && <Badge variant="outline" className="text-xs">{event.status}</Badge>}</>)}
                              <span className="font-medium text-sm leading-tight">{event.type === "action" ? getActionTimelineTitle(event) : event.title}</span>
                              {event.message_source === "sms" && <Badge variant="outline" className="text-xs">SMS</Badge>}
                              {event.message_source === "comment" && <Badge variant="outline" className="text-xs">Comment</Badge>}
                              {event.note_category && <Badge variant="secondary" className="text-xs">{event.note_category}</Badge>}
                            </div>
                            {(event.description || (event.type === "field_updates" && event.changes?.length)) && (
                              event.type === "field_updates" && event.changes?.length > 0 ? (
                                <div className="text-sm text-muted-foreground break-words space-y-2">
                                  {event.changes.map((c, i) => (
                                    <div
                                      key={`${event.id || index}-change-${i}`}
                                      className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5"
                                    >
                                      <div className="text-xs font-medium text-foreground mb-0.5">{c.field_label}</div>
                                      <div className="text-xs leading-snug">
                                        <span className="text-muted-foreground/90">{c.old_value ?? "—"}</span>
                                        <span className="px-1 text-muted-foreground">→</span>
                                        <span className="text-foreground">{c.new_value ?? "—"}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground break-words leading-relaxed">
                                  {formatTimelineDescription(event.description, event)}
                                </p>
                              )
                            )}
                            <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground flex-wrap">
                              <span>{format(parseUTCDate(event.timestamp), "d MMM yyyy, HH:mm")}</span>
                              {event.user_name && <span>by {event.user_name}</span>}
                              {event.type === "action" && event.chase_date && (
                                event.completed_at ? (
                                  <Badge variant="secondary" className="text-xs font-normal">Done</Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs"
                                    disabled={completeTrackerActionMutation.isPending || !event.action_slug}
                                    onClick={async () => {
                                      if (!event.action_slug || !entrySlug) return;
                                      await completeTrackerActionMutation.mutateAsync({
                                        entryIdentifier: entrySlug,
                                        actionId: event.action_slug,
                                      });
                                      refetchTimeline();
                                      refetchEntry?.();
                                    }}
                                  >
                                    {completeTrackerActionMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                    Mark done
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {timelinePagination.total_pages > timelinePage && (
                      <Button variant="outline" size="sm" onClick={() => setTimelinePage((p) => p + 1)} disabled={timelineLoading}>{timelineLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Load more</Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No activity yet. Use Add Action to start the timeline.</p>
                )}
              </div>
            </CardContent>
          </Card>
            </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-4 mt-4">
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

          <Tabs value={effectiveFormsSubTab} onValueChange={setFormsSubTab} className="w-full">
            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 min-w-0 w-full mb-4">
              <TabsList className="bg-muted/50 flex flex-nowrap gap-1 px-3 py-1 w-max min-w-full [&>*]:shrink-0">
                <TabsTrigger value="entry_data">Entry data</TabsTrigger>
                {stageMapping?.map((s) => {
                  const n = String(s?.stage ?? s?.name ?? "").trim();
                  return n ? <TabsTrigger key={n} value={n}>{n}</TabsTrigger> : null;
                })}
              </TabsList>
            </div>
            <TabsContent value="entry_data" className="mt-0 space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              {/* Entry data tab: shared/entry data (stage-styled) or full form (non-stage) */}
              {isStageStyledTracker ? (
                fieldsWithoutSection.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Entry data</CardTitle>
                      <p className="text-sm text-muted-foreground">Shared fields that apply across stages.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Metadata: created, created by, last updated, last updated by */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-3 px-4 rounded-lg bg-muted/40 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created</span>
                          <p className="font-medium">{entry?.created_at ? format(parseUTCDate(entry.created_at), "PPp") : "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created by</span>
                          <p className="font-medium">{entry?.submitted_by_display_name || (entry?.submitted_by_user_id ? `User #${entry.submitted_by_user_id}` : null) || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last updated</span>
                          <p className="font-medium">{entry?.updated_at ? format(parseUTCDate(entry.updated_at), "PPp") : "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last updated by</span>
                          <p className="font-medium">{entry?.updated_by_display_name || (entry?.updated_by_user_id ? `User #${entry.updated_by_user_id}` : null) || "—"}</p>
                        </div>
                      </div>
                      {fieldsWithoutSection.map((field) => {
                        const fieldId = field.id || field.name || field.field_id;
                        const value = effectiveEntryData[fieldId];
                        const baseField = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id };
                        return (
                          <CustomFieldRenderer
                            key={fieldId}
                            field={getFieldWithStageFilteredStatusOptions(baseField, statusesForEditModeStage)}
                            value={value}
                            otherTextValue={effectiveEntryData[`${fieldId}_other`]}
                            optionFreeTextMap={effectiveEntryData[`${fieldId}_free_text`]}
                            onChange={handleFieldChange}
                            error={fieldErrors[fieldId]}
                            readOnly={isFieldDisabledByCondition(field, effectiveEntryData)}
                          />
                        );
                      })}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-3 px-4 rounded-lg bg-muted/40 text-sm">
                      <div><span className="text-muted-foreground">Created</span><p className="font-medium">{entry?.created_at ? format(parseUTCDate(entry.created_at), "PPp") : "—"}</p></div>
                      <div><span className="text-muted-foreground">Created by</span><p className="font-medium">{entry?.submitted_by_display_name || (entry?.submitted_by_user_id ? `User #${entry.submitted_by_user_id}` : null) || "—"}</p></div>
                      <div><span className="text-muted-foreground">Last updated</span><p className="font-medium">{entry?.updated_at ? format(parseUTCDate(entry.updated_at), "PPp") : "—"}</p></div>
                      <div><span className="text-muted-foreground">Last updated by</span><p className="font-medium">{entry?.updated_by_display_name || (entry?.updated_by_user_id ? `User #${entry.updated_by_user_id}` : null) || "—"}</p></div>
                    </div>
                    <p className="text-sm text-muted-foreground py-4">No shared fields for this tracker.</p>
                  </>
                )
              ) : (
                <>
                  {/* Non-stage-styled: Entry Data card when there are fields without section */}
                  {fieldsWithoutSection.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Entry Data</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {fieldsWithoutSection.map((field) => {
                          const fieldId = field.id || field.name || field.field_id;
                          const value = effectiveEntryData[fieldId];
                          const baseField = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id };
                          return (
                            <CustomFieldRenderer
                              key={fieldId}
                              field={getFieldWithStageFilteredStatusOptions(baseField, statusesForEditModeStage)}
                              value={value}
                              otherTextValue={effectiveEntryData[`${fieldId}_other`]}
                              optionFreeTextMap={effectiveEntryData[`${fieldId}_free_text`]}
                              onChange={handleFieldChange}
                              error={fieldErrors[fieldId]}
                              readOnly={isFieldDisabledByCondition(field, effectiveEntryData)}
                            />
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Render fields by section for editing (all sections when not stage-filtered) – collapsed except active stage */}
                  {sections.length > 0 && (
                    sections.map((section, sectionIndex) => {
                      const sectionKey = section.id ?? section.title ?? section.label ?? `section-${sectionIndex}`;
                      const sectionFields = getVisibleSectionFields(sectionKey, effectiveEntryData);
                      if (sectionFields.length === 0) return null;
                      const isActiveStage = sectionIndex === expandedSectionIndex;

                      return (
                        <Collapsible key={sectionKey} defaultOpen={isActiveStage} className="group rounded-lg border bg-card">
                          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 rounded-t-lg data-[state=open]:rounded-b-none transition-colors">
                            <span>{section.label || section.id}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <Card className="rounded-t-none border-t">
                              <CardContent className="pt-4 space-y-4">
                                {(() => {
                                  const allSectionFieldsForCtx = fieldsBySection[sectionKey]?.fields || [];
                                  const tableRadioCtx = {
                                    groups: section.groups || [],
                                    sectionFields: allSectionFieldsForCtx,
                                    entryData: effectiveEntryData,
                                    shouldShowRow: (row) => checkRowVisibility(row, effectiveEntryData),
                                    shouldShowField: (f) => checkFieldVisibility(f, effectiveEntryData),
                                  };
                                  return sectionFields.map((field) => {
                                    const fieldId = field.id || field.name || field.field_id;
                                    const value = effectiveEntryData[fieldId];
                                    const stageForSection = stageMapping[sectionIndex];
                                    const statusesForSectionStage = (stageForSection?.statuses ?? stageForSection?.status_list ?? []).filter(Boolean);
                                    const baseField = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id };
                                    return (
                                      <CustomFieldRenderer
                                        key={fieldId}
                                        field={getFieldWithStageFilteredStatusOptions(baseField, statusesForSectionStage.length ? statusesForSectionStage : statusesForEditModeStage)}
                                        value={value}
                                        otherTextValue={effectiveEntryData[`${fieldId}_other`]}
                                        optionFreeTextMap={effectiveEntryData[`${fieldId}_free_text`]}
                                        onChange={handleFieldChange}
                                        error={fieldErrors[fieldId]}
                                        readOnly={isFieldDisabledByCondition(field, effectiveEntryData)}
                                        sectionLayoutContext={tableRadioCtx}
                                      />
                                    );
                                  });
                                })()}
                              </CardContent>
                            </Card>
                          </CollapsibleContent>
                        </Collapsible>
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
                            const value = effectiveEntryData[fieldId];
                            const baseField = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id };
                            return (
                              <CustomFieldRenderer
                                key={fieldId}
                                field={getFieldWithStageFilteredStatusOptions(baseField, statusesForEditModeStage)}
                                value={value}
                                otherTextValue={effectiveEntryData[`${fieldId}_other`]}
                                optionFreeTextMap={effectiveEntryData[`${fieldId}_free_text`]}
                                onChange={handleFieldChange}
                                error={fieldErrors[fieldId]}
                                readOnly={isFieldDisabledByCondition(field, effectiveEntryData)}
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
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Entry data tab: shared/entry data (stage-styled) or full form (non-stage) */}
              {isStageStyledTracker ? (
                fieldsWithoutSection.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Entry data</CardTitle>
                      <p className="text-sm text-muted-foreground">Shared fields that apply across stages.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-3 px-4 rounded-lg bg-muted/40 text-sm">
                        <div><span className="text-muted-foreground">Created</span><p className="font-medium">{entry?.created_at ? format(parseUTCDate(entry.created_at), "PPp") : "—"}</p></div>
                        <div><span className="text-muted-foreground">Created by</span><p className="font-medium">{entry?.submitted_by_display_name || (entry?.submitted_by_user_id ? `User #${entry.submitted_by_user_id}` : null) || "—"}</p></div>
                        <div><span className="text-muted-foreground">Last updated</span><p className="font-medium">{entry?.updated_at ? format(parseUTCDate(entry.updated_at), "PPp") : "—"}</p></div>
                        <div><span className="text-muted-foreground">Last updated by</span><p className="font-medium">{entry?.updated_by_display_name || (entry?.updated_by_user_id ? `User #${entry.updated_by_user_id}` : null) || "—"}</p></div>
                      </div>
                      <div className="border-l-4 border-primary pl-3 py-1"><h3 className="text-sm font-semibold text-foreground">Entry data</h3></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        {fieldsWithoutSection.filter((f) => checkFieldVisibility(f, entry?.formatted_data || entry?.submission_data || {})).map((field) => {
                          const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                          const fieldId = field.id || field.name || field.field_id;
                          const mapped = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id, id: fieldId };
                          return (
                            <div key={fieldId} className="space-y-1">
                              <CustomFieldRenderer field={mapped} value={displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} optionFreeTextMap={displayData[`${fieldId}_free_text`]} readOnly />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-3 px-4 rounded-lg bg-muted/40 text-sm">
                      <div><span className="text-muted-foreground">Created</span><p className="font-medium">{entry?.created_at ? format(parseUTCDate(entry.created_at), "PPp") : "—"}</p></div>
                      <div><span className="text-muted-foreground">Created by</span><p className="font-medium">{entry?.submitted_by_display_name || (entry?.submitted_by_user_id ? `User #${entry.submitted_by_user_id}` : null) || "—"}</p></div>
                      <div><span className="text-muted-foreground">Last updated</span><p className="font-medium">{entry?.updated_at ? format(parseUTCDate(entry.updated_at), "PPp") : "—"}</p></div>
                      <div><span className="text-muted-foreground">Last updated by</span><p className="font-medium">{entry?.updated_by_display_name || (entry?.updated_by_user_id ? `User #${entry.updated_by_user_id}` : null) || "—"}</p></div>
                    </div>
                    <p className="text-sm text-muted-foreground py-4">No shared fields for this tracker.</p>
                  </>
                )
              ) : (
                <>
                  {/* Non-stage-styled: Entry Data card when there are fields without section */}
                  {fieldsWithoutSection.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Entry Data</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="border-l-4 border-primary pl-3 py-1"><h3 className="text-sm font-semibold text-foreground">Entry data</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                          {fieldsWithoutSection.filter((f) => checkFieldVisibility(f, entry?.formatted_data || entry?.submission_data || {})).map((field) => {
                            const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                            const fieldId = field.id || field.name || field.field_id;
                            const mapped = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id, id: fieldId };
                            return (
                              <div key={fieldId} className="space-y-1">
                                <CustomFieldRenderer field={mapped} value={displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} optionFreeTextMap={displayData[`${fieldId}_free_text`]} readOnly />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Form-entry-style layout: sections with labels and groups (like Forms submission view) */}
                  {trackerReadOnlyLayout.length > 0 ? (
                    trackerReadOnlyLayout.map(({ sectionKey, sectionLabel, ungrouped, groupsWithFields }, sectionIndex) => {
                      const submissionRaw = entry.submission_data || entry.entry_data || {};
                      const formatted = entry.formatted_data || {};
                      const displayData = { ...submissionRaw, ...formatted, ...effectiveEntryData };
                      const hasContent = ungrouped.some((f) => checkFieldVisibility(f, displayData)) || groupsWithFields.some(({ group, fields }) => checkGroupVisibility(group, displayData) && fields.some((f) => checkFieldVisibility(f, displayData)));
                      if (!hasContent) return null;
                      const isActiveStage = sectionIndex === expandedSectionIndex;
                      const mapFieldToMapped = (field) => {
                        const fieldId = field.id || field.name || field.field_id;
                        return { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id, id: fieldId };
                      };
                      return (
                        <Collapsible key={sectionKey} defaultOpen={isActiveStage} className="group rounded-lg border bg-card">
                          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 rounded-t-lg data-[state=open]:rounded-b-none transition-colors">
                            <span>{sectionLabel}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="rounded-b-lg border border-t-0 bg-background px-4 pb-4 pt-3 space-y-4">
                              <div className="border-l-4 border-primary pl-3 py-1">
                                <h3 className="text-sm font-semibold text-foreground">{sectionLabel}</h3>
                              </div>
                              {ungrouped.filter((f) => checkFieldVisibility(f, displayData)).map((field) => {
                                const fieldId = field.id || field.name || field.field_id;
                                return (
                                  <div key={fieldId} className="space-y-1">
                                    <CustomFieldRenderer field={mapFieldToMapped(field)} value={displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} optionFreeTextMap={displayData[`${fieldId}_free_text`]} readOnly />
                                  </div>
                                );
                              })}
                              {groupsWithFields.map(({ group, fields: groupFields }) => {
                                if (!checkGroupVisibility(group, displayData)) return null;
                                const visibleFields = groupFields.filter((f) => checkFieldVisibility(f, displayData));
                                if (visibleFields.length === 0) return null;
                                const getFieldById = (fid) => groupFields.find((f) => String(f.id || f.name || f.field_id) === String(fid));
                                const layout = (group.layout || "stack").toLowerCase();
                                const hasTableStructure = Array.isArray(group.table_columns) && group.table_columns.length > 0;
                                const tableRows = Array.isArray(group.table_rows) ? group.table_rows : [];
                                const isTable = layout === "table" && (hasTableStructure || tableRows.length > 0);
                                const gridRows = (group.grid_rows && group.grid_rows.length > 0) ? group.grid_rows : (group.grid_columns ? [{ ...group.grid_columns }] : []);
                                const isGrid = layout === "grid" && gridRows.length > 0;
                                return (
                                  <div key={group.id || group.label || "g"} className="space-y-2">
                                    {group.label && <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{group.label}</h4>}
                                    {isTable ? (
                                      (() => {
                                        const tableCols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "" }];
                                        const rows = tableRows.length > 0 ? tableRows : [{ cells: tableCols.map(() => ({ text: "", field_id: null })) }];
                                        return (
                                          <div className="overflow-x-auto rounded-md border">
                                            <table className="w-full border-collapse text-sm">
                                              <thead>
                                                <tr className="border-b bg-muted/50">
                                                  {tableCols.map((col) => (
                                                    <th key={col.id} className="text-left font-medium p-2">{String(col?.label ?? "").trim()}</th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {rows.map((row, originalIdx) => {
                                                  if (!checkRowVisibility(row, displayData)) return null;
                                                  const cells = (row.cells || []).slice(0, tableCols.length);
                                                  while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                                                  return (
                                                    <tr key={originalIdx} className="border-b last:border-b-0">
                                                      {cells.map((cell, cIdx) => {
                                                        const fieldId = cell.field_id ? String(cell.field_id) : null;
                                                        const field = fieldId ? getFieldById(fieldId) : null;
                                                        if (!field && !cell.text) return <td key={cIdx} className="p-2" />;
                                                        if (field && !checkFieldVisibility(field, displayData)) return <td key={cIdx} className="p-2" />;
                                                        const rawVal = fieldId != null ? displayData[fieldId] : undefined;
                                                        const rawOther = fieldId != null ? displayData[`${fieldId}_other`] : undefined;
                                                        const rawFreeText = fieldId != null ? displayData[`${fieldId}_free_text`] : undefined;
                                                        const cellValue = Array.isArray(rawVal) ? rawVal[originalIdx] : rawVal;
                                                        const cellOtherValue = Array.isArray(rawOther) ? rawOther[originalIdx] : rawOther;
                                                        const cellFreeTextMap = Array.isArray(rawFreeText) ? rawFreeText[originalIdx] : rawFreeText;
                                                        return (
                                                          <td key={cIdx} className="p-2 align-top">
                                                            <div className="space-y-1">
                                                              {cell.text ? <span className="text-muted-foreground text-xs block">{cell.text}</span> : null}
                                                              {field && (
                                                                <CustomFieldRenderer
                                                                  field={mapFieldToMapped(field)}
                                                                  value={cellValue}
                                                                  otherTextValue={cellOtherValue}
                                                                  optionFreeTextMap={cellFreeTextMap}
                                                                  readOnly
                                                                />
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
                                      })()
                                    ) : isGrid ? (
                                      <div className="space-y-4">
                                        {gridRows.filter((gridRow) => checkRowVisibility(gridRow, displayData)).map((gridRow, rowIdx) => {
                                          const colIds = normalizeGridRowColumns(gridRow);
                                          const colFields = filterNonEmptyGridColumns(
                                            colIds.map((ids) =>
                                              ids.map((fid) => getFieldById(fid)).filter(Boolean).filter((f) => checkFieldVisibility(f, displayData)),
                                            ),
                                          );
                                          if (colFields.length === 0) return null;
                                          const rowTitle = gridRow.label || gridRow.title;
                                          const renderReadonlyStack = (field) => {
                                            const fieldId = field.id || field.name || field.field_id;
                                            return (
                                              <div key={fieldId} className={cn(["text_block", "image_block", "image_free_draw", "youtube_video_embed"].includes((field.type || field.field_type || "").toLowerCase()) && "md:col-span-2")}>
                                                <CustomFieldRenderer field={mapFieldToMapped(field)} value={displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} optionFreeTextMap={displayData[`${fieldId}_free_text`]} readOnly />
                                              </div>
                                            );
                                          };
                                          return (
                                            <div key={`row-${rowIdx}`} className="space-y-3">
                                              {rowTitle && (
                                                <h4 className="text-sm font-medium text-foreground border-b pb-1">{rowTitle}</h4>
                                              )}
                                              <div className={trackerGridRowColsClass(colFields.length)}>
                                                {colFields.map((fields, colIdx) => (
                                                  <div key={colIdx} className="space-y-2">
                                                    {fields.map((field) => renderReadonlyStack(field))}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className={layout === "stack" ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"}>
                                        {visibleFields.map((field) => {
                                          const fieldId = field.id || field.name || field.field_id;
                                          return (
                                            <div key={fieldId} className={cn("space-y-1", ["text_block", "image_block", "image_free_draw", "youtube_video_embed"].includes((field.type || field.field_type || "").toLowerCase()) && "md:col-span-2")}>
                                              <CustomFieldRenderer field={mapFieldToMapped(field)} value={displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} optionFreeTextMap={displayData[`${fieldId}_free_text`]} readOnly />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })
                  ) : null}

                  {/* Fallback: If no sections and no fields without sections, show all fields */}
                  {sections.length === 0 && fieldsWithoutSection.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Entry Data</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {trackerFields.length > 0 ? (
                          <>
                            <div className="border-l-4 border-primary pl-3 py-1"><h3 className="text-sm font-semibold text-foreground">Entry data</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                              {trackerFields.filter((f) => checkFieldVisibility(f, entry?.formatted_data || entry?.submission_data || {})).map((field) => {
                                const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                                const fieldId = field.id || field.name || field.field_id;
                                const mapped = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id, id: fieldId };
                                return (
                                  <div key={fieldId} className="space-y-1">
                                    <CustomFieldRenderer field={mapped} value={displayData[fieldId]} otherTextValue={displayData[`${fieldId}_other`]} optionFreeTextMap={displayData[`${fieldId}_free_text`]} readOnly />
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No fields defined for this tracker</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              )}
            </div>
          )}
            </TabsContent>
            {stageMapping?.map((s, sectionIndex) => {
              const stageName = String(s?.stage ?? s?.name ?? "").trim();
              if (!stageName) return null;
              const section = sections[sectionIndex];
              if (!section) return null;
              const sectionKey = section.id ?? section.title ?? section.label ?? `section-${sectionIndex}`;
              const submissionRaw = entry?.submission_data || entry?.entry_data || {};
              const formatted = entry?.formatted_data || {};
              const displayData = { ...submissionRaw, ...formatted, ...effectiveEntryData };
              const allSectionFieldsForStage = fieldsBySection[sectionKey]?.fields || [];
              const sectionFields = getVisibleSectionFields(sectionKey, isEditing ? effectiveEntryData : displayData);
              const statusesForThisStage = (s?.statuses ?? s?.status_list ?? []).filter(Boolean);
              const isThisStageTabActive = effectiveFormsSubTab === stageName;
              const hasAnyFieldsInStage = allSectionFieldsForStage.length > 0;
              return (
                <TabsContent key={stageName} value={stageName} className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="p-6">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <CardTitle className="text-lg m-0">{section.label || section.id}</CardTitle>
                        {canEditCase && !isClosed && !isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => {
                            setEditModeStage(stageName);
                            setFormsSubTab(stageName);
                            const statuses = (s?.statuses ?? s?.status_list ?? []).filter(Boolean);
                            if (statuses.length > 0 && entry?.status) {
                              setEntryStatus(statuses.includes(entry.status) ? entry.status : statuses[0]);
                            }
                            setIsEditing(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit fields
                        </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!hasAnyFieldsInStage ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-sm text-muted-foreground m-0">No fields in this stage.</p>
                          {canEditCase && !isClosed && !isEditing && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 w-fit"
                              onClick={() => {
                                setEditModeStage(stageName);
                                setFormsSubTab(stageName);
                                const statuses = (s?.statuses ?? s?.status_list ?? []).filter(Boolean);
                                if (statuses.length > 0 && entry?.status) {
                                  setEntryStatus(statuses.includes(entry.status) ? entry.status : statuses[0]);
                                }
                                setIsEditing(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit fields
                            </Button>
                          )}
                        </div>
                      ) : isEditing && isThisStageTabActive ? (
                        (() => {
                          const layoutItemEdit = trackerReadOnlyLayout[sectionIndex];
                          const allFieldsForEdit = allSectionFieldsForStage;
                          const tableRadioSectionLayoutContext = {
                            groups: section.groups || [],
                            sectionFields: allFieldsForEdit,
                            entryData: effectiveEntryData,
                            shouldShowRow: (row) => checkRowVisibility(row, effectiveEntryData),
                            shouldShowField: (f) => checkFieldVisibility(f, effectiveEntryData),
                          };
                          if (!layoutItemEdit || !layoutItemEdit.groupsWithFields?.length) {
                            return allFieldsForEdit.map((field) => {
                              const fieldId = field.id || field.name || field.field_id;
                              const value = effectiveEntryData[fieldId];
                              const baseField = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id };
                              return (
                                <div key={fieldId} className="space-y-1">
                                  <CustomFieldRenderer
                                    field={getFieldWithStageFilteredStatusOptions(baseField, statusesForThisStage.length ? statusesForThisStage : statusesForEditModeStage)}
                                    value={value}
                                    otherTextValue={effectiveEntryData[`${fieldId}_other`]}
                                    optionFreeTextMap={effectiveEntryData[`${fieldId}_free_text`]}
                                    onChange={handleFieldChange}
                                    error={fieldErrors[fieldId]}
                                    readOnly={isFieldDisabledByCondition(field, effectiveEntryData)}
                                    sectionLayoutContext={tableRadioSectionLayoutContext}
                                  />
                                </div>
                              );
                            });
                          }
                          const { ungrouped: editUngrouped, groupsWithFields: editGroups } = layoutItemEdit;
                          const tableRadioBoundGroupIds = new Set(
                            allFieldsForEdit
                              .filter((f) => (f.type || f.field_type) === "table_radio" && f.field_options?.table_group_id)
                              .map((f) => String(f.field_options.table_group_id)),
                          );
                          const getFieldByIdEdit = (fid) => allFieldsForEdit.find((f) => String(f.id || f.name || f.field_id) === String(fid));
                          const renderEditableField = (field) => {
                            const fieldId = field.id || field.name || field.field_id;
                            const value = effectiveEntryData[fieldId];
                            const baseField = { ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id };
                            return (
                              <CustomFieldRenderer
                                key={fieldId}
                                field={getFieldWithStageFilteredStatusOptions(baseField, statusesForThisStage.length ? statusesForThisStage : statusesForEditModeStage)}
                                value={value}
                                otherTextValue={effectiveEntryData[`${fieldId}_other`]}
                                optionFreeTextMap={effectiveEntryData[`${fieldId}_free_text`]}
                                onChange={handleFieldChange}
                                error={fieldErrors[fieldId]}
                                readOnly={isFieldDisabledByCondition(field, effectiveEntryData)}
                                sectionLayoutContext={tableRadioSectionLayoutContext}
                              />
                            );
                          };
                          return (
                            <div className="space-y-4">
                              {editGroups.map(({ group, fields: groupFields }) => {
                                if (!checkGroupVisibility(group, effectiveEntryData)) return null;
                                const layout = (group.layout || "stack").toLowerCase();
                                const hasTableStructure = Array.isArray(group.table_columns) && group.table_columns.length > 0;
                                const tableRowsForGroup = Array.isArray(group.table_rows) ? group.table_rows : [];
                                const isTable = layout === "table" && (hasTableStructure || tableRowsForGroup.length > 0);
                                if (isTable && group.id && tableRadioBoundGroupIds.has(String(group.id))) {
                                  return null;
                                }
                                const gridRows = (group.grid_rows && group.grid_rows.length > 0) ? group.grid_rows : (group.grid_columns ? [{ ...group.grid_columns }] : []);
                                const isGrid = layout === "grid" && gridRows.length > 0;
                                const groupLabel = group.label || group.title || group.name || "";
                                if (isTable && tableRowsForGroup.length === 0 && !hasTableStructure) return null;
                                if (isGrid && gridRows.length === 0) return null;
                                return (
                                  <div key={group.id || group.label || "g"} className="space-y-2">
                                    {groupLabel ? <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{groupLabel}</h4> : null}
                                    {isTable ? (
                                      <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full border-collapse text-sm">
                                          <thead>
                                            <tr className="border-b bg-muted/50">
                                            {(Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "" }]).map((col) => (
                                              <th key={col.id} className="text-left font-medium p-2">{String(col?.label ?? "").trim()}</th>
                                            ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(tableRowsForGroup.length > 0 ? tableRowsForGroup : [{ cells: (group.table_columns || [{ id: "c1" }]).map(() => ({ text: "", field_id: null })) }]).map((row, rIdx) => {
                                              if (!checkRowVisibility(row, effectiveEntryData)) return null;
                                              const tableCols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "" }];
                                              const cells = (row.cells || []).slice(0, tableCols.length);
                                              while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                                              return (
                                                <tr key={rIdx} className="border-b last:border-b-0">
                                                  {cells.map((cell, cIdx) => {
                                                    const fieldId = cell.field_id ? String(cell.field_id) : null;
                                                    const field = fieldId ? getFieldByIdEdit(fieldId) : null;
                                                    if (!field && !cell.text) return <td key={cIdx} className="p-2" />;
                                                    if (field && !checkFieldVisibility(field, effectiveEntryData)) return <td key={cIdx} className="p-2" />;
                                                    return (
                                                      <td key={cIdx} className="p-2 align-top">
                                                        <div className="space-y-1">
                                                          {cell.text ? <span className="text-muted-foreground text-xs block">{cell.text}</span> : null}
                                                          {field && renderEditableField(field)}
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
                                    ) : isGrid ? (
                                      <div className="space-y-4">
                                        {gridRows.filter((gridRow) => checkRowVisibility(gridRow, effectiveEntryData)).map((gridRow, rowIdx) => {
                                          const colIds = normalizeGridRowColumns(gridRow);
                                          const colFields = filterNonEmptyGridColumns(
                                            colIds.map((ids) =>
                                              ids.map((fid) => getFieldByIdEdit(fid)).filter(Boolean).filter((f) => checkFieldVisibility(f, effectiveEntryData)),
                                            ),
                                          );
                                          if (colFields.length === 0) return null;
                                          const rowTitleEdit = gridRow.label || gridRow.title;
                                          return (
                                            <div key={`row-${rowIdx}`} className="space-y-3">
                                              {rowTitleEdit && (
                                                <h4 className="text-sm font-medium text-foreground border-b pb-1">{rowTitleEdit}</h4>
                                              )}
                                              <div className={trackerGridRowColsClass(colFields.length)}>
                                                {colFields.map((fields, colIdx) => (
                                                  <div key={colIdx} className="space-y-2">
                                                    {fields.map((f) => renderEditableField(f))}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className={layout === "stack" ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"}>
                                        {groupFields.map((field) => (
                                          <div key={field.id || field.name || field.field_id} className={cn("space-y-1", ["text_block", "image_block", "image_free_draw", "youtube_video_embed"].includes((field.type || field.field_type || "").toLowerCase()) && "md:col-span-2")}>
                                            {renderEditableField(field)}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {editUngrouped.map((field) => (
                                <div key={field.id || field.name || field.field_id} className="space-y-1">
                                  {renderEditableField(field)}
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      ) : (() => {
                        const layoutItem = trackerReadOnlyLayout[sectionIndex];
                        if (!layoutItem) {
                          const tableRadioReadOnlyCtxFlat = {
                            groups: section.groups || [],
                            sectionFields: fieldsBySection[sectionKey]?.fields || [],
                            entryData: displayData,
                            shouldShowRow: (row) => checkRowVisibility(row, displayData),
                            shouldShowField: (f) => checkFieldVisibility(f, displayData),
                          };
                          return sectionFields.map((field) => {
                            const fieldId = field.id || field.name || field.field_id;
                            return (
                              <div key={fieldId} className="space-y-1">
                                <CustomFieldRenderer
                                  field={{ ...field, type: field.type || field.field_type, field_label: field.label || field.name, id: fieldId }}
                                  value={displayData[fieldId]}
                                  otherTextValue={displayData[`${fieldId}_other`]}
                                  optionFreeTextMap={displayData[`${fieldId}_free_text`]}
                                  readOnly
                                  sectionLayoutContext={tableRadioReadOnlyCtxFlat}
                                />
                              </div>
                            );
                          });
                        }
                        const { ungrouped: roUngrouped, groupsWithFields: roGroups } = layoutItem;
                        const mapFieldToMapped = (field) => ({ ...field, type: field.type || field.field_type, field_label: field.label || field.field_label || field.name, field_name: field.name || field.id, id: field.id || field.name || field.field_id });
                        // Full section fields for resolving table/grid cell field_id when group.fields is empty (e.g. Procedure(s) table)
                        const allSectionFields = fieldsBySection[sectionKey]?.fields || [];
                        const tableRadioReadOnlyCtx = {
                          groups: section.groups || [],
                          sectionFields: allSectionFields,
                          entryData: displayData,
                          shouldShowRow: (row) => checkRowVisibility(row, displayData),
                          shouldShowField: (f) => checkFieldVisibility(f, displayData),
                        };
                        const tableRadioBoundGroupIdsRo = new Set(
                          allSectionFields
                            .filter((f) => (f.type || f.field_type) === "table_radio" && f.field_options?.table_group_id)
                            .map((f) => String(f.field_options.table_group_id)),
                        );
                        // Priority: layout first (groups with Stack/Grid/Table), then ungrouped stage fields at the end
                        return (
                          <div className="space-y-4">
                            {roGroups.map(({ group, fields: groupFields }) => {
                              if (!checkGroupVisibility(group, displayData)) return null;
                              const layout = (group.layout || "stack").toLowerCase();
                              const hasTableStructure = Array.isArray(group.table_columns) && group.table_columns.length > 0;
                              const tableRowsForGroup = Array.isArray(group.table_rows) ? group.table_rows : [];
                              const isTable = layout === "table" && (hasTableStructure || tableRowsForGroup.length > 0);
                              if (isTable && group.id && tableRadioBoundGroupIdsRo.has(String(group.id))) {
                                return null;
                              }
                              const gridRows = (group.grid_rows && group.grid_rows.length > 0) ? group.grid_rows : (group.grid_columns ? [{ ...group.grid_columns }] : []);
                              const isGrid = layout === "grid" && gridRows.length > 0;
                              // Resolve field by id: group.fields first, then section fields (for table/grid where group.fields can be empty)
                              const getFieldById = (fid) => groupFields.find((f) => String(f.id || f.name || f.field_id) === String(fid)) ?? allSectionFields.find((f) => String(f.id || f.name || f.field_id) === String(fid));
                              const visibleFields = groupFields.filter((f) => checkFieldVisibility(f, displayData));
                              // Skip only when stack and no visible fields; table/grid can have fields only in table_rows/grid_rows
                              if (!isTable && !isGrid && visibleFields.length === 0) return null;
                              if (isTable && tableRowsForGroup.length === 0 && !hasTableStructure) return null;
                              if (isGrid && gridRows.length === 0) return null;
                              const groupLabelRo = group.label || group.title || group.name || "";
                              return (
                                <div key={group.id || group.label || "g"} className="space-y-2">
                                  {groupLabelRo ? <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{groupLabelRo}</h4> : null}
                                  {isTable ? (
                                    (() => {
                                      const tableCols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "" }];
                                      const rows = tableRowsForGroup.length > 0 ? tableRowsForGroup : [{ cells: tableCols.map(() => ({ text: "", field_id: null })) }];
                                      return (
                                        <div className="overflow-x-auto rounded-md border">
                                          <table className="w-full border-collapse text-sm">
                                            <thead>
                                              <tr className="border-b bg-muted/50">
                                                {tableCols.map((col) => (
                                                  <th key={col.id} className="text-left font-medium p-2">{String(col?.label ?? "").trim()}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {rows.map((row, originalIdx) => {
                                                if (!checkRowVisibility(row, displayData)) return null;
                                                const cells = (row.cells || []).slice(0, tableCols.length);
                                                while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                                                return (
                                                  <tr key={originalIdx} className="border-b last:border-b-0">
                                                    {cells.map((cell, cIdx) => {
                                                      const fieldId = cell.field_id ? String(cell.field_id) : null;
                                                      const field = fieldId ? getFieldById(fieldId) : null;
                                                      if (!field && !cell.text) return <td key={cIdx} className="p-2" />;
                                                      if (field && !checkFieldVisibility(field, displayData)) return <td key={cIdx} className="p-2" />;
                                                      const rawVal = fieldId != null ? displayData[fieldId] : undefined;
                                                      const rawOther = fieldId != null ? displayData[`${fieldId}_other`] : undefined;
                                                      const rawFreeText = fieldId != null ? displayData[`${fieldId}_free_text`] : undefined;
                                                      const cellValue = Array.isArray(rawVal) ? rawVal[originalIdx] : rawVal;
                                                      const cellOtherValue = Array.isArray(rawOther) ? rawOther[originalIdx] : rawOther;
                                                      const cellFreeTextMap = Array.isArray(rawFreeText) ? rawFreeText[originalIdx] : rawFreeText;
                                                      return (
                                                        <td key={cIdx} className="p-2 align-top">
                                                          <div className="space-y-1">
                                                            {cell.text ? <span className="text-muted-foreground text-xs block">{cell.text}</span> : null}
                                                            {field && (
                                                              <CustomFieldRenderer
                                                                field={mapFieldToMapped(field)}
                                                                value={cellValue}
                                                                otherTextValue={cellOtherValue}
                                                                optionFreeTextMap={cellFreeTextMap}
                                                                readOnly
                                                                sectionLayoutContext={tableRadioReadOnlyCtx}
                                                              />
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
                                    })()
                                  ) : isGrid ? (
                                    <div className="space-y-4">
                                      {gridRows.filter((gridRow) => checkRowVisibility(gridRow, displayData)).map((gridRow, rowIdx) => {
                                        const colIds = normalizeGridRowColumns(gridRow);
                                        const colFields = filterNonEmptyGridColumns(
                                          colIds.map((ids) =>
                                            ids.map((fid) => getFieldById(fid)).filter(Boolean).filter((f) => checkFieldVisibility(f, displayData)),
                                          ),
                                        );
                                        if (colFields.length === 0) return null;
                                        const rowTitleStage = gridRow.label || gridRow.title;
                                        const renderRo = (field) => {
                                          const fieldId = field.id || field.name || field.field_id;
                                          return (
                                            <div key={fieldId} className={cn(["text_block", "image_block", "image_free_draw", "youtube_video_embed"].includes((field.type || field.field_type || "").toLowerCase()) && "md:col-span-2")}>
                                              <CustomFieldRenderer
                                                field={mapFieldToMapped(field)}
                                                value={displayData[fieldId]}
                                                otherTextValue={displayData[`${fieldId}_other`]}
                                                optionFreeTextMap={displayData[`${fieldId}_free_text`]}
                                                readOnly
                                                sectionLayoutContext={tableRadioReadOnlyCtx}
                                              />
                                            </div>
                                          );
                                        };
                                        return (
                                          <div key={`row-${rowIdx}`} className="space-y-3">
                                            {rowTitleStage && (
                                              <h4 className="text-sm font-medium text-foreground border-b pb-1">{rowTitleStage}</h4>
                                            )}
                                            <div className={trackerGridRowColsClass(colFields.length)}>
                                              {colFields.map((fields, colIdx) => (
                                                <div key={colIdx} className="space-y-2">
                                                  {fields.map((field) => renderRo(field))}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className={layout === "stack" ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"}>
                                      {visibleFields.map((field) => {
                                        const fieldId = field.id || field.name || field.field_id;
                                        return (
                                          <div key={fieldId} className={cn("space-y-1", ["text_block", "image_block", "image_free_draw", "youtube_video_embed"].includes((field.type || field.field_type || "").toLowerCase()) && "md:col-span-2")}>
                                            <CustomFieldRenderer
                                              field={mapFieldToMapped(field)}
                                              value={displayData[fieldId]}
                                              otherTextValue={displayData[`${fieldId}_other`]}
                                              optionFreeTextMap={displayData[`${fieldId}_free_text`]}
                                              readOnly
                                              sectionLayoutContext={tableRadioReadOnlyCtx}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* All stage fields not in any layout group, shown at the end */}
                            {roUngrouped.filter((f) => checkFieldVisibility(f, displayData)).map((field) => {
                              const fieldId = field.id || field.name || field.field_id;
                              return (
                                <div key={fieldId} className="space-y-1">
                                  <CustomFieldRenderer
                                    field={mapFieldToMapped(field)}
                                    value={displayData[fieldId]}
                                    otherTextValue={displayData[`${fieldId}_other`]}
                                    optionFreeTextMap={displayData[`${fieldId}_free_text`]}
                                    readOnly
                                    sectionLayoutContext={tableRadioReadOnlyCtx}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Next stage & status at bottom of Forms tab (same as public submit page). When current stage has no fields, allow editing without "Edit fields". */}
          {isStageStyledTracker && stageMapping.length > 0 && (() => {
            const curStage = String(entry?.formatted_data?.derived_stage ?? "").trim();
            const curStageItem = stageMapping.find((s) => String(s?.stage ?? s?.name ?? "").trim() === curStage);
            const currentStageStatusesList = (curStageItem?.statuses ?? curStageItem?.status_list ?? []).filter(Boolean);
            const allowedNext = curStageItem?.allowed_next_stages ?? [];
            const nextStagesList = Array.isArray(allowedNext) && allowedNext.length > 0
              ? allowedNext.map((name) => {
                  const item = stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === (name ?? "").toString().trim());
                  const statuses = (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
                  return { stage: (name ?? "").toString().trim(), statuses };
                }).filter((s) => s.stage)
              : stageMapping.filter((s, i) => i !== stageMapping.findIndex((m) => (m?.stage ?? m?.name ?? "").toString().trim() === curStage)).map((s) => ({
                  stage: String(s?.stage ?? s?.name ?? "").trim(),
                  statuses: (s?.statuses ?? s?.status_list ?? []).filter(Boolean),
                })).filter((s) => s.stage);
            const hasNextOrStatus = nextStagesList.length > 0 || currentStageStatusesList.length > 0;
            const curStageSectionIndex = stageMapping.findIndex((m) => String(m?.stage ?? m?.name ?? "").trim() === curStage);
            const curSectionKey = curStageSectionIndex >= 0 && sections[curStageSectionIndex] ? (sections[curStageSectionIndex].id ?? sections[curStageSectionIndex].title ?? sections[curStageSectionIndex].label ?? `section-${curStageSectionIndex}`) : null;
            const currentStageHasNoFields = curSectionKey ? !(fieldsBySection[curSectionKey]?.fields?.length > 0) : false;
            const canEditStageStatusWithoutForm = currentStageHasNoFields && canEditCase && !isClosed;
            const dropdownsEnabled = isEditing || canEditStageStatusWithoutForm;
            if (!hasNextOrStatus) return null;
            const effectiveStageForStatus = dropdownsEnabled ? (editModeStage || curStage) : curStage;
            const statusOptionsForStage = (stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === (effectiveStageForStatus ?? "").toString().trim())?.statuses ?? stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === (effectiveStageForStatus ?? "").toString().trim())?.status_list ?? []) || currentStageStatusesList;
            const statusOptionsFiltered = Array.isArray(statusOptionsForStage) ? statusOptionsForStage.filter(Boolean) : [];
            return (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-muted-foreground">Next stage &amp; status</div>
                    <div className="flex flex-wrap gap-4 items-end">
                      {nextStagesList.length > 0 && (
                        <div className="space-y-2 min-w-[180px]">
                          <Label htmlFor="forms-next-stage" className="text-sm">Next stage</Label>
                          <Select
                            value={(editModeStage && editModeStage !== curStage) ? editModeStage : "__current__"}
                            onValueChange={(v) => {
                              if (!dropdownsEnabled) return;
                              if (v && v !== "__current__") {
                                setEditModeStage(v);
                                const item = stageMapping.find((s) => (s?.stage ?? s?.name ?? "").toString().trim() === v);
                                const statuses = (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
                                setEntryStatus(statuses.includes(entry?.status) ? entry.status : (statuses[0] ?? ""));
                              } else {
                                setEditModeStage(curStage || "");
                                setEntryStatus(entry?.status ?? (currentStageStatusesList[0] ?? ""));
                              }
                            }}
                            disabled={!dropdownsEnabled}
                          >
                            <SelectTrigger id="forms-next-stage" className="w-full">
                              <SelectValue placeholder="Stay in current stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__current__">Stay in current stage</SelectItem>
                              {nextStagesList.map((s) => (
                                <SelectItem key={s.stage} value={s.stage}>{s.stage}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {statusOptionsFiltered.length > 0 && (
                        <div className="space-y-2 min-w-[180px]">
                          <Label htmlFor="forms-status" className="text-sm">Status</Label>
                          <Select
                            value={entryStatus || "__none__"}
                            onValueChange={(v) => dropdownsEnabled && v && v !== "__none__" && setEntryStatus(v)}
                            disabled={!dropdownsEnabled}
                          >
                            <SelectTrigger id="forms-status" className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— No change —</SelectItem>
                              {statusOptionsFiltered.map((statusVal) => (
                                <SelectItem key={statusVal} value={statusVal}>{humanizeStatusForDisplay(statusVal)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    {!dropdownsEnabled && (
                      <p className="text-xs text-muted-foreground">Click &quot;Edit fields&quot; above to change stage or status and save.</p>
                    )}
                    {canEditStageStatusWithoutForm && !isEditing && (
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const payload = { submission_data: entry?.submission_data || entry?.formatted_data || entry?.entry_data || {}, status: entryStatus };
                              if (editModeStage && editModeStage.trim() !== curStage) payload.stage = editModeStage.trim();
                              const updatedEntry = await updateEntryMutation.mutateAsync({ entryIdentifier: entrySlug, entryData: payload });
                              const newStage = (updatedEntry?.formatted_data?.derived_stage ?? editModeStage ?? "").toString().trim();
                              if (newStage && isStageStyledTracker) {
                                setActiveStageTab(newStage);
                                setFormsSubTab(newStage);
                                setEditModeStage(newStage);
                              }
                              if (updatedEntry?.status != null) setEntryStatus(updatedEntry.status);
                              await refetchEntry?.();
                            } catch (e) {
                              // Error toast handled by mutation
                            }
                          }}
                          disabled={updateEntryMutation.isPending}
                        >
                          {updateEntryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          Update stage &amp; status
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Save and Cancel at bottom of Forms tab when editing */}
          {isEditing && activeTab === "forms" && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pt-4 border-t">
              <Button onClick={handleSave} disabled={updateEntryMutation.isPending} size="sm">
                {updateEntryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Communications Tab – sub-tabs: SMS, WhatsApp, Portal, Email, Letter */}
        <TabsContent value="communication" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Communications</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Messages between the patient and the care team (sent from this platform). Not for general comments or notes.</p>
            </CardHeader>
            <CardContent>
              <Tabs value={communicationsSubTab} onValueChange={setCommunicationsSubTab} className="w-full">
                <div className="overflow-x-auto overflow-y-hidden mb-4 -mx-2 px-2 scrollbar-hide md:overflow-x-visible min-w-0" style={{ WebkitOverflowScrolling: "touch" }}>
                  <TabsList className="bg-muted/50 flex flex-nowrap gap-1 w-max min-w-full md:min-w-0 md:flex-wrap px-3 py-1 [&>*]:shrink-0">
                    <TabsTrigger value="sms"><Smartphone className="mr-1.5 h-3.5 w-3.5" />SMS</TabsTrigger>
                    <TabsTrigger value="whatsapp"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />WhatsApp</TabsTrigger>
                    <TabsTrigger value="portal"><Globe className="mr-1.5 h-3.5 w-3.5" />Portal</TabsTrigger>
                    <TabsTrigger value="email"><Mail className="mr-1.5 h-3.5 w-3.5" />Email</TabsTrigger>
                    <TabsTrigger value="letter"><FileText className="mr-1.5 h-3.5 w-3.5" />Letter</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="sms" className="mt-0">
                  <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden flex flex-col min-h-[320px] max-h-[520px]">
                    {/* Message thread – scroll to latest when thread loads or updates */}
                    <div
                      ref={smsThreadScrollRef}
                      className="flex-1 min-h-[180px] max-h-[380px] overflow-y-auto p-4 flex flex-col gap-3 bg-gradient-to-b from-muted/20 to-muted/5"
                    >
                      {smsThreadLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                          <div className="rounded-full bg-muted/80 p-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                          <span className="text-sm font-medium">Loading messages…</span>
                        </div>
                      ) : smsThread.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                          <div className="rounded-full bg-muted/60 p-4 mb-3">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">No messages yet</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">Send an SMS or wait for a reply from the patient.</p>
                        </div>
                      ) : (
                        smsThread.map((item) => (
                          <div
                            key={item.id}
                            className={cn("flex gap-2", item.type === "inbound" ? "justify-start" : "justify-end")}
                          >
                            {item.type === "inbound" && (
                              <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
                                item.type === "inbound"
                                  ? "rounded-tl-md bg-background border border-border/80 text-foreground"
                                  : "rounded-tr-md bg-primary text-primary-foreground"
                              )}
                            >
                              {item.type === "inbound" && item.source_address && (
                                <p className="text-[11px] font-medium text-muted-foreground mb-1">{item.source_address}</p>
                              )}
                              <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{item.content}</p>
                              <p className={cn("text-[11px] mt-1.5", item.type === "inbound" ? "text-muted-foreground" : "text-primary-foreground/80")}>
                                {item.timestamp ? format(parseUTCDate(item.timestamp), "d MMM, HH:mm") : ""}
                                {item.type === "sent" && item.user_name ? ` · ${item.user_name}` : ""}
                              </p>
                            </div>
                            {item.type === "inbound" && (
                              <div className="shrink-0 flex flex-col items-center justify-center gap-0.5 mt-0.5">
                                {item.acknowledged_at ? (
                                  <Badge variant="secondary" className="text-[10px] font-normal py-0.5 px-1.5 whitespace-nowrap">
                                    <CheckCircle className="h-3 w-3 mr-0.5 inline" />
                                    Dealt with
                                  </Badge>
                                ) : canEditCase ? (
                                  <Checkbox
                                    id={`ack-${item.id}`}
                                    checked={false}
                                    disabled={!item.ackIdentifier || acknowledgingMessageId === item.ackIdentifier}
                                    onCheckedChange={async (checked) => {
                                      if (!checked || !entrySlug || !item.ackIdentifier) return;
                                      setAcknowledgingMessageId(item.ackIdentifier);
                                      try {
                                        await trackersService.acknowledgeInboundMessage(entrySlug, item.ackIdentifier);
                                        refetchSmsThread?.();
                                        refetchTimeline?.();
                                        refetchEntry?.();
                                        toast.success("Marked as dealt with.");
                                      } catch (err) {
                                        const d = err?.response?.data?.detail;
                                        toast.error(typeof d === "string" ? d : d?.message || "Failed to mark as dealt with");
                                      } finally {
                                        setAcknowledgingMessageId(null);
                                      }
                                    }}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    aria-label="Mark as dealt with"
                                  />
                                ) : null}
                                {canEditCase && !item.acknowledged_at && (
                                  <label htmlFor={`ack-${item.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
                                    Dealt with
                                  </label>
                                )}
                              </div>
                            )}
                            {item.type === "sent" && (
                              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <Send className="h-3.5 w-3.5 text-primary" />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {/* Composer */}
                    <div className="border-t border-border/60 bg-background/95 backdrop-blur-sm p-3 space-y-3">
                      {sendSmsPhoneCandidates.length >= 2 && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-medium text-muted-foreground shrink-0">Send to</Label>
                          <Select
                            value={sendSmsPhoneField || sendSmsPhoneCandidates[0]?.fieldId || ""}
                            onValueChange={setSendSmsPhoneField}
                          >
                            <SelectTrigger className="h-8 rounded-lg text-sm">
                              <SelectValue placeholder="Choose number" />
                            </SelectTrigger>
                            <SelectContent>
                              {sendSmsPhoneCandidates.map((c) => (
                                <SelectItem key={c.fieldId} value={c.fieldId}>
                                  {c.label}: {c.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 rounded-2xl border border-input bg-muted/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-transparent transition-shadow min-h-[44px] flex items-center">
                          <Textarea
                            placeholder="Type a message…"
                            value={sendSmsMessage}
                            onChange={(e) => setSendSmsMessage(e.target.value)}
                            className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent py-2.5 px-4 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                            disabled={!canSendSms}
                            rows={1}
                          />
                        </div>
                        <Button
                          size="icon"
                          className="h-[44px] w-[44px] rounded-full shrink-0 shadow-sm"
                          disabled={!canSendSms || sendSmsSubmitting || (sendSmsPhoneCandidates.length >= 2 && !sendSmsPhoneField)}
                          onClick={async () => {
                            if (sendSmsPhoneCandidates.length === 0) return;
                            if (sendSmsPhoneCandidates.length >= 2 && !sendSmsPhoneField) {
                              toast.error("Choose which number to send to.");
                              return;
                            }
                            const messageToSend = sendSmsMessage.trim();
                            setSendSmsSubmitting(true);
                            try {
                              const body = {
                                template_key: sendSmsTemplate,
                                ...(messageToSend ? { optional_message: messageToSend } : {}),
                              };
                              if (sendSmsPhoneCandidates.length >= 2 && sendSmsPhoneField) body.phone_field = sendSmsPhoneField;
                              else if (sendSmsPhoneCandidates.length === 1) body.phone_field = sendSmsPhoneCandidates[0].fieldId;
                              const res = await trackersService.sendSmsFromEntry(entrySlug, body);
                              if (res?.success) {
                                setSendSmsMessage("");
                                const inbound = smsThreadData?.inbound ?? [];
                                const latestInbound = inbound[inbound.length - 1];
                                if (latestInbound && !latestInbound.acknowledged_at && latestInbound.slug) {
                                  try {
                                    await trackersService.acknowledgeInboundMessage(entrySlug, latestInbound.slug);
                                  } catch (_) {}
                                }
                                refetchSmsThread?.();
                                refetchTimeline?.();
                                toast.success("SMS sent.");
                              } else {
                                toast.error(res?.error || "SMS could not be sent (check Twilio config).");
                              }
                            } catch (err) {
                              const d = err?.response?.data?.detail;
                              if (d?.available_phone_fields) {
                                toast.error("Choose which number to send to.");
                                setSendSmsPhoneField(d.available_phone_fields[0] || "");
                              } else {
                                toast.error(typeof d === "string" ? d : d?.message || "Failed to send SMS");
                              }
                            } finally {
                              setSendSmsSubmitting(false);
                            }
                          }}
                        >
                          {sendSmsSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Quick reply</span>
                        <Select value={sendSmsTemplate} onValueChange={setSendSmsTemplate} disabled={!canSendSms}>
                          <SelectTrigger className="h-8 rounded-lg text-xs w-[160px] border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {smsTemplateOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {canManageTracker && tracker?.slug && (
                          <Link href={`/admin/trackers/${tracker.slug}/edit?tab=communication`}>
                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                              Manage templates
                            </Button>
                          </Link>
                        )}
                        {!canSendSms && (
                          <span className="text-xs text-muted-foreground">
                            {!hasSmsSenderNumber && "SMS not configured."}
                            {hasSmsSenderNumber && isClosed && "Case closed."}
                            {hasSmsSenderNumber && !isClosed && !canEditCase && "No permission."}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="whatsapp" className="mt-0 py-6 text-center text-sm text-muted-foreground">
                  WhatsApp messaging — coming soon.
                </TabsContent>
                <TabsContent value="portal" className="mt-0 py-6 text-center text-sm text-muted-foreground">
                  Patient portal messages — coming soon.
                </TabsContent>
                <TabsContent value="email" className="mt-0 py-6 text-center text-sm text-muted-foreground">
                  Email — coming soon.
                </TabsContent>
                <TabsContent value="letter" className="mt-0 py-6 text-center text-sm text-muted-foreground">
                  Letter — coming soon.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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
                excludeNoteCategories={["SMS sent"]}
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
              {attachmentsLoading && formFileAttachments.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : formFileAttachments.length === 0 && attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No attachments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {/* Files uploaded at case creation (e.g. referral PDF) – visible for triage */}
                  {formFileAttachments.map((att) => {
                    const openFormFile = async () => {
                      const id = att.file_reference_id ?? att.file_id;
                      if (id == null) return;
                      try {
                        const res = await api.get(`/settings/files/${id}/download`);
                        const data = res?.data ?? res;
                        const downloadUrl = data?.download_url;
                        if (downloadUrl) window.open(downloadUrl, "_blank", "noopener,noreferrer");
                        else toast.error("Could not open file");
                      } catch (err) {
                        toast.error("Could not open file");
                      }
                    };
                    return (
                      <li key={att.key} className="flex items-center justify-between rounded border px-3 py-2 bg-muted/30">
                        <span className="text-sm truncate">{att.label}: {att.file_name}</span>
                        <Button variant="ghost" size="sm" onClick={openFormFile}>
                          View
                        </Button>
                      </li>
                    );
                  })}
                  {attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between rounded border px-3 py-2">
                      <span className="text-sm truncate">{att.description || att.file_name || `File #${att.file_reference_id ?? att.file_id}`}</span>
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

                      const formatUnknownValue = (val) => {
                        if (val === null || val === undefined || val === "") return "—";
                        if (typeof val === "object") {
                          try {
                            return JSON.stringify(val);
                          } catch (e) {
                            return String(val);
                          }
                        }
                        return String(val);
                      };

                      const findFieldByKey = (fieldKey) =>
                        trackerFields.find((f) => f.id === fieldKey || f.name === fieldKey || f.field_id === fieldKey);

                      const formatValue = (field, val) =>
                        field ? formatFieldValue(field, val) : formatUnknownValue(val);
                      
                      // Handle submission_data changes (tracker entry field changes)
                      if (log.old_values?.submission_data || log.new_values?.submission_data) {
                        const oldData = log.old_values?.submission_data || {};
                        const newData = log.new_values?.submission_data || {};
                        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
                        
                        const formatCaseClosedAudit = (v) => {
                          if (v === null || v === undefined || v === "") return "Open";
                          const t = String(v).trim();
                          if (!t || t.toLowerCase() === "false") return "Open";
                          try {
                            const d = parseUTCDate(t);
                            if (d && !Number.isNaN(d.getTime())) {
                              return `Closed (${format(d, "d MMM yyyy, HH:mm")})`;
                            }
                          } catch {
                            /* ignore */
                          }
                          return "Closed";
                        };

                        allKeys.forEach((key) => {
                          const oldVal = oldData[key];
                          const newVal = newData[key];

                          if (oldVal !== newVal) {
                            if (key === TRACKER_CASE_CLOSED_KEY) {
                              changes.push({
                                field: "Case closed",
                                old: formatCaseClosedAudit(oldVal),
                                new: formatCaseClosedAudit(newVal),
                              });
                              return;
                            }
                            if (key === TRACKER_SUBMISSION_STAGE_KEY) {
                              changes.push({
                                field: "Pipeline stage",
                                old: oldVal == null || oldVal === "" ? "—" : String(oldVal),
                                new: newVal == null || newVal === "" ? "—" : String(newVal),
                              });
                              return;
                            }
                            const field = findFieldByKey(key);
                            const fieldLabel = field?.label || key;
                            const formattedOld = formatValue(field, oldVal);
                            const formattedNew = formatValue(field, newVal);

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
                            const field = findFieldByKey(key);
                            const fieldLabel = field?.label || getFieldLabel(key);
                            changes.push({
                              field: fieldLabel,
                              old: formatValue(field, oldVal),
                              new: formatValue(field, newVal),
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
                              <div
                                key={changeIndex}
                                className="text-sm flex items-start gap-2"
                              >
                                <span className="font-medium text-foreground shrink-0">{change.field}:</span>
                                <div className="text-muted-foreground line-through">{change.old}</div>
                                <span className="text-muted-foreground shrink-0 mt-0.5">→</span>
                                <div className="text-foreground font-medium">{change.new}</div>
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
        </main>
      </div>

      {/* Log Action / Add appointment drawer */}
      <Sheet open={isLogActionOpen} onOpenChange={setIsLogActionOpen}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          <SheetHeader className="space-y-1 px-6 pt-6 pb-2">
            <SheetTitle className="text-lg">{logSheetTab === "dates" ? "Add appointment" : "Log action"}</SheetTitle>
            <SheetDescription>
              {logSheetTab === "dates"
                ? "Record a date or event for this case. Set type, location, duration and status."
                : "Record what you did on this case. Optionally set a chase or reminder date."}
            </SheetDescription>
          </SheetHeader>
          <Tabs value={logSheetTab} onValueChange={setLogSheetTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="dates">Dates</TabsTrigger>
              </TabsList>
            </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <TabsContent value="actions" className="mt-0 space-y-6 border-0 p-0">
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Action</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={logActionType}
                      onValueChange={(v) => {
                        setLogActionType(v);
                        if (v !== "other") setLogActionFreeText("");
                        // Prefill chase date from action type's default_chase_days
                        if (v && v !== "other" && tracker?.tracker_config?.action_types) {
                          const actionType = tracker.tracker_config.action_types.find((at) => at.id === v);
                          const days = actionType?.default_chase_days;
                          if (typeof days === "number" && days >= 0) {
                            const chaseDate = format(addDays(startOfDay(new Date()), days), "yyyy-MM-dd");
                            setLogActionChaseDate(chaseDate);
                            setLogActionNoChase(false);
                          } else {
                            setLogActionChaseDate("");
                          }
                        } else {
                          setLogActionChaseDate("");
                        }
                      }}
                    >
                      <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Select action" /></SelectTrigger>
                      <SelectContent>
                        {(tracker?.tracker_config?.action_types || []).map((at) => (
                          <SelectItem key={at.id} value={at.id}>{at.label || at.id}</SelectItem>
                        ))}
                        <SelectItem value="other">Other (free text)</SelectItem>
                      </SelectContent>
                    </Select>
                    {canManageTracker && tracker?.slug && (
                      <Popover open={addActionTypeOpen} onOpenChange={setAddActionTypeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            aria-label="Add action type"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="start">
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Add action type</p>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">Label</Label>
                              <Input
                                value={newActionTypeLabel}
                                onChange={(e) => setNewActionTypeLabel(e.target.value)}
                                placeholder="e.g. Phoned patient"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">Default reminder days (optional)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={newActionTypeChaseDays}
                                onChange={(e) => setNewActionTypeChaseDays(e.target.value)}
                                placeholder="Days (can be overridden per entry)"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={!newActionTypeLabel?.trim() || updateTrackerMutation.isPending}
                              onClick={async () => {
                                const label = newActionTypeLabel?.trim();
                                if (!label || !tracker?.slug) return;
                                const baseTracker = fullTracker ?? tracker;
                                const id = generateActionTypeId(label) || label.toLowerCase().replace(/\s+/g, "_");
                                const newEntry = {
                                  id,
                                  label,
                                  ...(newActionTypeChaseDays !== "" && !Number.isNaN(Number(newActionTypeChaseDays))
                                    ? { default_chase_days: Number(newActionTypeChaseDays) }
                                    : {}),
                                };
                                const existingTypes = baseTracker?.tracker_config?.action_types || [];
                                const updated = {
                                  ...baseTracker,
                                  tracker_config: {
                                    ...(baseTracker?.tracker_config || {}),
                                    action_types: [...existingTypes, newEntry],
                                  },
                                };
                                await updateTrackerMutation.mutateAsync({ slug: tracker.slug, trackerData: updated });
                                setLogActionType(id);
                                setAddActionTypeOpen(false);
                                setNewActionTypeLabel("");
                                setNewActionTypeChaseDays("");
                                toast.success("Action type added");
                              }}
                            >
                              {updateTrackerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Add
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
                {logActionType === "other" && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <Input
                      value={logActionFreeText}
                      onChange={(e) => setLogActionFreeText(e.target.value)}
                      placeholder="e.g. Phoned patient – no answer"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </section>
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Note</h4>
              <Textarea
                value={logActionNote}
                onChange={(e) => setLogActionNote(e.target.value)}
                placeholder="Add details (optional)"
                rows={3}
                className="resize-none"
              />
            </section>
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Follow-up</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="logActionNoChase"
                  checked={logActionNoChase}
                  onCheckedChange={(checked) => setLogActionNoChase(!!checked)}
                />
                <Label htmlFor="logActionNoChase" className="text-sm font-normal cursor-pointer text-muted-foreground">
                  No chase or reminder
                </Label>
              </div>
              {!logActionNoChase && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Chase date (optional)</Label>
                  <Input
                    type="date"
                    value={logActionChaseDate}
                    onChange={(e) => setLogActionChaseDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </section>
          </TabsContent>
          <TabsContent value="dates" className="mt-0 space-y-6 border-0 p-0">
            {(() => {
              const appointmentTypes = tracker?.tracker_config?.appointment_types ?? [];
              const appointmentLocations = tracker?.tracker_config?.appointment_locations ?? [];
              const appointmentStatuses = tracker?.tracker_config?.appointment_statuses ?? [];
              const baseTracker = fullTracker ?? tracker;
              const addOption = async (kind, labelKey, configKey, setOpen, setLabel, setSelectedId) => {
                const label = (labelKey === "type" ? newAppointmentTypeLabel : labelKey === "location" ? newAppointmentLocationLabel : newAppointmentStatusLabel)?.trim();
                if (!label || !tracker?.slug) return;
                const id = generateActionTypeId(label) || label.toLowerCase().replace(/\s+/g, "_");
                const newEntry = { id, label };
                const existing = baseTracker?.tracker_config?.[configKey] ?? [];
                const updated = {
                  ...baseTracker,
                  tracker_config: { ...(baseTracker?.tracker_config || {}), [configKey]: [...existing, newEntry] },
                };
                await updateTrackerMutation.mutateAsync({ slug: tracker.slug, trackerData: updated });
                setSelectedId(id);
                setOpen(false);
                setLabel("");
                toast.success("Added");
              };
              return (
                <>
                  <section className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Date & time</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Date</Label>
                        <Input
                          type="date"
                          value={logAppointmentDate}
                          onChange={(e) => setLogAppointmentDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Time</Label>
                        <Input
                          type="time"
                          value={logAppointmentTime}
                          onChange={(e) => setLogAppointmentTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </section>
                  <section className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Type & location</h4>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Type</Label>
                      <div className="flex gap-2 items-center">
                        <Select
                          value={logAppointmentType}
                          onValueChange={(v) => {
                            setLogAppointmentType(v);
                            const type = appointmentTypes.find((t) => t.id === v);
                            if (type?.default_duration_minutes != null) {
                              setLogAppointmentDuration(String(type.default_duration_minutes));
                            } else {
                              setLogAppointmentDuration("");
                            }
                          }}
                        >
                          <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {appointmentTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {canManageTracker && tracker?.slug && (
                          <Popover open={addAppointmentTypeOpen} onOpenChange={setAddAppointmentTypeOpen}>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Add type">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72" align="start">
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Add appointment type</p>
                                <div className="space-y-2">
                                  <Label className="text-muted-foreground">Label</Label>
                                  <Input value={newAppointmentTypeLabel} onChange={(e) => setNewAppointmentTypeLabel(e.target.value)} placeholder="e.g. Consultation" />
                                </div>
                                <Button size="sm" className="w-full" disabled={!newAppointmentTypeLabel?.trim() || updateTrackerMutation.isPending} onClick={async () => { await addOption("type", "type", "appointment_types", setAddAppointmentTypeOpen, setNewAppointmentTypeLabel, setLogAppointmentType); }}>
                                  {updateTrackerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <Label className="text-muted-foreground">Location</Label>
                      <div className="flex gap-2 items-center">
                        <Select value={logAppointmentLocation} onValueChange={setLogAppointmentLocation}>
                          <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Select location" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {appointmentLocations.map((l) => (
                              <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {canManageTracker && tracker?.slug && (
                          <Popover open={addAppointmentLocationOpen} onOpenChange={setAddAppointmentLocationOpen}>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Add location">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72" align="start">
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Add location</p>
                                <div className="space-y-2">
                                  <Label className="text-muted-foreground">Label</Label>
                                  <Input value={newAppointmentLocationLabel} onChange={(e) => setNewAppointmentLocationLabel(e.target.value)} placeholder="e.g. Main site" />
                                </div>
                                <Button size="sm" className="w-full" disabled={!newAppointmentLocationLabel?.trim() || updateTrackerMutation.isPending} onClick={async () => { await addOption("location", "location", "appointment_locations", setAddAppointmentLocationOpen, setNewAppointmentLocationLabel, setLogAppointmentLocation); }}>
                                  {updateTrackerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  </section>
                  <section className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Duration & status</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Duration (minutes)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={logAppointmentDuration}
                          onChange={(e) => setLogAppointmentDuration(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Status</Label>
                        <div className="flex gap-2 items-center">
                          <Select value={logAppointmentStatus} onValueChange={setLogAppointmentStatus}>
                            <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                              {appointmentStatuses.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {canManageTracker && tracker?.slug && (
                            <Popover open={addAppointmentStatusOpen} onOpenChange={setAddAppointmentStatusOpen}>
                              <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Add status">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72" align="start">
                                <div className="space-y-3">
                                  <p className="text-sm font-medium">Add status</p>
                                  <div className="space-y-2">
                                    <Label className="text-muted-foreground">Label</Label>
                                    <Input value={newAppointmentStatusLabel} onChange={(e) => setNewAppointmentStatusLabel(e.target.value)} placeholder="e.g. Booked" />
                                  </div>
                                  <Button size="sm" className="w-full" disabled={!newAppointmentStatusLabel?.trim() || updateTrackerMutation.isPending} onClick={async () => { await addOption("status", "status", "appointment_statuses", setAddAppointmentStatusOpen, setNewAppointmentStatusLabel, setLogAppointmentStatus); }}>
                                    {updateTrackerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Note</h4>
                    <Textarea
                      value={logAppointmentNote}
                      onChange={(e) => setLogAppointmentNote(e.target.value)}
                      placeholder="Add details (optional)"
                      rows={2}
                      className="resize-none"
                    />
                  </section>
                </>
              );
            })()}
          </TabsContent>
          </div>
          </Tabs>
          <SheetFooter className="flex-row gap-2 sm:justify-end border-t px-6 py-4">
            <Button variant="outline" onClick={() => setIsLogActionOpen(false)}>
              Cancel
            </Button>
            {logSheetTab === "dates" ? (
              <Button
                disabled={!logAppointmentDate || !logAppointmentType || !logAppointmentStatus || createTrackerAppointmentMutation.isPending}
                onClick={async () => {
                  const appointmentAt = new Date(`${logAppointmentDate}T${logAppointmentTime || "00:00"}:00`);
                  await createTrackerAppointmentMutation.mutateAsync({
                    entryIdentifier: entrySlug,
                    body: {
                      appointment_at: appointmentAt.toISOString(),
                      appointment_type: logAppointmentType,
                      location: (logAppointmentLocation && logAppointmentLocation !== "__none__") ? logAppointmentLocation : undefined,
                      duration_minutes: logAppointmentDuration ? parseInt(logAppointmentDuration, 10) : undefined,
                      status: logAppointmentStatus,
                      note: logAppointmentNote?.trim() || undefined,
                    },
                  });
                  setIsLogActionOpen(false);
                  refetchAppointments();
                }}
              >
                {createTrackerAppointmentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Log appointment
              </Button>
            ) : (
              <Button
                disabled={!logActionType || (logActionType === "other" && !logActionFreeText?.trim()) || createTrackerActionMutation.isPending}
                onClick={async () => {
                  const action_type = logActionType === "other" ? "other" : logActionType;
                  const free_text_label = logActionType === "other" ? (logActionFreeText?.trim() || null) : null;
                  const chase_date = logActionNoChase ? null : (logActionChaseDate ? logActionChaseDate : null);
                  await createTrackerActionMutation.mutateAsync({
                    entryIdentifier: entrySlug,
                    body: { action_type, free_text_label, note: logActionNote?.trim() || null, chase_date: chase_date || undefined },
                  });
                  setIsLogActionOpen(false);
                }}
              >
                {createTrackerActionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Log action
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Stage change: require Stage, Status, and Note before moving */}
      <Dialog
        open={!!stageChangePending}
        onOpenChange={(open) => {
          if (!open) {
            setStageChangePending(null);
            setStageChangeNotes("");
            setStageChangeStatus("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to {stageChangePending?.stageLabel ?? "next stage"}</DialogTitle>
            <DialogDescription>
              Choose the status for this stage and add a note (required).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {statusesForTargetStage.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="stage-change-status">Status</Label>
                <Select
                  value={stageChangeStatus}
                  onValueChange={setStageChangeStatus}
                >
                  <SelectTrigger id="stage-change-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusesForTargetStage.map((s) => (
                      <SelectItem key={s} value={s}>
                        {humanizeStatusForDisplay(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {statusesForTargetStage.length === 0 && stageChangePending && (
              <p className="text-sm text-amber-600">This stage has no statuses configured; move may not be allowed.</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="stage-change-notes">Note (required)</Label>
              <Textarea
                id="stage-change-notes"
                placeholder="e.g. Called patient, rebooked for next week"
                value={stageChangeNotes}
                onChange={(e) => setStageChangeNotes(e.target.value)}
                className="min-h-[80px] resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStageChangePending(null); setStageChangeNotes(""); setStageChangeStatus(""); }}>
              Cancel
            </Button>
            <Button
              onClick={confirmStageChangeWithNotes}
              disabled={
                updateEntryMutation.isPending ||
                !(stageChangeNotes != null && String(stageChangeNotes).trim() !== "") ||
                (statusesForTargetStage.length > 0 && !stageChangeStatus)
              }
            >
              {updateEntryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change status dialog: Stage then Status (stage-styled trackers only) */}
      <Dialog
        open={isChangeStatusDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsChangeStatusDialogOpen(false);
            setChangeStatusStage("");
            setStageChangeStatus("");
            setChangeStatusNote("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change status</DialogTitle>
            <DialogDescription>
              Pick a stage, then the status for that stage. Only statuses for the selected stage are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="change-status-stage">Stage</Label>
              <Select
                value={changeStatusStage || ""}
                onValueChange={handleChangeStatusStageSelect}
              >
                <SelectTrigger id="change-status-stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stagesForEditModeDropdown.map((item) => {
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
            </div>
            {statusesForChangeStatusStageFiltered.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="change-status-status">Status</Label>
                <Select
                  value={stageChangeStatus}
                  onValueChange={setStageChangeStatus}
                >
                  <SelectTrigger id="change-status-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusesForChangeStatusStageFiltered.map((s) => (
                      <SelectItem key={s} value={s}>
                        {humanizeStatusForDisplay(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {statusesForChangeStatusStageFiltered.length === 0 && changeStatusStage && (
              <p className="text-sm text-amber-600">This stage has no statuses configured.</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="change-status-note">Note (optional)</Label>
              <Textarea
                id="change-status-note"
                placeholder="e.g. Updated after call"
                value={changeStatusNote}
                onChange={(e) => setChangeStatusNote(e.target.value)}
                className="min-h-[60px] resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsChangeStatusDialogOpen(false); setChangeStatusStage(""); setStageChangeStatus(""); setChangeStatusNote(""); }}>
              Cancel
            </Button>
            <Button
              onClick={confirmChangeStatus}
              disabled={updateEntryMutation.isPending || (statusesForChangeStatusStageFiltered.length > 0 && !stageChangeStatus)}
            >
              {updateEntryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close case confirmation */}
      <Dialog open={isCloseCaseDialogOpen} onOpenChange={setIsCloseCaseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close case</DialogTitle>
            <DialogDescription>
              This case will be marked as closed and become read-only. You can still view it and the timeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseCaseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCloseCase} disabled={updateEntryMutation.isPending}>
              {updateEntryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Close case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReopenCaseDialogOpen} onOpenChange={setIsReopenCaseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reopen case</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReopenCaseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReopenCase} disabled={updateEntryMutation.isPending}>
              {updateEntryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reopen case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackerEntryDetailPage;

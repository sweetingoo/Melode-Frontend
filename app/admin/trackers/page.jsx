"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Loader2,
  FileText,
  Eye,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Calendar,
  User as UserIcon,
  LayoutGrid,
  Columns as ColumnsIcon,
  Download,
  Settings,
  X,
  ChevronRight,
  Link2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useTrackers,
  useTracker,
  useTrackerQueueCounts,
  useUpdateTracker,
  useInfiniteTrackerEntries,
  useTrackerEntriesAggregates,
  useDeleteTrackerEntry,
  useCreateTrackerEntry,
  useUpdateTrackerEntry,
} from "@/hooks/useTrackers";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format, addDays, startOfDay, subDays } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { humanizeStatusForDisplay } from "@/utils/slug";
import { getStageColor } from "@/utils/stageColors";
import { toast } from "sonner";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useUsers } from "@/hooks/useUsers";
import { api } from "@/services/api-client";
import { PageSearchBar } from "@/components/admin/PageSearchBar";
import { TrackerQuerySearchBar } from "@/components/admin/TrackerQuerySearchBar";
import { trackersService } from "@/services/trackers";

const TRACKER_PARAM = "tracker";
const Q_PARAM = "q";
const STATUS_PARAM = "status";
const FIELD_PREFIX = "f_";
const HIGHLIGHT_RULES_PARAM = "hl";
const AGGREGATE_PREFIX = "ag_";

// Patient Referral queue presets (Phase 3)
const PATIENT_REFERRAL_QUEUE_IDS = {
  ALL: "all",
  AWAITING_TRIAGE: "awaiting_triage",
  ACTION_REQUIRED: "action_required",
  CHASE_OVERDUE: "chase_overdue",
  UPCOMING_APPOINTMENTS: "upcoming_appointments",
  PAST_OUTCOME_NOT_CHECKED: "past_outcome_not_checked",
  READY_TO_BOOK: "ready_to_book",
  DRAFT: "draft",
};
function getPatientReferralQueuePreset(queueId) {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const in7Days = format(addDays(startOfDay(new Date()), 7), "yyyy-MM-dd");
  switch (queueId) {
    case PATIENT_REFERRAL_QUEUE_IDS.ALL:
      return { status: "all", field_filters: {}, next_appointment_date_after: null, next_appointment_date_before: null };
    case PATIENT_REFERRAL_QUEUE_IDS.AWAITING_TRIAGE:
      return { status: "Awaiting Triage", field_filters: {}, next_appointment_date_after: null, next_appointment_date_before: null };
    case PATIENT_REFERRAL_QUEUE_IDS.ACTION_REQUIRED:
      return { status: "Triage Completed – Action Required", field_filters: {}, next_appointment_date_after: null, next_appointment_date_before: null };
    case PATIENT_REFERRAL_QUEUE_IDS.CHASE_OVERDUE:
      return { status: "all", field_filters: { chase_due: { op: "<=", value: today } }, next_appointment_date_after: null, next_appointment_date_before: null };
    case PATIENT_REFERRAL_QUEUE_IDS.UPCOMING_APPOINTMENTS:
      return { status: "all", field_filters: {}, next_appointment_date_after: today, next_appointment_date_before: in7Days };
    case PATIENT_REFERRAL_QUEUE_IDS.PAST_OUTCOME_NOT_CHECKED:
      return {
        status: "Awaiting Outcome Check (EMIS)",
        field_filters: { next_appointment_date: { op: "<", value: today } },
        next_appointment_date_after: null,
        next_appointment_date_before: null,
      };
    case PATIENT_REFERRAL_QUEUE_IDS.READY_TO_BOOK:
      return { status: "Ready to Book Procedure", field_filters: {}, next_appointment_date_after: null, next_appointment_date_before: null };
    case PATIENT_REFERRAL_QUEUE_IDS.DRAFT:
      return { status: "New Referral Received", field_filters: {}, next_appointment_date_after: null, next_appointment_date_before: null };
    default:
      return { status: "all", field_filters: {}, next_appointment_date_after: null, next_appointment_date_before: null };
  }
}

const URL_OP_TO_STATE = { gt: ">", lt: "<", gte: ">=", lte: "<=", eq: "=", contains: "contains" };
const STATE_OP_TO_URL = { ">": "gt", "<": "lt", ">=": "gte", "<=": "lte", "=": "eq", contains: "contains" };

function formulaFieldIdFromLabel(label) {
  if (!label) return "";
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 80);
}

const TrackersPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissionsCheck();
  const canCreateEntry = hasPermission("tracker_entry:create");
  const canReadEntries = hasPermission("tracker_entry:read") || hasPermission("tracker_entry:list");
  const canUpdateEntry = hasPermission("tracker_entry:update");
  const canDeleteEntry = hasPermission("tracker_entry:delete");
  const   canReadTrackers = hasPermission("tracker:read") || hasPermission("tracker:list");
  const canCreateTracker = hasPermission("tracker:create");
  const canUpdateTracker = hasPermission("tracker:update");
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [committedSearchTerm, setCommittedSearchTerm] = useState(""); // only pushed to URL on Enter
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isCreateEntryDialogOpen, setIsCreateEntryDialogOpen] = useState(false);
  const [entryFormData, setEntryFormData] = useState({});
  // Column-specific filters: field_id -> filter value
  const [columnFilters, setColumnFilters] = useState({});
  // Column-specific sorting: field_id -> sort order (null, 'asc', 'desc')
  const [columnSorting, setColumnSorting] = useState({});
  const [entryFieldErrors, setEntryFieldErrors] = useState({});
  // Create entry wizard: current stage index when tracker has sections (0 = first stage)
  const [createEntryStageIndex, setCreateEntryStageIndex] = useState(0);
  const [showMetadataColumns, setShowMetadataColumns] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Sheet-like: selected cell for formula bar (rowIndex, fieldId)
  const [selectedCell, setSelectedCell] = useState(null);
  // Stage change: same as entry detail — Stage, Status (if stage has statuses), and Note (required)
  const [stageChangePending, setStageChangePending] = useState(null);
  const [stageChangeNotes, setStageChangeNotes] = useState("");
  const [stageChangeStatus, setStageChangeStatus] = useState("");
  // View options: density and column visibility (better than sheet)
  const [viewDensity, setViewDensity] = useState("comfortable"); // "compact" | "comfortable" | "spacious"
  const [hiddenColumnsByTracker, setHiddenColumnsByTracker] = useState({}); // { [trackerId]: { [fieldId]: true } }
  const searchInputRef = useRef(null);
  // Highlight rules from query bar (e.g. highlight: revenue > 1000)
  const [highlightRules, setHighlightRules] = useState([]); // [{ fieldId, operator, value }]
  // Ad-hoc aggregate display from query bar (e.g. show sum risk_value) — sent to backend, no frontend load
  const [queryBarAggregateFields, setQueryBarAggregateFields] = useState({}); // { fieldId: "sum"|"avg"|"count"|"min"|"max" }
  // Phase 3: Last updated filters + queue preset (patient-referral)
  const [updatedAtAfter, setUpdatedAtAfter] = useState(null); // ISO string or null
  const [updatedAtBefore, setUpdatedAtBefore] = useState(null);
  const [nextAppointmentDateAfter, setNextAppointmentDateAfter] = useState(null);
  const [nextAppointmentDateBefore, setNextAppointmentDateBefore] = useState(null);
  const [activeQueue, setActiveQueue] = useState(null); // queue preset id or null
  const [statusesFilter, setStatusesFilter] = useState(null); // array of status strings when queue has multiple statuses, else null
  // Add / Edit formula while viewing entries (sheet-like)
  const [isFormulaDialogOpen, setIsFormulaDialogOpen] = useState(false);
  const [formulaFieldToEdit, setFormulaFieldToEdit] = useState(null);
  const [isPsaQuickGuideOpen, setIsPsaQuickGuideOpen] = useState(false); // null = add, or { field, fieldId } = edit
  const [formulaForm, setFormulaForm] = useState({
    label: "",
    type: "sum",
    field_ids: [],
    field_ids_raw: "",
    numerator_field_id: "",
    denominator_field_id: "",
    value_field_id: "",
    target_constant_key: "",
  });

  const toggleColumnVisibility = useCallback((trackerId, fieldId) => {
    setHiddenColumnsByTracker((prev) => {
      const curr = prev[trackerId] || {};
      const next = { ...curr, [fieldId]: !curr[fieldId] };
      const hasHidden = Object.values(next).some(Boolean);
      return hasHidden ? { ...prev, [trackerId]: next } : (() => { const p = { ...prev }; delete p[trackerId]; return p; })();
    });
  }, []);

  const openAddFormulaDialog = useCallback(() => {
    setFormulaFieldToEdit(null);
    setFormulaForm({
      label: "",
      type: "sum",
      field_ids: [],
      field_ids_raw: "",
      numerator_field_id: "",
      denominator_field_id: "",
      value_field_id: "",
      target_constant_key: "",
    });
    setIsFormulaDialogOpen(true);
  }, []);

  const openEditFormulaDialog = useCallback((field, fieldId) => {
    const fid = fieldId || field?.id || field?.field_id || field?.name;
    setFormulaFieldToEdit({ field: { ...field }, fieldId: fid });
    const formula = field?.formula || field?.formula_config || {};
    const type = formula.type || formula.formula_type || "sum";
    const fieldIds = formula.field_ids || formula.formula_field_ids || [];
    setFormulaForm({
      label: field?.label || field?.field_label || field?.name || fid || "",
      type: type === "percentage" ? "percentage" : "sum",
      field_ids: fieldIds,
      field_ids_raw: fieldIds.join(", "),
      numerator_field_id: formula.numerator_field_id || formula.numerator || "",
      denominator_field_id: formula.denominator_field_id || formula.denominator || "",
      value_field_id: formula.value_field_id || formula.value_field || "",
      target_constant_key: formula.target_constant_key || formula.target_constant || "",
    });
    setIsFormulaDialogOpen(true);
  }, []);

  const itemsPerPage = 20;

  const hasActiveFilters = useMemo(
    () =>
      !!searchTerm ||
      statusFilter !== "all" ||
      Object.keys(columnFilters).length > 0 ||
      highlightRules.length > 0 ||
      Object.keys(queryBarAggregateFields).length > 0,
    [searchTerm, statusFilter, columnFilters, highlightRules, queryBarAggregateFields]
  );
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setCommittedSearchTerm("");
    setStatusFilter("all");
    setColumnFilters({});
    setColumnSorting({});
    setHighlightRules([]);
    setQueryBarAggregateFields({});
  }, []);

  // Read filters from URL when searchParams change (e.g. load, back/forward)
  useEffect(() => {
    const q = searchParams.get(Q_PARAM) ?? "";
    const status = searchParams.get(STATUS_PARAM) ?? "all";
    const filters = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith(FIELD_PREFIX)) {
        const fieldId = key.slice(FIELD_PREFIX.length);
        if (!fieldId) return;
        const colonIdx = value.indexOf(":");
        if (colonIdx >= 0) {
          const opPart = value.slice(0, colonIdx).toLowerCase();
          const op = URL_OP_TO_STATE[opPart] ?? "=";
          filters[fieldId] = { op, value: value.slice(colonIdx + 1).trim() };
        } else {
          filters[fieldId] = value;
        }
      }
    });
    setSearchTerm(q);
    setCommittedSearchTerm(q);
    setStatusFilter(status);
    setColumnFilters(filters);
    // Highlight rules (hl = JSON array)
    const hlRaw = searchParams.get(HIGHLIGHT_RULES_PARAM);
    if (hlRaw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(hlRaw));
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHighlightRules(
            parsed.map((r) => ({
              fieldId: r.displayFieldId ?? r.fieldId,
              displayFieldId: r.displayFieldId,
              conditionFieldId: r.conditionFieldId ?? r.fieldId,
              operator: r.operator ?? "=",
              value: r.value,
              color: r.color ?? "green",
            }))
          );
        } else {
          setHighlightRules([]);
        }
      } catch (_) {
        setHighlightRules([]);
      }
    } else {
      setHighlightRules([]);
    }
    // Aggregates (ag_<fieldId>=<type>)
    const aggregates = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith(AGGREGATE_PREFIX)) {
        const fieldId = key.slice(AGGREGATE_PREFIX.length);
        if (fieldId && ["sum", "avg", "count", "min", "max"].includes(value)) {
          aggregates[fieldId] = value;
        }
      }
    });
    setQueryBarAggregateFields(aggregates);
  }, [searchParams]);

  // Write filters to URL (q, status, columnFilters, highlight rules, aggregates)
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (committedSearchTerm) next.set(Q_PARAM, committedSearchTerm);
    else next.delete(Q_PARAM);
    if (statusFilter && statusFilter !== "all") next.set(STATUS_PARAM, statusFilter);
    else next.delete(STATUS_PARAM);
    for (const key of Array.from(next.keys())) {
      if (key.startsWith(FIELD_PREFIX) || key === HIGHLIGHT_RULES_PARAM || key.startsWith(AGGREGATE_PREFIX)) next.delete(key);
    }
    for (const [fieldId, v] of Object.entries(columnFilters)) {
      if (v == null || v === "" || v === "all") continue;
      const serialized =
        typeof v === "object" && v !== null && "op" in v && "value" in v
          ? `${STATE_OP_TO_URL[v.op] ?? "eq"}:${v.value}`
          : String(v);
      next.set(`${FIELD_PREFIX}${fieldId}`, serialized);
    }
    if (highlightRules.length > 0) {
      next.set(HIGHLIGHT_RULES_PARAM, encodeURIComponent(JSON.stringify(highlightRules)));
    }
    for (const [fieldId, type] of Object.entries(queryBarAggregateFields)) {
      if (fieldId && type) next.set(`${AGGREGATE_PREFIX}${fieldId}`, type);
    }
    const nextSearch = next.toString();
    const currentSearch = typeof window !== "undefined" ? window.location.search.slice(1) : "";
    if (nextSearch !== currentSearch) {
      router.replace(`/admin/trackers?${nextSearch}`, { scroll: false });
    }
  }, [committedSearchTerm, statusFilter, columnFilters, highlightRules, queryBarAggregateFields, searchParams, router]);

  // Clear formula bar selection, highlight rules, query-bar aggregates, and queue filter when user switches tracker (not on initial load)
  const prevSelectedTrackerRef = useRef(selectedTracker);
  useEffect(() => {
    setSelectedCell(null);
    if (prevSelectedTrackerRef.current != null && prevSelectedTrackerRef.current !== selectedTracker) {
      setHighlightRules([]);
      setQueryBarAggregateFields({});
      setActiveQueue(null);
      setStatusFilter("all");
      setStatusesFilter(null);
    }
    prevSelectedTrackerRef.current = selectedTracker;
  }, [selectedTracker]);

  // Get users for "Updated By" display
  const { data: usersResponse } = useUsers();
  const users = usersResponse?.users || usersResponse || [];

  // Helper to get user name
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

  // Get trackers list
  const { data: trackersResponse, isLoading: trackersLoading } = useTrackers({
    page: 1,
    per_page: 100,
    is_active: true,
  });

  const trackers = useMemo(() => {
    if (!trackersResponse) return [];
    if (Array.isArray(trackersResponse)) return trackersResponse;
    return trackersResponse.trackers || trackersResponse.forms || [];
  }, [trackersResponse]);

  // Sync selected tracker with URL (?tracker=slug) so reload keeps the same tracker
  useEffect(() => {
    if (trackers.length === 0) return;
    const param = searchParams.get(TRACKER_PARAM);
    if (param) {
      const match = trackers.find(
        (t) => (t.slug && t.slug === param) || t.id.toString() === param
      );
      if (match) {
        setSelectedTracker(match.id.toString());
        return;
      }
    }
    // No valid param: default to first tracker and set URL
    const first = trackers[0];
    const slug = first?.slug || first?.id?.toString();
    if (slug) {
      setSelectedTracker(first.id.toString());
      const next = new URLSearchParams(searchParams.toString());
      next.set(TRACKER_PARAM, slug);
      router.replace(`/admin/trackers?${next.toString()}`, { scroll: false });
    } else if (!selectedTracker) {
      setSelectedTracker(first.id.toString());
    }
  }, [trackers, searchParams]);

  const createEntryMutation = useCreateTrackerEntry();

  // Get selected tracker details for form fields (using selectedTracker tab)
  const selectedTrackerObj = useMemo(() => {
    if (!selectedTracker) return null;
    return trackers.find((t) => t.id === parseInt(selectedTracker));
  }, [selectedTracker, trackers]);
  
  const { data: trackerDetails } = useTracker(selectedTrackerObj?.slug || "", {
    enabled: !!selectedTrackerObj?.slug && isCreateEntryDialogOpen,
  });
  const { data: trackerDetailForFormula } = useTracker(selectedTrackerObj?.slug || "", {
    enabled: !!selectedTrackerObj?.slug && isFormulaDialogOpen,
  });
  // Full tracker config for stage/status resolution (list may return minimal form_config)
  const { data: selectedTrackerDetail } = useTracker(selectedTrackerObj?.slug || "", {
    enabled: !!selectedTrackerObj?.slug,
  });
  const updateTrackerMutation = useUpdateTracker();

  const saveFormulaColumn = useCallback(async () => {
    const tracker = trackerDetailForFormula || selectedTrackerObj;
    const slug = tracker?.slug ?? tracker?.id;
    if (!slug) {
      toast.error("No tracker selected");
      return;
    }
    if (!tracker?.tracker_fields?.fields && !formulaFieldToEdit) {
      toast.error("Tracker details still loading. Try again in a moment.");
      return;
    }
    const listViewFields = tracker?.tracker_config?.list_view_fields || [];
    const currentFields = tracker?.tracker_fields?.fields || [];
    const isEdit = !!formulaFieldToEdit;
    const fieldId = isEdit
      ? formulaFieldToEdit.fieldId
      : (formulaForm.label ? formulaFieldIdFromLabel(formulaForm.label) : "") || `calculated_${Date.now()}`;
    if (!fieldId && !isEdit) {
      toast.error("Formula column label is required");
      return;
    }
    const formulaPayload = {
      type: formulaForm.type,
      ...(formulaForm.type === "sum"
        ? { field_ids: formulaForm.field_ids_raw ? formulaForm.field_ids_raw.split(",").map((s) => s.trim()).filter(Boolean) : [] }
        : {}),
      ...(formulaForm.type === "percentage"
        ? {
            numerator_field_id: formulaForm.numerator_field_id || undefined,
            denominator_field_id: formulaForm.denominator_field_id || undefined,
            value_field_id: formulaForm.value_field_id || undefined,
            target_constant_key: formulaForm.target_constant_key || undefined,
          }
        : {}),
    };
    const newField = {
      id: fieldId,
      name: fieldId,
      type: "calculated",
      label: formulaForm.label || fieldId,
      required: false,
      formula: formulaPayload,
    };
    let nextFields;
    let nextListViewFields;
    if (isEdit) {
      nextFields = currentFields.map((f) => {
        const fid = f.id || f.field_id || f.name;
        return fid === fieldId ? { ...f, ...newField } : f;
      });
      nextListViewFields = listViewFields;
    } else {
      nextFields = [...currentFields, newField];
      nextListViewFields = listViewFields.includes(fieldId) ? listViewFields : [...listViewFields, fieldId];
    }
    const trackerData = {
      ...tracker,
      tracker_fields: { ...(tracker.tracker_fields || {}), fields: nextFields },
      tracker_config: { ...(tracker.tracker_config || {}), list_view_fields: nextListViewFields },
    };
    try {
      await updateTrackerMutation.mutateAsync({ slug: String(slug), trackerData });
      setIsFormulaDialogOpen(false);
      setFormulaFieldToEdit(null);
      toast.success(isEdit ? "Formula updated" : "Formula column added");
    } catch (e) {
      // toast from mutation
    }
  }, [trackerDetailForFormula, selectedTrackerObj, formulaFieldToEdit, formulaForm, updateTrackerMutation]);

  // Build search params for entries (no page - infinite query uses pageParam)
  const searchParamsBase = useMemo(() => {
    const params = {
      per_page: itemsPerPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (selectedTracker) {
      params.form_id = parseInt(selectedTracker);
    }

    if (statusesFilter?.length) {
      params.statuses = statusesFilter;
    } else if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (searchTerm) {
      params.query = searchTerm;
    }

    if (Object.keys(columnFilters).length > 0) {
      params.field_filters = Object.fromEntries(
        Object.entries(columnFilters).map(([fid, v]) => [
          fid,
          v && typeof v === "object" && "op" in v && "value" in v ? { op: v.op, value: v.value } : v,
        ])
      );
    }
    if (updatedAtAfter) params.updated_at_after = updatedAtAfter;
    if (updatedAtBefore) params.updated_at_before = updatedAtBefore;
    if (nextAppointmentDateAfter) params.next_appointment_date_after = nextAppointmentDateAfter;
    if (nextAppointmentDateBefore) params.next_appointment_date_before = nextAppointmentDateBefore;

    return params;
  }, [selectedTracker, statusFilter, statusesFilter, searchTerm, sortBy, sortOrder, columnFilters, itemsPerPage, updatedAtAfter, updatedAtBefore, nextAppointmentDateAfter, nextAppointmentDateBefore]);

  // Get tracker entries with infinite scroll
  const {
    data: entriesData,
    isLoading: entriesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTrackerEntries(searchParamsBase, {
    enabled: !!selectedTracker,
  });

  const aggregateParams = useMemo(
    () => ({
      form_id: selectedTracker ? parseInt(selectedTracker, 10) : undefined,
      status: statusesFilter?.length ? undefined : (statusFilter !== "all" ? statusFilter : undefined),
      statuses: statusesFilter?.length ? statusesFilter : undefined,
      query: searchTerm || undefined,
      field_filters:
        Object.keys(columnFilters).length > 0
          ? Object.fromEntries(
              Object.entries(columnFilters).map(([fid, v]) => [
                fid,
                v && typeof v === "object" && "op" in v && "value" in v ? { op: v.op, value: v.value } : v,
              ])
            )
          : undefined,
      aggregate_fields: Object.keys(queryBarAggregateFields).length > 0 ? queryBarAggregateFields : undefined,
      updated_at_after: updatedAtAfter || undefined,
      updated_at_before: updatedAtBefore || undefined,
      next_appointment_date_after: nextAppointmentDateAfter || undefined,
      next_appointment_date_before: nextAppointmentDateBefore || undefined,
    }),
    [selectedTracker, statusFilter, statusesFilter, searchTerm, columnFilters, queryBarAggregateFields, updatedAtAfter, updatedAtBefore, nextAppointmentDateAfter, nextAppointmentDateBefore]
  );
  const { data: backendAggregatesData } = useTrackerEntriesAggregates(aggregateParams, {
    enabled: !!selectedTracker,
  });
  // Queue presets come from backend per tracker (patient-referral: fixed presets; stage-styled: one per stage).
  const isPatientReferralTracker = !!selectedTrackerObj?.tracker_config?.is_patient_referral;
  const { data: queueCountsData } = useTrackerQueueCounts(selectedTrackerObj?.slug ?? "", {
    enabled: !!selectedTrackerObj?.slug,
  });
  const queuePresets = queueCountsData?.queue_presets ?? [];

  // Infinite scroll: load more when sentinel enters viewport (must be after useInfiniteTrackerEntries)
  const loadMoreRef = useRef(null);
  const loadMoreCallback = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(loadMoreCallback, {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreCallback]);

  const deleteEntryMutation = useDeleteTrackerEntry();
  const updateEntryMutation = useUpdateTrackerEntry();

  // Flatten all pages into one entries array
  const entries = useMemo(() => {
    if (!entriesData?.pages) return [];
    return entriesData.pages.flatMap((page) => {
      const submissions = page.submissions || page.entries || [];
      return submissions.map((entry) => ({
        ...entry,
        tracker_id: entry.tracker_id || entry.form_id,
      }));
    });
  }, [entriesData]);

  // Keyboard shortcuts: Enter = open selected entry, Escape = clear selection, / = focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedCell(null);
        return;
      }
      if (e.key === "Enter" && selectedCell != null && entries.length > 0) {
        const entry = entries[selectedCell.rowIndex];
        if (entry) {
          e.preventDefault();
          router.push(`/admin/trackers/entries/${entry.slug || entry.id}`);
        }
        return;
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, entries, router]);

  const pagination = useMemo(() => {
    const lastPage = entriesData?.pages?.[entriesData.pages.length - 1];
    return {
      page: lastPage?.page ?? 1,
      per_page: lastPage?.per_page ?? itemsPerPage,
      total: lastPage?.total ?? 0,
      total_pages: lastPage?.total_pages ?? 1,
    };
  }, [entriesData, itemsPerPage]);

  // Get available statuses from selected tracker (prefer detail API for full config)
  const availableStatuses = useMemo(() => {
    if (!selectedTracker) return [];
    const fromDetail = selectedTrackerDetail?.tracker_config?.statuses;
    if (fromDetail && Array.isArray(fromDetail) && fromDetail.length > 0) return fromDetail;
    const tracker = trackers.find((t) => t.id === parseInt(selectedTracker));
    if (!tracker?.tracker_config?.statuses) return [];
    return tracker.tracker_config.statuses;
  }, [selectedTracker, trackers, selectedTrackerDetail]);

  // Get displayable fields for the selected tracker (for table columns)
  // Uses list_view_fields from tracker_config if specified, otherwise shows first 4 fields
  // This ensures we only show configured fields, not all fields
  const displayableFields = useMemo(() => {
    if (!selectedTracker) return [];
    const tracker = trackers.find((t) => t.id === parseInt(selectedTracker));
    if (!tracker?.tracker_fields?.fields) return [];
    
    // Get all non-display fields (exclude display-only field types)
    const allFields = tracker.tracker_fields.fields.filter((field) => {
      const fieldType = field.type || field.field_type;
      return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
    });
    
    // Check if tracker_config has list_view_fields specified
    const listViewFields = tracker?.tracker_config?.list_view_fields;
    
    if (listViewFields && Array.isArray(listViewFields) && listViewFields.length > 0) {
      // Use ONLY the configured fields - restrict to what's in list_view_fields
      const configuredFields = listViewFields
        .map((fieldId) => allFields.find((f) => {
          const fId = f.id || f.field_id || f.name;
          return fId === fieldId || String(fId) === String(fieldId);
        }))
        .filter((f) => f !== undefined && f !== null);
      
      // Return only configured fields, or empty if none found (to avoid showing all)
      return configuredFields.length > 0 ? configuredFields : [];
    }
    
    // Default: show first 4 fields if no configuration
    return allFields.slice(0, 4);
  }, [selectedTracker, trackers]);

  // All fields for query bar suggestions (filter/highlight by any field)
  const allFieldsForQueryBar = useMemo(() => {
    if (!selectedTrackerObj?.tracker_fields?.fields) return [];
    return selectedTrackerObj.tracker_fields.fields.filter((field) => {
      const fieldType = field.type || field.field_type;
      return !["text_block", "image_block", "line_break", "page_break", "youtube_video_embed"].includes(fieldType);
    });
  }, [selectedTrackerObj]);

  const fetchFieldSuggestions = useCallback(
    (params) => trackersService.getTrackerFieldSuggestions(params),
    []
  );

  const handleApplyFieldFilter = useCallback((fieldId, value, operator = "=") => {
    if (operator && operator !== "=") {
      setColumnFilters((prev) => ({ ...prev, [fieldId]: { op: operator, value } }));
    } else {
      setColumnFilters((prev) => ({ ...prev, [fieldId]: value }));
    }
  }, []);

  const HIGHLIGHT_COLOR_CLASSES = useMemo(
    () => ({
      red: "bg-red-100 dark:bg-red-900/30",
      green: "bg-green-100 dark:bg-green-900/30",
      yellow: "bg-yellow-100 dark:bg-yellow-900/30",
      orange: "bg-orange-100 dark:bg-orange-900/30",
      blue: "bg-blue-100 dark:bg-blue-900/30",
    }),
    []
  );

  const handleApplyAggregateDisplay = useCallback(({ fieldId, type }) => {
    setQueryBarAggregateFields((prev) => ({ ...prev, [fieldId]: type }));
  }, []);

  const handleApplyHighlightRule = useCallback((rule) => {
    const normalized = {
      fieldId: rule.displayFieldId ?? rule.fieldId,
      displayFieldId: rule.displayFieldId,
      conditionFieldId: rule.conditionFieldId ?? rule.fieldId,
      operator: rule.operator ?? "=",
      value: rule.value,
      color: rule.color ?? "green",
    };
    setHighlightRules((prev) => [...prev, normalized]);
  }, []);

  // Apply queue preset: use backend queue_presets when available (per-tracker queues); else fall back to patient-referral preset helper
  const applyQueue = useCallback((queueId) => {
    setActiveQueue(queueId === "all" ? null : queueId);
    const presets = queueCountsData?.queue_presets;
    const preset = presets?.find((p) => p.id === queueId);
    if (preset) {
      setStatusFilter(preset.status ?? (preset.statuses?.length === 1 ? preset.statuses[0] : "all"));
      setStatusesFilter(preset.statuses?.length > 1 ? preset.statuses : null);
      setColumnFilters(preset.field_filters || {});
      setNextAppointmentDateAfter(preset.next_appointment_date_after || null);
      setNextAppointmentDateBefore(preset.next_appointment_date_before || null);
    } else {
      const legacy = getPatientReferralQueuePreset(queueId);
      setStatusFilter(legacy.status ?? "all");
      setStatusesFilter(null);
      setColumnFilters(legacy.field_filters || {});
      setNextAppointmentDateAfter(legacy.next_appointment_date_after || null);
      setNextAppointmentDateBefore(legacy.next_appointment_date_before || null);
    }
  }, [queueCountsData?.queue_presets]);

  // Helper: does this cell match a highlight rule? Returns { match, color }. Multiple rules for the same column are supported; last matching rule wins (so add most specific first, or add in order: red >75, green <=75, blue <=50).
  const cellMatchesHighlightRule = useCallback(
    (fieldId, cellValue, rules = highlightRules, rowDisplayValues = {}) => {
      const getRaw = (val) =>
        val != null && typeof val === "object" && "value" in val ? val.value : val;
      let lastMatch = null;
      for (const r of rules) {
        const displayCol = r.displayFieldId ?? r.fieldId;
        if (displayCol !== fieldId) continue;
        const compareVal = r.conditionFieldId != null ? rowDisplayValues[r.conditionFieldId] : cellValue;
        const raw = getRaw(compareVal);
        const strVal = raw == null ? "" : String(raw).trim();
        const numVal = Number(raw);
        const isNum = Number.isFinite(numVal);
        const rVal = r.value;
        const rStr = String(rVal).trim();
        const rNum = Number(rVal);
        const rIsNum = Number.isFinite(rNum);
        let match = false;
        switch (r.operator) {
          case "=":
            if (strVal === rStr) match = true;
            else if (isNum && rIsNum && numVal === rNum) match = true;
            break;
          case ">":
            if (isNum && rIsNum && numVal > rNum) match = true;
            break;
          case "<":
            if (isNum && rIsNum && numVal < rNum) match = true;
            break;
          case ">=":
            if (isNum && rIsNum && numVal >= rNum) match = true;
            break;
          case "<=":
            if (isNum && rIsNum && numVal <= rNum) match = true;
            break;
          case "contains":
            if (strVal.toLowerCase().includes(rStr.toLowerCase())) match = true;
            break;
          default:
            if (strVal === rStr) match = true;
        }
        if (match) lastMatch = { match: true, color: r.color ?? "green" };
      }
      return lastMatch ?? { match: false };
    },
    [highlightRules]
  );

  // Helper function to format field value for display
  // Helper to check if a field is sortable (number, date, datetime)
  const isFieldSortable = (field) => {
    const fieldType = field.type || field.field_type;
    return ['number', 'date', 'datetime'].includes(fieldType);
  };

  // Helper to check if a field is filterable (select, multiselect)
  const isFieldFilterable = (field) => {
    const fieldType = field.type || field.field_type;
    return ['select', 'multiselect'].includes(fieldType);
  };

  // Get unique values for a select field from entries
  const getFieldUniqueValues = (field, entries) => {
    const fieldId = field.id || field.field_id || field.name;
    const values = new Set();
    entries.forEach((entry) => {
      const submissionData = entry.submission_data || entry.formatted_data || {};
      const value = submissionData[fieldId];
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((v) => values.add(String(v)));
        } else {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  };

  // Handle column header click for sorting
  const handleColumnSort = (field) => {
    const fieldId = field.id || field.field_id || field.name;
    const currentSort = columnSorting[fieldId];
    
    // Cycle: null -> 'asc' -> 'desc' -> null
    let newSort = null;
    if (currentSort === null || currentSort === undefined) {
      newSort = 'asc';
    } else if (currentSort === 'asc') {
      newSort = 'desc';
    } else {
      newSort = null;
    }
    
    if (newSort === null) {
      // Remove from sorting, revert to default
      const newColumnSorting = { ...columnSorting };
      delete newColumnSorting[fieldId];
      setColumnSorting(newColumnSorting);
      setSortBy("created_at");
      setSortOrder("desc");
    } else {
      // Set column-specific sorting
      setColumnSorting({ ...columnSorting, [fieldId]: newSort });
      // For now, we'll use the field value in submission_data for sorting
      // This requires backend support - for now, just set the sort state
      setSortBy(`field_${fieldId}`);
      setSortOrder(newSort);
    }
    // Infinite scroll: filter change resets query
  };

  // Handle column filter change
  const handleColumnFilter = (field, value) => {
    const fieldId = field.id || field.field_id || field.name;
    if (value === "all" || value === "") {
      const newFilters = { ...columnFilters };
      delete newFilters[fieldId];
      setColumnFilters(newFilters);
    } else {
      setColumnFilters({ ...columnFilters, [fieldId]: value });
    }
    // Infinite scroll: filter change resets query
  };

  // Extract numeric value for aggregates (handles { value, rag }, string numbers)
  const getNumericValue = (value, field) => {
    if (value == null || value === "") return null;
    const raw = value && typeof value === "object" && "value" in value ? value.value : value;
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const formatFieldValue = (field, value) => {
    const fieldType = field.type || field.field_type;

    // Any field with RAG display (rag, calculated+rag, number+rag): value is { value, rag }
    if (value && typeof value === "object" && "rag" in value) {
      const rag = value.rag?.toLowerCase();
      const label = value.value != null && value.value !== "" ? String(value.value) : "—";
      const badge = rag ? `[${rag.charAt(0).toUpperCase() + rag.slice(1)}] ` : "";
      return badge + label;
    }
    // Calculated (no RAG): raw value
    if (fieldType === "calculated") {
      if (value === null || value === undefined || value === "") return "—";
      return String(value);
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
    
    // Handle select/multiselect fields - show label instead of value
    if ((fieldType === "select" || fieldType === "multiselect")) {
      // Get options from field.options or field.field_options?.options
      const options = field.options || field.field_options?.options || [];
      
      if (Array.isArray(value)) {
        // Multiselect - map each value to its label
        return value.map(v => {
          const option = options.find(opt => {
            const optValue = opt.value || opt;
            return String(optValue) === String(v) || String(opt.label || opt) === String(v);
          });
          if (option) {
            return typeof option === "object" ? (option.label || option.value || String(v)) : String(option);
          }
          return String(v);
        }).join(", ");
      } else {
        // Single select - find the option and return its label
        const option = options.find(opt => {
          const optValue = opt.value || opt;
          return String(optValue) === String(value) || String(opt.label || opt) === String(value);
        });
        if (option) {
          return typeof option === "object" ? (option.label || option.value || String(value)) : String(option);
        }
        return String(value);
      }
    }
    
    // Handle people/user fields - show name instead of JSON
    // Value might be an object or a stringified JSON
    if (fieldType === "people" || fieldType === "user") {
      let userObj = value;
      
      // If value is a string, try to parse it as JSON
      if (typeof value === "string") {
        try {
          userObj = JSON.parse(value);
        } catch (e) {
          // Not valid JSON, return as-is
          return value;
        }
      }
      
      // Now handle as object
      if (typeof userObj === "object" && userObj !== null) {
        // Extract display name from the user object
        if (userObj.display_name) {
          return userObj.display_name;
        }
        // Build name from first_name and last_name
        const nameParts = [];
        if (userObj.first_name) nameParts.push(userObj.first_name);
        if (userObj.last_name) nameParts.push(userObj.last_name);
        if (nameParts.length > 0) {
          return nameParts.join(" ");
        }
        // Fallback to email
        if (userObj.email) {
          return userObj.email;
        }
        // Last resort: user ID
        if (userObj.id) {
          return `User #${userObj.id}`;
        }
      }
    }

    // Repeatable group: value is array of row objects
    if (fieldType === "repeatable_group") {
      const rows = Array.isArray(value) ? value : [];
      if (rows.length === 0) return "—";
      return `${rows.length} row${rows.length !== 1 ? "s" : ""}`;
    }
    
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const exportEntriesToCsv = useCallback(
    (entriesToExport, fields, trackerName) => {
      const headers = ["#", "Status", ...fields.map((f) => f.label || f.field_label || f.name || f.id || "")];
      const escape = (v) => {
        const s = String(v == null ? "" : v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows = entriesToExport.map((entry) => {
        const data = entry.formatted_data || entry.submission_data || {};
        const num = entry.tracker_entry_number ?? entry.id ?? "";
        const status = entry.status ?? "";
        const cells = [
          num,
          status,
          ...fields.map((f) => {
            const fieldId = f.id || f.field_id || f.name;
            return formatFieldValue(f, data[fieldId]);
          }),
        ];
        return cells.map(escape).join(",");
      });
      const csv = [headers.map(escape).join(","), ...rows].join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(trackerName || "tracker").replace(/\s+/g, "-")}-entries.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [formatFieldValue]
  );

  // Status and Stage are different: stage has many statuses. When changing status we pass stage so backend can verify.
  const handleStatusChange = useCallback(
    async (entry, newStatus, notes = null, stageForVerification = null) => {
      const entryId = entry.slug ?? entry.id;
      if (entryId == null || entryId === "") {
        toast.error("Cannot update: entry has no id");
        return;
      }
      try {
        const entryData = { status: newStatus };
        if (stageForVerification != null && String(stageForVerification).trim() !== "")
          entryData.stage = String(stageForVerification).trim();
        if (notes != null && String(notes).trim() !== "") entryData.notes = String(notes).trim();
        await updateEntryMutation.mutateAsync({
          entryIdentifier: String(entryId),
          entryData,
        });
      } catch (error) {
        console.error("Status update failed:", error);
      }
    },
    [updateEntryMutation]
  );

  // Statuses for the target stage (when changing stage) — same as entry detail
  const statusesForTargetStage = useMemo(() => {
    if (!stageChangePending?.stageName || !selectedTrackerDetail?.tracker_config?.stage_mapping?.length) return [];
    const mapping = selectedTrackerDetail.tracker_config.stage_mapping;
    const item = mapping.find((s) => String(s?.stage ?? s?.name ?? "").trim() === String(stageChangePending.stageName).trim());
    return (item?.statuses ?? item?.status_list ?? []).filter(Boolean);
  }, [stageChangePending?.stageName, selectedTrackerDetail?.tracker_config?.stage_mapping]);

  // Move entry to a stage: open dialog with Status + Note (required); same as entry detail.
  const handleStageChange = useCallback((entry, stageName, stageMapping) => {
    const name = (stageName ?? "").toString().trim();
    if (!name) return;
    const mapping = Array.isArray(stageMapping) ? stageMapping : [];
    if (mapping.length === 0) {
      toast.error("No stages configured for this tracker");
      return;
    }
    const stageIndex = mapping.findIndex((s) => String(s?.stage ?? s?.name ?? "").trim() === name);
    if (stageIndex < 0) {
      toast.error(`Stage "${name}" not found in tracker config`);
      return;
    }
    setStageChangePending({ entry, stageLabel: name, stageName: name });
    setStageChangeNotes("");
    setStageChangeStatus("");
  }, []);

  // Advance to next stage: open dialog with Status + Note (required); same as entry detail.
  const handleNextStage = useCallback((entry, stageMapping) => {
    if (!stageMapping?.length) return;
    const currentStage = String(entry?.formatted_data?.derived_stage ?? "").trim();
    const idx = stageMapping.findIndex((s) => String(s?.stage ?? s?.name ?? "").trim() === currentStage);
    if (idx < 0 || idx >= stageMapping.length - 1) return;
    const nextItem = stageMapping[idx + 1];
    const nextStageLabel = String(nextItem?.stage ?? nextItem?.name ?? "Next stage").trim();
    if (!nextStageLabel) return;
    setStageChangePending({ entry, stageLabel: nextStageLabel, stageName: nextStageLabel });
    setStageChangeNotes("");
    setStageChangeStatus("");
  }, []);

  // Confirm stage change: send stage, status (if required), and note (required); same as entry detail.
  const confirmStageChangeWithNotes = useCallback(async () => {
    if (!stageChangePending) return;
    const { entry, stageName } = stageChangePending;
    const entryId = entry.slug ?? entry.id;
    if (entryId == null || entryId === "") {
      toast.error("Cannot update: entry has no id");
      setStageChangePending(null);
      setStageChangeNotes("");
      setStageChangeStatus("");
      return;
    }
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
      const entryData = { stage: stageName, notes: noteTrimmed };
      if (stageChangeStatus) entryData.status = stageChangeStatus;
      await updateEntryMutation.mutateAsync({
        entryIdentifier: String(entryId),
        entryData,
      });
      setStageChangePending(null);
      setStageChangeNotes("");
      setStageChangeStatus("");
    } catch (error) {
      console.error("Stage update failed:", error);
    }
    setStageChangePending(null);
    setStageChangeNotes("");
    setStageChangeStatus("");
  }, [stageChangePending, stageChangeNotes, stageChangeStatus, statusesForTargetStage.length, updateEntryMutation]);

  const handleDelete = async (entryId) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteEntryMutation.mutateAsync(entryId);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  if (trackersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show message if no trackers exist
  if (trackers.length === 0) {
    return (
      <div className="space-y-0">
        <Card className="rounded-none">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trackers found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first tracker to start tracking entries
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-0 min-w-0 overflow-x-hidden">
      {/* Create Entry Dialog */}
      {selectedTrackerObj && canCreateEntry && (
            <Dialog 
              open={isCreateEntryDialogOpen} 
              onOpenChange={(open) => {
                setIsCreateEntryDialogOpen(open);
                if (!open) {
                  setEntryFormData({});
                  setEntryFieldErrors({});
                  setCreateEntryStageIndex(0);
                }
              }}
            >
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Entry</DialogTitle>
                  <DialogDescription>
                    Fill in the details for {selectedTrackerObj?.name || "this tracker"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {trackerDetails && trackerDetails.tracker_fields?.fields && (() => {
                    // Get fields to show in creation modal
                    const allFields = trackerDetails.tracker_fields.fields.filter((field) => {
                            // Filter out display-only fields
                            const fieldType = field.type || field.field_type;
                            return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
                    });
                    
                    // Check if create_view_fields is configured
                    const createViewFields = trackerDetails.tracker_config?.create_view_fields;
                    const fieldsToShow = createViewFields && Array.isArray(createViewFields) && createViewFields.length > 0
                      ? allFields.filter((field) => {
                          const fieldId = field.id || field.field_id || field.name;
                          return createViewFields.includes(fieldId);
                        })
                      : allFields; // Show all fields if not configured (backward compatibility)
                    
                    // Group by section (stage) when tracker has sections
                    const sections = trackerDetails.tracker_fields?.sections || [];
                    const stageMapping = trackerDetails.tracker_config?.stage_mapping || [];
                    // Wizard steps: only when use_stages is enabled; then stage_mapping (e.g. 5) or sections (e.g. 3)
                    const useStages = trackerDetails.tracker_config?.use_stages !== false;
                    const wizardSteps = useStages && stageMapping.length > 0 ? stageMapping : (useStages ? sections : []);
                    const fieldsBySection = {};
                    if (sections.length > 0) {
                      sections.forEach((section, index) => {
                        const sectionKey = section.id ?? section.title ?? section.label ?? `section-${index}`;
                        const sectionFieldIds = section.fields || [];
                        const sectionFields = sectionFieldIds
                          .map((fid) => fieldsToShow.find((f) => (f.id || f.field_id || f.name) === fid))
                          .filter(Boolean);
                        fieldsBySection[sectionKey] = { ...section, id: section.id ?? sectionKey, fields: sectionFields };
                      });
                      const assignedIds = new Set(sections.flatMap((s) => s.fields || []));
                      const unassignedFields = fieldsToShow.filter((f) => !assignedIds.has(f.id || f.field_id || f.name));
                      if (unassignedFields.length > 0) {
                        fieldsBySection._other = { id: "_other", title: "Other", label: "Other", fields: unassignedFields };
                      }
                    }
                    
                    const renderField = (field) => {
                      const fieldId = field.id || field.field_id;
                      const fieldValue = entryFormData[fieldId] || "";
                      return (
                        <CustomFieldRenderer
                          key={fieldId}
                          field={{
                            ...field,
                            id: fieldId,
                            field_label: field.label || field.field_label,
                            field_type: field.type || field.field_type,
                            is_required: field.required || field.is_required,
                          }}
                          value={fieldValue}
                          onChange={(id, value) => {
                            setEntryFormData((prev) => ({ ...prev, [id]: value }));
                            if (entryFieldErrors[id]) {
                              setEntryFieldErrors((prev) => {
                                const next = { ...prev };
                                delete next[id];
                                return next;
                              });
                            }
                          }}
                          error={entryFieldErrors[fieldId]}
                        />
                      );
                    };
                    
                    return (
                      <div className="space-y-4">
                        {fieldsToShow.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No fields configured for creation. Please configure "Create View Fields" in tracker settings.
                          </p>
                        ) : wizardSteps.length > 0 ? (
                          // One stage at a time: steps from stage_mapping (or sections); fields from sections by index
                          (() => {
                            const currentIndex = Math.min(createEntryStageIndex, wizardSteps.length - 1);
                            const step = wizardSteps[currentIndex];
                            const stepLabel = step?.stage ?? step?.name ?? step?.title ?? step?.label ?? step?.id ?? `Stage ${currentIndex + 1}`;
                            // Fields for this step: use section at same index if available
                            const section = currentIndex < sections.length ? sections[currentIndex] : null;
                            const sectionKey = section ? (section.id ?? section.title ?? section.label ?? `section-${currentIndex}`) : null;
                            const sectionFields = sectionKey ? (fieldsBySection[sectionKey]?.fields || []) : [];
                            return (
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  Stage {currentIndex + 1} of {wizardSteps.length}
                                </p>
                                <Card>
                                  <CardHeader className="py-3">
                                    <CardTitle className="text-base">{stepLabel}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    {sectionFields.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No fields for this stage.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sectionFields.map((field) => renderField(field))}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })()
                        ) : (
                          // No sections: flat list (backward compatibility)
                          <>
                            <Label className="text-base font-semibold">Entry Details</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {fieldsToShow.map((field) => renderField(field))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateEntryDialogOpen(false);
                      setCreateEntryStageIndex(0);
                    }}
                    disabled={createEntryMutation.isPending}
                  >
                    Cancel
                  </Button>
                  {(() => {
                    const useStages = trackerDetails?.tracker_config?.use_stages !== false;
                    const sm = trackerDetails?.tracker_config?.stage_mapping || [];
                    const sec = trackerDetails?.tracker_fields?.sections || [];
                    const wizardStepCount = useStages ? (sm.length > 0 ? sm.length : sec.length) : 0;
                    return wizardStepCount > 0;
                  })() && createEntryStageIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCreateEntryStageIndex((i) => Math.max(0, i - 1))}
                      disabled={createEntryMutation.isPending}
                    >
                      Previous
                    </Button>
                  )}
                  {(() => {
                    const useStages = trackerDetails?.tracker_config?.use_stages !== false;
                    const sm = trackerDetails?.tracker_config?.stage_mapping || [];
                    const sec = trackerDetails?.tracker_fields?.sections || [];
                    const wizardStepCount = useStages ? (sm.length > 0 ? sm.length : sec.length) : 0;
                    return wizardStepCount > 0 && createEntryStageIndex < wizardStepCount - 1;
                  })() && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const sections = trackerDetails.tracker_fields.sections || [];
                        const section = sections[createEntryStageIndex];
                        const sectionFieldIds = section?.fields || [];
                        const allFields = trackerDetails.tracker_fields?.fields || [];
                        const createViewFields = trackerDetails.tracker_config?.create_view_fields;
                        const errors = {};
                        sectionFieldIds.forEach((fid) => {
                          const field = allFields.find((f) => (f.id || f.field_id || f.name) === fid);
                          if (!field || !(field.required || field.is_required)) return;
                          if (createViewFields?.length && !createViewFields.includes(fid)) return;
                          if (!entryFormData[fid]) {
                            errors[fid] = `${field.label || field.field_label || "This field"} is required`;
                          }
                        });
                        if (Object.keys(errors).length > 0) {
                          setEntryFieldErrors(errors);
                          toast.error("Please fill in all required fields for this stage");
                          return;
                        }
                        setEntryFieldErrors({});
                        const useStages = trackerDetails?.tracker_config?.use_stages !== false;
                        const wizardStepCount = useStages
                          ? ((trackerDetails.tracker_config?.stage_mapping?.length || 0) > 0
                            ? (trackerDetails.tracker_config.stage_mapping?.length || 0)
                            : sections.length)
                          : 0;
                        setCreateEntryStageIndex((i) => Math.min(wizardStepCount - 1, i + 1));
                      }}
                      disabled={createEntryMutation.isPending}
                    >
                      Next stage
                    </Button>
                  )}
                  <Button
                    onClick={async () => {
                      if (!selectedTrackerObj || !trackerDetails) {
                        toast.error("Please select a tracker");
                        return;
                      }
                      const errors = {};
                      const allFields = trackerDetails.tracker_fields?.fields?.filter((field) => {
                        const fieldType = field.type || field.field_type;
                        return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
                      }) || [];
                      const createViewFields = trackerDetails.tracker_config?.create_view_fields;
                      const fieldsToValidate = createViewFields && Array.isArray(createViewFields) && createViewFields.length > 0
                        ? allFields.filter((field) => {
                            const fieldId = field.id || field.field_id || field.name;
                            return createViewFields.includes(fieldId);
                          })
                        : allFields;
                      fieldsToValidate.forEach((field) => {
                        const fieldId = field.id || field.field_id || field.name;
                        const isRequired = field.required || field.is_required;
                        if (isRequired && !entryFormData[fieldId]) {
                          errors[fieldId] = `${field.label || field.field_label || "This field"} is required`;
                        }
                      });
                      if (Object.keys(errors).length > 0) {
                        setEntryFieldErrors(errors);
                        toast.error("Please fill in all required fields");
                        return;
                      }
                      try {
                        // Build submission_data: upload file fields first and store file_id(s); copy other fields as-is (no File objects – API expects file_id)
                        const allFields = trackerDetails.tracker_fields?.fields || [];
                        const submission_data = {};
                        Object.entries(entryFormData).forEach(([k, v]) => {
                          if (v instanceof File || (v && typeof v === "object" && v.file instanceof File)) return; // skip raw files; file fields filled below
                          submission_data[k] = v;
                        });
                        const getFileFromValue = (val) => {
                          if (val instanceof File) return { file: val, expiryDate: null };
                          if (val && typeof val === "object" && val.file) return val;
                          return null;
                        };
                        // Upload file fields via settings endpoint (returns file_reference_id; prefer over id)
                        const uploadFileToSettings = async (file, formId, fieldId) => {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("form_id", String(formId));
                          formData.append("field_id", String(fieldId));
                          const res = await api.post("/settings/files/upload", formData);
                          const data = res?.data ?? res;
                          return data?.file_reference_id ?? data?.id ?? data?.file_id ?? null;
                        };
                        for (const field of allFields) {
                          const fieldType = (field.type || field.field_type || "").toLowerCase();
                          if (fieldType !== "file") continue;
                          const fieldId = field.id || field.field_id || field.name;
                          const value = entryFormData[fieldId];
                          if (value == null) continue;
                          // Single file (File or { file, expiryDate })
                          if (value instanceof File || (value && typeof value === "object" && value.file && !Array.isArray(value))) {
                            const fileData = getFileFromValue(value);
                            const file = fileData?.file || value;
                            const fileRef = await uploadFileToSettings(file, trackerDetails.id, fieldId);
                            if (fileRef != null) {
                              submission_data[fieldId] = field.file_expiry_date && fileData?.expiryDate
                                ? { file_reference_id: fileRef, expiry_date: fileData.expiryDate }
                                : fileRef;
                            }
                            continue;
                          }
                          // Multiple files (array)
                          if (Array.isArray(value) && value.length > 0) {
                            const first = value[0];
                            if (first instanceof File || (first && typeof first === "object" && first.file)) {
                              const fileRefs = [];
                              for (let i = 0; i < value.length; i++) {
                                const fileData = getFileFromValue(value[i]);
                                const file = fileData?.file || value[i];
                                const fileRef = await uploadFileToSettings(file, trackerDetails.id, fieldId);
                                if (fileRef != null) {
                                  if (field.file_expiry_date && fileData?.expiryDate) {
                                    fileRefs.push({ file_reference_id: fileRef, expiry_date: fileData.expiryDate });
                                  } else {
                                    fileRefs.push(fileRef);
                                  }
                                }
                              }
                              submission_data[fieldId] = fileRefs;
                            }
                          }
                        }
                        const result = await createEntryMutation.mutateAsync({
                          form_id: trackerDetails.id,
                          submission_data,
                          status: trackerDetails.tracker_config?.default_status || "open",
                        });
                        setIsCreateEntryDialogOpen(false);
                        setEntryFormData({});
                        setEntryFieldErrors({});
                        setCreateEntryStageIndex(0);
                        const entryIdentifier = result?.slug ?? result?.id;
                        if (entryIdentifier) {
                          router.push(`/admin/trackers/entries/${entryIdentifier}`);
                        }
                      } catch (error) {
                        // Error handled by mutation or upload
                      }
                    }}
                    disabled={!selectedTrackerObj || !trackerDetails || createEntryMutation.isPending}
                  >
                    {createEntryMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
      )}

      {/* Stage change: require Status (if stage has statuses) and Note (required) — same as entry detail */}
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
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStageChangePending(null);
                setStageChangeNotes("");
                setStageChangeStatus("");
              }}
            >
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
              {updateEntryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Move"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit formula column (while viewing entries – sheet-like) */}
      {selectedTrackerObj && canUpdateTracker && (
        <Dialog open={isFormulaDialogOpen} onOpenChange={setIsFormulaDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{formulaFieldToEdit ? "Edit formula" : "Add formula column"}</DialogTitle>
              <DialogDescription>
                {formulaFieldToEdit
                  ? "Change how this column is calculated. It will update for all entries."
                  : "Add a new column that is calculated from other fields (Sum or Percentage)."}
              </DialogDescription>
            </DialogHeader>
            {!trackerDetailForFormula && !formulaFieldToEdit && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tracker details…
              </div>
            )}
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="formula-label">Column label</Label>
                <Input
                  id="formula-label"
                  value={formulaForm.label}
                  onChange={(e) => setFormulaForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Total, % of target"
                  disabled={!!formulaFieldToEdit}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Formula type</Label>
                <Select
                  value={formulaForm.type}
                  onValueChange={(v) => setFormulaForm((p) => ({ ...p, type: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum of fields</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formulaForm.type === "sum" && (
                <div>
                  <Label htmlFor="formula-field-ids">Field IDs to sum (comma-separated)</Label>
                  <Input
                    id="formula-field-ids"
                    value={formulaForm.field_ids_raw}
                    onChange={(e) => setFormulaForm((p) => ({ ...p, field_ids_raw: e.target.value }))}
                    placeholder="revenue, costs, fee"
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              )}
              {formulaForm.type === "percentage" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="formula-num">Numerator field ID</Label>
                      <Input
                        id="formula-num"
                        value={formulaForm.numerator_field_id}
                        onChange={(e) => setFormulaForm((p) => ({ ...p, numerator_field_id: e.target.value }))}
                        placeholder="achieved"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="formula-den">Denominator field ID</Label>
                      <Input
                        id="formula-den"
                        value={formulaForm.denominator_field_id}
                        onChange={(e) => setFormulaForm((p) => ({ ...p, denominator_field_id: e.target.value }))}
                        placeholder="target"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Or use a value field and a tracker constant:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="formula-value">Value field ID</Label>
                      <Input
                        id="formula-value"
                        value={formulaForm.value_field_id}
                        onChange={(e) => setFormulaForm((p) => ({ ...p, value_field_id: e.target.value }))}
                        placeholder="actual"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="formula-const">Constant key</Label>
                      <Input
                        id="formula-const"
                        value={formulaForm.target_constant_key}
                        onChange={(e) => setFormulaForm((p) => ({ ...p, target_constant_key: e.target.value }))}
                        placeholder="target_kpi"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormulaDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveFormulaColumn}
                disabled={
                  updateTrackerMutation.isPending ||
                  (!formulaFieldToEdit && !formulaForm.label?.trim()) ||
                  (!trackerDetailForFormula && !formulaFieldToEdit)
                }
              >
                {updateTrackerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : formulaFieldToEdit ? (
                  "Update formula"
                ) : (
                  "Add formula column"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Phase 5.3: PSA Quick Guide – "If this happens, set THIS" (Section 9 of spec) */}
      <Dialog open={isPsaQuickGuideOpen} onOpenChange={setIsPsaQuickGuideOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PSA Quick Guide</DialogTitle>
            <DialogDescription>If this happens, set THIS. Use for training and quick reference.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Situation</th>
                    <th className="text-left p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-3">Referral arrives</td><td className="p-3">Upload documents → Set <strong>Awaiting Triage</strong>.</td></tr>
                  <tr className="border-b"><td className="p-3">Consultant has triaged</td><td className="p-3">Open case → Follow triage instruction → Move to: Contact patient to book consultation / Bloods required / Ready to book procedure / Refer back / etc.</td></tr>
                  <tr className="border-b"><td className="p-3">You call, no answer</td><td className="p-3">Add note (e.g. <strong>Patient phoned</strong>) → Set <strong>Chase Patient (No Answer)</strong> → Set <strong>Chase Due</strong> (e.g. tomorrow).</td></tr>
                  <tr className="border-b"><td className="p-3">Patient calls back later</td><td className="p-3">Add note → Move back to appropriate booking status.</td></tr>
                  <tr className="border-b"><td className="p-3">Patient agrees appointment</td><td className="p-3">Set <strong>Consultation Booked</strong> or <strong>Procedure Booked</strong> → Enter date/time → Send SMS if needed.</td></tr>
                  <tr className="border-b"><td className="p-3">Patient does not attend</td><td className="p-3">Set <strong>DNA – Consultation</strong> or <strong>DNA – Procedure</strong> → Add note → Move to <strong>Rebook … Required</strong> (unless consultant says otherwise).</td></tr>
                  <tr className="border-b"><td className="p-3">Bloods or prep required</td><td className="p-3">Set appropriate waiting status → Add tasks/reminders → When complete → Move forward.</td></tr>
                  <tr className="border-b"><td className="p-3">Procedure booked</td><td className="p-3">Set <strong>Procedure Booked</strong> → Enter date/time → Send prep reminder/SMS if required.</td></tr>
                  <tr className="border-b"><td className="p-3">After appointment date passes</td><td className="p-3">Check EMIS → Then set: Follow-up / Surveillance / Discharge / Onward referral / etc.</td></tr>
                  <tr className="border-b"><td className="p-3">Cannot contact after multiple tries</td><td className="p-3">Add notes of attempts → Set <strong>Refer Back Required</strong> (then close with <strong>Closed – Referred Back to GP</strong> + reason).</td></tr>
                  <tr className="border-b"><td className="p-3">Service finished for patient</td><td className="p-3">Set a <strong>Closed</strong> status (Discharged / Referred Back / Onward Referred / Other).</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tracker Tabs + Search: single sticky top block, no gap */}
      <Tabs 
        value={selectedTracker || undefined} 
        onValueChange={(value) => {
          setSelectedTracker(value);
          setColumnSorting({});
          const t = trackers.find((tr) => tr.id.toString() === value);
          const slug = t?.slug || t?.id?.toString();
          if (slug) {
            const next = new URLSearchParams(searchParams.toString());
            next.set(TRACKER_PARAM, slug);
            router.replace(`/admin/trackers?${next.toString()}`, { scroll: false });
          }
        }}
        className="w-full"
      >
        <div className="sticky top-0 z-20 bg-background border-b shadow-sm pt-0 min-w-0 max-w-full">
          {/* Row 1: Tracker tabs */}
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pt-0 pb-0 min-w-0 w-full max-w-full">
            <div className="flex-shrink-0 min-w-0">
              <TabsList className="inline-flex w-auto min-w-max justify-start rounded-none pt-0">
                {trackers
                  .filter((t) => t.is_active)
                  .map((tracker) => (
                    <TabsTrigger key={tracker.id} value={tracker.id.toString()} className="rounded-none">
                      <div className="flex items-center gap-2">
                        <span>{tracker.name}</span>
                        {tracker.category && (
                          <Badge variant="outline" className="text-xs">
                            {tracker.category}
                          </Badge>
                        )}
                      </div>
                    </TabsTrigger>
                  ))}
              </TabsList>
            </div>
            {canCreateTracker && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/admin/trackers/manage?create=true")}
                className="flex-shrink-0"
                title="Create New Tracker"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Row 2: Query bar (formulas + suggestions) or plain search — relative z so dropdown appears above table */}
          <div className="relative z-30 px-0 pb-0">
            {selectedTrackerObj && allFieldsForQueryBar.length > 0 ? (
              <TrackerQuerySearchBar
                searchValue={searchTerm}
                onSearchChange={(value) => setSearchTerm(value)}
                onSearchCommit={(value) => setCommittedSearchTerm(value)}
                fields={allFieldsForQueryBar}
                formId={selectedTrackerObj.id}
                trackerSlug={selectedTrackerObj.slug}
                fetchFieldSuggestions={fetchFieldSuggestions}
                onApplyFieldFilter={handleApplyFieldFilter}
                onApplyHighlightRule={handleApplyHighlightRule}
                onApplyAggregateDisplay={handleApplyAggregateDisplay}
                searchPlaceholder="Search or type a formula… (press / to focus)"
                showFilters={true}
                isFiltersOpen={isFiltersOpen}
                onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
                showCreateButton={canCreateEntry}
                onCreateClick={() => setIsCreateEntryDialogOpen(true)}
                createButtonText="Create Entry"
                createButtonIcon={Plus}
                className="rounded-none border-t-0 shadow-none"
                inputRef={searchInputRef}
              />
            ) : (
              <PageSearchBar
                searchValue={searchTerm}
                onSearchChange={(value) => setSearchTerm(value)}
                searchPlaceholder="Search entries... (press / to focus)"
                showSearch={true}
                showFilters={true}
                isFiltersOpen={isFiltersOpen}
                onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
                showCreateButton={canCreateEntry}
                onCreateClick={() => setIsCreateEntryDialogOpen(true)}
                createButtonText="Create Entry"
                createButtonIcon={Plus}
                className="rounded-none border-t-0 shadow-none"
                inputRef={searchInputRef}
              />
            )}
          </div>
          {/* Row 3: Advanced Filters (when open) */}
          {isFiltersOpen && (
            <Card className="rounded-none border-x-0 border-b border-t-0 shadow-none">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-base">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label>Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {availableStatuses.length > 0 ? (
                          availableStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {humanizeStatusForDisplay(status)}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Sort By</Label>
                    <Select
                      value={`${sortBy}:${sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split(":");
                        setSortBy(field);
                        setSortOrder(order);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at:desc">Newest First</SelectItem>
                        <SelectItem value="created_at:asc">Oldest First</SelectItem>
                        <SelectItem value="updated_at:desc">Recently Updated</SelectItem>
                        <SelectItem value="status:asc">Status A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Label htmlFor="show-last-updated" className="text-sm font-normal cursor-pointer">
                      Show Last Updated
                    </Label>
                    <Switch
                      id="show-last-updated"
                      checked={showMetadataColumns}
                      onCheckedChange={setShowMetadataColumns}
                    />
                  </div>
                </div>
                {/* Phase 3: Last updated range (optional) */}
                {selectedTrackerObj?.tracker_config?.is_patient_referral && (
                  <div className="flex flex-col md:flex-row gap-4 pt-2 border-t">
                    <div className="flex-1 max-w-[200px]">
                      <Label className="text-xs text-muted-foreground">Updated in last (days)</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 7"
                        className="mt-1"
                        value={updatedAtAfter ? (() => {
                          try {
                            const after = new Date(updatedAtAfter);
                            const now = new Date();
                            const days = Math.round((now - after) / (24 * 60 * 60 * 1000));
                            return days > 0 ? String(days) : "";
                          } catch { return ""; }
                        })() : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || v === null) {
                            setUpdatedAtAfter(null);
                            return;
                          }
                          const days = parseInt(v, 10);
                          if (Number.isFinite(days) && days >= 1) {
                            setUpdatedAtAfter(format(subDays(startOfDay(new Date()), days), "yyyy-MM-dd'T'00:00:00"));
                            setUpdatedAtBefore(null);
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 max-w-[200px]">
                      <Label className="text-xs text-muted-foreground">Not updated in (days)</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 7"
                        className="mt-1"
                        value={updatedAtBefore ? (() => {
                          try {
                            const before = new Date(updatedAtBefore);
                            const now = new Date();
                            const days = Math.round((now - before) / (24 * 60 * 60 * 1000));
                            return days > 0 ? String(days) : "";
                          } catch { return ""; }
                        })() : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || v === null) {
                            setUpdatedAtBefore(null);
                            return;
                          }
                          const days = parseInt(v, 10);
                          if (Number.isFinite(days) && days >= 1) {
                            setUpdatedAtBefore(format(subDays(startOfDay(new Date()), days), "yyyy-MM-dd'T'23:59:59"));
                            setUpdatedAtAfter(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Content for each tracker tab */}
        {trackers
          .filter((t) => t.is_active)
          .map((tracker) => {
            // Get displayable fields for this specific tracker
            // Uses list_view_fields from tracker_config if specified
            const trackerFields = tracker?.tracker_fields?.fields || [];
            const allFields = trackerFields.filter((field) => {
              const fieldType = field.type || field.field_type;
              return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
            });
            
            // Check if tracker_config has list_view_fields specified
            // Frontend restricts display to ONLY configured fields - this is the key filtering logic
            const listViewFields = tracker?.tracker_config?.list_view_fields;
            
            const trackerDisplayableFields = (() => {
              // If list_view_fields is configured, use ONLY those fields - no exceptions!
              if (listViewFields && Array.isArray(listViewFields) && listViewFields.length > 0) {
                // Find and return ONLY the configured fields - strict filtering
                const foundFields = listViewFields
                  .map((fieldId) => {
                    return allFields.find((f) => {
                      const fId = f.id || f.field_id || f.name;
                      return fId === fieldId || String(fId) === String(fieldId);
                    });
                  })
                  .filter((f) => f !== undefined && f !== null);
                
                // Return ONLY configured fields, even if empty
                // This ensures we don't fall back to showing all fields
                return foundFields;
              }
              
              // Default: show first 4 fields if no configuration
              return allFields.slice(0, 4);
            })();
            
            // Table aggregates (totals row): compute from current page entries
            const tableAggregatesConfig = tracker?.tracker_config?.table_aggregates || {};
            const aggregatesForTable = (() => {
              const result = {};
              trackerDisplayableFields.forEach((field) => {
                const fieldId = field.id || field.field_id || field.name;
                const aggType = tableAggregatesConfig[fieldId];
                if (!aggType) return;
                const nums = entries
                  .map((e) => {
                    const data = e.formatted_data || e.submission_data || {};
                    return getNumericValue(data[fieldId], field);
                  })
                  .filter((n) => n !== null);
                if (aggType === "count") {
                  result[fieldId] = { type: "count", value: entries.filter((e) => {
                    const data = e.formatted_data || e.submission_data || {};
                    const v = data[fieldId];
                    return v != null && v !== "" && (typeof v !== "object" || (v.value != null && v.value !== ""));
                  }).length };
                } else if (nums.length) {
                  const sum = nums.reduce((a, b) => a + b, 0);
                  result[fieldId] = {
                    type: aggType,
                    value: aggType === "sum" ? sum : aggType === "avg" ? sum / nums.length : aggType === "min" ? Math.min(...nums) : Math.max(...nums),
                    count: nums.length,
                  };
                } else {
                  result[fieldId] = { type: aggType, value: aggType === "count" ? 0 : null };
                }
              });
              return result;
            })();

            const hiddenForTracker = hiddenColumnsByTracker[tracker.id] || {};
            // Exclude the status form field from columns — status is already shown in the fixed second column
            const statusFieldIds = new Set([
              "status",
              "current_status",
              ...(tracker?.tracker_config?.status_field_id ? [tracker.tracker_config.status_field_id] : []),
            ]);
            const visibleFields = trackerDisplayableFields.filter((f) => {
              const fid = f.id || f.field_id || f.name;
              return !hiddenForTracker[fid] && !statusFieldIds.has(fid);
            });
            const densityClass = viewDensity === "compact" ? "py-1 text-xs" : viewDensity === "spacious" ? "py-3 text-sm" : "py-2 text-sm";

            // Prefer backend aggregates (all matching entries) when available; else use client-side (loaded only)
            const effectiveAggregates = (() => {
              const out = {};
              visibleFields.forEach((field) => {
                const fid = field.id || field.field_id || field.name;
                out[fid] = backendAggregatesData?.aggregates?.[fid] ?? aggregatesForTable[fid];
              });
              return out;
            })();
            const hasBackendAggregates = backendAggregatesData?.aggregates && Object.keys(backendAggregatesData.aggregates).length > 0;
            const totalsLabel = hasBackendAggregates
              ? backendAggregatesData.truncated
                ? `Total (first ${(backendAggregatesData.entries_used ?? 0).toLocaleString()} of ${(backendAggregatesData.total_entries ?? 0).toLocaleString()})`
                : "Total (all)"
              : hasNextPage
                ? `Total (${entries.length.toLocaleString()} loaded)`
                : "Total";

            return (
              <TabsContent key={tracker.id} value={tracker.id.toString()} className="mt-0 pt-0 min-w-0 max-w-full overflow-x-hidden">
      {/* Entries: toolbar + quick filters + table */}
      <Card className="rounded-none border-t-0 shadow-none">
        {/* Toolbar: title, count, view options, export, edit, clear filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b bg-muted/30 min-h-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-medium text-sm truncate">{tracker.name}</span>
            <span className="text-muted-foreground text-xs tabular-nums shrink-0">
              {entriesLoading ? "…" : `${pagination.total.toLocaleString()} entries`}
            </span>
            {!entriesLoading && entries.length > 0 && hasNextPage && (
              <span className="text-muted-foreground text-xs shrink-0">
                · {entries.length} loaded
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
            {canReadEntries && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Density</DropdownMenuLabel>
                  {["compact", "comfortable", "spacious"].map((d) => (
                    <DropdownMenuCheckboxItem
                      key={d}
                      checked={viewDensity === d}
                      onCheckedChange={() => setViewDensity(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canReadEntries && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <ColumnsIcon className="h-4 w-4 mr-1" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[60vh] overflow-y-auto">
                <DropdownMenuLabel>Show / hide columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {trackerDisplayableFields.map((field) => {
                  const fieldId = field.id || field.field_id || field.name;
                  const label = field.label || field.field_label || field.name || fieldId;
                  const isHidden = !!hiddenForTracker[fieldId];
                  return (
                    <DropdownMenuCheckboxItem
                      key={fieldId}
                      checked={!isHidden}
                      onCheckedChange={() => toggleColumnVisibility(tracker.id, fieldId)}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            )}
            {canReadEntries && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => exportEntriesToCsv(entries, visibleFields, tracker.name)}
                disabled={entries.length === 0}
                title={
                  hasNextPage
                    ? `Exports currently loaded entries only (${entries.length.toLocaleString()} of ${pagination.total.toLocaleString()}). Scroll to bottom to load all, then export again for full data.`
                    : `Export ${entries.length.toLocaleString()} entries to CSV`
                }
              >
                <Download className="h-4 w-4 mr-1" />
                {hasNextPage ? `Export CSV (${entries.length.toLocaleString()} loaded)` : "Export CSV"}
              </Button>
            )}
            {canUpdateTracker && (
              <Button variant="outline" size="sm" className="h-8" onClick={openAddFormulaDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Add formula
              </Button>
            )}
            {canUpdateTracker && (
              <Button variant="ghost" size="sm" className="h-8" asChild>
                <Link href={`/admin/trackers/${tracker.slug || tracker.id}/edit`}>
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Link>
              </Button>
            )}
            {tracker?.tracker_config?.allow_public_submit && tracker?.slug && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
                title="Copy shareable form link"
                onClick={async () => {
                  const link = typeof window !== "undefined" ? `${window.location.origin}/forms/${tracker.slug}/submit` : "";
                  if (!link) return;
                  try {
                    await navigator.clipboard.writeText(link);
                    toast.success("Shareable link copied to clipboard");
                  } catch (err) {
                    toast.error("Failed to copy link");
                  }
                }}
              >
                <Link2 className="h-4 w-4" />
                Share form
              </Button>
            )}
          </div>
        </div>
        {/* Applied filters (search + column filters + highlights + aggregates) — visible chips */}
        {(searchTerm || Object.keys(columnFilters).length > 0 || highlightRules.length > 0 || Object.keys(queryBarAggregateFields).length > 0) && selectedTracker === tracker.id.toString() && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b bg-muted/20">
            <span className="text-muted-foreground text-xs mr-1 shrink-0">Applied:</span>
            {searchTerm && (
              <Badge variant="secondary" className="text-xs font-normal gap-1 pr-1">
                Search: &quot;{searchTerm.length > 20 ? searchTerm.slice(0, 20) + "…" : searchTerm}&quot;
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 shrink-0"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {Object.entries(columnFilters).map(([fieldId, value]) => {
              const op = value && typeof value === "object" && "op" in value ? value.op : "=";
              const displayVal = value && typeof value === "object" && "value" in value ? value.value : value;
              if (displayVal == null || displayVal === "" || displayVal === "all") return null;
              const field = allFields.find((f) => (f.id || f.field_id || f.name) === fieldId);
              const label = field?.label || field?.field_label || field?.name || fieldId;
              const displayStr = String(displayVal).length > 16 ? String(displayVal).slice(0, 16) + "…" : displayVal;
              return (
                <Badge key={fieldId} variant="secondary" className="text-xs font-normal gap-1 pr-1">
                  {label} {op} {displayStr}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 shrink-0"
                    onClick={() => setColumnFilters((prev) => { const next = { ...prev }; delete next[fieldId]; return next; })}
                    aria-label={`Remove filter ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
            {highlightRules.map((rule, idx) => {
              const displayFieldId = rule.displayFieldId ?? rule.fieldId;
              const condFieldId = rule.conditionFieldId ?? rule.fieldId;
              const displayLabel = allFields.find((f) => (f.id || f.field_id || f.name) === displayFieldId)?.label || displayFieldId;
              const condLabel = allFields.find((f) => (f.id || f.field_id || f.name) === condFieldId)?.label || condFieldId;
              const desc = displayFieldId === condFieldId
                ? `${displayLabel} ${rule.operator} ${rule.value} (${rule.color ?? "green"})`
                : `Make ${displayLabel} ${rule.color ?? "green"} if ${condLabel} ${rule.operator} ${rule.value}`;
              return (
                <Badge key={`hl-${idx}`} variant="secondary" className="text-xs font-normal gap-1 pr-1">
                  {desc.length > 28 ? desc.slice(0, 28) + "…" : desc}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 shrink-0"
                    onClick={() => setHighlightRules((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove highlight rule"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
            {Object.entries(queryBarAggregateFields).map(([fieldId, type]) => {
              const field = allFields.find((f) => (f.id || f.field_id || f.name) === fieldId);
              const label = field?.label || field?.field_label || field?.name || fieldId;
              return (
                <Badge key={`ag-${fieldId}`} variant="secondary" className="text-xs font-normal gap-1 pr-1">
                  Show {type} {label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 shrink-0"
                    onClick={() => setQueryBarAggregateFields((prev) => { const next = { ...prev }; delete next[fieldId]; return next; })}
                    aria-label={`Remove aggregate ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}
        {/* Stages: per-tracker presets from backend (only when tracker uses stages). */}
        {queuePresets.length > 0 && selectedTracker === selectedTrackerObj?.id?.toString() && selectedTrackerObj?.tracker_config?.use_stages !== false && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground mr-1 shrink-0">Stages:</span>
            {queuePresets.map((preset) => {
              const id = preset.id;
              const label = preset.label ?? id;
              const count = queueCountsData?.queue_counts?.[id] ?? null;
              const avgDays = queueCountsData?.avg_days_by_queue?.[id];
              const isOverdue = id === "chase_overdue" && count != null && count > 0;
              const title = avgDays != null && id !== "all"
                ? `Avg ${avgDays} days in stage`
                : undefined;
              return (
                <Button
                  key={id}
                  variant={activeQueue === id || (id === "all" && !activeQueue) ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-7 text-xs", isOverdue && "border-amber-500/70 text-amber-700 dark:text-amber-400")}
                  onClick={() => applyQueue(id)}
                  title={title}
                >
                  {label}
                  {count != null ? ` (${count})` : ""}
                  {avgDays != null && id !== "all" ? ` · ${avgDays}d` : ""}
                </Button>
              );
            })}
            {isPatientReferralTracker && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs ml-2"
                onClick={() => setIsPsaQuickGuideOpen(true)}
              >
                PSA Quick Guide
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-2 self-center">
              Counts use <strong>Status</strong>. Allowed values are in{" "}
              <Link href={selectedTrackerObj?.slug ? `/admin/trackers/${selectedTrackerObj.slug}/edit` : "#"} className="underline">
                Edit tracker → Statuses
              </Link>
              . The form field that holds status (e.g. &quot;Current status&quot;) is just a field; Stage is derived from status.
            </span>
          </div>
        )}
        {/* Quick status filter chips */}
        {availableStatuses.length > 0 && selectedTracker === tracker.id.toString() && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b bg-muted/20">
            <Button
              variant={statusFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            {availableStatuses.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStatusFilter(status)}
              >
                {humanizeStatusForDisplay(status)}
              </Button>
            ))}
          </div>
        )}
        <CardContent className="p-0">
          {entriesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading entries…</p>
              <div className="w-full max-w-md space-y-2 px-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 rounded-none bg-muted/50 animate-pulse" />
                ))}
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchTerm || statusFilter !== "all" || Object.keys(columnFilters).length > 0 || nextAppointmentDateAfter || nextAppointmentDateBefore || updatedAtAfter || updatedAtBefore
                  ? "No entries match"
                  : "No entries yet"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                {searchTerm || statusFilter !== "all" || Object.keys(columnFilters).length > 0 || nextAppointmentDateAfter || nextAppointmentDateBefore || updatedAtAfter || updatedAtBefore
                  ? "Try adjusting search or filters."
                  : `Create the first entry for ${tracker.name}.`}
              </p>
              {canCreateEntry &&
                !searchTerm &&
                statusFilter === "all" &&
                Object.keys(columnFilters).length === 0 &&
                !nextAppointmentDateAfter &&
                !nextAppointmentDateBefore &&
                !updatedAtAfter &&
                !updatedAtBefore && (
                <Button onClick={() => setIsCreateEntryDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create first entry
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Formula bar (sheet-like): shows selected cell name + value */}
              {selectedCell && selectedCell.rowIndex >= 0 && selectedCell.rowIndex < entries.length && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-none border border-t-0 bg-muted/30 text-sm font-mono min-h-9">
                  <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0 text-xs uppercase tracking-wide">Cell</span>
                  <span className="text-muted-foreground">:</span>
                  {(() => {
                    const entry = entries[selectedCell.rowIndex];
                    if (selectedCell.fieldId === "_entry#") {
                      const n = entry?.tracker_entry_number || entry?.id;
                      return (
                        <>
                          <span className="font-medium">#</span>
                          <span className="text-muted-foreground">=</span>
                          <span>#{n}</span>
                        </>
                      );
                    }
                    if (selectedCell.fieldId === "_status") {
                      return (
                        <>
                          <span className="font-medium">Status</span>
                          <span className="text-muted-foreground">=</span>
                          <span>{humanizeStatusForDisplay(entry?.status || "open")}</span>
                        </>
                      );
                    }
                    if (selectedCell.fieldId === "_derived_stage") {
                      return (
                        <>
                          <span className="font-medium">Stage</span>
                          <span className="text-muted-foreground">=</span>
                          <span>{entry?.formatted_data?.derived_stage ?? "—"}</span>
                        </>
                      );
                    }
                    const field = trackerDisplayableFields.find(
                      (f) => (f.id || f.field_id || f.name) === selectedCell.fieldId
                    );
                    // field may be from hidden column; still resolve for formula bar
                    const displayData = entry?.formatted_data || entry?.submission_data || {};
                    const value = displayData[selectedCell.fieldId];
                    const fieldType = field?.type || field?.field_type;
                    const label = field?.label || field?.field_label || field?.name || selectedCell.fieldId;
                    const isFormula = fieldType === "calculated" || fieldType === "rag";
                    return (
                      <>
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">=</span>
                        {isFormula ? (
                          <span className="italic text-muted-foreground">
                            {fieldType === "calculated" ? "Formula (calculated)" : "RAG"}
                          </span>
                        ) : (
                          <span className="truncate max-w-md" title={formatFieldValue(field || {}, value)}>
                            {formatFieldValue(field || {}, value)}
                          </span>
                        )}
                        {fieldType === "calculated" && canUpdateTracker && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs ml-2 shrink-0"
                            onClick={(e) => { e.stopPropagation(); openEditFormulaDialog(field, selectedCell.fieldId); }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit formula
                          </Button>
                        )}
                      </>
                    );
                  })()}
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0 hidden sm:inline">Enter to open · Esc to clear</span>
                </div>
              )}
                        <div className="rounded-none border overflow-x-auto overflow-y-auto max-h-[70vh] w-full min-w-0">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                    <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                      <TableHead className="sticky left-0 z-20 bg-muted/80 backdrop-blur border-r font-semibold min-w-[72px]">#</TableHead>
                      <TableHead className="sticky left-[72px] z-20 bg-muted/80 backdrop-blur border-r font-semibold min-w-[100px]">Status</TableHead>
                                {/* Dynamic field columns (only visible) */}
                                {visibleFields.map((field) => {
                                  const fieldId = field.id || field.field_id || field.name;
                                  const fieldType = field.type || field.field_type;
                                  const isSortable = isFieldSortable(field);
                                  const isFilterable = isFieldFilterable(field);
                                  const currentSort = columnSorting[fieldId];
                                  const rawFilter = columnFilters[fieldId];
                                  const currentFilter =
                                    rawFilter && typeof rawFilter === "object" && "value" in rawFilter
                                      ? rawFilter.value
                                      : rawFilter || "all";
                                  const uniqueValues = isFilterable ? getFieldUniqueValues(field, entries) : [];

                                  return (
                                    <TableHead key={fieldId} className="relative">
                                      <div className="flex flex-col gap-1">
                                        {/* Header with sort button */}
                                        <div className="flex items-center gap-2">
                                          {isSortable ? (
                                            <button
                                              onClick={() => handleColumnSort(field)}
                                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                                            >
                                              <span>{field.label || field.field_label || field.name}</span>
                                              {currentSort === 'asc' ? (
                                                <ArrowUp className="h-3 w-3" />
                                              ) : currentSort === 'desc' ? (
                                                <ArrowDown className="h-3 w-3" />
                                              ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                                              )}
                                            </button>
                                          ) : (
                                            <span>{field.label || field.field_label || field.name}</span>
                                          )}
                                        </div>
                                        {/* Filter dropdown for select fields */}
                                        {isFilterable && uniqueValues.length > 0 && (
                                          <Select
                                            value={currentFilter}
                                            onValueChange={(value) => handleColumnFilter(field, value)}
                                          >
                                            <SelectTrigger className="h-7 text-xs">
                                              <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="all">All</SelectItem>
                                              {uniqueValues.map((value) => {
                                                // Try to find the label from field options
                                                const option = field.options?.find(
                                                  (opt) => String(opt.value) === String(value) || String(opt.label) === String(value)
                                                );
                                                const displayValue = option?.label || value;
                                                return (
                                                  <SelectItem key={value} value={value}>
                                                    {displayValue}
                                                  </SelectItem>
                                                );
                                              })}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                    </TableHead>
                                  );
                                })}
                                {showMetadataColumns && (
                                  <>
                                    <TableHead>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Last Updated
                                      </div>
                                    </TableHead>
                                    <TableHead>
                                      <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        Updated By
                                      </div>
                                    </TableHead>
                                  </>
                                )}
                      {tracker?.tracker_config?.use_stages !== false && (tracker?.tracker_config?.stage_mapping?.length > 0 || tracker?.tracker_config?.is_patient_referral) && (
                        <TableHead className="font-semibold min-w-[140px]">Stage</TableHead>
                      )}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                            {entries.map((entry, index) => {
                              const submissionData = entry.submission_data || entry.formatted_data || {};
                              
                              // Use persistent tracker entry number from backend
                              // This is calculated based on creation order within the tracker
                              const entryNumber = entry.tracker_entry_number || entry.id;
                              
                              // Only extract values for configured display fields to optimize performance
                              const displayValues = {};
                              trackerDisplayableFields.forEach((field) => {
                                const fieldId = field.id || field.field_id || field.name;
                                displayValues[fieldId] = submissionData[fieldId];
                              });
                              
                      return (
                        <TableRow 
                          key={entry.id}
                          className={cn(
                            "cursor-pointer transition-colors border-b",
                            index % 2 === 0 ? "bg-background hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/50"
                          )}
                          onClick={() => router.push(`/admin/trackers/entries/${entry.slug || entry.id}`)}
                        >
                          <TableCell
                            className={cn(
                              "font-medium sticky left-0 z-[5] border-r",
                              densityClass,
                              index % 2 === 0 ? "bg-background hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/50"
                            )}
                            onClick={(e) => { e.stopPropagation(); setSelectedCell({ rowIndex: index, fieldId: "_entry#" }); }}
                          >
                            <Link
                              href={`/admin/trackers/entries/${entry.slug || entry.id}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                                      #{entryNumber}
                            </Link>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "sticky left-[72px] z-[5] border-r",
                              densityClass,
                              index % 2 === 0 ? "bg-background hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/50"
                            )}
                            onClick={(e) => { e.stopPropagation(); setSelectedCell({ rowIndex: index, fieldId: "_status" }); }}
                          >
                            {canUpdateEntry && availableStatuses.length > 0 ? (
                              <Select
                                value={entry.status || ""}
                                onValueChange={(newStatus) => {
                                  if (newStatus && newStatus !== (entry.status || "")) {
                                    handleStatusChange(entry, newStatus, undefined, entry.formatted_data?.derived_stage);
                                  }
                                }}
                                disabled={updateEntryMutation.isPending}
                              >
                                <SelectTrigger
                                  className="h-8 min-w-[120px] font-normal"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent onClick={(e) => e.stopPropagation()}>
                                  {availableStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {humanizeStatusForDisplay(status)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline" className="font-normal">{humanizeStatusForDisplay(entry.status || "open")}</Badge>
                            )}
                          </TableCell>
                                  {/* Dynamic field values - only visible columns */}
                                  {visibleFields.map((field) => {
                                    const fieldId = field.id || field.field_id || field.name;
                                    const value = displayValues[fieldId];
                                    const isSelected = selectedCell?.rowIndex === index && selectedCell?.fieldId === fieldId;
                                    const highlight = cellMatchesHighlightRule(fieldId, value, highlightRules, displayValues);
                                    const isChaseDue = fieldId === "chase_due";
                                    const isOverdue =
                                      isChaseDue &&
                                      tracker?.tracker_config?.is_patient_referral &&
                                      value != null &&
                                      String(value).trim() !== "" &&
                                      !String(entry.status || "").startsWith("Closed") &&
                                      (() => {
                                        try {
                                          const d = new Date(String(value).split("T")[0]);
                                          return !Number.isNaN(d.getTime()) && d < startOfDay(new Date());
                                        } catch {
                                          return false;
                                        }
                                      })();
                                    return (
                                      <TableCell
                                        key={fieldId}
                                        className={cn(
                                          "border-r min-w-[120px] max-w-[220px] tabular-nums",
                                          densityClass,
                                          isSelected && "ring-1 ring-primary bg-primary/5",
                                          highlight.match && (HIGHLIGHT_COLOR_CLASSES[highlight.color] || HIGHLIGHT_COLOR_CLASSES.green),
                                          isOverdue && "bg-red-100 dark:bg-red-900/30"
                                        )}
                                        onClick={(e) => { e.stopPropagation(); setSelectedCell({ rowIndex: index, fieldId }); }}
                                      >
                                        <div className="max-w-[200px] truncate flex items-center gap-1" title={formatFieldValue(field, value)}>
                                          {formatFieldValue(field, value)}
                                          {isOverdue && (
                                            <Badge variant="destructive" className="text-[10px] px-1 py-0 shrink-0">
                                              Overdue
                                            </Badge>
                                          )}
                                        </div>
                          </TableCell>
                                    );
                                  })}
                                  {showMetadataColumns && (
                                    <>
                          <TableCell className={cn("text-muted-foreground", densityClass)}>
                            {entry.updated_at
                              ? format(parseUTCDate(entry.updated_at), "MMM d, yyyy HH:mm")
                                          : entry.created_at
                                          ? format(parseUTCDate(entry.created_at), "MMM d, yyyy HH:mm")
                              : "—"}
                          </TableCell>
                                      <TableCell className={cn("text-muted-foreground", densityClass)}>
                                        {getUserName(entry.updated_by_user_id || entry.submitted_by_user_id) || "—"}
                                      </TableCell>
                                    </>
                                  )}
                          {(tracker?.tracker_config?.use_stages !== false && (tracker?.tracker_config?.stage_mapping?.length > 0 || tracker?.tracker_config?.is_patient_referral)) && (
                            <TableCell
                              className={cn(
                                "border-r min-w-[140px]",
                                densityClass,
                                index % 2 === 0 ? "bg-background hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/50"
                              )}
                              onClick={(e) => { e.stopPropagation(); setSelectedCell({ rowIndex: index, fieldId: "_derived_stage" }); }}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                {(() => {
                                  const stageMapping = (selectedTracker === tracker.id.toString() && selectedTrackerDetail?.tracker_config?.stage_mapping)
                                    ? selectedTrackerDetail.tracker_config.stage_mapping
                                    : (tracker?.tracker_config?.stage_mapping ?? []);
                                  const stageColor = getStageColor(stageMapping, entry?.formatted_data?.derived_stage ?? "");
                                  return (
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1" style={stageColor ? { borderLeft: `3px solid ${stageColor}`, paddingLeft: 6 } : undefined}>
                                {canUpdateEntry && tracker?.tracker_config?.stage_mapping?.length > 0 ? (
                                  <>
                                    <Select
                                      key={`stage-${entry.id}-${entry.formatted_data?.derived_stage ?? ""}`}
                                      value={entry.formatted_data?.derived_stage ?? ""}
                                      onValueChange={(stageName) => {
                                        const isSelected = selectedTracker === tracker.id.toString();
                                        const mapping = (isSelected && selectedTrackerDetail?.tracker_config?.stage_mapping)
                                          ? selectedTrackerDetail.tracker_config.stage_mapping
                                          : (tracker?.tracker_config?.stage_mapping ?? []);
                                        if (stageName && mapping.length > 0) {
                                          handleStageChange(entry, stageName, mapping);
                                        }
                                      }}
                                      disabled={updateEntryMutation.isPending}
                                    >
                                      <SelectTrigger
                                        className="h-8 min-w-[100px] font-normal text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                      >
                                        <SelectValue placeholder="Stage" />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                        {(tracker.tracker_config.stage_mapping || []).map((item) => {
                                          const stageName = item?.stage ?? item?.name ?? "";
                                          if (!stageName) return null;
                                          return (
                                            <SelectItem key={stageName} value={stageName}>
                                              {stageName}
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                    {(() => {
                                      const isSelected = selectedTracker === tracker.id.toString();
                                      const stageMapping = (isSelected && selectedTrackerDetail?.tracker_config?.stage_mapping)
                                        ? selectedTrackerDetail.tracker_config.stage_mapping
                                        : (tracker?.tracker_config?.stage_mapping || []);
                                      const currentStage = entry?.formatted_data?.derived_stage ?? "";
                                      const idx = stageMapping.findIndex((s) => (s?.stage ?? s?.name) === currentStage);
                                      const hasNext = idx >= 0 && idx < stageMapping.length - 1;
                                      if (!hasNext) return null;
                                      return (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 shrink-0"
                                          title="Next stage"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleNextStage(entry, stageMapping);
                                          }}
                                          disabled={updateEntryMutation.isPending}
                                        >
                                          <ChevronRight className="h-4 w-4" />
                                        </Button>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  <span>{entry.formatted_data?.derived_stage ?? "—"}</span>
                                )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </TableCell>
                          )}
                          <TableCell onClick={(e) => e.stopPropagation()} className="bg-muted/30">
                            <div className="flex items-center gap-2">
                                        {canReadEntries && (
                              <Link href={`/admin/trackers/entries/${entry.slug || entry.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                                        )}
                                        {canDeleteEntry && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.slug || entry.id)}
                                disabled={deleteEntryMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                                        )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals row: backend aggregates (all entries) when available, else client-side (loaded only) */}
                    {Object.keys(effectiveAggregates).length > 0 && (
                      <TableRow className="border-t-2 border-border bg-muted font-medium hover:bg-muted">
                        <TableCell
                          className="sticky left-0 z-[5] bg-muted border-r text-muted-foreground text-xs uppercase tracking-wide"
                          title={
                            hasBackendAggregates
                              ? backendAggregatesData.truncated
                                ? `Totals over first ${(backendAggregatesData.entries_used ?? 0).toLocaleString()} of ${(backendAggregatesData.total_entries ?? 0).toLocaleString()} entries (capped for performance).`
                                : `Totals over all ${(backendAggregatesData.total_entries ?? 0).toLocaleString()} matching entries.`
                              : hasNextPage
                                ? `Totals over loaded rows only. Scroll to load more or use backend totals (all entries).`
                                : undefined
                          }
                        >
                          {totalsLabel}
                        </TableCell>
                        <TableCell className="sticky left-[72px] z-[5] bg-muted border-r" />
                        {visibleFields.map((field) => {
                          const fieldId = field.id || field.field_id || field.name;
                          const agg = effectiveAggregates[fieldId];
                          if (!agg) {
                            return <TableCell key={fieldId} className="border-r bg-muted" />;
                          }
                          const display =
                            agg.value != null
                              ? agg.type === "avg"
                                ? Number(agg.value).toFixed(2)
                                : agg.type === "count"
                                  ? agg.value
                                  : Number(agg.value).toLocaleString(undefined, { maximumFractionDigits: 2 })
                              : "—";
                          return (
                            <TableCell key={fieldId} className="border-r tabular-nums text-sm">
                              <span className="text-muted-foreground text-xs uppercase mr-1">{agg.type}:</span>
                              {display}
                            </TableCell>
                          );
                        })}
                        {showMetadataColumns && (
                          <>
                            <TableCell className="bg-muted" />
                            <TableCell className="bg-muted" />
                          </>
                        )}
                        {(tracker?.tracker_config?.use_stages !== false && (tracker?.tracker_config?.stage_mapping?.length > 0 || tracker?.tracker_config?.is_patient_referral)) && (
                          <TableCell className="bg-muted border-r" />
                        )}
                        <TableCell className="bg-muted" />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Infinite scroll: loaded count + sentinel + load more */}
              <div className="mt-0 pt-2 flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {entries.length} of {pagination.total.toLocaleString()} entries
                  {hasNextPage && " — scroll down to load more"}
                </p>
                {hasNextPage && (
                  <p className="text-xs text-muted-foreground">
                    {backendAggregatesData?.aggregates && Object.keys(backendAggregatesData.aggregates).length > 0
                      ? "Totals row uses all matching entries (backend). Export CSV uses loaded rows only—scroll to load more, then export."
                      : "Totals row and Export CSV use loaded rows only. Scroll to the bottom to load all entries, then export or view full totals."}
                  </p>
                )}
                <div
                  ref={selectedTracker === tracker.id.toString() ? loadMoreRef : undefined}
                  className="h-4 w-full min-h-[1rem]"
                  aria-hidden="true"
                />
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more…
                  </div>
                )}
                {hasNextPage && !isFetchingNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    className="mt-1"
                  >
                    Load more
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
              </TabsContent>
            );
          })}
      </Tabs>
    </div>
  );
};

export default function TrackersPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <TrackersPage />
    </Suspense>
  );
}

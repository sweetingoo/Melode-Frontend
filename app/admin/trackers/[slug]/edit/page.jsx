"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Save,
  GripVertical,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Link2,
} from "lucide-react";
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
  useTracker,
  useUpdateTracker,
  useTrackerAuditLogs,
} from "@/hooks/useTrackers";
import { useActiveTrackerCategories } from "@/hooks/useTrackerCategories";
import { useRoles, useRolesAll } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { generateSlug, humanizeStatusForDisplay } from "@/utils/slug";
import { STAGE_COLOR_PALETTE } from "@/utils/stageColors";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & Time" },
  { value: "boolean", label: "Boolean/Checkbox" },
  { value: "select", label: "Select (Dropdown)" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "people", label: "People (User Selection)" },
  { value: "file", label: "File Upload" },
  { value: "json", label: "JSON" },
  { value: "signature", label: "Signature" },
  { value: "rag", label: "RAG (Red / Amber / Green)" },
  { value: "calculated", label: "Calculated (Sum / Percentage)" },
  { value: "repeatable_group", label: "Repeatable group (linked rows)" },
  // Display-only (no page_break – Trackers use Stages for flow)
  { value: "text_block", label: "Text Block (Display Only)" },
  { value: "image_block", label: "Image Block (Display Only)" },
  { value: "youtube_video_embed", label: "YouTube Video Embed (Display Only)" },
  { value: "line_break", label: "Line Break (Display Only)" },
  { value: "download_link", label: "Download Link (Display Only)" },
];

// No fixed default stages – each tracker/service defines its own. Used when tracker has no stage_mapping set.
const DEFAULT_STAGE_MAPPING = [];

// Helper function to generate field ID from label
const generateFieldIdFromLabel = (label) => {
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

// Generate unique ID from label with random suffix (for sections)
const generateUniqueId = (label) => {
  if (!label) return "";
  const baseId = generateFieldIdFromLabel(label);
  if (!baseId) return "";
  // Add timestamp and random string to ensure uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseId}-${timestamp}-${random}`;
};

const COLUMNS = ["left", "center", "right"];
const columnLabels = { left: "Left", center: "Center (full width)", right: "Right" };

function OneRowEditor({ row, rowIndex, sectionFields, allIdsInAnyGroup, onUpdateRow, onRemoveRow, canRemoveRow }) {
  const grid = row || { left: [], center: [], right: [] };
  const hasLeftOrRight = ((grid.left || []).length + (grid.right || []).length) > 0;
  const hasCenter = (grid.center || []).length > 0;
  const centerDisabled = hasLeftOrRight;
  const leftRightDisabled = hasCenter;
  const isColDisabled = (col) => (col === "center" && centerDisabled) || (col !== "center" && leftRightDisabled);

  const availableToAdd = sectionFields
    .map((f) => f.id || f.name || f.field_id)
    .filter(Boolean)
    .filter((id) => !allIdsInAnyGroup.includes(id));

  const updateRow = (newGrid) => {
    onUpdateRow(rowIndex, newGrid);
  };

  const moveField = (fieldId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    if (isColDisabled(toCol)) return;
    const left = [...(grid.left || [])];
    const center = [...(grid.center || [])];
    const right = [...(grid.right || [])];
    [left, center, right].forEach((arr, i) => {
      if (COLUMNS[i] === fromCol) {
        const idx = arr.indexOf(fieldId);
        if (idx !== -1) arr.splice(idx, 1);
      }
    });
    const addTo = (arr) => { if (!arr.includes(fieldId)) arr.push(fieldId); };
    if (toCol === "left") addTo(left);
    else if (toCol === "center") addTo(center);
    else addTo(right);
    updateRow({ left, center, right });
  };

  const removeFromColumn = (fieldId, col) => {
    const nextGrid = { ...grid };
    nextGrid[col] = (nextGrid[col] || []).filter((id) => id !== fieldId);
    updateRow(nextGrid);
  };

  const addToColumn = (fieldId, col) => {
    if (isColDisabled(col)) return;
    const nextGrid = { ...grid };
    nextGrid[col] = [...(nextGrid[col] || []), fieldId];
    updateRow(nextGrid);
  };

  const onDragStart = (e, fieldId, col) => {
    e.dataTransfer.setData("fieldId", fieldId);
    e.dataTransfer.setData("fromColumn", col);
    e.dataTransfer.setData("fromRowIndex", String(rowIndex));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, col) => {
    e.preventDefault();
    if (isColDisabled(col)) e.dataTransfer.dropEffect = "none";
    else e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e, toCol) => {
    e.preventDefault();
    if (isColDisabled(toCol)) return;
    const fieldId = e.dataTransfer.getData("fieldId");
    const fromCol = e.dataTransfer.getData("fromColumn");
    const fromRowIdx = e.dataTransfer.getData("fromRowIndex");
    if (fieldId && fromCol && String(fromRowIdx) === String(rowIndex)) moveField(fieldId, fromCol, toCol);
  };

  return (
    <div className="relative p-3 rounded border border-border bg-muted/20 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Row {rowIndex + 1}</span>
        {canRemoveRow && (
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => onRemoveRow(rowIndex)}>
            <Trash2 className="h-3 w-3 mr-1" /> Remove row
          </Button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map((col) => {
          const disabled = isColDisabled(col);
          return (
            <div
              key={col}
              onDragOver={(e) => onDragOver(e, col)}
              onDrop={(e) => onDrop(e, col)}
              className={`min-h-[72px] rounded border border-dashed p-2 flex flex-col ${disabled ? "border-muted-foreground/20 bg-muted/10 opacity-80" : "border-muted-foreground/40"}`}
            >
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {columnLabels[col]}
                {disabled && <span className="block text-muted-foreground/70 font-normal">({col === "center" ? "use left/right" : "use center"} in this row)</span>}
              </div>
              <div className="flex flex-wrap gap-1 flex-1">
                {(grid[col] || []).map((fid) => {
                  const f = sectionFields.find((x) => (x.id || x.name || x.field_id) === fid);
                  return (
                    <Badge key={fid} variant="secondary" className="text-xs cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => onDragStart(e, fid, col)}>
                      {f?.label || f?.name || fid}
                      <button type="button" className="ml-1 hover:text-destructive" onClick={() => removeFromColumn(fid, col)}><X className="h-3 w-3" /></button>
                    </Badge>
                  );
                })}
              </div>
              {!disabled && availableToAdd.length > 0 && (
                <Select value="__add__" onValueChange={(val) => { if (val && val !== "__add__") addToColumn(val, col); }}>
                  <SelectTrigger className="h-7 text-xs mt-1"><SelectValue placeholder="+ Add field" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__add__">+ Add field</SelectItem>
                    {availableToAdd.map((id) => {
                      const f = sectionFields.find((x) => (x.id || x.name || x.field_id) === id);
                      return <SelectItem key={id} value={id}>{f?.label || f?.name || id}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GridColumnsEditor({ group, groupIdx, sectionFields, editingSection, setEditingSection }) {
  const gridRows = group.grid_rows && group.grid_rows.length > 0
    ? group.grid_rows
    : (group.grid_columns ? [{ ...group.grid_columns }] : [{ left: [], center: [], right: [] }]);
  const allIdsInGroup = gridRows.flatMap((r) => [...(r.left || []), ...(r.center || []), ...(r.right || [])]);
  const allIdsInAnyGroup = (editingSection.groups || []).flatMap((g) => g.fields || []);

  React.useEffect(() => {
    if ((group.layout || "") !== "grid") return;
    if (gridRows.length > 0 && allIdsInGroup.length > 0) return;
    const fromFields = group.fields || [];
    if (fromFields.length === 0) return;
    const next = [...(editingSection.groups || [])];
    next[groupIdx] = { ...group, grid_rows: [{ left: [...fromFields], center: [], right: [] }], fields: [...fromFields] };
    setEditingSection((prev) => ({ ...prev, groups: next }));
  }, []);

  const updateRows = (newRows) => {
    const flat = newRows.flatMap((r) => [...(r.left || []), ...(r.center || []), ...(r.right || [])]);
    const next = [...(editingSection.groups || [])];
    next[groupIdx] = { ...group, grid_rows: newRows, fields: flat };
    setEditingSection((prev) => ({ ...prev, groups: next }));
  };

  const updateRowAt = (rowIndex, newGrid) => {
    const newRows = gridRows.map((r, i) => (i === rowIndex ? newGrid : r));
    updateRows(newRows);
  };

  const addRow = () => {
    updateRows([...gridRows, { left: [], center: [], right: [] }]);
  };

  const removeRow = (rowIndex) => {
    updateRows(gridRows.filter((_, i) => i !== rowIndex));
  };

  return (
    <div className="space-y-3 mt-2">
      {gridRows.map((row, rowIndex) => (
        <OneRowEditor
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          sectionFields={sectionFields}
          allIdsInAnyGroup={allIdsInAnyGroup}
          onUpdateRow={updateRowAt}
          onRemoveRow={removeRow}
          canRemoveRow={gridRows.length > 1}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add row
      </Button>
    </div>
  );
}

const TrackerEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const tabFromUrl = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState("basic");
  useEffect(() => {
    if (tabFromUrl && ["sections", "fields", "stages", "basic", "statuses", "permissions", "notifications", "audit"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const { data: tracker, isLoading: trackerLoading } = useTracker(slug);
  const updateMutation = useUpdateTracker();
  const { data: rolesData } = useRoles();
  const { data: rolesAllData } = useRolesAll(100);
  const { data: usersResponse } = useUsers();
  const { data: trackerCategories = [] } = useActiveTrackerCategories();
  const { hasPermission } = usePermissionsCheck();
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsActionFilter, setAuditLogsActionFilter] = useState("all");
  const auditLogsPerPage = 20;
  const { data: auditLogsResponse, isLoading: auditLogsLoading } = useTrackerAuditLogs(
    slug,
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

  const roles = rolesData || [];
  const rolesForPermissions = useMemo(
    () => (Array.isArray(rolesAllData) ? rolesAllData : rolesAllData?.data) ?? roles,
    [rolesAllData, roles]
  );
  const users = usersResponse?.users || usersResponse || [];

  // Group roles for Permissions tab: job roles as parents, shift roles as children; standalone roles (no children) on their own
  const { standaloneRoles, jobRoleGroups } = useMemo(() => {
    const all = Array.isArray(rolesForPermissions) ? rolesForPermissions : [];
    const jobRolesWithShifts = all.filter(
      (r) =>
        (r.role_type || r.roleType) === "job_role" &&
        ((r.shift_roles || r.shiftRoles || []).length > 0)
    );
    const standalone = all.filter((r) => {
      const rt = r.role_type || r.roleType;
      if (rt === "shift_role") return false;
      if (rt === "job_role" && ((r.shift_roles || r.shiftRoles || []).length > 0)) return false;
      return true;
    });
    return { standaloneRoles: standalone, jobRoleGroups: jobRolesWithShifts };
  }, [rolesForPermissions]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    category: "",
    is_active: true,
    tracker_config: {
      default_status: "open",
      statuses: ["open", "in_progress", "pending", "resolved", "closed"],
      allow_inline_status_edit: true,
      sections: [],
      list_view_fields: [],
      note_categories: [],
      constants: {},
      table_aggregates: {},
    },
    tracker_fields: {
      fields: [],
    },
    access_config: {
      allowed_roles: [],
      allowed_users: [],
      view_permissions: [],
      edit_permissions: [],
      create_permissions: [],
    },
  });

  const jobRoleCheckboxRefs = useRef({});
  useEffect(() => {
    jobRoleGroups.forEach((jobRole) => {
      const el = jobRoleCheckboxRefs.current[jobRole.id];
      if (!el) return;
      const shiftRoles = jobRole.shift_roles || jobRole.shiftRoles || [];
      const allNames = [jobRole.name, ...shiftRoles.map((s) => s.name)];
      const allowed = formData.access_config?.allowed_roles || [];
      const selectedCount = allNames.filter((n) => allowed.includes(n)).length;
      el.indeterminate = selectedCount > 0 && selectedCount < allNames.length;
    });
  }, [jobRoleGroups, formData.access_config?.allowed_roles]);

  const [newField, setNewField] = useState({
    id: "",
    name: "",
    type: "text",
    label: "",
    required: false,
    section: "",
    options: [],
    fields: [],
  });

  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);

  // Drag and drop state for field reordering
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Section editing state
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  // Drag and drop state for section reordering
  const [draggedSectionIndex, setDraggedSectionIndex] = useState(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState(null);

  const [newSection, setNewSection] = useState({
    id: "",
    label: "",
  });
  const [sectionIdManuallyEdited, setSectionIdManuallyEdited] = useState(false);
  const [fieldIdManuallyEdited, setFieldIdManuallyEdited] = useState(false);

  const [newStatus, setNewStatus] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("");
  const [newOption, setNewOption] = useState({ value: "", label: "" });
  const [editingOption, setEditingOption] = useState({ value: "", label: "" });
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  // Load tracker data
  useEffect(() => {
    if (tracker) {
      console.log("Tracker data loaded:", tracker);
      setFormData({
        name: tracker.name || "",
        description: tracker.description || "",
        slug: tracker.slug || "",
        category: tracker.category || "",
        is_active: tracker.is_active !== undefined ? tracker.is_active : true,
        tracker_config: {
            ...(tracker.tracker_config || {
              default_status: "open",
              statuses: ["open", "in_progress", "pending", "resolved", "closed"],
              allow_inline_status_edit: true,
              sections: [],
              constants: {},
            }),
            use_stages: tracker.tracker_config?.use_stages ?? (!!(tracker.tracker_config?.stage_mapping?.length || tracker.tracker_config?.is_patient_referral)),
            list_view_fields: tracker.tracker_config?.list_view_fields || [],
            create_view_fields: tracker.tracker_config?.create_view_fields || [],
            note_categories: tracker.tracker_config?.note_categories || [],
            constants: tracker.tracker_config?.constants || {},
            table_aggregates: tracker.tracker_config?.table_aggregates || {},
            stage_mapping: (tracker.tracker_config?.stage_mapping && Array.isArray(tracker.tracker_config.stage_mapping))
              ? JSON.parse(JSON.stringify(tracker.tracker_config.stage_mapping))
              : [...DEFAULT_STAGE_MAPPING],
            notification_settings: {
              notify_on_new_entry: tracker.tracker_config?.notification_settings?.notify_on_new_entry ?? true,
              notify_on_status_change: tracker.tracker_config?.notification_settings?.notify_on_status_change ?? true,
              send_email: tracker.tracker_config?.notification_settings?.send_email ?? true,
              send_push: tracker.tracker_config?.notification_settings?.send_push ?? true,
              send_sms: tracker.tracker_config?.notification_settings?.send_sms ?? false,
            },
          },
        tracker_fields: tracker.tracker_fields || {
          fields: [],
        },
        access_config: tracker.access_config || {
          allowed_roles: [],
          allowed_users: [],
          view_permissions: [],
          edit_permissions: [],
          create_permissions: [],
        },
      });
    }
  }, [tracker]);

  const handleSave = async (shouldRedirect = true) => {
    try {
      const defaultStatuses = formData.tracker_config?.statuses || [];
      const stageMapping = formData.tracker_config?.stage_mapping || [];
      const stagesWithNoStatuses = stageMapping.filter((item) => !(item.statuses || []).length);
      if (stagesWithNoStatuses.length > 0 && defaultStatuses.length === 0) {
        const names = stagesWithNoStatuses.map((s) => s.stage || s.name || "Unnamed").join(", ");
        toast.warning("Some stages have no statuses and tracker has no default", {
          description: `"${names}" will use the default list. Add statuses in the Statuses tab so these stages can be used.`,
        });
      }

      await updateMutation.mutateAsync({
        slug: slug,
        trackerData: formData,
      });
      toast.success("Tracker updated successfully");
      if (shouldRedirect) {
        router.push("/admin/trackers/manage");
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Field Management
  const handleAddField = () => {
    if (!newField.label) {
      toast.error("Field label is required");
      return;
    }

    const fieldId = newField.id || generateFieldIdFromLabel(newField.label);
    if (!fieldId) {
      toast.error("Could not generate field ID from label");
      return;
    }

    // For select/multiselect, require options
    if ((newField.type === "select" || newField.type === "multiselect") && newField.options.length === 0) {
      toast.error(`${newField.type === "select" ? "Select" : "Multi-select"} fields require at least one option`);
      return;
    }

    // Repeatable group: suggest adding at least one child field
    if (newField.type === "repeatable_group" && (!newField.fields || newField.fields.length === 0)) {
      toast.warning("Add at least one child field so each row has columns. You can edit this field later to add more.");
    }

    const field = {
      id: fieldId,
      name: fieldId,
      type: newField.type,
      label: newField.label,
      required: newField.required || false,
      section: newField.section || null,
      ...(newField.options.length > 0 && { options: newField.options }),
      ...(newField.type === "repeatable_group" && { fields: newField.fields || [] }),
    };

    setFormData((prev) => ({
      ...prev,
      tracker_fields: {
        ...prev.tracker_fields,
        fields: [...(prev.tracker_fields?.fields || []), field],
      },
    }));

    // Reset new field form
    setNewField({
      id: "",
      name: "",
      type: "text",
      label: "",
      required: false,
      section: "",
      options: [],
      fields: [],
    });
    setNewOption({ value: "", label: "" });
    setFieldIdManuallyEdited(false);
    toast.success("Field added successfully");
  };

  const handleRemoveField = (index) => {
    const newFields = [...(formData.tracker_fields?.fields || [])];
    newFields.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      tracker_fields: {
        ...prev.tracker_fields,
        fields: newFields,
      },
    }));
    toast.success("Field removed");
  };

  const handleEditField = (index) => {
    const field = formData.tracker_fields?.fields[index];
    if (!field) return;
    
    setEditingFieldIndex(index);
    setEditingField({
      ...field,
      options: field.options || [],
      fields: field.fields || [],
    });
    setEditingOption({ value: "", label: "" });
  };

  const handleCancelEditField = () => {
    setEditingFieldIndex(null);
    setEditingField(null);
    setEditingOption({ value: "", label: "" });
  };

  const handleUpdateField = async () => {
    if (!editingField || editingFieldIndex === null) return;

    if (!editingField.label) {
      toast.error("Field label is required");
      return;
    }

    // For select/multiselect, require options
    if ((editingField.type === "select" || editingField.type === "multiselect") && editingField.options.length === 0) {
      toast.error(`${editingField.type === "select" ? "Select" : "Multi-select"} fields require at least one option`);
      return;
    }

    const newFields = [...(formData.tracker_fields?.fields || [])];
    newFields[editingFieldIndex] = {
      ...editingField,
      options: editingField.options || [],
      fields: editingField.fields || [],
    };

    // Sync section.fields from field.section so backend/template representation stays in sync
    const sectionsSource = formData.tracker_fields?.sections?.length ? formData.tracker_fields.sections : formData.tracker_config?.sections;
    const currentSections = sectionsSource || [];
    const syncedSections = currentSections.map((sec) => ({
      ...sec,
      fields: newFields.filter((f) => (f.section || getSectionIdForField(f, currentSections)) === sec.id).map((f) => f.id || f.name || f.field_id).filter(Boolean),
    }));

    const updatedFormData = {
      ...formData,
      tracker_fields: {
        ...formData.tracker_fields,
        fields: newFields,
        ...(formData.tracker_fields?.sections?.length ? { sections: syncedSections } : {}),
      },
      ...(formData.tracker_config?.sections?.length && !formData.tracker_fields?.sections?.length ? { tracker_config: { ...formData.tracker_config, sections: syncedSections } } : {}),
    };

    setFormData(updatedFormData);

    setEditingFieldIndex(null);
    setEditingField(null);
    setEditingOption({ value: "", label: "" });

    // Save directly to backend
    try {
      await updateMutation.mutateAsync({
        slug: slug,
        trackerData: updatedFormData,
      });
      toast.success("Field updated and saved successfully");
    } catch (error) {
      // Error handled by mutation, but show a message
      toast.error("Failed to save field changes");
    }
  };

  const handleAddEditingOption = () => {
    if (!editingOption.label) {
      toast.error("Option label is required");
      return;
    }

    const optionValue = editingOption.value || generateFieldIdFromLabel(editingOption.label);
    const newOption = {
      value: optionValue,
      label: editingOption.label,
    };

    setEditingField((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption],
    }));

    setEditingOption({ value: "", label: "" });
  };

  const handleRemoveEditingOption = (index) => {
    setEditingField((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // Drag and drop handlers for reordering fields
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFields = [...(formData.tracker_fields?.fields || [])];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    setFormData((prev) => ({
      ...prev,
      tracker_fields: {
        ...prev.tracker_fields,
        fields: newFields,
      },
    }));

    setDraggedIndex(null);
    toast.success("Field order updated");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Section Management – update the same source we display (tracker_fields.sections if it has length, else tracker_config.sections)
  const handleAddSection = () => {
    if (!newSection.label) {
      toast.error("Section label is required");
      return;
    }

    const sectionId = newSection.id || generateFieldIdFromLabel(newSection.label);
    if (!sectionId) {
      toast.error("Could not generate section ID from label");
      return;
    }

    const section = {
      id: sectionId,
      label: newSection.label,
      fields: [],
    };

    setFormData((prev) => {
      const useTrackerFields = (prev.tracker_fields?.sections?.length ?? 0) > 0;
      const currentSections = useTrackerFields ? (prev.tracker_fields?.sections || []) : (prev.tracker_config?.sections || []);
      const newSections = [...currentSections, section];
      return {
        ...prev,
        ...(useTrackerFields
          ? { tracker_fields: { ...prev.tracker_fields, sections: newSections } }
          : { tracker_config: { ...prev.tracker_config, sections: newSections } }),
      };
    });

    setNewSection({ id: "", label: "" });
    setSectionIdManuallyEdited(false);
    toast.success("Section added successfully");
  };

  const handleRemoveSection = (index) => {
    const useTrackerFields = (formData.tracker_fields?.sections?.length ?? 0) > 0;
    const currentSections = useTrackerFields ? (formData.tracker_fields?.sections || []) : (formData.tracker_config?.sections || []);
    const newSections = currentSections.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      ...(useTrackerFields
        ? { tracker_fields: { ...prev.tracker_fields, sections: newSections } }
        : { tracker_config: { ...prev.tracker_config, sections: newSections } }),
    }));
    toast.success("Section removed");
  };

  const handleEditSection = (index) => {
    const sectionsSource = formData.tracker_fields?.sections?.length ? formData.tracker_fields.sections : formData.tracker_config?.sections;
    const section = (sectionsSource || [])[index];
    if (!section) return;

    setEditingSectionIndex(index);
    setEditingSection({
      ...section,
      groups: section.groups && Array.isArray(section.groups) ? [...section.groups] : [],
    });
  };

  const handleCancelEditSection = () => {
    setEditingSectionIndex(null);
    setEditingSection(null);
  };

  const handleUpdateSection = async () => {
    if (!editingSection || editingSectionIndex === null) return;

    if (!editingSection.label) {
      toast.error("Section label is required");
      return;
    }

    const sectionsSource = formData.tracker_fields?.sections?.length ? formData.tracker_fields.sections : formData.tracker_config?.sections;
    const currentSections = [...(sectionsSource || [])];
    currentSections[editingSectionIndex] = { ...editingSection };

    const updatedFormData = {
      ...formData,
      ...(formData.tracker_fields?.sections?.length ? { tracker_fields: { ...formData.tracker_fields, sections: currentSections } } : {}),
      tracker_config: {
        ...formData.tracker_config,
        sections: currentSections,
      },
    };

    setFormData(updatedFormData);

    setEditingSectionIndex(null);
    setEditingSection(null);

    // Save directly to backend
    try {
      await updateMutation.mutateAsync({
        slug: slug,
        trackerData: updatedFormData,
      });
      toast.success("Section updated and saved successfully");
    } catch (error) {
      // Error handled by mutation, but show a message
      toast.error("Failed to save section changes");
    }
  };

  // Drag and drop handlers for reordering sections
  const handleSectionDragStart = (index) => {
    setDraggedSectionIndex(index);
  };

  const handleSectionDragOver = (e, index) => {
    e.preventDefault();
    setDragOverSectionIndex(index);
  };

  const handleSectionDragLeave = () => {
    setDragOverSectionIndex(null);
  };

  const handleSectionDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverSectionIndex(null);

    if (draggedSectionIndex === null || draggedSectionIndex === dropIndex) {
      setDraggedSectionIndex(null);
      return;
    }

    const useTrackerFields = (formData.tracker_fields?.sections?.length ?? 0) > 0;
    const currentSections = useTrackerFields ? (formData.tracker_fields?.sections || []) : (formData.tracker_config?.sections || []);
    const newSections = [...currentSections];
    const [draggedSection] = newSections.splice(draggedSectionIndex, 1);
    newSections.splice(dropIndex, 0, draggedSection);

    setFormData((prev) => ({
      ...prev,
      ...(useTrackerFields
        ? { tracker_fields: { ...prev.tracker_fields, sections: newSections } }
        : { tracker_config: { ...prev.tracker_config, sections: newSections } }),
    }));

    setDraggedSectionIndex(null);
    toast.success("Section order updated");
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
  };

  // Status Management
  const handleAddStatus = () => {
    if (!newStatus.trim()) {
      toast.error("Status name is required");
      return;
    }

    const statuses = formData.tracker_config?.statuses || [];
    if (statuses.includes(newStatus.trim())) {
      toast.error("Status already exists");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        statuses: [...statuses, newStatus.trim()],
      },
    }));

    setNewStatus("");
    toast.success("Status added");
  };

  const handleRemoveStatus = (statusToRemove) => {
    if (statusToRemove === formData.tracker_config?.default_status) {
      toast.error("Cannot remove the default status");
      return;
    }

    const statuses = (formData.tracker_config?.statuses || []).filter(
      (s) => s !== statusToRemove
    );

    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        statuses: statuses,
      },
    }));
    toast.success("Status removed");
  };

  // Note Category Management
  const handleAddNoteCategory = () => {
    if (!newNoteCategory.trim()) {
      toast.error("Note category name is required");
      return;
    }

    const noteCategories = formData.tracker_config?.note_categories || [];
    if (noteCategories.includes(newNoteCategory.trim())) {
      toast.error("Note category already exists");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        note_categories: [...noteCategories, newNoteCategory.trim()],
      },
    }));

    setNewNoteCategory("");
    toast.success("Note category added");
  };

  const handleRemoveNoteCategory = (categoryToRemove) => {
    const noteCategories = (formData.tracker_config?.note_categories || []).filter(
      (c) => c !== categoryToRemove
    );

    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        note_categories: noteCategories,
      },
    }));
    toast.success("Note category removed");
  };

  // Option Management for Select Fields
  const handleAddOption = () => {
    if (!newOption.label) {
      toast.error("Label is required");
      return;
    }

    // Auto-generate value from label if not provided
    const optionValue = newOption.value || generateFieldIdFromLabel(newOption.label);
    if (!optionValue) {
      toast.error("Could not generate option value from label");
      return;
    }

    setNewField((prev) => ({
      ...prev,
      options: [...prev.options, { value: optionValue, label: newOption.label }],
    }));

    setNewOption({ value: "", label: "" });
  };

  const handleRemoveOption = (index) => {
    setNewField((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  if (trackerLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Tracker not found</h3>
        <Link href="/admin/trackers/manage">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
      </div>
    );
  }

  // Sections can live in tracker_fields (from backend/template) or tracker_config (edited in UI). Prefer tracker_fields so template-created trackers show their sections.
  const sections = (formData.tracker_fields?.sections?.length ? formData.tracker_fields.sections : formData.tracker_config?.sections) || [];
  const fields = formData.tracker_fields?.fields || [];
  const statuses = formData.tracker_config?.statuses || [];
  const stageMapping = formData.tracker_config?.stage_mapping || [];

  // Derive section for a field: template uses section.fields (array of ids), UI uses field.section (section id)
  const getSectionIdForField = (field, sectionList) => {
    if (!field || !sectionList?.length) return null;
    if (field.section) return field.section;
    const fid = String(field.id ?? field.name ?? field.field_id ?? "").trim();
    if (!fid) return null;
    const sec = sectionList.find((s) => (s.fields || []).some((id) => String(id).trim() === fid));
    return sec?.id ?? null;
  };

  const handleAddStage = () => {
    setFormData((prev) => {
      const list = prev.tracker_config?.stage_mapping || [];
      const defaultColor = STAGE_COLOR_PALETTE[list.length % STAGE_COLOR_PALETTE.length].value;
      return {
        ...prev,
        tracker_config: {
          ...prev.tracker_config,
          stage_mapping: [...list, { stage: "New Stage", statuses: [], allow_public_submit: false, color: defaultColor, allowed_next_stages: [], allowed_next_statuses: [] }],
        },
      };
    });
  };

  const handleRemoveStage = (index) => {
    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        stage_mapping: (prev.tracker_config?.stage_mapping || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleUpdateStage = (index, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.tracker_config?.stage_mapping || [])];
      if (!list[index]) return prev;
      list[index] = { ...list[index], [field]: value };
      return {
        ...prev,
        tracker_config: { ...prev.tracker_config, stage_mapping: list },
      };
    });
  };

  const handleResetStagesToDefault = () => {
    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        stage_mapping: JSON.parse(JSON.stringify(DEFAULT_STAGE_MAPPING)),
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sticky header at top: title, subtitle, and actions */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-background border-b shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/admin/trackers/manage">
            <Button variant="ghost" size="sm" className="shrink-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Edit Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              Configure fields, sections, statuses, and permissions
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="shrink-0">
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-1 px-1 sm:overflow-x-visible sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-max sm:w-auto">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="fields">Fields ({fields.length})</TabsTrigger>
            <TabsTrigger value="sections">Fields per stage ({sections.length})</TabsTrigger>
            <TabsTrigger value="statuses">Statuses ({statuses.length})</TabsTrigger>
            {formData.tracker_config?.use_stages && (
              <TabsTrigger value="stages">Stages ({stageMapping.length})</TabsTrigger>
            )}
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>
        </div>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., ENT Cases, Incident Tracker"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="ent-cases"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL-friendly identifier
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description of what this tracker is used for"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || "__none__"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No category</SelectItem>
                    {trackerCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.display_name || cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Organize trackers. Manage categories in Admin → Tracker Categories.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use_stages"
                  checked={formData.tracker_config?.use_stages || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tracker_config: {
                        ...prev.tracker_config,
                        use_stages: e.target.checked,
                      },
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="use_stages" className="cursor-pointer">
                  This tracker uses stages (Stage column, queues, SMS, etc.)
                </Label>
              </div>
              <div className="mt-1">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-primary text-sm font-normal"
                  onClick={() => setActiveTab("stages")}
                >
                  Open Stages tab →
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <div>
                <Label htmlFor="default_status">Default Status</Label>
                <Select
                  value={formData.tracker_config?.default_status || "open"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      tracker_config: {
                        ...prev.tracker_config,
                        default_status: value,
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {humanizeStatusForDisplay(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_inline_status_edit"
                  checked={formData.tracker_config?.allow_inline_status_edit || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tracker_config: {
                        ...prev.tracker_config,
                        allow_inline_status_edit: e.target.checked,
                      },
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="allow_inline_status_edit" className="cursor-pointer">
                  Allow inline status editing in list view
                </Label>
              </div>

              {/* Shareable form (public submit link, like Google Forms / Microsoft Forms) */}
              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_public_submit"
                    checked={formData.tracker_config?.allow_public_submit || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tracker_config: {
                          ...prev.tracker_config,
                          allow_public_submit: e.target.checked,
                        },
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="allow_public_submit" className="cursor-pointer font-medium">
                    Allow public form submission (shareable link)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, anyone with the link can submit the form and create an entry in this tracker (no login required). Submissions record who and when; anonymous submissions show &quot;Anonymous&quot;.
                </p>
                {formData.tracker_config?.allow_public_submit && slug && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                      <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <code className="text-sm truncate">
                        {typeof window !== "undefined" ? `${window.location.origin}/forms/${slug}/submit` : `/forms/${slug}/submit`}
                      </code>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const link = typeof window !== "undefined" ? `${window.location.origin}/forms/${slug}/submit` : "";
                        if (!link) return;
                        try {
                          await navigator.clipboard.writeText(link);
                          setShareLinkCopied(true);
                          toast.success("Shareable link copied to clipboard");
                          setTimeout(() => setShareLinkCopied(false), 2000);
                        } catch (err) {
                          toast.error("Failed to copy link");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {shareLinkCopied ? "Copied" : "Copy link"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Tracker Constants (KPI / global values referenced by entries) */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-semibold mb-2 block">
                  Tracker Constants (KPIs / global values)
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Define key-value constants (e.g. target KPI) that all entries can reference. Use the key in calculated fields (e.g. target_volume).
                </p>
                <TrackerConstantsEditor
                  constants={formData.tracker_config?.constants || {}}
                  onChange={(constants) =>
                    setFormData((prev) => ({
                      ...prev,
                      tracker_config: {
                        ...prev.tracker_config,
                        constants,
                      },
                    }))
                  }
                />
              </div>
              
              {/* List View Fields Configuration */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-semibold mb-2 block">
                  List View Fields
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select which fields should be displayed in the entries table. If none selected, the first 4 fields will be shown by default.
                </p>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Add fields first to configure list view columns
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {fields
                      .filter((field) => {
                        const fieldType = field.type || field.field_type;
                        return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
                      })
                      .map((field) => {
                        const fieldId = field.id || field.field_id || field.name;
                        const listViewFields = formData.tracker_config?.list_view_fields || [];
                        const isSelected = listViewFields.includes(fieldId);
                        
                        return (
                          <div
                            key={fieldId}
                            className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              id={`list_view_${fieldId}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const currentFields = formData.tracker_config?.list_view_fields || [];
                                let newFields;
                                
                                if (e.target.checked) {
                                  newFields = [...currentFields, fieldId];
                                } else {
                                  newFields = currentFields.filter((id) => id !== fieldId);
                                }
                                
                                setFormData((prev) => ({
                                  ...prev,
                                  tracker_config: {
                                    ...prev.tracker_config,
                                    list_view_fields: newFields,
                                  },
                                }));
                              }}
                              className="rounded"
                            />
                            <Label
                              htmlFor={`list_view_${fieldId}`}
                              className="cursor-pointer flex-1 flex items-center gap-2"
                            >
                              <span className="font-medium">{field.label || field.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                            </Label>
                            {isSelected && (
                              <Select
                                value={formData.tracker_config?.table_aggregates?.[fieldId] || "none"}
                                onValueChange={(value) => {
                                  const v = value === "none" ? undefined : value;
                                  setFormData((prev) => {
                                    const nextAgg = { ...(prev.tracker_config?.table_aggregates || {}) };
                                    if (v) nextAgg[fieldId] = v;
                                    else delete nextAgg[fieldId];
                                    return {
                                      ...prev,
                                      tracker_config: {
                                        ...prev.tracker_config,
                                        table_aggregates: nextAgg,
                                      },
                                    };
                                  });
                                }}
                              >
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                  <SelectValue placeholder="Total" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No total</SelectItem>
                                  <SelectItem value="sum">Sum</SelectItem>
                                  <SelectItem value="avg">Average</SelectItem>
                                  <SelectItem value="count">Count</SelectItem>
                                  <SelectItem value="min">Min</SelectItem>
                                  <SelectItem value="max">Max</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Create View Fields Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Create View Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Creation Modal Fields
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which fields should be displayed in the creation modal/popup. If none selected, all fields will be shown. Fields not selected here can still be added later when editing the entry.
                </p>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Add fields first to configure creation view
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {fields
                      .filter((field) => {
                        const fieldType = field.type || field.field_type;
                        return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
                      })
                      .map((field) => {
                        const fieldId = field.id || field.field_id || field.name;
                        const createViewFields = formData.tracker_config?.create_view_fields || [];
                        const isSelected = createViewFields.includes(fieldId);
                        
                        return (
                          <div
                            key={fieldId}
                            className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              id={`create_view_${fieldId}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const currentFields = formData.tracker_config?.create_view_fields || [];
                                let newFields;
                                
                                if (e.target.checked) {
                                  newFields = [...currentFields, fieldId];
                                } else {
                                  newFields = currentFields.filter((id) => id !== fieldId);
                                }
                                
                                setFormData((prev) => ({
                                  ...prev,
                                  tracker_config: {
                                    ...prev.tracker_config,
                                    create_view_fields: newFields,
                                  },
                                }));
                              }}
                              className="rounded"
                            />
                            <Label
                              htmlFor={`create_view_${fieldId}`}
                              className="cursor-pointer flex-1 flex items-center gap-2"
                            >
                              <span className="font-medium">{field.label || field.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {(field.required || field.is_required) && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracker Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Fields */}
              {fields.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Fields</Label>
                  {fields.map((field, index) => (
                    editingFieldIndex === index ? (
                      // Edit Field Form
                      <div key={field.id || index} className="p-4 border rounded-md space-y-4 bg-card">
                        <div>
                          <Label htmlFor="edit-field-label">Field Label *</Label>
                          <Input
                            id="edit-field-label"
                            value={editingField.label}
                            onChange={(e) =>
                              setEditingField((prev) => ({
                                ...prev,
                                label: e.target.value,
                              }))
                            }
                            placeholder="e.g., Patient Name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-field-id">Field ID</Label>
                          <Input
                            id="edit-field-id"
                            value={editingField.id || editingField.name}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            placeholder="Auto-generated"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Field ID cannot be changed
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="edit-field-type">Field Type *</Label>
                          <Select
                            value={editingField.type}
                            onValueChange={(value) =>
                              setEditingField((prev) => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-field-section">Stage (Optional)</Label>
                          {formData.tracker_config?.use_stages && stageMapping.length > 0 && (
                            <p className="text-xs text-muted-foreground mb-1">Assigning a field to a stage puts it in that stage's set of fields (see Fields per stage tab).</p>
                          )}
                          <Select
                            value={getSectionIdForField(editingField, sections) || editingField.section || "none"}
                            onValueChange={(value) =>
                              setEditingField((prev) => ({
                                ...prev,
                                section: value === "none" ? "" : value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No stage</SelectItem>
                              {sections.map((section, secIndex) => {
                                const stageName = formData.tracker_config?.use_stages && stageMapping[secIndex] ? (stageMapping[secIndex].stage ?? stageMapping[secIndex].name) : null;
                                const displayLabel = stageName ? `Stage: ${stageName}` : (section.label || section.title || section.id);
                                return (
                                  <SelectItem key={section.id} value={section.id}>
                                    {displayLabel}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-field-required"
                            checked={editingField.required}
                            onChange={(e) =>
                              setEditingField((prev) => ({
                                ...prev,
                                required: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                          <Label htmlFor="edit-field-required" className="cursor-pointer">
                            Required
                          </Label>
                        </div>

                        {/* Conditional visibility */}
                        {!["text_block", "image_block", "line_break", "page_break", "youtube_video_embed", "download_link"].includes((editingField.type || editingField.field_type || "").toLowerCase()) && (
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-sm font-medium">Conditional visibility (optional)</Label>
                            <p className="text-xs text-muted-foreground">Show this field only when another field meets a condition.</p>
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="cond-depends-on" className="text-xs">Show when</Label>
                                <Select
                                  value={editingField.conditional_visibility?.depends_on_field || "__none__"}
                                  onValueChange={(value) =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      conditional_visibility: value && value !== "__none__"
                                        ? { ...(prev.conditional_visibility || {}), depends_on_field: value }
                                        : null,
                                    }))
                                  }
                                >
                                  <SelectTrigger id="cond-depends-on">
                                    <SelectValue placeholder="Select a field..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">None (always show)</SelectItem>
                                    {fields
                                      .filter((f) => (f.id || f.name || f.field_id) !== (editingField.id || editingField.name || editingField.field_id))
                                      .filter((f) => !["text_block", "image_block", "line_break", "page_break", "download_link"].includes((f.type || f.field_type || "").toLowerCase()))
                                      .filter((f) => !!(f.id || f.name || f.field_id))
                                      .map((f) => (
                                        <SelectItem key={f.id || f.name || f.field_id} value={String(f.id || f.name || f.field_id)}>
                                          {f.label || f.field_label || f.name || f.id}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {editingField.conditional_visibility?.depends_on_field && (
                                <>
                                  <div>
                                    <Label htmlFor="cond-show-when" className="text-xs">Condition</Label>
                                    <Select
                                      value={editingField.conditional_visibility?.show_when || ""}
                                      onValueChange={(value) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          conditional_visibility: {
                                            ...(prev.conditional_visibility || {}),
                                            show_when: value || null,
                                          },
                                        }))
                                      }
                                    >
                                      <SelectTrigger id="cond-show-when">
                                        <SelectValue placeholder="Select condition..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="equals">Equals</SelectItem>
                                        <SelectItem value="not_equals">Not equals</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="is_empty">Is empty</SelectItem>
                                        <SelectItem value="is_not_empty">Is not empty</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {editingField.conditional_visibility?.show_when && ["equals", "not_equals", "contains"].includes(editingField.conditional_visibility.show_when) && (
                                    <div>
                                      <Label htmlFor="cond-value" className="text-xs">Value</Label>
                                      <Input
                                        id="cond-value"
                                        value={editingField.conditional_visibility?.value ?? ""}
                                        onChange={(e) =>
                                          setEditingField((prev) => ({
                                            ...prev,
                                            conditional_visibility: {
                                              ...(prev.conditional_visibility || {}),
                                              value: e.target.value || null,
                                            },
                                          }))
                                        }
                                        placeholder="Value to match"
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Configuration for People field */}
                        {editingField.type === "people" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Filter by Roles (Optional)</Label>
                              <p className="text-xs text-muted-foreground">
                                Select which roles to filter users by. Leave empty to show all users.
                              </p>
                              <PeopleFieldRoleSelector
                                selectedRoleIds={editingField.filter_by_roles || []}
                                onChange={(roleIds) => {
                                  setEditingField((prev) => ({
                                    ...prev,
                                    filter_by_roles: roleIds,
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit-filter-by-org"
                                  checked={editingField.filter_by_organization || false}
                                  onCheckedChange={(checked) => {
                                    setEditingField((prev) => ({
                                      ...prev,
                                      filter_by_organization: checked,
                                    }));
                                  }}
                                />
                                <Label htmlFor="edit-filter-by-org" className="cursor-pointer text-sm">
                                  Filter by full organisation
                                </Label>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                When enabled, only shows users from the current organisation
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Options for Select/Multi-select */}
                        {(editingField.type === "select" || editingField.type === "multiselect") && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            <div className="flex flex-wrap gap-2 items-end">
                              <Input
                                placeholder="Label *"
                                value={editingOption.label}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setEditingOption((prev) => ({
                                    ...prev,
                                    label: newLabel,
                                    value: prev.value === "" || prev.value === generateFieldIdFromLabel(prev.label) ? generateFieldIdFromLabel(newLabel) : prev.value,
                                  }));
                                }}
                                className="flex-1 min-w-[120px]"
                              />
                              <Input
                                placeholder="Value (optional)"
                                value={editingOption.value}
                                onChange={(e) => setEditingOption((prev) => ({ ...prev, value: e.target.value }))}
                                className="flex-1 min-w-[120px]"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddEditingOption}
                                disabled={!editingOption.label}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Value is what gets stored; label is what users see. Leave value blank to auto-generate from label.
                            </p>
                            {editingField.options && editingField.options.length > 0 && (
                              <div className="space-y-1">
                                {editingField.options.map((option, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-muted rounded"
                                  >
                                    <span className="text-sm">
                                      <strong>{option.value}</strong>: {option.label}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveEditingOption(idx)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* RAG rules (Red / Amber / Green thresholds) */}
                        {editingField.type === "rag" && (
                          <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <Label className="font-medium">RAG thresholds (numeric)</Label>
                            <p className="text-xs text-muted-foreground">
                              Red = at or below max; Amber = between; Green = at or above min.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Red (max)</Label>
                                <Input
                                  type="number"
                                  value={editingField.rag_rules?.red?.max ?? ""}
                                  onChange={(e) =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        red: { ...(prev.rag_rules?.red || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="40"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Amber (min)</Label>
                                <Input
                                  type="number"
                                  value={editingField.rag_rules?.amber?.min ?? ""}
                                  onChange={(e) =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        amber: { ...(prev.rag_rules?.amber || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="40"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Amber (max)</Label>
                                <Input
                                  type="number"
                                  value={editingField.rag_rules?.amber?.max ?? ""}
                                  onChange={(e) =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        amber: { ...(prev.rag_rules?.amber || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="80"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Green (min)</Label>
                                <Input
                                  type="number"
                                  value={editingField.rag_rules?.green?.min ?? ""}
                                  onChange={(e) =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        green: { ...(prev.rag_rules?.green || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="80"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Source field ID (optional)</Label>
                              <Input
                                value={editingField.source_field_id ?? ""}
                                onChange={(e) => setEditingField((prev) => ({ ...prev, source_field_id: e.target.value || undefined }))}
                                placeholder="field_id to base RAG on (or this field stores value)"
                              />
                            </div>
                          </div>
                        )}

                        {/* Calculated formula */}
                        {editingField.type === "calculated" && (
                          <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <Label className="font-medium">Formula</Label>
                            {(editingField.formula?.field_ids?.length || editingField.formula?.numerator_field_id || editingField.formula?.value_field_id) && (
                              <p className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border">
                                {(editingField.formula?.type || "sum") === "sum"
                                  ? `= SUM(${(editingField.formula?.field_ids || []).join(", ")})`
                                  : editingField.formula?.value_field_id && editingField.formula?.target_constant_key
                                    ? `= (${editingField.formula.value_field_id} / constant:${editingField.formula.target_constant_key}) × 100%`
                                    : `= (${editingField.formula?.numerator_field_id || "?"} / ${editingField.formula?.denominator_field_id || "?"}) × 100%`}
                              </p>
                            )}
                            <Select
                              value={editingField.formula?.type || "sum"}
                              onValueChange={(value) =>
                                setEditingField((prev) => ({
                                  ...prev,
                                  formula: { ...(prev.formula || {}), type: value },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sum">Sum of fields</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                            {(editingField.formula?.type || "sum") === "sum" && (
                              <div>
                                <Label className="text-xs">Field IDs to sum (comma-separated)</Label>
                                <Input
                                  value={(editingField.formula?.field_ids || []).join(", ")}
                                  onChange={(e) =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      formula: {
                                        ...prev.formula,
                                        field_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                      },
                                    }))
                                  }
                                  placeholder="revenue, costs"
                                />
                              </div>
                            )}
                            {(editingField.formula?.type || "percentage") === "percentage" && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Numerator field ID</Label>
                                  <Input
                                    value={editingField.formula?.numerator_field_id ?? ""}
                                    onChange={(e) =>
                                      setEditingField((prev) => ({
                                        ...prev,
                                        formula: { ...prev.formula, numerator_field_id: e.target.value || undefined },
                                      }))
                                    }
                                    placeholder="achieved"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Denominator field ID</Label>
                                  <Input
                                    value={editingField.formula?.denominator_field_id ?? ""}
                                    onChange={(e) =>
                                      setEditingField((prev) => ({
                                        ...prev,
                                        formula: { ...prev.formula, denominator_field_id: e.target.value || undefined },
                                      }))
                                    }
                                    placeholder="target"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs">Or: value field + tracker constant key</Label>
                                  <div className="flex gap-2 mt-1">
                                    <Input
                                      value={editingField.formula?.value_field_id ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          formula: { ...prev.formula, value_field_id: e.target.value || undefined },
                                        }))
                                      }
                                      placeholder="value field ID"
                                    />
                                    <Input
                                      value={editingField.formula?.target_constant_key ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          formula: { ...prev.formula, target_constant_key: e.target.value || undefined },
                                        }))
                                      }
                                      placeholder="constant key (e.g. target_kpi)"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Repeatable group: child fields (ID auto-generated from label) */}
                        {editingField.type === "repeatable_group" && (
                          <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <Label className="font-medium">Child fields (one per column in each row)</Label>
                            {(editingField.fields || []).map((child, childIdx) => (
                              <div key={childIdx} className="flex flex-wrap items-center gap-2 p-2 rounded border bg-background">
                                <Input
                                  className="flex-1 min-w-[100px]"
                                  placeholder="Label"
                                  value={child.label || child.field_label || ""}
                                  onChange={(e) => {
                                    const label = e.target.value;
                                    const id = generateFieldIdFromLabel(label) || `field_${childIdx + 1}`;
                                    setEditingField((prev) => ({
                                      ...prev,
                                      fields: (prev.fields || []).map((c, i) =>
                                        i === childIdx ? { ...c, label, field_label: label, id, name: id } : c
                                      ),
                                    }));
                                  }}
                                />
                                <Select
                                  value={(child.type || child.field_type || "text").toLowerCase()}
                                  onValueChange={(value) =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      fields: (prev.fields || []).map((c, i) => i === childIdx ? { ...c, type: value, field_type: value } : c),
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="select">Select</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  ID: {child.id || child.name || generateFieldIdFromLabel(child.label) || `field_${childIdx + 1}`}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setEditingField((prev) => ({
                                      ...prev,
                                      fields: (prev.fields || []).filter((_, i) => i !== childIdx),
                                    }))
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingField((prev) => {
                                  const n = (prev.fields || []).length + 1;
                                  const label = `New field ${n}`;
                                  const id = generateFieldIdFromLabel(label) || `field_${n}`;
                                  return {
                                    ...prev,
                                    fields: [...(prev.fields || []), { id, name: id, type: "text", label }],
                                  };
                                })
                              }
                            >
                              Add child field
                            </Button>
                          </div>
                        )}

                        {/* Optional RAG display: numeric / date / options by field type */}
                        {editingField.type && editingField.type !== "rag" && !["line_break", "page_break", "text_block", "image_block"].includes(editingField.type) && (() => {
                          const isNumericRag = ["number", "integer", "calculated"].includes(editingField.type);
                          const isDateRag = ["date", "datetime", "date_time"].includes(editingField.type);
                          const isOptionsRag = ["select", "multiselect", "dropdown"].includes(editingField.type);
                          const opts = editingField.options || [];
                          if (!isNumericRag && !isDateRag && !isOptionsRag) return null;
                          const getRagForOption = (optionValue) => {
                            const r = editingField.rag_rules;
                            if (Array.isArray(r?.red) && r.red.includes(optionValue)) return "red";
                            if (Array.isArray(r?.amber) && r.amber.includes(optionValue)) return "amber";
                            if (Array.isArray(r?.green) && r.green.includes(optionValue)) return "green";
                            return "";
                          };
                          const setRagForOption = (optionValue, color) => {
                            setEditingField((prev) => {
                              const r = { ...(prev.rag_rules || {}) };
                              ["red", "amber", "green"].forEach((c) => {
                                r[c] = Array.isArray(r[c]) ? r[c].filter((v) => v !== optionValue) : [];
                              });
                              if (color) r[color] = [...(r[color] || []), optionValue];
                              return { ...prev, rag_rules: r };
                            });
                          };
                          return (
                          <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <Label className="font-medium">RAG display (optional)</Label>
                            {isNumericRag && (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  Red ≤ max, Amber between min–max, Green ≥ min.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <div>
                                    <Label className="text-xs">Red (max)</Label>
                                    <Input
                                      type="number"
                                      value={editingField.rag_rules?.red?.max ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          rag_rules: {
                                            ...prev.rag_rules,
                                            red: { ...(prev.rag_rules?.red || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                          },
                                        }))
                                      }
                                      placeholder="40"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Amber (min)</Label>
                                    <Input
                                      type="number"
                                      value={editingField.rag_rules?.amber?.min ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          rag_rules: {
                                            ...prev.rag_rules,
                                            amber: { ...(prev.rag_rules?.amber || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                          },
                                        }))
                                      }
                                      placeholder="40"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Amber (max)</Label>
                                    <Input
                                      type="number"
                                      value={editingField.rag_rules?.amber?.max ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          rag_rules: {
                                            ...prev.rag_rules,
                                            amber: { ...(prev.rag_rules?.amber || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                          },
                                        }))
                                      }
                                      placeholder="80"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Green (min)</Label>
                                    <Input
                                      type="number"
                                      value={editingField.rag_rules?.green?.min ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          rag_rules: {
                                            ...prev.rag_rules,
                                            green: { ...(prev.rag_rules?.green || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                          },
                                        }))
                                      }
                                      placeholder="80"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            {isDateRag && (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  Red before date, Green after date (e.g. expiry or deadline).
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Red before (date)</Label>
                                    <Input
                                      type="text"
                                      value={editingField.rag_rules?.red?.before ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          rag_rules: {
                                            ...prev.rag_rules,
                                            red: { ...(prev.rag_rules?.red || {}), before: e.target.value || undefined },
                                          },
                                        }))
                                      }
                                      placeholder="2025-01-01"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Green after (date)</Label>
                                    <Input
                                      type="text"
                                      value={editingField.rag_rules?.green?.after ?? ""}
                                      onChange={(e) =>
                                        setEditingField((prev) => ({
                                          ...prev,
                                          rag_rules: {
                                            ...prev.rag_rules,
                                            green: { ...(prev.rag_rules?.green || {}), after: e.target.value || undefined },
                                          },
                                        }))
                                      }
                                      placeholder="2025-06-01"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            {isOptionsRag && (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  {opts.length > 0
                                    ? "Map each option to a RAG colour. Selected value(s) will show that colour."
                                    : "Add options above first, then map each option to Red / Amber / Green below."}
                                </p>
                                {opts.length > 0 ? (
                                  <div className="space-y-2">
                                    {opts.map((opt, idx) => {
                                      const optionValue = opt.value ?? opt.label ?? String(idx);
                                      const ragVal = getRagForOption(optionValue);
                                      return (
                                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-medium min-w-[100px]">{opt.label ?? optionValue}</span>
                                          <Select
                                            value={ragVal || "none"}
                                            onValueChange={(v) => setRagForOption(optionValue, v === "none" ? "" : v)}
                                          >
                                            <SelectTrigger className="w-[120px]">
                                              <SelectValue placeholder="RAG" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">None</SelectItem>
                                              <SelectItem value="red">Red</SelectItem>
                                              <SelectItem value="amber">Amber</SelectItem>
                                              <SelectItem value="green">Green</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">No options yet. Add options in the section above.</p>
                                )}
                              </>
                            )}
                          </div>
                          );
                        })()}

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleUpdateField} 
                            className="flex-1"
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Update Field
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEditField}
                            className="flex-1"
                            disabled={updateMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Field Display
                      <div
                        key={field.id || index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 border rounded-md flex items-center gap-3 ${
                          draggedIndex === index
                            ? "opacity-50 cursor-grabbing"
                            : "cursor-grab hover:bg-muted/50"
                        } ${
                          dragOverIndex === index && draggedIndex !== index
                            ? "border-primary border-2 bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{field.label}</span>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                            <Badge variant="outline">{field.type}</Badge>
                            {(() => {
                              const secId = getSectionIdForField(field, sections) || field.section;
                              if (!secId) return null;
                              const secIndex = sections.findIndex((s) => s.id === secId);
                              const stageName = stageMapping[secIndex] ? (stageMapping[secIndex].stage ?? stageMapping[secIndex].name) : null;
                              return (
                                <Badge variant="secondary" className="text-xs">
                                  Stage: {stageName || sections.find((s) => s.id === secId)?.label || sections.find((s) => s.id === secId)?.title || secId}
                                </Badge>
                              );
                            })()}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {field.id || field.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditField(index)}
                            title="Edit Field"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField(index)}
                            title="Delete Field"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Add New Field */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Field
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 border rounded-md space-y-4 mt-2 bg-card">
                    <div>
                      <Label htmlFor="field-label">Field Label *</Label>
                      <Input
                        id="field-label"
                        value={newField.label}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          const generatedId = generateFieldIdFromLabel(newLabel);
                          setNewField((prev) => ({
                            ...prev,
                            label: newLabel,
                            id: fieldIdManuallyEdited ? prev.id : generatedId,
                            name: fieldIdManuallyEdited ? prev.name : generatedId,
                          }));
                        }}
                        placeholder="e.g., Patient Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="field-id">Field ID</Label>
                      <Input
                        id="field-id"
                        value={newField.id}
                        onChange={(e) => {
                          setFieldIdManuallyEdited(true);
                          setNewField((prev) => ({
                            ...prev,
                            id: e.target.value,
                            name: e.target.value,
                          }));
                        }}
                        placeholder="Auto-generated from label"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-generated from label if not provided
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="field-type">Field Type *</Label>
                      <Select
                        value={newField.type}
                        onValueChange={(value) =>
                          setNewField((prev) => ({
                            ...prev,
                            type: value,
                            ...(value === "repeatable_group" && { fields: Array.isArray(prev.fields) ? prev.fields : [] }),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="field-section">Stage (Optional)</Label>
                      {formData.tracker_config?.use_stages && stageMapping.length > 0 && (
                        <p className="text-xs text-muted-foreground mb-1">Assigning a field to a stage puts it in that stage's set of fields (see Fields per stage tab).</p>
                      )}
                      <Select
                        value={newField.section || "none"}
                        onValueChange={(value) =>
                          setNewField((prev) => ({ ...prev, section: value === "none" ? "" : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No stage</SelectItem>
                          {sections.map((section, secIndex) => {
                            const stageName = formData.tracker_config?.use_stages && stageMapping[secIndex] ? (stageMapping[secIndex].stage ?? stageMapping[secIndex].name) : null;
                            const displayLabel = stageName ? `Stage: ${stageName}` : (section.label || section.title || section.id);
                            return (
                              <SelectItem key={section.id} value={section.id}>
                                {displayLabel}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="field-required"
                        checked={newField.required}
                        onChange={(e) =>
                          setNewField((prev) => ({
                            ...prev,
                            required: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <Label htmlFor="field-required" className="cursor-pointer">
                        Required
                      </Label>
                    </div>

                    {/* Configuration for People field */}
                    {newField.type === "people" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Filter by Roles (Optional)</Label>
                          <p className="text-xs text-muted-foreground">
                            Select which roles to filter users by. Leave empty to show all users.
                          </p>
                          <PeopleFieldRoleSelector
                            selectedRoleIds={newField.filter_by_roles || []}
                            onChange={(roleIds) => {
                              setNewField((prev) => ({
                                ...prev,
                                filter_by_roles: roleIds,
                              }));
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="filter-by-org"
                              checked={newField.filter_by_organization || false}
                              onCheckedChange={(checked) => {
                                setNewField((prev) => ({
                                  ...prev,
                                  filter_by_organization: checked,
                                }));
                              }}
                            />
                            <Label htmlFor="filter-by-org" className="cursor-pointer text-sm">
                              Filter by full organization
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            When enabled, only shows users from the current organization
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Options for Select/Multi-select */}
                    {(newField.type === "select" || newField.type === "multiselect") && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        <div className="flex flex-wrap gap-2 items-end">
                          <Input
                            placeholder="Label *"
                            value={newOption.label}
                            onChange={(e) => {
                              const newLabel = e.target.value;
                              setNewOption((prev) => ({
                                ...prev,
                                label: newLabel,
                                value: prev.value === "" || prev.value === generateFieldIdFromLabel(prev.label) ? generateFieldIdFromLabel(newLabel) : prev.value,
                              }));
                            }}
                            className="flex-1 min-w-[120px]"
                          />
                          <Input
                            placeholder="Value (optional)"
                            value={newOption.value}
                            onChange={(e) => setNewOption((prev) => ({ ...prev, value: e.target.value }))}
                            className="flex-1 min-w-[120px]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddOption}
                            disabled={!newOption.label}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Value is what gets stored; label is what users see. Leave value blank to auto-generate from label.
                        </p>
                        {newField.options.length > 0 && (
                          <div className="space-y-1">
                            {newField.options.map((option, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-muted rounded"
                              >
                                <span className="text-sm">
                                  <strong>{option.value}</strong>: {option.label}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOption(idx)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional RAG display: numeric / date / options by field type */}
                    {newField.type && newField.type !== "rag" && !["line_break", "page_break", "text_block", "image_block"].includes(newField.type) && (() => {
                      const isNumericRag = ["number", "integer", "calculated"].includes(newField.type);
                      const isDateRag = ["date", "datetime", "date_time"].includes(newField.type);
                      const isOptionsRag = ["select", "multiselect", "dropdown"].includes(newField.type);
                      const opts = newField.options || [];
                      if (!isNumericRag && !isDateRag && !isOptionsRag) return null;
                      const getRagForOption = (optionValue) => {
                        const r = newField.rag_rules;
                        if (Array.isArray(r?.red) && r.red.includes(optionValue)) return "red";
                        if (Array.isArray(r?.amber) && r.amber.includes(optionValue)) return "amber";
                        if (Array.isArray(r?.green) && r.green.includes(optionValue)) return "green";
                        return "";
                      };
                      const setRagForOption = (optionValue, color) => {
                        setNewField((prev) => {
                          const r = { ...(prev.rag_rules || {}) };
                          ["red", "amber", "green"].forEach((c) => {
                            r[c] = Array.isArray(r[c]) ? r[c].filter((v) => v !== optionValue) : [];
                          });
                          if (color) r[color] = [...(r[color] || []), optionValue];
                          return { ...prev, rag_rules: r };
                        });
                      };
                      return (
                      <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                        <Label className="font-medium">RAG display (optional)</Label>
                        {isNumericRag && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Red ≤ max, Amber between min–max, Green ≥ min.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <Label className="text-xs">Red (max)</Label>
                                <Input
                                  type="number"
                                  value={newField.rag_rules?.red?.max ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        red: { ...(prev.rag_rules?.red || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="40"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Amber (min)</Label>
                                <Input
                                  type="number"
                                  value={newField.rag_rules?.amber?.min ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        amber: { ...(prev.rag_rules?.amber || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="40"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Amber (max)</Label>
                                <Input
                                  type="number"
                                  value={newField.rag_rules?.amber?.max ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        amber: { ...(prev.rag_rules?.amber || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="80"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Green (min)</Label>
                                <Input
                                  type="number"
                                  value={newField.rag_rules?.green?.min ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        green: { ...(prev.rag_rules?.green || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                      },
                                    }))
                                  }
                                  placeholder="80"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        {isDateRag && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Red before date, Green after date (e.g. expiry or deadline).
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Red before (date)</Label>
                                <Input
                                  type="text"
                                  value={newField.rag_rules?.red?.before ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        red: { ...(prev.rag_rules?.red || {}), before: e.target.value || undefined },
                                      },
                                    }))
                                  }
                                  placeholder="2025-01-01"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Green after (date)</Label>
                                <Input
                                  type="text"
                                  value={newField.rag_rules?.green?.after ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      rag_rules: {
                                        ...prev.rag_rules,
                                        green: { ...(prev.rag_rules?.green || {}), after: e.target.value || undefined },
                                      },
                                    }))
                                  }
                                  placeholder="2025-06-01"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        {isOptionsRag && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              {opts.length > 0
                                ? "Map each option to a RAG colour. Selected value(s) will show that colour."
                                : "Add options above first, then map each option to Red / Amber / Green below."}
                            </p>
                            {opts.length > 0 ? (
                              <div className="space-y-2">
                                {opts.map((opt, idx) => {
                                  const optionValue = opt.value ?? opt.label ?? String(idx);
                                  const ragVal = getRagForOption(optionValue);
                                  return (
                                    <div key={idx} className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium min-w-[100px]">{opt.label ?? optionValue}</span>
                                      <Select
                                        value={ragVal || "none"}
                                        onValueChange={(v) => setRagForOption(optionValue, v === "none" ? "" : v)}
                                      >
                                        <SelectTrigger className="w-[120px]">
                                          <SelectValue placeholder="RAG" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">None</SelectItem>
                                          <SelectItem value="red">Red</SelectItem>
                                          <SelectItem value="amber">Amber</SelectItem>
                                          <SelectItem value="green">Green</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No options yet. Add options in the section above.</p>
                            )}
                          </>
                        )}
                      </div>
                      );
                    })()}

                    {/* RAG rules for new field */}
                    {newField.type === "rag" && (
                      <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                        <Label className="font-medium">RAG thresholds (numeric)</Label>
                        <p className="text-xs text-muted-foreground">
                          Red = at or below max; Amber = between; Green = at or above min.
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Red (max)</Label>
                            <Input
                              type="number"
                              value={newField.rag_rules?.red?.max ?? ""}
                              onChange={(e) =>
                                setNewField((prev) => ({
                                  ...prev,
                                  rag_rules: {
                                    ...prev.rag_rules,
                                    red: { ...(prev.rag_rules?.red || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                  },
                                }))
                              }
                              placeholder="40"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Amber (min / max)</Label>
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                value={newField.rag_rules?.amber?.min ?? ""}
                                onChange={(e) =>
                                  setNewField((prev) => ({
                                    ...prev,
                                    rag_rules: {
                                      ...prev.rag_rules,
                                      amber: { ...(prev.rag_rules?.amber || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                    },
                                  }))
                                }
                                placeholder="40"
                              />
                              <Input
                                type="number"
                                value={newField.rag_rules?.amber?.max ?? ""}
                                onChange={(e) =>
                                  setNewField((prev) => ({
                                    ...prev,
                                    rag_rules: {
                                      ...prev.rag_rules,
                                      amber: { ...(prev.rag_rules?.amber || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                                    },
                                  }))
                                }
                                placeholder="80"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Green (min)</Label>
                            <Input
                              type="number"
                              value={newField.rag_rules?.green?.min ?? ""}
                              onChange={(e) =>
                                setNewField((prev) => ({
                                  ...prev,
                                  rag_rules: {
                                    ...prev.rag_rules,
                                    green: { ...(prev.rag_rules?.green || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                                  },
                                }))
                              }
                              placeholder="80"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Calculated formula for new field */}
                    {newField.type === "calculated" && (
                      <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                        <Label className="font-medium">Formula</Label>
                        {(newField.formula?.field_ids?.length || newField.formula?.numerator_field_id || newField.formula?.value_field_id) && (
                          <p className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border">
                            {(newField.formula?.type || "sum") === "sum"
                              ? `= SUM(${(newField.formula?.field_ids || []).join(", ")})`
                              : newField.formula?.value_field_id && newField.formula?.target_constant_key
                                ? `= (${newField.formula.value_field_id} / constant:${newField.formula.target_constant_key}) × 100%`
                                : `= (${newField.formula?.numerator_field_id || "?"} / ${newField.formula?.denominator_field_id || "?"}) × 100%`}
                          </p>
                        )}
                        <Select
                          value={newField.formula?.type || "sum"}
                          onValueChange={(value) =>
                            setNewField((prev) => ({
                              ...prev,
                              formula: { ...(prev.formula || {}), type: value },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Sum of fields</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                        {(newField.formula?.type || "sum") === "sum" && (
                          <div>
                            <Label className="text-xs">Field IDs to sum (comma-separated)</Label>
                            <Input
                              value={(newField.formula?.field_ids || []).join(", ")}
                              onChange={(e) =>
                                setNewField((prev) => ({
                                  ...prev,
                                  formula: {
                                    ...prev.formula,
                                    field_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                  },
                                }))
                              }
                              placeholder="revenue, costs"
                            />
                          </div>
                        )}
                        {(newField.formula?.type || "percentage") === "percentage" && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Numerator field ID</Label>
                              <Input
                                value={newField.formula?.numerator_field_id ?? ""}
                                onChange={(e) =>
                                  setNewField((prev) => ({
                                    ...prev,
                                    formula: { ...prev.formula, numerator_field_id: e.target.value || undefined },
                                  }))
                                }
                                placeholder="achieved"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Denominator field ID</Label>
                              <Input
                                value={newField.formula?.denominator_field_id ?? ""}
                                onChange={(e) =>
                                  setNewField((prev) => ({
                                    ...prev,
                                    formula: { ...prev.formula, denominator_field_id: e.target.value || undefined },
                                  }))
                                }
                                placeholder="target"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Or: value field + tracker constant key</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  value={newField.formula?.value_field_id ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      formula: { ...prev.formula, value_field_id: e.target.value || undefined },
                                    }))
                                  }
                                  placeholder="value field ID"
                                />
                                <Input
                                  value={newField.formula?.target_constant_key ?? ""}
                                  onChange={(e) =>
                                    setNewField((prev) => ({
                                      ...prev,
                                      formula: { ...prev.formula, target_constant_key: e.target.value || undefined },
                                    }))
                                  }
                                  placeholder="constant key (e.g. target_kpi)"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Repeatable group: child fields (ID auto-generated from label) */}
                    {newField.type === "repeatable_group" && (
                      <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                        <Label className="font-medium">Child fields (one per column in each row)</Label>
                        {(newField.fields || []).map((child, childIdx) => (
                          <div key={childIdx} className="flex flex-wrap items-center gap-2 p-2 rounded border bg-background">
                            <Input
                              className="flex-1 min-w-[100px]"
                              placeholder="Label"
                              value={child.label || child.field_label || ""}
                              onChange={(e) => {
                                const label = e.target.value;
                                const id = generateFieldIdFromLabel(label) || `field_${childIdx + 1}`;
                                setNewField((prev) => ({
                                  ...prev,
                                  fields: (prev.fields || []).map((c, i) =>
                                    i === childIdx ? { ...c, label, field_label: label, id, name: id } : c
                                  ),
                                }));
                              }}
                            />
                            <Select
                              value={(child.type || child.field_type || "text").toLowerCase()}
                              onValueChange={(value) =>
                                setNewField((prev) => ({
                                  ...prev,
                                  fields: (prev.fields || []).map((c, i) => i === childIdx ? { ...c, type: value, field_type: value } : c),
                                }))
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ID: {child.id || child.name || generateFieldIdFromLabel(child.label) || `field_${childIdx + 1}`}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setNewField((prev) => ({
                                  ...prev,
                                  fields: (prev.fields || []).filter((_, i) => i !== childIdx),
                                }))
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setNewField((prev) => {
                              const n = (prev.fields || []).length + 1;
                              const label = `New field ${n}`;
                              const id = generateFieldIdFromLabel(label) || `field_${n}`;
                              return {
                                ...prev,
                                fields: [...(prev.fields || []), { id, name: id, type: "text", label }],
                              };
                            })
                          }
                        >
                          Add child field
                        </Button>
                      </div>
                    )}

                    <Button onClick={handleAddField} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields per stage (sections) – one section per stage, order matches */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fields per stage</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Each stage has one set of fields; that set is edited here. Order matches stage order (section 1 → stage 1, section 2 → stage 2). Add or reorder sections below; keep the same number as stages so each stage has its fields.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Sections */}
              {sections.length > 0 && (
                <div className="space-y-2">
                  <Label>Fields for each stage</Label>
                  {sections.map((section, index) => {
                    // Backend/template sections use section.fields (array of field ids); edit UI may use field.section
                    const sectionFieldIds = (section.fields || []).length > 0 ? (section.fields || []) : null;
                    const sectionFields = sectionFieldIds ? fields.filter((f) => sectionFieldIds.includes(f.id || f.name || f.field_id)) : fields.filter((f) => f.section === section.id);
                    const linkedStage = stageMapping[index];
                    const linkedStageName = linkedStage?.stage ?? linkedStage?.name ?? null;
                    return editingSectionIndex === index ? (
                      // Edit Section Form
                      <div key={section.id || index} className="p-4 border rounded-md space-y-4 bg-card">
                        <div>
                          <Label htmlFor="edit-section-label">Section Label *</Label>
                          <Input
                            id="edit-section-label"
                            value={editingSection.label}
                            onChange={(e) =>
                              setEditingSection((prev) => ({
                                ...prev,
                                label: e.target.value,
                              }))
                            }
                            placeholder="e.g., Basic Information"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-section-id">Section ID</Label>
                          <Input
                            id="edit-section-id"
                            value={editingSection.id}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            placeholder="Auto-generated"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Section ID cannot be changed
                          </p>
                        </div>
                        {/* Field groups: optional sub-headings within this section */}
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-sm font-medium">Field groups (optional)</Label>
                          <p className="text-xs text-muted-foreground">
                            Group fields under sub-headings in the form. Order of groups is the order they appear.
                          </p>
                          {(editingSection.groups || []).map((group, groupIdx) => (
                            <div key={group.id || groupIdx} className="p-3 rounded border bg-muted/30 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0">
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={groupIdx === 0} onClick={() => {
                                    const next = [...(editingSection.groups || [])];
                                    if (groupIdx <= 0) return;
                                    [next[groupIdx - 1], next[groupIdx]] = [next[groupIdx], next[groupIdx - 1]];
                                    setEditingSection((prev) => ({ ...prev, groups: next }));
                                  }}>
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={groupIdx >= (editingSection.groups || []).length - 1} onClick={() => {
                                    const next = [...(editingSection.groups || [])];
                                    if (groupIdx >= next.length - 1) return;
                                    [next[groupIdx], next[groupIdx + 1]] = [next[groupIdx + 1], next[groupIdx]];
                                    setEditingSection((prev) => ({ ...prev, groups: next }));
                                  }}>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Input
                                  placeholder="Group label"
                                  value={group.label || ""}
                                  onChange={(e) => {
                                    const next = [...(editingSection.groups || [])];
                                    next[groupIdx] = { ...group, label: e.target.value, id: group.id || generateSlug(e.target.value) || `group-${groupIdx}` };
                                    setEditingSection((prev) => ({ ...prev, groups: next }));
                                  }}
                                  className="flex-1"
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingSection((prev) => ({ ...prev, groups: (prev.groups || []).filter((_, i) => i !== groupIdx) }))}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              {/* Layout: Stack (default) or Grid (3 columns: left, center full width, right) */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">Layout</Label>
                                <Select
                                  value={group.layout || "stack"}
                                  onValueChange={(val) => {
                                    const next = [...(editingSection.groups || [])];
                                    const newGroup = { ...group, layout: val };
                                    if (val === "grid") {
                                      const hasRows = Array.isArray(group.grid_rows) && group.grid_rows.length > 0;
                                      const hasGrid = (group.grid_columns?.left ?? []).length > 0 || (group.grid_columns?.center ?? []).length > 0 || (group.grid_columns?.right ?? []).length > 0;
                                      if (hasRows) {
                                        newGroup.grid_rows = group.grid_rows;
                                        newGroup.fields = group.grid_rows.flatMap((r) => [...(r.left || []), ...(r.center || []), ...(r.right || [])]);
                                      } else if (hasGrid) {
                                        newGroup.grid_rows = [{ left: group.grid_columns?.left ?? [], center: group.grid_columns?.center ?? [], right: group.grid_columns?.right ?? [] }];
                                        newGroup.fields = [...(newGroup.grid_rows[0].left || []), ...(newGroup.grid_rows[0].center || []), ...(newGroup.grid_rows[0].right || [])];
                                      } else {
                                        newGroup.grid_rows = [{ left: [...(group.fields || [])], center: [], right: [] }];
                                        newGroup.fields = group.fields || [];
                                      }
                                    }
                                    next[groupIdx] = newGroup;
                                    setEditingSection((prev) => ({ ...prev, groups: next }));
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs w-36">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="stack">Stack (default)</SelectItem>
                                    <SelectItem value="grid">Grid (3 columns)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {(group.layout || "") === "grid" ? (
                                <GridColumnsEditor
                                  group={group}
                                  groupIdx={groupIdx}
                                  sectionFields={sectionFields}
                                  editingSection={editingSection}
                                  setEditingSection={setEditingSection}
                                />
                              ) : (
                              <div className="flex flex-wrap gap-1 items-center">
                                {(group.fields || []).map((fid) => {
                                  const f = sectionFields.find((x) => (x.id || x.name || x.field_id) === fid);
                                  return (
                                    <Badge key={fid} variant="secondary" className="text-xs">
                                      {f?.label || f?.name || fid}
                                      <button
                                        type="button"
                                        className="ml-1 hover:text-destructive"
                                        onClick={() => {
                                          const next = [...(editingSection.groups || [])];
                                          next[groupIdx] = { ...group, fields: (group.fields || []).filter((id) => id !== fid) };
                                          setEditingSection((prev) => ({ ...prev, groups: next }));
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  );
                                })}
                                <Select
                                  value="__add__"
                                  onValueChange={(val) => {
                                    if (val && val !== "__add__") {
                                      const next = [...(editingSection.groups || [])];
                                      next[groupIdx] = { ...group, fields: [...(group.fields || []), val] };
                                      setEditingSection((prev) => ({ ...prev, groups: next }));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-40 h-8 text-xs">
                                    <SelectValue placeholder="+ Add field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__add__">+ Add field</SelectItem>
                                    {sectionFields
                                      .map((f) => f.id || f.name || f.field_id)
                                      .filter(Boolean)
                                      .filter((id) => !(editingSection.groups || []).flatMap((g) => g.fields || []).includes(id))
                                      .map((id) => {
                                        const f = sectionFields.find((x) => (x.id || x.name || x.field_id) === id);
                                        return <SelectItem key={id} value={id}>{f?.label || f?.name || id}</SelectItem>;
                                      })}
                                  </SelectContent>
                                </Select>
                              </div>
                              )}
                              {/* Group conditional visibility: show whole group when another field meets a condition */}
                              <div className="space-y-2 pt-2 border-t border-muted">
                                <Label className="text-xs font-medium">Show group when (optional)</Label>
                                <div className="space-y-2">
                                  <Select
                                    value={group.conditional_visibility?.depends_on_field || "__none__"}
                                    onValueChange={(value) => {
                                      const next = [...(editingSection.groups || [])];
                                      next[groupIdx] = {
                                        ...group,
                                        conditional_visibility: value && value !== "__none__"
                                          ? { ...(group.conditional_visibility || {}), depends_on_field: value }
                                          : null,
                                      };
                                      setEditingSection((prev) => ({ ...prev, groups: next }));
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select field..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">None (always show)</SelectItem>
                                      {sectionFields
                                        .filter((f) => !["text_block", "image_block", "line_break", "page_break", "download_link"].includes((f.type || f.field_type || "").toLowerCase()))
                                        .map((f) => (
                                          <SelectItem key={f.id || f.name || f.field_id} value={String(f.id || f.name || f.field_id)}>
                                            {f.label || f.name || f.id}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  {group.conditional_visibility?.depends_on_field && (
                                    <>
                                      <Select
                                        value={group.conditional_visibility?.show_when || ""}
                                        onValueChange={(value) => {
                                          const next = [...(editingSection.groups || [])];
                                          next[groupIdx] = {
                                            ...group,
                                            conditional_visibility: { ...(group.conditional_visibility || {}), show_when: value || null },
                                          };
                                          setEditingSection((prev) => ({ ...prev, groups: next }));
                                        }}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="equals">Equals</SelectItem>
                                          <SelectItem value="not_equals">Not equals</SelectItem>
                                          <SelectItem value="contains">Contains</SelectItem>
                                          <SelectItem value="is_empty">Is empty</SelectItem>
                                          <SelectItem value="is_not_empty">Is not empty</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {group.conditional_visibility?.show_when && ["equals", "not_equals", "contains"].includes(group.conditional_visibility.show_when) && (
                                        <Input
                                          className="h-8 text-xs"
                                          placeholder="Value"
                                          value={group.conditional_visibility?.value ?? ""}
                                          onChange={(e) => {
                                            const next = [...(editingSection.groups || [])];
                                            next[groupIdx] = {
                                              ...group,
                                              conditional_visibility: { ...(group.conditional_visibility || {}), value: e.target.value || null },
                                            };
                                            setEditingSection((prev) => ({ ...prev, groups: next }));
                                          }}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection((prev) => ({ ...prev, groups: [...(prev.groups || []), { id: `group_${Date.now()}`, label: "New group", fields: [] }] }))}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add group
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleUpdateSection} 
                            className="flex-1"
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Update Section
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEditSection}
                            className="flex-1"
                            disabled={updateMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Section Display
                      <div
                        key={section.id || index}
                        draggable
                        onDragStart={() => handleSectionDragStart(index)}
                        onDragOver={(e) => handleSectionDragOver(e, index)}
                        onDragLeave={handleSectionDragLeave}
                        onDrop={(e) => handleSectionDrop(e, index)}
                        onDragEnd={handleSectionDragEnd}
                        className={`p-4 border rounded-md flex items-center gap-3 ${
                          draggedSectionIndex === index
                            ? "opacity-50 cursor-grabbing"
                            : "cursor-grab hover:bg-muted/50"
                        } ${
                          dragOverSectionIndex === index && draggedSectionIndex !== index
                            ? "border-primary border-2 bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{section.label || section.title || section.id}</span>
                            <Badge variant="outline" className="text-xs">
                              {sectionFields.length} field{sectionFields.length !== 1 ? "s" : ""}
                            </Badge>
                            {formData.tracker_config?.use_stages && (
                              <Badge variant="secondary" className="text-xs">
                                Stage: {linkedStageName ?? "—"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {section.id}
                            {formData.tracker_config?.use_stages && linkedStageName && (
                              <span className="ml-2">· Used for stage &quot;{linkedStageName}&quot;</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSection(index)}
                            title="Edit Section"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSection(index)}
                            title="Delete Section"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {formData.tracker_config?.use_stages && sections.length > 0 && stageMapping.length > 0 && sections.length !== stageMapping.length && (
                <p className="text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md">
                  Section count ({sections.length}) does not match stage count ({stageMapping.length}). Entry and create wizards link by position: section 1 → stage 1. Add or remove sections or stages so they match.
                </p>
              )}

              {/* Add New Section */}
              <div className="p-4 border rounded-md space-y-4">
                <div>
                  <Label htmlFor="section-label">Section Label *</Label>
                  <Input
                    id="section-label"
                    value={newSection.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      setNewSection((prev) => ({
                        ...prev,
                        label: newLabel,
                        id: sectionIdManuallyEdited ? prev.id : generateUniqueId(newLabel),
                      }));
                    }}
                    placeholder="e.g., Basic Information"
                  />
                </div>
                <div>
                  <Label htmlFor="section-id">Section ID</Label>
                  <Input
                    id="section-id"
                    value={newSection.id}
                    onChange={(e) => {
                      setSectionIdManuallyEdited(true);
                      setNewSection((prev) => ({ ...prev, id: e.target.value }));
                    }}
                    placeholder="Auto-generated from label"
                  />
                </div>
                <Button onClick={handleAddSection} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statuses Tab */}
        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracker Statuses</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Allowed <strong>Status</strong> values (workflow state). Queue counts use status. The field that holds it in the form (e.g. &quot;Current status&quot;) is configured in Fields. Stage is derived from status.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Statuses */}
              {statuses.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Statuses</Label>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Badge
                        key={status}
                        variant={
                          status === formData.tracker_config?.default_status
                            ? "default"
                            : "outline"
                        }
                        className="flex items-center gap-2"
                      >
                        {humanizeStatusForDisplay(status)}
                        {status === formData.tracker_config?.default_status && (
                          <span className="text-xs">(Default)</span>
                        )}
                        {status !== formData.tracker_config?.default_status && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleRemoveStatus(status)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Status */}
              <div className="p-4 border rounded-md space-y-4">
                <div>
                  <Label htmlFor="new-status">Status Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      placeholder="e.g., on_hold, cancelled"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStatus();
                        }
                      }}
                    />
                    <Button onClick={handleAddStatus} disabled={!newStatus.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use lowercase with underscores (e.g., "in_progress")
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note Categories Card */}
          <Card>
            <CardHeader>
              <CardTitle>Note Categories</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage categories for notes/comments in timeline (e.g., "Phoned Patient", "Patient Phoned", "Text Sent", "Patient Cancelled")
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Note Categories */}
              {formData.tracker_config?.note_categories?.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Note Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.tracker_config.note_categories.map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {category}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveNoteCategory(category)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Note Category */}
              <div className="p-4 border rounded-md space-y-4">
                <div>
                  <Label htmlFor="new-note-category">Note Category Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-note-category"
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      placeholder="e.g., Phoned Patient, Patient Phoned"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNoteCategory();
                        }
                      }}
                    />
                    <Button onClick={handleAddNoteCategory} disabled={!newNoteCategory.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Categories will appear when adding notes to tracker entries
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stages Tab – only when use_stages is enabled */}
        {formData.tracker_config?.use_stages && (
        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stages &amp; workflow</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Stages</strong> are workflow steps (e.g. Case Creation, Triage). Add stages and assign statuses per stage; if a stage has no statuses, it uses the tracker default from the <strong>Statuses</strong> tab. Use <strong>Allowed next stages</strong> and <strong>Allowed next statuses</strong> to control progression. Which fields appear at each step is set in the <strong>Fields per stage</strong> tab; order matches (section 1 = stage 1, etc.).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {stageMapping.some((item) => !(item.statuses || []).length) && statuses.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md">
                  Stages with no statuses use the tracker default list. Add statuses in the <strong>Statuses</strong> tab so those stages can be used.
                </p>
              )}
              <div>
                <Label>Stages for this tracker</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add or remove stages. Assign statuses per stage to override the default; leave empty to use the tracker&apos;s default status list for that stage.
                </p>
                {stageMapping.length > 0 && (
                  <Button variant="outline" size="sm" className="mb-2" onClick={handleResetStagesToDefault}>
                    Clear all stages
                  </Button>
                )}
                {stageMapping.map((item, index) => {
                  const assigned = item.statuses || [];
                  const availableToAdd = statuses.filter((s) => !assigned.includes(s));
                  const allowPublicSubmit = item.allow_public_submit === true;
                  const stageColor = item.color || STAGE_COLOR_PALETTE[index % STAGE_COLOR_PALETTE.length].value;
                  const linkedSection = sections[index];
                  const linkedSectionFieldsCount = linkedSection ? fields.filter((f) => f.section === linkedSection.id).length : 0;
                  return (
                    <div key={index} className="flex flex-wrap gap-2 items-center p-3 rounded-md border bg-background mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Colour</span>
                        <div className="flex gap-0.5">
                          {STAGE_COLOR_PALETTE.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              title={c.label}
                              className="w-6 h-6 rounded-full border-2 border-background shadow-sm hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                backgroundColor: c.value,
                                borderColor: stageColor === c.value ? "var(--primary)" : "transparent",
                                boxShadow: stageColor === c.value ? "0 0 0 2px var(--primary)" : undefined,
                              }}
                              onClick={() => handleUpdateStage(index, "color", c.value)}
                            />
                          ))}
                        </div>
                      </div>
                      <Input
                        placeholder="Stage name"
                        value={item.stage || ""}
                        onChange={(e) => handleUpdateStage(index, "stage", e.target.value)}
                        className="w-40"
                      />
                      {sections.length > 0 && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap" title="Section at same position provides the fields for this stage">
                          Section: {linkedSection?.label ?? "—"} ({linkedSectionFieldsCount} field{linkedSectionFieldsCount !== 1 ? "s" : ""})
                        </span>
                      )}
                      <span className="text-muted-foreground text-sm">←</span>
                      <div className="flex flex-wrap gap-1 items-center">
                        {assigned.length > 0 ? (
                          assigned.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {humanizeStatusForDisplay(s)}
                              <button
                                type="button"
                                className="ml-1 hover:text-destructive"
                                onClick={() => handleUpdateStage(index, "statuses", assigned.filter((x) => x !== s))}
                                aria-label={`Remove ${s}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Uses default ({statuses.length} statuses)</span>
                        )}
                        {availableToAdd.length > 0 && (
                          <Select
                            value="__add__"
                            onValueChange={(val) => {
                              if (val && val !== "__add__") {
                                handleUpdateStage(index, "statuses", [...assigned, val]);
                              }
                            }}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="+ Add status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__add__">+ Add status</SelectItem>
                              {availableToAdd.map((s) => (
                                <SelectItem key={s} value={s}>{humanizeStatusForDisplay(s)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" title="When checked, external users can fill this stage via the shareable form link; internal users move the entry to next stages.">
                        <input
                          type="checkbox"
                          id={`stage-public-${index}`}
                          checked={allowPublicSubmit}
                          onChange={(e) => handleUpdateStage(index, "allow_public_submit", e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`stage-public-${index}`} className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                          External can fill
                        </Label>
                      </div>
                      {/* Workflow: allowed next stages and statuses (configurable per stage) */}
                      <div className="w-full flex flex-wrap gap-4 py-2 px-3 rounded border bg-muted/20">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Allowed next stages</Label>
                          <div className="flex flex-wrap gap-1 items-center">
                            {(item.allowed_next_stages || []).map((stageName) => (
                              <Badge key={stageName} variant="secondary" className="text-xs">
                                {stageName}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-destructive"
                                  onClick={() => handleUpdateStage(index, "allowed_next_stages", (item.allowed_next_stages || []).filter((x) => x !== stageName))}
                                  aria-label={`Remove ${stageName}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            <Select
                              value="__add_stage__"
                              onValueChange={(val) => {
                                if (val && val !== "__add_stage__") {
                                  handleUpdateStage(index, "allowed_next_stages", [...(item.allowed_next_stages || []), val]);
                                }
                              }}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue placeholder="+ Add stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__add_stage__">+ Add stage</SelectItem>
                                {stageMapping
                                  .map((s) => (s?.stage ?? s?.name ?? "").toString().trim())
                                  .filter(Boolean)
                                  .filter((name) => !(item.allowed_next_stages || []).includes(name))
                                  .map((name) => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Allowed next statuses (when moving to next stage)</Label>
                          <div className="flex flex-wrap gap-1 items-center">
                            {(item.allowed_next_statuses || []).map((statusVal) => (
                              <Badge key={statusVal} variant="outline" className="text-xs">
                                {humanizeStatusForDisplay(statusVal)}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-destructive"
                                  onClick={() => handleUpdateStage(index, "allowed_next_statuses", (item.allowed_next_statuses || []).filter((x) => x !== statusVal))}
                                  aria-label={`Remove ${statusVal}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            <Select
                              value="__add_status__"
                              onValueChange={(val) => {
                                if (val && val !== "__add_status__") {
                                  handleUpdateStage(index, "allowed_next_statuses", [...(item.allowed_next_statuses || []), val]);
                                }
                              }}
                            >
                              <SelectTrigger className="w-40 h-8 text-xs">
                                <SelectValue placeholder="+ Add status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__add_status__">+ Add status</SelectItem>
                                {statuses
                                  .filter((s) => !(item.allowed_next_statuses || []).includes(s))
                                  .map((s) => (
                                    <SelectItem key={s} value={s}>{humanizeStatusForDisplay(s)}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-xs text-muted-foreground">Leave empty to allow all statuses of the target stage.</p>
                        </div>
                      </div>
                      {/* Auto-advance to next stage when date + N days has passed */}
                      {(() => {
                        const autoAdv = item.auto_advance || {};
                        const dateTimeFields = (formData.tracker_fields?.fields || []).filter(
                          (f) => (f.type || f.field_type || "").toLowerCase() === "date" || (f.type || f.field_type || "").toLowerCase() === "datetime"
                        );
                        const nextStageName = stageMapping[index + 1] ? (stageMapping[index + 1].stage ?? stageMapping[index + 1].name) : null;
                        return (
                          <div className="flex flex-wrap items-center gap-2 p-2 rounded border bg-muted/30 shrink-0">
                            <input
                              type="checkbox"
                              id={`stage-auto-advance-${index}`}
                              checked={!!autoAdv.enabled}
                              onChange={(e) => handleUpdateStage(index, "auto_advance", { ...autoAdv, enabled: e.target.checked, target_stage: "next" })}
                              className="rounded"
                            />
                            <Label htmlFor={`stage-auto-advance-${index}`} className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                              Auto-advance to next stage when date passes
                            </Label>
                            {autoAdv.enabled && (
                              <>
                                <Select
                                  value={(autoAdv.date_field_id || "").trim() || "__none__"}
                                  onValueChange={(val) => handleUpdateStage(index, "auto_advance", { ...autoAdv, date_field_id: val === "__none__" ? "" : val })}
                                >
                                  <SelectTrigger className="w-44 h-8 text-xs">
                                    <SelectValue placeholder="Date field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Select date field</SelectItem>
                                    {dateTimeFields.map((f) => (
                                      <SelectItem key={f.id || f.name} value={f.id || f.field_id || f.name}>
                                        {f.label || f.field_label || f.name || f.id}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-muted-foreground">+</span>
                                <Input
                                  type="number"
                                  min={0}
                                  className="w-16 h-8 text-xs"
                                  placeholder="0"
                                  value={autoAdv.days_after ?? ""}
                                  onChange={(e) => handleUpdateStage(index, "auto_advance", { ...autoAdv, days_after: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0 })}
                                />
                                <span className="text-xs text-muted-foreground">day(s) → {nextStageName ? nextStageName : "next stage"}</span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveStage(index)} aria-label="Remove stage">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" onClick={handleAddStage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add stage
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Allowed Roles</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Roles that can access this tracker. Job roles expand to shift roles; selecting a job role selects all its shift roles (you can clear individual shift roles if needed).
                </p>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {standaloneRoles.map((role) => {
                    const isSelected = formData.access_config?.allowed_roles?.includes(role.name) || false;
                    return (
                      <div key={role.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`role-standalone-${role.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const currentRoles = formData.access_config?.allowed_roles || [];
                            const newRoles = checked
                              ? [...currentRoles, role.name]
                              : currentRoles.filter((r) => r !== role.name);
                            setFormData((prev) => ({
                              ...prev,
                              access_config: {
                                ...prev.access_config,
                                allowed_roles: newRoles,
                              },
                            }));
                          }}
                        />
                        <Label htmlFor={`role-standalone-${role.id}`} className="cursor-pointer font-normal">
                          {role.display_name || role.name}
                        </Label>
                      </div>
                    );
                  })}
                  {jobRoleGroups.map((jobRole) => {
                    const shiftRoles = jobRole.shift_roles || jobRole.shiftRoles || [];
                    const jobName = jobRole.name;
                    const shiftNames = shiftRoles.map((s) => s.name);
                    const allNames = [jobName, ...shiftNames];
                    const allowed = formData.access_config?.allowed_roles || [];
                    const selectedCount = allNames.filter((n) => allowed.includes(n)).length;
                    const allSelected = selectedCount === allNames.length;
                    const someSelected = selectedCount > 0;
                    return (
                      <div key={jobRole.id} className="space-y-1.5 pl-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`role-job-${jobRole.id}`}
                            ref={(el) => {
                              if (el) jobRoleCheckboxRefs.current[jobRole.id] = el;
                              else delete jobRoleCheckboxRefs.current[jobRole.id];
                            }}
                            checked={allSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const currentRoles = formData.access_config?.allowed_roles || [];
                              let newRoles = currentRoles.filter((r) => !allNames.includes(r));
                              if (checked) newRoles = [...newRoles, ...allNames];
                              setFormData((prev) => ({
                                ...prev,
                                access_config: {
                                  ...prev.access_config,
                                  allowed_roles: newRoles,
                                },
                              }));
                            }}
                            className="h-4 w-4 rounded border border-primary"
                          />
                          <Label htmlFor={`role-job-${jobRole.id}`} className="cursor-pointer font-medium">
                            {jobRole.display_name || jobRole.name}
                            {jobRole.department?.name ? ` (${jobRole.department.name})` : ""}
                          </Label>
                        </div>
                        <div className="pl-6 space-y-1">
                          {shiftRoles.map((shift) => {
                            const shiftSelected = allowed.includes(shift.name);
                            return (
                              <div key={shift.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`role-shift-${shift.id}`}
                                  checked={shiftSelected}
                                  onCheckedChange={(checked) => {
                                    const currentRoles = formData.access_config?.allowed_roles || [];
                                    const newRoles = checked
                                      ? [...currentRoles, shift.name]
                                      : currentRoles.filter((r) => r !== shift.name);
                                    setFormData((prev) => ({
                                      ...prev,
                                      access_config: {
                                        ...prev.access_config,
                                        allowed_roles: newRoles,
                                      },
                                    }));
                                  }}
                                />
                                <Label htmlFor={`role-shift-${shift.id}`} className="cursor-pointer font-normal text-muted-foreground">
                                  {shift.display_name || shift.name}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Allowed Users</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Specific users that can access this tracker
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.slice(0, 50).map((user) => {
                    const isSelected = formData.access_config?.allowed_users?.includes(user.id) || false;
                    return (
                      <div key={user.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentUsers = formData.access_config?.allowed_users || [];
                            const newUsers = e.target.checked
                              ? [...currentUsers, user.id]
                              : currentUsers.filter((u) => u !== user.id);
                            setFormData((prev) => ({
                              ...prev,
                              access_config: {
                                ...prev.access_config,
                                allowed_users: newUsers,
                              },
                            }));
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
                          {user.full_name || user.email}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose when to send notifications for this tracker and which channels to use.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-medium">When to notify</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notify_on_new_entry"
                      checked={formData.tracker_config?.notification_settings?.notify_on_new_entry ?? true}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracker_config: {
                            ...prev.tracker_config,
                            notification_settings: {
                              ...(prev.tracker_config?.notification_settings || {}),
                              notify_on_new_entry: checked !== false,
                            },
                          },
                        }))
                      }
                    />
                    <Label htmlFor="notify_on_new_entry" className="font-normal cursor-pointer">
                      When a new entry is created
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notify_on_status_change"
                      checked={formData.tracker_config?.notification_settings?.notify_on_status_change ?? true}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracker_config: {
                            ...prev.tracker_config,
                            notification_settings: {
                              ...(prev.tracker_config?.notification_settings || {}),
                              notify_on_status_change: checked !== false,
                            },
                          },
                        }))
                      }
                    />
                    <Label htmlFor="notify_on_status_change" className="font-normal cursor-pointer">
                      When an entry&apos;s status or stage changes
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-medium">Channels</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_email"
                      checked={formData.tracker_config?.notification_settings?.send_email ?? true}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracker_config: {
                            ...prev.tracker_config,
                            notification_settings: {
                              ...(prev.tracker_config?.notification_settings || {}),
                              send_email: checked !== false,
                            },
                          },
                        }))
                      }
                    />
                    <Label htmlFor="send_email" className="font-normal cursor-pointer">
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_push"
                      checked={formData.tracker_config?.notification_settings?.send_push ?? true}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracker_config: {
                            ...prev.tracker_config,
                            notification_settings: {
                              ...(prev.tracker_config?.notification_settings || {}),
                              send_push: checked !== false,
                            },
                          },
                        }))
                      }
                    />
                    <Label htmlFor="send_push" className="font-normal cursor-pointer">
                      In-app notification
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_sms"
                      checked={formData.tracker_config?.notification_settings?.send_sms ?? false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracker_config: {
                            ...prev.tracker_config,
                            notification_settings: {
                              ...(prev.tracker_config?.notification_settings || {}),
                              send_sms: checked === true,
                            },
                          },
                        }))
                      }
                    />
                    <Label htmlFor="send_sms" className="font-normal cursor-pointer">
                      SMS
                    </Label>
                  </div>
                </div>
              </div>
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
                    // Helper to format field names to be readable
                    const formatFieldName = (fieldName) => {
                      return fieldName
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");
                    };
                    
                    // Format audit log changes from old_values/new_values
                    const formatAuditChanges = () => {
                      const changes = [];
                      
                      if (!log.old_values && !log.new_values) {
                        return changes;
                      }
                      
                      const oldVals = log.old_values || {};
                      const newVals = log.new_values || {};
                      const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
                      
                      allKeys.forEach((key) => {
                        const oldVal = oldVals[key];
                        const newVal = newVals[key];
                        
                        // Skip if values are the same
                        if (oldVal === newVal) return;
                        
                        // Skip internal/technical fields
                        if (key === "updated_at" || key === "created_at" || key === "id" || key === "slug") {
                          return;
                        }
                        
                        // Format the field name
                        const fieldLabel = formatFieldName(key);
                        
                        // Format values for display
                        const formatValue = (val) => {
                          if (val === null || val === undefined) return "—";
                          if (typeof val === "boolean") return val ? "Yes" : "No";
                          if (typeof val === "object") {
                            // For complex objects, show a summary
                            if (Array.isArray(val)) {
                              return val.length > 0 ? `${val.length} item(s)` : "Empty";
                            }
                            return "Updated";
                          }
                          if (typeof val === "string" && val.length > 50) {
                            return val.substring(0, 50) + "...";
                          }
                          return String(val);
                        };
                        
                        changes.push({
                          field: fieldLabel,
                          old: formatValue(oldVal),
                          new: formatValue(newVal),
                        });
                      });
                      
                      return changes;
                    };
                    
                    // Format details JSON nicely
                    const formatDetails = (hasChanges) => {
                      if (!log.details) return null;
                      
                      let detailsObj = log.details;
                      
                      // If details is a string, try to parse it
                      if (typeof log.details === "string") {
                        try {
                          detailsObj = JSON.parse(log.details);
                        } catch (e) {
                          return null;
                        }
                      }
                      
                      // If details is not an object, return null
                      if (typeof detailsObj !== "object" || detailsObj === null) {
                        return null;
                      }
                      
                      // If we have changes, only show meaningful processing results
                      if (hasChanges) {
                        return null;
                      }
                      
                      const parts = [];
                      
                      // Handle create action
                      if (log.action === "create") {
                        if (detailsObj.organization_name) {
                          parts.push(`Organisation: ${detailsObj.organization_name}`);
                        }
                        if (detailsObj.form_name) {
                          parts.push(`Tracker: ${detailsObj.form_name}`);
                        }
                        if (parts.length > 0) {
                          return parts.join(" • ");
                        }
                        return "Tracker created";
                      }
                      
                      // Handle read action - don't show details for reads
                      if (log.action === "read") {
                        return null;
                      }
                      
                      // Handle update action - if no changes detected, show message
                      if (log.action === "update") {
                        return "Update called but no changes detected";
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
                              {log.user?.display_name || log.user?.email || log.user?.first_name || "System"}
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
    </div>
  );
};

// Tracker Constants Editor (key-value for KPI / global values)
const TrackerConstantsEditor = ({ constants, onChange }) => {
  const entries = Object.entries(constants || {});
  const addConstant = () => {
    const key = prompt("Constant key (e.g. target_kpi):");
    if (!key || key.trim() === "") return;
    const k = key.trim().replace(/\s+/g, "_").toLowerCase();
    const val = prompt("Value (number or text):");
    if (val === null) return;
    onChange({ ...constants, [k]: isNaN(Number(val)) ? val : Number(val) });
  };
  const updateConstant = (oldKey, newKey, newVal) => {
    const next = { ...constants };
    delete next[oldKey];
    next[newKey] = newVal;
    onChange(next);
  };
  const removeConstant = (key) => {
    const next = { ...constants };
    delete next[key];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 items-center">
          <Input
            value={k}
            onChange={(e) => updateConstant(k, e.target.value.replace(/\s+/g, "_").toLowerCase(), v)}
            placeholder="key"
            className="flex-1 max-w-[180px]"
          />
          <Input
            type={typeof v === "number" ? "number" : "text"}
            value={v}
            onChange={(e) =>
              updateConstant(
                k,
                k,
                e.target.value === "" ? "" : (typeof v === "number" ? Number(e.target.value) : e.target.value)
              )
            }
            placeholder="value"
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => removeConstant(k)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addConstant}>
        <Plus className="mr-2 h-4 w-4" />
        Add constant
      </Button>
    </div>
  );
};

// People Field Role Selector Component
const PeopleFieldRoleSelector = ({ selectedRoleIds, onChange }) => {
  const { data: rolesData, isLoading } = useRolesAll();
  // Handle both array and object response formats
  const roles = Array.isArray(rolesData)
    ? rolesData
    : rolesData?.roles || rolesData?.items || [];

  const handleRoleToggle = (roleId) => {
    const roleIdNum = typeof roleId === 'string' ? parseInt(roleId) : roleId;
    const currentIds = Array.isArray(selectedRoleIds) ? selectedRoleIds.map(r => typeof r === 'object' ? r.id : r) : [];
    
    if (currentIds.includes(roleIdNum)) {
      onChange(currentIds.filter(id => id !== roleIdNum));
    } else {
      onChange([...currentIds, roleIdNum]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading roles...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="max-h-48 overflow-auto border rounded-md p-2 space-y-1">
        {roles.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">No roles available</div>
        ) : (
          roles.map((role) => {
            const roleId = role.id;
            const isSelected = Array.isArray(selectedRoleIds) && selectedRoleIds.some(r => (typeof r === 'object' ? r.id : r) === roleId);
            return (
              <div key={roleId} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${roleId}`}
                  checked={isSelected}
                  onCheckedChange={() => handleRoleToggle(roleId)}
                />
                <Label htmlFor={`role-${roleId}`} className="cursor-pointer text-sm flex-1">
                  {role.display_name || role.name || `Role ${roleId}`}
                </Label>
              </div>
            );
          })
        )}
      </div>
      {selectedRoleIds && selectedRoleIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedRoleIds.length} role(s) selected
        </p>
      )}
    </div>
  );
};

export default TrackerEditPage;

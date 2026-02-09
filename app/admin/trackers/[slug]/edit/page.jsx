"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useRoles } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { generateSlug } from "@/utils/slug";
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
  { value: "rag", label: "RAG (Red / Amber / Green)" },
  { value: "calculated", label: "Calculated (Sum / Percentage)" },
];

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

const TrackerEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const [activeTab, setActiveTab] = useState("basic");

  const { data: tracker, isLoading: trackerLoading } = useTracker(slug);
  const updateMutation = useUpdateTracker();
  const { data: rolesData } = useRoles();
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
  const users = usersResponse?.users || usersResponse || [];

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

  const [newField, setNewField] = useState({
    id: "",
    name: "",
    type: "text",
    label: "",
    required: false,
    section: "",
    options: [],
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
            list_view_fields: tracker.tracker_config?.list_view_fields || [],
            create_view_fields: tracker.tracker_config?.create_view_fields || [],
            note_categories: tracker.tracker_config?.note_categories || [],
            constants: tracker.tracker_config?.constants || {},
            table_aggregates: tracker.tracker_config?.table_aggregates || {},
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
      // Log what we're saving to verify list_view_fields is included
      console.log("Saving tracker with list_view_fields:", formData.tracker_config?.list_view_fields);
      
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

    const field = {
      id: fieldId,
      name: fieldId,
      type: newField.type,
      label: newField.label,
      required: newField.required || false,
      section: newField.section || null,
      ...(newField.options.length > 0 && { options: newField.options }),
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
    };

    const updatedFormData = {
      ...formData,
      tracker_fields: {
        ...formData.tracker_fields,
        fields: newFields,
      },
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

  // Section Management
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

    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        sections: [...(prev.tracker_config?.sections || []), section],
      },
    }));

    setNewSection({ id: "", label: "" });
    setSectionIdManuallyEdited(false);
    toast.success("Section added successfully");
  };

  const handleRemoveSection = (index) => {
    const newSections = [...(formData.tracker_config?.sections || [])];
    newSections.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        sections: newSections,
      },
    }));
    toast.success("Section removed");
  };

  const handleEditSection = (index) => {
    const section = formData.tracker_config?.sections[index];
    if (!section) return;
    
    setEditingSectionIndex(index);
    setEditingSection({
      ...section,
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

    const newSections = [...(formData.tracker_config?.sections || [])];
    newSections[editingSectionIndex] = {
      ...editingSection,
    };

    const updatedFormData = {
      ...formData,
      tracker_config: {
        ...formData.tracker_config,
        sections: newSections,
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

    const newSections = [...(formData.tracker_config?.sections || [])];
    const [draggedSection] = newSections.splice(draggedSectionIndex, 1);
    newSections.splice(dropIndex, 0, draggedSection);

    setFormData((prev) => ({
      ...prev,
      tracker_config: {
        ...prev.tracker_config,
        sections: newSections,
      },
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

  const sections = formData.tracker_config?.sections || [];
  const fields = formData.tracker_fields?.fields || [];
  const statuses = formData.tracker_config?.statuses || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/trackers/manage">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Edit Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure fields, sections, statuses, and permissions
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-1 px-1 sm:overflow-x-visible sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-max sm:w-auto">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="fields">Fields ({fields.length})</TabsTrigger>
            <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
            <TabsTrigger value="statuses">Statuses ({statuses.length})</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
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
                        {status}
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
                          <Label htmlFor="edit-field-section">Section (Optional)</Label>
                          <Select
                            value={editingField.section || "none"}
                            onValueChange={(value) =>
                              setEditingField((prev) => ({
                                ...prev,
                                section: value === "none" ? "" : value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No section" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No section</SelectItem>
                              {sections.map((section) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.label}
                                </SelectItem>
                              ))}
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
                            <div className="flex gap-2">
                              <Input
                                placeholder="Label *"
                                value={editingOption.label}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setEditingOption((prev) => ({
                                    ...prev,
                                    label: newLabel,
                                    value: generateFieldIdFromLabel(newLabel),
                                  }));
                                }}
                                className="flex-1"
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
                            {field.section && (
                              <Badge variant="secondary" className="text-xs">
                                Section: {sections.find((s) => s.id === field.section)?.label || field.section}
                              </Badge>
                            )}
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
                          setNewField((prev) => ({ ...prev, type: value }))
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
                      <Label htmlFor="field-section">Section (Optional)</Label>
                      <Select
                        value={newField.section || "none"}
                        onValueChange={(value) =>
                          setNewField((prev) => ({ ...prev, section: value === "none" ? "" : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No section</SelectItem>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.label}
                            </SelectItem>
                          ))}
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
                        <div className="flex gap-2">
                          <Input
                            placeholder="Label *"
                            value={newOption.label}
                            onChange={(e) => {
                              const newLabel = e.target.value;
                              setNewOption((prev) => ({
                                ...prev,
                                label: newLabel,
                                value: generateFieldIdFromLabel(newLabel),
                              }));
                            }}
                            className="flex-1"
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
                          Value will be auto-generated from label (e.g., "First Option" → "first_option")
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

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracker Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Sections */}
              {sections.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Sections</Label>
                  {sections.map((section, index) => {
                    const sectionFields = fields.filter((f) => f.section === section.id);
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
                            <span className="font-medium">{section.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {sectionFields.length} field{sectionFields.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {section.id}
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
                        {status}
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
                  Roles that can access this tracker
                </p>
                <div className="space-y-2">
                  {roles.map((role) => {
                    const isSelected = formData.access_config?.allowed_roles?.includes(role.name) || false;
                    return (
                      <div key={role.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentRoles = formData.access_config?.allowed_roles || [];
                            const newRoles = e.target.checked
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
                          className="rounded"
                        />
                        <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                          {role.display_name || role.name}
                        </Label>
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
  const { data: rolesData, isLoading } = useRoles({ per_page: 100 });
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

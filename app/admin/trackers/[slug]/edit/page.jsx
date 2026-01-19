"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  useTracker,
  useUpdateTracker,
} from "@/hooks/useTrackers";
import { useRoles } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { generateSlug } from "@/utils/slug";
import { toast } from "sonner";

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
  const { hasPermission } = usePermissionsCheck();

  const roles = rolesData || [];
  const users = usersResponse?.users || usersResponse || [];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    is_active: true,
    tracker_config: {
      default_status: "open",
      statuses: ["open", "in_progress", "pending", "resolved", "closed"],
      allow_inline_status_edit: true,
      sections: [],
      list_view_fields: [],
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

  const [newSection, setNewSection] = useState({
    id: "",
    label: "",
  });
  const [sectionIdManuallyEdited, setSectionIdManuallyEdited] = useState(false);
  const [fieldIdManuallyEdited, setFieldIdManuallyEdited] = useState(false);

  const [newStatus, setNewStatus] = useState("");
  const [newOption, setNewOption] = useState({ value: "", label: "" });

  // Load tracker data
  useEffect(() => {
    if (tracker) {
      console.log("Tracker data loaded:", tracker);
      setFormData({
        name: tracker.name || "",
        description: tracker.description || "",
        slug: tracker.slug || "",
        is_active: tracker.is_active !== undefined ? tracker.is_active : true,
        tracker_config: {
          ...(tracker.tracker_config || {
            default_status: "open",
            statuses: ["open", "in_progress", "pending", "resolved", "closed"],
            allow_inline_status_edit: true,
            sections: [],
          }),
          list_view_fields: tracker.tracker_config?.list_view_fields || [],
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

  const handleSave = async () => {
    try {
      // Log what we're saving to verify list_view_fields is included
      console.log("Saving tracker with list_view_fields:", formData.tracker_config?.list_view_fields);
      
      await updateMutation.mutateAsync({
        slug: slug,
        trackerData: formData,
      });
      toast.success("Tracker updated successfully");
      router.push("/admin/trackers/manage");
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
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="fields">Fields ({fields.length})</TabsTrigger>
          <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
          <TabsTrigger value="statuses">Statuses ({statuses.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

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
                    <div
                      key={field.id || index}
                      className="p-4 border rounded-md flex items-center justify-between"
                    >
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveField(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
                    return (
                      <div
                        key={section.id || index}
                        className="p-4 border rounded-md flex items-center justify-between"
                      >
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSection(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
      </Tabs>
    </div>
  );
};

export default TrackerEditPage;

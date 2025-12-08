"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Trash2, Info } from "lucide-react";

// Predefined file type categories for easy selection
const FILE_TYPE_CATEGORIES = {
  images: {
    label: "Images",
    types: [
      { value: "image/jpeg", label: "JPEG (.jpg, .jpeg)" },
      { value: "image/png", label: "PNG (.png)" },
      { value: "image/gif", label: "GIF (.gif)" },
      { value: "image/webp", label: "WebP (.webp)" },
      { value: "image/svg+xml", label: "SVG (.svg)" },
    ],
  },
  documents: {
    label: "Documents",
    types: [
      { value: "application/pdf", label: "PDF (.pdf)" },
      { value: "application/msword", label: "Word (.doc)" },
      { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word (.docx)" },
      { value: "application/vnd.ms-excel", label: "Excel (.xls)" },
      { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel (.xlsx)" },
      { value: "text/plain", label: "Text (.txt)" },
      { value: "application/rtf", label: "RTF (.rtf)" },
    ],
  },
  archives: {
    label: "Archives",
    types: [
      { value: "application/zip", label: "ZIP (.zip)" },
      { value: "application/x-rar-compressed", label: "RAR (.rar)" },
      { value: "application/x-tar", label: "TAR (.tar)" },
      { value: "application/gzip", label: "GZIP (.gz)" },
    ],
  },
  videos: {
    label: "Videos",
    types: [
      { value: "video/mp4", label: "MP4 (.mp4)" },
      { value: "video/quicktime", label: "QuickTime (.mov)" },
      { value: "video/x-msvideo", label: "AVI (.avi)" },
      { value: "video/webm", label: "WebM (.webm)" },
    ],
  },
  audio: {
    label: "Audio",
    types: [
      { value: "audio/mpeg", label: "MP3 (.mp3)" },
      { value: "audio/wav", label: "WAV (.wav)" },
      { value: "audio/ogg", label: "OGG (.ogg)" },
      { value: "audio/mp4", label: "M4A (.m4a)" },
    ],
  },
};
import { useForm, useUpdateForm } from "@/hooks/useForms";
import { useRoles } from "@/hooks/useRoles";
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
  { value: "select", label: "Select (Single)" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "file", label: "File Upload" },
  { value: "json", label: "JSON" },
];

const formTypes = [
  { value: "handover", label: "Handover" },
  { value: "assessment", label: "Assessment" },
  { value: "incident", label: "Incident" },
  { value: "maintenance", label: "Maintenance" },
  { value: "general", label: "General" },
];

const EditFormPage = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params.id;

  const { data: form, isLoading: formLoading } = useForm(formId);
  const updateFormMutation = useUpdateForm();
  const { data: rolesData } = useRoles();
  const roles = rolesData || [];

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (form) {
      setFormData({
        form_name: form.form_name || "",
        form_title: form.form_title || "",
        form_description: form.form_description || "",
        form_type: form.form_type || "general",
        is_active: form.is_active !== undefined ? form.is_active : true,
        is_template: form.is_template !== undefined ? form.is_template : false,
        form_fields: form.form_fields || { fields: [], sections: [] },
        form_config: form.form_config || {
          layout: "single_column",
          submit_button_text: "Submit",
          success_message: "Form submitted successfully",
          allow_draft: false,
          auto_save: false,
          mandatory_completion: false,
          automation: {
            auto_create_tasks: false,
            create_individual_tasks: false,
            task_assignee_role: "",
            due_time_minutes: 30,
            escalation_enabled: false,
          },
        },
        access_config: form.access_config || {
          public_access: false,
          requires_authentication: true,
          allowed_roles: [],
          allowed_users: [],
        },
      });
    }
  }, [form]);

  const [newField, setNewField] = useState({
    field_id: "",
    field_name: "",
    field_type: "text",
    label: "",
    required: false,
    placeholder: "",
    help_text: "",
    options: [],
    validation: {
      min: "",
      max: "",
      min_length: "",
      max_length: "",
      pattern: "",
    },
    // File field specific
    allowed_types: "",
    max_size_mb: "",
    // JSON field specific
    json_schema: "",
  });
  const [newOption, setNewOption] = useState({ value: "", label: "" });
  const [allowAllFileTypes, setAllowAllFileTypes] = useState(false);

  const handleAddOption = () => {
    if (!newOption.value.trim()) {
      toast.error("Option value is required");
      return;
    }
    setNewField({
      ...newField,
      options: [
        ...newField.options,
        {
          value: newOption.value.trim(),
          label: newOption.label.trim() || newOption.value.trim(),
        },
      ],
    });
    setNewOption({ value: "", label: "" });
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...newField.options];
    newOptions.splice(index, 1);
    setNewField({
      ...newField,
      options: newOptions,
    });
  };

  const handleAddField = () => {
    if (!newField.field_id || !newField.label) {
      toast.error("Field ID and Label are required");
      return;
    }

    // For select, radio, and multiselect, require at least one option
    if (
      (newField.field_type === "select" ||
        newField.field_type === "radio" ||
        newField.field_type === "multiselect") &&
      newField.options.length === 0
    ) {
      toast.error(
        `${newField.field_type === "select" ? "Select" : newField.field_type === "multiselect" ? "Multi-select" : "Radio"} fields require at least one option`
      );
      return;
    }

    const field = {
      field_id: newField.field_id,
      field_name: newField.field_name || newField.field_id,
      field_type: newField.field_type,
      label: newField.label,
      required: newField.required,
    };

    // Add placeholder if provided
    if (newField.placeholder) {
      field.placeholder = newField.placeholder;
    }

    // Add help_text if provided
    if (newField.help_text) {
      field.help_text = newField.help_text;
    }

    // Add validation if any validation rules are provided
    const validation = {};
    if (newField.validation.min) validation.min = newField.validation.min;
    if (newField.validation.max) validation.max = newField.validation.max;
    if (newField.validation.min_length)
      validation.min_length = parseInt(newField.validation.min_length);
    if (newField.validation.max_length)
      validation.max_length = parseInt(newField.validation.max_length);
    if (newField.validation.pattern) validation.pattern = newField.validation.pattern;

    if (Object.keys(validation).length > 0) {
      field.validation = validation;
    }

    // Add options for select, radio, and multiselect fields
    if (
      (newField.field_type === "select" ||
        newField.field_type === "radio" ||
        newField.field_type === "multiselect") &&
      newField.options.length > 0
    ) {
      field.options = newField.options;
    }

    // Add file field specific configuration
    if (newField.field_type === "file") {
      const fileValidation = {};
      // If allowAllFileTypes is true or allowed_types is empty, don't set allowed_types
      // (backend will use default validation or allow all)
      if (!allowAllFileTypes && newField.allowed_types) {
        const types = newField.allowed_types
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
        if (types.length > 0) {
          fileValidation.allowed_types = types;
        }
      }
      if (newField.max_size_mb) {
        fileValidation.max_size_mb = parseInt(newField.max_size_mb);
      }
      if (Object.keys(fileValidation).length > 0) {
        field.validation = { ...field.validation, ...fileValidation };
      }
    }

    // Add JSON field specific configuration
    if (newField.field_type === "json" && newField.json_schema) {
      try {
        const schema = JSON.parse(newField.json_schema);
        field.validation = {
          ...field.validation,
          schema: schema,
        };
      } catch (e) {
        toast.error("Invalid JSON schema. Please check the format.");
        return;
      }
    }

    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: [...formData.form_fields.fields, field],
      },
    });

    setNewField({
      field_id: "",
      field_name: "",
      field_type: "text",
      label: "",
      required: false,
      placeholder: "",
      help_text: "",
      options: [],
      validation: {
        min: "",
        max: "",
        min_length: "",
        max_length: "",
        pattern: "",
      },
      allowed_types: "",
      max_size_mb: "",
      json_schema: "",
    });
    setNewOption({ value: "", label: "" });
    setAllowAllFileTypes(false);
  };

  const handleRemoveField = (index) => {
    const newFields = [...formData.form_fields.fields];
    newFields.splice(index, 1);
    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: newFields,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.form_name || !formData.form_title) {
      toast.error("Form name and title are required");
      return;
    }

    try {
      await updateFormMutation.mutateAsync({
        id: formId,
        formData,
      });
      router.push(`/admin/forms/${formId}`);
    } catch (error) {
      console.error("Failed to update form:", error);
    }
  };

  if (formLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/forms/${formId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Form</h1>
          <p className="text-muted-foreground">
            Update form fields and configuration
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Form Builder */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="form_name">Form Name (Internal) *</Label>
                  <Input
                    id="form_name"
                    value={formData.form_name}
                    onChange={(e) =>
                      setFormData({ ...formData, form_name: e.target.value })
                    }
                    required
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Form name cannot be changed after creation
                  </p>
                </div>
                <div>
                  <Label htmlFor="form_title">Form Title (Display) *</Label>
                  <Input
                    id="form_title"
                    value={formData.form_title}
                    onChange={(e) =>
                      setFormData({ ...formData, form_title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="form_description">Description</Label>
                  <Textarea
                    id="form_description"
                    value={formData.form_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="form_type">Form Type</Label>
                    <Select
                      value={formData.form_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, form_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_template"
                      checked={formData.is_template}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_template: checked })
                      }
                    />
                    <Label htmlFor="is_template">Save as Template</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Fields Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Field */}
                <div className="p-4 border rounded-md space-y-4">
                  <h3 className="font-medium">Add New Field</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="field_id">Field ID *</Label>
                      <Input
                        id="field_id"
                        value={newField.field_id}
                        onChange={(e) =>
                          setNewField({ ...newField, field_id: e.target.value })
                        }
                        placeholder="e.g., equipment_name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="field_type">Field Type</Label>
                      <Select
                        value={newField.field_type}
                        onValueChange={(value) =>
                          setNewField({ ...newField, field_type: value })
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
                  </div>
                  <div>
                    <Label htmlFor="field_label">Label *</Label>
                    <Input
                      id="field_label"
                      value={newField.label}
                      onChange={(e) =>
                        setNewField({ ...newField, label: e.target.value })
                      }
                      placeholder="e.g., Equipment Name"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field_required"
                      checked={newField.required}
                      onCheckedChange={(checked) =>
                        setNewField({ ...newField, required: checked })
                      }
                    />
                    <Label htmlFor="field_required">Required</Label>
                  </div>

                  {/* Placeholder */}
                  <div>
                    <Label htmlFor="field_placeholder">Placeholder</Label>
                    <Input
                      id="field_placeholder"
                      value={newField.placeholder}
                      onChange={(e) =>
                        setNewField({ ...newField, placeholder: e.target.value })
                      }
                      placeholder="Enter placeholder text"
                    />
                  </div>

                  {/* Help Text */}
                  <div>
                    <Label htmlFor="field_help_text">Help Text</Label>
                    <Textarea
                      id="field_help_text"
                      value={newField.help_text}
                      onChange={(e) =>
                        setNewField({ ...newField, help_text: e.target.value })
                      }
                      placeholder="Enter help text or instructions"
                      rows={2}
                    />
                  </div>

                  {/* Options for select, radio, and multiselect fields */}
                  {(newField.field_type === "select" ||
                    newField.field_type === "radio" ||
                    newField.field_type === "multiselect") && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label>Options *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={newOption.value}
                          onChange={(e) =>
                            setNewOption({ ...newOption, value: e.target.value })
                          }
                          placeholder="Option value"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddOption();
                            }
                          }}
                        />
                        <Input
                          value={newOption.label}
                          onChange={(e) =>
                            setNewOption({ ...newOption, label: e.target.value })
                          }
                          placeholder="Option label (optional)"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddOption();
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddOption}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                      {newField.options.length > 0 && (
                        <div className="space-y-1">
                          {newField.options.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <span className="text-sm">
                                {option.label || option.value} ({option.value})
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(index)}
                                className="h-6 w-6"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Validation Options */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-medium">Validation</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(newField.field_type === "text" ||
                        newField.field_type === "textarea" ||
                        newField.field_type === "email" ||
                        newField.field_type === "phone") && (
                        <>
                          <div>
                            <Label htmlFor="min_length" className="text-xs">
                              Min Length
                            </Label>
                            <Input
                              id="min_length"
                              type="number"
                              value={newField.validation.min_length}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    min_length: e.target.value,
                                  },
                                })
                              }
                              placeholder="Min length"
                            />
                          </div>
                          <div>
                            <Label htmlFor="max_length" className="text-xs">
                              Max Length
                            </Label>
                            <Input
                              id="max_length"
                              type="number"
                              value={newField.validation.max_length}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    max_length: e.target.value,
                                  },
                                })
                              }
                              placeholder="Max length"
                            />
                          </div>
                        </>
                      )}
                      {(newField.field_type === "number") && (
                        <>
                          <div>
                            <Label htmlFor="min_value" className="text-xs">
                              Min Value
                            </Label>
                            <Input
                              id="min_value"
                              type="number"
                              value={newField.validation.min}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    min: e.target.value,
                                  },
                                })
                              }
                              placeholder="Min value"
                            />
                          </div>
                          <div>
                            <Label htmlFor="max_value" className="text-xs">
                              Max Value
                            </Label>
                            <Input
                              id="max_value"
                              type="number"
                              value={newField.validation.max}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    max: e.target.value,
                                  },
                                })
                              }
                              placeholder="Max value"
                            />
                          </div>
                        </>
                      )}
                      {(newField.field_type === "date") && (
                        <>
                          <div>
                            <Label htmlFor="min_date" className="text-xs">
                              Min Date
                            </Label>
                            <Input
                              id="min_date"
                              type="date"
                              value={newField.validation.min}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    min: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="max_date" className="text-xs">
                              Max Date
                            </Label>
                            <Input
                              id="max_date"
                              type="date"
                              value={newField.validation.max}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    max: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {(newField.field_type === "text" ||
                      newField.field_type === "email" ||
                      newField.field_type === "phone") && (
                      <div>
                        <Label htmlFor="pattern" className="text-xs">
                          Pattern (Regex)
                        </Label>
                        <Input
                          id="pattern"
                          value={newField.validation.pattern}
                          onChange={(e) =>
                            setNewField({
                              ...newField,
                              validation: {
                                ...newField.validation,
                                pattern: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g., ^[A-Za-z\\s]+$"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Regular expression pattern for validation
                        </p>
                      </div>
                    )}
                  </div>

                  {/* File Field Configuration */}
                  {newField.field_type === "file" && (
                    <div className="space-y-4 pt-2 border-t">
                      <Label className="text-sm font-medium">
                        File Configuration
                      </Label>
                      
                      {/* Allow All File Types Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow_all_file_types"
                          checked={allowAllFileTypes}
                          onCheckedChange={(checked) => {
                            setAllowAllFileTypes(checked);
                            if (checked) {
                              setNewField({
                                ...newField,
                                allowed_types: "",
                              });
                            }
                          }}
                        />
                        <Label htmlFor="allow_all_file_types" className="text-sm font-normal cursor-pointer">
                          Allow all file types (no restrictions)
                        </Label>
                      </div>

                      {/* File Type Selection */}
                      {!allowAllFileTypes && (
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">
                            Allowed File Types
                          </Label>
                          <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3">
                            {Object.entries(FILE_TYPE_CATEGORIES).map(([categoryKey, category]) => {
                              const selectedTypes = newField.allowed_types
                                ? newField.allowed_types.split(",").map((t) => t.trim())
                                : [];
                              
                              const categoryTypes = category.types.map((t) => t.value);
                              const allCategorySelected = categoryTypes.every((type) =>
                                selectedTypes.includes(type)
                              );

                              const handleCategoryToggle = (checked) => {
                                let newTypes = [...selectedTypes];
                                if (checked) {
                                  // Add all category types
                                  categoryTypes.forEach((type) => {
                                    if (!newTypes.includes(type)) {
                                      newTypes.push(type);
                                    }
                                  });
                                } else {
                                  // Remove all category types
                                  newTypes = newTypes.filter((type) => !categoryTypes.includes(type));
                                }
                                setNewField({
                                  ...newField,
                                  allowed_types: newTypes.join(", "),
                                });
                              };

                              const handleTypeToggle = (typeValue, checked) => {
                                let newTypes = [...selectedTypes];
                                if (checked) {
                                  if (!newTypes.includes(typeValue)) {
                                    newTypes.push(typeValue);
                                  }
                                } else {
                                  newTypes = newTypes.filter((t) => t !== typeValue);
                                }
                                setNewField({
                                  ...newField,
                                  allowed_types: newTypes.join(", "),
                                });
                              };

                              return (
                                <div key={categoryKey} className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`category-${categoryKey}`}
                                      checked={allCategorySelected}
                                      onCheckedChange={handleCategoryToggle}
                                    />
                                    <Label
                                      htmlFor={`category-${categoryKey}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {category.label}
                                    </Label>
                                  </div>
                                  <div className="ml-6 space-y-1.5">
                                    {category.types.map((type) => (
                                      <div key={type.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`type-${type.value}`}
                                          checked={selectedTypes.includes(type.value)}
                                          onCheckedChange={(checked) =>
                                            handleTypeToggle(type.value, checked)
                                          }
                                        />
                                        <Label
                                          htmlFor={`type-${type.value}`}
                                          className="text-xs font-normal cursor-pointer"
                                        >
                                          {type.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {newField.allowed_types && (
                            <div className="text-xs text-muted-foreground">
                              Selected: {newField.allowed_types.split(",").length} type(s)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Max File Size */}
                      <div>
                        <Label htmlFor="max_size_mb" className="text-xs">
                          Max File Size (MB)
                        </Label>
                        <Input
                          id="max_size_mb"
                          type="number"
                          min="0"
                          step="0.1"
                          value={newField.max_size_mb}
                          onChange={(e) =>
                            setNewField({
                              ...newField,
                              max_size_mb: e.target.value,
                            })
                          }
                          placeholder="e.g., 5 (leave empty for no limit)"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum file size in megabytes. Leave empty for no size limit.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* JSON Field Configuration */}
                  {newField.field_type === "json" && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-sm font-medium">
                        JSON Schema Validation
                      </Label>
                      <Textarea
                        id="json_schema"
                        value={newField.json_schema}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            json_schema: e.target.value,
                          })
                        }
                        placeholder='{"type": "object", "properties": {"key1": {"type": "string"}}}'
                        rows={6}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter JSON schema for validation (optional)
                      </p>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    onClick={handleAddField}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>

                {/* Existing Fields */}
                {formData.form_fields.fields.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      Fields ({formData.form_fields.fields.length})
                    </h3>
                    {formData.form_fields.fields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{field.label}</span>
                          <Badge variant="outline">{field.field_type}</Badge>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No fields added yet. Add your first field above.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Configuration */}
          <div className="space-y-6">
            {/* Form Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Form Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="submit_button_text">Submit Button Text</Label>
                  <Input
                    id="submit_button_text"
                    value={formData.form_config.submit_button_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          submit_button_text: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="success_message">Success Message</Label>
                  <Textarea
                    id="success_message"
                    value={formData.form_config.success_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          success_message: e.target.value,
                        },
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_draft"
                    checked={formData.form_config.allow_draft}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          allow_draft: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="allow_draft">Allow Draft</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_save"
                    checked={formData.form_config.auto_save}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          auto_save: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="auto_save">Auto-save</Label>
                </div>
              </CardContent>
            </Card>

            {/* Automation Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_create_tasks"
                    checked={formData.form_config.automation?.auto_create_tasks || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          automation: {
                            ...formData.form_config.automation,
                            auto_create_tasks: checked,
                            // Reset create_individual_tasks if auto_create_tasks is disabled
                            create_individual_tasks: checked
                              ? formData.form_config.automation?.create_individual_tasks || false
                              : false,
                          },
                        },
                      })
                    }
                  />
                  <Label htmlFor="auto_create_tasks">Auto-create tasks</Label>
                </div>

                {formData.form_config.automation?.auto_create_tasks && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="create_individual_tasks"
                        checked={formData.form_config.automation?.create_individual_tasks || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                create_individual_tasks: checked,
                              },
                            },
                          })
                        }
                      />
                      <div className="flex-1">
                        <Label htmlFor="create_individual_tasks" className="cursor-pointer">
                          Create individual tasks
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Each user in the role gets their own task
                        </p>
                      </div>
                    </div>

                    {formData.form_config.automation?.create_individual_tasks ? (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Individual Tasks Mode
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Each user in the assigned role will receive their own separate task
                              to complete individually.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Collaborative Task Mode
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                              One task will be created and assigned to the role for collaborative
                              completion.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="task_assignee_role">Task Assignee Role</Label>
                      <Select
                        value={formData.form_config.automation?.task_assignee_role || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                task_assignee_role: value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger id="task_assignee_role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name || role.slug}>
                              {role.display_name || role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="due_time_minutes">Due Time (minutes)</Label>
                      <Input
                        id="due_time_minutes"
                        type="number"
                        min="0"
                        value={formData.form_config.automation?.due_time_minutes || 30}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                due_time_minutes: parseInt(e.target.value) || 30,
                              },
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="escalation_enabled"
                        checked={formData.form_config.automation?.escalation_enabled || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                escalation_enabled: checked,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="escalation_enabled">Escalation enabled</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Link href={`/admin/forms/${formId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateFormMutation.isPending}>
            {updateFormMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditFormPage;


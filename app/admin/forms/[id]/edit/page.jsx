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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Info, 
  Edit2,
  Type,
  GripVertical,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  List,
  Upload,
  FileText,
  Image,
  Minus,
  FileDown,
  PenTool,
  Hash,
  AlignLeft,
  Play
} from "lucide-react";

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
import { generateSlug } from "@/utils/slug";
import { useRoles, useCreateRole } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { useActiveFormTypes } from "@/hooks/useFormTypes";
import { useUploadFile } from "@/hooks/useProfile";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, X, Tag } from "lucide-react";
import UserMentionSelector from "@/components/UserMentionSelector";

// Helper function to generate field ID from label
const generateFieldIdFromLabel = (label) => {
  if (!label) return '';
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
};

// Helper function to generate random field ID for display-only fields
const generateDisplayFieldId = (fieldType) => {
  const prefix = fieldType === 'text_block' ? 'txt' : 
                 fieldType === 'image_block' ? 'img' : 
                 fieldType === 'line_break' ? 'line' : 
                 fieldType === 'page_break' ? 'page' : 
                 fieldType === 'download_link' ? 'download' : 'display';
  const random = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`;
};

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
  { value: "signature", label: "Signature" },
  // Display-only field types
  { value: "text_block", label: "Text Block (Display Only)" },
  { value: "image_block", label: "Image Block (Display Only)" },
  { value: "youtube_video_embed", label: "YouTube Video Embed (Display Only)" },
  { value: "line_break", label: "Line Break (Display Only)" },
  { value: "page_break", label: "Page Break (Display Only)" },
  { value: "download_link", label: "Download Link (Display Only)" },
];

// Form types are now loaded dynamically from API

const EditFormPage = () => {
  const params = useParams();
  const router = useRouter();
  const formSlug = params.id || params.slug;

  const { data: form, isLoading: formLoading } = useForm(formSlug);
  const updateFormMutation = useUpdateForm();
  const { data: rolesData } = useRoles();
  const createRoleMutation = useCreateRole();
  const { data: usersResponse } = useUsers();
  const uploadFileMutation = useUploadFile({ silent: true });
  const { data: activeFormTypes = [], isLoading: isLoadingFormTypes } = useActiveFormTypes();
  const roles = rolesData || [];
  const users = usersResponse?.users || usersResponse || [];

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
        slug: form.slug || "",
        form_fields: form.form_fields || { fields: [], sections: [] },
        form_config: form.form_config || {
          layout: "single_column",
          submit_button_text: "Submit",
          success_message: "Form submitted successfully",
          allow_draft: false,
          auto_save: false,
          mandatory_completion: false,
          categories: [],
          statuses: [],
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
          view_submissions_roles: [],
          view_submissions_users: [],
        },
      });

      // Set assignment state from form data
      if (form.assigned_to_role_id) {
        setAssignmentMode("role");
        setAssignedToRoleId(form.assigned_to_role_id.toString());
        setSelectedUserIds([]);
      } else if (form.assigned_user_ids && form.assigned_user_ids.length > 0) {
        setAssignmentMode("users");
        setSelectedUserIds(form.assigned_user_ids);
        setAssignedToRoleId("");
      } else {
        setAssignmentMode("none");
        setAssignedToRoleId("");
        setSelectedUserIds([]);
      }

      setCreateIndividualAssignments(form.create_individual_assignments || false);
      
      // Initialize view submissions permissions
      setViewSubmissionsRoleIds(
        form.access_config?.view_submissions_roles || []
      );
      setViewSubmissionsUserIds(
        form.access_config?.view_submissions_users || []
      );
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
    // Display-only field specific
    content: "", // for text_block
    image_url: "", // for image_block
    image_file: null, // for image_block (uploaded file)
    image_file_id: null, // for image_block (uploaded file ID after upload)
    alt_text: "", // for image_block and youtube_video_embed
    video_url: "", // for youtube_video_embed
    download_url: "", // for download_link
    // Conditional visibility
    conditional_visibility: null, // { depends_on_field, show_when, value }
    // File expiry date support
    file_expiry_date: false, // Enable expiry date for file fields
  });
  const [newOption, setNewOption] = useState({ value: "", label: "" });
  const [allowAllFileTypes, setAllowAllFileTypes] = useState(false);

  // Assignment state
  const [assignmentMode, setAssignmentMode] = useState("none"); // "none", "role", "users"
  const [assignedToRoleId, setAssignedToRoleId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [createIndividualAssignments, setCreateIndividualAssignments] = useState(false);
  
  // View submissions permissions state
  const [viewSubmissionsRoleIds, setViewSubmissionsRoleIds] = useState([]);
  const [viewSubmissionsUserIds, setViewSubmissionsUserIds] = useState([]);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  
  // Category input state
  const [newCategoryValue, setNewCategoryValue] = useState("");
  
  // Status input state
  const [newStatusValue, setNewStatusValue] = useState("");
  const [roleFormData, setRoleFormData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    priority: 50,
  });

  const handleUserSelectionChange = (newSelection) => {
    setSelectedUserIds(newSelection);
  };

  const handleCreateRole = async () => {
    if (!roleFormData.displayName || !roleFormData.roleName) {
      return;
    }

    try {
      const result = await createRoleMutation.mutateAsync({
        display_name: roleFormData.displayName,
        name: roleFormData.roleName,
        description: roleFormData.description,
        priority: roleFormData.priority,
      });
      setIsCreateRoleModalOpen(false);
      setRoleFormData({
        displayName: "",
        roleName: "",
        description: "",
        priority: 50,
      });
      // Auto-select the newly created role
      if (result && result.id) {
        setAssignedToRoleId(result.id.toString());
      }
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

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
    // Display-only field types that auto-generate field_id
    const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];
    const isDisplayOnly = displayOnlyTypes.includes(newField.field_type);

    // Auto-generate field_id if not provided
    let fieldId = newField.field_id;
    if (!fieldId) {
      if (isDisplayOnly) {
        // For display-only fields, generate random ID
        fieldId = generateDisplayFieldId(newField.field_type);
      } else if (newField.label) {
        // For regular fields, generate from label
        fieldId = generateFieldIdFromLabel(newField.label);
        if (!fieldId) {
          // Fallback if label doesn't generate valid ID
          fieldId = `field_${Date.now()}`;
        }
      } else {
        // No label provided, require manual field_id
        toast.error("Label is required (Field ID will be auto-generated from label)");
        return;
      }
    }

    // For regular fields, require label
    if (!isDisplayOnly && !newField.label) {
      toast.error("Label is required");
      return;
    }

    // For text_block, require content
    if (newField.field_type === 'text_block' && !newField.content) {
      toast.error("Content is required for text block");
      return;
    }

    // For image_block, require image_url (download_url from upload or direct URL)
    if (newField.field_type === 'image_block' && !newField.image_url) {
      toast.error("Either Image URL or uploaded image is required for image block");
      return;
    }

    // For youtube_video_embed, require video_url
    if (newField.field_type === 'youtube_video_embed' && !newField.video_url) {
      toast.error("YouTube video URL is required for YouTube video embed");
      return;
    }

    // For download_link, require download_url
    if (newField.field_type === 'download_link' && !newField.download_url) {
      toast.error("Download URL is required for download link");
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
      field_id: fieldId,
      field_name: fieldId, // Auto-generate from field_id
      field_type: newField.field_type,
      label: newField.label || undefined,
      // Display-only fields don't have required property
      ...(isDisplayOnly ? {} : { required: newField.required }),
    };

    // Add display-only field properties
    if (newField.field_type === 'text_block') {
      field.content = newField.content;
    } else if (newField.field_type === 'image_block') {
      // For image_block, use image_url (download_url from upload or direct URL)
      if (newField.image_url) {
        field.image_url = newField.image_url;
      }
      if (newField.alt_text) {
        field.alt_text = newField.alt_text;
      }
    } else if (newField.field_type === 'youtube_video_embed') {
      // For youtube_video_embed, use video_url and alt_text
      if (newField.video_url) {
        field.video_url = newField.video_url;
      }
      if (newField.alt_text) {
        field.alt_text = newField.alt_text;
      }
    } else if (newField.field_type === 'download_link') {
      field.download_url = newField.download_url;
    }

    // Add conditional visibility
    if (newField.conditional_visibility && newField.conditional_visibility.depends_on_field) {
      field.conditional_visibility = newField.conditional_visibility;
    }

    // Add file expiry date support
    if (newField.field_type === 'file' && newField.file_expiry_date) {
      field.file_expiry_date = true;
    }

    // Add placeholder if provided (not for display-only fields)
    if (!isDisplayOnly && newField.placeholder) {
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

      // Save field_options for file fields (including allowMultiple)
      if (newField.field_options) {
        field.field_options = newField.field_options;
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

  // Drag and drop handlers for reordering fields
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

    const newFields = [...formData.form_fields.fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: newFields,
      },
    });

    setDraggedIndex(null);
    toast.success("Field order updated");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.form_name || !formData.form_title) {
      toast.error("Form name and title are required");
      return;
    }

    // Validate form_name format (should already be valid, but double-check)
    if (formData.form_name && !/^[a-z0-9_-]+$/.test(formData.form_name)) {
      toast.error("Form name contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.");
      return;
    }

    // Auto-generate slug from form_title if not provided or if title changed
    if (!formData.slug && formData.form_title) {
      formData.slug = generateSlug(formData.form_title);
    } else if (formData.form_title && formData.slug) {
      // Regenerate slug if title changed (optional - you might want to keep existing slug)
      // For now, we'll only generate if slug is missing
    }

    try {
      const submitData = { ...formData };

      // Add assignment fields based on mode
      if (assignmentMode === "role" && assignedToRoleId) {
        submitData.assigned_to_role_id = parseInt(assignedToRoleId);
        submitData.assigned_user_ids = [];
        submitData.create_individual_assignments = false;
      } else if (assignmentMode === "users" && selectedUserIds.length > 0) {
        submitData.assigned_user_ids = selectedUserIds;
        submitData.create_individual_assignments = createIndividualAssignments;
        submitData.assigned_to_role_id = null;
      } else {
        // Clear assignments
        submitData.assigned_to_role_id = null;
        submitData.assigned_user_ids = [];
        submitData.create_individual_assignments = false;
      }

      // Add view submissions permissions to access_config
      submitData.access_config = {
        ...submitData.access_config,
        view_submissions_roles: viewSubmissionsRoleIds,
        view_submissions_users: viewSubmissionsUserIds,
      };

      await updateFormMutation.mutateAsync({
        slug: formSlug,
        formData: submitData,
      });
      router.push(`/admin/forms/${formSlug}`);
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
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Form</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
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
                        {isLoadingFormTypes ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : activeFormTypes.length === 0 ? (
                          <SelectItem value="none" disabled>No form types available</SelectItem>
                        ) : (
                          activeFormTypes
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map((formType) => (
                              <SelectItem key={formType.name} value={formType.name}>
                                <div className="flex items-center gap-2">
                                  {formType.icon && <span>{formType.icon}</span>}
                                  <span>{formType.display_name || formType.name}</span>
                                </div>
                              </SelectItem>
                            ))
                        )}
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
                  
                  {/* Field Type Selection */}
                  <div>
                    <Label htmlFor="field_type">Field Type *</Label>
                    <Select
                      value={newField.field_type}
                      onValueChange={(value) => {
                        const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];
                        const isDisplayOnly = displayOnlyTypes.includes(value);
                        setNewField({ 
                          ...newField, 
                          field_type: value,
                          // Reset field_id when type changes (will be auto-generated)
                          field_id: isDisplayOnly ? '' : newField.field_id
                        });
                      }}
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

                  {/* Display-only field descriptions */}
                  {['line_break', 'page_break'].includes(newField.field_type) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {newField.field_type === 'line_break' ? (
                            <div className="text-2xl">─</div>
                          ) : (
                            <div className="text-2xl">📄</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">
                            {newField.field_type === 'line_break' ? 'Line Break' : 'Page Break'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {newField.field_type === 'line_break' 
                              ? 'This will render as a horizontal line separator in the form. No additional configuration needed.'
                              : 'This will create a page break for multi-page forms. Users will see Previous/Next buttons and a progress indicator when filling out the form.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Label - required for most fields */}
                  {!['line_break', 'page_break'].includes(newField.field_type) && (
                    <div>
                      <Label htmlFor="field_label">
                        Label {!['text_block', 'image_block', 'download_link'].includes(newField.field_type) && '*'}
                      </Label>
                      <Input
                        id="field_label"
                        value={newField.label}
                        onChange={(e) => {
                          const label = e.target.value;
                          // Auto-generate field_id from label for regular fields
                          const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];
                          const isDisplayOnly = displayOnlyTypes.includes(newField.field_type);
                          const autoFieldId = !isDisplayOnly && label ? generateFieldIdFromLabel(label) : newField.field_id;
                          setNewField({ 
                            ...newField, 
                            label: label,
                            field_id: autoFieldId || newField.field_id
                          });
                        }}
                        placeholder={
                          ['text_block', 'image_block', 'download_link'].includes(newField.field_type)
                            ? "Optional label for this display element"
                            : "e.g., Equipment Name (Field ID will be auto-generated)"
                        }
                      />
                      {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && newField.label && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Field ID: <code className="px-1 py-0.5 bg-muted rounded text-xs">{generateFieldIdFromLabel(newField.label) || 'Will be generated'}</code>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Field ID - show as read-only for auto-generated, editable override */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && newField.label && (
                    <div>
                      <Label htmlFor="field_id">Field ID (Auto-generated, click to override)</Label>
                      <Input
                        id="field_id"
                        value={newField.field_id || generateFieldIdFromLabel(newField.label)}
                        onChange={(e) =>
                          setNewField({ ...newField, field_id: e.target.value })
                        }
                        placeholder="Auto-generated from label"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically generated from label. You can override it if needed.
                      </p>
                    </div>
                  )}
                  
                  {/* Required checkbox - hidden for display-only fields */}
                  {!['text_block', 'image_block', 'line_break', 'page_break'].includes(newField.field_type) && (
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
                  )}

                  {/* Placeholder - hidden for display-only fields */}
                  {!['text_block', 'image_block', 'line_break', 'page_break'].includes(newField.field_type) && (
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
                  )}

                  {/* Help Text - only show for fields that use it */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && (
                    <div>
                      <Label htmlFor="field_help_text">Help Text (Optional)</Label>
                      <Textarea
                        id="field_help_text"
                        value={newField.help_text}
                        onChange={(e) =>
                          setNewField({ ...newField, help_text: e.target.value })
                        }
                        placeholder={
                          ['boolean', 'checkbox'].includes(newField.field_type)
                            ? "This text will appear next to the checkbox"
                            : "Additional instructions or guidance for users (shown as placeholder or helper text)"
                        }
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {['boolean', 'checkbox'].includes(newField.field_type)
                          ? "This text will be displayed as the checkbox label"
                          : "This text appears as placeholder text or helper text below the field"}
                      </p>
                    </div>
                  )}

                  {/* Text Block Configuration */}
                  {newField.field_type === "text_block" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>Text Block:</strong> Use the visual editor below to format your text content. You can add images, links, and apply various formatting options.
                        </p>
                      </div>
                      <Label htmlFor="text_block_content" className="text-sm font-medium">
                        Content *
                      </Label>
                      <RichTextEditor
                        value={newField.content}
                        onChange={(content) =>
                          setNewField({ ...newField, content })
                        }
                        placeholder="Enter text content..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Use the toolbar above to format your text. You can add images, links, lists, and apply various text formatting options.
                      </p>
                    </div>
                  )}

                  {/* Image Block Configuration */}
                  {newField.field_type === "image_block" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>Image Block:</strong> This will display an image in the form. You can provide a direct URL or upload an image file.
                        </p>
                      </div>
                      <Label className="text-sm font-medium">Image Configuration</Label>
                      
                      {/* Tabs for Upload vs URL */}
                      <Tabs defaultValue={newField.image_file_id ? "upload" : "url"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="url">Direct URL</TabsTrigger>
                          <TabsTrigger value="upload">Upload Image</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="url" className="space-y-2">
                          <div>
                            <Label htmlFor="image_block_url" className="text-xs">
                              Image URL *
                            </Label>
                            <Input
                              id="image_block_url"
                              value={newField.image_url}
                              onChange={(e) =>
                                setNewField({ 
                                  ...newField, 
                                  image_url: e.target.value,
                                  image_file: null,
                                  image_file_id: null
                                })
                              }
                              placeholder="https://example.com/image.png"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the full URL to the image
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="upload" className="space-y-2">
                          <div>
                            <Label htmlFor="image_block_file" className="text-xs">
                              Upload Image *
                            </Label>
                            <Input
                              id="image_block_file"
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setNewField({ 
                                      ...newField, 
                                      image_file: file,
                                      image_url: "" // Clear URL when uploading
                                    });
                                    
                                    // Upload the image without form_id or field_id
                                    // The endpoint will detect it's an image file and apply image validation
                                    const uploadResult = await uploadFileMutation.mutateAsync({
                                      file: file
                                      // No form_id or field_id needed for image_block fields
                                    });
                                    
                                    // Get API base URL from environment or use default
                                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://melode-api-prod.onrender.com/api/v1';
                                    
                                    // Helper to ensure URL is absolute (uses backend API URL)
                                    const ensureAbsoluteUrl = (url) => {
                                      if (!url) return null;
                                      // If already absolute (starts with http:// or https://), return as is
                                      if (/^https?:\/\//i.test(url)) {
                                        return url;
                                      }
                                      // If relative, check if it already starts with /api/v1
                                      // The apiBaseUrl already includes /api/v1, so we need to handle this carefully
                                      let cleanPath = url.startsWith('/') ? url : `/${url}`;
                                      
                                      // If path already starts with /api/v1, use it as is with the base URL
                                      // Otherwise, append it to the base URL
                                      if (cleanPath.startsWith('/api/v1/')) {
                                        // Extract the path after /api/v1
                                        const pathAfterApi = cleanPath.substring('/api/v1'.length);
                                        // Ensure apiBaseUrl doesn't end with / to avoid double slashes
                                        const cleanBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
                                        return `${cleanBase}${pathAfterApi}`;
                                      } else {
                                        // Path doesn't start with /api/v1, append directly
                                        const cleanBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
                                        return `${cleanBase}${cleanPath}`;
                                      }
                                    };
                                    
                                    // Use file_reference_url for storage (permanent reference)
                                    // Backend will replace this with fresh pre-signed URLs when serving
                                    const fileReferenceUrl = ensureAbsoluteUrl(uploadResult.file_reference_url) || 
                                                             ensureAbsoluteUrl(uploadResult.file_reference) ||
                                                             (uploadResult.id ? `${apiBaseUrl}/files/${uploadResult.id}/download` : null) ||
                                                             (uploadResult.file_id ? `${apiBaseUrl}/files/${uploadResult.file_id}/download` : null);
                                    
                                    // Fallback to download_url if file_reference_url not available
                                    const imageUrl = fileReferenceUrl || uploadResult.download_url || uploadResult.url || uploadResult.file_url;
                                    
                                    if (!imageUrl) {
                                      throw new Error("No file reference URL or download URL received from upload");
                                    }
                                    
                                    setNewField({ 
                                      ...newField, 
                                      image_file: file,
                                      image_url: imageUrl // Store file_reference_url (backend handles URL replacement)
                                    });
                                    
                                    toast.success("Image uploaded successfully");
                                  } catch (error) {
                                    console.error("Failed to upload image:", error);
                                    toast.error("Failed to upload image", {
                                      description: error.response?.data?.detail || error.message
                                    });
                                    setNewField({ 
                                      ...newField, 
                                      image_file: null,
                                      image_url: ""
                                    });
                                  }
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload an image file (JPG, PNG, GIF, etc.)
                            </p>
                            {newField.image_file && (
                              <div className="mt-2 p-2 bg-muted rounded-md">
                                <p className="text-xs font-medium">Selected: {newField.image_file.name}</p>
                                {newField.image_file_id && (
                                  <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                                )}
                                {uploadFileMutation.isPending && (
                                  <p className="text-xs text-muted-foreground">Uploading...</p>
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <div>
                        <Label htmlFor="image_block_alt" className="text-xs">
                          Alt Text
                        </Label>
                        <Input
                          id="image_block_alt"
                          value={newField.alt_text}
                          onChange={(e) =>
                            setNewField({ ...newField, alt_text: e.target.value })
                          }
                          placeholder="Descriptive text for accessibility"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional: Alt text for screen readers and accessibility
                        </p>
                      </div>
                    </div>
                  )}

                  {/* YouTube Video Embed Configuration */}
                  {newField.field_type === "youtube_video_embed" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>YouTube Video Embed:</strong> This will display a YouTube video embedded in the form. Provide a YouTube video URL (watch URL or short URL).
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="youtube_video_url" className="text-sm font-medium">
                          YouTube Video URL *
                        </Label>
                        <Input
                          id="youtube_video_url"
                          value={newField.video_url || ''}
                          onChange={(e) =>
                            setNewField({ ...newField, video_url: e.target.value })
                          }
                          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="youtube_video_alt" className="text-xs">
                          Alt Text
                        </Label>
                        <Input
                          id="youtube_video_alt"
                          value={newField.alt_text || ''}
                          onChange={(e) =>
                            setNewField({ ...newField, alt_text: e.target.value })
                          }
                          placeholder="Descriptive text for accessibility"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional: Alt text for screen readers and accessibility
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Line Break and Page Break Info */}
                  {(newField.field_type === "line_break" || newField.field_type === "page_break") && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {newField.field_type === "line_break" 
                          ? "This field will render as a horizontal line separator."
                          : "This field will render as a page break for multi-page forms."}
                      </p>
                    </div>
                  )}

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

                  {/* Validation Options - only show when relevant and when there are validation fields */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link', 'boolean', 'signature'].includes(newField.field_type) && 
                   (['text', 'textarea', 'email', 'phone', 'number', 'date'].includes(newField.field_type) ||
                    newField.validation.min || 
                    newField.validation.max || 
                    newField.validation.min_length || 
                    newField.validation.max_length || 
                    newField.validation.pattern) && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Validation (Optional)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewField({
                            ...newField,
                            validation: {
                              min: "",
                              max: "",
                              min_length: "",
                              max_length: "",
                              pattern: "",
                            }
                          });
                        }}
                        className="h-6 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
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
                      <p className="text-xs text-muted-foreground">
                        Leave empty if no validation is needed
                      </p>
                    </div>
                  )}

                  {/* File Field Configuration */}
                  {newField.field_type === "file" && (
                    <div className="space-y-4 pt-2 border-t">
                      <Label className="text-sm font-medium">
                        File Configuration
                      </Label>

                      {/* Allow Multiple Files Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow_multiple_files"
                          checked={newField.field_options?.allowMultiple || false}
                          onCheckedChange={(checked) => {
                            setNewField({
                              ...newField,
                              field_options: {
                                ...newField.field_options,
                                allowMultiple: checked,
                              },
                            });
                          }}
                        />
                        <Label htmlFor="allow_multiple_files" className="text-sm font-normal cursor-pointer">
                          Allow multiple file uploads
                        </Label>
                      </div>

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

                  {/* Download Link Configuration */}
                  {newField.field_type === "download_link" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div>
                        <Label htmlFor="download_link_url" className="text-sm font-medium">
                          Download URL *
                        </Label>
                        <Input
                          id="download_link_url"
                          value={newField.download_url}
                          onChange={(e) =>
                            setNewField({ ...newField, download_url: e.target.value })
                          }
                          placeholder="https://example.com/document.pdf"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the full URL to the file or document that users can download
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Conditional Visibility Configuration */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-sm font-medium">Conditional Visibility (Optional)</Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="depends_on_field" className="text-xs">
                            Show this field when
                          </Label>
                          <Select
                            value={newField.conditional_visibility?.depends_on_field || ''}
                            onValueChange={(value) =>
                              setNewField({
                                ...newField,
                                conditional_visibility: {
                                  ...newField.conditional_visibility,
                                  depends_on_field: value || null,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.form_fields.fields
                                .filter(f => f.field_id !== newField.field_id && 
                                  !['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(f.field_type?.toLowerCase()))
                                .map((f) => (
                                  <SelectItem key={f.field_id || f.field_name} value={f.field_id || f.field_name}>
                                    {f.label || f.field_id || f.field_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {newField.conditional_visibility?.depends_on_field && (
                          <>
                            <div>
                              <Label htmlFor="show_when" className="text-xs">
                                Condition
                              </Label>
                              <Select
                                value={newField.conditional_visibility?.show_when || ''}
                                onValueChange={(value) =>
                                  setNewField({
                                    ...newField,
                                    conditional_visibility: {
                                      ...newField.conditional_visibility,
                                      show_when: value || null,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Not Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="is_empty">Is Empty</SelectItem>
                                  <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {newField.conditional_visibility?.show_when && 
                             ['equals', 'not_equals', 'contains'].includes(newField.conditional_visibility.show_when) && (
                              <div>
                                <Label htmlFor="conditional_value" className="text-xs">
                                  Value
                                </Label>
                                <Input
                                  id="conditional_value"
                                  value={newField.conditional_visibility?.value || ''}
                                  onChange={(e) =>
                                    setNewField({
                                      ...newField,
                                      conditional_visibility: {
                                        ...newField.conditional_visibility,
                                        value: e.target.value || null,
                                      },
                                    })
                                  }
                                  placeholder="Enter value to match"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This field will only be visible when the condition is met
                      </p>
                    </div>
                  )}

                  {/* File Expiry Date Support */}
                  {newField.field_type === "file" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="file_expiry_date"
                          checked={newField.file_expiry_date || false}
                          onCheckedChange={(checked) =>
                            setNewField({ ...newField, file_expiry_date: checked })
                          }
                        />
                        <Label htmlFor="file_expiry_date" className="text-sm font-normal">
                          Require expiry date for uploaded files
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When enabled, users will be required to provide an expiry date when uploading files (e.g., for certificates)
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
                    {formData.form_fields.fields.map((field, index) => {
                      const getFieldIcon = (type) => {
                        const icons = {
                          text: Type,
                          email: Mail,
                          phone: Phone,
                          date: Calendar,
                          datetime: Calendar,
                          number: Hash,
                          textarea: AlignLeft,
                          select: List,
                          multiselect: List,
                          radio: List,
                          boolean: CheckSquare,
                          checkbox: CheckSquare,
                          file: Upload,
                          signature: PenTool,
                          text_block: FileText,
                          image_block: Image,
                          youtube_video_embed: Play,
                          line_break: Minus,
                          page_break: FileText,
                          download_link: FileDown,
                          json: FileText,
                        };
                        return icons[type?.toLowerCase()] || Type;
                      };
                      const FieldIcon = getFieldIcon(field.field_type);
                      const isDisplayOnly = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'].includes(field.field_type?.toLowerCase());
                      
                      return (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`group flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
                            draggedIndex === index ? 'opacity-50 cursor-grabbing' : 'cursor-grab'
                          } ${
                            dragOverIndex === index && draggedIndex !== index ? 'border-primary border-2 bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <FieldIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {field.label || field.field_id || `Field ${index + 1}`}
                              </span>
                              <Badge variant="outline" className="text-xs font-normal">
                                {field.field_type}
                              </Badge>
                              {field.required && !isDisplayOnly && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              {isDisplayOnly && (
                                <Badge variant="secondary" className="text-xs">
                                  Display Only
                                </Badge>
                              )}
                            </div>
                            {field.help_text && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {field.help_text}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                // Load field into editor
                                const fieldToEdit = formData.form_fields.fields[index];
                                setNewField({
                                  field_id: fieldToEdit.field_id,
                                  field_type: fieldToEdit.field_type,
                                  label: fieldToEdit.label || '',
                                  required: fieldToEdit.required || false,
                                  placeholder: fieldToEdit.placeholder || '',
                                  help_text: fieldToEdit.help_text || '',
                                  options: fieldToEdit.options || [],
                                  validation: fieldToEdit.validation || {},
                                  field_options: fieldToEdit.field_options || {},
                                  content: fieldToEdit.content || '',
                                  image_url: fieldToEdit.image_url || '',
                                  image_file_id: fieldToEdit.image_file_id || null,
                                  alt_text: fieldToEdit.alt_text || '',
                                  download_url: fieldToEdit.download_url || '',
                                  conditional_visibility: fieldToEdit.conditional_visibility || null,
                                  file_expiry_date: fieldToEdit.file_expiry_date || false,
                                  json_schema: fieldToEdit.validation?.schema ? JSON.stringify(fieldToEdit.validation.schema, null, 2) : '',
                                  allowed_types: fieldToEdit.validation?.allowed_types ? (Array.isArray(fieldToEdit.validation.allowed_types) ? fieldToEdit.validation.allowed_types.join(', ') : fieldToEdit.validation.allowed_types) : '',
                                  max_size_mb: fieldToEdit.validation?.max_size_mb || '',
                                });
                                // Remove the field
                                handleRemoveField(index);
                              }}
                              title="Edit field"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove "${field.label || field.field_id || `Field ${index + 1}`}"?`)) {
                                  handleRemoveField(index);
                                  toast.success("Field removed", {
                                    description: `"${field.label || field.field_id}" has been removed from the form.`,
                                  });
                                }
                              }}
                              title="Delete field"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="categories">Categories</Label>
                  <p className="text-xs text-muted-foreground">
                    Define categories to organise submissions. Backend users can assign categories when reviewing submissions.
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="new_category"
                        value={newCategoryValue}
                        onChange={(e) => setNewCategoryValue(e.target.value)}
                        placeholder="Enter category name (e.g., Computer, Email)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const value = newCategoryValue.trim();
                            if (value && !formData.form_config.categories?.includes(value)) {
                              setFormData({
                                ...formData,
                                form_config: {
                                  ...formData.form_config,
                                  categories: [...(formData.form_config.categories || []), value],
                                },
                              });
                              setNewCategoryValue("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const value = newCategoryValue.trim();
                          if (value && !formData.form_config.categories?.includes(value)) {
                            setFormData({
                              ...formData,
                              form_config: {
                                ...formData.form_config,
                                categories: [...(formData.form_config.categories || []), value],
                              },
                            });
                            setNewCategoryValue("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.form_config.categories && formData.form_config.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.form_config.categories.map((category, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Tag className="h-3 w-3" />
                            {category}
                            <button
                              type="button"
                              onClick={() => {
                                const newCategories = formData.form_config.categories.filter(
                                  (_, i) => i !== index
                                );
                                setFormData({
                                  ...formData,
                                  form_config: {
                                    ...formData.form_config,
                                    categories: newCategories,
                                  },
                                });
                              }}
                              className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="statuses">Status Options</Label>
                  <p className="text-xs text-muted-foreground">
                    Define custom status options for submissions. If not specified, default statuses (draft, submitted, reviewed, approved, rejected) will be used.
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="new_status"
                        value={newStatusValue}
                        onChange={(e) => setNewStatusValue(e.target.value)}
                        placeholder="Enter status name (e.g., Open, In Progress)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const value = newStatusValue.trim();
                            if (value && !formData.form_config.statuses?.includes(value)) {
                              setFormData({
                                ...formData,
                                form_config: {
                                  ...formData.form_config,
                                  statuses: [...(formData.form_config.statuses || []), value],
                                },
                              });
                              setNewStatusValue("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const value = newStatusValue.trim();
                          if (value && !formData.form_config.statuses?.includes(value)) {
                            setFormData({
                              ...formData,
                              form_config: {
                                ...formData.form_config,
                                statuses: [...(formData.form_config.statuses || []), value],
                              },
                            });
                            setNewStatusValue("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.form_config.statuses && formData.form_config.statuses.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.form_config.statuses.map((status, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {status}
                            <button
                              type="button"
                              onClick={() => {
                                const newStatuses = formData.form_config.statuses.filter(
                                  (_, i) => i !== index
                                );
                                setFormData({
                                  ...formData,
                                  form_config: {
                                    ...formData.form_config,
                                    statuses: newStatuses,
                                  },
                                });
                              }}
                              className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Access & Submission Viewing Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Form Access & Submission Viewing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Access - Who can submit */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Form Access (Who can submit)</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Control who can fill out and submit this form.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Allowed Roles</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !formData.access_config.allowed_roles.includes(value)) {
                            setFormData({
                              ...formData,
                              access_config: {
                                ...formData.access_config,
                                allowed_roles: [...formData.access_config.allowed_roles, value],
                              },
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles
                            .filter(
                              (role) =>
                                !formData.access_config.allowed_roles.includes(
                                  role.name || role.slug
                                )
                            )
                            .map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.name || role.slug}
                              >
                                {role.display_name || role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {formData.access_config.allowed_roles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.access_config.allowed_roles.map((roleName) => {
                            const role = roles.find(
                              (r) => (r.name || r.slug) === roleName
                            );
                            return (
                              <Badge
                                key={roleName}
                                variant="secondary"
                                className="flex items-center gap-1 pr-1"
                              >
                                <Shield className="h-3 w-3" />
                                <span className="text-xs">
                                  {role?.display_name || role?.name || roleName}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      access_config: {
                                        ...formData.access_config,
                                        allowed_roles:
                                          formData.access_config.allowed_roles.filter(
                                            (r) => r !== roleName
                                          ),
                                      },
                                    });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Allowed Users</Label>
                      <UserMentionSelector
                        users={users}
                        selectedUserIds={formData.access_config.allowed_users || []}
                        onSelectionChange={(newSelection) => {
                          setFormData({
                            ...formData,
                            access_config: {
                              ...formData.access_config,
                              allowed_users: newSelection,
                            },
                          });
                        }}
                        placeholder="Type to search and select users..."
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  {/* Submission Viewing Permissions - Who can view submissions */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">
                        Submission Viewing Permissions
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Control who can view and review form submissions. This is separate from
                        who can submit the form.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>View Submissions Roles</Label>
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value && !viewSubmissionsRoleIds.includes(value)) {
                              setViewSubmissionsRoleIds([...viewSubmissionsRoleIds, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles
                              .filter(
                                (role) =>
                                  !viewSubmissionsRoleIds.includes(
                                    role.name || role.slug
                                  )
                              )
                              .map((role) => (
                                <SelectItem
                                  key={role.id}
                                  value={role.name || role.slug}
                                >
                                  {role.display_name || role.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {viewSubmissionsRoleIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {viewSubmissionsRoleIds.map((roleName) => {
                              const role = roles.find(
                                (r) => (r.name || r.slug) === roleName
                              );
                              return (
                                <Badge
                                  key={roleName}
                                  variant="secondary"
                                  className="flex items-center gap-1 pr-1"
                                >
                                  <Shield className="h-3 w-3" />
                                  <span className="text-xs">
                                    {role?.display_name || role?.name || roleName}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => {
                                      setViewSubmissionsRoleIds(
                                        viewSubmissionsRoleIds.filter(
                                          (r) => r !== roleName
                                        )
                                      );
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>View Submissions Users</Label>
                        <UserMentionSelector
                          users={users}
                          selectedUserIds={viewSubmissionsUserIds}
                          onSelectionChange={setViewSubmissionsUserIds}
                          placeholder="Type to search and select users..."
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> Submission viewing permissions control who can see
                        and review form submissions, separate from who can fill out the form. Form
                        owners (users in assigned_user_ids) can always view all submissions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Form Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Assign Form To</Label>
                  <Tabs value={assignmentMode} onValueChange={setAssignmentMode} className="w-full">
                    <div className="overflow-x-auto scrollbar-hide">
                      <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-3">
                        <TabsTrigger value="none" className="whitespace-nowrap">
                          None
                        </TabsTrigger>
                        <TabsTrigger value="role" className="whitespace-nowrap">
                          <Shield className="mr-2 h-4 w-4" />
                          Role
                        </TabsTrigger>
                        <TabsTrigger value="users" className="whitespace-nowrap">
                          <Users className="mr-2 h-4 w-4" />
                          Users
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Role Assignment */}
                    <TabsContent value="role" className="space-y-3 mt-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              All users in the selected role will be able to access this form.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={assignedToRoleId}
                          onValueChange={(value) => {
                            setAssignedToRoleId(value);
                            setSelectedUserIds([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.display_name || role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsCreateRoleModalOpen(true)}
                          title="Create new role"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Multiple Users Assignment */}
                    <TabsContent value="users" className="space-y-3 mt-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {createIndividualAssignments
                                ? "Each selected user will get their own form instance to complete individually."
                                : "All selected users will share one form instance for collaborative completion."}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="create_individual_assignments"
                          checked={createIndividualAssignments}
                          onCheckedChange={(checked) => setCreateIndividualAssignments(checked)}
                        />
                        <Label htmlFor="create_individual_assignments" className="cursor-pointer">
                          Create individual assignments
                        </Label>
                      </div>
                      {createIndividualAssignments ? (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                            Individual Mode: Each user gets their own form instance
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                          <p className="text-xs font-medium text-green-800 dark:text-green-200">
                            Collaborative Mode: All users share the same form instance
                          </p>
                        </div>
                      )}
                      <UserMentionSelector
                        users={users}
                        selectedUserIds={selectedUserIds}
                        onSelectionChange={handleUserSelectionChange}
                        placeholder="Type to search and mention users..."
                        className="w-full"
                      />
                    </TabsContent>
                  </Tabs>
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
          <Link href={`/admin/forms/${formSlug}`}>
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

      {/* Create Role Modal */}
      <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role for your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-display-name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-display-name"
                placeholder="e.g., Senior Doctor"
                value={roleFormData.displayName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    displayName: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-name"
                placeholder="e.g., senior_doctor"
                value={roleFormData.roleName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    roleName: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores only. Cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe this role's purpose and responsibilities"
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    description: e.target.value,
                  })
                }
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-priority">Priority</Label>
              <Input
                id="role-priority"
                type="number"
                value={roleFormData.priority}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    priority: parseInt(e.target.value) || 50,
                  })
                }
                min="1"
                max="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRoleModalOpen(false);
                setRoleFormData({
                  displayName: "",
                  roleName: "",
                  description: "",
                  priority: 50,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={
                createRoleMutation.isPending ||
                !roleFormData.displayName ||
                !roleFormData.roleName
              }
            >
              {createRoleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditFormPage;


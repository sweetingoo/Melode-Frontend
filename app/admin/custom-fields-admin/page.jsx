"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Folder,
  List,
  Eye,
  Edit,
  Trash2,
  Database,
  RefreshCw,
  Info,
  Check,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCustomFieldSections,
  useCreateCustomFieldSection,
  useUpdateCustomFieldSection,
  useHardDeleteCustomFieldSection,
  useCustomFieldsHierarchy,
  customFieldSectionUtils,
} from "@/hooks/useCustomFields";
import {
  useCustomFields,
  useCustomField,
  useCreateCustomField,
  useUpdateCustomField,
  useHardDeleteCustomField,
  customFieldsUtils,
} from "@/hooks/useCustomFieldsFields";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

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

const CustomFieldsAdminPage = () => {
  const [showInactive, setShowInactive] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState("user");
  const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] =
    useState(false);
  const [isCreateFieldModalOpen, setIsCreateFieldModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [allowAllFileTypes, setAllowAllFileTypes] = useState(false);
  const [sectionFormData, setSectionFormData] = useState({
    sectionName: "",
    sectionDescription: "",
    entityType: "user",
    sortOrder: 0,
    organisationId: 0,
  });
  const [fieldFormData, setFieldFormData] = useState({
    field_name: "",
    field_label: "",
    field_description: "",
    field_type: "",
    is_required: false,
    is_unique: false,
    max_length: null,
    min_value: null,
    max_value: null,
    field_options: {},
    validation_rules: {},
    relationship_config: null,
    entity_type: "user",
    sort_order: 0,
    organisation_id: 0,
    section_id: 0,
    is_active: true,
  });

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "decimal", label: "Decimal" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "url", label: "URL" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "DateTime" },
    { value: "time", label: "Time" },
    { value: "boolean", label: "Boolean" },
    { value: "select", label: "Select Dropdown" },
    { value: "radio", label: "Radio Group" },
    { value: "multiselect", label: "Multi Select" },
    { value: "textarea", label: "Textarea" },
    { value: "file", label: "File Upload" },
    { value: "json", label: "JSON" },
  ];

  // API hooks
  const {
    data: sectionsData,
    isLoading: sectionsLoading,
    error: sectionsError,
  } = useCustomFieldSections({ entity_type: selectedEntityType });

  const createSectionMutation = useCreateCustomFieldSection();
  const updateSectionMutation = useUpdateCustomFieldSection();
  const deleteSectionMutation = useHardDeleteCustomFieldSection();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateCustomField = hasPermission("custom_field:create");
  const canUpdateCustomField = hasPermission("custom_field:update");
  const canDeleteCustomField = hasPermission("custom_field:delete");

  // Custom Fields API hooks
  const {
    data: fieldsData,
    isLoading: fieldsLoading,
    error: fieldsError,
  } = useCustomFields({ entity_type: selectedEntityType });

  const createFieldMutation = useCreateCustomField();
  const updateFieldMutation = useUpdateCustomField();
  const deleteFieldMutation = useHardDeleteCustomField();

  // Get individual field for editing
  const { data: editingField, isLoading: editingFieldLoading } = useCustomField(editingFieldId);

  // Populate form data when editing field is loaded
  React.useEffect(() => {
    if (editingField && editingFieldId) {
      const fieldOptions = editingField.field_options || {};
      setFieldFormData({
        field_name: editingField.field_name || "",
        field_label: editingField.field_label || "",
        field_description: editingField.field_description || "",
        field_type: editingField.field_type || "",
        is_required: editingField.is_required || false,
        is_unique: editingField.is_unique || false,
        max_length: editingField.max_length || null,
        min_value: editingField.min_value || null,
        max_value: editingField.max_value || null,
        field_options: fieldOptions,
        validation_rules: editingField.validation_rules || {},
        relationship_config: editingField.relationship_config || null,
        entity_type: editingField.entity_type || selectedEntityType,
        sort_order: editingField.sort_order || 0,
        organization_id: editingField.organization_id || 0,
        section_id: editingField.section_id || 0,
        is_active: editingField.is_active !== undefined ? editingField.is_active : true,
      });
      // Set allowAllFileTypes based on accept field
      if (editingField.field_type === 'file') {
        const accept = fieldOptions.accept || '';
        setAllowAllFileTypes(!accept || accept === '' || accept === '*/*');
      }
    }
  }, [editingField, editingFieldId, selectedEntityType]);

  // Transform API data with proper error handling
  const sections = React.useMemo(() => {
    if (!sectionsData) return [];

    // Handle different response formats
    let dataToTransform = sectionsData;

    // If it's wrapped in a data property
    if (sectionsData.data && Array.isArray(sectionsData.data)) {
      dataToTransform = sectionsData.data;
    }
    // If it's wrapped in a results property (common for paginated responses)
    else if (sectionsData.results && Array.isArray(sectionsData.results)) {
      dataToTransform = sectionsData.results;
    }
    // If it's already an array
    else if (Array.isArray(sectionsData)) {
      dataToTransform = sectionsData;
    }
    // If it's not an array, return empty array
    else {
      return [];
    }

    return dataToTransform.map(customFieldSectionUtils.transformSection);
  }, [sectionsData]);

  // Filter sections based on showInactive setting
  const filteredSections = React.useMemo(() => {
    if (!Array.isArray(sections)) return [];

    return showInactive
      ? sections
      : sections.filter((section) => section.isActive);
  }, [sections, showInactive]);

  // Transform fields API data
  const fields = React.useMemo(() => {
    if (!fieldsData) return [];

    // Handle different response formats
    let dataToTransform = fieldsData;

    // If it's wrapped in a fields property
    if (fieldsData.fields && Array.isArray(fieldsData.fields)) {
      dataToTransform = fieldsData.fields;
    }
    // If it's wrapped in a data property
    else if (fieldsData.data && Array.isArray(fieldsData.data)) {
      dataToTransform = fieldsData.data;
    }
    // If it's wrapped in a results property (common for paginated responses)
    else if (fieldsData.results && Array.isArray(fieldsData.results)) {
      dataToTransform = fieldsData.results;
    }
    // If it's already an array
    else if (Array.isArray(fieldsData)) {
      dataToTransform = fieldsData;
    }
    // If it's not an array, return empty array
    else {
      return [];
    }

    return dataToTransform.map(customFieldsUtils.transformField);
  }, [fieldsData]);

  // Auto-generate preview when sections and fields are available
  React.useEffect(() => {
    if (filteredSections.length > 0 && fields.length > 0 && !previewData) {
      console.log("Auto-generating preview with:", {
        filteredSections,
        fields,
      });
      const previewSections = filteredSections.map((section) => {
        const sectionFields = fields.filter(
          (field) => field.sectionId === section.id
        );
        console.log(
          `Auto: Section ${section.title} (ID: ${section.id}) has fields:`,
          sectionFields
        );
        return {
          ...section,
          fields: sectionFields,
        };
      });
      console.log("Auto-generated preview sections:", previewSections);
      setPreviewData(previewSections);
    }
  }, [filteredSections, fields, previewData]);

  const handleCreateSection = () => {
    setEditingSectionId(null); // Reset editing state
    setIsCreateSectionModalOpen(true);
    setSectionFormData({
      sectionName: "",
      sectionDescription: "",
      entityType: selectedEntityType,
      sortOrder: sections.length + 1,
      organisationId: 0,
    });
  };

  const handleInputChange = (field, value) => {
    setSectionFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitSection = async () => {
    if (!sectionFormData.sectionName) {
      toast.error("Please fill in the section name");
      return;
    }

    try {
      if (editingSectionId) {
        // Update existing section
        await updateSectionMutation.mutateAsync({
          id: editingSectionId,
          sectionData: sectionFormData,
        });
      } else {
        // Create new section
        await createSectionMutation.mutateAsync(sectionFormData);
      }

      // Reset form and close modal
      setSectionFormData({
        sectionName: "",
        sectionDescription: "",
        entityType: selectedEntityType,
        sortOrder: 0,
        organisationId: 0,
      });
      setEditingSectionId(null);
      setIsCreateSectionModalOpen(false);
    } catch (error) {
      console.error("Failed to save section:", error);
    }
  };

  const handleCancelSection = () => {
    setSectionFormData({
      sectionName: "",
      sectionDescription: "",
      entityType: selectedEntityType,
      sortOrder: 0,
      organisationId: 0,
    });
    setEditingSectionId(null); // Reset editing state
    setIsCreateSectionModalOpen(false);
  };

  const handleCreateField = () => {
    setEditingFieldId(null); // Reset editing state
    setIsCreateFieldModalOpen(true);
    setAllowAllFileTypes(false); // Reset file type settings

    // Set default section to first available section
    const defaultSectionId =
      filteredSections.length > 0 ? filteredSections[0].id : 0;

    setFieldFormData({
      field_name: "",
      field_label: "",
      field_description: "",
      field_type: "",
      is_required: false,
      is_unique: false,
      max_length: null,
      min_value: null,
      max_value: null,
      field_options: {},
      validation_rules: {},
      relationship_config: null,
      entity_type: selectedEntityType,
      sort_order: fields.length + 1,
      organisation_id: 0,
      section_id: defaultSectionId,
      is_active: true,
    });
  };

  const handleEditField = (fieldId) => {
    setEditingFieldId(fieldId);
    setIsCreateFieldModalOpen(true);
  };

  const handleDeleteField = async (fieldId) => {
    try {
      await deleteFieldMutation.mutateAsync(fieldId);
      toast.success("Field permanently deleted successfully!");
    } catch (error) {
      console.error("Failed to delete field:", error);
      toast.error("Failed to delete field");
    }
  };

  const handleFieldInputChange = (field, value) => {
    setFieldFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Auto-generate field_name from field_label
      if (field === 'field_label' && value) {
        // Convert to snake_case: "First Name" -> "first_name"
        const autoGeneratedName = value
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/_+/g, '_') // Replace multiple underscores with single
          .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

        newData.field_name = autoGeneratedName;
      }

      // Initialize field_options with empty options array for field types that need it
      if (field === 'field_type' && (value === 'select' || value === 'multiselect' || value === 'radio')) {
        newData.field_options = {
          ...prev.field_options,
          options: prev.field_options?.options || []
        };
      }

      return newData;
    });
  };

  const handleSubmitField = async () => {
    if (!fieldFormData.field_label || !fieldFormData.field_type) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editingFieldId) {
        // Update existing field
        await updateFieldMutation.mutateAsync({
          id: editingFieldId,
          fieldData: fieldFormData,
        });
      } else {
        // Create new field
        await createFieldMutation.mutateAsync(fieldFormData);
      }

      // Reset form and close modal
      setFieldFormData({
        fieldName: "",
        fieldLabel: "",
        fieldDescription: "",
        fieldType: "",
        isRequired: false,
        isUnique: false,
        maxLength: null,
        minValue: null,
        maxValue: null,
        fieldOptions: {},
        validationRules: {},
        relationshipConfig: {},
        entityType: selectedEntityType,
        sortOrder: 0,
        organisationId: 0,
        sectionId: 0,
      });
      setEditingFieldId(null);
      setIsCreateFieldModalOpen(false);
    } catch (error) {
      console.error("Failed to save field:", error);
    }
  };

  const handleCancelField = () => {
    setEditingFieldId(null); // Reset editing state
    setFieldFormData({
      field_name: "",
      field_label: "",
      field_description: "",
      field_type: "",
      is_required: false,
      is_unique: false,
      max_length: null,
      min_value: null,
      max_value: null,
      field_options: {},
      validation_rules: {},
      relationship_config: null,
      entity_type: selectedEntityType,
      sort_order: 0,
      organisation_id: 0,
      section_id: 0,
      is_active: true,
    });
    setIsCreateFieldModalOpen(false);
  };

  const handleAddRelationship = () => {
    toast.success("Add relationship functionality opened");
  };

  const handleAddSection = () => {
    toast.success("Add Section modal opened");
  };

  const handleToggleSection = async (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    try {
      // Prepare the data for API update
      const updateData = {
        sectionName: section.sectionName,
        sectionDescription: section.sectionDescription,
        entityType: section.entityType,
        sortOrder: section.sortOrder,
        organizationId: section.organizationId,
        isActive: !section.isActive, // Toggle the active status
      };

      await updateSectionMutation.mutateAsync({
        id: sectionId,
        sectionData: updateData,
      });

      toast.success(
        `Section ${!section.isActive ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      console.error("Failed to toggle section:", error);
      toast.error("Failed to update section status");
    }
  };

  const handleEditSection = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      setEditingSectionId(sectionId); // Set editing state
      setSectionFormData({
        sectionName: section.sectionName,
        sectionDescription: section.sectionDescription,
        entityType: section.entityType,
        sortOrder: section.sortOrder,
        organizationId: section.organizationId,
        isActive: section.isActive, // Include isActive field
      });
      setIsCreateSectionModalOpen(true);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      await deleteSectionMutation.mutateAsync(sectionId);
      toast.success("Section permanently deleted successfully!");
    } catch (error) {
      console.error("Failed to delete section:", error);
      toast.error("Failed to delete section");
    }
  };

  const handleResetState = () => {
    toast.success("State reset successfully");
  };

  // Preview API hook
  const {
    data: hierarchyData,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchHierarchy,
  } = useCustomFieldsHierarchy(selectedEntityType, 1);

  // Preview functions
  const handleGeneratePreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    console.log("Generating preview with:", { filteredSections, fields });

    try {
      // Always use local data for now since API might not be ready
      const previewSections = filteredSections.map((section) => {
        const sectionFields = fields.filter(
          (field) => field.sectionId === section.id
        );
        console.log(
          `Section ${section.title} (ID: ${section.id}) has fields:`,
          sectionFields
        );
        return {
          ...section,
          fields: sectionFields,
        };
      });

      console.log("Preview sections created:", previewSections);
      setPreviewData(previewSections);
      toast.success("Preview generated successfully!");

      // Try to fetch from API in background for future use
      try {
        await refetchHierarchy();
        if (hierarchyData) {
          console.log("API data fetched:", hierarchyData);
        }
      } catch (apiError) {
        console.log("API fetch failed, using local data:", apiError);
      }
    } catch (error) {
      console.error("Failed to generate preview:", error);
      setPreviewError(error);
      toast.error("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExportPreview = () => {
    if (!previewData) return;

    const exportData = {
      entityType: selectedEntityType,
      sections: previewData,
      generatedAt: new Date().toISOString(),
      totalSections: previewData.length,
      totalFields: previewData.reduce(
        (sum, section) => sum + (section.fields?.length || 0),
        0
      ),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-fields-preview-${selectedEntityType}-${new Date().toISOString().split("T")[0]
      }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Preview exported successfully!");
  };

  const renderFieldPreview = (field) => {
    const commonProps = {
      placeholder: `Preview ${field.fieldType} input`,
      disabled: true,
      className: "bg-gray-50 border-gray-200 text-gray-500",
    };

    switch (field.fieldType) {
      case "text":
        return <Input {...commonProps} />;

      case "email":
        return <Input {...commonProps} type="email" />;

      case "phone":
        return <Input {...commonProps} type="tel" />;

      case "number":
        return <Input {...commonProps} type="number" />;

      case "date":
        return <Input {...commonProps} type="date" />;

      case "datetime":
        return <Input {...commonProps} type="datetime-local" />;

      case "textarea":
        return <Textarea {...commonProps} rows={3} />;

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch disabled className="data-[state=checked]:bg-gray-400" />
            <Label className="text-sm text-gray-500">Yes/No</Label>
          </div>
        );

      case "select":
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-500">
              <SelectValue placeholder="Preview select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                disabled
                className="rounded border-gray-300"
              />
              <Label className="text-sm text-gray-500">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                disabled
                className="rounded border-gray-300"
              />
              <Label className="text-sm text-gray-500">Option 2</Label>
            </div>
          </div>
        );

      case "file":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Click to upload file</p>
          </div>
        );

      case "json":
        return (
          <Textarea {...commonProps} rows={4} placeholder='{"key": "value"}' />
        );

      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Custom Fields Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure custom fields for different entity types in your
            organisation
          </p>

          {/* State Indicators */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>State Persisted</span>
            </div>
            <button
              onClick={handleResetState}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {canCreateCustomField && (
            <Button
              onClick={handleCreateSection}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Section
            </Button>
          )}
          {canCreateCustomField && (
            <Button
              variant="outline"
              onClick={handleCreateField}
              disabled={filteredSections.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Field
            </Button>
          )}
        </div>
      </div>

      {/* Entity Type Selection */}
      <div className="flex items-center gap-4">
        <Label htmlFor="entity-type" className="text-sm font-medium">
          Entity Type:
        </Label>
        <Select
          value={selectedEntityType}
          onValueChange={setSelectedEntityType}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="asset">Assets</SelectItem>
            <SelectItem value="location">Locations</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="form">Forms</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Select the entity type to manage custom fields for</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sections" className="w-full">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-3">
            <TabsTrigger value="sections" className="flex items-center gap-2 whitespace-nowrap">
              <Folder className="h-4 w-4" />
              <span className="hidden sm:inline">
                Sections ({Array.isArray(filteredSections) ? filteredSections.length : 0})
              </span>
              <span className="sm:hidden">
                Sections ({Array.isArray(filteredSections) ? filteredSections.length : 0})
              </span>
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-2 whitespace-nowrap">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Fields ({fields.length})</span>
              <span className="sm:hidden">Fields ({fields.length})</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 whitespace-nowrap">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Custom Field Sections</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="show-inactive" className="text-sm">
                  Show Inactive:
                </Label>
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {sectionsLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {sectionsError && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Failed to load sections
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {sectionsError?.response?.data?.message ||
                      "An error occurred while loading sections"}
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections List */}
          {!sectionsLoading && !sectionsError && (
            <div className="space-y-4">
              {!Array.isArray(filteredSections) ||
                filteredSections.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No sections found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {showInactive
                          ? "No sections exist for this entity type"
                          : "No active sections found. Try enabling 'Show Inactive' to see all sections."}
                      </p>
                      <Button onClick={handleCreateSection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Section
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredSections.map((section) => (
                  <Card
                    key={section.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {section.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              <Info className="h-3 w-3 mr-1" />
                              {section.tag}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Order: {section.order}</span>
                            <div className="flex items-center gap-1">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">
                                {section.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canUpdateCustomField && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSection(section.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canUpdateCustomField && (
                            <Switch
                              checked={section.isActive}
                              onCheckedChange={() =>
                                handleToggleSection(section.id)
                              }
                              className="data-[state=checked]:bg-primary"
                            />
                          )}
                          {canDeleteCustomField && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Permanently Delete Section
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete
                                    the section "{section.title}"? This action
                                    cannot be undone and will permanently remove
                                    the section from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteSection(section.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Custom Fields</h2>
          </div>

          {/* Loading State */}
          {fieldsLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {fieldsError && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Failed to load fields
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {fieldsError?.response?.data?.message ||
                      "An error occurred while loading fields"}
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fields List */}
          {!fieldsLoading && !fieldsError && (
            <div className="space-y-4">
              {fields.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No fields found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        No custom fields exist for this entity type. Create your
                        first field to get started.
                      </p>
                      <Button
                        onClick={handleCreateField}
                        disabled={filteredSections.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Field
                      </Button>
                      {filteredSections.length === 0 && (
                        <p className="text-sm text-amber-600 mt-2">
                          Please create a section first before adding fields.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                fields.map((field) => (
                  <Card
                    key={field.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {field.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            {field.required && (
                              <Badge className="bg-red-500/10 text-xs text-red-600 hover:bg-red-500/20">
                                Required
                              </Badge>
                            )}
                            {field.unique && (
                              <Badge variant="secondary" className="text-xs">
                                Unique
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Section: {field.section}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditField(field.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Permanently Delete Field
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete
                                  the field "{field.name}"? This action cannot
                                  be undone and will permanently remove the
                                  field from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteField(field.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Field Preview</h2>
              <p className="text-muted-foreground mt-1">
                Preview how your custom fields will appear to users
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleGeneratePreview}
                disabled={filteredSections.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                <Eye className="h-4 w-4 mr-2" />
                Generate Preview
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPreview}
                disabled={!previewData}
              >
                <Database className="h-4 w-4 mr-2" />
                Export Preview
              </Button>
            </div>
          </div>

          {/* Success Message */}
          {previewData && previewData.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold text-green-800">
                  Preview Loaded Successfully
                </h3>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Below is how your custom fields will appear to users:
              </p>
            </div>
          )}

          {/* Preview Loading State */}
          {(previewLoading || hierarchyLoading) && (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="bg-white shadow-sm">
                  <CardHeader className="pb-4">
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Preview Error State */}
          {(previewError || hierarchyError) && (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Failed to load preview
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {previewError?.response?.data?.message ||
                      hierarchyError?.response?.data?.message ||
                      "An error occurred while loading the preview"}
                  </p>
                  <Button onClick={handleGeneratePreview}>Try Again</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Content */}
          {!previewLoading &&
            !previewError &&
            !hierarchyLoading &&
            !hierarchyError && (
              <div className="space-y-6">
                {previewData && previewData.length > 0 ? (
                  previewData.map((section) => (
                    <Card key={section.id} className="bg-white shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {section.title}
                        </CardTitle>
                        {section.description && (
                          <CardDescription className="text-muted-foreground">
                            {section.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {section.fields && section.fields.length > 0 ? (
                          section.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">
                                {field.fieldLabel}
                                {field.isRequired && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                              {renderFieldPreview(field)}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <List className="h-8 w-8 mx-auto mb-2" />
                            <p>No fields in this section</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-12">
                      <div className="text-center">
                        <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                          No preview available
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          {filteredSections.length === 0
                            ? "Create sections and fields first to see the preview"
                            : "Click 'Generate Preview' to see how your fields will appear to users"}
                        </p>
                        <Button
                          onClick={handleGeneratePreview}
                          disabled={filteredSections.length === 0}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Generate Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
        </TabsContent>
      </Tabs>

      {/* Create Section Modal */}
      <Dialog
        open={isCreateSectionModalOpen}
        onOpenChange={setIsCreateSectionModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSectionId ? "Edit Section" : "Create New Section"}
            </DialogTitle>
            <DialogDescription>
              {editingSectionId
                ? `Update the custom field section for ${selectedEntityType.toLowerCase()}.`
                : `Add a new custom field section for ${selectedEntityType.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionName">Section Name *</Label>
              <Input
                id="sectionName"
                placeholder="e.g., basic-personal-details"
                value={sectionFormData.sectionName}
                onChange={(e) =>
                  handleInputChange("sectionName", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Internal name for the section (lowercase, hyphens allowed)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sectionDescription">Section Description</Label>
              <Textarea
                id="sectionDescription"
                placeholder="Describe what this section contains..."
                value={sectionFormData.sectionDescription}
                onChange={(e) =>
                  handleInputChange("sectionDescription", e.target.value)
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Description of what this section contains
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type *</Label>
              <Select
                value={sectionFormData.entityType}
                onValueChange={(value) =>
                  handleInputChange("entityType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="location">Locations</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="form">Forms</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The type of entity this section applies to
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                placeholder="e.g., 1"
                value={sectionFormData.sortOrder}
                onChange={(e) =>
                  handleInputChange("sortOrder", parseInt(e.target.value) || 0)
                }
              />
              <p className="text-xs text-muted-foreground">
                Order in which this section appears (lower numbers first)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSection}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSection}
              className="bg-primary hover:bg-primary/90"
            >
              {editingSectionId ? "Update Section" : "Create Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Field Modal */}
      <Dialog
        open={isCreateFieldModalOpen}
        onOpenChange={setIsCreateFieldModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFieldId ? "Edit Field" : "Create New Field"}
            </DialogTitle>
            <DialogDescription>
              {editingFieldId
                ? `Update the custom field for ${selectedEntityType.toLowerCase()}.`
                : `Add a new custom field for ${selectedEntityType.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          {editingFieldId && editingFieldLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading field data...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fieldLabel">Field Label *</Label>
                <Input
                  id="fieldLabel"
                  placeholder="e.g., Full Name"
                  value={fieldFormData.field_label}
                  onChange={(e) =>
                    handleFieldInputChange("field_label", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Display name for the field
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldName" className="flex items-center gap-2">
                  Field Name (Auto-generated)
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Auto
                  </span>
                </Label>
                <Input
                  id="fieldName"
                  placeholder="e.g., first_name"
                  value={fieldFormData.field_name}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Automatically generated from the field label above
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldType">Field Type *</Label>
                <Select
                  value={fieldFormData.field_type}
                  onValueChange={(value) =>
                    handleFieldInputChange("field_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the input type for this field
                </p>
              </div>

              {/* Field Options - Only show for field types that need options */}
              {(fieldFormData.field_type === 'select' ||
                fieldFormData.field_type === 'multiselect' ||
                fieldFormData.field_type === 'radio') && (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        Field Options
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Auto Values
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {fieldFormData.field_options?.options?.map((option, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Label</Label>
                                <Input
                                  placeholder="Option label"
                                  value={typeof option === 'object' ? (option.label || '') : (option || '')}
                                  onChange={(e) => {
                                    const newOptions = [...(fieldFormData.field_options?.options || [])];
                                    const labelValue = e.target.value;
                                    // Auto-generate value from label
                                    const autoGeneratedValue = labelValue
                                      .toLowerCase()
                                      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
                                      .replace(/\s+/g, '_') // Replace spaces with underscores
                                      .replace(/_+/g, '_') // Replace multiple underscores with single
                                      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

                                    newOptions[index] = {
                                      ...option,
                                      label: labelValue,
                                      value: autoGeneratedValue
                                    };
                                    handleFieldInputChange("field_options", {
                                      ...fieldFormData.field_options,
                                      options: newOptions
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Value (Auto)</Label>
                                <Input
                                  placeholder="Option value (auto-generated)"
                                  value={typeof option === 'object' ? (option.value || '') : (option || '')}
                                  readOnly
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newOptions = fieldFormData.field_options?.options?.filter((_, i) => i !== index) || [];
                                  handleFieldInputChange("field_options", {
                                    ...fieldFormData.field_options,
                                    options: newOptions
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [
                              ...(fieldFormData.field_options?.options || []),
                              { label: '', value: '' }
                            ];
                            handleFieldInputChange("field_options", {
                              ...fieldFormData.field_options,
                              options: newOptions
                            });
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="fieldSection">Section *</Label>
                <Select
                  value={
                    fieldFormData.section_id
                      ? fieldFormData.section_id.toString()
                      : ""
                  }
                  onValueChange={(value) =>
                    handleFieldInputChange("section_id", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.map((section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose which section this field belongs to
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldDescription">Description</Label>
                <Textarea
                  id="fieldDescription"
                  placeholder="Describe what this field is used for..."
                  value={fieldFormData.field_description}
                  onChange={(e) =>
                    handleFieldInputChange("field_description", e.target.value)
                  }
                  rows={2}
                />
              </div>

              {/* File Upload Options */}
              {fieldFormData.field_type === 'file' && (
                <div className="space-y-4 pt-2 border-t">
                  <Label className="text-sm font-medium">
                    File Configuration
                  </Label>

                  {/* Allow Multiple Files Option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow_multiple_files"
                      checked={fieldFormData.field_options?.allowMultiple || false}
                      onCheckedChange={(checked) => {
                        handleFieldInputChange("field_options", {
                          ...fieldFormData.field_options,
                          allowMultiple: checked,
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
                          handleFieldInputChange("field_options", {
                            ...fieldFormData.field_options,
                            accept: "",
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
                          const selectedTypes = fieldFormData.field_options?.accept
                            ? fieldFormData.field_options.accept.split(",").map((t) => t.trim())
                            : [];

                          const categoryTypes = category.types.map((t) => t.value);
                          const allCategorySelected = categoryTypes.every((type) =>
                            selectedTypes.includes(type)
                          );
                          const someCategorySelected = categoryTypes.some((type) =>
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
                            handleFieldInputChange("field_options", {
                              ...fieldFormData.field_options,
                              accept: newTypes.join(", "),
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
                            handleFieldInputChange("field_options", {
                              ...fieldFormData.field_options,
                              accept: newTypes.join(", "),
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
                                {category.types.map((type) => {
                                  const isSelected = selectedTypes.includes(type.value);
                                  return (
                                    <div key={type.value} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`type-${categoryKey}-${type.value}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) =>
                                          handleTypeToggle(type.value, checked)
                                        }
                                      />
                                      <Label
                                        htmlFor={`type-${categoryKey}-${type.value}`}
                                        className="text-xs text-muted-foreground cursor-pointer"
                                      >
                                        {type.label}
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
                  )}

                  {/* Max File Size */}
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      placeholder="10"
                      value={fieldFormData.field_options?.maxSize || ''}
                      onChange={(e) => {
                        handleFieldInputChange("field_options", {
                          ...fieldFormData.field_options,
                          maxSize: parseInt(e.target.value) || null
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum file size in megabytes. Leave empty for no size limit.
                    </p>
                  </div>
                </div>
              )}

              {/* Number Field Options */}
              {(fieldFormData.field_type === 'number' || fieldFormData.field_type === 'decimal') && (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="text-sm font-medium mb-3">Number Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minValue">Minimum Value</Label>
                        <Input
                          id="minValue"
                          type="number"
                          placeholder="0"
                          value={fieldFormData.min_value || ''}
                          onChange={(e) =>
                            handleFieldInputChange("min_value", e.target.value ? parseFloat(e.target.value) : null)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxValue">Maximum Value</Label>
                        <Input
                          id="maxValue"
                          type="number"
                          placeholder="100"
                          value={fieldFormData.max_value || ''}
                          onChange={(e) =>
                            handleFieldInputChange("max_value", e.target.value ? parseFloat(e.target.value) : null)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Field Options */}
              {(fieldFormData.field_type === 'text' || fieldFormData.field_type === 'textarea') && (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="text-sm font-medium mb-3">Text Settings</h4>
                    <div className="space-y-2">
                      <Label htmlFor="maxLength">Maximum Length</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        placeholder="255"
                        value={fieldFormData.max_length || ''}
                        onChange={(e) =>
                          handleFieldInputChange("max_length", e.target.value ? parseInt(e.target.value) : null)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for no limit
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Relationship Configuration - Compact */}
              <div className="space-y-3">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Field Relationships (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="relatedFieldId">Related Field ID</Label>
                      <Input
                        id="relatedFieldId"
                        type="number"
                        placeholder="Field ID"
                        value={fieldFormData.relationship_config?.relatedFieldId || ''}
                        onChange={(e) => {
                          handleFieldInputChange("relationship_config", {
                            ...fieldFormData.relationship_config,
                            relatedFieldId: e.target.value ? parseInt(e.target.value) : null
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationshipType">Relationship Type</Label>
                      <Select
                        value={fieldFormData.relationship_config?.relationshipType || ''}
                        onValueChange={(value) => {
                          handleFieldInputChange("relationship_config", {
                            ...fieldFormData.relationship_config,
                            relationshipType: value || null
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent Field</SelectItem>
                          <SelectItem value="child">Child Field</SelectItem>
                          <SelectItem value="sibling">Sibling Field</SelectItem>
                          <SelectItem value="dependent">Dependent Field</SelectItem>
                          <SelectItem value="conditional">Conditional Field</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Label htmlFor="conditionValue">Condition Value (Optional)</Label>
                    <Input
                      id="conditionValue"
                      placeholder="Value that triggers this relationship"
                      value={fieldFormData.relationship_config?.conditionValue || ''}
                      onChange={(e) => {
                        handleFieldInputChange("relationship_config", {
                          ...fieldFormData.relationship_config,
                          conditionValue: e.target.value || null
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="isRequired">Required</Label>
                  <Switch
                    id="isRequired"
                    checked={fieldFormData.is_required}
                    onCheckedChange={(checked) =>
                      handleFieldInputChange("isRequired", checked)
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="isUnique">Unique</Label>
                  <Switch
                    id="isUnique"
                    checked={fieldFormData.is_unique}
                    onCheckedChange={(checked) =>
                      handleFieldInputChange("isUnique", checked)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelField}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitField}
              className="bg-primary hover:bg-primary/90"
            >
              {editingFieldId ? "Update Field" : "Create Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomFieldsAdminPage;

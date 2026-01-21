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
  Shield,
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
import { useRoles } from "@/hooks/useRoles";
import { useActiveAssetTypes } from "@/hooks/useAssetTypes";
import { useLinkComplianceToRole, useLinkComplianceToAssetType } from "@/hooks/useCompliance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { complianceService } from "@/services/compliance";

// Predefined file type categories for easy selection
// Pre-defined UK Healthcare Compliance Types
const PREDEFINED_COMPLIANCE_TYPES = {
  passport: {
    label: "Passport",
    description: "UK or International Passport",
    sub_fields: [
      { field_name: "first_name", field_label: "First Name", field_type: "text", is_required: true },
      { field_name: "last_name", field_label: "Last Name", field_type: "text", is_required: true },
      { field_name: "passport_number", field_label: "Passport Number", field_type: "text", is_required: true },
      { field_name: "date_of_issue", field_label: "Date of Issue", field_type: "date", is_required: true },
      { field_name: "date_of_expiry", field_label: "Date of Expiry", field_type: "date", is_required: true },
      { field_name: "nationality", field_label: "Nationality", field_type: "text", is_required: true },
      { field_name: "place_of_birth", field_label: "Place of Birth", field_type: "text", is_required: false },
    ],
  },
  visa: {
    label: "Visa / Right to Work",
    description: "UK Visa or Right to Work documentation",
    sub_fields: [
      { field_name: "visa_type", field_label: "Visa Type", field_type: "text", is_required: true },
      { field_name: "visa_number", field_label: "Visa Number", field_type: "text", is_required: true },
      { field_name: "date_of_issue", field_label: "Date of Issue", field_type: "date", is_required: true },
      { field_name: "date_of_expiry", field_label: "Date of Expiry", field_type: "date", is_required: true },
      { field_name: "work_restrictions", field_label: "Work Restrictions", field_type: "textarea", is_required: false },
    ],
  },
  dbs_check: {
    label: "DBS Check (Disclosure and Barring Service)",
    description: "DBS Certificate - Enhanced, Standard, or Basic",
    sub_fields: [
      { field_name: "dbs_number", field_label: "DBS Certificate Number", field_type: "text", is_required: true },
      { field_name: "dbs_level", field_label: "DBS Level", field_type: "select", is_required: true, field_options: { options: [
        { value: "basic", label: "Basic" },
        { value: "standard", label: "Standard" },
        { value: "enhanced", label: "Enhanced" },
        { value: "enhanced_with_barred", label: "Enhanced with Barred Lists" },
      ]}},
      { field_name: "date_of_issue", field_label: "Date of Issue", field_type: "date", is_required: true },
      { field_name: "date_of_expiry", field_label: "Date of Expiry", field_type: "date", is_required: true },
      { field_name: "update_service_status", field_label: "Update Service Status", field_type: "select", is_required: false, field_options: { options: [
        { value: "subscribed", label: "Subscribed" },
        { value: "not_subscribed", label: "Not Subscribed" },
      ]}},
    ],
  },
  professional_registration: {
    label: "Professional Registration",
    description: "NMC, GMC, HCPC, or other professional body registration",
    sub_fields: [
      { field_name: "registration_body", field_label: "Registration Body", field_type: "select", is_required: true, field_options: { options: [
        { value: "nmc", label: "NMC (Nursing and Midwifery Council)" },
        { value: "gmc", label: "GMC (General Medical Council)" },
        { value: "hcpc", label: "HCPC (Health and Care Professions Council)" },
        { value: "gphc", label: "GPhC (General Pharmaceutical Council)" },
        { value: "other", label: "Other" },
      ]}},
      { field_name: "registration_number", field_label: "Registration Number", field_type: "text", is_required: true },
      { field_name: "date_of_registration", field_label: "Date of Registration", field_type: "date", is_required: true },
      { field_name: "date_of_expiry", field_label: "Date of Expiry / Renewal", field_type: "date", is_required: true },
      { field_name: "registration_status", field_label: "Registration Status", field_type: "select", is_required: true, field_options: { options: [
        { value: "active", label: "Active" },
        { value: "lapsed", label: "Lapsed" },
        { value: "suspended", label: "Suspended" },
      ]}},
    ],
  },
  immunisation: {
    label: "Immunisation Record",
    description: "Vaccination and immunisation records (Hepatitis B, TB, etc.)",
    sub_fields: [
      { field_name: "vaccine_type", field_label: "Vaccine Type", field_type: "select", is_required: true, field_options: { options: [
        { value: "hepatitis_b", label: "Hepatitis B" },
        { value: "tuberculosis", label: "Tuberculosis (TB)" },
        { value: "covid_19", label: "COVID-19" },
        { value: "flu", label: "Seasonal Flu" },
        { value: "mmr", label: "MMR (Measles, Mumps, Rubella)" },
        { value: "other", label: "Other" },
      ]}},
      { field_name: "date_of_vaccination", field_label: "Date of Vaccination", field_type: "date", is_required: true },
      { field_name: "next_due_date", field_label: "Next Due Date / Booster", field_type: "date", is_required: false },
      { field_name: "batch_number", field_label: "Batch Number", field_type: "text", is_required: false },
      { field_name: "administered_by", field_label: "Administered By", field_type: "text", is_required: false },
    ],
  },
  occupational_health: {
    label: "Occupational Health Clearance",
    description: "Occupational health assessment and clearance",
    sub_fields: [
      { field_name: "assessment_type", field_label: "Assessment Type", field_type: "select", is_required: true, field_options: { options: [
        { value: "pre_employment", label: "Pre-Employment" },
        { value: "annual", label: "Annual Review" },
        { value: "return_to_work", label: "Return to Work" },
        { value: "fitness_for_work", label: "Fitness for Work" },
      ]}},
      { field_name: "date_of_assessment", field_label: "Date of Assessment", field_type: "date", is_required: true },
      { field_name: "clearance_status", field_label: "Clearance Status", field_type: "select", is_required: true, field_options: { options: [
        { value: "cleared", label: "Cleared" },
        { value: "cleared_with_restrictions", label: "Cleared with Restrictions" },
        { value: "not_cleared", label: "Not Cleared" },
      ]}},
      { field_name: "next_review_date", field_label: "Next Review Date", field_type: "date", is_required: false },
      { field_name: "restrictions", field_label: "Work Restrictions", field_type: "textarea", is_required: false },
    ],
  },
  driving_license: {
    label: "Driving Licence",
    description: "UK Driving Licence (if required for role)",
    sub_fields: [
      { field_name: "license_number", field_label: "Driving Licence Number", field_type: "text", is_required: true },
      { field_name: "license_type", field_label: "License Type", field_type: "select", is_required: true, field_options: { options: [
        { value: "provisional", label: "Provisional" },
        { value: "full", label: "Full" },
      ]}},
      { field_name: "date_of_issue", field_label: "Date of Issue", field_type: "date", is_required: true },
      { field_name: "date_of_expiry", field_label: "Date of Expiry", field_type: "date", is_required: true },
      { field_name: "categories", field_label: "Vehicle Categories", field_type: "text", is_required: false, placeholder: "e.g., B, C1, D1" },
    ],
  },
  qualifications: {
    label: "Professional Qualifications",
    description: "Relevant professional qualifications and certificates",
    sub_fields: [
      { field_name: "qualification_name", field_label: "Qualification Name", field_type: "text", is_required: true },
      { field_name: "awarding_body", field_label: "Awarding Body", field_type: "text", is_required: true },
      { field_name: "qualification_level", field_label: "Level", field_type: "text", is_required: false, placeholder: "e.g., Level 3, Degree, Diploma" },
      { field_name: "date_awarded", field_label: "Date Awarded", field_type: "date", is_required: true },
      { field_name: "certificate_number", field_label: "Certificate Number", field_type: "text", is_required: false },
    ],
  },
  training_certificate: {
    label: "Training Certificate",
    description: "Mandatory training certificates (e.g., Manual Handling, Fire Safety)",
    sub_fields: [
      { field_name: "training_name", field_label: "Training Name", field_type: "text", is_required: true },
      { field_name: "training_provider", field_label: "Training Provider", field_type: "text", is_required: true },
      { field_name: "date_completed", field_label: "Date Completed", field_type: "date", is_required: true },
      { field_name: "expiry_date", field_label: "Expiry Date", field_type: "date", is_required: false },
      { field_name: "certificate_number", field_label: "Certificate Number", field_type: "text", is_required: false },
    ],
  },
  custom: {
    label: "Custom Compliance Type",
    description: "Create your own compliance type with custom fields",
    sub_fields: [],
  },
};

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
  const [editingFieldSlug, setEditingFieldSlug] = useState(null);
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
    // Compliance fields
    is_compliance: false,
    requires_approval: false,
    expiry_reminder_days: null,
    compliance_config: null,
  });
  const [selectedComplianceType, setSelectedComplianceType] = useState(""); // Pre-defined type or "custom"
  const [customSubFields, setCustomSubFields] = useState([]); // For custom compliance types
  const [selectedRoles, setSelectedRoles] = useState([]); // Selected role slugs for linking
  const [selectedAssetTypes, setSelectedAssetTypes] = useState([]); // Selected asset type slugs for linking
  const [roleRequiredFlags, setRoleRequiredFlags] = useState({}); // Track which roles are required
  const [assetTypeRequiredFlags, setAssetTypeRequiredFlags] = useState({}); // Track which asset types are required

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

  // Get roles and asset types for linking
  const { data: rolesData } = useRoles({ is_active: true });
  const { data: assetTypesData } = useActiveAssetTypes();
  const roles = rolesData?.roles || rolesData || [];
  const assetTypes = assetTypesData?.asset_types || assetTypesData || [];

  // Compliance linking mutations
  const queryClient = useQueryClient();
  const linkToRoleMutation = useLinkComplianceToRole();
  const linkToAssetTypeMutation = useLinkComplianceToAssetType();

  // Get individual field for editing
  const { data: editingField, isLoading: editingFieldLoading, refetch: refetchEditingField } = useCustomField(editingFieldSlug);
  
  // Debug: Log when editingFieldSlug changes
  React.useEffect(() => {
    console.log("editingFieldSlug changed:", editingFieldSlug);
    console.log("useCustomField will be enabled:", !!editingFieldSlug);
    // Force refetch when slug changes to ensure we get fresh data
    if (editingFieldSlug) {
      console.log("Refetching field data for slug:", editingFieldSlug);
      refetchEditingField();
    }
  }, [editingFieldSlug, refetchEditingField]);
  
  // Debug: Log when editingField data changes
  React.useEffect(() => {
    console.log("editingField data changed:", editingField);
    console.log("editingFieldLoading:", editingFieldLoading);
    if (editingField) {
      console.log("Field loaded - ID:", editingField.id, "slug:", editingField.slug, "field_name:", editingField.field_name);
    }
  }, [editingField, editingFieldLoading]);
  
  // Get compliance links when editing a compliance field
  const fieldSlug = editingField?.slug || editingFieldSlug; // Use field slug or fallback to editingFieldSlug
  const { data: complianceLinksData, isLoading: complianceLinksLoading } = useQuery({
    queryKey: ["compliance-links", fieldSlug],
    queryFn: async () => {
      if (!fieldSlug) {
        console.log("No fieldSlug provided, returning empty array");
        return [];
      }
      console.log("Loading compliance links for field:", fieldSlug);
      try {
        const response = await complianceService.getComplianceLinksForField(fieldSlug);
        console.log("Compliance links response:", response);
        return response || [];
      } catch (error) {
        console.error("Failed to load compliance links:", error);
        // If it's a 404, the field might not be a compliance field, return empty array
        if (error.response?.status === 404) {
          console.log("Field is not a compliance field or not found, returning empty array");
          return [];
        }
        return [];
      }
    },
    enabled: !!fieldSlug && !!editingFieldSlug, // Enable whenever we're editing a field (we'll filter in the effect if it's not compliance)
    staleTime: 5 * 60 * 1000,
  });
  
  // Debug: Log query state
  React.useEffect(() => {
    console.log("Compliance links query state:", {
      fieldSlug,
      editingFieldSlug,
      editingFieldIsCompliance: editingField?.is_compliance,
      enabled: !!fieldSlug && !!editingFieldSlug,
      complianceLinksLoading,
      complianceLinksDataLength: complianceLinksData?.length,
    });
  }, [fieldSlug, editingFieldSlug, editingField?.is_compliance, complianceLinksLoading, complianceLinksData]);

  // Populate form data when editing field is loaded
  React.useEffect(() => {
    console.log("Edit Field Effect - editingField:", editingField, "editingFieldSlug:", editingFieldSlug, "loading:", editingFieldLoading);
    if (editingField && editingFieldSlug) {
      console.log("Populating form with field data:", editingField);
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
        // Compliance fields
        is_compliance: editingField.is_compliance || false,
        requires_approval: editingField.requires_approval || false,
        expiry_reminder_days: editingField.expiry_reminder_days || null,
        compliance_config: editingField.compliance_config 
          ? {
              // Ensure all ComplianceFieldConfig fields are present with defaults if missing
              auto_expire: editingField.compliance_config.auto_expire !== undefined ? editingField.compliance_config.auto_expire : true,
              notification_recipients: editingField.compliance_config.notification_recipients || null,
              reminder_frequency: editingField.compliance_config.reminder_frequency || "daily",
              allow_user_upload: editingField.compliance_config.allow_user_upload !== undefined ? editingField.compliance_config.allow_user_upload : true,
              require_renewal_before_expiry: editingField.compliance_config.require_renewal_before_expiry || false,
              renewal_grace_period_days: editingField.compliance_config.renewal_grace_period_days || 30,
              has_sub_fields: editingField.compliance_config.has_sub_fields || false,
              sub_fields: editingField.compliance_config.sub_fields || null,
              // Map allow_user_upload to requires_file_upload for frontend UI
              requires_file_upload: editingField.compliance_config.allow_user_upload !== false,
            }
          : null,
      });
      
      // Set compliance type if it's a pre-defined type
      if (editingField.is_compliance && editingField.compliance_config?.sub_fields) {
        // Try to match with pre-defined types
        const subFields = editingField.compliance_config.sub_fields;
        let matchedType = "";
        
        // Check each pre-defined type
        for (const [key, predefined] of Object.entries(PREDEFINED_COMPLIANCE_TYPES)) {
          if (key === "custom") continue;
          
          // Simple matching: check if sub-fields match
          if (predefined.sub_fields.length === subFields.length) {
            const fieldNamesMatch = predefined.sub_fields.every((pf, idx) => 
              pf.field_name === subFields[idx]?.field_name
            );
            if (fieldNamesMatch) {
              matchedType = key;
              break;
            }
          }
        }
        
        if (matchedType) {
          setSelectedComplianceType(matchedType);
        } else {
          setSelectedComplianceType("custom");
          setCustomSubFields(subFields);
        }
      } else {
        setSelectedComplianceType("");
        setCustomSubFields([]);
      }

      // Load existing role/asset type links (only if not loading and data is available)
      if (editingField.is_compliance) {
        if (!complianceLinksLoading && complianceLinksData) {
          const roleLinks = complianceLinksData.filter(link => link.link_type === "role");
          const assetTypeLinks = complianceLinksData.filter(link => link.link_type === "asset_type");
          
          setSelectedRoles(roleLinks.map(link => link.link_slug).filter(Boolean));
          setSelectedAssetTypes(assetTypeLinks.map(link => link.link_slug).filter(Boolean));
          
          const roleFlags = {};
          roleLinks.forEach(link => {
            if (link.link_slug) {
              roleFlags[link.link_slug] = link.is_required || false;
            }
          });
          setRoleRequiredFlags(roleFlags);
          
          const assetTypeFlags = {};
          assetTypeLinks.forEach(link => {
            if (link.link_slug) {
              assetTypeFlags[link.link_slug] = link.is_required || false;
            }
          });
          setAssetTypeRequiredFlags(assetTypeFlags);
        } else if (!complianceLinksLoading && !complianceLinksData) {
          // No links found or query not enabled
          setSelectedRoles([]);
          setSelectedAssetTypes([]);
          setRoleRequiredFlags({});
          setAssetTypeRequiredFlags({});
        }
        // If loading, don't reset - wait for data
      } else {
        // Not a compliance field, reset links
        setSelectedRoles([]);
        setSelectedAssetTypes([]);
        setRoleRequiredFlags({});
        setAssetTypeRequiredFlags({});
      }
      // Set allowAllFileTypes based on accept field
      if (editingField.field_type === 'file') {
        const accept = fieldOptions.accept || '';
        setAllowAllFileTypes(!accept || accept === '' || accept === '*/*');
      }
    }
  }, [editingField, editingFieldSlug, selectedEntityType, complianceLinksData, complianceLinksLoading]);

  // Track if we're currently loading initial data to prevent auto-save during initial load
  const isInitialLoadRef = React.useRef(true);
  
  // Reset initial load flag when editing field changes
  React.useEffect(() => {
    if (editingFieldSlug) {
      isInitialLoadRef.current = true;
      // Set to false after a short delay to allow initial data to load
      const timer = setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editingFieldSlug]);

  // Auto-save required flags when they change (only when editing an existing field)
  React.useEffect(() => {
    // Only auto-save if we're editing an existing field and have a field slug
    if (!editingFieldSlug || !editingField?.is_compliance) {
      return;
    }

    // Don't auto-save during initial load
    if (isInitialLoadRef.current) {
      return;
    }

    const fieldSlug = editingField?.slug || editingFieldSlug;
    if (!fieldSlug) {
      return;
    }

    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      // Only save if we have selected roles or asset types
      if ((selectedRoles && selectedRoles.length > 0) || (selectedAssetTypes && selectedAssetTypes.length > 0)) {
        console.log("Auto-saving compliance field links due to required flag change:", {
          fieldSlug,
          selectedRoles,
          selectedAssetTypes,
          roleRequiredFlags,
          assetTypeRequiredFlags,
        });
        
        try {
          await complianceService.updateComplianceFieldLinks(
            fieldSlug,
            selectedRoles || [],
            selectedAssetTypes || [],
            roleRequiredFlags || {},
            assetTypeRequiredFlags || {}
          );
          
          // Invalidate query to refresh
          queryClient.invalidateQueries({ queryKey: ["compliance-links", fieldSlug] });
          console.log("Auto-saved compliance field links successfully");
        } catch (error) {
          console.error("Failed to auto-save compliance field links:", error);
          // Don't show toast for auto-save errors to avoid annoying the user
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [roleRequiredFlags, assetTypeRequiredFlags, editingFieldSlug, editingField?.is_compliance, editingField?.slug, selectedRoles, selectedAssetTypes, queryClient]);

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
        const sectionToUpdate = sections.find((s) => s.id === editingSectionId);
        if (!sectionToUpdate || !sectionToUpdate.slug) {
          console.error("Section missing slug:", sectionToUpdate);
          toast.error("Failed to update section: missing identifier");
          return;
        }
        await updateSectionMutation.mutateAsync({
          slug: sectionToUpdate.slug,
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
    setEditingFieldSlug(null); // Reset editing state
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
      is_compliance: false,
      requires_approval: false,
      expiry_reminder_days: null,
      compliance_config: null,
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
    setSelectedComplianceType("");
    setCustomSubFields([]);
    setSelectedRoles([]);
    setSelectedAssetTypes([]);
    setRoleRequiredFlags({});
    setAssetTypeRequiredFlags({});
  };

  const handleEditField = (fieldSlug) => {
    console.log("handleEditField called with slug:", fieldSlug);
    if (!fieldSlug) {
      console.error("handleEditField: fieldSlug is null/undefined!");
      toast.error("Cannot edit field: slug is missing");
      return;
    }
    
    // Reset form first to clear any previous data
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
      is_compliance: false,
      requires_approval: false,
      expiry_reminder_days: null,
      compliance_config: null,
    });
    
    // Set the slug to trigger the API call
    setEditingFieldSlug(fieldSlug);
    // Open the modal
    setIsCreateFieldModalOpen(true);
    console.log("Edit field state set - editingFieldSlug:", fieldSlug, "modal open:", true);
  };

  const handleDeleteField = async (fieldSlug) => {
    try {
      await deleteFieldMutation.mutateAsync(fieldSlug);
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

      // Handle compliance field toggle
      if (field === 'is_compliance') {
        if (!value) {
          // If unchecking compliance, clear compliance-related fields
          newData.requires_approval = false;
          newData.expiry_reminder_days = null;
          newData.compliance_config = null;
          setSelectedComplianceType("");
          setCustomSubFields([]);
        } else {
          // If checking compliance, ensure field type is file and configure file options
          if (newData.field_type !== "file") {
            newData.field_type = "file";
          }
          
          // Auto-configure file options if not already set
          if (!newData.field_options || !newData.field_options.accept) {
            const documentTypes = FILE_TYPE_CATEGORIES.documents.types.map(t => t.value);
            const imageTypes = FILE_TYPE_CATEGORIES.images.types.map(t => t.value);
            const allowedFileTypes = [...documentTypes, ...imageTypes].join(", ");
            
            newData.field_options = {
              ...newData.field_options,
              accept: allowedFileTypes,
              allowMultiple: false,
            };
            setAllowAllFileTypes(false);
          }
        }
      }

      return newData;
    });
  };

  const handleComplianceTypeChange = (complianceType) => {
    setSelectedComplianceType(complianceType);
    
    if (complianceType && complianceType !== "" && PREDEFINED_COMPLIANCE_TYPES[complianceType]) {
      const predefined = PREDEFINED_COMPLIANCE_TYPES[complianceType];
      
      // Get common file types for compliance documents (PDFs and images)
      const documentTypes = FILE_TYPE_CATEGORIES.documents.types.map(t => t.value);
      const imageTypes = FILE_TYPE_CATEGORIES.images.types.map(t => t.value);
      const allowedFileTypes = [...documentTypes, ...imageTypes].join(", ");
      
      // Auto-generate field_name from label
      const autoGeneratedName = predefined.label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
      // Auto-populate field label, description, and file configuration
      // By default, compliance fields require file upload (requires_file_upload: true)
      setFieldFormData((prev) => ({
        ...prev,
        field_name: autoGeneratedName,
        field_label: predefined.label,
        field_description: predefined.description,
        field_type: "file", // Default to file for compliance fields
        is_compliance: true,
        compliance_config: {
          auto_expire: true,
          notification_recipients: null,
          reminder_frequency: "daily",
          allow_user_upload: true,
          require_renewal_before_expiry: false,
          renewal_grace_period_days: 30,
          has_sub_fields: predefined.sub_fields.length > 0,
          sub_fields: predefined.sub_fields,
          requires_file_upload: true, // Frontend-only flag, mapped to allow_user_upload
        },
        // Auto-configure file options for compliance fields
        field_options: {
          ...prev.field_options,
          accept: allowedFileTypes, // Allow PDFs and images by default
          allowMultiple: false, // Single file upload by default for compliance
        },
      }));
      
      // Set allowAllFileTypes to false since we're setting specific types
      setAllowAllFileTypes(false);
      
      if (complianceType === "custom") {
        setCustomSubFields([]);
        // For custom, don't auto-populate label/description - let user set it
        setFieldFormData((prev) => ({
          ...prev,
          field_label: prev.field_label || "",
          field_description: prev.field_description || "",
          field_type: "file", // Default to file
          is_compliance: true,
          compliance_config: {
            auto_expire: true,
            notification_recipients: null,
            reminder_frequency: "daily",
            allow_user_upload: true,
            require_renewal_before_expiry: false,
            renewal_grace_period_days: 30,
            has_sub_fields: true,
            sub_fields: [],
            requires_file_upload: true, // Frontend-only flag, mapped to allow_user_upload
          },
          // Auto-configure file options for compliance fields
          field_options: {
            ...prev.field_options,
            accept: allowedFileTypes,
            allowMultiple: false,
          },
        }));
        setAllowAllFileTypes(false);
      }
    } else if (complianceType === "") {
      // Clear compliance config
      setFieldFormData((prev) => ({
        ...prev,
        compliance_config: null,
      }));
      setCustomSubFields([]);
    }
  };

  const handleCustomSubFieldChange = (index, field, value) => {
    const newSubFields = [...customSubFields];
    if (!newSubFields[index]) {
      newSubFields[index] = {
        field_name: "",
        field_label: "",
        field_type: "text",
        is_required: false,
      };
    }
    newSubFields[index][field] = value;
    
    // Auto-generate field_name from field_label
    if (field === "field_label" && value) {
      const autoGeneratedName = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      newSubFields[index].field_name = autoGeneratedName;
    }
    
    setCustomSubFields(newSubFields);
    
    // If a pre-defined type is selected, merge with its fields
    let allSubFields = newSubFields;
    if (selectedComplianceType && selectedComplianceType !== "" && selectedComplianceType !== "custom") {
      const predefinedFields = PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].sub_fields;
      allSubFields = [...predefinedFields, ...newSubFields];
    }
    
    // Update compliance_config
    setFieldFormData((prev) => ({
      ...prev,
      compliance_config: {
        ...(prev.compliance_config || {}),
        auto_expire: prev.compliance_config?.auto_expire !== undefined ? prev.compliance_config.auto_expire : true,
        notification_recipients: prev.compliance_config?.notification_recipients || null,
        reminder_frequency: prev.compliance_config?.reminder_frequency || "daily",
        allow_user_upload: prev.compliance_config?.allow_user_upload !== undefined ? prev.compliance_config.allow_user_upload : true,
        require_renewal_before_expiry: prev.compliance_config?.require_renewal_before_expiry || false,
        renewal_grace_period_days: prev.compliance_config?.renewal_grace_period_days || 30,
        has_sub_fields: true,
        sub_fields: allSubFields,
      },
    }));
  };

  const handleAddCustomSubField = () => {
    const newSubFields = [
      ...customSubFields,
      {
        field_name: "",
        field_label: "",
        field_type: "text",
        is_required: false,
      },
    ];
    setCustomSubFields(newSubFields);
    
    // If a pre-defined type is selected, merge with its fields
    let allSubFields = newSubFields;
    if (selectedComplianceType && selectedComplianceType !== "" && selectedComplianceType !== "custom") {
      const predefinedFields = PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].sub_fields;
      allSubFields = [...predefinedFields, ...newSubFields];
    }
    
    setFieldFormData((prev) => ({
      ...prev,
      compliance_config: {
        ...(prev.compliance_config || {}),
        auto_expire: prev.compliance_config?.auto_expire !== undefined ? prev.compliance_config.auto_expire : true,
        notification_recipients: prev.compliance_config?.notification_recipients || null,
        reminder_frequency: prev.compliance_config?.reminder_frequency || "daily",
        allow_user_upload: prev.compliance_config?.allow_user_upload !== undefined ? prev.compliance_config.allow_user_upload : true,
        require_renewal_before_expiry: prev.compliance_config?.require_renewal_before_expiry || false,
        renewal_grace_period_days: prev.compliance_config?.renewal_grace_period_days || 30,
        has_sub_fields: true,
        sub_fields: allSubFields,
      },
    }));
  };

  const handleRemoveCustomSubField = (index) => {
    const newSubFields = customSubFields.filter((_, i) => i !== index);
    setCustomSubFields(newSubFields);
    
    // If a pre-defined type is selected, merge with its fields
    let allSubFields = newSubFields;
    if (selectedComplianceType && selectedComplianceType !== "" && selectedComplianceType !== "custom") {
      const predefinedFields = PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].sub_fields;
      allSubFields = [...predefinedFields, ...newSubFields];
    }
    
    setFieldFormData((prev) => ({
      ...prev,
      compliance_config: {
        has_sub_fields: allSubFields.length > 0,
        sub_fields: allSubFields,
      },
    }));
  };

  const handleSubmitField = async () => {
    if (!fieldFormData.field_label || !fieldFormData.field_type) {
      toast.error("Please fill in required fields");
      return;
    }

    console.log("handleSubmitField - Form data:", {
      is_compliance: fieldFormData.is_compliance,
      selectedRoles,
      selectedAssetTypes,
      roleRequiredFlags,
      assetTypeRequiredFlags,
    });

    try {
      let createdFieldSlug = null;
      let createdField = null;

      if (editingFieldSlug) {
        // Update existing field
        // Ensure compliance_config includes all required fields with defaults
        const fieldDataToSubmit = { ...fieldFormData };
        
        // Clean up relationship_config - if all values are null/empty, set to null
        if (fieldDataToSubmit.relationship_config) {
          const hasValidValue = Object.values(fieldDataToSubmit.relationship_config).some(
            value => value !== null && value !== undefined && value !== ''
          );
          if (!hasValidValue) {
            fieldDataToSubmit.relationship_config = null;
          }
        }
        
        if (fieldDataToSubmit.is_compliance && fieldDataToSubmit.compliance_config) {
          // Ensure compliance_config has all required fields from ComplianceFieldConfig schema
          fieldDataToSubmit.compliance_config = {
            auto_expire: fieldDataToSubmit.compliance_config.auto_expire !== undefined 
              ? fieldDataToSubmit.compliance_config.auto_expire 
              : true,
            notification_recipients: fieldDataToSubmit.compliance_config.notification_recipients || null,
            reminder_frequency: fieldDataToSubmit.compliance_config.reminder_frequency || "daily",
            allow_user_upload: fieldDataToSubmit.compliance_config.requires_file_upload !== false 
              ? (fieldDataToSubmit.compliance_config.allow_user_upload !== undefined 
                  ? fieldDataToSubmit.compliance_config.allow_user_upload 
                  : true)
              : false, // Map requires_file_upload to allow_user_upload
            require_renewal_before_expiry: fieldDataToSubmit.compliance_config.require_renewal_before_expiry || false,
            renewal_grace_period_days: fieldDataToSubmit.compliance_config.renewal_grace_period_days || 30,
            has_sub_fields: fieldDataToSubmit.compliance_config.has_sub_fields || false,
            sub_fields: fieldDataToSubmit.compliance_config.sub_fields || null,
          };
        }
        createdField = await updateFieldMutation.mutateAsync({
          slug: editingFieldSlug,
          fieldData: fieldDataToSubmit,
        });
        createdFieldSlug = createdField?.slug || editingFieldSlug;
        console.log("Field updated - createdFieldSlug:", createdFieldSlug, "createdField:", createdField);
        toast.success("Field updated successfully!");
      } else {
        // Create new field
        // Ensure compliance_config includes all required fields with defaults
        const fieldDataToSubmit = { ...fieldFormData };
        
        // Clean up relationship_config - if all values are null/empty, set to null
        if (fieldDataToSubmit.relationship_config) {
          const hasValidValue = Object.values(fieldDataToSubmit.relationship_config).some(
            value => value !== null && value !== undefined && value !== ''
          );
          if (!hasValidValue) {
            fieldDataToSubmit.relationship_config = null;
          }
        }
        
        if (fieldDataToSubmit.is_compliance && fieldDataToSubmit.compliance_config) {
          // Ensure compliance_config has all required fields from ComplianceFieldConfig schema
          fieldDataToSubmit.compliance_config = {
            auto_expire: fieldDataToSubmit.compliance_config.auto_expire !== undefined 
              ? fieldDataToSubmit.compliance_config.auto_expire 
              : true,
            notification_recipients: fieldDataToSubmit.compliance_config.notification_recipients || null,
            reminder_frequency: fieldDataToSubmit.compliance_config.reminder_frequency || "daily",
            allow_user_upload: fieldDataToSubmit.compliance_config.requires_file_upload !== false 
              ? (fieldDataToSubmit.compliance_config.allow_user_upload !== undefined 
                  ? fieldDataToSubmit.compliance_config.allow_user_upload 
                  : true)
              : false, // Map requires_file_upload to allow_user_upload
            require_renewal_before_expiry: fieldDataToSubmit.compliance_config.require_renewal_before_expiry || false,
            renewal_grace_period_days: fieldDataToSubmit.compliance_config.renewal_grace_period_days || 30,
            has_sub_fields: fieldDataToSubmit.compliance_config.has_sub_fields || false,
            sub_fields: fieldDataToSubmit.compliance_config.sub_fields || null,
          };
        }
        createdField = await createFieldMutation.mutateAsync(fieldDataToSubmit);
        createdFieldSlug = createdField?.slug;
        console.log("Field created - createdFieldSlug:", createdFieldSlug, "createdField:", createdField);
        if (!createdFieldSlug) {
          console.error("Field created but slug is missing! createdField:", createdField);
          toast.error("Field created but slug is missing. Links may not be created.");
        }
        toast.success("Field created successfully!");
      }

      // If it's a compliance field, update links to selected roles and asset types
      console.log("Checking if links should be created:", {
        is_compliance: fieldFormData.is_compliance,
        createdFieldSlug,
        selectedRoles,
        selectedAssetTypes,
        selectedRolesLength: selectedRoles.length,
        selectedAssetTypesLength: selectedAssetTypes.length,
      });
      
      if (fieldFormData.is_compliance && createdFieldSlug) {
        console.log("Creating compliance field links:", {
          fieldSlug: createdFieldSlug,
          selectedRoles,
          selectedAssetTypes,
          roleRequiredFlags,
          assetTypeRequiredFlags,
        });
        
        const linkPromises = [];
        const existingLinks = complianceLinksData || [];
        
        // Get existing role and asset type slugs
        const existingRoleSlugs = existingLinks
          .filter(link => link.link_type === "role" && link.link_slug)
          .map(link => link.link_slug);
        const existingAssetTypeSlugs = existingLinks
          .filter(link => link.link_type === "asset_type" && link.link_slug)
          .map(link => link.link_slug);

        console.log("Existing links:", { existingRoleSlugs, existingAssetTypeSlugs });
        console.log("Selected roles:", selectedRoles);
        console.log("Selected asset types:", selectedAssetTypes);

        // Use bulk update endpoint to handle all links at once
        // This will create new links, update existing ones, and deactivate removed ones
        try {
          await complianceService.updateComplianceFieldLinks(
            createdFieldSlug,
            selectedRoles || [],
            selectedAssetTypes || [],
            roleRequiredFlags || {},
            assetTypeRequiredFlags || {}
          );
          
          console.log("Successfully updated compliance field links");
          toast.success("Compliance field links updated successfully");
          
          // Invalidate compliance links query to refresh the UI
          if (createdFieldSlug) {
            queryClient.invalidateQueries({ queryKey: ["compliance-links", createdFieldSlug] });
            console.log("Invalidated compliance links query for field:", createdFieldSlug);
          }
        } catch (error) {
          console.error("Error updating compliance field links:", error);
          toast.error("Failed to update compliance field links", {
            description: error.response?.data?.detail || error.message || "An error occurred while updating links",
          });
        }
      } else {
        console.log("Not creating links - conditions not met:", {
          is_compliance: fieldFormData.is_compliance,
          createdFieldSlug,
          reason: !fieldFormData.is_compliance ? "Not a compliance field" : "Field slug missing",
        });
      }

      // Reset form and close modal
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
        section_id: fieldFormData.section_id || 0,
        is_active: true,
        is_compliance: false,
        requires_approval: false,
        expiry_reminder_days: null,
        compliance_config: null,
      });
      setEditingFieldSlug(null);
      setIsCreateFieldModalOpen(false);
      setSelectedComplianceType("");
      setCustomSubFields([]);
      setSelectedRoles([]);
      setSelectedAssetTypes([]);
      setRoleRequiredFlags({});
      setAssetTypeRequiredFlags({});
    } catch (error) {
      console.error("Failed to save field:", error);
      toast.error("Failed to save field. Please try again.");
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
      is_compliance: false,
      requires_approval: false,
      expiry_reminder_days: null,
      compliance_config: null,
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

    if (!section.slug) {
      console.error("Section missing slug:", section);
      toast.error("Failed to update section: missing identifier");
      return;
    }

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
        slug: section.slug,
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

  // Preview API hook - Disabled for admin page since we don't have a specific entity
  // The admin page shows field definitions, not entity-specific values
  const {
    data: hierarchyData,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchHierarchy,
  } = useCustomFieldsHierarchy(selectedEntityType, null); // Pass null to disable the query

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="min-w-0 flex-1">

          {/* State Indicators */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>State Persisted</span>
            </div>
            <button
              onClick={handleResetState}
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {canCreateCustomField && (
            <Button
              onClick={handleCreateSection}
              size="sm"
              className="shrink-0"
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
              size="sm"
              className="shrink-0"
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
                            onClick={() => {
                              console.log("Edit button clicked - field object:", field);
                              console.log("Edit button clicked - field.slug:", field.slug);
                              console.log("Edit button clicked - field.id:", field.id);
                              if (!field.slug) {
                                console.error("Field slug is missing! Field:", field);
                                toast.error("Cannot edit field: slug is missing");
                                return;
                              }
                              handleEditField(field.slug);
                            }}
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
                                  onClick={() => handleDeleteField(field.slug)}
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
              {editingFieldSlug ? "Edit Field" : "Create New Field"}
            </DialogTitle>
            <DialogDescription>
              {editingFieldSlug
                ? `Update the custom field for ${selectedEntityType.toLowerCase()}.`
                : `Add a new custom field for ${selectedEntityType.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          {editingFieldSlug && editingFieldLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading field data...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Compliance Settings - At the Top */}
              <div className="pt-4 border-t border-b pb-4 space-y-4 bg-muted/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Compliance Settings</h3>
                </div>
                
                <div className="space-y-4 pl-7">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="isCompliance">Compliance Field</Label>
                    <Switch
                      id="isCompliance"
                      checked={fieldFormData.is_compliance || false}
                      onCheckedChange={(checked) =>
                        handleFieldInputChange("is_compliance", checked)
                      }
                    />
                    <p className="text-xs text-muted-foreground ml-2">
                      Mark this field as a compliance requirement
                    </p>
                  </div>

                  {fieldFormData.is_compliance && (
                    <>
                      {/* Compliance Type Selector */}
                      <div className="space-y-2">
                        <Label htmlFor="complianceType">Compliance Type *</Label>
                        <Select
                          value={selectedComplianceType}
                          onValueChange={handleComplianceTypeChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a compliance type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PREDEFINED_COMPLIANCE_TYPES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                {value.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Choose a pre-defined UK healthcare compliance type or create custom
                        </p>
                      </div>

                      {/* Show pre-defined type info and fields */}
                      {selectedComplianceType && selectedComplianceType !== "" && selectedComplianceType !== "custom" && (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm font-medium text-blue-900">
                              {PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].label}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              {PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].description}
                            </p>
                          </div>
                          
                          {/* Display sub-fields that will be created */}
                          <div className="border rounded-lg p-4 bg-background">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold">Fields Included ({PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].sub_fields.length})</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddCustomSubField}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add More Fields
                              </Button>
                            </div>
                            
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].sub_fields.map((subField, index) => (
                                <div key={index} className="flex items-start gap-3 p-2 border rounded bg-muted/30">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{subField.field_label}</span>
                                      {subField.is_required && (
                                        <Badge variant="outline" className="text-xs">Required</Badge>
                                      )}
                                      <Badge variant="secondary" className="text-xs capitalize">{subField.field_type}</Badge>
                                    </div>
                                    {subField.help_text && (
                                      <p className="text-xs text-muted-foreground mt-1">{subField.help_text}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Field: <code className="bg-muted px-1 rounded">{subField.field_name}</code>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {customSubFields.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <h5 className="text-sm font-medium mb-2">Additional Custom Fields ({customSubFields.length})</h5>
                                <div className="space-y-2">
                                  {customSubFields.map((subField, index) => (
                                    <div key={`custom-${index}`} className="flex items-start gap-3 p-2 border rounded bg-yellow-50">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">{subField.field_label || "Unnamed Field"}</span>
                                          {subField.is_required && (
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                          )}
                                          <Badge variant="secondary" className="text-xs capitalize">{subField.field_type || "text"}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Field: <code className="bg-muted px-1 rounded">{subField.field_name || "(auto-generated)"}</code>
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newCustomFields = customSubFields.filter((_, i) => i !== index);
                                          setCustomSubFields(newCustomFields);
                                          // Update compliance_config
                                          const predefinedFields = PREDEFINED_COMPLIANCE_TYPES[selectedComplianceType].sub_fields;
                                          setFieldFormData((prev) => ({
                                            ...prev,
                                            compliance_config: {
                                              has_sub_fields: true,
                                              sub_fields: [...predefinedFields, ...newCustomFields],
                                            },
                                          }));
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Custom Sub-Fields Editor */}
                      {(selectedComplianceType === "custom" || (selectedComplianceType && selectedComplianceType !== "" && customSubFields.length > 0)) && (
                        <div className="space-y-3 border rounded-lg p-4 bg-background">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                              {selectedComplianceType === "custom" 
                                ? "Custom Compliance Fields" 
                                : "Additional Custom Fields"}
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddCustomSubField}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Field
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {customSubFields.map((subField, index) => (
                              <div key={index} className="border rounded p-3 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Field Label *</Label>
                                    <Input
                                      value={subField.field_label || ""}
                                      onChange={(e) => handleCustomSubFieldChange(index, "field_label", e.target.value)}
                                      placeholder="e.g., First Name"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Field Type *</Label>
                                    <Select
                                      value={subField.field_type || "text"}
                                      onValueChange={(value) => handleCustomSubFieldChange(index, "field_type", value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                        <SelectItem value="textarea">Textarea</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={subField.is_required || false}
                                      onChange={(e) => handleCustomSubFieldChange(index, "is_required", e.target.checked)}
                                      className="rounded"
                                    />
                                    <Label className="text-xs">Required</Label>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveCustomSubField(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Field Name: {subField.field_name || "(auto-generated)"}
                                </p>
                              </div>
                            ))}
                            {customSubFields.length === 0 && selectedComplianceType === "custom" && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No custom fields added yet. Click "Add Field" to create one.
                              </p>
                            )}
                            {customSubFields.length === 0 && selectedComplianceType !== "custom" && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Click "Add More Fields" above or "Add Field" here to add additional custom fields.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Show "Add More Fields" button when pre-defined type is selected but no custom fields yet */}
                      {selectedComplianceType && selectedComplianceType !== "" && selectedComplianceType !== "custom" && customSubFields.length === 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomSubField}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Additional Custom Fields
                        </Button>
                      )}

                      <div className="flex items-center gap-2">
                        <Label htmlFor="requiresFileUpload">Require File Upload</Label>
                        <Switch
                          id="requiresFileUpload"
                          checked={fieldFormData.compliance_config?.requires_file_upload !== false}
                          onCheckedChange={(checked) => {
                            const currentConfig = fieldFormData.compliance_config || {};
                            handleFieldInputChange("compliance_config", {
                              ...currentConfig,
                              requires_file_upload: checked,
                            });
                            
                            // If file upload is disabled, allow other field types
                            if (!checked) {
                              // Don't force field_type to "file" - let user choose
                            } else {
                              // If enabling file upload, set field type to file
                              handleFieldInputChange("field_type", "file");
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground ml-2">
                          {fieldFormData.compliance_config?.requires_file_upload !== false
                            ? "This compliance field requires a document/file upload"
                            : "This compliance field does not require file upload (data entry only)"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor="requiresApproval">Requires Approval</Label>
                        <Switch
                          id="requiresApproval"
                          checked={fieldFormData.requires_approval || false}
                          onCheckedChange={(checked) =>
                            handleFieldInputChange("requires_approval", checked)
                          }
                          disabled={fieldFormData.compliance_config?.requires_file_upload === false}
                        />
                        <p className="text-xs text-muted-foreground ml-2">
                          {fieldFormData.compliance_config?.requires_file_upload === false
                            ? "Approval only applies to file uploads"
                            : "User uploads need admin approval"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiryReminderDays">Expiry Reminder Days</Label>
                        <Input
                          id="expiryReminderDays"
                          type="number"
                          min="0"
                          max="365"
                          placeholder="e.g., 30"
                          value={fieldFormData.expiry_reminder_days || ''}
                          onChange={(e) =>
                            handleFieldInputChange("expiry_reminder_days", e.target.value ? parseInt(e.target.value) : null)
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Days before expiry to send reminder notifications (e.g., 30 for 30 days before)
                        </p>
                      </div>

                      {/* Additional Compliance Configuration */}
                      <div className="space-y-4 border-t pt-4 mt-4">
                        <h4 className="text-sm font-semibold">Advanced Compliance Settings</h4>
                        
                        {/* Reminder Frequency */}
                        <div className="space-y-2">
                          <Label htmlFor="reminderFrequency">Reminder Frequency</Label>
                          <Select
                            id="reminderFrequency"
                            value={fieldFormData.compliance_config?.reminder_frequency || "daily"}
                            onValueChange={(value) => {
                              const currentConfig = fieldFormData.compliance_config || {};
                              handleFieldInputChange("compliance_config", {
                                ...currentConfig,
                                reminder_frequency: value,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            How often to send reminder notifications for expiring compliance items
                          </p>
                        </div>

                        {/* Notification Recipients */}
                        <div className="space-y-2">
                          <Label htmlFor="notificationRecipients">Notification Recipients (Email)</Label>
                          <Textarea
                            id="notificationRecipients"
                            placeholder="email1@example.com, email2@example.com"
                            value={fieldFormData.compliance_config?.notification_recipients?.join(", ") || ""}
                            onChange={(e) => {
                              const currentConfig = fieldFormData.compliance_config || {};
                              const emails = e.target.value
                                .split(",")
                                .map(email => email.trim())
                                .filter(email => email.length > 0);
                              handleFieldInputChange("compliance_config", {
                                ...currentConfig,
                                notification_recipients: emails.length > 0 ? emails : null,
                              });
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Comma-separated email addresses to notify about compliance expiry (leave empty for default recipients)
                          </p>
                        </div>

                        {/* Auto Expire */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor="autoExpire">Auto Expire</Label>
                          <Switch
                            id="autoExpire"
                            checked={fieldFormData.compliance_config?.auto_expire !== false}
                            onCheckedChange={(checked) => {
                              const currentConfig = fieldFormData.compliance_config || {};
                              handleFieldInputChange("compliance_config", {
                                ...currentConfig,
                                auto_expire: checked,
                              });
                            }}
                          />
                          <p className="text-xs text-muted-foreground ml-2">
                            Automatically mark compliance items as expired when expiry_date passes
                          </p>
                        </div>

                        {/* Require Renewal Before Expiry */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor="requireRenewalBeforeExpiry">Require Renewal Before Expiry</Label>
                          <Switch
                            id="requireRenewalBeforeExpiry"
                            checked={fieldFormData.compliance_config?.require_renewal_before_expiry || false}
                            onCheckedChange={(checked) => {
                              const currentConfig = fieldFormData.compliance_config || {};
                              handleFieldInputChange("compliance_config", {
                                ...currentConfig,
                                require_renewal_before_expiry: checked,
                              });
                            }}
                          />
                          <p className="text-xs text-muted-foreground ml-2">
                            Force renewal before the expiry date (prevents last-minute renewals)
                          </p>
                        </div>

                        {/* Renewal Grace Period */}
                        <div className="space-y-2">
                          <Label htmlFor="renewalGracePeriodDays">Renewal Grace Period (Days)</Label>
                          <Input
                            id="renewalGracePeriodDays"
                            type="number"
                            min="0"
                            max="365"
                            placeholder="e.g., 30"
                            value={fieldFormData.compliance_config?.renewal_grace_period_days || 30}
                            onChange={(e) => {
                              const currentConfig = fieldFormData.compliance_config || {};
                              handleFieldInputChange("compliance_config", {
                                ...currentConfig,
                                renewal_grace_period_days: e.target.value ? parseInt(e.target.value) : 30,
                              });
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Days after expiry to allow renewal (default: 30 days)
                          </p>
                        </div>
                      </div>

                      {/* Role Linking - Only for user entity type */}
                      {fieldFormData.entity_type === "user" && (
                        <div className="space-y-3 border-t pt-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Link to Job Roles / Shift Roles</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select which roles this compliance field applies to. Leave empty to apply to all roles.
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                            {roles.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">No roles available</p>
                            ) : (
                              roles.map((role) => {
                                const roleSlug = role.slug || role.id?.toString();
                                if (!roleSlug) {
                                  console.warn("Role missing slug:", role);
                                  return null;
                                }
                                const isSelected = selectedRoles.includes(roleSlug);
                                return (
                                  <div key={role.id || roleSlug} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`role-${roleSlug}`}
                                      checked={isSelected}
                                      onChange={(e) => {
                                        console.log("Role checkbox changed:", { roleSlug, checked: e.target.checked, role });
                                        if (e.target.checked) {
                                          if (!roleSlug) {
                                            console.error("Cannot add role - slug is missing:", role);
                                            toast.error("Cannot select role: slug is missing");
                                            return;
                                          }
                                          const newSelected = [...selectedRoles, roleSlug];
                                          console.log("Adding role to selectedRoles:", { roleSlug, newSelected });
                                          setSelectedRoles(newSelected);
                                        } else {
                                          const newSelected = selectedRoles.filter(s => s !== roleSlug);
                                          console.log("Removing role from selectedRoles:", { roleSlug, newSelected });
                                          setSelectedRoles(newSelected);
                                          // Remove required flag
                                          const newFlags = { ...roleRequiredFlags };
                                          delete newFlags[roleSlug];
                                          setRoleRequiredFlags(newFlags);
                                        }
                                      }}
                                      className="rounded"
                                    />
                                    <Label htmlFor={`role-${roleSlug}`} className="flex-1 cursor-pointer text-sm">
                                      {role.display_name || role.name || role.role_name || roleSlug}
                                    </Label>
                                    {isSelected && (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`role-required-${roleSlug}`}
                                          checked={roleRequiredFlags[roleSlug] || false}
                                          onChange={(e) => {
                                            setRoleRequiredFlags({
                                              ...roleRequiredFlags,
                                              [roleSlug]: e.target.checked,
                                            });
                                          }}
                                          className="rounded"
                                        />
                                        <Label htmlFor={`role-required-${roleSlug}`} className="text-xs text-muted-foreground cursor-pointer">
                                          Required
                                        </Label>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Asset Type Linking - Only for asset entity type */}
                      {fieldFormData.entity_type === "asset" && (
                        <div className="space-y-3 border-t pt-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Link to Asset Types</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select which asset types this compliance field applies to. Leave empty to apply to all asset types.
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                            {assetTypes.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">No asset types available</p>
                            ) : (
                              assetTypes.map((assetType) => {
                                const assetTypeSlug = assetType.slug;
                                const isSelected = selectedAssetTypes.includes(assetTypeSlug);
                                return (
                                  <div key={assetType.id || assetTypeSlug} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`asset-type-${assetTypeSlug}`}
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedAssetTypes([...selectedAssetTypes, assetTypeSlug]);
                                        } else {
                                          setSelectedAssetTypes(selectedAssetTypes.filter(s => s !== assetTypeSlug));
                                          // Remove required flag
                                          const newFlags = { ...assetTypeRequiredFlags };
                                          delete newFlags[assetTypeSlug];
                                          setAssetTypeRequiredFlags(newFlags);
                                        }
                                      }}
                                      className="rounded"
                                    />
                                    <Label htmlFor={`asset-type-${assetTypeSlug}`} className="flex-1 cursor-pointer text-sm">
                                      {assetType.name || assetType.asset_type_name || assetTypeSlug}
                                    </Label>
                                    {isSelected && (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`asset-type-required-${assetTypeSlug}`}
                                          checked={assetTypeRequiredFlags[assetTypeSlug] || false}
                                          onChange={(e) => {
                                            setAssetTypeRequiredFlags({
                                              ...assetTypeRequiredFlags,
                                              [assetTypeSlug]: e.target.checked,
                                            });
                                          }}
                                          className="rounded"
                                        />
                                        <Label htmlFor={`asset-type-required-${assetTypeSlug}`} className="text-xs text-muted-foreground cursor-pointer">
                                          Required
                                        </Label>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

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
                  disabled={fieldFormData.is_compliance && fieldFormData.compliance_config?.requires_file_upload !== false}
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
                  {fieldFormData.is_compliance && fieldFormData.compliance_config?.requires_file_upload !== false
                    ? "Compliance fields with file upload are automatically set to 'File Upload' type"
                    : fieldFormData.is_compliance && fieldFormData.compliance_config?.requires_file_upload === false
                    ? "Compliance field without file upload - choose any field type"
                    : "Choose the input type for this field"}
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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      File Configuration
                    </Label>
                    {fieldFormData.is_compliance && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-configured for Compliance
                      </Badge>
                    )}
                  </div>

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
                      handleFieldInputChange("is_required", checked)
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="isUnique">Unique</Label>
                  <Switch
                    id="isUnique"
                    checked={fieldFormData.is_unique}
                    onCheckedChange={(checked) =>
                      handleFieldInputChange("is_unique", checked)
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
              {editingFieldSlug ? "Update Field" : "Create Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomFieldsAdminPage;

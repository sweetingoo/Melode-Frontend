"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithUrl } from "@/components/AvatarWithUrl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Smartphone,
  Camera,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Settings,
  Bell,
  Loader2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useMyProfile,
  useMyStats,
  useUpdateProfile,
  useChangePassword,
  usePendingProfile,
  useAcceptProfile,
  useUploadAvatar,
  useMFAStatus,
  useSetupMFA,
  useVerifyMFA,
  useDisableMFA,
  useRegenerateBackupCodes,
  useUserCustomFields,
  useUserCustomFieldsHierarchy,
  useUpdateUserCustomField,
  useBulkUpdateUserCustomFields,
  useAddUserGroupEntry,
  useUploadFile,
} from "@/hooks/useProfile";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import MultiFileUpload from "@/components/MultiFileUpload";
import FileAttachmentList from "@/components/FileAttachmentList";
import { ComplianceFieldCard } from "@/components/ComplianceFieldCard";
import { ComplianceUploadModal } from "@/components/ComplianceUploadModal";
import { ComplianceHistory } from "@/components/ComplianceHistory";
import { useEntityCompliance, useUploadCompliance, useRenewCompliance, useComplianceHistory } from "@/hooks/useCompliance";
import { filesService } from "@/services/files";

export default function ProfilePage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // MFA State
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaVerificationToken, setMfaVerificationToken] = useState("");
  const [mfaDisableToken, setMfaDisableToken] = useState("");
  const [backupCodesRegenerateToken, setBackupCodesRegenerateToken] = useState("");

  // Custom Fields State
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [customFieldsErrors, setCustomFieldsErrors] = useState({});
  const [hasCustomFieldsChanges, setHasCustomFieldsChanges] = useState(false);
  const [isUpdatingCustomFields, setIsUpdatingCustomFields] = useState(false);

  // Compliance State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedComplianceField, setSelectedComplianceField] = useState(null);
  const [selectedComplianceValue, setSelectedComplianceValue] = useState(null);
  const [isRenewal, setIsRenewal] = useState(false);

  // API Hooks
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useMyProfile();

  const { data: statsData, isLoading: statsLoading } = useMyStats();

  const { data: pendingProfile, isLoading: pendingLoading } =
    usePendingProfile();

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const acceptProfileMutation = useAcceptProfile();
  const uploadAvatarMutation = useUploadAvatar();

  // Handle avatar upload success
  useEffect(() => {
    if (uploadAvatarMutation.isSuccess && uploadAvatarMutation.data) {
      console.log('Avatar upload success, data:', uploadAvatarMutation.data);
      
      // Extract file ID (file reference) from upload response
      const uploadData = uploadAvatarMutation.data;
      const fileReference = uploadData?.id || 
                           uploadData?.file_reference_id ||
                           uploadData?.file_id;
      
      if (fileReference) {
        // Update formData immediately with file reference so avatar displays right away
        setFormData(prev => ({
          ...prev,
          avatar: fileReference
        }));
        console.log('Updated formData.avatar with file reference:', fileReference);
        
        // Don't clear preview immediately - let AvatarWithUrl's onImageLoad callback handle it
        // This ensures the preview stays visible until the uploaded image is fully loaded
      }
    }
  }, [uploadAvatarMutation.isSuccess, uploadAvatarMutation.data]);

  // MFA Hooks
  const { data: mfaStatus, isLoading: mfaStatusLoading } = useMFAStatus();
  const setupMFAMutation = useSetupMFA();
  const verifyMFAMutation = useVerifyMFA();
  const disableMFAMutation = useDisableMFA();
  const regenerateBackupCodesMutation = useRegenerateBackupCodes();

  // Custom Fields Hooks
  const { data: userCustomFields, isLoading: userCustomFieldsLoading } = useUserCustomFields(profileData?.slug);
  const { data: customFieldsHierarchy, isLoading: customFieldsHierarchyLoading } = useUserCustomFieldsHierarchy(profileData?.slug);
  const updateUserCustomFieldMutation = useUpdateUserCustomField();
  const bulkUpdateUserCustomFieldsMutation = useBulkUpdateUserCustomFields();
  const addUserGroupEntryMutation = useAddUserGroupEntry();
  const uploadFileMutation = useUploadFile();

  // Get compliance data to check for missing required fields
  // Only fetch if profile slug is available
  const { data: complianceData, refetch: refetchCompliance } = useEntityCompliance(
    "user",
    profileData?.slug || null,
    profileData?.role?.slug || null,
    null
  );

  // Compliance Hooks
  const uploadComplianceMutation = useUploadCompliance();
  const renewComplianceMutation = useRenewCompliance();

  // Check if there are missing required compliance fields
  const hasMissingRequiredCompliance = complianceData?.required_missing_count > 0;
  const missingComplianceCount = complianceData?.required_missing_count || 0;

  // Check for missing required regular custom fields
  const missingRequiredCustomFieldsCount = React.useMemo(() => {
    if (!customFieldsHierarchy?.sections) {
      return 0;
    }

    let missingCount = 0;
    customFieldsHierarchy.sections.forEach((section) => {
      section.fields?.forEach((field) => {
        // Skip compliance fields - they're handled separately
        const isComplianceField = complianceData?.compliance_fields?.some(cf => cf.custom_field_id === field.id);
        if (isComplianceField) {
          return;
        }

        if (field.is_required && field.is_active !== false) {
          // Check if field has a value from userCustomFields or customFieldsData
          let hasValue = false;
          
          if (userCustomFields?.sections) {
            const fieldValue = userCustomFields.sections
              ?.flatMap(s => s.fields || [])
              .find(f => f.id === field.id);
            
            if (fieldValue?.value_data) {
              // Check if value_data has actual content
              if (typeof fieldValue.value_data === 'object') {
                hasValue = Object.keys(fieldValue.value_data).length > 0 && 
                          (fieldValue.value_data.value !== undefined && fieldValue.value_data.value !== null && fieldValue.value_data.value !== '');
              } else {
                hasValue = true;
              }
            }
          }
          
          // Also check customFieldsData as fallback
          if (!hasValue && customFieldsData[field.id] !== undefined && customFieldsData[field.id] !== null && customFieldsData[field.id] !== '') {
            hasValue = true;
          }
          
          if (!hasValue) {
            missingCount++;
          }
        }
      });
    });
    return missingCount;
  }, [customFieldsHierarchy, userCustomFields, customFieldsData, complianceData]);

  const totalMissingRequired = missingComplianceCount + missingRequiredCustomFieldsCount;
  const hasMissingRequired = totalMissingRequired > 0;

  // Compliance Handlers
  const handleComplianceUpload = (field) => {
    setSelectedComplianceField(field);
    setSelectedComplianceValue(null);
    setIsRenewal(false);
    setUploadModalOpen(true);
  };

  const handleComplianceRenew = (value, field) => {
    setSelectedComplianceValue(value);
    setSelectedComplianceField(field);
    setIsRenewal(true);
    setUploadModalOpen(true);
  };

  const handleComplianceViewHistory = async (field, value) => {
    if (!value || !value.id || value.id === 0) {
      return;
    }
    setSelectedComplianceField(field);
    setSelectedComplianceValue(value);
    setHistoryModalOpen(true);
  };

  const handleComplianceDownload = async (file) => {
    if (file.file_reference_id || file.id) {
      try {
        const response = await filesService.getFileUrl(file.file_reference_id || file.id);
        const url = response.url || response;
        if (url) {
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error("Failed to get file URL:", error);
        if (file.download_url) {
          window.open(file.download_url, "_blank");
        }
      }
    } else if (file.download_url) {
      window.open(file.download_url, "_blank");
    }
  };

  const handleComplianceUploadSubmit = async (uploadData) => {
    if (isRenewal && selectedComplianceValue) {
      await renewComplianceMutation.mutateAsync({
        valueSlug: selectedComplianceValue.slug,
        renewalData: uploadData,
      });
    } else {
      await uploadComplianceMutation.mutateAsync(uploadData);
    }
    setUploadModalOpen(false);
    refetchCompliance();
  };

  // Get history for selected compliance field
  const { data: complianceHistoryData, isLoading: complianceHistoryLoading } = useComplianceHistory(
    selectedComplianceField?.slug || selectedComplianceField?.field_slug || "",
    "user",
    profileData?.slug || "",
    1,
    50
  );

  // Local state for form data (only editable fields)
  const [formData, setFormData] = useState({
    bio: "",
    avatar: "",
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });


  // Additional Information State
  const [additionalData, setAdditionalData] = useState({
    timezone: "Europe/London",
    language: "English",
    notifications: {
      email: true,
      sms: false,
      push: true,
      security: true,
    },
    preferences: {
      theme: "system",
      sidebarCollapsed: false,
      dashboardLayout: "grid",
    },
  });

  // Update form data when profile data loads (only editable fields)
  useEffect(() => {
    if (profileData) {
      console.log('Profile data loaded, avatar values:', {
        profileData_avatar: profileData.avatar,
        profileData_avatar_url: profileData.avatar_url,
        current_formData_avatar: formData.avatar,
        full_profileData: profileData
      });
      setFormData(prev => ({
        bio: profileData.bio || "",
        // Use file reference from profile (already extracted in transformProfile)
        // Only update if we don't have a more recent one from upload
        avatar: prev.avatar || profileData.avatar || profileData.avatar_url || "",
      }));
    }
  }, [profileData]);

  // Utility function to extract value from API response
  const extractValueFromAPIResponse = (field, apiValue) => {
    if (!apiValue) return '';

    const fieldType = field.field_type || field.type;

    switch (fieldType?.toLowerCase()) {
      case 'text':
      case 'string':
      case 'email':
      case 'phone':
      case 'url':
      case 'textarea':
      case 'select':
      case 'dropdown':
      case 'radio':
      case 'radio_group':
      case 'time':
        return apiValue.value || apiValue || '';

      case 'number':
      case 'integer':
      case 'decimal':
      case 'float':
        return apiValue.value !== undefined ? apiValue.value : apiValue || '';

      case 'boolean':
      case 'checkbox':
        return apiValue.value !== undefined ? apiValue.value : Boolean(apiValue);

      case 'date':
        return apiValue.value || apiValue || '';

      case 'datetime':
      case 'date_time':
        return apiValue.value || apiValue || '';

      case 'multiselect':
        return Array.isArray(apiValue.value) ? apiValue.value :
          Array.isArray(apiValue) ? apiValue : [];

      case 'file':
        return apiValue.file_id || apiValue || '';

      case 'json':
        return typeof apiValue === 'string' ? apiValue : JSON.stringify(apiValue);

      default:
        return apiValue.value || apiValue || '';
    }
  };

  // Initialize custom fields data when user custom fields load
  useEffect(() => {
    if (userCustomFields && userCustomFields.sections) {
      // Extract field values from the hierarchical structure
      const fieldValues = {};
      userCustomFields.sections.forEach(section => {
        section.fields?.forEach(field => {
          if (field.value_data) {
            fieldValues[field.id] = extractValueFromAPIResponse(field, field.value_data);
          } else {
            // Initialize empty values for fields without data
            fieldValues[field.id] = '';
          }
        });
      });
      setCustomFieldsData(fieldValues);
    }
  }, [userCustomFields]);

  // Check for changes when customFieldsData is initialized (after data loads)
  useEffect(() => {
    if (customFieldsData && Object.keys(customFieldsData).length > 0 && userCustomFields) {
      // Only run change detection once when data is first loaded
      // Individual field changes are handled in handleCustomFieldChange
      checkForCustomFieldsChanges();
    }
  }, [userCustomFields]); // Only depend on userCustomFields, not customFieldsData

  // Reset customFieldsData when userCustomFields updates after a save
  useEffect(() => {
    if (userCustomFields && userCustomFields.sections && !isUpdatingCustomFields) {
      // This runs when userCustomFields updates (after API refetch)
      // Reset customFieldsData to match the fresh API data
      const fieldValues = {};
      userCustomFields.sections.forEach(section => {
        section.fields?.forEach(field => {
          if (field.value_data) {
            fieldValues[field.id] = extractValueFromAPIResponse(field, field.value_data);
          } else {
            fieldValues[field.id] = '';
          }
        });
      });
      setCustomFieldsData(fieldValues);
    }
  }, [userCustomFields, isUpdatingCustomFields]);


  const handleProfileUpdate = async () => {
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    changePasswordMutation.mutate({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
    });
  };

  const handleMfaSetup = async () => {
    setupMFAMutation.mutate(undefined, {
      onSuccess: (data) => {
        setMfaSetupData(data);
      },
    });
  };

  const handleMfaVerify = async () => {
    if (!mfaVerificationToken.trim()) {
      toast.error("Please enter a verification token");
      return;
    }
    verifyMFAMutation.mutate(mfaVerificationToken, {
      onSuccess: () => {
        setMfaSetupData(null);
        setMfaVerificationToken("");
      },
    });
  };

  const handleMfaDisable = async () => {
    if (!mfaDisableToken.trim()) {
      toast.error("Please enter a verification token or backup code");
      return;
    }
    disableMFAMutation.mutate(mfaDisableToken, {
      onSuccess: () => {
        setMfaDisableToken("");
      },
    });
  };

  const handleRegenerateBackupCodes = async () => {
    if (!backupCodesRegenerateToken.trim()) {
      toast.error("Please enter a verification token");
      return;
    }
    regenerateBackupCodesMutation.mutate(backupCodesRegenerateToken, {
      onSuccess: (data) => {
        setMfaSetupData(prev => prev ? { ...prev, backup_codes: data.backup_codes } : null);
        setBackupCodesRegenerateToken("");
      },
    });
  };

  // Utility function to format field value for API
  const formatFieldValueForAPI = (field, value) => {
    if (!value && value !== 0 && value !== false) {
      return null;
    }

    const fieldType = field.field_type || field.type;

    switch (fieldType?.toLowerCase()) {
      case 'text':
      case 'string':
      case 'email':
      case 'phone':
      case 'url':
      case 'textarea':
        return { value: String(value) };

      case 'number':
      case 'integer':
      case 'decimal':
      case 'float':
        return { value: parseFloat(value) || 0 };

      case 'boolean':
      case 'checkbox':
        return { value: Boolean(value) };

      case 'date':
        return { value: value instanceof Date ? value.toISOString().split('T')[0] : value };

      case 'datetime':
      case 'date_time':
        return { value: value instanceof Date ? value.toISOString() : value };

      case 'time':
        return { value: String(value) };

      case 'select':
      case 'dropdown':
        return { value: String(value) };

      case 'radio':
      case 'radio_group':
        return { value: String(value) };

      case 'multiselect':
        if (Array.isArray(value)) {
          return { value: value };
        }
        return { value: [String(value)] };

      case 'file':
        // If value is a File object, we need to upload it first
        if (value instanceof File) {
          throw new Error("File upload must be handled separately");
        }
        return { file_id: value };

      case 'json':
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return { value: value };
        }

      default:
        return { value: String(value) };
    }
  };

  // Check if any custom fields have changes
  const checkForCustomFieldsChanges = () => {
    if (!customFieldsHierarchy?.sections) {
      setHasCustomFieldsChanges(false);
      return;
    }

    let hasChanges = false;
    const changes = [];

    customFieldsHierarchy.sections
      .filter(section => section.is_active !== false)
      .forEach(section => {
        section.fields
          ?.filter(field => field.is_active !== false)
          ?.forEach(field => {
            const currentValue = customFieldsData[field.id];

            // Get the original value from userCustomFields (which has the actual values)
            let originalValue = '';
            if (userCustomFields && userCustomFields.sections) {
              const userField = userCustomFields.sections
                .flatMap(section => section.fields || [])
                .find(f => f.id === field.id);
              if (userField && userField.value_data) {
                originalValue = extractValueFromAPIResponse(userField, userField.value_data);
              }
            }

            const hasFieldChanged = JSON.stringify(currentValue) !== JSON.stringify(originalValue);
            if (hasFieldChanged) {
              hasChanges = true;
              changes.push({
                fieldId: field.id,
                fieldLabel: field.field_label,
                currentValue,
                originalValue
              });
            }
          });
      });

    setHasCustomFieldsChanges(hasChanges);
  };

  // Custom Fields Handlers
  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFieldsData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    if (customFieldsErrors[fieldId]) {
      setCustomFieldsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    // Immediately check if this specific field has changed from its original value
    const field = customFieldsHierarchy?.sections
      ?.flatMap(section => section.fields || [])
      ?.find(f => f.id === fieldId);

    if (field && userCustomFields) {
      // Get the original value from userCustomFields
      let originalValue = '';
      const userField = userCustomFields.sections
        ?.flatMap(section => section.fields || [])
        ?.find(f => f.id === fieldId);
      if (userField && userField.value_data) {
        originalValue = extractValueFromAPIResponse(userField, userField.value_data);
      }

      const hasChanged = JSON.stringify(value) !== JSON.stringify(originalValue);

      if (hasChanged) {
        // This field has changed, enable save button
        setHasCustomFieldsChanges(true);
      } else {
        // This field is back to original, check all fields
        setTimeout(() => {
          checkForCustomFieldsChanges();
        }, 0);
      }
    }
  };

  const handleCustomFieldUpdate = async (fieldId, value) => {
    if (!profileData?.id) {
      toast.error("User ID not available");
      return;
    }

    // Find the field definition to get the field type
    const field = customFieldsHierarchy?.sections
      ?.flatMap(section => section.fields || [])
      ?.find(f => f.id === fieldId);

    if (!field) {
      console.warn(`Field with ID ${fieldId} not found`);
      return;
    }

    // Handle file uploads separately
    if (field.field_type?.toLowerCase() === 'file' && value instanceof File) {
      try {
        // Upload the file first
        const uploadResult = await uploadFileMutation.mutateAsync(value);

        // Then update the field with the file ID
        updateUserCustomFieldMutation.mutate({
          fieldSlug: field.slug || field.field_name,
          valueData: { file_id: uploadResult.id },
          userSlug: profileData.slug
        });
      } catch (error) {
        console.error(`Failed to upload file for field ${field.field_name}:`, error);
        return;
      }
    } else {
      // Format the value according to field type
      const formattedValue = formatFieldValueForAPI(field, value);

      updateUserCustomFieldMutation.mutate({
        fieldSlug: field.slug || field.field_name,
        valueData: formattedValue,
        userSlug: profileData.slug
      });
    }
  };

  const handleCustomFieldsBulkUpdate = async () => {
    // Validate required fields
    const errors = {};
    const updates = [];

    if (customFieldsHierarchy && customFieldsHierarchy.sections) {
      customFieldsHierarchy.sections
        .filter(section => section.is_active !== false) // Only process active sections
        .forEach(section => {
          section.fields
            ?.filter(field => field.is_active !== false) // Only process active fields
            ?.forEach(field => {
              const fieldValue = customFieldsData[field.id];
              const fieldLabel = field.field_label || field.field_name || field.name;

              // Check required fields
              if (field.is_required && (!fieldValue || fieldValue === '')) {
                errors[field.id] = `${fieldLabel} is required`;
              }

              // Validate field-specific constraints
              if (fieldValue !== undefined && fieldValue !== '') {
                // Validate min/max length for text fields
                if (field.field_type === 'text' && field.max_length && fieldValue.length > field.max_length) {
                  errors[field.id] = `${fieldLabel} must be no more than ${field.max_length} characters`;
                }

                // Validate min/max values for number fields
                if (field.field_type === 'number' && field.min_value !== null && field.min_value !== undefined) {
                  const numValue = parseFloat(fieldValue);
                  if (isNaN(numValue) || numValue < field.min_value) {
                    errors[field.id] = `${fieldLabel} must be at least ${field.min_value}`;
                  }
                }
                if (field.field_type === 'number' && field.max_value !== null && field.max_value !== undefined) {
                  const numValue = parseFloat(fieldValue);
                  if (isNaN(numValue) || numValue > field.max_value) {
                    errors[field.id] = `${fieldLabel} must be no more than ${field.max_value}`;
                  }
                }

                // Validate email format
                if (field.field_type === 'email' && fieldValue) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(fieldValue)) {
                    errors[field.id] = `${fieldLabel} must be a valid email address`;
                  }
                }
              }

              // Prepare update only if field has data AND has changed
              if (fieldValue !== undefined) {
                // Get the original value from userCustomFields (which has the actual values)
                let originalValue = '';
                if (userCustomFields && userCustomFields.sections) {
                  const userField = userCustomFields.sections
                    .flatMap(section => section.fields || [])
                    .find(f => f.id === field.id);
                  if (userField && userField.value_data) {
                    originalValue = extractValueFromAPIResponse(userField, userField.value_data);
                  }
                }

                // Only update if the value has actually changed
                if (JSON.stringify(fieldValue) !== JSON.stringify(originalValue)) {
                  updates.push({
                    field_id: field.id,
                    value_data: fieldValue
                  });
                }
              }
            });
        });
    }

    if (Object.keys(errors).length > 0) {
      setCustomFieldsErrors(errors);
      const errorCount = Object.keys(errors).length;
      toast.error(`Please fix ${errorCount} field${errorCount > 1 ? 's' : ''} before saving`, {
        description: "Check the highlighted fields for validation errors"
      });
      return;
    }

    if (updates.length > 0) {
      if (!profileData?.slug) {
        toast.error("User slug not available");
        return;
      }

      setIsUpdatingCustomFields(true);

      try {
        // Update fields one by one sequentially to reduce server load
        for (let i = 0; i < updates.length; i++) {
          const update = updates[i];

          // Find the field definition to get the field type
          const field = customFieldsHierarchy.sections
            .flatMap(section => section.fields || [])
            .find(f => f.id === update.field_id);

          if (!field) {
            console.warn(`Field with ID ${update.field_id} not found`);
            continue;
          }

          // Handle file uploads separately
          if (field.field_type?.toLowerCase() === 'file' && update.value_data instanceof File) {
            try {
              // Upload the file first
              const uploadResult = await uploadFileMutation.mutateAsync(update.value_data);

              // Then update the field with the file ID
              await updateUserCustomFieldMutation.mutateAsync({
                fieldSlug: field.slug || field.field_name,
                valueData: { file_id: uploadResult.id },
                userSlug: profileData.slug
              });
            } catch (error) {
              console.error(`Failed to upload file for field ${field.field_name}:`, error);
              throw error;
            }
          } else {
            // Format the value according to field type
            const formattedValue = formatFieldValueForAPI(field, update.value_data);

            // Update field one by one
            await updateUserCustomFieldMutation.mutateAsync({
              fieldSlug: field.slug || field.field_name,
              valueData: formattedValue,
              userSlug: profileData.slug
            });
          }

          // Small delay between updates to reduce server load (except for the last one)
          if (i < updates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        toast.success("Custom fields updated successfully!", {
          description: "All your custom field information has been saved."
        });
      } catch (error) {
        console.error("Failed to update custom fields:", error);
        toast.error("Failed to update some fields", {
          description: "Please check your input and try again."
        });
      } finally {
        setIsUpdatingCustomFields(false);
      }
    } else {
      toast.info("No changes to save", {
        description: "All custom fields are already up to date"
      });
    }
  };

  const handleAcceptProfile = () => {
    acceptProfileMutation.mutate();
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processAvatarFile(file);
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create a new File object with the original name
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const processAvatarFile = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please select a JPG, PNG, GIF, or WebP image file.",
      });
      return;
    }

    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please select an image file smaller than 10MB.",
      });
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      // Compress the image before uploading
      const compressedFile = await compressImage(file, 800, 800, 0.85);

      // Show compression info if file was significantly reduced
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
      const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(0);

      if (reduction > 10) {
        toast.info("Image compressed", {
          description: `Reduced from ${originalSizeMB}MB to ${compressedSizeMB}MB (${reduction}% smaller)`,
        });
      }

      uploadAvatarMutation.mutate(compressedFile);
    } catch (error) {
      console.error("Image compression failed:", error);
      toast.error("Failed to process image", {
        description: "Please try again with a different image.",
      });
      setAvatarPreview(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processAvatarFile(files[0]);
    }
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load profile
            </h3>
            <p className="text-muted-foreground mb-4">
              {profileError.response?.data?.message ||
                "An error occurred while loading your profile"}
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Account Active
        </Badge>
      </div>

      {/* Pending Profile Alert */}
      {pendingProfile && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900">
                  Profile Pending Approval
                </h3>
                <p className="text-sm text-orange-800 mt-1">
                  Your profile is pending approval. You can accept it to
                  activate your account.
                </p>
              </div>
              <Button
                onClick={handleAcceptProfile}
                disabled={acceptProfileMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {acceptProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Profile"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-5">
            <TabsTrigger value="profile" className="whitespace-nowrap">
              <span className="hidden sm:inline">Profile Information</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="whitespace-nowrap">
              <span className="hidden sm:inline">Change Password</span>
              <span className="sm:hidden">Password</span>
            </TabsTrigger>
            <TabsTrigger value="mfa" className="whitespace-nowrap">
              <span className="hidden sm:inline">Multi-Factor Auth</span>
              <span className="sm:hidden">MFA</span>
            </TabsTrigger>
            <TabsTrigger value="additional" className="whitespace-nowrap relative">
              <span className="hidden sm:inline">Additional Info</span>
              <span className="sm:hidden">Additional</span>
              {hasMissingRequired && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="destructive" 
                        className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {totalMissingRequired}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{totalMissingRequired} required {totalMissingRequired === 1 ? 'field' : 'fields'} missing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="whitespace-nowrap">Files</TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Editable Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your bio and profile image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture - Editable */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Profile Image</Label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {avatarPreview ? (
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview} alt={profileData?.fullName || "Profile"} />
                        <AvatarFallback className="text-lg">
                          {profileData?.initials || "AU"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <AvatarWithUrl
                        avatarValue={formData.avatar || profileData?.avatar_url || profileData?.avatar}
                        alt={profileData?.fullName || "Profile"}
                        fallback={profileData?.initials || "AU"}
                        className="h-20 w-20"
                        fallbackProps={{ className: "text-lg" }}
                        onImageLoad={() => {
                          // Clear preview once the uploaded image has loaded
                          setAvatarPreview(null);
                        }}
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    {/* Drag and Drop Area */}
                    <div
                      className={`
                        relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                        ${isDragOver
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                        }
                      `}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => !uploadAvatarMutation.isPending && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadAvatarMutation.isPending}
                      />
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-2 rounded-full bg-muted">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {isDragOver ? 'Drop image here' : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, GIF or WebP • Max 10MB • Auto-compressed
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Upload Status */}
                    {uploadAvatarMutation.isPending && (
                      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bio - Editable */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleProfileUpdate}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Read-Only Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
                <Badge variant="secondary" className="ml-2">
                  Read Only
                </Badge>
              </CardTitle>
              <CardDescription>
                System-managed account details (cannot be changed)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profileData?.email || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Email address cannot be changed
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Username
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">
                        {profileData?.username || "admin"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Username cannot be changed
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <span className="text-sm">
                      {profileData?.firstName || "System"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      First name cannot be changed
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <span className="text-sm">
                      {profileData?.lastName || "Administrator"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last name cannot be changed
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Title
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <span className="text-sm">
                      {profileData?.jobTitle || "System"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Title cannot be changed
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </Label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profileData?.phone || "Not provided"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Phone number cannot be changed
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Change Password Tab */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      Password Requirements:
                    </p>
                    <ul className="mt-1 text-blue-800 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains at least one number</li>
                      <li>• Contains at least one special character</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Factor Authentication Tab */}
        <TabsContent value="mfa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MFA Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">MFA Status</p>
                  <p className="text-sm text-muted-foreground">
                    {mfaStatusLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : mfaStatus?.is_enabled ? (
                      "Enabled"
                    ) : (
                      "Disabled"
                    )}
                  </p>
                </div>
                {!mfaStatusLoading && (
                  <div className="flex items-center gap-2">
                    {mfaStatus?.is_enabled ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* MFA Setup */}
              {!mfaStatusLoading && !mfaStatus?.is_enabled && (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Setup MFA
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable multi-factor authentication for enhanced security
                      </p>
                    </div>

                    {!mfaSetupData ? (
                      <Button
                        onClick={handleMfaSetup}
                        disabled={setupMFAMutation.isPending}
                      >
                        {setupMFAMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Setting up...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Setup MFA
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {/* QR Code */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Scan QR Code
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Use your authenticator app to scan this QR code
                          </p>
                          <div className="flex justify-center">
                            <img
                              src={mfaSetupData.qr_code_image}
                              alt="MFA QR Code"
                              className="h-48 w-48 border rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Manual Entry */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Manual Entry
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Or enter this code manually in your authenticator app
                          </p>
                          <div className="p-3 bg-muted rounded text-sm font-mono text-center">
                            {mfaSetupData.secret_key}
                          </div>
                        </div>

                        {/* Verification */}
                        <div className="space-y-2">
                          <Label htmlFor="mfa-token" className="text-sm font-medium">
                            Verification Token
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Enter the 6-digit code from your authenticator app
                          </p>
                          <div className="flex gap-2">
                            <Input
                              id="mfa-token"
                              type="text"
                              placeholder="123456"
                              value={mfaVerificationToken}
                              onChange={(e) => setMfaVerificationToken(e.target.value)}
                              maxLength={6}
                              className="font-mono text-center"
                            />
                            <Button
                              onClick={handleMfaVerify}
                              disabled={verifyMFAMutation.isPending || mfaVerificationToken.length !== 6}
                            >
                              {verifyMFAMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Backup Codes */}
                        {mfaSetupData.backup_codes && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Backup Codes
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Save these codes in a safe place. Each code can only be used once.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {mfaSetupData.backup_codes.map((code, index) => (
                                <div
                                  key={index}
                                  className="p-2 bg-muted rounded text-sm font-mono text-center"
                                >
                                  {code}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* MFA Management */}
              {!mfaStatusLoading && mfaStatus?.is_enabled && (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        MFA Management
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Manage your multi-factor authentication settings
                      </p>
                    </div>

                    {/* Backup Codes Remaining */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">Backup Codes</p>
                        <p className="text-sm text-muted-foreground">
                          {mfaStatus?.backup_codes_remaining || 0} codes remaining
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBackupCodesRegenerateToken("")}
                      >
                        Regenerate
                      </Button>
                    </div>

                    {/* Regenerate Backup Codes Modal */}
                    {backupCodesRegenerateToken !== null && (
                      <div className="space-y-2">
                        <Label htmlFor="backup-token" className="text-sm font-medium">
                          Verification Token
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enter a verification token to regenerate backup codes
                        </p>
                        <div className="flex gap-2">
                          <Input
                            id="backup-token"
                            type="text"
                            placeholder="123456"
                            value={backupCodesRegenerateToken}
                            onChange={(e) => setBackupCodesRegenerateToken(e.target.value)}
                            maxLength={6}
                            className="font-mono text-center"
                          />
                          <Button
                            onClick={handleRegenerateBackupCodes}
                            disabled={regenerateBackupCodesMutation.isPending || backupCodesRegenerateToken.length !== 6}
                          >
                            {regenerateBackupCodesMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Regenerate"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setBackupCodesRegenerateToken(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Disable MFA */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-red-600">
                        Disable MFA
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enter a verification token or backup code to disable MFA
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="123456 or backup code"
                          value={mfaDisableToken}
                          onChange={(e) => setMfaDisableToken(e.target.value)}
                          className="font-mono"
                        />
                        <Button
                          variant="destructive"
                          onClick={handleMfaDisable}
                          disabled={disableMFAMutation.isPending || !mfaDisableToken.trim()}
                        >
                          {disableMFAMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Disable MFA"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value="additional" className="space-y-6">
          {/* Custom Fields Section - First Row */}
          {customFieldsHierarchy && customFieldsHierarchy.sections &&
            customFieldsHierarchy.sections.filter(section => section.is_active !== false).length > 0 && (
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                  <CardDescription>
                    Complete your profile with additional details required by your organisation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {customFieldsHierarchyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading custom fields...</span>
                    </div>
                  ) : (
                    <>
                      {/* Debug logging */}
                      {(() => {
                        console.log("Profile - Compliance fields debug:", {
                          complianceFieldsCount: complianceData?.compliance_fields?.length || 0,
                          complianceFields: complianceData?.compliance_fields,
                          sectionsCount: customFieldsHierarchy?.sections?.length || 0,
                          sections: customFieldsHierarchy?.sections,
                        });
                        return null;
                      })()}
                      
                      {(customFieldsHierarchy?.sections || [])
                        .filter(section => section.is_active !== false) // Only show active sections
                        .map((section) => {
                          // Get all fields in this section (both compliance and non-compliance) from hierarchy
                          const allFields = section.fields?.filter(field => field.is_active !== false) || [];

                          // Create a map of compliance fields by field ID for quick lookup
                          const complianceFieldsMap = new Map();
                          if (complianceData?.compliance_fields) {
                            complianceData.compliance_fields.forEach((cf) => {
                              complianceFieldsMap.set(cf.custom_field_id, cf);
                            });
                          }

                          // Don't render section if it has no fields at all
                          if (allFields.length === 0) {
                            return null;
                          }

                          // Separate compliance and regular fields
                          const complianceFieldsInSection = [];
                          const regularFieldsInSection = [];
                          
                          allFields.forEach((field) => {
                            const complianceFieldValue = complianceFieldsMap.get(field.id);
                            if (complianceFieldValue) {
                              complianceFieldsInSection.push({ field, complianceFieldValue });
                            } else {
                              regularFieldsInSection.push(field);
                            }
                          });

                          return (
                            <div key={section.id} className="space-y-4">
                              <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold">{section.section_name}</h3>
                                {section.section_description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {section.section_description}
                                  </p>
                                )}
                                {section.subsections && section.subsections.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Subsections: {section.subsections.join(', ')}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-6">
                                {/* Regular Custom Fields in Grid Layout */}
                                {regularFieldsInSection.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {regularFieldsInSection.map((field) => (
                                      <CustomFieldRenderer
                                        key={field.id}
                                        field={field}
                                        value={customFieldsData[field.id] || ''}
                                        onChange={handleCustomFieldChange}
                                        error={customFieldsErrors[field.id]}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Compliance Fields as Full-Width Cards */}
                                {complianceFieldsInSection.length > 0 && (
                                  <div className="space-y-4">
                                    {complianceFieldsInSection.map(({ field, complianceFieldValue }) => {
                                      const complianceField = {
                                        id: complianceFieldValue.custom_field_id,
                                        slug: complianceFieldValue.field_slug || complianceFieldValue.slug,
                                        field_name: complianceFieldValue.field_name || field.field_name || "Unknown Field",
                                        field_label: complianceFieldValue.field_label || field.field_label || complianceFieldValue.field_name || "Unknown Field",
                                        field_description: complianceFieldValue.field_description || field.field_description,
                                        requires_approval: complianceFieldValue.requires_approval,
                                        compliance_config: complianceFieldValue.compliance_config || null,
                                        sub_field_definitions: complianceFieldValue.sub_field_definitions || null,
                                      };

                                      return (
                                        <ComplianceFieldCard
                                          key={complianceFieldValue.id || complianceFieldValue.custom_field_id || field.id}
                                          field={complianceField}
                                          value={complianceFieldValue}
                                          onUpload={handleComplianceUpload}
                                          onRenew={handleComplianceRenew}
                                          onViewHistory={handleComplianceViewHistory}
                                          onDownload={handleComplianceDownload}
                                          isAdmin={false}
                                          canUpload={true}
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}


                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          {hasCustomFieldsChanges && (
                            <span className="text-amber-600 font-medium">
                              You have unsaved changes
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={handleCustomFieldsBulkUpdate}
                          disabled={isUpdatingCustomFields || !hasCustomFieldsChanges}
                          variant={hasCustomFieldsChanges ? "default" : "outline"}
                        >
                          {isUpdatingCustomFields ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {hasCustomFieldsChanges ? "Save Changes" : "Save Custom Fields"}
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Custom Fields Empty State - Show compliance fields even if no custom fields */}
          {!customFieldsHierarchyLoading && (!customFieldsHierarchy || !customFieldsHierarchy.sections || customFieldsHierarchy.sections.length === 0) && 
           (!complianceData?.compliance_fields || complianceData.compliance_fields.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Complete your profile with additional details required by your organisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Additional Information Required</h3>
                  <p className="text-muted-foreground mb-4">
                    Your organisation hasn't configured any additional profile fields yet. Contact your administrator if you need to add more information to your profile.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Settings and Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Configure your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={additionalData.timezone}
                    onChange={(e) =>
                      setAdditionalData((prev) => ({
                        ...prev,
                        timezone: e.target.value,
                      }))
                    }
                  >
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">
                      America/New_York (EST)
                    </option>
                    <option value="America/Los_Angeles">
                      America/Los_Angeles (PST)
                    </option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={additionalData.language}
                    onChange={(e) =>
                      setAdditionalData((prev) => ({
                        ...prev,
                        language: e.target.value,
                      }))
                    }
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={additionalData.notifications.email}
                    onCheckedChange={(checked) =>
                      setAdditionalData((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: checked,
                        },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={additionalData.notifications.sms}
                    onCheckedChange={(checked) =>
                      setAdditionalData((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, sms: checked },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={additionalData.notifications.push}
                    onCheckedChange={(checked) =>
                      setAdditionalData((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, push: checked },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="security-notifications">
                      Security Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Important security notifications
                    </p>
                  </div>
                  <Switch
                    id="security-notifications"
                    checked={additionalData.notifications.security}
                    onCheckedChange={(checked) =>
                      setAdditionalData((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          security: checked,
                        },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Information - Read Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Information
                <Badge variant="secondary" className="ml-2">
                  Read Only
                </Badge>
              </CardTitle>
              <CardDescription>
                System-generated account details (cannot be modified)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 border rounded-lg bg-muted/30">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Member Since</h3>
                  <p className="text-sm text-muted-foreground">
                    {profileData?.joinDate || "N/A"}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-muted/30">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-medium">Account Status</h3>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${profileData?.isActive ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {profileData?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg bg-muted/30">
                  <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-medium">Role</h3>
                  <p className="text-sm text-muted-foreground">Administrator</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-muted/30">
                  <Key className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-medium">User ID</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {profileData?.id || "N/A"}
                  </p>
                </div>
              </div>

              {/* Additional Read-Only Information */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  System Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Account Created
                    </Label>
                    <p className="text-sm">
                      {profileData?.createdAt
                        ? new Date(profileData.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </Label>
                    <p className="text-sm">
                      {profileData?.updatedAt
                        ? new Date(profileData.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          {profileData?.id && (
            <div className="space-y-4">
              <FileAttachmentList
                entityType="user"
                entityId={profileData.id}
                showTitle={true}
              />
              <MultiFileUpload
                entityType="user"
                entityId={profileData.id}
                maxFiles={10}
                maxSizeMB={10}
                onUploadComplete={() => {
                  // Files will be refreshed automatically via query invalidation
                }}
              />
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Compliance Upload Modal */}
      {(selectedComplianceField || (isRenewal && selectedComplianceValue)) && (
        <ComplianceUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          field={selectedComplianceField || (selectedComplianceValue ? {
            slug: selectedComplianceValue.field_slug || selectedComplianceValue.slug,
            field_name: selectedComplianceValue.field_name,
            field_label: selectedComplianceValue.field_label,
            field_description: selectedComplianceValue.field_description,
            compliance_config: selectedComplianceValue.compliance_config,
            sub_field_definitions: selectedComplianceValue.sub_field_definitions,
          } : null)}
          entityType="user"
          entitySlug={profileData?.slug || ""}
          onUpload={handleComplianceUploadSubmit}
          isRenewal={isRenewal}
          existingValue={selectedComplianceValue}
        />
      )}

      {/* Compliance History Modal */}
      {selectedComplianceField && (
        <ComplianceHistory
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
          field={selectedComplianceField}
          history={complianceHistoryData?.history || []}
          isLoading={complianceHistoryLoading}
          onDownload={handleComplianceDownload}
          isAdmin={false}
        />
      )}
    </div>
  );
}

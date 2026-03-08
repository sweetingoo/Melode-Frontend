"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useFormBySlug, useCreateFormSubmission, useUpdateFormSubmission } from "@/hooks/useForms";
import { useUploadFile } from "@/hooks/useProfile";
import { useCurrentUser } from "@/hooks/useAuth";
import { apiUtils } from "@/services/api-client";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { shouldShowTimeForDateField } from "@/utils/dateFieldUtils";
import { humanizeStatusForDisplay } from "@/utils/slug";
import { toast } from "sonner";

const FormSubmitPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const resumeSubmissionId = params.resumeSubmissionId; // For resuming drafts

  const { data: form, isLoading: formLoading } = useFormBySlug(slug);
  const createSubmissionMutation = useCreateFormSubmission();
  const updateSubmissionMutation = useUpdateFormSubmission();
  // Use silent mode for form submissions to avoid multiple toasts
  const uploadFileMutation = useUploadFile({ silent: true });
  
  // Check if user is logged in (optional - form can be submitted anonymously)
  const isAuthenticated = apiUtils.isAuthenticated();
  const { data: currentUser } = useCurrentUser();

  // Storage key for persisting form submission data (use form ID once loaded)
  const [storageKey, setStorageKey] = useState(`form_submission_${slug}`);
  
  const [submissionData, setSubmissionData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [draftSubmissionId, setDraftSubmissionId] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Update storage key when form is loaded
  useEffect(() => {
    if (form?.id) {
      setStorageKey(`form_submission_${form.id}`);
    }
  }, [form?.id]);
  
  // Load saved submission data from sessionStorage on mount
  useEffect(() => {
    if (slug) {
      const key = `form_submission_${slug}`;
      try {
        const saved = sessionStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.submissionData && Object.keys(parsed.submissionData).length > 0) {
            setSubmissionData(parsed.submissionData);
          }
          if (parsed.currentPage !== undefined) {
            setCurrentPage(parsed.currentPage);
          }
          if (parsed.draftSubmissionId) {
            setDraftSubmissionId(parsed.draftSubmissionId);
          }
        }
      } catch (error) {
        console.error("Failed to load saved submission:", error);
      }
    }
  }, [slug]);

  // Save submission data to sessionStorage
  const saveSubmissionToStorage = (data, page, draftId) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        submissionData: data,
        currentPage: page,
        draftSubmissionId: draftId,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error("Failed to save submission to storage:", error);
    }
  };

  // Clear saved submission from sessionStorage
  const clearSubmissionStorage = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to clear submission storage:", error);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    // For checkbox/boolean fields, ensure false is stored instead of undefined/null when unchecked
    let normalizedValue = value;
    if (value === undefined || value === null) {
      // Check if this is a checkbox/boolean field by checking the field type
      const field = form?.form_fields?.fields?.find(f => (f.id || f.field_id || f.field_name || f.name) === fieldId);
      if (field && (field.field_type?.toLowerCase() === 'checkbox' || field.field_type?.toLowerCase() === 'boolean')) {
        normalizedValue = false;
      }
    }
    
    const newSubmissionData = {
      ...submissionData,
      [fieldId]: normalizedValue,
    };
    
    setSubmissionData(newSubmissionData);
    
    // Save to sessionStorage
    saveSubmissionToStorage(newSubmissionData, currentPage, draftSubmissionId);
    
    // Clear error for this field when user makes changes
    if (fieldErrors[fieldId]) {
      setFieldErrors({
        ...fieldErrors,
        [fieldId]: null,
      });
    }
  };

  // Format field value for API submission
  const formatFieldValueForAPI = (field, value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const fieldType = field.field_type?.toLowerCase();

    switch (fieldType) {
      case "text":
      case "textarea":
      case "email":
      case "phone":
        return String(value);

      case "number":
        return parseFloat(value) || 0;

      case "boolean":
      case "checkbox":
        return Boolean(value);

      case "date":
        // Date fields now use calendar with time, so format as datetime
        if (value instanceof Date) {
          return value.toISOString();
        }
        // If value is a string (from DatePickerWithTime), handle it
        const stringValue = String(value);
        // If it's a datetime string (includes T), return as is
        if (stringValue.includes('T')) {
          return stringValue;
        }
        // If it's just a date (YYYY-MM-DD), add default time
        if (stringValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(stringValue + 'T00:00:00').toISOString();
        }
        return stringValue;

      case "datetime":
      case "date_time":
        return value instanceof Date ? value.toISOString() : String(value);

      case "time":
        // Time-only field: return as HH:mm format string
        if (value instanceof Date) {
          const hours = value.getHours().toString().padStart(2, '0');
          const minutes = value.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        }
        // If it's already a string in HH:mm format, return as is
        if (typeof value === 'string' && value.match(/^\d{2}:\d{2}$/)) {
          return value;
        }
        // If it's a datetime string, extract time part
        if (typeof value === 'string' && value.includes('T')) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          }
        }
        return String(value);

      case "select":
      case "radio":
        return String(value);

      case "multiselect":
        return Array.isArray(value) ? value : [String(value)];

      case "file":
        // File should already be uploaded and converted to file_id
        return typeof value === "number" ? value : null;

      case "json":
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch {
          return value;
        }

      case "signature":
        // Signature is stored as base64 data URL
        return typeof value === "string" ? value : null;

      case "people":
      case "user":
        // People field: store the full user object for programmatic linking
        // The backend will handle formatting for display
        if (typeof value === 'object' && value !== null) {
          // Return the full object with id, email, display_name, etc.
          return value;
        }
        // If it's just a number (user ID), return as-is
        if (typeof value === 'number') {
          return value;
        }
        // If it's a string (shouldn't happen, but handle it)
        return value;

      default:
        return String(value);
    }
  };

  // Check if field should be visible based on conditional logic
  const checkFieldVisibility = (field, data) => {
    // Check if field has conditional visibility rules
    if (field.conditional_visibility) {
      const { depends_on_field, show_when } = field.conditional_visibility;
      const dependentValue = data[depends_on_field];
      const expectedValue = field.conditional_visibility.value;
      
      // Normalize boolean values for comparison (handle both boolean and string representations)
      const normalizeValue = (val) => {
        if (val === true || val === 'true' || val === 'True' || val === 'TRUE') return true;
        if (val === false || val === 'false' || val === 'False' || val === 'FALSE') return false;
        return val;
      };
      
      const normalizedDependent = normalizeValue(dependentValue);
      const normalizedExpected = normalizeValue(expectedValue);
      
      if (show_when === 'equals') {
        return normalizedDependent === normalizedExpected;
      } else if (show_when === 'not_equals') {
        if (expectedValue === undefined || expectedValue === null || expectedValue === '') {
          if (typeof dependentValue === 'boolean') {
            return dependentValue === true;
          }
          return dependentValue !== undefined && dependentValue !== null && dependentValue !== '' && dependentValue !== false && dependentValue !== 0;
        }
        return normalizedDependent !== normalizedExpected;
      } else if (show_when === 'contains') {
        return Array.isArray(dependentValue) 
          ? dependentValue.includes(expectedValue)
          : String(dependentValue || '').includes(String(expectedValue || ''));
      } else if (show_when === 'is_empty') {
        return !dependentValue || dependentValue === '' || dependentValue === false;
      } else if (show_when === 'is_not_empty') {
        return dependentValue !== undefined && dependentValue !== null && dependentValue !== '' && dependentValue !== false;
      }
    }
    
    return true; // Default: show field
  };

  // Group-level conditional visibility: hide field if it belongs to a group that is hidden (based on other fields' values)
  const checkGroupVisibility = (group, data) => {
    if (!group?.conditional_visibility?.depends_on_field) return true;
    const { depends_on_field, show_when, value: expectedValue } = group.conditional_visibility;
    const dependentValue = data?.[depends_on_field];
    const normalize = (v) => {
      if (v === true || v === 'true' || v === 'True' || v === 'TRUE') return true;
      if (v === false || v === 'false' || v === 'False' || v === 'FALSE') return false;
      return v;
    };
    if (show_when === 'equals') return normalize(dependentValue) === normalize(expectedValue);
    if (show_when === 'not_equals') return normalize(dependentValue) !== normalize(expectedValue);
    if (show_when === 'contains') return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : String(dependentValue || '').includes(String(expectedValue || ''));
    if (show_when === 'is_empty') return !dependentValue || dependentValue === '' || dependentValue === false;
    if (show_when === 'is_not_empty') return dependentValue != null && dependentValue !== '' && dependentValue !== false;
    return true;
  };

  const isFieldInHiddenGroup = (fieldId, data) => {
    const formGroups = form?.form_fields?.groups || [];
    if (formGroups.length > 0) {
      for (const group of formGroups) {
        if (!group?.conditional_visibility?.depends_on_field) continue;
        const fieldIds = group.fields || [];
        if (!fieldIds.includes(fieldId)) continue;
        if (!checkGroupVisibility(group, data)) return true;
      }
      return false;
    }
    const sections = form?.form_fields?.sections || [];
    for (const section of sections) {
      const groups = section?.groups || [];
      for (const group of groups) {
        if (!group?.conditional_visibility?.depends_on_field) continue;
        const fieldIds = group.fields || [];
        if (!fieldIds.includes(fieldId)) continue;
        if (!checkGroupVisibility(group, data)) return true;
      }
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      if (!form?.id) {
        toast.error("Form not found");
        setIsSubmitting(false);
        return;
      }

      // Validate all required fields across all pages (use filtered fields for trackers with public stages)
      const errors = {};
      const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];

      for (const field of fields) {
        const fieldType = (field.type || field.field_type)?.toLowerCase();
        if (displayOnlyTypes.includes(fieldType)) {
          continue;
        }

        // Check visibility before validating (field and group)
        const fieldId = field.id || field.field_id || field.field_name || field.name;
        if (!checkFieldVisibility(field, submissionData) || isFieldInHiddenGroup(fieldId, submissionData)) {
          continue;
        }
        const value = submissionData[fieldId];

        if (field.required || field.is_required) {
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            errors[fieldId] = `${field.label || field.field_label || fieldId} is required`;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsSubmitting(false);
        toast.error("Please fill in all required fields");
        // Navigate to first page with errors
        const firstErrorField = fields.find(f => errors[f.id || f.field_id || f.field_name || f.name]);
        if (firstErrorField) {
          const errFieldId = firstErrorField.id || firstErrorField.field_id || firstErrorField.field_name || firstErrorField.name;
          const errorPageIndex = pages.findIndex(page =>
            page.some(f => (f.id || f.field_id || f.field_name || f.name) === errFieldId)
          );
          if (errorPageIndex >= 0) {
            setCurrentPage(errorPageIndex);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
        return;
      }

      // Process and submit
      const processedSubmissionData = await processSubmissionData();

      // Prepare submission payload - include user info if logged in
      const submissionPayload = {
        form_id: parseInt(form.id),
        submission_data: processedSubmissionData,
        status: "submitted",
      };

      // If user is logged in, include user information
      if (isAuthenticated && currentUser) {
        submissionPayload.submitted_by_user_id = currentUser.id;
      }
      // Otherwise, submission will be anonymous (no user_id)

      // Submit the form with processed data
      const result = draftSubmissionId 
        ? await updateSubmissionMutation.mutateAsync({
            id: draftSubmissionId,
            ...submissionPayload,
          })
        : await createSubmissionMutation.mutateAsync(submissionPayload);

      // Clear saved submission from sessionStorage after successful submission
      clearSubmissionStorage();

      // Show success state on this page (no redirect)
      setSubmissionSuccess(true);
      setIsSubmitting(false);
      toast.success("Form submitted successfully", {
        description: isAuthenticated
          ? `Thank you ${currentUser?.first_name || currentUser?.email || ""} for your submission.`
          : "Thank you for your submission.",
      });
    } catch (error) {
      console.error("Failed to submit form:", error);
      setIsSubmitting(false);
    }
  };

  // All hooks must be called before any conditional returns
  const allFields = form?.form_fields?.fields || [];
  // For trackers with stages: show only fields from stages that allow public submit (shareable form = current stage only for external users)
  const fields = useMemo(() => {
    if (!form?.is_tracker) return allFields;
    const stageMapping = form?.form_config?.stage_mapping || [];
    const sections = form?.form_fields?.sections || [];
    if (!stageMapping.length || !sections.length) return allFields;
    const publicStageIndices = stageMapping
      .map((s, i) => (s?.allow_public_submit === true ? i : -1))
      .filter((i) => i >= 0);
    if (publicStageIndices.length === 0) return [];
    const publicFieldIds = new Set();
    publicStageIndices.forEach((i) => {
      const sec = sections[i];
      (sec?.fields || []).forEach((fid) => publicFieldIds.add(fid));
    });
    return allFields.filter((f) => publicFieldIds.has(f.id || f.field_id || f.name));
  }, [form?.is_tracker, form?.form_config?.stage_mapping, form?.form_fields?.sections, form?.form_fields?.fields, allFields]);

  const isTrackerWithStages = !!(form?.is_tracker && (form?.form_config?.stage_mapping?.length || 0) > 0 && (form?.form_fields?.sections?.length || 0) > 0);
  const hasPublicStages = useMemo(() => {
    if (!isTrackerWithStages) return true;
    const stageMapping = form?.form_config?.stage_mapping || [];
    return stageMapping.some((s) => s?.allow_public_submit === true);
  }, [isTrackerWithStages, form?.form_config?.stage_mapping]);

  // Split fields into pages based on page_break
  const pages = useMemo(() => {
    const pagesArray = [];
    let currentPageFields = [];
    
    fields.forEach((field) => {
      const fieldType = (field.type || field.field_type)?.toLowerCase();
      
      if (fieldType === 'page_break' && currentPageFields.length > 0) {
        // Save current page and start new one
        pagesArray.push([...currentPageFields]);
        currentPageFields = [];
      } else {
        // Add field to current page (including page_break for visual separation)
        currentPageFields.push(field);
      }
    });
    
    // Add the last page if it has fields
    if (currentPageFields.length > 0) {
      pagesArray.push(currentPageFields);
    }
    
    // If no page breaks, return all fields as single page
    return pagesArray.length > 0 ? pagesArray : [fields];
  }, [fields]);

  const totalPages = pages.length;
  const currentPageFields = pages[currentPage] || [];

  // When form has groups (or legacy sections), build layout for current page: ungrouped fields first, then each group
  const formGroups = form?.form_fields?.groups || [];
  const formSections = form?.form_fields?.sections || [];
  const hasFormGroups = formGroups.length > 0 && !form?.is_tracker;
  const hasFormSections = formSections.length > 0 && !form?.is_tracker && !hasFormGroups;
  const currentPageLayout = useMemo(() => {
    if (hasFormGroups) {
      // Groups only: fields not in any group, then each group with its fields
      if (currentPageFields.length === 0) return null;
      const fieldIdsInGroups = new Set(formGroups.flatMap((g) => g.fields || []));
      const fieldsNotInAnyGroup = currentPageFields.filter(
        (f) => !fieldIdsInGroups.has(f.id || f.field_id || f.name)
      );
      const groupsWithFields = formGroups
        .map((g) => ({
          group: g,
          fields: currentPageFields.filter((f) =>
            (g.fields || []).includes(f.id || f.field_id || f.name)
          ),
        }))
        .filter((g) => g.fields.length > 0);
      return { fieldsNotInAnySection: fieldsNotInAnyGroup, sectionsWithContent: groupsWithFields.length > 0 || fieldsNotInAnyGroup.length > 0 ? [{ sectionLabel: null, ungrouped: fieldsNotInAnyGroup, groupsWithFields }] : null };
    }
    if (hasFormSections && currentPageFields.length > 0) {
      const fieldIdsInSections = new Set(formSections.flatMap((s) => s.fields || []));
      const fieldsNotInAnySection = currentPageFields.filter(
        (f) => !fieldIdsInSections.has(f.id || f.field_id || f.name)
      );
      const sectionsWithContent = formSections.map((section) => {
        const sectionFieldIds = section.fields || [];
        const sectionFieldsOnPage = currentPageFields.filter((f) =>
          sectionFieldIds.includes(f.id || f.field_id || f.name)
        );
        if (sectionFieldsOnPage.length === 0) return null;
        const fieldIdsInGroups = new Set((section.groups || []).flatMap((g) => g.fields || []));
        const ungrouped = sectionFieldsOnPage.filter(
          (f) => !fieldIdsInGroups.has(f.id || f.field_id || f.name)
        );
        const groupsWithFields = (section.groups || [])
          .map((g) => ({
            group: g,
            fields: sectionFieldsOnPage.filter((f) =>
              (g.fields || []).includes(f.id || f.field_id || f.name)
            ),
          }))
          .filter((g) => g.fields.length > 0);
        return {
          sectionLabel: section.title || section.label || section.id || "Section",
          ungrouped,
          groupsWithFields,
        };
      }).filter(Boolean);
      return { fieldsNotInAnySection, sectionsWithContent };
    }
    return null;
  }, [hasFormGroups, hasFormSections, formGroups, formSections, currentPageFields]);

  // Calculate progress based on pages completed (not current page)
  const progressPercentage = totalPages > 1 
    ? (currentPage / totalPages) * 100 
    : 0;

  // Conditional returns after all hooks
  if (formLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Form not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTrackerWithStages && !hasPublicStages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-2">
            <p className="font-medium">This form is not available for public submission</p>
            <p className="text-sm text-muted-foreground">
              No stages are configured for external users. An internal team member will need to create or update entries for this tracker.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Thank you for your submission</h2>
            <p className="text-muted-foreground">
              Your response has been submitted successfully.
            </p>
            {isAuthenticated && (
              <p className="pt-2">
                <Link
                  href="/admin/trackers"
                  className="text-primary font-medium underline underline-offset-4 hover:no-underline"
                >
                  Go to tracker entries
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Save draft functionality
  const handleSaveDraft = async () => {
    if (!form.form_config?.allow_draft) {
      toast.error("Draft saving is not enabled for this form");
      return;
    }

    try {
      const processedData = await processSubmissionData();
      
      // Prepare draft payload
      const draftPayload = {
        form_id: parseInt(form.id),
        submission_data: processedData,
        status: "draft",
      };

      // Include user info if logged in
      if (isAuthenticated && currentUser) {
        draftPayload.submitted_by_user_id = currentUser.id;
      }
      
      if (draftSubmissionId) {
        // Update existing draft
        await updateSubmissionMutation.mutateAsync({
          id: draftSubmissionId,
          ...draftPayload,
        });
        // Update sessionStorage with new draft ID
        saveSubmissionToStorage(submissionData, currentPage, draftSubmissionId);
        toast.success("Draft saved successfully");
      } else {
        // Create new draft
        const result = await createSubmissionMutation.mutateAsync(draftPayload);
        const newDraftId = result.id;
        setDraftSubmissionId(newDraftId);
        // Save to sessionStorage with new draft ID
        saveSubmissionToStorage(submissionData, currentPage, newDraftId);
        toast.success("Draft saved successfully", {
          description: "You can resume this form later using the link provided.",
        });
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    }
  };

  // Process submission data (extracted for reuse)
  const processSubmissionData = async () => {
    const processedSubmissionData = {};
    const fileUploadPromises = [];
    const errors = {};
    const displayOnlyTypes = ['text_block', 'image_block', 'line_break', 'page_break', 'download_link'];

    for (const field of fields) {
      const fieldType = (field.type || field.field_type)?.toLowerCase();
      if (displayOnlyTypes.includes(fieldType)) {
        continue;
      }

      // Check visibility
      if (!checkFieldVisibility(field, submissionData)) {
        continue;
      }

      const fieldId = field.id || field.field_id || field.field_name || field.name;
      const value = submissionData[fieldId];

      if (fieldType === "file") {
        // Helper to extract file from value (handles File objects or {file, expiryDate} objects)
        const getFileFromValue = (val) => {
          if (val instanceof File) return { file: val, expiryDate: null };
          if (val && typeof val === 'object' && val.file) return val;
          return null;
        };

        // Handle single file
        if (value instanceof File || (value && typeof value === 'object' && value.file && !Array.isArray(value))) {
          const fileData = getFileFromValue(value);
          const file = fileData?.file || value;
          
          fileUploadPromises.push(
            uploadFileMutation
              .mutateAsync({
                file: file,
                form_id: parseInt(form.id),
                field_id: fieldId,
              })
              .then((uploadResult) => {
                const fileRef = uploadResult.file_reference_id ?? uploadResult.id ?? uploadResult.file_id;
                // Store file_reference_id (prefer over id) with expiry date if provided
                if (field.file_expiry_date && fileData?.expiryDate) {
                  processedSubmissionData[fieldId] = {
                    file_reference_id: fileRef,
                    expiry_date: fileData.expiryDate,
                  };
                } else {
                  processedSubmissionData[fieldId] = fileRef;
                }
              })
              .catch((error) => {
                console.error(`Failed to upload file for field ${fieldId}:`, error);
                const errorMessage = error.response?.data?.detail || 
                                   error.response?.data?.message || 
                                   "Failed to upload file";
                errors[fieldId] = errorMessage;
                toast.error("File Upload Failed", {
                  description: `${field.label || fieldId}: ${errorMessage}`,
                });
                throw error;
              })
          );
        } 
        // Handle multiple files (array)
        else if (Array.isArray(value) && value.length > 0) {
          // Check if first item is a File or has file property
          const firstItem = value[0];
          if (firstItem instanceof File || (firstItem && typeof firstItem === 'object' && firstItem.file)) {
            const fileUploads = value.map((fileValue, index) => {
              const fileData = getFileFromValue(fileValue);
              const file = fileData?.file || fileValue;
              return uploadFileMutation
                .mutateAsync({
                  file: file,
                  form_id: parseInt(form.id),
                  field_id: fieldId,
                })
                .then((uploadResult) => {
                  const fileRef = uploadResult.file_reference_id ?? uploadResult.id ?? uploadResult.file_id;
                  // Store file_reference_id with expiry date if provided
                  if (field.file_expiry_date && fileData?.expiryDate) {
                    return {
                      file_reference_id: fileRef,
                      expiry_date: fileData.expiryDate,
                    };
                  }
                  return fileRef;
                })
                .catch((error) => {
                  console.error(`Failed to upload file ${index + 1} for field ${fieldId}:`, error);
                  const errorMessage = error.response?.data?.detail || 
                                     error.response?.data?.message || 
                                     `Failed to upload file: ${file.name}`;
                  errors[fieldId] = errorMessage;
                  toast.error("File Upload Failed", {
                    description: `${field.label || fieldId}: ${errorMessage}`,
                  });
                  throw error;
                });
            });
            fileUploadPromises.push(
              Promise.all(fileUploads).then((fileData) => {
                processedSubmissionData[fieldId] = fileData;
              })
            );
          }
        } 
        // Handle existing file refs (already uploaded: file_reference_id string or legacy file_id number)
        else if (typeof value === 'number' || (typeof value === 'string' && value.trim()) || (Array.isArray(value) && value.every(v => typeof v === 'number' || typeof v === 'string' || (typeof v === 'object' && (v.file_reference_id || v.file_id))))) {
          processedSubmissionData[fieldId] = value;
        }
      } else {
        const formattedValue = formatFieldValueForAPI(field, value);
        if (formattedValue !== null) {
          processedSubmissionData[fieldId] = formattedValue;
        }
      }
    }

    if (fileUploadPromises.length > 0) {
      await Promise.all(fileUploadPromises);
    }

    if (Object.keys(errors).length > 0) {
      throw new Error("File upload errors occurred");
    }

    return processedSubmissionData;
  };

  // Navigation handlers
  const handleNextPage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPage < totalPages - 1) {
      // Validate current page before moving forward
      const errors = validateCurrentPage();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast.error("Please fill in all required fields on this page");
        return;
      }
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      // Save to sessionStorage
      saveSubmissionToStorage(submissionData, newPage, draftSubmissionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      // Save to sessionStorage
      saveSubmissionToStorage(submissionData, newPage, draftSubmissionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Validate current page fields
  const validateCurrentPage = () => {
    const errors = {};
    const displayOnlyTypes = ['text_block', 'image_block', 'line_break', 'page_break', 'download_link'];

    for (const field of currentPageFields) {
      const fieldType = (field.type || field.field_type)?.toLowerCase();
      if (displayOnlyTypes.includes(fieldType)) {
        continue;
      }

      const fieldId = field.id || field.field_id || field.field_name || field.name;
      const value = submissionData[fieldId];

      if (field.required || field.is_required) {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          errors[fieldId] = `${field.label || field.field_label || fieldId} is required`;
        }
      }
    }

    return errors;
  };

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{form.form_title || form.form_name}</h1>
          <p className="text-muted-foreground">
            {isAuthenticated && currentUser 
              ? `Submitting as ${currentUser.first_name || currentUser.email || 'User'}`
              : "Submit Form (Anonymous)"}
          </p>
        </div>

        {/* Progress Indicator */}
        {totalPages > 1 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Step {currentPage + 1} of {totalPages}</span>
                  <span className="text-muted-foreground">{Math.round(progressPercentage)}% Complete</span>
                </div>
                <Progress value={progressPercentage} />
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card className={currentPageLayout?.sectionsWithContent?.length ? "bg-transparent border-0 shadow-none" : undefined}>
            {totalPages > 1 && (
              <CardHeader>
                <CardTitle>Step {currentPage + 1} of {totalPages}</CardTitle>
              </CardHeader>
            )}
            <CardContent className={totalPages > 1 ? "space-y-6" : "space-y-6 pt-6"}>
              {currentPage === 0 && form.form_description && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm">{form.form_description}</p>
                </div>
              )}

              {currentPageFields.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  This page has no fields defined.
                </p>
              ) : (() => {
                const statusFieldId = form?.form_config?.status_field_id ? String(form.form_config.status_field_id).trim() : "";
                const renderOneField = (field) => {
                  const fieldId = field.id || field.field_id || field.field_name || field.name;
                  const fieldType = (field.type || field.field_type)?.toLowerCase();
                  const isDisplayOnly = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'].includes(fieldType);
                  const isVisible = checkFieldVisibility(field, submissionData) && !isFieldInHiddenGroup(fieldId, submissionData);
                  if (!isVisible) return null;
                  const value = isDisplayOnly ? undefined : submissionData[fieldId];
                  const error = isDisplayOnly ? undefined : fieldErrors[fieldId];
                  const isStatusField = statusFieldId && String(fieldId).trim() === statusFieldId;
                  let optionsForField = field.options || field.field_options?.options || [];
                  if (isStatusField && form?.is_tracker && form?.form_config?.stage_mapping?.length && form?.form_fields?.sections?.length) {
                    const sections = form.form_fields.sections || [];
                    const stageMapping = form.form_config.stage_mapping || [];
                    const sectionIndex = sections.findIndex((sec) => (sec?.fields || []).includes(fieldId));
                    const stageConfig = sectionIndex >= 0 && sectionIndex < stageMapping.length ? stageMapping[sectionIndex] : null;
                    const stageStatuses = (stageConfig?.statuses ?? stageConfig?.status_list ?? []).filter(Boolean);
                    const allTrackerStatuses = Array.isArray(form.form_config?.statuses) ? form.form_config.statuses : [];
                    optionsForField = (stageStatuses.length > 0 ? stageStatuses : allTrackerStatuses).map((s) => ({ value: s, label: humanizeStatusForDisplay(s) }));
                  }
                  const mappedField = {
                    ...field,
                    id: fieldId,
                    field_label: field.label || field.field_label,
                    label: field.label,
                    name: field.name || field.field_name || fieldId,
                    field_description: field.help_text,
                    field_type: field.type || field.field_type,
                    is_required: field.required ?? field.is_required,
                    required: field.required ?? field.is_required,
                    content: field.content,
                    image_url: field.image_url,
                    image_file_id: field.image_file_id,
                    alt_text: field.alt_text,
                    download_url: field.download_url,
                    conditional_visibility: field.conditional_visibility,
                    validation: field.validation,
                    field_options: {
                      ...(field.field_options || {}),
                      options: optionsForField,
                      accept: field.field_options?.accept || (field.validation?.allowed_types ? (Array.isArray(field.validation.allowed_types) ? field.validation.allowed_types.join(",") : field.validation.allowed_types) : undefined),
                      maxSize: field.field_options?.maxSize || field.validation?.max_size_mb,
                      allowMultiple: field.field_options?.allowMultiple || false,
                      requireExpiryDate: field.file_expiry_date || false,
                    },
                    ...(optionsForField.length > 0 ? { options: optionsForField } : {}),
                  };
                  return (
                    <CustomFieldRenderer
                      key={fieldId}
                      field={mappedField}
                      value={value}
                      onChange={isDisplayOnly ? undefined : handleFieldChange}
                      error={error}
                    />
                  );
                };

                if (currentPageLayout) {
                  const { fieldsNotInAnySection, sectionsWithContent } = currentPageLayout;
                  return (
                    <div className="space-y-6">
                      {sectionsWithContent.flatMap(({ sectionLabel, ungrouped, groupsWithFields }, sectionIdx) => [
                        sectionLabel ? (
                          <div key={`section-${sectionIdx}`} className="border-b pb-1.5">
                            <h3 className="text-sm font-semibold text-muted-foreground">{sectionLabel}</h3>
                          </div>
                        ) : null,
                        ...groupsWithFields.map(({ group, fields: groupFields }) => {
                          if (!checkGroupVisibility(group, submissionData)) return null;
                          const isGrid = (group.layout || "") === "grid" && (group.grid_rows?.length > 0 || group.grid_columns);
                          const rows = (group.grid_rows && group.grid_rows.length > 0)
                            ? group.grid_rows
                            : (group.grid_columns ? [group.grid_columns] : []);
                          return (
                            <Card key={group.id || group.label}>
                              {group.label && (
                                <CardHeader className="py-3">
                                  <CardTitle className="text-sm font-medium">{group.label}</CardTitle>
                                </CardHeader>
                              )}
                              <CardContent className={group.label ? "pt-0 space-y-4" : "space-y-4"}>
                                {isGrid && rows.length > 0 ? (
                                  <div className="space-y-4">
                                    {rows.map((gridRow, rowIdx) => {
                                      const leftFields = (gridRow.left || []).map((fid) => groupFields.find((f) => (f.id || f.field_id || f.name) === fid)).filter(Boolean);
                                      const centerFields = (gridRow.center || []).map((fid) => groupFields.find((f) => (f.id || f.field_id || f.name) === fid)).filter(Boolean);
                                      const rightFields = (gridRow.right || []).map((fid) => groupFields.find((f) => (f.id || f.field_id || f.name) === fid)).filter(Boolean);
                                      return (
                                        <div key={`row-${rowIdx}`} className="space-y-4">
                                          {Array.from({ length: Math.max(leftFields.length, rightFields.length) }, (_, i) => (
                                            <div key={`lr-${i}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>{leftFields[i] ? renderOneField(leftFields[i]) : null}</div>
                                              <div>{rightFields[i] ? renderOneField(rightFields[i]) : null}</div>
                                            </div>
                                          ))}
                                          {centerFields.map((field) => (
                                            <div key={field.id || field.field_id || field.name} className="w-full">
                                              {renderOneField(field)}
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {groupFields.map((field) => renderOneField(field))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        }).filter(Boolean),
                        ungrouped.length > 0 ? (
                          <Card key={`ungrouped-${sectionIdx}`}>
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ungrouped.map((field) => renderOneField(field))}
                              </div>
                            </CardContent>
                          </Card>
                        ) : null,
                      ].filter(Boolean))}
                      {fieldsNotInAnySection.length > 0 && (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {fieldsNotInAnySection.map((field) => renderOneField(field))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {currentPageFields.map((field) => renderOneField(field))}
                  </div>
                );
              })()}

              <div className="flex justify-between gap-2 pt-4 border-t">
                <div className="flex gap-2">
                  {form.form_config?.allow_draft && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={updateSubmissionMutation.isPending || createSubmissionMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save and Resume Later
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {totalPages > 1 && currentPage > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousPage}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}
                  {totalPages > 1 && currentPage < totalPages - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNextPage}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || createSubmissionMutation.isPending}
                    >
                      {isSubmitting || createSubmissionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {form.form_config?.submit_button_text || "Submit"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default FormSubmitPage;


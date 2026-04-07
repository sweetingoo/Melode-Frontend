"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useForm, useCreateFormSubmission, useUpdateFormSubmission } from "@/hooks/useForms";
import { useUploadFile } from "@/hooks/useProfile";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { shouldShowTimeForDateField } from "@/utils/dateFieldUtils";
import { humanizeStatusForDisplay } from "@/utils/slug";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FormSubmitPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formSlug = params.id || params.slug;
  const resumeSubmissionId = params.resumeSubmissionId; // For resuming drafts

  const rawSubjectUserId = searchParams.get("subjectUserId");
  const parsedSubject = rawSubjectUserId ? parseInt(rawSubjectUserId, 10) : NaN;
  const personnelSubjectUserId =
    Number.isFinite(parsedSubject) && parsedSubject > 0 ? parsedSubject : null;
  const personnelSubjectPayload =
    personnelSubjectUserId != null ? { subject_user_id: personnelSubjectUserId } : {};

  const { data: form, isLoading: formLoading } = useForm(formSlug);
  const createSubmissionMutation = useCreateFormSubmission();
  const updateSubmissionMutation = useUpdateFormSubmission();
  // Use silent mode for form submissions to avoid multiple toasts
  const uploadFileMutation = useUploadFile({ silent: true });

  // Storage key for persisting form submission data
  const storageKey = `form_submission_${formSlug}`;
  
  const [submissionData, setSubmissionData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [draftSubmissionId, setDraftSubmissionId] = useState(null);
  const [activeTabByGroup, setActiveTabByGroup] = useState({});
  
  // Load saved submission data from sessionStorage on mount
  useEffect(() => {
    if (formSlug) {
      const key = `form_submission_${formSlug}`;
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
  }, [formSlug]);

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
      const field = form?.form_fields?.fields?.find(f => (f.field_id || f.field_name) === fieldId);
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
      case "image_free_draw":
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

  // Check if field should be visible based on conditional logic (action "hide" = hide when condition not met; "disable" = show but disabled)
  const checkFieldVisibility = (field, data) => {
    if (!field.conditional_visibility?.depends_on_field) return true;
    const met = (() => {
      const { depends_on_field, show_when } = field.conditional_visibility;
      const dependentValue = data?.[depends_on_field];
      const expectedValue = field.conditional_visibility.value;
      const normalizeValue = (val) => {
        if (val === true || val === "true" || val === "True" || val === "TRUE") return true;
        if (val === false || val === "false" || val === "False" || val === "FALSE") return false;
        if (val === "yes" || val === "Yes" || val === "YES") return true;
        if (val === "no" || val === "No" || val === "NO") return false;
        return val;
      };
      const normalizedDependent = normalizeValue(dependentValue);
      const normalizedExpected = normalizeValue(expectedValue);
      if (show_when === "equals") return normalizedDependent === normalizedExpected;
      if (show_when === "not_equals") {
        if (expectedValue === undefined || expectedValue === null || expectedValue === "") {
          if (typeof dependentValue === "boolean") return dependentValue === true;
          return dependentValue !== undefined && dependentValue !== null && dependentValue !== "" && dependentValue !== false && dependentValue !== 0;
        }
        return normalizedDependent !== normalizedExpected;
      }
      if (show_when === "contains") return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : String(dependentValue || "").includes(String(expectedValue || ""));
      if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
      if (show_when === "is_not_empty") return dependentValue !== undefined && dependentValue !== null && dependentValue !== "" && dependentValue !== false;
      return true;
    })();
    const action = (field.conditional_visibility.action || "hide").toLowerCase();
    if (action === "disable") return true; // show field, will be disabled when condition not met
    return met;
  };

  const isFieldDisabledByCondition = (field, data) => {
    if (!field.conditional_visibility?.depends_on_field) return false;
    const met = (() => {
      const { depends_on_field, show_when } = field.conditional_visibility;
      const dependentValue = data?.[depends_on_field];
      const expectedValue = field.conditional_visibility.value;
      const normalizeValue = (val) => {
        if (val === true || val === "true" || val === "True" || val === "TRUE") return true;
        if (val === false || val === "false" || val === "False" || val === "FALSE") return false;
        if (val === "yes" || val === "Yes" || val === "YES") return true;
        if (val === "no" || val === "No" || val === "NO") return false;
        return val;
      };
      const normalizedDependent = normalizeValue(dependentValue);
      const normalizedExpected = normalizeValue(expectedValue);
      if (show_when === "equals") return normalizedDependent === normalizedExpected;
      if (show_when === "not_equals") {
        if (expectedValue === undefined || expectedValue === null || expectedValue === "") {
          if (typeof dependentValue === "boolean") return dependentValue === true;
          return dependentValue !== undefined && dependentValue !== null && dependentValue !== "" && dependentValue !== false && dependentValue !== 0;
        }
        return normalizedDependent !== normalizedExpected;
      }
      if (show_when === "contains") return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : String(dependentValue || "").includes(String(expectedValue || ""));
      if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
      if (show_when === "is_not_empty") return dependentValue !== undefined && dependentValue !== null && dependentValue !== "" && dependentValue !== false;
      return true;
    })();
    const action = (field.conditional_visibility.action || "hide").toLowerCase();
    return action === "disable" && !met;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      // Validate all required fields across all pages
      const allFields = form.form_fields?.fields || [];
      const errors = {};
      const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];

      for (const field of allFields) {
        const fieldType = field.field_type?.toLowerCase();
        if (displayOnlyTypes.includes(fieldType)) {
          continue;
        }

        // Check visibility before validating
        if (!checkFieldVisibility(field, submissionData)) {
          continue;
        }

        const fieldId = field.field_id || field.field_name;
        const value = submissionData[fieldId];

        if (field.required) {
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            errors[fieldId] = `${field.label || fieldId} is required`;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsSubmitting(false);
        toast.error("Please fill in all required fields");
        // Navigate to first page with errors
        const firstErrorField = allFields.find(f => errors[f.field_id || f.field_name]);
        if (firstErrorField) {
          const errorPageIndex = pages.findIndex(page => 
            page.some(f => (f.field_id || f.field_name) === (firstErrorField.field_id || firstErrorField.field_name))
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

      // Submit the form with processed data
      const result = draftSubmissionId 
        ? await updateSubmissionMutation.mutateAsync({
            id: draftSubmissionId,
            submission_data: processedSubmissionData,
            status: "submitted",
          })
        : await createSubmissionMutation.mutateAsync({
            form_id: form?.id,
            submission_data: processedSubmissionData,
            status: "submitted",
            ...personnelSubjectPayload,
          });

      // Clear saved submission from sessionStorage after successful submission
      clearSubmissionStorage();

      // If tasks were created, handle individual vs collaborative tasks
      if (result.processing_result?.task_creation?.created) {
        const taskInfo = result.processing_result.task_creation;

        if (
          taskInfo.individual_tasks &&
          taskInfo.task_ids &&
          taskInfo.task_ids.length > 0
        ) {
          // Individual tasks created - show success and navigate to submissions page
          // The toast notification will show the count from the hook
          router.push(`/admin/forms/${formSlug}/submissions/${result.slug || result.id}`);
        } else if (taskInfo.task_id) {
          // Single collaborative task - task_id might still be ID from backend
          router.push(`/admin/tasks/${taskInfo.task_slug || taskInfo.task_id}`);
        } else {
          router.push(`/admin/forms/${formSlug}/submissions/${result.slug || result.id}`);
        }
      } else {
        router.push(`/admin/forms/${formSlug}/submissions/${result.slug || result.id}`);
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      setIsSubmitting(false);
    }
  };

  // All hooks must be called before any conditional returns
  const fields = form?.form_fields?.fields || [];

  // Split fields into pages based on page_break
  const pages = useMemo(() => {
    const pagesArray = [];
    let currentPageFields = [];
    
    fields.forEach((field) => {
      const fieldType = field.field_type?.toLowerCase();
      
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

  const isPersonnelLinkedForm = useMemo(() => {
    if (!form || form.is_tracker) return false;
    const p = form.form_config?.personnel;
    if (!p || typeof p !== "object") return false;
    return p.enabled === true || p.enabled === "true" || p.enabled === 1;
  }, [form]);

  const totalPages = pages.length;
  const currentPageFields = pages[currentPage] || [];
  // Calculate progress based on pages completed (not current page)
  const progressPercentage = totalPages > 1 
    ? (currentPage / totalPages) * 100 
    : 0;

  // Defaults for form fields (conditional visibility)
  const formDefaults = useMemo(() => {
    const allFields = form?.form_fields?.fields || [];
    const out = {};
    const opts = (f) => f.field_options?.options || f.options || [];
    const getNoneValue = (field) => {
      const options = opts(field);
      const o = options.find((opt) => String(opt?.value ?? "").toLowerCase().trim() === "none" || String(opt?.label ?? "").toLowerCase().trim() === "none");
      return o && (o.value != null && o.value !== "") ? o.value : "none";
    };
    const firstOptionValue = (field) => {
      const options = opts(field);
      const o = options[0];
      return o != null && (o.value != null && o.value !== "") ? o.value : o?.label;
    };
    allFields.forEach((field) => {
      const fieldId = field.id || field.field_id || field.field_name || field.name;
      if (!fieldId) return;
      const type = (field.type || field.field_type || "").toLowerCase();
      const isSelectOrDropdown = type === "select" || type === "dropdown";
      const isMultiselect = type === "multiselect";
      const isBoolean = type === "boolean" || type === "checkbox" || type === "boolean_with_description";
      const isRadio = type === "radio" || type === "radio_group";
      if (isSelectOrDropdown) out[fieldId] = getNoneValue(field);
      else if (isMultiselect) out[fieldId] = [];
      else if (isBoolean) out[fieldId] = false;
      else if (isRadio && opts(field).length > 0) out[fieldId] = firstOptionValue(field);
    });
    return out;
  }, [form?.id, form?.form_fields?.fields]);

  const effectiveSubmissionData = useMemo(() => ({ ...formDefaults, ...submissionData }), [formDefaults, submissionData]);

  useEffect(() => {
    if (!form || Object.keys(formDefaults).length === 0) return;
    setSubmissionData((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [fieldId, defaultVal] of Object.entries(formDefaults)) {
        if (next[fieldId] === undefined || next[fieldId] === null || next[fieldId] === "") {
          next[fieldId] = defaultVal;
          changed = true;
        } else if (Array.isArray(defaultVal) && (!Array.isArray(next[fieldId]) || next[fieldId].length === 0)) {
          next[fieldId] = defaultVal;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [form?.id, formDefaults]);

  // Layout: sections and groups (same as public form)
  const formGroups = form?.form_fields?.groups || [];
  const formSections = form?.form_fields?.sections || [];
  const hasFormGroups = formGroups.length > 0 && !form?.is_tracker;
  const hasFormSections = formSections.length > 0 && !form?.is_tracker && !hasFormGroups;

  const currentPageLayout = useMemo(() => {
    if (hasFormGroups && currentPageFields.length > 0) {
      const FORM_GRID_COLS = ["left", "center", "right"];
      const isGridSlotTable = (slot) => slot && typeof slot === "object" && (slot.layout || "") === "table" && Array.isArray(slot.table_rows);
      const isGridSlotTabs = (slot) => slot && typeof slot === "object" && (slot.layout || "") === "tabs" && Array.isArray(slot.tabs);
      const getGridSlotFieldIds = (slot) => {
        if (Array.isArray(slot)) return slot;
        if (isGridSlotTable(slot)) return (slot.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean));
        if (isGridSlotTabs(slot)) return (slot.tabs || []).flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || []));
        return [];
      };
      const gridFieldIds = (g) => (g.layout || "") === "grid" && (g.grid_rows || []).length > 0
        ? (g.grid_rows || []).flatMap((r) => FORM_GRID_COLS.flatMap((col) => getGridSlotFieldIds(r[col])))
        : (g.layout || "") === "grid" ? (g.fields || []) : [];
      const hasGridTable = (g) => (g.layout || "") === "grid" && (g.grid_rows || []).some((r) => FORM_GRID_COLS.some((col) => isGridSlotTable(r[col]) || isGridSlotTabs(r[col])));
      const tabFieldIds = (g) => (g.layout === "tabs" && g.tabs?.length) ? (g.tabs || []).flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || [])) : [];
      const tableFieldIds = (g) => ((g.layout || "") === "table" && (g.table_rows || []).length > 0) ? (g.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : [];
      const fieldIdsInGroups = new Set(formGroups.flatMap((g) =>
        (g.layout === "tabs" && g.tabs?.length) ? tabFieldIds(g) : (g.layout || "") === "table" ? tableFieldIds(g) : (g.layout || "") === "grid" ? gridFieldIds(g) : (g.fields || [])
      ));
      const fieldsNotInAnyGroup = currentPageFields.filter((f) => !fieldIdsInGroups.has(f.id || f.field_id || f.name));
      const hasTableRows = (g) => (g.layout || "") === "table" && Array.isArray(g.table_rows) && g.table_rows.length > 0;
      const groupsWithFields = formGroups
        .map((g) => {
          const fieldIds = (g.layout === "tabs" && g.tabs?.length) ? new Set(tabFieldIds(g)) : (g.layout || "") === "table" ? new Set(tableFieldIds(g)) : (g.layout || "") === "grid" ? new Set(gridFieldIds(g)) : new Set(g.fields || []);
          const groupFields = currentPageFields.filter((f) => fieldIds.has(f.id || f.field_id || f.name));
          return { group: g, fields: groupFields };
        })
        .filter((g) => (g.group.layout === "tabs" && g.group.tabs?.length) || g.fields.length > 0 || hasTableRows(g.group) || hasGridTable(g.group));
      return { fieldsNotInAnySection: fieldsNotInAnyGroup, sectionsWithContent: groupsWithFields.length > 0 || fieldsNotInAnyGroup.length > 0 ? [{ sectionLabel: null, ungrouped: fieldsNotInAnyGroup, groupsWithFields }] : null };
    }
    if (hasFormSections && currentPageFields.length > 0) {
      const fieldIdsInSections = new Set(formSections.flatMap((s) => s.fields || []));
      const fieldsNotInAnySection = currentPageFields.filter((f) => !fieldIdsInSections.has(f.id || f.field_id || f.name));
      const sectionsWithContent = formSections.map((section) => {
        const sectionFieldIds = section.fields || [];
        const sectionFieldsOnPage = currentPageFields.filter((f) => sectionFieldIds.includes(f.id || f.field_id || f.name));
        if (sectionFieldsOnPage.length === 0) return null;
        const groupFieldIds = (g) => ((g.layout || "") === "table" && (g.table_rows || []).length > 0) ? (g.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (g.fields || []);
        const fieldIdsInGroups = new Set((section.groups || []).flatMap((g) => groupFieldIds(g)));
        const ungrouped = sectionFieldsOnPage.filter((f) => !fieldIdsInGroups.has(f.id || f.field_id || f.name));
        const hasTableRows = (g) => (g.layout || "") === "table" && Array.isArray(g.table_rows) && g.table_rows.length > 0;
        const groupsWithFields = (section.groups || []).map((g) => ({ group: g, fields: sectionFieldsOnPage.filter((f) => groupFieldIds(g).includes(f.id || f.field_id || f.name)) })).filter((g) => g.fields.length > 0 || hasTableRows(g.group));
        return { sectionLabel: section.title || section.label || section.id || "Section", ungrouped, groupsWithFields };
      }).filter(Boolean);
      return { fieldsNotInAnySection, sectionsWithContent };
    }
    return null;
  }, [hasFormGroups, hasFormSections, formGroups, formSections, currentPageFields]);

  // Load draft data if resuming
  useEffect(() => {
    if (resumeSubmissionId && form) {
      // TODO: Load draft submission data
      // This would require fetching the draft submission
    }
  }, [resumeSubmissionId, form]);

  // Conditional returns after all hooks
  if (formLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Form not found</p>
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
      
      if (draftSubmissionId) {
        // Update existing draft
        await updateSubmissionMutation.mutateAsync({
          id: draftSubmissionId,
          submission_data: processedData,
          status: "draft",
        });
        // Update sessionStorage with new draft ID
        saveSubmissionToStorage(submissionData, currentPage, draftSubmissionId);
        toast.success("Draft saved successfully");
      } else {
        // Create new draft
        const result = await createSubmissionMutation.mutateAsync({
          form_id: form?.id,
          submission_data: processedData,
          status: "draft",
          ...personnelSubjectPayload,
        });
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
      const fieldType = field.field_type?.toLowerCase();
      if (displayOnlyTypes.includes(fieldType)) {
        continue;
      }

      // Check visibility
      if (!checkFieldVisibility(field, submissionData)) {
        continue;
      }

      const fieldId = field.field_id || field.field_name;
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
                form_id: form?.id,
                field_id: fieldId,
              })
              .then((uploadResult) => {
                const fileId = uploadResult.id || uploadResult.file_id;
                // Store file ID with expiry date if provided
                if (field.file_expiry_date && fileData?.expiryDate) {
                  processedSubmissionData[fieldId] = {
                    file_id: fileId,
                    expiry_date: fileData.expiryDate,
                  };
                } else {
                  processedSubmissionData[fieldId] = fileId;
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
                  form_id: form?.id,
                  field_id: fieldId,
                })
                .then((uploadResult) => {
                  const fileId = uploadResult.id || uploadResult.file_id;
                  // Store file ID with expiry date if provided
                  if (field.file_expiry_date && fileData?.expiryDate) {
                    return {
                      file_id: fileId,
                      expiry_date: fileData.expiryDate,
                    };
                  }
                  return fileId;
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
        // Handle existing file IDs (already uploaded, from edit mode or draft)
        else if (typeof value === 'number' || (Array.isArray(value) && value.every(v => typeof v === 'number' || (typeof v === 'object' && v.file_id)))) {
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
      const fieldType = field.field_type?.toLowerCase();
      if (displayOnlyTypes.includes(fieldType)) {
        continue;
      }

      const fieldId = field.field_id || field.field_name;
      const value = submissionData[fieldId];

      if (field.required) {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          errors[fieldId] = `${field.label || fieldId} is required`;
        }
      }
    }

    return errors;
  };

  // Group/row visibility helpers for layout (same as public form)
  const isGroupConditionMet = (condition, data) => {
    if (!condition?.depends_on_field) return false;
    const dependentValue = data?.[condition.depends_on_field];
    const expectedValue = condition.value;
    const normalize = (v) => {
      if (v === true || v === "true" || v === "True" || v === "TRUE") return true;
      if (v === false || v === "false" || v === "False" || v === "FALSE") return false;
      if (v === "yes" || v === "Yes" || v === "YES") return true;
      if (v === "no" || v === "No" || v === "NO") return false;
      return v;
    };
    if (condition.show_when === "equals") return normalize(dependentValue) === normalize(expectedValue);
    if (condition.show_when === "not_equals") return normalize(dependentValue) !== normalize(expectedValue);
    if (condition.show_when === "contains") return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : String(dependentValue || "").includes(String(expectedValue || ""));
    if (condition.show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
    if (condition.show_when === "is_not_empty") return dependentValue != null && dependentValue !== "" && dependentValue !== false;
    return true;
  };
  const checkGroupVisibility = (group, data) => {
    const cv = group?.conditional_visibility;
    if (!cv) return true;
    const conditions = Array.isArray(cv.conditions) ? cv.conditions : null;
    if (conditions?.length > 0) return conditions.some((c) => isGroupConditionMet(c, data));
    if (!cv.depends_on_field) return true;
    return isGroupConditionMet(cv, data);
  };
  const checkRowVisibility = (row, data) => {
    if (!row?.conditional_visibility?.depends_on_field) return true;
    const { depends_on_field, show_when, value: expectedValue } = row.conditional_visibility;
    const dependentValue = data?.[depends_on_field];
    const normalize = (v) => {
      if (v === true || v === "true" || v === "True" || v === "TRUE") return true;
      if (v === false || v === "false" || v === "False" || v === "FALSE") return false;
      if (v === "yes" || v === "Yes" || v === "YES") return true;
      if (v === "no" || v === "No" || v === "NO") return false;
      return v;
    };
    if (show_when === "equals") return normalize(dependentValue) === normalize(expectedValue);
    if (show_when === "not_equals") return normalize(dependentValue) !== normalize(expectedValue);
    if (show_when === "contains") return Array.isArray(dependentValue) ? dependentValue.includes(expectedValue) : String(dependentValue || "").includes(String(expectedValue || ""));
    if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
    if (show_when === "is_not_empty") return dependentValue != null && dependentValue !== "" && dependentValue !== false;
    return true;
  };
  const isFieldInHiddenGroup = (fieldId, data) => {
    const groups = form?.form_fields?.groups || [];
    if (groups.length > 0) {
      for (const group of groups) {
        if (!group?.conditional_visibility?.depends_on_field) continue;
        const fieldIds = group.fields || [];
        if (!fieldIds.includes(fieldId)) continue;
        if (!checkGroupVisibility(group, data)) return true;
      }
      return false;
    }
    const sections = form?.form_fields?.sections || [];
    for (const section of sections) {
      for (const group of section?.groups || []) {
        if (!group?.conditional_visibility?.depends_on_field) continue;
        const fieldIds = group.fields || [];
        if (!fieldIds.includes(fieldId)) continue;
        if (!checkGroupVisibility(group, data)) return true;
      }
    }
    return false;
  };

  const renderOneField = (field) => {
    const fieldId = field.id || field.field_id || field.field_name || field.name;
    const fieldType = (field.type || field.field_type)?.toLowerCase();
    const isDisplayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"].includes(fieldType);
    if (!checkFieldVisibility(field, effectiveSubmissionData) || isFieldInHiddenGroup(fieldId, effectiveSubmissionData)) return null;
    const value = isDisplayOnly ? undefined : effectiveSubmissionData[fieldId];
    const error = fieldErrors[fieldId];
    const statusFieldId = form?.form_config?.status_field_id ? String(form.form_config.status_field_id).trim() : "";
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
        otherTextValue={effectiveSubmissionData[`${fieldId}_other`]}
        onChange={isDisplayOnly ? undefined : handleFieldChange}
        error={error}
        readOnly={isFieldDisabledByCondition(field, effectiveSubmissionData)}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          {isPersonnelLinkedForm && !personnelSubjectUserId ? (
            <div className="mb-4 rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
              This form is linked to the personnel file. Open it from{" "}
              <strong>People → Info &amp; Compliance → Personnel File</strong> (or add{" "}
              <code className="rounded bg-background/60 px-1">?subjectUserId=…</code> to the URL) so submissions are stored
              against the correct person.
            </div>
          ) : null}
          <h1 className="text-3xl font-bold">{form.form_title || form.form_name}</h1>
          <p className="text-muted-foreground">Submit Form</p>
        </div>
      </div>

      {/* Progress Indicator */}
      {totalPages > 1 && (
        <Card>
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
          <CardHeader>
            <CardTitle>
              {totalPages > 1 ? `Step ${currentPage + 1} of ${totalPages}` : "Form Submission"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentPage === 0 && form.form_description && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">{form.form_description}</p>
              </div>
            )}

            {currentPageFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                This page has no fields defined.
              </p>
            ) : currentPageLayout ? (
              (() => {
                const { fieldsNotInAnySection, sectionsWithContent } = currentPageLayout;
                const allFormFields = form?.form_fields?.fields || [];
                const getFieldById = (id) => allFormFields.find((f) => (f.field_id || f.id || f.name) === id);
                return (
                  <div className="space-y-6 p-4">
                    {sectionsWithContent?.flatMap(({ sectionLabel, ungrouped, groupsWithFields }, sectionIdx) => [
                      sectionLabel ? (
                        <div key={`section-${sectionIdx}`} className="border-b pb-1.5">
                          <h3 className="text-sm font-semibold text-muted-foreground">{sectionLabel}</h3>
                        </div>
                      ) : null,
                      ...(groupsWithFields || []).map(({ group, fields: groupFields }) => {
                        if (!checkGroupVisibility(group, effectiveSubmissionData)) return null;
                        const isTabs = (group.layout || "") === "tabs" && (group.tabs || []).length > 0;
                        const groupKey = group.id || group.label || "tabs";
                        const activeTabId = activeTabByGroup[groupKey] ?? group.tabs?.[0]?.id;
                        if (isTabs) {
                          return (
                            <Card key={group.id || group.label}>
                              {group.label && (
                                <CardHeader className="py-3">
                                  <CardTitle className="text-lg font-bold">{group.label}</CardTitle>
                                </CardHeader>
                              )}
                              <CardContent className={group.label ? "pt-4 space-y-4" : "space-y-4"}>
                                <nav className="flex gap-4 border-b border-border mb-4 -mb-px">
                                  {(group.tabs || []).map((tab) => (
                                    <button
                                      key={tab.id || tab.label}
                                      type="button"
                                      onClick={() => setActiveTabByGroup((prev) => ({ ...prev, [groupKey]: tab.id || tab.label }))}
                                      className={cn(
                                        "py-2 px-1 border-b-2 text-sm font-medium transition-colors",
                                        activeTabId === (tab.id || tab.label) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                      )}
                                    >
                                      {tab.label || tab.id || "Tab"}
                                    </button>
                                  ))}
                                </nav>
                                <div className="space-y-4">
                                  {(group.tabs || []).map((tab) => {
                                    if (activeTabId !== (tab.id || tab.label)) return null;
                                    const tabHasTable = (tab.layout || "") === "table" && Array.isArray(tab.table_rows) && tab.table_rows.length > 0;
                                    if (tabHasTable) {
                                      const tableCols = Array.isArray(tab.table_columns) && tab.table_columns.length > 0 ? tab.table_columns : [{ id: "col_1", label: "Column 1" }];
                                      const tableRows = tab.table_rows || [];
                                      return (
                                        <div key={tab.id || tab.label} className="overflow-x-auto">
                                          <table className="w-full border-collapse text-sm">
                                            <thead>
                                              <tr className="border-b border-border">
                                                {tableCols.map((col) => (
                                                  <th key={col.id} className="text-left font-medium p-2 pr-4">{col.label || col.id}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {tableRows.filter((row) => checkRowVisibility(row, effectiveSubmissionData)).map((row, rIdx) => {
                                                const cells = (row.cells || []).slice(0, tableCols.length);
                                                while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                                                return (
                                                  <tr key={rIdx} className="border-b border-border">
                                                    {cells.map((cell, cIdx) => {
                                                      const fieldId = cell.field_id ? String(cell.field_id) : null;
                                                      const field = fieldId ? getFieldById(fieldId) : null;
                                                      const isVisible = !field || (checkFieldVisibility(field, effectiveSubmissionData) && !isFieldInHiddenGroup(fieldId, effectiveSubmissionData));
                                                      if (!isVisible) return <td key={cIdx} className="p-2 pr-4 align-middle" />;
                                                      const textPart = cell.text ? <span className="block">{cell.text}</span> : null;
                                                      const fieldPart = field ? (
                                                        <CustomFieldRenderer
                                                          field={{ ...field, id: field.id || field.field_id || field.field_name || field.name, field_label: field.label, field_type: field.type || field.field_type, field_options: { ...field.field_options, options: field.options || field.field_options?.options || [] } }}
                                                          value={effectiveSubmissionData[field.id || field.field_id || field.field_name || field.name]}
                                                          otherTextValue={effectiveSubmissionData[`${field.id || field.field_id}_other`]}
                                                          onChange={handleFieldChange}
                                                          hideLabel
                                                          error={fieldErrors[field.id || field.field_id || field.field_name || field.name]}
                                                          readOnly={isFieldDisabledByCondition(field, effectiveSubmissionData)}
                                                        />
                                                      ) : null;
                                                      return (
                                                        <td key={cIdx} className="p-2 pr-4 align-middle">
                                                          <div className="space-y-1">{textPart}{fieldPart}</div>
                                                        </td>
                                                      );
                                                    })}
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      );
                                    }
                                    const tabFieldIds = new Set(tab.fields || []);
                                    const tabFields = groupFields.filter((f) => tabFieldIds.has(f.id || f.field_id || f.name));
                                    return (
                                      <div key={tab.id || tab.label} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tabFields.map((field) => <div key={field.id || field.field_id || field.name}>{renderOneField(field)}</div>)}
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                        if ((group.layout || "") === "table") {
                          const tableCols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "Column 1" }];
                          const tableRows = Array.isArray(group.table_rows) ? group.table_rows : [];
                          return (
                            <Card key={group.id || group.label}>
                              {group.label && (
                                <CardHeader className="py-3">
                                  <CardTitle className="text-lg font-bold">{group.label}</CardTitle>
                                </CardHeader>
                              )}
                              <CardContent className={group.label ? "pt-4" : ""}>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse text-sm">
                                    <thead>
                                      <tr className="border-b border-border">
                                        {tableCols.map((col) => (
                                          <th key={col.id} className="text-left font-medium p-2 pr-4">{col.label || col.id}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {tableRows.filter((row) => checkRowVisibility(row, effectiveSubmissionData)).map((row, rIdx) => {
                                        const cells = (row.cells || []).slice(0, tableCols.length);
                                        while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                                        return (
                                          <tr key={rIdx} className="border-b border-border">
                                            {cells.map((cell, cIdx) => {
                                              const fieldId = cell.field_id ? String(cell.field_id) : null;
                                              const field = fieldId ? getFieldById(fieldId) : null;
                                              const isVisible = !field || (checkFieldVisibility(field, effectiveSubmissionData) && !isFieldInHiddenGroup(fieldId, effectiveSubmissionData));
                                              if (!isVisible) return <td key={cIdx} className="p-2 pr-4 align-middle" />;
                                              const fid = field?.id || field?.field_id || field?.field_name || field?.name;
                                              const fieldPart = field ? (
                                                <CustomFieldRenderer
                                                  field={{ ...field, id: fid, field_label: field.label, field_type: field.type || field.field_type, field_options: { ...field.field_options, options: field.options || field.field_options?.options || [] } }}
                                                  value={effectiveSubmissionData[fid]}
                                                  otherTextValue={effectiveSubmissionData[`${fid}_other`]}
                                                  onChange={handleFieldChange}
                                                  hideLabel
                                                  error={fieldErrors[fid]}
                                                  readOnly={isFieldDisabledByCondition(field, effectiveSubmissionData)}
                                                />
                                              ) : null;
                                              return (
                                                <td key={cIdx} className="p-2 pr-4 align-middle">
                                                  <div className="space-y-1">{cell.text ? <span className="block">{cell.text}</span> : null}{fieldPart}</div>
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                        const isGrid = (group.layout || "") === "grid" && (group.grid_rows?.length > 0 || group.grid_columns);
                        const rows = (group.grid_rows && group.grid_rows.length > 0) ? group.grid_rows : (group.grid_columns ? [group.grid_columns] : []);
                        if (isGrid && rows.length > 0) {
                          return (
                            <Card key={group.id || group.label}>
                              {group.label && (
                                <CardHeader className="py-3">
                                  <CardTitle className="text-lg font-bold">{group.label}</CardTitle>
                                </CardHeader>
                              )}
                              <CardContent className={group.label ? "pt-4 space-y-4" : "space-y-4"}>
                                <div className="space-y-4">
                                  {rows.filter((gridRow) => checkRowVisibility(gridRow, effectiveSubmissionData)).map((gridRow, rowIdx) => {
                                    const leftSlot = gridRow.left;
                                    const rightSlot = gridRow.right;
                                    const centerSlot = gridRow.center;
                                    const hasLeftOrRight = (Array.isArray(leftSlot) && leftSlot.length > 0) || (Array.isArray(rightSlot) && rightSlot.length > 0);
                                    const hasCenter = (Array.isArray(centerSlot) && centerSlot.length > 0);
                                    const renderSlot = (slot) => {
                                      if (!slot) return null;
                                      if (Array.isArray(slot)) {
                                        const slotFields = slot.map((fid) => groupFields.find((f) => (f.id || f.field_id || f.name) === fid)).filter(Boolean);
                                        return <div className="space-y-3">{slotFields.map((f) => <div key={f.id || f.field_id || f.name}>{renderOneField(f)}</div>)}</div>;
                                      }
                                      return null;
                                    };
                                    return (
                                      <div key={`row-${rowIdx}`} className="space-y-4">
                                        {hasLeftOrRight && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>{renderSlot(leftSlot)}</div>
                                            <div>{renderSlot(rightSlot)}</div>
                                          </div>
                                        )}
                                        {hasCenter && <div className="w-full">{renderSlot(centerSlot)}</div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                        return (
                          <Card key={group.id || group.label}>
                            {group.label && (
                              <CardHeader className="py-3">
                                <CardTitle className="text-lg font-bold">{group.label}</CardTitle>
                              </CardHeader>
                            )}
                            <CardContent className={group.label ? "pt-4" : ""}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupFields.map((field) => <div key={field.id || field.field_id || field.name}>{renderOneField(field)}</div>)}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }).filter(Boolean),
                      (ungrouped?.length > 0) ? (
                        <Card key={`ungrouped-${sectionIdx}`}>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {ungrouped.map((field) => <div key={field.id || field.field_id || field.name}>{renderOneField(field)}</div>)}
                            </div>
                          </CardContent>
                        </Card>
                      ) : null,
                    ].filter(Boolean))}
                    {fieldsNotInAnySection?.length > 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {fieldsNotInAnySection.map((field) => <div key={field.id || field.field_id || field.name}>{renderOneField(field)}</div>)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="space-y-6">
                {currentPageFields.map((field) => (
                  <div key={field.id || field.field_id || field.field_name || field.name}>{renderOneField(field)}</div>
                ))}
              </div>
            )}

            <div className="flex justify-between gap-2 pt-4 border-t">
              <div className="flex gap-2">
                <Link href={`/admin/forms/${formSlug}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
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
  );
};

export default FormSubmitPage;


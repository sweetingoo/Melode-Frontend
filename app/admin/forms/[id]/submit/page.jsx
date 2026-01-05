"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useForm, useCreateFormSubmission, useUpdateFormSubmission } from "@/hooks/useForms";
import { useUploadFile } from "@/hooks/useProfile";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";

const FormSubmitPage = () => {
  const params = useParams();
  const router = useRouter();
  const formSlug = params.id || params.slug;
  const resumeSubmissionId = params.resumeSubmissionId; // For resuming drafts

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
        return value instanceof Date
          ? value.toISOString().split("T")[0]
          : String(value);

      case "datetime":
      case "date_time":
        return value instanceof Date ? value.toISOString() : String(value);

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
        // For not_equals without a value, show if dependent field has any truthy value
        // This is commonly used to show a field when another field is checked/selected
        if (expectedValue === undefined || expectedValue === null || expectedValue === '') {
          // Show if dependent field has any truthy value (true, non-empty string, non-zero number, etc.)
          // For booleans: show when true
          // For strings: show when not empty
          // For numbers: show when not zero
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

  const totalPages = pages.length;
  const currentPageFields = pages[currentPage] || [];
  // Calculate progress based on pages completed (not current page)
  // On first page (0), show 0% - user hasn't completed any pages yet
  // On last page, show progress based on pages completed
  const progressPercentage = totalPages > 1 
    ? (currentPage / totalPages) * 100 
    : 0;

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
          form_id: parseInt(formId),
          submission_data: processedData,
          status: "draft",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
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
        <Card>
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
            ) : (
              <div className="space-y-6">
                {currentPageFields.map((field) => {
                  const fieldId = field.field_id || field.field_name;
                  const fieldType = field.field_type?.toLowerCase();
                  
                  // Display-only fields don't need value, onChange, or error handling
                  const isDisplayOnly = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'].includes(fieldType);
                  
                  // Debug logging for image blocks
                  if (fieldType === 'image_block' && process.env.NODE_ENV === 'development') {
                    console.log('Image block field in submit page:', {
                      fieldId,
                      fieldType,
                      field,
                      image_url: field.image_url,
                      image_file_id: field.image_file_id,
                      alt_text: field.alt_text
                    });
                  }
                  
                  // Check conditional visibility
                  const isVisible = checkFieldVisibility(field, submissionData);
                  if (!isVisible) {
                    return null;
                  }
                  
                  const value = isDisplayOnly ? undefined : submissionData[fieldId];
                  const error = isDisplayOnly ? undefined : fieldErrors[fieldId];

                  // Map field structure for CustomFieldRenderer
                  const mappedField = {
                    ...field,
                    id: fieldId,
                    field_label: field.label,
                    field_description: field.help_text,
                    field_type: field.field_type,
                    is_required: field.required,
                    required: field.required,
                    // Preserve display-only field properties
                    content: field.content,
                    image_url: field.image_url,
                    image_file_id: field.image_file_id,
                    alt_text: field.alt_text,
                    download_url: field.download_url,
                    // Preserve conditional visibility
                    conditional_visibility: field.conditional_visibility,
                    // Preserve validation object for file fields
                    validation: field.validation,
                    field_options: {
                      ...(field.field_options || {}), // Preserve all original field_options
                      options: field.options || [],
                      // For file fields, also map validation to field_options for backward compatibility
                      accept: field.field_options?.accept || (field.validation?.allowed_types
                        ? Array.isArray(field.validation.allowed_types)
                          ? field.validation.allowed_types.join(",")
                          : field.validation.allowed_types
                        : undefined),
                      maxSize: field.field_options?.maxSize || field.validation?.max_size_mb,
                      // Preserve allowMultiple setting
                      allowMultiple: field.field_options?.allowMultiple || false,
                      // File expiry date support
                      requireExpiryDate: field.file_expiry_date || false,
                    },
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
                })}
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


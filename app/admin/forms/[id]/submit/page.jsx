"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useForm, useCreateFormSubmission } from "@/hooks/useForms";
import { useUploadFile } from "@/hooks/useProfile";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";

const FormSubmitPage = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params.id;

  const { data: form, isLoading: formLoading } = useForm(formId);
  const createSubmissionMutation = useCreateFormSubmission();
  // Use silent mode for form submissions to avoid multiple toasts
  const uploadFileMutation = useUploadFile({ silent: true });

  const [submissionData, setSubmissionData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFieldChange = (fieldId, value) => {
    setSubmissionData({
      ...submissionData,
      [fieldId]: value,
    });
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

      default:
        return String(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      // Validate required fields
      const fields = form.form_fields?.fields || [];
      const errors = {};
      let hasErrors = false;

      for (const field of fields) {
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
            hasErrors = true;
          }
        }
      }

      if (hasErrors) {
        setFieldErrors(errors);
        setIsSubmitting(false);
        toast.error("Please fill in all required fields");
        return;
      }

      // Upload files first and replace File objects with file_ids
      const processedSubmissionData = {};
      const fileUploadPromises = [];

      for (const field of fields) {
        const fieldId = field.field_id || field.field_name;
        const value = submissionData[fieldId];

        if (field.field_type?.toLowerCase() === "file") {
          // Handle single file
          if (value instanceof File) {
            fileUploadPromises.push(
              uploadFileMutation
                .mutateAsync({
                  file: value,
                  form_id: parseInt(formId),
                  field_id: fieldId,
                })
                .then((uploadResult) => {
                  processedSubmissionData[fieldId] = uploadResult.id || uploadResult.file_id;
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
          else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            // Upload all files and collect their IDs
            const fileUploads = value.map((file, index) =>
              uploadFileMutation
                .mutateAsync({
                  file: file,
                  form_id: parseInt(formId),
                  field_id: fieldId,
                })
                .then((uploadResult) => uploadResult.id || uploadResult.file_id)
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
                })
            );
            
            fileUploadPromises.push(
              Promise.all(fileUploads).then((fileIds) => {
                processedSubmissionData[fieldId] = fileIds;
              })
            );
          }
          // Handle existing file IDs (already uploaded, from edit mode)
          else if (typeof value === 'number' || (Array.isArray(value) && value.every(v => typeof v === 'number'))) {
            processedSubmissionData[fieldId] = value;
          }
        } else {
          // Format and add non-file fields
          const formattedValue = formatFieldValueForAPI(field, value);
          if (formattedValue !== null) {
            processedSubmissionData[fieldId] = formattedValue;
          }
        }
      }

      // Wait for all file uploads to complete
      if (fileUploadPromises.length > 0) {
        await Promise.all(fileUploadPromises);
      }

      // Submit the form with processed data
      const result = await createSubmissionMutation.mutateAsync({
        form_id: parseInt(formId),
        submission_data: processedSubmissionData,
        status: "submitted",
      });

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
          router.push(`/admin/forms/${formId}/submissions/${result.id}`);
        } else if (taskInfo.task_id) {
          // Single collaborative task
          router.push(`/admin/tasks/${taskInfo.task_id}`);
        } else {
          router.push(`/admin/forms/${formId}/submissions/${result.id}`);
        }
      } else {
        router.push(`/admin/forms/${formId}/submissions/${result.id}`);
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      setIsSubmitting(false);
    }
  };


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
        <Link href="/admin/forms">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Form not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields = form.form_fields?.fields || [];

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
          <h1 className="text-3xl font-bold">{form.form_title || form.form_name}</h1>
          <p className="text-muted-foreground">Submit Form</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Form Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.form_description && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">{form.form_description}</p>
              </div>
            )}

            {fields.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                This form has no fields defined.
              </p>
            ) : (
              <div className="space-y-6">
                {fields.map((field) => {
                  const fieldId = field.field_id || field.field_name;
                  const value = submissionData[fieldId];
                  const error = fieldErrors[fieldId];

                  // Map field structure for CustomFieldRenderer
                  const mappedField = {
                    ...field,
                    id: fieldId,
                    field_label: field.label,
                    field_description: field.help_text,
                    field_type: field.field_type,
                    is_required: field.required,
                    required: field.required,
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
                    },
                  };

                  return (
                    <CustomFieldRenderer
                      key={fieldId}
                      field={mappedField}
                      value={value}
                      onChange={handleFieldChange}
                      error={error}
                    />
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href={`/admin/forms/${formId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
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
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default FormSubmitPage;


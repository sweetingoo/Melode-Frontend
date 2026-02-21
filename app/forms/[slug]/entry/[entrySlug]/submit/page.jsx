"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Info } from "lucide-react";
import { trackersService } from "@/services/trackers";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";

export default function PublicEntrySubmitPage() {
  const params = useParams();
  const router = useRouter();
  const entrySlug = params.entrySlug;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionData, setSubmissionData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!entrySlug) {
      setLoading(false);
      setError("Entry not found");
      return;
    }
    trackersService
      .getEntryPublicForm(entrySlug)
      .then((res) => {
        setData(res);
        setSubmissionData(res?.entry?.submission_data ? { ...res.entry.submission_data } : {});
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || err.message || "Failed to load form";
        setError(Array.isArray(msg) ? msg[0]?.msg || msg : msg);
      })
      .finally(() => setLoading(false));
  }, [entrySlug]);

  const form = data?.form;
  const entry = data?.entry;
  const fields = form?.form_fields?.fields || [];
  const sections = form?.form_fields?.sections || [];
  // API returns only the current stage's section and fields (one section)
  const formStageLabel = sections.length > 0 ? sections.map((s) => s.label).filter(Boolean).join(", ") : null;
  const entryCurrentStage = entry?.formatted_data?.derived_stage || null;
  const publicStageLabels = sections.map((s) => s.label).filter(Boolean);
  const currentStageNotPubliclyEditable =
    entryCurrentStage && publicStageLabels.length > 0 && !publicStageLabels.includes(entryCurrentStage);

  const handleFieldChange = (fieldId, value) => {
    setSubmissionData((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) setFieldErrors((prev) => ({ ...prev, [fieldId]: null }));
  };

  const formatFieldValueForAPI = (field, value) => {
    if (value === null || value === undefined || value === "") return null;
    const fieldType = (field.field_type || field.type)?.toLowerCase();
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
      case "datetime":
      case "date_time":
        if (value instanceof Date) return value.toISOString();
        return String(value);
      case "time":
        if (value instanceof Date) {
          const h = value.getHours().toString().padStart(2, "0");
          const m = value.getMinutes().toString().padStart(2, "0");
          return `${h}:${m}`;
        }
        return String(value);
      case "select":
      case "radio":
        return String(value);
      case "multiselect":
        return Array.isArray(value) ? value : [String(value)];
      case "file":
        return typeof value === "number" ? value : null;
      case "signature":
        return typeof value === "string" ? value : null;
      default:
        return String(value);
    }
  };

  const checkFieldVisibility = (field, data) => {
    if (!field.conditional_visibility) return true;
    const { depends_on_field, show_when, value: expectedValue } = field.conditional_visibility;
    const dependentValue = data[depends_on_field];
    const normalize = (v) => {
      if (v === true || v === "true" || v === "True") return true;
      if (v === false || v === "false" || v === "False") return false;
      return v;
    };
    if (show_when === "equals") return normalize(dependentValue) === normalize(expectedValue);
    if (show_when === "not_equals") return normalize(dependentValue) !== normalize(expectedValue);
    if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
    if (show_when === "is_not_empty") return dependentValue != null && dependentValue !== "" && dependentValue !== false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const displayOnly = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"];
    const errors = {};
    for (const field of fields) {
      const type = (field.type || field.field_type)?.toLowerCase();
      if (displayOnly.includes(type)) continue;
      if (!checkFieldVisibility(field, submissionData)) continue;
      const fieldId = field.id || field.field_id || field.field_name || field.name;
      const value = submissionData[fieldId];
      if (field.required || field.is_required) {
        if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
          errors[fieldId] = `${field.label || field.field_label || fieldId} is required`;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      toast.error("Please fill in all required fields");
      return;
    }

    const processed = {};
    for (const field of fields) {
      const type = (field.type || field.field_type)?.toLowerCase();
      if (displayOnly.includes(type)) continue;
      if (!checkFieldVisibility(field, submissionData)) continue;
      const fieldId = field.id || field.field_id || field.field_name || field.name;
      const v = formatFieldValueForAPI(field, submissionData[fieldId]);
      if (v !== null) processed[fieldId] = v;
    }

    try {
      await trackersService.publicSubmitEntry(entrySlug, { submission_data: processed });
      toast.success("Form submitted successfully");
      router.push(`/forms/${params.slug}/entry/${entrySlug}/submitted`);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Submission failed";
      toast.error(Array.isArray(msg) ? msg[0]?.msg || "Submission failed" : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || "Form not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayOnlyTypes = ["text_block", "image_block", "youtube_video_embed", "line_break", "page_break", "download_link"];

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{form.form_name || form.form_title || "Submit form"}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-muted-foreground">Case #{entry?.tracker_entry_number ?? entry?.id ?? "—"}</span>
            {formStageLabel && (
              <Badge variant="secondary" className="font-normal">
                Section: {formStageLabel}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {formStageLabel
              ? `Complete the fields below for "${formStageLabel}" and submit.`
              : "Complete the fields below and submit."}
          </p>
          {currentStageNotPubliclyEditable && (
            <div className="mt-4 flex gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-muted-foreground">
                This entry is currently in the stage <strong className="text-foreground">&quot;{entryCurrentStage}&quot;</strong>, which cannot be edited through this link. You can complete the section below ({formStageLabel}) and submit; staff will review.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{formStageLabel || "Form"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No fields to complete.</p>
              ) : (
                <div className="space-y-6">
                  {fields.map((field) => {
                    const fieldId = field.id || field.field_id || field.field_name || field.name;
                    const fieldType = (field.type || field.field_type)?.toLowerCase();
                    const isDisplayOnly = displayOnlyTypes.includes(fieldType);
                    if (!checkFieldVisibility(field, submissionData)) return null;

                    const value = isDisplayOnly ? undefined : submissionData[fieldId];
                    const error = isDisplayOnly ? undefined : fieldErrors[fieldId];
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
                      conditional_visibility: field.conditional_visibility,
                      validation: field.validation,
                      field_options: {
                        ...(field.field_options || {}),
                        options: field.options || [],
                        accept: field.field_options?.accept,
                        maxSize: field.field_options?.maxSize || field.validation?.max_size_mb,
                        allowMultiple: field.field_options?.allowMultiple || false,
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

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

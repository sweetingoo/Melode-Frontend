"use client";

import React, { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useForm, useCreateFormSubmission } from "@/hooks/useForms";
import { format } from "date-fns";

const FormSubmitPage = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params.id;

  const { data: form, isLoading: formLoading } = useForm(formId);
  const createSubmissionMutation = useCreateFormSubmission();

  const [submissionData, setSubmissionData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldId, value) => {
    setSubmissionData({
      ...submissionData,
      [fieldId]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createSubmissionMutation.mutateAsync({
        form_id: parseInt(formId),
        submission_data: submissionData,
        status: "submitted",
      });

      // If tasks were created, handle individual vs collaborative tasks
      if (result.processing_result?.task_creation?.created) {
        const taskInfo = result.processing_result.task_creation;
        
        if (taskInfo.individual_tasks && taskInfo.task_ids && taskInfo.task_ids.length > 0) {
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

  const renderField = (field) => {
    const fieldId = field.field_id || field.field_name;
    const value = submissionData[fieldId] || "";

    switch (field.field_type) {
      case "textarea":
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case "number":
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              id={fieldId}
              type="number"
              value={value}
              onChange={(e) =>
                handleFieldChange(fieldId, parseFloat(e.target.value) || "")
              }
              required={field.required}
            />
          </div>
        );

      case "email":
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              id={fieldId}
              type="email"
              value={value}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case "date":
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              id={fieldId}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={fieldId} className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={value === true || value === "true" || value === true}
              onCheckedChange={(checked) =>
                handleFieldChange(fieldId, checked)
              }
              required={field.required}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
          </div>
        );

      case "select":
        const selectOptions = field.field_options?.options || field.options || field.choices || field.validation?.options || [];
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            {selectOptions.length > 0 ? (
              <Select
                value={value || undefined}
                onValueChange={(newValue) => handleFieldChange(fieldId, newValue)}
                required={field.required}
              >
                <SelectTrigger id={fieldId}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option, index) => {
                    const optionValue = typeof option === "string" ? option : option.value || option.label || option;
                    const optionLabel = typeof option === "string" ? option : option.label || option.value || option;
                    // Ensure value is not empty string
                    const safeValue = String(optionValue).trim() || `option-${index}`;
                    return (
                      <SelectItem key={index} value={safeValue}>
                        {String(optionLabel)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 border rounded-md bg-muted text-sm text-muted-foreground">
                No options available for this field
              </div>
            )}
          </div>
        );

      case "radio":
        const radioOptions = field.field_options?.options || field.options || field.choices || field.validation?.options || [];
        return (
          <div key={fieldId}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            <RadioGroup
              value={value || ""}
              onValueChange={(newValue) => handleFieldChange(fieldId, newValue)}
              required={field.required}
              className="mt-2"
            >
              {radioOptions.length > 0 ? (
                radioOptions.map((option, index) => {
                  const optionValue = typeof option === "string" ? option : option.value || option.label || option;
                  const optionLabel = typeof option === "string" ? option : option.label || option.value || option;
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(optionValue)} id={`${fieldId}-${index}`} />
                      <Label htmlFor={`${fieldId}-${index}`} className="cursor-pointer font-normal">
                        {String(optionLabel)}
                      </Label>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No options available</p>
              )}
            </RadioGroup>
          </div>
        );

      default:
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              id={fieldId}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        );
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
              <div className="space-y-4">
                {fields.map((field) => renderField(field))}
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


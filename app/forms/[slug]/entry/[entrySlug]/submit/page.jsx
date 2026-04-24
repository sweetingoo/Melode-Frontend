"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, Info } from "lucide-react";
import { api } from "@/services/api-client";
import { trackersService } from "@/services/trackers";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { checkGroupConditionalVisibility as checkGroupVisibility, checkLayoutRowVisibility } from "@/lib/groupConditionalVisibility";
import { filterNonEmptyGridColumns, gridRowFieldIdsFlat, normalizeGridRowColumns, trackerGridRowColsClass } from "@/utils/trackerGridLayout";

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
  const [selectedNextStage, setSelectedNextStage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

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
  const publicSubmitDisabled = Boolean(data?.public_submit_disabled);
  const entryCurrentStage = data?.entry_current_stage ?? entry?.formatted_data?.derived_stage ?? null;
  const nextStages = data?.next_stages ?? [];
  const currentStageStatuses = data?.current_stage_statuses ?? [];
  // Status options: if a next stage is selected, show that stage's statuses; otherwise current stage statuses
  const statusOptions = selectedNextStage
    ? (nextStages.find((s) => (s.stage || "").trim() === (selectedNextStage || "").trim())?.statuses ?? [])
    : currentStageStatuses;
  // API returns only the current stage's section when allowed; when entry moved to non-public stage, fields/sections are empty and public_submit_disabled is true
  const formStageLabel = sections.length > 0 ? sections.map((s) => s.label).filter(Boolean).join(", ") : null;
  const publicStageLabels = sections.map((s) => s.label).filter(Boolean);
  const currentStageNotPubliclyEditable =
    publicSubmitDisabled || (Boolean(entryCurrentStage) && publicStageLabels.length > 0 && !publicStageLabels.includes(entryCurrentStage));

  const handleFieldChange = (fieldId, value) => {
    setSubmissionData((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) setFieldErrors((prev) => ({ ...prev, [fieldId]: null }));
  };

  /** True if value looks like a masked placeholder (e.g. "***"). Do not send to API to avoid overwriting real data. */
  const looksLikeMaskedValue = (v) => {
    if (v == null) return false;
    const s = String(v).trim();
    return s.length > 0 && s.split("").every((c) => c === "*");
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
      case "boolean_with_description":
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
      case "table_radio":
        return String(value);
      case "multiselect":
        return Array.isArray(value) ? value : [String(value)];
      case "file":
        return typeof value === "number" ? value : null;
      case "signature":
      case "image_free_draw":
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
      if (v === true || v === "true" || v === "True" || v === "TRUE") return true;
      if (v === false || v === "false" || v === "False" || v === "FALSE") return false;
      if (v === "yes" || v === "Yes" || v === "YES") return true;
      if (v === "no" || v === "No" || v === "NO") return false;
      return v;
    };
    if (show_when === "equals") return normalize(dependentValue) === normalize(expectedValue);
    if (show_when === "not_equals") return normalize(dependentValue) !== normalize(expectedValue);
    if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
    if (show_when === "is_not_empty") return dependentValue != null && dependentValue !== "" && dependentValue !== false;
    return true;
  };

  const checkRowVisibility = checkLayoutRowVisibility;

  const formLayout = useMemo(() => {
    if (!sections.length || !fields.length) return null;
    return sections.map((section, index) => {
      const sectionKey = section.id ?? section.title ?? section.label ?? `section-${index}`;
      const sectionFields = (section.fields?.length)
        ? (section.fields || []).map((fid) => fields.find((f) => (f.id || f.name || f.field_id || f.field_name) === fid)).filter(Boolean)
        : fields.filter((f) => f.section === section.id || f.section === sectionKey);
      const groups = section.groups && Array.isArray(section.groups) ? section.groups : [];
      const sectionLabel = section.label || section.title || section.id || "Section";
      let ungrouped = [];
      let groupsWithFields = [];
      if (groups.length > 0) {
        const fieldIdsInGroups = new Set(
          groups.flatMap((g) => {
            const fromFields = (g.fields || []).map(String);
            const fromTable = (g.table_rows || []).flatMap((row) => (row.cells || []).map((c) => c.field_id).filter(Boolean).map(String));
            const fromGrid = (g.grid_rows || []).flatMap((row) => gridRowFieldIdsFlat(row).map(String));
            return [...fromFields, ...fromTable, ...fromGrid];
          })
        );
        ungrouped = sectionFields.filter((f) => !fieldIdsInGroups.has(String(f?.id || f?.name || f?.field_id || f?.field_name)));
        groupsWithFields = groups.map((g) => {
          const ids = new Set([
            ...(g.fields || []).map(String),
            ...(g.table_rows || []).flatMap((row) => (row.cells || []).map((c) => c.field_id).filter(Boolean).map(String)),
            ...(g.grid_rows || []).flatMap((row) => gridRowFieldIdsFlat(row).map(String)),
          ]);
          return {
            group: g,
            fields: sectionFields.filter((f) => ids.has(String(f?.id || f?.name || f?.field_id || f?.field_name))),
          };
        });
      } else {
        ungrouped = sectionFields;
      }
      return { sectionKey, sectionLabel, ungrouped, groupsWithFields, sectionFields };
    });
  }, [sections, fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStageNotPubliclyEditable) {
      toast.error("Public submission is not available for this entry.");
      return;
    }
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

    const formId = form?.id ?? entry?.form_id;
    const getFileFromValue = (val) => {
      if (val instanceof File) return { file: val, expiryDate: null };
      if (val && typeof val === "object" && val.file) return val;
      return null;
    };

    const processed = {};
    for (const field of fields) {
      const type = (field.type || field.field_type)?.toLowerCase();
      if (displayOnly.includes(type)) continue;
      if (!checkFieldVisibility(field, submissionData)) continue;
      const fieldId = field.id || field.field_id || field.field_name || field.name;
      const value = submissionData[fieldId];

      // Do not send masked placeholders (e.g. after refresh); only update fields with real values
      if (looksLikeMaskedValue(value)) continue;

      if (type === "file" && value != null) {
        if (value instanceof File || (value && typeof value === "object" && value.file && !Array.isArray(value))) {
          const fileData = getFileFromValue(value);
          const file = fileData?.file || value;
          try {
            const formData = new FormData();
            formData.append("file", file);
            if (formId != null) formData.append("form_id", String(formId));
            formData.append("field_id", String(fieldId));
            const res = await api.post("/settings/files/upload", formData);
            const data = res?.data ?? res;
            const fileRef = data?.file_reference_id ?? data?.id ?? data?.file_id;
            if (fileRef != null) processed[fieldId] = fileRef;
          } catch (err) {
            const msg = err.response?.data?.detail || err.message || "File upload failed";
            setFieldErrors((prev) => ({ ...prev, [fieldId]: typeof msg === "string" ? msg : "File upload failed" }));
            setIsSubmitting(false);
            toast.error(`Upload failed for ${field.label || fieldId}`);
            return;
          }
          continue;
        }
        if (Array.isArray(value) && value.length > 0) {
          const first = value[0];
          if (first instanceof File || (first && typeof first === "object" && first.file)) {
            const fileIds = [];
            for (let i = 0; i < value.length; i++) {
              const fileData = getFileFromValue(value[i]);
              const file = fileData?.file || value[i];
              try {
                const formData = new FormData();
                formData.append("file", file);
                if (formId != null) formData.append("form_id", String(formId));
                formData.append("field_id", String(fieldId));
                const res = await api.post("/settings/files/upload", formData);
                const data = res?.data ?? res;
                const fileRef = data?.file_reference_id ?? data?.id ?? data?.file_id;
                if (fileRef != null) fileIds.push(fileRef);
              } catch (err) {
                const msg = err.response?.data?.detail || err.message || "File upload failed";
                setFieldErrors((prev) => ({ ...prev, [fieldId]: typeof msg === "string" ? msg : "File upload failed" }));
                setIsSubmitting(false);
                toast.error(`Upload failed for ${field.label || fieldId}`);
                return;
              }
            }
            if (fileIds.length > 0) processed[fieldId] = fileIds;
            continue;
          }
        }
        if (typeof value === "number" || (Array.isArray(value) && value.every((x) => typeof x === "number"))) {
          processed[fieldId] = value;
          continue;
        }
        continue;
      }

      const v = formatFieldValueForAPI(field, value);
      if (v !== null) processed[fieldId] = v;

      const oth = submissionData[`${fieldId}_other`];
      if (oth !== undefined && oth !== null && String(oth).trim() !== "") {
        processed[`${fieldId}_other`] = oth;
      }
      const fmap = submissionData[`${fieldId}_free_text`];
      if (fmap && typeof fmap === "object" && !Array.isArray(fmap) && Object.keys(fmap).length > 0) {
        processed[`${fieldId}_free_text`] = fmap;
      }
    }

    try {
      const body = { submission_data: processed };
      if (selectedNextStage?.trim()) body.next_stage = selectedNextStage.trim();
      if (selectedStatus?.trim()) body.status = selectedStatus.trim();
      await trackersService.publicSubmitEntry(entrySlug, body);
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
            {currentStageNotPubliclyEditable
              ? "Public submission is no longer available for this entry."
              : formStageLabel
                ? `Complete the fields below for "${formStageLabel}" and submit.`
                : "Complete the fields below and submit."}
          </p>
          {currentStageNotPubliclyEditable && (
            <div className="mt-4 flex gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-muted-foreground">
                This entry is currently in the stage <strong className="text-foreground">&quot;{entryCurrentStage}&quot;</strong>. Public submission via this link is disabled for that stage. Staff will manage the entry from here.
              </p>
            </div>
          )}
        </div>

        {currentStageNotPubliclyEditable ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You cannot submit through this link. The entry has moved to a later stage.
            </CardContent>
          </Card>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-3 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm">
            <Info className="h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-muted-foreground">
              Fields showing ••• are hidden for privacy. Do not edit them unless you need to change the value; if you do, enter the full new value. Submitting without editing those fields will not change the existing data.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{formStageLabel || "Form"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No fields to complete.</p>
              ) : (() => {
                const mapFieldToMapped = (field) => {
                  const fieldId = field.id || field.field_id || field.field_name || field.name;
                  const fieldType = (field.type || field.field_type)?.toLowerCase();
                  const isDisplayOnly = displayOnlyTypes.includes(fieldType);
                  return {
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
                };
                const renderField = (field) => {
                  const fieldId = field.id || field.field_id || field.field_name || field.name;
                  const fieldType = (field.type || field.field_type)?.toLowerCase();
                  const isDisplayOnly = displayOnlyTypes.includes(fieldType);
                  if (!checkFieldVisibility(field, submissionData)) return null;
                  const value = isDisplayOnly ? undefined : submissionData[fieldId];
                  const error = isDisplayOnly ? undefined : fieldErrors[fieldId];
                  return (
                    <CustomFieldRenderer
                      key={fieldId}
                      field={mapFieldToMapped(field)}
                      value={value}
                      otherTextValue={submissionData[`${fieldId}_other`]}
                      optionFreeTextMap={submissionData[`${fieldId}_free_text`]}
                      onChange={isDisplayOnly ? undefined : handleFieldChange}
                      error={error}
                    />
                  );
                };

                if (formLayout && formLayout.length > 0) {
                  return (
                    <div className="space-y-6">
                      {formLayout.map(({ sectionLabel, ungrouped, groupsWithFields, sectionFields }) => (
                        <div key={sectionLabel} className="space-y-4">
                          {groupsWithFields.map(({ group, fields: groupFields }) => {
                            if (!checkGroupVisibility(group, submissionData)) return null;
                            const layout = (group.layout || "stack").toLowerCase();
                            const hasTableStructure = Array.isArray(group.table_columns) && group.table_columns.length > 0;
                            const tableRowsForGroup = Array.isArray(group.table_rows) ? group.table_rows : [];
                            const isTable = layout === "table" && (hasTableStructure || tableRowsForGroup.length > 0);
                            const gridRows = (group.grid_rows && group.grid_rows.length > 0) ? group.grid_rows : (group.grid_columns ? [{ ...group.grid_columns }] : []);
                            const isGrid = layout === "grid" && gridRows.length > 0;
                            const allSectionFields = sectionFields || [];
                            const getFieldById = (fid) => groupFields.find((f) => String(f.id || f.name || f.field_id || f.field_name) === String(fid)) ?? allSectionFields.find((f) => String(f.id || f.name || f.field_id || f.field_name) === String(fid));
                            const visibleFields = groupFields.filter((f) => checkFieldVisibility(f, submissionData));
                            if (!isTable && !isGrid && visibleFields.length === 0) return null;
                            if (isTable && tableRowsForGroup.length === 0 && !hasTableStructure) return null;
                            if (isGrid && gridRows.length === 0) return null;
                            const groupLabel = group.label || group.title || group.name || "";
                            return (
                              <div key={group.id || group.label || "g"} className="space-y-2">
                                {groupLabel ? <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{groupLabel}</h4> : null}
                                {isTable ? (
                                  <div className="overflow-x-auto rounded-md border">
                                    <table className="w-full border-collapse text-sm">
                                      <thead>
                                        <tr className="border-b bg-muted/50">
                                          {(Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "" }]).map((col) => (
                                            <th key={col.id} className="text-left font-medium p-2">{String(col?.label ?? "").trim()}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(tableRowsForGroup.length > 0 ? tableRowsForGroup : [{ cells: (group.table_columns || [{ id: "c1" }]).map(() => ({ text: "", field_id: null })) }])
                                          .filter((row) => checkRowVisibility(row, submissionData))
                                          .map((row, rIdx) => {
                                            const tableCols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "" }];
                                            const cells = (row.cells || []).slice(0, tableCols.length);
                                            while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                                            return (
                                              <tr key={rIdx} className="border-b last:border-b-0">
                                                {cells.map((cell, cIdx) => {
                                                  const fieldId = cell.field_id ? String(cell.field_id) : null;
                                                  const field = fieldId ? getFieldById(fieldId) : null;
                                                  if (!field && !cell.text) return <td key={cIdx} className="p-2" />;
                                                  if (field && !checkFieldVisibility(field, submissionData)) return <td key={cIdx} className="p-2" />;
                                                  return (
                                                    <td key={cIdx} className="p-2 align-top">
                                                      <div className="space-y-1">
                                                        {cell.text ? <span className="text-muted-foreground text-xs block">{cell.text}</span> : null}
                                                        {field ? renderField(field) : null}
                                                      </div>
                                                    </td>
                                                  );
                                                })}
                                              </tr>
                                            );
                                          })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : isGrid ? (
                                  <div className="space-y-4">
                                    {gridRows.filter((gridRow) => checkRowVisibility(gridRow, submissionData)).map((gridRow, rowIdx) => {
                                      const colIds = normalizeGridRowColumns(gridRow);
                                      const colFields = filterNonEmptyGridColumns(
                                        colIds.map((ids) =>
                                          ids.map((fid) => getFieldById(fid)).filter(Boolean).filter((f) => checkFieldVisibility(f, submissionData)),
                                        ),
                                      );
                                      if (colFields.length === 0) return null;
                                      const rowTitle = gridRow.label || gridRow.title;
                                      return (
                                        <div key={`row-${rowIdx}`} className="space-y-3">
                                          {rowTitle && (
                                            <h4 className="text-sm font-medium text-foreground border-b pb-1">{rowTitle}</h4>
                                          )}
                                          <div className={trackerGridRowColsClass(colFields.length)}>
                                            {colFields.map((fields, colIdx) => (
                                              <div key={colIdx} className="space-y-2">
                                                {fields.map((f) => renderField(f))}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className={layout === "stack" ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"}>
                                    {visibleFields.map((field) => (
                                      <div key={field.id || field.name || field.field_id} className={cn("space-y-1", ["text_block", "image_block", "youtube_video_embed"].includes((field.type || field.field_type || "").toLowerCase()) && "md:col-span-2")}>
                                        {renderField(field)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {ungrouped.filter((f) => checkFieldVisibility(f, submissionData)).map((field) => (
                            <div key={field.id || field.name || field.field_id} className="space-y-1">
                              {renderField(field)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
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
                          otherTextValue={submissionData[`${fieldId}_other`]}
                          optionFreeTextMap={submissionData[`${fieldId}_free_text`]}
                          onChange={isDisplayOnly ? undefined : handleFieldChange}
                          error={error}
                        />
                      );
                    })}
                  </div>
                );
              })()}

              {(nextStages.length > 0 || currentStageStatuses.length > 0) && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="text-sm font-medium text-muted-foreground">Next stage &amp; status</div>
                  <div className="flex flex-wrap gap-4 items-end">
                    {nextStages.length > 0 && (
                      <div className="space-y-2 min-w-[180px]">
                        <Label htmlFor="next-stage" className="text-sm">Next Stage</Label>
                        <Select value={selectedNextStage || "__none__"} onValueChange={(v) => { setSelectedNextStage(v === "__none__" ? "" : v); setSelectedStatus(""); }}>
                          <SelectTrigger id="next-stage" className="w-full">
                            <SelectValue placeholder="Stay in current stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Stay in current stage</SelectItem>
                            {nextStages.map((s) => (
                              <SelectItem key={s.stage} value={s.stage || ""}>{s.stage}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {(statusOptions.length > 0) && (
                      <div className="space-y-2 min-w-[180px]">
                        <Label htmlFor="status" className="text-sm">Status</Label>
                        <Select value={selectedStatus || "__none__"} onValueChange={(v) => setSelectedStatus(v === "__none__" ? "" : v)}>
                          <SelectTrigger id="status" className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— No change —</SelectItem>
                            {statusOptions.map((statusVal) => (
                              <SelectItem key={statusVal} value={statusVal}>{statusVal}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
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
                      Submit Form
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
        )}
      </div>
    </div>
  );
}

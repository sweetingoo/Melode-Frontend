"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PeopleFieldRoleSelector } from "@/components/trackers/PeopleFieldRoleSelector";

/**
 * Configuration fields for "Create and add" from layout (stack/grid/table).
 * Mirrors Add New Field except Field ID and Stage (handled by parent).
 */
export function TrackerLayoutQuickCreateFieldForm({
  draft,
  setDraft,
  newOption,
  setNewOption,
  onAddOption,
  onRemoveOption,
  uploadFileMutation,
  generateFieldIdFromLabel,
}) {
  const t = (draft.type || "").toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="layout-quick-required"
            checked={!!draft.required}
            onChange={(e) => setDraft((prev) => ({ ...prev, required: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="layout-quick-required" className="cursor-pointer text-sm">
            Required
          </Label>
        </div>
        {!["text_block", "image_block", "line_break", "page_break", "youtube_video_embed", "download_link"].includes(t) && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="layout-quick-show-label"
              checked={draft.field_options?.show_label !== false}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  field_options: { ...(prev.field_options || {}), show_label: e.target.checked },
                }))
              }
              className="rounded"
            />
            <Label htmlFor="layout-quick-show-label" className="cursor-pointer text-sm">
              Show label
            </Label>
          </div>
        )}
      </div>

      {draft.type === "people" && (
        <div className="space-y-3 rounded-md border p-3 bg-muted/20">
          <Label className="text-sm font-medium">People field</Label>
          <div className="space-y-2">
            <Label className="text-xs">Filter by roles (optional)</Label>
            <PeopleFieldRoleSelector
              selectedRoleIds={draft.filter_by_roles || []}
              onChange={(roleIds) => setDraft((prev) => ({ ...prev, filter_by_roles: roleIds }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="layout-quick-filter-org"
              checked={draft.filter_by_organization || false}
              onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, filter_by_organization: !!checked }))}
            />
            <Label htmlFor="layout-quick-filter-org" className="cursor-pointer text-sm">
              Filter by full organization
            </Label>
          </div>
        </div>
      )}

      {(draft.type === "boolean" || draft.type === "checkbox" || draft.type === "boolean_with_description") && (
        <div className="space-y-2 rounded-md border p-3 bg-muted/20">
          <Label className="text-xs">Display as</Label>
          <Select
            value={draft.field_options?.boolean_display || "checkbox"}
            onValueChange={(v) =>
              setDraft((prev) => ({
                ...prev,
                field_options: { ...(prev.field_options || {}), boolean_display: v },
              }))
            }
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkbox">Checkbox (single)</SelectItem>
              <SelectItem value="radio">Yes / No radios</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-xs">Checkbox style</Label>
          <Select
            value={draft.field_options?.checkbox_display_style || draft.field_options?.display_style || "default"}
            onValueChange={(v) =>
              setDraft((prev) => ({
                ...prev,
                field_options: { ...(prev.field_options || {}), checkbox_display_style: v },
              }))
            }
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="warning">Warning (amber box)</SelectItem>
              <SelectItem value="alert">Alert (yellow left border)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(draft.type === "select" || draft.type === "radio" || draft.type === "multiselect") && (
        <div className="space-y-2 rounded-md border p-3 bg-muted/20">
          <Label>Options</Label>
          <div className="flex flex-wrap gap-2 items-end">
            <Input
              placeholder="Label *"
              value={newOption.label}
              onChange={(e) => {
                const newLabel = e.target.value;
                setNewOption((prev) => ({
                  ...prev,
                  label: newLabel,
                  value:
                    prev.value === "" || prev.value === generateFieldIdFromLabel(prev.label)
                      ? generateFieldIdFromLabel(newLabel)
                      : prev.value,
                }));
              }}
              className="flex-1 min-w-[120px]"
            />
            <Input
              placeholder="Value (optional)"
              value={newOption.value}
              onChange={(e) => setNewOption((prev) => ({ ...prev, value: e.target.value }))}
              className="flex-1 min-w-[120px]"
            />
            <Button type="button" variant="outline" size="sm" onClick={onAddOption} disabled={!newOption.label}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {(draft.options || []).length > 0 && (
            <div className="space-y-1">
              {(draft.options || []).map((option, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>
                    <strong>{option.value}</strong>: {option.label}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveOption(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {draft.type === "image_free_draw" && (
        <div className="space-y-2 rounded-md border p-3 bg-muted/20">
          <Label className="text-sm font-medium">Background image</Label>
          <Tabs
            defaultValue={draft.background_image_file_reference_id || draft.background_image_file ? "upload" : "url"}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">Direct URL</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-2">
              <Input
                placeholder="https://…"
                value={draft.background_image_url || ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    background_image_url: e.target.value,
                    background_image_file: null,
                    background_image_file_reference_id: "",
                  }))
                }
              />
            </TabsContent>
            <TabsContent value="upload" className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setDraft((prev) => ({
                      ...prev,
                      background_image_file: file,
                      background_image_url: "",
                      background_image_file_reference_id: "",
                    }));
                    const uploadResult = await uploadFileMutation.mutateAsync({ file });
                    const fileRef =
                      uploadResult?.file_reference_id ??
                      uploadResult?.slug ??
                      uploadResult?.id ??
                      uploadResult?.file_id;
                    if (fileRef === undefined || fileRef === null || fileRef === "") {
                      throw new Error("No file reference from upload");
                    }
                    setDraft((prev) => ({
                      ...prev,
                      background_image_file: file,
                      background_image_url: "",
                      background_image_file_reference_id: String(fileRef),
                    }));
                    toast.success("Background image uploaded");
                  } catch (err) {
                    toast.error(err?.response?.data?.detail || err?.message || "Upload failed");
                    setDraft((prev) => ({
                      ...prev,
                      background_image_file: null,
                      background_image_url: "",
                      background_image_file_reference_id: "",
                    }));
                  }
                }}
              />
            </TabsContent>
          </Tabs>
          <Label className="text-xs">Alt text (optional)</Label>
          <Input
            value={draft.background_alt_text || ""}
            onChange={(e) => setDraft((prev) => ({ ...prev, background_alt_text: e.target.value }))}
            placeholder="Describe the diagram"
          />
        </div>
      )}

      {draft.type &&
        draft.type !== "rag" &&
        !["line_break", "page_break", "text_block", "image_block"].includes(draft.type) &&
        (() => {
          const isNumericRag = ["number", "integer", "calculated"].includes(draft.type);
          const isDateRag = ["date", "datetime", "date_time"].includes(draft.type);
          const isOptionsRag = ["select", "radio", "multiselect", "dropdown"].includes(draft.type);
          const opts = draft.options || [];
          if (!isNumericRag && !isDateRag && !isOptionsRag) return null;
          const getRagForOption = (optionValue) => {
            const r = draft.rag_rules;
            if (Array.isArray(r?.red) && r.red.includes(optionValue)) return "red";
            if (Array.isArray(r?.amber) && r.amber.includes(optionValue)) return "amber";
            if (Array.isArray(r?.green) && r.green.includes(optionValue)) return "green";
            return "";
          };
          const setRagForOption = (optionValue, color) => {
            setDraft((prev) => {
              const r = { ...(prev.rag_rules || {}) };
              ["red", "amber", "green"].forEach((c) => {
                r[c] = Array.isArray(r[c]) ? r[c].filter((v) => v !== optionValue) : [];
              });
              if (color) r[color] = [...(r[color] || []), optionValue];
              return { ...prev, rag_rules: r };
            });
          };
          return (
            <div className="space-y-3 p-3 border rounded-md bg-muted/30">
              <Label className="font-medium">RAG display (optional)</Label>
              {isNumericRag && (
                <>
                  <p className="text-xs text-muted-foreground">Red ≤ max, Amber between min–max, Green ≥ min.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Red (max)</Label>
                      <Input
                        type="number"
                        value={draft.rag_rules?.red?.max ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            rag_rules: {
                              ...prev.rag_rules,
                              red: { ...(prev.rag_rules?.red || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Amber (min)</Label>
                      <Input
                        type="number"
                        value={draft.rag_rules?.amber?.min ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            rag_rules: {
                              ...prev.rag_rules,
                              amber: { ...(prev.rag_rules?.amber || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Amber (max)</Label>
                      <Input
                        type="number"
                        value={draft.rag_rules?.amber?.max ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            rag_rules: {
                              ...prev.rag_rules,
                              amber: { ...(prev.rag_rules?.amber || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Green (min)</Label>
                      <Input
                        type="number"
                        value={draft.rag_rules?.green?.min ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            rag_rules: {
                              ...prev.rag_rules,
                              green: { ...(prev.rag_rules?.green || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              {isDateRag && (
                <>
                  <p className="text-xs text-muted-foreground">Red before date, Green after date.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Red before (date)</Label>
                      <Input
                        type="text"
                        value={draft.rag_rules?.red?.before ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            rag_rules: {
                              ...prev.rag_rules,
                              red: { ...(prev.rag_rules?.red || {}), before: e.target.value || undefined },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Green after (date)</Label>
                      <Input
                        type="text"
                        value={draft.rag_rules?.green?.after ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            rag_rules: {
                              ...prev.rag_rules,
                              green: { ...(prev.rag_rules?.green || {}), after: e.target.value || undefined },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              {isOptionsRag && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {opts.length > 0 ? "Map each option to a RAG colour." : "Add options above first."}
                  </p>
                  {opts.length > 0 ? (
                    <div className="space-y-2">
                      {opts.map((opt, idx) => {
                        const optionValue = opt.value ?? opt.label ?? String(idx);
                        const ragVal = getRagForOption(optionValue);
                        return (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium min-w-[100px]">{opt.label ?? optionValue}</span>
                            <Select value={ragVal || "none"} onValueChange={(v) => setRagForOption(optionValue, v === "none" ? "" : v)}>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="RAG" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="red">Red</SelectItem>
                                <SelectItem value="amber">Amber</SelectItem>
                                <SelectItem value="green">Green</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No options yet.</p>
                  )}
                </>
              )}
            </div>
          );
        })()}

      {draft.type === "rag" && (
        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
          <Label className="font-medium">RAG thresholds (numeric)</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Red (max)</Label>
              <Input
                type="number"
                value={draft.rag_rules?.red?.max ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    rag_rules: {
                      ...prev.rag_rules,
                      red: { ...(prev.rag_rules?.red || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                    },
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Amber min / max</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={draft.rag_rules?.amber?.min ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      rag_rules: {
                        ...prev.rag_rules,
                        amber: { ...(prev.rag_rules?.amber || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                      },
                    }))
                  }
                />
                <Input
                  type="number"
                  value={draft.rag_rules?.amber?.max ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      rag_rules: {
                        ...prev.rag_rules,
                        amber: { ...(prev.rag_rules?.amber || {}), max: e.target.value === "" ? undefined : Number(e.target.value) },
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Green (min)</Label>
              <Input
                type="number"
                value={draft.rag_rules?.green?.min ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    rag_rules: {
                      ...prev.rag_rules,
                      green: { ...(prev.rag_rules?.green || {}), min: e.target.value === "" ? undefined : Number(e.target.value) },
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {draft.type === "calculated" && (
        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
          <Label className="font-medium">Formula</Label>
          <Select
            value={draft.formula?.type || "sum"}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, formula: { ...(prev.formula || {}), type: value } }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">Sum of fields</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
            </SelectContent>
          </Select>
          {(draft.formula?.type || "sum") === "sum" && (
            <div>
              <Label className="text-xs">Field IDs to sum (comma-separated)</Label>
              <Input
                value={(draft.formula?.field_ids || []).join(", ")}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    formula: {
                      ...prev.formula,
                      field_ids: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </div>
          )}
          {(draft.formula?.type || "sum") === "percentage" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Numerator field ID</Label>
                <Input
                  value={draft.formula?.numerator_field_id ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      formula: { ...prev.formula, numerator_field_id: e.target.value || undefined },
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Denominator field ID</Label>
                <Input
                  value={draft.formula?.denominator_field_id ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      formula: { ...prev.formula, denominator_field_id: e.target.value || undefined },
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Or: value field + tracker constant key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={draft.formula?.value_field_id ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        formula: { ...prev.formula, value_field_id: e.target.value || undefined },
                      }))
                    }
                  />
                  <Input
                    value={draft.formula?.target_constant_key ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        formula: { ...prev.formula, target_constant_key: e.target.value || undefined },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {draft.type === "repeatable_group" && (
        <p className="text-xs text-muted-foreground rounded-md border p-3 bg-muted/20">
          After creating this field, use <strong>Edit field</strong> in the list below to add column fields for each row.
        </p>
      )}
    </div>
  );
}

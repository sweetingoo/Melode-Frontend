"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableFieldSelect } from "@/components/ui/searchable-field-select";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_EXCLUDE = ["text_block", "image_block", "line_break", "page_break", "download_link"];

function getFieldIdentifier(field) {
  return field?.id ?? field?.name ?? field?.field_id ?? field?.field_name;
}

function getFieldType(field) {
  return String(field?.type || field?.field_type || "").toLowerCase();
}

function normalizeCountFieldType(field) {
  const type = getFieldType(field);
  if (type === "boolean" || type === "checkbox" || type === "boolean_with_description") return "boolean";
  if (["select", "dropdown", "radio", "radio_group", "table_radio"].includes(type)) return "single_choice";
  if (type === "multiselect") return "multi_choice";
  if (type === "number" || type === "integer") return "number";
  if (type === "date" || type === "datetime") return "date";
  return type || "text";
}

function isBooleanCountField(field) {
  return normalizeCountFieldType(field) === "boolean";
}

function ConditionalVisibilityValueControl({ depField, value, showWhen, onValueChange, compact, fullWidth }) {
  const needsValue = ["equals", "not_equals", "contains"].includes(showWhen || "");
  if (!needsValue) return null;
  const depType = (depField?.type || depField?.field_type || "").toLowerCase();
  const isBoolean = depType === "boolean" || depType === "checkbox" || depType === "boolean_with_description";
  const isSelectLike = ["select", "dropdown", "radio", "radio_group", "table_radio"].includes(depType);
  const isMultiselect = depType === "multiselect";
  const isNumber = depType === "number" || depType === "integer";
  const depOptions = depField ? (depField.field_options?.options || depField.options || []) : [];
  const opts = Array.isArray(depOptions) ? depOptions : [];
  const tw = compact ? "h-6 text-xs" : "h-8 text-xs";
  const wide = fullWidth ? "w-full" : compact ? "w-24 inline-flex" : "w-full max-w-md";
  if (isBoolean) {
    return (
      <Select value={value ?? ""} onValueChange={(v) => onValueChange(v || null)}>
        <SelectTrigger className={cn(tw, wide)}>
          <SelectValue placeholder="…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  if (isSelectLike || isMultiselect) {
    return (
      <Select value={value ?? ""} onValueChange={(v) => onValueChange(v || null)}>
        <SelectTrigger className={cn(tw, fullWidth ? "w-full" : "min-w-[7rem] max-w-[14rem] inline-flex")}>
          <SelectValue placeholder="Option…" />
        </SelectTrigger>
        <SelectContent>
          {opts.map((opt, i) => {
            const val = typeof opt === "object" && opt !== null ? (opt.value ?? opt.label ?? "") : opt;
            const label = typeof opt === "object" && opt !== null ? (opt.label ?? opt.value ?? String(val)) : String(opt);
            return (
              <SelectItem key={i} value={String(val)}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }
  if (isNumber) {
    return (
      <Input
        type="number"
        className={cn(tw, fullWidth ? "w-full" : "w-20 inline-flex")}
        value={value ?? ""}
        onChange={(e) => onValueChange(e.target.value !== "" ? e.target.value : null)}
        placeholder="Number"
      />
    );
  }
  return (
    <Input
      className={cn(tw, fullWidth ? "w-full" : "w-28 inline-flex")}
      value={value ?? ""}
      onChange={(e) => onValueChange(e.target.value || null)}
      placeholder="Value to match"
    />
  );
}

function snapshotClause(raw) {
  if (!raw || typeof raw !== "object")
    return { conditions: [{ depends_on_field: null, show_when: null, value: null }], conditions_operator: "or" };
  const { all_of: _ao, ...rest } = raw;
  return Object.keys(rest).length
    ? rest
    : { conditions: [{ depends_on_field: null, show_when: null, value: null }], conditions_operator: "or" };
}

function definesRule(raw) {
  if (!raw || typeof raw !== "object") return false;
  if (Array.isArray(raw.all_of) && raw.all_of.length > 0) return true;
  if (raw.count_of_fields != null) return true;
  if (raw.any_of != null) return true;
  if (Array.isArray(raw.conditions) && raw.conditions.length > 0) return true;
  return !!raw.depends_on_field;
}

/**
 * Admin editor for `conditional_visibility` on layout groups, rows, etc.
 * Supports all_of (AND of blocks), count_of_fields, any_of, conditions + conditions_operator (OR vs AND between rows).
 */
export function ConditionalVisibilityRuleEditor({
  value: cvProp,
  onChange,
  fields = [],
  excludeTypes = DEFAULT_EXCLUDE,
  compact = false,
  nested = false,
}) {
  const cv = cvProp && typeof cvProp === "object" ? cvProp : undefined;
  const setCv = (next) => onChange(next);

  const btn = compact ? "h-6 text-[10px] px-1" : "h-8 text-xs";
  const labelCls = compact ? "text-[10px]" : "text-xs";
  const conditions = Array.isArray(cv?.conditions)
    ? cv.conditions
    : cv?.count_of_fields
      ? [{ count_of_fields: cv.count_of_fields }]
      : cv?.any_of
        ? [{ any_of: cv.any_of }]
    : cv?.depends_on_field
      ? [{ depends_on_field: cv.depends_on_field, show_when: cv.show_when ?? null, value: cv.value ?? null }]
      : [];

  if (Array.isArray(cv?.all_of) && cv.all_of.length > 0) {
    return (
      <div className="space-y-3">
        <p className={cn("text-muted-foreground", labelCls)}>
          Every requirement below must be satisfied (logical <span className="font-medium text-foreground">AND</span>). Use{" "}
          <span className="font-medium text-foreground">Match any / Match all</span> inside a block for how rows combine there.
        </p>
        {cv.all_of.map((part, idx) => (
          <div key={idx} className="rounded-md border border-dashed border-muted-foreground/25 p-2 space-y-2 bg-muted/15">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn("font-medium text-muted-foreground", labelCls)}>Requirement {idx + 1}</span>
              {cv.all_of.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={btn}
                  onClick={() => {
                    const na = cv.all_of.filter((_, j) => j !== idx);
                    if (na.length === 1) setCv(na[0]);
                    else setCv({ ...cv, all_of: na });
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            <ConditionalVisibilityRuleEditor
              value={part}
              onChange={(next) => {
                if (next === undefined) {
                  const na = cv.all_of.filter((_, j) => j !== idx);
                  if (na.length === 0) setCv(undefined);
                  else if (na.length === 1) setCv(na[0]);
                  else setCv({ ...cv, all_of: na });
                  return;
                }
                const na = [...cv.all_of];
                na[idx] = next;
                setCv({ ...cv, all_of: na });
              }}
              fields={fields}
              excludeTypes={excludeTypes}
              compact={compact}
              nested
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={btn}
            onClick={() =>
              setCv({
                ...cv,
                all_of: [
                  ...cv.all_of,
                  { conditions: [{ depends_on_field: null, show_when: null, value: null }], conditions_operator: "or" },
                ],
              })
            }
          >
            <Plus className={cn("mr-1", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
            Add AND requirement
          </Button>
          {cv.all_of.length === 1 && (
            <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => setCv(cv.all_of[0])}>
              Use single rule (unwrap)
            </Button>
          )}
        </div>
      </div>
    );
  }

  const addConditionType = (rule) => {
    if (conditions.length > 0) {
      const nextRule = { ...rule, operator: cv?.conditions_operator === "and" ? "and" : "or" };
      setCv({
        conditions: [...conditions, nextRule],
        conditions_operator: cv?.conditions_operator === "and" ? "and" : "or",
      });
      return;
    }
    setCv(rule);
  };
  const startAnyOf = () => addConditionType({ any_of: { field_ids: [], show_when: "is_not_empty", value: null } });
  const startCountOf = () => {
    const countRule = { count_of_fields: { field_ids: [], min_count: 3, match: "is_not_empty" } };
    if (!definesRule(cv) || cv?.count_of_fields != null) {
      setCv(countRule);
      return;
    }
    if (conditions.length > 0) {
      addConditionType(countRule);
      return;
    }
    if (Array.isArray(cv?.all_of) && cv.all_of.length > 0) {
      setCv({ ...cv, all_of: [...cv.all_of, countRule] });
      return;
    }
    setCv({ all_of: [snapshotClause(cv), countRule] });
  };
  const branchIntoAllOf = () => {
    const first = snapshotClause(cv);
    setCv({
      all_of: [
        first,
        { conditions: [{ depends_on_field: null, show_when: null, value: null }], conditions_operator: "or" },
      ],
    });
  };

  const setConditions = (newList) => {
    if (newList.length === 0) {
      if (Array.isArray(cv?.all_of) && cv.all_of.length) {
        setCv({ all_of: cv.all_of });
        return;
      }
      setCv(undefined);
      return;
    }
    const op = cv?.conditions_operator === "and" ? "and" : "or";
    const next = { conditions: newList, conditions_operator: op };
    if (Array.isArray(cv?.all_of) && cv.all_of.length) next.all_of = cv.all_of;
    setCv(next);
  };

  const updateCondition = (cIdx, upd) => {
    const newList = conditions.map((c, i) => (i === cIdx ? { ...c, ...upd } : c));
    setConditions(newList);
  };

  const setJoin = (join) => {
    if (conditions.length === 0) return;
    const next = {
      conditions,
      conditions_operator: join === "and" ? "and" : "or",
    };
    if (Array.isArray(cv?.all_of) && cv.all_of.length) next.all_of = cv.all_of;
    setCv(next);
  };
  const addConditionRow = () => {
    const existing = conditions.length > 0 ? conditions : [];
    const next = { depends_on_field: null, show_when: null, value: null };
    if (existing.length > 0) next.operator = cv?.conditions_operator === "and" ? "and" : "or";
    setConditions([...existing, next]);
  };
  const conditionJoin = (cond) => cond?.operator || cond?.condition_operator || (cv?.conditions_operator === "and" ? "and" : "or");
  const setConditionJoin = (cIdx, operator) => updateCondition(cIdx, { operator });
  const renderConditionConnector = (cond, cIdx) => {
    if (cIdx === 0) return null;
    return (
      <div className="flex items-center gap-2 pl-2">
        <div className="h-px flex-1 bg-border" />
        <Select value={conditionJoin(cond)} onValueChange={(v) => setConditionJoin(cIdx, v)}>
          <SelectTrigger className={cn(compact ? "h-6 text-[10px] w-24" : "h-8 text-xs w-28")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className={cn("text-muted-foreground", labelCls)}>
        Each condition is its own block. From the second block onward, choose whether it joins the previous block with{" "}
        <span className="font-medium text-foreground">AND</span> or <span className="font-medium text-foreground">OR</span>.
      </p>
      {conditions.length === 0 ? (
        <div className="space-y-2">
          {compact && (
            <div className="flex flex-wrap items-center gap-1">
              <SearchableFieldSelect
                fields={fields}
                value={cv?.depends_on_field || "__none__"}
                onValueChange={(v) => setCv(v && v !== "__none__" ? { depends_on_field: v, show_when: null, value: null } : undefined)}
                placeholder="Always show"
                noneOption
                noneLabel="Always show"
                excludeTypes={excludeTypes}
                compact
                className="h-6 text-[10px] w-36 inline-flex"
              />
            </div>
          )}
          <div className="space-y-1">
            <div className={cn("font-medium text-muted-foreground", labelCls)}>Add condition</div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className={btn} onClick={addConditionRow}>
                <Plus className={cn("mr-1", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
                {compact ? "Field" : "Single field"}
              </Button>
              <Button type="button" variant="secondary" size="sm" className={btn} onClick={startAnyOf}>
                {compact ? "Any of N" : "Any of N fields"}
              </Button>
              <Button type="button" variant="secondary" size="sm" className={btn} onClick={startCountOf}>
                {compact ? "At least N" : "At least N selected"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        conditions.map((cond, cIdx) => {
          if (cond?.any_of != null) {
            const anyOf = cond.any_of || {};
            const fieldIds = Array.isArray(anyOf.field_ids) ? anyOf.field_ids : [];
            const firstDep = fields.find((f) => String(f.id || f.name || f.field_id) === String(fieldIds[0]));
            const needsValue = ["equals", "not_equals", "contains"].includes(anyOf.show_when || "");
            const updateAnyOfCondition = (nextAnyOf) => updateCondition(cIdx, { any_of: nextAnyOf });
            return (
              <React.Fragment key={cIdx}>
                {renderConditionConnector(cond, cIdx)}
                <div className="flex flex-wrap items-center gap-2 rounded border p-2 bg-muted/30">
                  <div className="w-full flex flex-wrap items-center justify-between gap-2">
                    <span className={cn("font-medium text-muted-foreground", labelCls)}>Condition {cIdx + 1}: Any of N</span>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {fieldIds.map((fid) => {
                      const f = fields.find((x) => String(x.id || x.name || x.field_id) === String(fid));
                      return (
                        <Badge key={fid} variant="secondary" className={cn("text-xs", compact && "text-[9px] h-4")}>
                          {f?.label || f?.name || fid}
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive"
                            onClick={() =>
                              updateAnyOfCondition({
                                ...anyOf,
                                field_ids: fieldIds.filter((id) => String(id) !== String(fid)),
                              })
                            }
                          >
                            <X className={compact ? "h-2 w-2" : "h-3 w-3"} />
                          </button>
                        </Badge>
                      );
                    })}
                    <SearchableFieldSelect
                      fields={fields}
                      value=""
                      onValueChange={(val) => {
                        if (val && !fieldIds.map(String).includes(String(val))) {
                          updateAnyOfCondition({
                            ...anyOf,
                            field_ids: [...fieldIds, val],
                            show_when: anyOf.show_when || "is_not_empty",
                            value: anyOf.value ?? null,
                          });
                        }
                      }}
                      placeholder="+ Add field"
                      excludeTypes={excludeTypes}
                      compact
                      className={cn(compact ? "h-6 text-[10px] w-32" : "w-40 h-8 text-xs")}
                    />
                  </div>
                  <Select
                    value={anyOf.show_when || ""}
                    onValueChange={(v) =>
                      updateAnyOfCondition({
                        ...anyOf,
                        field_ids: fieldIds,
                        show_when: v || null,
                        value: ["equals", "not_equals", "contains"].includes(v) ? anyOf.value : null,
                      })
                    }
                  >
                    <SelectTrigger className={cn(compact ? "h-6 text-[10px] w-24" : "h-8 text-xs w-28")}>
                      <SelectValue placeholder="Rule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="is_empty">Is empty</SelectItem>
                      <SelectItem value="is_not_empty">Not empty</SelectItem>
                    </SelectContent>
                  </Select>
                  {anyOf.show_when && needsValue && (
                    <ConditionalVisibilityValueControl
                      depField={firstDep}
                      value={anyOf.value}
                      showWhen={anyOf.show_when}
                      onValueChange={(next) => updateAnyOfCondition({ ...anyOf, field_ids: fieldIds, value: next })}
                      compact={compact}
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("shrink-0 text-destructive", compact ? "h-5 w-5" : "h-8 w-8")}
                    onClick={() => setConditions(conditions.filter((_, i) => i !== cIdx))}
                    title="Remove condition"
                  >
                    {compact ? <X className="h-2.5 w-2.5" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </React.Fragment>
            );
          }
          if (cond?.count_of_fields != null) {
            const c = cond.count_of_fields || {};
            const fieldIds = Array.isArray(c.field_ids) ? c.field_ids : [];
            const match = c.match || "is_not_empty";
            const selectedFields = fieldIds
              .map((fid) => fields.find((x) => String(getFieldIdentifier(x)) === String(fid)))
              .filter(Boolean);
            const selectedType = selectedFields[0] ? normalizeCountFieldType(selectedFields[0]) : null;
            const hasInvalidCheckedField = match === "is_true" && selectedFields.some((field) => !isBooleanCountField(field));
            const countCompatibleFields = fields.filter((field) => {
              if (match === "is_true" && !isBooleanCountField(field)) return false;
              if (selectedType && normalizeCountFieldType(field) !== selectedType) return false;
              return true;
            });
            const updateCountCondition = (nextCount) => {
              updateCondition(cIdx, { count_of_fields: nextCount });
            };
            return (
              <React.Fragment key={cIdx}>
              {renderConditionConnector(cond, cIdx)}
              <div className="flex flex-wrap items-center gap-2 rounded border p-2 bg-muted/30">
                <div className="w-full flex flex-wrap items-center justify-between gap-2">
                  <span className={cn("font-medium text-muted-foreground", labelCls)}>Condition {cIdx + 1}: At least N</span>
                </div>
                <span className={cn("font-medium text-muted-foreground", labelCls)}>At least</span>
                <Input
                  className={cn(compact ? "h-6 w-12 text-[10px] px-1" : "h-8 w-16 text-xs")}
                  type="number"
                  min={0}
                  value={c.min_count == null || c.min_count === "" ? "" : String(c.min_count)}
                  onChange={(e) => {
                    const n = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                    updateCountCondition({ ...c, min_count: n, field_ids: fieldIds });
                  }}
                  placeholder="N"
                />
                <Select
                  value={c.match || "is_not_empty"}
                  onValueChange={(v) => updateCountCondition({ ...c, field_ids: fieldIds, match: v || "is_not_empty" })}
                >
                  <SelectTrigger className={cn(compact ? "h-6 text-[10px] w-32" : "h-8 text-xs w-44")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="is_not_empty">{compact ? "Not empty" : "Not empty (filled in)"}</SelectItem>
                    <SelectItem value="is_true">{compact ? "Checked" : "Checked / Yes / true"}</SelectItem>
                    <SelectItem value="is_empty">Is empty</SelectItem>
                  </SelectContent>
                </Select>
                {selectedType && (
                  <span className={cn("text-muted-foreground", labelCls)}>
                    type: {selectedType.replace("_", " ")}
                  </span>
                )}
                {hasInvalidCheckedField && (
                  <span className={cn("text-destructive", labelCls)}>
                    Checked only works with checkbox/boolean fields.
                  </span>
                )}
                <div className="w-full space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cn("font-medium text-muted-foreground", labelCls)}>
                      Selected fields ({fieldIds.length})
                    </span>
                    {selectedType && (
                      <span className={cn("text-muted-foreground", labelCls)}>
                        Same type only: {selectedType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <div className="rounded-md border bg-background/50 p-2">
                    {fieldIds.length > 0 ? (
                      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {fieldIds.map((fid) => {
                          const f = fields.find((x) => String(x.id || x.name || x.field_id) === String(fid));
                          return (
                            <div
                              key={fid}
                              className={cn(
                                "flex min-w-0 items-center justify-between gap-2 rounded border bg-muted/40 px-2 py-1",
                                compact && "px-1.5 py-0.5"
                              )}
                            >
                              <span className={cn("truncate", compact ? "text-[10px]" : "text-xs")}>
                                {f?.label || f?.name || fid}
                              </span>
                              <button
                                type="button"
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  updateCountCondition({
                                    ...c,
                                    field_ids: fieldIds.filter((id) => String(id) !== String(fid)),
                                    match: c.match || "is_not_empty",
                                  })
                                }
                                title="Remove field"
                              >
                                <X className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={cn("text-muted-foreground", labelCls)}>No fields selected yet.</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-muted-foreground", labelCls)}>Add field</span>
                    <SearchableFieldSelect
                      fields={countCompatibleFields}
                      value=""
                      onValueChange={(val) => {
                        if (val && !fieldIds.map(String).includes(String(val))) {
                          updateCountCondition({
                            ...c,
                            field_ids: [...fieldIds, val],
                            min_count: c.min_count == null || c.min_count === "" ? 1 : c.min_count,
                            match: c.match || "is_not_empty",
                          });
                        }
                      }}
                      placeholder="+ Add field"
                      excludeTypes={excludeTypes}
                      compact
                      className={cn(compact ? "w-32 h-6 text-[10px]" : "w-48 h-8 text-xs")}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("shrink-0 text-destructive", compact ? "h-5 w-5" : "h-8 w-8")}
                  onClick={() => setConditions(conditions.filter((_, i) => i !== cIdx))}
                  title="Remove condition"
                >
                  {compact ? <X className="h-2.5 w-2.5" /> : <Trash2 className="h-3 w-3" />}
                </Button>
              </div>
              </React.Fragment>
            );
          }
          const depField = fields.find((f) => String(f.id || f.name || f.field_id) === String(cond.depends_on_field));
          return (
            <React.Fragment key={cIdx}>
            {renderConditionConnector(cond, cIdx)}
            <div className="flex flex-wrap items-center gap-2 rounded border p-2 bg-muted/30">
              <div className="w-full flex flex-wrap items-center justify-between gap-2">
                <span className={cn("font-medium text-muted-foreground", labelCls)}>Condition {cIdx + 1}: Single field</span>
              </div>
              <SearchableFieldSelect
                fields={fields}
                value={cond.depends_on_field || "__none__"}
                onValueChange={(v) => updateCondition(cIdx, { depends_on_field: v && v !== "__none__" ? v : null, show_when: null, value: null })}
                placeholder="Select field"
                noneOption
                noneLabel="Select field"
                excludeTypes={excludeTypes}
                compact
                className={cn(compact ? "h-6 text-[10px] w-32" : "h-8 text-xs w-44")}
              />
              {cond.depends_on_field && (
                <>
                  <Select
                    value={cond.show_when || ""}
                    onValueChange={(v) =>
                      updateCondition(cIdx, {
                        show_when: v || null,
                        value: ["equals", "not_equals", "contains"].includes(v) ? cond.value : null,
                      })
                    }
                  >
                    <SelectTrigger className={cn(compact ? "h-6 text-[10px] w-20" : "h-8 text-xs w-24")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {compact ? (
                        <>
                          <SelectItem value="equals">=</SelectItem>
                          <SelectItem value="not_equals">!=</SelectItem>
                          <SelectItem value="contains">∈</SelectItem>
                          <SelectItem value="is_empty">empty</SelectItem>
                          <SelectItem value="is_not_empty">not empty</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="is_empty">Is empty</SelectItem>
                          <SelectItem value="is_not_empty">Not empty</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <ConditionalVisibilityValueControl
                    depField={depField}
                    value={cond.value}
                    showWhen={cond.show_when}
                    onValueChange={(next) => updateCondition(cIdx, { value: next })}
                    compact={compact}
                  />
                </>
              )}
              <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 text-destructive", compact ? "h-5 w-5" : "h-8 w-8")} onClick={() => setConditions(conditions.filter((_, i) => i !== cIdx))} title="Remove condition">
                {compact ? <X className="h-2.5 w-2.5" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </div>
            </React.Fragment>
          );
        })
      )}
      {conditions.length > 0 && (
        <div className="space-y-1">
          <div className={cn("font-medium text-muted-foreground", labelCls)}>Add condition</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className={btn} onClick={addConditionRow}>
              <Plus className={cn("mr-1", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
              {compact ? "Field" : "Single field"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className={btn} onClick={startAnyOf}>
              {compact ? "Any of N" : "Any of N fields"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className={btn} onClick={startCountOf}>
              {compact ? "At least N" : "At least N selected"}
            </Button>
            {!nested && (
              <Button type="button" variant="secondary" size="sm" className={btn} onClick={branchIntoAllOf}>
                Also require (AND)…
              </Button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

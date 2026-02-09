"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Plus, Info, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SEARCH_HELP = {
  title: "Search & formulas",
  items: [
    { ex: "75", desc: "Search for text (e.g. 75) in entries" },
    { ex: "risk_score=45", desc: "Filter by field value (column = value)" },
    { ex: "filter: status = open", desc: "Filter by field (formula style)" },
    { ex: "show sum risk_score", desc: "Show sum/avg/count of a column (backend totals)" },
    { ex: "make risk red if risk_score > 75", desc: "Highlight a column by color when another column matches" },
  ],
};

const FORMULA_KEYWORDS = [
  { value: "filter:", label: "filter: — Filter by field (e.g. filter: status = open)", type: "formula" },
  { value: "highlight:", label: "highlight: — Color column when condition (e.g. highlight: revenue > 1000)", type: "formula" },
  { value: "make ", label: "make … red/green if … — e.g. make risk red if risk_value > 75", type: "formula" },
  { value: "show ", label: "show sum/average/count … — e.g. show sum risk_value (backend totals)", type: "formula" },
];
const OPERATORS = [
  { value: "=", label: "= equals" },
  { value: ">", label: "> greater than" },
  { value: "<", label: "< less than" },
  { value: ">=", label: ">= greater or equal" },
  { value: "<=", label: "<= less or equal" },
  { value: "contains", label: "contains" },
];
const HIGHLIGHT_COLORS = [
  { value: "red", label: "red" },
  { value: "green", label: "green" },
  { value: "yellow", label: "yellow" },
  { value: "orange", label: "orange" },
  { value: "blue", label: "blue" },
];

const AGGREGATE_TYPES = [
  { value: "sum", label: "sum" },
  { value: "avg", label: "average" },
  { value: "count", label: "count" },
  { value: "min", label: "min" },
  { value: "max", label: "max" },
];

function parseQuery(input) {
  const s = (input || "").trim();
  // Match >= and <= before > and < so ">=" isn't captured as ">"
  const match = s.match(/^\s*(filter:|highlight:)\s*([\w_-]+)\s*(=|>=|<=|>|<|contains)?\s*(.*)$/i);
  if (!match) return null;
  const [, formula, fieldId, op, valuePart] = match;
  const value = (valuePart || "").trim();
  return { formula: formula?.toLowerCase(), fieldId, operator: (op && op.trim()) || "=", value };
}

/** e.g. "risk_value=75" or "risk_value = 75" → filter by field */
function parseSimpleFilter(input) {
  const s = (input || "").trim();
  const match = s.match(/^([\w_-]+)\s*=\s*(.+)$/);
  if (!match) return null;
  return { formula: "filter", fieldId: match[1], value: match[2].trim() };
}

/** e.g. "make risk red if risk_value > 75" → highlight rule with display column, color, condition column */
function parseNaturalHighlight(input) {
  const s = (input || "").trim();
  const match = s.match(/^\s*make\s+([\w_-]+)\s+(red|green|yellow|orange|blue)\s+if\s+([\w_-]+)\s+(>|<|>=|<=|=)\s+(.+)$/i);
  if (!match) return null;
  const [, displayCol, color, conditionCol, op, valuePart] = match;
  const value = valuePart.trim();
  return {
    formula: "highlight",
    displayFieldId: displayCol,
    conditionFieldId: conditionCol,
    operator: op,
    value,
    color: (color || "green").toLowerCase(),
  };
}

/** e.g. "show sum risk_value", "show average revenue" → display aggregate (computed on backend over all matching entries) */
function parseShowAggregate(input) {
  const s = (input || "").trim();
  const match = s.match(/^\s*show\s+(sum|average|avg|count|min|max)\s+([\w_-]+)\s*$/i);
  if (!match) return null;
  const [, aggWord, fieldId] = match;
  const type = (aggWord || "sum").toLowerCase() === "average" ? "avg" : (aggWord || "sum").toLowerCase();
  if (!["sum", "avg", "count", "min", "max"].includes(type)) return null;
  return { formula: "aggregate", fieldId, type };
}

/**
 * Query bar with formula suggestions: filter:field=value, highlight:field>value.
 * Suggests fields (from tracker), operators, and values (from backend).
 */
export function TrackerQuerySearchBar({
  searchValue,
  onSearchChange,
  onSearchCommit,
  fields = [],
  formId,
  trackerSlug,
  fetchFieldSuggestions,
  onApplyFieldFilter,
  onApplyHighlightRule,
  onApplyAggregateDisplay,
  searchPlaceholder = "Search or type a formula…",
  showInfoButton = true,
  showFilters = false,
  isFiltersOpen = false,
  onToggleFilters,
  showCreateButton = false,
  onCreateClick,
  createButtonText = "Create",
  createButtonIcon: CreateIcon = Plus,
  className,
  inputRef: externalInputRef,
}) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [valueSuggestions, setValueSuggestions] = useState([]);
  const [loadingValues, setLoadingValues] = useState(false);
  // Ribbon builder: each step is reserved (chip) then we ask for the next (dropdown/input)
  const [filterBuilder, setFilterBuilder] = useState({
    formula: null,
    fieldId: null,
    fieldLabel: null,
    operator: null,
    value: null,
  });
  const [showBuilder, setShowBuilder] = useState({
    aggregateType: null,
    fieldId: null,
    fieldLabel: null,
  });
  const [makeBuilder, setMakeBuilder] = useState({
    displayFieldId: null,
    displayFieldLabel: null,
    color: null,
    conditionFieldId: null,
    conditionFieldLabel: null,
    operator: null,
    value: null,
  });
  const [ribbonValueInput, setRibbonValueInput] = useState("");
  const [ribbonDropdownOpen, setRibbonDropdownOpen] = useState(null); // "field" | "operator" | "value" | "show_agg" | "show_field" | "make_display" | "make_color" | "make_if_field" | "make_op" | "make_value" | null
  const localInputRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = externalInputRef || localInputRef;

  // When user types a reserved keyword + space (or "filter:" / "highlight:"), convert to tag and open builder.
  // All four options (show, make, filter:, highlight:) become a tag and then ask for the next parameter.
  const tryReserveKeyword = useCallback(
    (newValue) => {
      const v = newValue || "";
      const trimmed = v.trim();
      // "show" + space → tag "show" and ask for aggregate type
      if (trimmed === "show" && v.endsWith(" ")) {
        setShowBuilder({ aggregateType: null, fieldId: null, fieldLabel: null });
        setRibbonDropdownOpen("show_agg");
        onSearchChange("");
        return true;
      }
      // "make" + space → tag "make" and ask for display column
      if (trimmed === "make" && v.endsWith(" ")) {
        setMakeBuilder({
          displayFieldId: null,
          displayFieldLabel: null,
          color: null,
          conditionFieldId: null,
          conditionFieldLabel: null,
          operator: null,
          value: null,
        });
        setRibbonDropdownOpen("make_display");
        onSearchChange("");
        return true;
      }
      // "filter" + space OR "filter:" or "filter: " → tag "filter:" and ask for field
      if (
        (trimmed === "filter" && v.endsWith(" ")) ||
        trimmed === "filter:" ||
        (trimmed === "filter" && v.endsWith(":"))
      ) {
        setFilterBuilder({ formula: "filter:", fieldId: null, fieldLabel: null, operator: null, value: null });
        setRibbonValueInput("");
        setRibbonDropdownOpen("field");
        onSearchChange("");
        return true;
      }
      // "highlight" + space OR "highlight:" or "highlight: " → tag "highlight:" and ask for field
      if (
        (trimmed === "highlight" && v.endsWith(" ")) ||
        trimmed === "highlight:" ||
        (trimmed === "highlight" && v.endsWith(":"))
      ) {
        setFilterBuilder({ formula: "highlight:", fieldId: null, fieldLabel: null, operator: null, value: null });
        setRibbonValueInput("");
        setRibbonDropdownOpen("field");
        onSearchChange("");
        return true;
      }
      // "filter: <fieldName> " or "highlight: <fieldName> " (space after field) → tag formula + field, show operator step
      const formulaFieldMatch = trimmed.match(/^(filter:|highlight:)\s+([\w_-]+)\s*$/i);
      if (
        formulaFieldMatch &&
        v.endsWith(" ") &&
        !trimmed.match(/^(filter:|highlight:)\s+[\w_-]+\s*(>=|<=|=|>|<|contains)\s/)
      ) {
        const formulaType = formulaFieldMatch[1].toLowerCase();
        const fieldId = formulaFieldMatch[2];
        const fieldLabel =
          (fields || []).find(
            (f) => (f.id || f.field_id || f.name || "").toString().toLowerCase() === fieldId.toLowerCase()
          )?.label ||
          (fields || []).find(
            (f) => (f.label || f.field_label || f.name || "").toString().toLowerCase() === fieldId.toLowerCase()
          )?.label ||
          fieldId;
        setFilterBuilder({
          formula: formulaType,
          fieldId,
          fieldLabel: fieldLabel || fieldId,
          operator: null,
          value: null,
        });
        setRibbonValueInput("");
        setRibbonDropdownOpen("operator");
        onSearchChange("");
        return true;
      }
      return false;
    },
    [onSearchChange, fields]
  );

  const s = (searchValue || "").trim();
  const formulaMatch = s.match(/^\s*(filter:|highlight:)?\s*([\w_-]*)\s*(=|>=|<=|>|<|contains)?\s*(.*)$/i);
  const formula = formulaMatch?.[1]?.toLowerCase() || "";
  let fieldPart = (formulaMatch?.[2] || "").trim();
  // When user selects a field we add a space ("filter: risk_score "); regex [\w_-]* can match "" before that space. Derive field from rest of string.
  if (formula && !fieldPart) {
    const afterFormula = s.replace(/^\s*(?:filter:|highlight:)\s*/i, "").trim();
    const firstWord = afterFormula.match(/^([\w_-]+)/)?.[1];
    if (firstWord && !/^(>=|<=|=|>|<|contains)$/i.test(firstWord)) fieldPart = firstWord;
  }
  const opPart = (formulaMatch?.[3] || "").trim();
  const valuePrefix = (formulaMatch?.[4] || "").trim();

  const fieldNames = fields.map((f) => ({
    id: f.id || f.field_id || f.name,
    label: f.label || f.field_label || f.name || f.id || f.field_id,
  }));

  const matchedFields = fieldPart
    ? fieldNames.filter((f) => f.id.toLowerCase().includes(fieldPart.toLowerCase()) || f.label.toLowerCase().includes(fieldPart.toLowerCase()))
    : fieldNames;

  const matchedFormulas = !formula
    ? FORMULA_KEYWORDS.filter((k) => k.value.toLowerCase().startsWith(s.toLowerCase()) || "filter".startsWith(s.toLowerCase()) || "highlight".startsWith(s.toLowerCase()))
    : [];

  // Show operators only when field is complete (exact match); otherwise show field suggestions so user can pick/complete field
  const fieldPartIsExactMatch = fieldPart && matchedFields.some((f) => (f.id || "").toString().toLowerCase() === fieldPart.toLowerCase());
  const showOperators = formula && fieldPart && !opPart && fieldPartIsExactMatch;
  const needValues = formula && fieldPart && opPart;
  const currentFieldId = showOperators || needValues ? (matchedFields[0]?.id || fieldPart) : null;

  useEffect(() => {
    if (!needValues || !currentFieldId || !fetchFieldSuggestions) {
      setValueSuggestions([]);
      setLoadingValues(false);
      return;
    }
    let cancelled = false;
    setLoadingValues(true);
    fetchFieldSuggestions({ form_id: formId, tracker_slug: trackerSlug, field_id: currentFieldId, q: valuePrefix || undefined, limit: 15 })
      .then((list) => {
        if (!cancelled) setValueSuggestions(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setValueSuggestions([]); })
      .finally(() => { if (!cancelled) setLoadingValues(false); });
    return () => { cancelled = true; };
  }, [needValues, currentFieldId, valuePrefix, formId, trackerSlug, fetchFieldSuggestions]);

  // Ribbon builder: fetch value suggestions when we have field + operator (filter/highlight or make condition)
  const [ribbonLoadingValues, setRibbonLoadingValues] = useState(false);
  const ribbonNeedValues =
    (filterBuilder.formula && filterBuilder.fieldId && filterBuilder.operator) ||
    (makeBuilder.conditionFieldId && makeBuilder.operator);
  const ribbonValueFieldId = filterBuilder.fieldId || makeBuilder.conditionFieldId;
  useEffect(() => {
    if (!ribbonNeedValues || !ribbonValueFieldId || !fetchFieldSuggestions) {
      setRibbonLoadingValues(false);
      return;
    }
    let cancelled = false;
    setRibbonLoadingValues(true);
    fetchFieldSuggestions({
      form_id: formId,
      tracker_slug: trackerSlug,
      field_id: ribbonValueFieldId,
      q: ribbonValueInput.trim() || undefined,
      limit: 15,
    })
      .then((list) => {
        if (!cancelled) setValueSuggestions(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setValueSuggestions([]); })
      .finally(() => { if (!cancelled) setRibbonLoadingValues(false); });
    return () => { cancelled = true; };
  }, [ribbonNeedValues, ribbonValueFieldId, ribbonValueInput, formId, trackerSlug, fetchFieldSuggestions]);

  const suggestions = useCallback(() => {
    const s = (searchValue || "").trim();
    if (needValues) {
      return valueSuggestions.map((v) => ({ type: "value", value: v, label: String(v) }));
    }
    if (showOperators) {
      return OPERATORS.map((o) => ({ type: "operator", value: o.value, label: o.label }));
    }
    if (formula && !fieldPart) {
      return matchedFields.slice(0, 12).map((f) => ({ type: "field", value: f.id, label: f.label }));
    }
    if (/^show\s+(sum|average|avg|count|min|max)\s+[\w_-]*$/i.test(s) && !parseShowAggregate(searchValue)) {
      return matchedFields.slice(0, 12).map((f) => ({ type: "aggregateField", value: `show ${(s.match(/show\s+(sum|average|avg|count|min|max)/i)?.[1] || "sum").toLowerCase()} ${f.id}`, label: `${f.label} (${f.id})` }));
    }
    if (/^make\s+[\w_-]*\s*$/i.test(s)) {
      const afterMake = s.replace(/^\s*make\s+/i, "").trim();
      const forMake = afterMake
        ? fieldNames.filter((f) => f.id.toLowerCase().includes(afterMake.toLowerCase()) || (f.label || "").toLowerCase().includes(afterMake.toLowerCase()))
        : fieldNames;
      return forMake.slice(0, 12).map((f) => ({ type: "makeDisplayField", value: f.id, label: f.label }));
    }
    if (/^make\s+[\w_-]+\s+[\w_-]*\s*$/i.test(s) && !parseNaturalHighlight(searchValue)) {
      const afterColor = s.replace(/^\s*make\s+[\w_-]+\s+/i, "").trim();
      const colorsForMake = afterColor
        ? HIGHLIGHT_COLORS.filter((c) => c.value.toLowerCase().startsWith(afterColor.toLowerCase()))
        : HIGHLIGHT_COLORS;
      return colorsForMake.map((c) => ({ type: "makeColor", value: c.value, label: c.label }));
    }
    if (/^make\s+[\w_-]+\s+(red|green|yellow|orange|blue)\s*$/i.test(s)) {
      return [{ type: "makeIf", value: "if", label: "if (then pick condition column)" }];
    }
    if (/^make\s+[\w_-]+\s+(red|green|yellow|orange|blue)\s+if\s+[\w_-]+\s*$/i.test(s) && !parseNaturalHighlight(searchValue)) {
      return OPERATORS.map((o) => ({ type: "makeOperator", value: o.value, label: o.label }));
    }
    if (/^make\s+[\w_-]+\s+(red|green|yellow|orange|blue)\s+if\s+[\w_-]*\s*$/i.test(s) && !parseNaturalHighlight(searchValue)) {
      const afterIf = s.replace(/^\s*make\s+[\w_-]+\s+(red|green|yellow|orange|blue)\s+if\s+/i, "").trim();
      const forCondition = afterIf
        ? fieldNames.filter((f) => f.id.toLowerCase().includes(afterIf.toLowerCase()) || (f.label || "").toLowerCase().includes(afterIf.toLowerCase()))
        : fieldNames;
      return forCondition.slice(0, 12).map((f) => ({ type: "makeConditionField", value: f.id, label: f.label }));
    }
    if (!formula) {
      if (/^\d+$/.test(s) || /^[\w_-]+=\s*.+/.test(s)) {
        return [];
      }
      const formulasAndFields = [...matchedFormulas, ...matchedFields.slice(0, 10)];
      return formulasAndFields.map((x) =>
        x.value ? { type: x.type || "field", value: x.value, label: x.label ?? x.value } : { type: "field", value: x.id, label: x.label }
      );
    }
    return matchedFields.slice(0, 12).map((f) => ({ type: "field", value: f.id, label: f.label }));
  }, [needValues, showOperators, formula, fieldPart, matchedFormulas, matchedFields, valueSuggestions, searchValue, fieldNames]);

  const list = suggestions();
  const hasInput = ((searchValue || "").trim().length > 0);
  const showDropdown = open && (needValues && loadingValues ? true : hasInput && list.length > 0);

  const applySuggestion = useCallback(
    (item) => {
      if (item.type === "value") {
        const parsed = parseQuery(searchValue);
        // Use opPart from current input when parsed operator is missing (e.g. regex edge case)
        const effectiveOp = parsed?.operator && parsed.operator !== "=" ? parsed.operator : (opPart || "=");
        if (parsed?.formula === "filter:" && onApplyFieldFilter) {
          onApplyFieldFilter(parsed.fieldId, item.value, effectiveOp);
          onSearchChange("");
        } else if (parsed?.formula === "highlight:" && onApplyHighlightRule) {
          onApplyHighlightRule({ fieldId: parsed.fieldId, operator: effectiveOp, value: item.value });
          onSearchChange("");
        }
        setOpen(false);
        return;
      }
      if (item.type === "operator") {
        const base = `${formula} ${currentFieldId || fieldPart}`.trim();
        onSearchChange(`${base} ${item.value} `);
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "field") {
        // Whenever user selects a field from dropdown, open ribbon (filter: + field + operator step) so next options show immediately
        if (onApplyFieldFilter || onApplyHighlightRule) {
          const sTrim = (searchValue || "").trim();
          const formulaType =
            formula === "highlight:" || sTrim.toLowerCase().startsWith("highlight:") ? "highlight:" : "filter:";
          setFilterBuilder({
            formula: formulaType,
            fieldId: item.value,
            fieldLabel: item.label,
            operator: null,
            value: null,
          });
          onSearchChange("");
          setRibbonDropdownOpen("operator");
          setOpen(false);
          return;
        }
        if (!formula) {
          onSearchChange(`filter: ${item.value} `);
        } else {
          onSearchChange(`${formula} ${item.value} `);
        }
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "makeDisplayField") {
        onSearchChange(`make ${item.value} `);
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "makeColor") {
        const s = (searchValue || "").trim();
        const displayCol = s.replace(/^\s*make\s+/i, "").replace(/\s+[\w_-]*\s*$/, "").trim();
        onSearchChange(`make ${displayCol} ${item.value} `);
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "makeIf") {
        const s = (searchValue || "").trim();
        const m = s.match(/^\s*make\s+([\w_-]+)\s+(red|green|yellow|orange|blue)\s*$/i);
        if (m) onSearchChange(`make ${m[1]} ${m[2]} if `);
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "makeConditionField") {
        const s = (searchValue || "").trim();
        const prefix = s.match(/^(\s*make\s+[\w_-]+\s+(?:red|green|yellow|orange|blue)\s+if)\s+[\w_-]*\s*$/i)?.[1] || "make";
        onSearchChange(`${prefix.trim()} ${item.value} `);
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "makeOperator") {
        const s = (searchValue || "").trim();
        const prefix = s.match(/^(\s*make\s+[\w_-]+\s+(?:red|green|yellow|orange|blue)\s+if\s+[\w_-]+)\s*$/i)?.[1] || "make";
        onSearchChange(`${prefix.trim()} ${item.value} `);
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "formula") {
        const formulaValue = (item.value || "").trim().toLowerCase();
        if (formulaValue === "filter:" && (onApplyFieldFilter || onApplyHighlightRule)) {
          setFilterBuilder({ formula: "filter:", fieldId: null, fieldLabel: null, operator: null, value: null });
          onSearchChange("");
          setRibbonValueInput("");
          setRibbonDropdownOpen("field");
          setOpen(false);
          return;
        }
        if (formulaValue === "highlight:" && (onApplyFieldFilter || onApplyHighlightRule)) {
          setFilterBuilder({ formula: "highlight:", fieldId: null, fieldLabel: null, operator: null, value: null });
          onSearchChange("");
          setRibbonValueInput("");
          setRibbonDropdownOpen("field");
          setOpen(false);
          return;
        }
        if ((formulaValue === "show" || formulaValue === "show ") && onApplyAggregateDisplay) {
          setShowBuilder({ aggregateType: null, fieldId: null, fieldLabel: null });
          onSearchChange("");
          setRibbonDropdownOpen("show_agg");
          setOpen(false);
          return;
        }
        if ((formulaValue === "make" || formulaValue === "make ") && onApplyHighlightRule) {
          setMakeBuilder({
            displayFieldId: null,
            displayFieldLabel: null,
            color: null,
            conditionFieldId: null,
            conditionFieldLabel: null,
            operator: null,
            value: null,
          });
          onSearchChange("");
          setRibbonDropdownOpen("make_display");
          setOpen(false);
          return;
        }
        onSearchChange(`${item.value} `);
        inputRef.current?.focus();
        setOpen(false);
        return;
      }
      if (item.type === "aggregateField" && onApplyAggregateDisplay) {
        const agg = parseShowAggregate(item.value);
        if (agg) {
          onApplyAggregateDisplay({ fieldId: agg.fieldId, type: agg.type });
          onSearchChange("");
        }
        setOpen(false);
      }
    },
    [searchValue, formula, fieldPart, opPart, currentFieldId, onSearchChange, onApplyFieldFilter, onApplyHighlightRule, onApplyAggregateDisplay, inputRef]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchValue]);

  const tryApplyParsed = useCallback(() => {
    const s = (searchValue || "").trim();
    if (!s) return false;

    const parsed = parseQuery(searchValue);
    if (parsed?.value) {
      // Fallback: read operator from input (e.g. " > " in "filter: risk_score > 75") when parsed.operator is missing
      const opRegex = new RegExp("\\s+(>=|<=|=|>|<|contains)\\s*");
      const opFromInput = (s.match(opRegex)?.[1]?.trim()) || "=";
      const effectiveOp = (parsed.operator && parsed.operator !== "=") ? parsed.operator : (opFromInput !== "=" ? opFromInput : "=");
      if (parsed.formula === "filter:" && onApplyFieldFilter) {
        onApplyFieldFilter(parsed.fieldId, parsed.value, effectiveOp);
        onSearchChange("");
        return true;
      }
      if (parsed.formula === "highlight:" && onApplyHighlightRule) {
        onApplyHighlightRule({ fieldId: parsed.fieldId, operator: parsed.operator || "=", value: parsed.value });
        onSearchChange("");
        return true;
      }
    }

    const simpleFilter = parseSimpleFilter(searchValue);
    if (simpleFilter && onApplyFieldFilter) {
      onApplyFieldFilter(simpleFilter.fieldId, simpleFilter.value, "=");
      onSearchChange("");
      return true;
    }

    const naturalHighlight = parseNaturalHighlight(searchValue);
    if (naturalHighlight && onApplyHighlightRule) {
      onApplyHighlightRule({
        displayFieldId: naturalHighlight.displayFieldId,
        conditionFieldId: naturalHighlight.conditionFieldId,
        operator: naturalHighlight.operator,
        value: naturalHighlight.value,
        color: naturalHighlight.color,
      });
      onSearchChange("");
      return true;
    }

    const showAggregate = parseShowAggregate(searchValue);
    if (showAggregate && onApplyAggregateDisplay) {
      onApplyAggregateDisplay({ fieldId: showAggregate.fieldId, type: showAggregate.type });
      onSearchChange("");
      return true;
    }

    return false;
  }, [searchValue, onApplyFieldFilter, onApplyHighlightRule, onApplyAggregateDisplay, onSearchChange]);

  const handleKeyDown = (e) => {
    if (e.key === " ") {
      const trimmed = (searchValue || "").trim();
      if (trimmed === "show" || trimmed === "make" || trimmed === "filter:" || trimmed === "highlight") {
        e.preventDefault();
        tryReserveKeyword(trimmed + " ");
        return;
      }
      if (trimmed === "filter" || trimmed === "highlight") {
        e.preventDefault();
        tryReserveKeyword(trimmed + ": ");
        return;
      }
    }
    if (e.key === "Enter") {
      if (list.length > 0) {
        e.preventDefault();
        applySuggestion(list[selectedIndex]);
      } else {
        const applied = tryApplyParsed();
        if (!applied && onSearchCommit) {
          onSearchCommit((searchValue || "").trim());
        }
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (list.length) setSelectedIndex((i) => (i + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (list.length) setSelectedIndex((i) => (i - 1 + list.length) % list.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const applyRibbonFilter = useCallback(
    (valueOverride) => {
      const value = (valueOverride != null ? String(valueOverride).trim() : ribbonValueInput.trim()) || "";
      if (!value || !filterBuilder.fieldId) return;
      if (filterBuilder.formula === "filter:" && onApplyFieldFilter) {
        onApplyFieldFilter(filterBuilder.fieldId, value, filterBuilder.operator || "=");
      } else if (filterBuilder.formula === "highlight:" && onApplyHighlightRule) {
        onApplyHighlightRule({ fieldId: filterBuilder.fieldId, operator: filterBuilder.operator || "=", value });
      }
      setFilterBuilder({ formula: null, fieldId: null, fieldLabel: null, operator: null, value: null });
      setRibbonValueInput("");
      setRibbonDropdownOpen(null);
    },
    [filterBuilder, ribbonValueInput, onApplyFieldFilter, onApplyHighlightRule]
  );

  const cancelRibbon = useCallback(() => {
    setFilterBuilder({ formula: null, fieldId: null, fieldLabel: null, operator: null, value: null });
    setRibbonValueInput("");
    setRibbonDropdownOpen(null);
  }, []);

  const cancelShowRibbon = useCallback(() => {
    setShowBuilder({ aggregateType: null, fieldId: null, fieldLabel: null });
    setRibbonDropdownOpen(null);
  }, []);

  const cancelMakeRibbon = useCallback(() => {
    setMakeBuilder({
      displayFieldId: null,
      displayFieldLabel: null,
      color: null,
      conditionFieldId: null,
      conditionFieldLabel: null,
      operator: null,
      value: null,
    });
    setRibbonValueInput("");
    setRibbonDropdownOpen(null);
  }, []);

  const applyShowBuilder = useCallback(() => {
    if (!showBuilder.aggregateType || !showBuilder.fieldId || !onApplyAggregateDisplay) return;
    onApplyAggregateDisplay({ fieldId: showBuilder.fieldId, type: showBuilder.aggregateType });
    setShowBuilder({ aggregateType: null, fieldId: null, fieldLabel: null });
    setRibbonDropdownOpen(null);
  }, [showBuilder.aggregateType, showBuilder.fieldId, onApplyAggregateDisplay]);

  const applyShowBuilderWithField = useCallback(
    (fieldId, fieldLabel) => {
      if (!showBuilder.aggregateType || !fieldId || !onApplyAggregateDisplay) return;
      onApplyAggregateDisplay({ fieldId, type: showBuilder.aggregateType });
      setShowBuilder({ aggregateType: null, fieldId: null, fieldLabel: null });
      setRibbonDropdownOpen(null);
    },
    [showBuilder.aggregateType, onApplyAggregateDisplay]
  );

  const applyMakeBuilder = useCallback(
    (valueOverride) => {
      const value = (valueOverride != null ? String(valueOverride).trim() : ribbonValueInput.trim()) || "";
      if (
        !makeBuilder.displayFieldId ||
        !makeBuilder.color ||
        !makeBuilder.conditionFieldId ||
        !makeBuilder.operator ||
        value === "" ||
        !onApplyHighlightRule
      )
        return;
      onApplyHighlightRule({
        displayFieldId: makeBuilder.displayFieldId,
        conditionFieldId: makeBuilder.conditionFieldId,
        operator: makeBuilder.operator,
        value,
        color: makeBuilder.color,
      });
      setMakeBuilder({
        displayFieldId: null,
        displayFieldLabel: null,
        color: null,
        conditionFieldId: null,
        conditionFieldLabel: null,
        operator: null,
        value: null,
      });
      setRibbonValueInput("");
      setRibbonDropdownOpen(null);
    },
    [makeBuilder, ribbonValueInput, onApplyHighlightRule]
  );

  return (
    <Card className={cn("overflow-visible", className)}>
      <CardContent className="pt-6 pb-4 overflow-visible">
        <div className="flex flex-col gap-3 overflow-visible">
          {/* Ribbon: reserved chips + next-parameter dropdown/input */}
          {filterBuilder.formula && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {filterBuilder.formula}
              </span>
              {filterBuilder.fieldId ? (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {filterBuilder.fieldLabel || filterBuilder.fieldId}
                </span>
              ) : (
                <Popover open={ribbonDropdownOpen === "field"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "field" : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      Choose field <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-1" align="start">
                    {fieldNames.slice(0, 20).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                        onClick={() => {
                          setFilterBuilder((prev) => ({ ...prev, fieldId: f.id, fieldLabel: f.label }));
                          setRibbonDropdownOpen("operator");
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
              {filterBuilder.fieldId && (
                filterBuilder.operator ? (
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {filterBuilder.operator}
                  </span>
                ) : (
                  <Popover open={ribbonDropdownOpen === "operator"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "operator" : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        Choose operator <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="start">
                      {OPERATORS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                          onClick={() => {
                            setFilterBuilder((prev) => ({ ...prev, operator: o.value }));
                            setRibbonDropdownOpen("value");
                          }}
                        >
                          {o.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )
              )}
              {filterBuilder.operator && (
                <div className="relative flex items-center gap-1">
                  <Input
                    placeholder="Value…"
                    value={ribbonValueInput}
                    onChange={(e) => setRibbonValueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyRibbonFilter();
                    }}
                    className="h-7 w-32 text-xs"
                  />
                  <Popover open={ribbonDropdownOpen === "value"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "value" : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1 max-h-56 overflow-auto" align="start">
                      {(ribbonLoadingValues && valueSuggestions.length === 0) ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">Loading…</div>
                      ) : (
                        valueSuggestions.map((v, i) => (
                          <button
                            key={i}
                            type="button"
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                            onClick={() => {
                              applyRibbonFilter(v);
                              setRibbonDropdownOpen(null);
                            }}
                          >
                            {String(v)}
                          </button>
                        ))
                      )}
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" className="h-7 text-xs shrink-0" onClick={applyRibbonFilter}>
                    Apply
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-1" onClick={cancelRibbon} aria-label="Cancel filter">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {/* Show ribbon: tag "show" → aggregate type → field → Apply */}
          {(showBuilder.aggregateType != null || showBuilder.fieldId != null || ribbonDropdownOpen === "show_agg" || ribbonDropdownOpen === "show_field") && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                show
              </span>
              {showBuilder.aggregateType ? (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {showBuilder.aggregateType}
                </span>
              ) : (
                <Popover open={ribbonDropdownOpen === "show_agg"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "show_agg" : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      sum / avg / count… <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    {AGGREGATE_TYPES.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                        onClick={() => {
                          setShowBuilder((prev) => ({ ...prev, aggregateType: a.value }));
                          setRibbonDropdownOpen("show_field");
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
              {showBuilder.aggregateType && (
                showBuilder.fieldId ? (
                  <>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {showBuilder.fieldLabel || showBuilder.fieldId}
                    </span>
                    {onApplyAggregateDisplay && (
                      <Button size="sm" className="h-7 text-xs shrink-0" onClick={applyShowBuilder}>
                        Apply
                      </Button>
                    )}
                  </>
                ) : (
                  <Popover open={ribbonDropdownOpen === "show_field"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "show_field" : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        Choose field <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1 max-h-56 overflow-auto" align="start">
                      {fieldNames.slice(0, 20).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                          onClick={() => applyShowBuilderWithField(f.id, f.label)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-1" onClick={cancelShowRibbon} aria-label="Cancel show">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {/* Make ribbon: tag "make" → display field → color → if → condition field → operator → value → Apply */}
          {(makeBuilder.displayFieldId != null || makeBuilder.color != null || makeBuilder.conditionFieldId != null || makeBuilder.operator != null || ribbonDropdownOpen?.startsWith("make_")) && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                make
              </span>
              {makeBuilder.displayFieldId ? (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {makeBuilder.displayFieldLabel || makeBuilder.displayFieldId}
                </span>
              ) : (
                <Popover open={ribbonDropdownOpen === "make_display"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "make_display" : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      Choose display column <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-1 max-h-56 overflow-auto" align="start">
                    {fieldNames.slice(0, 20).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                        onClick={() => {
                          setMakeBuilder((prev) => ({ ...prev, displayFieldId: f.id, displayFieldLabel: f.label }));
                          setRibbonDropdownOpen("make_color");
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
              {makeBuilder.displayFieldId && (
                makeBuilder.color ? (
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {makeBuilder.color}
                  </span>
                ) : (
                  <Popover open={ribbonDropdownOpen === "make_color"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "make_color" : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        Choose color <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" align="start">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                          onClick={() => {
                            setMakeBuilder((prev) => ({ ...prev, color: c.value }));
                            setRibbonDropdownOpen("make_if_field");
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )
              )}
              {makeBuilder.color && (
                <>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    if
                  </span>
                  {makeBuilder.conditionFieldId ? (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {makeBuilder.conditionFieldLabel || makeBuilder.conditionFieldId}
                    </span>
                  ) : (
                    <Popover open={ribbonDropdownOpen === "make_if_field"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "make_if_field" : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          Condition column <ChevronDown className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1 max-h-56 overflow-auto" align="start">
                        {fieldNames.slice(0, 20).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                            onClick={() => {
                              setMakeBuilder((prev) => ({ ...prev, conditionFieldId: f.id, conditionFieldLabel: f.label }));
                              setRibbonDropdownOpen("make_op");
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  )}
                  {makeBuilder.conditionFieldId && (
                    makeBuilder.operator ? (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {makeBuilder.operator}
                      </span>
                    ) : (
                      <Popover open={ribbonDropdownOpen === "make_op"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "make_op" : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            Operator <ChevronDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="start">
                          {OPERATORS.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                              onClick={() => {
                                setMakeBuilder((prev) => ({ ...prev, operator: o.value }));
                                setRibbonDropdownOpen("make_value");
                              }}
                            >
                              {o.label}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    )
                  )}
                  {makeBuilder.operator && (
                    <div className="relative flex items-center gap-1">
                      <Input
                        placeholder="Value…"
                        value={ribbonValueInput}
                        onChange={(e) => setRibbonValueInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") applyMakeBuilder();
                        }}
                        className="h-7 w-32 text-xs"
                      />
                      <Popover open={ribbonDropdownOpen === "make_value"} onOpenChange={(open) => setRibbonDropdownOpen(open ? "make_value" : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0">
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1 max-h-56 overflow-auto" align="start">
                          {(ribbonLoadingValues && valueSuggestions.length === 0) ? (
                            <div className="px-2 py-2 text-xs text-muted-foreground">Loading…</div>
                          ) : (
                            valueSuggestions.map((v, i) => (
                              <button
                                key={i}
                                type="button"
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                                onClick={() => {
                                  applyMakeBuilder(String(v));
                                }}
                              >
                                {String(v)}
                              </button>
                            ))
                          )}
                        </PopoverContent>
                      </Popover>
                      <Button size="sm" className="h-7 text-xs shrink-0" onClick={applyMakeBuilder}>
                        Apply
                      </Button>
                    </div>
                  )}
                </>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-1" onClick={cancelMakeRibbon} aria-label="Cancel make">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            {(
              <div ref={containerRef} className="relative flex-1 min-w-0 overflow-visible flex items-center gap-1">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    ref={inputRef}
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      onSearchChange(v);
                      setOpen(true);
                      // When user types reserved keyword + space, convert to tag and open builder
                      tryReserveKeyword(v);
                    }}
                    onFocus={() => setOpen(hasInput)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 w-full h-10"
                  />
                {(showDropdown || (needValues && loadingValues)) && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 z-[100] rounded-md border bg-popover text-popover-foreground shadow-lg max-h-[280px] overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {needValues && loadingValues && !valueSuggestions.length ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">Loading values…</div>
                    ) : (
                      list.map((item, i) => (
                        <button
                          key={String(item.value) + i}
                          type="button"
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm hover:bg-accent",
                            i === selectedIndex && "bg-accent"
                          )}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedIndex(i);
                            applySuggestion(item);
                          }}
                        >
                          {item.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
                </div>
                {showInfoButton && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Search and formula help">
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 sm:w-96" align="start">
                      <p className="font-medium text-sm mb-2">{SEARCH_HELP.title}</p>
                      <ul className="text-xs text-muted-foreground space-y-2">
                        {SEARCH_HELP.items.map(({ ex, desc }, i) => (
                          <li key={i}>
                            <code className="text-foreground bg-muted px-1 rounded text-[11px]">{ex}</code>
                            <span className="ml-1.5">{desc}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-muted-foreground mt-2">Press / to focus the search bar.</p>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
            <div className="flex gap-3">
              {showFilters && (
                <Button
                  variant="outline"
                  onClick={onToggleFilters}
                  className="flex-1 sm:flex-none sm:w-auto shrink-0 h-10 whitespace-nowrap"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              )}
              {showCreateButton && (
                <Button onClick={onCreateClick} className="flex-1 sm:flex-none sm:w-auto shrink-0 h-10 whitespace-nowrap">
                  <CreateIcon className="mr-2 h-4 w-4" />
                  {createButtonText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

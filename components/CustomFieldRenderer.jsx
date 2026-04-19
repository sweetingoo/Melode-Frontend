"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download, FileText, X, Search, Loader2, Plus, Trash2, AlertTriangle, Undo2, Redo2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDownloadFile } from "@/hooks/useProfile";
import { useFileReferences } from "@/hooks/useFileReferences";
import { usersService } from "@/services/users";
import { profileService } from "@/services/profile";
import { getUserDisplayName } from "@/utils/user";

/** If a stored value points at GET .../settings/files/{slug}/download (JSON), return {slug}; that URL is not an image. */
function extractFileReferenceSlugFromStoredBackground(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  try {
    if (/^https?:\/\//i.test(t)) {
      const u = new URL(t);
      const m = u.pathname.match(/\/(?:settings\/)?files\/([^/]+)\/download\/?$/i);
      return m ? m[1] : null;
    }
  } catch {
    return null;
  }
  const m = t.match(/\/(?:settings\/)?files\/([^/]+)\/download\/?$/i);
  return m ? m[1] : null;
}

// Sort options by value for consistent display order (select, radio, multiselect)
const sortOptionsByValue = (options) => {
  if (!Array.isArray(options) || options.length === 0) return options;
  return [...options].sort((a, b) => {
    const valA = typeof a === 'object' && a !== null ? String(a?.value ?? '') : String(a ?? '');
    const valB = typeof b === 'object' && b !== null ? String(b?.value ?? '') : String(b ?? '');
    return valA.localeCompare(valB, undefined, { sensitivity: 'base' });
  });
};

// True if option value or label indicates "other" / "others" / "other (specify)" etc.
const isOptionOther = (value, label) => {
  const v = String(value ?? '').toLowerCase().trim();
  const l = String(label ?? '').toLowerCase().trim();
  if (v === 'other' || v === 'others' || l === 'other' || l === 'others') return true;
  if (l.includes('other') && (l.includes('specify') || l.includes('describe') || l.includes('please'))) return true;
  if (v.includes('other_specify')) return true;
  return false;
};

/** Option object may set free_text: true (multiselect) to show a textarea when that option is selected. */
const optionPromptsFreeText = (option) => {
  if (option && typeof option === 'object' && option.free_text === true) return true;
  return isOptionOther(option?.value, option?.label);
};

// Order options: put "other"/"others" at end only (no None). Use for radio and other types that don't need None.
const orderOptionsOtherAtEnd = (options) => {
  if (!Array.isArray(options) || options.length === 0) return [];
  const normalized = options.map((o) =>
    typeof o === 'object' && o !== null
      ? { value: o.value ?? '', label: o.label ?? o.value ?? '', ...(o.free_text === true ? { free_text: true } : {}) }
      : { value: String(o), label: String(o) }
  );
  const otherOptions = normalized.filter((o) => isOptionOther(o.value, o.label));
  const rest = normalized.filter((o) => !isOptionOther(o.value, o.label));
  const sortedRest = sortOptionsByValue(rest);
  return [...sortedRest, ...otherOptions];
};

// Normalize options: ensure "None" option exists (first), put "other"/"others" at end, return { options, noneValue }. Use only for Select and Multiselect.
const normalizeOptionsWithNoneAndOther = (options) => {
  if (!Array.isArray(options) || options.length === 0) {
    const noneOption = { value: 'none', label: 'None' };
    return { options: [noneOption], noneValue: 'none' };
  }
  const normalized = options.map((o) =>
    typeof o === 'object' && o !== null
      ? { value: o.value ?? '', label: o.label ?? o.value ?? '', ...(o.free_text === true ? { free_text: true } : {}) }
      : { value: String(o), label: String(o) }
  );
  const isNone = (v, l) => {
    const vv = String(v || '').toLowerCase().trim();
    const ll = String(l || '').toLowerCase().trim();
    return vv === 'none' || ll === 'none';
  };
  const hasNone = normalized.some((o) => isNone(o.value, o.label));
  const noneOption = hasNone ? normalized.find((o) => isNone(o.value, o.label)) : { value: 'none', label: 'None' };
  const noneValue = noneOption?.value ?? 'none';
  if (!hasNone) {
    normalized.unshift({ value: noneValue, label: 'None' });
  }
  const rest = normalized.filter((o) => !isNone(o.value, o.label));
  const otherOptions = rest.filter((o) => isOptionOther(o.value, o.label));
  const middleOptions = rest.filter((o) => !isOptionOther(o.value, o.label));
  const sortedMiddle = sortOptionsByValue(middleOptions);
  const ordered = [normalized.find((o) => isNone(o.value, o.label)) || { value: noneValue, label: 'None' }, ...sortedMiddle, ...otherOptions];
  return { options: ordered, noneValue };
};

const CustomFieldRenderer = ({ 
  field, 
  value, 
  onChange, 
  error,
  readOnly = false,
  hideLabel = false,
  otherTextValue,
  /** Multiselect: per-option free text stored on submission_data[`${field.id}_free_text`] as { [optionValue]: string } */
  optionFreeTextMap,
}) => {
  const fieldId = `custom-field-${field.id}`;
  const otherFieldId = `${field.id}_other`;
  const isRequired = field.is_required || field.required;
  const fieldType = field.field_type || field.type;
  // Field config can hide the label (show_label: false); prop hideLabel overrides for special layouts
  const effectiveHideLabel = hideLabel || field.field_options?.show_label === false;
  // When None is selected, other options are hidden until user expands (radio/select)
  const [expandedOptionFields, setExpandedOptionFields] = useState({});

  // Set default to "none" when value is empty for select/dropdown only (not radio, not multiselect)
  const fieldTypeLower = fieldType?.toLowerCase();
  const isSelectOrDropdown = ['select', 'dropdown'].includes(fieldTypeLower);
  const isMultiselect = fieldTypeLower === 'multiselect';
  const optionsLength = (field.field_options?.options || field.options)?.length ?? 0;
  useEffect(() => {
    if ((!isSelectOrDropdown && !isMultiselect) || onChange == null) return;
    if (isMultiselect) return; // Multiselect: no default selection; show all options, leave empty as []
    const opts = field.field_options?.options || field.options || [];
    if (!Array.isArray(opts) || opts.length === 0) return;
    const emptySingle = value === undefined || value === null || value === '';
    if (!emptySingle) return;
    const noneOpt = opts.find((o) => String(o?.value ?? '').toLowerCase().trim() === 'none' || String(o?.label ?? '').toLowerCase().trim() === 'none');
    const noneVal = noneOpt?.value != null && noneOpt?.value !== '' ? noneOpt.value : 'none';
    onChange(field.id, noneVal);
  }, [field.id, value, isSelectOrDropdown, isMultiselect, onChange, optionsLength]);

  const handleChange = (newValue) => {
    onChange(field.id, newValue);
    if (newValue === undefined || newValue === null) return;
    // When user selects "none", collapse the options list again
    const opts = field.field_options?.options || field.options || [];
    const noneOpt = opts.find((o) => String(o?.value ?? '').toLowerCase() === 'none' || String(o?.label ?? '').toLowerCase() === 'none');
    const noneVal = noneOpt?.value ?? 'none';
    if (String(newValue) === String(noneVal)) {
      setExpandedOptionFields((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const renderField = () => {
    switch (fieldType?.toLowerCase()) {
      case 'text':
      case 'string': {
        const textObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const ragColor = textObj.rag?.toLowerCase();
        const textVal = textObj.value != null && textObj.value !== '' ? String(textObj.value) : '';
        if (readOnly && ragColor) {
          const ragBadgeClass = ragColor === 'red' ? 'bg-red-500/90 text-white' : ragColor === 'amber' ? 'bg-amber-500/90 text-white' : ragColor === 'green' ? 'bg-green-600/90 text-white' : null;
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {ragBadgeClass && (
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ragBadgeClass)}>
                  {(ragColor || '').charAt(0).toUpperCase() + (ragColor || '').slice(1)}
                </span>
              )}
              <span className="text-sm">{textVal || '—'}</span>
            </div>
          );
        }
        return (
          <Input
            id={fieldId}
            type="text"
            value={textVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            maxLength={field.max_length}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );
      }

      case 'email':
        return (
          <Input
            id={fieldId}
            type="email"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'number':
      case 'integer': {
        const numObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const ragColor = numObj.rag?.toLowerCase();
        if (readOnly && ragColor) {
          const numDisplay = numObj.value != null && numObj.value !== '' ? String(numObj.value) : '—';
          const ragBadgeClass = ragColor === 'red' ? 'bg-red-500/90 text-white' : ragColor === 'amber' ? 'bg-amber-500/90 text-white' : ragColor === 'green' ? 'bg-green-600/90 text-white' : null;
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {ragBadgeClass && (
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ragBadgeClass}`}>
                  {(ragColor || '').charAt(0).toUpperCase() + (ragColor || '').slice(1)}
                </span>
              )}
              <span className="text-sm tabular-nums">{numDisplay}</span>
            </div>
          );
        }
        const inputVal = numObj.value != null && numObj.value !== '' ? numObj.value : '';
        return (
          <Input
            id={fieldId}
            type="number"
            value={inputVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            min={field.min_value}
            max={field.max_value}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );
      }

      case 'decimal':
      case 'float':
        return (
          <Input
            id={fieldId}
            type="number"
            step="0.01"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            min={field.min_value}
            max={field.max_value}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'textarea':
      case 'text_area':
        return (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            maxLength={field.max_length}
            rows={4}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'boolean':
      case 'checkbox':
      case 'boolean_with_description': {
        const booleanDisplay = field.field_options?.boolean_display || field.field_options?.display || 'checkbox';
        const displayStyle = field.field_options?.checkbox_display_style || field.field_options?.display_style || 'default';
        const isYesNoRadios = booleanDisplay === 'radio' || booleanDisplay === 'yes_no';
        const label = field.field_description || field.field_label || field.name;
        const helperText = field.helper_text || field.field_options?.helper_text;
        const checkboxContent = isYesNoRadios ? (
          <RadioGroup
            value={value === true || value === 'true' ? 'true' : 'false'}
            onValueChange={(v) => handleChange(v === 'true')}
            className="flex flex-wrap gap-4"
            disabled={readOnly}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${fieldId}-yes`} disabled={readOnly} />
              <Label htmlFor={`${fieldId}-yes`} className="text-sm font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${fieldId}-no`} disabled={readOnly} />
              <Label htmlFor={`${fieldId}-no`} className="text-sm font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        ) : (
          <div className="flex items-start gap-3">
            <Checkbox
              id={fieldId}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleChange(checked)}
              disabled={readOnly}
              className={displayStyle === 'warning' ? 'border-amber-600 data-[state=checked]:bg-amber-600 focus-visible:ring-amber-500' : displayStyle === 'alert' ? 'border-yellow-500 data-[state=checked]:bg-[#50b8c4] focus-visible:ring-[#50b8c4]' : undefined}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={fieldId}
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  displayStyle === 'alert' && "text-yellow-800"
                )}
              >
                {label}
              </Label>
              {helperText && <p className={cn("text-xs", displayStyle === 'alert' ? "text-yellow-700/90" : "text-muted-foreground")}>{helperText}</p>}
            </div>
          </div>
        );
        if (displayStyle === 'warning') {
          const innerContent = isYesNoRadios ? (
            checkboxContent
          ) : (
            <>
              <label className="flex items-center cursor-pointer" htmlFor={fieldId}>
                <Checkbox
                  id={fieldId}
                  checked={value === true || value === 'true'}
                  onCheckedChange={(checked) => handleChange(checked)}
                  disabled={readOnly}
                  className="h-5 w-5 border-amber-600 data-[state=checked]:bg-amber-600 focus-visible:ring-amber-500 shrink-0"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
              </label>
              {helperText && <p className="mt-2 text-xs text-gray-500">{helperText}</p>}
            </>
          );
          return (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 shrink-0" />
                {field.field_label || field.name || 'Confirm'}
              </h3>
              <div className="border border-amber-300 bg-white p-4 rounded">
                {innerContent}
              </div>
            </div>
          );
        }
        if (displayStyle === 'alert') {
          return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="ml-3 flex-1">
                  {checkboxContent}
                </div>
              </div>
            </div>
          );
        }
        return checkboxContent;
      }

      case 'select':
      case 'dropdown': {
        const { options: orderedOptions, noneValue } = normalizeOptionsWithNoneAndOther(field.field_options?.options || field.options || []);
        const options = orderedOptions;
        const selectObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const ragColor = selectObj.rag?.toLowerCase();
        const rawVal = selectObj.value != null && selectObj.value !== '' ? selectObj.value : undefined;
        const selectVal = rawVal !== undefined && rawVal !== '' ? rawVal : noneValue;
        if (readOnly && ragColor) {
          const displayVal = options.find(o => (o.value ?? o) === selectVal);
          const displayLabel = displayVal?.label ?? displayVal ?? selectVal ?? '—';
          const ragBadgeClass = ragColor === 'red' ? 'bg-red-500/90 text-white' : ragColor === 'amber' ? 'bg-amber-500/90 text-white' : ragColor === 'green' ? 'bg-green-600/90 text-white' : null;
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {ragBadgeClass && (
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ragBadgeClass)}>
                  {(ragColor || '').charAt(0).toUpperCase() + (ragColor || '').slice(1)}
                </span>
              )}
              <span className="text-sm">{displayLabel}</span>
            </div>
          );
        }
        const selectedOption = options.find((o) => (o.value ?? o) === selectVal);
        const isOtherSelected = selectedOption && optionPromptsFreeText(selectedOption);
        return (
          <div className="space-y-2">
            <Select
              value={selectVal ?? noneValue}
              onValueChange={handleChange}
              disabled={readOnly}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.field_description || `Select ${field.field_label || field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => {
                  // Handle both object and primitive options
                  let optionValue;
                  if (typeof option === 'object' && option !== null) {
                    optionValue = option.value;
                  } else {
                    optionValue = option;
                }
                
                // Ensure value is never an empty string - use a safe fallback
                const safeValue = (optionValue === "" || optionValue === null || optionValue === undefined)
                  ? `option-${index}`
                  : String(optionValue);
                
                return (
                  <SelectItem key={index} value={safeValue}>
                    {typeof option === 'object' && option !== null ? (option.label || option.value || safeValue) : (option || safeValue)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {isOtherSelected && !readOnly && (
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-other`} className="text-sm text-muted-foreground">
                Please specify
              </Label>
              <Textarea
                id={`${fieldId}-other`}
                value={otherTextValue ?? ''}
                onChange={(e) => onChange(otherFieldId, e.target.value)}
                placeholder="Type here..."
                rows={3}
                className={error ? 'border-red-500' : ''}
                disabled={readOnly}
              />
            </div>
          )}
        </div>
        );
      }

      case 'radio':
      case 'radio_group': {
        const radioOptions = orderOptionsOtherAtEnd(field.field_options?.options || field.options || []);
        const radioLayout = field.field_options?.options_layout || field.field_options?.layout || 'vertical';
        const isHorizontal = radioLayout === 'horizontal';
        return (
          <div className="space-y-2">
            <RadioGroup
              value={value !== undefined && value !== null && value !== '' ? String(value) : undefined}
              onValueChange={handleChange}
              className={cn(error ? 'border-red-500' : '', isHorizontal && radioOptions.length > 1 && 'grid grid-cols-3 gap-2')}
              disabled={readOnly}
            >
              {radioOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(option.value ?? option)} id={`${fieldId}-${index}`} disabled={readOnly} />
                  <Label htmlFor={`${fieldId}-${index}`} className="text-sm font-normal cursor-pointer">
                    {option.label || option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      }

      case 'date': {
        // Date field: Calendar only (no time selection); support RAG { value, rag }
        const dateObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const dateRag = dateObj.rag?.toLowerCase();
        const dateVal = dateObj.value ?? value;
        if (readOnly && dateRag) {
          const displayDate = dateVal ? (typeof dateVal === 'string' ? dateVal : dateVal instanceof Date ? format(dateVal, 'PPP') : String(dateVal)) : '—';
          const ragBadgeClass = dateRag === 'red' ? 'bg-red-500/90 text-white' : dateRag === 'amber' ? 'bg-amber-500/90 text-white' : dateRag === 'green' ? 'bg-green-600/90 text-white' : null;
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {ragBadgeClass && (
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ragBadgeClass)}>
                  {(dateRag || '').charAt(0).toUpperCase() + (dateRag || '').slice(1)}
                </span>
              )}
              <span className="text-sm">{displayDate}</span>
            </div>
          );
        }
        return (
          <DatePickerWithTime
            fieldId={fieldId}
            value={dateVal}
            onChange={handleChange}
            error={error}
            readOnly={readOnly}
            shouldShowTime={false}
          />
        );
      }

      case 'datetime':
      case 'date_time': {
        // Date & Time field: Calendar with time input; support RAG { value, rag }
        const dtObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const dtRag = dtObj.rag?.toLowerCase();
        const dtVal = dtObj.value ?? value;
        if (readOnly && dtRag) {
          const displayDt = dtVal ? (typeof dtVal === 'string' ? dtVal : dtVal instanceof Date ? format(dtVal, 'PPP p') : String(dtVal)) : '—';
          const ragBadgeClass = dtRag === 'red' ? 'bg-red-500/90 text-white' : dtRag === 'amber' ? 'bg-amber-500/90 text-white' : dtRag === 'green' ? 'bg-green-600/90 text-white' : null;
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {ragBadgeClass && (
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ragBadgeClass)}>
                  {(dtRag || '').charAt(0).toUpperCase() + (dtRag || '').slice(1)}
                </span>
              )}
              <span className="text-sm">{displayDt}</span>
            </div>
          );
        }
        return (
          <DatePickerWithTime
            fieldId={fieldId}
            value={dtVal}
            onChange={handleChange}
            error={error}
            readOnly={readOnly}
            shouldShowTime={true}
          />
        );
      }

      case 'time':
        // Time-only field: Just time input (no date/calendar)
        // Handle time value format (HH:mm or HH:mm:ss)
        const formatTimeValue = (timeValue) => {
          if (!timeValue) return '';
          // If it's already in HH:mm format, return as is
          if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}/)) {
            return timeValue.substring(0, 5); // Return HH:mm only
          }
          // If it's a Date object, extract time
          if (timeValue instanceof Date) {
            const hours = timeValue.getHours().toString().padStart(2, '0');
            const minutes = timeValue.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          }
          return '';
        };
        
        return (
          <Input
            id={fieldId}
            type="time"
            value={formatTimeValue(value)}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder="HH:mm"
          />
        );

      case 'url':
        return (
          <Input
            id={fieldId}
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'phone':
        return (
          <Input
            id={fieldId}
            type="tel"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );

      case 'multiselect': {
        const { options: multiOptionsOrdered, noneValue: multiNoneValue } = normalizeOptionsWithNoneAndOther(field.field_options?.options || field.options || []);
        const multiOptions = multiOptionsOrdered;
        const multiObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const selectedValues = Array.isArray(multiObj.value) ? multiObj.value : (multiObj.value ? [multiObj.value] : []);
        const multiRag = multiObj.rag?.toLowerCase();
        const freeTextMap =
          optionFreeTextMap && typeof optionFreeTextMap === 'object' && !Array.isArray(optionFreeTextMap)
            ? optionFreeTextMap
            : {};

        const getFreeTextForSelectedOption = (optionValue) => {
          const sv = String(optionValue);
          if (freeTextMap[sv] !== undefined && freeTextMap[sv] !== null) return String(freeTextMap[sv]);
          const legacyOther = multiOptions.find(
            (o) => selectedValues.includes(o.value ?? o) && isOptionOther(o.value, o.label),
          );
          if (
            legacyOther &&
            String(legacyOther.value ?? legacyOther) === sv &&
            typeof otherTextValue === 'string'
          ) {
            return otherTextValue;
          }
          return '';
        };

        const pruneFreeTextKey = (optionValue) => {
          if (!onChange) return;
          const k = String(optionValue);
          const next = { ...freeTextMap };
          delete next[k];
          onChange(`${field.id}_free_text`, next);
        };

        if (readOnly && multiRag) {
          const labels = selectedValues.map((v) => {
            const o = multiOptions.find((opt) => (opt.value ?? opt) === v);
            return o?.label ?? o ?? v;
          });
          const displayLabel = labels.length > 0 ? labels.join(', ') : '—';
          const ragBadgeClass = multiRag === 'red' ? 'bg-red-500/90 text-white' : multiRag === 'amber' ? 'bg-amber-500/90 text-white' : multiRag === 'green' ? 'bg-green-600/90 text-white' : null;
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {ragBadgeClass && (
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ragBadgeClass)}>
                  {(multiRag || '').charAt(0).toUpperCase() + (multiRag || '').slice(1)}
                </span>
              )}
              <span className="text-sm">{displayLabel}</span>
            </div>
          );
        }
        const setMultiValue = (next) => handleChange(next.length ? next : []);
        return (
          <div className="space-y-2 w-full">
            <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 min-w-0">
              {multiOptions.map((option, index) => {
                const optionValue = option.value ?? option;
                const optionLabel = typeof option === 'object' && option !== null ? (option.label ?? option.value ?? '') : (option ?? '');
                const isSelected = selectedValues.some((v) => String(v) === String(optionValue) || String(v) === String(optionLabel));
                const isNoneOption = String(optionValue) === String(multiNoneValue);
                const showFreeText = optionPromptsFreeText(option);
                const ftVal = getFreeTextForSelectedOption(optionValue);
                return (
                  <div key={index} className="flex min-w-0 flex-col gap-1.5 py-1.5 pr-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={`${fieldId}-${index}`}
                        checked={isSelected}
                        className="shrink-0 mt-0.5"
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (isNoneOption) {
                              setMultiValue([multiNoneValue]);
                            } else {
                              handleChange([...selectedValues.filter(v => String(v) !== String(multiNoneValue)), optionValue]);
                            }
                          } else {
                            if (showFreeText) pruneFreeTextKey(optionValue);
                            const next = selectedValues.filter((v) => String(v) !== String(optionValue) && String(v) !== String(optionLabel));
                            if (isNoneOption) {
                              handleChange(next.length ? next : []);
                            } else {
                              setMultiValue(next);
                            }
                          }
                        }}
                        disabled={readOnly}
                      />
                      <Label htmlFor={`${fieldId}-${index}`} className="text-sm font-normal cursor-pointer min-w-0 flex-1 break-words">
                        {option.label || option}
                      </Label>
                    </div>
                    {isSelected && showFreeText && (
                      readOnly ? (
                        ftVal ? (
                          <div className="ml-7 pl-3 border-l-2 border-muted text-sm text-muted-foreground whitespace-pre-wrap">
                            {ftVal}
                          </div>
                        ) : null
                      ) : (
                        <div className="pl-7 space-y-1 w-full min-w-0">
                          <Label htmlFor={`${fieldId}-ft-${index}`} className="text-xs text-muted-foreground">
                            Details
                          </Label>
                          <Textarea
                            id={`${fieldId}-ft-${index}`}
                            value={ftVal}
                            onChange={(e) => {
                              const next = { ...freeTextMap, [String(optionValue)]: e.target.value };
                              onChange(`${field.id}_free_text`, next);
                            }}
                            placeholder="Type here..."
                            rows={3}
                            className={error ? 'border-red-500' : ''}
                            disabled={readOnly}
                          />
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedValues.join(', ')}
              </div>
            )}
          </div>
        );
      }

      case 'people':
      case 'user':
        return <PeopleFieldRenderer
          field={field}
          value={value}
          onChange={handleChange}
          error={error}
          fieldId={fieldId}
          readOnly={readOnly}
        />;

      case 'file':
        return <FileFieldRenderer 
          field={field} 
          value={value} 
          onChange={handleChange} 
          error={error} 
          fieldId={fieldId} 
        />;

      case 'json':
        return (
          <div className="space-y-2">
            <Textarea
              id={fieldId}
              value={typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange(parsed);
                } catch {
                  // If not valid JSON, store as string for now
                  handleChange(e.target.value);
                }
              }}
              placeholder={field.field_description || `Enter JSON data for ${field.field_label || field.name}`}
              rows={6}
              className={`font-mono text-sm ${error ? 'border-red-500' : ''}`}
            />
            <div className="text-xs text-muted-foreground">
              Enter valid JSON format. Use proper syntax with quotes around keys and string values.
            </div>
          </div>
        );

      // Display-only field types
      case 'text_block':
        const textContent = field.content || field.field_content || '';
        const textLabel = field.label || field.field_label || field.name;
        
        // Use useFileReferences hook to handle file references in content
        const TextBlockContent = () => {
          const { processedHtml, containerRef } = useFileReferences(textContent);
          
          return (
            <div 
              ref={containerRef}
              className="text-sm text-foreground prose prose-sm max-w-none w-full break-words mb-4"
              style={{ 
                position: 'relative', 
                display: 'block',
                clear: 'both',
                overflow: 'auto',
                marginBottom: '1rem',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          );
        };
        
        return (
          <div 
            className="space-y-2 w-full my-4 mb-6"
            style={{
              position: 'relative',
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            {textLabel && (
              <h4 className="text-sm font-semibold">{textLabel}</h4>
            )}
            <TextBlockContent />
          </div>
        );

      case 'image_block':
        // Check multiple possible field name variations
        const imageUrl = field.image_url || field.field_image_url || field.imageUrl;
        const imageFileId = field.image_file_id || field.field_image_file_id || field.imageFileId;
        const altText = field.alt_text || field.field_alt_text || field.altText;
        const imageLabel = field.label || field.field_label || field.name;
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Image block field data:', {
            fieldType: field.field_type,
            imageUrl,
            imageFileId,
            altText,
            imageLabel,
            fullField: field
          });
        }
        
        // Construct image source URL - prefer image_url (download_url) over image_file_id
        let imageSrc = null;
        if (imageUrl) {
          // Use the download_url directly (stored in image_url)
          imageSrc = imageUrl;
        } else if (imageFileId) {
          // Fallback: construct URL from file ID if image_url is not available
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://melode-api-prod.onrender.com/api/v1';
          imageSrc = `${apiBaseUrl}/settings/files/${imageFileId}/download`;
        }
        
        return (
          <div 
            className="space-y-2 w-full my-4"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            {imageLabel && (
              <h4 className="text-sm font-semibold">{imageLabel}</h4>
            )}
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={altText || imageLabel || 'Form image'}
                className="max-w-full h-auto rounded-md border"
                style={{ 
                  position: 'relative', 
                  display: 'block',
                  clear: 'both'
                }}
                onError={(e) => {
                  console.error('Image failed to load:', imageSrc);
                  // Fallback if image fails to load
                  const errorDiv = e.target.parentNode.querySelector('.image-error');
                  if (!errorDiv) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'image-error p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground mt-2';
                    errorMsg.textContent = `Failed to load image: ${imageSrc}`;
                    e.target.parentNode.appendChild(errorMsg);
                  }
                }}
                onLoad={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Image loaded successfully:', imageSrc);
                  }
                }}
              />
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                <p>No image provided</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs mt-2">Debug: imageUrl={imageUrl ? 'exists' : 'missing'}, imageFileId={imageFileId ? 'exists' : 'missing'}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'line_break':
        return (
          <hr 
            className="my-4 border-t border-border w-full" 
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both'
            }} 
          />
        );

      case 'rag':
        // Value may be { value, rag } from backend or raw value
        const ragObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const ragColor = ragObj.rag?.toLowerCase();
        const ragLabel = ragObj.value != null && ragObj.value !== '' ? String(ragObj.value) : '—';
        const ragBadgeClass = ragColor === 'red' ? 'bg-red-500/90 text-white' : ragColor === 'amber' ? 'bg-amber-500/90 text-white' : ragColor === 'green' ? 'bg-green-600/90 text-white' : 'bg-muted text-muted-foreground';
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {ragColor && (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ragBadgeClass}`}>
                {ragColor.charAt(0).toUpperCase() + ragColor.slice(1)}
              </span>
            )}
            <span className="text-sm">{ragLabel}</span>
          </div>
        );

      case 'calculated': {
        // May be { value, rag } when field has rag_rules (calculated + RAG display)
        const calcObj = value && typeof value === 'object' && 'rag' in value ? value : { value, rag: null };
        const ragColor = calcObj.rag?.toLowerCase();
        const calcDisplay = calcObj.value != null && calcObj.value !== '' ? String(calcObj.value) : '—';
        const ragBadgeClass = ragColor === 'red' ? 'bg-red-500/90 text-white' : ragColor === 'amber' ? 'bg-amber-500/90 text-white' : ragColor === 'green' ? 'bg-green-600/90 text-white' : null;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {ragBadgeClass && (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ragBadgeClass}`}>
                {(ragColor || '').charAt(0).toUpperCase() + (ragColor || '').slice(1)}
              </span>
            )}
            <span className="text-sm font-medium tabular-nums" title="Calculated (read-only)">
              {calcDisplay}
            </span>
          </div>
        );
      }

      case 'page_break':
        return (
          <div 
            className="my-8 border-t-2 border-dashed border-border w-full"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Page Break
            </div>
          </div>
        );

      case 'download_link':
        const downloadUrl = field.download_url || field.field_download_url;
        const downloadLabel = field.label || field.field_label || field.name || 'Download';
        const downloadDescription = field.field_description || field.help_text;
        
        return (
          <div 
            className="space-y-2 w-full my-4"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            {downloadDescription && (
              <p className="text-sm text-muted-foreground">{downloadDescription}</p>
            )}
            {downloadUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(downloadUrl, '_blank')}
                className="w-full"
                style={{ position: 'relative', display: 'block' }}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadLabel}
              </Button>
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                No download URL provided
              </div>
            )}
          </div>
        );

      case 'youtube_video_embed': {
        // Check multiple possible field name variations
        const videoUrl = field.video_url || field.field_video_url || field.videoUrl;
        const videoAltText = field.alt_text || field.field_alt_text || field.altText;
        const videoLabel = field.label || field.field_label || field.name;
        
        // Helper function to convert YouTube URL to embed format
        const getYouTubeEmbedUrl = (url) => {
          if (!url) return null;
          
          // Handle various YouTube URL formats
          // https://www.youtube.com/watch?v=VIDEO_ID
          // https://youtube.com/watch?v=VIDEO_ID
          // https://youtu.be/VIDEO_ID
          // https://www.youtube.com/embed/VIDEO_ID
          // https://youtube.com/embed/VIDEO_ID
          
          let videoId = null;
          
          // Check if already an embed URL
          const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
          if (embedMatch) {
            videoId = embedMatch[1];
          } else {
            // Extract video ID from watch URL
            const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (watchMatch) {
              videoId = watchMatch[1];
            } else {
              // Extract from youtu.be short URL
              const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
              if (shortMatch) {
                videoId = shortMatch[1];
              }
            }
          }
          
          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
          }
          
          return null;
        };
        
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        
        return (
          <div 
            className="space-y-2 w-full my-4"
            style={{ 
              position: 'relative', 
              display: 'block',
              clear: 'both',
              overflow: 'visible'
            }}
          >
            {videoLabel && (
              <h4 className="text-sm font-semibold">{videoLabel}</h4>
            )}
            {embedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                <iframe
                  src={embedUrl}
                  title={videoAltText || videoLabel || 'YouTube video'}
                  className="absolute top-0 left-0 w-full h-full border rounded-md"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              </div>
            ) : videoUrl ? (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                <p>Invalid YouTube URL format</p>
                <p className="text-xs mt-2">Please provide a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)</p>
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                <p>No video URL provided</p>
              </div>
            )}
          </div>
        );
      }

      case 'image_free_draw':
        return (
          <ImageFreeDrawFieldRenderer
            field={field}
            value={value}
            onChange={handleChange}
            error={error}
            readOnly={readOnly}
          />
        );

      case 'signature':
        return <SignatureFieldRenderer 
          field={field} 
          value={value} 
          onChange={handleChange} 
          error={error} 
          fieldId={fieldId} 
        />;

      case 'repeatable_group': {
        const rows = Array.isArray(value) ? value : [];
        const childFields = field.fields || [];
        const isInline = field.layout === 'inline' || (childFields.length <= 4 && childFields.length >= 2);
        const colCount = Math.min(childFields.length, 4);
        // Show at least one row when empty so the grid/inputs are visible (match "Prescription" style UI)
        const displayRows = rows.length > 0 ? rows : [{}];
        const updateRow = (rowIndex, childId, childValue) => {
          const source = rows.length > 0 ? rows : displayRows;
          const newRows = source.map((r, i) => (i === rowIndex ? { ...(r || {}), [childId]: childValue } : r || {}));
          if (rows.length === 0 && rowIndex === 0) handleChange([newRows[0]]);
          else handleChange(newRows);
        };
        const addRow = () => handleChange([...displayRows, {}]);
        const removeRow = (rowIndex) => {
          const next = displayRows.filter((_, i) => i !== rowIndex);
          handleChange(next.length === 0 ? [] : next);
        };
        if (readOnly) {
          const toShow = rows.length > 0 ? rows : [];
          return (
            <div className="space-y-3">
              {toShow.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              {toShow.map((row, rowIndex) => (
                <div key={rowIndex} className={cn("rounded-md border p-3 bg-muted/30", isInline && "flex flex-wrap items-end gap-3")}>
                  {!isInline && <div className="text-xs font-medium text-muted-foreground mb-2">Row {rowIndex + 1}</div>}
                  <div className={cn(isInline ? "flex flex-wrap items-end gap-3 flex-1 min-w-0" : "grid gap-2")}>
                    {childFields.map((child) => {
                      const cid = child.id || child.name || child.field_id;
                      const cval = row[cid];
                      return (
                        <div key={cid} className={isInline ? "flex items-center gap-2 min-w-0" : ""}>
                          <span className="text-xs text-muted-foreground shrink-0">{child.label || child.field_label || cid}: </span>
                          <span className="text-sm">{cval != null && cval !== '' ? String(cval) : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        if (isInline) {
          const gridCols = colCount;
          return (
            <div className="space-y-2">
              {!hideLabel && (field.label || field.field_label) && (
                <Label className="text-sm font-medium">{(field.label || field.field_label)}</Label>
              )}
              <div className="border rounded-md p-4">
                <div className="space-y-4">
                  {displayRows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid gap-4 mb-4"
                      style={{
                        gridTemplateColumns: displayRows.length > 1
                          ? `repeat(${gridCols}, minmax(0, 1fr)) auto`
                          : `repeat(${gridCols}, minmax(0, 1fr))`,
                        gap: '1rem',
                        alignItems: 'end',
                      }}
                    >
                      {childFields.map((child) => {
                        const cid = child.id || child.name || child.field_id;
                        if (!cid) return null;
                        return (
                          <div key={cid} className="min-w-0 space-y-1">
                            <CustomFieldRenderer
                              field={{
                                ...child,
                                id: cid,
                                field_type: child.type || child.field_type,
                                type: child.type || child.field_type,
                                field_label: child.label || child.field_label || child.name,
                                field_name: child.name || child.id,
                              }}
                              value={row[cid]}
                              onChange={(id, v) => updateRow(rowIndex, id, v)}
                              readOnly={readOnly}
                              hideLabel={false}
                            />
                          </div>
                        );
                      })}
                      {displayRows.length > 1 && (
                        <div className="flex items-end pb-0.5">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(rowIndex)} className="h-9 shrink-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" variant="default" size="sm" onClick={addRow} className="mt-2 gap-1 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Add More
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {!hideLabel && (field.label || field.field_label) && (
              <Label className="text-sm font-medium">{(field.label || field.field_label)}</Label>
            )}
            <div className="border rounded-md p-4 space-y-4">
              {displayRows.map((row, rowIndex) => (
                <div key={rowIndex} className="rounded-md border p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Row {rowIndex + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(rowIndex)} className="h-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
                    {childFields.map((child) => {
                      const cid = child.id || child.name || child.field_id;
                      if (!cid) return null;
                      return (
                        <CustomFieldRenderer
                          key={cid}
                          field={{
                            ...child,
                            id: cid,
                            field_type: child.type || child.field_type,
                            type: child.type || child.field_type,
                            field_label: child.label || child.field_label || child.name,
                            field_name: child.name || child.id,
                          }}
                          value={row[cid]}
                          onChange={(id, v) => updateRow(rowIndex, id, v)}
                          readOnly={readOnly}
                          hideLabel={false}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button type="button" variant="default" size="sm" onClick={addRow} className="gap-1 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Add More
              </Button>
            </div>
          </div>
        );
      }

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_description || `Enter ${field.field_label || field.name}`}
            className={error ? 'border-red-500' : ''}
            disabled={readOnly}
            readOnly={readOnly}
          />
        );
    }
  };

  // Check if this is a display-only field
  const isDisplayOnly = ['text_block', 'image_block', 'line_break', 'page_break', 'download_link', 'youtube_video_embed'].includes(fieldType?.toLowerCase());

  // For display-only fields, render without the standard label/description wrapper
  if (isDisplayOnly) {
    return renderField();
  }

  return (
    <div className="space-y-2">
      {!effectiveHideLabel && (
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.field_label || field.name}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {field.field_description && (
        <p className="text-sm text-muted-foreground">
          {field.field_description}
        </p>
      )}
      {renderField()}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

// File Field Renderer Component
// Date picker component with optional time selection
const DatePickerWithTime = ({ fieldId, value, onChange, error, readOnly, shouldShowTime }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
      } catch {
        return undefined;
      }
    }
    return undefined;
  });
  
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value && shouldShowTime) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      } catch {
        // Fall through
      }
    }
    return '00:00';
  });

  // Update selectedDate when value changes externally
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          if (shouldShowTime) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            setSelectedTime(`${hours}:${minutes}`);
          }
        } else {
          setSelectedDate(undefined);
        }
      } catch {
        setSelectedDate(undefined);
      }
    } else {
      setSelectedDate(undefined);
      setSelectedTime('00:00');
    }
  }, [value, shouldShowTime]);

  const handleDateSelect = (date) => {
    if (!date) {
      setSelectedDate(undefined);
      onChange('');
      return;
    }
    
    setSelectedDate(date);
    
    // Combine date with time
    if (shouldShowTime && selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      onChange(newDate.toISOString());
    } else {
      // Date only
      onChange(date.toISOString().split('T')[0]);
    }
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      onChange(newDate.toISOString());
    } else {
      // If no date selected yet, create a date with today's date and the selected time
      const today = new Date();
      const [hours, minutes] = time.split(':');
      today.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      setSelectedDate(today);
      onChange(today.toISOString());
    }
  };

  return (
    <div className="space-y-2">
      <div className={cn("grid gap-2", shouldShowTime ? "grid-cols-[1fr_auto]" : "grid-cols-1")}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
                error && "border-red-500"
              )}
              disabled={readOnly}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate 
                ? format(selectedDate, shouldShowTime ? "PPP 'at' HH:mm" : "PPP")
                : <span>Pick a date</span>
              }
            </Button>
          </PopoverTrigger>
          {!readOnly && (
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          )}
        </Popover>
        
        {shouldShowTime && (
          <Input
            type="time"
            value={selectedTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className={cn("w-[140px] font-mono", error && "border-red-500")}
            disabled={readOnly}
            placeholder="Time"
          />
        )}
      </div>
    </div>
  );
};

const FileFieldRenderer = ({ field, value, onChange, error, fieldId }) => {
  const downloadFileMutation = useDownloadFile();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef(null);
  
  // Check if multiple files are allowed
  const allowMultiple = field.field_options?.allowMultiple || false;
  const requireExpiryDate = field.field_options?.requireExpiryDate || false;
  
  // Normalize value to array for easier handling
  // Value can be: File object, {file: File, expiryDate: string}, array of either, or file IDs
  const currentFiles = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  // Track uploaded file info separately from new file selections
  // When value is a number (file_id), it means a file has already been uploaded
  const hasUploadedFile = React.useMemo(() => {
    if (typeof value === 'number') return true;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') return true;
    return false;
  }, [value]);
  
  // Debug logging
  React.useEffect(() => {
    if (field.field_type?.toLowerCase() === 'file') {
      console.log(`[FileFieldRenderer] Field ${field.id} (${field.field_label || field.field_name}):`, {
        value,
        valueType: typeof value,
        isNumber: typeof value === 'number',
        isArray: Array.isArray(value),
        hasUploadedFile,
        currentFilesLength: currentFiles.length,
      });
    }
  }, [field.id, field.field_label, field.field_name, field.field_type, value, hasUploadedFile, currentFiles.length]);

  // Handle file with expiry date structure
  const getFileFromValue = (val) => {
    if (val instanceof File) return { file: val, expiryDate: null };
    if (val && typeof val === 'object' && val.file) return val;
    return null;
  };

  const getExpiryDateFromValue = (val) => {
    if (val && typeof val === 'object' && val.expiryDate) return val.expiryDate;
    return null;
  };

  const updateFileExpiryDate = (index, expiryDate) => {
    const files = [...currentFiles];
    const fileValue = files[index];
    
    if (fileValue instanceof File) {
      files[index] = { file: fileValue, expiryDate };
    } else if (fileValue && typeof fileValue === 'object' && fileValue.file) {
      files[index] = { ...fileValue, expiryDate };
    } else {
      // For file IDs, we can't update expiry date (already uploaded)
      return;
    }
    
    onChange(allowMultiple ? files : files[0]);
  };

  const validateFile = (file) => {
    // Get max size from field_options or validation
    const maxSizeMB = field.field_options?.maxSize || field.validation?.max_size_mb;
    const maxSize = maxSizeMB ? maxSizeMB * 1024 * 1024 : null;
    
    if (maxSize && file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }
    
    // Get allowed types from field_options or validation
    const acceptTypes = field.field_options?.accept || field.validation?.allowed_types;
    if (acceptTypes && acceptTypes !== "*/*") {
      // Handle both array and comma-separated string formats
      const allowedTypes = Array.isArray(acceptTypes)
        ? acceptTypes
        : acceptTypes.split(',').map(type => type.trim());
      
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const mimeType = file.type;
      
      const isAllowed = allowedTypes.some(type => 
        type === mimeType || 
        type === fileExtension ||
        (type.startsWith('.') && fileExtension === type) ||
        (type.includes('*') && mimeType.startsWith(type.replace('*', '')))
      );
      
      if (!isAllowed) {
        const typesDisplay = Array.isArray(acceptTypes) 
          ? acceptTypes.join(', ') 
          : acceptTypes;
        return { valid: false, error: `File type not allowed. Accepted types: ${typesDisplay}` };
      }
    }
    
    return { valid: true };
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const validatedFiles = [];
    const errors = [];
    
    files.forEach((file) => {
      // Check for duplicates in existing files
      const isDuplicate = currentFiles.some(
        (existingFile) => 
          existingFile instanceof File && 
          existingFile.name === file.name && 
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      );
      
      if (isDuplicate) {
        errors.push(`File "${file.name}" is already selected`);
        return;
      }
      
      const validation = validateFile(file);
      if (validation.valid) {
        validatedFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      // Use alert for now since toast might not be available in all contexts
      errors.forEach(error => alert(error));
    }
    
    if (validatedFiles.length > 0) {
      if (allowMultiple) {
        // Add to existing files array (avoid duplicates)
        // Wrap files in objects if expiry date is required
        const newFiles = validatedFiles.map(file => 
          requireExpiryDate ? { file, expiryDate: null } : file
        );
        onChange([...currentFiles, ...newFiles]);
      } else {
        // Single file mode - replace with first file
        // Wrap file in object if expiry date is required
        onChange(requireExpiryDate ? { file: validatedFiles[0], expiryDate: null } : validatedFiles[0]);
      }
    }
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Create a fake event object to reuse the existing handler
      const fakeEvent = {
        target: { files }
      };
      handleFileChange(fakeEvent);
    }
  };
  
  const removeFile = (indexToRemove) => {
    if (allowMultiple) {
      const newFiles = currentFiles.filter((_, index) => index !== indexToRemove);
      onChange(newFiles.length === 0 ? null : newFiles);
    } else {
      onChange(null);
    }
  };

  const handleDownload = () => {
    if (value && typeof value === 'number') {
      downloadFileMutation.mutate(value);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Area with Border */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${error ? 'border-red-500' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id={fieldId}
          type="file"
          multiple={allowMultiple}
          onChange={handleFileChange}
          accept={(() => {
            const acceptTypes = field.field_options?.accept || field.validation?.allowed_types;
            if (!acceptTypes || acceptTypes === "*/*") return "*/*";
            // Convert array to comma-separated string if needed
            return Array.isArray(acceptTypes) ? acceptTypes.join(',') : acceptTypes;
          })()}
          className="hidden"
        />
        
        {/* Already Uploaded File Display - Inside the border */}
        {hasUploadedFile && (
          <div className="space-y-2 mb-4">
            {(() => {
              // Get the file_id(s) - could be a single number or array of numbers
              const fileIds = typeof value === 'number' ? [value] : (Array.isArray(value) ? value.filter(v => typeof v === 'number') : []);
              
              console.log(`[FileFieldRenderer] Displaying uploaded files for field ${field.id} (${field.field_label || field.field_name}):`, {
                value,
                valueType: typeof value,
                fileIds,
                hasUploadedFile,
                fieldType: field.field_type,
              });
              
              if (fileIds.length === 0) {
                console.warn(`[FileFieldRenderer] hasUploadedFile is true but no fileIds found for field ${field.id}`);
                return null;
              }
              
              return fileIds.map((fileId, index) => (
                <div key={`uploaded-${fileId}-${index}`} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📎</span>
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        ✓ File already uploaded
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click download to view
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFileMutation.mutate(fileId);
                      }}
                      disabled={downloadFileMutation.isPending}
                      className="flex items-center space-x-2 border-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    {!allowMultiple && (
                      <span className="text-xs text-muted-foreground italic ml-2">
                        Upload a new file to replace this one
                      </span>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
        
        {/* Upload Area Content */}
        <div 
          className="flex flex-col items-center space-y-2 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-3 rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragOver 
                ? `Drop ${allowMultiple ? 'files' : 'file'} here` 
                : hasUploadedFile 
                  ? `Click to upload a new ${allowMultiple ? 'file' : 'file'} or drag and drop`
                  : `Click to upload or drag and drop ${allowMultiple ? 'files' : 'file'}`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const acceptTypes = field.field_options?.accept || field.validation?.allowed_types;
                const maxSize = field.field_options?.maxSize || field.validation?.max_size_mb;
                
                let message = '';
                if (acceptTypes) {
                  const types = Array.isArray(acceptTypes) 
                    ? acceptTypes.join(', ') 
                    : acceptTypes;
                  message = `Allowed: ${types}`;
                } else {
                  message = 'Any file type';
                }
                
                if (maxSize) {
                  message += ` • Max ${maxSize}MB`;
                }
                
                if (allowMultiple && currentFiles.length > 0) {
                  message += ` • ${currentFiles.length} file${currentFiles.length !== 1 ? 's' : ''} selected`;
                }
                
                return message;
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files Preview (New files being uploaded) */}
      {(() => {
        // Filter out file IDs (numbers) - only show File objects
        const newFiles = currentFiles.filter(file => 
          file instanceof File || (file && typeof file === 'object' && file.file instanceof File)
        );
        return newFiles.length > 0;
      })() && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {hasUploadedFile ? 'New file to upload (will replace existing):' : 'Selected files:'}
          </p>
          {currentFiles
            .filter(file => file instanceof File || (file && typeof file === 'object' && file.file instanceof File))
            .map((file, index) => {
            // Handle File objects
            if (file instanceof File) {
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.name)}</span>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              );
            }
            // Handle file objects with expiry date structure
            if (file && typeof file === 'object' && file.file instanceof File) {
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.file.name)}</span>
                    <div>
                      <p className="text-sm font-medium">{file.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                        {file.expiryDate && ` • Expires: ${file.expiryDate}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      
      {/* File Info from API Response (if value is a file object with metadata) */}
      {value && typeof value === 'object' && value.file_name && !(value instanceof File) && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(value.file_name)}</span>
            <div>
              <p className="text-sm font-medium">{value.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {value.file_size_bytes && formatFileSize(value.file_size_bytes)}
                {value.content_type && ` • ${value.content_type}`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadFileMutation.mutate(value.id || value.file_id)}
            disabled={downloadFileMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      )}
    </div>
  );
};

/** Draw on a background image; submitted value is a PNG data URL (background + strokes). */
const ImageFreeDrawFieldRenderer = ({ field, value, onChange, error, readOnly }) => {
  const fileRef =
    field.background_image_file_reference_id ||
    field.field_background_image_file_reference_id ||
    '';
  const rawBackgroundUrl = (
    field.background_image_url ||
    field.field_background_image_url ||
    field.image_url ||
    field.field_image_url ||
    ''
  ).trim();
  const altText = field.background_alt_text || field.field_alt_text || field.alt_text || '';

  const imgRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [resolvedBgUrl, setResolvedBgUrl] = React.useState(null);
  const [resolveLoading, setResolveLoading] = React.useState(false);
  /** Linear undo: stack of committed composite data URLs (or null); index = current. */
  const drawHistoryRef = React.useRef({ stack: [value ?? null], index: 0 });
  const [, historyTick] = React.useReducer((n) => n + 1, 0);

  React.useEffect(() => {
    let cancelled = false;
    async function resolveBackground() {
      if (value && typeof value === 'string' && value.startsWith('data:image')) {
        setResolvedBgUrl(null);
        setResolveLoading(false);
        return;
      }
      setResolveLoading(true);
      setResolvedBgUrl(null);
      try {
        const ref = String(fileRef || '').trim();
        if (ref) {
          const data = await profileService.downloadFile(ref);
          if (cancelled) return;
          setResolvedBgUrl(data?.download_url || null);
          return;
        }
        if (!rawBackgroundUrl) {
          if (!cancelled) setResolvedBgUrl(null);
          return;
        }
        const mistakenJsonEndpointSlug = extractFileReferenceSlugFromStoredBackground(rawBackgroundUrl);
        if (mistakenJsonEndpointSlug) {
          const data = await profileService.downloadFile(mistakenJsonEndpointSlug);
          if (cancelled) return;
          setResolvedBgUrl(data?.download_url || null);
          return;
        }
        if (/^https?:\/\//i.test(rawBackgroundUrl)) {
          if (!cancelled) setResolvedBgUrl(rawBackgroundUrl);
          return;
        }
      } catch {
        if (!cancelled) setResolvedBgUrl(null);
      } finally {
        if (!cancelled) setResolveLoading(false);
      }
    }
    resolveBackground();
    return () => {
      cancelled = true;
    };
  }, [fileRef, rawBackgroundUrl, value]);

  const fieldIdentity = field.id ?? field.field_id ?? field.name ?? '';

  React.useEffect(() => {
    drawHistoryRef.current = { stack: [value ?? null], index: 0 };
    historyTick();
  }, [fieldIdentity]);

  React.useEffect(() => {
    const h = drawHistoryRef.current;
    const onlyNull = h.stack.length === 1 && (h.stack[0] === null || h.stack[0] === undefined);
    if (onlyNull && value) {
      h.stack = [value];
      h.index = 0;
      historyTick();
    }
  }, [value, fieldIdentity]);

  const displaySrc =
    value && typeof value === 'string' && value.startsWith('data:image')
      ? value
      : resolvedBgUrl || '';

  const syncCanvasSize = React.useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const w = img.offsetWidth || Math.round(canvas.getBoundingClientRect().width);
    const h = img.offsetHeight || Math.round(canvas.getBoundingClientRect().height);
    if (w < 2 || h < 2) return;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  React.useEffect(() => {
    const onResize = () => syncCanvasSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncCanvasSize]);

  React.useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => syncCanvasSize());
    ro.observe(img);
    return () => ro.disconnect();
  }, [syncCanvasSize, displaySrc]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX;
    let clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const compositeAndSubmit = React.useCallback(() => {
    const drawCanvas = canvasRef.current;
    if (!drawCanvas || !displaySrc) return;
    const w = drawCanvas.width;
    const h = drawCanvas.height;
    if (w < 2 || h < 2) return;

    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const octx = out.getContext('2d');
    const base = new Image();
    if (!displaySrc.startsWith('data:')) {
      base.crossOrigin = 'anonymous';
    }
    const commit = (dataUrl) => {
      const dh = drawHistoryRef.current;
      const stack = dh.stack.slice(0, dh.index + 1);
      stack.push(dataUrl);
      dh.stack = stack;
      dh.index = stack.length - 1;
      const dctx = drawCanvas.getContext('2d');
      dctx.clearRect(0, 0, w, h);
      onChange(dataUrl);
      historyTick();
    };
    base.onload = () => {
      octx.drawImage(base, 0, 0, w, h);
      octx.drawImage(drawCanvas, 0, 0);
      commit(out.toDataURL('image/png'));
    };
    base.onerror = () => {
      octx.drawImage(drawCanvas, 0, 0);
      commit(out.toDataURL('image/png'));
    };
    base.src = displaySrc;
  }, [displaySrc, onChange]);

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    compositeAndSubmit();
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawHistoryRef.current = { stack: [null], index: 0 };
    onChange(null);
    historyTick();
  };

  const undo = () => {
    const h = drawHistoryRef.current;
    if (h.index <= 0) return;
    h.index -= 1;
    onChange(h.stack[h.index]);
    historyTick();
  };

  const redo = () => {
    const h = drawHistoryRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index += 1;
    onChange(h.stack[h.index]);
    historyTick();
  };

  const hist = drawHistoryRef.current;
  const canUndo = hist.index > 0;
  const canRedo = hist.index < hist.stack.length - 1;

  if (readOnly) {
    if (value && typeof value === 'string' && value.startsWith('data:image')) {
      return (
        <div className="space-y-2 w-full">
          <img
            src={value}
            alt={altText || 'Drawing'}
            className="max-w-full h-auto border rounded-md bg-background"
            style={{ maxHeight: '320px' }}
          />
        </div>
      );
    }
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  const hasBackgroundConfig =
    !!(String(fileRef || '').trim() || rawBackgroundUrl) ||
    !!(value && String(value).startsWith('data:image'));

  if (!hasBackgroundConfig) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-500">
        This field has no background image configured. Ask an administrator to set a background image in the form or tracker settings.
      </p>
    );
  }

  if (resolveLoading && !displaySrc) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading background image…
      </div>
    );
  }

  if (!displaySrc) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load the background image. If it was uploaded, the file reference may be invalid.
      </p>
    );
  }

  return (
    <div className="w-full space-y-2 self-start">
      {/* Grid: image and canvas share one cell so the diagram is one surface (bg behind strokes). */}
      <div
        className="grid w-full max-w-full overflow-hidden rounded-md border-2 border-border leading-[0] [&>*]:col-start-1 [&>*]:row-start-1"
        style={{ touchAction: 'none' }}
      >
        <img
          ref={imgRef}
          src={displaySrc}
          alt={altText || 'Background'}
          className="m-0 block h-auto w-full max-w-full select-none bg-transparent p-0 align-top pointer-events-none"
          crossOrigin={displaySrc.startsWith('data:') ? undefined : 'anonymous'}
          onLoad={syncCanvasSize}
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="z-10 m-0 block h-full w-full min-h-0 min-w-0 cursor-crosshair bg-transparent p-0 pointer-events-auto"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Draw directly on the image; release to apply. Undo and redo step through strokes.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={undo} disabled={!canUndo} title="Undo">
            <Undo2 className="mr-1 h-4 w-4" />
            Undo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={redo} disabled={!canRedo} title="Redo">
            <Redo2 className="mr-1 h-4 w-4" />
            Redo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearAll}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Signature Field Renderer Component
const SignatureFieldRenderer = ({ field, value, onChange, error, fieldId }) => {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(!!value);

  React.useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  // Get coordinates from event (mouse or touch)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      // Touch end event
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL('image/png');
      onChange(signatureData);
      setHasSignature(true);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange(null);
      setHasSignature(false);
    }
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set canvas size based on container
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (container) {
          const containerWidth = container.clientWidth || 600;
          // Maintain aspect ratio (3:1)
          canvas.width = containerWidth;
          canvas.height = Math.max(150, containerWidth / 3);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          
          // Re-apply drawing settings after resize
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Redraw existing signature if any
          if (value) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = value;
          }
        }
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [value]);

  return (
    <div className="space-y-2 w-full">
      <div className="w-full overflow-hidden" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          className="border-2 border-border rounded-md cursor-crosshair bg-white w-full"
          style={{ 
            touchAction: 'none',
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {hasSignature ? 'Signature captured' : 'Sign above'}
        </p>
        {hasSignature && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

function peopleFieldParseUserId(value) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return parseInt(value.trim(), 10);
  if (typeof value === "object" && value.id != null) {
    const id = value.id;
    if (typeof id === "number" && Number.isFinite(id)) return id;
    if (typeof id === "string" && /^\d+$/.test(id.trim())) return parseInt(id.trim(), 10);
  }
  return null;
}

function peopleFieldValueHasDisplay(value) {
  if (!value || typeof value !== "object") return false;
  return !!(
    value.display_name ||
    value.first_name ||
    value.last_name ||
    value.email
  );
}

/** Non-numeric slug only — numeric strings are treated as ids, not path segments. */
function peopleFieldParseSlug(value) {
  if (!value || typeof value !== "object") return null;
  const s = value.slug;
  if (typeof s !== "string" || !s.trim()) return null;
  const t = s.trim();
  if (/^\d+$/.test(t)) return null;
  return t;
}

// People Field Renderer Component
const PeopleFieldRenderer = ({ field, value, onChange, error, fieldId, readOnly }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resolvingUser, setResolvingUser] = useState(false);

  // Field configuration
  const filterByOrganization = field.filter_by_organization || field.filterByOrganization;
  const filterByRoles = field.filter_by_roles || field.filterByRoles || [];
  const roleIds = Array.isArray(filterByRoles) ? filterByRoles.map(r => typeof r === 'object' ? r.id : r).filter(Boolean).join(',') : '';

  // Load selected user when value changes (resolve id-only values from saved submissions)
  useEffect(() => {
    let cancelled = false;

    if (value && typeof value === "object" && peopleFieldValueHasDisplay(value) && value.id != null) {
      setSelectedUser({
        id: value.id,
        email: value.email,
        display_name: value.display_name,
        first_name: value.first_name,
        last_name: value.last_name,
      });
      setResolvingUser(false);
      return () => {
        cancelled = true;
      };
    }

    const slug = peopleFieldParseSlug(value);
    const uid = peopleFieldParseUserId(value);

    if (slug == null && uid == null) {
      setSelectedUser(null);
      setResolvingUser(false);
      return () => {
        cancelled = true;
      };
    }

    const applyUser = (u) => {
      if (cancelled || !u?.id) return;
      setSelectedUser({
        id: u.id,
        email: u.email,
        display_name:
          u.display_name ||
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          u.email,
        first_name: u.first_name,
        last_name: u.last_name,
      });
    };

    setResolvingUser(true);
    if (uid != null) {
      setSelectedUser({ id: uid });
    } else {
      setSelectedUser(null);
    }

    const resolvePromise = slug
      ? usersService.getUser(slug).then((res) => res?.data?.data ?? res?.data)
      : usersService.resolveUserByListLookup(uid);

    resolvePromise
      .then((u) => applyUser(u))
      .catch(() => {
        /* keep id placeholder; button still shows User #id */
      })
      .finally(() => {
        if (!cancelled) setResolvingUser(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  // Search users when search term changes
  useEffect(() => {
    if (!isOpen) return;
    
    const searchUsers = async () => {
      if (searchTerm.length < 2 && !searchTerm) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await usersService.suggestUsers({
          search: searchTerm,
          role_ids: roleIds || undefined,
          is_active: true,
          per_page: 20,
        });
        setUsers(response.data?.users || []);
      } catch (error) {
        console.error("Failed to search users:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, isOpen, roleIds]);

  // Load initial users when dropdown opens
  useEffect(() => {
    if (isOpen && !searchTerm) {
      setIsLoading(true);
      usersService.suggestUsers({
        role_ids: roleIds || undefined,
        is_active: true,
        per_page: 20,
      })
        .then((response) => {
          setUsers(response.data?.users || []);
        })
        .catch((error) => {
          console.error("Failed to load users:", error);
          setUsers([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, roleIds]);

  const handleUserSelect = (user) => {
    const userValue = {
      id: user.id,
      slug: user.slug,
      display_name: getUserDisplayName(user),
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    };
    setSelectedUser(userValue);
    onChange(userValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedUser(null);
    onChange(null);
    setSearchTerm("");
  };

  const displayValue = selectedUser ? getUserDisplayName(selectedUser) : "";

  if (readOnly) {
    return (
      <div className={cn("px-3 py-2 border rounded-md bg-muted", error && "border-red-500")}>
        {resolvingUser ? (
          <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </span>
        ) : (
          displayValue || <span className="text-muted-foreground">No user selected</span>
        )}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            !selectedUser && "text-muted-foreground",
            error && "border-red-500"
          )}
        >
          <span className="truncate">
            {resolvingUser ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading…
              </span>
            ) : (
              displayValue || `Select ${field.field_label || field.name || "user"}`
            )}
          </span>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
            {selectedUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="max-h-[300px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {searchTerm ? "No users found" : "Start typing to search users"}
              </div>
            ) : (
              <div className="p-1">
                {users.map((user) => {
                  const userDisplayName = getUserDisplayName(user);
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{userDisplayName}</span>
                        {user.email && user.email !== userDisplayName ? (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        ) : null}
                      </div>
                      {isSelected && (
                        <span className="ml-2 text-primary">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CustomFieldRenderer;

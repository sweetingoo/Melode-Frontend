"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shouldShowTimeForDateField } from "@/utils/dateFieldUtils";

export const ComplianceUploadModal = ({
  open,
  onOpenChange,
  field,
  entityType,
  entitySlug,
  onUpload,
  isRenewal = false,
  existingValue = null,
}) => {
  const [file, setFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [renewalDate, setRenewalDate] = useState(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  // Sub-field values for grouped compliance fields
  const [subFieldValues, setSubFieldValues] = useState({});
  
  // Get sub-field definitions from field - use useMemo to ensure it's recalculated when field changes
  const subFieldDefinitions = useMemo(() => {
    let definitions = [];
    
    // First, try to get from field.sub_field_definitions (from API response)
    if (field?.sub_field_definitions) {
      if (Array.isArray(field.sub_field_definitions)) {
        definitions = field.sub_field_definitions;
      } else if (field.sub_field_definitions && typeof field.sub_field_definitions === 'object') {
        // If it's not an array but an object, try to convert
        definitions = Object.values(field.sub_field_definitions);
      }
    }
    // Fallback: If sub_field_definitions is empty, try getting from compliance_config
    if (definitions.length === 0 && field?.compliance_config) {
      if (field.compliance_config.has_sub_fields && field.compliance_config.sub_fields) {
        if (Array.isArray(field.compliance_config.sub_fields)) {
          definitions = field.compliance_config.sub_fields;
        }
      }
    }
    
    return definitions;
  }, [field]);
  
  const hasSubFields = subFieldDefinitions.length > 0;
  
  // Check if any sub-field is an expiry date field
  const hasExpiryDateSubField = useMemo(() => {
    if (!hasSubFields) return false;
    const expiryFieldNames = ['expiry_date', 'date_of_expiry', 'expiry', 'expirydate', 'expirydate', 'expires'];
    const expiryFieldLabels = ['expiry date', 'date of expiry', 'date of expires', 'expiry', 'expires', 'expiration date'];
    
    return subFieldDefinitions.some(subField => {
      const fieldName = (subField.field_name || '').toLowerCase().replace(/[_\s-]/g, '');
      const fieldLabel = (subField.field_label || '').toLowerCase();
      const fieldType = subField.field_type;
      
      // Check if it's a date field with expiry-related name/label
      // Match both field_name and field_label to catch variations
      const nameMatches = expiryFieldNames.some(name => 
        fieldName.includes(name.toLowerCase().replace(/[_\s-]/g, ''))
      );
      const labelMatches = expiryFieldLabels.some(label => 
        fieldLabel.includes(label.toLowerCase())
      );
      
      return fieldType === 'date' && (nameMatches || labelMatches);
    });
  }, [hasSubFields, subFieldDefinitions]);
  
  // Debug: Log field data when modal opens
  useEffect(() => {
    if (open && field) {
      console.log("=== ComplianceUploadModal OPENED ===");
      console.log("Field prop:", field);
      console.log("Field.sub_field_definitions:", field.sub_field_definitions);
      console.log("Field.compliance_config:", field.compliance_config);
      console.log("Computed subFieldDefinitions:", subFieldDefinitions);
      console.log("hasSubFields:", hasSubFields);
      console.log("subFieldDefinitions.length:", subFieldDefinitions.length);
      
      // Log each subfield in detail
      if (subFieldDefinitions.length > 0) {
        console.log("=== SubFields Details ===");
        subFieldDefinitions.forEach((subField, idx) => {
          console.log(`SubField ${idx} "${subField.field_label}":`, {
            field_name: subField.field_name,
            field_label: subField.field_label,
            field_type: subField.field_type,
            field_options: subField.field_options,
            has_field_options: !!subField.field_options,
            options_structure: subField.field_options?.options ? 'has options array' : 'no options array',
            options_count: subField.field_options?.options?.length || 0,
            full_subField: subField
          });
        });
      } else {
        console.warn("⚠️ NO SUBFIELDS FOUND! Field data:", {
          field_name: field.field_name,
          has_sub_field_definitions: !!field.sub_field_definitions,
          sub_field_definitions_type: typeof field.sub_field_definitions,
          sub_field_definitions_is_array: Array.isArray(field.sub_field_definitions),
          sub_field_definitions: field.sub_field_definitions
        });
      }
    }
  }, [open, field, subFieldDefinitions, hasSubFields]);
  
  // Initialize sub-field values from existing value if renewal or editing
  useEffect(() => {
    if ((isRenewal || existingValue) && existingValue?.value_data) {
      const existingData = existingValue.value_data;
      const initialValues = {};
      subFieldDefinitions.forEach((subField) => {
        if (existingData[subField.field_name] !== undefined) {
          initialValues[subField.field_name] = existingData[subField.field_name];
        }
      });
      setSubFieldValues(initialValues);
      console.log("Initialized subFieldValues from existing value:", initialValues);
    } else {
      setSubFieldValues({});
    }
  }, [isRenewal, existingValue, subFieldDefinitions]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubFieldChange = (fieldName, value) => {
    setSubFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const renderSubField = (subField) => {
    const value = subFieldValues[subField.field_name] || "";
    
    // Debug: Log field_options structure for select fields
    if ((subField.field_type === "select" || subField.field_type === "multiselect" || subField.field_type === "radio") && !subField.field_options?.options) {
      console.warn(`Select field "${subField.field_label}" (${subField.field_name}) missing field_options:`, {
        field_type: subField.field_type,
        field_options: subField.field_options,
        subField: subField
      });
    }
    
    switch (subField.field_type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            key={subField.field_name}
            id={subField.field_name}
            type={subField.field_type === "email" ? "email" : subField.field_type === "phone" ? "tel" : "text"}
            value={value}
            onChange={(e) => handleSubFieldChange(subField.field_name, e.target.value)}
            placeholder={subField.placeholder || subField.field_label}
            required={subField.is_required}
          />
        );
      case "number":
        return (
          <Input
            key={subField.field_name}
            id={subField.field_name}
            type="number"
            value={value}
            onChange={(e) => handleSubFieldChange(subField.field_name, e.target.value ? parseFloat(e.target.value) : "")}
            placeholder={subField.placeholder || subField.field_label}
            required={subField.is_required}
          />
        );
      case "date":
        // Determine if time should be shown based on field label
        const shouldShowTime = shouldShowTimeForDateField(subField);
        // Convert value to appropriate format
        let dateInputValue = '';
        if (value) {
          if (value instanceof Date) {
            dateInputValue = shouldShowTime 
              ? value.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm for datetime-local
              : value.toISOString().split('T')[0]; // YYYY-MM-DD for date
          } else {
            const date = new Date(value);
            dateInputValue = shouldShowTime
              ? date.toISOString().slice(0, 16)
              : date.toISOString().split('T')[0];
          }
        }
        return (
          <Input
            key={subField.field_name}
            id={subField.field_name}
            type={shouldShowTime ? "datetime-local" : "date"}
            value={dateInputValue}
            onChange={(e) => handleSubFieldChange(subField.field_name, e.target.value || null)}
            placeholder={subField.placeholder || subField.field_label}
            required={subField.is_required}
          />
        );
      case "select":
      case "multiselect":
      case "radio":
        // Get options from field_options - try multiple formats
        let options = [];
        
        if (subField.field_options) {
          if (Array.isArray(subField.field_options)) {
            // field_options is directly an array
            options = subField.field_options;
          } else if (subField.field_options.options && Array.isArray(subField.field_options.options)) {
            // field_options is an object with options property
            options = subField.field_options.options;
          } else if (typeof subField.field_options === 'object') {
            // Try to extract options from object
            options = Object.values(subField.field_options).find(v => Array.isArray(v)) || [];
          }
        }
        
        // Debug log for select fields
        console.log(`Select field "${subField.field_label}" options:`, {
          field_options: subField.field_options,
          extracted_options: options,
          options_count: options.length,
          options_type: typeof options,
          is_array: Array.isArray(options)
        });
        
        // If options is empty or not an array, show a message with debug info
        if (!Array.isArray(options) || options.length === 0) {
          return (
            <div className="text-sm text-muted-foreground p-2 border rounded bg-yellow-50">
              <p className="font-semibold">No options configured for this field.</p>
              <p className="text-xs mt-1">Please configure options in the field settings.</p>
              <details className="text-xs mt-2">
                <summary className="cursor-pointer">Debug Info</summary>
                <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                  {JSON.stringify({
                    field_name: subField.field_name,
                    field_type: subField.field_type,
                    field_options: subField.field_options,
                    full_subField: subField
                  }, null, 2)}
                </pre>
              </details>
            </div>
          );
        }
        
        return (
          <Select
            key={subField.field_name}
            value={value || undefined}
            onValueChange={(val) => handleSubFieldChange(subField.field_name, val)}
            required={subField.is_required}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={subField.placeholder || `Select ${subField.field_label}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option, index) => {
                // Handle both object and primitive options
                let optionValue;
                let optionLabel;
                
                if (typeof option === "object" && option !== null) {
                  optionValue = option.value;
                  optionLabel = option.label || option.value;
                } else {
                  optionValue = option;
                  optionLabel = option;
                }
                
                // Ensure value is never an empty string
                const safeValue = (optionValue === "" || optionValue === null || optionValue === undefined)
                  ? `option-${index}`
                  : String(optionValue);
                
                return (
                  <SelectItem key={`${subField.field_name}-${safeValue}-${index}`} value={safeValue}>
                    {optionLabel || safeValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      case "textarea":
        return (
          <Textarea
            key={subField.field_name}
            id={subField.field_name}
            value={value}
            onChange={(e) => handleSubFieldChange(subField.field_name, e.target.value)}
            placeholder={subField.placeholder || subField.field_label}
            required={subField.is_required}
            rows={3}
          />
        );
      default:
        return (
          <Input
            key={subField.field_name}
            id={subField.field_name}
            type="text"
            value={value}
            onChange={(e) => handleSubFieldChange(subField.field_name, e.target.value)}
            placeholder={subField.placeholder || subField.field_label}
            required={subField.is_required}
          />
        );
    }
  };

  const handleSubmit = async () => {
    console.log("=== handleSubmit called ===", {
      hasSubFields,
      subFieldDefinitions_count: subFieldDefinitions.length,
      subFieldValues,
      file,
      isRenewal,
      requires_file_upload: field?.compliance_config?.requires_file_upload
    });
    
    // Only require file if field requires file upload and it's not a renewal
    const requiresFile = field?.compliance_config?.requires_file_upload !== false;
    if (!file && !isRenewal && requiresFile) {
      alert("Please upload a file to submit this compliance field.");
      console.warn("Submission blocked: File required but not provided");
      return;
    }
    
    // Validate required sub-fields
    if (hasSubFields && subFieldDefinitions.length > 0) {
      const missingRequiredFields = [];
      for (const subField of subFieldDefinitions) {
        const value = subFieldValues[subField.field_name];
        if (subField.is_required && (!value || value === "" || value === null || value === undefined)) {
          missingRequiredFields.push(subField.field_label);
        }
      }
      
      if (missingRequiredFields.length > 0) {
        alert(`Please fill in required fields: ${missingRequiredFields.join(", ")}`);
        console.warn("Submission blocked: Missing required fields:", missingRequiredFields);
        return;
      }
    }

    console.log("Submitting with data:", {
      fieldSlug: field.slug,
      subFieldValues,
      file: file ? file.name : null,
      expiryDate,
      renewalDate,
      notes
    });

    setIsUploading(true);
    try {
      const uploadData = {
        fieldSlug: field.slug,
        entityType,
        entitySlug,
        file: file,
        expiryDate: expiryDate ? expiryDate.toISOString() : null,
        renewalDate: renewalDate ? renewalDate.toISOString() : null,
        notes: notes || null,
        subFieldValues: hasSubFields && subFieldDefinitions.length > 0 ? subFieldValues : null,
      };

      await onUpload(uploadData);
      // Reset form
      setFile(null);
      setExpiryDate(null);
      setRenewalDate(null);
      setNotes("");
      setSubFieldValues({});
      onOpenChange(false);
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Failed to submit: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isRenewal ? "Renew Compliance Document" : "Submit Compliance Details"}
          </DialogTitle>
          <DialogDescription>
            {field.field_label || field.field_name}
            {field.field_description && ` - ${field.field_description}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Sub-fields for grouped compliance (e.g., Passport fields) */}
          {hasSubFields ? (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold text-sm">Compliance Details</h4>
              {subFieldDefinitions && Array.isArray(subFieldDefinitions) && subFieldDefinitions.length > 0 ? (
                subFieldDefinitions.map((subField, index) => {
                  // Debug: Log ALL subfield data for troubleshooting
                  console.log(`SubField ${index} "${subField.field_label}":`, {
                    field_name: subField.field_name,
                    field_type: subField.field_type,
                    field_label: subField.field_label,
                    field_options: subField.field_options,
                    has_field_options: !!subField.field_options,
                    has_options_array: !!subField.field_options?.options,
                    options_count: subField.field_options?.options?.length || 0,
                    is_required: subField.is_required,
                    full_subField: JSON.parse(JSON.stringify(subField)) // Deep clone for logging
                  });
                  
                  return (
                    <div key={subField.field_name || index} className="space-y-2">
                      <Label htmlFor={subField.field_name}>
                        {subField.field_label || `Field ${index + 1}`}
                        {subField.is_required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {renderSubField(subField)}
                      {subField.help_text && (
                        <p className="text-xs text-muted-foreground">{subField.help_text}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground p-2">
                  No sub-fields found in subFieldDefinitions array.
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30">
              <p className="font-semibold text-destructive">No sub-fields found for this compliance field.</p>
              <details className="text-xs mt-2">
                <summary className="cursor-pointer font-medium">Debug Info - Click to expand</summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify({ 
                    field_name: field?.field_name,
                    field_label: field?.field_label,
                    has_sub_field_definitions: !!field?.sub_field_definitions,
                    sub_field_definitions_type: Array.isArray(field?.sub_field_definitions) ? 'array' : typeof field?.sub_field_definitions,
                    sub_field_definitions_count: field?.sub_field_definitions?.length || 0,
                    sub_field_definitions: field?.sub_field_definitions,
                    compliance_config_has_sub_fields: field?.compliance_config?.has_sub_fields,
                    compliance_config_sub_fields_count: field?.compliance_config?.sub_fields?.length || 0,
                    compliance_config_sub_fields: field?.compliance_config?.sub_fields,
                    computed_subFieldDefinitions_count: subFieldDefinitions.length,
                    computed_subFieldDefinitions: subFieldDefinitions,
                    full_field: field
                  }, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* File Upload - Only show if field requires file upload */}
          {!isRenewal && field?.compliance_config?.requires_file_upload !== false && (
            <div className="space-y-2">
              <Label htmlFor="file">Document File *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required={field?.compliance_config?.requires_file_upload !== false}
              />
              {file && (
                <p className="text-sm text-muted-foreground">Selected: {file.name}</p>
              )}
              {!file && (
                <p className="text-xs text-muted-foreground">A file is required to submit this compliance field.</p>
              )}
            </div>
          )}
          
          {/* Show message if file is not required but subfields are missing */}
          {!hasSubFields && field?.compliance_config?.has_sub_fields && (
            <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">Warning: Sub-fields are configured but not available.</p>
              <p className="text-xs text-yellow-700 mt-1">You may still be able to submit, but some field data may be missing.</p>
            </div>
          )}

          {/* Expiry Date - Only show if there's no expiry date sub-field */}
          {!hasExpiryDateSubField && (
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate ? (expiryDate instanceof Date ? expiryDate.toISOString().split('T')[0] : new Date(expiryDate).toISOString().split('T')[0]) : ''}
                onChange={(e) => setExpiryDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          )}

          {/* Renewal Date */}
          <div className="space-y-2">
            <Label htmlFor="renewalDate">Renewal Date (Optional)</Label>
            <Input
              id="renewalDate"
              type="date"
              value={renewalDate ? (renewalDate instanceof Date ? renewalDate.toISOString().split('T')[0] : new Date(renewalDate).toISOString().split('T')[0]) : ''}
              onChange={(e) => setRenewalDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || (!file && !isRenewal && field?.compliance_config?.requires_file_upload !== false)}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {isRenewal ? "Renew" : "Submit"}
              </>
            )}
          </Button>
          {/* Debug info for button state */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground mt-2">
              Button disabled: {isUploading || (!file && !isRenewal && field?.compliance_config?.requires_file_upload !== false) ? 'Yes' : 'No'}
              {!file && !isRenewal && field?.compliance_config?.requires_file_upload !== false && (
                <span className="block">Reason: File required</span>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

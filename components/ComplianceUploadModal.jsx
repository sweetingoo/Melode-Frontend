"use client";

import React, { useState, useEffect } from "react";
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
  
  // Get sub-field definitions from field
  const subFieldDefinitions = field?.sub_field_definitions || [];
  const hasSubFields = subFieldDefinitions.length > 0;
  
  // Initialize sub-field values from existing value if renewal
  useEffect(() => {
    if (isRenewal && existingValue?.value_data) {
      const existingData = existingValue.value_data;
      const initialValues = {};
      subFieldDefinitions.forEach((subField) => {
        if (existingData[subField.field_name] !== undefined) {
          initialValues[subField.field_name] = existingData[subField.field_name];
        }
      });
      setSubFieldValues(initialValues);
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
        // Convert value to YYYY-MM-DD format for native date input
        const dateInputValue = value ? (value instanceof Date ? value.toISOString().split('T')[0] : new Date(value).toISOString().split('T')[0]) : '';
        return (
          <Input
            key={subField.field_name}
            id={subField.field_name}
            type="date"
            value={dateInputValue}
            onChange={(e) => handleSubFieldChange(subField.field_name, e.target.value || null)}
            placeholder={subField.placeholder || subField.field_label}
            required={subField.is_required}
          />
        );
      case "select":
        return (
          <Select
            key={subField.field_name}
            value={value}
            onValueChange={(val) => handleSubFieldChange(subField.field_name, val)}
            required={subField.is_required}
          >
            <SelectTrigger>
              <SelectValue placeholder={subField.placeholder || `Select ${subField.field_label}`} />
            </SelectTrigger>
            <SelectContent>
              {subField.field_options?.options?.map((option) => (
                <SelectItem key={typeof option === "object" ? option.value : option} value={typeof option === "object" ? option.value : option}>
                  {typeof option === "object" ? option.label : option}
                </SelectItem>
              ))}
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
    // Only require file if field requires file upload and it's not a renewal
    const requiresFile = field?.compliance_config?.requires_file_upload !== false;
    if (!file && !isRenewal && requiresFile) {
      return;
    }
    
    // Validate required sub-fields
    if (hasSubFields) {
      for (const subField of subFieldDefinitions) {
        if (subField.is_required && !subFieldValues[subField.field_name]) {
          alert(`Please fill in required field: ${subField.field_label}`);
          return;
        }
      }
    }

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
        subFieldValues: hasSubFields ? subFieldValues : null,
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isRenewal ? "Renew Compliance Document" : "Upload Compliance Document"}
          </DialogTitle>
          <DialogDescription>
            {field.field_label || field.field_name}
            {field.field_description && ` - ${field.field_description}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Sub-fields for grouped compliance (e.g., Passport fields) */}
          {hasSubFields && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold text-sm">Compliance Details</h4>
              {subFieldDefinitions.map((subField) => (
                <div key={subField.field_name} className="space-y-2">
                  <Label htmlFor={subField.field_name}>
                    {subField.field_label}
                    {subField.is_required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderSubField(subField)}
                  {subField.help_text && (
                    <p className="text-xs text-muted-foreground">{subField.help_text}</p>
                  )}
                </div>
              ))}
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
              />
              {file && (
                <p className="text-sm text-muted-foreground">Selected: {file.name}</p>
              )}
            </div>
          )}

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate ? (expiryDate instanceof Date ? expiryDate.toISOString().split('T')[0] : new Date(expiryDate).toISOString().split('T')[0]) : ''}
              onChange={(e) => setExpiryDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>

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
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {isRenewal ? "Renew" : "Upload"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Download, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const ComplianceHistory = ({
  open,
  onOpenChange,
  field,
  history,
  isLoading,
  onDownload,
  isAdmin = false,
}) => {
  // Humanize field value based on field type and options
  const humanizeFieldValue = (field, value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const fieldType = field?.field_type || field?.type;
    
    // Handle date fields
    if (fieldType === "date" && value) {
      try {
        return format(new Date(value), "MMM d, yyyy");
      } catch (e) {
        return String(value);
      }
    }
    
    // Handle datetime fields
    if (fieldType === "datetime" && value) {
      try {
        return format(new Date(value), "MMM d, yyyy HH:mm");
      } catch (e) {
        return String(value);
      }
    }
    
    // Handle select fields - show label if available
    if ((fieldType === "select" || fieldType === "radio") && field?.field_options?.options) {
      const options = field.field_options.options || [];
      const option = options.find((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return String(opt.value) === String(value);
        }
        return String(opt) === String(value);
      });
      
      if (option) {
        if (typeof option === "object" && option !== null) {
          return option.label || option.value || String(value);
        }
        return String(option);
      }
      return String(value);
    }
    
    // Handle multiselect fields
    if (fieldType === "multiselect" && field?.field_options?.options) {
      const options = field.field_options.options || [];
      if (Array.isArray(value)) {
        return value.map(v => {
          const option = options.find((opt) => {
            if (typeof opt === "object" && opt !== null) {
              return String(opt.value) === String(v);
            }
            return String(opt) === String(v);
          });
          if (option) {
            if (typeof option === "object" && option !== null) {
              return option.label || option.value || String(v);
            }
            return String(option);
          }
          return String(v);
        }).join(", ");
      }
      return String(value);
    }
    
    // Handle boolean fields
    if (fieldType === "boolean") {
      if (value === true || value === "true" || value === 1) {
        return "Yes";
      }
      if (value === false || value === "false" || value === 0) {
        return "No";
      }
      return String(value);
    }
    
    // Handle people/user fields
    if ((fieldType === "people" || fieldType === "user") && typeof value === "object" && value !== null) {
      if (value.display_name) {
        return value.display_name;
      }
      const nameParts = [];
      if (value.first_name) nameParts.push(value.first_name);
      if (value.last_name) nameParts.push(value.last_name);
      if (nameParts.length > 0) {
        return nameParts.join(" ");
      }
      if (value.email) {
        return value.email;
      }
      if (value.id) {
        return `User #${value.id}`;
      }
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    // Default: return string representation
    return String(value);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Compliance History</DialogTitle>
          <DialogDescription>
            {field.field_label || field.field_name} - Historical records
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id || index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {format(new Date(item.archived_at || item.updated_at || item.created_at), "dd MMM yyyy HH:mm")}
                        </span>
                        {getStatusBadge(item.approval_status)}
                        {item.is_active !== undefined && (
                          <Badge variant={item.is_active ? "default" : "outline"}>
                            {item.is_active ? "Current" : "Historical"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="capitalize">{item.archived_reason || (item.is_active ? "Current value" : "Previous value")}</span>
                        {item.uploaded_by_name && (
                          <span className="ml-2">
                            by <User className="inline h-3 w-3 mr-1" />
                            {item.uploaded_by_name}
                          </span>
                        )}
                      </div>
                      {item.expiry_date && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Expired: {format(new Date(item.expiry_date), "dd MMM yyyy")}
                        </div>
                      )}
                      
                      {/* Sub-field values (e.g., Passport details) */}
                      {item.sub_field_definitions && item.sub_field_definitions.length > 0 && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                          <h5 className="text-sm font-semibold mb-2">Field Values:</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {item.sub_field_definitions.map((subField) => {
                              const subValue = item.value_data?.[subField.field_name];
                              
                              // Handle display value based on field type
                              let displayValue = subValue;
                              
                              if (subValue === undefined || subValue === null || subValue === "") {
                                displayValue = "Not set";
                              } else if (subField.field_type === "date" && subValue) {
                                try {
                                  displayValue = format(new Date(subValue), "dd MMM yyyy");
                                } catch (e) {
                                  displayValue = subValue;
                                }
                              } else if ((subField.field_type === "select" || subField.field_type === "multiselect" || subField.field_type === "radio") && subField.field_options?.options) {
                                // For select fields, find the label from options
                                const options = subField.field_options.options || [];
                                const option = options.find((opt) => {
                                  if (typeof opt === "object" && opt !== null) {
                                    return String(opt.value) === String(subValue);
                                  }
                                  return String(opt) === String(subValue);
                                });
                                
                                if (option) {
                                  if (typeof option === "object" && option !== null) {
                                    displayValue = option.label || option.value || subValue;
                                  } else {
                                    displayValue = option;
                                  }
                                } else {
                                  displayValue = subValue;
                                }
                              }
                              
                              return (
                                <div key={subField.field_name} className="space-y-1">
                                  <span className="text-muted-foreground text-xs">{subField.field_label}:</span>
                                  <div className={cn(
                                    "font-medium",
                                    (subValue === undefined || subValue === null || subValue === "") 
                                      ? "text-muted-foreground italic" 
                                      : "text-foreground"
                                  )}>
                                    {String(displayValue)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Display value_data for custom fields */}
                      {item.value_data && typeof item.value_data === 'object' && !item.sub_field_definitions && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                          <h5 className="text-sm font-semibold mb-2">Value:</h5>
                          <div className="text-sm">
                            {(() => {
                              // Extract the actual value from value_data
                              // value_data can be: {value: "actual_value"} or just the value itself
                              let rawValue = item.value_data;
                              
                              // If value_data has a 'value' key, use that
                              if (item.value_data && typeof item.value_data === 'object' && 'value' in item.value_data) {
                                rawValue = item.value_data.value;
                              }
                              
                              const humanizedValue = humanizeFieldValue(field, rawValue);
                              return (
                                <div className="font-medium">{humanizedValue}</div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {isAdmin && item.backend_notes && (
                        <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                          <span className="font-semibold">Admin Notes:</span>
                          <p className="text-muted-foreground mt-1">{item.backend_notes}</p>
                        </div>
                      )}
                      {item.file && (
                        <div className="flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.file.file_name || item.file.fileName}</span>
                          {onDownload && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownload(item.file)}
                              className="h-6 px-2"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < history.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No history available</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

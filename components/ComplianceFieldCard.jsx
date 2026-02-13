"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Upload, Clock, CheckCircle, XCircle, AlertTriangle, History, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const ComplianceFieldCard = ({
  field,
  value,
  onUpload,
  onRenew,
  onViewHistory,
  onDownload,
  isAdmin = false,
  canUpload = false,
}) => {
  const getStatusBadge = () => {
    if (!value || !value.id || value.id === 0) {
      return <Badge variant="outline">Not Uploaded</Badge>;
    }

    if (value.is_expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (value.approval_status === "pending") {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Approval</Badge>;
    }

    if (value.approval_status === "declined") {
      return <Badge variant="destructive">Declined</Badge>;
    }

    if (value.approval_status === "approved") {
      if (value.days_until_expiry !== null && value.days_until_expiry <= 30 && value.days_until_expiry > 0) {
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Expiring Soon</Badge>;
      }
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Compliant</Badge>;
    }

    return <Badge variant="outline">Unknown</Badge>;
  };

  const getStatusIcon = () => {
    if (!value) {
      return <AlertTriangle className="h-4 w-4" />;
    }

    if (value.is_expired) {
      return <XCircle className="h-4 w-4" />;
    }

    if (value.approval_status === "pending") {
      return <Clock className="h-4 w-4" />;
    }

    if (value.approval_status === "declined") {
      return <XCircle className="h-4 w-4" />;
    }

    if (value.approval_status === "approved") {
      return <CheckCircle className="h-4 w-4" />;
    }

    return null;
  };

  // Only calculate daysUntilExpiry if value exists and has a valid id
  const daysUntilExpiry = (value && value.id && value.id > 0) ? value.days_until_expiry : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry !== undefined && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = value?.is_expired;

  return (
    <Card className={cn("w-full transition-all relative", isExpired && "border-red-500 border-2", isExpiringSoon && "border-yellow-500 border-2")}>
      {/* Status Badge - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10">
        {getStatusBadge()}
      </div>
      
      <CardHeader className="pb-4 pr-28 sm:pr-40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <CardTitle className="text-lg font-semibold">
                {field.field_label || field.field_name}
              </CardTitle>
            </div>
            {field.field_description && (
              <CardDescription className="mt-1 text-sm">{field.field_description}</CardDescription>
            )}
          </div>
          {canUpload && (
            <div className="flex items-center flex-shrink-0 sm:self-center self-start">
              {(!value || !value.id || value.id === 0) ? (
                <Button onClick={() => onUpload(field)} size="default" variant="default" className="whitespace-nowrap w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Details
                </Button>
              ) : (
                <Button onClick={() => onUpload(field, value)} size="default" variant="default" className="whitespace-nowrap w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  {value.approval_status === "declined" 
                    ? "Resubmit" 
                    : value.approval_status === "pending" 
                    ? "Update" 
                    : value.approval_status === "approved"
                    ? "Re-upload"
                    : "Update Details"}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Sub-field values (e.g., Passport details) */}
          {field?.sub_field_definitions && field.sub_field_definitions.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <h5 className="text-sm font-semibold text-foreground">Details</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {field.sub_field_definitions.map((subField) => {
                  const subValue = value?.value_data?.[subField.field_name];
                  
                  // Handle display value based on field type
                  let displayValue = subValue;
                  
                  if (subValue === undefined || subValue === null || subValue === "") {
                    // Show "Not set" for empty values
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
                      // Value not found in options, show raw value
                      displayValue = subValue;
                    }
                  }
                  
                  return (
                    <div key={subField.field_name} className="space-y-1">
                      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{subField.field_label}</span>
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

          {/* Expiry Information - Only show if expiry_date exists and is valid */}
          {value?.expiry_date && value.expiry_date !== null && value.expiry_date !== "" && (() => {
            try {
              const expiryDate = new Date(value.expiry_date);
              if (isNaN(expiryDate.getTime())) return null;
              return (
                <div className="flex flex-wrap items-center gap-2 text-sm p-3 bg-muted/20 rounded-md border">
                  <Calendar className={cn("h-4 w-4 flex-shrink-0", isExpired && "text-red-600", isExpiringSoon && "text-yellow-600")} />
                  <span className="text-muted-foreground font-medium">Expires:</span>
                  <span className={cn("font-semibold", isExpired && "text-red-600", isExpiringSoon && "text-yellow-600")}>
                    {format(expiryDate, "dd MMM yyyy")}
                  </span>
                  {daysUntilExpiry !== null && daysUntilExpiry !== undefined && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", 
                      isExpired && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                      isExpiringSoon && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                      daysUntilExpiry > 0 && daysUntilExpiry > 30 && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    )}>
                      {daysUntilExpiry > 0 
                        ? `${daysUntilExpiry} days remaining`
                        : daysUntilExpiry === 0
                        ? "Expires today"
                        : daysUntilExpiry < 0
                        ? `${Math.abs(daysUntilExpiry)} days ago`
                        : ""
                      }
                    </span>
                  )}
                </div>
              );
            } catch (e) {
              return null;
            }
          })()}

          {/* Approval Status */}
          {value?.approval_status && (
            <div className="flex flex-wrap items-center gap-2 text-sm p-3 bg-muted/20 rounded-md border">
              <span className="text-muted-foreground font-medium">Status:</span>
              <span className={cn("capitalize font-semibold px-2 py-0.5 rounded-full text-xs",
                value.approval_status === "approved" && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                value.approval_status === "pending" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                value.approval_status === "declined" && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}>
                {value.approval_status}
              </span>
              {value.approved_by_name && (
                <span className="text-muted-foreground text-xs">by {value.approved_by_name}</span>
              )}
              {value.approved_at && (
                <span className="text-muted-foreground text-xs">
                  on {format(new Date(value.approved_at), "dd MMM yyyy")}
                </span>
              )}
            </div>
          )}

          {/* File Information - Only show if file exists and field requires file upload */}
          {value?.file && field?.compliance_config?.requires_file_upload !== false && (
            <div className="flex items-center gap-3 text-sm p-3 bg-muted/20 rounded-md border">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground flex-1 truncate">{value.file.file_name}</span>
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(value.file)}
                  className="flex-shrink-0"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
          )}
          
          {/* Value Data Display - For compliance fields without file upload */}
          {value?.value_data && field?.compliance_config?.requires_file_upload === false && (
            <div className="p-2 bg-muted rounded-md text-sm">
              <span className="font-semibold">Value: </span>
              <span>{JSON.stringify(value.value_data)}</span>
            </div>
          )}

          {/* Backend Notes (Admin Only) */}
          {isAdmin && value?.backend_notes && (
            <div className="p-2 bg-muted rounded-md text-sm">
              <span className="font-semibold">Admin Notes:</span>
              <p className="text-muted-foreground mt-1">{value.backend_notes}</p>
            </div>
          )}

          {/* Actions - show for any item with a value so users can view details/history for compliant items too */}
          {value && value.id && value.id > 0 ? (
            <div className="flex gap-2 pt-2 border-t">
              {(isExpired || isExpiringSoon) && canUpload ? (
                <Button onClick={() => onRenew(value, field)} size="sm" variant="default">
                  <Upload className="h-4 w-4 mr-2" />
                  Renew
                </Button>
              ) : null}
              {onViewHistory ? (
                <Button onClick={() => onViewHistory(field, value)} size="sm" variant="outline">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

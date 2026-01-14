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
                          {format(new Date(item.archived_at), "dd MMM yyyy HH:mm")}
                        </span>
                        {getStatusBadge(item.approval_status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="capitalize">{item.archived_reason}</span>
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
                      {item.value_data && item.sub_field_definitions && item.sub_field_definitions.length > 0 && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                          <h5 className="text-sm font-semibold mb-2">Field Values:</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {item.sub_field_definitions.map((subField) => {
                              const subValue = item.value_data?.[subField.field_name];
                              if (subValue === undefined || subValue === null || subValue === "") return null;
                              
                              let displayValue = subValue;
                              if (subField.field_type === "date" && subValue) {
                                try {
                                  displayValue = format(new Date(subValue), "dd MMM yyyy");
                                } catch (e) {
                                  displayValue = subValue;
                                }
                              }
                              
                              return (
                                <div key={subField.field_name} className="space-y-1">
                                  <span className="text-muted-foreground text-xs">{subField.field_label}:</span>
                                  <div className="font-medium">{String(displayValue)}</div>
                                </div>
                              );
                            })}
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
                          <span className="text-sm">{item.file.file_name}</span>
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

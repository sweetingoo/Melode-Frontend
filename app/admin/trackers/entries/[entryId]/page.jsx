"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Loader2, ArrowLeft, Edit, Save, X, Clock, MessageSquare, FileText } from "lucide-react";
import {
  useTrackerEntry,
  useTrackerEntryTimeline,
  useTrackerEntryAuditLogs,
  useUpdateTrackerEntry,
  useTrackers,
  useTrackerEntries,
} from "@/hooks/useTrackers";
import { useComments } from "@/hooks/useComments";
import CommentThread from "@/components/CommentThread";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const TrackerEntryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissionsCheck();
  const canReadEntry = hasPermission("tracker_entry:read");
  const canUpdateEntry = hasPermission("tracker_entry:update");
  const entryId = parseInt(params.entryId);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [entryData, setEntryData] = useState({});
  const [entryStatus, setEntryStatus] = useState("open");
  const [fieldErrors, setFieldErrors] = useState({});
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsActionFilter, setAuditLogsActionFilter] = useState("all");
  const auditLogsPerPage = 20;

  const { data: entry, isLoading: entryLoading } = useTrackerEntry(entryId);
  const [timelinePage, setTimelinePage] = useState(1);
  const timelinePerPage = 50;
  const [allTimelineEvents, setAllTimelineEvents] = useState([]);
  const [timelinePagination, setTimelinePagination] = useState({ total: 0, total_pages: 0 });
  const { data: timelineData, isLoading: timelineLoading } = useTrackerEntryTimeline(entryId, timelinePage, timelinePerPage);
  
  // Accumulate timeline events as pages are loaded
  useEffect(() => {
    if (timelineData?.events) {
      if (timelinePage === 1) {
        // First page - replace all events
        setAllTimelineEvents(timelineData.events);
      } else {
        // Subsequent pages - append new events
        setAllTimelineEvents((prev) => [...prev, ...timelineData.events]);
      }
      setTimelinePagination({
        total: timelineData.total || 0,
        total_pages: timelineData.total_pages || 0,
      });
    }
  }, [timelineData, timelinePage]);
  const { data: auditLogsResponse, isLoading: auditLogsLoading } = useTrackerEntryAuditLogs(
    entryId,
    { 
      page: auditLogsPage, 
      per_page: auditLogsPerPage,
      action: auditLogsActionFilter !== "all" ? auditLogsActionFilter : undefined
    }
  );
  
  // Reset page when filter changes
  useEffect(() => {
    setAuditLogsPage(1);
  }, [auditLogsActionFilter]);
  
  // Extract logs and pagination info from response
  const auditLogs = useMemo(() => {
    if (!auditLogsResponse) return [];
    return auditLogsResponse.logs || [];
  }, [auditLogsResponse]);
  
  const auditLogsPagination = useMemo(() => {
    if (!auditLogsResponse) return { page: 1, per_page: auditLogsPerPage, total: 0, total_pages: 0 };
    return {
      page: auditLogsResponse.page || 1,
      per_page: auditLogsResponse.per_page || auditLogsPerPage,
      total: auditLogsResponse.total || 0,
      total_pages: auditLogsResponse.total_pages || 0,
    };
  }, [auditLogsResponse]);
  const { data: commentsData } = useComments("tracker_entry", entryId.toString());
  const updateEntryMutation = useUpdateTrackerEntry();
  
  // Fetch tracker form using form_id from entry
  const { data: trackersResponse } = useTrackers({ page: 1, per_page: 100 });
  const tracker = useMemo(() => {
    if (!entry?.form_id || !trackersResponse) return null;
    const trackers = Array.isArray(trackersResponse) 
      ? trackersResponse 
      : trackersResponse.trackers || trackersResponse.forms || [];
    return trackers.find((t) => t.id === entry.form_id);
  }, [entry?.form_id, trackersResponse]);

  // Use persistent tracker entry number from backend
  // This is calculated based on creation order within the tracker
  const entryNumber = entry?.tracker_entry_number || entry?.id || null;

  // Initialize form data when entry loads
  useEffect(() => {
    if (entry) {
      // Use submission_data or formatted_data (API returns submission_data)
      setEntryData(entry.submission_data || entry.formatted_data || entry.entry_data || {});
      setEntryStatus(entry.status || "open");
    }
  }, [entry]);

  // Debug: Log field structure when entry and tracker are loaded
  useEffect(() => {
    if (entry && tracker) {
      const trackerFields = tracker?.tracker_fields?.fields || [];
      const displayData = entry.formatted_data || entry.submission_data || {};
      console.log("Tracker Entry Debug:", {
        entry_data_keys: Object.keys(displayData),
        tracker_fields_structure: trackerFields.map(f => ({
          id: f.id,
          field_id: f.field_id,
          name: f.name,
          label: f.label,
          type: f.type || f.field_type,
        })),
        sample_field_matching: trackerFields.slice(0, 2).map(f => {
          const fieldId = f.field_id || f.id || f.name;
          return {
            field: { id: f.id, field_id: f.field_id, name: f.name },
            fieldId_used: fieldId,
            value_found: fieldId ? displayData[fieldId] : null,
          };
        }),
      });
    }
  }, [entry, tracker]);

  if (entryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Entry not found</h3>
        <Link href="/admin/trackers">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
      </div>
    );
  }

  // Check if user has permission to read this entry
  if (!canReadEntry) {
    return (
      <div className="space-y-4">
        <Link href="/admin/trackers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to view this tracker entry</p>
        </div>
      </div>
    );
  }

  const trackerFields = tracker?.tracker_fields?.fields || [];
  const trackerConfig = tracker?.tracker_config || {};
  const sections = trackerConfig.sections || [];

  // Format field value for read-only display
  const formatFieldValue = (field, value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    
    const fieldType = field.type || field.field_type;
    
    // Handle different field types
    if (fieldType === "date" && value) {
      try {
        return format(parseUTCDate(value), "MMM d, yyyy");
      } catch (e) {
        return String(value);
      }
    }
    
    if (fieldType === "datetime" && value) {
      try {
        return format(parseUTCDate(value), "MMM d, yyyy HH:mm");
      } catch (e) {
        return String(value);
      }
    }
    
    // Handle select fields - show label if available
    if ((fieldType === "select" || fieldType === "multiselect") && field.options) {
      if (Array.isArray(value)) {
        return value.map(v => {
          const option = field.options.find(opt => String(opt.value) === String(v) || String(opt.label) === String(v));
          return option?.label || v;
        }).join(", ");
      } else {
        const option = field.options.find(opt => String(opt.value) === String(value) || String(opt.label) === String(value));
        return option?.label || value;
      }
    }
    
    // Handle people/user fields
    if ((fieldType === "people" || fieldType === "user") && typeof value === "object" && value !== null) {
      // Extract display name from the user object
      if (value.display_name) {
        return value.display_name;
      }
      // Build name from first_name and last_name
      const nameParts = [];
      if (value.first_name) nameParts.push(value.first_name);
      if (value.last_name) nameParts.push(value.last_name);
      if (nameParts.length > 0) {
        return nameParts.join(" ");
      }
      // Fallback to email
      if (value.email) {
        return value.email;
      }
      // Last resort: user ID
      if (value.id) {
        return `User #${value.id}`;
      }
    }
    
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Group fields by section
  const fieldsBySection = sections.reduce((acc, section) => {
    acc[section.id] = {
      ...section,
      fields: trackerFields.filter((field) => field.section === section.id),
    };
    return acc;
  }, {});

  // Fields without section (section: null or undefined)
  const fieldsWithoutSection = trackerFields.filter((field) => !field.section || field.section === null);

  const comments = commentsData?.comments || commentsData || [];

  // Handle field value changes
  const handleFieldChange = (fieldId, value) => {
    setEntryData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    trackerFields.forEach((field) => {
      const fieldId = field.id || field.name;
      const isRequired = field.required || false;
      const value = entryData[fieldId];

      if (isRequired && (value === undefined || value === null || value === "")) {
        errors[fieldId] = `${field.label || field.name} is required`;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    try {
      await updateEntryMutation.mutateAsync({
        entryId: entryId,
        entryData: {
          submission_data: entryData, // API expects submission_data, not entry_data
          status: entryStatus,
        },
      });
      setIsEditing(false);
      toast.success("Entry updated successfully");
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset to original values
    if (entry) {
      // Use submission_data or formatted_data (API returns submission_data)
      setEntryData(entry.submission_data || entry.formatted_data || entry.entry_data || {});
      setEntryStatus(entry.status || "open");
    }
    setFieldErrors({});
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/trackers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Entry #{entryNumber !== null ? entryNumber : entry.id}
              {tracker && (
                <span className="text-lg font-normal text-muted-foreground ml-2">
                  - {tracker.name}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created {entry.created_at ? format(parseUTCDate(entry.created_at), "PPp") : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Select value={entryStatus} onValueChange={setEntryStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(tracker?.tracker_config?.statuses || ["open", "in_progress", "pending", "resolved", "closed"]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSave} disabled={updateEntryMutation.isPending}>
                {updateEntryMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-sm">
                {entry.status || "open"}
              </Badge>
              {canUpdateEntry && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="mr-2 h-4 w-4" />
            Notes & Files ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="mr-2 h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              {/* Render fields without sections first */}
              {fieldsWithoutSection.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fieldsWithoutSection.map((field) => {
                      const fieldId = field.id || field.name || field.field_id;
                      const value = entryData[fieldId];
                      return (
                        <CustomFieldRenderer
                          key={fieldId}
                          field={{
                            ...field,
                            type: field.type || field.field_type,
                            field_label: field.label || field.field_label || field.name, // Map label to field_label for CustomFieldRenderer
                            field_name: field.name || field.id, // Map name to field_name
                          }}
                          value={value}
                          onChange={handleFieldChange}
                          error={fieldErrors[fieldId]}
                          readOnly={false}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Render fields by section for editing */}
              {sections.length > 0 && (
                sections.map((section) => {
                  const sectionFields = fieldsBySection[section.id]?.fields || [];
                  if (sectionFields.length === 0) return null;

                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle>{section.label || section.id}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sectionFields.map((field) => {
                          const fieldId = field.id || field.name || field.field_id;
                          const value = entryData[fieldId];
                          return (
                            <CustomFieldRenderer
                              key={fieldId}
                              field={{
                                ...field,
                                type: field.type || field.field_type,
                                field_label: field.label || field.field_label || field.name, // Map label to field_label for CustomFieldRenderer
                                field_name: field.name || field.id, // Map name to field_name
                              }}
                              value={value}
                              onChange={handleFieldChange}
                              error={fieldErrors[fieldId]}
                              readOnly={false}
                            />
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Fallback: If no sections and no fields without sections, show all fields */}
              {sections.length === 0 && fieldsWithoutSection.length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trackerFields.length > 0 ? (
                      trackerFields.map((field) => {
                        const fieldId = field.id || field.name || field.field_id;
                        const value = entryData[fieldId];
                        return (
                          <CustomFieldRenderer
                            key={fieldId}
                            field={{
                              ...field,
                              type: field.type || field.field_type,
                              field_label: field.label || field.field_label || field.name, // Map label to field_label for CustomFieldRenderer
                              field_name: field.name || field.id, // Map name to field_name
                            }}
                            value={value}
                            onChange={handleFieldChange}
                            error={fieldErrors[fieldId]}
                            readOnly={false}
                          />
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No fields defined for this tracker
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>
          ) : (
            <div className="space-y-4">
              {/* Render fields without sections first */}
              {fieldsWithoutSection.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fieldsWithoutSection.map((field) => {
                      // Prefer formatted_data for display, fallback to submission_data
                      const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                      
                      // Fields use 'id' or 'name' to match submission_data keys (not 'field_id')
                      // Priority: id -> name -> field_id (for backward compatibility)
                      const fieldId = field.id || field.name || field.field_id;
                      
                      // Get value from displayData using the field identifier
                      const value = fieldId ? displayData[fieldId] : null;
                      
                      return (
                        <div key={field.id || field.name || field.field_id}>
                          <label className="text-sm font-medium text-muted-foreground">
                            {field.label || "Untitled Field"}
                          </label>
                          <div className="mt-1">
                            <p className="text-sm">{formatFieldValue(field, value)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Render fields by section */}
              {sections.length > 0 ? (
                sections.map((section) => {
                  const sectionFields = fieldsBySection[section.id]?.fields || [];
                  if (sectionFields.length === 0) return null;

                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle>{section.label || section.id}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sectionFields.map((field) => {
                          // Prefer formatted_data for display, fallback to submission_data
                          const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                          
                          // Fields use 'id' or 'name' to match submission_data keys (not 'field_id')
                          // Priority: id -> name -> field_id (for backward compatibility)
                          const fieldId = field.id || field.name || field.field_id;
                          
                          // Get value from displayData using the field identifier
                          const value = fieldId ? displayData[fieldId] : null;
                          
                          return (
                            <div key={field.id || field.name || field.field_id}>
                              <label className="text-sm font-medium text-muted-foreground">
                                {field.label || "Untitled Field"}
                              </label>
                              <div className="mt-1">
                                <p className="text-sm">{formatFieldValue(field, value)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              ) : null}
              
              {/* Fallback: If no sections and no fields without sections, show all fields */}
              {sections.length === 0 && fieldsWithoutSection.length === 0 ? (
                // If no sections, render all fields in a single card
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trackerFields.length > 0 ? (
                      trackerFields.map((field) => {
                        // Prefer formatted_data for display, fallback to submission_data
                        const displayData = entry.formatted_data || entry.submission_data || entry.entry_data || {};
                        
                        // Fields use 'id' or 'name' to match submission_data keys (not 'field_id')
                        // Priority: id -> name -> field_id (for backward compatibility)
                        const fieldId = field.id || field.name || field.field_id;
                        
                        // Get value from displayData using the field identifier
                        const value = fieldId ? displayData[fieldId] : null;
                        
                        return (
                          <div key={field.id || field.name || field.field_id}>
                            <label className="text-sm font-medium text-muted-foreground">
                              {field.label || "Untitled Field"}
                            </label>
                            <div className="mt-1">
                              <p className="text-sm">{formatFieldValue(field, value)}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No fields defined for this tracker
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

            </div>
          )}
        </TabsContent>

        {/* Notes & Files Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes, Comments & Files</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add comments and attach files. Files can be attached to specific comments for better context.
              </p>
            </CardHeader>
            <CardContent>
              <CommentThread
                entityType="tracker_entry"
                entitySlug={entryId.toString()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : allTimelineEvents && allTimelineEvents.length > 0 ? (
                <div className="relative">
                  {/* Vertical line in the center */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2" />
                  
                  {/* Timeline events */}
                  <div className="space-y-8">
                    {allTimelineEvents.map((event, index) => {
                      // Alternate between left and right (0 = left, 1 = right)
                      const isLeft = index % 2 === 0;
                      
                      return (
                        <div
                          key={event.id || index}
                          className={`relative flex ${isLeft ? "justify-start" : "justify-end"}`}
                        >
                          {/* Event content */}
                          <div className={`w-[45%] ${isLeft ? "pr-8 text-right" : "pl-8 text-left"}`}>
                            <div className="bg-card border rounded-lg p-4 shadow-sm">
                              <div className={`flex items-center justify-between ${isLeft ? "flex-row-reverse" : ""}`}>
                                <h4 className="font-medium">{event.title}</h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(parseUTCDate(event.timestamp), "PPp")}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {event.description}
                                </p>
                              )}
                              {event.user_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  by {event.user_name}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Center dot */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background z-10" />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Load More button */}
                  {timelinePagination.total_pages > timelinePage && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setTimelinePage((prev) => prev + 1)}
                        disabled={timelineLoading}
                      >
                        {timelineLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          `Load More (${timelinePagination.total - allTimelineEvents.length} remaining)`
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No timeline events yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Audit History</CardTitle>
                <Select
                  value={auditLogsActionFilter}
                  onValueChange={setAuditLogsActionFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => {
                    // Helper to get field label from field ID
                    const getFieldLabel = (fieldId) => {
                      const field = trackerFields.find(
                        (f) => f.id === fieldId || f.name === fieldId || f.field_id === fieldId
                      );
                      return field?.label || fieldId;
                    };

                    // Format audit log changes
                    const formatAuditChanges = () => {
                      const changes = [];
                      
                      // Handle submission_data changes (tracker entry field changes)
                      if (log.old_values?.submission_data || log.new_values?.submission_data) {
                        const oldData = log.old_values?.submission_data || {};
                        const newData = log.new_values?.submission_data || {};
                        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
                        
                        allKeys.forEach((key) => {
                          const oldVal = oldData[key];
                          const newVal = newData[key];
                          
                          if (oldVal !== newVal) {
                            const field = trackerFields.find(
                              (f) => f.id === key || f.name === key || f.field_id === key
                            );
                            const fieldLabel = field?.label || key;
                            const formattedOld = field ? formatFieldValue(field, oldVal) : (oldVal ?? "—");
                            const formattedNew = field ? formatFieldValue(field, newVal) : (newVal ?? "—");
                            
                            changes.push({
                              field: fieldLabel,
                              old: formattedOld,
                              new: formattedNew,
                            });
                          }
                        });
                      }
                      
                      // Handle status changes
                      if (log.old_values?.status !== log.new_values?.status) {
                        changes.push({
                          field: "Status",
                          old: log.old_values?.status || "—",
                          new: log.new_values?.status || "—",
                        });
                      }
                      
                      // Handle submission_status changes
                      if (log.old_values?.submission_status !== log.new_values?.submission_status) {
                        changes.push({
                          field: "Status",
                          old: log.old_values?.submission_status || "—",
                          new: log.new_values?.submission_status || "—",
                        });
                      }
                      
                      // Handle other direct field changes (non-nested)
                      if (log.old_values || log.new_values) {
                        const oldVals = log.old_values || {};
                        const newVals = log.new_values || {};
                        const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
                        
                        allKeys.forEach((key) => {
                          // Skip submission_data, status, submission_status, form_id as they're handled above or not useful
                          if (key === "submission_data" || key === "status" || key === "submission_status" || key === "form_id") return;
                          
                          const oldVal = oldVals[key];
                          const newVal = newVals[key];
                          
                          // Only show changes, not when both are null/undefined
                          if (oldVal !== newVal && (oldVal != null || newVal != null)) {
                            const fieldLabel = getFieldLabel(key);
                            changes.push({
                              field: fieldLabel,
                              old: oldVal ?? "—",
                              new: newVal ?? "—",
                            });
                          }
                        });
                      }
                      
                      return changes;
                    };
                    
                    // Format details JSON nicely - only show if there are no field changes
                    const formatDetails = (hasChanges) => {
                      if (!log.details) return null;
                      
                      let detailsObj = log.details;
                      
                      // If details is a string, try to parse it
                      if (typeof log.details === "string") {
                        try {
                          detailsObj = JSON.parse(log.details);
                        } catch (e) {
                          // Not JSON, return as is
                          return log.details;
                        }
                      }
                      
                      // If details is not an object, return as is
                      if (typeof detailsObj !== "object" || detailsObj === null) {
                        return null;
                      }
                      
                      // If we have field changes, only show meaningful processing results
                      if (hasChanges) {
                        if (detailsObj.processing_results) {
                          const results = detailsObj.processing_results;
                          const parts = [];
                          if (results.task_creation?.created === true) {
                            parts.push("Task created");
                          }
                          if (results.email_notifications && Object.keys(results.email_notifications).length > 0) {
                            parts.push("Email notifications sent");
                          }
                          if (results.conditional_logic?.processed === true) {
                            parts.push("Conditional logic processed");
                          }
                          return parts.length > 0 ? parts.join(" • ") : null;
                        }
                        return null;
                      }
                      
                      // If no changes, show formatted metadata or a simple message
                      const parts = [];
                      
                      // Handle form metadata - only if it's different from current tracker
                      if (detailsObj.form_name && detailsObj.form_name !== tracker?.slug) {
                        parts.push(`Form: ${detailsObj.form_name}`);
                      }
                      
                      // Handle status - only if it's meaningful
                      if (detailsObj.submission_status && log.action !== "create") {
                        parts.push(`Status: ${detailsObj.submission_status}`);
                      }
                      
                      // Handle processing results
                      if (detailsObj.processing_results) {
                        const results = detailsObj.processing_results;
                        if (results.task_creation?.created === true) {
                          parts.push("Task created");
                        }
                        if (results.email_notifications && Object.keys(results.email_notifications).length > 0) {
                          parts.push("Email notifications sent");
                        }
                        if (results.conditional_logic?.processed === true) {
                          parts.push("Conditional logic processed");
                        }
                      }
                      
                      // If we have parts, return formatted string
                      if (parts.length > 0) {
                        return parts.join(" • ");
                      }
                      
                      // If no meaningful parts but details exist, show a simple message based on action
                      if (log.action === "update") {
                        return "Update called but no changes detected";
                      } else if (log.action === "read") {
                        return "Entry viewed";
                      }
                      
                      return null;
                    };

                    const changes = formatAuditChanges();
                    const formattedDetails = formatDetails(changes.length > 0);

                    return (
                    <div key={log.id || index} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.user?.full_name || log.user?.email || "System"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(parseUTCDate(log.created_at), "PPp")}
                        </span>
                      </div>
                        
                        {changes.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {changes.map((change, changeIndex) => (
                              <div key={changeIndex} className="text-sm">
                                <span className="font-medium text-foreground">{change.field}:</span>{" "}
                                <span className="text-muted-foreground line-through">{change.old}</span>{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                <span className="text-foreground font-medium">{change.new}</span>
                              </div>
                            ))}
                            {formattedDetails && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {formattedDetails}
                        </p>
                      )}
                          </div>
                        ) : formattedDetails ? (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formattedDetails}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audit logs available
                </p>
              )}
              
              {/* Pagination */}
              {auditLogsPagination.total_pages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (auditLogsPage > 1) {
                              setAuditLogsPage(auditLogsPage - 1);
                            }
                          }}
                          className={auditLogsPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: auditLogsPagination.total_pages }, (_, i) => i + 1).map((pageNum) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === auditLogsPagination.total_pages ||
                          (pageNum >= auditLogsPage - 1 && pageNum <= auditLogsPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setAuditLogsPage(pageNum);
                                }}
                                isActive={pageNum === auditLogsPage}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (pageNum === auditLogsPage - 2 || pageNum === auditLogsPage + 2) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (auditLogsPage < auditLogsPagination.total_pages) {
                              setAuditLogsPage(auditLogsPage + 1);
                            }
                          }}
                          className={
                            auditLogsPage >= auditLogsPagination.total_pages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackerEntryDetailPage;

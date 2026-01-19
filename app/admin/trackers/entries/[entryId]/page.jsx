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
import { Loader2, ArrowLeft, Edit, Save, X, Clock, MessageSquare, FileText } from "lucide-react";
import {
  useTrackerEntry,
  useTrackerEntryTimeline,
  useTrackerEntryAuditLogs,
  useUpdateTrackerEntry,
  useTrackers,
} from "@/hooks/useTrackers";
import { useComments } from "@/hooks/useComments";
import CommentThread from "@/components/CommentThread";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { toast } from "sonner";

const TrackerEntryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const entryId = parseInt(params.entryId);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [entryData, setEntryData] = useState({});
  const [entryStatus, setEntryStatus] = useState("open");
  const [fieldErrors, setFieldErrors] = useState({});

  const { data: entry, isLoading: entryLoading } = useTrackerEntry(entryId);
  const { data: timelineData, isLoading: timelineLoading } = useTrackerEntryTimeline(entryId);
  const { data: auditLogs, isLoading: auditLogsLoading } = useTrackerEntryAuditLogs(entryId);
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

  // Initialize form data when entry loads
  useEffect(() => {
    if (entry) {
      // Use submission_data or formatted_data (API returns submission_data)
      setEntryData(entry.submission_data || entry.formatted_data || entry.entry_data || {});
      setEntryStatus(entry.status || "open");
    }
  }, [entry]);

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

  const trackerFields = tracker?.tracker_fields?.fields || [];
  const trackerConfig = tracker?.tracker_config || {};
  const sections = trackerConfig.sections || [];

  // Group fields by section
  const fieldsBySection = sections.reduce((acc, section) => {
    acc[section.id] = {
      ...section,
      fields: trackerFields.filter((field) => field.section === section.id),
    };
    return acc;
  }, {});

  // Fields without section - include them in the main section instead
  // const fieldsWithoutSection = trackerFields.filter((field) => !field.section);

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
              Entry #{entry.id}
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
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
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
            Notes ({comments.length})
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
              {/* Render fields by section for editing */}
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
                          const fieldId = field.id || field.name;
                          const value = entryData[fieldId];
                          return (
                            <CustomFieldRenderer
                              key={fieldId}
                              field={field}
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
              ) : (
                // If no sections, render all fields in a single card
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trackerFields.length > 0 ? (
                      trackerFields.map((field) => {
                        const fieldId = field.id || field.name;
                        const value = entryData[fieldId];
                        return (
                          <CustomFieldRenderer
                            key={fieldId}
                            field={field}
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
                          // Use submission_data or formatted_data (API returns submission_data)
                          const submissionData = entry.submission_data || entry.formatted_data || entry.entry_data || {};
                          const value = submissionData[field.id] || submissionData[field.name] || submissionData[field.field_id];
                          return (
                            <div key={field.id || field.name}>
                              <label className="text-sm font-medium text-muted-foreground">
                                {field.label || field.name}
                              </label>
                              <div className="mt-1">
                                {value ? (
                                  <p className="text-sm">{String(value)}</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">—</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                // If no sections, render all fields in a single card
                <Card>
                  <CardHeader>
                    <CardTitle>Entry Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trackerFields.length > 0 ? (
                      trackerFields.map((field) => {
                        // Use submission_data or formatted_data (API returns submission_data)
                        const submissionData = entry.submission_data || entry.formatted_data || entry.entry_data || {};
                        const value = submissionData[field.id] || submissionData[field.name] || submissionData[field.field_id];
                        return (
                          <div key={field.id || field.name}>
                            <label className="text-sm font-medium text-muted-foreground">
                              {field.label || field.name}
                            </label>
                            <div className="mt-1">
                              {value ? (
                                <p className="text-sm">{String(value)}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">—</p>
                              )}
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
              )}

            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes & Comments</CardTitle>
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
              ) : timelineData?.events && timelineData.events.length > 0 ? (
                <div className="space-y-4">
                  {timelineData.events.map((event, index) => (
                    <div key={event.id || index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                        {index < timelineData.events.length - 1 && (
                          <div className="w-px h-full bg-border mt-2 min-h-[40px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{event.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {format(parseUTCDate(event.timestamp), "PPp")}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
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
                  ))}
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
              <CardTitle>Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
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
                      {log.details && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {typeof log.details === "string"
                            ? log.details
                            : JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audit logs available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackerEntryDetailPage;

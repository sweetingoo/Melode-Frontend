"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Loader2,
  FileText,
  Eye,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import {
  useTrackers,
  useTrackerEntries,
  useDeleteTrackerEntry,
  useCreateTrackerEntry,
} from "@/hooks/useTrackers";
import { useTracker } from "@/hooks/useTrackers";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { toast } from "sonner";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useUsers } from "@/hooks/useUsers";

const TrackersPage = () => {
  const router = useRouter();
  const { hasPermission } = usePermissionsCheck();
  const canCreateEntry = hasPermission("tracker_entry:create");
  const canReadEntries = hasPermission("tracker_entry:read") || hasPermission("tracker_entry:list");
  const canDeleteEntry = hasPermission("tracker_entry:delete");
  const canReadTrackers = hasPermission("tracker:read") || hasPermission("tracker:list");
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isCreateEntryDialogOpen, setIsCreateEntryDialogOpen] = useState(false);
  const [entryFormData, setEntryFormData] = useState({});
  // Column-specific filters: field_id -> filter value
  const [columnFilters, setColumnFilters] = useState({});
  // Column-specific sorting: field_id -> sort order (null, 'asc', 'desc')
  const [columnSorting, setColumnSorting] = useState({});
  const [entryFieldErrors, setEntryFieldErrors] = useState({});
  const [showMetadataColumns, setShowMetadataColumns] = useState(false);

  const itemsPerPage = 20;

  // Get users for "Updated By" display
  const { data: usersResponse } = useUsers();
  const users = usersResponse?.users || usersResponse || [];

  // Helper to get user name
  const getUserName = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    if (!user) return null;
    return (
      user.display_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email ||
      `User #${userId}`
    );
  };

  // Get trackers list
  const { data: trackersResponse, isLoading: trackersLoading } = useTrackers({
    page: 1,
    per_page: 100,
    is_active: true,
  });

  const trackers = useMemo(() => {
    if (!trackersResponse) return [];
    if (Array.isArray(trackersResponse)) return trackersResponse;
    return trackersResponse.trackers || trackersResponse.forms || [];
  }, [trackersResponse]);

  // Auto-select first tracker when trackers load
  useEffect(() => {
    if (trackers.length > 0 && !selectedTracker) {
      setSelectedTracker(trackers[0].id.toString());
    }
  }, [trackers, selectedTracker]);

  // Debug: Log configuration after page loads and after 10 seconds
  useEffect(() => {
    const logConfiguration = () => {
      trackers.forEach((tracker) => {
        const listViewFields = tracker?.tracker_config?.list_view_fields;
        const trackerFields = tracker?.tracker_fields?.fields || [];
        const allFields = trackerFields.filter((field) => {
          const fieldType = field.type || field.field_type;
          return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
        });
        
        console.log(`[${tracker.name}] Configuration Check:`, {
          list_view_fields: listViewFields,
          availableFields: allFields.map(f => ({ id: f.id, name: f.name, label: f.label })),
          tracker_config: tracker.tracker_config,
        });
      });
    };

    // Log immediately after component mounts
    const timeout1 = setTimeout(logConfiguration, 1000);
    
    // Log again after 10 seconds
    const timeout2 = setTimeout(logConfiguration, 10000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [trackers]);
  
  const createEntryMutation = useCreateTrackerEntry();
  
  // Get selected tracker details for form fields (using selectedTracker tab)
  const selectedTrackerObj = useMemo(() => {
    if (!selectedTracker) return null;
    return trackers.find((t) => t.id === parseInt(selectedTracker));
  }, [selectedTracker, trackers]);
  
  const { data: trackerDetails } = useTracker(selectedTrackerObj?.slug || "", {
    enabled: !!selectedTrackerObj?.slug && isCreateEntryDialogOpen,
  });

  // Build search params for entries
  const searchParams = useMemo(() => {
    const params = {
      page: currentPage,
      per_page: itemsPerPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    // Send form_id instead of tracker_id - backend expects form_id
    // Each tracker is separate, so we always filter by the selected tracker
    if (selectedTracker) {
      params.form_id = parseInt(selectedTracker);
    }

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (searchTerm) {
      params.query = searchTerm;
    }

    // Add column filters - these will be sent as field-specific filters
    // Format: { field_id: value }
    if (Object.keys(columnFilters).length > 0) {
      params.field_filters = columnFilters;
    }

    return params;
  }, [currentPage, selectedTracker, statusFilter, searchTerm, sortBy, sortOrder, columnFilters]);

  // Get tracker entries
  const { data: entriesResponse, isLoading: entriesLoading } = useTrackerEntries(
    searchParams
  );

  const deleteEntryMutation = useDeleteTrackerEntry();

  // Handle entries response
  const entries = useMemo(() => {
    if (!entriesResponse) return [];
    if (Array.isArray(entriesResponse)) return entriesResponse;
    // Backend returns 'submissions' in FormSubmissionListResponse
    const submissions = entriesResponse.submissions || entriesResponse.entries || [];
    // Map form_id to tracker_id for consistency
    return submissions.map((entry) => ({
      ...entry,
      tracker_id: entry.tracker_id || entry.form_id,
    }));
  }, [entriesResponse]);

  const pagination = {
    page: entriesResponse?.page ?? currentPage,
    per_page: entriesResponse?.per_page ?? itemsPerPage,
    total: entriesResponse?.total ?? 0,
    total_pages: entriesResponse?.total_pages ?? 1,
  };

  // Get available statuses from selected tracker
  const availableStatuses = useMemo(() => {
    if (!selectedTracker) return [];
    const tracker = trackers.find((t) => t.id === parseInt(selectedTracker));
    if (!tracker?.tracker_config?.statuses) return [];
    return tracker.tracker_config.statuses;
  }, [selectedTracker, trackers]);

  // Get displayable fields for the selected tracker (for table columns)
  // Uses list_view_fields from tracker_config if specified, otherwise shows first 4 fields
  // This ensures we only show configured fields, not all fields
  const displayableFields = useMemo(() => {
    if (!selectedTracker) return [];
    const tracker = trackers.find((t) => t.id === parseInt(selectedTracker));
    if (!tracker?.tracker_fields?.fields) return [];
    
    // Get all non-display fields (exclude display-only field types)
    const allFields = tracker.tracker_fields.fields.filter((field) => {
      const fieldType = field.type || field.field_type;
      return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
    });
    
    // Check if tracker_config has list_view_fields specified
    const listViewFields = tracker?.tracker_config?.list_view_fields;
    
    if (listViewFields && Array.isArray(listViewFields) && listViewFields.length > 0) {
      // Use ONLY the configured fields - restrict to what's in list_view_fields
      const configuredFields = listViewFields
        .map((fieldId) => allFields.find((f) => {
          const fId = f.id || f.field_id || f.name;
          return fId === fieldId || String(fId) === String(fieldId);
        }))
        .filter((f) => f !== undefined && f !== null);
      
      // Return only configured fields, or empty if none found (to avoid showing all)
      return configuredFields.length > 0 ? configuredFields : [];
    }
    
    // Default: show first 4 fields if no configuration
    return allFields.slice(0, 4);
  }, [selectedTracker, trackers]);

  // Helper function to format field value for display
  // Helper to check if a field is sortable (number, date, datetime)
  const isFieldSortable = (field) => {
    const fieldType = field.type || field.field_type;
    return ['number', 'date', 'datetime'].includes(fieldType);
  };

  // Helper to check if a field is filterable (select, multiselect)
  const isFieldFilterable = (field) => {
    const fieldType = field.type || field.field_type;
    return ['select', 'multiselect'].includes(fieldType);
  };

  // Get unique values for a select field from entries
  const getFieldUniqueValues = (field, entries) => {
    const fieldId = field.id || field.field_id || field.name;
    const values = new Set();
    entries.forEach((entry) => {
      const submissionData = entry.submission_data || entry.formatted_data || {};
      const value = submissionData[fieldId];
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((v) => values.add(String(v)));
        } else {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  };

  // Handle column header click for sorting
  const handleColumnSort = (field) => {
    const fieldId = field.id || field.field_id || field.name;
    const currentSort = columnSorting[fieldId];
    
    // Cycle: null -> 'asc' -> 'desc' -> null
    let newSort = null;
    if (currentSort === null || currentSort === undefined) {
      newSort = 'asc';
    } else if (currentSort === 'asc') {
      newSort = 'desc';
    } else {
      newSort = null;
    }
    
    if (newSort === null) {
      // Remove from sorting, revert to default
      const newColumnSorting = { ...columnSorting };
      delete newColumnSorting[fieldId];
      setColumnSorting(newColumnSorting);
      setSortBy("created_at");
      setSortOrder("desc");
    } else {
      // Set column-specific sorting
      setColumnSorting({ ...columnSorting, [fieldId]: newSort });
      // For now, we'll use the field value in submission_data for sorting
      // This requires backend support - for now, just set the sort state
      setSortBy(`field_${fieldId}`);
      setSortOrder(newSort);
    }
    setCurrentPage(1);
  };

  // Handle column filter change
  const handleColumnFilter = (field, value) => {
    const fieldId = field.id || field.field_id || field.name;
    if (value === "all" || value === "") {
      const newFilters = { ...columnFilters };
      delete newFilters[fieldId];
      setColumnFilters(newFilters);
    } else {
      setColumnFilters({ ...columnFilters, [fieldId]: value });
    }
    setCurrentPage(1);
  };

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
    
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const handleDelete = async (entryId) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteEntryMutation.mutateAsync(entryId);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  if (trackersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show message if no trackers exist
  if (trackers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
          <Link href="/admin/trackers/manage">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Manage Trackers
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trackers found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first tracker to start tracking entries
              </p>
              <Link href="/admin/trackers/manage">
                <Button>Manage Trackers</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div></div>
        <div className="flex gap-2">
          <Link href="/admin/trackers/manage">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Manage Trackers
            </Button>
          </Link>
          {selectedTrackerObj && canCreateEntry && (
            <Dialog 
              open={isCreateEntryDialogOpen} 
              onOpenChange={(open) => {
                setIsCreateEntryDialogOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  setEntryFormData({});
                  setEntryFieldErrors({});
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Entry</DialogTitle>
                  <DialogDescription>
                    Fill in the details for {selectedTrackerObj?.name || "this tracker"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {trackerDetails && trackerDetails.tracker_fields?.fields && (() => {
                    // Get fields to show in creation modal
                    const allFields = trackerDetails.tracker_fields.fields.filter((field) => {
                            // Filter out display-only fields
                            const fieldType = field.type || field.field_type;
                            return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
                    });
                    
                    // Check if create_view_fields is configured
                    const createViewFields = trackerDetails.tracker_config?.create_view_fields;
                    const fieldsToShow = createViewFields && Array.isArray(createViewFields) && createViewFields.length > 0
                      ? allFields.filter((field) => {
                          const fieldId = field.id || field.field_id || field.name;
                          return createViewFields.includes(fieldId);
                        })
                      : allFields; // Show all fields if not configured (backward compatibility)
                    
                    return (
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Entry Details</Label>
                        {fieldsToShow.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No fields configured for creation. Please configure "Create View Fields" in tracker settings.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fieldsToShow.map((field) => {
                            const fieldId = field.id || field.field_id;
                            const fieldValue = entryFormData[fieldId] || "";
                            
                            return (
                              <CustomFieldRenderer
                                key={fieldId}
                                field={{
                                  ...field,
                                  id: fieldId,
                                  field_label: field.label || field.field_label,
                                  field_type: field.type || field.field_type,
                                  is_required: field.required || field.is_required,
                                }}
                                value={fieldValue}
                                onChange={(id, value) => {
                                  setEntryFormData((prev) => ({
                                    ...prev,
                                    [id]: value,
                                  }));
                                  // Clear error when user starts typing
                                  if (entryFieldErrors[id]) {
                                    setEntryFieldErrors((prev) => {
                                      const newErrors = { ...prev };
                                      delete newErrors[id];
                                      return newErrors;
                                    });
                                  }
                                }}
                                error={entryFieldErrors[fieldId]}
                              />
                            );
                          })}
                    </div>
                  )}
                      </div>
                    );
                  })()}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateEntryDialogOpen(false)}
                    disabled={createEntryMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!selectedTrackerObj || !trackerDetails) {
                        toast.error("Please select a tracker");
                        return;
                      }
                      
                      // Basic validation - only validate fields that are shown in creation modal
                      const errors = {};
                      const allFields = trackerDetails.tracker_fields?.fields?.filter((field) => {
                        const fieldType = field.type || field.field_type;
                        return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
                      }) || [];
                      
                      const createViewFields = trackerDetails.tracker_config?.create_view_fields;
                      const fieldsToValidate = createViewFields && Array.isArray(createViewFields) && createViewFields.length > 0
                        ? allFields.filter((field) => {
                            const fieldId = field.id || field.field_id || field.name;
                            return createViewFields.includes(fieldId);
                          })
                        : allFields; // Validate all if not configured
                      
                      fieldsToValidate.forEach((field) => {
                        const fieldId = field.id || field.field_id || field.name;
                        const isRequired = field.required || field.is_required;
                        if (isRequired && !entryFormData[fieldId]) {
                          errors[fieldId] = `${field.label || field.field_label || "This field"} is required`;
                        }
                      });
                      
                      if (Object.keys(errors).length > 0) {
                        setEntryFieldErrors(errors);
                        toast.error("Please fill in all required fields");
                        return;
                      }
                      
                      try {
                        await createEntryMutation.mutateAsync({
                          form_id: trackerDetails.id,
                          submission_data: entryFormData,
                          status: trackerDetails.tracker_config?.default_status || "open",
                        });
                        setIsCreateEntryDialogOpen(false);
                        setEntryFormData({});
                        setEntryFieldErrors({});
                      } catch (error) {
                        // Error handled by mutation
                      }
                    }}
                    disabled={!selectedTrackerObj || !trackerDetails || createEntryMutation.isPending}
                  >
                    {createEntryMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Entry"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Tracker Tabs */}
      <Tabs 
        value={selectedTracker || undefined} 
        onValueChange={(value) => {
          setSelectedTracker(value);
          setCurrentPage(1); // Reset to first page when switching trackers
          setSearchTerm(""); // Reset search term
          setStatusFilter("all"); // Reset status filter
          setColumnFilters({}); // Reset column filters
          setColumnSorting({}); // Reset column sorting
          // Keep sort_by and sort_order as they're usually consistent across trackers
        }}
        className="w-full"
      >
        <div className="overflow-x-auto -mx-1 px-1 sm:overflow-x-visible sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-max sm:w-auto justify-start">
            {trackers
              .filter((t) => t.is_active)
              .map((tracker) => (
                <TabsTrigger key={tracker.id} value={tracker.id.toString()}>
                  {tracker.name}
                </TabsTrigger>
              ))}
          </TabsList>
        </div>

        {/* Content for each tracker tab */}
        {trackers
          .filter((t) => t.is_active)
          .map((tracker) => {
            // Get displayable fields for this specific tracker
            // Uses list_view_fields from tracker_config if specified
            const trackerFields = tracker?.tracker_fields?.fields || [];
            const allFields = trackerFields.filter((field) => {
              const fieldType = field.type || field.field_type;
              return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
            });
            
            // Check if tracker_config has list_view_fields specified
            // Frontend restricts display to ONLY configured fields - this is the key filtering logic
            const listViewFields = tracker?.tracker_config?.list_view_fields;
            
            const trackerDisplayableFields = (() => {
              // If list_view_fields is configured, use ONLY those fields - no exceptions!
              if (listViewFields && Array.isArray(listViewFields) && listViewFields.length > 0) {
                // Find and return ONLY the configured fields - strict filtering
                const foundFields = listViewFields
                  .map((fieldId) => {
                    // Match by id, field_id, or name (with type coercion for safety)
                    return allFields.find((f) => {
                      const fId = f.id || f.field_id || f.name;
                      return fId === fieldId || String(fId) === String(fieldId);
                    });
                  })
                  .filter((f) => f !== undefined && f !== null);
                
                // Delayed logging to check configuration after render
                setTimeout(() => {
                  console.log(`[${tracker.name}] After page load - list_view_fields:`, listViewFields);
                  console.log(`[${tracker.name}] After page load - Will display:`, foundFields.map(f => ({ id: f.id, name: f.name, label: f.label })));
                }, 2000);
                
                setTimeout(() => {
                  console.log(`[${tracker.name}] After 10 seconds - list_view_fields:`, listViewFields);
                  console.log(`[${tracker.name}] After 10 seconds - Will display:`, foundFields.map(f => ({ id: f.id, name: f.name, label: f.label })));
                }, 10000);
                
                // CRITICAL: Return ONLY configured fields, even if empty
                // This ensures we don't fall back to showing all fields
                return foundFields;
              }
              
              // Default: show first 4 fields if no configuration
              return allFields.slice(0, 4);
            })();
            
            // Get available statuses for this tracker
            const trackerStatuses = tracker?.tracker_config?.statuses || [];

            return (
              <TabsContent key={tracker.id} value={tracker.id.toString()} className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                            {trackerStatuses.length > 0 ? (
                              trackerStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <Select
                value={`${sortBy}:${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split(":");
                  setSortBy(field);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at:desc">Newest First</SelectItem>
                  <SelectItem value="created_at:asc">Oldest First</SelectItem>
                  <SelectItem value="updated_at:desc">Recently Updated</SelectItem>
                  <SelectItem value="status:asc">Status A-Z</SelectItem>
                </SelectContent>
              </Select>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="show-last-updated" className="text-sm font-normal cursor-pointer">
                            Last Updated
                          </Label>
                          <Switch
                            id="show-last-updated"
                            checked={showMetadataColumns}
                            onCheckedChange={setShowMetadataColumns}
                          />
                        </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Entries ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No entries found</h3>
              <p className="text-muted-foreground mb-4">
                          {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                            : `No entries yet for ${tracker.name}`}
              </p>
            </div>
          ) : (
            <>
                        <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                                {/* Dynamic field columns */}
                                {trackerDisplayableFields.map((field) => {
                                  const fieldId = field.id || field.field_id || field.name;
                                  const fieldType = field.type || field.field_type;
                                  const isSortable = isFieldSortable(field);
                                  const isFilterable = isFieldFilterable(field);
                                  const currentSort = columnSorting[fieldId];
                                  const currentFilter = columnFilters[fieldId] || "all";
                                  const uniqueValues = isFilterable ? getFieldUniqueValues(field, entries) : [];

                                  return (
                                    <TableHead key={fieldId} className="relative">
                                      <div className="flex flex-col gap-1">
                                        {/* Header with sort button */}
                                        <div className="flex items-center gap-2">
                                          {isSortable ? (
                                            <button
                                              onClick={() => handleColumnSort(field)}
                                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                                            >
                                              <span>{field.label || field.field_label || field.name}</span>
                                              {currentSort === 'asc' ? (
                                                <ArrowUp className="h-3 w-3" />
                                              ) : currentSort === 'desc' ? (
                                                <ArrowDown className="h-3 w-3" />
                                              ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                                              )}
                                            </button>
                                          ) : (
                                            <span>{field.label || field.field_label || field.name}</span>
                                          )}
                                        </div>
                                        {/* Filter dropdown for select fields */}
                                        {isFilterable && uniqueValues.length > 0 && (
                                          <Select
                                            value={currentFilter}
                                            onValueChange={(value) => handleColumnFilter(field, value)}
                                          >
                                            <SelectTrigger className="h-7 text-xs">
                                              <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="all">All</SelectItem>
                                              {uniqueValues.map((value) => {
                                                // Try to find the label from field options
                                                const option = field.options?.find(
                                                  (opt) => String(opt.value) === String(value) || String(opt.label) === String(value)
                                                );
                                                const displayValue = option?.label || value;
                                                return (
                                                  <SelectItem key={value} value={value}>
                                                    {displayValue}
                                                  </SelectItem>
                                                );
                                              })}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                    </TableHead>
                                  );
                                })}
                                {showMetadataColumns && (
                                  <>
                                    <TableHead>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Last Updated
                                      </div>
                                    </TableHead>
                                    <TableHead>
                                      <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        Updated By
                                      </div>
                                    </TableHead>
                                  </>
                                )}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                            {entries.map((entry, index) => {
                              const submissionData = entry.submission_data || entry.formatted_data || {};
                              
                              // Use persistent tracker entry number from backend
                              // This is calculated based on creation order within the tracker
                              const entryNumber = entry.tracker_entry_number || entry.id;
                              
                              // Only extract values for configured display fields to optimize performance
                              const displayValues = {};
                              trackerDisplayableFields.forEach((field) => {
                                const fieldId = field.id || field.field_id || field.name;
                                displayValues[fieldId] = submissionData[fieldId];
                              });
                              
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/admin/trackers/entries/${entry.slug || entry.id}`}
                              className="hover:underline"
                            >
                                      #{entryNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.status || "open"}</Badge>
                          </TableCell>
                                  {/* Dynamic field values - only show configured fields */}
                                  {trackerDisplayableFields.map((field) => {
                                    const fieldId = field.id || field.field_id || field.name;
                                    const value = displayValues[fieldId];
                                    return (
                                      <TableCell key={fieldId} className="text-sm">
                                        <div className="max-w-[200px] truncate" title={formatFieldValue(field, value)}>
                                          {formatFieldValue(field, value)}
                                        </div>
                          </TableCell>
                                    );
                                  })}
                                  {showMetadataColumns && (
                                    <>
                          <TableCell className="text-sm text-muted-foreground">
                            {entry.updated_at
                              ? format(parseUTCDate(entry.updated_at), "MMM d, yyyy HH:mm")
                                          : entry.created_at
                                          ? format(parseUTCDate(entry.created_at), "MMM d, yyyy HH:mm")
                              : "—"}
                          </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {getUserName(entry.updated_by_user_id || entry.submitted_by_user_id) || "—"}
                                      </TableCell>
                                    </>
                                  )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                                        {canReadEntries && (
                              <Link href={`/admin/trackers/entries/${entry.slug || entry.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                                        )}
                                        {canDeleteEntry && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.slug || entry.id)}
                                disabled={deleteEntryMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                                        )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={
                            currentPage === 1 ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === pagination.total_pages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                        )
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <PaginationItem>
                                <PaginationLink href="#" disabled>
                                  ...
                                </PaginationLink>
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < pagination.total_pages)
                              setCurrentPage(currentPage + 1);
                          }}
                          className={
                            currentPage === pagination.total_pages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
              </TabsContent>
            );
          })}
      </Tabs>
    </div>
  );
};

export default TrackersPage;

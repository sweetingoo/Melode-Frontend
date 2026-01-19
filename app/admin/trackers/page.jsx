"use client";

import React, { useState, useMemo } from "react";
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
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { toast } from "sonner";

const TrackersPage = () => {
  const router = useRouter();
  const [selectedTracker, setSelectedTracker] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isCreateEntryDialogOpen, setIsCreateEntryDialogOpen] = useState(false);
  const [selectedTrackerForEntry, setSelectedTrackerForEntry] = useState("");
  const [entryFormData, setEntryFormData] = useState({});
  const [entryFieldErrors, setEntryFieldErrors] = useState({});

  const itemsPerPage = 20;

  // Get trackers list
  const { data: trackersResponse, isLoading: trackersLoading } = useTrackers({
    page: 1,
    per_page: 100,
    is_active: true,
  });

  const trackers = useMemo(() => {
    if (!trackersResponse) return [];
    if (Array.isArray(trackersResponse)) return trackersResponse;
    return trackersResponse.trackers || [];
  }, [trackersResponse]);
  
  const createEntryMutation = useCreateTrackerEntry();
  
  // Get selected tracker details for form fields
  const selectedTrackerObj = useMemo(() => {
    if (!selectedTrackerForEntry) return null;
    return trackers.find((t) => t.slug === selectedTrackerForEntry);
  }, [selectedTrackerForEntry, trackers]);
  
  const { data: trackerDetails } = useTracker(selectedTrackerForEntry, {
    enabled: !!selectedTrackerForEntry && isCreateEntryDialogOpen,
  });

  // Build search params for entries
  const searchParams = useMemo(() => {
    const params = {
      page: currentPage,
      per_page: itemsPerPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (selectedTracker !== "all") {
      params.tracker_id = parseInt(selectedTracker);
    }

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (searchTerm) {
      params.query = searchTerm;
    }

    return params;
  }, [currentPage, selectedTracker, statusFilter, searchTerm, sortBy, sortOrder]);

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
    if (selectedTracker === "all") return [];
    const tracker = trackers.find((t) => t.id === parseInt(selectedTracker));
    if (!tracker?.tracker_config?.statuses) return [];
    return tracker.tracker_config.statuses;
  }, [selectedTracker, trackers]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Trackers</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Track cases, events, and actions with full audit history
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/trackers/manage">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Manage Trackers
            </Button>
          </Link>
          {trackers.length > 0 && (
            <Dialog 
              open={isCreateEntryDialogOpen} 
              onOpenChange={(open) => {
                setIsCreateEntryDialogOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  setSelectedTrackerForEntry("");
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
                    {selectedTrackerForEntry 
                      ? `Fill in the details for ${selectedTrackerObj?.name || "this tracker"}`
                      : "Select a tracker to create a new entry"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Tracker *</Label>
                    <Select
                      value={selectedTrackerForEntry}
                      onValueChange={(value) => {
                        setSelectedTrackerForEntry(value);
                        setEntryFormData({});
                        setEntryFieldErrors({});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tracker" />
                      </SelectTrigger>
                      <SelectContent>
                        {trackers
                          .filter((t) => t.is_active)
                          .map((tracker) => (
                            <SelectItem key={tracker.id} value={tracker.slug}>
                              {tracker.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {trackerDetails && trackerDetails.tracker_fields?.fields && (
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-semibold">Entry Details</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trackerDetails.tracker_fields.fields
                          .filter((field) => {
                            // Filter out display-only fields
                            const fieldType = field.type || field.field_type;
                            return !['text_block', 'image_block', 'line_break', 'page_break', 'youtube_video_embed'].includes(fieldType);
                          })
                          .map((field) => {
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
                    </div>
                  )}
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
                      if (!selectedTrackerForEntry || !trackerDetails) {
                        toast.error("Please select a tracker");
                        return;
                      }
                      
                      // Basic validation
                      const errors = {};
                      trackerDetails.tracker_fields?.fields?.forEach((field) => {
                        const fieldId = field.id || field.field_id;
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
                        setSelectedTrackerForEntry("");
                        setEntryFormData({});
                        setEntryFieldErrors({});
                      } catch (error) {
                        // Error handled by mutation
                      }
                    }}
                    disabled={!selectedTrackerForEntry || !trackerDetails || createEntryMutation.isPending}
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
                value={selectedTracker}
                onValueChange={(value) => {
                  setSelectedTracker(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Trackers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trackers</SelectItem>
                  {trackers.map((tracker) => (
                    <SelectItem key={tracker.id} value={tracker.id.toString()}>
                      {tracker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {availableStatuses.length > 0 ? (
                    availableStatuses.map((status) => (
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Entries ({pagination.total})
            {selectedTracker !== "all" && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                in {trackers.find((t) => t.id === parseInt(selectedTracker))?.name}
              </span>
            )}
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
                {searchTerm || selectedTracker !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No tracker entries yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tracker</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => {
                      // Form submissions use form_id, not tracker_id
                      const tracker = trackers.find((t) => t.id === entry.form_id || t.id === entry.tracker_id);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/admin/trackers/entries/${entry.id}`}
                              className="hover:underline"
                            >
                              #{entry.id}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {tracker ? (
                              <Link
                                href={`/admin/trackers/entries/${entry.id}`}
                                className="hover:underline"
                              >
                                {tracker.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.status || "open"}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {entry.created_at
                              ? format(parseUTCDate(entry.created_at), "MMM d, yyyy HH:mm")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {entry.updated_at
                              ? format(parseUTCDate(entry.updated_at), "MMM d, yyyy HH:mm")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/trackers/entries/${entry.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                                disabled={deleteEntryMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
    </div>
  );
};

export default TrackersPage;

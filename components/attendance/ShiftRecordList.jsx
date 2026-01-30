"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Plus, Pencil, Trash2, Loader2, CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { formatDateForAPI } from "@/utils/time";
import { cn } from "@/lib/utils";
import { keepPreviousData } from "@tanstack/react-query";
import { useShiftRecords, useDeleteShiftRecord } from "@/hooks/useShiftRecords";
import { ShiftRecordForm } from "./ShiftRecordForm";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "attendance", label: "Attendance" },
  { value: "authorised_leave", label: "Authorised Leave" },
  { value: "unauthorised_leave", label: "Unauthorised Leave" },
  { value: "provisional", label: "Provisional" },
  { value: "mapped", label: "Mapped" },
];

export const ShiftRecordList = ({
  userId = null,
  showCreateButton = true,
  allowUserSelect = false,
  defaultCategory = "all",
  compactHeader = false,
}) => {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState(defaultCategory);
  const [dateRange, setDateRange] = useState(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteSlug, setDeleteSlug] = useState(null);

  const applyDatePreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    const end = new Date(today);
    switch (preset) {
      case "today":
        setDateRange({ from: start, to: end });
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        setDateRange({ from: start, to: end });
        break;
      case "last7":
        start.setDate(start.getDate() - 6);
        setDateRange({ from: start, to: end });
        break;
      case "last30":
        start.setDate(start.getDate() - 29);
        setDateRange({ from: start, to: end });
        break;
      case "thisMonth":
        start.setDate(1);
        setDateRange({ from: start, to: end });
        break;
      case "lastMonth":
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0);
        setDateRange({ from: start, to: end });
        break;
      case "all":
        setDateRange(undefined);
        break;
      default:
        break;
    }
    setIsCalendarOpen(false);
  };

  const params = useMemo(
    () => ({
      user_id: userId || undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      start_date: dateRange?.from ? formatDateForAPI(dateRange.from) : undefined,
      end_date: dateRange?.to ? formatDateForAPI(dateRange.to) : undefined,
      page: 1,
      per_page: 100,
    }),
    [userId, categoryFilter, dateRange]
  );

  const { data, isLoading, error } = useShiftRecords(params, {
    placeholderData: keepPreviousData,
  });
  const deleteShiftRecord = useDeleteShiftRecord();

  const records = data?.records || data || [];
  const targetUserId = userId || user?.id;

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleFormClose = (open) => {
    if (!open) setSelectedRecord(null);
    setIsFormOpen(open);
  };

  const handleDeleteConfirm = async () => {
    if (deleteSlug) {
      try {
        await deleteShiftRecord.mutateAsync(deleteSlug);
        setDeleteSlug(null);
      } catch (err) {
        console.error("Delete shift record failed:", err);
      }
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      attendance: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      authorised_leave: "bg-green-500/10 text-green-700 dark:text-green-400",
      unauthorised_leave: "bg-red-500/10 text-red-700 dark:text-red-400",
      provisional: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      mapped: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    };
    return (
      <Badge variant="secondary" className={colors[category] || ""}>
        {category?.replace(/_/g, " ") || "—"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load shift records. Please try again.
      </div>
    );
  }

  const categoryFilterLabel =
    CATEGORIES.find((c) => c.value === categoryFilter)?.label || "Category";

  return (
    <div className="space-y-5 min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        {!compactHeader && (
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Shift Records</h2>
        )}
        <div className="flex min-w-0 flex-col gap-2 sm:ml-auto sm:flex-row sm:items-end sm:gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-full min-w-0 sm:w-[160px]">
                <SelectValue placeholder={categoryFilterLabel}>{categoryFilterLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Date range</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 w-full min-w-0 justify-start text-left font-normal sm:w-[240px]",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy")} – {format(dateRange.to, "dd MMM yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy")
                    )
                  ) : (
                    <span>Pick date range</span>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-[580px] p-0" align="start">
                <div className="p-3 border-b">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => applyDatePreset("today")} className="text-xs">
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyDatePreset("yesterday")} className="text-xs">
                      Yesterday
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyDatePreset("last7")} className="text-xs">
                      Last 7 days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyDatePreset("last30")} className="text-xs">
                      Last 30 days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyDatePreset("thisMonth")} className="text-xs">
                      This month
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyDatePreset("lastMonth")} className="text-xs">
                      Last month
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => applyDatePreset("all")} className="text-xs col-span-2">
                      All time
                    </Button>
                  </div>
                </div>
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  classNames={{
                    months: "flex flex-row gap-4",
                    month: "space-y-4",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          {showCreateButton && (
            <Button onClick={handleAdd} size="sm" className="h-9 gap-2 shadow-sm">
              <Plus className="h-4 w-4 shrink-0" />
              Add shift record
            </Button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No shift records found. {showCreateButton && "Add one to get started."}
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                {allowUserSelect && <TableHead>User</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-muted-foreground w-[120px]">Edited</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id || record.slug}>
                  {allowUserSelect && (
                    <TableCell>
                      {record.user?.display_name || record.user?.email || `User #${record.user_id}`}
                    </TableCell>
                  )}
                  <TableCell>
                    {record.shift_date
                      ? format(new Date(record.shift_date), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>{getCategoryBadge(record.category)}</TableCell>
                  <TableCell>
                    {record.shift_leave_type?.name || record.shift_leave_type_id || "—"}
                  </TableCell>
                  <TableCell>{record.hours ?? "—"}</TableCell>
                  <TableCell>
                    {record.start_time && record.end_time
                      ? `${String(record.start_time).slice(0, 5)} – ${String(record.end_time).slice(0, 5)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {record.notes || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs" title={record.edited_at ? `Edited at ${format(new Date(record.edited_at), "PPp")}${record.edited_by_user_id ? ` by user #${record.edited_by_user_id}` : ""}` : ""}>
                    {record.edited_at ? (
                      <>
                        {format(new Date(record.edited_at), "dd MMM HH:mm")}
                        {record.edited_by && (
                          <span className="block truncate text-muted-foreground/80">
                            by {record.edited_by.display_name || record.edited_by.email || ""}
                          </span>
                        )}
                        {record.edited_by_user_id && !record.edited_by && (
                          <span className="block truncate text-muted-foreground/80">by user #{record.edited_by_user_id}</span>
                        )}
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(record)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteSlug(record.slug)}
                        aria-label="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ShiftRecordForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        shiftRecord={selectedRecord}
        userId={targetUserId}
        allowUserSelect={allowUserSelect}
      />

      <AlertDialog open={!!deleteSlug} onOpenChange={(open) => !open && setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shift record</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the shift record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

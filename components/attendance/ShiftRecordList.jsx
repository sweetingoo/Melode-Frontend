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
import { Input } from "@/components/ui/input";
import { CalendarIcon, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteSlug, setDeleteSlug] = useState(null);

  const params = useMemo(
    () => ({
      user_id: userId || undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page: 1,
      per_page: 100,
    }),
    [userId, categoryFilter, startDate, endDate]
  );

  const { data, isLoading, error } = useShiftRecords(params);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {!compactHeader && <h2 className="text-xl font-semibold">Shift Records</h2>}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[140px]"
          />
          <Input
            type="date"
            placeholder="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[140px]"
          />
          {showCreateButton && (
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add shift record
            </Button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No shift records found. {showCreateButton && "Add one to get started."}
        </div>
      ) : (
        <div className="rounded-md border">
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

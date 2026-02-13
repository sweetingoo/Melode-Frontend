"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useProvisionalShifts, useDeleteProvisionalShift } from "@/hooks/useShiftRecords";
import { ProvisionalShiftForm } from "./ProvisionalShiftForm";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const ProvisionalShiftList = ({ userId = null, showCreateButton = true, compactHeader = false }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  const params = useMemo(
    () => ({
      user_id: userId || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page: 1,
      per_page: 100,
    }),
    [userId, startDate, endDate]
  );

  const { data, isLoading, error } = useProvisionalShifts(params);
  const deleteProvisionalShift = useDeleteProvisionalShift();

  const records = data?.records || data || [];

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
        await deleteProvisionalShift.mutateAsync(deleteSlug);
        setDeleteSlug(null);
      } catch (err) {
        console.error("Delete provisional shift failed:", err);
      }
    }
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
        Failed to load allocated shifts. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {!compactHeader && <h2 className="text-xl font-semibold">Allocated Shifts</h2>}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
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
              Add allocated shift
            </Button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No allocated shifts found. {showCreateButton && "Add one to plan shifts."}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id || record.slug}>
                  <TableCell>
                    {record.user?.display_name || record.user?.email || `User #${record.user_id}`}
                  </TableCell>
                  <TableCell>
                    {record.shift_date
                      ? format(new Date(record.shift_date), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {record.shift_leave_type?.name || record.shift_leave_type_id || "—"}
                  </TableCell>
                  <TableCell>{record.hours ?? "—"}</TableCell>
                  <TableCell>
                    {record.start_time && record.end_time
                      ? `${String(record.start_time).slice(0, 5)} – ${String(record.end_time).slice(0, 5)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {record.clock_record_id ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-green-600/15 text-green-700 dark:text-green-400 border-green-600/30">
                          Covered
                        </Badge>
                        <Button
                          variant="link"
                          className="h-auto p-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          title="View shift details"
                          onClick={() => setDetailRecord(record)}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          View clock
                        </Button>
                      </span>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                        Uncovered
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.notes || "—"}</TableCell>
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

      <ProvisionalShiftForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        shiftRecord={selectedRecord}
      />

      <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shift details</DialogTitle>
            <DialogDescription>Allocated shift information</DialogDescription>
          </DialogHeader>
          {detailRecord && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <Label className="text-muted-foreground font-normal">User</Label>
                <span>{detailRecord.user?.display_name || detailRecord.user?.email || `User #${detailRecord.user_id}`}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <Label className="text-muted-foreground font-normal">Date</Label>
                <span>{detailRecord.shift_date ? format(new Date(detailRecord.shift_date), "dd MMM yyyy") : "—"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <Label className="text-muted-foreground font-normal">Type</Label>
                <span>{detailRecord.shift_leave_type?.name || detailRecord.shift_leave_type_id || "—"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <Label className="text-muted-foreground font-normal">Hours</Label>
                <span>{detailRecord.hours ?? "—"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <Label className="text-muted-foreground font-normal">Time</Label>
                <span>
                  {detailRecord.start_time && detailRecord.end_time
                    ? `${String(detailRecord.start_time).slice(0, 5)} – ${String(detailRecord.end_time).slice(0, 5)}`
                    : "—"}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <Label className="text-muted-foreground font-normal">Status</Label>
                <span>
                  {detailRecord.clock_record_id ? (
                    <Badge className="bg-green-600/15 text-green-700 dark:text-green-400 border-green-600/30">Covered</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">Uncovered</Badge>
                  )}
                </span>
              </div>
              {detailRecord.notes && (
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                  <Label className="text-muted-foreground font-normal">Notes</Label>
                  <span className="break-words">{detailRecord.notes}</span>
                </div>
              )}
              {detailRecord.clock_record_id && (
                <p className="text-xs text-muted-foreground pt-1">This shift is linked to a clock session.</p>
              )}
            </div>
          )}
          <DialogFooter>
            {detailRecord?.clock_record_id && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/clock/history">View in My Time</Link>
              </Button>
            )}
            <Button variant="default" size="sm" onClick={() => setDetailRecord(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSlug} onOpenChange={(open) => !open && setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete allocated shift</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the allocated shift.
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

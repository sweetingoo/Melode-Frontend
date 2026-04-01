"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCalendarEventCategories,
  useCreateCalendarEventCategory,
  useUpdateCalendarEventCategory,
  useDeleteCalendarEventCategory,
} from "@/hooks/useCalendarEventCategories";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const DEFAULT_COLOR = "#6366f1";

export default function CalendarEventCategoriesPage() {
  const { hasPermission } = usePermissionsCheck();
  const canManage = hasPermission("event:update");

  const { data, isLoading } = useCalendarEventCategories({ includeInactive: true, enabled: canManage });
  const categories = data?.categories ?? [];
  const createMut = useCreateCalendarEventCategory();
  const updateMut = useUpdateCalendarEventCategory();
  const deleteMut = useDeleteCalendarEventCategory();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ name: "", color: DEFAULT_COLOR, sort_order: 0, is_active: true });

  const resetForm = () => setForm({ name: "", color: DEFAULT_COLOR, sort_order: 0, is_active: true });

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      name: row.name || "",
      color: row.color || DEFAULT_COLOR,
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active !== false,
    });
  };

  const normalizeHex = (v) => {
    const s = String(v || "").trim();
    if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(s)) return s;
    return null;
  };

  if (!canManage) {
    return (
      <div className="px-2 py-6 sm:px-0">
        <p className="text-sm text-muted-foreground">You need event update permission to manage event categories.</p>
        <Button variant="link" className="mt-2 px-0" asChild>
          <Link href="/admin/calendar">Back to calendar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-2 py-4 sm:px-0 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1" asChild>
            <Link href="/admin/calendar">
              <ArrowLeft className="h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Event categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Names and colours for calendar events. Inactive categories stay on past events but won&apos;t appear in pickers.
          </p>
        </div>
        <Button type="button" onClick={() => { resetForm(); setCreateOpen(true); }} className="gap-1">
          <Plus className="h-4 w-4" />
          New category
        </Button>
      </div>

      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No categories yet. Create one to tag events.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...categories]
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
                  .map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span
                          className="inline-block h-6 w-6 rounded-md border shadow-sm"
                          style={{ backgroundColor: row.color || DEFAULT_COLOR }}
                          title={row.color}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{row.sort_order ?? 0}</TableCell>
                      <TableCell>
                        {row.is_active ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove category?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  If events still use this category, it will be deactivated instead of deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMut.mutate(row.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="cec-name">Name</Label>
              <Input id="cec-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded border bg-background p-1"
                  value={normalizeHex(form.color) || DEFAULT_COLOR}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#RRGGBB"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cec-order">Sort order</Label>
              <Input
                id="cec-order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createMut.isPending || !form.name.trim() || !normalizeHex(form.color)}
              onClick={async () => {
                const hex = normalizeHex(form.color);
                if (!hex) return;
                await createMut.mutateAsync({
                  name: form.name.trim(),
                  color: hex,
                  sort_order: form.sort_order,
                });
                setCreateOpen(false);
                resetForm();
              }}
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="cee-name">Name</Label>
              <Input id="cee-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded border bg-background p-1"
                  value={normalizeHex(form.color) || DEFAULT_COLOR}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cee-order">Sort order</Label>
              <Input
                id="cee-order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor="cee-active" className="cursor-pointer">
                Active
              </Label>
              <Switch id="cee-active" checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={updateMut.isPending || !editRow || !form.name.trim() || !normalizeHex(form.color)}
              onClick={async () => {
                const hex = normalizeHex(form.color);
                if (!editRow || !hex) return;
                await updateMut.mutateAsync({
                  id: editRow.id,
                  data: {
                    name: form.name.trim(),
                    color: hex,
                    sort_order: form.sort_order,
                    is_active: form.is_active,
                  },
                });
                setEditRow(null);
              }}
            >
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

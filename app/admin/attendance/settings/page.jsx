"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Edit, Trash2, RotateCw, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useShiftLeaveTypes,
  useUpdateShiftLeaveType,
  useDeleteShiftLeaveType,
  useContractTypes,
  useCreateContractType,
  useUpdateContractType,
  useDeleteContractType,
  useHolidayYears,
  useUpdateHolidayYear,
  useDeleteHolidayYear,
  useRolloverHolidayYear,
  useAttendanceSettings,
  useUpdateAttendanceSettings,
} from "@/hooks/useAttendance";
import { getCategoryLabel } from "@/lib/attendanceLabels";
import { ShiftLeaveTypeForm } from "@/components/attendance/ShiftLeaveTypeForm";
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
import { Checkbox } from "@/components/ui/checkbox";
import { HolidayYearForm } from "@/components/attendance/HolidayYearForm";
import { toast } from "sonner";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useCurrentUser } from "@/hooks/useAuth";

export default function AttendanceSettingsPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { hasPermission } = usePermissionsCheck();
  const canManageSettings = hasPermission("attendance:settings");
  const permissionsLoading = userLoading;

  const [selectedTypeSlug, setSelectedTypeSlug] = useState(null);
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [isYearFormOpen, setIsYearFormOpen] = useState(false);
  const [holidayYearFormInitial, setHolidayYearFormInitial] = useState(null);
  const [deleteHolidayYearTarget, setDeleteHolidayYearTarget] = useState(null);
  const [rolloverDialogOpen, setRolloverDialogOpen] = useState(false);
  const [rolloverAllowNegative, setRolloverAllowNegative] = useState(false);
  const deleteSlugRef = useRef(null);
  const [systemHolidayYearStart, setSystemHolidayYearStart] = useState("04-01");
  const [systemDefaultHours, setSystemDefaultHours] = useState(7.5);
  const [systemAllowNegative, setSystemAllowNegative] = useState(false);
  const [provisionalShiftLinkWindowHours, setProvisionalShiftLinkWindowHours] = useState(2);
  const [isContractTypeFormOpen, setIsContractTypeFormOpen] = useState(false);
  const [selectedContractType, setSelectedContractType] = useState(null);
  const [contractTypeName, setContractTypeName] = useState("");
  const [contractTypeActive, setContractTypeActive] = useState(true);
  const [deleteContractTypeId, setDeleteContractTypeId] = useState(null);

  const { data: typesData, isLoading: typesLoading } = useShiftLeaveTypes({});
  const { data: contractTypesData, isLoading: contractTypesLoading } = useContractTypes({});
  const contractTypesList = Array.isArray(contractTypesData) ? contractTypesData : contractTypesData?.data ?? [];
  const createContractType = useCreateContractType();
  const updateContractType = useUpdateContractType();
  const deleteContractType = useDeleteContractType();
  const rolloverYear = useRolloverHolidayYear();
  const updateHolidayYear = useUpdateHolidayYear();
  const deleteHolidayYear = useDeleteHolidayYear();
  const { data: yearsData, isLoading: yearsLoading } = useHolidayYears({});
  const { data: settings, isLoading: settingsLoading } = useAttendanceSettings();
  const updateSettings = useUpdateAttendanceSettings();
  const updateShiftLeaveType = useUpdateShiftLeaveType();
  const deleteType = useDeleteShiftLeaveType();

  const types = typesData?.types || typesData || [];
  const years = Array.isArray(yearsData) ? yearsData : (yearsData?.years ?? yearsData ?? []);

  useEffect(() => {
    if (settings) {
      setSystemHolidayYearStart(settings.holiday_year_start_date ?? "04-01");
      setSystemDefaultHours(Number(settings.default_hours_per_day) || 7.5);
      setSystemAllowNegative(!!settings.allow_negative_holiday_balance);
      setProvisionalShiftLinkWindowHours(Number(settings.provisional_shift_link_window_hours) ?? 2);
    }
  }, [settings]);

  const handleSaveSystemSettings = () => {
    const hours = Number(systemDefaultHours);
    const windowHours = Number(provisionalShiftLinkWindowHours);
    if (!/^\d{2}-\d{2}$/.test(systemHolidayYearStart)) {
      toast.error("Invalid date format", { description: "Holiday year start must be MM-DD (e.g. 04-01)" });
      return;
    }
    if (!hours || hours < 0.5 || hours > 24) {
      toast.error("Invalid hours", { description: "Default hours per day must be between 0.5 and 24" });
      return;
    }
    if (windowHours < 0.5 || windowHours > 24) {
      toast.error("Invalid window", { description: "Provisional shift link window must be between 0.5 and 24 hours" });
      return;
    }
    updateSettings.mutate({
      holiday_year_start_date: systemHolidayYearStart,
      default_hours_per_day: hours,
      allow_negative_holiday_balance: systemAllowNegative,
      provisional_shift_link_window_hours: windowHours,
    });
  };

  // Redirect if user doesn't have attendance:settings (page is settings-only)
  useEffect(() => {
    if (permissionsLoading) return;
    if (!canManageSettings) {
      router.replace("/admin/attendance");
    }
  }, [canManageSettings, permissionsLoading, router]);

  const handleDeleteType = async (e) => {
    e?.preventDefault?.();
    const slug = deleteSlugRef.current ?? deleteSlug;
    if (!slug) return;
    try {
      await deleteType.mutateAsync(slug);
      setDeleteSlug(null);
      deleteSlugRef.current = null;
    } catch (error) {
      console.error("Failed to delete type:", error);
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      attendance: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      authorised_leave: "bg-green-500/10 text-green-700 dark:text-green-400",
      unauthorised_leave: "bg-red-500/10 text-red-700 dark:text-red-400",
      provisional: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      mapped: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    };
    return (
      <Badge variant="outline" className={colors[category] || ""}>
        {getCategoryLabel(category) || category}
      </Badge>
    );
  };

  if (permissionsLoading || !canManageSettings) {
    return (
      <div className="container mx-auto max-w-5xl py-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild aria-label="Back to Attendance">
            <Link href="/admin/attendance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Attendance Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Shift/leave types, holiday years, employee settings, and system defaults
            </p>
          </div>
        </div>
      </div>

      {/* Shift/Leave Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shift/Leave Types</CardTitle>
              <CardDescription>Manage the types of shifts and leave available in your organization</CardDescription>
            </div>
            <Button onClick={() => setIsTypeFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {typesLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : types.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No shift/leave types configured</p>
              <Button onClick={() => setIsTypeFormOpen(true)} className="mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create First Type
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Requires Approval</TableHead>
                    <TableHead>Deducts from Allowance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id || type.slug}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {type.display_color && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: type.display_color }}
                            />
                          )}
                          {type.name}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(type.category)}</TableCell>
                      <TableCell>{type.is_paid ? "Yes" : "No"}</TableCell>
                      <TableCell>{type.requires_approval ? "Yes" : "No"}</TableCell>
                      <TableCell>{type.deducts_from_holiday_allowance ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={!!type.is_active}
                          onCheckedChange={(checked) => {
                            const idOrSlug = type.slug != null ? type.slug : String(type.id);
                            updateShiftLeaveType.mutate({
                              slug: idOrSlug,
                              typeData: { is_active: !!checked },
                            });
                          }}
                          disabled={updateShiftLeaveType.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTypeSlug(type.slug ?? type.id);
                              setIsTypeFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const idOrSlug = type.slug != null ? type.slug : String(type.id);
                              setDeleteSlug(idOrSlug);
                              deleteSlugRef.current = idOrSlug;
                            }}
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
        </CardContent>
      </Card>

      {/* Contract Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract Types</CardTitle>
              <CardDescription>Options for Contract Type in Employee job role settings (e.g. Full-time, Part-time). Used for payroll reporting.</CardDescription>
            </div>
            {canManageSettings && (
              <Button
                onClick={() => {
                  setSelectedContractType(null);
                  setContractTypeName("");
                  setContractTypeActive(true);
                  setIsContractTypeFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contract Type
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contractTypesLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contractTypesList.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No contract types. Add one to use in Employee job role settings.</p>
              {canManageSettings && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setSelectedContractType(null);
                    setContractTypeName("");
                    setContractTypeActive(true);
                    setIsContractTypeFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contract Type
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    {canManageSettings && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractTypesList.map((ct) => (
                    <TableRow key={ct.id}>
                      <TableCell className="font-medium">{ct.name}</TableCell>
                      <TableCell>
                        <Badge variant={ct.is_active !== false ? "default" : "secondary"}>
                          {ct.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {canManageSettings && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContractType(ct);
                                setContractTypeName(ct.name || "");
                                setContractTypeActive(ct.is_active !== false);
                                setIsContractTypeFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteContractTypeId(ct.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Type Add/Edit Dialog */}
      <Dialog open={isContractTypeFormOpen} onOpenChange={setIsContractTypeFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedContractType ? "Edit Contract Type" : "Add Contract Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={contractTypeName}
                onChange={(e) => setContractTypeName(e.target.value)}
                placeholder="e.g. Full-time, Part-time"
              />
            </div>
            {selectedContractType && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ct-active"
                  checked={contractTypeActive}
                  onCheckedChange={(v) => setContractTypeActive(!!v)}
                />
                <Label htmlFor="ct-active">Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContractTypeFormOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!contractTypeName.trim() || createContractType.isPending || updateContractType.isPending}
              onClick={async () => {
                const name = contractTypeName.trim();
                if (!name) return;
                try {
                  if (selectedContractType) {
                    await updateContractType.mutateAsync({
                      idOrSlug: String(selectedContractType.id),
                      data: { name, is_active: contractTypeActive },
                    });
                  } else {
                    await createContractType.mutateAsync({ name, is_active: true });
                  }
                  setIsContractTypeFormOpen(false);
                } catch (_) {}
              }}
            >
              {(createContractType.isPending || updateContractType.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedContractType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Type confirmation */}
      <AlertDialog open={!!deleteContractTypeId} onOpenChange={(open) => !open && setDeleteContractTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the contract type from the list. Employee settings that use it will have contract type cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteContractTypeId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteContractTypeId) {
                  await deleteContractType.mutateAsync(String(deleteContractTypeId));
                  setDeleteContractTypeId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Holiday Years */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Holiday Years</CardTitle>
              <CardDescription>
                Each row is a fixed date range used for entitlements and leave. Changing the system &quot;Holiday year start&quot; above does not
                move existing years—edit a year here or add a new one if your policy dates change.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setRolloverDialogOpen(true)} disabled={years.length === 0}>
                <RotateCw className="mr-2 h-4 w-4" />
                Rollover to new year
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setHolidayYearFormInitial(null);
                  setIsYearFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Year
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {yearsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : years.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No holiday years configured</p>
              <Button
                onClick={() => {
                  setHolidayYearFormInitial(null);
                  setIsYearFormOpen(true);
                }}
                className="mt-4"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Year
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {years.map((year) => (
                <div key={year.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{year.year_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {year.start_date} to {year.end_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={year.is_active ? "default" : "secondary"}>
                      {year.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHolidayYearFormInitial(year);
                        setIsYearFormOpen(true);
                      }}
                    >
                      <Edit className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setDeleteHolidayYearTarget({
                          slug: year.slug ?? String(year.id),
                          yearName: year.year_name,
                        })
                      }
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                    {!year.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updateHolidayYear.isPending}
                        onClick={async () => {
                          try {
                            const slug = year.slug ?? String(year.id);
                            await updateHolidayYear.mutateAsync({ slug, yearData: { is_active: true } });
                            toast.success(`${year.year_name} is now the active holiday year`);
                          } catch (err) {
                            toast.error(err?.response?.data?.detail || "Failed to set active");
                          }
                        }}
                      >
                        {updateHolidayYear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set as active"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <HolidayYearForm
        open={isYearFormOpen}
        onOpenChange={(open) => {
          setIsYearFormOpen(open);
          if (!open) setHolidayYearFormInitial(null);
        }}
        initialYear={holidayYearFormInitial}
        defaultHolidayStartMmDd={systemHolidayYearStart}
      />

      <AlertDialog open={!!deleteHolidayYearTarget} onOpenChange={(open) => !open && setDeleteHolidayYearTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete holiday year?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteHolidayYearTarget?.yearName ? `Remove "${deleteHolidayYearTarget.yearName}". ` : ""}
              You can only delete a year that has no holiday entitlements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteHolidayYearTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteHolidayYearTarget?.slug) {
                  await deleteHolidayYear.mutateAsync(deleteHolidayYearTarget.slug);
                  setDeleteHolidayYearTarget(null);
                }
              }}
              disabled={deleteHolidayYear.isPending}
            >
              {deleteHolidayYear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rolloverDialogOpen} onOpenChange={setRolloverDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollover holiday year</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new holiday year starting the day after the current year ends, copy all entitlements
              (remaining hours carry forward), and deactivate the current year. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="rollover-allow-negative"
              checked={rolloverAllowNegative}
              onCheckedChange={(checked) => setRolloverAllowNegative(!!checked)}
            />
            <Label htmlFor="rollover-allow-negative" className="text-sm font-normal cursor-pointer">
              Allow negative balance to carry forward
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await rolloverYear.mutateAsync({ allow_negative_carry_forward: rolloverAllowNegative });
                  setRolloverDialogOpen(false);
                  setRolloverAllowNegative(false);
                } catch (err) {
                  console.error("Rollover failed:", err);
                }
              }}
              disabled={rolloverYear.isPending}
            >
              {rolloverYear.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rollover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure global attendance settings</CardDescription>
            </div>
            {!settingsLoading && (
              <Button
                onClick={handleSaveSystemSettings}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {updateSettings.isPending ? "Saving…" : "Save"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-year-start">Holiday Year Start Date (MM-DD)</Label>
                <Input
                  id="holiday-year-start"
                  placeholder="04-01"
                  value={systemHolidayYearStart}
                  onChange={(e) => setSystemHolidayYearStart(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: MM-DD (e.g., 04-01 for April 1st). Used as the default for new setup and some logic—existing holiday years keep their own
                  start/end until you edit them below.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-hours">Default Hours Per Day</Label>
                <Input
                  id="default-hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={systemDefaultHours}
                  onChange={(e) => setSystemDefaultHours(e.target.value ? parseFloat(e.target.value) : "")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-negative">Allow Negative Holiday Balance</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow users to have negative holiday balance (warns but allows if enabled)
                  </p>
                </div>
                <Switch
                  id="allow-negative"
                  checked={systemAllowNegative}
                  onCheckedChange={setSystemAllowNegative}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provisional-shift-window">Allocated shift link window (hours)</Label>
                <Input
                  id="provisional-shift-window"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={provisionalShiftLinkWindowHours}
                  onChange={(e) =>
                    setProvisionalShiftLinkWindowHours(
                      e.target.value ? parseFloat(e.target.value) : ""
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  When a user clocks in, show allocated shifts starting within this many hours before or after. Used to prompt &quot;Are you logging in to this shift?&quot; (default 2)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ShiftLeaveTypeForm
        open={isTypeFormOpen}
        onOpenChange={(open) => {
          setIsTypeFormOpen(open);
          if (!open) {
            setSelectedTypeSlug(null);
          }
        }}
        typeSlug={selectedTypeSlug}
      />

      <AlertDialog
        open={!!deleteSlug}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteSlug(null);
            deleteSlugRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift/Leave Type</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete this type? This cannot be undone. If it is used by leave requests or shift records, delete will be blocked—use the switch to deactivate instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={handleDeleteType}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

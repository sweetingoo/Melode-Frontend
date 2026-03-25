"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { format, startOfWeek, addDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, Loader2, UserCheck, UserX, Megaphone, Phone, MessageSquare, Building2, Clock, Users, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNowBoard, useAttendanceDepartments, attendanceKeys } from "@/hooks/useAttendance";
import { useLocations } from "@/hooks/useLocations";
import { attendanceService } from "@/services/attendance";
import { useCreateMessage } from "@/hooks/useMessages";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { formatDateForAPI } from "@/utils/time";
import { cn } from "@/lib/utils";
import CreateBroadcastDialog from "@/components/broadcasts/CreateBroadcastDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * Live "Now" board: people with open shift records (clocked in or manually started, still open).
 * List view filterable by department. Also shows per-role Expected / Checked-in / Missing.
 * Data: GET /attendance/now-board?date= (default today).
 */
export function NowBoardView({ departmentId: initialDepartmentId = null }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);
  const dateStr = formatDateForAPI(today);

  const [viewMode, setViewMode] = useState("today"); // "today" | "week"
  const [departmentId, setDepartmentId] = useState(initialDepartmentId ?? null);
  const [locationId, setLocationId] = useState(null);

  const weekDays = useMemo(() => {
    const mon = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [today]);

  const params = useMemo(
    () => ({
      date: dateStr,
      ...(departmentId != null ? { department_id: departmentId } : {}),
      ...(locationId != null ? { location_id: locationId } : {}),
    }),
    [dateStr, departmentId, locationId]
  );

  const { data, isLoading } = useNowBoard(params);
  const { data: departmentsList = [] } = useAttendanceDepartments({ enabled: true });
  const { data: locationsData } = useLocations();
  const locationsList = useMemo(() => {
    if (!locationsData) return [];
    if (Array.isArray(locationsData)) return locationsData;
    return locationsData?.locations ?? locationsData?.data ?? [];
  }, [locationsData]);

  const weekQueries = useQueries({
    queries: weekDays.map((day) => ({
      queryKey: attendanceKeys.nowBoard({
        date: formatDateForAPI(day),
        ...(departmentId != null ? { department_id: departmentId } : {}),
        ...(locationId != null ? { location_id: locationId } : {}),
      }),
      queryFn: async () => {
        const res = await attendanceService.getNowBoard({
          date: formatDateForAPI(day),
          ...(departmentId != null ? { department_id: departmentId } : {}),
          ...(locationId != null ? { location_id: locationId } : {}),
        });
        return res.data ?? res;
      },
      enabled: viewMode === "week",
      staleTime: 30 * 1000,
    })),
  });

  const byRole = data?.by_role ?? [];
  const clockedInNow = data?.clocked_in_now ?? [];
  const boardDate = data?.date ?? dateStr;

  const weekSummary = useMemo(() => {
    if (viewMode !== "week") return [];
    return weekQueries.map((q, i) => {
      const dayData = q.data;
      const byRoleDay = dayData?.by_role ?? [];
      let expected = 0;
      let checkedIn = 0;
      let missing = 0;
      byRoleDay.forEach((r) => {
        expected += r.expected_count ?? 0;
        checkedIn += r.checked_in_count ?? 0;
        missing += r.missing_count ?? 0;
      });
      return {
        date: weekDays[i],
        dateStr: formatDateForAPI(weekDays[i]),
        expected,
        checkedIn,
        missing,
      };
    });
  }, [viewMode, weekQueries, weekDays]);

  const weekLabel =
    weekDays.length === 7
      ? `${format(weekDays[0], "EEE d MMM")} – ${format(weekDays[6], "EEE d MMM yyyy")}`
      : "";
  const isWeekLoading = viewMode === "week" && weekQueries.some((q) => q.isLoading);

  const [callForCoverOpen, setCallForCoverOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);

  const { hasPermission } = usePermissionsCheck();
  const canSendBroadcast =
    hasPermission("broadcast:create") ||
    hasPermission("BROADCAST_CREATE") ||
    hasPermission("broadcast:send") ||
    hasPermission("BROADCAST_SEND");
  const { data: usersData } = useUsers({}, { enabled: broadcastDialogOpen });
  const { data: rolesData } = useRoles({}, { enabled: broadcastDialogOpen });
  const createMessageMutation = useCreateMessage();

  const broadcastInitialTitle = useMemo(() => "Cover needed today", []);
  const broadcastInitialContent = useMemo(
    () =>
      `We need cover for today's shifts (${format(new Date(boardDate + "T12:00:00"), "EEEE d MMM yyyy")}). Please check the Now board or contact your manager.`,
    [boardDate]
  );

  const missingWithRole = useMemo(() => {
    const out = [];
    byRole.forEach((role) => {
      const roleName = role.role_name || `Role ${role.shift_role_id ?? role.job_role_id ?? "—"}`;
      (role.missing ?? []).forEach((u) => {
        out.push({ ...u, role_name: roleName });
      });
    });
    return out;
  }, [byRole]);

  const getStatus = (role) => {
    const { expected_count, checked_in_count, missing_count } = role;
    if (expected_count === 0) return "muted";
    if (missing_count === 0) return "green";
    if (checked_in_count === 0) return "red";
    return "amber";
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case "green": return "All checked in";
      case "amber": return "Some missing";
      case "red": return "None checked in";
      case "muted": return "No expected staff";
      default: return "";
    }
  };

  const totalMissing = missingWithRole.length;

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      <CardHeader className="space-y-4 border-b bg-muted/10 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Radio className="h-5 w-5" aria-hidden />
              </span>
              Now
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground max-w-xl">
              {viewMode === "today"
                ? "People here now (clocked in or open shift) and expected vs missing by role. "
                : "Expected vs checked-in vs missing per day. "}
              <Link href={`/admin/attendance?tab=rota&from=${viewMode === "week" ? formatDateForAPI(weekDays[0]) : dateStr}&to=${viewMode === "week" ? formatDateForAPI(weekDays[6]) : dateStr}`} className="font-medium text-primary underline hover:no-underline inline whitespace-nowrap">
                Rota tab →
              </Link>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={departmentId != null ? String(departmentId) : "all"}
              onValueChange={(v) => setDepartmentId(v === "all" ? null : parseInt(v, 10))}
            >
              <SelectTrigger className="w-[200px] h-9 border bg-background">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {(departmentsList || []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name ?? `Department ${d.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={locationId != null ? String(locationId) : "all"}
              onValueChange={(v) => setLocationId(v === "all" ? null : parseInt(v, 10))}
            >
              <SelectTrigger className="w-[200px] h-9 border bg-background">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationsList.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name ?? `Location ${loc.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border bg-background p-0.5">
              <Button
                variant={viewMode === "today" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("today")}
                className="h-9 rounded-md px-3 text-sm font-medium"
              >
                Today
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="h-9 rounded-md px-3 text-sm font-medium"
              >
                This week
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
              <span className="text-muted-foreground whitespace-nowrap">
                {viewMode === "today"
                  ? format(new Date(boardDate + "T12:00:00"), "EEE d MMM yyyy")
                  : weekLabel}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setCallForCoverOpen(true)}
                disabled={totalMissing === 0}
                title={totalMissing === 0 ? "No one missing today" : "Call or message missing staff"}
              >
                <Phone className="mr-2 h-4 w-4 shrink-0" />
                Call for cover
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setBroadcastDialogOpen(true)}
                disabled={!canSendBroadcast}
                title={!canSendBroadcast ? "No permission" : "Send broadcast"}
              >
                <Megaphone className="mr-2 h-4 w-4 shrink-0" />
                Broadcast
              </Button>
            </div>
          </div>
        </div>
        {viewMode === "today" && !isLoading && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              {clockedInNow.length} here now
            </span>
            {totalMissing > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:text-amber-400">
                <UserX className="h-3.5 w-3.5" />
                {totalMissing} missing
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {viewMode === "week" ? (
          isWeekLoading ? (
            <div className="flex min-h-[200px] items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[280px] divide-y divide-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                  <span>Date</span>
                  <span className="text-center">Expected</span>
                  <span className="text-center">Checked-in</span>
                  <span className="text-center">Missing</span>
                </div>
                {weekSummary.map((day) => {
                  const status =
                    day.expected === 0 ? "muted" : day.missing === 0 ? "green" : day.checkedIn === 0 ? "red" : "amber";
                  return (
                    <div
                      key={day.dateStr}
                      role="row"
                      className={cn(
                        "grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 sm:px-6",
                        status === "green" && "bg-emerald-500/5",
                        status === "amber" && "bg-amber-500/5",
                        status === "red" && "bg-red-500/5"
                      )}
                    >
                      <span className="sr-only">{format(day.date, "EEEE d MMM")}: {getStatusLabel(status)}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            status === "green" && "bg-emerald-500",
                            status === "amber" && "bg-amber-500",
                            status === "red" && "bg-red-500",
                            status === "muted" && "bg-muted-foreground/50"
                          )}
                          aria-hidden
                        />
                        <Link
                          href={`/admin/attendance?tab=rota&from=${day.dateStr}&to=${day.dateStr}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {format(day.date, "EEE d MMM")}
                        </Link>
                      </div>
                      <div className="flex items-center justify-center">{day.expected}</div>
                      <div className="flex items-center justify-center font-medium text-emerald-600">{day.checkedIn}</div>
                      <div className="flex items-center justify-center">
                        <span className={cn(day.missing > 0 && "font-medium text-amber-600")}>{day.missing}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : byRole.length === 0 && clockedInNow.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No roles with expected shifts today. Add provisional shifts for today on the Rota.
          </div>
        ) : (
          <div className="space-y-6 p-4 sm:p-6">
            {/* People here now — primary list */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <UserCheck className="h-4 w-4" aria-hidden />
                  </span>
                  People here now
                </h3>
                {clockedInNow.length > 0 && (
                  <Badge variant="secondary" className="font-medium tabular-nums">
                    {clockedInNow.length}
                  </Badge>
                )}
              </div>
              {clockedInNow.length > 0 ? (
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                        <TableHead className="font-semibold w-[min(200px,40%)]">User</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Department</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Location</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Role</TableHead>
                        <TableHead className="font-semibold text-muted-foreground whitespace-nowrap text-right">Logged in at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clockedInNow.map((u, i) => {
                        const name = u.display_name ?? `User ${u.user_id}`;
                        const initials = name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                        return (
                          <TableRow
                            key={u.user_id}
                            className={cn(
                              "border-b border-border/50 last:border-0",
                              i % 2 === 1 && "bg-muted/20"
                            )}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border/50">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium truncate">{name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {u.department_name ? (
                                <span className="inline-flex items-center gap-1.5 truncate">
                                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  {u.department_name}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {u.location_name ? (
                                <span className="inline-flex items-center gap-1.5 truncate">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  {u.location_name}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {u.role_name ? (
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                  {u.role_name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap text-sm text-right">
                              {u.clock_in_time ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  {format(new Date(u.clock_in_time), "dd MMM, HH:mm")}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-12 px-4 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/60 mb-3" aria-hidden />
                  <p className="text-sm font-medium text-foreground">No one here right now</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                    People will appear here when they clock in or start an open shift.
                  </p>
                </div>
              )}
            </section>

            {/* By role — expected vs checked-in vs missing */}
            {byRole.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                Expected vs checked-in vs missing by role
              </h3>
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden min-w-0">
                <div className="grid grid-cols-[1fr_auto_auto_1fr] gap-4 border-b bg-muted/30 px-4 py-3 sm:px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Role</span>
                  <span className="text-center">Expected</span>
                  <span className="text-center">Checked-in</span>
                  <span>Missing</span>
                </div>
                {byRole.map((role) => {
                const status = getStatus(role);
                const roleName = role.role_name || `Role ${role.shift_role_id ?? role.job_role_id ?? "—"}`;
                return (
                  <div
                    key={`${role.shift_role_id ?? 0}-${role.job_role_id ?? 0}`}
                    role="row"
                    className={cn(
                      "grid grid-cols-[1fr_auto_auto_1fr] gap-4 px-4 py-3.5 sm:px-5 border-b border-border/50 last:border-0",
                      status === "green" && "bg-emerald-500/5",
                      status === "amber" && "bg-amber-500/5",
                      status === "red" && "bg-red-500/5"
                    )}
                  >
                    <span className="sr-only">{roleName}: {getStatusLabel(status)}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          status === "green" && "bg-emerald-500",
                          status === "amber" && "bg-amber-500",
                          status === "red" && "bg-red-500",
                          status === "muted" && "bg-muted-foreground/50"
                        )}
                        aria-hidden
                      />
                      <span className="font-medium text-foreground">{roleName}</span>
                    </div>
                  <div className="flex items-center justify-center gap-1">
                    <UserCheck className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>{role.expected_count}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span className={cn(role.checked_in_count === role.expected_count && "font-medium text-emerald-600")}>
                      {role.checked_in_count}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {role.missing_count === 0 ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                        {(role.missing ?? []).map((u) => (
                          <span
                            key={u.user_id}
                            className="rounded bg-amber-500/15 px-2 py-0.5 text-sm font-medium text-amber-800 dark:text-amber-200"
                          >
                            {u.display_name ?? `User ${u.user_id}`}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
            </section>
            )}
          </div>
        )}
      </CardContent>

      <CreateBroadcastDialog
        open={broadcastDialogOpen}
        onOpenChange={setBroadcastDialogOpen}
        onSubmit={async (data) => {
          try {
            await createMessageMutation.mutateAsync(data);
            setBroadcastDialogOpen(false);
          } catch (error) {
            // Error is handled by the mutation
          }
        }}
        isLoading={createMessageMutation.isPending}
        usersData={usersData}
        rolesData={rolesData}
        initialTitle={broadcastInitialTitle}
        initialContent={broadcastInitialContent}
      />

      <Dialog open={callForCoverOpen} onOpenChange={setCallForCoverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call for cover</DialogTitle>
            <DialogDescription>
              Staff missing today. Call or send an SMS using their phone number (if set).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto py-2">
            {missingWithRole.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one missing today.</p>
            ) : (
              missingWithRole.map((u) => {
                const name = u.display_name ?? `User ${u.user_id}`;
                const phone = u.phone_number?.trim?.() || null;
                const telHref = phone ? `tel:${phone.replace(/\s/g, "")}` : null;
                const smsHref = phone ? `sms:${phone.replace(/\s/g, "")}` : null;
                return (
                  <div
                    key={`${u.user_id}-${u.role_name}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{u.role_name}</p>
                      {phone && <p className="text-xs text-muted-foreground">{phone}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {telHref ? (
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href={telHref} target="_blank" rel="noopener noreferrer">
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No phone</span>
                      )}
                      {smsHref ? (
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href={smsHref} target="_blank" rel="noopener noreferrer">
                            <MessageSquare className="h-3.5 w-3.5" />
                            SMS
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

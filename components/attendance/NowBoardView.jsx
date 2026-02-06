"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { format, startOfWeek, addDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, Loader2, UserCheck, UserX, Megaphone, Phone, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNowBoard, attendanceKeys } from "@/hooks/useAttendance";
import { attendanceService } from "@/services/attendance";
import { useCreateMessage } from "@/hooks/useMessages";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { formatDateForAPI } from "@/utils/time";
import { cn } from "@/lib/utils";
import CreateBroadcastDialog from "@/components/broadcasts/CreateBroadcastDialog";

/**
 * Live "Now" board: today only; per role Expected | Checked-in | Missing.
 * Data: GET /attendance/now-board?date= (default today).
 * Status: green (all checked in), amber (some missing), red (none).
 */
export function NowBoardView({ departmentId = null }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);
  const dateStr = formatDateForAPI(today);

  const [viewMode, setViewMode] = useState("today"); // "today" | "week"

  const weekDays = useMemo(() => {
    const mon = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [today]);

  const params = useMemo(
    () => ({
      date: dateStr,
      ...(departmentId != null ? { department_id: departmentId } : {}),
    }),
    [dateStr, departmentId]
  );

  const { data, isLoading } = useNowBoard(params);

  const weekQueries = useQueries({
    queries: weekDays.map((day) => ({
      queryKey: attendanceKeys.nowBoard({
        date: formatDateForAPI(day),
        ...(departmentId != null ? { department_id: departmentId } : {}),
      }),
      queryFn: async () => {
        const res = await attendanceService.getNowBoard({
          date: formatDateForAPI(day),
          ...(departmentId != null ? { department_id: departmentId } : {}),
        });
        return res.data ?? res;
      },
      enabled: viewMode === "week",
      staleTime: 30 * 1000,
    })),
  });

  const byRole = data?.by_role ?? [];
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

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      <CardHeader className="space-y-3 border-b bg-muted/20 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Radio className="h-5 w-5 text-primary" aria-hidden />
              Now
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {viewMode === "today"
                ? "Today: who was expected, who has checked in, who is missing. Use for live ops. "
                : "This week: expected vs checked-in vs missing per day. "}
              <Link href={`/admin/attendance?tab=rota&from=${viewMode === "week" ? formatDateForAPI(weekDays[0]) : dateStr}&to=${viewMode === "week" ? formatDateForAPI(weekDays[6]) : dateStr}`} className="font-medium text-primary underline hover:no-underline">
                See rota (required vs allocated) → Rota tab
              </Link>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border bg-muted/30 p-0.5">
              <Button
                variant={viewMode === "today" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("today")}
                className="h-8 rounded-md px-3 text-xs font-medium"
              >
                Today
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="h-8 rounded-md px-3 text-xs font-medium"
              >
                This week
              </Button>
            </div>
            <span className="min-w-0 shrink rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <span className="hidden sm:inline">{viewMode === "today"
                ? format(new Date(boardDate + "T12:00:00"), "EEEE d MMMM yyyy")
                : weekLabel}</span>
              <span className="sm:hidden">{viewMode === "today"
                ? format(new Date(boardDate + "T12:00:00"), "EEE d MMM")
                : weekLabel}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCallForCoverOpen(true)}
              disabled={missingWithRole.length === 0}
              title={missingWithRole.length === 0 ? "No one missing today" : "Call or message missing staff"}
            >
              <Phone className="mr-2 h-4 w-4 shrink-0" />
              Call for cover
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBroadcastDialogOpen(true)}
              disabled={!canSendBroadcast}
              title={!canSendBroadcast ? "You don't have permission to send broadcasts" : "Send a broadcast from the portal"}
            >
              <Megaphone className="mr-2 h-4 w-4 shrink-0" />
              Broadcast
            </Button>
          </div>
        </div>
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
        ) : byRole.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No roles with expected shifts today. Add provisional shifts for today on the Rota or Allocated tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[320px] divide-y divide-border">
              <div className="grid grid-cols-[1fr_auto_auto_1fr] gap-4 border-b bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
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
                      "grid grid-cols-[1fr_auto_auto_1fr] gap-4 px-4 py-4 sm:px-6",
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

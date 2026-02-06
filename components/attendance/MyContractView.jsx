"use client";

import React, { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeeSettings } from "@/hooks/useAttendance";
import { useShiftRecords } from "@/hooks/useShiftRecords";
import { formatDateForAPI } from "@/utils/time";
import { cn } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/attendanceLabels";

/**
 * My Contract – contract band (EmployeeJobRoleSettings: normal_working_days, hours_per_day)
 * and exceptions (attendance, leave shift records) for the period.
 */
export function MyContractView() {
  const { user } = useAuth();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const startDateStr = formatDateForAPI(monthStart);
  const endDateStr = formatDateForAPI(monthEnd);

  const { data: settingsData, isLoading: settingsLoading } = useEmployeeSettings(user?.id ?? null, {}, { enabled: !!user?.id });
  const settingsList = Array.isArray(settingsData) ? settingsData : settingsData ? [settingsData] : [];
  const activeSetting = useMemo(
    () => settingsList.find((s) => s.is_currently_active ?? (s.is_active && !s.end_date)) ?? settingsList[0],
    [settingsList]
  );

  const shiftParams = useMemo(
    () =>
      user?.id
        ? {
            user_id: user.id,
            start_date: startDateStr,
            end_date: endDateStr,
            per_page: 100,
          }
        : null,
    [user?.id, startDateStr, endDateStr]
  );
  const { data: shiftData, isLoading: shiftLoading } = useShiftRecords(shiftParams, { enabled: !!user?.id });
  const records = shiftData?.records ?? shiftData ?? [];
  const exceptions = useMemo(
    () => records.filter((r) => r.category && !["mapped", "provisional"].includes(r.category)),
    [records]
  );

  const contractLabel = useMemo(() => {
    if (!activeSetting) return null;
    const days = activeSetting.normal_working_days ?? [];
    const dayLabels = days.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3));
    const hours = activeSetting.hours_per_day ?? 0;
    return `${dayLabels.join(", ")} · ${Number(hours)} hrs/day`;
  }, [activeSetting]);

  const goPrevMonth = () => setViewMonth((m) => subMonths(m, 1));
  const goNextMonth = () => setViewMonth((m) => addMonths(m, 1));
  const goThisMonth = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setViewMonth(d);
  };
  const monthLabel = format(monthStart, "MMMM yyyy");
  const monthLabelShort = format(monthStart, "MMM yyyy");

  if (!user?.id) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sign in to see your contract.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardHeader className="space-y-3 border-b bg-muted/20 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 text-primary" aria-hidden />
              My Contract
            </CardTitle>
            <CardDescription className="text-sm">
              Your contracted hours and exceptions (attendance, leave) for the period.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-start">
            <Button variant="outline" size="sm" onClick={goThisMonth} className="h-8 shrink-0 text-xs">
              This month
            </Button>
            <Button variant="outline" size="icon" onClick={goPrevMonth} className="h-8 w-8 shrink-0" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-0 shrink text-center text-sm font-medium">
              <span className="hidden sm:inline">{monthLabel}</span>
              <span className="sm:hidden">{monthLabelShort}</span>
            </span>
            <Button variant="outline" size="icon" onClick={goNextMonth} className="h-8 w-8 shrink-0" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {settingsLoading ? (
          <div className="flex min-h-[100px] items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your contract
              </h3>
              {activeSetting ? (
                <div className="rounded-lg border bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current contract</p>
                  <p className="mt-1 font-medium text-foreground">{contractLabel}</p>
                  {activeSetting.start_date && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Effective from {format(new Date(activeSetting.start_date + "T12:00:00"), "d MMM yyyy")}.
                    </p>
                  )}
                  {activeSetting.department_id != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Department / role set by your manager. Contact them to change.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No contract on file. Your manager can set your normal working days and hours in Attendance settings.
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Exceptions this period (attendance & leave)
              </h3>
              {shiftLoading ? (
                <div className="flex min-h-[80px] items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : exceptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance or leave records in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {exceptions.map((r) => {
                    const dateStr = typeof r.shift_date === "string" ? r.shift_date.slice(0, 10) : r.shift_date?.slice?.(0, 10);
                    const start = r.start_time ? String(r.start_time).slice(0, 5) : "—";
                    const end = r.end_time ? String(r.end_time).slice(0, 5) : "—";
                    const typeName = r.shift_leave_type?.name ?? getCategoryLabel(r.category) ?? r.category ?? "—";
                    return (
                      <li
                        key={r.id ?? r.slug}
                        className={cn(
                          "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                          r.category === "attendance" && "border-emerald-500/30 bg-emerald-500/5",
                          (r.category === "authorised_leave" || r.category === "unauthorised_leave") && "border-amber-500/30 bg-amber-500/5"
                        )}
                      >
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-[90px] font-medium text-foreground">
                          {dateStr ? format(new Date(dateStr + "T12:00:00"), "EEE d MMM") : "—"}
                        </span>
                        <span className="text-muted-foreground">{start} – {end}</span>
                        <span>{typeName}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

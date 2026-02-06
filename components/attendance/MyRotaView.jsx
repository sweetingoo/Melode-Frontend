"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format, startOfWeek, addDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useShiftRecords } from "@/hooks/useShiftRecords";
import { formatDateForAPI } from "@/utils/time";
import { cn } from "@/lib/utils";

/**
 * My Rota – week calendar of current user's allocated (provisional) shifts.
 * Data: GET /attendance/shift-records?user_id=currentUser&category=provisional&start_date=&end_date=
 */
export function MyRotaView() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return startOfWeek(d, { weekStartsOn: 1 });
  });

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const startDateStr = formatDateForAPI(weekDays[0]);
  const endDateStr = formatDateForAPI(weekDays[6]);

  const params = useMemo(
    () =>
      user?.id
        ? {
            user_id: user.id,
            category: "provisional",
            start_date: startDateStr,
            end_date: endDateStr,
            per_page: 100,
          }
        : null,
    [user?.id, startDateStr, endDateStr]
  );

  const { data, isLoading } = useShiftRecords(params, { enabled: !!user?.id });
  const records = data?.records ?? data ?? [];

  const byDate = useMemo(() => {
    const out = {};
    records.forEach((r) => {
      const d = typeof r.shift_date === "string" ? r.shift_date.slice(0, 10) : r.shift_date?.slice?.(0, 10);
      if (!d) return;
      if (!out[d]) out[d] = [];
      out[d].push(r);
    });
    weekDays.forEach((day) => {
      const d = formatDateForAPI(day);
      if (!out[d]) out[d] = [];
    });
    return out;
  }, [records, weekDays]);

  const goPrevWeek = () => setWeekStart((s) => addDays(s, -7));
  const goNextWeek = () => setWeekStart((s) => addDays(s, 7));
  const goThisWeek = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
  };

  const weekLabel = `${format(weekDays[0], "d MMM")} – ${format(weekDays[6], "d MMM yyyy")}`;
  const weekLabelShort = `${format(weekDays[0], "d")}–${format(weekDays[6], "d MMM")}`;
  const rotaLink = `/admin/attendance?tab=rota&from=${startDateStr}&to=${endDateStr}`;

  if (!user?.id) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sign in to see your rota.
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
              <LayoutGrid className="h-5 w-5 text-primary" aria-hidden />
              My Rota
            </CardTitle>
            <CardDescription className="text-sm">
              Your allocated shifts for the week. Request cover and swaps coming soon.{" "}
              <Link href={rotaLink} className="inline-flex items-center gap-1 font-medium text-primary underline hover:no-underline">
                View full rota
              </Link>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-start">
            <Button variant="outline" size="sm" onClick={goThisWeek} className="h-8 shrink-0 text-xs">
              This week
            </Button>
            <Button variant="outline" size="icon" onClick={goPrevWeek} className="h-8 w-8 shrink-0" aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-0 shrink text-center text-sm font-medium">
              <span className="hidden sm:inline">{weekLabel}</span>
              <span className="sm:hidden">{weekLabelShort}</span>
            </span>
            <Button variant="outline" size="icon" onClick={goNextWeek} className="h-8 w-8 shrink-0" aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {weekDays.map((day) => {
              const dateStr = formatDateForAPI(day);
              const dayRecords = byDate[dateStr] ?? [];
              const isToday = dateStr === formatDateForAPI(new Date());
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "px-4 py-3 sm:px-6",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-[100px] font-medium text-foreground">
                      {format(day, "EEE d MMM")}
                      {isToday && <span className="ml-1.5 text-xs text-primary">(today)</span>}
                    </div>
                    <div className="flex flex-1 flex-wrap gap-2">
                      {dayRecords.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No shift</span>
                      ) : (
                        dayRecords.map((r) => {
                          const start = r.start_time ? String(r.start_time).slice(0, 5) : "—";
                          const end = r.end_time ? String(r.end_time).slice(0, 5) : "—";
                          const typeName = r.shift_leave_type?.name ?? r.category ?? "Shift";
                          return (
                            <div
                              key={r.id ?? r.slug}
                              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                            >
                              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                              <span className="font-medium">{start} – {end}</span>
                              <span className="text-muted-foreground">·</span>
                              <span>{typeName}</span>
                              {r.shift_role_id != null || r.job_role_id != null ? (
                                <span className="text-muted-foreground text-xs">
                                  {r.shift_role?.display_name ?? r.job_role?.display_name ?? ""}
                                </span>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

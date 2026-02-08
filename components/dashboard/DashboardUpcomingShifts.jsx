"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShiftRecords } from "@/hooks/useShiftRecords";
import { getCategoryLabel } from "@/lib/attendanceLabels";
import { CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";

function toYYYYMMDD(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShiftDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Upcoming shifts. Uses existing shift records API with start_date/end_date. */
export function DashboardUpcomingShifts() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 13);
  const { data, isLoading } = useShiftRecords({
    start_date: toYYYYMMDD(today),
    end_date: toYYYYMMDD(end),
    per_page: 5,
    page: 1,
    sort_by: "shift_date",
    order: "asc",
  });

  const records = data?.records ?? data?.items ?? data?.data ?? [];
  const list = Array.isArray(records) ? records : [];

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          Upcoming Shifts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No shifts in the next 14 days</p>
        ) : (
          <ul className="space-y-1.5">
            {list.slice(0, 4).map((r, i) => {
              const dateVal = r.shift_date ?? r.start_date ?? r.start ?? r.date;
              const dateStr = formatShiftDate(dateVal);
              const categoryStr = r.category ? getCategoryLabel(r.category) : "";
              const typeName = r.shift_leave_type?.name;
              const display = [dateStr, categoryStr, typeName].filter(Boolean).join(" · ") || `Shift ${i + 1}`;
              return (
                <li key={r.id ?? r.slug ?? i}>
                  <Link
                    href="/admin/attendance"
                    className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-2 py-2 rounded-lg hover:bg-muted/50 transition-colors -mx-1 px-1"
                  >
                    <span className="truncate min-w-0 flex-1">{display}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/admin/attendance" className="text-sm font-medium text-primary hover:underline mt-3 inline-block">
          View all
        </Link>
      </CardContent>
    </Card>
  );
}

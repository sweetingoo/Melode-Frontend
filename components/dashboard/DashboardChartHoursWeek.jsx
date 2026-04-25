"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyClockRecords } from "@/hooks/useClock";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";

function toYYYYMMDD(d) {
  const x = new Date(d);
  const year = x.getFullYear();
  const month = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hoursBetween(start, end) {
  if (!start || !end) return 0;
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}

function getDurationSeconds(record, start, end) {
  const duration =
    record.shift_duration_seconds ??
    record.duration_seconds ??
    record.shift_duration;
  const seconds = Number(duration);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }

  return hoursBetween(start, end) * 3600;
}

function formatDurationHours(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return "0h";

  if (value < 1 / 60) {
    return `${Math.max(1, Math.round(value * 3600))}s`;
  }

  if (value < 1) {
    return `${Math.round(value * 60)}m`;
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)}h`;
}

/** Hours worked by day (last 7 days). Uses existing clock records API. */
export function DashboardChartHoursWeek() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const { data } = useMyClockRecords({
    start_date: toYYYYMMDD(weekAgo),
    end_date: toYYYYMMDD(today),
    per_page: 100,
    page: 1,
  });

  const records = data?.records ?? data?.items ?? data?.data ?? [];
  const list = Array.isArray(records) ? records : [];

  const byDay = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = toYYYYMMDD(d);
    byDay[key] = { date: key, label: d.toLocaleDateString("en-GB", { weekday: "short" }), hours: 0 };
  }

  list.forEach((r) => {
    const start = r.clock_in_time ?? r.clock_in;
    const end = r.clock_out_time ?? r.clock_out ?? new Date();
    const key = start ? toYYYYMMDD(start) : null;
    if (key && byDay[key] != null) {
      const duration = getDurationSeconds(r, start, end);
      byDay[key].hours += duration / 3600;
    }
  });

  const chartData = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-1 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground">
          <div className="h-9 w-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          Hours this week
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="hoursBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 13, fill: "var(--foreground)", fontWeight: 500 }}
                width={52}
                tickMargin={8}
                tickFormatter={formatDurationHours}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  backgroundColor: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                }}
                formatter={(v) => [formatDurationHours(v), "Hours"]}
                labelFormatter={(_, payload) => payload[0]?.payload?.date}
              />
              <Bar dataKey="hours" fill="url(#hoursBar)" radius={[8, 8, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

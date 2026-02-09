"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClockRecords } from "@/hooks/useClock";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";

function toYYYYMMDD(d) {
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

function hoursBetween(start, end) {
  if (!start || !end) return 0;
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}

/** Hours worked by day (last 7 days). Uses existing clock records API. */
export function DashboardChartHoursWeek() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const { data } = useClockRecords({
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
      const duration = r.shift_duration_seconds ?? r.duration_seconds ?? hoursBetween(start, end) * 3600;
      byDay[key].hours += typeof duration === "number" ? duration / 3600 : 0;
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
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="hoursBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={28} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  backgroundColor: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                }}
                formatter={(v) => [`${Number(v).toFixed(1)}h`, "Hours"]}
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

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock } from "lucide-react";
import Link from "next/link";

/** Superadmin: clocked in now vs online (30m). Uses dashboard active_now data. */
export function DashboardChartActiveNow({ dashboardData }) {
  const clockedIn = dashboardData?.operational?.clock_ins_today ?? dashboardData?.active_now?.clocked_in_now_count ?? 0;
  const online = dashboardData?.active_now?.active_sessions_count ?? dashboardData?.system_activity?.active_sessions ?? 0;

  const data = [
    { name: "Clocked in now", value: clockedIn, fill: "#22c55e" },
    { name: "Online (30m)", value: online, fill: "#3b82f6" },
  ];

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          Activity now
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} width={28} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Link href="/admin/clock/history" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">View clock history</Link>
      </CardContent>
    </Card>
  );
}

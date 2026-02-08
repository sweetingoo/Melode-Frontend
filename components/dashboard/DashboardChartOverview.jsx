"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";

/** Superadmin: overview bar chart (Tasks open, Completed, Clocked in, Online). Uses dashboard data. */
export function DashboardChartOverview({ dashboardData }) {
  const operational = dashboardData?.operational;
  const activeNow = dashboardData?.active_now;

  const data = [
    { name: "Tasks open", value: operational?.tasks_open ?? 0, fill: "#3b82f6" },
    { name: "Completed", value: operational?.tasks_completed_this_period ?? 0, fill: "#22c55e" },
    { name: "Clocked in", value: operational?.clock_ins_today ?? activeNow?.clocked_in_now_count ?? 0, fill: "#8b5cf6" },
    { name: "Online", value: activeNow?.active_sessions_count ?? dashboardData?.system_activity?.active_sessions ?? 0, fill: "#f59e0b" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#3b82f6">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

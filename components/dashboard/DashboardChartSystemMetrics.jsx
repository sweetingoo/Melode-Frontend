"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users } from "lucide-react";

/** Superadmin: system metrics bar chart (Total users, Invitations, Roles, Permissions). Uses dashboard data. */
export function DashboardChartSystemMetrics({ dashboardData }) {
  const data = [
    { name: "Total users", value: dashboardData?.total_users?.value ?? 0, fill: "#3b82f6" },
    { name: "Invitations", value: dashboardData?.new_invitations?.value ?? 0, fill: "#8b5cf6" },
    { name: "Active roles", value: dashboardData?.active_roles?.value ?? 0, fill: "#06b6d4" },
    { name: "Permissions", value: dashboardData?.permissions?.value ?? 0, fill: "#10b981" },
  ].filter((d) => d.value >= 0);

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          System metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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

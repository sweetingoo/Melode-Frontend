"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CheckSquare } from "lucide-react";
import Link from "next/link";

/** Superadmin: tasks open vs completed this period. Uses dashboard operational data. */
export function DashboardChartTasksOpenVsCompleted({ dashboardData, period = "month" }) {
  const open = dashboardData?.operational?.tasks_open ?? 0;
  const completed = dashboardData?.operational?.tasks_completed_this_period ?? 0;

  const data = [
    { name: "Open", value: open, color: "#3b82f6" },
    { name: `Completed (${period})`, value: completed, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-5 pb-5">
          <p className="text-sm text-muted-foreground py-4">No tasks data</p>
          <Link href="/admin/tasks" className="text-sm font-medium text-primary hover:underline">View tasks</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          Tasks (open vs completed)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Legend layout="horizontal" align="center" wrapperStyle={{ paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <Link href="/admin/tasks" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">View tasks</Link>
      </CardContent>
    </Card>
  );
}

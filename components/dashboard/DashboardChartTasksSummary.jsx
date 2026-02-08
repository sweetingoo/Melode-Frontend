"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyStats } from "@/hooks/useProfile";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CheckSquare } from "lucide-react";
import Link from "next/link";

/** Tasks: pending vs completed. Uses existing my stats API. */
export function DashboardChartTasksSummary() {
  const { data: myStats } = useMyStats();
  const pending = myStats?.total_tasks != null ? (myStats.total_tasks - (myStats.completed_tasks ?? 0)) : 0;
  const completed = myStats?.completed_tasks ?? 0;

  const data = [
    { name: "Pending", value: pending, color: "#94a3b8" },
    { name: "Completed", value: completed, color: "#10b981" },
  ].filter((d) => d.value > 0);

  if (pending === 0 && completed === 0) {
    return (
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-5 pb-5">
          <p className="text-sm text-muted-foreground py-4">No tasks yet</p>
          <Link href="/admin/my-tasks" className="text-sm font-medium text-primary hover:underline">
            View tasks
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-1 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          Tasks summary
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
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(v) => [v, ""]}
              />
              <Legend layout="horizontal" align="center" wrapperStyle={{ paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <Link href="/admin/my-tasks" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">
          View all tasks
        </Link>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Images } from "lucide-react";
import Link from "next/link";

/** Superadmin: assets total vs maintenance due. Uses dashboard operational data. */
export function DashboardChartAssets({ dashboardData }) {
  const total = dashboardData?.operational?.assets_total ?? 0;
  const maintenanceDue = dashboardData?.operational?.assets_maintenance_due ?? 0;
  const ok = Math.max(0, total - maintenanceDue);

  const data = [
    { name: "OK", value: ok, color: "#10b981" },
    { name: "Maintenance due", value: maintenanceDue, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Images className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-5 pb-5">
          <p className="text-sm text-muted-foreground py-4">No assets yet</p>
          <Link href="/admin/assets" className="text-sm font-medium text-primary hover:underline">View assets</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Images className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          Assets
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
        <Link href="/admin/assets" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">View assets</Link>
      </CardContent>
    </Card>
  );
}

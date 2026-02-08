"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useAuth";
import { useHolidayBalance } from "@/hooks/useAttendance";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Palmtree } from "lucide-react";
import Link from "next/link";

/** Leave balance: remaining vs used. Uses existing holiday balance API. */
export function DashboardChartLeaveBalance() {
  const { data: user } = useCurrentUser();
  const userId = user?.id ?? user?.user_id;
  const { data: balanceData } = useHolidayBalance({ user_id: userId }, { enabled: !!userId });

  const remaining = Number(balanceData?.remaining_hours ?? balanceData?.remaining ?? 0) || 0;
  const used = Number(balanceData?.used_hours ?? balanceData?.used ?? 0) || 0;
  const allowance = Number(balanceData?.annual_allowance_hours ?? balanceData?.allowance ?? 0) || remaining + used;

  const data = [
    { name: "Remaining", value: Math.max(0, remaining), color: "#0ea5e9" },
    { name: "Used", value: Math.max(0, used), color: "#cbd5e1" },
  ].filter((d) => d.value > 0);

  if (allowance === 0 && remaining === 0 && used === 0) {
    return (
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Palmtree className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            Leave balance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-5 pb-5">
          <p className="text-sm text-muted-foreground py-4">No balance data</p>
          <Link href="/admin/attendance" className="text-sm font-medium text-primary hover:underline">
            View attendance
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-1 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Palmtree className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          Leave balance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.length ? data : [{ name: "Remaining", value: 1, color: "#e2e8f0" }]}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {(data.length ? data : [{ color: "#e2e8f0" }]).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(v) => [`${Number(v).toFixed(1)}h`, ""]}
              />
              <Legend layout="horizontal" align="center" wrapperStyle={{ paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          <span className="font-semibold text-foreground">{remaining.toFixed(1)}h</span> remaining of {allowance ? `${allowance.toFixed(1)}h` : "—"} allowance
        </p>
        <Link href="/admin/attendance" className="text-sm font-medium text-primary hover:underline mt-1 inline-block">
          View attendance
        </Link>
      </CardContent>
    </Card>
  );
}

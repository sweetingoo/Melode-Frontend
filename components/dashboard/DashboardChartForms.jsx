"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FileText } from "lucide-react";
import Link from "next/link";

/** Superadmin: form submissions this period. Uses dashboard operational data. */
export function DashboardChartForms({ dashboardData, period = "month" }) {
  const count = dashboardData?.operational?.form_submissions_this_period ?? 0;
  const data = [{ name: `Submissions (${period})`, value: count, fill: "#8b5cf6" }];

  return (
    <Card className="rounded-2xl border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          Form submissions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="formsBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} width={28} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="value" fill="url(#formsBar)" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Link href="/admin/forms" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">View forms</Link>
      </CardContent>
    </Card>
  );
}

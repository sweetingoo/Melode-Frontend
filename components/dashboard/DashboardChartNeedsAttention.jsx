"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

/** Superadmin: needs attention bar chart (invitations, overdue tasks, submissions). Uses dashboard data. Only useful when any value > 0. */
export function DashboardChartNeedsAttention({ dashboardData }) {
  const needs = dashboardData?.needs_attention;
  const pendingInv = needs?.pending_invitations ?? 0;
  const overdue = needs?.overdue_tasks ?? 0;
  const pendingReview = needs?.submissions_pending_review ?? 0;
  const total = pendingInv + overdue + pendingReview;

  if (total === 0) return null;

  const data = [
    { name: "Pending invitations", value: pendingInv, fill: "#f59e0b", link: "/admin/people-management?tab=invitations" },
    { name: "Overdue tasks", value: overdue, fill: "#ef4444", link: "/admin/tasks?status=overdue" },
    { name: "Pending review", value: pendingReview, fill: "#eab308", link: "/admin/forms?filter=pending_review" },
  ].filter((d) => d.value > 0);

  return (
    <Card className="rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm overflow-hidden bg-amber-50/20 dark:bg-amber-950/10">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          Needs attention
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          {pendingInv > 0 && (
            <Link href="/admin/people-management?tab=invitations" className="text-amber-700 dark:text-amber-300 hover:underline font-medium">
              {pendingInv} invitation{pendingInv !== 1 ? "s" : ""}
            </Link>
          )}
          {overdue > 0 && (
            <Link href="/admin/tasks?status=overdue" className="text-red-700 dark:text-red-300 hover:underline font-medium">
              {overdue} overdue task{overdue !== 1 ? "s" : ""}
            </Link>
          )}
          {pendingReview > 0 && (
            <Link href="/admin/forms?filter=pending_review" className="text-amber-700 dark:text-amber-300 hover:underline font-medium">
              {pendingReview} submission{pendingReview !== 1 ? "s" : ""} to review
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import Link from "next/link";

/**
 * Recent activity list. Expects activities array: { id, type, title, description?, timestamp, link, icon }.
 * Uses existing data passed from parent (dashboard builds it from tasks, clock, forms, etc.).
 */
export function DashboardRecentActivity({ activities = [] }) {
  const list = activities.slice(0, 6);

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-slate-500/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No recent activity</p>
        ) : (
          <ul className="space-y-1.5">
            {list.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id}>
                  <Link
                    href={a.link ?? "#"}
                    className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors -mx-1 px-1"
                  >
                    {Icon && (
                      <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                    )}
                    <span className="truncate flex-1">{a.title}</span>
                    {a.timestamp && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(a.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

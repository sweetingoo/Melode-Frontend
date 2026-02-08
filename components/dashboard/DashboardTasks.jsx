"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyTasks } from "@/hooks/useTasks";
import { CheckSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

/** My tasks. Uses existing my-tasks API. */
export function DashboardTasks() {
  const { data, isLoading } = useMyTasks({ limit: 5, status: "pending" });

  const items = data?.items ?? data?.tasks ?? data?.data ?? [];
  const list = Array.isArray(items) ? items : [];
  const total = data?.total ?? list.length;

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            Tasks
          </CardTitle>
          {total > 0 && <Badge variant="secondary" className="rounded-full px-2.5 font-medium">{total}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending tasks</p>
        ) : (
          <ul className="space-y-2">
            {list.slice(0, 4).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/my-tasks${t.slug ? `?task=${t.slug}` : ""}`}
                  className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors -mx-1 px-1"
                >
                  <span className="truncate">{t.title ?? t.name}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
                {t.due_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Due {new Date(t.due_date).toLocaleDateString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/my-tasks" className="text-sm font-medium text-primary hover:underline mt-3 inline-block">
          View all
        </Link>
      </CardContent>
    </Card>
  );
}

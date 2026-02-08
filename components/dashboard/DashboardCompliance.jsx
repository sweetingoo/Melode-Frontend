"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpiringCompliance } from "@/hooks/useCompliance";
import { ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

/** Outstanding compliance: within 30 days of expiry / expired. Uses existing compliance API. */
export function DashboardCompliance() {
  const { data, isLoading, isError } = useExpiringCompliance(30, 1, 10, {});

  if (isError) return null;

  const items = data?.items ?? data?.statuses ?? data?.data ?? [];
  const total = data?.total ?? items.length;
  const expired = items.filter((i) => i.is_expired).length;
  const expiring = total - expired;

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            Outstanding Compliance
          </CardTitle>
          {total > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {expired > 0 && `${expired} expired`}
              {expired > 0 && expiring > 0 && " · "}
              {expiring > 0 && `${expiring} expiring`}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">None within 30 days</p>
        ) : (
          <ul className="space-y-1.5">
            {items.slice(0, 3).map((item) => (
              <li key={item.value_id ?? item.id}>
                <Link
                  href={item.value_slug ? `/admin/compliance-monitoring/${item.value_slug}` : "/admin/compliance-monitoring"}
                  className="text-sm hover:underline flex items-center gap-1"
                >
                  <span className="truncate">{item.field_label ?? item.field_name ?? "Compliance"}</span>
                  {item.is_expired && (
                    <span className="text-xs text-destructive shrink-0">Expired</span>
                  )}
                  {!item.is_expired && item.days_until_expiry != null && (
                    <span className="text-xs text-muted-foreground shrink-0">{item.days_until_expiry}d</span>
                  )}
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/compliance-monitoring" className="text-sm font-medium text-primary hover:underline mt-3 inline-block">
          View all
        </Link>
      </CardContent>
    </Card>
  );
}

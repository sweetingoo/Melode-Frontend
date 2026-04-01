"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyAcceptedCalendarEvents } from "@/hooks/useCalendarEvents";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { CalendarHeart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function categoryHex(c) {
  if (!c || typeof c !== "string") return null;
  return /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(c.trim()) ? c.trim() : null;
}

export function DashboardMyAcceptedEvents() {
  const { hasPermission } = usePermissionsCheck();
  const canOpenCalendar = hasPermission("event:list");
  const { data, isLoading, isError } = useMyAcceptedCalendarEvents({ limit: 8, enabled: true });
  const events = data?.events ?? [];

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <CalendarHeart className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          Events you&apos;re attending
        </CardTitle>
        <p className="text-xs text-muted-foreground font-normal pl-[2.875rem] -mt-1">
          Upcoming events where your RSVP is <span className="font-medium text-foreground">Attending</span>
        </p>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground py-4">Could not load events.</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No upcoming accepted events</p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((ev) => {
              const accent = categoryHex(ev.category?.color);
              const start = ev.starts_at ? new Date(ev.starts_at) : null;
              const timeOk = start && !Number.isNaN(start.getTime());
              const line1 = timeOk ? format(start, "EEE d MMM · HH:mm") : "—";
              const inner = (
                <>
                  <span
                    className="h-full w-1 shrink-0 rounded-full self-stretch min-h-[2.5rem]"
                    style={{ backgroundColor: accent || "hsl(var(--primary) / 0.35)" }}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
                    <span className="truncate text-sm font-medium text-foreground">{ev.title}</span>
                    <span className="text-xs text-muted-foreground">{line1}</span>
                    {ev.category?.name ? (
                      <span className="text-[11px] text-muted-foreground/90">{ev.category.name}</span>
                    ) : null}
                  </span>
                  {canOpenCalendar ? (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground self-center" />
                  ) : null}
                </>
              );
              const className =
                "flex w-full items-stretch gap-3 rounded-lg border border-transparent px-1 py-1 text-left transition-colors hover:bg-muted/50 -mx-1";
              if (canOpenCalendar && ev.slug) {
                return (
                  <li key={ev.slug}>
                    <Link
                      href={`/admin/calendar?event=${encodeURIComponent(ev.slug)}`}
                      className={className}
                    >
                      {inner}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={ev.slug || ev.id} className={className}>
                  {inner}
                </li>
              );
            })}
          </ul>
        )}
        {canOpenCalendar ? (
          <Link href="/admin/calendar" className="text-sm font-medium text-primary hover:underline mt-3 inline-block">
            Open calendar
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">Calendar requires event list permission to open events.</p>
        )}
      </CardContent>
    </Card>
  );
}

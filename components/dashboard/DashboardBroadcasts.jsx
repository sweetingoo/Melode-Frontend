"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBroadcastInbox } from "@/hooks/useMessages";
import { Megaphone, ArrowRight } from "lucide-react";
import Link from "next/link";

/** Unread / require acknowledgement broadcasts. Uses existing GET /broadcasts/inbox. */
export function DashboardBroadcasts() {
  const { data: unreadData } = useBroadcastInbox({ unread_only: true, per_page: 5, page: 1 });
  const { data: unackData } = useBroadcastInbox({ unacknowledged_only: true, per_page: 5, page: 1 });

  const unread = unreadData?.broadcasts ?? unreadData?.items ?? [];
  const unack = unackData?.broadcasts ?? unackData?.items ?? [];
  const total = Math.max(unread.length, unack.length);
  const displayList = unread.length ? unread : unack;

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            Broadcasts
          </CardTitle>
          {(unread.length > 0 || unack.length > 0) && (
            <Badge variant="secondary" className="rounded-full px-2.5 font-medium">
              {unread.length || unack.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        {displayList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">All caught up</p>
        ) : (
          <ul className="space-y-2.5">
            {displayList.slice(0, 3).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/broadcasts/${b.slug ?? b.id}`}
                  className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors -mx-1 px-1"
                >
                  <span className="truncate flex-1">{b.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/admin/broadcasts"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-3 transition-colors"
        >
          View all
        </Link>
      </CardContent>
    </Card>
  );
}

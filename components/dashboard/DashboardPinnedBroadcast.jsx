"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useBroadcastInbox } from "@/hooks/useMessages";
import { Megaphone } from "lucide-react";
import Link from "next/link";

/** Featured/pinned broadcast at top. Uses first broadcast from inbox until dashboard API returns pinned_broadcast_id. */
export function DashboardPinnedBroadcast() {
  const { data, isLoading } = useBroadcastInbox({ per_page: 1, page: 1 });

  const items = data?.broadcasts ?? data?.items ?? data?.data ?? [];
  const broadcast = items[0];

  if (isLoading || !broadcast) return null;

  return (
    <Link href={`/admin/broadcasts/${broadcast.slug ?? broadcast.id}`}>
      <Card className="rounded-2xl border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <CardContent className="py-4 px-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider">Pinned</p>
            <p className="font-semibold text-foreground truncate mt-0.5">{broadcast.title}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Calendar events use the same timeline as the rota (Time & Attendance → Rota).
 * This route keeps old links working and optional ?event=slug deep links.
 */
function CalendarRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const event = searchParams.get("event");
    const params = new URLSearchParams();
    params.set("tab", "rota");
    if (event) params.set("event", event);
    router.replace(`/admin/attendance?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Opening rota…</p>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CalendarRedirectInner />
    </Suspense>
  );
}

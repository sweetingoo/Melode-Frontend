"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RotaTimeline } from "@/components/attendance/RotaTimeline";

/**
 * Calendar page uses the same layout as attendance rota,
 * but focuses on events only.
 */
function CalendarPageInner() {
  const searchParams = useSearchParams();

  const initialRange = useMemo(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) return null;
    const fromDate = new Date(`${from}T12:00:00`);
    const toDate = new Date(`${to}T12:00:00`);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return null;
    return { from: fromDate, to: toDate };
  }, [searchParams]);

  const initialOpenEventSlug = searchParams.get("event") || undefined;

  return (
    <div className="w-full space-y-4 px-2 py-4 sm:space-y-6 sm:px-0 sm:py-6">
      <RotaTimeline initialRange={initialRange} initialOpenEventSlug={initialOpenEventSlug} eventsOnly />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center p-8 text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CalendarPageInner />
    </Suspense>
  );
}

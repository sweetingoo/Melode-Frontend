"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClockStatus } from "@/hooks/useClock";
import { Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Clock In/Out status. Uses existing clock status API. */
export function DashboardClock() {
  const { data: clockStatus } = useClockStatus();

  const isClockedIn =
    clockStatus?.is_clocked_in === true ||
    clockStatus?.status === "active" ||
    clockStatus?.status === "on_break" ||
    clockStatus?.current_state === "active" ||
    clockStatus?.current_state === "on_break";
  const isOnBreak =
    clockStatus?.is_on_break === true ||
    clockStatus?.status === "on_break" ||
    clockStatus?.current_state === "on_break";

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent dark:from-emerald-500/10">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                isClockedIn ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
              }`}
            >
              <Clock className="h-4 w-4" />
            </div>
            Clock
          </CardTitle>
          <Link href="/clock">
            <Button
              variant={isClockedIn ? "outline" : "default"}
              size="sm"
              className="h-8 text-xs font-medium shrink-0"
            >
              {isClockedIn ? "View shift" : "Clock in"}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <p className="text-sm font-medium text-foreground">
          {isClockedIn ? (isOnBreak ? "On break" : "Clocked in") : "Clocked out"}
        </p>
        {isClockedIn && clockStatus?.clock_in_time && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Since {new Date(clockStatus.clock_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

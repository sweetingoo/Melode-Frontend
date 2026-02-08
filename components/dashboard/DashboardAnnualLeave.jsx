"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useAuth";
import { useHolidayBalance } from "@/hooks/useAttendance";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { Palmtree, ArrowRight } from "lucide-react";
import Link from "next/link";

/** Annual leave: balance + upcoming requests. Uses existing leave and holiday balance APIs. */
export function DashboardAnnualLeave() {
  const { data: user } = useCurrentUser();
  const userId = user?.id ?? user?.user_id;
  const { data: balanceData } = useHolidayBalance({ user_id: userId }, { enabled: !!userId });
  const { data: leaveData } = useLeaveRequests({ per_page: 5, page: 1 });

  const balance = balanceData?.balance ?? balanceData?.remaining_hours ?? balanceData?.remaining ?? 0;
  const requests = leaveData?.requests ?? leaveData?.items ?? leaveData?.data ?? [];
  const list = Array.isArray(requests) ? requests : [];
  const upcoming = list.filter((r) => r.status === "approved" || r.status === "pending");

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow transition-shadow overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Palmtree className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          Annual Leave
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="space-y-3">
          {balanceData != null && (
            <p className="text-sm font-semibold text-foreground">
              Balance: {typeof balance === "number" ? `${balance.toFixed(1)}h` : balance}
            </p>
          )}
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No upcoming leave</p>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <Link
                    href="/admin/attendance"
                    className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-2 py-2 rounded-lg hover:bg-muted/50 transition-colors -mx-1 px-1"
                  >
                    <span>
                      {r.start_date} – {r.end_date}
                      {r.status === "pending" && " (pending)"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/admin/attendance" className="text-sm font-medium text-primary hover:underline mt-3 inline-block">
          View all
        </Link>
      </CardContent>
    </Card>
  );
}

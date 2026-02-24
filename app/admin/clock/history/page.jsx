"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useAssignments } from "@/hooks/useAssignments";
import { LeaveRequestList } from "@/components/attendance/LeaveRequestList";
import { HolidayBalanceCard } from "@/components/attendance/HolidayBalanceCard";
import { MyRotaView } from "@/components/attendance/MyRotaView";
import { MyContractView } from "@/components/attendance/MyContractView";
import { ShiftRecordList } from "@/components/attendance/ShiftRecordList";
import { History, ChevronLeft, ChevronRight, Calendar, LayoutGrid, FileText } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Suspense } from "react";

const MY_TIME_TAB_VALUES = ["my-time", "my-leave", "my-rota", "my-contract"];

const PERM_MANAGE_ALL = "attendance:manage_all";
const PERM_MANAGE_ALL_SHIFT_RECORDS = "attendance:manage_all_shift_records";

function ClockHistoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasPermission } = usePermissionsCheck();
  const canManageAllShiftRecords =
    hasPermission(PERM_MANAGE_ALL) || hasPermission(PERM_MANAGE_ALL_SHIFT_RECORDS);
  const { data: assignmentsData, isLoading: assignmentsLoading } = useAssignments(
    { user_id: user?.id, is_active: true },
    { enabled: !!user?.id }
  );
  const assignments = assignmentsData?.assignments || assignmentsData || [];
  const activeAssignment = assignments?.[0];
  const jobRoleId = activeAssignment?.role_id ?? activeAssignment?.job_role_id;
  // If user has a role that has shifts (job/shift role assignment, not only system roles), show only their own shifts in My Time
  const hasRoleWithShifts =
    Array.isArray(assignments) &&
    assignments.some((a) => {
      const roleId = a.role_id ?? a.job_role_id ?? a.roleId ?? a.jobRoleId;
      if (roleId == null) return false;
      const roleType = a.role?.role_type ?? a.role?.roleType;
      return roleType !== "system";
    });
  // Only show all users' shifts if admin has no shift role; while assignments load, show only own (safe default)
  const showAllShiftsInMyTime =
    canManageAllShiftRecords && !hasRoleWithShifts && !assignmentsLoading;
  const [activeTab, setActiveTab] = useState("my-time");

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    setActiveTab(urlTab && MY_TIME_TAB_VALUES.includes(urlTab) ? urlTab : "my-time");
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/admin/clock/history?${params.toString()}`, { scroll: false });
  };
  const tabsScrollRef = React.useRef(null);
  const [tabsScrollState, setTabsScrollState] = useState({ left: false, right: false });

  const updateTabsScrollState = React.useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 0;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setTabsScrollState((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  React.useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    updateTabsScrollState();
    el.addEventListener("scroll", updateTabsScrollState);
    const ro = new ResizeObserver(updateTabsScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateTabsScrollState);
      ro.disconnect();
    };
  }, [updateTabsScrollState]);

  return (
    <div className="w-full space-y-4 px-2 pt-0 pb-4 sm:space-y-6 sm:px-0 sm:pt-0 sm:pb-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <div className="sticky top-0 z-0 -mx-2 -mt-px border-b bg-background px-3 py-0 shadow-[0_1px_0_0_hsl(var(--border))] sm:-mx-4 sm:px-4">
          <div className="relative flex items-center">
            {tabsScrollState.left && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-0 z-10 h-8 w-8 shrink-0 rounded-full bg-background/80 shadow-sm hover:bg-muted"
                onClick={() => tabsScrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
                aria-label="Scroll tabs left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div
              ref={tabsScrollRef}
              className="min-w-0 flex-1 overflow-x-auto scrollbar-hide pr-8"
            >
              <TabsList className="inline-flex h-auto w-max flex-shrink-0 flex-nowrap gap-1 rounded-lg bg-muted/50 p-1 [&>button]:shrink-0">
                <TabsTrigger value="my-time" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
                  <History className="mr-2 h-4 w-4 shrink-0" />
                  My Time
                </TabsTrigger>
                <TabsTrigger value="my-leave" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
                  <Calendar className="mr-2 h-4 w-4 shrink-0" />
                  My Leave
                </TabsTrigger>
                <TabsTrigger value="my-rota" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
                  <LayoutGrid className="mr-2 h-4 w-4 shrink-0" />
                  My Rota
                </TabsTrigger>
                <TabsTrigger value="my-contract" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
                  <FileText className="mr-2 h-4 w-4 shrink-0" />
                  My Contract
                </TabsTrigger>
              </TabsList>
            </div>
            {tabsScrollState.right && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 z-10 h-8 w-8 shrink-0 rounded-full bg-background/80 shadow-sm hover:bg-muted"
                onClick={() => tabsScrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
                aria-label="Scroll tabs right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="my-time" className="mt-0 focus-visible:outline-none space-y-6">
      {/* My Shifts: single merged list (attendance from clock-in/out + manual + leave + allocated) */}
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1.5 p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {showAllShiftsInMyTime ? "My Shifts (All Users)" : "My Shifts"}
          </CardTitle>
          <CardDescription className="text-sm">
            {showAllShiftsInMyTime
              ? "All shifts and sessions in one list. Attended shows how it was logged (clocked in/out or manual). Use filters by user, date, or category."
              : "All your shifts in one list: attended (clocked in/out or manually added), leave, and allocated. The “How logged” column shows whether a shift was recorded by clocking in/out or added manually."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ShiftRecordList
            userId={showAllShiftsInMyTime ? undefined : user?.id}
            showCreateButton={true}
            allowUserSelect={showAllShiftsInMyTime}
            defaultCategory="all"
            compactHeader
          />
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="my-rota" className="mt-0 focus-visible:outline-none space-y-6">
          <MyRotaView />
        </TabsContent>

        <TabsContent value="my-contract" className="mt-0 focus-visible:outline-none space-y-6">
          <MyContractView />
        </TabsContent>

        <TabsContent value="my-leave" className="mt-0 focus-visible:outline-none space-y-6">
          {/* Holiday balance at top so users see remaining leave whilst selecting leave */}
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1.5 p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Holiday Balance</CardTitle>
              <CardDescription className="text-sm">Your current holiday balance.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {user?.id && jobRoleId ? (
                <HolidayBalanceCard userId={user.id} jobRoleId={jobRoleId} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active job role found. Please contact your administrator to assign a role.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 border-b bg-muted/20 px-4 py-5 sm:px-6 sm:py-6">
              <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">My Leave Requests</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Submit and track holiday, sick leave, and other time off. Pending requests need manager approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <LeaveRequestList userId={user?.id} showCreateButton={true} compactHeader />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ClockHistoryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center p-8 text-muted-foreground">Loading…</div>}>
      <ClockHistoryPageContent />
    </Suspense>
  );
}

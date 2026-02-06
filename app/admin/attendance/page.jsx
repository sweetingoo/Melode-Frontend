"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveApprovalList } from "@/components/attendance/LeaveApprovalList";
import { ShiftRecordList } from "@/components/attendance/ShiftRecordList";
import { ProvisionalShiftList } from "@/components/attendance/ProvisionalShiftList";
import { RotaTimeline } from "@/components/attendance/RotaTimeline";
import { NowBoardView } from "@/components/attendance/NowBoardView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { BarChart3, Settings, ClipboardList, UserCheck, MapPin, LayoutGrid, Radio, ChevronLeft, ChevronRight, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/lib/attendanceLabels";

/**
 * Attendance & Leave page – permission per tab
 *
 * Page access: attendance:view (sidebar). Who can open the page is controlled there.
 *
 * Tab visibility (each tab has its own permission where listed):
 * (My Leave is on My Time page: /admin/clock/history?tab=my-leave)
 * - Approvals     – leave:approve
 * - Shift Records – no extra permission (everyone); content scope = own vs all (see below)
 * - Provisional   – attendance:manage_all
 *
 * (Required Templates tab removed: may do differently / not use. Calendar tab removed: rota tab now covers shift/leave view. Balance removed: users see their balance on My Time → My Leave; admins can view anyone's in People Management → Edit Person.)
 *
 * Shift Records content (not tab visibility):
 * - "Your Shift Records" (own only): default for users with attendance:view
 * - "Shift Records (All Users)": requires attendance:manage_all OR attendance:manage_all_shift_records
 *
 * Header buttons: Reports=attendance:reports, Settings=attendance:settings.
 * Actions are enforced by the API.
 */
const PERM = {
  LEAVE_APPROVE: "leave:approve",
  REPORTS: "attendance:reports",
  SETTINGS: "attendance:settings",
  MANAGE_ALL: "attendance:manage_all",
  MANAGE_ALL_SHIFT_RECORDS: "attendance:manage_all_shift_records",
};

const TAB_VALUES = ["approvals", "shift-records", "rota", "now", "provisional"];

function AttendancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasPermission } = usePermissionsCheck();

  const canApprove = hasPermission(PERM.LEAVE_APPROVE);
  const canViewReports = hasPermission(PERM.REPORTS);
  const canManageSettings = hasPermission(PERM.SETTINGS);
  const canManageAll = hasPermission(PERM.MANAGE_ALL);
  const canManageAllShiftRecords =
    canManageAll || hasPermission(PERM.MANAGE_ALL_SHIFT_RECORDS);

  const allowedTabs = useMemo(() => {
    const allowed = new Set(["shift-records", "rota", "now"]);
    if (canApprove) allowed.add("approvals");
    if (canManageAll) {
      allowed.add("provisional");
    }
    return allowed;
  }, [canApprove, canManageAll]);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "shift-records";
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    return t && TAB_VALUES.includes(t) ? t : "shift-records";
  });

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && TAB_VALUES.includes(urlTab)) {
      setActiveTab(allowedTabs.has(urlTab) ? urlTab : "shift-records");
    } else {
      setActiveTab("shift-records");
    }
  }, [searchParams, allowedTabs]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/admin/attendance?${params.toString()}`, { scroll: false });
  };

  const tabsScrollRef = useRef(null);
  const [scrollIndicators, setScrollIndicators] = useState({ left: false, right: false });

  const updateScrollIndicators = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setScrollIndicators({
      left: scrollLeft > 2,
      right: scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    updateScrollIndicators();
    const ro = new ResizeObserver(updateScrollIndicators);
    ro.observe(el);
    el.addEventListener("scroll", updateScrollIndicators);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollIndicators);
    };
  }, [updateScrollIndicators, allowedTabs]);

  const scrollTabs = (direction) => {
    const el = tabsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 120, behavior: "smooth" });
  };

  const initialRotaRange = useMemo(() => {
    if (activeTab !== "rota") return null;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) return null;
    const fromDate = new Date(from + "T12:00:00");
    const toDate = new Date(to + "T12:00:00");
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return null;
    return { from: fromDate, to: toDate };
  }, [activeTab, searchParams]);

  return (
    <div className="w-full space-y-4 px-2 py-4 sm:space-y-6 sm:px-0 sm:py-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        {/* Sticky bar: on mobile tabs first row, Reports/Settings second row; desktop single row */}
        <div className="sticky top-0 z-0 -mx-2 border-b bg-background px-3 pb-3 pt-2 shadow-[0_1px_0_0_hsl(var(--border))] sm:-mx-4 sm:px-4 sm:pb-2 sm:pt-1">
          <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-between md:gap-2">
            <div className="min-w-0 flex-1">
              <div
                ref={tabsScrollRef}
                className="flex flex-nowrap items-stretch overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {scrollIndicators.left && (
                  <div className="sticky left-0 z-10 flex w-8 shrink-0 items-center justify-center bg-gradient-to-r from-background via-background/80 to-transparent pr-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-7 rounded-r-md rounded-l-none bg-background/80 shadow-sm hover:bg-background sm:h-8 sm:w-6"
                      onClick={() => scrollTabs(-1)}
                      aria-label="Scroll tabs left"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <TabsList className="inline-flex h-auto w-max flex-shrink-0 flex-nowrap gap-1 rounded-lg bg-muted/50 p-1 [&>button]:shrink-0">
          {canApprove && (
            <TabsTrigger value="approvals" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
              <UserCheck className="mr-2 h-4 w-4 shrink-0" />
              Approvals
            </TabsTrigger>
          )}
          <TabsTrigger value="shift-records" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
            <ClipboardList className="mr-2 h-4 w-4 shrink-0" />
            Shift Records
          </TabsTrigger>
          <TabsTrigger value="rota" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
            <LayoutGrid className="mr-2 h-4 w-4 shrink-0" />
            Rota
          </TabsTrigger>
          <TabsTrigger value="now" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
            <Radio className="mr-2 h-4 w-4 shrink-0" />
            Now
          </TabsTrigger>
          {canManageAll && (
            <>
              <TabsTrigger value="provisional" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
                <MapPin className="mr-2 h-4 w-4 shrink-0" />
                Allocated
              </TabsTrigger>
            </>
          )}
                </TabsList>
                {scrollIndicators.right && (
                  <div className="sticky right-0 z-10 flex w-8 shrink-0 items-center justify-center bg-gradient-to-l from-background via-background/80 to-transparent pl-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-7 rounded-l-md rounded-r-none bg-background/80 shadow-sm hover:bg-background sm:h-8 sm:w-6"
                      onClick={() => scrollTabs(1)}
                      aria-label="Scroll tabs right"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {(canViewReports || canManageSettings) && (
              <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto">
                {canViewReports && (
                  <Button variant="outline" size="sm" asChild className="min-h-[2.75rem] flex-1 touch-manipulation sm:min-h-0 sm:flex-none">
                    <Link href="/admin/attendance/reports">
                      <BarChart3 className="mr-2 h-4 w-4 shrink-0" />
                      Reports
                    </Link>
                  </Button>
                )}
                {canManageSettings && (
                  <Button variant="outline" size="sm" asChild className="min-h-[2.75rem] flex-1 touch-manipulation sm:min-h-0 sm:flex-none">
                    <Link href="/admin/attendance/settings">
                      <Settings className="mr-2 h-4 w-4 shrink-0" />
                      Settings
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {canApprove && (
          <TabsContent value="approvals" className="mt-0 focus-visible:outline-none">
            <Card className="overflow-hidden">
              <CardHeader className="space-y-1.5 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Pending Approvals</CardTitle>
                <CardDescription className="text-sm">Review and approve or decline leave requests</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <LeaveApprovalList statusFilter="pending" compactHeader />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="rota" className="mt-0 focus-visible:outline-none">
          <RotaTimeline initialRange={initialRotaRange} />
        </TabsContent>

        <TabsContent value="now" className="mt-0 focus-visible:outline-none">
          <NowBoardView />
        </TabsContent>

        <TabsContent value="shift-records" className="mt-0 focus-visible:outline-none">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1.5 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg sm:text-xl">
                  {canManageAllShiftRecords ? "Shift Records (All Users)" : "Your Shift Records"}
                </CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" aria-label="What do the categories mean?">
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,380px)]" align="start">
                    <p className="font-medium text-sm mb-2">What do the categories mean?</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><strong className="text-foreground">{CATEGORY_LABELS.mapped}</strong> — {CATEGORY_DESCRIPTIONS.mapped}</li>
                      <li><strong className="text-foreground">{CATEGORY_LABELS.provisional}</strong> — {CATEGORY_DESCRIPTIONS.provisional}</li>
                      <li><strong className="text-foreground">{CATEGORY_LABELS.attendance}</strong> — {CATEGORY_DESCRIPTIONS.attendance}</li>
                      <li><strong className="text-foreground">{CATEGORY_LABELS.authorised_leave}</strong> — {CATEGORY_DESCRIPTIONS.authorised_leave}</li>
                      <li><strong className="text-foreground">{CATEGORY_LABELS.unauthorised_leave}</strong> — {CATEGORY_DESCRIPTIONS.unauthorised_leave}</li>
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>
              <CardDescription className="text-sm">
                {canManageAllShiftRecords
                  ? "View and manage attendance and leave shift records for everyone. Use filters to narrow by user, date, or category."
                  : "View and manage your own attendance and leave shift records."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ShiftRecordList
                userId={canManageAllShiftRecords ? undefined : user?.id}
                showCreateButton={true}
                allowUserSelect={canManageAllShiftRecords}
                compactHeader
              />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageAll && (
          <>
            <TabsContent value="provisional" className="mt-0 focus-visible:outline-none">
              <Card className="overflow-hidden">
                <CardHeader className="space-y-1.5 p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    {canManageAll ? "Allocated Shifts (All Users)" : "Allocated Shifts"}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {canManageAll
                      ? "View and manage planned shifts for everyone. Add shifts and assign to any user."
                      : "Planned shifts not yet confirmed"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ProvisionalShiftList
                    userId={canManageAll ? undefined : user?.id}
                    showCreateButton={true}
                    compactHeader
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

      </Tabs>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center p-8 text-muted-foreground">Loading…</div>}>
      <AttendancePageContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveRequestList } from "@/components/attendance/LeaveRequestList";
import { LeaveApprovalList } from "@/components/attendance/LeaveApprovalList";
import { LeaveCalendar } from "@/components/attendance/LeaveCalendar";
import { HolidayBalanceCard } from "@/components/attendance/HolidayBalanceCard";
import { ShiftRecordList } from "@/components/attendance/ShiftRecordList";
import { ProvisionalShiftList } from "@/components/attendance/ProvisionalShiftList";
import { MappedShiftTemplateList } from "@/components/attendance/MappedShiftTemplateList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAssignments } from "@/hooks/useAssignments";
import { useUsers } from "@/hooks/useUsers";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { getUserDisplayName } from "@/utils/user";
import { BarChart3, Settings, Calendar, ClipboardList, UserCheck, MapPin, Layers, ChevronLeft, ChevronRight, Info } from "lucide-react";
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
 * - My Leave       – no extra permission (everyone with page access)
 * - Approvals     – leave:approve
 * - Shift Records – no extra permission (everyone); content scope = own vs all (see below)
 * - Provisional   – attendance:manage_all
 * - Mapped        – attendance:manage_all
 * - Calendar      – attendance:reports
 * - Balance       – no extra permission (everyone with page access)
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

const TAB_VALUES = ["my-leave", "approvals", "shift-records", "provisional", "mapped-templates", "calendar", "balance"];

function AttendancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasPermission, isSuperuser } = usePermissionsCheck();
  const { data: assignmentsData } = useAssignments({ user_id: user?.id, is_active: true });
  const assignments = assignmentsData?.assignments || assignmentsData || [];

  const activeAssignment = assignments?.[0];
  // API returns role_id (UserDepartmentRole); support job_role_id for compatibility
  const jobRoleId = activeAssignment?.role_id ?? activeAssignment?.job_role_id;

  const canApprove = hasPermission(PERM.LEAVE_APPROVE);
  const canViewReports = hasPermission(PERM.REPORTS);
  const canManageSettings = hasPermission(PERM.SETTINGS);
  const canManageAll = hasPermission(PERM.MANAGE_ALL);
  const canManageAllShiftRecords =
    canManageAll || hasPermission(PERM.MANAGE_ALL_SHIFT_RECORDS);
  /** Only superusers see the "View balance for" dropdown; everyone else sees only their own balance */
  const showBalanceUserSelector = !!isSuperuser;

  const allowedTabs = useMemo(() => {
    const allowed = new Set(["my-leave", "shift-records", "balance"]);
    if (canApprove) allowed.add("approvals");
    if (canManageAll) {
      allowed.add("provisional");
      allowed.add("mapped-templates");
    }
    if (canViewReports) allowed.add("calendar");
    return allowed;
  }, [canApprove, canManageAll, canViewReports]);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "my-leave";
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    return t && TAB_VALUES.includes(t) ? t : "my-leave";
  });
  const [balanceUserId, setBalanceUserId] = useState(null);
  const [balanceJobRoleId, setBalanceJobRoleId] = useState(null);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && TAB_VALUES.includes(urlTab)) {
      setActiveTab(allowedTabs.has(urlTab) ? urlTab : "my-leave");
    } else {
      setActiveTab("my-leave");
    }
  }, [searchParams, allowedTabs]);

  const { data: usersData } = useUsers(
    showBalanceUserSelector ? { per_page: 100 } : { limit: 0 },
    { enabled: showBalanceUserSelector }
  );
  const balanceUsers = usersData?.users || usersData?.data || [];
  const balanceAssignmentsData = useAssignments(
    {
      user_id: balanceUserId ?? user?.id,
      is_active: true,
    },
    { enabled: showBalanceUserSelector && (!!balanceUserId || !!user?.id) }
  );
  const balanceAssignmentsRaw = balanceAssignmentsData?.data ?? balanceAssignmentsData;
  const balanceAssignmentsList = Array.isArray(balanceAssignmentsRaw)
    ? balanceAssignmentsRaw
    : balanceAssignmentsRaw?.assignments ?? [];

  useEffect(() => {
    if (!showBalanceUserSelector) return;
    if (balanceUserId == null && user?.id) {
      setBalanceUserId(user.id);
      setBalanceJobRoleId(jobRoleId ?? null);
    }
  }, [showBalanceUserSelector, balanceUserId, user?.id, jobRoleId]);

  useEffect(() => {
    if (!balanceUserId || balanceAssignmentsList.length === 0) return;
    const firstRoleId = balanceAssignmentsList[0]?.role_id ?? balanceAssignmentsList[0]?.job_role_id;
    if (balanceJobRoleId == null && firstRoleId != null) {
      setBalanceJobRoleId(firstRoleId);
    }
  }, [balanceUserId, balanceAssignmentsList, balanceJobRoleId]);

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
            <TabsTrigger value="my-leave" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
              <Calendar className="mr-2 h-4 w-4 shrink-0" />
              My Leave
            </TabsTrigger>
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
          {canManageAll && (
            <>
              <TabsTrigger value="provisional" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
                <MapPin className="mr-2 h-4 w-4 shrink-0" />
                Allocated
              </TabsTrigger>
              <TabsTrigger value="mapped-templates" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
                <Layers className="mr-2 h-4 w-4 shrink-0" />
                Required Templates
              </TabsTrigger>
            </>
          )}
          {canViewReports && (
            <TabsTrigger value="calendar" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
              Calendar
            </TabsTrigger>
          )}
          <TabsTrigger value="balance" className="min-h-[2.75rem] touch-manipulation rounded-md px-3 py-2 data-[state=active]:bg-background sm:min-h-0">
            Balance
          </TabsTrigger>
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

        <TabsContent value="my-leave" className="mt-0 focus-visible:outline-none">
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

            <TabsContent value="mapped-templates" className="mt-0 focus-visible:outline-none">
              <Card className="overflow-hidden">
                <CardHeader className="space-y-1.5 p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Required Shift Templates</CardTitle>
                  <CardDescription className="text-sm">Templates used for required shift instances</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <MappedShiftTemplateList />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {canViewReports && (
          <TabsContent value="calendar" className="mt-0 focus-visible:outline-none">
            <LeaveCalendar />
          </TabsContent>
        )}

        <TabsContent value="balance" className="mt-0 focus-visible:outline-none">
          {showBalanceUserSelector ? (
            <Card className="overflow-hidden">
              <CardHeader className="space-y-1.5 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Holiday Balance</CardTitle>
                <CardDescription className="text-sm">
                  View holiday balance for any user. Select a user (and job role if they have multiple).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>View balance for</Label>
                    <Select
                      value={balanceUserId != null ? String(balanceUserId) : ""}
                      onValueChange={(v) => {
                        setBalanceUserId(v ? parseInt(v, 10) : null);
                        setBalanceJobRoleId(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {balanceUsers.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {getUserDisplayName(u)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {balanceAssignmentsList.length > 1 && (
                    <div className="space-y-2">
                      <Label>Job role</Label>
                      <Select
                        value={balanceJobRoleId != null ? String(balanceJobRoleId) : ""}
                        onValueChange={(v) => setBalanceJobRoleId(v ? parseInt(v, 10) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {balanceAssignmentsList.map((a) => {
                            const roleId = a?.role_id ?? a?.job_role_id;
                            const label = a?.role?.display_name || a?.role?.name || a?.job_role?.display_name || a?.job_role?.name || `Role ${roleId}`;
                            return (
                              <SelectItem key={roleId} value={String(roleId)}>
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {balanceUserId && balanceJobRoleId ? (
                  <HolidayBalanceCard userId={balanceUserId} jobRoleId={balanceJobRoleId} />
                ) : balanceUserId && balanceAssignmentsList.length === 1 ? (
                  <HolidayBalanceCard
                    userId={balanceUserId}
                    jobRoleId={balanceAssignmentsList[0]?.role_id ?? balanceAssignmentsList[0]?.job_role_id}
                  />
                ) : balanceUserId ? (
                  <p className="text-sm text-muted-foreground">No active job role found for this user.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a user to view their holiday balance.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Normal user: show only their own balance, no dropdown */
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
          )}
        </TabsContent>
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

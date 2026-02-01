"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Download, RefreshCw } from "lucide-react";
import {
  useAttendanceSummary,
  useHolidayBalanceReport,
  useAbsenceReport,
  useIndividualReport,
} from "@/hooks/useAttendanceReports";
import { useUsers } from "@/hooks/useUsers";
import { attendanceService } from "@/services/attendance";
import { toast } from "sonner";
import { formatDateForAPI } from "@/utils/time";

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDateForAPI(start), end: formatDateForAPI(end) };
}

/** Turn API keys into readable column headers */
function formatColumnHeader(key) {
  const map = {
    user_id: "User ID",
    user_name: "Employee",
    department_id: "Department",
    department_name: "Department",
    job_role_id: "Job Role",
    job_role_name: "Job Role",
    role_id: "Role",
    role_name: "Role",
    attendance_hours: "Attended (h)",
    authorised_leave_hours: "Authorised Leave (h)",
    unauthorised_leave_hours: "Unauthorised (h)",
    provisional_hours: "Allocated (h)",
    mapped_hours: "Required (h)",
    total_hours: "Total (h)",
    annual_allowance_hours: "Allowance (h)",
    carried_forward_hours: "Carried (h)",
    used_hours: "Used (h)",
    remaining_hours: "Remaining (h)",
    holiday_year_name: "Holiday Year",
    start_date: "Start",
    end_date: "End",
    leave_type: "Leave Type",
    status: "Status",
    reason: "Reason",
    by_type: "By Type",
    days_absent_count: "Days Absent",
  };
  if (map[key]) return map[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/** Prefer _name columns over _id so we don't show raw IDs when we have names */
function getDisplayKeys(keys) {
  const hasName = (k) => keys.includes(k.replace(/_id$/, "_name"));
  return keys.filter((k) => {
    if (!k.endsWith("_id")) return true;
    return !hasName(k);
  });
}

/** Format a cell value for display; handles objects (e.g. by_type) so they don't show [object Object] */
function formatCellValue(val) {
  if (val == null) return "—";
  if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
    const parts = Object.entries(val).map(([k, v]) => {
      if (typeof v === "number") return `${k}: ${Number(v).toFixed(1)}h`;
      return `${k}: ${v}`;
    });
    return parts.length ? parts.join(", ") : "—";
  }
  return String(val);
}

const defaultRange = getDefaultDateRange();

export default function AttendanceReportsPage() {
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [groupBy, setGroupBy] = useState("individual");
  const [payrollExporting, setPayrollExporting] = useState(false);
  const [individualUserId, setIndividualUserId] = useState("");
  const [individualStartDate, setIndividualStartDate] = useState(defaultRange.start);
  const [individualEndDate, setIndividualEndDate] = useState(defaultRange.end);

  const summaryParams = { start_date: startDate, end_date: endDate, group_by: groupBy };
  const absenceParams = { start_date: startDate, end_date: endDate };
  const holidayParams = {};
  const individualParams = individualUserId
    ? { start_date: individualStartDate, end_date: individualEndDate }
    : null;

  const { data: usersData } = useUsers({ per_page: 100 });
  const users = usersData?.users ?? usersData?.data ?? [];
  const { data: individualData, isLoading: individualLoading } = useIndividualReport(
    individualUserId ? parseInt(individualUserId, 10) : null,
    individualParams || {},
    { enabled: !!individualUserId && !!individualParams }
  );

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useAttendanceSummary(summaryParams);
  const { data: holidayData, isLoading: holidayLoading } = useHolidayBalanceReport(holidayParams);
  const { data: absenceData, isLoading: absenceLoading } = useAbsenceReport(absenceParams);

  const summaryRows = summaryData?.data ?? (Array.isArray(summaryData) ? summaryData : []) ?? [];
  const holidayRows = Array.isArray(holidayData) ? holidayData : holidayData?.rows ?? holidayData ?? [];
  const absenceRows = absenceData?.data ?? (Array.isArray(absenceData) ? absenceData : []) ?? [];

  const handlePayrollExport = async () => {
    setPayrollExporting(true);
    try {
      const blob = await attendanceService.exportPayroll({
        start_date: startDate,
        end_date: endDate,
        format: "csv",
      });
      const url = window.URL.createObjectURL(blob?.data ?? blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-export-${startDate}-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Payroll export downloaded");
    } catch (err) {
      console.error("Payroll export failed:", err);
      toast.error("Failed to download payroll export");
    } finally {
      setPayrollExporting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild aria-label="Back to Attendance">
            <Link href="/admin/attendance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Attendance Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Summary, holiday balance, absence, and payroll export
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date range & options</CardTitle>
          <CardDescription>Set date range for summary, absence, and payroll export</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-2">
            <Label>Summary group by</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance summary</CardTitle>
              <CardDescription>Hours by category for the selected date range</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : Array.isArray(summaryRows) && summaryRows.length > 0 ? (
              (() => {
                const keys = getDisplayKeys(Object.keys(summaryRows[0] || {}));
                return (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {keys.map((key) => (
                            <TableHead key={key}>{formatColumnHeader(key)}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summaryRows.slice(0, 20).map((row, i) => (
                          <TableRow key={i}>
                            {keys.map((key) => (
                              <TableCell key={key}>{formatCellValue(row[key])}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {summaryRows.length > 20 && (
                      <p className="p-2 text-sm text-muted-foreground">Showing first 20 of {summaryRows.length} rows</p>
                    )}
                  </div>
                );
              })()
            ) : (
              <p className="py-8 text-center text-muted-foreground">No summary data for this range</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Holiday balance</CardTitle>
            <CardDescription>Current holiday year balances by employee / role</CardDescription>
          </CardHeader>
          <CardContent>
            {holidayLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : Array.isArray(holidayRows) && holidayRows.length > 0 ? (
              (() => {
                const keys = getDisplayKeys(Object.keys(holidayRows[0] || {}));
                return (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {keys.map((key) => (
                            <TableHead key={key}>{formatColumnHeader(key)}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holidayRows.slice(0, 20).map((row, i) => (
                          <TableRow key={i}>
                            {keys.map((key) => (
                              <TableCell key={key}>{formatCellValue(row[key])}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {holidayRows.length > 20 && (
                      <p className="p-2 text-sm text-muted-foreground">Showing first 20 of {holidayRows.length} rows</p>
                    )}
                  </div>
                );
              })()
            ) : (
              <p className="py-8 text-center text-muted-foreground">No holiday balance data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Absence report</CardTitle>
          <CardDescription>Absences in the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          {absenceLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : Array.isArray(absenceRows) && absenceRows.length > 0 ? (
            (() => {
              const keys = getDisplayKeys(Object.keys(absenceRows[0] || {}));
              return (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {keys.map((key) => (
                          <TableHead key={key}>{formatColumnHeader(key)}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {absenceRows.slice(0, 50).map((row, i) => (
                        <TableRow key={i}>
                          {keys.map((key) => (
                            <TableCell key={key}>{formatCellValue(row[key])}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {absenceRows.length > 50 && (
                    <p className="p-2 text-sm text-muted-foreground">Showing first 50 of {absenceRows.length} rows</p>
                  )}
                </div>
              );
            })()
          ) : (
            <p className="py-8 text-center text-muted-foreground">No absence data for this range</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual report</CardTitle>
          <CardDescription>Daily breakdown, totals, holiday balance and leave requests for one employee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={individualUserId} onValueChange={setIndividualUserId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.display_name || u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={individualStartDate}
                onChange={(e) => setIndividualStartDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={individualEndDate}
                onChange={(e) => setIndividualEndDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
          </div>
          {!individualUserId ? (
            <p className="py-4 text-sm text-muted-foreground">Select an employee to view their individual report.</p>
          ) : individualLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : individualData ? (
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <h4 className="font-medium">{individualData.user_name || `User #${individualData.user_id}`}</h4>
                <p className="text-sm text-muted-foreground">
                  {individualData.start_date} to {individualData.end_date}
                </p>
              </div>
              {individualData.totals && (
                <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
                  <div className="rounded border p-2">
                    <span className="text-muted-foreground">Attended</span>
                    <p className="font-medium">{Number(individualData.totals.attendance_hours).toFixed(1)}h</p>
                  </div>
                  <div className="rounded border p-2">
                    <span className="text-muted-foreground">Authorised leave</span>
                    <p className="font-medium">{Number(individualData.totals.authorised_leave_hours).toFixed(1)}h</p>
                  </div>
                  <div className="rounded border p-2">
                    <span className="text-muted-foreground">Unauthorised</span>
                    <p className="font-medium">{Number(individualData.totals.unauthorised_leave_hours).toFixed(1)}h</p>
                  </div>
                  <div className="rounded border p-2">
                    <span className="text-muted-foreground">Allocated</span>
                    <p className="font-medium">{Number(individualData.totals.provisional_hours || 0).toFixed(1)}h</p>
                  </div>
                  <div className="rounded border p-2">
                    <span className="text-muted-foreground">Total</span>
                    <p className="font-medium">
                      {(
                        Number(individualData.totals.attendance_hours || 0) +
                        Number(individualData.totals.authorised_leave_hours || 0) +
                        Number(individualData.totals.unauthorised_leave_hours || 0) +
                        Number(individualData.totals.provisional_hours || 0) +
                        Number(individualData.totals.mapped_hours || 0)
                      ).toFixed(1)}
                      h
                    </p>
                  </div>
                </div>
              )}
              {individualData.holiday_balance && (
                <div className="rounded-md border p-4">
                  <h4 className="mb-2 font-medium">Holiday balance</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
                    <span className="text-muted-foreground">Allowance</span>
                    <span>{Number(individualData.holiday_balance.annual_allowance_hours).toFixed(1)}h</span>
                    <span className="text-muted-foreground">Used</span>
                    <span>{Number(individualData.holiday_balance.used_hours).toFixed(1)}h</span>
                    <span className="text-muted-foreground">Pending</span>
                    <span>{Number(individualData.holiday_balance.pending_hours).toFixed(1)}h</span>
                    <span className="text-muted-foreground">Remaining</span>
                    <span>{Number(individualData.holiday_balance.remaining_hours).toFixed(1)}h</span>
                  </div>
                </div>
              )}
              {individualData.daily_breakdown && individualData.daily_breakdown.length > 0 && (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Attended</TableHead>
                        <TableHead>Authorised leave</TableHead>
                        <TableHead>Unauthorised</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {individualData.daily_breakdown.slice(0, 31).map((day) => (
                        <TableRow key={day.date}>
                          <TableCell>{day.date}</TableCell>
                          <TableCell>{Number(day.attendance_hours).toFixed(1)}</TableCell>
                          <TableCell>{Number(day.authorised_leave_hours).toFixed(1)}</TableCell>
                          <TableCell>{Number(day.unauthorised_leave_hours).toFixed(1)}</TableCell>
                          <TableCell>{Number(day.total_hours).toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {individualData.daily_breakdown.length > 31 && (
                    <p className="p-2 text-sm text-muted-foreground">
                      Showing first 31 days of {individualData.daily_breakdown.length}
                    </p>
                  )}
                </div>
              )}
              {individualData.leave_requests && individualData.leave_requests.length > 0 && (
                <div className="rounded-md border p-4">
                  <h4 className="mb-2 font-medium">Leave requests in range</h4>
                  <ul className="space-y-1 text-sm">
                    {individualData.leave_requests.map((lr, i) => (
                      <li key={i}>
                        {lr.start_date} – {lr.end_date}: {lr.total_hours}h ({lr.status})
                        {lr.reason ? ` — ${lr.reason}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No data for this employee and date range.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll export</CardTitle>
          <CardDescription>Download hours worked and authorised leave as CSV for the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePayrollExport} disabled={payrollExporting}>
            {payrollExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

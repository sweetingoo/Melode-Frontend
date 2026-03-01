"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { useHolidayBalance, useHolidayYears } from "@/hooks/useAttendance";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

function formatPeriod(startStr, endStr) {
  if (!startStr || !endStr) return null;
  try {
    return `${format(parseISO(startStr), "d MMM yyyy")} – ${format(parseISO(endStr), "d MMM yyyy")}`;
  } catch {
    return `${startStr} – ${endStr}`;
  }
}

export const HolidayBalanceCard = ({ userId, jobRoleId, holidayYearId: propHolidayYearId = null, showYearSelector = false }) => {
  const [selectedYearId, setSelectedYearId] = useState(propHolidayYearId != null ? String(propHolidayYearId) : "");
  const { data: yearsData } = useHolidayYears({}, { enabled: showYearSelector });
  const years = Array.isArray(yearsData) ? yearsData : yearsData?.years ?? yearsData ?? [];

  const effectiveYearId = showYearSelector
    ? (selectedYearId === "" ? null : selectedYearId)
    : propHolidayYearId;

  const { data: balance, isLoading, error } = useHolidayBalance({
    user_id: userId,
    job_role_id: jobRoleId,
    holiday_year_id: effectiveYearId || undefined,
  });

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holiday Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No person selected.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holiday Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !balance) {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;
    const isNoEntitlement = status === 404 || (typeof detail === "string" && detail?.toLowerCase().includes("entitlement not found"));
    const isNoJobRole = status === 400 || (typeof detail === "string" && detail?.toLowerCase().includes("no active job role"));
    const emptyMessage = isNoEntitlement
      ? "No holiday entitlement set up for this person for this year."
      : isNoJobRole
        ? "No active job role assigned, or no entitlement set up."
        : "Unable to load holiday balance";
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle>Holiday Balance</CardTitle>
            </div>
            {showYearSelector && years.length > 0 && (
              <Select value={selectedYearId || "__current__"} onValueChange={(v) => setSelectedYearId(v === "__current__" ? "" : v)}>
                <SelectTrigger className="w-full max-w-[280px] h-9 text-sm">
                  <SelectValue placeholder="Select holiday year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__current__">Current year</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.year_name}
                      {y.start_date && y.end_date ? ` (${formatPeriod(y.start_date, y.end_date)})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {showYearSelector && isNoEntitlement && (
            <p className="text-xs text-muted-foreground mt-2">Try another holiday year above, or ask an admin to set up entitlement for this year.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const totalAllowance = parseFloat(balance.annual_allowance_hours || 0) + parseFloat(balance.carried_forward_hours || 0);
  const used = parseFloat(balance.used_hours || 0);
  const pending = parseFloat(balance.pending_hours || 0);
  const remaining = parseFloat(balance.remaining_hours || 0);
  const usedPercentage = totalAllowance > 0 ? ((used + pending) / totalAllowance) * 100 : 0;
  const isNegative = remaining < 0;
  const isLow = remaining >= 0 && remaining < 20; // Less than 20 hours remaining

  const periodStr = formatPeriod(balance.holiday_year_start_date, balance.holiday_year_end_date);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Holiday Balance</CardTitle>
              <CardDescription className="mt-1">
                {balance.holiday_year_name || "Current Holiday Year"}
                {periodStr && (
                  <span className="block text-xs mt-0.5 text-muted-foreground/90">
                    {periodStr}
                  </span>
                )}
              </CardDescription>
            </div>
            <CalendarIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
          {showYearSelector && years.length > 0 && (
            <Select value={selectedYearId || "__current__"} onValueChange={(v) => setSelectedYearId(v === "__current__" ? "" : v)}>
              <SelectTrigger className="w-full max-w-[280px] h-9 text-sm">
                <SelectValue placeholder="Select holiday year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__current__">Current year</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.year_name}
                    {y.start_date && y.end_date ? ` (${formatPeriod(y.start_date, y.end_date)})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Remaining Hours - Large Display */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-muted-foreground">Remaining</span>
            <div className="flex items-center gap-2">
              {isNegative && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Negative
                </Badge>
              )}
              {isLow && !isNegative && (
                <Badge variant="outline" className="text-xs text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Low
                </Badge>
              )}
              <span className={`text-3xl font-bold ${isNegative ? "text-destructive" : isLow ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                {remaining.toFixed(1)}h
              </span>
            </div>
          </div>
          <Progress value={Math.min(usedPercentage, 100)} className="h-2" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Annual Allowance</p>
            <p className="text-lg font-semibold">{parseFloat(balance.annual_allowance_hours || 0).toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Carried Forward</p>
            <p className="text-lg font-semibold">{parseFloat(balance.carried_forward_hours || 0).toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Used</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {used.toFixed(1)}h
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {pending.toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Total Available */}
        <div className="flex items-center justify-between rounded-lg border-t pt-4">
          <span className="text-sm font-medium">Total Available</span>
          <span className="text-lg font-semibold">{totalAllowance.toFixed(1)}h</span>
        </div>
      </CardContent>
    </Card>
  );
};

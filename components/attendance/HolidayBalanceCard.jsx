"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { useHolidayBalance } from "@/hooks/useAttendance";
import { Loader2 } from "lucide-react";

export const HolidayBalanceCard = ({ userId, jobRoleId, holidayYearId = null }) => {
  const { data: balance, isLoading, error } = useHolidayBalance({
    user_id: userId,
    job_role_id: jobRoleId,
    holiday_year_id: holidayYearId,
  });

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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holiday Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load holiday balance</p>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Holiday Balance</CardTitle>
            <CardDescription>
              {balance.holiday_year_name || "Current Holiday Year"}
            </CardDescription>
          </div>
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
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

"use client";

import React, { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeeSettings, useContractTypes } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";

/**
 * My Contract – contract band (EmployeeJobRoleSettings: normal_working_days, hours_per_day, monthly_contracted_hours, contract_type) for the period.
 */
export function MyContractView() {
  const { user } = useAuth();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  const employeeSettingsUserKey = user?.slug ?? null;
  const { data: settingsData, isLoading: settingsLoading } = useEmployeeSettings(employeeSettingsUserKey, {}, { enabled: !!employeeSettingsUserKey });
  const { data: contractTypesData } = useContractTypes({});
  const contractTypesList = Array.isArray(contractTypesData) ? contractTypesData : contractTypesData?.data ?? [];
  const contractTypeById = useMemo(() => {
    const map = new Map();
    contractTypesList.forEach((ct) => map.set(Number(ct.id), ct));
    return map;
  }, [contractTypesList]);

  const settingsList = Array.isArray(settingsData) ? settingsData : settingsData ? [settingsData] : [];
  const activeSetting = useMemo(
    () => settingsList.find((s) => s.is_currently_active ?? (s.is_active && !s.end_date)) ?? settingsList[0],
    [settingsList]
  );

  const contractLabel = useMemo(() => {
    if (!activeSetting) return null;
    const days = activeSetting.normal_working_days ?? [];
    const dayLabels = days.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3));
    const hours = activeSetting.hours_per_day ?? 0;
    return `${dayLabels.join(", ")} · ${Number(hours)} hrs/day`;
  }, [activeSetting]);

  const contractTypeName = useMemo(() => {
    if (!activeSetting) return null;
    const ct = activeSetting.contract_type ?? (activeSetting.contract_type_id != null ? contractTypeById.get(Number(activeSetting.contract_type_id)) : null);
    return ct?.name ?? null;
  }, [activeSetting, contractTypeById]);

  const monthlyContractedHours = activeSetting?.monthly_contracted_hours != null ? Number(activeSetting.monthly_contracted_hours) : null;

  const goPrevMonth = () => setViewMonth((m) => subMonths(m, 1));
  const goNextMonth = () => setViewMonth((m) => addMonths(m, 1));
  const goThisMonth = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setViewMonth(d);
  };
  const monthLabel = format(monthStart, "MMMM yyyy");
  const monthLabelShort = format(monthStart, "MMM yyyy");

  if (!user?.id) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sign in to see your contract.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardHeader className="space-y-3 border-b bg-muted/20 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 text-primary" aria-hidden />
              My Contract
            </CardTitle>
            <CardDescription className="text-sm">
              Your contracted hours for the period.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-start">
            <Button variant="outline" size="sm" onClick={goThisMonth} className="h-8 shrink-0 text-xs">
              This month
            </Button>
            <Button variant="outline" size="icon" onClick={goPrevMonth} className="h-8 w-8 shrink-0" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-0 shrink text-center text-sm font-medium">
              <span className="hidden sm:inline">{monthLabel}</span>
              <span className="sm:hidden">{monthLabelShort}</span>
            </span>
            <Button variant="outline" size="icon" onClick={goNextMonth} className="h-8 w-8 shrink-0" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {settingsLoading ? (
          <div className="flex min-h-[100px] items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your contract
              </h3>
              {activeSetting ? (
                <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current contract</p>
                  <p className="font-medium text-foreground">{contractLabel}</p>
                  {(contractTypeName || monthlyContractedHours != null) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {contractTypeName && (
                        <span>
                          <span className="font-medium text-foreground">Contract type:</span> {contractTypeName}
                        </span>
                      )}
                      {monthlyContractedHours != null && (
                        <span>
                          <span className="font-medium text-foreground">Monthly contracted hours:</span> {monthlyContractedHours}
                        </span>
                      )}
                    </div>
                  )}
                  {activeSetting.start_date && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Effective from {format(new Date(activeSetting.start_date + "T12:00:00"), "d MMM yyyy")}.
                    </p>
                  )}
                  {activeSetting.department_id != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Department / role set by your manager. Contact them to change.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No contract on file. Your manager can set your normal working days and hours in Attendance settings.
                </p>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

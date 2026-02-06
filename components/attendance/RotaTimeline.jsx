"use client";

import React, { useMemo, useState } from "react";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, differenceInDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronDown, ChevronRight, Clock, FileText, HelpCircle, Loader2, Plus, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCoverage } from "@/hooks/useAttendance";
import { useShiftRecordsAllPages } from "@/hooks/useShiftRecords";
import { formatDateForAPI } from "@/utils/time";
import { getUserDisplayName } from "@/utils/user";
import { ProvisionalShiftForm } from "./ProvisionalShiftForm";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/attendanceLabels";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";

/** Categories that can appear as blocks on the rota (excludes mapped = required slots from coverage). */
const ROTA_CATEGORY_OPTIONS = [
  { value: "provisional", label: CATEGORY_LABELS.provisional },
  { value: "authorised_leave", label: CATEGORY_LABELS.authorised_leave },
  { value: "unauthorised_leave", label: CATEGORY_LABELS.unauthorised_leave },
  { value: "attendance", label: CATEGORY_LABELS.attendance },
];
const DEFAULT_VISIBLE_CATEGORIES = ["provisional", "authorised_leave", "unauthorised_leave", "attendance"];

const RANGE_PRESETS = [
  { id: "thisWeek", label: "This week" },
  { id: "next7", label: "Next 7 days" },
  { id: "last7", label: "Last 7 days" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
];

/** Distinct color sets: one per category so rota blocks and filter legend match. */
const SHIFT_TYPE_COLOR_SETS = [
  { bg: "bg-blue-500/20", border: "border-l-blue-500", hover: "hover:bg-blue-500/30" },
  { bg: "bg-emerald-500/20", border: "border-l-emerald-500", hover: "hover:bg-emerald-500/30" },
  { bg: "bg-amber-500/20", border: "border-l-amber-500", hover: "hover:bg-amber-500/30" },
  { bg: "bg-violet-500/20", border: "border-l-violet-500", hover: "hover:bg-violet-500/30" },
  { bg: "bg-rose-500/20", border: "border-l-rose-500", hover: "hover:bg-rose-500/30" },
  { bg: "bg-sky-500/20", border: "border-l-sky-500", hover: "hover:bg-sky-500/30" },
  { bg: "bg-teal-500/20", border: "border-l-teal-500", hover: "hover:bg-teal-500/30" },
  { bg: "bg-indigo-500/20", border: "border-l-indigo-500", hover: "hover:bg-indigo-500/30" },
];

/** Fixed color per category so filter legend and rota blocks match. */
const CATEGORY_COLORS = {
  provisional: SHIFT_TYPE_COLOR_SETS[0],      // blue – Allocated
  authorised_leave: SHIFT_TYPE_COLOR_SETS[1], // emerald
  unauthorised_leave: SHIFT_TYPE_COLOR_SETS[2], // amber
  attendance: SHIFT_TYPE_COLOR_SETS[3],      // violet – Attended
};

function getBlockColors(record) {
  const category = record?.category;
  if (category && CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const id = record?.shift_leave_type_id ?? record?.shift_leave_type?.id;
  const name = record?.shift_leave_type?.name ?? "";
  const index =
    id != null ? Math.abs(Number(id)) % SHIFT_TYPE_COLOR_SETS.length : (name.length % SHIFT_TYPE_COLOR_SETS.length);
  return SHIFT_TYPE_COLOR_SETS[index];
}

/**
 * Role-based week timeline: required (faint) vs allocated (blocks with person names).
 * Uses GET /attendance/coverage and shift-records (provisional) for the selected week.
 */
const defaultWeekRange = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const mon = startOfWeek(today, { weekStartsOn: 1 });
  return { from: mon, to: addDays(mon, 6) };
};

export function RotaTimeline({ departmentId = null }) {
  const defaultRange = useMemo(defaultWeekRange, []);
  const [customRange, setCustomRange] = useState(defaultRange);
  const [committedRange, setCommittedRange] = useState(defaultRange);
  const [rangeSource, setRangeSource] = useState("thisWeek");
  const [rangeCalendarOpen, setRangeCalendarOpen] = useState(false);

  const { effectiveRangeStart, rangeEnd, days, rangeLabel } = useMemo(() => {
    const range = committedRange?.from && committedRange?.to ? committedRange : defaultRange;
    const from = range.from;
    const to = range.to;
    const fromStr = formatDateForAPI(from);
    const toStr = formatDateForAPI(to);
    const dayCount = Math.max(1, differenceInDays(to, from) + 1);
    const daysArr = Array.from({ length: dayCount }, (_, i) => addDays(from, i));
    return {
      effectiveRangeStart: fromStr,
      rangeEnd: toStr,
      days: daysArr,
      rangeLabel: `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`,
    };
  }, [committedRange, defaultRange]);

  const params = useMemo(
    () => ({
      start_date: effectiveRangeStart,
      end_date: rangeEnd,
      ...(departmentId != null ? { department_id: departmentId } : {}),
    }),
    [effectiveRangeStart, rangeEnd, departmentId]
  );

  const { data: coverageData, isLoading: coverageLoading } = useCoverage(params);
  const { data: shiftData, isLoading: shiftsLoading } = useShiftRecordsAllPages(params);

  const [visibleCategories, setVisibleCategories] = useState(() => new Set(DEFAULT_VISIBLE_CATEGORIES));

  const toggleCategory = (value) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const isLoading = coverageLoading || shiftsLoading;

  const { roleRows, byDateRole } = useMemo(() => {
    if (!coverageData?.by_date?.length) {
      return { roleRows: [], byDateRole: {} };
    }
    const roleMap = new Map();
    const byDateRoleOut = {};
    coverageData.by_date.forEach((dayEntry) => {
      const d = dayEntry.date;
      if (!byDateRoleOut[d]) byDateRoleOut[d] = {};
      Object.entries(dayEntry.by_role || {}).forEach(([roleKey, roleData]) => {
        const name = roleData.role_name || roleKey;
        if (!roleMap.has(roleKey)) roleMap.set(roleKey, { id: roleKey, name, key: roleKey });
        byDateRoleOut[d][roleKey] = roleData;
      });
    });
    const roleRowsOut = Array.from(roleMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    return { roleRows: roleRowsOut, byDateRole: byDateRoleOut };
  }, [coverageData]);

  const provisionalByDateRole = useMemo(() => {
    const records = shiftData?.records ?? shiftData ?? [];
    const out = {};
    records.forEach((r) => {
      if (!visibleCategories.has(r?.category)) return;
      const d = typeof r.shift_date === "string" ? r.shift_date : r.shift_date?.slice(0, 10);
      if (!d) return;
      const roleKey = r.shift_role_id ? `shift_role_${r.shift_role_id}` : `job_role_${r.job_role_id}`;
      if (!out[d]) out[d] = {};
      if (!out[d][roleKey]) out[d][roleKey] = [];
      const start = r.start_time ? (typeof r.start_time === "string" ? r.start_time.slice(0, 5) : "") : "";
      const end = r.end_time ? (typeof r.end_time === "string" ? r.end_time.slice(0, 5) : "") : "";
      out[d][roleKey].push({
        id: r.id,
        user: r.user,
        displayName: getUserDisplayName(r.user) || `User ${r.user_id}`,
        start_time: start,
        end_time: end,
        record: r,
      });
    });
    return out;
  }, [shiftData, visibleCategories]);

  const [selectedBlock, setSelectedBlock] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const weekSummary = useMemo(() => {
    let requiredTotal = 0;
    let allocatedTotal = 0;
    (coverageData?.by_date ?? []).forEach((day) => {
      Object.values(day.by_role ?? {}).forEach((role) => {
        (role.required ?? []).forEach((s) => { requiredTotal += s.headcount ?? 0; });
        (role.allocated ?? []).forEach((s) => { allocatedTotal += s.headcount ?? 0; });
      });
    });
    const provisionalCount = Array.isArray(shiftData?.records) ? shiftData.records.length : 0;
    return { requiredTotal, allocatedTotal, provisionalCount };
  }, [coverageData, shiftData]);

  const applyRangePreset = (presetId) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    let from;
    let to;
    switch (presetId) {
      case "thisWeek": {
        const mon = startOfWeek(today, { weekStartsOn: 1 });
        from = mon;
        to = addDays(mon, 6);
        break;
      }
      case "next7":
        from = today;
        to = addDays(today, 6);
        break;
      case "last7":
        from = addDays(today, -6);
        to = today;
        break;
      case "thisMonth": {
        const first = startOfMonth(today);
        const last = endOfMonth(first);
        from = first;
        to = last;
        break;
      }
      case "lastMonth": {
        const prev = subMonths(today, 1);
        from = startOfMonth(prev);
        to = endOfMonth(prev);
        break;
      }
      default:
        return;
    }
    setCustomRange({ from, to });
    setCommittedRange({ from, to });
    setRangeSource(presetId);
    setRangeCalendarOpen(false);
  };

  const [addShiftOpen, setAddShiftOpen] = useState(false);
  const [addShiftInitial, setAddShiftInitial] = useState(null);

  const openAddShift = (dateStr, row) => {
    const jobRoleMatch = row.key?.match(/^job_role_(\d+)$/);
    const shiftRoleMatch = row.key?.match(/^shift_role_(\d+)$/);
    setAddShiftInitial({
      shiftDate: dateStr,
      jobRoleId: jobRoleMatch ? jobRoleMatch[1] : null,
      shiftRoleId: shiftRoleMatch ? shiftRoleMatch[1] : null,
      departmentId: departmentId != null ? String(departmentId) : null,
    });
    setAddShiftOpen(true);
  };

  const todayStr = formatDateForAPI(new Date());

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      <CardHeader className="space-y-3 border-b bg-muted/20 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight">Rota</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Required vs allocated and leave by role. Use &quot;Shift types&quot; to show or hide Allocated, Authorised Leave, Attended, etc. Click a shift for details, or use + to add one.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Popover open={rangeCalendarOpen} onOpenChange={setRangeCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 min-w-[220px] justify-start gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50",
                    !customRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    {rangeSource === "custom"
                      ? "Custom"
                      : RANGE_PRESETS.find((p) => p.id === rangeSource)?.label ?? rangeLabel}
                  </span>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden rounded-xl border bg-card p-0 shadow-lg" align="end" sideOffset={8}>
                <div className="border-b bg-muted/30 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick range</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {RANGE_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="ghost"
                        size="sm"
                        className="h-8 justify-start rounded-md px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                        onClick={() => applyRangePreset(preset.id)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Or pick dates</p>
                  <Calendar
                    mode="range"
                    defaultMonth={customRange?.from ?? new Date()}
                    selected={customRange ?? undefined}
                    onSelect={(range) => {
                      if (!range) {
                        setCustomRange(null);
                        return;
                      }
                      const from = range.from
                        ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 12, 0, 0)
                        : undefined;
                      const to = range.to
                        ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 12, 0, 0)
                        : undefined;
                      setCustomRange({ from: from ?? to, to });
                      if (from && to) {
                        setCommittedRange({ from, to });
                        setRangeSource("custom");
                        setRangeCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    classNames={{
                      months: "flex flex-col gap-6 sm:flex-row sm:gap-8",
                      month: "space-y-4",
                    }}
                  />
                </div>
                  </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 min-w-[140px] justify-start gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
                  aria-label="Filter shift types"
                >
                  <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Shift types</span>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 rounded-xl border bg-card p-3 shadow-lg" align="end" sideOffset={8}>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Show on rota
                </p>
                <div className="space-y-2">
                  {ROTA_CATEGORY_OPTIONS.map((opt) => {
                    const colors = CATEGORY_COLORS[opt.value];
                    return (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={visibleCategories.has(opt.value)}
                          onCheckedChange={() => toggleCategory(opt.value)}
                          aria-label={opt.label}
                        />
                        {colors && (
                          <span
                            className={cn("h-5 w-2 shrink-0 rounded-sm border-l-4", colors.border, colors.bg)}
                            title={opt.label}
                            aria-hidden
                          />
                        )}
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Collapsible open={helpOpen} onOpenChange={setHelpOpen} className="mt-1">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto gap-1.5 px-0 text-muted-foreground hover:text-foreground">
              {helpOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <HelpCircle className="h-4 w-4" />
              How this is calculated
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-lg border bg-muted/30 p-4 text-left text-sm">
              <p className="font-medium text-foreground">Data sources</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Req: X</strong> — From <strong>Required Templates</strong> (Mapped Shift Templates). When you &quot;Generate from template&quot; for a week, those created records (category <code className="rounded bg-muted px-1">mapped</code>) are the &quot;required&quot; slots per date/role/time.
                </li>
                <li>
                  <strong className="text-foreground">Blocks (names)</strong> — Shift records for the selected types (Allocated, Authorised Leave, Unauthorised Leave, Attended). Use the &quot;Shift types&quot; filter to show or hide each category in one view.
                </li>
                <li>
                  <strong className="text-foreground">Rows</strong> — One row per role that has at least one required, allocated, or attended slot in the selected week.
                </li>
              </ul>
              <p className="mt-2 font-medium text-foreground">Verify</p>
              <p className="mt-1 text-muted-foreground">
                This week: <strong className="text-foreground">{weekSummary.requiredTotal}</strong> required slots (from coverage), <strong className="text-foreground">{weekSummary.provisionalCount}</strong> allocated shift records. Match these against the &quot;Required Templates&quot; and &quot;Allocated&quot; tabs for the same week and department filter.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 sm:p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading rota…</p>
          </div>
        ) : (
          <div className="min-w-[640px] rounded-b-lg">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  <th className="sticky left-0 z-10 w-[100px] min-w-[100px] bg-muted/60 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  {roleRows.map((row) => (
                    <th
                      key={row.id}
                      className="min-w-[160px] border-l border-border/60 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {row.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.length === 0 && (
                  <tr>
                    <td colSpan={Math.max(roleRows.length + 1, 1)} className="py-16 text-center">
                      <p className="text-muted-foreground">Pick a date range above to view the rota.</p>
                    </td>
                  </tr>
                )}
                {roleRows.length === 0 && days.length > 0 && (
                  <tr>
                    <td colSpan={days.length + 1} className="py-16 text-center">
                      <p className="text-muted-foreground">No coverage data for this range.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add required patterns (Required Templates) and allocated shifts (Allocated tab).
                      </p>
                    </td>
                  </tr>
                )}
                {days.map((d, dayIndex) => {
                  const dateStr = formatDateForAPI(d);
                  const isToday = dateStr === todayStr;
                  return (
                    <tr
                      key={dateStr}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/15 ${dayIndex % 2 === 0 ? "bg-background" : "bg-muted/5"}`}
                    >
                      <td
                        className={`sticky left-0 z-10 min-w-[100px] border-r border-border/50 px-3 py-3 align-top ${
                          isToday ? "bg-primary/10 font-semibold text-foreground" : "bg-muted/30 font-medium text-muted-foreground"
                        }`}
                      >
                        <span className="block text-[11px] uppercase tracking-wider opacity-80">{format(d, "EEE")}</span>
                        <span className="block text-base">{format(d, "d")}</span>
                      </td>
                      {roleRows.map((row) => {
                        const roleData = byDateRole[dateStr]?.[row.key];
                        const required = roleData?.required ?? [];
                        const allocated = roleData?.allocated ?? [];
                        const blocks = provisionalByDateRole[dateStr]?.[row.key] ?? [];
                        const reqCount = required.reduce((s, r) => s + (r.headcount || 0), 0);
                        const allcCount = blocks.length;
                        const hasGap = reqCount > allcCount;
                        return (
                          <td key={row.id} className="border-l border-border/40 px-3 py-3 align-top">
                            <div className="space-y-2">
                              {reqCount > 0 && (
                                <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  Req: {reqCount}
                                </span>
                              )}
                              {blocks.map((b) => {
                                const colors = getBlockColors(b.record);
                                const categoryLabel = b.record?.category ? (CATEGORY_LABELS[b.record.category] ?? b.record.category) : null;
                                const typeName = b.record?.shift_leave_type?.name;
                                return (
                                  <button
                                    type="button"
                                    key={b.id}
                                    onClick={() => setSelectedBlock(b)}
                                    className={`flex w-full flex-col items-start rounded-lg border-l-4 px-2.5 py-1.5 text-left shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${colors.bg} ${colors.border} ${colors.hover}`}
                                    title={typeName ? `${categoryLabel ?? ""} – ${typeName}` : categoryLabel}
                                  >
                                    <span className="truncate text-xs font-medium">{b.displayName}</span>
                                    {(categoryLabel || typeName) && (
                                      <span className="text-[10px] text-muted-foreground truncate w-full">
                                        {typeName ?? categoryLabel}
                                      </span>
                                    )}
                                    {(b.start_time || b.end_time) && (
                                      <span className="text-[11px] text-muted-foreground">
                                        {b.start_time || "?"} – {b.end_time || "?"}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                              {hasGap && (
                                <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                                  Gap: {reqCount - allcCount}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => openAddShift(dateStr, row)}
                                aria-label="Add shift"
                                className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/30 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 hover:text-foreground"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <Dialog open={!!selectedBlock} onOpenChange={(open) => !open && setSelectedBlock(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedBlock?.record && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  {selectedBlock.displayName}
                </DialogTitle>
                <DialogDescription>Allocated shift details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {selectedBlock.record.user?.email && (
                  <p className="text-sm text-muted-foreground">{selectedBlock.record.user.email}</p>
                )}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Shift
                  </div>
                  <dl className="grid gap-1 pl-6 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Date</dt>
                      <dd>
                        {selectedBlock.record.shift_date
                          ? format(
                              typeof selectedBlock.record.shift_date === "string"
                                ? new Date(selectedBlock.record.shift_date + "T12:00:00")
                                : new Date(selectedBlock.record.shift_date),
                              "EEEE, d MMM yyyy"
                            )
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Time</dt>
                      <dd>
                        {selectedBlock.start_time || selectedBlock.end_time
                          ? `${selectedBlock.start_time || "?"} – ${selectedBlock.end_time || "?"}`
                          : "—"}
                      </dd>
                    </div>
                    {selectedBlock.record.hours != null && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Hours</dt>
                        <dd>{Number(selectedBlock.record.hours)}</dd>
                      </div>
                    )}
                    {selectedBlock.record.shift_leave_type?.name && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Type</dt>
                        <dd>{selectedBlock.record.shift_leave_type.name}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                {selectedBlock.record.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Notes
                      </div>
                      <p className="pl-6 text-sm text-muted-foreground">{selectedBlock.record.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ProvisionalShiftForm
        open={addShiftOpen}
        onOpenChange={(open) => {
          setAddShiftOpen(open);
          if (!open) setAddShiftInitial(null);
        }}
        shiftRecord={null}
        initialValues={addShiftInitial}
      />
    </Card>
  );
}

"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Loader2,
  UserCheck,
  UserX,
  Megaphone,
  Phone,
  MessageSquare,
  Building2,
  Clock,
  Users,
  MapPin,
  CalendarIcon,
  ChevronDown,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNowBoard, useAttendanceDepartments, useAttendanceEmployeeSuggest } from "@/hooks/useAttendance";
import { useShiftRecordsAllPages } from "@/hooks/useShiftRecords";
import { useClockRecords } from "@/hooks/useClock";
import { useLocations } from "@/hooks/useLocations";
import { useCreateMessage } from "@/hooks/useMessages";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { formatDateForAPI, parseUTCDate } from "@/utils/time";
import { getUserDisplayName } from "@/utils/user";
import { cn } from "@/lib/utils";
import CreateBroadcastDialog from "@/components/broadcasts/CreateBroadcastDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NowDayTimeline } from "./NowDayTimeline";

const DAY_END_MIN = 24 * 60 - 0.01;

function timeStrToMinutes(t) {
  if (t == null || t === "") return 0;
  const s = String(t).slice(0, 5);
  const parts = s.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (Number.isNaN(h)) return 0;
  return h * 60 + m;
}

function toMinutesSinceLocalMidnight(d) {
  if (!d || isNaN(d.getTime())) return 0;
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function shiftRecordToSegment(record, dateStr) {
  const cat = record.category;
  if (!["provisional", "authorised_leave", "unauthorised_leave"].includes(cat)) return null;
  const rdate = (record.shift_date || "").slice(0, 10);
  if (rdate !== dateStr) return null;
  const startMin = timeStrToMinutes(record.start_time);
  let endMin = record.end_time != null && record.end_time !== "" ? timeStrToMinutes(record.end_time) : null;
  if (endMin == null && record.hours != null) {
    endMin = startMin + Number(record.hours) * 60;
  }
  if (endMin == null) endMin = startMin + 60;
  endMin = Math.min(DAY_END_MIN, Math.max(startMin + 1, endMin));
  const typeName = record.shift_leave_type?.name || "";
  const timeRange = formatRangeLabel(startMin, endMin);
  const barLabel = typeName ? `${typeName.slice(0, 10)} ${timeRange}` : timeRange;
  return {
    kind: cat,
    startMin,
    endMin,
    shortLabel: typeName ? typeName.slice(0, 14) : undefined,
    barLabel,
    title: typeName ? `${typeName} (${formatRangeLabel(startMin, endMin)})` : undefined,
  };
}

function formatRangeLabel(a, b) {
  const f = (m) => {
    const h = Math.floor(m / 60) % 24;
    const mi = Math.floor(m % 60);
    return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
  };
  return `${f(a)}–${f(b)}`;
}

function minToHHmm(m) {
  const h = Math.floor(m / 60) % 24;
  const mi = Math.floor(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

/** Compare calendar days from API strings, Date, or YYYY-MM-DD (ignores time / timezone suffix quirks). */
function normalizeDayKey(v) {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v.slice(0, 10);
  try {
    if (v instanceof Date && !isNaN(v.getTime())) {
      return formatDateForAPI(v) || "";
    }
    const d = new Date(v);
    if (!isNaN(d.getTime())) return formatDateForAPI(d) || "";
  } catch {
    /* ignore */
  }
  return String(v).slice(0, 10);
}

function clockRecordToSegment(record, dateStr, isSelectedToday) {
  const cin = parseUTCDate(record.clock_in_time);
  if (!cin || isNaN(cin.getTime())) return null;
  const targetDay = normalizeDayKey(dateStr);
  const cinDay = normalizeDayKey(formatDateForAPI(cin));
  if (cinDay !== targetDay) return null;
  const startMin = toMinutesSinceLocalMidnight(cin);
  let endMin;
  if (record.clock_out_time) {
    const cout = parseUTCDate(record.clock_out_time);
    if (cout && !isNaN(cout.getTime())) {
      if (normalizeDayKey(formatDateForAPI(cout)) === targetDay) {
        endMin = toMinutesSinceLocalMidnight(cout);
      } else {
        endMin = DAY_END_MIN;
      }
    } else {
      endMin = DAY_END_MIN;
    }
  } else if (isSelectedToday) {
    endMin = toMinutesSinceLocalMidnight(new Date());
  } else {
    endMin = DAY_END_MIN;
  }
  endMin = Math.min(DAY_END_MIN, Math.max(startMin + 1, endMin));
  const hasClockOut = !!record.clock_out_time;
  const barLabel = hasClockOut
    ? `In ${minToHHmm(startMin)} Out ${minToHHmm(endMin)}`
    : `In ${minToHHmm(startMin)}`;
  return {
    kind: "clock",
    startMin,
    endMin,
    shortLabel: barLabel,
    barLabel,
    title: `Clocked ${formatRangeLabel(startMin, endMin)}`,
  };
}

function openClockToSegment(entry, dateStr, boardDateStr, isSelectedToday) {
  // Now-board `date` and selected day must match; normalize so "2026-03-28" === "2026-03-28T00:00:00".
  if (normalizeDayKey(boardDateStr) !== normalizeDayKey(dateStr)) return null;
  const cin = entry.clock_in_time ? parseUTCDate(entry.clock_in_time) : null;
  if (!cin || isNaN(cin.getTime())) return null;
  const targetDay = normalizeDayKey(dateStr);
  const cinDay = normalizeDayKey(formatDateForAPI(cin));
  // Still-active sessions may have started on a previous calendar day; show bar from midnight of the selected day.
  const startMin = cinDay === targetDay ? toMinutesSinceLocalMidnight(cin) : 0;
  const endMin = isSelectedToday ? toMinutesSinceLocalMidnight(new Date()) : DAY_END_MIN;
  const inWallMin = toMinutesSinceLocalMidnight(cin);
  const barLabel = `In ${minToHHmm(inWallMin)}`;
  return {
    kind: "clock",
    startMin,
    endMin: Math.min(DAY_END_MIN, Math.max(startMin + 1, endMin)),
    shortLabel: barLabel,
    barLabel,
    title: `Clocked in (open) ${formatRangeLabel(startMin, endMin)}`,
  };
}

function mergeUserSegments(map, userId, displayName, segment) {
  if (!segment) return;
  const key = String(userId);
  if (!map.has(key)) {
    map.set(key, { userId, displayName, segments: [] });
  }
  map.get(key).segments.push(segment);
}

function sortSegments(segs) {
  const order = { unauthorised_leave: 0, authorised_leave: 1, provisional: 2, clock: 3 };
  return [...segs].sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9));
}

/**
 * Live Now board: day timeline (clock / allocated / leave) + summary + tools.
 * Data: now-board, shift-records for the day, clock/records for the day.
 */
export function NowBoardView({ departmentId: initialDepartmentId = null }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const dateStr = formatDateForAPI(selectedDay);
  const isToday = dateStr === formatDateForAPI(new Date());

  const [departmentFilter, setDepartmentFilter] = useState(
    initialDepartmentId != null ? String(initialDepartmentId) : "all"
  );
  const [departmentComboboxOpen, setDepartmentComboboxOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [locationId, setLocationId] = useState(null);
  const [userFilter, setUserFilter] = useState("all");
  const [selectedUserForFilter, setSelectedUserForFilter] = useState(null);
  const [userComboboxOpen, setUserComboboxOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // "Here now" table sorting (default: most recent clock-in first)
  const [nowSort, setNowSort] = useState({ column: "clock_in_time", direction: "desc" });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const departmentIdNum = departmentFilter === "all" ? null : parseInt(departmentFilter, 10);

  const { hasPermission } = usePermissionsCheck();
  const canViewAllClocks =
    hasPermission("clock:view_all") ||
    hasPermission("reports:read") ||
    hasPermission("reports:*");
  const canIncludeAllShifts =
    hasPermission("attendance:manage_all") || hasPermission("attendance:manage_all_shift_records");

  const nowBoardParams = useMemo(
    () => ({
      date: dateStr,
      ...(departmentIdNum != null ? { department_id: departmentIdNum } : {}),
      ...(locationId != null ? { location_id: locationId } : {}),
    }),
    [dateStr, departmentIdNum, locationId]
  );

  const { data, isLoading } = useNowBoard(nowBoardParams, {
    refetchInterval: isToday ? 30 * 1000 : false,
  });
  const { data: departmentsList = [] } = useAttendanceDepartments({ enabled: true });
  const departments = Array.isArray(departmentsList) ? departmentsList : [];
  const departmentsFiltered = useMemo(() => {
    const q = departmentSearch.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => (d.name || "").toLowerCase().includes(q));
  }, [departments, departmentSearch]);

  const { data: locationsData } = useLocations();
  const locationsList = useMemo(() => {
    if (!locationsData) return [];
    if (Array.isArray(locationsData)) return locationsData;
    return locationsData?.locations ?? locationsData?.data ?? [];
  }, [locationsData]);

  const { data: suggestEmployees = [], isLoading: userSuggestLoading } = useAttendanceEmployeeSuggest(
    {
      q: debouncedUserSearch.trim() || undefined,
      department_id: departmentIdNum ?? undefined,
      limit: 30,
    },
    {
      enabled: userComboboxOpen && (!!departmentIdNum || !!debouncedUserSearch.trim()),
    }
  );
  const userOptions = useMemo(
    () =>
      [...suggestEmployees].sort((a, b) =>
        (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
      ),
    [suggestEmployees]
  );

  const shiftParams = useMemo(
    () => ({
      start_date: dateStr,
      end_date: dateStr,
      include_all: canIncludeAllShifts,
      ...(departmentIdNum != null ? { department_id: departmentIdNum } : {}),
      ...(userFilter !== "all" && canIncludeAllShifts ? { user_id: parseInt(userFilter, 10) } : {}),
    }),
    [dateStr, departmentIdNum, canIncludeAllShifts, userFilter]
  );

  const { data: shiftData, isLoading: shiftsLoading } = useShiftRecordsAllPages(shiftParams, {
    enabled: !!dateStr,
    refetchInterval: isToday ? 60 * 1000 : false,
  });

  const clockParams = useMemo(() => {
    const p = {
      start_date: dateStr,
      end_date: dateStr,
      per_page: 500,
    };
    if (canViewAllClocks) {
      if (departmentIdNum != null) p.department_id = departmentIdNum;
      if (locationId != null) p.location_id = locationId;
      if (userFilter !== "all") p.user_id = parseInt(userFilter, 10);
    }
    return p;
  }, [dateStr, departmentIdNum, locationId, userFilter, canViewAllClocks]);

  const { data: clockData, isLoading: clocksLoading, isError: clocksError } = useClockRecords(clockParams, {
    enabled: !!dateStr,
    retry: false,
    refetchInterval: isToday ? 60 * 1000 : false,
  });

  const byRole = data?.by_role ?? [];
  const clockedInNow = data?.clocked_in_now ?? [];
  const boardDate = data?.date ?? dateStr;

  const sortedClockedInNow = useMemo(() => {
    const arr = Array.isArray(clockedInNow) ? [...clockedInNow] : [];
    const dir = nowSort.direction === "asc" ? 1 : -1;

    const getName = (u) => u?.display_name ?? `User ${u?.user_id ?? ""}`;
    const getTimeMs = (u) => {
      try {
        const d = u?.clock_in_time ? parseUTCDate(u.clock_in_time) : null;
        const ms = d ? d.getTime() : null;
        return Number.isFinite(ms) ? ms : null;
      } catch {
        return null;
      }
    };

    const getVal = (u) => {
      switch (nowSort.column) {
        case "user":
          return getName(u);
        case "department":
          return u?.department_name ?? "";
        case "location":
          return u?.location_name ?? "";
        case "role":
          return u?.role_name ?? "";
        case "clock_in_time":
          return getTimeMs(u);
        default:
          return getTimeMs(u);
      }
    };

    arr.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);

      // Time sort: nulls last
      if (nowSort.column === "clock_in_time") {
        const aNull = av == null;
        const bNull = bv == null;
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
        return (av - bv) * dir;
      }

      // String sort
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      return as.localeCompare(bs, undefined, { sensitivity: "base" }) * dir;
    });

    return arr;
  }, [clockedInNow, nowSort]);

  const toggleNowSort = (column) => {
    setNowSort((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // Default direction per column
      const direction = column === "clock_in_time" ? "desc" : "asc";
      return { column, direction };
    });
  };

  const shiftRecords = shiftData?.records ?? [];

  const clockRecords = useMemo(() => {
    const raw = clockData?.records ?? clockData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [clockData]);

  const timelineRows = useMemo(() => {
    const groupMap = new Map();

    const passesUser = (uid) => {
      if (userFilter === "all") return true;
      return String(uid) === userFilter;
    };

    const passesLocationShift = (locId) => {
      if (locationId == null) return true;
      if (locId == null) return true;
      return Number(locId) === Number(locationId);
    };

    const getShiftGroupDepartment = (record) => record?.department_name || "—";
    const getShiftGroupRole = (record) => {
      const jobRole = record?.job_role?.display_name || record?.job_role?.name;
      if (jobRole) return jobRole;
      const shiftRole = record?.shift_role?.display_name || record?.shift_role?.name;
      if (shiftRole) return shiftRole;
      return record?.job_role_id || record?.shift_role_id ? `Role ${record.job_role_id ?? record.shift_role_id}` : "—";
    };

    const mergeGroupSegments = (groupKey, departmentName, roleName, userId, displayName, segment) => {
      if (!segment) return;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          groupId: groupKey,
          userId,
          displayName: displayName || `User ${userId}`,
          departmentName: departmentName || "—",
          roleName: roleName || "—",
          segments: [],
        });
      }
      groupMap.get(groupKey).segments.push(segment);
    };

    for (const r of shiftRecords) {
      if (!passesUser(r.user_id)) continue;
      if (!passesLocationShift(r.location_id)) continue;
      const name = getUserDisplayName(r.user) || `User ${r.user_id}`;
      const departmentName = getShiftGroupDepartment(r);
      const roleName = getShiftGroupRole(r);
      const groupKey = `${departmentName}||${roleName}||${r.user_id}`;
      const seg = shiftRecordToSegment(r, dateStr);
      if (seg) {
        seg.userDisplayName = name;
        seg.title = seg.title ? `${name} • ${seg.title}` : name;
        mergeGroupSegments(groupKey, departmentName, roleName, r.user_id, name, seg);
      }
    }

    const seenOpenClockUsers = new Set();
    for (const cr of clockRecords) {
      if (!passesUser(cr.user_id)) continue;
      if (locationId != null && cr.location_id != null && Number(cr.location_id) !== Number(locationId)) continue;
      const name =
        getUserDisplayName(cr.user) ||
        cr.user_name ||
        (cr.user && (cr.user.display_name || cr.user.full_name)) ||
        `User ${cr.user_id}`;
      const departmentName = cr?.department_name || "—";
      const roleName = cr?.job_role_name || cr?.current_shift_role_name || cr?.initial_shift_role_name || "—";
      const groupKey = `${departmentName}||${roleName}||${cr.user_id}`;
      const seg = clockRecordToSegment(cr, dateStr, isToday);
      if (seg) {
        seg.userDisplayName = name;
        seg.title = seg.title ? `${name} • ${seg.title}` : name;
        mergeGroupSegments(groupKey, departmentName, roleName, cr.user_id, name, seg);
        if (!cr.clock_out_time) seenOpenClockUsers.add(String(cr.user_id));
      }
    }

    for (const u of clockedInNow) {
      const clockUserId = u.user_id ?? u.id;
      if (clockUserId == null) continue;
      if (!passesUser(clockUserId)) continue;
      if (seenOpenClockUsers.has(String(clockUserId))) continue;
      const name = u.display_name || `User ${clockUserId}`;
      const departmentName = u?.department_name || "—";
      const roleName = u?.role_name || "—";
      const groupKey = `${departmentName}||${roleName}||${clockUserId}`;
      const seg = openClockToSegment(u, dateStr, boardDate, isToday);
      if (seg) {
        seg.userDisplayName = name;
        seg.title = seg.title ? `${name} • ${seg.title}` : name;
        mergeGroupSegments(groupKey, departmentName, roleName, clockUserId, name, seg);
      }
    }

    const rows = Array.from(groupMap.values()).map((g) => ({
      groupId: g.groupId,
      userId: g.userId,
      displayName: g.displayName,
      departmentName: g.departmentName,
      roleName: g.roleName,
      segments: sortSegments(g.segments),
    }));

    // Avoid overlapping bars by splitting each (dept, role) group into stacked "lanes".
    // Lanes are extra rows in the timeline so concurrent clock-ins become visible on the next line.
    const laneRows = [];
    for (const gRow of rows) {
      const segs = Array.isArray(gRow.segments) ? [...gRow.segments] : [];
      segs.sort((a, b) => (a.startMin ?? 0) - (b.startMin ?? 0) || (a.endMin ?? 0) - (b.endMin ?? 0));

      const lanes = [];
      const laneLastEnd = [];

      for (const seg of segs) {
        // Find the first lane that ends before this segment starts.
        let laneIdx = -1;
        for (let i = 0; i < lanes.length; i++) {
          const lastEnd = laneLastEnd[i];
          if (lastEnd == null || (seg.startMin ?? 0) >= lastEnd) {
            laneIdx = i;
            break;
          }
        }

        if (laneIdx === -1) {
          laneIdx = lanes.length;
          lanes.push([]);
          laneLastEnd.push(null);
        }

        lanes[laneIdx].push(seg);
        laneLastEnd[laneIdx] = seg.endMin ?? laneLastEnd[laneIdx];
      }

      for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
        laneRows.push({
          groupId: gRow.groupId,
          userId: gRow.userId,
          displayName: gRow.displayName,
          laneIndex,
          departmentName: gRow.departmentName,
          roleName: gRow.roleName,
          segments: sortSegments(lanes[laneIndex]),
        });
      }
    }

    laneRows.sort((a, b) => {
      const deptCmp = String(a.departmentName).localeCompare(String(b.departmentName), undefined, { sensitivity: "base" });
      if (deptCmp !== 0) return deptCmp;
      const roleCmp = String(a.roleName).localeCompare(String(b.roleName), undefined, { sensitivity: "base" });
      if (roleCmp !== 0) return roleCmp;
      const nameCmp = String(a.displayName || "").localeCompare(String(b.displayName || ""), undefined, { sensitivity: "base" });
      if (nameCmp !== 0) return nameCmp;
      return (a.laneIndex ?? 0) - (b.laneIndex ?? 0);
    });

    return laneRows;
  }, [
    shiftRecords,
    clockRecords,
    clockedInNow,
    dateStr,
    boardDate,
    isToday,
    userFilter,
    locationId,
  ]);

  const { windowStartMin, windowEndMin, nowMinutes } = useMemo(() => {
    const DEFAULT_MIN = 6 * 60;
    const DEFAULT_MAX = 21 * 60;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const row of timelineRows) {
      for (const s of row.segments) {
        minV = Math.min(minV, s.startMin);
        maxV = Math.max(maxV, s.endMin);
      }
    }
    if (!isFinite(minV)) {
      minV = DEFAULT_MIN;
      maxV = DEFAULT_MAX;
    } else {
      minV = Math.floor(minV / 60) * 60;
      maxV = Math.ceil(maxV / 60) * 60;
    }
    const nowM = toMinutesSinceLocalMidnight(new Date());
    if (isToday) {
      minV = Math.min(minV, Math.floor(nowM / 60) * 60);
      maxV = Math.max(maxV, Math.ceil(nowM / 60) * 60);
    }
    if (maxV <= minV) maxV = minV + 8 * 60;
    return { windowStartMin: minV, windowEndMin: maxV, nowMinutes: nowM };
  }, [timelineRows, isToday]);

  const missingWithRole = useMemo(() => {
    const out = [];
    byRole.forEach((role) => {
      const roleName = role.role_name || `Role ${role.shift_role_id ?? role.job_role_id ?? "—"}`;
      (role.missing ?? []).forEach((u) => {
        out.push({ ...u, role_name: roleName });
      });
    });
    return out;
  }, [byRole]);

  const getStatus = (role) => {
    const { expected_count, checked_in_count, missing_count } = role;
    if (expected_count === 0) return "muted";
    if (missing_count === 0) return "green";
    if (checked_in_count === 0) return "red";
    return "amber";
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case "green":
        return "All checked in";
      case "amber":
        return "Some missing";
      case "red":
        return "None checked in";
      case "muted":
        return "No expected staff";
      default:
        return "";
    }
  };

  const totalMissing = missingWithRole.length;

  const [callForCoverOpen, setCallForCoverOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);

  const canSendBroadcast =
    hasPermission("broadcast:create") ||
    hasPermission("BROADCAST_CREATE") ||
    hasPermission("broadcast:send") ||
    hasPermission("BROADCAST_SEND");
  const createMessageMutation = useCreateMessage();

  const broadcastInitialTitle = useMemo(() => "Cover needed today", []);
  const broadcastInitialContent = useMemo(
    () =>
      `We need cover for today's shifts (${format(new Date(boardDate + "T12:00:00"), "EEEE d MMM yyyy")}). Please check the Now board or contact your manager.`,
    [boardDate]
  );

  const goToToday = useCallback(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setSelectedDay(d);
  }, []);

  const timelineLoading = isLoading || shiftsLoading || clocksLoading;

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      <CardHeader className="space-y-4 border-b bg-muted/10 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Radio className="h-5 w-5" aria-hidden />
              </span>
              Now
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground max-w-xl">
              Day view: who is clocked in (current and past sessions), expected allocated shifts, and leave — on one timeline.
              <Link
                href={`/admin/attendance?tab=rota&from=${dateStr}&to=${dateStr}`}
                className="ml-1 font-medium text-primary underline hover:no-underline whitespace-nowrap"
              >
                Rota tab →
              </Link>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Label className="sr-only">Department</Label>
              <Popover
                open={departmentComboboxOpen}
                onOpenChange={(open) => {
                  setDepartmentComboboxOpen(open);
                  if (!open) setDepartmentSearch("");
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="h-9 min-w-[160px] max-w-[220px] justify-between font-normal"
                  >
                    <span className="truncate">
                      {departmentFilter === "all"
                        ? "All departments"
                        : departments.find((d) => String(d.id) === departmentFilter)?.name || `Department #${departmentFilter}`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search departments..."
                      value={departmentSearch}
                      onChange={(e) => setDepartmentSearch(e.target.value)}
                      className="h-9"
                      autoFocus
                    />
                  </div>
                  <ScrollArea className="max-h-64">
                    <ul className="p-1">
                      <li>
                        <button
                          type="button"
                          className={cn(
                            "w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                            departmentFilter === "all" && "bg-accent"
                          )}
                          onClick={() => {
                            setDepartmentFilter("all");
                            setDepartmentComboboxOpen(false);
                            setUserFilter("all");
                            setSelectedUserForFilter(null);
                          }}
                        >
                          All departments
                        </button>
                      </li>
                      {departmentsFiltered.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                              String(d.id) === departmentFilter && "bg-accent"
                            )}
                            onClick={() => {
                              setDepartmentFilter(String(d.id));
                              setDepartmentComboboxOpen(false);
                              setUserFilter("all");
                              setSelectedUserForFilter(null);
                            }}
                          >
                            {d.name || `Department #${d.id}`}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Label className="sr-only">User</Label>
              <Popover
                open={userComboboxOpen}
                onOpenChange={(open) => {
                  setUserComboboxOpen(open);
                  if (!open) {
                    setUserSearch("");
                    setDebouncedUserSearch("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={!canViewAllClocks}
                    title={!canViewAllClocks ? "User filter needs clock:view_all or reports:read" : undefined}
                    className="h-9 min-w-[160px] max-w-[240px] justify-between font-normal"
                  >
                    <span className="truncate">
                      {userFilter === "all"
                        ? "All users"
                        : selectedUserForFilter?.display_name || `User #${userFilter}`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search by name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-9"
                      autoFocus
                    />
                  </div>
                  <ScrollArea className="max-h-64">
                    {userSuggestLoading ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                    ) : (
                      <ul className="p-1">
                        <li>
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                              userFilter === "all" && "bg-accent"
                            )}
                            onClick={() => {
                              setUserFilter("all");
                              setSelectedUserForFilter(null);
                              setUserComboboxOpen(false);
                            }}
                          >
                            All users
                          </button>
                        </li>
                        {userOptions.map((u) => (
                          <li key={u.id}>
                            <button
                              type="button"
                              className={cn(
                                "w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                String(u.id) === userFilter && "bg-accent"
                              )}
                              onClick={() => {
                                setUserFilter(String(u.id));
                                setSelectedUserForFilter({
                                  id: u.id,
                                  display_name: u.display_name || `User ${u.id}`,
                                });
                                setUserComboboxOpen(false);
                              }}
                            >
                              {u.department_name
                                ? `${u.display_name || u.id} — ${u.department_name}`
                                : u.display_name || `User ${u.id}`}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <Select
              value={locationId != null ? String(locationId) : "all"}
              onValueChange={(v) => setLocationId(v === "all" ? null : parseInt(v, 10))}
            >
              <SelectTrigger className="h-9 w-[180px] border bg-background">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationsList.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name ?? `Location ${loc.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 min-w-[200px] justify-start gap-2 font-normal">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {format(selectedDay, "EEE d MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={(d) => {
                    if (d) {
                      const x = new Date(d);
                      x.setHours(12, 0, 0, 0);
                      setSelectedDay(x);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
                <div className="border-t p-2">
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => { goToToday(); setCalendarOpen(false); }}>
                    Today
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" className="h-9" onClick={goToToday}>
              Today
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setCallForCoverOpen(true)}
              disabled={totalMissing === 0}
            >
              <Phone className="mr-2 h-4 w-4 shrink-0" />
              Call for cover
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setBroadcastDialogOpen(true)}
              disabled={!canSendBroadcast}
            >
              <Megaphone className="mr-2 h-4 w-4 shrink-0" />
              Broadcast
            </Button>
          </div>
        </div>

        {!timelineLoading && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              {clockedInNow.length} here now
            </span>
            {totalMissing > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:text-amber-400">
                <UserX className="h-3.5 w-3.5" />
                {totalMissing} missing
              </span>
            )}
            {clocksError && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Clock history limited (need clock:view_all for full team).
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 p-4 sm:p-6">
        {timelineLoading ? (
          <div className="flex min-h-[240px] items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <NowDayTimeline
            rows={timelineRows}
            windowStartMin={windowStartMin}
            windowEndMin={windowEndMin}
            nowMinutes={nowMinutes}
            isToday={isToday}
          />
        )}

        {clockedInNow.length > 0 && (
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="h-4 w-4" aria-hidden />
              </span>
              Here now (detail)
              <Badge variant="secondary" className="font-medium tabular-nums">
                {clockedInNow.length}
              </Badge>
            </h3>
            <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 border-b border-border/60">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground"
                        onClick={() => toggleNowSort("user")}
                        aria-label="Sort by user"
                      >
                        User
                        {nowSort.column === "user" && <span className="text-[10px]">{nowSort.direction === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                    <th className="px-4 py-3 border-b border-border/60">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground"
                        onClick={() => toggleNowSort("department")}
                        aria-label="Sort by department"
                      >
                        Department
                        {nowSort.column === "department" && <span className="text-[10px]">{nowSort.direction === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                    <th className="px-4 py-3 border-b border-border/60">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground"
                        onClick={() => toggleNowSort("location")}
                        aria-label="Sort by location"
                      >
                        Location
                        {nowSort.column === "location" && <span className="text-[10px]">{nowSort.direction === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                    <th className="px-4 py-3 border-b border-border/60">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground"
                        onClick={() => toggleNowSort("role")}
                        aria-label="Sort by role"
                      >
                        Role
                        {nowSort.column === "role" && <span className="text-[10px]">{nowSort.direction === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right whitespace-nowrap border-b border-border/60">
                      <button
                        type="button"
                        className="inline-flex items-center justify-end gap-1 cursor-pointer hover:text-foreground"
                        onClick={() => toggleNowSort("clock_in_time")}
                        aria-label="Sort by logged in time"
                      >
                        Logged in at
                        {nowSort.column === "clock_in_time" && <span className="text-[10px]">{nowSort.direction === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClockedInNow.map((u, i) => {
                    const name = u.display_name ?? `User ${u.user_id}`;
                    const initials =
                      name
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?";
                    return (
                      <tr key={u.user_id} className={cn("border-b border-border/50", i % 2 === 1 && "bg-muted/20")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border/50">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.department_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.location_name || "—"}</td>
                        <td className="px-4 py-3">
                          {u.role_name ? (
                            <Badge variant="outline" className="font-normal text-muted-foreground">
                              {u.role_name}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                          {u.clock_in_time ? (
                            <span className="inline-flex items-center justify-end gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              {format(parseUTCDate(u.clock_in_time), "dd MMM, HH:mm")}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {byRole.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Expected vs checked-in vs missing by role</h3>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden min-w-0">
              <div className="grid grid-cols-[1fr_auto_auto_1fr] gap-4 border-b bg-muted/30 px-4 py-3 sm:px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Role</span>
                <span className="text-center">Expected</span>
                <span className="text-center">Checked-in</span>
                <span>Missing</span>
              </div>
              {byRole.map((role) => {
                const status = getStatus(role);
                const roleName = role.role_name || `Role ${role.shift_role_id ?? role.job_role_id ?? "—"}`;
                return (
                  <div
                    key={`${role.shift_role_id ?? 0}-${role.job_role_id ?? 0}`}
                    className={cn(
                      "grid grid-cols-[1fr_auto_auto_1fr] gap-4 px-4 py-3.5 sm:px-5 border-b border-border/50 last:border-0",
                      status === "green" && "bg-emerald-500/5",
                      status === "amber" && "bg-amber-500/5",
                      status === "red" && "bg-red-500/5"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          status === "green" && "bg-emerald-500",
                          status === "amber" && "bg-amber-500",
                          status === "red" && "bg-red-500",
                          status === "muted" && "bg-muted-foreground/50"
                        )}
                        aria-hidden
                      />
                      <span className="font-medium text-foreground">{roleName}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <UserCheck className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span>{role.expected_count}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span className={cn(role.checked_in_count === role.expected_count && "font-medium text-emerald-600")}>
                        {role.checked_in_count}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {role.missing_count === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                          {(role.missing ?? []).map((u) => (
                            <span
                              key={u.user_id}
                              className="rounded bg-amber-500/15 px-2 py-0.5 text-sm font-medium text-amber-800 dark:text-amber-200"
                            >
                              {u.display_name ?? `User ${u.user_id}`}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!timelineLoading && timelineRows.length === 0 && clockedInNow.length === 0 && byRole.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No shifts or clock activity for this day with the current filters.
          </div>
        )}
      </CardContent>

      <CreateBroadcastDialog
        open={broadcastDialogOpen}
        onOpenChange={setBroadcastDialogOpen}
        onSubmit={async (data) => {
          try {
            await createMessageMutation.mutateAsync(data);
            setBroadcastDialogOpen(false);
          } catch {
            /* mutation handles toast */
          }
        }}
        isLoading={createMessageMutation.isPending}
        initialTitle={broadcastInitialTitle}
        initialContent={broadcastInitialContent}
      />

      <Dialog open={callForCoverOpen} onOpenChange={setCallForCoverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call for cover</DialogTitle>
            <DialogDescription>
              Staff missing for the selected day. Call or send an SMS using their phone number (if set).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto py-2">
            {missingWithRole.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one missing for this day.</p>
            ) : (
              missingWithRole.map((u) => {
                const name = u.display_name ?? `User ${u.user_id}`;
                const phone = u.phone_number?.trim?.() || null;
                const telHref = phone ? `tel:${phone.replace(/\s/g, "")}` : null;
                const smsHref = phone ? `sms:${phone.replace(/\s/g, "")}` : null;
                return (
                  <div
                    key={`${u.user_id}-${u.role_name}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{u.role_name}</p>
                      {phone && <p className="text-xs text-muted-foreground">{phone}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {telHref ? (
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href={telHref} target="_blank" rel="noopener noreferrer">
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No phone</span>
                      )}
                      {smsHref ? (
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href={smsHref} target="_blank" rel="noopener noreferrer">
                            <MessageSquare className="h-3.5 w-3.5" />
                            SMS
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useClockRecords } from "@/hooks/useClock";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Coffee, User, MapPin, Building2, Loader2, ArrowLeft, History, Filter, RefreshCw, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDateForAPI, startOfDay, endOfDay } from "@/utils/time";

export default function ClockHistoryPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedRecordForBreaks, setSelectedRecordForBreaks] = useState(null);

  // Build params with date/time formatting
  // Send dates as-is - backend should handle timezone interpretation correctly
  const params = React.useMemo(() => {
    const paramsObj = {
      page,
      per_page: perPage,
    };

    // Format start date/time
    if (startDate) {
      paramsObj.start_date = formatDateForAPI(startDate);
      if (startTime) {
        paramsObj.start_time = startTime;
      }
    }

    // Format end date/time
    if (endDate) {
      paramsObj.end_date = formatDateForAPI(endDate);
      if (endTime) {
        paramsObj.end_time = endTime;
      }
    }

    // Debug: Log what we're sending
    if (process.env.NODE_ENV === "development") {
      console.log("Session History Filter Params:", paramsObj);
      console.log("Selected dates - Start:", startDate?.toLocaleString(), "End:", endDate?.toLocaleString());
      console.log("Selected times - Start:", startTime, "End:", endTime);
    }

    return paramsObj;
  }, [startDate, endDate, startTime, endTime, page, perPage]);

  const { data: clockRecordsData, isLoading, refetch } = useClockRecords(params);

  // Normalize records data - API can return records or items
  const records = React.useMemo(() => {
    if (!clockRecordsData) return [];
    if (Array.isArray(clockRecordsData)) return clockRecordsData;
    if (Array.isArray(clockRecordsData.records)) return clockRecordsData.records;
    if (Array.isArray(clockRecordsData.items)) return clockRecordsData.items;
    return [];
  }, [clockRecordsData]);

  const total = clockRecordsData?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const handleApplyFilters = () => {
    setPage(1); // Reset to first page when filters change
  };


  const formatBreakDuration = (startTime, endTime, breakDurationSeconds) => {
    // If break_duration is provided (from API), use it for more accurate calculation
    if (breakDurationSeconds !== undefined && breakDurationSeconds !== null) {
      const totalSeconds = Math.floor(breakDurationSeconds);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    // Fallback to calculating from times
    if (!startTime || !endTime) return "N/A";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDuration = (startTime, endTime, shiftDurationSeconds) => {
    // If shift_duration is provided (from API), use it for more accurate calculation
    if (shiftDurationSeconds !== undefined && shiftDurationSeconds !== null) {
      const totalSeconds = Math.floor(shiftDurationSeconds);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }

    // Fallback to calculating from times
    if (!startTime || !endTime) return "N/A";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateTotalBreakTime = (breakRecords, totalBreakDurationSeconds) => {
    // If total_break_duration is provided (from API), use it for more accurate calculation
    if (totalBreakDurationSeconds !== undefined && totalBreakDurationSeconds !== null) {
      const totalSeconds = Math.floor(totalBreakDurationSeconds);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    // Fallback to calculating from break records
    if (!breakRecords || breakRecords.length === 0) return "0m";
    let totalMs = 0;
    breakRecords.forEach((breakRecord) => {
      if (breakRecord.break_start_time && breakRecord.break_end_time) {
        const start = new Date(breakRecord.break_start_time);
        const end = new Date(breakRecord.break_end_time);
        totalMs += end - start;
      }
    });
    const minutes = Math.floor(totalMs / (1000 * 60));
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <History className="h-8 w-8 text-primary" />
              Session History
            </h1>
            <p className="text-muted-foreground mt-1">
              View and filter your past check in/out records
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Filters</CardTitle>
          </div>
          <CardDescription>Filter session records by date and time range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Date Range Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setStartDate(startOfDay(today));
                  setEndDate(endOfDay(today));
                  setStartTime("00:00");
                  setEndTime("23:59");
                  setPage(1);
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  setStartDate(startOfDay(weekAgo));
                  setEndDate(endOfDay(today));
                  setStartTime("00:00");
                  setEndTime("23:59");
                  setPage(1);
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setDate(today.getDate() - 30);
                  setStartDate(startOfDay(monthAgo));
                  setEndDate(endOfDay(today));
                  setStartTime("00:00");
                  setEndTime("23:59");
                  setPage(1);
                }}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setStartDate(startOfDay(firstDay));
                  setEndDate(endOfDay(today));
                  setStartTime("00:00");
                  setEndTime("23:59");
                  setPage(1);
                }}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                  setStartDate(startOfDay(lastMonth));
                  setEndDate(endOfDay(lastDayOfLastMonth));
                  setStartTime("00:00");
                  setEndTime("23:59");
                  setPage(1);
                }}
              >
                Last Month
              </Button>
            </div>
          </div>

          {/* Date and Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date & Time */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Start Date & Time
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  End Date & Time
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Filters and Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="perPage">Records per page</Label>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  setPerPage(parseInt(value));
                  setPage(1);
                }}
              >
                <SelectTrigger id="perPage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() - 30);
                  setStartDate(date);
                  setEndDate(new Date());
                  setStartTime("00:00");
                  setEndTime("23:59");
                  setPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Session Records
              </CardTitle>
              <CardDescription className="mt-1">
                {total} record{total !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
              <p className="text-muted-foreground">
                No session records found for the selected date range
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Job Role</TableHead>
                      <TableHead className="font-semibold">Shift Role</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Check In</TableHead>
                      <TableHead className="font-semibold">Check Out</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Breaks</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => {
                      // Handle both flat API response and nested object formats
                      const initialShiftRole =
                        record.initial_shift_role_name ||
                        record.initial_shift_role?.display_name ||
                        record.initial_shift_role?.name ||
                        "N/A";
                      const currentShiftRole =
                        record.current_shift_role_name ||
                        record.current_shift_role?.display_name ||
                        record.current_shift_role?.name ||
                        initialShiftRole;
                      const hasBreaks = record.break_records && record.break_records.length > 0;

                      return (
                        <React.Fragment key={record.id}>
                          <TableRow className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {record.clock_in_time
                                    ? format(new Date(record.clock_in_time), "dd MMM yyyy")
                                    : "N/A"}
                                </span>
                                {record.clock_in_time && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(record.clock_in_time), "EEEE")}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {record.job_role_name || record.job_role?.display_name || record.job_role?.name || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="secondary" className="font-normal">
                                  {currentShiftRole}
                                </Badge>
                                {record.shift_role_changes &&
                                  record.shift_role_changes.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {record.shift_role_changes.length} change
                                      {record.shift_role_changes.length !== 1 ? "s" : ""}
                                    </div>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.location_name || record.location?.name ? (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{record.location_name || record.location?.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {record.clock_in_time
                                    ? format(new Date(record.clock_in_time), "HH:mm")
                                    : "N/A"}
                                </span>
                                {record.clock_in_time && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(record.clock_in_time), "dd MMM")}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.clock_out_time ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {format(new Date(record.clock_out_time), "HH:mm")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(record.clock_out_time), "dd MMM")}
                                  </span>
                                </div>
                              ) : record.status === "active" ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  {formatDuration(record.clock_in_time, record.clock_out_time, record.shift_duration)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasBreaks ? (
                                <div className="space-y-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-2 hover:bg-muted"
                                    onClick={() => setSelectedRecordForBreaks(record)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Coffee className="h-4 w-4 text-amber-600" />
                                      <span className="font-medium">
                                        {record.break_records.length} break
                                        {record.break_records.length !== 1 ? "s" : ""}
                                      </span>
                                      <ChevronRight className="h-4 w-4" />
                                    </div>
                                  </Button>
                                  <div className="text-xs text-muted-foreground pl-1">
                                    {calculateTotalBreakTime(record.break_records, record.total_break_duration)} total
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No breaks</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  record.status === "active" || record.current_state === "active"
                                    ? "default"
                                    : record.status === "on_break" || record.current_state === "on_break"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {record.status === "active" || record.current_state === "active"
                                  ? "Active"
                                  : record.status === "on_break" || record.current_state === "on_break"
                                    ? "On Break"
                                    : "Completed"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={
                          page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breaks Dialog */}
      <Dialog open={!!selectedRecordForBreaks} onOpenChange={(open) => !open && setSelectedRecordForBreaks(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-amber-600" />
              Break Details
            </DialogTitle>
            <DialogDescription>
              {selectedRecordForBreaks && (
                <>
                  Breaks for {selectedRecordForBreaks.clock_in_time
                    ? format(new Date(selectedRecordForBreaks.clock_in_time), "dd MMM yyyy")
                    : "this record"}
                  {selectedRecordForBreaks.break_records && (
                    <> - Total: {calculateTotalBreakTime(selectedRecordForBreaks.break_records, selectedRecordForBreaks.total_break_duration)}</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedRecordForBreaks?.break_records && selectedRecordForBreaks.break_records.length > 0 ? (
              selectedRecordForBreaks.break_records.map((breakRecord, idx) => (
                <Card key={breakRecord.id || idx} className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-amber-600" />
                        Break {idx + 1}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono">
                        {formatBreakDuration(breakRecord.break_start_time, breakRecord.break_end_time, breakRecord.break_duration)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Time</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {breakRecord.break_start_time
                              ? format(new Date(breakRecord.break_start_time), "dd MMM yyyy 'at' HH:mm")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End Time</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {breakRecord.break_end_time
                              ? format(new Date(breakRecord.break_end_time), "dd MMM yyyy 'at' HH:mm")
                              : "Active"}
                          </span>
                        </div>
                      </div>
                      {breakRecord.break_duration !== undefined && breakRecord.break_duration !== null && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Duration</Label>
                          <div className="mt-1">
                            <Badge variant="outline" className="font-mono">
                              {formatBreakDuration(breakRecord.break_start_time, breakRecord.break_end_time, breakRecord.break_duration)}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                    {breakRecord.notes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Notes</Label>
                        <p className="mt-1 text-sm italic text-muted-foreground bg-muted/50 p-2 rounded">
                          "{breakRecord.notes}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No breaks recorded for this shift</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}










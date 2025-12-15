"use client";

import React, { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Coffee, User, MapPin, Building2, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ClockHistoryPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const params = {
    start_date: format(startDate, "yyyy-MM-dd"),
    end_date: format(endDate, "yyyy-MM-dd"),
    page,
    per_page: perPage,
  };

  const { data: clockRecordsData, isLoading } = useClockRecords(params);

  const records = clockRecordsData?.items || clockRecordsData?.records || [];
  const total = clockRecordsData?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const handleApplyFilters = () => {
    setPage(1); // Reset to first page when filters change
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateTotalBreakTime = (breakRecords) => {
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
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clock History</h1>
          <p className="text-muted-foreground">
            View your past clock in/out records
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
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
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
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
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
            <div className="flex items-end">
              <Button onClick={handleApplyFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clock Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clock Records</CardTitle>
          <CardDescription>
            {total} record{total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clock records found for the selected date range
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Job Role</TableHead>
                      <TableHead>Shift Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Breaks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => {
                      const initialShiftRole =
                        record.initial_shift_role?.display_name ||
                        record.initial_shift_role?.name ||
                        "N/A";
                      const currentShiftRole =
                        record.current_shift_role?.display_name ||
                        record.current_shift_role?.name ||
                        initialShiftRole;

                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.clock_in_time
                              ? format(new Date(record.clock_in_time), "dd/MM/yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {record.job_role?.display_name || record.job_role?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{currentShiftRole}</div>
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
                            {record.location ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {record.location.name}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {record.clock_in_time
                              ? format(new Date(record.clock_in_time), "HH:mm")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {record.clock_out_time
                              ? format(new Date(record.clock_out_time), "HH:mm")
                              : record.status === "active"
                                ? "—"
                                : "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDuration(record.clock_in_time, record.clock_out_time)}
                          </TableCell>
                          <TableCell>
                            {record.break_records && record.break_records.length > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Coffee className="h-3 w-3 text-muted-foreground" />
                                  {record.break_records.length} break
                                  {record.break_records.length !== 1 ? "s" : ""}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {calculateTotalBreakTime(record.break_records)} total
                                </div>
                              </div>
                            ) : (
                              "No breaks"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === "active"
                                  ? "default"
                                  : record.status === "on_break"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {record.status === "active"
                                ? "Active"
                                : record.status === "on_break"
                                  ? "On Break"
                                  : "Completed"}
                            </Badge>
                          </TableCell>
                        </TableRow>
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
    </div>
  );
}





"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FileSpreadsheet,
  Download,
  Filter,
  CalendarIcon,
  User,
  Building2,
  MapPin,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useClockRecords } from "@/hooks/useClock";
import { useUsers } from "@/hooks/useUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { useLocations } from "@/hooks/useLocations";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { formatDateForAPI } from "@/utils/time";
import { toast } from "sonner";
import { clockService } from "@/services/clock";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    return { from: start, to: end };
  });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Permission checks
  const { isSuperuser, hasPermission } = usePermissionsCheck();
  const canViewReports = isSuperuser || hasPermission("reports:read") || hasPermission("reports:*");

  // Fetch data
  const { data: usersResponse } = useUsers();
  const { data: departmentsData } = useDepartments();
  const { data: locations } = useLocations();

  // Extract users from response
  const users = useMemo(() => {
    if (!usersResponse) return [];
    const responseData = usersResponse?.data || usersResponse;
    return responseData?.users || responseData || [];
  }, [usersResponse]);

  // Extract departments from response
  const departments = useMemo(() => {
    if (!departmentsData) return [];
    if (Array.isArray(departmentsData)) return departmentsData;
    return departmentsData?.departments || departmentsData?.data || [];
  }, [departmentsData]);

  // Extract locations from response
  const locationsList = useMemo(() => {
    if (!locations) return [];
    if (Array.isArray(locations)) return locations;
    return locations?.locations || locations?.data || [];
  }, [locations]);

  // Build params for API call
  const params = useMemo(() => {
    const paramsObj = {};

    // Date range
    if (dateRange?.from) {
      paramsObj.start_date = formatDateForAPI(dateRange.from);
    }
    if (dateRange?.to) {
      paramsObj.end_date = formatDateForAPI(dateRange.to);
    }

    // Filters
    if (selectedUserId) {
      paramsObj.user_id = selectedUserId;
    }
    if (selectedDepartmentId) {
      paramsObj.department_id = selectedDepartmentId;
    }
    if (selectedLocationId) {
      paramsObj.location_id = selectedLocationId;
    }

    // Get all records (no pagination for reports)
    paramsObj.per_page = 10000; // Large number to get all records

    return paramsObj;
  }, [dateRange, selectedUserId, selectedDepartmentId, selectedLocationId]);

  const { data: clockRecordsData, isLoading, refetch } = useClockRecords(params);

  // Normalize records data
  const records = useMemo(() => {
    if (!clockRecordsData) return [];
    if (Array.isArray(clockRecordsData)) return clockRecordsData;
    return clockRecordsData?.records || clockRecordsData?.items || clockRecordsData?.data || [];
  }, [clockRecordsData]);

  // Export to Excel/CSV
  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Prepare export params
      const exportParams = { ...params, format: "excel" };

      // Call export endpoint
      const response = await clockService.exportClockRecords(exportParams);

      // Create blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename
      const start = dateRange?.from || new Date();
      const end = dateRange?.to || new Date();
      const filename = `session-reports-${format(start, "yyyy-MM-dd")}-to-${format(end, "yyyy-MM-dd")}.xlsx`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully", {
        description: `Exported ${records.length} session records to Excel`,
      });
    } catch (error) {
      console.error("Export failed:", error);

      // Fallback: Generate CSV client-side if API export fails
      if (records.length > 0) {
        generateCSVExport();
      } else {
        toast.error("Failed to export report", {
          description: error?.response?.data?.message || "An error occurred while exporting",
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Fallback CSV export (client-side)
  const generateCSVExport = () => {
    try {
      // CSV headers
      const headers = [
        "Date",
        "User",
        "Department",
        "Location",
        "Job Role",
        "Shift Role",
        "Check In Time",
        "Check Out Time",
        "Duration",
        "Break Duration",
        "Login Method",
        "Status",
        "Notes",
      ];

      // Convert records to CSV rows
      const rows = records.map((record) => {
        const checkInTime = record.clock_in_time
          ? format(new Date(record.clock_in_time), "yyyy-MM-dd HH:mm:ss")
          : "";
        const checkOutTime = record.clock_out_time
          ? format(new Date(record.clock_out_time), "yyyy-MM-dd HH:mm:ss")
          : "";

        // Calculate duration - use API shift_duration if available
        let duration = "";
        if (record.shift_duration !== null && record.shift_duration !== undefined) {
          const totalSeconds = Math.floor(record.shift_duration);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          duration = `${hours}h ${minutes}m`;
        } else if (record.clock_in_time && record.clock_out_time) {
          const start = new Date(record.clock_in_time);
          const end = new Date(record.clock_out_time);
          const hours = (end - start) / (1000 * 60 * 60);
          duration = hours.toFixed(2) + "h";
        } else if (record.clock_in_time) {
          duration = "Active";
        }

        // Format break duration
        let breakDuration = "";
        if (record.total_break_duration !== null && record.total_break_duration !== undefined) {
          const totalSeconds = Math.floor(record.total_break_duration);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          if (hours > 0) {
            breakDuration = `${hours}h ${minutes}m`;
          } else {
            breakDuration = `${minutes}m`;
          }
        } else {
          breakDuration = "0m";
        }

        return [
          checkInTime ? format(new Date(record.clock_in_time), "yyyy-MM-dd") : "",
          record.user_name ||
          record.user?.name ||
          record.user?.display_name ||
          record.user?.username ||
          "",
          record.department_name ||
          record.department?.name ||
          record.department?.display_name ||
          "",
          record.location_name ||
          record.location?.name ||
          record.location?.display_name ||
          "",
          record.job_role_name ||
          record.job_role?.name ||
          record.job_role?.display_name ||
          "",
          record.initial_shift_role_name ||
          record.shift_role?.name ||
          record.shift_role?.display_name ||
          "",
          checkInTime,
          checkOutTime,
          duration,
          breakDuration,
          record.login_method
            ? record.login_method.charAt(0).toUpperCase() + record.login_method.slice(1)
            : "",
          record.status === "completed" || record.clock_out_time
            ? "Completed"
            : record.status === "active"
              ? "Active"
              : "Active",
          record.notes || "",
        ];
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const start = dateRange?.from || new Date();
      const end = dateRange?.to || new Date();
      const filename = `session-reports-${format(start, "yyyy-MM-dd")}-to-${format(end, "yyyy-MM-dd")}.csv`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully", {
        description: `Exported ${records.length} session records to CSV`,
      });
    } catch (error) {
      console.error("CSV export failed:", error);
      toast.error("Failed to export report", {
        description: "An error occurred while generating the CSV file",
      });
    }
  };

  // Quick date range presets
  const applyDatePreset = (preset) => {
    const today = new Date();
    const start = new Date();

    switch (preset) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "last7":
        start.setDate(start.getDate() - 7);
        setDateRange({ from: start, to: today });
        break;
      case "last30":
        start.setDate(start.getDate() - 30);
        setDateRange({ from: start, to: today });
        break;
      case "thisMonth":
        start.setDate(1);
        setDateRange({ from: start, to: today });
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateRange({ from: lastMonthStart, to: lastMonthEnd });
        break;
      case "thisYear":
        start.setMonth(0, 1);
        setDateRange({ from: start, to: today });
        break;
      default:
        break;
    }
    setIsCalendarOpen(false);
  };

  // Clear filters
  const clearFilters = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({ from: start, to: end });
    setSelectedUserId(null);
    setSelectedDepartmentId(null);
    setSelectedLocationId(null);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedUserId || selectedDepartmentId || selectedLocationId;

  if (!canViewReports) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              View and export check in/out session reports
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view reports. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View and export check in/out session reports
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || records.length === 0}
          className="w-full sm:w-auto sm:max-w-fit whitespace-nowrap"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to Excel
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle>Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
          <CardDescription>Filter session records by date range, user, department, or location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyDatePreset("today")}
                        className="text-xs"
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyDatePreset("yesterday")}
                        className="text-xs"
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyDatePreset("last7")}
                        className="text-xs"
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyDatePreset("last30")}
                        className="text-xs"
                      >
                        Last 30 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyDatePreset("thisMonth")}
                        className="text-xs"
                      >
                        This month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyDatePreset("lastMonth")}
                        className="text-xs"
                      >
                        Last month
                      </Button>
                    </div>
                  </div>
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={selectedUserId?.toString() || "all"}
                onValueChange={(value) =>
                  setSelectedUserId(value === "all" ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.display_name || user.username || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={selectedDepartmentId?.toString() || "all"}
                onValueChange={(value) =>
                  setSelectedDepartmentId(value === "all" ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name} {dept.code && `(${dept.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={selectedLocationId?.toString() || "all"}
                onValueChange={(value) =>
                  setSelectedLocationId(value === "all" ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locationsList.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name || location.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Session Records</CardTitle>
              <CardDescription className="mt-1">
                {isLoading ? (
                  "Loading records..."
                ) : (
                  <>
                    Found {records.length} session record{records.length !== 1 ? "s" : ""}
                    {hasActiveFilters && " (filtered)"}
                  </>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
              <p className="text-muted-foreground">
                No session records found for the selected filters. Try adjusting your date range or filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Job Role</TableHead>
                    <TableHead>Shift Role</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Break Duration</TableHead>
                    <TableHead>Login Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const checkInTime = record.clock_in_time
                      ? format(new Date(record.clock_in_time), "MMM dd, yyyy HH:mm")
                      : "";
                    const checkOutTime = record.clock_out_time
                      ? format(new Date(record.clock_out_time), "MMM dd, yyyy HH:mm")
                      : "";

                    // Calculate duration - use API shift_duration if available, otherwise calculate
                    let duration = "";
                    if (record.shift_duration !== null && record.shift_duration !== undefined) {
                      // shift_duration is in seconds
                      const totalSeconds = Math.floor(record.shift_duration);
                      const hours = Math.floor(totalSeconds / 3600);
                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                      duration = `${hours}h ${minutes}m`;
                    } else if (record.clock_in_time && record.clock_out_time) {
                      const start = new Date(record.clock_in_time);
                      const end = new Date(record.clock_out_time);
                      const hours = Math.floor((end - start) / (1000 * 60 * 60));
                      const minutes = Math.floor(
                        ((end - start) % (1000 * 60 * 60)) / (1000 * 60)
                      );
                      duration = `${hours}h ${minutes}m`;
                    } else if (record.clock_in_time) {
                      duration = "Active";
                    }

                    // Format break duration
                    let breakDuration = "";
                    if (record.total_break_duration !== null && record.total_break_duration !== undefined) {
                      const totalSeconds = Math.floor(record.total_break_duration);
                      const hours = Math.floor(totalSeconds / 3600);
                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                      if (hours > 0) {
                        breakDuration = `${hours}h ${minutes}m`;
                      } else {
                        breakDuration = `${minutes}m`;
                      }
                    } else {
                      breakDuration = "0m";
                    }

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          {checkInTime
                            ? format(new Date(record.clock_in_time), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {record.user_name ||
                            record.user?.name ||
                            record.user?.display_name ||
                            record.user?.username ||
                            record.user?.email ||
                            "-"}
                        </TableCell>
                        <TableCell>
                          {record.department_name ||
                            record.department?.name ||
                            record.department?.display_name ||
                            "-"}
                        </TableCell>
                        <TableCell>
                          {record.location_name ||
                            record.location?.name ||
                            record.location?.display_name ||
                            "-"}
                        </TableCell>
                        <TableCell>
                          {record.job_role_name ||
                            record.job_role?.name ||
                            record.job_role?.display_name ||
                            "-"}
                        </TableCell>
                        <TableCell>
                          {record.initial_shift_role_name ||
                            record.shift_role?.name ||
                            record.shift_role?.display_name ||
                            "-"}
                        </TableCell>
                        <TableCell>{checkInTime || "-"}</TableCell>
                        <TableCell>{checkOutTime || "-"}</TableCell>
                        <TableCell>{duration || "-"}</TableCell>
                        <TableCell>{breakDuration || "0m"}</TableCell>
                        <TableCell>
                          {record.login_method
                            ? record.login_method.charAt(0).toUpperCase() + record.login_method.slice(1)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              record.status === "completed" || record.clock_out_time
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                            )}
                          >
                            {record.status === "completed" || record.clock_out_time
                              ? "Completed"
                              : record.status === "active"
                                ? "Active"
                                : "Active"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useActiveClocks,
  useUpdateClockRecord,
} from "@/hooks/useClock";
import { useLocations } from "@/hooks/useLocations";
import { useDepartments } from "@/hooks/useDepartments";
import { useSettings } from "@/hooks/useConfiguration";
import {
  Clock,
  AlertTriangle,
  Coffee,
  User,
  MapPin,
  Building2,
  Loader2,
  RefreshCw,
  Edit,
  ArrowLeft,
  Users,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { calculateElapsedHours, formatElapsedTime } from "@/utils/time";

export default function ManagerClockPage() {
  const router = useRouter();
  const [locationFilter, setLocationFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editClockInTime, setEditClockInTime] = useState("");
  const [editClockOutTime, setEditClockOutTime] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Get configuration for warning thresholds
  const { data: settingsData } = useSettings({ category: "clock" });
  const warningThresholdHours = React.useMemo(() => {
    const setting = settingsData?.items?.find(
      (s) => s.setting_key === "clock.warnings.threshold_hours"
    );
    return setting?.value ? parseInt(setting.value) : 8; // Default 8 hours
  }, [settingsData]);

  const autoClockOutThresholdHours = React.useMemo(() => {
    const setting = settingsData?.items?.find(
      (s) => s.setting_key === "clock.auto_clock_out.threshold_hours"
    );
    return setting?.value ? parseInt(setting.value) : 12; // Default 12 hours
  }, [settingsData]);

  // Get active clocks
  const params = {};
  if (locationFilter && locationFilter !== "all") params.location_id = parseInt(locationFilter);
  if (departmentFilter && departmentFilter !== "all") params.department_id = parseInt(departmentFilter);

  const { data: activeClocksData, isLoading, refetch } = useActiveClocks(params, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get locations and departments for filters
  const { data: locationsData } = useLocations();
  const { data: departmentsDataRaw } = useDepartments();

  // Normalize departments data to handle different response formats
  const departmentsData = React.useMemo(() => {
    if (!departmentsDataRaw) return [];
    if (Array.isArray(departmentsDataRaw)) return departmentsDataRaw;
    if (Array.isArray(departmentsDataRaw.departments)) return departmentsDataRaw.departments;
    if (Array.isArray(departmentsDataRaw.data)) return departmentsDataRaw.data;
    if (Array.isArray(departmentsDataRaw.items)) return departmentsDataRaw.items;
    return [];
  }, [departmentsDataRaw]);

  // Normalize locations data to handle different response formats
  const locations = React.useMemo(() => {
    if (!locationsData) return [];
    if (Array.isArray(locationsData)) return locationsData;
    if (Array.isArray(locationsData.locations)) return locationsData.locations;
    if (Array.isArray(locationsData.data)) return locationsData.data;
    if (Array.isArray(locationsData.items)) return locationsData.items;
    return [];
  }, [locationsData]);

  // Update clock record mutation
  const updateClockRecordMutation = useUpdateClockRecord();

  // Normalize active clocks data - API returns array directly
  const activeClocks = React.useMemo(() => {
    if (!activeClocksData) return [];
    if (Array.isArray(activeClocksData)) return activeClocksData;
    if (Array.isArray(activeClocksData.items)) return activeClocksData.items;
    if (Array.isArray(activeClocksData.data)) return activeClocksData.data;
    return [];
  }, [activeClocksData]);

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setEditClockInTime(
      record.clock_in_time
        ? format(new Date(record.clock_in_time), "yyyy-MM-dd'T'HH:mm")
        : ""
    );
    setEditClockOutTime(
      record.clock_out_time
        ? format(new Date(record.clock_out_time), "yyyy-MM-dd'T'HH:mm")
        : ""
    );
    // API might not return notes in active clocks endpoint, use empty string as default
    setEditNotes(record.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    if (!editNotes.trim()) {
      alert("Notes are required when editing session records.");
      return;
    }

    const updateData = {
      clock_in_time: editClockInTime
        ? new Date(editClockInTime).toISOString()
        : editingRecord.clock_in_time,
      clock_out_time: editClockOutTime
        ? new Date(editClockOutTime).toISOString()
        : editingRecord.clock_out_time,
      notes: editNotes.trim(),
    };

    try {
      // Use clock_record_id from API response, fallback to id for backward compatibility
      const recordId = editingRecord.clock_record_id || editingRecord.id;
      await updateClockRecordMutation.mutateAsync({
        id: recordId,
        clockData: updateData,
      });
      setEditingRecord(null);
      setEditClockInTime("");
      setEditClockOutTime("");
      setEditNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };


  const getStatusBadge = (record) => {
    // API returns current_state, but also check status for backward compatibility
    const status = record.current_state || record.status;
    const isOnBreak = record.is_on_break || status === "on_break";

    if (isOnBreak || status === "on_break") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Coffee className="h-3 w-3" />
          On Break
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  const getWarningBadge = (elapsedHours) => {
    if (elapsedHours >= autoClockOutThresholdHours) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Very Long Session
        </Badge>
      );
    }
    if (elapsedHours >= warningThresholdHours) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          Long Session
        </Badge>
      );
    }
    return null;
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
              <Users className="h-8 w-8 text-primary" />
              Active People
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage active clock sessions in real-time
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          className="h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClocks.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeClocks.length === 1 ? "person checked in" : "people checked in"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeClocks.filter(r => r.is_on_break || r.current_state === "on_break").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently on break
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long Sessions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeClocks.filter(r => {
                const hours = calculateElapsedHours(r.clock_in_time);
                return hours >= warningThresholdHours;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Over {warningThresholdHours}h elapsed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Filters</CardTitle>
          </div>
          <CardDescription>Filter active people by location or department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationFilter">Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger id="locationFilter">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentFilter">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger id="departmentFilter">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentsData?.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active People Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Active Sessions
              </CardTitle>
              <CardDescription className="mt-1">
                {activeClocks.length} {activeClocks.length === 1 ? "person" : "people"} currently checked in
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeClocks.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Active People</h3>
              <p className="text-muted-foreground">
                There are currently no active clock sessions
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Job Role</TableHead>
                    <TableHead className="font-semibold">Shift Role</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Check In Time</TableHead>
                    <TableHead className="font-semibold">Elapsed</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeClocks.map((record, index) => {
                    const elapsedHours = calculateElapsedHours(record.clock_in_time);
                    const warningBadge = getWarningBadge(elapsedHours);
                    // Create a unique key: use clock_record_id if available, otherwise combine user_id and clock_in_time
                    const uniqueKey = record.clock_record_id || `clock-${record.user_id || 'unknown'}-${record.clock_in_time || `index-${index}`}`;

                    // Get user initials for avatar
                    const userInitials = record.user_name
                      ? record.user_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                      : 'U';

                    return (
                      <TableRow key={uniqueKey} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {userInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {record.user_name || "N/A"}
                              </div>
                              {record.user?.email && (
                                <div className="text-sm text-muted-foreground">
                                  {record.user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-normal">
                              {record.job_role_name || record.job_role?.display_name || record.job_role?.name || "N/A"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-normal">
                              {record.current_shift_role_name ||
                                record.current_shift_role?.display_name ||
                                record.current_shift_role?.name ||
                                "N/A"}
                            </Badge>
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
                          {record.department_name || record.department?.name ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{record.department_name || record.department?.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {record.clock_in_time
                                ? format(new Date(record.clock_in_time), "dd MMM yyyy")
                                : "N/A"}
                            </span>
                            {record.clock_in_time && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(record.clock_in_time), "HH:mm")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-primary">
                                {formatElapsedTime(record.clock_in_time)}
                              </span>
                            </div>
                            {warningBadge}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRecord(record)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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

      {/* Edit Session Record Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Session Record</DialogTitle>
            <DialogDescription>
              Update check in/out times and notes. Notes are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editClockInTime">
                  Check In Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editClockInTime"
                  type="datetime-local"
                  value={editClockInTime}
                  onChange={(e) => setEditClockInTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClockOutTime">Check Out Time</Label>
                <Input
                  id="editClockOutTime"
                  type="datetime-local"
                  value={editClockOutTime}
                  onChange={(e) => setEditClockOutTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">
                Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Enter notes about this edit..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingRecord(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateClockRecordMutation.isPending || !editNotes.trim()}
            >
              {updateClockRecordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}





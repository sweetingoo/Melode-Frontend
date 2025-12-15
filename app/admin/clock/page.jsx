"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

export default function ManagerClockPage() {
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

  const activeClocks = activeClocksData?.items || activeClocksData || [];

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
    setEditNotes(record.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    if (!editNotes.trim()) {
      alert("Notes are required when editing clock records.");
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
      await updateClockRecordMutation.mutateAsync({
        id: editingRecord.id,
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

  const calculateElapsedHours = (clockInTime) => {
    if (!clockInTime) return 0;
    const clockIn = new Date(clockInTime);
    const now = new Date();
    return (now - clockIn) / (1000 * 60 * 60); // Convert to hours
  };

  const getStatusBadge = (record) => {
    if (record.status === "on_break") {
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
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Active Clocks</h1>
            <p className="text-muted-foreground">
              View and manage active clock sessions
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
          <CardTitle>Filters</CardTitle>
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

      {/* Active Clocks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <CardDescription>
            {activeClocks.length} user{activeClocks.length !== 1 ? "s" : ""} currently clocked in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : activeClocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active clocks found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Job Role</TableHead>
                    <TableHead>Shift Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Clock In Time</TableHead>
                    <TableHead>Elapsed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeClocks.map((record) => {
                    const elapsedHours = calculateElapsedHours(record.clock_in_time);
                    const warningBadge = getWarningBadge(elapsedHours);

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {record.user?.first_name} {record.user?.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.user?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.job_role?.display_name || record.job_role?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {record.current_shift_role?.display_name ||
                            record.current_shift_role?.name ||
                            "N/A"}
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
                          {record.department ? (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {record.department.name}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          {record.clock_in_time
                            ? format(new Date(record.clock_in_time), "dd/MM/yyyy HH:mm")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {elapsedHours.toFixed(1)}h
                            </div>
                            {warningBadge}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRecord(record)}
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

      {/* Edit Clock Record Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Clock Record</DialogTitle>
            <DialogDescription>
              Update clock in/out times and notes. Notes are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editClockInTime">
                  Clock In Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editClockInTime"
                  type="datetime-local"
                  value={editClockInTime}
                  onChange={(e) => setEditClockInTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClockOutTime">Clock Out Time</Label>
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





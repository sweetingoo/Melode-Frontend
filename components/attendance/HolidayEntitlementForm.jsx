"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateHolidayEntitlement, useUpdateHolidayEntitlement } from "@/hooks/useAttendance";
import { useUsers } from "@/hooks/useUsers";
import { useHolidayYears } from "@/hooks/useAttendance";
import { useAssignments } from "@/hooks/useAssignments";

export const HolidayEntitlementForm = ({ open, onOpenChange, entitlement = null, preselectedUserId = null }) => {
  const [userId, setUserId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [holidayYearId, setHolidayYearId] = useState("");
  const [annualAllowanceHours, setAnnualAllowanceHours] = useState("187.5");
  const [carriedForwardHours, setCarriedForwardHours] = useState("0");
  const [notes, setNotes] = useState("");

  const createEntitlement = useCreateHolidayEntitlement();
  const updateEntitlement = useUpdateHolidayEntitlement();

  const { data: usersData } = useUsers({ per_page: 100 });
  const users = usersData?.users ?? usersData?.data ?? [];
  const { data: yearsData } = useHolidayYears({});
  const years = Array.isArray(yearsData) ? yearsData : (yearsData?.years ?? yearsData ?? []);
  const { data: assignmentsData } = useAssignments({
    user_id: userId ? parseInt(userId, 10) : undefined,
    is_active: true,
  });
  const assignments = assignmentsData?.assignments ?? assignmentsData ?? [];

  useEffect(() => {
    if (entitlement) {
      setUserId(String(entitlement.user_id));
      setJobRoleId(String(entitlement.job_role_id));
      setHolidayYearId(String(entitlement.holiday_year_id));
      setAnnualAllowanceHours(String(entitlement.annual_allowance_hours ?? 187.5));
      setCarriedForwardHours(String(entitlement.carried_forward_hours ?? 0));
      setNotes(entitlement.notes || "");
    } else {
      setUserId(preselectedUserId ? String(preselectedUserId) : "");
      setJobRoleId("");
      setHolidayYearId("");
      setAnnualAllowanceHours("187.5");
      setCarriedForwardHours("0");
      setNotes("");
    }
  }, [entitlement, open, preselectedUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allowance = parseFloat(annualAllowanceHours);
    const carried = parseFloat(carriedForwardHours);
    if (!userId || !jobRoleId || !holidayYearId || isNaN(allowance) || allowance < 0 || carried < 0) return;

    try {
      if (entitlement) {
        await updateEntitlement.mutateAsync({
          slug: entitlement.slug || entitlement.id,
          entitlementData: {
            annual_allowance_hours: allowance,
            carried_forward_hours: carried,
            notes: notes || null,
          },
        });
      } else {
        await createEntitlement.mutateAsync({
          user_id: parseInt(userId, 10),
          job_role_id: parseInt(jobRoleId, 10),
          holiday_year_id: parseInt(holidayYearId, 10),
          annual_allowance_hours: allowance,
          carried_forward_hours: carried,
          notes: notes || null,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Save holiday entitlement failed:", err);
    }
  };

  const canSubmit =
    userId &&
    jobRoleId &&
    holidayYearId &&
    !isNaN(parseFloat(annualAllowanceHours)) &&
    parseFloat(annualAllowanceHours) >= 0 &&
    !isNaN(parseFloat(carriedForwardHours)) &&
    parseFloat(carriedForwardHours) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{entitlement ? "Edit holiday entitlement" : "Add holiday entitlement"}</DialogTitle>
          <DialogDescription>
            Annual allowance (hours) per employee, job role and holiday year. E.g. 25 days = 187.5 hours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={userId} onValueChange={setUserId} required disabled={!!entitlement}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.display_name || u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job role</Label>
            <Select value={jobRoleId} onValueChange={setJobRoleId} required disabled={!!entitlement}>
              <SelectTrigger>
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id || a.role_id} value={String(a.role_id || a.job_role_id)}>
                    {a.role?.display_name || a.role?.name || `Role ${a.role_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Holiday year</Label>
            <Select value={holidayYearId} onValueChange={setHolidayYearId} required disabled={!!entitlement}>
              <SelectTrigger>
                <SelectValue placeholder="Select holiday year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.year_name} ({y.start_date} – {y.end_date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Annual allowance (hours)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={annualAllowanceHours}
                onChange={(e) => setAnnualAllowanceHours(e.target.value)}
                placeholder="187.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Carried forward (hours)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={carriedForwardHours}
                onChange={(e) => setCarriedForwardHours(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || createEntitlement.isPending || updateEntitlement.isPending}>
              {(createEntitlement.isPending || updateEntitlement.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {entitlement ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

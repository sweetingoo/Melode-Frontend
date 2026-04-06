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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useCreateHolidayYear, useUpdateHolidayYear } from "@/hooks/useAttendance";
import { formatDateForAPI } from "@/utils/time";

function computeDefaultNewHolidayYear(mmDd) {
  const now = new Date();
  const raw = (mmDd || "04-01").trim();
  const m = /^(\d{2})-(\d{2})$/.exec(raw);
  const month = m ? parseInt(m[1], 10) : 4;
  const day = m ? parseInt(m[2], 10) : 1;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return computeDefaultNewHolidayYear("04-01");
  }
  const y = now.getFullYear();
  const start = new Date(y, month - 1, day);
  if (start.getMonth() !== month - 1 || start.getDate() !== day) {
    return computeDefaultNewHolidayYear("04-01");
  }
  const nextPeriodStart = new Date(y + 1, month - 1, day);
  const end = new Date(nextPeriodStart);
  end.setDate(end.getDate() - 1);
  return {
    yearName: `${y}-${y + 1}`,
    startDate: formatDateForAPI(start),
    endDate: formatDateForAPI(end),
  };
}

function toDateInputValue(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export const HolidayYearForm = ({ open, onOpenChange, initialYear = null, defaultHolidayStartMmDd = "04-01" }) => {
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const createYear = useCreateHolidayYear();
  const updateYear = useUpdateHolidayYear();

  const isEdit = Boolean(initialYear?.id);
  const pending = createYear.isPending || updateYear.isPending;

  useEffect(() => {
    if (!open) return;
    if (initialYear) {
      setYearName(initialYear.year_name ?? "");
      setStartDate(toDateInputValue(initialYear.start_date));
      setEndDate(toDateInputValue(initialYear.end_date));
      setIsActive(initialYear.is_active !== false);
      return;
    }
    const suggested = computeDefaultNewHolidayYear(defaultHolidayStartMmDd);
    setYearName(suggested.yearName);
    setStartDate(suggested.startDate);
    setEndDate(suggested.endDate);
    setIsActive(true);
  }, [open, initialYear, defaultHolidayStartMmDd]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yearName.trim() || !startDate || !endDate) return;
    if (endDate <= startDate) return;
    try {
      if (isEdit) {
        const slug = initialYear.slug ?? String(initialYear.id);
        await updateYear.mutateAsync({
          slug,
          yearData: {
            year_name: yearName.trim(),
            start_date: startDate,
            end_date: endDate,
            is_active: isActive,
          },
        });
      } else {
        await createYear.mutateAsync({
          year_name: yearName.trim(),
          start_date: startDate,
          end_date: endDate,
          is_active: isActive,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error(isEdit ? "Update holiday year failed:" : "Create holiday year failed:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit holiday year" : "Add holiday year"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Change dates or name for this year. Leave entitlements and bookings tied to this year unchanged unless you adjust dates carefully."
              : "Define the holiday year period (e.g. 1 April to 31 March)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Year name</Label>
            <Input
              value={yearName}
              onChange={(e) => setYearName(e.target.value)}
              placeholder="e.g. 2025-2026"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="year-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="year-active">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!yearName.trim() || !startDate || !endDate || endDate <= startDate || pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

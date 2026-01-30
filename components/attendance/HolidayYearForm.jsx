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
import { useCreateHolidayYear } from "@/hooks/useAttendance";
import { formatDateForAPI } from "@/utils/time";

export const HolidayYearForm = ({ open, onOpenChange }) => {
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const createYear = useCreateHolidayYear();

  useEffect(() => {
    if (open) {
      const now = new Date();
      const nextYear = now.getFullYear() + 1;
      setYearName(`${now.getFullYear()}-${nextYear}`);
      setStartDate(formatDateForAPI(new Date(now.getFullYear(), 3, 1))); // 1 April
      setEndDate(formatDateForAPI(new Date(nextYear, 2, 31))); // 31 March
      setIsActive(true);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yearName.trim() || !startDate || !endDate) return;
    if (endDate <= startDate) return;
    try {
      await createYear.mutateAsync({
        year_name: yearName.trim(),
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Create holiday year failed:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add holiday year</DialogTitle>
          <DialogDescription>Define the holiday year period (e.g. 1 April to 31 March)</DialogDescription>
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
            <Button type="submit" disabled={!yearName.trim() || !startDate || !endDate || endDate <= startDate || createYear.isPending}>
              {createYear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

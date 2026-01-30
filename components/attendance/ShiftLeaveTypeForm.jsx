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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useCreateShiftLeaveType,
  useUpdateShiftLeaveType,
  useShiftLeaveType,
} from "@/hooks/useAttendance";

export const ShiftLeaveTypeForm = ({ open, onOpenChange, typeSlug = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "authorised_leave",
    is_paid: false,
    requires_approval: true,
    deducts_from_holiday_allowance: false,
    display_color: "#3b82f6",
    is_active: true,
  });

  const { data: existingType } = useShiftLeaveType(typeSlug || "", { enabled: !!typeSlug && open });
  const createType = useCreateShiftLeaveType();
  const updateType = useUpdateShiftLeaveType();

  useEffect(() => {
    if (existingType) {
      setFormData({
        name: existingType.name || "",
        category: existingType.category || "authorised_leave",
        is_paid: existingType.is_paid || false,
        requires_approval: existingType.requires_approval !== false,
        deducts_from_holiday_allowance: existingType.deducts_from_holiday_allowance || false,
        display_color: existingType.display_color || "#3b82f6",
        is_active: existingType.is_active !== false,
      });
    } else if (!typeSlug) {
      // Reset form for new type
      setFormData({
        name: "",
        category: "authorised_leave",
        is_paid: false,
        requires_approval: true,
        deducts_from_holiday_allowance: false,
        display_color: "#3b82f6",
        is_active: true,
      });
    }
  }, [existingType, typeSlug, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      if (typeSlug) {
        await updateType.mutateAsync({ slug: typeSlug, typeData: formData });
      } else {
        await createType.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save shift/leave type:", error);
    }
  };

  const categories = [
    { value: "attendance", label: "Attendance" },
    { value: "authorised_leave", label: "Authorised Leave" },
    { value: "unauthorised_leave", label: "Unauthorised Leave" },
    { value: "provisional", label: "Provisional" },
    { value: "mapped", label: "Mapped" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{typeSlug ? "Edit Shift/Leave Type" : "Create Shift/Leave Type"}</DialogTitle>
          <DialogDescription>
            {typeSlug
              ? "Update the shift/leave type configuration."
              : "Create a new shift/leave type for your organization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Annual Holiday, Sick Leave"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Display Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.display_color}
                onChange={(e) => setFormData({ ...formData, display_color: e.target.value })}
                className="h-10 w-20"
              />
              <Input
                value={formData.display_color}
                onChange={(e) => setFormData({ ...formData, display_color: e.target.value })}
                placeholder="#3b82f6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_paid">Paid Leave</Label>
                <p className="text-xs text-muted-foreground">Whether this leave type is paid</p>
              </div>
              <Switch
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requires_approval">Requires Approval</Label>
                <p className="text-xs text-muted-foreground">Whether this leave type requires manager approval</p>
              </div>
              <Switch
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
              />
            </div>

            {formData.category === "authorised_leave" && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="deducts_from_holiday_allowance">Deducts from Holiday Allowance</Label>
                  <p className="text-xs text-muted-foreground">
                    Whether this leave type deducts from annual holiday allowance
                  </p>
                </div>
                <Switch
                  id="deducts_from_holiday_allowance"
                  checked={formData.deducts_from_holiday_allowance}
                  onCheckedChange={(checked) => setFormData({ ...formData, deducts_from_holiday_allowance: checked })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-muted-foreground">Whether this type is currently active</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || createType.isPending || updateType.isPending}>
              {(createType.isPending || updateType.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {typeSlug ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
import { Loader2 } from "lucide-react";
import { useCreateMappedShiftTemplate, useUpdateMappedShiftTemplate } from "@/hooks/useShiftRecords";

const DEFAULT_TEMPLATE_DATA = [
  {
    day_of_week: "monday",
    job_role_id: 1,
    shift_role_id: 1,
    start_time: "09:00",
    end_time: "17:00",
    hours: 7.5,
    quantity: 1,
    department_id: 1,
  },
];

export const MappedShiftTemplateForm = ({ open, onOpenChange, template = null }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateDataRaw, setTemplateDataRaw] = useState(JSON.stringify(DEFAULT_TEMPLATE_DATA, null, 2));
  const [isActive, setIsActive] = useState(true);
  const [parseError, setParseError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTemplate = useCreateMappedShiftTemplate();
  const updateTemplate = useUpdateMappedShiftTemplate();

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setDescription(template.description || "");
      setTemplateDataRaw(
        typeof template.template_data === "object"
          ? JSON.stringify(template.template_data, null, 2)
          : String(template.template_data || "[]")
      );
      setIsActive(template.is_active !== false);
    } else {
      setName("");
      setDescription("");
      setTemplateDataRaw(JSON.stringify(DEFAULT_TEMPLATE_DATA, null, 2));
      setIsActive(true);
    }
    setParseError("");
  }, [template, open]);

  const handleTemplateDataChange = (value) => {
    setTemplateDataRaw(value);
    if (parseError) setParseError("");
  };

  const parseTemplateData = () => {
    setParseError("");
    try {
      const parsed = JSON.parse(templateDataRaw);
      if (!Array.isArray(parsed)) {
        setParseError("Template data must be a JSON array of shift definitions");
        return null;
      }
      return parsed;
    } catch (e) {
      setParseError(e.message || "Invalid JSON");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const templateData = parseTemplateData();
    if (!name.trim() || templateData === null) return;

    setIsSubmitting(true);
    try {
      if (template) {
        await updateTemplate.mutateAsync({
          slug: template.slug,
          templateData: {
            name: name.trim(),
            description: description.trim() || null,
            template_data: templateData,
            is_active: isActive,
          },
        });
      } else {
        await createTemplate.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
          template_data: templateData,
          is_active: isActive,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Mapped shift template save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Mapped Shift Template" : "Add Mapped Shift Template"}</DialogTitle>
          <DialogDescription>
            Define a reusable shift pattern (e.g. by day of week, role, hours). Template data is JSON: an array of
            shift definitions with day_of_week, job_role_id, shift_role_id, start_time, end_time, hours, quantity,
            department_id.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. January 2026 - Ward A"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>
          <div className="space-y-2">
            <Label>Template data (JSON)</Label>
            <Textarea
              value={templateDataRaw}
              onChange={(e) => handleTemplateDataChange(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder='[{"day_of_week":"monday","job_role_id":1,...}]'
            />
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mapped-template-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="mapped-template-active">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !!parseError || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {template ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

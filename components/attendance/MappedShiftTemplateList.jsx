"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Play } from "lucide-react";
import { useMappedShiftTemplates, useDeleteMappedShiftTemplate, useGenerateShiftsFromTemplate } from "@/hooks/useShiftRecords";
import { MappedShiftTemplateForm } from "./MappedShiftTemplateForm";
import { formatDateForAPI } from "@/utils/time";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const MappedShiftTemplateList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [generateTemplate, setGenerateTemplate] = useState(null);
  const [generateStartDate, setGenerateStartDate] = useState("");
  const [generateEndDate, setGenerateEndDate] = useState("");

  const { data, isLoading, error } = useMappedShiftTemplates({ per_page: 100 });
  const deleteTemplate = useDeleteMappedShiftTemplate();
  const generateShifts = useGenerateShiftsFromTemplate();

  const templates = data?.templates || data || [];

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleFormClose = (open) => {
    if (!open) setSelectedTemplate(null);
    setIsFormOpen(open);
  };

  const handleDeleteConfirm = async () => {
    if (deleteSlug) {
      try {
        await deleteTemplate.mutateAsync(deleteSlug);
        setDeleteSlug(null);
      } catch (err) {
        console.error("Delete template failed:", err);
      }
    }
  };

  const handleGenerateOpen = (template) => {
    setGenerateTemplate(template);
    const today = new Date();
    setGenerateStartDate(formatDateForAPI(today));
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);
    setGenerateEndDate(formatDateForAPI(end));
  };

  const handleGenerateSubmit = async () => {
    if (!generateTemplate?.slug || !generateStartDate || !generateEndDate) return;
    if (generateEndDate < generateStartDate) return;
    try {
      await generateShifts.mutateAsync({
        slug: generateTemplate.slug,
        generateData: {
          start_date: generateStartDate,
          end_date: generateEndDate,
        },
      });
      setGenerateTemplate(null);
    } catch (err) {
      console.error("Generate shifts failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load mapped shift templates. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Mapped Shift Templates</h2>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No mapped shift templates. Create one to generate shift records from a pattern.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[220px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id || template.slug}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {template.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.is_active !== false ? "default" : "secondary"}>
                      {template.is_active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleGenerateOpen(template)}
                        aria-label="Generate shifts"
                        title="Generate shifts from this template"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteSlug(template.slug)}
                        aria-label="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MappedShiftTemplateForm open={isFormOpen} onOpenChange={handleFormClose} template={selectedTemplate} />

      {/* Generate shifts dialog */}
      <Dialog open={!!generateTemplate} onOpenChange={(open) => !open && setGenerateTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate shifts from template</DialogTitle>
            <DialogDescription>
              Choose a date range. Shift records will be created from the template pattern for each day in the range.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={generateStartDate}
                onChange={(e) => setGenerateStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input type="date" value={generateEndDate} onChange={(e) => setGenerateEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateTemplate(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateSubmit}
              disabled={
                !generateStartDate ||
                !generateEndDate ||
                generateEndDate < generateStartDate ||
                generateShifts.isPending
              }
            >
              {generateShifts.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSlug} onOpenChange={(open) => !open && setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the mapped shift template. Existing shift
              records created from it will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

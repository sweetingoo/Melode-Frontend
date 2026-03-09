"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableFieldSelect } from "@/components/ui/searchable-field-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Info, 
  Edit2,
  Type,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  List,
  Upload,
  FileText,
  Image,
  Minus,
  FileDown,
  PenTool,
  Hash,
  AlignLeft,
  Play,
  Tag,
  X
} from "lucide-react";
import CategoryTypeSelector from "@/components/CategoryTypeSelector";
import { useActiveCategoryTypes, useCreateCategoryType } from "@/hooks/useCategoryTypes";

// Predefined file type categories for easy selection
const FILE_TYPE_CATEGORIES = {
  images: {
    label: "Images",
    types: [
      { value: "image/jpeg", label: "JPEG (.jpg, .jpeg)" },
      { value: "image/png", label: "PNG (.png)" },
      { value: "image/gif", label: "GIF (.gif)" },
      { value: "image/webp", label: "WebP (.webp)" },
      { value: "image/svg+xml", label: "SVG (.svg)" },
    ],
  },
  documents: {
    label: "Documents",
    types: [
      { value: "application/pdf", label: "PDF (.pdf)" },
      { value: "application/msword", label: "Word (.doc)" },
      { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word (.docx)" },
      { value: "application/vnd.ms-excel", label: "Excel (.xls)" },
      { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel (.xlsx)" },
      { value: "text/plain", label: "Text (.txt)" },
      { value: "application/rtf", label: "RTF (.rtf)" },
    ],
  },
  archives: {
    label: "Archives",
    types: [
      { value: "application/zip", label: "ZIP (.zip)" },
      { value: "application/x-rar-compressed", label: "RAR (.rar)" },
      { value: "application/x-tar", label: "TAR (.tar)" },
      { value: "application/gzip", label: "GZIP (.gz)" },
    ],
  },
  videos: {
    label: "Videos",
    types: [
      { value: "video/mp4", label: "MP4 (.mp4)" },
      { value: "video/quicktime", label: "QuickTime (.mov)" },
      { value: "video/x-msvideo", label: "AVI (.avi)" },
      { value: "video/webm", label: "WebM (.webm)" },
    ],
  },
  audio: {
    label: "Audio",
    types: [
      { value: "audio/mpeg", label: "MP3 (.mp3)" },
      { value: "audio/wav", label: "WAV (.wav)" },
      { value: "audio/ogg", label: "OGG (.ogg)" },
      { value: "audio/mp4", label: "M4A (.m4a)" },
    ],
  },
};
import { useForm, useUpdateForm } from "@/hooks/useForms";
import { generateSlug } from "@/utils/slug";
import { useRoles, useRolesAll, useCreateRole } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { useActiveFormTypes } from "@/hooks/useFormTypes";
import { useUploadFile } from "@/hooks/useProfile";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield } from "lucide-react";
import UserMentionSelector from "@/components/UserMentionSelector";

// Helper function to generate field ID from label
const generateFieldIdFromLabel = (label) => {
  if (!label) return '';
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
};

// Ensure field_id is unique among existing form fields (avoids duplicate React keys)
const ensureUniqueFieldId = (baseId, existingIds) => {
  if (!baseId) return baseId;
  const set = new Set((existingIds || []).filter(Boolean).map(String));
  if (!set.has(String(baseId))) return baseId;
  const suffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  return `${baseId}_${suffix}`;
};

// Helper function to generate random field ID for display-only fields
const generateDisplayFieldId = (fieldType) => {
  const prefix = fieldType === 'text_block' ? 'txt' : 
                 fieldType === 'image_block' ? 'img' : 
                 fieldType === 'line_break' ? 'line' : 
                 fieldType === 'page_break' ? 'page' : 
                 fieldType === 'download_link' ? 'download' : 'display';
  const random = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`;
};

// Sort options by value (for select, radio, multiselect) so they display in a consistent order
const sortOptionsByValue = (options) => {
  if (!Array.isArray(options) || options.length === 0) return options;
  return [...options].sort((a, b) => {
    const valA = typeof a === 'object' && a !== null ? String(a?.value ?? '') : String(a ?? '');
    const valB = typeof b === 'object' && b !== null ? String(b?.value ?? '') : String(b ?? '');
    return valA.localeCompare(valB, undefined, { sensitivity: 'base' });
  });
};

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & Time" },
  { value: "boolean", label: "Boolean/Checkbox" },
  { value: "select", label: "Select (Single)" },
  { value: "radio", label: "Radio (Single choice)" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "repeatable_group", label: "Repeatable group (Add more rows)" },
  { value: "people", label: "People (User Selection)" },
  { value: "file", label: "File Upload" },
  { value: "json", label: "JSON" },
  { value: "signature", label: "Signature" },
  // Display-only field types
  { value: "text_block", label: "Text Block (Display Only)" },
  { value: "image_block", label: "Image Block (Display Only)" },
  { value: "youtube_video_embed", label: "YouTube Video Embed (Display Only)" },
  { value: "line_break", label: "Line Break (Display Only)" },
  { value: "page_break", label: "Page Break (Display Only)" },
  { value: "download_link", label: "Download Link (Display Only)" },
];

// Form types are now loaded dynamically from API

const FORM_COLUMNS = ["left", "center", "right"];
function FormGridColumnsEditor({ formData, setFormData, secIdx, gIdx, section, group }) {
  const grid = group.grid_columns || { left: [], center: [], right: [] };
  const left = grid.left || [];
  const center = grid.center || [];
  const right = grid.right || [];
  const allIds = [...left, ...center, ...right];
  const sectionFieldIds = section.fields || [];
  const fieldsList = formData?.form_fields?.fields || [];
  const sectionFields = fieldsList.filter((f) => sectionFieldIds.includes(String(f.field_id || f.id || f.name)));

  const updateGroup = (updated) => {
    const next = [...(formData.form_fields.sections || [])];
    const gs = [...(next[secIdx].groups || [])];
    gs[gIdx] = updated;
    next[secIdx] = { ...next[secIdx], groups: gs };
    setFormData({ ...formData, form_fields: { ...formData.form_fields, sections: next } });
  };

  React.useEffect(() => {
    if ((group.layout || "") !== "grid" || allIds.length > 0) return;
    const fromFields = group.fields || [];
    if (fromFields.length === 0) return;
    updateGroup({ ...group, grid_columns: { left: [...fromFields], center: [], right: [] } });
  }, []);

  const updateColumns = (newGrid) => {
    updateGroup({ ...group, grid_columns: newGrid, fields: [...(newGrid.left || []), ...(newGrid.center || []), ...(newGrid.right || [])] });
  };

  const moveField = (fieldId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    const leftArr = [...(grid.left || [])];
    const centerArr = [...(grid.center || [])];
    const rightArr = [...(grid.right || [])];
    [leftArr, centerArr, rightArr].forEach((arr, i) => {
      if (FORM_COLUMNS[i] === fromCol) {
        const idx = arr.indexOf(fieldId);
        if (idx !== -1) arr.splice(idx, 1);
      }
    });
    const addTo = (arr) => { if (!arr.includes(fieldId)) arr.push(fieldId); };
    if (toCol === "left") addTo(leftArr);
    else if (toCol === "center") addTo(centerArr);
    else addTo(rightArr);
    updateColumns({ left: leftArr, center: centerArr, right: rightArr });
  };

  const removeFromColumn = (fieldId, col) => {
    const nextGrid = { ...grid };
    nextGrid[col] = (nextGrid[col] || []).filter((id) => id !== fieldId);
    updateColumns(nextGrid);
  };

  const addToColumn = (fieldId, col) => {
    const nextGrid = { ...grid };
    nextGrid[col] = [...(nextGrid[col] || []), fieldId];
    updateColumns(nextGrid);
  };

  const onDragStart = (e, fieldId, col) => {
    e.dataTransfer.setData("fieldId", fieldId);
    e.dataTransfer.setData("fromColumn", col);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e, toCol) => {
    e.preventDefault();
    const fieldId = e.dataTransfer.getData("fieldId");
    const fromCol = e.dataTransfer.getData("fromColumn");
    if (fieldId && fromCol) moveField(fieldId, fromCol, toCol);
  };

  const availableToAdd = sectionFieldIds.filter((id) => !allIds.includes(id));
  const columnLabels = { left: "Left", center: "Center (full width)", right: "Right" };

  return (
    <div className="grid grid-cols-3 gap-3 mt-2 p-2 border rounded-md bg-muted/30">
      {FORM_COLUMNS.map((col) => (
        <div key={col} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)} className="min-h-[80px] rounded border border-dashed border-muted-foreground/40 p-2 flex flex-col">
          <div className="text-xs font-medium text-muted-foreground mb-1">{columnLabels[col]}</div>
          <div className="flex flex-wrap gap-1 flex-1">
            {(grid[col] || []).map((fid) => {
              const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
              return (
                <Badge key={fid} variant="outline" className="text-xs cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => onDragStart(e, fid, col)}>
                  {f?.label || fid}
                  <button type="button" className="ml-1" onClick={() => removeFromColumn(fid, col)}><X className="h-3 w-3" /></button>
                </Badge>
              );
            })}
          </div>
          {availableToAdd.length > 0 && (
            <Select value="__add__" onValueChange={(v) => { if (v && v !== "__add__") addToColumn(v, col); }}>
              <SelectTrigger className="h-7 text-xs mt-1"><SelectValue placeholder="+ Add" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__add__">+ Add field</SelectItem>
                {availableToAdd.map((fid) => {
                  const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
                  return <SelectItem key={fid} value={fid}>{f?.label || fid}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}

const FORM_GRID_COLS = ["left", "center", "right"];
const formGridColumnLabels = { left: "Left", center: "Center (full width)", right: "Right" };

function GridCellTableEditor({ tableCols, tableRows, fieldsList, allIdsInAnyGroup, onUpdate, onRowVisibilityChange }) {
  const cols = tableCols?.length > 0 ? tableCols : [{ id: "col_1", label: "Column 1" }];
  const rows = Array.isArray(tableRows) ? tableRows : [];
  const [rowVisOverride, setRowVisOverride] = useState({});
  const setRowVisibility = (rIdx, cv) => {
    setRowVisOverride((prev) => ({ ...prev, [rIdx]: cv || undefined }));
    onRowVisibilityChange?.(rIdx, cv);
    const nextRows = rows.map((r, i) => i !== rIdx ? r : { ...r, conditional_visibility: cv || undefined });
    onUpdate(cols, nextRows);
  };
  useEffect(() => {
    setRowVisOverride((prev) => {
      let changed = false;
      const next = { ...prev };
      rows.forEach((row, rIdx) => {
        const cv = row.conditional_visibility;
        const ov = prev[rIdx];
        if (ov && cv && ov.depends_on_field === cv.depends_on_field) {
          delete next[rIdx];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [rows]);
  const addColumn = () => {
    const newId = "col_" + Date.now();
    const nextCols = [...cols, { id: newId, label: "New column" }];
    const nextRows = rows.length > 0 ? rows.map((r) => ({ ...r, cells: [...(r.cells || []), { text: "", field_id: null }] })) : [{ cells: nextCols.map(() => ({ text: "", field_id: null })) }];
    onUpdate(nextCols, nextRows);
  };
  const removeColumn = (cIdx) => {
    const nextCols = cols.filter((_, i) => i !== cIdx);
    const nextRows = rows.map((r) => ({ ...r, cells: (r.cells || []).filter((_, i) => i !== cIdx) }));
    onUpdate(nextCols.length > 0 ? nextCols : [{ id: "col_1", label: "Column 1" }], nextRows);
  };
  const addRow = () => onUpdate(cols, [...rows, { cells: cols.map(() => ({ text: "", field_id: null })) }]);
  const removeRow = (rIdx) => onUpdate(cols, rows.filter((_, i) => i !== rIdx));
  const setCell = (rIdx, cIdx, key, value) => {
    const nextRows = rows.map((r, i) => {
      if (i !== rIdx) return r;
      const cells = [...(r.cells || [])];
      while (cells.length <= cIdx) cells.push({ text: "", field_id: null });
      cells[cIdx] = { ...cells[cIdx], [key]: value };
      return { ...r, cells };
    });
    onUpdate(cols, nextRows);
  };
  const setColLabel = (cIdx, label) => onUpdate(cols.map((c, i) => (i !== cIdx ? c : { ...c, label })), rows);
  const visibilityFields = (fieldsList || []).filter((x) => !["text_block", "image_block", "line_break", "page_break", "download_link"].includes((x.field_type || x.type || "").toLowerCase()));
  const availableFieldIds = (fieldsList || []).map((f) => String(f.field_id || f.id || f.name)).filter((id) => !allIdsInAnyGroup.includes(id));
  const usedInThisTable = rows.flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean));
  const availableForSelect = (fieldsList || []).filter((f) => {
    const id = String(f.field_id || f.id || f.name);
    return availableFieldIds.includes(id) || usedInThisTable.includes(id);
  });
  return (
    <div className="space-y-1 mt-1 min-w-0">
      <div className="overflow-x-auto overflow-y-auto border rounded max-h-[220px] min-w-[420px]">
        <table className="w-full min-w-[400px] border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/50 sticky top-0">
              {cols.map((col, cIdx) => (
                <th key={col.id} className="border-r p-0.5 last:border-r-0 min-w-[100px]">
                  <div className="flex items-center gap-0.5">
                    <Input className="h-6 text-xs flex-1 min-w-[80px]" value={col.label ?? ""} onChange={(e) => setColLabel(cIdx, e.target.value)} placeholder="Header" />
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-destructive" onClick={() => removeColumn(cIdx)}><Trash2 className="h-2.5 w-2.5" /></Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const cells = (row.cells || []).slice(0, cols.length);
              while (cells.length < cols.length) cells.push({ text: "", field_id: null });
              const cvFromRow = row.conditional_visibility;
              const cv = rowVisOverride[rIdx] ?? cvFromRow;
              return (
                <React.Fragment key={rIdx}>
                <tr className="border-b">
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} className="border-r p-0.5 last:border-r-0 align-top min-w-[100px]">
                      <div className="space-y-0.5 min-w-[90px]">
                        <Input className="h-6 text-xs w-full" placeholder="Text" value={cell.text ?? ""} onChange={(e) => setCell(rIdx, cIdx, "text", e.target.value)} />
                        <Select value={cell.field_id ?? "__none__"} onValueChange={(v) => setCell(rIdx, cIdx, "field_id", v === "__none__" || !v ? null : v)}>
                          <SelectTrigger className="h-6 text-xs w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {availableForSelect.map((f) => (
                              <SelectItem key={f.field_id || f.id || f.name} value={String(f.field_id || f.id || f.name)}>{f.label || f.field_id || f.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  ))}
                  <td className="w-6 p-0.5">
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeRow(rIdx)}><Trash2 className="h-2.5 w-2.5" /></Button>
                  </td>
                </tr>
                <tr className="border-b bg-muted/30">
                  <td colSpan={cols.length + 1} className="p-1.5 text-xs align-middle">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-muted-foreground shrink-0">Show row when:</span>
                      <SearchableFieldSelect
                        fields={visibilityFields}
                        value={cv?.depends_on_field ?? "__none__"}
                        onValueChange={(v) => setRowVisibility(rIdx, v && v !== "__none__" ? { ...(cv || {}), depends_on_field: v } : null)}
                        placeholder="Always show"
                        noneOption
                        noneLabel="Always show"
                        compact
                        className="h-7 text-xs w-40 inline-flex"
                      />
                    {cv?.depends_on_field && (
                      <>
                        <Select value={cv.show_when || ""} onValueChange={(v) => setRowVisibility(rIdx, { ...cv, show_when: v })}>
                          <SelectTrigger className="h-7 text-xs w-24 inline-flex"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="is_empty">Is empty</SelectItem>
                            <SelectItem value="is_not_empty">Not empty</SelectItem>
                          </SelectContent>
                        </Select>
                        {["equals", "not_equals", "contains"].includes(cv.show_when) && (
                          <Input placeholder="Value" className="h-7 text-xs w-24" value={cv.value ?? ""} onChange={(e) => setRowVisibility(rIdx, { ...cv, value: e.target.value })} />
                        )}
                      </>
                    )}
                    </div>
                  </td>
                </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-1">
        <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={addColumn}><Plus className="h-2.5 w-2.5 mr-0.5" /> Col</Button>
        <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={addRow}><Plus className="h-2.5 w-2.5 mr-0.5" /> Row</Button>
      </div>
    </div>
  );
}

function GridCellTabsEditor({ tabs, fieldsList, allIdsInAnyGroup, onUpdate }) {
  const tabList = Array.isArray(tabs) ? tabs : [];
  const setTab = (tIdx, updater) => onUpdate(tabList.map((t, i) => (i !== tIdx ? t : (typeof updater === "function" ? updater(t) : updater))));
  const addTab = () => onUpdate([...tabList, { id: `tab_${Date.now()}`, label: `Tab ${tabList.length + 1}`, fields: [] }]);
  const removeTab = (tIdx) => onUpdate(tabList.filter((_, i) => i !== tIdx));
  const tabFieldIds = tabList.flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || []));
  const availableToAdd = (fieldsList || []).map((f) => String(f.field_id || f.id || f.name)).filter((id) => !allIdsInAnyGroup.includes(id) || tabFieldIds.includes(id));
  return (
    <div className="space-y-1.5 mt-1 min-w-[320px] overflow-x-auto">
      {tabList.map((tab, tIdx) => {
        const isTable = (tab.layout || "fields") === "table";
        const tabCols = isTable && tab.table_columns?.length > 0 ? tab.table_columns : [{ id: "col_1", label: "Column 1" }];
        const tabRows = isTable ? (tab.table_rows || []) : [];
        return (
          <div key={tab.id || tIdx} className="rounded border bg-muted/20 p-1.5 space-y-1">
            <div className="flex items-center gap-1 flex-wrap">
              <Input className="h-6 text-xs w-28 min-w-[5rem] max-w-[8rem] shrink-0" placeholder="Tab label" value={tab.label || ""} onChange={(e) => setTab(tIdx, { ...tab, label: e.target.value })} />
              <Select value={isTable ? "table" : "fields"} onValueChange={(v) => setTab(tIdx, v === "table" ? { ...tab, layout: "table", table_columns: tabCols, table_rows: tabRows.length > 0 ? tabRows : [{ cells: tabCols.map(() => ({ text: "", field_id: null })) }] } : { ...tab, layout: "fields", table_columns: undefined, table_rows: undefined })}>
                <SelectTrigger className="h-6 text-xs w-24"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fields">Fields</SelectItem><SelectItem value="table">Table</SelectItem></SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeTab(tIdx)}><Trash2 className="h-2.5 w-2.5" /></Button>
            </div>
            {isTable ? (
              <GridCellTableEditor tableCols={tabCols} tableRows={tabRows} fieldsList={fieldsList} allIdsInAnyGroup={allIdsInAnyGroup} onUpdate={(table_columns, table_rows) => setTab(tIdx, { ...tab, table_columns, table_rows })} />
            ) : (
              <div className="flex flex-wrap gap-0.5">
                {(tab.fields || []).map((fid) => {
                  const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
                  return (
                    <Badge key={fid} variant="outline" className="text-xs py-0">
                      {f?.label || fid}
                      <button type="button" className="ml-0.5" onClick={() => setTab(tIdx, { ...tab, fields: (tab.fields || []).filter((id) => id !== fid) })}><X className="h-2.5 w-2.5" /></button>
                    </Badge>
                  );
                })}
                <Select value="__add__" onValueChange={(v) => { if (v && v !== "__add__") setTab(tIdx, { ...tab, fields: [...(tab.fields || []), v] }); }}>
                  <SelectTrigger className="h-5 text-xs w-[110px]"><SelectValue placeholder="+ Field" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__add__">+ Field</SelectItem>
                    {availableToAdd.map((fid) => {
                      const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
                      return <SelectItem key={fid} value={fid}>{f?.label || fid}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" className="h-6 text-xs w-full" onClick={addTab}><Plus className="h-2.5 w-2.5 mr-0.5" /> Add tab</Button>
    </div>
  );
}

function isGridSlotTable(slot) {
  return slot && typeof slot === "object" && (slot.layout || "") === "table" && Array.isArray(slot.table_rows);
}
function isGridSlotTabs(slot) {
  return slot && typeof slot === "object" && (slot.layout || "") === "tabs" && Array.isArray(slot.tabs);
}
function getGridSlotFieldIds(slot) {
  if (Array.isArray(slot)) return slot;
  if (isGridSlotTable(slot)) return (slot.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean));
  if (isGridSlotTabs(slot)) return (slot.tabs || []).flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || []));
  return [];
}
function flatMapGridRowsFieldIds(gridRows) {
  return (gridRows || []).flatMap((r) => FORM_GRID_COLS.flatMap((col) => getGridSlotFieldIds(r[col])));
}

function FormOneRowEditor({ row, rowIndex, fieldsList, allIdsInAnyGroup, onUpdateRow, onRemoveRow, canRemoveRow, onRowVisibilityChange }) {
  const [focusedCol, setFocusedCol] = useState(null);
  const [rowVisOverride, setRowVisOverride] = useState(null);
  const grid = row || { left: [], center: [], right: [] };
  const cvDisplay = rowVisOverride ?? grid.conditional_visibility;
  const setRowVis = (upd) => {
    setRowVisOverride(upd ?? undefined);
    onRowVisibilityChange?.(rowIndex, upd);
    onUpdateRow({ ...grid, conditional_visibility: upd });
  };
  useEffect(() => {
    if (grid.conditional_visibility && rowVisOverride && grid.conditional_visibility.depends_on_field === rowVisOverride.depends_on_field) {
      setRowVisOverride(null);
    }
  }, [grid.conditional_visibility?.depends_on_field]);
  const slotValue = (col) => grid[col];
  const isTableSlot = (col) => isGridSlotTable(slotValue(col));
  const isTabsSlot = (col) => isGridSlotTabs(slotValue(col));
  const hasLeftOrRight = FORM_GRID_COLS.filter((c) => c !== "center").some((c) => (Array.isArray(grid[c]) && (grid[c] || []).length > 0) || isTableSlot(c) || isTabsSlot(c));
  const hasCenter = (Array.isArray(grid.center) && (grid.center || []).length > 0) || isTableSlot("center") || isTabsSlot("center");
  const centerDisabled = hasLeftOrRight;
  const leftRightDisabled = hasCenter;
  const isColDisabled = (col) => (col === "center" && centerDisabled) || (col !== "center" && leftRightDisabled);

  const sectionFieldIds = (fieldsList || []).map((f) => String(f.field_id || f.id || f.name));
  const availableToAdd = sectionFieldIds.filter((id) => !allIdsInAnyGroup.includes(id));

  const gridTemplateCols =
    focusedCol === "left" ? "minmax(480px, 2fr) 1fr 1fr"
    : focusedCol === "center" ? "1fr minmax(480px, 2fr) 1fr"
    : focusedCol === "right" ? "1fr 1fr minmax(480px, 2fr)"
    : hasCenter ? "minmax(72px, 0.2fr) 1fr minmax(72px, 0.2fr)" // center used: narrow left/right, wide center
    : undefined;

  const updateRow = (newGrid) => { onUpdateRow(rowIndex, newGrid); };
  const setSlot = (col, value) => updateRow({ ...grid, [col]: value });

  const moveField = (fieldId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    if (isColDisabled(toCol)) return;
    const left = Array.isArray(grid.left) ? [...grid.left] : [];
    const center = Array.isArray(grid.center) ? [...grid.center] : [];
    const right = Array.isArray(grid.right) ? [...grid.right] : [];
    FORM_GRID_COLS.forEach((col, i) => {
      if (col === fromCol) { const arr = [left, center, right][i]; const idx = arr.indexOf(fieldId); if (idx !== -1) arr.splice(idx, 1); }
    });
    const addTo = (arr) => { if (!arr.includes(fieldId)) arr.push(fieldId); };
    if (toCol === "left") addTo(left); else if (toCol === "center") addTo(center); else addTo(right);
    updateRow({ left, center, right });
  };

  const removeFromColumn = (fieldId, col) => {
    const nextGrid = { ...grid };
    const arr = nextGrid[col];
    nextGrid[col] = Array.isArray(arr) ? arr.filter((id) => id !== fieldId) : [];
    updateRow(nextGrid);
  };

  const addToColumn = (fieldId, col) => {
    if (isColDisabled(col)) return;
    const nextGrid = { ...grid };
    const arr = Array.isArray(nextGrid[col]) ? nextGrid[col] : [];
    nextGrid[col] = [...arr, fieldId];
    updateRow(nextGrid);
  };

  const onDragStart = (e, fieldId, col) => {
    e.dataTransfer.setData("fieldId", fieldId);
    e.dataTransfer.setData("fromColumn", col);
    e.dataTransfer.setData("fromRowIndex", String(rowIndex));
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e, col) => {
    e.preventDefault();
    if (isColDisabled(col)) e.dataTransfer.dropEffect = "none";
    else e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e, toCol) => {
    e.preventDefault();
    if (isColDisabled(toCol)) return;
    const fieldId = e.dataTransfer.getData("fieldId");
    const fromCol = e.dataTransfer.getData("fromColumn");
    if (fieldId && fromCol && e.dataTransfer.getData("fromRowIndex") === String(rowIndex) && Array.isArray(grid[fromCol])) moveField(fieldId, fromCol, toCol);
  };

  return (
    <div className="relative p-3 rounded border border-border bg-muted/20 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Row {rowIndex + 1}</span>
        {canRemoveRow && (
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => onRemoveRow(rowIndex)}>
            <Trash2 className="h-3 w-3 mr-1" /> Remove row
          </Button>
        )}
      </div>
      <div
        className="grid grid-cols-3 gap-3 overflow-x-auto"
        style={gridTemplateCols ? { gridTemplateColumns: gridTemplateCols } : undefined}
      >
        {FORM_GRID_COLS.map((col) => {
          const disabled = isColDisabled(col);
          const slot = slotValue(col);
          const isTable = isTableSlot(col);
          const isTabs = isTabsSlot(col);
          const tableCols = isTable && slot.table_columns?.length > 0 ? slot.table_columns : [{ id: "col_1", label: "Column 1" }];
          const tableRows = isTable ? (slot.table_rows || []) : [];
          const slotContentType = isTable ? "table" : isTabs ? "tabs" : "fields";
          const isTableOrTabs = isTable || isTabs;
          return (
            <div
              key={col}
              onFocus={isTableOrTabs ? () => setFocusedCol(col) : undefined}
              onBlur={isTableOrTabs ? (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusedCol(null); } : undefined}
              onDragOver={!isTable && !isTabs ? (e) => onDragOver(e, col) : undefined}
              onDrop={!isTable && !isTabs ? (e) => onDrop(e, col) : undefined}
              className={`min-h-[72px] rounded border border-dashed p-2 flex flex-col min-w-0 ${isTableOrTabs ? "overflow-x-auto" : ""} ${disabled ? "border-muted-foreground/20 bg-muted/10 opacity-80" : "border-muted-foreground/40"} ${focusedCol === col ? "ring-2 ring-primary/50" : ""}`}
            >
              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1 flex-wrap">
                {formGridColumnLabels[col]}
                {!disabled && (
                  <Select value={slotContentType} onValueChange={(v) => {
                    if (v === "table") setSlot(col, { layout: "table", table_columns: tableCols, table_rows: tableRows.length > 0 ? tableRows : [{ cells: tableCols.map(() => ({ text: "", field_id: null })) }] });
                    else if (v === "tabs") setSlot(col, { layout: "tabs", tabs: [{ id: `tab_${Date.now()}`, label: "Tab 1", fields: [] }] });
                    else setSlot(col, []);
                  }}>
                    <SelectTrigger className="h-6 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fields">Fields</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="tabs">Tabs</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {disabled && <span className="block text-muted-foreground/70 font-normal">({col === "center" ? "use left/right" : "use center"} in this row)</span>}
              </div>
              {isTable ? (
                <GridCellTableEditor
                  tableCols={tableCols}
                  tableRows={tableRows}
                  fieldsList={fieldsList}
                  allIdsInAnyGroup={allIdsInAnyGroup}
                  onUpdate={(table_columns, table_rows) => setSlot(col, { ...slot, table_columns, table_rows })}
                />
              ) : isTabs ? (
                <GridCellTabsEditor tabs={slot.tabs || []} fieldsList={fieldsList} allIdsInAnyGroup={allIdsInAnyGroup} onUpdate={(tabs) => setSlot(col, { ...slot, tabs })} />
              ) : (
                <>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {(Array.isArray(slot) ? slot : []).map((fid) => {
                      const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
                      return (
                        <Badge key={fid} variant="outline" className="text-xs cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => onDragStart(e, fid, col)}>
                          {f?.label || fid}
                          <button type="button" className="ml-1" onClick={() => removeFromColumn(fid, col)}><X className="h-3 w-3" /></button>
                        </Badge>
                      );
                    })}
                  </div>
                  {!disabled && availableToAdd.length > 0 && (
                    <Select value="__add__" onValueChange={(v) => { if (v && v !== "__add__") addToColumn(v, col); }}>
                      <SelectTrigger className="h-7 text-xs mt-1"><SelectValue placeholder="+ Add field" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__add__">+ Add field</SelectItem>
                        {availableToAdd.map((fid) => {
                          const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
                          return <SelectItem key={fid} value={fid}>{f?.label || fid}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid row visibility: show this row when a field has a value */}
      <div className="pt-2 mt-2 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground shrink-0">Show row when:</Label>
          <SearchableFieldSelect
            fields={fieldsList || []}
            value={cvDisplay?.depends_on_field ?? "__none__"}
            onValueChange={(v) => setRowVis(v && v !== "__none__" ? { ...(cvDisplay || {}), depends_on_field: v } : undefined)}
            placeholder="Always show"
            noneOption
            noneLabel="Always show"
            excludeTypes={["text_block", "image_block", "line_break", "page_break", "download_link"]}
            compact
            className="h-7 text-xs w-40"
          />
          {cvDisplay?.depends_on_field && (() => {
            const depField = (fieldsList || []).find((f) => (f.field_id || f.id || f.name) === cvDisplay?.depends_on_field);
            const depType = (depField?.field_type || depField?.type || "").toLowerCase();
            const needsValue = ["equals", "not_equals", "contains"].includes(cvDisplay?.show_when || "");
            const isBoolean = depType === "boolean" || depType === "checkbox";
            const isSelectLike = ["select", "dropdown", "radio", "radio_group"].includes(depType);
            const isMultiselect = depType === "multiselect";
            const isNumber = depType === "number" || depType === "integer";
            const depOptions = depField ? (depField.field_options?.options || depField.options || []) : [];
            const opts = Array.isArray(depOptions) ? depOptions : [];
            const cv = cvDisplay;
            const setCv = setRowVis;
            return (
              <>
                <Select value={cv?.show_when || ""} onValueChange={(v) => setCv({ ...cv, show_when: v || null, value: ["equals", "not_equals", "contains"].includes(v) ? (cv?.value ?? null) : null })}>
                  <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="is_empty">Is empty</SelectItem>
                    <SelectItem value="is_not_empty">Not empty</SelectItem>
                  </SelectContent>
                </Select>
                {needsValue && (isBoolean ? (
                  <Select value={cv?.value || ""} onValueChange={(v) => setCv({ ...cv, value: v || null })}>
                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                ) : isSelectLike || isMultiselect ? (
                  <Select value={cv?.value || ""} onValueChange={(v) => setCv({ ...cv, value: v || null })}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {opts.map((opt, i) => {
                        const val = typeof opt === "object" && opt !== null ? (opt.value ?? opt.label ?? "") : opt;
                        const label = typeof opt === "object" && opt !== null ? (opt.label ?? opt.value ?? String(val)) : String(opt);
                        return <SelectItem key={i} value={String(val)}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                ) : isNumber ? (
                  <Input type="number" className="h-7 text-xs w-20" value={cv?.value ?? ""} onChange={(e) => setCv({ ...cv, value: e.target.value || null })} placeholder="Number" />
                ) : (
                  <Input className="h-7 text-xs w-24" value={cv?.value ?? ""} onChange={(e) => setCv({ ...cv, value: e.target.value || null })} placeholder="Value" />
                ))}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// Top-level groups only: grid with multiple rows, updates form_fields.groups
function FormGroupGridColumnsEditor({ formData, setFormData, gIdx, group, pendingGroupUpdatesRef, onRowVisibilityChange }) {
  const fieldsList = formData?.form_fields?.fields || [];
  const gridRows = group.grid_rows && group.grid_rows.length > 0
    ? group.grid_rows
    : (group.grid_columns ? [{ ...group.grid_columns }] : [{ left: [], center: [], right: [] }]);
  const getAllGroupFieldIds = (grp) => {
    if ((grp.layout || "") === "grid" && grp.grid_rows) return flatMapGridRowsFieldIds(grp.grid_rows);
    if (grp.layout === "tabs" && grp.tabs?.length) return (grp.tabs || []).flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || []));
    if ((grp.layout || "") === "table" && grp.table_rows) return (grp.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean));
    return grp.fields || [];
  };
  const allIdsInAnyGroup = (formData?.form_fields?.groups || []).flatMap((g) => getAllGroupFieldIds(g));

  const updateGroup = (updated) => {
    setFormData((prev) => {
      const groups = prev.form_fields?.groups || [];
      const next = [...groups];
      next[gIdx] = updated;
      return { ...prev, form_fields: { ...prev.form_fields, groups: next } };
    });
  };

  const updateRows = (newRows) => {
    if (pendingGroupUpdatesRef?.current) pendingGroupUpdatesRef.current[gIdx] = { grid_rows: newRows };
    const flat = flatMapGridRowsFieldIds(newRows);
    setFormData((prev) => {
      const groups = prev.form_fields?.groups || [];
      const currentGroup = groups[gIdx] || {};
      const next = [...groups];
      next[gIdx] = { ...currentGroup, grid_rows: newRows, fields: flat };
      return { ...prev, form_fields: { ...prev.form_fields, groups: next } };
    });
  };

  const updateRowAt = (rowIndex, newGrid) => {
    updateRows(gridRows.map((r, i) => (i === rowIndex ? newGrid : r)));
  };

  const addRow = () => {
    updateRows([...gridRows, { left: [], center: [], right: [] }]);
  };

  const removeRow = (rowIndex) => {
    updateRows(gridRows.filter((_, i) => i !== rowIndex));
  };

  return (
    <div className="space-y-3 mt-2">
      {gridRows.map((row, rowIndex) => (
        <FormOneRowEditor
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          fieldsList={fieldsList}
          allIdsInAnyGroup={allIdsInAnyGroup}
          onUpdateRow={updateRowAt}
          onRemoveRow={removeRow}
          canRemoveRow={gridRows.length > 1}
          onRowVisibilityChange={onRowVisibilityChange ? (rIdx, cv) => onRowVisibilityChange(gIdx, rIdx, cv) : undefined}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add row
      </Button>
    </div>
  );
}

// Migrate legacy sections to top-level groups (so we only use groups)
function migrateSectionsToGroups(sections) {
  if (!Array.isArray(sections) || sections.length === 0) return [];
  const groups = [];
  sections.forEach((section) => {
    const inGroups = new Set((section.groups || []).flatMap((g) => g.fields || []));
    const ungrouped = (section.fields || []).filter((fid) => !inGroups.has(fid));
    (section.groups || []).forEach((g) => groups.push({ ...g, id: g.id || `g_${Date.now()}_${Math.random().toString(36).slice(2)}` }));
    if (ungrouped.length > 0) {
      groups.push({
        id: section.id || `sec_${section.title || "section"}`,
        label: section.title || section.label || "Section",
        fields: ungrouped,
      });
    }
  });
  return groups;
}

const EditFormPage = () => {
  const params = useParams();
  const router = useRouter();
  const formSlug = params.id || params.slug;

  const { data: form, isLoading: formLoading } = useForm(formSlug);
  const updateFormMutation = useUpdateForm();
  const { data: rolesData } = useRoles();
  const createRoleMutation = useCreateRole();
  const { data: usersResponse } = useUsers();
  const uploadFileMutation = useUploadFile({ silent: true });
  const { data: activeFormTypes = [], isLoading: isLoadingFormTypes } = useActiveFormTypes();
  const roles = rolesData || [];
  const users = usersResponse?.users || usersResponse || [];

  const [formData, setFormData] = useState(null);
  const pendingGroupUpdatesRef = useRef({});
  const rowVisibilityOverridesRef = useRef({});

  useEffect(() => {
    if (form) {
      // Convert categories to integers if they're strings (for backward compatibility)
      const categories = form.form_config?.categories || [];
      const normalizedCategories = categories.map((cat) => 
        typeof cat === 'string' ? parseInt(cat) : cat
      ).filter((cat) => !isNaN(cat) && cat !== null && cat !== undefined);

      const formFields = form.form_fields || { fields: [], sections: [], groups: [] };
      const groups = Array.isArray(formFields.groups) && formFields.groups.length > 0
        ? formFields.groups
        : migrateSectionsToGroups(formFields.sections || []);
      setFormData({
        form_name: form.form_name || "",
        form_title: form.form_title || "",
        form_description: form.form_description || "",
        form_type: form.form_type || "general",
        is_active: form.is_active !== undefined ? form.is_active : true,
        is_template: form.is_template !== undefined ? form.is_template : false,
        slug: form.slug || "",
        form_fields: { ...formFields, groups },
        form_config: {
          ...(form.form_config || {
            layout: "single_column",
            submit_button_text: "Submit",
            success_message: "Form submitted successfully",
            allow_draft: false,
            auto_save: false,
            mandatory_completion: false,
            categories: [],
            statuses: [],
            automation: {
              auto_create_tasks: false,
              create_individual_tasks: false,
              task_assignee_role: "",
              due_time_minutes: 30,
              escalation_enabled: false,
            },
          }),
          categories: normalizedCategories,
        },
        access_config: form.access_config || {
          public_access: false,
          requires_authentication: true,
          allowed_roles: [],
          allowed_users: [],
          view_submissions_roles: [],
          view_submissions_users: [],
        },
      });

      // Set assignment state from form data
      if (form.assigned_to_role_id) {
        setAssignmentMode("role");
        setAssignedToRoleId(form.assigned_to_role_id.toString());
        setSelectedUserIds([]);
      } else if (form.assigned_user_ids && form.assigned_user_ids.length > 0) {
        setAssignmentMode("users");
        setSelectedUserIds(form.assigned_user_ids);
        setAssignedToRoleId("");
      } else {
        setAssignmentMode("none");
        setAssignedToRoleId("");
        setSelectedUserIds([]);
      }

      setCreateIndividualAssignments(form.create_individual_assignments || false);
      
      // Initialize view submissions permissions
      setViewSubmissionsRoleIds(
        form.access_config?.view_submissions_roles || []
      );
      setViewSubmissionsUserIds(
        form.access_config?.view_submissions_users || []
      );
    }
  }, [form]);

  const fieldFormRef = useRef(null);

  const [newField, setNewField] = useState({
    field_id: "",
    field_name: "",
    field_type: "text",
    label: "",
    required: false,
    placeholder: "",
    help_text: "",
    options: [],
    validation: {
      min: "",
      max: "",
      min_length: "",
      max_length: "",
      pattern: "",
    },
    // File field specific
    allowed_types: "",
    max_size_mb: "",
    // JSON field specific
    json_schema: "",
    // Display-only field specific
    content: "", // for text_block
    image_url: "", // for image_block
    image_file: null, // for image_block (uploaded file)
    image_file_id: null, // for image_block (uploaded file ID after upload)
    alt_text: "", // for image_block and youtube_video_embed
    video_url: "", // for youtube_video_embed
    download_url: "", // for download_link
    // Conditional visibility
    conditional_visibility: null, // { depends_on_field, show_when, value }
    // File expiry date support
    file_expiry_date: false, // Enable expiry date for file fields
    // People field specific
    filter_by_roles: [], // Array of role IDs to filter users by
    filter_by_organization: false, // Filter by full organization
    // Repeatable group: child fields (one per column in each row)
    fields: [],
  });
  const [newOption, setNewOption] = useState({ value: "", label: "" });
  const [allowAllFileTypes, setAllowAllFileTypes] = useState(false);

  // Assignment state
  const [assignmentMode, setAssignmentMode] = useState("none"); // "none", "role", "users"
  const [assignedToRoleId, setAssignedToRoleId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [createIndividualAssignments, setCreateIndividualAssignments] = useState(false);
  
  // View submissions permissions state
  const [viewSubmissionsRoleIds, setViewSubmissionsRoleIds] = useState([]);
  const [viewSubmissionsUserIds, setViewSubmissionsUserIds] = useState([]);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  
  // Category input state - now using category type IDs
  const [selectedCategoryTypeId, setSelectedCategoryTypeId] = useState("");
  const [isQuickCreateCategoryTypeOpen, setIsQuickCreateCategoryTypeOpen] = useState(false);
  const [quickCreateCategoryTypeData, setQuickCreateCategoryTypeData] = useState({
    name: "",
    display_name: "",
    description: "",
    icon: "",
    color: "#6B7280",
    sort_order: 0,
  });
  
  // Get category types for display
  const { data: categoryTypesData } = useActiveCategoryTypes();
  const createCategoryTypeMutation = useCreateCategoryType();
  
  // Extract category types from response
  let categoryTypes = [];
  if (categoryTypesData) {
    if (Array.isArray(categoryTypesData)) {
      categoryTypes = categoryTypesData;
    } else if (categoryTypesData.category_types && Array.isArray(categoryTypesData.category_types)) {
      categoryTypes = categoryTypesData.category_types;
    } else if (categoryTypesData.data && Array.isArray(categoryTypesData.data)) {
      categoryTypes = categoryTypesData.data;
    } else if (categoryTypesData.results && Array.isArray(categoryTypesData.results)) {
      categoryTypes = categoryTypesData.results;
    }
  }
  
  // Status input state
  const [newStatusValue, setNewStatusValue] = useState("");
  const [roleFormData, setRoleFormData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    priority: 50,
  });

  const handleUserSelectionChange = (newSelection) => {
    setSelectedUserIds(newSelection);
  };

  const handleCreateRole = async () => {
    if (!roleFormData.displayName || !roleFormData.roleName) {
      return;
    }

    try {
      const result = await createRoleMutation.mutateAsync({
        display_name: roleFormData.displayName,
        name: roleFormData.roleName,
        description: roleFormData.description,
        priority: roleFormData.priority,
      });
      setIsCreateRoleModalOpen(false);
      setRoleFormData({
        displayName: "",
        roleName: "",
        description: "",
        priority: 50,
      });
      // Auto-select the newly created role
      if (result && result.id) {
        setAssignedToRoleId(result.id.toString());
      }
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  const handleAddOption = () => {
    const labelTrimmed = newOption.label.trim();
    const valueTrimmed = newOption.value.trim();
    const optionValue = valueTrimmed || generateFieldIdFromLabel(labelTrimmed);
    const optionLabel = labelTrimmed || valueTrimmed || optionValue;
    if (!optionValue && !optionLabel) {
      toast.error("Option label or value is required");
      return;
    }
    setNewField({
      ...newField,
      options: sortOptionsByValue([
        ...newField.options,
        {
          value: optionValue || optionLabel,
          label: optionLabel || optionValue,
        },
      ]),
    });
    setNewOption({ value: "", label: "" });
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...newField.options];
    newOptions.splice(index, 1);
    setNewField({
      ...newField,
      options: newOptions,
    });
  };

  const handleAddField = () => {
    // Display-only field types that auto-generate field_id
    const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];
    const isDisplayOnly = displayOnlyTypes.includes(newField.field_type);

    // Auto-generate field_id if not provided, and ensure uniqueness
    const existingFieldIds = (formData.form_fields?.fields || []).map((f) => f.field_id || f.id || f.name);
    let fieldId = newField.field_id;
    if (!fieldId) {
      if (isDisplayOnly) {
        // For display-only fields, generate random ID
        fieldId = generateDisplayFieldId(newField.field_type);
      } else if (newField.label) {
        // For regular fields, generate from label
        fieldId = generateFieldIdFromLabel(newField.label);
        if (!fieldId) {
          // Fallback if label doesn't generate valid ID
          fieldId = `field_${Date.now()}`;
        }
      } else {
        // No label provided, require manual field_id
        toast.error("Label is required (Field ID will be auto-generated from label)");
        return;
      }
    }
    fieldId = ensureUniqueFieldId(fieldId, existingFieldIds);

    // For regular fields, require label
    if (!isDisplayOnly && !newField.label) {
      toast.error("Label is required");
      return;
    }

    // For text_block, require content
    if (newField.field_type === 'text_block' && !newField.content) {
      toast.error("Content is required for text block");
      return;
    }

    // For image_block, require image_url (download_url from upload or direct URL)
    if (newField.field_type === 'image_block' && !newField.image_url) {
      toast.error("Either Image URL or uploaded image is required for image block");
      return;
    }

    // For youtube_video_embed, require video_url
    if (newField.field_type === 'youtube_video_embed' && !newField.video_url) {
      toast.error("YouTube video URL is required for YouTube video embed");
      return;
    }

    // For download_link, require download_url
    if (newField.field_type === 'download_link' && !newField.download_url) {
      toast.error("Download URL is required for download link");
      return;
    }

    // For select, radio, and multiselect, require at least one option
    if (
      (newField.field_type === "select" ||
        newField.field_type === "radio" ||
        newField.field_type === "multiselect") &&
      newField.options.length === 0
    ) {
      toast.error(
        `${newField.field_type === "select" ? "Select" : newField.field_type === "multiselect" ? "Multi-select" : "Radio"} fields require at least one option`
      );
      return;
    }

    // Repeatable group: require at least one child field
    if (newField.field_type === "repeatable_group" && (!newField.fields || newField.fields.length === 0)) {
      toast.error("Repeatable group requires at least one child field. Add child fields below.");
      return;
    }

    const field = {
      field_id: fieldId,
      field_name: fieldId, // Auto-generate from field_id
      field_type: newField.field_type,
      label: newField.label || undefined,
      // Display-only fields don't have required property
      ...(isDisplayOnly ? {} : { required: newField.required }),
    };

    // Add display-only field properties
    if (newField.field_type === 'text_block') {
      field.content = newField.content;
    } else if (newField.field_type === 'image_block') {
      // For image_block, use image_url (download_url from upload or direct URL)
      if (newField.image_url) {
        field.image_url = newField.image_url;
      }
      if (newField.alt_text) {
        field.alt_text = newField.alt_text;
      }
    } else if (newField.field_type === 'youtube_video_embed') {
      // For youtube_video_embed, use video_url and alt_text
      if (newField.video_url) {
        field.video_url = newField.video_url;
      }
      if (newField.alt_text) {
        field.alt_text = newField.alt_text;
      }
    } else if (newField.field_type === 'download_link') {
      field.download_url = newField.download_url;
    }

    // Add conditional visibility
    if (newField.conditional_visibility && newField.conditional_visibility.depends_on_field) {
      field.conditional_visibility = newField.conditional_visibility;
    }

    // Add file expiry date support
    if (newField.field_type === 'file' && newField.file_expiry_date) {
      field.file_expiry_date = true;
    }

    // Add placeholder if provided (not for display-only fields)
    if (!isDisplayOnly && newField.placeholder) {
      field.placeholder = newField.placeholder;
    }

    // Add help_text if provided
    if (newField.help_text) {
      field.help_text = newField.help_text;
    }

    // Add validation if any validation rules are provided
    const validation = {};
    if (newField.validation.min) validation.min = newField.validation.min;
    if (newField.validation.max) validation.max = newField.validation.max;
    if (newField.validation.min_length)
      validation.min_length = parseInt(newField.validation.min_length);
    if (newField.validation.max_length)
      validation.max_length = parseInt(newField.validation.max_length);
    if (newField.validation.pattern) validation.pattern = newField.validation.pattern;

    if (Object.keys(validation).length > 0) {
      field.validation = validation;
    }

    // Add options for select, radio, and multiselect fields
    if (
      (newField.field_type === "select" ||
        newField.field_type === "radio" ||
        newField.field_type === "multiselect") &&
      newField.options.length > 0
    ) {
      field.options = sortOptionsByValue(newField.options);
    }

    // Repeatable group: child fields (columns per row)
    if (newField.field_type === "repeatable_group" && Array.isArray(newField.fields) && newField.fields.length > 0) {
      field.fields = newField.fields.map((c) => ({
        id: c.id || c.name || generateFieldIdFromLabel(c.label) || c.id,
        name: c.name || c.id,
        type: c.type || c.field_type || "text",
        field_type: c.type || c.field_type || "text",
        label: c.label || c.field_label,
        field_label: c.label || c.field_label,
        ...(c.options?.length ? { options: c.options } : {}),
      }));
    }

    // Add configuration for people field
    if (newField.field_type === "people") {
      if (newField.filter_by_roles && newField.filter_by_roles.length > 0) {
        field.filter_by_roles = newField.filter_by_roles;
      }
      if (newField.filter_by_organization) {
        field.filter_by_organization = newField.filter_by_organization;
      }
    }

    // Add file field specific configuration
    if (newField.field_type === "file") {
      const fileValidation = {};
      // If allowAllFileTypes is true or allowed_types is empty, don't set allowed_types
      // (backend will use default validation or allow all)
      if (!allowAllFileTypes && newField.allowed_types) {
        const types = newField.allowed_types
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
        if (types.length > 0) {
          fileValidation.allowed_types = types;
        }
      }
      if (newField.max_size_mb) {
        fileValidation.max_size_mb = parseInt(newField.max_size_mb);
      }
      if (Object.keys(fileValidation).length > 0) {
        field.validation = { ...field.validation, ...fileValidation };
      }

      // Save field_options for file fields (including allowMultiple)
      if (newField.field_options) {
        field.field_options = newField.field_options;
      }
    }

    // Add JSON field specific configuration
    if (newField.field_type === "json" && newField.json_schema) {
      try {
        const schema = JSON.parse(newField.json_schema);
        field.validation = {
          ...field.validation,
          schema: schema,
        };
      } catch (e) {
        toast.error("Invalid JSON schema. Please check the format.");
        return;
      }
    }

    // Save field_options for any field that uses it (boolean display, radio layout, file allowMultiple, etc.)
    if (newField.field_options && Object.keys(newField.field_options).length > 0) {
      field.field_options = { ...(field.field_options || {}), ...newField.field_options };
    }

    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: [...formData.form_fields.fields, field],
      },
    });

    setNewField({
      field_id: "",
      field_name: "",
      field_type: "text",
      label: "",
      required: false,
      placeholder: "",
      help_text: "",
      options: [],
      validation: {
        min: "",
        max: "",
        min_length: "",
        max_length: "",
        pattern: "",
      },
      allowed_types: "",
      max_size_mb: "",
      json_schema: "",
      fields: [],
    });
    setNewOption({ value: "", label: "" });
    setAllowAllFileTypes(false);
  };

  const handleRemoveField = (index) => {
    const newFields = [...formData.form_fields.fields];
    newFields.splice(index, 1);
    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: newFields,
      },
    });
  };

  // Drag and drop handlers for reordering fields
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFields = [...formData.form_fields.fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    setFormData({
      ...formData,
      form_fields: {
        ...formData.form_fields,
        fields: newFields,
      },
    });

    setDraggedIndex(null);
    toast.success("Field order updated");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleQuickCreateCategoryType = async () => {
    if (!quickCreateCategoryTypeData.display_name) {
      toast.error("Display name is required");
      return;
    }
    
    // Ensure name is generated from display name
    const autoName = quickCreateCategoryTypeData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!autoName) {
      toast.error("Display name must contain at least one letter or number");
      return;
    }

    try {
      const result = await createCategoryTypeMutation.mutateAsync({
        ...quickCreateCategoryTypeData,
        name: autoName,
      });
      
      // Auto-select the new category type and add it to the form
      setTimeout(() => {
        const newCategoryId = result.id;
        if (!formData.form_config.categories?.includes(newCategoryId)) {
          setFormData({
            ...formData,
            form_config: {
              ...formData.form_config,
              categories: [...(formData.form_config.categories || []), newCategoryId],
            },
          });
        }
        setSelectedCategoryTypeId(newCategoryId.toString());
      }, 100);
      
      setIsQuickCreateCategoryTypeOpen(false);
      setQuickCreateCategoryTypeData({
        name: "",
        display_name: "",
        description: "",
        icon: "",
        color: "#6B7280",
        sort_order: 0,
      });
    } catch (error) {
      console.error("Failed to create category type:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.form_name || !formData.form_title) {
      toast.error("Form name and title are required");
      return;
    }

    // Validate form_name format (should already be valid, but double-check)
    if (formData.form_name && !/^[a-z0-9_-]+$/.test(formData.form_name)) {
      toast.error("Form name contains invalid characters. Only lowercase letters, numbers, hyphens, and underscores are allowed.");
      return;
    }

    // Auto-generate slug from form_title if not provided or if title changed
    if (!formData.slug && formData.form_title) {
      formData.slug = generateSlug(formData.form_title);
    } else if (formData.form_title && formData.slug) {
      // Regenerate slug if title changed (optional - you might want to keep existing slug)
      // For now, we'll only generate if slug is missing
    }

    try {
      const submitData = { ...formData };

      // Always merge pending group updates (table/grid row visibility, tabs) so they are included in the payload
      const pending = pendingGroupUpdatesRef.current;
      const rowVisOverrides = rowVisibilityOverridesRef.current;
      submitData.form_fields = {
        ...submitData.form_fields,
        groups: (submitData.form_fields?.groups || []).map((g, gIdx) => {
          let group = pending[gIdx] ? { ...g, ...pending[gIdx] } : { ...g };
          // Apply row visibility overrides for grid rows (ensures "Show row when" is always in payload)
          if (Array.isArray(group.grid_rows) && group.grid_rows.length > 0) {
            const keyPrefix = `grid_${gIdx}_`;
            group = {
              ...group,
              grid_rows: group.grid_rows.map((row, rIdx) => {
                const key = `${keyPrefix}${rIdx}`;
                const cv = rowVisOverrides[key];
                if (cv !== undefined) return { ...row, conditional_visibility: cv || undefined };
                return row;
              }),
            };
          }
          // Apply row visibility overrides for table rows
          if (Array.isArray(group.table_rows) && group.table_rows.length > 0) {
            const keyPrefix = `table_${gIdx}_`;
            let changed = false;
            const table_rows = group.table_rows.map((row, rIdx) => {
              const key = `${keyPrefix}${rIdx}`;
              const cv = rowVisOverrides[key];
              if (cv !== undefined) { changed = true; return { ...row, conditional_visibility: cv || undefined }; }
              return row;
            });
            if (changed) group = { ...group, table_rows };
          }
          return group;
        }),
      };
      pendingGroupUpdatesRef.current = {};
      rowVisibilityOverridesRef.current = {};

      // Ensure form_config is properly included with categories
      submitData.form_config = {
        ...submitData.form_config,
        // Ensure categories are integers (category_type_id values)
        categories: (submitData.form_config?.categories || []).map((cat) => 
          typeof cat === 'string' ? parseInt(cat) : cat
        ).filter((cat) => !isNaN(cat) && cat !== null && cat !== undefined),
      };

      // Add assignment fields based on mode
      if (assignmentMode === "role" && assignedToRoleId) {
        submitData.assigned_to_role_id = parseInt(assignedToRoleId);
        submitData.assigned_user_ids = [];
        submitData.create_individual_assignments = false;
      } else if (assignmentMode === "users" && selectedUserIds.length > 0) {
        submitData.assigned_user_ids = selectedUserIds;
        submitData.create_individual_assignments = createIndividualAssignments;
        submitData.assigned_to_role_id = null;
      } else {
        // Clear assignments
        submitData.assigned_to_role_id = null;
        submitData.assigned_user_ids = [];
        submitData.create_individual_assignments = false;
      }

      // Add view submissions permissions to access_config
      submitData.access_config = {
        ...submitData.access_config,
        view_submissions_roles: viewSubmissionsRoleIds,
        view_submissions_users: viewSubmissionsUserIds,
      };

      await updateFormMutation.mutateAsync({
        slug: formSlug,
        formData: submitData,
      });
      router.push(`/admin/forms/${formSlug}`);
    } catch (error) {
      console.error("Failed to update form:", error);
    }
  };

  if (formLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + form (Basic Information, Form Fields, Sidebar, Submit) */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Form</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Update form fields and configuration
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column: form content only (Basic Information + Form Fields). Field groups section is below the grid. */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="form_title">Form Title (Display) *</Label>
                  <Input
                    id="form_title"
                    value={formData.form_title}
                    onChange={(e) =>
                      setFormData({ ...formData, form_title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="form_description">Description</Label>
                  <Textarea
                    id="form_description"
                    value={formData.form_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="form_type">Form Type</Label>
                    <Select
                      value={formData.form_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, form_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingFormTypes ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : activeFormTypes.length === 0 ? (
                          <SelectItem value="none" disabled>No form types available</SelectItem>
                        ) : (
                          activeFormTypes
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map((formType) => (
                              <SelectItem key={formType.name} value={formType.name}>
                                <div className="flex items-center gap-2">
                                  {formType.icon && <span>{formType.icon}</span>}
                                  <span>{formType.display_name || formType.name}</span>
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_template"
                      checked={formData.is_template}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_template: checked })
                      }
                    />
                    <Label htmlFor="is_template">Save as Template</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Fields Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Field */}
                <div ref={fieldFormRef} className="p-4 border rounded-md space-y-4">
                  <h3 className="font-medium">Add New Field</h3>
                  
                  {/* Field Type Selection */}
                  <div>
                    <Label htmlFor="field_type">Field Type *</Label>
                    <Select
                      value={newField.field_type}
                      onValueChange={(value) => {
                        const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];
                        const isDisplayOnly = displayOnlyTypes.includes(value);
                        setNewField({ 
                          ...newField, 
                          field_type: value,
                          field_id: isDisplayOnly ? '' : newField.field_id,
                          ...(value === "repeatable_group" ? { fields: Array.isArray(newField.fields) ? newField.fields : [] } : {}),
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display-only field descriptions */}
                  {['line_break', 'page_break'].includes(newField.field_type) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {newField.field_type === 'line_break' ? (
                            <div className="text-2xl">─</div>
                          ) : (
                            <div className="text-2xl">📄</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">
                            {newField.field_type === 'line_break' ? 'Line Break' : 'Page Break'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {newField.field_type === 'line_break' 
                              ? 'This will render as a horizontal line separator in the form. No additional configuration needed.'
                              : 'This will create a page break for multi-page forms. Users will see Previous/Next buttons and a progress indicator when filling out the form.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Label - required for most fields */}
                  {!['line_break', 'page_break'].includes(newField.field_type) && (
                    <div>
                      <Label htmlFor="field_label">
                        Label {!['text_block', 'image_block', 'download_link'].includes(newField.field_type) && '*'}
                      </Label>
                      <Input
                        id="field_label"
                        value={newField.label}
                        onChange={(e) => {
                          const label = e.target.value;
                          // Auto-generate field_id from label for regular fields
                          const displayOnlyTypes = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'];
                          const isDisplayOnly = displayOnlyTypes.includes(newField.field_type);
                          const autoFieldId = !isDisplayOnly && label ? generateFieldIdFromLabel(label) : newField.field_id;
                          setNewField({ 
                            ...newField, 
                            label: label,
                            field_id: autoFieldId || newField.field_id
                          });
                        }}
                        placeholder={
                          ['text_block', 'image_block', 'download_link'].includes(newField.field_type)
                            ? "Optional label for this display element"
                            : "e.g., Equipment Name (Field ID will be auto-generated)"
                        }
                      />
                      {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && newField.label && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Field ID: <code className="px-1 py-0.5 bg-muted rounded text-xs">{generateFieldIdFromLabel(newField.label) || 'Will be generated'}</code>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Field ID - show as read-only for auto-generated, editable override */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && newField.label && (
                    <div>
                      <Label htmlFor="field_id">Field ID (Auto-generated, click to override)</Label>
                      <Input
                        id="field_id"
                        value={newField.field_id || generateFieldIdFromLabel(newField.label)}
                        onChange={(e) =>
                          setNewField({ ...newField, field_id: e.target.value })
                        }
                        placeholder="Auto-generated from label"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically generated from label. You can override it if needed.
                      </p>
                    </div>
                  )}
                  
                  {/* Required checkbox - hidden for display-only fields */}
                  {!['text_block', 'image_block', 'line_break', 'page_break'].includes(newField.field_type) && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field_required"
                        checked={newField.required}
                        onCheckedChange={(checked) =>
                          setNewField({ ...newField, required: checked })
                        }
                      />
                      <Label htmlFor="field_required">Required</Label>
                    </div>
                  )}

                  {/* Show label - hidden for display-only fields */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field_show_label"
                        checked={newField.field_options?.show_label !== false}
                        onCheckedChange={(checked) =>
                          setNewField((prev) => ({
                            ...prev,
                            field_options: { ...(prev.field_options || {}), show_label: checked !== false },
                          }))
                        }
                      />
                      <Label htmlFor="field_show_label">Show label</Label>
                    </div>
                  )}

                  {/* Placeholder - hidden for display-only fields */}
                  {!['text_block', 'image_block', 'line_break', 'page_break'].includes(newField.field_type) && (
                    <div>
                      <Label htmlFor="field_placeholder">Placeholder</Label>
                      <Input
                        id="field_placeholder"
                        value={newField.placeholder}
                        onChange={(e) =>
                          setNewField({ ...newField, placeholder: e.target.value })
                        }
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  )}

                  {/* Help Text - only show for fields that use it */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && (
                    <div>
                      <Label htmlFor="field_help_text">Help Text (Optional)</Label>
                      <Textarea
                        id="field_help_text"
                        value={newField.help_text}
                        onChange={(e) =>
                          setNewField({ ...newField, help_text: e.target.value })
                        }
                        placeholder={
                          ['boolean', 'checkbox'].includes(newField.field_type)
                            ? "This text will appear next to the checkbox"
                            : "Additional instructions or guidance for users (shown as placeholder or helper text)"
                        }
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {['boolean', 'checkbox'].includes(newField.field_type)
                          ? "This text will be displayed as the checkbox label"
                          : "This text appears as placeholder text or helper text below the field"}
                      </p>
                    </div>
                  )}

                  {/* Boolean display: checkbox or Yes/No radios */}
                  {(newField.field_type === "boolean" || newField.field_type === "checkbox") && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs">Display as</Label>
                      <Select
                        value={newField.field_options?.boolean_display || "checkbox"}
                        onValueChange={(v) =>
                          setNewField((prev) => ({
                            ...prev,
                            field_options: { ...(prev.field_options || {}), boolean_display: v },
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkbox">Checkbox (single)</SelectItem>
                          <SelectItem value="radio">Yes / No radios</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Use Yes/No radios for explicit true/false choice.</p>
                      <Label className="text-xs">Checkbox style</Label>
                      <Select
                        value={newField.field_options?.checkbox_display_style || newField.field_options?.display_style || "default"}
                        onValueChange={(v) =>
                          setNewField((prev) => ({
                            ...prev,
                            field_options: { ...(prev.field_options || {}), checkbox_display_style: v },
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="warning">Warning (amber box)</SelectItem>
                          <SelectItem value="alert">Alert (yellow left border)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Use Warning or Alert for confirmations (e.g. &quot;Mark as urgent&quot;, &quot;I have completed…&quot;).</p>
                    </div>
                  )}

                  {/* Text Block Configuration */}
                  {newField.field_type === "text_block" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>Text Block:</strong> Use the visual editor below to format your text content. You can add images, links, and apply various formatting options.
                        </p>
                      </div>
                      <Label htmlFor="text_block_content" className="text-sm font-medium">
                        Content *
                      </Label>
                      <RichTextEditor
                        value={newField.content}
                        onChange={(content) =>
                          setNewField({ ...newField, content })
                        }
                        placeholder="Enter text content..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Use the toolbar above to format your text. You can add images, links, lists, and apply various text formatting options.
                      </p>
                    </div>
                  )}

                  {/* Image Block Configuration */}
                  {newField.field_type === "image_block" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>Image Block:</strong> This will display an image in the form. You can provide a direct URL or upload an image file.
                        </p>
                      </div>
                      <Label className="text-sm font-medium">Image Configuration</Label>
                      
                      {/* Tabs for Upload vs URL */}
                      <Tabs defaultValue={newField.image_file_id ? "upload" : "url"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="url">Direct URL</TabsTrigger>
                          <TabsTrigger value="upload">Upload Image</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="url" className="space-y-2">
                          <div>
                            <Label htmlFor="image_block_url" className="text-xs">
                              Image URL *
                            </Label>
                            <Input
                              id="image_block_url"
                              value={newField.image_url}
                              onChange={(e) =>
                                setNewField({ 
                                  ...newField, 
                                  image_url: e.target.value,
                                  image_file: null,
                                  image_file_id: null
                                })
                              }
                              placeholder="https://example.com/image.png"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the full URL to the image
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="upload" className="space-y-2">
                          <div>
                            <Label htmlFor="image_block_file" className="text-xs">
                              Upload Image *
                            </Label>
                            <Input
                              id="image_block_file"
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setNewField({ 
                                      ...newField, 
                                      image_file: file,
                                      image_url: "" // Clear URL when uploading
                                    });
                                    
                                    // Upload the image without form_id or field_id
                                    // The endpoint will detect it's an image file and apply image validation
                                    const uploadResult = await uploadFileMutation.mutateAsync({
                                      file: file
                                      // No form_id or field_id needed for image_block fields
                                    });
                                    
                                    // Get API base URL from environment or use default
                                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://melode-api-prod.onrender.com/api/v1';
                                    
                                    // Helper to ensure URL is absolute (uses backend API URL)
                                    const ensureAbsoluteUrl = (url) => {
                                      if (!url) return null;
                                      // If already absolute (starts with http:// or https://), return as is
                                      if (/^https?:\/\//i.test(url)) {
                                        return url;
                                      }
                                      // If relative, check if it already starts with /api/v1
                                      // The apiBaseUrl already includes /api/v1, so we need to handle this carefully
                                      let cleanPath = url.startsWith('/') ? url : `/${url}`;
                                      
                                      // If path already starts with /api/v1, use it as is with the base URL
                                      // Otherwise, append it to the base URL
                                      if (cleanPath.startsWith('/api/v1/')) {
                                        // Extract the path after /api/v1
                                        const pathAfterApi = cleanPath.substring('/api/v1'.length);
                                        // Ensure apiBaseUrl doesn't end with / to avoid double slashes
                                        const cleanBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
                                        return `${cleanBase}${pathAfterApi}`;
                                      } else {
                                        // Path doesn't start with /api/v1, append directly
                                        const cleanBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
                                        return `${cleanBase}${cleanPath}`;
                                      }
                                    };
                                    
                                    // Use file_reference_url for storage (permanent reference)
                                    // Backend will replace this with fresh pre-signed URLs when serving
                                    const fileReferenceUrl = ensureAbsoluteUrl(uploadResult.file_reference_url) || 
                                                             ensureAbsoluteUrl(uploadResult.file_reference) ||
                                                             (uploadResult.id ? `${apiBaseUrl}/files/${uploadResult.id}/download` : null) ||
                                                             (uploadResult.file_id ? `${apiBaseUrl}/files/${uploadResult.file_id}/download` : null);
                                    
                                    // Fallback to download_url if file_reference_url not available
                                    const imageUrl = fileReferenceUrl || uploadResult.download_url || uploadResult.url || uploadResult.file_url;
                                    
                                    if (!imageUrl) {
                                      throw new Error("No file reference URL or download URL received from upload");
                                    }
                                    
                                    setNewField({ 
                                      ...newField, 
                                      image_file: file,
                                      image_url: imageUrl // Store file_reference_url (backend handles URL replacement)
                                    });
                                    
                                    toast.success("Image uploaded successfully");
                                  } catch (error) {
                                    console.error("Failed to upload image:", error);
                                    toast.error("Failed to upload image", {
                                      description: error.response?.data?.detail || error.message
                                    });
                                    setNewField({ 
                                      ...newField, 
                                      image_file: null,
                                      image_url: ""
                                    });
                                  }
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload an image file (JPG, PNG, GIF, etc.)
                            </p>
                            {newField.image_file && (
                              <div className="mt-2 p-2 bg-muted rounded-md">
                                <p className="text-xs font-medium">Selected: {newField.image_file.name}</p>
                                {newField.image_file_id && (
                                  <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                                )}
                                {uploadFileMutation.isPending && (
                                  <p className="text-xs text-muted-foreground">Uploading...</p>
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <div>
                        <Label htmlFor="image_block_alt" className="text-xs">
                          Alt Text
                        </Label>
                        <Input
                          id="image_block_alt"
                          value={newField.alt_text}
                          onChange={(e) =>
                            setNewField({ ...newField, alt_text: e.target.value })
                          }
                          placeholder="Descriptive text for accessibility"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional: Alt text for screen readers and accessibility
                        </p>
                      </div>
                    </div>
                  )}

                  {/* YouTube Video Embed Configuration */}
                  {newField.field_type === "youtube_video_embed" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>YouTube Video Embed:</strong> This will display a YouTube video embedded in the form. Provide a YouTube video URL (watch URL or short URL).
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="youtube_video_url" className="text-sm font-medium">
                          YouTube Video URL *
                        </Label>
                        <Input
                          id="youtube_video_url"
                          value={newField.video_url || ''}
                          onChange={(e) =>
                            setNewField({ ...newField, video_url: e.target.value })
                          }
                          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="youtube_video_alt" className="text-xs">
                          Alt Text
                        </Label>
                        <Input
                          id="youtube_video_alt"
                          value={newField.alt_text || ''}
                          onChange={(e) =>
                            setNewField({ ...newField, alt_text: e.target.value })
                          }
                          placeholder="Descriptive text for accessibility"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional: Alt text for screen readers and accessibility
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Line Break and Page Break Info */}
                  {(newField.field_type === "line_break" || newField.field_type === "page_break") && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {newField.field_type === "line_break" 
                          ? "This field will render as a horizontal line separator."
                          : "This field will render as a page break for multi-page forms."}
                      </p>
                    </div>
                  )}

                  {/* Configuration for People field */}
                  {newField.field_type === "people" && (
                    <div className="space-y-4 pt-2 border-t">
                      <div className="p-3 bg-muted rounded-md mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>People Field:</strong> Allows users to select a person from the organization. You can filter by roles to limit which users appear in the selection.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Filter by Roles (Optional)</Label>
                        <p className="text-xs text-muted-foreground">
                          Select which roles to filter users by. Leave empty to show all users.
                        </p>
                        <PeopleFieldRoleSelector
                          selectedRoleIds={newField.filter_by_roles || []}
                          onChange={(roleIds) => {
                            setNewField((prev) => ({
                              ...prev,
                              filter_by_roles: roleIds,
                            }));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-by-org"
                            checked={newField.filter_by_organization || false}
                            onCheckedChange={(checked) => {
                              setNewField((prev) => ({
                                ...prev,
                                filter_by_organization: checked,
                              }));
                            }}
                          />
                          <Label htmlFor="filter-by-org" className="cursor-pointer text-sm">
                            Filter by full organization
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          When enabled, only shows users from the current organization
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Options for select, radio, and multiselect fields */}
                  {(newField.field_type === "select" ||
                    newField.field_type === "radio" ||
                    newField.field_type === "multiselect") && (
                      <div className="space-y-2 pt-2 border-t">
                        {newField.field_type === "radio" && (
                          <div className="space-y-1">
                            <Label className="text-xs">Options layout</Label>
                            <Select
                              value={newField.field_options?.options_layout || "vertical"}
                              onValueChange={(v) =>
                                setNewField((prev) => ({
                                  ...prev,
                                  field_options: { ...(prev.field_options || {}), options_layout: v },
                                }))
                              }
                            >
                              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vertical">Vertical (one per row)</SelectItem>
                                <SelectItem value="horizontal">Horizontal (3 per row)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <Label>Options *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={newOption.label}
                            onChange={(e) => {
                              const label = e.target.value;
                              setNewOption((prev) => {
                                const autoFromPrev = generateFieldIdFromLabel(prev.label);
                                const wasAuto = !prev.value || prev.value === autoFromPrev;
                                return {
                                  ...prev,
                                  label,
                                  value: wasAuto ? generateFieldIdFromLabel(label) : prev.value,
                                };
                              });
                            }}
                            placeholder="Option label *"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddOption();
                              }
                            }}
                          />
                          <Input
                            value={newOption.value}
                            onChange={(e) =>
                              setNewOption({ ...newOption, value: e.target.value })
                            }
                            placeholder="Value (auto from label)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddOption();
                              }
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Value is auto-generated from label if left empty.</p>
                        <Button
                          type="button"
                          onClick={handleAddOption}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                        {newField.options.length > 0 && (
                          <div className="space-y-1">
                            {sortOptionsByValue(newField.options).map((option) => {
                              const indexInOriginal = newField.options.findIndex((o) => (o.value === option.value && (o.label || '') === (option.label || '')));
                              const idx = indexInOriginal >= 0 ? indexInOriginal : newField.options.findIndex((o) => o.value === option.value);
                              return (
                              <div
                                key={option.value ?? idx}
                                className="flex items-center justify-between p-2 bg-muted rounded-md"
                              >
                                <span className="text-sm">
                                  {option.label || option.value} ({option.value})
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveOption(idx)}
                                  className="h-6 w-6"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Validation Options - only show when relevant and when there are validation fields */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link', 'boolean', 'signature'].includes(newField.field_type) && 
                   (['text', 'textarea', 'email', 'phone', 'number', 'date'].includes(newField.field_type) ||
                    newField.validation.min || 
                    newField.validation.max || 
                    newField.validation.min_length || 
                    newField.validation.max_length || 
                    newField.validation.pattern) && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Validation (Optional)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewField({
                            ...newField,
                            validation: {
                              min: "",
                              max: "",
                              min_length: "",
                              max_length: "",
                              pattern: "",
                            }
                          });
                        }}
                        className="h-6 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(newField.field_type === "text" ||
                        newField.field_type === "textarea" ||
                        newField.field_type === "email" ||
                        newField.field_type === "phone") && (
                          <>
                            <div>
                              <Label htmlFor="min_length" className="text-xs">
                                Min Length
                              </Label>
                              <Input
                                id="min_length"
                                type="number"
                                value={newField.validation.min_length}
                                onChange={(e) =>
                                  setNewField({
                                    ...newField,
                                    validation: {
                                      ...newField.validation,
                                      min_length: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Min length"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_length" className="text-xs">
                                Max Length
                              </Label>
                              <Input
                                id="max_length"
                                type="number"
                                value={newField.validation.max_length}
                                onChange={(e) =>
                                  setNewField({
                                    ...newField,
                                    validation: {
                                      ...newField.validation,
                                      max_length: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Max length"
                              />
                            </div>
                          </>
                        )}
                      {(newField.field_type === "number") && (
                        <>
                          <div>
                            <Label htmlFor="min_value" className="text-xs">
                              Min Value
                            </Label>
                            <Input
                              id="min_value"
                              type="number"
                              value={newField.validation.min}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    min: e.target.value,
                                  },
                                })
                              }
                              placeholder="Min value"
                            />
                          </div>
                          <div>
                            <Label htmlFor="max_value" className="text-xs">
                              Max Value
                            </Label>
                            <Input
                              id="max_value"
                              type="number"
                              value={newField.validation.max}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    max: e.target.value,
                                  },
                                })
                              }
                              placeholder="Max value"
                            />
                          </div>
                        </>
                      )}
                      {(newField.field_type === "date") && (
                        <>
                          <div>
                            <Label htmlFor="min_date" className="text-xs">
                              Min Date
                            </Label>
                            <Input
                              id="min_date"
                              type="date"
                              value={newField.validation.min}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    min: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="max_date" className="text-xs">
                              Max Date
                            </Label>
                            <Input
                              id="max_date"
                              type="date"
                              value={newField.validation.max}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  validation: {
                                    ...newField.validation,
                                    max: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {(newField.field_type === "text" ||
                      newField.field_type === "email" ||
                      newField.field_type === "phone") && (
                        <div>
                          <Label htmlFor="pattern" className="text-xs">
                            Pattern (Regex)
                          </Label>
                          <Input
                            id="pattern"
                            value={newField.validation.pattern}
                            onChange={(e) =>
                              setNewField({
                                ...newField,
                                validation: {
                                  ...newField.validation,
                                  pattern: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., ^[A-Za-z\\s]+$"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Regular expression pattern for validation
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Leave empty if no validation is needed
                      </p>
                    </div>
                  )}

                  {/* File Field Configuration */}
                  {newField.field_type === "file" && (
                    <div className="space-y-4 pt-2 border-t">
                      <Label className="text-sm font-medium">
                        File Configuration
                      </Label>

                      {/* Allow Multiple Files Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow_multiple_files"
                          checked={newField.field_options?.allowMultiple || false}
                          onCheckedChange={(checked) => {
                            setNewField({
                              ...newField,
                              field_options: {
                                ...newField.field_options,
                                allowMultiple: checked,
                              },
                            });
                          }}
                        />
                        <Label htmlFor="allow_multiple_files" className="text-sm font-normal cursor-pointer">
                          Allow multiple file uploads
                        </Label>
                      </div>

                      {/* Allow All File Types Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow_all_file_types"
                          checked={allowAllFileTypes}
                          onCheckedChange={(checked) => {
                            setAllowAllFileTypes(checked);
                            if (checked) {
                              setNewField({
                                ...newField,
                                allowed_types: "",
                              });
                            }
                          }}
                        />
                        <Label htmlFor="allow_all_file_types" className="text-sm font-normal cursor-pointer">
                          Allow all file types (no restrictions)
                        </Label>
                      </div>

                      {/* File Type Selection */}
                      {!allowAllFileTypes && (
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">
                            Allowed File Types
                          </Label>
                          <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3">
                            {Object.entries(FILE_TYPE_CATEGORIES).map(([categoryKey, category]) => {
                              const selectedTypes = newField.allowed_types
                                ? newField.allowed_types.split(",").map((t) => t.trim())
                                : [];

                              const categoryTypes = category.types.map((t) => t.value);
                              const allCategorySelected = categoryTypes.every((type) =>
                                selectedTypes.includes(type)
                              );

                              const handleCategoryToggle = (checked) => {
                                let newTypes = [...selectedTypes];
                                if (checked) {
                                  // Add all category types
                                  categoryTypes.forEach((type) => {
                                    if (!newTypes.includes(type)) {
                                      newTypes.push(type);
                                    }
                                  });
                                } else {
                                  // Remove all category types
                                  newTypes = newTypes.filter((type) => !categoryTypes.includes(type));
                                }
                                setNewField({
                                  ...newField,
                                  allowed_types: newTypes.join(", "),
                                });
                              };

                              const handleTypeToggle = (typeValue, checked) => {
                                let newTypes = [...selectedTypes];
                                if (checked) {
                                  if (!newTypes.includes(typeValue)) {
                                    newTypes.push(typeValue);
                                  }
                                } else {
                                  newTypes = newTypes.filter((t) => t !== typeValue);
                                }
                                setNewField({
                                  ...newField,
                                  allowed_types: newTypes.join(", "),
                                });
                              };

                              return (
                                <div key={categoryKey} className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`category-${categoryKey}`}
                                      checked={allCategorySelected}
                                      onCheckedChange={handleCategoryToggle}
                                    />
                                    <Label
                                      htmlFor={`category-${categoryKey}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {category.label}
                                    </Label>
                                  </div>
                                  <div className="ml-6 space-y-1.5">
                                    {category.types.map((type) => (
                                      <div key={type.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`type-${type.value}`}
                                          checked={selectedTypes.includes(type.value)}
                                          onCheckedChange={(checked) =>
                                            handleTypeToggle(type.value, checked)
                                          }
                                        />
                                        <Label
                                          htmlFor={`type-${type.value}`}
                                          className="text-xs font-normal cursor-pointer"
                                        >
                                          {type.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {newField.allowed_types && (
                            <div className="text-xs text-muted-foreground">
                              Selected: {newField.allowed_types.split(",").length} type(s)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Max File Size */}
                      <div>
                        <Label htmlFor="max_size_mb" className="text-xs">
                          Max File Size (MB)
                        </Label>
                        <Input
                          id="max_size_mb"
                          type="number"
                          min="0"
                          step="0.1"
                          value={newField.max_size_mb}
                          onChange={(e) =>
                            setNewField({
                              ...newField,
                              max_size_mb: e.target.value,
                            })
                          }
                          placeholder="e.g., 5 (leave empty for no limit)"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum file size in megabytes. Leave empty for no size limit.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* JSON Field Configuration */}
                  {newField.field_type === "json" && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-sm font-medium">
                        JSON Schema Validation
                      </Label>
                      <Textarea
                        id="json_schema"
                        value={newField.json_schema}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            json_schema: e.target.value,
                          })
                        }
                        placeholder='{"type": "object", "properties": {"key1": {"type": "string"}}}'
                        rows={6}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter JSON schema for validation (optional)
                      </p>
                    </div>
                  )}

                  {/* Download Link Configuration */}
                  {newField.field_type === "download_link" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div>
                        <Label htmlFor="download_link_url" className="text-sm font-medium">
                          Download URL *
                        </Label>
                        <Input
                          id="download_link_url"
                          value={newField.download_url}
                          onChange={(e) =>
                            setNewField({ ...newField, download_url: e.target.value })
                          }
                          placeholder="https://example.com/document.pdf"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the full URL to the file or document that users can download
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Conditional Visibility Configuration */}
                  {!['text_block', 'image_block', 'line_break', 'page_break', 'download_link'].includes(newField.field_type) && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-sm font-medium">Conditional Visibility (Optional)</Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="depends_on_field" className="text-xs">
                            Show this field when
                          </Label>
                          <SearchableFieldSelect
                            fields={formData.form_fields?.fields ?? []}
                            value={newField.conditional_visibility?.depends_on_field || ''}
                            onValueChange={(value) =>
                              setNewField({
                                ...newField,
                                conditional_visibility: value
                                  ? { depends_on_field: value, show_when: null, value: null, action: newField.conditional_visibility?.action || 'hide' }
                                  : null,
                              })
                            }
                            placeholder="Select a field..."
                            excludeFieldId={newField.field_id}
                            excludeTypes={['text_block', 'image_block', 'line_break', 'page_break', 'download_link']}
                          />
                        </div>
                        {newField.conditional_visibility?.depends_on_field && (() => {
                          const formFields = formData.form_fields?.fields || [];
                          const depField = formFields.find((f) => (f.field_id || f.field_name) === newField.conditional_visibility?.depends_on_field);
                          const depType = (depField?.field_type || depField?.type || "").toLowerCase();
                          const needsValue = ["equals", "not_equals", "contains"].includes(newField.conditional_visibility?.show_when || "");
                          const isBoolean = depType === "boolean" || depType === "checkbox";
                          const isSelectLike = ["select", "dropdown", "radio", "radio_group"].includes(depType);
                          const isMultiselect = depType === "multiselect";
                          const isNumber = depType === "number" || depType === "integer";
                          const depOptions = depField ? (depField.field_options?.options || depField.options || []) : [];
                          const opts = Array.isArray(depOptions) ? depOptions : [];
                          return (
                            <>
                              <div>
                                <Label htmlFor="show_when" className="text-xs">Condition</Label>
                                <Select
                                  value={newField.conditional_visibility?.show_when || ''}
                                  onValueChange={(value) =>
                                    setNewField({
                                      ...newField,
                                      conditional_visibility: {
                                        ...newField.conditional_visibility,
                                        show_when: value || null,
                                        value: ["equals", "not_equals", "contains"].includes(value) ? (newField.conditional_visibility?.value ?? null) : null,
                                      },
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select condition..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="not_equals">Not Equals</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="is_empty">Is Empty</SelectItem>
                                    <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {needsValue && (
                                <div>
                                  <Label htmlFor="conditional_value" className="text-xs">Value</Label>
                                  {isBoolean ? (
                                    <Select
                                      value={newField.conditional_visibility?.value || ''}
                                      onValueChange={(v) =>
                                        setNewField({
                                          ...newField,
                                          conditional_visibility: { ...newField.conditional_visibility, value: v || null },
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : isSelectLike || isMultiselect ? (
                                    <Select
                                      value={newField.conditional_visibility?.value || ''}
                                      onValueChange={(v) =>
                                        setNewField({
                                          ...newField,
                                          conditional_visibility: { ...newField.conditional_visibility, value: v || null },
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select option..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {opts.map((opt, i) => {
                                          const val = typeof opt === "object" && opt !== null ? (opt.value ?? opt.label ?? "") : opt;
                                          const label = typeof opt === "object" && opt !== null ? (opt.label ?? opt.value ?? String(val)) : String(opt);
                                          return <SelectItem key={i} value={String(val)}>{label}</SelectItem>;
                                        })}
                                      </SelectContent>
                                    </Select>
                                  ) : isNumber ? (
                                    <Input
                                      id="conditional_value"
                                      type="number"
                                      value={newField.conditional_visibility?.value || ''}
                                      onChange={(e) =>
                                        setNewField({
                                          ...newField,
                                          conditional_visibility: {
                                            ...newField.conditional_visibility,
                                            value: e.target.value !== "" ? e.target.value : null,
                                          },
                                        })
                                      }
                                      placeholder="Number"
                                    />
                                  ) : (
                                    <Input
                                      id="conditional_value"
                                      value={newField.conditional_visibility?.value || ''}
                                      onChange={(e) =>
                                        setNewField({
                                          ...newField,
                                          conditional_visibility: {
                                            ...newField.conditional_visibility,
                                            value: e.target.value || null,
                                          },
                                        })
                                      }
                                      placeholder="Value to match"
                                    />
                                  )}
                                </div>
                              )}
                              <div>
                                <Label htmlFor="conditional_action" className="text-xs">When condition is not met</Label>
                                <Select
                                  value={newField.conditional_visibility?.action || 'hide'}
                                  onValueChange={(v) =>
                                    setNewField({
                                      ...newField,
                                      conditional_visibility: { ...newField.conditional_visibility, action: v || 'hide' },
                                    })
                                  }
                                >
                                  <SelectTrigger id="conditional_action">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hide">Hide field</SelectItem>
                                    <SelectItem value="disable">Disable field</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {newField.conditional_visibility?.action === 'disable'
                          ? 'When condition is not met, the field will be shown but disabled (read-only).'
                          : 'When condition is not met, the field will be hidden.'}
                      </p>
                    </div>
                  )}

                  {/* Repeatable group: child fields (columns in each row, e.g. Drug, Dose, Duration, Repeat) */}
                  {newField.field_type === "repeatable_group" && (
                    <div className="space-y-3 pt-2 border-t">
                      <Label className="text-sm font-medium">Child fields (one per column in each row)</Label>
                      <p className="text-xs text-muted-foreground">
                        Users will see a grid of these columns and can add multiple rows with &quot;Add row&quot;.
                      </p>
                      {(newField.fields || []).map((child, childIdx) => (
                        <div key={childIdx} className="flex flex-wrap items-center gap-2 p-2 rounded border bg-muted/30">
                          <Input
                            className="flex-1 min-w-[100px] h-8 text-sm"
                            placeholder="Label (e.g. Drug)"
                            value={child.label || child.field_label || ""}
                            onChange={(e) => {
                              const label = e.target.value;
                              const id = generateFieldIdFromLabel(label) || `field_${childIdx + 1}`;
                              setNewField((prev) => ({
                                ...prev,
                                fields: (prev.fields || []).map((c, i) =>
                                  i === childIdx ? { ...c, label, field_label: label, id, name: id } : c
                                ),
                              }));
                            }}
                          />
                          <Select
                            value={(child.type || child.field_type || "text").toLowerCase()}
                            onValueChange={(value) =>
                              setNewField((prev) => ({
                                ...prev,
                                fields: (prev.fields || []).map((c, i) => (i === childIdx ? { ...c, type: value, field_type: value } : c)),
                              }))
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="boolean">Checkbox</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ID: {child.id || child.name || generateFieldIdFromLabel(child.label) || `field_${childIdx + 1}`}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              setNewField((prev) => ({
                                ...prev,
                                fields: (prev.fields || []).filter((_, i) => i !== childIdx),
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setNewField((prev) => {
                            const n = (prev.fields || []).length + 1;
                            const label = `Column ${n}`;
                            const id = generateFieldIdFromLabel(label) || `field_${n}`;
                            return {
                              ...prev,
                              fields: [...(prev.fields || []), { id, name: id, type: "text", field_type: "text", label }],
                            };
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add child field
                      </Button>
                    </div>
                  )}

                  {/* File Expiry Date Support */}
                  {newField.field_type === "file" && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="file_expiry_date"
                          checked={newField.file_expiry_date || false}
                          onCheckedChange={(checked) =>
                            setNewField({ ...newField, file_expiry_date: checked })
                          }
                        />
                        <Label htmlFor="file_expiry_date" className="text-sm font-normal">
                          Require expiry date for uploaded files
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When enabled, users will be required to provide an expiry date when uploading files (e.g., for certificates)
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddField}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>

                {/* Existing Fields */}
                {formData.form_fields.fields.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      Fields ({formData.form_fields.fields.length})
                    </h3>
                    {formData.form_fields.fields.map((field, index) => {
                        const getFieldIcon = (type) => {
                        const icons = {
                          text: Type,
                          email: Mail,
                          phone: Phone,
                          date: Calendar,
                          datetime: Calendar,
                          number: Hash,
                          textarea: AlignLeft,
                          select: List,
                          multiselect: List,
                          radio: List,
                          boolean: CheckSquare,
                          checkbox: CheckSquare,
                          repeatable_group: List,
                          file: Upload,
                          signature: PenTool,
                          text_block: FileText,
                          image_block: Image,
                          youtube_video_embed: Play,
                          line_break: Minus,
                          page_break: FileText,
                          download_link: FileDown,
                          json: FileText,
                        };
                        return icons[type?.toLowerCase()] || Type;
                      };
                      const FieldIcon = getFieldIcon(field.field_type);
                      const isDisplayOnly = ['text_block', 'image_block', 'youtube_video_embed', 'line_break', 'page_break', 'download_link'].includes(field.field_type?.toLowerCase());
                      
                      return (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`group flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
                            draggedIndex === index ? 'opacity-50 cursor-grabbing' : 'cursor-grab'
                          } ${
                            dragOverIndex === index && draggedIndex !== index ? 'border-primary border-2 bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <FieldIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {field.label || field.field_id || `Field ${index + 1}`}
                              </span>
                              <Badge variant="outline" className="text-xs font-normal">
                                {field.field_type}
                              </Badge>
                              {field.required && !isDisplayOnly && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              {isDisplayOnly && (
                                <Badge variant="secondary" className="text-xs">
                                  Display Only
                                </Badge>
                              )}
                            </div>
                            {field.help_text && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {field.help_text}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                // Load field into editor
                                const fieldToEdit = formData.form_fields.fields[index];
                                setNewField({
                                  field_id: fieldToEdit.field_id,
                                  field_type: fieldToEdit.field_type,
                                  label: fieldToEdit.label || '',
                                  required: fieldToEdit.required || false,
                                  placeholder: fieldToEdit.placeholder || '',
                                  help_text: fieldToEdit.help_text || '',
                                  options: sortOptionsByValue(fieldToEdit.options || []),
                                  validation: fieldToEdit.validation || {},
                                  field_options: fieldToEdit.field_options || {},
                                  content: fieldToEdit.content || '',
                                  image_url: fieldToEdit.image_url || '',
                                  image_file_id: fieldToEdit.image_file_id || null,
                                  alt_text: fieldToEdit.alt_text || '',
                                  download_url: fieldToEdit.download_url || '',
                                  conditional_visibility: fieldToEdit.conditional_visibility || null,
                                  file_expiry_date: fieldToEdit.file_expiry_date || false,
                                  json_schema: fieldToEdit.validation?.schema ? JSON.stringify(fieldToEdit.validation.schema, null, 2) : '',
                                  allowed_types: fieldToEdit.validation?.allowed_types ? (Array.isArray(fieldToEdit.validation.allowed_types) ? fieldToEdit.validation.allowed_types.join(', ') : fieldToEdit.validation.allowed_types) : '',
                                  max_size_mb: fieldToEdit.validation?.max_size_mb || '',
                                  fields: fieldToEdit.fields || [],
                                });
                                // Remove the field
                                handleRemoveField(index);
                                // Scroll to the field form so the user sees the edit form
                                setTimeout(() => {
                                  fieldFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 0);
                              }}
                              title="Edit field"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove "${field.label || field.field_id || `Field ${index + 1}`}"?`)) {
                                  handleRemoveField(index);
                                  toast.success("Field removed", {
                                    description: `"${field.label || field.field_id}" has been removed from the form.`,
                                  });
                                }
                              }}
                              title="Delete field"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No fields added yet. Add your first field above.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: actions / configuration */}
          <div className="space-y-6">
            {/* Form Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Form Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="submit_button_text">Submit Button Text</Label>
                  <Input
                    id="submit_button_text"
                    value={formData.form_config.submit_button_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          submit_button_text: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="success_message">Success Message</Label>
                  <Textarea
                    id="success_message"
                    value={formData.form_config.success_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          success_message: e.target.value,
                        },
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_draft"
                    checked={formData.form_config.allow_draft}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          allow_draft: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="allow_draft">Allow Draft</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_save"
                    checked={formData.form_config.auto_save}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          auto_save: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="auto_save">Auto-save</Label>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="categories">Categories</Label>
                  <p className="text-xs text-muted-foreground">
                    Define categories to organise submissions. Backend users can assign categories when reviewing submissions.
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <CategoryTypeSelector
                          value={selectedCategoryTypeId}
                          onValueChange={setSelectedCategoryTypeId}
                          placeholder="Select a category type"
                          showIcon={true}
                          showColor={true}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (selectedCategoryTypeId) {
                            // Add selected category type
                            const categoryId = parseInt(selectedCategoryTypeId);
                            if (categoryId && !formData.form_config.categories?.includes(categoryId)) {
                              setFormData({
                                ...formData,
                                form_config: {
                                  ...formData.form_config,
                                  categories: [...(formData.form_config.categories || []), categoryId],
                                },
                              });
                              setSelectedCategoryTypeId("");
                            }
                          } else {
                            // Open quick create dialog
                            setIsQuickCreateCategoryTypeOpen(true);
                          }
                        }}
                        title={selectedCategoryTypeId ? "Add category type" : "Create new category type"}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.form_config.categories && formData.form_config.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.form_config.categories.map((categoryId, index) => {
                          const categoryType = categoryTypes.find((ct) => ct.id === categoryId);
                          return (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {categoryType?.icon && (
                                <span className="text-xs">{categoryType.icon}</span>
                              )}
                              <Tag className="h-3 w-3" />
                              {categoryType?.display_name || categoryType?.name || `Category ${categoryId}`}
                              <button
                                type="button"
                                onClick={() => {
                                  const newCategories = formData.form_config.categories.filter(
                                    (_, i) => i !== index
                                  );
                                  setFormData({
                                    ...formData,
                                    form_config: {
                                      ...formData.form_config,
                                      categories: newCategories,
                                    },
                                  });
                                }}
                                className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="statuses">Status Options</Label>
                  <p className="text-xs text-muted-foreground">
                    Define custom status options for submissions. If not specified, default statuses (draft, submitted, reviewed, approved, rejected) will be used.
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="new_status"
                        value={newStatusValue}
                        onChange={(e) => setNewStatusValue(e.target.value)}
                        placeholder="Enter status name (e.g., Open, In Progress)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const value = newStatusValue.trim();
                            if (value && !formData.form_config.statuses?.includes(value)) {
                              setFormData({
                                ...formData,
                                form_config: {
                                  ...formData.form_config,
                                  statuses: [...(formData.form_config.statuses || []), value],
                                },
                              });
                              setNewStatusValue("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const value = newStatusValue.trim();
                          if (value && !formData.form_config.statuses?.includes(value)) {
                            setFormData({
                              ...formData,
                              form_config: {
                                ...formData.form_config,
                                statuses: [...(formData.form_config.statuses || []), value],
                              },
                            });
                            setNewStatusValue("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.form_config.statuses && formData.form_config.statuses.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.form_config.statuses.map((status, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {status}
                            <button
                              type="button"
                              onClick={() => {
                                const newStatuses = formData.form_config.statuses.filter(
                                  (_, i) => i !== index
                                );
                                setFormData({
                                  ...formData,
                                  form_config: {
                                    ...formData.form_config,
                                    statuses: newStatuses,
                                  },
                                });
                              }}
                              className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Access & Submission Viewing Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Form Access & Submission Viewing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Access - Who can submit */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Form Access (Who can submit)</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Control who can fill out and submit this form.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Allowed Roles</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !formData.access_config.allowed_roles.includes(value)) {
                            setFormData({
                              ...formData,
                              access_config: {
                                ...formData.access_config,
                                allowed_roles: [...formData.access_config.allowed_roles, value],
                              },
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles
                            .filter(
                              (role) =>
                                !formData.access_config.allowed_roles.includes(
                                  role.name || role.slug
                                )
                            )
                            .map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.name || role.slug}
                              >
                                {role.display_name || role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {formData.access_config.allowed_roles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.access_config.allowed_roles.map((roleName) => {
                            const role = roles.find(
                              (r) => (r.name || r.slug) === roleName
                            );
                            return (
                              <Badge
                                key={roleName}
                                variant="secondary"
                                className="flex items-center gap-1 pr-1"
                              >
                                <Shield className="h-3 w-3" />
                                <span className="text-xs">
                                  {role?.display_name || role?.name || roleName}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      access_config: {
                                        ...formData.access_config,
                                        allowed_roles:
                                          formData.access_config.allowed_roles.filter(
                                            (r) => r !== roleName
                                          ),
                                      },
                                    });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Allowed Users</Label>
                      <UserMentionSelector
                        users={users}
                        selectedUserIds={formData.access_config.allowed_users || []}
                        onSelectionChange={(newSelection) => {
                          setFormData({
                            ...formData,
                            access_config: {
                              ...formData.access_config,
                              allowed_users: newSelection,
                            },
                          });
                        }}
                        placeholder="Type to search and select users..."
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  {/* Submission Viewing Permissions - Who can view submissions */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">
                        Submission Viewing Permissions
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Control who can view and review form submissions. This is separate from
                        who can submit the form.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>View Submissions Roles</Label>
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value && !viewSubmissionsRoleIds.includes(value)) {
                              setViewSubmissionsRoleIds([...viewSubmissionsRoleIds, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles
                              .filter(
                                (role) =>
                                  !viewSubmissionsRoleIds.includes(
                                    role.name || role.slug
                                  )
                              )
                              .map((role) => (
                                <SelectItem
                                  key={role.id}
                                  value={role.name || role.slug}
                                >
                                  {role.display_name || role.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {viewSubmissionsRoleIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {viewSubmissionsRoleIds.map((roleName) => {
                              const role = roles.find(
                                (r) => (r.name || r.slug) === roleName
                              );
                              return (
                                <Badge
                                  key={roleName}
                                  variant="secondary"
                                  className="flex items-center gap-1 pr-1"
                                >
                                  <Shield className="h-3 w-3" />
                                  <span className="text-xs">
                                    {role?.display_name || role?.name || roleName}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => {
                                      setViewSubmissionsRoleIds(
                                        viewSubmissionsRoleIds.filter(
                                          (r) => r !== roleName
                                        )
                                      );
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>View Submissions Users</Label>
                        <UserMentionSelector
                          users={users}
                          selectedUserIds={viewSubmissionsUserIds}
                          onSelectionChange={setViewSubmissionsUserIds}
                          placeholder="Type to search and select users..."
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> Submission viewing permissions control who can see
                        and review form submissions, separate from who can fill out the form. Form
                        owners (users in assigned_user_ids) can always view all submissions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Form Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Assign Form To</Label>
                  <Tabs value={assignmentMode} onValueChange={setAssignmentMode} className="w-full">
                    <div className="overflow-x-auto scrollbar-hide">
                      <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-3">
                        <TabsTrigger value="none" className="whitespace-nowrap">
                          None
                        </TabsTrigger>
                        <TabsTrigger value="role" className="whitespace-nowrap">
                          <Shield className="mr-2 h-4 w-4" />
                          Role
                        </TabsTrigger>
                        <TabsTrigger value="users" className="whitespace-nowrap">
                          <Users className="mr-2 h-4 w-4" />
                          Users
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Role Assignment */}
                    <TabsContent value="role" className="space-y-3 mt-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              All users in the selected role will be able to access this form.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={assignedToRoleId}
                          onValueChange={(value) => {
                            setAssignedToRoleId(value);
                            setSelectedUserIds([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.display_name || role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsCreateRoleModalOpen(true)}
                          title="Create new role"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Multiple Users Assignment */}
                    <TabsContent value="users" className="space-y-3 mt-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {createIndividualAssignments
                                ? "Each selected user will get their own form instance to complete individually."
                                : "All selected users will share one form instance for collaborative completion."}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="create_individual_assignments"
                          checked={createIndividualAssignments}
                          onCheckedChange={(checked) => setCreateIndividualAssignments(checked)}
                        />
                        <Label htmlFor="create_individual_assignments" className="cursor-pointer">
                          Create individual assignments
                        </Label>
                      </div>
                      {createIndividualAssignments ? (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                            Individual Mode: Each user gets their own form instance
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                          <p className="text-xs font-medium text-green-800 dark:text-green-200">
                            Collaborative Mode: All users share the same form instance
                          </p>
                        </div>
                      )}
                      <UserMentionSelector
                        users={users}
                        selectedUserIds={selectedUserIds}
                        onSelectionChange={handleUserSelectionChange}
                        placeholder="Type to search and mention users..."
                        className="w-full"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Automation Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_create_tasks"
                    checked={formData.form_config.automation?.auto_create_tasks || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        form_config: {
                          ...formData.form_config,
                          automation: {
                            ...formData.form_config.automation,
                            auto_create_tasks: checked,
                            // Reset create_individual_tasks if auto_create_tasks is disabled
                            create_individual_tasks: checked
                              ? formData.form_config.automation?.create_individual_tasks || false
                              : false,
                          },
                        },
                      })
                    }
                  />
                  <Label htmlFor="auto_create_tasks">Auto-create tasks</Label>
                </div>

                {formData.form_config.automation?.auto_create_tasks && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="create_individual_tasks"
                        checked={formData.form_config.automation?.create_individual_tasks || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                create_individual_tasks: checked,
                              },
                            },
                          })
                        }
                      />
                      <div className="flex-1">
                        <Label htmlFor="create_individual_tasks" className="cursor-pointer">
                          Create individual tasks
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Each user in the role gets their own task
                        </p>
                      </div>
                    </div>

                    {formData.form_config.automation?.create_individual_tasks ? (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Individual Tasks Mode
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Each user in the assigned role will receive their own separate task
                              to complete individually.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Collaborative Task Mode
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                              One task will be created and assigned to the role for collaborative
                              completion.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="task_assignee_role">Task Assignee Role</Label>
                      <Select
                        value={formData.form_config.automation?.task_assignee_role || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                task_assignee_role: value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger id="task_assignee_role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name || role.slug}>
                              {role.display_name || role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="due_time_minutes">Due Time (minutes)</Label>
                      <Input
                        id="due_time_minutes"
                        type="number"
                        min="0"
                        value={formData.form_config.automation?.due_time_minutes || 30}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                due_time_minutes: parseInt(e.target.value) || 30,
                              },
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="escalation_enabled"
                        checked={formData.form_config.automation?.escalation_enabled || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            form_config: {
                              ...formData.form_config,
                              automation: {
                                ...formData.form_config.automation,
                                escalation_enabled: checked,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="escalation_enabled">Escalation enabled</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Field groups: full width - outside md:col-span-2, inside form */}
        {formData.form_fields.fields.length > 0 && (
          <div className="w-full mt-6">
            <Card>
            <CardHeader>
              <CardTitle>Field groups</CardTitle>
              <p className="text-sm text-muted-foreground font-normal">
                Optionally group fields. Each group has a heading on submit; groups can have conditional visibility (show when another field has a value) and grid layout.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.form_fields.groups || []).map((group, gIdx) => {
                    const fieldsList = formData?.form_fields?.fields || [];
                    const getAllGroupFieldIds = (grp) => {
                      if ((grp.layout || "") === "grid" && grp.grid_rows) return flatMapGridRowsFieldIds(grp.grid_rows);
                      if (grp.layout === "tabs" && grp.tabs?.length) return (grp.tabs || []).flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || []));
                      if ((grp.layout || "") === "table" && grp.table_rows) return (grp.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean));
                      return grp.fields || [];
                    };
                    const allIdsInAnyGroup = (formData?.form_fields?.groups || []).flatMap((g) => getAllGroupFieldIds(g));
                    return (
                      <div key={group.id || gIdx} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                        <div className="flex gap-2 items-center">
                          <div className="flex flex-col gap-0">
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={gIdx === 0} onClick={() => {
                              const next = [...(formData.form_fields.groups || [])];
                              if (gIdx <= 0) return;
                              [next[gIdx - 1], next[gIdx]] = [next[gIdx], next[gIdx - 1]];
                              setFormData({ ...formData, form_fields: { ...formData.form_fields, groups: next } });
                            }}>
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={gIdx >= (formData.form_fields.groups || []).length - 1} onClick={() => {
                              const next = [...(formData.form_fields.groups || [])];
                              if (gIdx >= next.length - 1) return;
                              [next[gIdx], next[gIdx + 1]] = [next[gIdx + 1], next[gIdx]];
                              setFormData({ ...formData, form_fields: { ...formData.form_fields, groups: next } });
                            }}>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Group label"
                            value={group.label || ""}
                            onChange={(e) => {
                              const next = [...(formData.form_fields.groups || [])];
                              next[gIdx] = { ...group, label: e.target.value, id: group.id || `g_${gIdx}` };
                              setFormData({ ...formData, form_fields: { ...formData.form_fields, groups: next } });
                            }}
                            className="flex-1 h-8 text-sm"
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => {
                            const next = (formData.form_fields.groups || []).filter((_, i) => i !== gIdx);
                            setFormData({ ...formData, form_fields: { ...formData.form_fields, groups: next } });
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Layout</Label>
                          <Select value={group.layout || "stack"} onValueChange={(v) => {
                            const next = [...(formData.form_fields.groups || [])];
                            const newGroup = { ...group, layout: v };
                            if (v === "grid") {
                              const fromFields = group.fields || [];
                              const hasRows = Array.isArray(group.grid_rows) && group.grid_rows.length > 0;
                              const hasGrid = group.grid_columns && ((group.grid_columns.left?.length || 0) + (group.grid_columns.center?.length || 0) + (group.grid_columns.right?.length || 0)) > 0;
                              if (hasRows) {
                                newGroup.grid_rows = group.grid_rows;
                                newGroup.fields = group.grid_rows.flatMap((r) => [...(r.left || []), ...(r.center || []), ...(r.right || [])]);
                              } else if (hasGrid) {
                                newGroup.grid_rows = [{ left: group.grid_columns?.left ?? [], center: group.grid_columns?.center ?? [], right: group.grid_columns?.right ?? [] }];
                                newGroup.fields = [...(newGroup.grid_rows[0].left || []), ...(newGroup.grid_rows[0].center || []), ...(newGroup.grid_rows[0].right || [])];
                              } else {
                                newGroup.grid_rows = [{ left: fromFields.length ? [...fromFields] : [], center: [], right: [] }];
                                newGroup.fields = fromFields.length ? [...fromFields] : [];
                              }
                            } else if (v === "tabs") {
                              newGroup.tabs = Array.isArray(group.tabs) && group.tabs.length > 0
                                ? group.tabs
                                : [{ id: `tab_${Date.now()}`, label: "Tab 1", fields: [] }];
                              newGroup.fields = newGroup.tabs.flatMap((t) => t.fields || []);
                            } else if (v === "table") {
                              const cols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "Column 1" }];
                              const rows = Array.isArray(group.table_rows) && group.table_rows.length > 0 ? group.table_rows : [{ cells: cols.map(() => ({ text: "", field_id: null })) }];
                              newGroup.table_columns = cols;
                              newGroup.table_rows = rows;
                            }
                            next[gIdx] = newGroup;
                            setFormData({ ...formData, form_fields: { ...formData.form_fields, groups: next } });
                          }}>
                            <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stack">Stack (default)</SelectItem>
                              <SelectItem value="grid">Grid (3 columns)</SelectItem>
                              <SelectItem value="tabs">Tabs</SelectItem>
                              <SelectItem value="table">Table</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {(group.layout || "") === "grid" ? (
                          <FormGroupGridColumnsEditor
                            formData={formData}
                            setFormData={setFormData}
                            gIdx={gIdx}
                            group={group}
                            pendingGroupUpdatesRef={pendingGroupUpdatesRef}
                            onRowVisibilityChange={(gIdx, rowIndex, cv) => { rowVisibilityOverridesRef.current[`grid_${gIdx}_${rowIndex}`] = cv; }}
                          />
                        ) : (group.layout || "") === "table" ? (
                          (() => {
                            const cols = Array.isArray(group.table_columns) && group.table_columns.length > 0 ? group.table_columns : [{ id: "col_1", label: "Column 1" }];
                            const rows = Array.isArray(group.table_rows) ? group.table_rows : [];
                            return (
                              <GridCellTableEditor
                                tableCols={cols}
                                tableRows={rows}
                                fieldsList={fieldsList}
                                allIdsInAnyGroup={allIdsInAnyGroup}
                                onUpdate={(table_columns, table_rows) => {
                                  pendingGroupUpdatesRef.current[gIdx] = { table_columns, table_rows };
                                  setFormData((prev) => {
                                    const groups = prev.form_fields?.groups || [];
                                    const next = [...groups];
                                    const currentGroup = next[gIdx] || {};
                                    next[gIdx] = { ...currentGroup, table_columns, table_rows };
                                    return { ...prev, form_fields: { ...prev.form_fields, groups: next } };
                                  });
                                }}
                                onRowVisibilityChange={(rIdx, cv) => { rowVisibilityOverridesRef.current[`table_${gIdx}_${rIdx}`] = cv; }}
                              />
                            );
                          })()
                        ) : (group.layout || "") === "tabs" ? (
                          (() => {
                            const tabList = Array.isArray(group.tabs) ? group.tabs : [{ id: `tab_${Date.now()}`, label: "Tab 1", fields: [] }];
                            const setTabs = (newTabs) => {
                              const updatedGroup = { ...group, tabs: newTabs, fields: newTabs.flatMap((t) => (t.layout === "table" && t.table_rows) ? (t.table_rows || []).flatMap((r) => (r.cells || []).map((c) => c.field_id).filter(Boolean)) : (t.fields || [])) };
                              pendingGroupUpdatesRef.current[gIdx] = { tabs: newTabs, fields: updatedGroup.fields };
                              setFormData((prev) => {
                                const groups = prev.form_fields?.groups || [];
                                const next = [...groups];
                                next[gIdx] = updatedGroup;
                                return { ...prev, form_fields: { ...prev.form_fields, groups: next } };
                              });
                            };
                            const setTab = (tIdx, updater) => setTabs(tabList.map((t, i) => (i !== tIdx ? t : (typeof updater === "function" ? updater(t) : updater))));
                            const addTab = () => setTabs([...tabList, { id: `tab_${Date.now()}`, label: `Tab ${tabList.length + 1}`, fields: [] }]);
                            const removeTab = (tIdx) => setTabs(tabList.filter((_, i) => i !== tIdx));
                            const tabFieldIds = tabList.flatMap((t) => t.fields || []);
                            const availableToAdd = (fieldsList || []).map((f) => String(f.field_id || f.id || f.name)).filter((id) => !allIdsInAnyGroup.includes(id) || tabFieldIds.includes(id));
                            return (
                              <div className="space-y-1.5 mt-2 min-w-[320px] overflow-x-auto">
                                {tabList.map((tab, tIdx) => (
                                  <div key={tab.id || tIdx} className="rounded border bg-muted/20 p-1.5 space-y-1 min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <Input className="h-6 text-xs w-28 min-w-[5rem] max-w-[8rem] shrink-0" placeholder="Tab label" value={tab.label || ""} onChange={(e) => setTab(tIdx, { ...tab, label: e.target.value })} />
                                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeTab(tIdx)}><Trash2 className="h-2.5 w-2.5" /></Button>
                                    </div>
                                    <div className="flex flex-wrap gap-0.5">
                                      {(tab.fields || []).map((fid) => {
                                        const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
                                        return (
                                          <Badge key={fid} variant="outline" className="text-xs py-0">
                                            {f?.label || fid}
                                            <button type="button" className="ml-0.5" onClick={() => setTab(tIdx, { ...tab, fields: (tab.fields || []).filter((id) => id !== fid) })}><X className="h-2.5 w-2.5" /></button>
                                          </Badge>
                                        );
                                      })}
                                      <Select value="__add__" onValueChange={(v) => { if (v && v !== "__add__") setTab(tIdx, { ...tab, fields: [...(tab.fields || []), v] }); }}>
                                        <SelectTrigger className="h-5 text-xs w-[110px]"><SelectValue placeholder="+ Field" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="__add__">+ Field</SelectItem>
                                          {availableToAdd.map((fid) => {
                                            const f = fieldsList.find((x) => String(x.field_id || x.id || x.name) === String(fid));
                                            return <SelectItem key={fid} value={fid}>{f?.label || fid}</SelectItem>;
                                          })}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="h-6 text-xs w-full" onClick={addTab}><Plus className="h-2.5 w-2.5 mr-0.5" /> Add tab</Button>
                              </div>
                            );
                          })()
                        ) : null}
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-xs">Show group when (optional)</Label>
                          <p className="text-xs text-muted-foreground">Show when any condition matches (OR).</p>
                          {(() => {
                            const cv = group.conditional_visibility;
                            const conditions = Array.isArray(cv?.conditions)
                              ? cv.conditions
                              : cv?.depends_on_field
                                ? [{ depends_on_field: cv.depends_on_field, show_when: cv.show_when ?? null, value: cv.value ?? null }]
                                : [];
                            const formFields = formData.form_fields?.fields || [];
                            const setConditions = (newList) => {
                              const next = [...(formData.form_fields.groups || [])];
                              next[gIdx] = {
                                ...group,
                                conditional_visibility: newList.length === 0 ? undefined : { conditions: newList },
                              };
                              setFormData({ ...formData, form_fields: { ...formData.form_fields, groups: next } });
                            };
                            const updateCondition = (cIdx, upd) => {
                              const newList = conditions.map((c, i) => (i === cIdx ? { ...c, ...upd } : c));
                              setConditions(newList);
                            };
                            const removeCondition = (cIdx) => {
                              setConditions(conditions.filter((_, i) => i !== cIdx));
                            };
                            const addCondition = () => {
                              setConditions([...conditions, { depends_on_field: null, show_when: null, value: null }]);
                            };
                            return (
                              <div className="space-y-2">
                                {conditions.length === 0 ? (
                                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addCondition}>
                                    <Plus className="h-3 w-3 mr-1" /> Add condition
                                  </Button>
                                ) : (
                                  conditions.map((cond, cIdx) => {
                                    const depField = formFields.find((f) => (f.field_id || f.id || f.name) === cond.depends_on_field);
                                    const depType = (depField?.field_type || depField?.type || "").toLowerCase();
                                    const needsValue = ["equals", "not_equals", "contains"].includes(cond.show_when || "");
                                    const isBoolean = depType === "boolean" || depType === "checkbox";
                                    const isSelectLike = ["select", "dropdown", "radio", "radio_group"].includes(depType);
                                    const isMultiselect = depType === "multiselect";
                                    const isNumber = depType === "number" || depType === "integer";
                                    const depOptions = depField ? (depField.field_options?.options || depField.options || []) : [];
                                    const opts = Array.isArray(depOptions) ? depOptions : [];
                                    return (
                                      <div key={cIdx} className="flex flex-wrap items-center gap-2 rounded border p-2 bg-muted/30">
                                        <SearchableFieldSelect
                                          fields={formFields}
                                          value={cond.depends_on_field || "__none__"}
                                          onValueChange={(v) => updateCondition(cIdx, { depends_on_field: v && v !== "__none__" ? v : null, show_when: null, value: null })}
                                          placeholder="Select field"
                                          noneOption
                                          noneLabel="Select field"
                                          compact
                                          className="h-7 text-xs w-40"
                                        />
                                        {cond.depends_on_field && (
                                          <>
                                            <Select value={cond.show_when || ""} onValueChange={(v) => updateCondition(cIdx, { show_when: v || null, value: needsValue ? (cond.value ?? null) : null })}>
                                              <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="equals">Equals</SelectItem>
                                                <SelectItem value="not_equals">Not equals</SelectItem>
                                                <SelectItem value="contains">Contains</SelectItem>
                                                <SelectItem value="is_empty">Is empty</SelectItem>
                                                <SelectItem value="is_not_empty">Not empty</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            {needsValue && (isBoolean ? (
                                              <Select value={cond.value || ""} onValueChange={(v) => updateCondition(cIdx, { value: v || null })}>
                                                <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                                              </Select>
                                            ) : isSelectLike || isMultiselect ? (
                                              <Select value={cond.value || ""} onValueChange={(v) => updateCondition(cIdx, { value: v || null })}>
                                                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                  {opts.map((opt, i) => {
                                                    const val = typeof opt === "object" && opt !== null ? (opt.value ?? opt.label ?? "") : opt;
                                                    const label = typeof opt === "object" && opt !== null ? (opt.label ?? opt.value ?? String(val)) : String(opt);
                                                    return <SelectItem key={i} value={String(val)}>{label}</SelectItem>;
                                                  })}
                                                </SelectContent>
                                              </Select>
                                            ) : isNumber ? (
                                              <Input type="number" className="h-7 text-xs w-20" value={cond.value ?? ""} onChange={(e) => updateCondition(cIdx, { value: e.target.value || null })} placeholder="Number" />
                                            ) : (
                                              <Input className="h-7 text-xs w-24" value={cond.value ?? ""} onChange={(e) => updateCondition(cIdx, { value: e.target.value || null })} placeholder="Value" />
                                            ))}
                                          </>
                                        )}
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeCondition(cIdx)} title="Remove condition">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    );
                                  })
                                )}
                                {conditions.length > 0 && (
                                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addCondition}>
                                    <Plus className="h-3 w-3 mr-1" /> Add condition (OR)
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const newGroup = { id: `g_${Date.now()}`, label: "New group", fields: [] };
                    setFormData({
                      ...formData,
                      form_fields: {
                        ...formData.form_fields,
                        groups: [...(formData.form_fields.groups || []), newGroup],
                      },
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add group
                  </Button>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Link href={`/admin/forms/${formSlug}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateFormMutation.isPending}>
            {updateFormMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Form
          </Button>
        </div>
      </form>
      </div>

      {/* Create Role Modal */}
      <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role for your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-display-name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-display-name"
                placeholder="e.g., Senior Doctor"
                value={roleFormData.displayName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    displayName: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-name"
                placeholder="e.g., senior_doctor"
                value={roleFormData.roleName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    roleName: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores only. Cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe this role's purpose and responsibilities"
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    description: e.target.value,
                  })
                }
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-priority">Priority</Label>
              <Input
                id="role-priority"
                type="number"
                value={roleFormData.priority}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    priority: parseInt(e.target.value) || 50,
                  })
                }
                min="1"
                max="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRoleModalOpen(false);
                setRoleFormData({
                  displayName: "",
                  roleName: "",
                  description: "",
                  priority: 50,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={
                createRoleMutation.isPending ||
                !roleFormData.displayName ||
                !roleFormData.roleName
              }
            >
              {createRoleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Category Type Dialog */}
      <Dialog open={isQuickCreateCategoryTypeOpen} onOpenChange={setIsQuickCreateCategoryTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category Type</DialogTitle>
            <DialogDescription>
              Quickly create a new category type. It will be automatically added to the form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-category-display_name">Display Name *</Label>
              <Input
                id="quick-category-display_name"
                value={quickCreateCategoryTypeData.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  const autoName = displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                  setQuickCreateCategoryTypeData({
                    ...quickCreateCategoryTypeData,
                    display_name: displayName,
                    name: autoName,
                  });
                }}
                placeholder="e.g., Medical"
              />
            </div>
            <div>
              <Label htmlFor="quick-category-name">Name (Unique Identifier) *</Label>
              <Input
                id="quick-category-name"
                value={quickCreateCategoryTypeData.name}
                disabled
                className="font-mono bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from display name. Lowercase letters, numbers, and underscores only.
              </p>
            </div>
            <div>
              <Label htmlFor="quick-category-description">Description</Label>
              <Textarea
                id="quick-category-description"
                value={quickCreateCategoryTypeData.description}
                onChange={(e) =>
                  setQuickCreateCategoryTypeData({
                    ...quickCreateCategoryTypeData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this category type..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quick-category-icon">Icon (Emoji)</Label>
                <Input
                  id="quick-category-icon"
                  value={quickCreateCategoryTypeData.icon}
                  onChange={(e) =>
                    setQuickCreateCategoryTypeData({
                      ...quickCreateCategoryTypeData,
                      icon: e.target.value,
                    })
                  }
                  placeholder="🏥"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="quick-category-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="quick-category-color"
                    type="color"
                    value={quickCreateCategoryTypeData.color}
                    onChange={(e) =>
                      setQuickCreateCategoryTypeData({
                        ...quickCreateCategoryTypeData,
                        color: e.target.value,
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={quickCreateCategoryTypeData.color}
                    onChange={(e) =>
                      setQuickCreateCategoryTypeData({
                        ...quickCreateCategoryTypeData,
                        color: e.target.value,
                      })
                    }
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickCreateCategoryTypeOpen(false);
                setQuickCreateCategoryTypeData({
                  name: "",
                  display_name: "",
                  description: "",
                  icon: "",
                  color: "#6B7280",
                  sort_order: 0,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickCreateCategoryType}
              disabled={
                createCategoryTypeMutation.isPending ||
                !quickCreateCategoryTypeData.display_name
              }
            >
              {createCategoryTypeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// People Field Role Selector Component
const PeopleFieldRoleSelector = ({ selectedRoleIds, onChange }) => {
  const { data: rolesData, isLoading } = useRolesAll();
  // Handle both array and object response formats
  const roles = Array.isArray(rolesData)
    ? rolesData
    : rolesData?.roles || rolesData?.items || [];

  const handleRoleToggle = (roleId) => {
    const roleIdNum = typeof roleId === 'string' ? parseInt(roleId) : roleId;
    const currentIds = Array.isArray(selectedRoleIds) ? selectedRoleIds.map(r => typeof r === 'object' ? r.id : r) : [];
    
    if (currentIds.includes(roleIdNum)) {
      onChange(currentIds.filter(id => id !== roleIdNum));
    } else {
      onChange([...currentIds, roleIdNum]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading roles...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="max-h-48 overflow-auto border rounded-md p-2 space-y-1">
        {roles.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">No roles available</div>
        ) : (
          roles.map((role) => {
            const roleId = role.id;
            const isSelected = Array.isArray(selectedRoleIds) && selectedRoleIds.some(r => (typeof r === 'object' ? r.id : r) === roleId);
            return (
              <div key={roleId} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${roleId}`}
                  checked={isSelected}
                  onCheckedChange={() => handleRoleToggle(roleId)}
                />
                <Label htmlFor={`role-${roleId}`} className="cursor-pointer text-sm flex-1">
                  {role.display_name || role.name || `Role ${roleId}`}
                </Label>
              </div>
            );
          })
        )}
      </div>
      {selectedRoleIds && selectedRoleIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedRoleIds.length} role(s) selected
        </p>
      )}
    </div>
  );
};

export default EditFormPage;


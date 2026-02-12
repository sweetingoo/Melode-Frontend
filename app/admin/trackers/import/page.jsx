"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, FileSpreadsheet, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { trackersService } from "@/services/trackers";
import { useActiveTrackerCategories } from "@/hooks/useTrackerCategories";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { toast } from "sonner";

const FIELD_TYPES = [
  "text",
  "number",
  "date",
  "datetime",
  "textarea",
  "select",
  "boolean",
];

export default function ImportExcelTrackersPage() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [sheetsConfig, setSheetsConfig] = useState([]);
  const [importEntries, setImportEntries] = useState(true);
  const [openSheets, setOpenSheets] = useState({});

  const { data: trackerCategories = [] } = useActiveTrackerCategories();
  const { hasPermission } = usePermissionsCheck();
  const canCreate = hasPermission("tracker:create");

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.toLowerCase().endsWith(".xlsx") && !f.name.toLowerCase().endsWith(".xls")) {
        toast.error("Please select an Excel file (.xlsx)");
        return;
      }
      setFile(f);
      setAnalysis(null);
      setSheetsConfig([]);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      toast.error("Select an Excel file first");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await trackersService.analyzeExcelImport(file);
      setAnalysis(result);
      setSheetsConfig(
        (result.sheets || []).map((s) => ({
          sheet_name: s.sheet_name,
          tracker_name: s.tracker_name || s.sheet_name,
          category: s.category || null,
          columns: (s.columns || []).map((c) => ({
            col_index: c.col_index,
            col_letter: c.col_letter,
            header: c.header,
            field_id: c.field_id,
            label: c.label,
            type: c.type || "text",
            rag_rules: c.rag_rules || null,
            sample_values: c.sample_values,
          })),
        }))
      );
      setOpenSheets({});
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to analyze Excel";
      toast.error("Analysis failed", { description: typeof msg === "string" ? msg : JSON.stringify(msg) });
    } finally {
      setAnalyzing(false);
    }
  }, [file]);

  const updateSheet = (sheetIndex, updates) => {
    setSheetsConfig((prev) => {
      const next = [...prev];
      next[sheetIndex] = { ...next[sheetIndex], ...updates };
      return next;
    });
  };

  const updateColumn = (sheetIndex, colIndex, updates) => {
    setSheetsConfig((prev) => {
      const next = [...prev];
      const cols = [...(next[sheetIndex].columns || [])];
      cols[colIndex] = { ...cols[colIndex], ...updates };
      next[sheetIndex] = { ...next[sheetIndex], columns: cols };
      return next;
    });
  };

  const handleApply = useCallback(async () => {
    if (!file || !sheetsConfig.length) {
      toast.error("Analyze an Excel file first and ensure at least one sheet is configured");
      return;
    }
    setApplying(true);
    try {
      const config = {
        sheets: sheetsConfig.map((s) => ({
          sheet_name: s.sheet_name,
          tracker_name: s.tracker_name || s.sheet_name,
          category: s.category === "__none__" || s.category === "" ? null : s.category,
          columns: (s.columns || []).map((c) => ({
            col_index: c.col_index,
            col_letter: c.col_letter,
            header: c.header,
            field_id: c.field_id,
            label: c.label,
            type: c.type || "text",
            rag_rules: c.rag_rules || null,
          })),
        })),
        import_entries: importEntries,
      };
      const result = await trackersService.applyExcelImport(file, config);
      const created = result?.created || [];
      toast.success(
        `Created ${created.length} tracker(s)${importEntries ? ` with ${created.reduce((a, b) => a + (b.entries_created || 0), 0)} entries` : ""}`
      );
      setAnalysis(null);
      setSheetsConfig([]);
      setFile(null);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to create trackers";
      toast.error("Import failed", { description: typeof msg === "string" ? msg : JSON.stringify(msg) });
    } finally {
      setApplying(false);
    }
  }, [file, sheetsConfig, importEntries]);

  if (!canCreate) {
    return (
      <div className="container max-w-4xl py-6">
        <p className="text-muted-foreground">You do not have permission to import trackers.</p>
        <Link href="/admin/trackers">
          <Button variant="link" className="mt-2 px-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/trackers/manage">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Import trackers from Excel</h1>
          <p className="text-muted-foreground text-sm">
            Upload an Excel file with one or more sheets. Each sheet becomes a tracker. We will suggest field types and
            RAG rules; you can edit them before creating.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Step 1: Upload and analyze
          </CardTitle>
          <CardDescription>Select an Excel file (.xlsx). We will read all sheets and suggest field mappings and RAG.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="excel-file">Excel file</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={!file || analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && sheetsConfig.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Review and edit</CardTitle>
              <CardDescription>
                File: {analysis.filename}. Edit tracker names, categories, and field types. RAG rules are suggested for
                numeric and categorical columns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="import-entries"
                  checked={importEntries}
                  onCheckedChange={(v) => setImportEntries(!!v)}
                />
                <Label htmlFor="import-entries">Import data rows as tracker entries</Label>
              </div>

              {sheetsConfig.map((sheet, sheetIndex) => (
                <Collapsible
                  key={sheet.sheet_name}
                  open={openSheets[sheet.sheet_name] !== false}
                  onOpenChange={(open) => setOpenSheets((p) => ({ ...p, [sheet.sheet_name]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>
                        {sheet.sheet_name} — {sheet.columns?.length || 0} columns
                        {analysis.sheets?.[sheetIndex]?.row_count != null && (
                          <span className="text-muted-foreground font-normal ml-2">
                            ({analysis.sheets[sheetIndex].row_count} rows)
                          </span>
                        )}
                      </span>
                      {openSheets[sheet.sheet_name] !== false ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tracker name</Label>
                        <Input
                          value={sheet.tracker_name || ""}
                          onChange={(e) => updateSheet(sheetIndex, { tracker_name: e.target.value })}
                          placeholder="Tracker name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={sheet.category ?? "__none__"}
                          onValueChange={(v) => updateSheet(sheetIndex, { category: v === "__none__" ? null : v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="No category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No category</SelectItem>
                            {trackerCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.display_name || cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Field ID</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[140px]">RAG</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(sheet.columns || []).map((col, colIndex) => (
                            <TableRow key={col.col_index}>
                              <TableCell className="font-mono text-muted-foreground">
                                {col.col_letter || col.col_index}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={col.field_id || ""}
                                  onChange={(e) => updateColumn(sheetIndex, colIndex, { field_id: e.target.value })}
                                  className="h-8 font-mono text-sm"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={col.label || ""}
                                  onChange={(e) => updateColumn(sheetIndex, colIndex, { label: e.target.value })}
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={col.type || "text"}
                                  onValueChange={(v) => updateColumn(sheetIndex, colIndex, { type: v })}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FIELD_TYPES.map((t) => (
                                      <SelectItem key={t} value={t}>
                                        {t}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {col.rag_rules ? (
                                  <span title={JSON.stringify(col.rag_rules)}>
                                    Red/Amber/Green
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Create trackers</CardTitle>
              <CardDescription>
                Create one tracker per sheet with the configuration above. You can go back to Trackers to edit fields
                or add more after import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleApply} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  `Create ${sheetsConfig.length} tracker(s)`
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {analysis && (!sheetsConfig.length || !analysis.sheets?.length) && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No sheets found in the file or no columns to import.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

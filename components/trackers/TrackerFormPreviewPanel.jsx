"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import { cn } from "@/lib/utils";
import { filterNonEmptyGridColumns, gridRowFieldIdsFlat, normalizeGridRowColumns, trackerGridRowColsClass } from "@/utils/trackerGridLayout";

const mapFieldToMapped = (field) => {
  const fieldId = field.id || field.name || field.field_id;
  return {
    ...field,
    type: field.type || field.field_type,
    field_label: field.label || field.field_label || field.name,
    field_name: field.name || field.id,
    id: fieldId,
    field_type: field.type || field.field_type,
    is_required: field.required || field.is_required,
  };
};

/** Structural preview only: always show groups/fields/rows (ignore conditional visibility). */
function PreviewSectionBody({ section, fields }) {
  const displayData = {};
  const sectionFieldIds = (section.fields || []).length > 0 ? section.fields || [] : null;
  const sectionFields = sectionFieldIds
    ? fields.filter((f) => sectionFieldIds.includes(f.id || f.name || f.field_id))
    : fields.filter((f) => f.section === section.id);
  const allSectionFields = sectionFields;
  const groups = Array.isArray(section.groups) ? section.groups : [];
  const previewTableRadioCtx = {
    groups,
    sectionFields: allSectionFields,
    entryData: displayData,
  };

  if (groups.length === 0) {
    return (
      <div className="space-y-3">
        {sectionFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fields in this stage.</p>
        ) : (
          sectionFields.map((field) => {
            const fieldId = field.id || field.name || field.field_id;
            return (
              <div key={fieldId} className="space-y-1">
                <CustomFieldRenderer
                  field={mapFieldToMapped(field)}
                  value={displayData[fieldId]}
                  otherTextValue={displayData[`${fieldId}_other`]}
                  readOnly
                  sectionLayoutContext={previewTableRadioCtx}
                />
              </div>
            );
          })
        )}
      </div>
    );
  }

  const fieldIdsInGroups = new Set(
    groups.flatMap((g) => [
      ...(g.fields || []),
      ...(g.table_rows || []).flatMap((row) => (row.cells || []).map((c) => c.field_id).filter(Boolean)),
      ...(g.grid_rows || []).flatMap((row) => gridRowFieldIdsFlat(row)),
    ]),
  );
  const ungroupedFields = sectionFields.filter((f) => !fieldIdsInGroups.has(f.id || f.field_id || f.name));

  const tableRadioBoundGroupIds = new Set(
    allSectionFields
      .filter((f) => (f.type || f.field_type) === "table_radio" && f.field_options?.table_group_id)
      .map((f) => String(f.field_options.table_group_id)),
  );

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const layoutG = (group.layout || "stack").toLowerCase();
        if (layoutG === "table" && group.id && tableRadioBoundGroupIds.has(String(group.id))) {
          return null;
        }
        const fromTable = (group.table_rows || []).flatMap((row) => (row.cells || []).map((c) => c.field_id).filter(Boolean));
        const fromGrid = (group.grid_rows || []).flatMap((row) => gridRowFieldIdsFlat(row));
        const groupFieldIds = [...new Set([...(group.fields || []), ...fromTable, ...fromGrid])];
        const groupFields = groupFieldIds
          .map((fid) => sectionFields.find((f) => String(f.id || f.field_id || f.name) === String(fid)))
          .filter(Boolean);
        const layout = (group.layout || "stack").toLowerCase();
        const hasTableStructure = Array.isArray(group.table_columns) && group.table_columns.length > 0;
        const tableRowsForGroup = Array.isArray(group.table_rows) ? group.table_rows : [];
        const isTable = layout === "table" && (hasTableStructure || tableRowsForGroup.length > 0);
        const gridRows =
          group.grid_rows && group.grid_rows.length > 0
            ? group.grid_rows
            : group.grid_columns
              ? [{ ...group.grid_columns }]
              : [];
        const isGrid = layout === "grid" && gridRows.length > 0;
        const getFieldById = (fid) =>
          groupFields.find((f) => String(f.id || f.name || f.field_id) === String(fid)) ??
          allSectionFields.find((f) => String(f.id || f.name || f.field_id) === String(fid));

        if (!isTable && !isGrid && groupFields.length === 0) return null;
        if (isTable && tableRowsForGroup.length === 0 && !hasTableStructure) return null;
        if (isGrid && gridRows.length === 0) return null;

        const groupLabel = group.label || group.title || group.name || "";

        return (
          <div key={group.id || group.label || "g"} className="space-y-2">
            {groupLabel ? (
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{groupLabel}</h4>
            ) : null}
            {isTable ? (
              (() => {
                const tableCols =
                  Array.isArray(group.table_columns) && group.table_columns.length > 0
                    ? group.table_columns
                    : [{ id: "col_1", label: "" }];
                const rows =
                  tableRowsForGroup.length > 0
                    ? tableRowsForGroup
                    : [{ cells: tableCols.map(() => ({ text: "", field_id: null })) }];
                return (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {tableCols.map((col) => (
                            <th key={col.id} className="text-left font-medium p-2">
                              {String(col?.label ?? "").trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, originalIdx) => {
                          const cells = (row.cells || []).slice(0, tableCols.length);
                          while (cells.length < tableCols.length) cells.push({ text: "", field_id: null });
                          return (
                            <tr key={originalIdx} className="border-b last:border-b-0">
                              {cells.map((cell, cIdx) => {
                                const fieldId = cell.field_id ? String(cell.field_id) : null;
                                const field = fieldId ? getFieldById(fieldId) : null;
                                if (!field && !cell.text) return <td key={cIdx} className="p-2" />;
                                const rawVal = fieldId != null ? displayData[fieldId] : undefined;
                                const rawOther = fieldId != null ? displayData[`${fieldId}_other`] : undefined;
                                const cellValue = Array.isArray(rawVal) ? rawVal[originalIdx] : rawVal;
                                const cellOtherValue = Array.isArray(rawOther) ? rawOther[originalIdx] : rawOther;
                                return (
                                  <td key={cIdx} className="p-2 align-top">
                                    <div className="space-y-1">
                                      {cell.text ? (
                                        <span className="text-muted-foreground text-xs block">{cell.text}</span>
                                      ) : null}
                                      {field ? (
                                        <CustomFieldRenderer
                                          field={mapFieldToMapped(field)}
                                          value={cellValue}
                                          otherTextValue={cellOtherValue}
                                          readOnly
                                          sectionLayoutContext={previewTableRadioCtx}
                                        />
                                      ) : null}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            ) : isGrid ? (
              <div className="space-y-4">
                {gridRows.map((gridRow, rowIdx) => {
                  const colIds = normalizeGridRowColumns(gridRow);
                  const colFields = filterNonEmptyGridColumns(colIds.map((ids) => ids.map((fid) => getFieldById(fid)).filter(Boolean)));
                  if (colFields.length === 0) return null;
                  const rowTitle = gridRow.label || gridRow.title;
                  const renderPreviewField = (field) => {
                    const fieldId = field.id || field.name || field.field_id;
                    return (
                      <div
                        key={fieldId}
                        className={cn(
                          ["text_block", "image_block", "image_free_draw", "youtube_video_embed"].includes(
                            (field.type || field.field_type || "").toLowerCase()
                          ) && "sm:col-span-2"
                        )}
                      >
                        <CustomFieldRenderer
                          field={mapFieldToMapped(field)}
                          value={displayData[fieldId]}
                          otherTextValue={displayData[`${fieldId}_other`]}
                          readOnly
                          sectionLayoutContext={previewTableRadioCtx}
                        />
                      </div>
                    );
                  };
                  return (
                    <div key={`row-${rowIdx}`} className="space-y-3">
                      {rowTitle ? (
                        <h4 className="text-sm font-medium text-foreground border-b pb-1">{rowTitle}</h4>
                      ) : null}
                      <div className={trackerGridRowColsClass(colFields.length)}>
                        {colFields.map((fields, colIdx) => (
                          <div key={colIdx} className="space-y-2">
                            {fields.map((field) => renderPreviewField(field))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={layout === "stack" ? "space-y-3" : "grid grid-cols-1 gap-x-4 gap-y-3"}>
                {groupFields.map((field) => {
                  const fieldId = field.id || field.name || field.field_id;
                  return (
                    <div
                      key={fieldId}
                      className={cn(
                        "space-y-1",
                        ["text_block", "image_block", "image_free_draw", "youtube_video_embed"].includes(
                          (field.type || field.field_type || "").toLowerCase()
                        ) && "md:col-span-2"
                      )}
                    >
                      <CustomFieldRenderer
                        field={mapFieldToMapped(field)}
                        value={displayData[fieldId]}
                        otherTextValue={displayData[`${fieldId}_other`]}
                        readOnly
                        sectionLayoutContext={previewTableRadioCtx}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {ungroupedFields.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-dashed">
          {ungroupedFields.map((field) => {
            const fieldId = field.id || field.name || field.field_id;
            return (
              <div key={fieldId} className="space-y-1">
                <CustomFieldRenderer
                  field={mapFieldToMapped(field)}
                  value={displayData[fieldId]}
                  otherTextValue={displayData[`${fieldId}_other`]}
                  readOnly
                  sectionLayoutContext={previewTableRadioCtx}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Read-only form layout preview for tracker edit (draft fields + sections).
 */
export function TrackerFormPreviewPanel({ fields, sections, stageMapping, useStages }) {
  const useStagesEffective = useStages !== false;
  const wizardSteps =
    useStagesEffective && stageMapping?.length > 0
      ? stageMapping
      : useStagesEffective && sections?.length > 0
        ? sections
        : [];

  const flatFields = useMemo(() => (Array.isArray(fields) ? fields : []), [fields]);
  const secList = useMemo(() => (Array.isArray(sections) ? sections : []), [sections]);

  if (flatFields.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add fields to see a preview.</p>
        </CardContent>
      </Card>
    );
  }

  if (wizardSteps.length > 0 && secList.length > 0) {
    return (
      <div className="space-y-3">
        {secList.map((section, index) => {
          const linkedStage = stageMapping?.[index];
          const stageName = linkedStage?.stage ?? linkedStage?.name ?? null;
          const title = stageName || section.label || section.title || section.id || `Stage ${index + 1}`;
          return (
            <Card key={section.id || index} className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base leading-tight">{title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <PreviewSectionBody section={section} fields={flatFields} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">Preview</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-1 gap-3">
          {flatFields.map((field) => {
            const fieldId = field.id || field.name || field.field_id;
            return (
              <div key={fieldId} className="space-y-1">
                <CustomFieldRenderer
                  field={mapFieldToMapped(field)}
                  value={undefined}
                  otherTextValue={undefined}
                  readOnly
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

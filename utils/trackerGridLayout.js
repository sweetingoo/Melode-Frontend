/**
 * Tracker grid row layout: each row has an ordered list of columns; each column holds field ids (stacked in that cell).
 * Legacy rows used left / center / right / far_right — we normalize those to `columns` when reading.
 */

const MAX_GRID_COLUMNS = 24;

/**
 * @param {Record<string, unknown>} row - grid row from tracker config
 * @returns {string[][]} Non-empty column arrays (each inner array is field ids for that column)
 */
export function normalizeGridRowColumns(row) {
  if (!row || typeof row !== "object") return [[], [], []];

  if (Array.isArray(row.columns) && row.columns.length > 0) {
    const cols = row.columns
      .slice(0, MAX_GRID_COLUMNS)
      .map((col) => (Array.isArray(col) ? col.map(String).filter(Boolean) : []));
    return cols.length > 0 ? cols : [[], [], []];
  }

  const l = [...(row.left || [])].map(String);
  const c = [...(row.center || [])].map(String);
  const r = [...(row.right || [])].map(String);
  const fr = [...(row.far_right || [])].map(String);
  if (fr.length) return [l, c, r, fr];
  return [l, c, r];
}

/** All field ids used in a grid row (flat). */
export function gridRowFieldIdsFlat(row) {
  return normalizeGridRowColumns(row).flat();
}

/**
 * Persistable row: prefer `columns`, omit legacy keys so we do not double-count in normalize.
 * @param {Record<string, unknown>} row
 * @param {string[][]} columns
 */
export function gridRowWithColumnsOnly(row, columns) {
  const { left: _l, center: _c, right: _r, far_right: _fr, ...rest } = row || {};
  return {
    ...rest,
    columns: columns.map((col) => [...col]),
  };
}

/** Responsive Tailwind classes for a grid row with N parallel columns (field stacks). */
const GRID_ROW_COLS_CLASS = {
  1: "grid grid-cols-1 gap-4",
  2: "grid grid-cols-1 md:grid-cols-2 gap-4",
  3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  5: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4",
  6: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4",
  7: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4",
  8: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4",
  9: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-4",
  10: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-4",
  11: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-11 gap-4",
  12: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-4",
};

export function trackerGridRowColsClass(columnCount) {
  const n = Math.min(Math.max(Math.floor(columnCount), 1), 24);
  if (n > 12) {
    return "grid gap-4 grid-flow-col auto-cols-[minmax(10rem,1fr)] overflow-x-auto pb-1 w-full";
  }
  return GRID_ROW_COLS_CLASS[n] || GRID_ROW_COLS_CLASS[12];
}

/** Drop columns with nothing to show (empty builder slot or no fields left after visibility). */
export function filterNonEmptyGridColumns(columnFieldArrays) {
  if (!Array.isArray(columnFieldArrays)) return [];
  return columnFieldArrays.filter((col) => Array.isArray(col) && col.length > 0);
}

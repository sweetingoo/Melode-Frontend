/**
 * Path segment for PUT /clock/records/{segment} (slug preferred; numeric id supported by API).
 * Handles snake_case, camelCase, and nested clock_record objects from various API shapes.
 */
export function resolveClockRecordPathKey(row) {
  if (!row || typeof row !== "object") return null;

  const slugCandidates = [
    row.slug,
    row.clock_record_slug,
    row.clockRecordSlug,
    row.clock_record?.slug,
  ];
  for (const c of slugCandidates) {
    if (c != null && String(c).trim() !== "" && String(c) !== "undefined") {
      return String(c).trim();
    }
  }

  const idCandidates = [row.clock_record_id, row.clockRecordId, row.clock_record?.id];
  for (const c of idCandidates) {
    if (c != null && c !== "" && String(c) !== "undefined") {
      return String(c);
    }
  }

  return null;
}

/** Normalize one row from GET /clock/active so the UI always has clock_record_id / slug when the API sends variants. */
export function normalizeManagerActiveClockRow(row) {
  if (!row || typeof row !== "object") return row;
  const clock_record_id = row.clock_record_id ?? row.clockRecordId ?? row.clock_record?.id;
  const slug = row.slug ?? row.clock_record_slug ?? row.clockRecordSlug ?? row.clock_record?.slug;
  return {
    ...row,
    ...(clock_record_id !== undefined && clock_record_id !== null ? { clock_record_id } : {}),
    ...(slug !== undefined && slug !== null && slug !== "" ? { slug } : {}),
  };
}

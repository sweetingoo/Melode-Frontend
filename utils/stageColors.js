/**
 * Stage colour palette and helper for timeline and list.
 * Used when stage_mapping[].color is set in Tracker Admin (Edit tracker → Stages).
 */
export const STAGE_COLOR_PALETTE = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#0ea5e9", label: "Sky" },
  { value: "#f97316", label: "Orange" },
  { value: "#64748b", label: "Slate" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#ef4444", label: "Red" },
];

/**
 * @param {Array<{ stage?: string, name?: string, color?: string }>} stageMapping
 * @param {string} stageName
 * @returns {string | null} hex color or null
 */
export function getStageColor(stageMapping, stageName) {
  if (!stageName || !Array.isArray(stageMapping)) return null;
  const name = String(stageName).trim();
  const item = stageMapping.find(
    (s) => String(s?.stage ?? s?.name ?? "").trim() === name
  );
  return item?.color && /^#[0-9a-fA-F]{6}$/.test(item.color) ? item.color : null;
}

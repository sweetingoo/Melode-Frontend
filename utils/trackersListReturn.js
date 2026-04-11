/**
 * Persist /admin/trackers list URL (including query) so entry detail "Back" restores filters.
 */
export const TRACKERS_LIST_RETURN_STORAGE_KEY = "melode_admin_trackers_list_return_v1";

/** Only the main list route with optional search — not /entries/, /manage/, /import/, /[slug]/edit. */
export function isValidTrackersListReturnPath(path) {
  if (typeof path !== "string" || !path.startsWith("/admin/trackers")) return false;
  if (path.includes("/entries/")) return false;
  const after = path.slice("/admin/trackers".length);
  if (after === "" || after.startsWith("?")) return true;
  return false;
}

export function getTrackersListReturnHrefFromStorage() {
  if (typeof window === "undefined") return "/admin/trackers";
  try {
    const raw = sessionStorage.getItem(TRACKERS_LIST_RETURN_STORAGE_KEY);
    if (raw && isValidTrackersListReturnPath(raw)) return raw;
  } catch (_) {
    /* ignore */
  }
  return "/admin/trackers";
}

export function persistTrackersListUrl(pathname, searchWithQuestionMark) {
  if (typeof window === "undefined") return;
  if (pathname !== "/admin/trackers") return;
  const q = searchWithQuestionMark && searchWithQuestionMark.startsWith("?") ? searchWithQuestionMark : "";
  const full = `/admin/trackers${q}`;
  try {
    sessionStorage.setItem(TRACKERS_LIST_RETURN_STORAGE_KEY, full);
  } catch (_) {
    /* ignore */
  }
}

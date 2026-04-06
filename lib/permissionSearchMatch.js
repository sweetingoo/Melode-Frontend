/**
 * UI "calendar" → DB resource "event". Match "calendar" or a prefix (e.g. cal, cale, calen).
 */
function searchMapsToEventCalendarResource(q) {
  if (q.length < 2) return false;
  if (q.includes("calendar")) return true;
  return q.length >= 3 && "calendar".startsWith(q);
}

export function permissionMatchesSearch(permission, rawSearch) {
  const q = String(rawSearch ?? "").trim().toLowerCase();
  if (!q) return true;

  if (typeof permission === "string") {
    const s = permission.toLowerCase();
    if (s.includes(q)) return true;
    if (searchMapsToEventCalendarResource(q) && s.startsWith("event:")) return true;
    return false;
  }

  const p = permission || {};
  const parts = [
    p.name,
    p.display_name,
    p.permission,
    p.slug,
    p.resource,
    p.action,
    p.description,
  ]
    .filter((x) => x != null && x !== "")
    .map((x) => String(x).toLowerCase());

  if (parts.some((s) => s.includes(q))) return true;

  if (searchMapsToEventCalendarResource(q)) {
    const resource = String(p.resource ?? "").toLowerCase();
    if (resource === "event") return true;
    const slug = String(p.permission ?? p.name ?? p.slug ?? "").toLowerCase();
    if (slug.startsWith("event:")) return true;
  }

  return false;
}

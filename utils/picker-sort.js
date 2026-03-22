/**
 * Shared A–Z ordering for role / department / user pickers (dropdowns).
 * Paginated admin tables pass `page` in API params — hooks skip sorting in that case.
 */

/** @param {string} s */
function norm(s) {
  return (s == null ? "" : String(s)).trim().toLowerCase();
}

// --- Departments ---

export function normalizeDepartmentsList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    if (Array.isArray(data.departments)) return data.departments;
    if (Array.isArray(data.data)) return data.data;
  }
  return [];
}

export function sortDepartmentsForPicker(list) {
  const arr = normalizeDepartmentsList(list);
  return [...arr].sort((a, b) => {
    const la = norm(a.display_name || a.name || a.code || a.slug);
    const lb = norm(b.display_name || b.name || b.code || b.slug);
    return la.localeCompare(lb, undefined, { sensitivity: "base" });
  });
}

/** Keep pagination metadata; sort only `departments` array when present. */
export function sortDepartmentsResponse(data) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return sortDepartmentsForPicker(data);
  if (Array.isArray(data.departments)) {
    return { ...data, departments: sortDepartmentsForPicker(data.departments) };
  }
  return data;
}

// --- Users (surname A–Z, then first name) ---

export function userPickerSortKey(user) {
  if (!user) return "";
  const last = norm(user.last_name);
  const first = norm(user.first_name);
  if (last || first) {
    return `${last}\u0000${first}`;
  }
  const display = norm(user.display_name);
  if (display) return display;
  return norm(user.email || user.username || (user.id != null ? `id-${user.id}` : ""));
}

export function sortUsersBySurname(users) {
  if (!Array.isArray(users)) return users;
  return [...users].sort((a, b) =>
    userPickerSortKey(a).localeCompare(userPickerSortKey(b), undefined, { sensitivity: "base" })
  );
}

export function sortUsersListResponse(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.users)) return data;
  return { ...data, users: sortUsersBySurname(data.users) };
}

/**
 * User-facing labels for attendance/leave categories.
 * Internal API values (attendance, provisional, mapped) stay the same; only display names change.
 */
export const CATEGORY_LABELS = {
  attendance: "Attended",
  provisional: "Allocated",
  mapped: "Required",
  authorised_leave: "Authorised Leave",
  unauthorised_leave: "Unauthorised Leave",
};

/** Short descriptions for tooltips / inline help */
export const CATEGORY_DESCRIPTIONS = {
  mapped:
    "A shift that needs filling (e.g. 2 Receptionists needed Monday 5pm–10pm).",
  provisional:
    "A shift that covers a Required slot (e.g. Paul has agreed to cover 1 Receptionist shift Monday 5pm–10pm).",
  attendance:
    "Time actually worked. If linked to an Allocated shift, start/end times track lateness or early finish (e.g. Paul started 5.05pm, finished 9.55pm).",
  authorised_leave:
    "Paid leave. Reduces the hours needed to work that week/month (e.g. 176h/month with 1 day leave = 168.5h needed for full pay).",
  unauthorised_leave:
    "Unpaid leave. Does not reduce the hours needed to work.",
};

export function getCategoryLabel(value) {
  if (value == null || value === "") return "";
  return CATEGORY_LABELS[value] ?? value;
}

export function getCategoryDescription(value) {
  if (value == null || value === "") return "";
  return CATEGORY_DESCRIPTIONS[value] ?? "";
}

/** Category options for dropdowns (value + display label) */
export const ATTENDANCE_CATEGORY_OPTIONS = [
  { value: "attendance", label: CATEGORY_LABELS.attendance },
  { value: "authorised_leave", label: CATEGORY_LABELS.authorised_leave },
  { value: "unauthorised_leave", label: CATEGORY_LABELS.unauthorised_leave },
  { value: "provisional", label: CATEGORY_LABELS.provisional },
  { value: "mapped", label: CATEGORY_LABELS.mapped },
];

/** Report column headers for hour fields */
export const REPORT_HOUR_LABELS = {
  attendance_hours: "Attended (h)",
  provisional_hours: "Allocated (h)",
  mapped_hours: "Required (h)",
};

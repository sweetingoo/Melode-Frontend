import { redirect } from "next/navigation";

/** Legacy URL; event types live under Settings → Event Types. */
export default function LegacyEventCategoriesPage() {
  redirect("/admin/settings/event-types");
}

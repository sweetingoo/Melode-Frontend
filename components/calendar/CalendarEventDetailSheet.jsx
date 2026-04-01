"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Loader2, Pencil, Trash2 } from "lucide-react";
import CommentThread from "@/components/CommentThread";
import {
  useCalendarEvent,
  useCalendarEventRsvps,
  useDeleteCalendarEvent,
  usePatchRsvpAttended,
  useSelfEventRsvp,
} from "@/hooks/useCalendarEvents";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { toast } from "sonner";
import { CalendarEventEditDialog } from "@/components/calendar/CalendarEventEditDialog";

export function CalendarEventDetailSheet({ slug, open, onOpenChange }) {
  const { hasPermission } = usePermissionsCheck();
  const canUpdate = hasPermission("event:update");
  const canDelete = hasPermission("event:delete");

  const { data: event, isLoading } = useCalendarEvent(slug, open && !!slug);
  const { data: rsvps = [] } = useCalendarEventRsvps(slug, open && !!slug);
  const selfRsvpMutation = useSelfEventRsvp();
  const patchAttendedMutation = usePatchRsvpAttended();
  const deleteMutation = useDeleteCalendarEvent();
  const [editOpen, setEditOpen] = useState(false);

  const copyPublicLink = (token) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/events/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto gap-0 p-6 pt-5">
        {!slug ? null : isLoading || !event ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading event…</p>
          </div>
        ) : (
          <>
            <SheetHeader className="p-0 pr-10">
              <SheetTitle>{event.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-5 space-y-4 text-sm pb-2">
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description || "—"}</p>
              {event.category?.name ? (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-sm border"
                    style={{ backgroundColor: event.category.color || "#6366f1" }}
                  />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Category:</strong> {event.category.name}
                  </span>
                </div>
              ) : null}
              <div>
                <div>
                  <strong>When:</strong> {format(new Date(event.starts_at), "PPpp")} – {format(new Date(event.ends_at), "p")}
                </div>
                <div className="capitalize mt-1">
                  <strong>Where:</strong> {event.location_mode}
                  {event.location_detail_text ? ` — ${event.location_detail_text}` : ""}
                </div>
                {event.online_meeting_url ? (
                  <a
                    href={event.online_meeting_url}
                    className="text-primary underline block mt-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join online
                  </a>
                ) : null}
              </div>
              {event.public_token ? (
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => copyPublicLink(event.public_token)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy public RSVP link
                  </Button>
                </div>
              ) : null}
              {canUpdate && (
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit event
                  </Button>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Your RSVP</h4>
                <div className="flex flex-wrap gap-2">
                  {["attending", "maybe", "declined"].map((r) => (
                    <Button
                      key={r}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => selfRsvpMutation.mutate({ slug, data: { response: r } })}
                      disabled={selfRsvpMutation.isPending}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              {canUpdate && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Attendance (staff)</h4>
                    <ul className="space-y-2">
                      {rsvps.map((row) => (
                        <li key={row.id} className="flex items-center justify-between gap-2 border rounded-md px-2 py-1">
                          <span className="truncate">
                            {row.user_display_name || row.guest_name || `User #${row.user_id}`}
                            <span className="text-muted-foreground ml-2">({row.response})</span>
                          </span>
                          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                            <Checkbox
                              checked={row.attended}
                              onCheckedChange={(c) =>
                                patchAttendedMutation.mutate({ slug, rsvpId: row.id, attended: !!c })
                              }
                            />
                            Attended
                          </label>
                        </li>
                      ))}
                    </ul>
                    {rsvps.length === 0 ? <p className="text-muted-foreground text-xs">No RSVPs yet.</p> : null}
                  </div>
                </>
              )}

              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (confirm("Delete this event?")) {
                      deleteMutation.mutate(slug, { onSuccess: () => onOpenChange(false) });
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete event
                </Button>
              )}

              <Separator />

              <CommentThread entityType="calendar_event" entitySlug={event.slug} />
            </div>
            <CalendarEventEditDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

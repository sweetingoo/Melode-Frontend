"use client";

import React, { useMemo, useState } from "react";
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

function formatRsvpResponse(response) {
  if (response == null || response === "") return "No response yet";
  const key = String(response).toLowerCase();
  const labels = {
    attending: "Attending",
    declined: "Declined",
    maybe: "Maybe",
    pending: "Pending",
  };
  return labels[key] || String(response);
}

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

  const invitedUserRows = useMemo(() => {
    const invites = (event?.invites || []).filter((i) => i.user_id != null);
    const rsvpByUserId = new Map(
      (rsvps || []).filter((r) => r.user_id != null).map((r) => [r.user_id, r])
    );
    return invites.map((inv) => ({
      key: `invite-user-${inv.user_id}`,
      label: inv.user_display_name || (inv.user_slug ? inv.user_slug : `User #${inv.user_id}`),
      rsvp: rsvpByUserId.get(inv.user_id) ?? null,
    }));
  }, [event?.invites, rsvps]);

  const rsvpUserIdsFromInvites = useMemo(() => {
    return new Set((event?.invites || []).filter((i) => i.user_id != null).map((i) => i.user_id));
  }, [event?.invites]);

  /** RSVPs from users who were not listed as individually invited (e.g. responded via role or edge cases). */
  const extraUserRsvps = useMemo(() => {
    return (rsvps || []).filter(
      (r) => r.user_id != null && !rsvpUserIdsFromInvites.has(r.user_id)
    );
  }, [rsvps, rsvpUserIdsFromInvites]);

  const guestRsvps = useMemo(() => {
    return (rsvps || []).filter((r) => !r.user_id && (r.guest_name || r.guest_email));
  }, [rsvps]);

  const roleInvites = useMemo(() => {
    return (event?.invites || []).filter((i) => i.role_id != null && i.user_id == null);
  }, [event?.invites]);

  const hasAnyInvitesOrRsvps =
    invitedUserRows.length > 0 ||
    roleInvites.length > 0 ||
    extraUserRsvps.length > 0 ||
    guestRsvps.length > 0;

  const copyPublicLink = (token) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/events/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby={undefined}
        className="w-full sm:max-w-lg overflow-y-auto gap-0 p-6 pt-5"
      >
        {!slug ? (
          <SheetHeader className="sr-only">
            <SheetTitle>Event details</SheetTitle>
          </SheetHeader>
        ) : isLoading || !event ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Event details</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Loading event…</p>
            </div>
          </>
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
                    <strong className="text-foreground">Type:</strong> {event.category.name}
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

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Invites and responses</h4>

                {!hasAnyInvitesOrRsvps ? (
                  <p className="text-muted-foreground text-xs">None yet.</p>
                ) : (
                  <>
                    {invitedUserRows.length > 0 ? (
                      <ul className="space-y-2">
                        {invitedUserRows.map((row) => (
                          <li
                            key={row.key}
                            className="flex flex-wrap items-center justify-between gap-2 border rounded-md px-2 py-1.5"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-medium truncate block">{row.label}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatRsvpResponse(row.rsvp?.response)}
                              </span>
                            </div>
                            {canUpdate && row.rsvp ? (
                              <label className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
                                <Checkbox
                                  checked={row.rsvp.attended}
                                  onCheckedChange={(c) =>
                                    patchAttendedMutation.mutate({
                                      slug,
                                      rsvpId: row.rsvp.id,
                                      attended: !!c,
                                    })
                                  }
                                />
                                Attended
                              </label>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {extraUserRsvps.length > 0 ? (
                      <div className={invitedUserRows.length ? "mt-4" : ""}>
                        <p className="text-xs font-medium text-foreground mb-2">Other responses</p>
                        <ul className="space-y-2">
                          {extraUserRsvps.map((row) => (
                            <li
                              key={row.id}
                              className="flex flex-wrap items-center justify-between gap-2 border rounded-md px-2 py-1.5"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-medium truncate block">
                                  {row.user_display_name || `User #${row.user_id}`}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {formatRsvpResponse(row.response)}
                                </span>
                              </div>
                              {canUpdate ? (
                                <label className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
                                  <Checkbox
                                    checked={row.attended}
                                    onCheckedChange={(c) =>
                                      patchAttendedMutation.mutate({
                                        slug,
                                        rsvpId: row.id,
                                        attended: !!c,
                                      })
                                    }
                                  />
                                  Attended
                                </label>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {guestRsvps.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-foreground mb-2">Guest RSVPs (public link)</p>
                        <ul className="space-y-2">
                          {guestRsvps.map((row) => (
                            <li
                              key={row.id}
                              className="flex flex-wrap items-center justify-between gap-2 border rounded-md px-2 py-1.5"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-medium truncate block">
                                  {row.guest_name || "Guest"}
                                  {row.guest_email ? (
                                    <span className="text-muted-foreground font-normal"> · {row.guest_email}</span>
                                  ) : null}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {formatRsvpResponse(row.response)}
                                </span>
                              </div>
                              {canUpdate ? (
                                <label className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
                                  <Checkbox
                                    checked={row.attended}
                                    onCheckedChange={(c) =>
                                      patchAttendedMutation.mutate({
                                        slug,
                                        rsvpId: row.id,
                                        attended: !!c,
                                      })
                                    }
                                  />
                                  Attended
                                </label>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

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

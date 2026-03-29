"use client";

import React, { useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  useCalendarEventsList,
  useCreateCalendarEvent,
  useCalendarEventRsvps,
  useDeleteCalendarEvent,
  usePatchRsvpAttended,
  useSelfEventRsvp,
} from "@/hooks/useCalendarEvents";
import { useLocations } from "@/hooks/useLocations";
import { useRolesAll } from "@/hooks/useRoles";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { calendarEventsService } from "@/services/calendarEvents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CommentThread from "@/components/CommentThread";
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function toIso(d) {
  return d.toISOString();
}

/** Week starts Sunday (US-style grid). */
const WEEK_OPTIONS = { weekStartsOn: 0 };

function eventIntersectsDay(ev, day) {
  const s = new Date(ev.starts_at);
  const e = new Date(ev.ends_at);
  return s <= endOfDay(day) && e >= startOfDay(day);
}

function eventsForDay(events, day) {
  return events
    .filter((ev) => eventIntersectsDay(ev, day))
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
}

export default function CalendarPage() {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const { hasPermission } = usePermissionsCheck();
  const canCreate = hasPermission("event:create");
  const canUpdate = hasPermission("event:update");
  const canDelete = hasPermission("event:delete");

  const range = useMemo(() => {
    const s = startOfMonth(viewMonth);
    const e = endOfMonth(viewMonth);
    return { start: toIso(s), end: toIso(e) };
  }, [viewMonth]);

  const { data: listData, isLoading } = useCalendarEventsList({
    start: range.start,
    end: range.end,
    per_page: 100,
  });

  const { data: locations = [] } = useLocations({ per_page: 200 });
  const { data: roles = [] } = useRolesAll(50);

  const createMutation = useCreateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();
  const selfRsvpMutation = useSelfEventRsvp();
  const patchAttendedMutation = usePatchRsvpAttended();
  const { data: rsvps = [] } = useCalendarEventRsvps(selectedSlug, !!selectedSlug);

  const events = listData?.events || [];

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, WEEK_OPTIONS);
    const gridEnd = endOfWeek(monthEnd, WEEK_OPTIONS);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth]);

  const weekdayLabels = useMemo(() => {
    const anchor = startOfWeek(new Date(), WEEK_OPTIONS);
    return eachDayOfInterval({ start: anchor, end: endOfWeek(anchor, WEEK_OPTIONS) }).map((d) => format(d, "EEE"));
  }, []);

  const [form, setForm] = useState({
    title: "",
    description: "",
    visibility: "private",
    startLocal: "",
    endLocal: "",
    location_id: "",
    location_detail_text: "",
    location_mode: "physical",
    online_meeting_url: "",
    invited_user_ids: "",
    recurrence_frequency: "none",
    selected_role_ids: [],
  });

  const selectedEvent = events.find((e) => e.slug === selectedSlug);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      visibility: "private",
      startLocal: "",
      endLocal: "",
      location_id: "",
      location_detail_text: "",
      location_mode: "physical",
      online_meeting_url: "",
      invited_user_ids: "",
      recurrence_frequency: "none",
      selected_role_ids: [],
    });
  };

  const handleCreate = async () => {
    const userIds = form.invited_user_ids
      .split(/[\s,]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => !Number.isNaN(n));
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      visibility: form.visibility,
      starts_at: new Date(form.startLocal).toISOString(),
      ends_at: new Date(form.endLocal).toISOString(),
      location_id: form.location_id ? parseInt(form.location_id, 10) : null,
      location_detail_text: form.location_detail_text || null,
      location_mode: form.location_mode,
      online_meeting_url: form.online_meeting_url || null,
      invited_user_ids: userIds.length ? userIds : null,
      invited_role_ids: form.selected_role_ids.length ? form.selected_role_ids : null,
      reminders: [
        { offset_minutes_before: 1440, channel_email: true, channel_app: true, channel_sms: false },
        { offset_minutes_before: 60, channel_email: true, channel_app: true, channel_sms: false },
      ],
      recurrence_frequency: form.recurrence_frequency,
      recurrence_interval: 1,
      recurrence_occurrence_count: 12,
    };
    try {
      await createMutation.mutateAsync(payload);
      setCreateOpen(false);
      resetForm();
    } catch {
      /* toast in hook */
    }
  };

  const toggleRole = (id) => {
    setForm((f) => ({
      ...f,
      selected_role_ids: f.selected_role_ids.includes(id)
        ? f.selected_role_ids.filter((x) => x !== id)
        : [...f.selected_role_ids, id],
    }));
  };

  const copyPublicLink = (token) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/events/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const runReminders = async () => {
    try {
      const res = await calendarEventsService.processReminders();
      toast.message(`Reminders processed: ${res.data?.processed ?? 0}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7" />
            Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Events with invites, RSVP, attendance and reminders. Comments use the same thread as tasks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <Button type="button" variant="outline" size="sm" onClick={runReminders}>
              Run reminder job
            </Button>
          )}
          {canCreate && (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New event
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[10rem] text-center tabular-nums">{format(viewMonth, "MMMM yyyy")}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" variant="secondary" size="sm" className="self-center sm:self-auto" onClick={() => setViewMonth(new Date())}>
          Today
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Month view</CardTitle>
          <CardDescription>Events are shown on every day they span. Click an event for details.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-16 justify-center px-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekdayLabels.map((label) => (
                  <div
                    key={label}
                    className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((day) => {
                  const inMonth = isSameMonth(day, viewMonth);
                  const dayEvents = eventsForDay(events, day);
                  const today = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={[
                        "min-h-[5.5rem] sm:min-h-[7rem] border-b border-r p-1 sm:p-1.5 flex flex-col gap-0.5",
                        "[&:nth-child(7n)]:border-r-0",
                        inMonth ? "bg-background" : "bg-muted/20",
                        today ? "ring-1 ring-inset ring-primary/40 bg-primary/5" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-1 shrink-0">
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                            inMonth ? "text-foreground" : "text-muted-foreground",
                            today ? "bg-primary text-primary-foreground" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-h-0 flex-1 overflow-hidden">
                        {dayEvents.slice(0, 4).map((ev) => (
                          <button
                            key={`${ev.id}-${day.toISOString()}`}
                            type="button"
                            onClick={() => setSelectedSlug(ev.slug)}
                            className={[
                              "text-left text-[10px] sm:text-xs leading-tight rounded px-1 py-0.5 truncate w-full",
                              "border border-transparent hover:border-border hover:bg-muted/80 transition-colors",
                              ev.is_cancelled ? "opacity-60 line-through" : "bg-primary/10 hover:bg-primary/15",
                            ].join(" ")}
                            title={`${ev.title} — ${format(new Date(ev.starts_at), "HH:mm")}`}
                          >
                            <span className="font-medium text-muted-foreground tabular-nums mr-0.5">
                              {format(new Date(ev.starts_at), "HH:mm")}
                            </span>
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 4 ? (
                          <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 4} more</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
            <DialogDescription>Invite users or roles (private), or mark public for shareable RSVP link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="ce-title">Title</Label>
              <Input id="ce-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ce-desc">Description</Label>
              <Textarea id="ce-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input type="datetime-local" value={form.startLocal} onChange={(e) => setForm({ ...form, startLocal: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input type="datetime-local" value={form.endLocal} onChange={(e) => setForm({ ...form, endLocal: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Visibility</Label>
              <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (invited users / roles)</SelectItem>
                  <SelectItem value="public">Public link (guests can RSVP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Location mode</Label>
              <Select value={form.location_mode} onValueChange={(v) => setForm({ ...form, location_mode: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Location (directory)</Label>
              <Select value={form.location_id || "none"} onValueChange={(v) => setForm({ ...form, location_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(locations || []).map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Location notes (free text)</Label>
              <Input value={form.location_detail_text} onChange={(e) => setForm({ ...form, location_detail_text: e.target.value })} placeholder="Room, address…" />
            </div>
            <div className="space-y-1">
              <Label>Meeting URL</Label>
              <Input value={form.online_meeting_url} onChange={(e) => setForm({ ...form, online_meeting_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="space-y-1">
              <Label>Invite user IDs (comma-separated)</Label>
              <Input value={form.invited_user_ids} onChange={(e) => setForm({ ...form, invited_user_ids: e.target.value })} placeholder="e.g. 1, 2, 5" />
            </div>
            <div className="space-y-2">
              <Label>Invite roles</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                {(Array.isArray(roles) ? roles : []).map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.selected_role_ids.includes(r.id)} onCheckedChange={() => toggleRole(r.id)} />
                    {r.display_name || r.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Recurrence</Label>
              <Select value={form.recurrence_frequency} onValueChange={(v) => setForm({ ...form, recurrence_frequency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="weekly">Weekly (12 occurrences)</SelectItem>
                  <SelectItem value="monthly">Monthly (12 occurrences)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.title || !form.startLocal || !form.endLocal}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedSlug} onOpenChange={(o) => !o && setSelectedSlug(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto gap-0 p-6 pt-5">
          {selectedEvent ? (
            <>
              <SheetHeader className="p-0 pr-10">
                <SheetTitle>{selectedEvent.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-4 text-sm pb-2">
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedEvent.description || "—"}</p>
                <div>
                  <div>
                    <strong>When:</strong> {format(new Date(selectedEvent.starts_at), "PPpp")} – {format(new Date(selectedEvent.ends_at), "p")}
                  </div>
                  <div className="capitalize mt-1">
                    <strong>Where:</strong> {selectedEvent.location_mode}
                    {selectedEvent.location_detail_text ? ` — ${selectedEvent.location_detail_text}` : ""}
                  </div>
                  {selectedEvent.online_meeting_url ? (
                    <a href={selectedEvent.online_meeting_url} className="text-primary underline block mt-1" target="_blank" rel="noreferrer">
                      Join online
                    </a>
                  ) : null}
                </div>
                {selectedEvent.public_token ? (
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => copyPublicLink(selectedEvent.public_token)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy public RSVP link
                    </Button>
                  </div>
                ) : null}

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
                        onClick={() => selfRsvpMutation.mutate({ slug: selectedSlug, data: { response: r } })}
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
                                  patchAttendedMutation.mutate({ slug: selectedSlug, rsvpId: row.id, attended: !!c })
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
                        deleteMutation.mutate(selectedSlug, { onSuccess: () => setSelectedSlug(null) });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete event
                  </Button>
                )}

                <Separator />

                <CommentThread entityType="calendar_event" entitySlug={selectedEvent.slug} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

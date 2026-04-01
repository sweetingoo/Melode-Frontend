"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, ChevronDown, Loader2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocations } from "@/hooks/useLocations";
import { useRolesAll, formatRolePickerLabel } from "@/hooks/useRoles";
import { useCreateCalendarEvent } from "@/hooks/useCalendarEvents";
import { usersService } from "@/services/users";

function toLocalDateTimeInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextTopOfHour(base = new Date()) {
  const d = new Date(base);
  d.setSeconds(0, 0);
  d.setMinutes(0);
  d.setHours(d.getHours() + 1);
  return d;
}

function calendarInviteUserLabel(u) {
  if (!u) return "";
  return (
    u.display_name ||
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
    u.email ||
    `User #${u.id}`
  );
}

export function CalendarEventCreateDialog({ open, onOpenChange }) {
  const WEEKLY_INTERVAL_OPTIONS = [
    { value: "1", label: "Every 1 week" },
    { value: "2", label: "Every 2 weeks" },
    { value: "4", label: "Every 4 weeks" },
  ];
  const MONTHLY_INTERVAL_OPTIONS = [
    { value: "1", label: "Every 1 month" },
    { value: "2", label: "Every 2 months" },
    { value: "3", label: "Every 3 months" },
  ];
  const { data: locations = [] } = useLocations({ per_page: 200 });
  const { data: roles = [] } = useRolesAll(100);
  const createMutation = useCreateCalendarEvent();

  const calendarJobRoles = useMemo(() => {
    const list = Array.isArray(roles) ? roles : [];
    const jobs = list.filter((r) => (r.role_type || r.roleType) === "job_role");
    const getDept = (r) => (r.department?.name || r.department_name || "No department").trim();
    return [...jobs].sort((a, b) => {
      const deptCmp = getDept(a).localeCompare(getDept(b), undefined, { sensitivity: "base" });
      if (deptCmp !== 0) return deptCmp;
      return formatRolePickerLabel(a).localeCompare(formatRolePickerLabel(b), undefined, { sensitivity: "base" });
    });
  }, [roles]);

  const defaultStart = nextTopOfHour();
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);
  const [form, setForm] = useState({
    title: "",
    description: "",
    visibility: "private",
    startLocal: toLocalDateTimeInputValue(defaultStart),
    endLocal: toLocalDateTimeInputValue(defaultEnd),
    location_id: "",
    location_detail_text: "",
    location_mode: "physical",
    online_meeting_url: "",
    invitedPeople: [],
    selected_role_ids: [],
  });

  /** none | weekly | monthly — weekly uses same spacing choices as shift “recurring” on rota */
  const [repeatMode, setRepeatMode] = useState("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceCount, setRecurrenceCount] = useState(12);

  const [invitePickerOpen, setInvitePickerOpen] = useState(false);
  const [inviteUserSearch, setInviteUserSearch] = useState("");
  const [debouncedInviteSearch, setDebouncedInviteSearch] = useState("");
  const [suggestResults, setSuggestResults] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInviteSearch(inviteUserSearch), 300);
    return () => clearTimeout(t);
  }, [inviteUserSearch]);

  useEffect(() => {
    if (!invitePickerOpen) return;
    let cancelled = false;
    (async () => {
      setSuggestLoading(true);
      try {
        const q = debouncedInviteSearch.trim();
        const res = await usersService.suggestUsers({
          ...(q ? { search: q } : {}),
          is_active: true,
          per_page: 25,
        });
        if (!cancelled) setSuggestResults(res.data?.users || []);
      } catch {
        if (!cancelled) setSuggestResults([]);
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invitePickerOpen, debouncedInviteSearch]);

  const resetForm = () => {
    const start = nextTopOfHour();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setForm({
      title: "",
      description: "",
      visibility: "private",
      startLocal: toLocalDateTimeInputValue(start),
      endLocal: toLocalDateTimeInputValue(end),
      location_id: "",
      location_detail_text: "",
      location_mode: "physical",
      online_meeting_url: "",
      invitedPeople: [],
      selected_role_ids: [],
    });
    setRepeatMode("none");
    setRecurrenceInterval(1);
    setRecurrenceCount(12);
    setInviteUserSearch("");
    setDebouncedInviteSearch("");
  };

  useEffect(() => {
    if (!open) {
      setInvitePickerOpen(false);
      setInviteUserSearch("");
      setDebouncedInviteSearch("");
    }
  }, [open]);

  const toggleRole = (id) => {
    setForm((f) => ({
      ...f,
      selected_role_ids: f.selected_role_ids.includes(id)
        ? f.selected_role_ids.filter((x) => x !== id)
        : [...f.selected_role_ids, id],
    }));
  };

  const addInvitedPerson = (user) => {
    if (!user?.id) return;
    setForm((f) => {
      if (f.invitedPeople.some((p) => p.id === user.id)) return f;
      return { ...f, invitedPeople: [...f.invitedPeople, { id: user.id, label: calendarInviteUserLabel(user) }] };
    });
    setInvitePickerOpen(false);
    setInviteUserSearch("");
    setDebouncedInviteSearch("");
  };

  const removeInvitedPerson = (id) => {
    setForm((f) => ({ ...f, invitedPeople: f.invitedPeople.filter((p) => p.id !== id) }));
  };

  const handleStartChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, startLocal: value };
      if (!value) return next;
      const start = new Date(value);
      if (isNaN(start.getTime())) return next;
      const suggestedEnd = new Date(start.getTime() + 60 * 60 * 1000);
      const currentEnd = prev.endLocal ? new Date(prev.endLocal) : null;
      if (!prev.endLocal || !currentEnd || isNaN(currentEnd.getTime()) || currentEnd <= start) {
        next.endLocal = toLocalDateTimeInputValue(suggestedEnd);
      }
      return next;
    });
  };

  const handleEndChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, endLocal: value };
      if (!value || !prev.startLocal) return next;
      const start = new Date(prev.startLocal);
      const end = new Date(value);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return next;
      if (end <= start) {
        next.endLocal = toLocalDateTimeInputValue(new Date(start.getTime() + 60 * 60 * 1000));
      }
      return next;
    });
  };

  const openNativePicker = (ref) => {
    const el = ref?.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") el.showPicker();
      else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
    }
  };

  const buildRecurrencePayload = () => {
    if (repeatMode === "weekly") {
      return {
        recurrence_frequency: "weekly",
        recurrence_interval: Math.min(12, Math.max(1, parseInt(String(recurrenceInterval), 10) || 1)),
        recurrence_occurrence_count: Math.min(52, Math.max(1, parseInt(String(recurrenceCount), 10) || 1)),
      };
    }
    if (repeatMode === "monthly") {
      return {
        recurrence_frequency: "monthly",
        recurrence_interval: Math.min(12, Math.max(1, parseInt(String(recurrenceInterval), 10) || 1)),
        recurrence_occurrence_count: Math.min(52, Math.max(1, parseInt(String(recurrenceCount), 10) || 1)),
      };
    }
    return {
      recurrence_frequency: "none",
      recurrence_interval: 1,
      recurrence_occurrence_count: 1,
    };
  };

  const handleCreate = async () => {
    const startDate = new Date(form.startLocal);
    const endDate = new Date(form.endLocal);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return;
    }
    if (endDate <= startDate) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    const userIds = (form.invitedPeople || []).map((p) => p.id).filter(Boolean);
    const rec = buildRecurrencePayload();
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      visibility: form.visibility,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
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
      ...rec,
    };
    try {
      await createMutation.mutateAsync(payload);
      onOpenChange(false);
      resetForm();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setInvitePickerOpen(false);
          setInviteUserSearch("");
          setDebouncedInviteSearch("");
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
          <DialogDescription>
            Shown on the Rota next to shifts for the same dates. Invite people or job roles; public events get an RSVP link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="ce2-title">Title</Label>
            <Input id="ce2-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ce2-desc">Description</Label>
            <Textarea id="ce2-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Start</Label>
              <div className="flex items-center gap-2">
                <Input ref={startInputRef} type="datetime-local" value={form.startLocal} onChange={(e) => handleStartChange(e.target.value)} />
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => openNativePicker(startInputRef)} aria-label="Open start date and time picker">
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>End</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={endInputRef}
                  type="datetime-local"
                  value={form.endLocal}
                  min={form.startLocal || undefined}
                  disabled={!form.startLocal}
                  onChange={(e) => handleEndChange(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  disabled={!form.startLocal}
                  onClick={() => openNativePicker(endInputRef)}
                  aria-label="Open end date and time picker"
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
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
            <Input
              value={form.location_detail_text}
              onChange={(e) => setForm({ ...form, location_detail_text: e.target.value })}
              placeholder="Room, address…"
            />
          </div>
          <div className="space-y-1">
            <Label>Meeting URL</Label>
            <Input value={form.online_meeting_url} onChange={(e) => setForm({ ...form, online_meeting_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label>Invite people</Label>
            <p className="text-xs text-muted-foreground">Search by name, email, or username.</p>
            {form.invitedPeople.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.invitedPeople.map((p) => (
                  <Badge key={p.id} variant="secondary" className="gap-1 py-1 pl-2 pr-1 font-normal">
                    <span className="max-w-[220px] truncate">{p.label}</span>
                    <button
                      type="button"
                      className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                      onClick={() => removeInvitedPerson(p.id)}
                      aria-label={`Remove ${p.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Popover
              open={invitePickerOpen}
              onOpenChange={(o) => {
                setInvitePickerOpen(o);
                if (!o) {
                  setInviteUserSearch("");
                  setDebouncedInviteSearch("");
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between font-normal">
                  <span className="flex items-center gap-2 truncate">
                    <UserPlus className="h-4 w-4 shrink-0 opacity-70" />
                    Add someone…
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="border-b p-2">
                  <Input
                    placeholder="Search people…"
                    value={inviteUserSearch}
                    onChange={(e) => setInviteUserSearch(e.target.value)}
                    className="h-9"
                    autoFocus
                  />
                </div>
                <ScrollArea className="max-h-60">
                  {suggestLoading ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
                  ) : (
                    <ul className="p-1">
                      {suggestResults.map((u) => {
                        const selected = form.invitedPeople.some((p) => p.id === u.id);
                        return (
                          <li key={u.id}>
                            <button
                              type="button"
                              disabled={selected}
                              className={cn(
                                "w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                selected && "opacity-50",
                              )}
                              onClick={() => addInvitedPerson(u)}
                            >
                              <div className="font-medium">{calendarInviteUserLabel(u)}</div>
                              {u.email ? <div className="text-xs text-muted-foreground truncate">{u.email}</div> : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
                {!suggestLoading && suggestResults.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    {debouncedInviteSearch.trim() ? "No matches." : "No people to show."}
                  </p>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Invite by job role</Label>
            <p className="text-xs text-muted-foreground">
              Job roles only (same idea as rota columns). Use named people above for shift-only assignments.
            </p>
            <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-3 sm:max-h-48">
              {calendarJobRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No job roles loaded.</p>
              ) : (
                calendarJobRoles.map((r) => {
                  const shiftKids = r.shift_roles || r.shiftRoles || [];
                  const deptName = r.department?.name || r.department_name || "No department";
                  return (
                    <label key={r.id} className="flex flex-col gap-1 text-sm">
                      <span className="flex items-start gap-2">
                        <Checkbox
                          className="mt-0.5"
                          checked={form.selected_role_ids.includes(r.id)}
                          onCheckedChange={() => toggleRole(r.id)}
                        />
                        <span>
                          <span className="font-medium leading-snug">{deptName} - {formatRolePickerLabel(r)}</span>
                          {shiftKids.length > 0 ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">
                              Linked shift roles: {shiftKids.map((s) => s.display_name || s.name).join(", ")}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <Label>Repeat</Label>
            <p className="text-xs text-muted-foreground">Set how often this event repeats.</p>
            <Select
              value={repeatMode}
              onValueChange={(v) => {
                setRepeatMode(v);
                if (v === "none") {
                  setRecurrenceInterval(1);
                  setRecurrenceCount(12);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {(repeatMode === "weekly" || repeatMode === "monthly") && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs">Every</Label>
                <Select
                  value={String(recurrenceInterval)}
                  onValueChange={(v) => setRecurrenceInterval(parseInt(v, 10) || 1)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(repeatMode === "weekly" ? WEEKLY_INTERVAL_OPTIONS : MONTHLY_INTERVAL_OPTIONS).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label className="text-xs">Number of occurrences (1-52)</Label>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={
              createMutation.isPending ||
              !form.title ||
              !form.startLocal ||
              !form.endLocal
            }
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

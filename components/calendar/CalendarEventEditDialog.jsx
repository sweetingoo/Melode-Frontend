"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Loader2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocations } from "@/hooks/useLocations";
import { useRolesAll, formatRolePickerLabel } from "@/hooks/useRoles";
import { usePatchEventInvites, useUpdateCalendarEvent } from "@/hooks/useCalendarEvents";
import { useCalendarEventCategories } from "@/hooks/useCalendarEventCategories";
import { usersService } from "@/services/users";
import { toast } from "sonner";

function toInputDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function userLabel(u) {
  return u?.display_name || [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() || u?.email || `User #${u?.id}`;
}

export function CalendarEventEditDialog({ open, onOpenChange, event }) {
  const { data: locations = [] } = useLocations({ per_page: 200 });
  const { data: roles = [] } = useRolesAll(100);
  const { data: categoriesPayload } = useCalendarEventCategories({ includeInactive: true, enabled: open });
  const eventCategories = categoriesPayload?.categories ?? [];
  const updateMutation = useUpdateCalendarEvent();
  const patchInvitesMutation = usePatchEventInvites();

  const [form, setForm] = useState(null);
  const [invitePickerOpen, setInvitePickerOpen] = useState(false);
  const [inviteUserSearch, setInviteUserSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [applyScope, setApplyScope] = useState("single"); // single | series
  const isRecurring = event?.parent_event_id != null || (event?.recurrence_frequency && event.recurrence_frequency !== "none");

  const calendarJobRoles = useMemo(() => {
    const list = Array.isArray(roles) ? roles : [];
    return list.filter((r) => (r.role_type || r.roleType) === "job_role");
  }, [roles]);

  useEffect(() => {
    if (!event || !open) return;
    const invited_user_ids = (event.invites || []).map((x) => x.user_id).filter(Boolean);
    const invited_role_ids = (event.invites || []).map((x) => x.role_id).filter(Boolean);
    setForm({
      title: event.title || "",
      description: event.description || "",
      visibility: event.visibility || "private",
      startLocal: toInputDateTime(event.starts_at),
      endLocal: toInputDateTime(event.ends_at),
      location_id: event.location_id ? String(event.location_id) : "",
      location_detail_text: event.location_detail_text || "",
      location_mode: event.location_mode || "physical",
      online_meeting_url: event.online_meeting_url || "",
      invitedPeople: invited_user_ids.map((id) => ({ id, label: `User #${id}` })),
      selected_role_ids: invited_role_ids,
      category_id: event.category_id != null ? String(event.category_id) : "",
    });
    setApplyScope("single");
  }, [event, open]);

  useEffect(() => {
    if (!invitePickerOpen) return;
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const q = inviteUserSearch.trim();
        const res = await usersService.suggestUsers({ ...(q ? { search: q } : {}), is_active: true, per_page: 25 });
        if (!cancelled) setResults(res.data?.users || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invitePickerOpen, inviteUserSearch]);

  const addInvitedPerson = (u) => {
    if (!u?.id) return;
    setForm((f) => {
      if (f.invitedPeople.some((p) => p.id === u.id)) return f;
      return { ...f, invitedPeople: [...f.invitedPeople, { id: u.id, label: userLabel(u) }] };
    });
    setInvitePickerOpen(false);
    setInviteUserSearch("");
  };

  const removeInvitedPerson = (id) => setForm((f) => ({ ...f, invitedPeople: f.invitedPeople.filter((p) => p.id !== id) }));
  const toggleRole = (id) =>
    setForm((f) => ({ ...f, selected_role_ids: f.selected_role_ids.includes(id) ? f.selected_role_ids.filter((x) => x !== id) : [...f.selected_role_ids, id] }));

  const handleSave = async () => {
    if (!form || !event?.slug) return;
    const start = new Date(form.startLocal);
    const end = new Date(form.endLocal);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    await updateMutation.mutateAsync({
      slug: event.slug,
      apply_to_series: applyScope === "series",
      data: {
        title: form.title.trim(),
        description: form.description || null,
        visibility: form.visibility,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        location_id: form.location_id ? parseInt(form.location_id, 10) : null,
        location_detail_text: form.location_detail_text || null,
        location_mode: form.location_mode,
        online_meeting_url: form.online_meeting_url || null,
        category_id: form.category_id ? parseInt(form.category_id, 10) : null,
      },
    });

    await patchInvitesMutation.mutateAsync({
      slug: event.slug,
      apply_to_series: applyScope === "series",
      data: {
        invited_user_ids: form.invitedPeople.map((p) => p.id),
        invited_role_ids: form.selected_role_ids,
      },
    });

    onOpenChange(false);
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>
        {isRecurring && (
          <div className="space-y-2 rounded-md border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-200">
            <p>This event is part of a recurring series.</p>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-amber-900 dark:text-amber-200">Apply changes to</Label>
              <Select value={applyScope} onValueChange={setApplyScope}>
                <SelectTrigger className="h-8 bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">This event only</SelectItem>
                  <SelectItem value="series">All events in this series</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="space-y-3 py-2">
          <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1"><Label>Start</Label><Input type="datetime-local" value={form.startLocal} onChange={(e) => setForm({ ...form, startLocal: e.target.value })} /></div>
            <div className="space-y-1"><Label>End</Label><Input type="datetime-local" value={form.endLocal} min={form.startLocal || undefined} onChange={(e) => setForm({ ...form, endLocal: e.target.value })} /></div>
          </div>
          <div className="space-y-1">
            <Label>Visibility</Label>
            <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="private">Private</SelectItem><SelectItem value="public">Public</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              value={form.category_id ? String(form.category_id) : "none"}
              onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {eventCategories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Location mode</Label>
            <Select value={form.location_mode} onValueChange={(v) => setForm({ ...form, location_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="physical">Physical</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Location (directory)</Label>
            <Select value={form.location_id || "none"} onValueChange={(v) => setForm({ ...form, location_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent><SelectItem value="none">None</SelectItem>{locations.map((loc) => <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Location notes</Label><Input value={form.location_detail_text} onChange={(e) => setForm({ ...form, location_detail_text: e.target.value })} /></div>
          <div className="space-y-1"><Label>Meeting URL</Label><Input value={form.online_meeting_url} onChange={(e) => setForm({ ...form, online_meeting_url: e.target.value })} /></div>

          <div className="space-y-2">
            <Label>Invite people</Label>
            {form.invitedPeople.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.invitedPeople.map((p) => (
                  <Badge key={p.id} variant="secondary" className="gap-1 py-1 pl-2 pr-1 font-normal">
                    <span className="max-w-[220px] truncate">{p.label}</span>
                    <button type="button" className="rounded-sm p-0.5 hover:bg-muted-foreground/20" onClick={() => removeInvitedPerson(p.id)} aria-label={`Remove ${p.label}`}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Popover open={invitePickerOpen} onOpenChange={setInvitePickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between font-normal">
                  <span className="flex items-center gap-2 truncate"><UserPlus className="h-4 w-4 shrink-0 opacity-70" />Add someone...</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="border-b p-2"><Input placeholder="Search people..." value={inviteUserSearch} onChange={(e) => setInviteUserSearch(e.target.value)} className="h-9" autoFocus /></div>
                <ScrollArea className="max-h-60">
                  {loadingUsers ? <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p> : (
                    <ul className="p-1">
                      {results.map((u) => {
                        const selected = form.invitedPeople.some((p) => p.id === u.id);
                        return (
                          <li key={u.id}>
                            <button type="button" disabled={selected} className={cn("w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground", selected && "opacity-50")} onClick={() => addInvitedPerson(u)}>
                              <div className="font-medium">{userLabel(u)}</div>
                              {u.email ? <div className="text-xs text-muted-foreground truncate">{u.email}</div> : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Invite by job role</Label>
            <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-3 sm:max-h-48">
              {calendarJobRoles.map((r) => {
                const dept = r.department?.name || r.department_name || "No department";
                return (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <Checkbox className="mt-0.5" checked={form.selected_role_ids.includes(r.id)} onCheckedChange={() => toggleRole(r.id)} />
                    <span className="font-medium leading-snug">{dept} - {formatRolePickerLabel(r)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={updateMutation.isPending || patchInvitesMutation.isPending || !form.title || !form.startLocal || !form.endLocal}>
            {(updateMutation.isPending || patchInvitesMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

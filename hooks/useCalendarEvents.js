"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarEventsService } from "@/services/calendarEvents";
import { toast } from "sonner";

const qk = {
  list: (range) => ["calendar-events", range?.start, range?.end],
  one: (slug) => ["calendar-event", slug],
  rsvps: (slug) => ["calendar-event-rsvps", slug],
};

export function useCalendarEventsList({ start, end, page = 1, per_page = 50, enabled = true }) {
  return useQuery({
    queryKey: [...qk.list({ start, end }), page, per_page],
    queryFn: async () => {
      const res = await calendarEventsService.list({ start, end, page, per_page });
      return res.data;
    },
    enabled: enabled && !!start && !!end,
  });
}

export function useCalendarEvent(slug, enabled = true) {
  return useQuery({
    queryKey: qk.one(slug),
    queryFn: async () => {
      const res = await calendarEventsService.get(slug);
      return res.data;
    },
    enabled: enabled && !!slug,
  });
}

export function useCalendarEventRsvps(slug, enabled = true) {
  return useQuery({
    queryKey: qk.rsvps(slug),
    queryFn: async () => {
      const res = await calendarEventsService.listRsvps(slug);
      return res.data;
    },
    enabled: enabled && !!slug,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await calendarEventsService.create(data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event created");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to create event"),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, data, apply_to_series = false }) => {
      const res = await calendarEventsService.update(slug, data, { apply_to_series });
      return res.data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: qk.one(v.slug) });
      toast.success("Event updated");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to update"),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug) => calendarEventsService.delete(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event deleted");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to delete"),
  });
}

export function usePatchEventInvites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data, apply_to_series = false }) =>
      calendarEventsService.patchInvites(slug, data, { apply_to_series }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.one(v.slug) });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Invites updated");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to update invites"),
  });
}

export function useSelfEventRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }) => calendarEventsService.selfRsvp(slug, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.rsvps(v.slug) });
      qc.invalidateQueries({ queryKey: qk.one(v.slug) });
      toast.success("RSVP saved");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "RSVP failed"),
  });
}

export function usePatchRsvpAttended() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, rsvpId, attended }) => calendarEventsService.patchAttended(slug, rsvpId, attended),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.rsvps(v.slug) });
      toast.success("Attendance updated");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Update failed"),
  });
}

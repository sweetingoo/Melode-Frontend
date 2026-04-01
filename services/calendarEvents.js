import apiClient from "./api-client";

export const calendarEventsService = {
  list({ start, end, page = 1, per_page = 50 } = {}) {
    return apiClient.get("/calendar-events", { params: { start, end, page, per_page } });
  },
  get(slug) {
    return apiClient.get(`/calendar-events/${encodeURIComponent(slug)}`);
  },
  create(data) {
    return apiClient.post("/calendar-events", data);
  },
  update(slug, data, options = {}) {
    return apiClient.put(`/calendar-events/${encodeURIComponent(slug)}`, data, {
      params: { apply_to_series: !!options.apply_to_series },
    });
  },
  delete(slug) {
    return apiClient.delete(`/calendar-events/${encodeURIComponent(slug)}`);
  },
  patchInvites(slug, data, options = {}) {
    return apiClient.patch(`/calendar-events/${encodeURIComponent(slug)}/invites`, data, {
      params: { apply_to_series: !!options.apply_to_series },
    });
  },
  listRsvps(slug) {
    return apiClient.get(`/calendar-events/${encodeURIComponent(slug)}/rsvps`);
  },
  selfRsvp(slug, data) {
    return apiClient.post(`/calendar-events/${encodeURIComponent(slug)}/rsvp`, data);
  },
  patchAttended(slug, rsvpId, attended) {
    return apiClient.patch(`/calendar-events/${encodeURIComponent(slug)}/rsvps/${rsvpId}/attended`, { attended });
  },
  processReminders() {
    return apiClient.post("/calendar-events/process-reminders");
  },
  /** No auth */
  publicGet(token) {
    return apiClient.get(`/calendar-events/public/${encodeURIComponent(token)}`);
  },
  publicRsvp(token, data) {
    return apiClient.post(`/calendar-events/public/${encodeURIComponent(token)}/rsvp`, data);
  },
};

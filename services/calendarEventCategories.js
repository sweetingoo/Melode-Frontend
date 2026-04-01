import apiClient from "./api-client";

export const calendarEventCategoriesService = {
  list(params = {}) {
    return apiClient.get("/calendar-event-categories", { params });
  },
  create(data) {
    return apiClient.post("/calendar-event-categories", data);
  },
  update(id, data) {
    return apiClient.put(`/calendar-event-categories/${id}`, data);
  },
  delete(id) {
    return apiClient.delete(`/calendar-event-categories/${id}`);
  },
};

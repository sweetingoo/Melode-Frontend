"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarEventCategoriesService } from "@/services/calendarEventCategories";
import { toast } from "sonner";

export const calendarEventCategoriesKeys = {
  all: ["calendar-event-categories"],
  list: (includeInactive) => [...calendarEventCategoriesKeys.all, { includeInactive }],
};

export function useCalendarEventCategories({ includeInactive = false, enabled = true } = {}) {
  return useQuery({
    queryKey: calendarEventCategoriesKeys.list(includeInactive),
    queryFn: async () => {
      const res = await calendarEventCategoriesService.list({ include_inactive: includeInactive });
      return res.data;
    },
    enabled,
  });
}

export function useCreateCalendarEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await calendarEventCategoriesService.create(data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarEventCategoriesKeys.all });
      toast.success("Category created");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to create category"),
  });
}

export function useUpdateCalendarEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await calendarEventCategoriesService.update(id, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarEventCategoriesKeys.all });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Category updated");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to update"),
  });
}

export function useDeleteCalendarEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => calendarEventCategoriesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarEventCategoriesKeys.all });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Category removed");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Failed to delete"),
  });
}

/** Apply new `sort_order` values (0..n-1) after drag-and-drop; single toast. */
export function useReorderCalendarEventCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates) => {
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          calendarEventCategoriesService.update(id, { sort_order })
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarEventCategoriesKeys.all });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Order updated");
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: calendarEventCategoriesKeys.all });
      toast.error(e.response?.data?.detail || "Failed to update order");
    },
  });
}

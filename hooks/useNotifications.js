import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications";

// Notification query keys
export const notificationKeys = {
  all: ["notifications"],
  lists: () => [...notificationKeys.all, "list"],
  list: (params) => [...notificationKeys.lists(), params],
  unreadCount: () => [...notificationKeys.all, "unread-count"],
};

// Get notifications query
export const useNotifications = (params = {}, options = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const response = await notificationsService.getNotifications(params);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute (notifications should be fresh)
    ...options,
  });
};

// Get unread notifications count query
export const useUnreadNotificationsCount = (options = {}) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await notificationsService.getUnreadCount();
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds (count should be very fresh)
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
};


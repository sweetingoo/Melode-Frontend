"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { presenceService } from "@/services/presence";
import { useCurrentUser } from "@/hooks/useAuth";

// Presence query keys
export const presenceKeys = {
  all: ["presence"],
  online: () => [...presenceKeys.all, "online"],
  user: (userSlug) => [...presenceKeys.all, "user", userSlug],
  batch: (userIds) => [...presenceKeys.all, "batch", userIds], // Keep IDs for batch query params
};

/**
 * Hook to manage user online/offline status
 * Maintains a Set of online user IDs and updates via SSE events
 */
export const usePresence = () => {
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { data: currentUser } = useCurrentUser();

  // Fetch initial online users when app loads
  const { data: onlineUsersData } = useQuery({
    queryKey: presenceKeys.online(),
    queryFn: async () => {
      const response = await presenceService.getOnlineUsers();
      return response.data;
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds as fallback
  });

  // Initialize online users from API response
  useEffect(() => {
    if (onlineUsersData?.users) {
      const onlineSet = new Set(
        onlineUsersData.users
          .filter((u) => u.is_online)
          .map((u) => u.user_id)
      );
      setOnlineUsers(onlineSet);
    }
  }, [onlineUsersData]);

  // Listen for SSE presence events
  useEffect(() => {
    const handleOnlineEvent = (event) => {
      const data = event.detail?.data || event.data;
      if (data?.user_id) {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.add(data.user_id);
          return next;
        });
        
        // Update query cache
        queryClient.setQueryData(presenceKeys.online(), (oldData) => {
          if (!oldData) return oldData;
          const existingUser = oldData.users?.find((u) => u.user_id === data.user_id);
          if (existingUser) {
            return {
              ...oldData,
              users: oldData.users.map((u) =>
                u.user_id === data.user_id
                  ? { ...u, is_online: true, timestamp: data.timestamp }
                  : u
              ),
            };
          } else {
            return {
              ...oldData,
              users: [
                ...(oldData.users || []),
                {
                  user_id: data.user_id,
                  is_online: true,
                  timestamp: data.timestamp,
                },
              ],
              total: (oldData.total || 0) + 1,
            };
          }
        });
      }
    };

    const handleOfflineEvent = (event) => {
      const data = event.detail?.data || event.data;
      if (data?.user_id) {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.user_id);
          return next;
        });
        
        // Update query cache
        queryClient.setQueryData(presenceKeys.online(), (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            users: oldData.users?.map((u) =>
              u.user_id === data.user_id
                ? { ...u, is_online: false, timestamp: data.timestamp }
                : u
            ) || [],
          };
        });
      }
    };

    // Listen for custom SSE events
    if (typeof window !== "undefined") {
      window.addEventListener("sse-user-online", handleOnlineEvent);
      window.addEventListener("sse-user-offline", handleOfflineEvent);

      return () => {
        window.removeEventListener("sse-user-online", handleOnlineEvent);
        window.removeEventListener("sse-user-offline", handleOfflineEvent);
      };
    }
  }, [queryClient]);

  // Check if a user is online
  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      const normalizedId = typeof userId === "string" ? parseInt(userId) : userId;
      return onlineUsers.has(normalizedId);
    },
    [onlineUsers]
  );

  // Get user presence (online/offline with last_seen)
  const getUserPresence = useCallback(
    async (userSlug) => {
      try {
        const response = await presenceService.getUserPresence(userSlug);
        return response.data;
      } catch (error) {
        console.error(`Failed to get presence for user ${userSlug}:`, error);
        return null;
      }
    },
    []
  );

  // Batch fetch presence for multiple users
  const getBatchPresence = useCallback(async (userIds) => {
    try {
      const response = await presenceService.getBatchPresence(userIds);
      return response.data;
    } catch (error) {
      console.error("Failed to get batch presence:", error);
      return null;
    }
  }, []);

  return {
    onlineUsers,
    isUserOnline,
    getUserPresence,
    getBatchPresence,
  };
};

/**
 * Hook to get presence for a single user
 */
export const useUserPresence = (userSlug, options = {}) => {
  return useQuery({
    queryKey: presenceKeys.user(userSlug),
    queryFn: async () => {
      const response = await presenceService.getUserPresence(userSlug);
      return response.data;
    },
    enabled: !!userId && (options.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

/**
 * Hook to get batch presence for multiple users
 */
export const useBatchPresence = (userIds = [], options = {}) => {
  return useQuery({
    queryKey: presenceKeys.batch(userIds),
    queryFn: async () => {
      const response = await presenceService.getBatchPresence(userIds);
      return response.data;
    },
    enabled: userIds.length > 0 && (options.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};


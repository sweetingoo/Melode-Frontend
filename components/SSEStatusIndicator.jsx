"use client";

import { useSSE } from "@/hooks/useSSE";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Component to display SSE connection status
 * Useful for debugging and verifying SSE is working
 */
export const SSEStatusIndicator = () => {
  const { connectionState, isConnected } = useSSE();

  const getStatusConfig = () => {
    switch (connectionState) {
      case "connected":
        return {
          label: "SSE Connected",
          variant: "default",
          icon: Wifi,
          className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        };
      case "connecting":
        return {
          label: "SSE Connecting...",
          variant: "secondary",
          icon: Loader2,
          className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 animate-spin",
        };
      case "error":
        return {
          label: "SSE Error",
          variant: "destructive",
          icon: WifiOff,
          className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        };
      default:
        return {
          label: "SSE Disconnected",
          variant: "secondary",
          icon: WifiOff,
          className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Only show in development or if explicitly enabled
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SHOW_SSE_STATUS) {
    return null;
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-2 py-1 text-xs font-mono",
        config.className
      )}
      title={`SSE Connection State: ${connectionState}`}
    >
      <Icon className={cn("h-3 w-3", connectionState === "connecting" && "animate-spin")} />
      <span>{config.label}</span>
    </Badge>
  );
};


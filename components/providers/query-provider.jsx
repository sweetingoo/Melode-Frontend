"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnMount: false, // Prevent double API calls on mount (e.g., from React StrictMode)
            refetchOnWindowFocus: false, // Prevent refetching when window regains focus
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (
                error?.response?.status >= 400 &&
                error?.response?.status < 500
              ) {
                return false;
              }
              
              // Don't retry CORS errors - these are configuration issues that won't resolve with retries
              if (
                error?.code === "CORS_ERROR" ||
                error?.message?.includes("CORS") ||
                error?.message?.includes("Access-Control") ||
                error?.message?.includes("Cross-Origin")
              ) {
                return false;
              }
              
              // Don't retry network errors (ERR_FAILED, ERR_NETWORK, etc.)
              // These are typically connectivity issues that won't resolve with retries
              if (
                error?.code === "NETWORK_ERROR" ||
                error?.code === "ERR_FAILED" ||
                error?.code === "ERR_NETWORK" ||
                error?.message?.includes("ERR_FAILED") ||
                error?.message?.includes("Network Error") ||
                error?.message?.includes("ERR_NETWORK")
              ) {
                return false;
              }
              
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const GlobalLoadingContext = createContext(null);

/** Delay before showing overlay to avoid flicker on fast mutations. */
const SHOW_DELAY_MS = 200;

function GlobalLoadingIndicator({ active }) {
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef(null);

  useEffect(() => {
    if (active) {
      showTimerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => {
        clearTimeout(showTimerRef.current);
      };
    }
    clearTimeout(showTimerRef.current);
    setVisible(false);
    return undefined;
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/50 backdrop-blur-[2px] pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-lg">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Working…</span>
      </div>
    </div>
  );
}

/**
 * Wraps the app to show a full-screen loader when:
 * - Any TanStack Query mutation is in flight, or
 * - Code calls `startLoading()` / `stopLoading()` (use for fetch/actions not using mutations).
 */
export function GlobalLoadingProvider({ children }) {
  const [manualCount, setManualCount] = useState(0);
  const mutationCount = useIsMutating();

  const startLoading = useCallback(() => {
    setManualCount((c) => c + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setManualCount((c) => Math.max(0, c - 1));
  }, []);

  const active = manualCount > 0 || mutationCount > 0;

  const value = useMemo(
    () => ({ startLoading, stopLoading }),
    [startLoading, stopLoading]
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingIndicator active={active} />
    </GlobalLoadingContext.Provider>
  );
}

/** Pair every startLoading() with stopLoading() in try/finally. */
export function useGlobalLoading() {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx) {
    return {
      startLoading: () => {},
      stopLoading: () => {},
    };
  }
  return ctx;
}

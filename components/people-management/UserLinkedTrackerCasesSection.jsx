"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LayoutList, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { formsService } from "@/services/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PER_PAGE = 30;

function nextPageParam(lastPage) {
  const page = lastPage?.page ?? 1;
  const totalPages = lastPage?.total_pages ?? 1;
  if (totalPages < 1) return undefined;
  return page < totalPages ? page + 1 : undefined;
}

function groupHeading(sub) {
  const title = sub.tracker_form_title || `Tracker #${sub.form_id}`;
  const cat = (sub.tracker_category || "").trim();
  return cat ? `${cat} · ${title}` : title;
}

/**
 * Lists tracker cases (user-linked trackers only) for a person — open or closed, grouped by tracker / category.
 * @param {number} subjectUserId
 * @param {"admin" | "self"} viewer
 */
export default function UserLinkedTrackerCasesSection({ subjectUserId, viewer = "admin" }) {
  const infinite = useInfiniteQuery({
    queryKey: ["form-submissions", "user-linked-trackers", subjectUserId, PER_PAGE],
    initialPageParam: 1,
    enabled: Number.isFinite(subjectUserId) && subjectUserId > 0,
    queryFn: async ({ pageParam }) => {
      const res = await formsService.searchFormSubmissions({
        subject_user_id: subjectUserId,
        user_linked_tracker_cases_only: true,
        page: pageParam,
        per_page: PER_PAGE,
        sort_by: "updated_at",
        sort_order: "desc",
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => nextPageParam(lastPage),
    staleTime: 30 * 1000,
  });

  const submissions = useMemo(() => {
    const flat = infinite.data?.pages.flatMap((p) => p?.submissions ?? []) ?? [];
    const seen = new Set();
    return flat.filter((s) => {
      if (!s?.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [infinite.data?.pages]);

  const grouped = useMemo(() => {
    const m = new Map();
    for (const sub of submissions) {
      const key = groupHeading(sub);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(sub);
    }
    for (const list of m.values()) {
      list.sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      });
    }
    const keys = [...m.keys()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return keys.map((k) => ({ heading: k, items: m.get(k) }));
  }, [submissions]);

  if (!subjectUserId) {
    return null;
  }

  if (infinite.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tracker cases…
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutList className="h-4 w-4" />
            User tracker cases
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {viewer === "self"
            ? "No user-linked tracker cases are recorded for you yet."
            : "No user-linked tracker cases for this person. Enable “User-linked tracker” on a tracker under Trackers → Edit → Basic Info, then create cases with that person selected."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <LayoutList className="h-4 w-4" />
          User tracker cases
        </h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Cases from trackers that link each entry to a person. Open or closed — grouped by tracker and category.
        </p>
      </div>

      {grouped.map(({ heading, items }) => (
        <div key={heading} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{heading}</h4>
          <ul className="space-y-2">
            {items.map((sub) => {
              const href = `/admin/trackers/entries/${sub.slug || sub.id}`;
              let label = sub.tracker_entry_number != null ? `Case #${sub.tracker_entry_number}` : `Case #${sub.id}`;
              try {
                const d = sub.updated_at ? parseUTCDate(sub.updated_at) : null;
                if (d) label = `${label} · updated ${format(d, "dd MMM yyyy")}`;
              } catch {
                /* ignore */
              }
              const st = (sub.status || "").trim();
              const closedLike = /^closed/i.test(st) || st.toLowerCase() === "resolved";
              return (
                <li key={sub.id}>
                  <Link
                    href={href}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 flex-wrap"
                  >
                    {label}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                  {st ? (
                    <Badge variant={closedLike ? "secondary" : "default"} className="ml-2 text-[10px] font-normal">
                      {st}
                    </Badge>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {infinite.hasNextPage && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={infinite.isFetchingNextPage}
            onClick={() => infinite.fetchNextPage()}
          >
            {infinite.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {submissions.length} case{submissions.length === 1 ? "" : "s"} loaded
          </span>
        </div>
      )}
    </div>
  );
}

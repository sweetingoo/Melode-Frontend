"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ClipboardList, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { formsService } from "@/services/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Matches .cursorrules: modest page sizes (20–50), no 100/200 bulk loads */
const FORMS_PER_PAGE = 30;
const SUBMISSIONS_PER_PAGE = 30;

function sectionLabel(form) {
  const s = form?.form_config?.personnel?.section;
  if (typeof s === "string" && s.trim()) return s.trim();
  return "Forms";
}

function nextPageParam(lastPage) {
  const page = lastPage?.page ?? 1;
  const totalPages = lastPage?.total_pages ?? 1;
  if (totalPages < 1) return undefined;
  return page < totalPages ? page + 1 : undefined;
}

function subjectMayStartForm(form) {
  const mode = (form?.form_config?.personnel?.completion_mode || "staff_only").toLowerCase();
  return mode === "subject_or_staff" || mode === "public_link";
}

/**
 * @param {"admin" | "self"} viewer - Admin sees all personnel form types on a person’s file; self only sees types they may complete.
 */
export default function PersonnelFormsSection({
  subjectUserId,
  canStartForms = false,
  viewer = "admin",
}) {
  const formsInfinite = useInfiniteQuery({
    queryKey: ["custom-forms", "personnel", true, FORMS_PER_PAGE],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await formsService.getForms({
        page: pageParam,
        per_page: FORMS_PER_PAGE,
        is_active: true,
        is_tracker: false,
        is_personnel: true,
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => nextPageParam(lastPage),
    staleTime: 60 * 1000,
  });

  const submissionsInfinite = useInfiniteQuery({
    queryKey: ["form-submissions", "subject", subjectUserId, SUBMISSIONS_PER_PAGE],
    initialPageParam: 1,
    enabled: Number.isFinite(subjectUserId) && subjectUserId > 0,
    queryFn: async ({ pageParam }) => {
      const res = await formsService.searchFormSubmissions({
        subject_user_id: subjectUserId,
        page: pageParam,
        per_page: SUBMISSIONS_PER_PAGE,
        sort_by: "created_at",
        sort_order: "desc",
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => nextPageParam(lastPage),
    staleTime: 30 * 1000,
  });

  const forms = useMemo(() => {
    const flat = formsInfinite.data?.pages.flatMap((p) => p?.forms ?? []) ?? [];
    const seen = new Set();
    return flat.filter((f) => {
      if (!f?.id || seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }, [formsInfinite.data?.pages]);

  const formsForDisplay = useMemo(() => {
    if (viewer !== "self") return forms;
    return forms.filter((f) => subjectMayStartForm(f));
  }, [forms, viewer]);

  const submissions = useMemo(() => {
    const flat = submissionsInfinite.data?.pages.flatMap((p) => p?.submissions ?? []) ?? [];
    const seen = new Set();
    return flat.filter((s) => {
      if (!s?.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [submissionsInfinite.data?.pages]);

  const submissionsByFormId = useMemo(() => {
    const m = new Map();
    for (const sub of submissions) {
      const fid = sub.form_id;
      if (!m.has(fid)) m.set(fid, []);
      m.get(fid).push(sub);
    }
    for (const list of m.values()) {
      list.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
    }
    return m;
  }, [submissions]);

  const groupedForms = useMemo(() => {
    const bySection = new Map();
    for (const form of formsForDisplay) {
      const sec = sectionLabel(form);
      if (!bySection.has(sec)) bySection.set(sec, []);
      bySection.get(sec).push(form);
    }
    const keys = [...bySection.keys()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return keys.map((k) => ({ section: k, items: bySection.get(k) }));
  }, [formsForDisplay]);

  if (!subjectUserId) {
    return null;
  }

  if (formsInfinite.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading personnel forms…
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Personnel forms
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {viewer === "self"
            ? "Your organisation has not linked any personnel forms yet."
            : "No forms are linked to the personnel file yet. Edit a form under Forms → enable Personnel file in form settings."}
        </CardContent>
      </Card>
    );
  }

  if (viewer === "self" && formsForDisplay.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Personnel forms
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          There are no forms here for you to complete yourself. Staff-only items (for example annual reviews) are completed
          by HR in the personnel file.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Personnel forms
        </h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {viewer === "self"
            ? "Forms your organisation lets you complete yourself. Each submission is stored separately. HR may complete other personnel records on your behalf."
            : "Structured records for this person using your existing custom forms. Each submission is kept as a separate copy (for example annual reviews or return-to-work)."}
        </p>
      </div>

      {submissionsInfinite.isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading submissions…
        </div>
      )}

      {groupedForms.map(({ section, items }) => (
        <div key={section} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{section}</h4>
          <div className="space-y-4">
            {items.map((form) => {
              const slug = form.slug || form.id;
              const subs = submissionsByFormId.get(form.id) || [];
              const mode = (form.form_config?.personnel?.completion_mode || "staff_only").replace(/_/g, " ");
              return (
                <Card key={form.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{form.form_title || form.form_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completion: <span className="capitalize">{mode}</span>
                          {form.access_config?.public_access ? (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              Public allowed
                            </Badge>
                          ) : null}
                        </p>
                      </div>
                      {canStartForms && (
                        <Button size="sm" asChild>
                          <Link href={`/admin/forms/${slug}/submit?subjectUserId=${subjectUserId}`}>
                            Start new
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {subs.length === 0 && !submissionsInfinite.isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        No submissions in the loaded history
                        {submissionsInfinite.hasNextPage
                          ? " — use Load more submissions below if this person has older records."
                          : "."}
                      </p>
                    ) : subs.length === 0 ? null : (
                      <ul className="space-y-1.5">
                        {subs.map((sub) => {
                          const subKey = sub.slug || sub.id;
                          let label = `Submission #${sub.id}`;
                          try {
                            const d = sub.created_at ? parseUTCDate(sub.created_at) : null;
                            if (d) label = format(d, "dd MMM yyyy HH:mm");
                          } catch {
                            /* ignore */
                          }
                          return (
                            <li key={sub.id}>
                              <Link
                                href={`/admin/forms/${slug}/submissions/${subKey}`}
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                              >
                                {label}
                                <ExternalLink className="h-3 w-3 opacity-60" />
                              </Link>
                              {sub.status ? (
                                <span className="text-xs text-muted-foreground ml-2">({sub.status})</span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {submissionsInfinite.hasNextPage && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submissionsInfinite.isFetchingNextPage}
            onClick={() => submissionsInfinite.fetchNextPage()}
          >
            {submissionsInfinite.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more submissions"
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {submissions.length} record{submissions.length === 1 ? "" : "s"} loaded ({SUBMISSIONS_PER_PAGE} per request)
          </span>
        </div>
      )}

      {formsInfinite.hasNextPage && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={formsInfinite.isFetchingNextPage}
            onClick={() => formsInfinite.fetchNextPage()}
          >
            {formsInfinite.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more form types"
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {viewer === "self"
              ? `${formsForDisplay.length} form type${formsForDisplay.length === 1 ? "" : "s"} shown${
                  forms.length > formsForDisplay.length ? ` (${forms.length} total in organisation)` : ""
                }`
              : `${forms.length} form type${forms.length === 1 ? "" : "s"} loaded`}
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useFormSubmissions } from "@/hooks/useForms";
import { parseUTCDate } from "@/utils/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_STATUS = "submitted";

function SubmissionsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const status = searchParams.get("status") || DEFAULT_STATUS;

  const { data, isLoading } = useFormSubmissions({
    page,
    per_page: 20,
    status,
  });

  const submissions = data?.submissions || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const filteredSubmissions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((submission) => {
      const idText = String(submission.slug || submission.id || "");
      const formName = String(submission.form_name || submission.form_title || "");
      const submittedBy = String(submission.submitted_by_name || submission.submitter_name || "");
      const statusText = String(submission.status || "");
      return (
        idText.toLowerCase().includes(q) ||
        formName.toLowerCase().includes(q) ||
        submittedBy.toLowerCase().includes(q) ||
        statusText.toLowerCase().includes(q)
      );
    });
  }, [searchTerm, submissions]);

  // If all pending-review submissions belong to one form, jump directly to that form queue.
  useEffect(() => {
    if (!submissions.length) return;
    const uniqueFormTargets = Array.from(
      new Set(
        submissions
          .map((submission) => submission.form_slug || submission.form_id)
          .filter(Boolean)
      )
    );
    if (uniqueFormTargets.length === 1) {
      router.replace(`/admin/forms/${uniqueFormTargets[0]}/submissions?status=${encodeURIComponent(status)}`);
    }
  }, [router, status, submissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Form Submissions</span>
            <Badge variant="secondary">
              {status.replace(/_/g, " ")} ({total})
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search in current page results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submission</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No submissions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => {
                    const submissionId = submission.slug || submission.id;
                    const formSlug = submission.form_slug || submission.form_id;
                    const statusValue = String(submission.status || "").toLowerCase();
                    const isPendingReview =
                      statusValue === "pending_review" || statusValue === "submitted";
                    return (
                      <TableRow
                        key={submissionId}
                        className={isPendingReview ? "bg-amber-50/60 dark:bg-amber-950/20" : ""}
                      >
                        <TableCell className="font-medium">{submissionId}</TableCell>
                        <TableCell>{submission.form_name || submission.form_title || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={isPendingReview ? "secondary" : "outline"}>
                            {String(submission.status || "-").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.submitted_at
                            ? format(parseUTCDate(submission.submitted_at), "dd/MM/yyyy HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formSlug ? (
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={`/admin/forms/${formSlug}/submissions?status=${encodeURIComponent(
                                  status
                                )}`}
                              >
                                Open Form Queue
                              </Link>
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/forms/submissions/${submissionId}`}>Open</Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))}
              disabled={page >= Math.max(totalPages, 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubmissionsListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SubmissionsListContent />
    </Suspense>
  );
}

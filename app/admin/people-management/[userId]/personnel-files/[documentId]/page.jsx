"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { useDocument } from "@/hooks/useDocuments";
import { useUser } from "@/hooks/useUsers";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useFileReferences } from "@/hooks/useFileReferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MultiFileUpload from "@/components/MultiFileUpload";
import FileAttachmentList from "@/components/FileAttachmentList";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";

export default function PersonnelFileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userSlug = params?.userId || params?.slug;
  const documentSlug = params?.documentId;

  const { hasPermission, isSuperuser } = usePermissionsCheck();
  const canAccessPeopleManagement =
    isSuperuser ||
    hasPermission("user:read") ||
    hasPermission("users:read") ||
    hasPermission("users:write");

  const { data: document, isLoading, error } = useDocument(documentSlug, {
    retry: false,
  });
  const { data: profileUserData } = useUser(userSlug);
  const { processedHtml, containerRef } = useFileReferences(document?.content);

  if (!canAccessPeopleManagement) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push(`/admin/people-management/${userSlug}?tab=personnel`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to person
        </Button>
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">Access restricted</p>
            <p className="text-sm text-muted-foreground">
              Personnel file documents are only available to users with people management access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error?.response?.status === 403 || error?.response?.status === 404) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push(`/admin/people-management/${userSlug}?tab=personnel`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to person
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error?.response?.status === 403
              ? "You do not have permission to view this personnel document."
              : "Personnel document not found."}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push(`/admin/people-management/${userSlug}?tab=personnel`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to person
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Personnel document not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" onClick={() => router.push(`/admin/people-management/${userSlug}?tab=personnel`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to person
          </Button>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="text-2xl font-semibold break-words">{document.title || "Personnel File Document"}</h1>
            <Badge variant="outline" className="shrink-0">
              <Lock className="h-3 w-3 mr-1" />
              Private — not shareable
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Updated{" "}
            {document.updated_at
              ? formatDistanceToNow(parseUTCDate(document.updated_at), { addSuffix: true })
              : "recently"}
            {profileUserData?.display_name || profileUserData?.email
              ? ` · Subject: ${profileUserData.display_name || profileUserData.email}`
              : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {document.category?.name && (
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <div className="mt-1">
                <Badge variant="secondary">{document.category.name}</Badge>
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Content</Label>
            <div
              ref={containerRef}
              className="prose prose-sm max-w-none mt-2"
              dangerouslySetInnerHTML={{ __html: processedHtml || "<p>No content available.</p>" }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MultiFileUpload
            entityType="document"
            entitySlug={document.slug || String(document.id)}
            maxFiles={10}
            maxSizeMB={50}
          />
          <FileAttachmentList entityType="document" entitySlug={document.slug || String(document.id)} showTitle={false} />
        </CardContent>
      </Card>

      {(document.slug || document.id) && (
        <ResourceAuditLogs
          resource="document"
          resourceSlug={document.slug || String(document.id)}
          pageSize={10}
          title="Access history"
        />
      )}
    </div>
  );
}

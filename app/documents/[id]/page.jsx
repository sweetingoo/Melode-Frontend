"use client";

import React, { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Share2, Globe, Users, Eye, Loader2 } from "lucide-react";
import { useDocument, useDocumentAuditLogs } from "@/hooks/useDocuments";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import FileAttachmentList from "@/components/FileAttachmentList";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";
import { formatDistanceToNow } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { useFileReferences } from "@/hooks/useFileReferences";

const DocumentViewPage = () => {
  const params = useParams();
  const router = useRouter();
  const documentSlug = params?.id || params?.slug;
  const { data: document, isLoading } = useDocument(documentSlug);
  const { hasPermission } = usePermissionsCheck();
  const { processedHtml, containerRef } = useFileReferences(document?.content);

  const canUpdate = hasPermission("document:update");
  const canDelete = hasPermission("document:delete");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Document not found</p>
            <Button variant="outline" onClick={() => router.push("/admin/documents")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            Published
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            Draft
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{document.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(document.status)}
              {document.category && (
                <Badge variant="secondary">{document.category.name}</Badge>
              )}
              {document.is_public ? (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              ) : document.shared_with_user_ids?.length > 0 ? (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {document.shared_with_user_ids.length} shared
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {document.access_count > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {document.access_count} {document.access_count === 1 ? "view" : "views"}
            </div>
          )}
          {canUpdate && (
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/documents?edit=${document.slug || document.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Document Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content</CardTitle>
            <div className="text-sm text-muted-foreground">
              {document.author && (
                <span>
                  By {document.author.name || document.author.email} •{" "}
                </span>
              )}
              {document.updated_at &&
                `Updated ${formatDistanceToNow(parseUTCDate(document.updated_at), {
                  addSuffix: true,
                })}`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {document.content ? (
            <div
              ref={containerRef}
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <FileAttachmentList
        entityType="document"
        entitySlug={document.slug}
        showTitle={true}
      />

      {/* Audit Logs */}
      <ResourceAuditLogs
        resource="document"
        resourceSlug={document.slug}
        pageSize={10}
        title="Access History"
      />
    </div>
  );
};

export default DocumentViewPage;


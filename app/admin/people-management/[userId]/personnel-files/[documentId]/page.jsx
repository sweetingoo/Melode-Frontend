"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Loader2, Save, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { useDocument, useShareDocument, useUnshareDocument, useUpdateDocument } from "@/hooks/useDocuments";
import { useUsersAll } from "@/hooks/useUsers";
import { useUser } from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useAuth";
import { useFileReferences } from "@/hooks/useFileReferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import UserMentionSelector from "@/components/UserMentionSelector";
import FileAttachmentList from "@/components/FileAttachmentList";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";
import { toast } from "sonner";

export default function PersonnelFileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userSlug = params?.userId || params?.slug;
  const documentSlug = params?.documentId;

  const { data: document, isLoading } = useDocument(documentSlug);
  const { data: profileUserData } = useUser(userSlug);
  const { data: currentUserData } = useCurrentUser();
  const { data: usersAllResponse } = useUsersAll(100);
  const updateDocument = useUpdateDocument();
  const shareDocument = useShareDocument();
  const unshareDocument = useUnshareDocument();
  const { processedHtml, containerRef } = useFileReferences(document?.content);

  const users = usersAllResponse?.users || usersAllResponse || [];
  const [isPublic, setIsPublic] = useState(false);
  const [sharedUserIds, setSharedUserIds] = useState([]);

  useEffect(() => {
    if (!document) return;
    setIsPublic(Boolean(document.is_public));
    setSharedUserIds(Array.isArray(document.shared_with_user_ids) ? document.shared_with_user_ids : []);
  }, [document]);

  const selectedUsers = useMemo(
    () => users.filter((u) => sharedUserIds.includes(u.id)),
    [users, sharedUserIds]
  );

  const handleSaveSharing = async () => {
    if (!document) return;
    const slug = document.slug || document.id;
    try {
      // Never allow losing access for the profile user or current user.
      const requiredUserIds = new Set();
      if (profileUserData?.id != null) requiredUserIds.add(profileUserData.id);
      if (currentUserData?.id != null) requiredUserIds.add(currentUserData.id);

      const enforcedSharedUserIds = Array.from(
        new Set([...(Array.isArray(sharedUserIds) ? sharedUserIds : []), ...requiredUserIds])
      );
      if (enforcedSharedUserIds.length !== sharedUserIds.length) {
        setSharedUserIds(enforcedSharedUserIds);
      }

      if (isPublic !== Boolean(document.is_public)) {
        await updateDocument.mutateAsync({
          slug,
          documentData: { is_public: isPublic },
        });
      }

      const currentShared = Array.isArray(document.shared_with_user_ids)
        ? document.shared_with_user_ids
        : [];
      const toAdd = enforcedSharedUserIds.filter((id) => !currentShared.includes(id));
      const toRemove = currentShared.filter(
        (id) => !enforcedSharedUserIds.includes(id) && !requiredUserIds.has(id)
      );

      if (toAdd.length > 0) {
        await shareDocument.mutateAsync({ slug, userIds: toAdd });
      }
      if (toRemove.length > 0) {
        await unshareDocument.mutateAsync({ slug, userIds: toRemove });
      }
      toast.success("Sharing settings updated");
    } catch (error) {
      // mutation hooks show proper toast errors
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push(`/admin/people-management/${userSlug}?tab=compliance`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to person
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Personnel document not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" onClick={() => router.push(`/admin/people-management/${userSlug}?tab=compliance`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to person
          </Button>
          <h1 className="text-2xl font-semibold mt-1 break-words">{document.title || "Personnel File Document"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Updated{" "}
            {document.updated_at
              ? formatDistanceToNow(parseUTCDate(document.updated_at), { addSuffix: true })
              : "recently"}
          </p>
        </div>
        <Button
          onClick={handleSaveSharing}
          disabled={updateDocument.isPending || shareDocument.isPending || unshareDocument.isPending}
        >
          {updateDocument.isPending || shareDocument.isPending || unshareDocument.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save sharing
            </>
          )}
        </Button>
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sharing access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="personnel-public" className="font-medium">
                Public access
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                If enabled, all authenticated users can access this personnel document.
              </p>
            </div>
            <Switch
              id="personnel-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Share with specific users</Label>
            <UserMentionSelector
              users={users}
              selectedUserIds={sharedUserIds}
              onSelectionChange={setSharedUserIds}
              placeholder="Search and select users..."
            />
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => {
                  const label =
                    user.display_name ||
                    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                    user.email ||
                    `User #${user.id}`;
                  return (
                    <Badge key={user.id} variant="secondary">
                      {label}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <FileAttachmentList entityType="document" entitySlug={document.slug || String(document.id)} showTitle />

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

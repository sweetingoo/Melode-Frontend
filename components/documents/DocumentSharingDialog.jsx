"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import UserMentionSelector from "@/components/UserMentionSelector";
import { useUsers } from "@/hooks/useUsers";
import {
  useDocument,
  useShareDocument,
  useUnshareDocument,
  useUpdateDocument,
} from "@/hooks/useDocuments";
import { Globe, Users, X, Loader2, Copy, Check, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const DocumentSharingDialog = ({ open, onOpenChange, documentId, documentSlug }) => {
  const { data: document } = useDocument(documentSlug || documentId, { enabled: !!(documentSlug || documentId) && open });
  const { data: usersData } = useUsers({ per_page: 100 });
  const shareDocument = useShareDocument();
  const unshareDocument = useUnshareDocument();
  const updateDocument = useUpdateDocument();

  const [isPublic, setIsPublic] = useState(false);
  const [sharedUserIds, setSharedUserIds] = useState([]);
  const [copied, setCopied] = useState(false);

  const users = usersData?.users || usersData || [];

  // Generate shareable link
  const getShareLink = () => {
    if (!documentId) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/documents/${documentId}/preview`;
  };

  // Copy share link to clipboard
  const handleCopyShareLink = async () => {
    const shareLink = getShareLink();
    if (!shareLink) {
      toast.error("Unable to generate share link");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  useEffect(() => {
    if (document) {
      setIsPublic(document.is_public || false);
      setSharedUserIds(document.shared_with_user_ids || []);
    }
  }, [document]);

  const handleTogglePublic = async (checked) => {
    try {
      await updateDocument.mutateAsync({
        id: documentId,
        documentData: { is_public: checked },
      });
      setIsPublic(checked);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleShare = async () => {
    try {
      const currentShared = document?.shared_with_user_ids || [];
      const toAdd = sharedUserIds.filter((id) => !currentShared.includes(id));
      const toRemove = currentShared.filter((id) => !sharedUserIds.includes(id));

      if (toAdd.length > 0) {
        await shareDocument.mutateAsync({ id: documentId, userIds: toAdd });
      }
      if (toRemove.length > 0) {
        await unshareDocument.mutateAsync({ id: documentId, userIds: toRemove });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveUser = (userId) => {
    setSharedUserIds(sharedUserIds.filter((id) => id !== userId));
  };

  const selectedUsers = users.filter((user) => sharedUserIds.includes(user.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Control who can access this document. Public documents are visible to all
            authenticated users.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Shareable Link Section */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Shareable Link</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this link to share the document. The link will only work if the document is public or shared with the recipient.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={getShareLink()}
                readOnly
                className="flex-1 font-mono text-sm bg-background"
                onClick={(e) => e.target.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyShareLink}
                title="Copy share link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyShareLink}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Share Link
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Public Toggle */}
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="is_public" className="font-semibold">
                  Make Public
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Visible to all authenticated users. Anyone with the shareable link can access it.
              </p>
            </div>
            <Switch
              id="is_public"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={updateDocument.isPending}
            />
          </div>

          {/* User Sharing */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Share with Specific Users
            </Label>
            <p className="text-xs text-muted-foreground">
              Select specific users to share with. They will receive a notification and can access via the shareable link.
            </p>
            <UserMentionSelector
              users={users}
              selectedUserIds={sharedUserIds}
              onSelectionChange={setSharedUserIds}
              placeholder="Search and select users..."
            />

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Shared Users ({selectedUsers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => {
                    const displayName =
                      user.display_name ||
                      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                      user.email ||
                      `User #${user.id}`;
                    return (
                      <Badge key={user.id} variant="secondary" className="gap-1">
                        {displayName}
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={
              shareDocument.isPending ||
              unshareDocument.isPending ||
              updateDocument.isPending
            }
          >
            {shareDocument.isPending || unshareDocument.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentSharingDialog;


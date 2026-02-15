"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from "@/hooks/useComments";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useCommentAttachments, useAttachFilesToComment } from "@/hooks/useFiles";
import { filesService } from "@/services/files";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarWithUrl } from "@/components/AvatarWithUrl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Reply, Edit2, Trash2, Send, X, Paperclip, Download, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseTime } from "@/utils/time";

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = parseTime(timestamp);
  if (!date || isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older dates, show formatted date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

/**
 * Get user initials for avatar
 */
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Comment Attachments Display Component
 */
const CommentAttachments = ({ commentSlug }) => {
  const { data, isLoading } = useCommentAttachments(commentSlug);

  if (isLoading || !data?.attachments || data.attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = async (fileSlug, downloadUrl) => {
    // Prefer using file_slug to get a fresh signed URL, fallback to download_url if available
    if (fileSlug) {
      try {
        const { url } = await filesService.getFileUrl(fileSlug);
        window.open(url, "_blank");
      } catch (error) {
        console.error("Failed to get file URL:", error);
        // Fallback to download_url if available
        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
        }
      }
    } else if (downloadUrl) {
      // Fallback to download_url if file_slug not available
      window.open(downloadUrl, "_blank");
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return "🖼️";
      case "zip":
      case "rar":
        return "📦";
      default:
        return "📎";
    }
  };

  return (
    <div className="mt-2 space-y-1">
      {data.attachments.map((attachment) => {
        const fileSlug = attachment.file_slug || attachment.file?.slug;
        const downloadUrl = attachment.download_url || attachment.file?.download_url;
        
        return (
          <div
            key={attachment.id}
            className="flex items-center gap-2 p-2 bg-muted/50 rounded border text-sm"
          >
            <span className="text-lg">{getFileIcon(attachment.file_name)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{attachment.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size_bytes)}
              </p>
            </div>
            {(fileSlug || downloadUrl) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDownload(fileSlug, downloadUrl)}
                title="Download"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Single Comment Component
 */
const CommentItem = ({
  comment,
  entityType,
  entitySlug,
  currentUserId,
  isAdmin,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
  isEditing = false,
  onCancelEdit,
  replies = [],
  editingCommentId = null,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [editText, setEditText] = useState(comment.comment_text);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const replyFileInputRef = useRef(null);
  const commentSlug = comment.slug || comment.id;

  // Sync editText when comment changes or editing starts
  useEffect(() => {
    if (isEditing) {
      setEditText(comment.comment_text);
    }
  }, [isEditing, comment.comment_text]);

  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const attachFilesToCommentMutation = useAttachFilesToComment();

  const canEdit = currentUserId === comment.created_by_user_id || isAdmin;
  const canDelete = currentUserId === comment.created_by_user_id || isAdmin;
  const hasReplies = (replies && replies.length > 0) || comment.replies_count > 0;

  const handleReply = async () => {
    if (!replyText.trim() && replyFiles.length === 0) return;

    const replyResult = await addCommentMutation.mutateAsync({
      entityType,
      entitySlug,
      commentData: {
        comment_text: replyText.trim() || "",
        parent_comment_id: comment.id, // Keep ID in body for backward compatibility
      },
    });

    // Attach files if any were selected
    if (replyFiles.length > 0 && replyResult?.data?.slug) {
      try {
        await attachFilesToCommentMutation.mutateAsync({
          commentSlug: replyResult.data.slug,
          files: replyFiles,
        });
      } catch (error) {
        console.error("Failed to attach files to reply:", error);
      }
    }

    setReplyText("");
    setReplyFiles([]);
    setShowReplyInput(false);
  };

  const handleReplyFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setReplyFiles((prev) => [...prev, ...files]);
  };

  const removeReplyFile = (index) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;

    const commentSlug = comment.slug || comment.id; // Use slug if available, fallback to id
    await updateCommentMutation.mutateAsync({
      entityType,
      entitySlug,
      commentSlug,
      commentData: {
        comment_text: editText.trim(),
      },
    });

    onCancelEdit();
  };

  const handleDelete = async () => {
    const commentSlug = comment.slug || comment.id; // Use slug if available, fallback to id
    await deleteCommentMutation.mutateAsync({
      entityType,
      entitySlug,
      commentSlug,
    });
    setShowDeleteDialog(false);
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", depth > 0 && "ml-8 mt-2")}>
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Edit your comment..."
          className="min-h-[80px]"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleEdit}
            disabled={!editText.trim() || updateCommentMutation.isPending}
          >
            <Send className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelEdit}
            disabled={updateCommentMutation.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", depth > 0 && "ml-8 mt-2")}>
      <div className="flex gap-3">
        <AvatarWithUrl
          avatarValue={comment.created_by_avatar_url}
          alt={comment.created_by_name || "User"}
          fallback={getInitials(comment.created_by_name)}
          className="h-8 w-8"
          fallbackProps={{ className: "text-xs" }}
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.created_by_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {comment.comment_text}
          </p>
          {(comment.note_category || comment.contact_method || comment.contact_outcome) && (
            <div className="flex flex-wrap gap-1.5 mt-1 text-xs text-muted-foreground">
              {comment.note_category && <span className="rounded bg-muted px-1.5 py-0.5">{comment.note_category}</span>}
              {comment.contact_method && <span>Method: {comment.contact_method}</span>}
              {comment.contact_outcome && <span>Outcome: {comment.contact_outcome}</span>}
            </div>
          )}
          {/* Comment Attachments */}
          {commentSlug && <CommentAttachments commentSlug={commentSlug} />}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onEdit(comment.id)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {canDelete && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                <AlertDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this comment? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {showReplyInput && (
        <div className="ml-11 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px]"
          />
          {/* File Upload for Reply */}
          <div className="space-y-2">
            <input
              ref={replyFileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleReplyFileSelect}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => replyFileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Attach Files
              </Button>
              {replyFiles.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {replyFiles.length} file(s) selected
                </span>
              )}
            </div>
            {replyFiles.length > 0 && (
              <div className="space-y-1">
                {replyFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeReplyFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={(!replyText.trim() && replyFiles.length === 0) || addCommentMutation.isPending || attachFilesToCommentMutation.isPending}
            >
              <Send className="h-4 w-4 mr-1" />
              Reply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowReplyInput(false);
                setReplyText("");
                setReplyFiles([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Render Replies */}
      {hasReplies && replies && replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-border pl-4">
          {replies.map((replyItem) => (
            <CommentItem
              key={replyItem.comment.id}
              comment={replyItem.comment}
              entityType={entityType}
              entitySlug={entitySlug}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={replyItem.depth}
              replies={replyItem.replies}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              isEditing={editingCommentId === replyItem.comment.id}
              onCancelEdit={onCancelEdit}
              editingCommentId={editingCommentId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main Comment Thread Component
 */
export const CommentThread = ({
  entityType,
  entitySlug,
  className,
  showHeader = true,
  initialPage = 1,
  perPage = 50,
  noteCategories = [], // Note categories for tracker entries
}) => {
  const [page, setPage] = useState(initialPage);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentNoteCategory, setNewCommentNoteCategory] = useState("");
  const [newCommentContactMethod, setNewCommentContactMethod] = useState("");
  const [newCommentContactOutcome, setNewCommentContactOutcome] = useState("");
  const [newCommentFiles, setNewCommentFiles] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const newCommentFileInputRef = useRef(null);
  const { data: currentUser } = useCurrentUser();
  const { hasWildcardPermissions } = usePermissionsCheck();

  const {
    data: commentsData,
    isLoading,
    isError,
    error,
  } = useComments(
    entityType,
    entitySlug,
    {
      page,
      per_page: perPage,
      include_replies: true,
    }
  );

  const addCommentMutation = useAddComment();
  const attachFilesToCommentMutation = useAttachFilesToComment();

  const currentUserId = currentUser?.id || currentUser?.user_id;
  const isAdmin = hasWildcardPermissions;

  const handleAddComment = async () => {
    if (!newCommentText.trim() && newCommentFiles.length === 0) return;

    const commentResult = await addCommentMutation.mutateAsync({
      entityType,
      entitySlug,
      commentData: {
        comment_text: newCommentText.trim() || "",
        parent_comment_id: null,
        note_category: newCommentNoteCategory || null,
        contact_method: newCommentContactMethod || null,
        contact_outcome: newCommentContactOutcome || null,
      },
    });

    // Attach files if any were selected
    if (newCommentFiles.length > 0 && commentResult?.data?.slug) {
      try {
        await attachFilesToCommentMutation.mutateAsync({
          commentSlug: commentResult.data.slug,
          files: newCommentFiles,
        });
      } catch (error) {
        console.error("Failed to attach files to comment:", error);
      }
    }

    setNewCommentText("");
    setNewCommentNoteCategory("");
    setNewCommentContactMethod("");
    setNewCommentContactOutcome("");
    setNewCommentFiles([]);
  };

  const handleNewCommentFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setNewCommentFiles((prev) => [...prev, ...files]);
  };

  const removeNewCommentFile = (index) => {
    setNewCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (commentId) => {
    setEditingCommentId(commentId);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };

  const handleDelete = async (commentId) => {
    // Handled in CommentItem component
  };

  // Organise comments into threaded structure
  const organizedComments = useMemo(() => {
    if (!commentsData?.comments) return [];

    const comments = commentsData.comments || [];
    const topLevel = comments.filter((c) => !c.parent_comment_id);
    const repliesMap = new Map();

    // Group replies by parent
    comments.forEach((comment) => {
      if (comment.parent_comment_id) {
        if (!repliesMap.has(comment.parent_comment_id)) {
          repliesMap.set(comment.parent_comment_id, []);
        }
        repliesMap.get(comment.parent_comment_id).push(comment);
      }
    });

    // Sort replies by created_at
    repliesMap.forEach((replies) => {
      replies.sort(
        (a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
      );
    });

    // Sort top-level comments by created_at (newest first)
    topLevel.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // Build threaded structure with replies attached
    const buildThread = (comment, depth = 0) => {
      const replies = repliesMap.get(comment.id) || [];
      return {
        comment,
        depth,
        replies: replies.map((reply) => buildThread(reply, depth + 1)),
      };
    };

    return topLevel.map((comment) => buildThread(comment));
  }, [commentsData]);

  if (isError) {
    return (
      <div className={cn("p-4 text-center text-sm text-muted-foreground", className)}>
        <p>Failed to load comments</p>
        <p className="text-xs mt-1">
          {error?.response?.data?.message || error?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">
            Comments
            {commentsData?.total !== undefined && (
              <span className="text-muted-foreground font-normal ml-2">
                ({commentsData.total})
              </span>
            )}
          </h3>
        </div>
      )}

      {/* Add Comment Form */}
      <div className="space-y-2">
        {entityType === "tracker_entry" && noteCategories && noteCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="note-category" className="text-sm">Note Category (Optional)</Label>
              <Select
                value={newCommentNoteCategory}
                onValueChange={setNewCommentNoteCategory}
              >
                <SelectTrigger id="note-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {noteCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-method" className="text-sm">Contact Method (Optional)</Label>
              <Select
                value={newCommentContactMethod}
                onValueChange={setNewCommentContactMethod}
              >
                <SelectTrigger id="contact-method">
                  <SelectValue placeholder="Call, SMS, etc." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-outcome" className="text-sm">Contact Outcome (Optional)</Label>
              <Select
                value={newCommentContactOutcome}
                onValueChange={setNewCommentContactOutcome}
              >
                <SelectTrigger id="contact-outcome">
                  <SelectValue placeholder="Answered, No answer, etc." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Answered">Answered</SelectItem>
                  <SelectItem value="No answer">No answer</SelectItem>
                  <SelectItem value="Left voicemail">Left voicemail</SelectItem>
                  <SelectItem value="Letter sent">Letter sent</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <Textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[100px]"
        />
        {/* File Upload for New Comment */}
        <div className="space-y-2">
          <input
            ref={newCommentFileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleNewCommentFileSelect}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => newCommentFileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach Files
            </Button>
            {newCommentFiles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {newCommentFiles.length} file(s) selected
              </span>
            )}
          </div>
          {newCommentFiles.length > 0 && (
            <div className="space-y-1">
              {newCommentFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => removeNewCommentFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleAddComment}
            disabled={(!newCommentText.trim() && newCommentFiles.length === 0) || addCommentMutation.isPending || attachFilesToCommentMutation.isPending}
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" />
            {addCommentMutation.isPending || attachFilesToCommentMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading comments...
          </div>
        ) : organizedComments.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          organizedComments.map((threadItem) => (
            <CommentItem
              key={threadItem.comment.id}
              comment={threadItem.comment}
              entityType={entityType}
              entitySlug={entitySlug}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={threadItem.depth}
              replies={threadItem.replies}
              onReply={() => { }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isEditing={editingCommentId === threadItem.comment.id}
              onCancelEdit={handleCancelEdit}
              editingCommentId={editingCommentId}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {commentsData?.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {commentsData.page} of {commentsData.total_pages} (
            {commentsData.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(commentsData.total_pages, p + 1))
              }
              disabled={page >= commentsData.total_pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentThread;


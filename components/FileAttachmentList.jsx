"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";
import { useEntityAttachments, useDeleteAttachment, useDownloadFile } from "@/hooks/useFiles";
import { formatDistanceToNow } from "date-fns";

const FileAttachmentList = ({
  entityType,
  entityId,
  includeInactive = false,
  showTitle = true,
  className = "",
}) => {
  const { data, isLoading, error } = useEntityAttachments(
    entityType,
    entityId,
    includeInactive
  );
  const deleteAttachmentMutation = useDeleteAttachment();
  const downloadFileMutation = useDownloadFile();

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName, contentType) => {
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
      case "mp4":
      case "mov":
      case "avi":
        return "🎥";
      case "mp3":
      case "wav":
        return "🎵";
      default:
        return "📎";
    }
  };

  const handleDownload = async (downloadUrl, fileName) => {
    try {
      await downloadFileMutation.mutateAsync(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await deleteAttachmentMutation.mutateAsync({
        attachmentId,
        softDelete: true,
        entityType,
        entityId,
      });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            Failed to load attachments
          </p>
        </CardContent>
      </Card>
    );
  }

  const attachments = data?.attachments || [];
  const total = data?.total || 0;

  if (total === 0) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No attachments found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle>Attachments ({total})</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const {
              id,
              file_name,
              file_size_bytes,
              content_type,
              download_url,
              description,
              created_at,
              is_active,
            } = attachment;

            return (
              <div
                key={id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border
                  ${!is_active ? "opacity-60 bg-muted/50" : "bg-muted/30"}
                `}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl">
                    {getFileIcon(file_name, content_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file_size_bytes)}</span>
                      {content_type && (
                        <>
                          <span>•</span>
                          <span>{content_type}</span>
                        </>
                      )}
                      {created_at && (
                        <>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    {description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {download_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(download_url, file_name)}
                      disabled={downloadFileMutation.isPending}
                      title="Download"
                    >
                      {downloadFileMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{file_name}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteAttachmentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileAttachmentList;


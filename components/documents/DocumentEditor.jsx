"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";
import MultiFileUpload from "@/components/MultiFileUpload";
import FileAttachmentList from "@/components/FileAttachmentList";
import {
  useCreateDocument,
  useUpdateDocument,
  useDocument,
} from "@/hooks/useDocuments";
import { useDocumentCategories } from "@/hooks/useDocumentCategories";
import { generateSlug } from "@/utils/slug";
import { Loader2, Save, Plus, Trash2, GripVertical } from "lucide-react";

const DocumentEditor = ({ documentId, documentSlug, initialCategoryId = null, onSave, onCancel }) => {
  const { data: document, isLoading: documentLoading } = useDocument(documentSlug || documentId, {
    enabled: !!(documentSlug || documentId),
  });
  const { data: categoriesData } = useDocumentCategories();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: initialCategoryId,
    status: "published",
    is_public: false,
    youtube_videos: [],
  });

  const categories = categoriesData?.categories || [];

  // Flatten categories for select
  const flattenCategories = (cats, depth = 0) => {
    let result = [];
    cats.forEach((cat) => {
      result.push({
        ...cat,
        displayName: "  ".repeat(depth) + cat.name,
      });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, depth + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  useEffect(() => {
    if (document) {
      // Handle both category object and category_id
      const categoryId = document.category?.id || document.category_id || null;
      setFormData({
        title: document.title || "",
        content: document.content || "",
        category_id: categoryId,
        status: document.status || "published",
        is_public: document.is_public || false,
        youtube_videos: document.youtube_videos || [],
      });
    } else {
      // When creating a new document, use initialCategoryId if provided
      setFormData({
        title: "",
        content: "",
        category_id: initialCategoryId || null,
        status: "published",
        is_public: false,
        youtube_videos: [],
      });
    }
  }, [document, initialCategoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Images are already uploaded and file_reference_url is stored in content
      // No need to upload pending images anymore
      const finalFormData = { ...formData };

      if (documentId || documentSlug) {
        const slug = document?.slug || documentSlug || documentId;
        await updateDocument.mutateAsync({ slug: slug, documentData: finalFormData });
      } else {
        // Auto-generate unique slug from title when creating a new document
        if (!finalFormData.slug && finalFormData.title) {
          const baseSlug = generateSlug(finalFormData.title);
          // Add timestamp to ensure uniqueness
          const uniqueSuffix = Date.now().toString(36);
          finalFormData.slug = `${baseSlug}-${uniqueSuffix}`;
        }
        await createDocument.mutateAsync(finalFormData);
      }
      if (onSave) {
        onSave();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  // YouTube video management functions
  const addYouTubeVideo = () => {
    setFormData({
      ...formData,
      youtube_videos: [
        ...(formData.youtube_videos || []),
        { video_url: "", title: "", order: formData.youtube_videos?.length || 0 },
      ],
    });
  };

  const removeYouTubeVideo = (index) => {
    const updatedVideos = formData.youtube_videos.filter((_, i) => i !== index);
    // Reorder remaining videos
    const reorderedVideos = updatedVideos.map((video, i) => ({ ...video, order: i }));
    setFormData({ ...formData, youtube_videos: reorderedVideos });
  };

  const updateYouTubeVideo = (index, field, value) => {
    const updatedVideos = [...(formData.youtube_videos || [])];
    updatedVideos[index] = { ...updatedVideos[index], [field]: value };
    setFormData({ ...formData, youtube_videos: updatedVideos });
  };

  const moveYouTubeVideo = (index, direction) => {
    const videos = [...(formData.youtube_videos || [])];
    if (direction === "up" && index > 0) {
      [videos[index - 1], videos[index]] = [videos[index], videos[index - 1]];
      videos[index - 1].order = index - 1;
      videos[index].order = index;
    } else if (direction === "down" && index < videos.length - 1) {
      [videos[index], videos[index + 1]] = [videos[index + 1], videos[index]];
      videos[index].order = index;
      videos[index + 1].order = index + 1;
    }
    setFormData({ ...formData, youtube_videos: videos });
  };

  if (documentLoading && (documentId || documentSlug)) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{(documentId || documentSlug) ? "Edit Document" : "Create Document"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category *</Label>
              <Select
                key={`category-select-${flatCategories.length}-${formData.category_id}`}
                value={
                  formData.category_id && flatCategories.length > 0
                    ? formData.category_id.toString()
                    : ""
                }
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: parseInt(value) })
                }
                disabled={flatCategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : (
                    flatCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.displayName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="is_public">Make Public</Label>
                <p className="text-xs text-muted-foreground">
                  Visible to all authenticated users
                </p>
              </div>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_public: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Enter document content..."
              />
            </div>
          </CardContent>
        </Card>

        {/* YouTube Videos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>YouTube Videos</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addYouTubeVideo}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.youtube_videos && formData.youtube_videos.length > 0 ? (
              formData.youtube_videos.map((video, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Video {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveYouTubeVideo(index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveYouTubeVideo(index, "down")}
                        disabled={index === formData.youtube_videos.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeYouTubeVideo(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`video_url_${index}`}>YouTube Video URL *</Label>
                      <Input
                        id={`video_url_${index}`}
                        value={video.video_url || ""}
                        onChange={(e) =>
                          updateYouTubeVideo(index, "video_url", e.target.value)
                        }
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a YouTube video URL (watch URL or short URL)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`video_title_${index}`}>Title (Optional)</Label>
                      <Input
                        id={`video_title_${index}`}
                        value={video.title || ""}
                        onChange={(e) =>
                          updateYouTubeVideo(index, "title", e.target.value)
                        }
                        placeholder="Video title or description"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No videos added. Click "Add Video" to add a YouTube video.
              </p>
            )}
          </CardContent>
        </Card>

        {/* File Attachments */}
        {document && document.slug && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MultiFileUpload
                  entityType="document"
                  entitySlug={document.slug}
                  maxFiles={10}
                  maxSizeMB={50}
                />
                <FileAttachmentList
                  entityType="document"
                  entitySlug={document.slug}
                  showTitle={false}
                />
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createDocument.isPending || updateDocument.isPending}
          >
            {createDocument.isPending || updateDocument.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {(documentId || documentSlug) ? "Update Document" : "Create Document"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default DocumentEditor;


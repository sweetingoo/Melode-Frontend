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
import { Loader2, Save } from "lucide-react";

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
      });
    } else {
      // When creating a new document, use initialCategoryId if provided
      setFormData({
        title: "",
        content: "",
        category_id: initialCategoryId || null,
        status: "published",
        is_public: false,
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
      setIsUploadingImages(false);
      // Error handled by mutation
    }
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


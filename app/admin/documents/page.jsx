"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FolderTree, FileText, Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import DocumentList from "@/components/documents/DocumentList";
import CategoryTree from "@/components/documents/CategoryTree";
import DocumentEditor from "@/components/documents/DocumentEditor";
import DocumentSharingDialog from "@/components/documents/DocumentSharingDialog";
import CategoryDialog from "@/components/documents/CategoryDialog";
import CategoryPermissionsDialog from "@/components/documents/CategoryPermissionsDialog";

const DocumentsPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissionsCheck();

  const canCreateDocument = hasPermission("document:create");
  const canUpdateDocument = hasPermission("document:update");
  const canDeleteDocument = hasPermission("document:delete");
  const canManageCategories = hasPermission("document_category:manage");

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "categories"
  const [isCreateDocumentOpen, setIsCreateDocumentOpen] = useState(false);
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [sharingDocumentId, setSharingDocumentId] = useState(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [permissionsCategory, setPermissionsCategory] = useState(null);
  const [isClosingEditor, setIsClosingEditor] = useState(false);

  const handleViewDocument = (document) => {
    router.push(`/documents/${document.slug || document.id}`);
  };

  const handleEditDocument = (document) => {
    setEditingDocumentId(document.slug || document.id);
    setIsEditDocumentOpen(true);
  };

  const handleDeleteDocument = (document) => {
    // Handled by DocumentList component
  };

  const handleShareDocument = (document) => {
    setSharingDocumentId(document.slug || document.id);
  };

  const handleCreateDocument = () => {
    setEditingDocumentId(null);
    setIsCreateDocumentOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleAddSubcategory = (category) => {
    setParentCategory(category);
    setEditingCategory(null);
    setIsCategoryDialogOpen(true);
  };

  const handleManagePermissions = (category) => {
    setPermissionsCategory(category);
    setIsPermissionsDialogOpen(true);
  };

  // Handle edit query parameter from URL
  useEffect(() => {
    const editParam = searchParams?.get("edit");
    if (editParam && !isEditDocumentOpen && !isCreateDocumentOpen && !isClosingEditor) {
      setEditingDocumentId(editParam);
      setIsEditDocumentOpen(true);
    }
  }, [searchParams, isEditDocumentOpen, isCreateDocumentOpen, isClosingEditor]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage policies, handbooks, and other documents
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Desktop: Show buttons */}
          <div className="hidden md:flex items-center gap-2">
            {canManageCategories && (
              <Button
                variant="outline"
                onClick={() => {
                  setViewMode(viewMode === "categories" ? "list" : "categories");
                }}
                size="sm"
              >
                <FolderTree className="mr-2 h-4 w-4" />
                {viewMode === "categories" ? "Documents" : "Categories"}
              </Button>
            )}
            {canCreateDocument && (
              <Button
                onClick={handleCreateDocument}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            )}
          </div>
          
          {/* Mobile/Tablet: Show dropdown menu */}
          {(canManageCategories || canCreateDocument) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManageCategories && (
                  <DropdownMenuItem
                    onClick={() => {
                      setViewMode(viewMode === "categories" ? "list" : "categories");
                    }}
                  >
                    <FolderTree className="mr-2 h-4 w-4" />
                    {viewMode === "categories" ? "Documents" : "Categories"}
                  </DropdownMenuItem>
                )}
                {canCreateDocument && (
                  <DropdownMenuItem onClick={handleCreateDocument}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Document
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "categories" ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">Categories</h2>
              {canManageCategories && (
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setParentCategory(null);
                    setIsCategoryDialogOpen(true);
                  }}
                  className="w-full sm:w-auto flex-shrink-0"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </Button>
              )}
            </div>
            <CategoryTree
              onSelectCategory={(category) => {
                setSelectedCategoryId(category.id);
                setViewMode("list");
              }}
              selectedCategoryId={selectedCategoryId}
              onEditCategory={handleEditCategory}
              onAddSubcategory={handleAddSubcategory}
              onManagePermissions={handleManagePermissions}
              canManage={canManageCategories}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Categories</h3>
              <CategoryTree
                onSelectCategory={(category) => setSelectedCategoryId(category.id)}
                selectedCategoryId={selectedCategoryId}
                onEditCategory={canManageCategories ? handleEditCategory : undefined}
                onAddSubcategory={canManageCategories ? handleAddSubcategory : undefined}
                onManagePermissions={canManageCategories ? handleManagePermissions : undefined}
                canManage={canManageCategories}
              />
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="lg:col-span-3">
            <DocumentList
              categoryId={selectedCategoryId}
              onViewDocument={handleViewDocument}
              onEditDocument={canUpdateDocument ? handleEditDocument : undefined}
              onDeleteDocument={canDeleteDocument ? handleDeleteDocument : undefined}
              onShareDocument={handleShareDocument}
              canEdit={canUpdateDocument}
              canDelete={canDeleteDocument}
            />
          </div>
        </div>
      )}

      {/* Document Editor Dialog */}
      {(isCreateDocumentOpen || isEditDocumentOpen) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="container max-w-4xl mx-auto py-8">
            <DocumentEditor
              documentId={editingDocumentId}
              documentSlug={editingDocumentId}
              initialCategoryId={isCreateDocumentOpen ? selectedCategoryId : null}
              onSave={() => {
                setIsClosingEditor(true);
                setIsCreateDocumentOpen(false);
                setIsEditDocumentOpen(false);
                setEditingDocumentId(null);
                // Remove edit query parameter from URL
                if (searchParams?.get("edit")) {
                  const newSearchParams = new URLSearchParams(searchParams.toString());
                  newSearchParams.delete("edit");
                  const queryString = newSearchParams.toString();
                  router.replace(queryString ? `/admin/documents?${queryString}` : '/admin/documents');
                }
                // Reset closing flag after a short delay to allow URL update to complete
                setTimeout(() => setIsClosingEditor(false), 100);
              }}
              onCancel={() => {
                setIsClosingEditor(true);
                setIsCreateDocumentOpen(false);
                setIsEditDocumentOpen(false);
                setEditingDocumentId(null);
                // Remove edit query parameter from URL
                if (searchParams?.get("edit")) {
                  const newSearchParams = new URLSearchParams(searchParams.toString());
                  newSearchParams.delete("edit");
                  const queryString = newSearchParams.toString();
                  router.replace(queryString ? `/admin/documents?${queryString}` : '/admin/documents');
                }
                // Reset closing flag after a short delay to allow URL update to complete
                setTimeout(() => setIsClosingEditor(false), 100);
              }}
            />
          </div>
        </div>
      )}

      {/* Sharing Dialog */}
      {sharingDocumentId && (
        <DocumentSharingDialog
          open={!!sharingDocumentId}
          onOpenChange={(open) => {
            if (!open) setSharingDocumentId(null);
          }}
          documentId={sharingDocumentId}
          documentSlug={sharingDocumentId}
        />
      )}

      {/* Category Dialog */}
      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setParentCategory(null);
          }
        }}
        category={editingCategory}
        parentCategory={parentCategory}
      />

      {/* Permissions Dialog */}
      <CategoryPermissionsDialog
        open={isPermissionsDialogOpen}
        onOpenChange={(open) => {
          setIsPermissionsDialogOpen(open);
          if (!open) setPermissionsCategory(null);
        }}
        category={permissionsCategory}
      />
    </div>
  );
};

const DocumentsPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <DocumentsPageContent />
    </Suspense>
  );
};

export default DocumentsPage;


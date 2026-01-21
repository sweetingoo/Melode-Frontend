"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PageSearchBar } from "@/components/admin/PageSearchBar";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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
      {/* Search and Create - Always visible in list mode */}
      {viewMode === "list" && (
        <>
          <PageSearchBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search documents..."
            showSearch={true}
            showFilters={true}
            isFiltersOpen={isFiltersOpen}
            onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
            showCreateButton={canCreateDocument}
            onCreateClick={handleCreateDocument}
            createButtonText="Create Document"
            createButtonIcon={Plus}
          />

          {/* Advanced Filters */}
          {isFiltersOpen && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Main Content */}
      {viewMode === "categories" ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Categories</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage document categories and their permissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewMode("list")}
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Button>
                {canManageCategories && (
                  <Button
                    onClick={() => {
                      setEditingCategory(null);
                      setParentCategory(null);
                      setIsCategoryDialogOpen(true);
                    }}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Category
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Category Sidebar - Better responsive sizing */}
          <div className="lg:col-span-3">
            <Card className="h-fit sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Categories</CardTitle>
                  {canManageCategories && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingCategory(null);
                        setParentCategory(null);
                        setIsCategoryDialogOpen(true);
                      }}
                      title="Create Category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CategoryTree
                  onSelectCategory={(category) => setSelectedCategoryId(category.id)}
                  selectedCategoryId={selectedCategoryId}
                  onEditCategory={canManageCategories ? handleEditCategory : undefined}
                  onAddSubcategory={canManageCategories ? handleAddSubcategory : undefined}
                  onManagePermissions={canManageCategories ? handleManagePermissions : undefined}
                  canManage={canManageCategories}
                />
                {canManageCategories && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setViewMode("categories")}
                    >
                      <FolderTree className="mr-2 h-4 w-4" />
                      Manage Categories
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documents List - Better width allocation */}
          <div className="lg:col-span-9">
            <DocumentList
              categoryId={selectedCategoryId}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
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


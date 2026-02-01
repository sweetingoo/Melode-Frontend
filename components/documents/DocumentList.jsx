"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  FileText,
  Edit,
  Trash2,
  Eye,
  Share2,
  Globe,
  Users,
  Loader2,
} from "lucide-react";
import { useDocuments, useSearchDocuments, useDeleteDocument } from "@/hooks/useDocuments";
import { useDocumentCategories } from "@/hooks/useDocumentCategories";
import { formatDistanceToNow } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { useRouter } from "next/navigation";

// Helper function to get author display name with priority: name > username > slug (NOT email)
const getAuthorDisplayName = (author) => {
  if (!author) return "Unknown";
  
  // Priority 1: Check if we have actual name fields (first_name or last_name)
  // This handles full User objects with all fields
  if (author.first_name || author.last_name) {
    const fullName = `${author.first_name || ""} ${author.last_name || ""}`.trim();
    if (fullName) {
      // Use display_name if available (includes title), otherwise use first_name + last_name
      if (author.display_name && author.display_name.trim() && 
          author.display_name.trim() !== author.username) {
        return author.display_name.trim();
      } else {
        return fullName;
      }
    }
  }
  
  // Priority 2: username (if no name available)
  if (author.username && author.username.trim()) {
    return author.username.trim();
  }
  
  // Priority 3: slug (if no username available)
  if (author.slug && author.slug.trim()) {
    return author.slug.trim();
  }
  
  // Fallback: if author.name exists (from AuthorInfo schema), use it
  // But only if it's not an email address
  if (author.name && author.name.trim()) {
    const nameValue = author.name.trim();
    // Check if it looks like an email (contains @)
    if (!nameValue.includes("@")) {
      return nameValue;
    }
  }
  
  return "Unknown";
};

const DocumentList = ({
  categoryId,
  searchTerm: externalSearchTerm,
  statusFilter: externalStatusFilter,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onShareDocument,
  canEdit = false,
  canDelete = false,
}) => {
  const router = useRouter();
  // Use external searchTerm and statusFilter if provided, otherwise use internal state
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [internalStatusFilter, setInternalStatusFilter] = useState("all");
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const deleteDocumentMutation = useDeleteDocument();
  const { data: categoriesData } = useDocumentCategories();

  // Create a map of category_id to category name
  const categoryMap = useMemo(() => {
    const map = new Map();
    const flattenCategories = (cats) => {
      cats.forEach((cat) => {
        map.set(cat.id, cat);
        if (cat.children && cat.children.length > 0) {
          flattenCategories(cat.children);
        }
      });
    };
    if (categoriesData?.categories) {
      flattenCategories(categoriesData.categories);
    }
    return map;
  }, [categoriesData]);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const params = useMemo(() => {
    const baseParams = {
      page: currentPage,
      per_page: 20,
    };
    if (categoryId) baseParams.category_id = categoryId;
    if (statusFilter !== "all") baseParams.status = statusFilter;
    return baseParams;
  }, [categoryId, statusFilter, currentPage]);

  const { data: documentsData, isLoading } = useDocuments(params, {
    enabled: !debouncedSearchTerm,
  });

  const { data: searchData, isLoading: isSearching } = useSearchDocuments(
    {
      ...params,
      q: debouncedSearchTerm,
    },
    {
      enabled: !!debouncedSearchTerm,
    }
  );

  const data = debouncedSearchTerm ? searchData : documentsData;
  const documents = data?.documents || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const currentPageNum = data?.page || currentPage;

  const handleDelete = async (document) => {
    if (!confirm(`Are you sure you want to delete "${document.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      // API expects slug in path (DELETE /documents/{document_slug})
      await deleteDocumentMutation.mutateAsync(document.slug ?? document.id);
      if (onDeleteDocument) {
        onDeleteDocument(document);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

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

  if (isLoading || isSearching) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {total} {total === 1 ? "document" : "documents"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          {/* Documents Table */}
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {document.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Try to get category from document.category first, then from categoryMap
                            const category = document.category || (document.category_id ? categoryMap.get(document.category_id) : null);
                            return (
                              <Badge variant="secondary">
                                {category?.name || (document.category_id ? `Category ${document.category_id}` : "N/A")}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {getAuthorDisplayName(document.author)}
                        </TableCell>
                        <TableCell>{getStatusBadge(document.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
                            ) : (
                              <span className="text-xs text-muted-foreground">Private</span>
                            )}
                            {document.access_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({document.access_count} views)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {document.updated_at
                            ? formatDistanceToNow(parseUTCDate(document.updated_at), {
                                addSuffix: true,
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (onViewDocument) {
                                  onViewDocument(document);
                                } else {
                                  router.push(`/documents/${document.slug || document.id}`);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditDocument?.(document)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onShareDocument && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onShareDocument(document)}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(document)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPageNum - 1))}
                        className={currentPageNum === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPageNum <= 3) {
                        pageNum = i + 1;
                      } else if (currentPageNum >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPageNum - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPageNum === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {totalPages > 5 && currentPageNum < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPageNum + 1))}
                        className={currentPageNum === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentList;


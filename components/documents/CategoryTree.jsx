"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreHorizontal, Edit, Trash2, Lock, Plus } from "lucide-react";
import { useDocumentCategories, useDeleteDocumentCategory } from "@/hooks/useDocumentCategories";
import { Badge } from "@/components/ui/badge";

const CategoryTree = ({
  onSelectCategory,
  selectedCategoryId,
  onEditCategory,
  onAddSubcategory,
  onManagePermissions,
  canManage = false,
}) => {
  const { data, isLoading, error } = useDocumentCategories();
  const deleteCategoryMutation = useDeleteDocumentCategory();
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const categories = data?.categories || [];

  const toggleNode = (categoryId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      // Find the category to get its slug
      const category = categories.find(c => c.id === categoryId || c.slug === categoryId);
      const categorySlug = category?.slug || categoryId;
      await deleteCategoryMutation.mutateAsync(categorySlug);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderTreeNode = (category, depth = 0) => {
    const children = categories.filter((c) => c.parent_id === category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(category.id.toString());
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="w-full">
        <div
          className={`flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer ${
            isSelected ? "bg-muted" : ""
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
          onClick={() => onSelectCategory?.(category)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(category.id.toString());
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}
          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{category.name}</span>
              {category.inherit_permissions && (
                <Badge variant="secondary" className="text-xs">
                  Inherits
                </Badge>
              )}
            </div>
            {category.description && (
              <div className="text-xs text-muted-foreground truncate">
                {category.description}
              </div>
            )}
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {onAddSubcategory && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onAddSubcategory(category);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subcategory
                  </DropdownMenuItem>
                )}
                {onEditCategory && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory(category);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Category
                  </DropdownMenuItem>
                )}
                {onManagePermissions && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onManagePermissions(category);
                  }}>
                    <Lock className="mr-2 h-4 w-4" />
                    Manage Permissions
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category.id, category.name);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading categories...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load categories: {error?.response?.data?.message || error?.message}
      </div>
    );
  }

  const rootCategories = categories.filter((c) => !c.parent_id);

  if (rootCategories.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No categories found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootCategories.map((category) => renderTreeNode(category))}
    </div>
  );
};

export default CategoryTree;


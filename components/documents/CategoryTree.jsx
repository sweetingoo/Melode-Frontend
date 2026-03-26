"use client";

import React, { useState, useMemo, useEffect } from "react";
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

const PERSONNEL_ROOT_MATCH = new Set([
  "personnel-file",
  "personnel-files",
  "personnel-file-categories",
  "personnel file",
  "personnel files",
]);

/** API returns nested trees; flatten for parent_id lookups and tree rendering. */
export const flattenDocumentCategoriesTree = (nodes) => {
  const out = [];
  const walk = (items) => {
    (items || []).forEach((item) => {
      const { children, ...rest } = item;
      out.push(rest);
      if (Array.isArray(children) && children.length > 0) {
        walk(children);
      }
    });
  };
  walk(nodes);
  return out;
};

const findPersonnelRootCategory = (flatCategories) => {
  for (const cat of flatCategories) {
    const slug = String(cat?.slug || "").trim().toLowerCase();
    const name = String(cat?.name || "").trim().toLowerCase();
    if (PERSONNEL_ROOT_MATCH.has(slug) || PERSONNEL_ROOT_MATCH.has(name)) {
      return cat;
    }
  }
  return null;
};

const getPersonnelCategoryIds = (categories) => {
  const all = flattenDocumentCategoriesTree(categories);

  const byId = new Map(all.map((c) => [Number(c.id), c]));
  const roots = all.filter((c) => {
    const slug = String(c.slug || "").trim().toLowerCase();
    const name = String(c.name || "").trim().toLowerCase();
    return PERSONNEL_ROOT_MATCH.has(slug) || PERSONNEL_ROOT_MATCH.has(name);
  });

  const excluded = new Set();
  const queue = roots.map((r) => Number(r.id)).filter((id) => Number.isFinite(id));

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (excluded.has(currentId)) continue;
    excluded.add(currentId);

    all.forEach((c) => {
      const parentId = Number(c.parent_id);
      const cid = Number(c.id);
      if (parentId === currentId && Number.isFinite(cid) && !excluded.has(cid)) {
        queue.push(cid);
      }
    });
  }

  return excluded;
};

const CategoryTree = ({
  variant = "library",
  onSelectCategory,
  selectedCategoryId,
  onEditCategory,
  onAddSubcategory,
  onManagePermissions,
  canManage = false,
}) => {
  const { data, isLoading, error } = useDocumentCategories(
    variant === "personnel" ? { include_personnel: true } : {}
  );
  const deleteCategoryMutation = useDeleteDocumentCategory();
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const rawCategories = data?.categories || [];
  const flatCategories = useMemo(() => flattenDocumentCategoriesTree(rawCategories), [rawCategories]);

  const visibleCategories = useMemo(() => {
    if (variant === "personnel") {
      const root = findPersonnelRootCategory(flatCategories);
      if (!root) return [];
      const personnelRootId = Number(root.id);
      const descendantIds = new Set();
      const queue = [personnelRootId];
      while (queue.length) {
        const pid = queue.shift();
        flatCategories.forEach((c) => {
          if (Number(c.parent_id) === pid) {
            const cid = Number(c.id);
            if (!Number.isFinite(cid)) return;
            if (!descendantIds.has(cid)) {
              descendantIds.add(cid);
              queue.push(cid);
            }
          }
        });
      }
      return flatCategories.filter((c) => descendantIds.has(Number(c.id)) && Number(c.id) !== personnelRootId);
    }
    const excludedPersonnelCategoryIds = getPersonnelCategoryIds(rawCategories);
    return flatCategories.filter((c) => !excludedPersonnelCategoryIds.has(Number(c.id)));
  }, [variant, flatCategories, rawCategories]);

  const rootCategories = useMemo(() => {
    if (variant === "personnel") {
      const root = findPersonnelRootCategory(flatCategories);
      if (!root) return [];
      const personnelRootId = Number(root.id);
      return visibleCategories.filter((c) => Number(c.parent_id) === personnelRootId);
    }
    return visibleCategories.filter((c) => !c.parent_id);
  }, [variant, flatCategories, visibleCategories]);

  useEffect(() => {
    if (variant !== "personnel" || rootCategories.length === 0) return;
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      rootCategories.forEach((c) => next.add(String(c.id)));
      return next;
    });
  }, [variant, rootCategories]);

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
      const category = visibleCategories.find((c) => c.id === categoryId || c.slug === categoryId);
      const categorySlug = category?.slug || categoryId;
      await deleteCategoryMutation.mutateAsync(categorySlug);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderTreeNode = (category, depth = 0) => {
    const children = visibleCategories.filter((c) => c.parent_id === category.id);
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
                {variant !== "personnel" && onManagePermissions && (
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

  if (rootCategories.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        {variant === "personnel"
          ? "No personnel categories yet. Use Manage categories to add subcategories under Personnel File."
          : "No categories found. Create one to get started."}
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


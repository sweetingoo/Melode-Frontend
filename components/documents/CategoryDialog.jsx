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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateDocumentCategory,
  useUpdateDocumentCategory,
  useDocumentCategories,
} from "@/hooks/useDocumentCategories";

const CategoryDialog = ({ open, onOpenChange, category = null, parentCategory = null }) => {
  const { data: categoriesData } = useDocumentCategories();
  const createCategory = useCreateDocumentCategory();
  const updateCategory = useUpdateDocumentCategory();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: null,
    order: 0,
    inherit_permissions: true,
  });

  const categories = categoriesData?.categories || [];

  // Filter out current category and its descendants from parent options
  const availableParents = categories.filter((cat) => {
    if (!category) return true;
    if (cat.id === category.id) return false;
    // Check if cat is a descendant of current category
    const isDescendant = (catId, parentId) => {
      const cat = categories.find((c) => c.id === catId);
      if (!cat || !cat.parent_id) return false;
      if (cat.parent_id === parentId) return true;
      return isDescendant(cat.parent_id, parentId);
    };
    return !isDescendant(cat.id, category.id);
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        parent_id: category.parent_id || null,
        order: category.order || 0,
        inherit_permissions: category.inherit_permissions !== false,
      });
    } else if (parentCategory) {
      setFormData((prev) => ({
        ...prev,
        parent_id: parentCategory.id,
      }));
    } else {
      setFormData({
        name: "",
        description: "",
        parent_id: null,
        order: 0,
        inherit_permissions: true,
      });
    }
  }, [category, parentCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        parent_id: formData.parent_id || null,
      };

      if (category) {
        await updateCategory.mutateAsync({ slug: category.slug || category.id, categoryData: submitData });
      } else {
        await createCategory.mutateAsync(submitData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const buildCategoryPath = (catId) => {
    const findCategory = (id) => categories.find((c) => c.id === id);
    const path = [];
    let currentId = catId;
    while (currentId) {
      const cat = findCategory(currentId);
      if (!cat) break;
      path.unshift(cat.name);
      currentId = cat.parent_id;
    }
    return path.join(" > ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Update the category details below."
              : "Create a new category to organize documents."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Category</Label>
              <Select
                value={formData.parent_id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parent_id: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Category)</SelectItem>
                  {availableParents.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {buildCategoryPath(cat.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="inherit_permissions">Inherit Permissions</Label>
                <p className="text-xs text-muted-foreground">
                  Inherit permissions from parent category
                </p>
              </div>
              <Switch
                id="inherit_permissions"
                checked={formData.inherit_permissions}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, inherit_permissions: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
              {createCategory.isPending || updateCategory.isPending
                ? "Saving..."
                : category
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;


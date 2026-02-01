"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import {
  useTrackerCategories,
  useActiveTrackerCategories,
  useCreateTrackerCategory,
  useUpdateTrackerCategory,
  useDeleteTrackerCategory,
} from "@/hooks/useTrackerCategories";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageSearchBar } from "@/components/admin/PageSearchBar";

const TrackerCategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteCategorySlug, setDeleteCategorySlug] = useState(null);

  const { hasPermission, hasWildcardPermissions, isSuperuser } = usePermissionsCheck();
  const canCreate = !!isSuperuser || !!hasWildcardPermissions || hasPermission("tracker_category:create") || hasPermission("tracker_category:*");
  const canUpdate = !!isSuperuser || !!hasWildcardPermissions || hasPermission("tracker_category:update") || hasPermission("tracker_category:*");
  const canDelete = !!isSuperuser || !!hasWildcardPermissions || hasPermission("tracker_category:delete") || hasPermission("tracker_category:*");
  const canList = !!isSuperuser || !!hasWildcardPermissions || hasPermission("tracker_category:list") || hasPermission("tracker_category:read") || hasPermission("tracker_category:*");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: response, isLoading } = useTrackerCategories({
    query: debouncedSearchTerm || undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    is_system: typeFilter === "all" ? undefined : typeFilter === "system",
  });

  const createMutation = useCreateTrackerCategory();
  const updateMutation = useUpdateTrackerCategory();
  const deleteMutation = useDeleteTrackerCategory();

  let categories = [];
  if (response?.tracker_categories) categories = response.tracker_categories;
  else if (Array.isArray(response)) categories = response;

  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
    icon: "",
    color: "#3b82f6",
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      display_name: "",
      description: "",
      icon: "",
      color: "#3b82f6",
      sort_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (e) {
      // handled by mutation
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      display_name: cat.display_name || "",
      description: cat.description || "",
      icon: cat.icon || "",
      color: cat.color || "#3b82f6",
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active !== undefined ? cat.is_active : true,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCategory?.slug) return;
    try {
      await updateMutation.mutateAsync({
        slug: editingCategory.slug,
        data: {
          display_name: formData.display_name,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        },
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (e) {
      // handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteCategorySlug) return;
    try {
      await deleteMutation.mutateAsync(deleteCategorySlug);
      setDeleteCategorySlug(null);
    } catch (e) {
      // handled by mutation
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    const s = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.display_name?.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s)
    );
  }, [categories, searchTerm]);

  if (!canList) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don&apos;t have permission to view tracker categories.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        {canCreate && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Tracker Category</DialogTitle>
              <DialogDescription>Create a category to organize trackers (e.g. Patient Care, IT Support).</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Patient Care"
                />
                <p className="text-xs text-muted-foreground">Name (identifier) is derived from this, e.g. &quot;Patient Care&quot; → patient_care</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., 📋"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.display_name?.trim() || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <PageSearchBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tracker categories..."
        showFilters={true}
        isFiltersOpen={isFiltersOpen}
        onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
        showCreateButton={canCreate}
        onCreateClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
        createButtonText="Create Tracker Category"
        createButtonIcon={Plus}
      />

      {isFiltersOpen && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tracker Categories ({filteredCategories.length})</CardTitle>
          <p className="text-sm text-muted-foreground">Organize trackers into categories (like Form Types for forms).</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tracker categories found. Create one to organize your trackers.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.display_name || cat.name}</TableCell>
                    <TableCell>{cat.icon ? <span className="text-2xl">{cat.icon}</span> : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border" style={{ backgroundColor: cat.color || "#6b7280" }} />
                        <span className="text-sm text-muted-foreground">{cat.color || "#6b7280"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat.is_system ? <Badge variant="outline"><Shield className="mr-1 h-3 w-3" /> System</Badge> : <Badge variant="secondary">Custom</Badge>}
                    </TableCell>
                    <TableCell>
                      {cat.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>{cat.sort_order ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteCategorySlug(cat.slug)} disabled={cat.is_system}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tracker Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {cat.is_system
                                    ? "System categories cannot be deleted. You can only deactivate them."
                                    : `Are you sure you want to delete "${cat.display_name || cat.name}"? This cannot be undone.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                {!cat.is_system && (
                                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                )}
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tracker Category</DialogTitle>
            <DialogDescription>Update category details. Name cannot be changed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display_name">Display Name *</Label>
              <Input
                id="edit-display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-20 h-10" />
                  <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.is_active ? "active" : "inactive"} onValueChange={(v) => setFormData({ ...formData, is_active: v === "active" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!formData.display_name || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackerCategoriesPage;

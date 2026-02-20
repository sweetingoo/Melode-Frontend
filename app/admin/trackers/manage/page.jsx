"use client";

import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useTrackers,
  useCreateTracker,
  useCreateTrackerFromTemplate,
  useUpdateTracker,
  useDeleteTracker,
} from "@/hooks/useTrackers";
import { useActiveTrackerCategories, useCreateTrackerCategory } from "@/hooks/useTrackerCategories";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useCurrentUser } from "@/hooks/useAuth";
import { format } from "date-fns";
import { parseUTCDate } from "@/utils/time";
import { toast } from "sonner";
import { PageSearchBar } from "@/components/admin/PageSearchBar";

const TrackersManagePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasOpenedDialogRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Check if we should open the create dialog from URL parameter
  useEffect(() => {
    const shouldCreate = searchParams.get("create");
    if (shouldCreate === "true" && !hasOpenedDialogRef.current) {
      hasOpenedDialogRef.current = true;
      setIsCreateDialogOpen(true);
      // Clean up URL parameter
      router.replace("/admin/trackers/manage", { scroll: false });
    }
  }, [searchParams, router]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState(null);
  const [deleteTrackerId, setDeleteTrackerId] = useState(null);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ display_name: "" });

  const { data: trackersResponse, isLoading } = useTrackers({
    page: 1,
    per_page: 100,
    category: categoryFilter === "__all__" ? undefined : categoryFilter,
  });
  const { data: trackerCategories = [], refetch: refetchTrackerCategories } = useActiveTrackerCategories();
  const createCategoryMutation = useCreateTrackerCategory();

  const createMutation = useCreateTracker();
  const createFromTemplateMutation = useCreateTrackerFromTemplate({
    onCreated: (data) => {
      const slug = data?.slug || data?.form_name;
      if (slug) router.push(`/admin/trackers/${slug}/edit`);
    },
  });
  const updateMutation = useUpdateTracker();
  const deleteMutation = useDeleteTracker();
  const { data: currentUser } = useCurrentUser();

  const { hasPermission } = usePermissionsCheck();
  const canCreate = hasPermission("tracker:create");
  const canUpdate = hasPermission("tracker:update");
  const canDelete = hasPermission("tracker:delete");

  // Get organization_id from current user or default to 1
  const organizationId = currentUser?.organization_id || currentUser?.organizationId || 1;

  const trackers = useMemo(() => {
    if (!trackersResponse) return [];
    if (Array.isArray(trackersResponse)) return trackersResponse;
    return trackersResponse.trackers || [];
  }, [trackersResponse]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    tracker_config: {
      default_status: "open",
      statuses: ["open", "in_progress", "pending", "resolved", "closed"],
      allow_inline_status_edit: true,
      sections: [],
      use_stages: false,
      is_patient_referral: false,
    },
    tracker_fields: {
      fields: [],
    },
    access_config: {
      allowed_roles: [],
      allowed_users: [],
      view_permissions: [],
      edit_permissions: [],
      create_permissions: [],
    },
  });
  const handleNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      name,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      is_active: true,
        tracker_config: {
          default_status: "open",
          statuses: ["open", "in_progress", "pending", "resolved", "closed"],
          allow_inline_status_edit: true,
          sections: [],
          use_stages: false,
          is_patient_referral: false,
        },
      tracker_fields: {
        fields: [],
      },
      access_config: {
        allowed_roles: [],
        allowed_users: [],
        view_permissions: [],
        edit_permissions: [],
        create_permissions: [],
      },
    });
    setSlugManuallyEdited(false);
    setEditingTracker(null);
  };

  const handleCreate = async () => {
    try {
      // Don't send slug - it will be auto-generated by the backend
      const { slug, ...dataToSend } = formData;
      await createMutation.mutateAsync({
        ...dataToSend,
        organization_id: organizationId,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (tracker) => {
    setEditingTracker(tracker);
    setFormData({
      name: tracker.name || "",
      description: tracker.description || "",
      category: tracker.category || "",
      slug: tracker.slug || "", // Keep slug for edit (read-only display)
      is_active: tracker.is_active !== undefined ? tracker.is_active : true,
      tracker_config: {
        ...(tracker.tracker_config || {
          default_status: "open",
          statuses: ["open", "in_progress", "pending", "resolved", "closed"],
          allow_inline_status_edit: true,
          sections: [],
        }),
        use_stages: tracker.tracker_config?.use_stages ?? (!!(tracker.tracker_config?.stage_mapping?.length || tracker.tracker_config?.is_patient_referral)),
        is_patient_referral: tracker.tracker_config?.is_patient_referral ?? false,
      },
      tracker_fields: tracker.tracker_fields || {
        fields: [],
      },
      access_config: tracker.access_config || {
        allowed_roles: [],
        allowed_users: [],
        view_permissions: [],
        edit_permissions: [],
        create_permissions: [],
      },
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTracker) return;
    try {
      await updateMutation.mutateAsync({
        slug: editingTracker.slug,
        trackerData: formData,
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTrackerId) return;
    const tracker = trackers.find((t) => t.id === deleteTrackerId);
    if (!tracker) return;
    
    try {
      await deleteMutation.mutateAsync(tracker.slug);
      setIsDeleteDialogOpen(false);
      setDeleteTrackerId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryForm.display_name?.trim()) return;
    try {
      const created = await createCategoryMutation.mutateAsync({
        display_name: newCategoryForm.display_name.trim(),
      });
      await refetchTrackerCategories();
      setFormData((prev) => ({ ...prev, category: created?.name ?? "" }));
      setNewCategoryForm({ display_name: "" });
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredTrackers = trackers.filter((tracker) => {
    const matchesSearch =
      !searchTerm ||
      tracker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/admin/trackers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Search, filters, and Create - default PageSearchBar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <PageSearchBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search trackers..."
            showSearch={true}
            showFilters={true}
            isFiltersOpen={isFiltersOpen}
            onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
            showCreateButton={canCreate}
            onCreateClick={() => setIsCreateDialogOpen(true)}
            createButtonText="Create Tracker"
            createButtonIcon={Plus}
            leftOfCreateButton={
              canCreate ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/admin/trackers/import">
                    <Button variant="outline" size="sm" className="h-10">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Import from Excel
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10"
                        disabled={createFromTemplateMutation.isPending}
                      >
                        {createFromTemplateMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Create from template
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => createFromTemplateMutation.mutate("gastroenterology")}
                        disabled={createFromTemplateMutation.isPending}
                      >
                        Gastroenterology (Outpatient Triage)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => createFromTemplateMutation.mutate("patient-referral")}
                        disabled={createFromTemplateMutation.isPending}
                      >
                        Patient Referral
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null
            }
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isFiltersOpen && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All categories</SelectItem>
                    {trackerCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.display_name || cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Tracker Dialog */}
      {canCreate && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Tracker</DialogTitle>
                <DialogDescription>
                  Create a new tracker template for case/event/action tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., ENT Cases, Incident Tracker"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Description of what this tracker is used for"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.category || "__none__"}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, category: v === "__none__" ? "" : v }))
                      }
                    >
                      <SelectTrigger id="category" className="flex-1">
                        <SelectValue placeholder="Select category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No category</SelectItem>
                        {trackerCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.display_name || cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Add new category"
                        onClick={() => setIsAddCategoryDialogOpen(true)}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>Add category</DialogTitle>
                          <DialogDescription>
                            Create a new tracker category. It will be selected for this tracker.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <Label htmlFor="new-cat-display">Display name *</Label>
                            <Input
                              id="new-cat-display"
                              value={newCategoryForm.display_name}
                              onChange={(e) =>
                                setNewCategoryForm((prev) => ({ ...prev, display_name: e.target.value }))
                              }
                              placeholder="e.g., Patient Care"
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Name is derived from this (e.g. patient_care)</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddCategory}
                            disabled={
                              !newCategoryForm.display_name?.trim() ||
                              createCategoryMutation.isPending
                            }
                          >
                            {createCategoryMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Add category
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Organize trackers. Manage categories in{" "}
                    <Link href="/admin/tracker-categories" className="text-primary underline hover:no-underline">
                      Admin → Tracker Categories
                    </Link>
                    .
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use_stages_create"
                    checked={formData.tracker_config?.use_stages || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tracker_config: {
                          ...prev.tracker_config,
                          use_stages: e.target.checked,
                        },
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="use_stages_create" className="cursor-pointer">
                    This tracker uses stages (Stage column, queues, SMS, etc.)
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Note: Field configuration and permissions can be set after creation.</p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.name || createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      )}

      {/* Trackers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trackers ({filteredTrackers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrackers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No trackers match your search"
                  : "No trackers created yet"}
              </p>
              {!searchTerm && canCreate && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Tracker
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrackers.map((tracker) => (
                    <TableRow key={tracker.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{tracker.name}</span>
                            {tracker.category && (
                              <Badge variant="outline" className="text-xs">
                                {trackerCategories.find((c) => c.name === tracker.category)?.display_name ?? tracker.category}
                              </Badge>
                            )}
                          </div>
                          {tracker.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {tracker.description.length > 60
                                ? `${tracker.description.substring(0, 60)}...`
                                : tracker.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tracker.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {tracker.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tracker.created_at
                          ? format(parseUTCDate(tracker.created_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canUpdate && (
                            <>
                              <Link href={`/admin/trackers/${tracker.slug}/edit`}>
                                <Button variant="ghost" size="sm" title="Edit Configuration">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(tracker)}
                                title="Quick Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteTrackerId(tracker.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tracker</DialogTitle>
            <DialogDescription>
              Update tracker settings and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., ENT Cases, Incident Tracker"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug || ""}
                readOnly
                className="bg-muted cursor-not-allowed"
                placeholder="Auto-generated"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL-friendly identifier (auto-generated, cannot be changed)
              </p>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Description of what this tracker is used for"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category || "__none__"}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, category: v === "__none__" ? "" : v }))
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No category</SelectItem>
                  {trackerCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.display_name || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="rounded"
              />
              <Label htmlFor="edit-is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-use_stages"
                checked={formData.tracker_config?.use_stages || false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tracker_config: {
                      ...prev.tracker_config,
                      use_stages: e.target.checked,
                    },
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="edit-use_stages" className="cursor-pointer">
                This tracker uses stages (Stage column, queues, SMS, etc.)
              </Label>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Note: Advanced configuration (fields, permissions, sections) can be added in a future update.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tracker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tracker? This action cannot be undone.
              {deleteTrackerId && (
                <span className="block mt-2 font-medium">
                  Tracker: {trackers.find((t) => t.id === deleteTrackerId)?.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const TrackersManagePageWrapper = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackersManagePage />
    </Suspense>
  );
};

export default TrackersManagePageWrapper;

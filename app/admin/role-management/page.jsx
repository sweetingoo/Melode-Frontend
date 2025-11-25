"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Shield,
  Plus,
  Edit,
  Settings,
  Users,
  Key,
  Crown,
  UserCheck,
  UserCog,
  AlertCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissionsToRole,
  roleUtils,
} from "@/hooks/useRoles";
import {
  usePermissions as usePermissionsList,
  permissionUtils,
} from "@/hooks/usePermissions";

const RoleManagementPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [managingRole, setManagingRole] = useState(null);
  const [searchPermissionTerm, setSearchPermissionTerm] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [formData, setFormData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    priority: 50,
  });

  // API hooks
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useRoles();
  const { data: permissionsData, isLoading: permissionsLoading } =
    usePermissionsList();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignPermissionsMutation = useAssignPermissionsToRole();

  // Transform API data
  const roles = rolesData ? rolesData.map(roleUtils.transformRole) : [];
  const allPermissions = permissionsData
    ? permissionsData.map(permissionUtils.transformPermission)
    : [];

  const getRoleIconClasses = (color) => {
    const iconMap = {
      purple:
        "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      green:
        "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      gray: "bg-muted text-muted-foreground",
    };
    return iconMap[color] || iconMap.gray;
  };

  const getRoleIcon = (role) => {
    const iconMap = {
      Crown: Crown,
      UserCheck: UserCheck,
      UserCog: UserCog,
      Shield: Shield,
    };
    const iconName = roleUtils.getRoleIcon(role);
    return iconMap[iconName] || Shield;
  };

  const getRolePermissions = (role) => {
    // Return the current permissions for the role, or the default ones if not updated
    return role.permissions || [];
  };

  const handleCreateRole = () => {
    setIsCreateModalOpen(true);
    setFormData({
      displayName: "",
      roleName: "",
      description: "",
      priority: 50,
    });
  };

  const handleEditRole = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      setEditingRole(role);
      setFormData({
        displayName: role.name,
        roleName: role.slug,
        description: role.description,
        priority: role.priority,
      });
      setIsEditModalOpen(true);
    }
  };

  const handleManagePermissions = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      // Prevent managing permissions for system roles
      if (role.isSystem) {
        toast.error("Cannot modify system role permissions", {
          description: "System roles have fixed permissions that cannot be changed.",
        });
        return;
      }

      setManagingRole(role);
      // Debug: Log the role permissions data structure
      console.log('Role permissions:', role.permissions);
      console.log('All permissions:', allPermissions.slice(0, 3)); // Show first 3 for debugging
      
      // Initialize selected permissions based on role's current permissions
      // Try to match by permission name first, then by slug
      const rolePermissionIds = role.permissions
        .map((p) => {
          // If p is an object with id, use it directly
          if (typeof p === 'object' && p.id) {
            return p.id;
          }
          // If p is a string, try to find matching permission by name or slug
          const permission = allPermissions.find((ap) => 
            ap.name === p || ap.slug === p || ap.display_name === p
          );
          return permission?.id;
        })
        .filter(Boolean);
      
      console.log('Matched permission IDs:', rolePermissionIds);
      setSelectedPermissions(new Set(rolePermissionIds));
      setIsPermissionsModalOpen(true);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const roleData = {
        display_name: formData.displayName,
        name: formData.roleName,
        description: formData.description,
        priority: formData.priority,
      };

      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: editingRole.id,
          roleData,
        });
      } else {
        await createRoleMutation.mutateAsync(roleData);
      }

      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setEditingRole(null);
      setFormData({
        displayName: "",
        roleName: "",
        description: "",
        priority: 50,
      });
    } catch (error) {
      console.error("Failed to submit role:", error);
    }
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingRole(null);
    setFormData({
      displayName: "",
      roleName: "",
      description: "",
      priority: 50,
    });
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const filteredPermissions = getFilteredPermissions();
    const allIds = filteredPermissions.map((p) => p.id);
    setSelectedPermissions(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions(new Set());
  };

  const getFilteredPermissions = () => {
    return allPermissions.filter(
      (permission) =>
        permission.name
          .toLowerCase()
          .includes(searchPermissionTerm.toLowerCase()) ||
        permission.resource
          .toLowerCase()
          .includes(searchPermissionTerm.toLowerCase()) ||
        permission.action
          .toLowerCase()
          .includes(searchPermissionTerm.toLowerCase())
    );
  };

  const handleSavePermissions = async () => {
    if (managingRole) {
      // Prevent saving permissions for system roles
      if (managingRole.isSystem) {
        toast.error("Cannot modify system role permissions", {
          description: "System roles have fixed permissions that cannot be changed.",
        });
        return;
      }

      try {
        const permissionIds = Array.from(selectedPermissions);

        await assignPermissionsMutation.mutateAsync({
          roleId: managingRole.id,
          permissionIds,
        });

        setIsPermissionsModalOpen(false);
        setManagingRole(null);
        setSelectedPermissions(new Set());
        setSearchPermissionTerm("");
      } catch (error) {
        console.error("Failed to save permissions:", error);
      }
    }
  };

  const handleCancelPermissions = () => {
    setIsPermissionsModalOpen(false);
    setManagingRole(null);
    setSelectedPermissions(new Set());
    setSearchPermissionTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage roles and their permissions
          </p>
        </div>
        <Button onClick={handleCreateRole} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Loading State */}
      {rolesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {rolesError && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load roles
              </h3>
              <p className="text-muted-foreground mb-4">
                {rolesError?.response?.data?.message ||
                  "An error occurred while loading roles"}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Cards Grid */}
      {!rolesLoading && !rolesError && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
          {roles.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No roles found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by creating your first role.
                    </p>
                    <Button onClick={handleCreateRole}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            roles.map((role) => {
              const iconClasses = getRoleIconClasses(
                roleUtils.getRoleColor(role)
              );
              const IconComponent = getRoleIcon(role);

              return (
                <Card
                  key={role.id}
                  className="bg-card hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClasses}`}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{role.name}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono">
                            {role.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            System
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleEditRole(role.id)}
                          title="Edit role"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {!role.isSystem && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                title="Delete role"
                              >
                                <AlertCircle className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the role "
                                  {role.name}"? This action cannot be undone and
                                  will remove the role from all users.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteRoleMutation.mutate(role.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 flex-1 flex flex-col">
                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {role.description || "No description"}
                    </p>

                    {/* Role Stats */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Key className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">Priority:</span>
                        <span className="text-foreground">{role.priority}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">Users:</span>
                        <span className="text-foreground">
                          {role.userCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-medium">
                            Permissions
                          </h4>
                          <Badge 
                            variant={getRolePermissions(role).length > 0 ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {getRolePermissions(role).length}
                          </Badge>
                        </div>
                        {role.isSystem ? (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Shield className="h-2.5 w-2.5" />
                            <span>System</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManagePermissions(role.id)}
                            className="flex items-center gap-1 h-6 text-xs px-2"
                          >
                            <Settings className="h-3 w-3" />
                            Manage
                          </Button>
                        )}
                      </div>

                      {/* Permission Tags */}
                      <div className="flex flex-wrap gap-1">
                        {getRolePermissions(role).length > 0 ? (
                          <>
                            {getRolePermissions(role)
                              .slice(0, 2)
                              .map((permission, index) => {
                                // Handle both object and string permissions
                                const permissionName = typeof permission === 'object' 
                                  ? (permission.name || permission.display_name || permission.slug || 'Unknown')
                                  : permission;
                                return (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {permissionName}
                                  </Badge>
                                );
                              })}
                            {getRolePermissions(role).length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{getRolePermissions(role).length - 2} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <div className="text-[10px] text-muted-foreground italic">
                            No permissions assigned
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Create Role Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="e.g., Senior Doctor"
                value={formData.displayName}
                onChange={(e) =>
                  handleInputChange("displayName", e.target.value)
                }
              />
            </div>

            {/* Role Name */}
            <div className="space-y-2">
              <Label htmlFor="roleName">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="roleName"
                placeholder="e.g., senior_doctor"
                value={formData.roleName}
                onChange={(e) => handleInputChange("roleName", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores only. Cannot be changed after
                creation.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this role's purpose and responsibilities"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  handleInputChange("priority", parseInt(e.target.value) || 50)
                }
                min="1"
                max="100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editDisplayName"
                placeholder="e.g., Senior Doctor"
                value={formData.displayName}
                onChange={(e) =>
                  handleInputChange("displayName", e.target.value)
                }
              />
            </div>

            {/* Role Name - Read Only for Edit */}
            <div className="space-y-2">
              <Label htmlFor="editRoleName">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editRoleName"
                value={formData.roleName}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Role name cannot be changed after creation.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Describe this role's purpose and responsibilities"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="editPriority">Priority</Label>
              <Input
                id="editPriority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  handleInputChange("priority", parseInt(e.target.value) || 50)
                }
                min="1"
                max="100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Modal */}
      <Dialog
        open={isPermissionsModalOpen}
        onOpenChange={setIsPermissionsModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Permissions
            </DialogTitle>
            {managingRole && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    Role: {managingRole.name}
                  </p>
                  {managingRole.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      System Role
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently selected: {selectedPermissions.size} permission(s) • 
                  Total available: {allPermissions.length} permission(s)
                </p>
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search permissions..."
                value={searchPermissionTerm}
                onChange={(e) => setSearchPermissionTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>

            {/* Permissions Table */}
            <div className="border rounded-lg max-h-96 overflow-auto">
              {permissionsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            getFilteredPermissions().length > 0 &&
                            getFilteredPermissions().every((p) =>
                              selectedPermissions.has(p.id)
                            )
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleSelectAll();
                            } else {
                              handleDeselectAll();
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>PERMISSION</TableHead>
                      <TableHead>RESOURCE</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredPermissions().length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8" />
                            <span>No permissions found</span>
                            {searchPermissionTerm && (
                              <span className="text-sm">
                                Try adjusting your search terms
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredPermissions().map((permission) => {
                        const isSelected = selectedPermissions.has(permission.id);
                        return (
                          <TableRow 
                            key={permission.id}
                            className={isSelected ? "bg-muted/50" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handlePermissionToggle(permission.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {permission.name}
                                {isSelected && (
                                  <Badge variant="default" className="text-xs">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {permission.resource}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Selected Count */}
            <div className="text-sm text-muted-foreground">
              {selectedPermissions.size} permission(s) selected
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPermissions}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePermissions}
              disabled={managingRole?.isSystem}
            >
              {managingRole?.isSystem ? "Cannot modify system role" : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagementPage;

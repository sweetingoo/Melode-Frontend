"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDocumentCategoryPermissions,
  useUpdateDocumentCategoryPermissions,
} from "@/hooks/useDocumentCategories";
import { usePermissions } from "@/hooks/usePermissions";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { Loader2, User, Users, Search, Shield, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CategoryPermissionsDialog = ({ open, onOpenChange, category }) => {
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions();
  const { data: categoryPermissions, isLoading: categoryLoading } =
    useDocumentCategoryPermissions(category?.id, { enabled: !!category?.id && open });
  const updatePermissions = useUpdateDocumentCategoryPermissions();
  const { data: rolesData } = useRoles();

  // New format: { read: { roles: [], users: [], permissions: [] }, write: {...}, delete: {...} }
  const [permissions, setPermissions] = useState({
    read: { roles: [], users: [], permissions: [] },
    write: { roles: [], users: [], permissions: [] },
    delete: { roles: [], users: [], permissions: [] },
  });

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [debouncedUserSearchQuery, setDebouncedUserSearchQuery] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [permissionSearchQuery, setPermissionSearchQuery] = useState("");

  // Debounce search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearchQuery(userSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Lazy load users
  const { data: usersData, isLoading: usersLoading } = useUsers(
    {
      per_page: 100,
      search: debouncedUserSearchQuery || undefined,
    },
    {
      enabled: open,
    }
  );

  const allPermissions = permissionsData?.permissions || [];
  const users = usersData?.users || [];
  const roles = rolesData?.roles || [];

  // Convert old format to new format and initialize state
  useEffect(() => {
    if (categoryPermissions) {
      const newPermissions = {
        read: { roles: [], users: [], permissions: [] },
        write: { roles: [], users: [], permissions: [] },
        delete: { roles: [], users: [], permissions: [] },
      };

      ["read", "write", "delete"].forEach((action) => {
        const actionPerms = categoryPermissions[action];
        
        if (actionPerms) {
          // Check if it's new format (object with roles, users, permissions)
          if (typeof actionPerms === 'object' && !Array.isArray(actionPerms)) {
            newPermissions[action] = {
              roles: actionPerms.roles || [],
              users: actionPerms.users || [],
              permissions: actionPerms.permissions || [],
            };
          } else if (Array.isArray(actionPerms)) {
            // Old format: array of permission slugs
            newPermissions[action] = {
              roles: [],
              users: [],
              permissions: actionPerms,
            };
          }
        }
      });

      setPermissions(newPermissions);
    }
  }, [categoryPermissions]);

  // Filter users, roles, and permissions based on search
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    const query = userSearchQuery.toLowerCase();
    return users.filter((user) => {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      return name.includes(query) || email.includes(query) || username.includes(query);
    });
  }, [users, userSearchQuery]);

  const filteredRoles = useMemo(() => {
    if (!roleSearchQuery) return roles;
    const query = roleSearchQuery.toLowerCase();
    return roles.filter((role) => {
      const name = (role.name || role.display_name || '').toLowerCase();
      const description = (role.description || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [roles, roleSearchQuery]);

  const filteredPermissionSlugs = useMemo(() => {
    if (!permissionSearchQuery) return allPermissions;
    const query = permissionSearchQuery.toLowerCase();
    return allPermissions.filter((perm) => {
      const name = typeof perm === 'string' 
        ? perm 
        : (perm.name || perm.slug || perm.display_name || '').toLowerCase();
      return name.includes(query);
    });
  }, [allPermissions, permissionSearchQuery]);

  const handleToggleRole = (action, roleId) => {
    setPermissions((prev) => {
      const actionPerms = prev[action];
      const roles = actionPerms.roles || [];
      const newRoles = roles.includes(roleId)
        ? roles.filter((id) => id !== roleId)
        : [...roles, roleId];
      return {
        ...prev,
        [action]: {
          ...actionPerms,
          roles: newRoles,
        },
      };
    });
  };

  const handleToggleUser = (action, userId) => {
    setPermissions((prev) => {
      const actionPerms = prev[action];
      const users = actionPerms.users || [];
      const newUsers = users.includes(userId)
        ? users.filter((id) => id !== userId)
        : [...users, userId];
      return {
        ...prev,
        [action]: {
          ...actionPerms,
          users: newUsers,
        },
      };
    });
  };

  const handleTogglePermission = (action, permissionSlug) => {
    setPermissions((prev) => {
      const actionPerms = prev[action];
      const permissions = actionPerms.permissions || [];
      const newPermissions = permissions.includes(permissionSlug)
        ? permissions.filter((p) => p !== permissionSlug)
        : [...permissions, permissionSlug];
      return {
        ...prev,
        [action]: {
          ...actionPerms,
          permissions: newPermissions,
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePermissions.mutateAsync({
        id: category.id,
        permissions,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = permissionsLoading || categoryLoading || (open && usersLoading && !users.length);

  const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.name || user.email || user.username || `User ${user.id}`;
  };

  const getPermissionDisplayName = (perm) => {
    if (typeof perm === 'string') return perm;
    return perm.display_name || perm.name || perm.slug || String(perm);
  };

  const renderActionTab = (action) => {
    const actionPerms = permissions[action];
    const selectedRoleIds = actionPerms.roles || [];
    const selectedUserIds = actionPerms.users || [];
    const selectedPermissionSlugs = actionPerms.permissions || [];

    return (
      <div className="space-y-4">
        {/* Roles Section */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={roleSearchQuery}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {filteredRoles.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No roles found
              </div>
            ) : (
              filteredRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                return (
                  <div
                    key={role.id}
                    onClick={() => handleToggleRole(action, role.id)}
                    className={cn(
                      "p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between",
                      isSelected && "bg-primary/5 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {role.display_name || role.name}
                      </p>
                      {role.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {role.description}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
          {selectedRoleIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedRoleIds.map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                if (!role) return null;
                return (
                  <Badge key={roleId} variant="secondary" className="flex items-center gap-1">
                    {role.display_name || role.name}
                    <button
                      type="button"
                      onClick={() => handleToggleRole(action, roleId)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Users Section */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {userSearchQuery && usersLoading && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching users...
            </p>
          )}
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(action, user.id)}
                    className={cn(
                      "p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between",
                      isSelected && "bg-primary/5 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      {user.is_superuser && (
                        <Badge variant="default" className="text-xs flex-shrink-0">
                          Superuser
                        </Badge>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUserIds.map((userId) => {
                const user = users.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                    {getUserDisplayName(user)}
                    <button
                      type="button"
                      onClick={() => handleToggleUser(action, userId)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Permissions Section (Optional) */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permission Slugs (Advanced)
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={permissionSearchQuery}
              onChange={(e) => setPermissionSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {filteredPermissionSlugs.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No permissions found
              </div>
            ) : (
              filteredPermissionSlugs.map((perm) => {
                const permSlug = typeof perm === 'string' ? perm : (perm.name || perm.slug);
                const isSelected = selectedPermissionSlugs.includes(permSlug);
                return (
                  <div
                    key={permSlug}
                    onClick={() => handleTogglePermission(action, permSlug)}
                    className={cn(
                      "p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between",
                      isSelected && "bg-primary/5 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {getPermissionDisplayName(perm)}
                      </p>
                      {typeof perm === 'object' && perm.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {perm.description}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
          {selectedPermissionSlugs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPermissionSlugs.map((permSlug) => (
                <Badge key={permSlug} variant="secondary" className="flex items-center gap-1">
                  {permSlug}
                  <button
                    type="button"
                    onClick={() => handleTogglePermission(action, permSlug)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions: {category?.name}</DialogTitle>
          <DialogDescription>
            Set which roles, users, and permissions can read, write, and delete documents in this category.
            {category?.inherit_permissions && (
              <span className="block mt-2 text-xs text-muted-foreground">
                Note: This category inherits permissions from its parent. Changes here will override inheritance.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="py-4">
              <Tabs defaultValue="read" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="read">Read</TabsTrigger>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="delete">Delete</TabsTrigger>
                </TabsList>
                <TabsContent value="read" className="mt-4">
                  {renderActionTab("read")}
                </TabsContent>
                <TabsContent value="write" className="mt-4">
                  {renderActionTab("write")}
                </TabsContent>
                <TabsContent value="delete" className="mt-4">
                  {renderActionTab("delete")}
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePermissions.isPending}>
                {updatePermissions.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Permissions"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryPermissionsDialog;

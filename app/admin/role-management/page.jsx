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
  Building2,
  Network,
  RefreshCw,
  X,
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
import { useDepartments, useCreateDepartment } from "@/hooks/useDepartments";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RoleManagementPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isQuickCreateDepartmentOpen, setIsQuickCreateDepartmentOpen] = useState(false);
  const [isQuickCreateRoleOpen, setIsQuickCreateRoleOpen] = useState(false);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState(null);
  const [selectedRoleTypeFilter, setSelectedRoleTypeFilter] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [managingRole, setManagingRole] = useState(null);
  const [searchPermissionTerm, setSearchPermissionTerm] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [quickCreateDepartmentData, setQuickCreateDepartmentData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [quickCreateRoleData, setQuickCreateRoleData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    priority: 50,
    departmentId: null,
  });
  const [isQuickRoleNameManuallyEdited, setIsQuickRoleNameManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    priority: 50,
    roleType: "job_role",
    departmentId: null,
    parentRoleId: null,
  });
  const [isRoleNameManuallyEdited, setIsRoleNameManuallyEdited] = useState(false);

  // API hooks
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useRoles();
  const { data: permissionsData, isLoading: permissionsLoading } =
    usePermissionsList();
  const { data: departmentsData } = useDepartments();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignPermissionsMutation = useAssignPermissionsToRole();
  const createDepartmentMutation = useCreateDepartment();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateRole = hasPermission("role:create");
  const canUpdateRole = hasPermission("role:update");
  const canDeleteRole = hasPermission("role:delete");
  const canManagePermissions = hasPermission("role:update") || hasPermission("permission:assign");

  // Transform API data
  const allRoles = rolesData ? rolesData.map(roleUtils.transformRole) : [];
  const allPermissions = permissionsData
    ? permissionsData.map(permissionUtils.transformPermission)
    : [];
  const departments = departmentsData?.departments || departmentsData?.data || departmentsData || [];

  // Group roles by department and job role (hierarchical structure)
  const rolesByDepartment = React.useMemo(() => {
    const grouped = {};

    allRoles.forEach((role) => {
      if (role.roleType === "job_role" && role.departmentId) {
        const deptId = role.departmentId;
        if (!grouped[deptId]) {
          grouped[deptId] = {};
        }
        if (!grouped[deptId][role.id]) {
          grouped[deptId][role.id] = {
            jobRole: role,
            shiftRoles: [],
          };
        }
      } else if (role.roleType === "shift_role" && role.parentRoleId) {
        // Find the department of the parent job role
        const parentJobRole = allRoles.find((r) => r.id === role.parentRoleId && r.roleType === "job_role");
        if (parentJobRole && parentJobRole.departmentId) {
          const deptId = parentJobRole.departmentId;
          if (!grouped[deptId]) {
            grouped[deptId] = {};
          }
          if (!grouped[deptId][role.parentRoleId]) {
            grouped[deptId][role.parentRoleId] = {
              jobRole: parentJobRole,
              shiftRoles: [],
            };
          }
          grouped[deptId][role.parentRoleId].shiftRoles.push(role);
        }
      }
    });

    return grouped;
  }, [allRoles]);

  // Filter roles based on selected filters
  const roles = React.useMemo(() => {
    let filtered = allRoles;

    // Filter by department
    if (selectedDepartmentFilter) {
      filtered = filtered.filter((role) => role.departmentId === selectedDepartmentFilter);
    }

    // Filter by role type
    if (selectedRoleTypeFilter) {
      filtered = filtered.filter((role) => role.roleType === selectedRoleTypeFilter);
    }

    return filtered;
  }, [allRoles, selectedDepartmentFilter, selectedRoleTypeFilter]);

  // Get filtered departments based on filters
  const filteredDepartments = React.useMemo(() => {
    if (selectedDepartmentFilter) {
      return departments.filter((dept) => dept.id === selectedDepartmentFilter);
    }
    return departments;
  }, [departments, selectedDepartmentFilter]);

  // Filter job roles for parent role selection (only job roles can be parents)
  // Include roles with roleType === "job_role" or roles without roleType (legacy roles default to job_role)
  const jobRoles = allRoles.filter(
    (role) => role.roleType === "job_role" || !role.roleType
  );

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
    setIsRoleNameManuallyEdited(false);
    setFormData({
      displayName: "",
      roleName: "",
      description: "",
      priority: 50,
      roleType: "job_role",
      departmentId: null,
      parentRoleId: null,
    });
  };

  const handleEditRole = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      setEditingRole(role);
      setIsRoleNameManuallyEdited(true); // In edit mode, role name is already set
      setFormData({
        displayName: role.name,
        roleName: role.slug,
        description: role.description,
        priority: role.priority,
        roleType: role.roleType || "job_role",
        departmentId: role.departmentId || null,
        parentRoleId: role.parentRoleId || null,
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

  // Utility function to generate slug from display name
  const generateSlug = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Auto-generate role name from display name if not manually edited
      if (field === "displayName" && !isRoleNameManuallyEdited && !editingRole) {
        newData.roleName = generateSlug(value);
      }

      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (formData.roleType === "job_role" && !formData.departmentId) {
        toast.error("Department is required for Job Role", {
          description: "Please select a department for this job role.",
        });
        return;
      }

      if (formData.roleType === "shift_role" && !formData.parentRoleId) {
        toast.error("Parent Role is required for Shift Role", {
          description: "Please select a parent job role for this shift role.",
        });
        return;
      }

      const roleData = {
        display_name: formData.displayName,
        name: formData.roleName,
        description: formData.description,
        priority: formData.priority,
        role_type: formData.roleType,
      };

      // Add fields based on role type
      if (formData.roleType === "job_role") {
        roleData.department_id = formData.departmentId;
        if (formData.parentRoleId) {
          roleData.parent_role_id = formData.parentRoleId;
        }
      } else if (formData.roleType === "shift_role") {
        roleData.parent_role_id = formData.parentRoleId;
        // department_id is not sent for shift roles (auto-set from parent)
      }

      if (editingRole) {
        // For updates, only send fields that can be updated
        const updateData = {
          display_name: formData.displayName,
          description: formData.description,
          priority: formData.priority,
        };

        // For Job Role, department_id can be updated
        if (formData.roleType === "job_role") {
          updateData.department_id = formData.departmentId;
          if (formData.parentRoleId) {
            updateData.parent_role_id = formData.parentRoleId;
          } else {
            updateData.parent_role_id = null;
          }
        }

        // For Shift Role, only parent_role_id can be updated (department_id is ignored)
        if (formData.roleType === "shift_role") {
          updateData.parent_role_id = formData.parentRoleId;
        }

        await updateRoleMutation.mutateAsync({
          id: editingRole.id,
          roleData: updateData,
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
        roleType: "job_role",
        departmentId: null,
        parentRoleId: null,
      });
    } catch (error) {
      console.error("Failed to submit role:", error);
    }
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingRole(null);
    setIsRoleNameManuallyEdited(false);
    setFormData({
      displayName: "",
      roleName: "",
      description: "",
      priority: 50,
      roleType: "job_role",
      departmentId: null,
      parentRoleId: null,
    });
  };

  const handleQuickCreateDepartment = async () => {
    if (!quickCreateDepartmentData.name || !quickCreateDepartmentData.code) {
      toast.error("Name and code are required", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    try {
      const result = await createDepartmentMutation.mutateAsync({
        name: quickCreateDepartmentData.name,
        code: quickCreateDepartmentData.code.toUpperCase(),
        description: quickCreateDepartmentData.description || "",
        is_active: true,
      });

      setIsQuickCreateDepartmentOpen(false);
      setQuickCreateDepartmentData({ name: "", code: "", description: "" });

      // Auto-select the newly created department
      if (result && result.id) {
        handleInputChange("departmentId", result.id);
      }
    } catch (error) {
      console.error("Failed to create department:", error);
    }
  };

  const handleQuickCreateRole = async () => {
    if (!quickCreateRoleData.displayName || !quickCreateRoleData.roleName) {
      toast.error("Display name and role name are required", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (!quickCreateRoleData.departmentId) {
      toast.error("Department is required", {
        description: "Please select a department for this job role.",
      });
      return;
    }

    try {
      const roleData = {
        display_name: quickCreateRoleData.displayName,
        name: quickCreateRoleData.roleName,
        description: quickCreateRoleData.description || "",
        priority: quickCreateRoleData.priority,
        role_type: "job_role",
        department_id: quickCreateRoleData.departmentId,
      };

      const result = await createRoleMutation.mutateAsync(roleData);

      setIsQuickCreateRoleOpen(false);
      setIsQuickRoleNameManuallyEdited(false);
      setQuickCreateRoleData({
        displayName: "",
        roleName: "",
        description: "",
        priority: 50,
        departmentId: null,
      });

      // Auto-select the newly created role as parent
      if (result && result.id) {
        handleInputChange("parentRoleId", result.id);
      }
    } catch (error) {
      console.error("Failed to create role:", error);
    }
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
        {canCreateRole && (
          <Button onClick={handleCreateRole} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="departmentFilter" className="text-sm font-medium">
            Filter by Department:
          </Label>
          <Select
            value={selectedDepartmentFilter?.toString() || "all"}
            onValueChange={(value) =>
              setSelectedDepartmentFilter(value === "all" ? null : parseInt(value))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name} {dept.code && `(${dept.code})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="roleTypeFilter" className="text-sm font-medium">
            Filter by Type:
          </Label>
          <Select
            value={selectedRoleTypeFilter || "all"}
            onValueChange={(value) =>
              setSelectedRoleTypeFilter(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="job_role">Job Roles</SelectItem>
              <SelectItem value="shift_role">Shift Roles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(selectedDepartmentFilter || selectedRoleTypeFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDepartmentFilter(null);
              setSelectedRoleTypeFilter(null);
            }}
          >
            Clear Filters
          </Button>
        )}
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

      {/* Roles by Department Hierarchy */}
      {!rolesLoading && !rolesError && (
        <div className="space-y-6">
          {filteredDepartments.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No departments found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    No departments available to display roles.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredDepartments.map((department) => {
              const departmentRoles = rolesByDepartment[department.id] || {};
              const jobRolesList = Object.values(departmentRoles);

              // Apply role type filter if selected
              const filteredJobRolesList = selectedRoleTypeFilter
                ? jobRolesList.filter((group) => {
                  if (selectedRoleTypeFilter === "job_role") return true;
                  if (selectedRoleTypeFilter === "shift_role") {
                    return group.shiftRoles.length > 0;
                  }
                  return true;
                })
                : jobRolesList;

              if (filteredJobRolesList.length === 0 && selectedDepartmentFilter) {
                return null; // Don't show empty departments when filtered
              }

              return (
                <Card key={department.id} className="bg-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {department.name}
                            {department.code && (
                              <span className="text-sm text-muted-foreground font-normal ml-2">
                                ({department.code})
                              </span>
                            )}
                          </CardTitle>
                          {department.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {department.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {filteredJobRolesList.length} job role(s)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredJobRolesList.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No roles assigned to this department
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredJobRolesList.map((group) => {
                          const role = group.jobRole;
                          const iconClasses = getRoleIconClasses(
                            roleUtils.getRoleColor(role)
                          );
                          const IconComponent = getRoleIcon(role);

                          return (
                            <div
                              key={role.id}
                              className="border rounded-lg p-4 bg-background space-y-3"
                            >
                              {/* Job Role Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClasses}`}
                                  >
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-base">
                                        {role.name}
                                      </h4>
                                      <Badge
                                        variant="default"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        Job Role
                                      </Badge>
                                      {role.isSystem && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          System
                                        </Badge>
                                      )}
                                    </div>
                                    {role.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {canUpdateRole && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEditRole(role.id)}
                                      title="Edit role"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {!role.isSystem && canDeleteRole && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                          title="Delete role"
                                        >
                                          <AlertCircle className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Job Role</AlertDialogTitle>
                                          <AlertDialogDescription className="space-y-2">
                                            <p>
                                              Are you sure you want to delete the job role "
                                              {role.name}"? This action cannot be undone and
                                              will remove the role from all users.
                                            </p>
                                            {group.shiftRoles.length > 0 && (
                                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                                  ⚠️ Warning: This will also automatically remove all shift roles under this job role:
                                                </p>
                                                <ul className="text-sm text-yellow-800 dark:text-yellow-200 list-disc list-inside space-y-0.5">
                                                  {group.shiftRoles.map((shiftRole) => (
                                                    <li key={shiftRole.id}>
                                                      {shiftRole.display_name || shiftRole.name}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
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

                              {/* Job Role Details */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Key className="h-3 w-3" />
                                    <span>Priority: {role.priority}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>Users: {role.userCount || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    <span>
                                      Permissions: {getRolePermissions(role).length}
                                    </span>
                                  </div>
                                </div>
                                {!role.isSystem && canManagePermissions && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleManagePermissions(role.id)}
                                    className="flex items-center gap-1 h-7 text-xs px-2"
                                  >
                                    <Settings className="h-3 w-3" />
                                    Manage Permissions
                                  </Button>
                                )}
                              </div>

                              {/* Permissions Preview */}
                              {getRolePermissions(role).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {getRolePermissions(role)
                                    .slice(0, 3)
                                    .map((permission, index) => {
                                      const permissionName =
                                        typeof permission === "object"
                                          ? permission.name ||
                                          permission.display_name ||
                                          permission.slug ||
                                          "Unknown"
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
                                  {getRolePermissions(role).length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      +{getRolePermissions(role).length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Shift Roles */}
                              {group.shiftRoles.length > 0 && (
                                <div className="ml-4 mt-3 space-y-2 border-l-2 border-muted pl-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Network className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Shift Roles ({group.shiftRoles.length})
                                    </span>
                                  </div>
                                  {group.shiftRoles.map((shiftRole) => {
                                    const shiftIconClasses = getRoleIconClasses(
                                      roleUtils.getRoleColor(shiftRole)
                                    );
                                    const ShiftIconComponent = getRoleIcon(shiftRole);

                                    return (
                                      <div
                                        key={shiftRole.id}
                                        className="border rounded-md p-3 bg-muted/30 space-y-2"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-2 flex-1">
                                            <div
                                              className={`flex h-6 w-6 items-center justify-center rounded ${shiftIconClasses}`}
                                            >
                                              <ShiftIconComponent className="h-3 w-3" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                  {shiftRole.name}
                                                </span>
                                                <Badge
                                                  variant="secondary"
                                                  className="text-[10px] px-1.5 py-0"
                                                >
                                                  Shift Role
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className="text-[10px] px-1.5 py-0 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                                                >
                                                  Auto-assigned
                                                </Badge>
                                              </div>
                                              {shiftRole.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  {shiftRole.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                              onClick={() =>
                                                handleEditRole(shiftRole.id)
                                              }
                                              title="Edit shift role"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            {!shiftRole.isSystem && (
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                                    title="Delete shift role"
                                                  >
                                                    <AlertCircle className="h-3 w-3" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                      Delete Shift Role
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Are you sure you want to delete the shift
                                                      role "{shiftRole.name}"? This action
                                                      cannot be undone.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                      Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() =>
                                                        deleteRoleMutation.mutate(
                                                          shiftRole.id
                                                        )
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
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Key className="h-3 w-3" />
                                              <span>Priority: {shiftRole.priority}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Users className="h-3 w-3" />
                                              <span>
                                                Users: {shiftRole.userCount || 0}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Settings className="h-3 w-3" />
                                              <span>
                                                Permissions:{" "}
                                                {getRolePermissions(shiftRole).length}
                                              </span>
                                            </div>
                                          </div>
                                          {!shiftRole.isSystem && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                handleManagePermissions(shiftRole.id)
                                              }
                                              className="flex items-center gap-1 h-6 text-xs px-2"
                                            >
                                              <Settings className="h-3 w-3" />
                                              Manage Permissions
                                            </Button>
                                          )}
                                        </div>
                                        {getRolePermissions(shiftRole).length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {getRolePermissions(shiftRole)
                                              .slice(0, 2)
                                              .map((permission, index) => {
                                                const permissionName =
                                                  typeof permission === "object"
                                                    ? permission.name ||
                                                    permission.display_name ||
                                                    permission.slug ||
                                                    "Unknown"
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
                                            {getRolePermissions(shiftRole).length > 2 && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0"
                                              >
                                                +
                                                {getRolePermissions(shiftRole).length - 2}{" "}
                                                more
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {group.shiftRoles.length === 0 && (
                                <div className="ml-4 mt-2">
                                  <p className="text-xs text-muted-foreground italic">
                                    No shift roles assigned
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Create Role Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Role Type */}
            <div className="space-y-2">
              <Label htmlFor="roleType">
                Role Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.roleType}
                onValueChange={(value) => {
                  handleInputChange("roleType", value);
                  // Reset dependent fields when role type changes
                  if (value === "shift_role") {
                    handleInputChange("departmentId", null);
                  } else {
                    handleInputChange("parentRoleId", null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job_role">Job Role</SelectItem>
                  <SelectItem value="shift_role">Shift Role</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.roleType === "job_role"
                  ? "Base role that belongs to a department"
                  : "Task-specific role that belongs under a Job Role"}
              </p>
            </div>

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
              <div className="flex gap-2">
                <Input
                  id="roleName"
                  placeholder="e.g., senior_doctor"
                  value={formData.roleName}
                  onChange={(e) => {
                    setIsRoleNameManuallyEdited(true);
                    handleInputChange("roleName", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").replace(/\s+/g, "_"));
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const generated = generateSlug(formData.displayName);
                    handleInputChange("roleName", generated);
                    setIsRoleNameManuallyEdited(false);
                  }}
                  title="Auto-generate from display name"
                  disabled={!formData.displayName}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores only. Cannot be changed after
                creation. {!isRoleNameManuallyEdited && formData.displayName && (
                  <span className="text-blue-600 dark:text-blue-400">Auto-generated from display name.</span>
                )}
              </p>
            </div>

            {/* Department (for Job Role) */}
            {formData.roleType === "job_role" && (
              <div className="space-y-2">
                <Label htmlFor="departmentId">
                  Department <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.departmentId?.toString() || ""}
                    onValueChange={(value) =>
                      handleInputChange("departmentId", parseInt(value))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length === 0 ? (
                        <SelectItem value="no-options" disabled>
                          No options available
                        </SelectItem>
                      ) : (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name} {dept.code && `(${dept.code})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsQuickCreateDepartmentOpen(true)}
                    title="Create new department"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Parent Role (for Shift Role - required, for Job Role - optional) */}
            <div className="space-y-2">
              <Label htmlFor="parentRoleId">
                {formData.roleType === "job_role"
                  ? "Line Manager Role"
                  : "Parent Job Role"}
                {formData.roleType === "shift_role" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.parentRoleId?.toString() || (formData.roleType === "job_role" ? "none" : undefined)}
                  onValueChange={(value) => {
                    if (value === "none") {
                      handleInputChange("parentRoleId", null);
                    } else {
                      handleInputChange("parentRoleId", parseInt(value));
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={formData.roleType === "job_role" ? "Select a line manager role (optional)" : "Select a parent job role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Filter out the current role being edited (if any)
                      const filteredJobRoles = editingRole
                        ? jobRoles.filter((role) => role.id !== editingRole.id)
                        : jobRoles;

                      // Add "No Parent Job Role" option for Job Roles (optional)
                      if (formData.roleType === "job_role") {
                        return (
                          <>
                            <SelectItem value="none">
                              No Line Manager
                            </SelectItem>
                            {filteredJobRoles.length === 0 ? (
                              <SelectItem value="no-options" disabled>
                                No job roles available
                              </SelectItem>
                            ) : (
                              filteredJobRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))
                            )}
                          </>
                        );
                      }

                      // For Shift Roles, no "none" option (required)
                      return filteredJobRoles.length === 0 ? (
                        <SelectItem value="no-options" disabled>
                          No job roles available
                        </SelectItem>
                      ) : (
                        filteredJobRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))
                      );
                    })()}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Pre-fill department if creating from job role form
                    setIsQuickRoleNameManuallyEdited(false);
                    setQuickCreateRoleData({
                      displayName: "",
                      roleName: "",
                      description: "",
                      priority: 50,
                      departmentId: formData.roleType === "job_role" ? formData.departmentId : null,
                    });
                    setIsQuickCreateRoleOpen(true);
                  }}
                  title="Create new job role"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.roleType === "shift_role"
                  ? "Required: Must be a Job Role. Department will be inherited from parent."
                  : formData.parentRoleId
                    ? "This role reports to the selected Line Manager Role."
                    : "Optional: Select a Job Role that will be the Line Manager for this role."}
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
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Role Type - Read Only for Edit */}
            <div className="space-y-2">
              <Label htmlFor="editRoleType">Role Type</Label>
              <Input
                id="editRoleType"
                value={
                  formData.roleType === "job_role" ? "Job Role" : "Shift Role"
                }
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Role type cannot be changed after creation.
              </p>
            </div>

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

            {/* Department (for Job Role) */}
            {formData.roleType === "job_role" && (
              <div className="space-y-2">
                <Label htmlFor="editDepartmentId">
                  Department <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.departmentId?.toString() || ""}
                    onValueChange={(value) =>
                      handleInputChange("departmentId", parseInt(value))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length === 0 ? (
                        <SelectItem value="no-options" disabled>
                          No options available
                        </SelectItem>
                      ) : (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name} {dept.code && `(${dept.code})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsQuickCreateDepartmentOpen(true)}
                    title="Create new department"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Department (for Shift Role - disabled, shows inherited value) */}
            {formData.roleType === "shift_role" && editingRole && (
              <div className="space-y-2">
                <Label htmlFor="editDepartmentId">Department</Label>
                <Input
                  id="editDepartmentId"
                  value={
                    editingRole.department?.name ||
                    "Inherited from parent role"
                  }
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Department is automatically inherited from the parent role and
                  cannot be changed directly.
                </p>
              </div>
            )}

            {/* Parent Role */}
            <div className="space-y-2">
              <Label htmlFor="editParentRoleId">
                {formData.roleType === "job_role"
                  ? "Line Manager Role"
                  : "Parent Job Role"}
                {formData.roleType === "shift_role" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.parentRoleId?.toString() || (formData.roleType === "job_role" ? "none" : undefined)}
                  onValueChange={(value) => {
                    if (value === "none") {
                      handleInputChange("parentRoleId", null);
                    } else {
                      if (
                        formData.roleType === "shift_role" &&
                        formData.parentRoleId &&
                        parseInt(value) !== formData.parentRoleId
                      ) {
                        // Show warning if changing parent for Shift Role
                        toast.warning("Changing parent role", {
                          description:
                            "The department will automatically update to match the new parent role.",
                        });
                      }
                      handleInputChange("parentRoleId", parseInt(value));
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={formData.roleType === "job_role" ? "Select a line manager role" : "Select a parent job role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Filter out the current role being edited (if any)
                      const filteredJobRoles = editingRole
                        ? jobRoles.filter((role) => role.id !== editingRole.id)
                        : jobRoles;

                      // Add "No Parent Job Role" option for Job Roles (optional)
                      if (formData.roleType === "job_role") {
                        return (
                          <>
                            <SelectItem value="none">
                              No Line Manager
                            </SelectItem>
                            {filteredJobRoles.length === 0 ? (
                              <SelectItem value="no-options" disabled>
                                No job roles available
                              </SelectItem>
                            ) : (
                              filteredJobRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))
                            )}
                          </>
                        );
                      }

                      // For Shift Roles, no "none" option (required)
                      return filteredJobRoles.length === 0 ? (
                        <SelectItem value="no-options" disabled>
                          No job roles available
                        </SelectItem>
                      ) : (
                        filteredJobRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))
                      );
                    })()}
                  </SelectContent>
                </Select>
                {formData.parentRoleId && formData.roleType === "job_role" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleInputChange("parentRoleId", null)}
                    title="Clear parent role"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Pre-fill department if creating from job role form
                    setIsQuickRoleNameManuallyEdited(false);
                    setQuickCreateRoleData({
                      displayName: "",
                      roleName: "",
                      description: "",
                      priority: 50,
                      departmentId: formData.roleType === "job_role" ? formData.departmentId : null,
                    });
                    setIsQuickCreateRoleOpen(true);
                  }}
                  title="Create new job role"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.roleType === "shift_role"
                  ? "Required: Must be a Job Role. Department will be inherited from parent."
                  : formData.parentRoleId
                    ? "This role reports to the selected Line Manager Role."
                    : "Optional: Select a Job Role that will be the Line Manager for this role."}
              </p>
              {formData.roleType === "shift_role" && (
                <div className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Changing the parent role will automatically update the
                    department to match the new parent.
                  </p>
                </div>
              )}
              {formData.roleType === "job_role" && formData.parentRoleId && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2">
                  <Network className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    This role reports to the selected <strong>Line Manager Role</strong>.
                  </p>
                </div>
              )}
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

      {/* Quick Create Department Modal */}
      <Dialog
        open={isQuickCreateDepartmentOpen}
        onOpenChange={setIsQuickCreateDepartmentOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quickDeptName">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quickDeptName"
                placeholder="e.g., Engineering"
                value={quickCreateDepartmentData.name}
                onChange={(e) =>
                  setQuickCreateDepartmentData({
                    ...quickCreateDepartmentData,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickDeptCode">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quickDeptCode"
                placeholder="e.g., ENG"
                value={quickCreateDepartmentData.code}
                onChange={(e) =>
                  setQuickCreateDepartmentData({
                    ...quickCreateDepartmentData,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickDeptDescription">Description</Label>
              <Textarea
                id="quickDeptDescription"
                placeholder="Department description..."
                value={quickCreateDepartmentData.description}
                onChange={(e) =>
                  setQuickCreateDepartmentData({
                    ...quickCreateDepartmentData,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickCreateDepartmentOpen(false);
                setQuickCreateDepartmentData({
                  name: "",
                  code: "",
                  description: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickCreateDepartment}
              disabled={createDepartmentMutation.isPending}
            >
              {createDepartmentMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Role Modal */}
      <Dialog
        open={isQuickCreateRoleOpen}
        onOpenChange={setIsQuickCreateRoleOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Job Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quickRoleDisplayName">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quickRoleDisplayName"
                placeholder="e.g., Senior Doctor"
                value={quickCreateRoleData.displayName}
                onChange={(e) => {
                  const newDisplayName = e.target.value;
                  setQuickCreateRoleData((prev) => {
                    const newData = {
                      ...prev,
                      displayName: newDisplayName,
                    };
                    // Auto-generate role name if not manually edited
                    if (!isQuickRoleNameManuallyEdited) {
                      newData.roleName = generateSlug(newDisplayName);
                    }
                    return newData;
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickRoleName">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quickRoleName"
                  placeholder="e.g., senior_doctor"
                  value={quickCreateRoleData.roleName}
                  onChange={(e) => {
                    setIsQuickRoleNameManuallyEdited(true);
                    setQuickCreateRoleData({
                      ...quickCreateRoleData,
                      roleName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").replace(/\s+/g, "_"),
                    });
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const generated = generateSlug(quickCreateRoleData.displayName);
                    setQuickCreateRoleData({
                      ...quickCreateRoleData,
                      roleName: generated,
                    });
                    setIsQuickRoleNameManuallyEdited(false);
                  }}
                  title="Auto-generate from display name"
                  disabled={!quickCreateRoleData.displayName}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores only. {!isQuickRoleNameManuallyEdited && quickCreateRoleData.displayName && (
                  <span className="text-blue-600 dark:text-blue-400">Auto-generated from display name.</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickRoleDepartment">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={quickCreateRoleData.departmentId?.toString() || ""}
                onValueChange={(value) =>
                  setQuickCreateRoleData({
                    ...quickCreateRoleData,
                    departmentId: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 ? (
                    <SelectItem value="no-options" disabled>
                      No options available
                    </SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} {dept.code && `(${dept.code})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickRoleDescription">Description</Label>
              <Textarea
                id="quickRoleDescription"
                placeholder="Role description..."
                value={quickCreateRoleData.description}
                onChange={(e) =>
                  setQuickCreateRoleData({
                    ...quickCreateRoleData,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickRolePriority">Priority</Label>
              <Input
                id="quickRolePriority"
                type="number"
                value={quickCreateRoleData.priority}
                onChange={(e) =>
                  setQuickCreateRoleData({
                    ...quickCreateRoleData,
                    priority: parseInt(e.target.value) || 50,
                  })
                }
                min="1"
                max="100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickCreateRoleOpen(false);
                setIsQuickRoleNameManuallyEdited(false);
                setQuickCreateRoleData({
                  displayName: "",
                  roleName: "",
                  description: "",
                  priority: 50,
                  departmentId: null,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickCreateRole}
              disabled={createRoleMutation.isPending}
            >
              {createRoleMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default RoleManagementPage;

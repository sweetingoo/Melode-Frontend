"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Shield,
  Eye,
  Check,
  Crown,
  Key,
  RefreshCw,
  Info,
  Leaf,
  Plus,
  X,
  Trash2,
  Search,
  AlertCircle,
  Building2,
  Network,
} from "lucide-react";
import {
  useUser,
  useUpdateUser,
  useDeleteUser,
  useDeactivateUser,
  useActivateUser,
  useVerifyUser,
  useUserPermissions,
  useUserDirectPermissions,
  useUserRoles,
  useAssignDirectPermission,
  useRemoveDirectPermission,
  useAssignRole,
  useRemoveRole,
  useRoles,
  userUtils,
} from "@/hooks/useUsers";
import { usePermissions } from "@/hooks/usePermissions";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import {
  useEmployeeAssignments,
  useCreateAssignment,
  useDeleteAssignment,
} from "@/hooks/useAssignments";
import { useDepartments } from "@/hooks/useDepartments";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hooks/useUsers";
import { useHierarchyImage } from "@/hooks/useEmployees";
import UserAuditLogs from "@/components/UserAuditLogs";

const UserEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;

  const [activeTab, setActiveTab] = useState("basic");
  const [isCustomPermissionModalOpen, setIsCustomPermissionModalOpen] =
    useState(false);
  const [searchPermissionTerm, setSearchPermissionTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isAssignDepartmentModalOpen, setIsAssignDepartmentModalOpen] =
    useState(false);
  const [isAddRoleToDepartmentModalOpen, setIsAddRoleToDepartmentModalOpen] =
    useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDepartmentForRole, setSelectedDepartmentForRole] =
    useState(null);
  const [selectedRoleForDepartment, setSelectedRoleForDepartment] =
    useState("");

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useUser(userId);

  // Extract roles, permissions, and direct_permissions from the main user data
  const userRoles = userData?.roles || [];
  const userPermissions = userData?.permissions || [];
  const userDirectPermissions = userData?.direct_permissions || [];

  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const verifyUserMutation = useVerifyUser();
  const assignDirectPermissionMutation = useAssignDirectPermission();
  const removeDirectPermissionMutation = useRemoveDirectPermission();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();

  // Department and Assignment hooks
  const { data: departmentsData, isLoading: departmentsLoading } =
    useDepartments();
  // Handle different response structures - could be array or object with departments property
  const departments = React.useMemo(() => {
    if (!departmentsData) return [];
    if (Array.isArray(departmentsData)) return departmentsData;
    if (
      departmentsData.departments &&
      Array.isArray(departmentsData.departments)
    ) {
      return departmentsData.departments;
    }
    return [];
  }, [departmentsData]);
  const {
    data: employeeAssignmentsData,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useEmployeeAssignments(userId);
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();
  const queryClient = useQueryClient();

  // Transform user data
  const transformedUser = React.useMemo(() => {
    return userData ? userUtils.transformUser(userData) : null;
  }, [userData]);

  // Get available roles from API (needed for Superuser role lookup)
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  // Group assignments by department
  const assignmentsByDepartment = React.useMemo(() => {
    if (!employeeAssignmentsData || !Array.isArray(employeeAssignmentsData)) {
      return [];
    }

    // Group assignments by department_id, then by job role with nested shift roles
    const grouped = {};

    employeeAssignmentsData.forEach((assignment) => {
      const deptId = assignment.department_id || assignment.department?.id;
      if (!deptId || !assignment.role) return;

      if (!grouped[deptId]) {
        grouped[deptId] = {
          department: assignment.department || {
            id: deptId,
            name: assignment.department_name || "Unknown Department",
            code: assignment.department_code || "",
          },
          jobRoles: new Map(), // Use Map to group by job role ID
        };
      }

      const role = assignment.role;
      const roleType = role.role_type || role.roleType;
      const assignmentId = assignment.assignment_id || assignment.id;

      if (roleType === "job_role") {
        // Job role - add to map if not exists
        if (!grouped[deptId].jobRoles.has(role.id)) {
          grouped[deptId].jobRoles.set(role.id, {
            role: role,
            assignment_id: assignmentId,
            shiftRoles: [],
          });
        } else {
          // Update existing job role assignment
          const existing = grouped[deptId].jobRoles.get(role.id);
          existing.assignment_id = assignmentId;
        }
      } else if (roleType === "shift_role" && role.parent_role_id) {
        // Shift role - find parent job role and add to its shiftRoles array
        const parentJobRoleId = role.parent_role_id;

        // Ensure parent job role exists in the map (might not have assignment)
        if (!grouped[deptId].jobRoles.has(parentJobRoleId)) {
          // Try to find parent job role from other assignments
          const parentAssignment = employeeAssignmentsData.find(
            (a) =>
              a.role?.id === parentJobRoleId &&
              a.role?.role_type === "job_role" &&
              (a.department_id === deptId || a.department?.id === deptId)
          );

          if (parentAssignment) {
            grouped[deptId].jobRoles.set(parentJobRoleId, {
              role: parentAssignment.role,
              assignment_id: parentAssignment.assignment_id || parentAssignment.id,
              shiftRoles: [],
            });
          } else {
            // Create placeholder for parent job role (might not be assigned)
            grouped[deptId].jobRoles.set(parentJobRoleId, {
              role: {
                id: parentJobRoleId,
                name: role.parent_role?.name || "Unknown Job Role",
                display_name: role.parent_role?.display_name || "Unknown Job Role",
                role_type: "job_role",
              },
              assignment_id: null,
              shiftRoles: [],
            });
          }
        }

        // Add shift role to parent's shiftRoles array (deduplicate by role.id)
        const jobRoleGroup = grouped[deptId].jobRoles.get(parentJobRoleId);
        const existingShiftRole = jobRoleGroup.shiftRoles.find(
          (sr) => sr.role?.id === role.id
        );

        if (!existingShiftRole) {
          jobRoleGroup.shiftRoles.push({
            role: role,
            assignment_id: assignmentId,
          });
        }
      } else {
        // Other roles (fallback - shouldn't happen with current structure)
        if (!grouped[deptId].otherRoles) {
          grouped[deptId].otherRoles = [];
        }
        grouped[deptId].otherRoles.push({
          ...role,
          assignment_id: assignmentId,
        });
      }
    });

    // Convert Maps to arrays and structure for display
    const departmentGroups = Object.values(grouped).map((deptGroup) => ({
      department: deptGroup.department,
      jobRoles: Array.from(deptGroup.jobRoles.values()),
      otherRoles: deptGroup.otherRoles || [],
    }));

    // Add Superuser role if user is a superuser
    // Superuser role doesn't need a department or parent job role
    if (transformedUser?.isSuperuser) {
      // Check if superuser role already exists in assignments
      const superuserAssignment = employeeAssignmentsData?.find(
        (a) =>
          a.role?.slug === "superuser" ||
          a.role?.name === "superuser" ||
          a.role?.role_type === "superuser" ||
          a.role?.id === "superuser" ||
          (typeof a.role === "object" && (a.role.slug === "superuser" || a.role.name === "superuser"))
      );

      // Find superuser role from rolesData if available
      const superuserRole = rolesData?.find(
        (r) =>
          r.slug === "superuser" ||
          r.name === "superuser" ||
          r.role_type === "superuser" ||
          r.id === "superuser" ||
          (typeof r === "object" && r.display_name?.toLowerCase() === "superuser")
      ) || {
        id: "superuser",
        name: "superuser",
        display_name: "Superuser",
        slug: "superuser",
        role_type: "superuser",
        isSystem: true,
        description: "Full system access with all permissions",
      };

      // Prepend Superuser department group
      departmentGroups.unshift({
        department: {
          id: "superuser",
          name: "Superuser",
          code: "SU",
          description: "System administrator role",
        },
        jobRoles: [
          {
            role: superuserRole,
            assignment_id: superuserAssignment?.assignment_id || superuserAssignment?.id || null,
            shiftRoles: [],
          },
        ],
        otherRoles: [],
      });
    }

    return departmentGroups;
  }, [employeeAssignmentsData, transformedUser, rolesData]);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    title: "",
    phoneNumber: "",
    avatarUrl: "",
    bio: "",
  });

  // Update form data when user data loads
  React.useEffect(() => {
    if (transformedUser) {
      const newFormData = {
        email: transformedUser.email || "",
        username: transformedUser.username || "",
        firstName: transformedUser.firstName || "",
        lastName: transformedUser.lastName || "",
        title: transformedUser.title || "",
        phoneNumber: transformedUser.phoneNumber || "",
        avatarUrl: transformedUser.avatarUrl || "",
        bio: transformedUser.bio || "",
      };

      // Only update if the data has actually changed
      setFormData((prevFormData) => {
        const hasChanged = Object.keys(newFormData).some(
          (key) => prevFormData[key] !== newFormData[key]
        );
        return hasChanged ? newFormData : prevFormData;
      });
    }
  }, [transformedUser]);

  const availableRoles = React.useMemo(() => {
    if (!rolesData) return [];
    return rolesData;
  }, [rolesData]);

  // Get all permissions from API
  const { data: allPermissionsData, isLoading: permissionsLoading } =
    usePermissions();

  // Get current user (admin) data to check what permissions they can assign
  const { data: currentUserData, isLoading: currentUserLoading } = useCurrentUser();

  // Get hierarchy image
  const { data: hierarchyImageUrl, isLoading: hierarchyLoading, error: hierarchyError } = useHierarchyImage();

  // Get current user's permissions to determine what they can assign
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions =
    currentUserData?.direct_permissions || [];

  // Check if current user has wildcard permissions
  const currentUserHasWildcardPermissions = React.useMemo(() => {
    const rolePermissions = currentUserPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    const directPermissions = currentUserDirectPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    return { rolePermissions, directPermissions };
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Get current user's permission IDs (what they can assign)
  const currentUserPermissionIds = React.useMemo(() => {
    // If current user has wildcard permissions, they can assign all permissions
    if (
      currentUserHasWildcardPermissions.rolePermissions ||
      currentUserHasWildcardPermissions.directPermissions
    ) {
      console.log(
        "Current user has wildcard permissions - can assign all permissions"
      );
      return allPermissionsData?.map((p) => p.id) || [];
    }

    // Otherwise, get their specific permission IDs
    const roleIds = currentUserPermissions
      .map(
        (p) =>
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
      )
      .filter(Boolean);

    const directIds = currentUserDirectPermissions
      .map(
        (p) =>
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
      )
      .filter(Boolean);

    // Combine and deduplicate
    const allIds = [...new Set([...roleIds, ...directIds])];
    console.log("Current user permission IDs (can assign):", allIds);
    return allIds;
  }, [
    currentUserPermissions,
    currentUserDirectPermissions,
    currentUserHasWildcardPermissions,
    allPermissionsData,
  ]);

  // Check if user has wildcard permissions (e.g., superuser with "*")
  const hasWildcardPermissions = React.useMemo(() => {
    const rolePermissions = userPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    const directPermissions = userDirectPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    console.log("Has wildcard role permissions:", rolePermissions);
    console.log("Has wildcard direct permissions:", directPermissions);
    return { rolePermissions, directPermissions };
  }, [userPermissions, userDirectPermissions]);

  // Get user's current permissions from roles (to check for conflicts)
  const userRolePermissionIds = React.useMemo(() => {
    // If user has wildcard permissions, they have all permissions
    if (hasWildcardPermissions.rolePermissions) {
      console.log(
        "User has wildcard role permissions - treating as having all permissions"
      );
      return allPermissionsData?.map((p) => p.id) || [];
    }

    const ids = userPermissions
      .map((p) => {
        // Try multiple ways to get the permission ID
        return (
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
        );
      })
      .filter(Boolean);
    console.log("User role permission IDs:", ids);
    console.log("User permissions data:", userPermissions);
    return ids;
  }, [
    userPermissions,
    hasWildcardPermissions.rolePermissions,
    allPermissionsData,
  ]);

  // Get user's current direct permissions (to mark as already assigned)
  const userDirectPermissionIds = React.useMemo(() => {
    // If user has wildcard direct permissions, they have all permissions
    if (hasWildcardPermissions.directPermissions) {
      console.log(
        "User has wildcard direct permissions - treating as having all permissions"
      );
      return allPermissionsData?.map((p) => p.id) || [];
    }

    const ids = userDirectPermissions
      .map((p) => {
        // Try multiple ways to get the permission ID
        return (
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
        );
      })
      .filter(Boolean);
    console.log("User direct permission IDs:", ids);
    console.log("User direct permissions data:", userDirectPermissions);
    return ids;
  }, [
    userDirectPermissions,
    hasWildcardPermissions.directPermissions,
    allPermissionsData,
  ]);

  // Filter available permissions (exclude those already assigned through roles)
  // Only show permissions that the current user can actually assign
  // Split into assigned direct permissions and available to assign
  const { assignedPermissions, availablePermissions } = React.useMemo(() => {
    if (!allPermissionsData || !currentUserPermissionIds)
      return { assignedPermissions: [], availablePermissions: [] };

    console.log("All permissions data:", allPermissionsData);
    console.log(
      "Current user can assign permission IDs:",
      currentUserPermissionIds
    );
    console.log(
      "Matching against direct permission IDs:",
      userDirectPermissionIds
    );

    // First filter to only permissions the current user can assign
    const assignablePermissions = allPermissionsData.filter((permission) =>
      currentUserPermissionIds.includes(permission.id)
    );

    console.log("Assignable permissions count:", assignablePermissions.length);

    const allMapped = assignablePermissions
      .map((permission) => {
        const permId = permission.id;
        const isAdded = userDirectPermissionIds.includes(permId);
        const isFromRole = userRolePermissionIds.includes(permId);

        return {
          id: permId,
          permission: permission.display_name || permission.name,
          description: permission.description || "No description available",
          resource: permission.resource || permission.resource_name,
          action: permission.action || permission.action_name,
          isAdded: isAdded,
          isFromRole: isFromRole,
        };
      })
      .filter((permission) => !permission.isFromRole); // Exclude permissions already from roles

    const assigned = allMapped.filter((p) => {
      const isMatch = p.isAdded;
      if (isMatch) {
        console.log("Found assigned direct permission:", p);
      }
      return isMatch;
    });
    const available = allMapped.filter((p) => !p.isAdded);

    console.log("Assigned direct permissions count:", assigned.length);
    console.log("Available permissions count:", available.length);

    return { assignedPermissions: assigned, availablePermissions: available };
  }, [
    allPermissionsData,
    currentUserPermissionIds,
    userRolePermissionIds,
    userDirectPermissionIds,
  ]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!transformedUser) return;

    try {
      await updateUserMutation.mutateAsync({
        id: transformedUser.id,
        userData: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          title: formData.title,
          phone_number: formData.phoneNumber,
          avatar_url: formData.avatarUrl,
          bio: formData.bio,
        },
      });
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDeactivate = async () => {
    if (!transformedUser) return;

    try {
      await deactivateUserMutation.mutateAsync(transformedUser.id);
    } catch (error) {
      console.error("Failed to deactivate user:", error);
    }
  };

  const handleActivate = async () => {
    if (!transformedUser) return;

    try {
      await activateUserMutation.mutateAsync(transformedUser.id);
    } catch (error) {
      console.error("Failed to activate user:", error);
    }
  };

  const handleVerify = async () => {
    if (!transformedUser) return;

    try {
      await verifyUserMutation.mutateAsync(transformedUser.id);
    } catch (error) {
      console.error("Failed to verify user:", error);
    }
  };

  const handleDelete = async () => {
    if (!transformedUser) return;

    try {
      await deleteUserMutation.mutateAsync(transformedUser.id);
      router.push("/admin/employee-management");
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleAddCustomPermission = async (permissionId) => {
    if (!userId) return;

    const permission = availablePermissions.find((p) => p.id === permissionId);
    if (permission) {
      // Check if permission is already assigned through a role
      if (permission.isFromRole) {
        toast.error("Permission already assigned through role", {
          description:
            "This permission is already available to the user through their assigned roles and cannot be assigned directly.",
        });
        return;
      }

      // Check if permission is already assigned directly
      if (permission.isAdded) {
        toast.error("Permission already assigned", {
          description:
            "This permission is already assigned directly to the user.",
        });
        return;
      }

      try {
        await assignDirectPermissionMutation.mutateAsync({
          id: userId,
          permissionId: permissionId,
        });

        // The mutation will automatically refresh the data, so we don't need to manually update state
      } catch (error) {
        console.error("Failed to assign permission:", error);
      }
    }
  };

  const handleRemoveCustomPermission = async (permissionId) => {
    if (!userId) return;

    const permission = availablePermissions.find((p) => p.id === permissionId);
    if (permission) {
      try {
        await removeDirectPermissionMutation.mutateAsync({
          id: userId,
          permissionId: permissionId,
        });

        // The mutation will automatically refresh the data, so we don't need to manually update state
      } catch (error) {
        console.error("Failed to remove permission:", error);
      }
    }
  };

  const handleAssignRole = async () => {
    if (!userId || !selectedRoleId) return;

    try {
      await assignRoleMutation.mutateAsync({
        id: userId,
        roleId: parseInt(selectedRoleId),
        assignedBy: userId, // Using current user as assigned_by
        notes: `Role assigned via admin panel`,
      });
      // Reset the selected role ID after successful assignment
      setSelectedRoleId("");
    } catch (error) {
      console.error("Failed to assign role:", error);
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!userId) return;

    try {
      await removeRoleMutation.mutateAsync({
        id: userId,
        roleId: roleId,
      });
    } catch (error) {
      console.error("Failed to remove role:", error);
    }
  };

  const handleAssignDepartment = async () => {
    if (!userId || !selectedDepartmentId || !selectedRoleForDepartment) return;

    try {
      await createAssignmentMutation.mutateAsync({
        user_id: parseInt(userId),
        department_id: parseInt(selectedDepartmentId),
        role_id: parseInt(selectedRoleForDepartment),
      });
      setIsAssignDepartmentModalOpen(false);
      setSelectedDepartmentId("");
      setSelectedRoleForDepartment("");
      refetchAssignments();
      // Invalidate user query to refresh permissions
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    } catch (error) {
      console.error("Failed to assign department:", error);
    }
  };

  const handleAddRoleToDepartment = async () => {
    if (!userId || !selectedDepartmentForRole || !selectedRoleForDepartment)
      return;

    try {
      await createAssignmentMutation.mutateAsync({
        user_id: parseInt(userId),
        department_id: selectedDepartmentForRole.department.id,
        role_id: parseInt(selectedRoleForDepartment),
      });
      setIsAddRoleToDepartmentModalOpen(false);
      setSelectedDepartmentForRole(null);
      setSelectedRoleForDepartment("");
      refetchAssignments();
      // Invalidate user query to refresh permissions
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    } catch (error) {
      console.error("Failed to add role to department:", error);
    }
  };

  const handleRemoveAssignment = async (departmentId, assignmentId) => {
    if (!userId) return;

    try {
      await deleteAssignmentMutation.mutateAsync({
        employeeId: userId,
        departmentId: departmentId,
      });
      refetchAssignments();
      // Invalidate user query to refresh permissions
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    } catch (error) {
      console.error("Failed to remove assignment:", error);
    }
  };

  // Get available departments (not already assigned)
  const availableDepartments = React.useMemo(() => {
    const assignedDeptIds = assignmentsByDepartment.map(
      (dept) => dept.department.id
    );
    return departments.filter((dept) => !assignedDeptIds.includes(dept.id));
  }, [departments, assignmentsByDepartment]);

  // Get available roles for a department (not already assigned in that department)
  const getAvailableRolesForDepartment = (departmentId) => {
    const departmentAssignments = assignmentsByDepartment.find(
      (dept) => dept.department.id === departmentId
    );

    // Collect all assigned role IDs from job roles and their shift roles
    const assignedRoleIds = new Set();

    if (departmentAssignments) {
      // Add job role IDs
      departmentAssignments.jobRoles?.forEach((jobRoleGroup) => {
        if (jobRoleGroup.role?.id) {
          assignedRoleIds.add(jobRoleGroup.role.id);
        }
        // Add shift role IDs
        jobRoleGroup.shiftRoles?.forEach((shiftRoleAssignment) => {
          if (shiftRoleAssignment.role?.id) {
            assignedRoleIds.add(shiftRoleAssignment.role.id);
          }
        });
      });

      // Add other role IDs (fallback)
      departmentAssignments.otherRoles?.forEach((role) => {
        if (role.id) {
          assignedRoleIds.add(role.id);
        }
      });
    }

    return availableRoles.filter((role) => !assignedRoleIds.has(role.id));
  };

  // Filter permissions based on search term (for both assigned and available)
  const filterPermission = (permission) => {
    const searchLower = searchPermissionTerm.toLowerCase();
    return (
      permission.permission.toLowerCase().includes(searchLower) ||
      permission.description.toLowerCase().includes(searchLower) ||
      permission.resource.toLowerCase().includes(searchLower) ||
      permission.action?.toLowerCase().includes(searchLower)
    );
  };

  const filteredAssignedPermissions =
    assignedPermissions.filter(filterPermission);
  const filteredAvailablePermissions =
    availablePermissions.filter(filterPermission);

  // Loading state
  if (userLoading || currentUserLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
            <p className="text-muted-foreground mt-1">
              Loading person data...
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (userError || !transformedUser) {
    const is404Error = userError?.response?.status === 404;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
            <p className="text-muted-foreground mt-1">
              {is404Error ? "Person not found" : "Error loading person"}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {is404Error ? "Person not found" : "Error loading person"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {is404Error
                  ? "The person you're looking for doesn't exist in the system."
                  : "There was an error loading the person data. Please try again."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => router.push("/admin/employee-management")}
                  variant="outline"
                >
                  Back to People Management
                </Button>
                {!is404Error && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="default"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
            <p className="text-muted-foreground mt-1">
              {transformedUser.email}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="flex items-center gap-2"
          disabled={updateUserMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full lg:grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2 whitespace-nowrap">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Basic Information</span>
              <span className="sm:hidden">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles & Permissions</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-2 whitespace-nowrap">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Hierarchy</span>
              <span className="sm:hidden">Hierarchy</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2 whitespace-nowrap">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Account Status</span>
              <span className="sm:hidden">Status</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 whitespace-nowrap">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Activity History</span>
              <span className="sm:hidden">Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Person Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <select
                      value={formData.title || ""}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        handleInputChange("avatarUrl", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Permission States Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {/* From Roles Card */}
            <Card className="bg-blue-500/10 border-blue-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      From Roles
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {userPermissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Permissions Card */}
            <Card className="bg-green-500/10 border-green-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Custom</p>
                    <p className="text-2xl font-bold text-foreground">
                      {userDirectPermissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Permissions Card */}
            <Card className="bg-purple-500/10 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Check className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total</p>
                    <p className="text-2xl font-bold text-foreground">
                      {userPermissions.length + userDirectPermissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Departments & Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Departments & Roles</CardTitle>
                {canAssignEmployee && (
                  <Button
                    onClick={() => setIsAssignDepartmentModalOpen(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Department
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {assignmentsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading assignments...
                  </div>
                ) : assignmentsByDepartment.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No departments assigned to this person.
                  </div>
                ) : (
                  assignmentsByDepartment.map((deptGroup) => (
                    <div
                      key={deptGroup.department.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      {/* Department Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {deptGroup.department.id === "superuser" ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                              <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {deptGroup.department.name}
                              </h3>
                              {deptGroup.department.id === "superuser" && (
                                <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              )}
                            </div>
                            {deptGroup.department.code && (
                              <p className="text-sm text-muted-foreground">
                                Code: {deptGroup.department.code}
                              </p>
                            )}
                            {deptGroup.department.id === "superuser" && (
                              <p className="text-sm text-muted-foreground">
                                {deptGroup.department.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {deptGroup.department.id !== "superuser" && (
                          (<> {canAssignRole && (
                            <Button
                              onClick={() => {
                                setSelectedDepartmentForRole(deptGroup);
                                setIsAddRoleToDepartmentModalOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Role
                            </Button>
                          )} </>)
                        )}
                      </div>

                      {/* Roles in this Department - Hierarchical Display */}
                      <div className="ml-16 space-y-4">
                        {deptGroup.jobRoles.length === 0 && (!deptGroup.otherRoles || deptGroup.otherRoles.length === 0) ? (
                          <div className="text-sm text-muted-foreground py-2">
                            No roles assigned in this department.
                          </div>
                        ) : (
                          <>
                            {/* Job Roles with nested Shift Roles */}
                            {deptGroup.jobRoles.map((jobRoleGroup) => {
                              const jobRole = jobRoleGroup.role;
                              const shiftRoles = jobRoleGroup.shiftRoles || [];

                              return (
                                <div
                                  key={jobRole.id}
                                  className="space-y-2"
                                >
                                  {/* Job Role (or Superuser) */}
                                  {(jobRoleGroup.assignment_id || deptGroup.department.id === "superuser") && (
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                      <div className="flex items-center gap-3">
                                        {deptGroup.department.id === "superuser" ? (
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                                            <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                          </div>
                                        ) : (
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                            <Shield className="h-4 w-4 text-primary" />
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-medium">
                                              {jobRole.display_name || jobRole.name}
                                            </h4>
                                            {deptGroup.department.id === "superuser" ? (
                                              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                Superuser
                                              </Badge>
                                            ) : (
                                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                                Job Role
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            {jobRole.description || "No description"}
                                          </p>
                                          <div className="flex items-center gap-1 mt-1">
                                            <Key className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                              {jobRole.permissions_count || jobRole.permissions?.length || "All"} permissions
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {deptGroup.department.id !== "superuser" && jobRoleGroup.assignment_id && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-600 hover:text-red-700"
                                              disabled={
                                                deleteAssignmentMutation.isPending
                                              }
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Remove Job Role
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to remove the "
                                                {jobRole.display_name || jobRole.name}" job role
                                                from {deptGroup.department.name}?
                                                {shiftRoles.length > 0 && (
                                                  <>
                                                    <br />
                                                    <br />
                                                    <strong>Warning:</strong> This will also automatically remove {shiftRoles.length} shift role(s) under this job role.
                                                  </>
                                                )}
                                                <br />
                                                <br />
                                                <strong>Person:</strong>{" "}
                                                {transformedUser.name} (
                                                {transformedUser.email})
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleRemoveAssignment(
                                                    deptGroup.department.id,
                                                    jobRoleGroup.assignment_id
                                                  )
                                                }
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                Remove Job Role
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    </div>
                                  )}

                                  {/* Shift Roles (nested under job role) - Auto-assigned, read-only */}
                                  {shiftRoles.length > 0 && (
                                    <div className="ml-8 space-y-2">
                                      {shiftRoles.map((shiftRoleAssignment) => {
                                        const shiftRole = shiftRoleAssignment.role;

                                        return (
                                          <div
                                            key={shiftRole.id}
                                            className="flex items-center p-2 pl-4 border-l-2 border-muted rounded-r-lg bg-muted/20"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                                <span className="text-xs text-blue-600 dark:text-blue-400">└</span>
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <h5 className="text-sm font-medium">
                                                    {shiftRole.display_name || shiftRole.name}
                                                  </h5>
                                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    Auto-assigned
                                                  </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                  {shiftRole.description || "No description"}
                                                </p>
                                                <p className="text-xs text-muted-foreground italic mt-1">
                                                  Automatically removed when job role is removed
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Other roles (fallback for roles without hierarchy) */}
                            {deptGroup.otherRoles && deptGroup.otherRoles.length > 0 && (
                              <div className="space-y-2">
                                {deptGroup.otherRoles.map((role) => (
                                  <div
                                    key={role.assignment_id || role.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <Shield className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium">
                                          {role.display_name || role.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                          {role.description || "No description"}
                                        </p>
                                      </div>
                                    </div>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700"
                                          disabled={
                                            deleteAssignmentMutation.isPending
                                          }
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Remove Role
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to remove the "
                                            {role.display_name || role.name}" role
                                            from {deptGroup.department.name}?
                                            <br />
                                            <strong>Person:</strong>{" "}
                                            {transformedUser.name} (
                                            {transformedUser.email})
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleRemoveAssignment(
                                                deptGroup.department.id,
                                                role.assignment_id
                                              )
                                            }
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Remove Role
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Permissions</CardTitle>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Permissions from Roles ({userPermissions.length} unique
                      permissions)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Last updated: 10:29:37
                  </span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Permissions
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PERMISSION</TableHead>
                        <TableHead>RESOURCE:ACTION</TableHead>
                        <TableHead>GRANTED BY</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Show message when no permissions exist at all */}
                      {userPermissions.length === 0 &&
                        userDirectPermissions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No permissions assigned to this person.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {/* Role-based permissions */}
                          {userPermissions.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center py-4 text-muted-foreground bg-blue-500/10"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <Shield className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">
                                    No permissions from roles
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            userPermissions.map((permission, index) => (
                              <TableRow key={`role-${index}`}>
                                <TableCell className="font-medium">
                                  {permission.name ||
                                    permission.permission_name}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800"
                                  >
                                    {permission.resource ||
                                      permission.resource_name}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {permission.granted_by || "Role"}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}

                          {/* Custom permissions */}
                          {userDirectPermissions.length > 0 &&
                            userDirectPermissions.map((permission, index) => (
                              <TableRow
                                key={`custom-${permission.id || index}`}
                                className="bg-green-500/5"
                              >
                                <TableCell className="font-medium">
                                  {permission.name ||
                                    permission.permission_name}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-500/10 text-green-600"
                                  >
                                    {permission.resource ||
                                      permission.resource_name}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Leaf className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-700">
                                      Custom Assignment
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        From {userRoles.length} role(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">
                        Custom Permissions (Direct Assignment) (
                        {userDirectPermissions.length} permissions)
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => setIsCustomPermissionModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Permission
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Department Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hierarchyLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading hierarchy image...</p>
                </div>
              ) : hierarchyError ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Hierarchy</h3>
                  <p className="text-muted-foreground mb-4">
                    {hierarchyError?.response?.data?.message || "Failed to load hierarchy image. Please try again."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : hierarchyImageUrl ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      This visualization shows the organisational hierarchy structure for all departments.
                    </p>
                    <div className="w-full overflow-auto border rounded-lg bg-white">
                      <img
                        src={hierarchyImageUrl}
                        alt="Department Hierarchy"
                        className="w-full h-auto"
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>Hierarchy image is automatically generated from department structure</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(hierarchyImageUrl, "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Network className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Hierarchy Available</h3>
                  <p className="text-muted-foreground">
                    No hierarchy image is available at this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Status */}
                <div className="relative p-6 border rounded-lg">
                  <div className="absolute top-4 right-4">
                    {transformedUser.isActive ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {transformedUser.isActive ? "Active" : "Inactive"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transformedUser.isActive
                      ? "Person can log in and access the system"
                      : "Person cannot log in to the system"}
                  </p>
                  {transformedUser.isActive ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deactivateUserMutation.isPending}
                        >
                          {deactivateUserMutation.isPending
                            ? "Deactivating..."
                            : "Deactivate"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to deactivate this user? They
                            will not be able to log in to the system.
                            <br />
                            <strong>User:</strong> {transformedUser.name} (
                            {transformedUser.email})
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeactivate}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Deactivate User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={activateUserMutation.isPending}
                        >
                          {activateUserMutation.isPending
                            ? "Activating..."
                            : "Activate"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Activate User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to activate this user? They
                            will be able to log in to the system.
                            <br />
                            <strong>User:</strong> {transformedUser.name} (
                            {transformedUser.email})
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleActivate}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Activate User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Verified Status */}
                <div className="relative p-6 border rounded-lg">
                  <div className="absolute top-4 right-4">
                    {transformedUser.isVerified ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {transformedUser.isVerified ? "Verified" : "Unverified"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transformedUser.isVerified
                      ? "User's email has been verified"
                      : "User's email has not been verified"}
                  </p>
                  {transformedUser.isVerified ? (
                    <Button variant="outline" size="sm" disabled>
                      Verified
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerify}
                      disabled={verifyUserMutation.isPending}
                    >
                      {verifyUserMutation.isPending ? "Verifying..." : "Verify"}
                    </Button>
                  )}
                </div>

                {/* Superuser Status */}
                <div className="relative p-6 border rounded-lg">
                  <div className="absolute top-4 right-4">
                    {transformedUser.isSuperuser ? (
                      <Crown className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {transformedUser.isSuperuser ? "Superuser" : "Regular User"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transformedUser.isSuperuser
                      ? "Has full system access"
                      : "Has standard user access"}
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    {transformedUser.isSuperuser
                      ? "Admin User"
                      : "Regular User"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      User ID
                    </Label>
                    <p className="text-lg font-mono">{transformedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </Label>
                    <p className="text-lg">{transformedUser.updatedAt}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </Label>
                    <p className="text-lg">{transformedUser.createdAt}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Last Login
                    </Label>
                    <p className="text-lg">{transformedUser.lastLogin}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-500/5 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Permanent actions that cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2"
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteUserMutation.isPending
                        ? "Deleting..."
                        : "Delete Person Account"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete Person Account
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this person account?
                        This action cannot be undone and will permanently remove
                        the person from the system.
                        <br />
                        <strong>Person:</strong> {transformedUser.name} (
                        {transformedUser.email})
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Person Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity History Tab */}
        <TabsContent value="activity" className="space-y-6">
          <UserAuditLogs userId={userId} title="User Activity History" />
        </TabsContent>
      </Tabs>

      {/* Custom Permission Modal */}
      <Dialog
        open={isCustomPermissionModalOpen}
        onOpenChange={setIsCustomPermissionModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Assign Custom Permission
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchPermissionTerm}
              onChange={(e) => setSearchPermissionTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Permissions List */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {permissionsLoading || currentUserLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                Loading permissions...
              </div>
            ) : (
              <>
                {/* Assigned Direct Permissions Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-semibold text-green-700">
                      Currently Assigned Direct Permissions (
                      {filteredAssignedPermissions.length})
                    </h3>
                  </div>
                  {hasWildcardPermissions.directPermissions ? (
                    <div className="border rounded-lg bg-yellow-50/50 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Wildcard Permissions
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        This person has wildcard direct permissions (*) - they
                        have access to all permissions directly.
                      </p>
                    </div>
                  ) : filteredAssignedPermissions.length > 0 ? (
                    <div className="border rounded-lg bg-green-50/50">
                      {filteredAssignedPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-green-50/80"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {permission.permission}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                {permission.resource}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700"
                              >
                                {permission.action}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {permission.resource}:{permission.action}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() =>
                                handleRemoveCustomPermission(permission.id)
                              }
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg bg-green-50/30 p-4 text-center text-sm text-muted-foreground">
                      No direct permissions assigned. All permissions are from
                      roles.
                    </div>
                  )}
                </div>

                {/* Available Permissions Section */}
                {!hasWildcardPermissions.rolePermissions &&
                  !hasWildcardPermissions.directPermissions &&
                  (filteredAvailablePermissions.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <Plus className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-700">
                          Available to Assign (
                          {filteredAvailablePermissions.length})
                        </h3>
                      </div>
                      <div className="border rounded-lg">
                        {filteredAvailablePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium">
                                {permission.permission}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  {permission.resource}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-100 text-gray-700"
                                >
                                  {permission.action}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {permission.resource}:{permission.action}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddCustomPermission(permission.id)
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <Plus className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-700">
                          Available to Assign (0)
                        </h3>
                      </div>
                      <div className="border rounded-lg bg-blue-50/30 p-4 text-center text-sm text-muted-foreground">
                        No additional permissions available to assign. All
                        permissions are already available through roles.
                      </div>
                    </div>
                  ))}

                {/* Wildcard Role Permissions Message */}
                {hasWildcardPermissions.rolePermissions && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <h3 className="text-sm font-semibold text-yellow-700">
                        Role Permissions
                      </h3>
                    </div>
                    <div className="border rounded-lg bg-yellow-50/50 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Wildcard Role Permissions
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        This person has wildcard role permissions (*) - they
                        have access to all permissions through their roles.
                      </p>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredAssignedPermissions.length === 0 &&
                  filteredAvailablePermissions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground border rounded-lg">
                      {currentUserPermissionIds.length === 0 ? (
                        <div className="space-y-2">
                          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="font-medium">No Permission to Assign</p>
                          <p className="text-sm">
                            You don't have permission to assign any permissions
                            to people.
                          </p>
                        </div>
                      ) : (
                        "No permissions found matching your search."
                      )}
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">
                  About Direct Permissions
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  Direct permissions are assigned directly to the person,
                  independent of their roles. They provide granular access
                  control for specific use cases.
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Permissions already assigned through
                  roles are not shown here to prevent conflicts. Only
                  permissions not available through the person's current roles
                  can be assigned directly.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCustomPermissionModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Department Modal */}
      <Dialog
        open={isAssignDepartmentModalOpen}
        onOpenChange={setIsAssignDepartmentModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Department & Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
                disabled={
                  departmentsLoading || createAssignmentMutation.isPending
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name} {dept.code && `(${dept.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRoleForDepartment}
                onValueChange={setSelectedRoleForDepartment}
                disabled={
                  !selectedDepartmentId ||
                  rolesLoading ||
                  createAssignmentMutation.isPending
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.display_name || role.name} -{" "}
                      {role.description || "No description"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDepartmentModalOpen(false);
                setSelectedDepartmentId("");
                setSelectedRoleForDepartment("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignDepartment}
              disabled={
                !selectedDepartmentId ||
                !selectedRoleForDepartment ||
                createAssignmentMutation.isPending
              }
            >
              {createAssignmentMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role to Department Modal */}
      <Dialog
        open={isAddRoleToDepartmentModalOpen}
        onOpenChange={setIsAddRoleToDepartmentModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Role to {selectedDepartmentForRole?.department.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRoleForDepartment}
                onValueChange={setSelectedRoleForDepartment}
                disabled={
                  !selectedDepartmentForRole ||
                  rolesLoading ||
                  createAssignmentMutation.isPending
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedDepartmentForRole &&
                    getAvailableRolesForDepartment(
                      selectedDepartmentForRole.department.id
                    ).map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.display_name || role.name} -{" "}
                        {role.description || "No description"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRoleToDepartmentModalOpen(false);
                setSelectedDepartmentForRole(null);
                setSelectedRoleForDepartment("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRoleToDepartment}
              disabled={
                !selectedDepartmentForRole ||
                !selectedRoleForDepartment ||
                createAssignmentMutation.isPending
              }
            >
              {createAssignmentMutation.isPending ? "Adding..." : "Add Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserEditPage;

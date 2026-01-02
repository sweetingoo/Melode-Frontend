"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  UserX,
  Trash2,
  UserPlus,
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Loader2,
  Mail,
  Plus,
} from "lucide-react";
import {
  useUsers,
  useDeleteUser,
  useDeactivateUser,
  useActivateUser,
  useCreateUser,
  useRoles,
  useSendInvitationToUser,
  userUtils,
} from "@/hooks/useUsers";
import { useCreateRole } from "@/hooks/useRoles";
import { useHijackUser, useCurrentUser } from "@/hooks/useAuth";
import { useInvitations, invitationUtils } from "@/hooks/useInvitations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    title: "",
    phone_number: "",
    password: "",
    bio: "",
    send_invite: true,
    role_id: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    displayName: "",
    roleName: "",
    description: "",
    priority: 50,
  });
  const itemsPerPage = 10;

  // API hooks
  const { data: usersResponse, isLoading, error, refetch } = useUsers();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const roles = rolesData || [];
  const { data: invitations = [], isLoading: invitationsLoading } = useInvitations();
  const deleteUserMutation = useDeleteUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const createUserMutation = useCreateUser();
  const hijackUserMutation = useHijackUser();
  const sendInvitationMutation = useSendInvitationToUser();
  const createRoleMutation = useCreateRole();

  // Get current user for permission checks
  const { data: currentUserData } = useCurrentUser();
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions = currentUserData?.direct_permissions || [];

  // Extract permission names
  const userPermissionNames = React.useMemo(() => {
    const allPermissions = [...currentUserPermissions, ...currentUserDirectPermissions];
    return allPermissions.map((p) => {
      if (typeof p === "string") return p;
      if (typeof p === "object") {
        return p.permission || p.name || p.permission_id || p.id || "";
      }
      return String(p);
    }).filter(Boolean);
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Check if user has wildcard permissions
  const hasWildcardPermissions = userPermissionNames.includes("*");

  // Permission check helper
  const hasPermission = React.useCallback((permission) => {
    if (hasWildcardPermissions) return true;
    return userPermissionNames.some((perm) => {
      if (perm === permission) return true;
      // Resource match (e.g., user:create matches users:create)
      const permResource = perm.split(":")[0];
      const checkResource = permission.split(":")[0];
      if (permResource === checkResource || permResource === checkResource + "s" || permResource + "s" === checkResource) {
        return true;
      }
      return perm.includes(checkResource);
    });
  }, [userPermissionNames, hasWildcardPermissions]);

  // User management permissions
  const canCreateUser = hasPermission("user:create");
  const canUpdateUser = hasPermission("user:update");
  const canDeleteUser = hasPermission("user:delete");
  const canAssignRole = hasPermission("role:assign");
  const canAssignEmployee = hasPermission("employee:assign");

  // Extract users and pagination data from response
  const users = usersResponse?.users || [];
  const pagination = {
    page: usersResponse?.page || 1,
    per_page: usersResponse?.per_page || 20,
    total: usersResponse?.total || 0,
    total_pages: usersResponse?.total_pages || 1,
  };

  // Transform API data to display format
  const transformedUsers = users.map(userUtils.transformUser);

  // Create a map of invitations by email for quick lookup
  const invitationsByEmail = React.useMemo(() => {
    const map = new Map();
    // Ensure invitations is an array before iterating
    const invitationsArray = Array.isArray(invitations) ? invitations : [];
    invitationsArray.forEach((invitation) => {
      const transformed = invitationUtils.transformInvitation(invitation);
      // Override role with dynamic role display name if available
      if (roles.length > 0) {
        const role = roles.find(r => r.id === invitation.role_id);
        if (role) {
          transformed.role = role.display_name;
        }
      }
      map.set(invitation.email.toLowerCase(), transformed);
    });
    return map;
  }, [invitations, roles]);

  // Helper function to get invitation for a user
  const getUserInvitation = (userEmail) => {
    return invitationsByEmail.get(userEmail?.toLowerCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-500/10";
      case "Inactive":
        return "text-red-600 bg-red-500/10";
      case "Unverified":
        return "text-yellow-600 bg-yellow-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Superuser":
        return "text-purple-600 bg-purple-500/10";
      case "Admin":
        return "text-blue-600 bg-blue-500/10";
      case "Staff":
        return "text-green-600 bg-green-500/10";
      case "Manager":
        return "text-orange-600 bg-orange-500/10";
      case "Editor":
        return "text-green-600 bg-green-500/10";
      case "Viewer":
        return "text-muted-foreground bg-muted";
      case "Doctor Contractor":
        return "text-blue-600 bg-blue-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  // Filter users based on search term (client-side filtering for demo)
  // In production, you'd want to implement server-side search
  const filteredUsers = transformedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userUtils.getStatus(user).toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log(filteredUsers);

  // Use API pagination data
  const totalPages = pagination.total_pages;
  const currentUsers = filteredUsers; // API already returns paginated data

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // In production, you would call the API with the new page parameter
    // For now, we'll just update the local state
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      await deactivateUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to deactivate user:", error);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await activateUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to activate user:", error);
    }
  };

  const handleHijackUser = async (userId) => {
    try {
      await hijackUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to hijack user:", error);
    }
  };

  const handleSendInvitation = async (user) => {
    try {
      // Use the new user-specific endpoint
      sendInvitationMutation.mutate(
        {
          userId: user.id,
          options: {
            expires_in_days: 7, // Default to 7 days
          },
        },
        {
          onSuccess: () => {
            // Refetch users to update the list
            refetch();
          },
        }
      );
    } catch (error) {
      console.error("Unexpected error in handleSendInvitation:", error);
    }
  };

  const validateUserForm = () => {
    const errors = {};

    if (!userFormData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!userFormData.first_name) {
      errors.first_name = "First name is required";
    }

    if (!userFormData.last_name) {
      errors.last_name = "Last name is required";
    }

    if (!userFormData.password) {
      errors.password = "Password is required";
    } else if (userFormData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (
      userFormData.phone_number &&
      !/^\+?[\d\s-()]+$/.test(userFormData.phone_number)
    ) {
      errors.phone_number = "Please enter a valid phone number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateRole = async () => {
    if (!roleFormData.displayName || !roleFormData.roleName) {
      return;
    }

    try {
      const result = await createRoleMutation.mutateAsync({
        display_name: roleFormData.displayName,
        name: roleFormData.roleName,
        description: roleFormData.description,
        priority: roleFormData.priority,
      });
      setIsCreateRoleModalOpen(false);
      // Reset form
      setRoleFormData({
        displayName: "",
        roleName: "",
        description: "",
        priority: 50,
      });
      // Auto-select the newly created role
      if (result && result.id) {
        setUserFormData({ ...userFormData, role_id: result.id.toString() });
      }
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  const handleCreateUser = () => {
    if (!validateUserForm()) {
      return;
    }

    const userData = {
      email: userFormData.email,
      username: userFormData.username || undefined,
      first_name: userFormData.first_name,
      last_name: userFormData.last_name,
      title: userFormData.title || undefined,
      phone_number: userFormData.phone_number || undefined,
      password: userFormData.password,
      bio: userFormData.bio || undefined,
      send_invite: userFormData.send_invite,
      role_id: userFormData.role_id ? parseInt(userFormData.role_id) : 0,
    };

    createUserMutation.mutate(userData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setUserFormData({
          email: "",
          username: "",
          first_name: "",
          last_name: "",
          title: "",
          phone_number: "",
          password: "",
          bio: "",
          send_invite: true,
          role_id: "",
        });
        setValidationErrors({});
        // Refetch users to show all users in the table
        refetch();
      },
      onError: (error) => {
        // Handle API validation errors
        if (error.response?.status === 422 || error.response?.status === 400) {
          const errorData = error.response.data;
          const newValidationErrors = {};

          // Handle the API error format with detail array
          if (errorData?.detail && Array.isArray(errorData.detail)) {
            errorData.detail.forEach((errorItem) => {
              if (errorItem.loc && errorItem.loc.length > 1) {
                // Extract field name from location array (skip 'body' and get the field name)
                const fieldName = errorItem.loc[1];
                newValidationErrors[fieldName] = errorItem.msg;
              }
            });
          }
          // Fallback to old format for backward compatibility
          else if (errorData?.errors) {
            Object.assign(newValidationErrors, errorData.errors);
          }
          // Handle single error message
          else if (errorData?.message) {
            // Try to extract field name from message (e.g., "Email already exists")
            const message = errorData.message.toLowerCase();
            if (message.includes("email")) {
              newValidationErrors.email = errorData.message;
            } else if (message.includes("username")) {
              newValidationErrors.username = errorData.message;
            } else {
              // If we can't determine the field, show as general error
              newValidationErrors._general = errorData.message;
            }
          }

          if (Object.keys(newValidationErrors).length > 0) {
            setValidationErrors(newValidationErrors);
          }
        }
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              People Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage people, roles, and permissions for your organisation
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              People Management
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load users
              </h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the user data. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    const currentApiPage = pagination.page;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentApiPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentApiPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if needed
      if (currentApiPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show current page and surrounding pages
      const start = Math.max(2, currentApiPage - 1);
      const end = Math.min(totalPages - 1, currentApiPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentApiPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if needed
      if (currentApiPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentApiPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">People Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage people, roles, and permissions for your organisation
            </p>
          </div>
          {canCreateUser && (
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="shrink-0">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Person
            </Button>
          )}
        </div>
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Total People</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Active People</p>
                <p className="text-2xl font-bold">
                  {transformedUsers.filter((user) => user.isActive).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Inactive People</p>
                <p className="text-2xl font-bold">
                  {transformedUsers.filter((user) => !user.isActive).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Superusers</p>
                <p className="text-2xl font-bold">
                  {transformedUsers.filter((user) => user.isSuperuser).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All People
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invitation</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          {user.title && (
                            <span className="text-sm text-muted-foreground">
                              {user.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getRoleColor(
                          userUtils.getRole(user)
                        )}`}
                      >
                        {userUtils.getRole(user)}
                        {user.isSuperuser && <span className="ml-1">*</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          userUtils.getStatus(user)
                        )}`}
                      >
                        {userUtils.getStatus(user)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const invitation = getUserInvitation(user.email);
                        if (!invitation) {
                          return (
                            <span className="text-xs text-muted-foreground">
                              No invitation
                            </span>
                          );
                        }
                        return (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${invitationUtils.getStatusColor(
                              invitation.status
                            )}`}
                            title={`Sent: ${invitation.sentDate}, Expires: ${invitation.expiresDate}`}
                          >
                            {invitation.status}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {user.lastLogin}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Edit User */}
                          {canUpdateUser && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/people-management/${user.id}`}
                                className="flex items-center"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Person
                              </Link>
                            </DropdownMenuItem>
                          )}

                          {/* Activate/Deactivate User */}
                          {canUpdateUser && user.isActive && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-orange-600 focus:text-orange-600"
                                  disabled={deactivateUserMutation.isPending}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate Person
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Deactivate Person
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to deactivate this
                                    person? They will not be able to log in to the
                                    system.
                                    <br />
                                    <strong>Person:</strong> {user.name} (
                                    {user.email})
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeactivateUser(user.id)
                                    }
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    Deactivate Person
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {canUpdateUser && !user.isActive && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-green-600 focus:text-green-600"
                                  disabled={activateUserMutation.isPending}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate Person
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Activate Person
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to activate this person?
                                    They will be able to log in to the system.
                                    <br />
                                    <strong>Person:</strong> {user.name} (
                                    {user.email})
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleActivateUser(user.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Activate Person
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Hijack User - Requires update permission */}
                          {canUpdateUser && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-blue-600 focus:text-blue-600"
                                  disabled={hijackUserMutation.isPending}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Hijack User Session
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Hijack User Session
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to hijack this user's
                                    session? You will be logged in as this user
                                    and can perform actions on their behalf.
                                    <br />
                                    <br />
                                    <strong>Target User:</strong> {user.name} (
                                    {user.email})
                                    <br />
                                    <strong>Warning:</strong> This action will log
                                    you out of your current session and log you in
                                    as the target user.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleHijackUser(user.id)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    Hijack User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          <DropdownMenuSeparator />

                          {/* Invite to Set Password - Available for all users to allow password setup via invitation */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-purple-600 focus:text-purple-600"
                                disabled={sendInvitationMutation.isPending}
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Invite to Set Password
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Invite to Set Password
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Send an invitation email to this user so they can set their password and access their account.
                                  <br />
                                  <br />
                                  <strong>User:</strong> {user.name} ({user.email})
                                  <br />
                                  {!user.isVerified ? (
                                    <>
                                      <strong>Status:</strong> User needs to set password
                                      <br />
                                      <strong>Note:</strong> The user account is active. They will receive an email with a link to set their password.
                                    </>
                                  ) : (
                                    <>
                                      <strong>Status:</strong> User is verified
                                      <br />
                                      <strong>Note:</strong> This will send an invitation email. If the user already has an active invitation, it will be replaced with a new one.
                                    </>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleSendInvitation(user)}
                                  className="bg-purple-600 hover:bg-purple-700"
                                  disabled={sendInvitationMutation.isPending}
                                >
                                  {sendInvitationMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    "Send Invitation"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <DropdownMenuSeparator />

                          {/* Delete User */}
                          {canDeleteUser && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  disabled={deleteUserMutation.isPending}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Person
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Person</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this person?
                                    This action cannot be undone and will
                                    permanently remove the person from the system.
                                    <br />
                                    <strong>Person:</strong> {user.name} (
                                    {user.email})
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Person
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, pagination.page - 1))
                      }
                      className={
                        pagination.page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(
                          Math.min(totalPages, pagination.page + 1)
                        )
                      }
                      className={
                        pagination.page === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New Person
            </DialogTitle>
            <DialogDescription>
              Add a new person to the system. All required fields must be filled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {validationErrors._general && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationErrors._general}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={userFormData.email}
                  onChange={(e) => {
                    setUserFormData({ ...userFormData, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: "" });
                    }
                  }}
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">
                    {validationErrors.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      username: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={userFormData.first_name}
                  onChange={(e) => {
                    setUserFormData({
                      ...userFormData,
                      first_name: e.target.value,
                    });
                    if (validationErrors.first_name) {
                      setValidationErrors({
                        ...validationErrors,
                        first_name: "",
                      });
                    }
                  }}
                  className={
                    validationErrors.first_name ? "border-red-500" : ""
                  }
                />
                {validationErrors.first_name && (
                  <p className="text-sm text-red-500">
                    {validationErrors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={userFormData.last_name}
                  onChange={(e) => {
                    setUserFormData({
                      ...userFormData,
                      last_name: e.target.value,
                    });
                    if (validationErrors.last_name) {
                      setValidationErrors({
                        ...validationErrors,
                        last_name: "",
                      });
                    }
                  }}
                  className={validationErrors.last_name ? "border-red-500" : ""}
                />
                {validationErrors.last_name && (
                  <p className="text-sm text-red-500">
                    {validationErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Select
                  value={userFormData.title}
                  onValueChange={(value) =>
                    setUserFormData({ ...userFormData, title: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Prof">Prof</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+44 20 7946 0958"
                  value={userFormData.phone_number}
                  onChange={(e) => {
                    setUserFormData({
                      ...userFormData,
                      phone_number: e.target.value,
                    });
                    if (validationErrors.phone_number) {
                      setValidationErrors({
                        ...validationErrors,
                        phone_number: "",
                      });
                    }
                  }}
                  className={
                    validationErrors.phone_number ? "border-red-500" : ""
                  }
                />
                {validationErrors.phone_number && (
                  <p className="text-sm text-red-500">
                    {validationErrors.phone_number}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={userFormData.password}
                onChange={(e) => {
                  setUserFormData({
                    ...userFormData,
                    password: e.target.value,
                  });
                  if (validationErrors.password) {
                    setValidationErrors({ ...validationErrors, password: "" });
                  }
                }}
                className={validationErrors.password ? "border-red-500" : ""}
              />
              {validationErrors.password && (
                <p className="text-sm text-red-500">
                  {validationErrors.password}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Brief description about the user"
                value={userFormData.bio}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, bio: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_id">Role</Label>
                <div className="flex gap-2">
                  <Select
                    value={userFormData.role_id || "__none__"}
                    onValueChange={(value) =>
                      setUserFormData({
                        ...userFormData,
                        role_id: value === "__none__" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No Role</SelectItem>
                      {rolesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading roles...
                        </SelectItem>
                      ) : roles.length === 0 ? (
                        <SelectItem value="no-roles" disabled>
                          No roles available
                        </SelectItem>
                      ) : (
                        roles
                          .filter(
                            (role) =>
                              role.role_type !== "shift_role" &&
                              role.roleType !== "shift_role" &&
                              !role.parent_role_id &&
                              !role.parentRoleId
                          )
                          .map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.display_name ||
                                role.name ||
                                role.role_name ||
                                `Role ${role.id}`}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateRoleModalOpen(true)}
                    title="Create new role"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="send_invite"
                  checked={userFormData.send_invite}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      send_invite: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="send_invite" className="cursor-pointer">
                  Send Invitation Email
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setValidationErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Modal */}
      <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role for your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-display-name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-display-name"
                placeholder="e.g., Senior Doctor"
                value={roleFormData.displayName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    displayName: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Role Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-name"
                placeholder="e.g., senior_doctor"
                value={roleFormData.roleName}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    roleName: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with underscores only. Cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe this role's purpose and responsibilities"
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    description: e.target.value,
                  })
                }
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-priority">Priority</Label>
              <Input
                id="role-priority"
                type="number"
                value={roleFormData.priority}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
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
                setIsCreateRoleModalOpen(false);
                setRoleFormData({
                  displayName: "",
                  roleName: "",
                  description: "",
                  priority: 50,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={
                createRoleMutation.isPending ||
                !roleFormData.displayName ||
                !roleFormData.roleName
              }
            >
              {createRoleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;

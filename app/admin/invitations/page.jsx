"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Eye,
  Send,
  X,
  Mail,
  Info,
  UserPlus,
  Calendar,
  Clock,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Upload,
  PlusCircle,
  Loader2,
} from "lucide-react";
import {
  useInvitations,
  useInvitation,
  useCreateInvitation,
  useDeleteInvitation,
  useResendInvitation,
  useRevokeInvitation,
  useResendAllPending,
  useRevokeAllExpired,
  invitationUtils,
} from "@/hooks/useInvitations";
import { useRoles } from "@/hooks/useRoles";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const InvitationPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvitationId, setSelectedInvitationId] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    role_id: "",
    expires_in_days: "",
    suggested_username: "",
    suggested_title: "",
    suggested_first_name: "",
    suggested_last_name: "",
    suggested_phone_number: "",
  });

  const [validationErrors, setValidationErrors] = useState({});

  // API hooks
  const { data: invitations = [], isLoading, error, refetch } = useInvitations();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: selectedInvitation, isLoading: isViewLoading } = useInvitation(selectedInvitationId);
  const createInvitationMutation = useCreateInvitation();
  const deleteInvitationMutation = useDeleteInvitation();
  const resendInvitationMutation = useResendInvitation();
  const revokeInvitationMutation = useRevokeInvitation();
  const resendAllPendingMutation = useResendAllPending();
  const revokeAllExpiredMutation = useRevokeAllExpired();

  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateInvitation = hasPermission("invitation:create");
  const canUpdateInvitation = hasPermission("invitation:update");
  const canDeleteInvitation = hasPermission("invitation:delete");

  // Transform API data to display format
  const transformedInvitations = invitations.map((invitation) => {
    const transformed = invitationUtils.transformInvitation(invitation);
    // Override role with dynamic role display name if available
    if (roles.length > 0) {
      const role = roles.find(r => r.id === invitation.role_id);
      if (role) {
        transformed.role = role.display_name;
      }
    }
    return transformed;
  });

  // Filter invitations based on search term
  const filteredInvitations = transformedInvitations.filter((invitation) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      (invitation.email || "").toLowerCase().includes(searchLower) ||
      (invitation.role || "").toLowerCase().includes(searchLower) ||
      (invitation.status || "").toLowerCase().includes(searchLower) ||
      (invitation.firstName || "").toLowerCase().includes(searchLower) ||
      (invitation.lastName || "").toLowerCase().includes(searchLower) ||
      (invitation.suggestedUsername || "")
        .toLowerCase()
        .includes(searchLower) ||
      (invitation.phoneNumber || "").toLowerCase().includes(searchLower)
    );
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Real-time validation for various fields
    let fieldError = "";

    switch (field) {
      case "email":
        fieldError = validateEmail(value);
        break;
      case "suggested_first_name":
        fieldError = validateFirstName(value);
        break;
      case "suggested_last_name":
        fieldError = validateLastName(value);
        break;
      case "suggested_username":
        fieldError = validateUsername(value);
        break;
      case "suggested_phone_number":
        fieldError = validatePhoneNumber(value);
        break;
      default:
        break;
    }

    if (fieldError) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: fieldError,
      }));
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateRoleId = (roleId) => {
    if (!roleId) return "Role is required";
    return "";
  };

  const validateExpiresInDays = (days) => {
    if (!days) return "Expiration period is required";
    const numDays = parseInt(days);
    if (numDays < 1 || numDays > 30)
      return "Expiration must be between 1-30 days";
    return "";
  };

  const validateFirstName = (firstName) => {
    if (!firstName) return "First name is required";
    if (firstName.length < 2) return "First name must be at least 2 characters";
    return "";
  };

  const validateLastName = (lastName) => {
    if (!lastName) return "Last name is required";
    if (lastName.length < 2) return "Last name must be at least 2 characters";
    return "";
  };

  const validateUsername = (username) => {
    if (username && username.length < 3)
      return "Username must be at least 3 characters";
    if (username && !/^[a-zA-Z0-9._-]+$/.test(username))
      return "Username can only contain letters, numbers, dots, underscores, and hyphens";
    return "";
  };

  const validatePhoneNumber = (phone) => {
    console.log("Validating UK phone number:", phone);

    if (!phone) return ""; // Phone number is optional

    // Remove all non-digit characters except + at the beginning
    const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, "");
    console.log("Cleaned phone:", cleanedPhone);

    // UK phone number validation
    // UK numbers can start with +44 or 0, and have 10-11 digits total
    if (cleanedPhone.startsWith("+44")) {
      const digitsOnly = cleanedPhone.substring(3); // Remove +44
      console.log("UK international digits:", digitsOnly);
      if (!/^\d{10}$/.test(digitsOnly)) {
        console.log("UK international validation failed");
        return "Please enter a valid UK phone number (e.g., +44 20 7946 0958)";
      }
    }
    // UK domestic format starting with 0
    else if (cleanedPhone.startsWith("0")) {
      console.log("UK domestic format:", cleanedPhone);
      if (!/^0\d{10}$/.test(cleanedPhone)) {
        console.log("UK domestic validation failed");
        return "Please enter a valid UK phone number (e.g., 020 7946 0958)";
      }
    }
    // Invalid format
    else {
      console.log("Invalid UK phone format");
      return "Please enter a valid UK phone number starting with +44 or 0 (e.g., +44 20 7946 0958 )";
    }

    console.log("UK phone validation passed");
    return "";
  };

  const validateForm = () => {
    try {
      const errors = {};

      errors.email = validateEmail(formData.email);
      errors.role_id = validateRoleId(formData.role_id);
      errors.expires_in_days = validateExpiresInDays(formData.expires_in_days);
      errors.suggested_first_name = validateFirstName(
        formData.suggested_first_name
      );
      errors.suggested_last_name = validateLastName(
        formData.suggested_last_name
      );
      errors.suggested_username = validateUsername(formData.suggested_username);
      errors.suggested_phone_number = validatePhoneNumber(
        formData.suggested_phone_number
      );

      // Debug logging
      console.log("Validation errors:", errors);
      console.log("Phone number:", formData.suggested_phone_number);
      console.log("Phone validation result:", errors.suggested_phone_number);

      // Remove empty error messages
      Object.keys(errors).forEach((key) => {
        if (!errors[key]) delete errors[key];
      });

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    } catch (error) {
      console.error("Error in validateForm:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate form before submission
      if (!validateForm()) {
        return;
      }

      // Create invitation data for API
      const invitationData = {
        email: formData.email,
        role_id: parseInt(formData.role_id),
        suggested_username: formData.suggested_username || undefined,
        suggested_title: formData.suggested_title || undefined,
        suggested_first_name: formData.suggested_first_name,
        suggested_last_name: formData.suggested_last_name,
        suggested_phone_number: formData.suggested_phone_number || undefined,
        expires_in_days: parseInt(formData.expires_in_days),
      };

      createInvitationMutation.mutate(invitationData, {
        onSuccess: () => {
          setIsModalOpen(false);
          // Reset form and validation errors
          setFormData({
            email: "",
            role_id: "",
            expires_in_days: "",
            suggested_username: "",
            suggested_title: "",
            suggested_first_name: "",
            suggested_last_name: "",
            suggested_phone_number: "",
          });
          setValidationErrors({});
          // Don't call refetch here - the mutation hook handles it via invalidateQueries/refetchQueries
        },
        onError: (error) => {
          console.error("Failed to create invitation:", error);
          // Handle specific error cases
          if (error.response?.status === 422) {
            const errorData = error.response.data;
            const newValidationErrors = {};

            // Handle the new API error format with detail array
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

            if (Object.keys(newValidationErrors).length > 0) {
              setValidationErrors(newValidationErrors);
            }
          }
        },
      });
    } catch (error) {
      console.error("Unexpected error in handleSubmit:", error);
    }
  };

  const handleResendInvitation = (id) => {
    try {
      resendInvitationMutation.mutate(id, {
        onError: (error) => {
          console.error("Failed to resend invitation:", error);
        },
      });
    } catch (error) {
      console.error("Unexpected error in handleResendInvitation:", error);
    }
  };

  const handleRevokeInvitation = (id) => {
    try {
      revokeInvitationMutation.mutate(id, {
        onError: (error) => {
          console.error("Failed to revoke invitation:", error);
        },
      });
    } catch (error) {
      console.error("Unexpected error in handleRevokeInvitation:", error);
    }
  };

  const handleDeleteInvitation = (id) => {
    try {
      if (window.confirm("Are you sure you want to delete this invitation?")) {
        deleteInvitationMutation.mutate(id, {
          onError: (error) => {
            console.error("Failed to delete invitation:", error);
          },
        });
      }
    } catch (error) {
      console.error("Unexpected error in handleDeleteInvitation:", error);
    }
  };

  const handleResendAllPending = () => {
    try {
      resendAllPendingMutation.mutate(undefined, {
        onError: (error) => {
          console.error("Failed to resend all pending invitations:", error);
        },
      });
    } catch (error) {
      console.error("Unexpected error in handleResendAllPending:", error);
    }
  };

  const handleRevokeAllExpired = () => {
    try {
      if (
        window.confirm(
          "Are you sure you want to revoke all expired invitations?"
        )
      ) {
        revokeAllExpiredMutation.mutate(undefined, {
          onError: (error) => {
            console.error("Failed to revoke all expired invitations:", error);
          },
        });
      }
    } catch (error) {
      console.error("Unexpected error in handleRevokeAllExpired:", error);
    }
  };

  const handleModalClose = (open) => {
    setIsModalOpen(open);
    if (!open) {
      // Reset form and validation errors when modal is closed
      setFormData({
        email: "",
        role_id: "",
        expires_in_days: "",
        suggested_username: "",
        suggested_title: "",
        suggested_first_name: "",
        suggested_last_name: "",
        suggested_phone_number: "",
      });
      setValidationErrors({});
    }
  };

  const handleViewInvitation = (invitationId) => {
    setSelectedInvitationId(invitationId);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = (open) => {
    setIsViewModalOpen(open);
    if (!open) {
      setSelectedInvitationId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">
              User Invitations
            </h1>
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Invitation Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Invitations
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Invitations
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={handleResendAllPending}
                  disabled={resendAllPendingMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  Resend All Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-600"
                  onClick={handleRevokeAllExpired}
                  disabled={revokeAllExpiredMutation.isPending}
                >
                  <X className="h-4 w-4" />
                  Revoke All Expired
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invitations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {canCreateInvitation && (
          <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Invitation</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new user to join your organisation.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </label>

                    <Input
                      id="email"
                      type="email"
                      placeholder="user@company.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={
                        validationErrors.email
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }
                      required
                    />

                    {validationErrors.email && (
                      <p className="text-xs text-red-600">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="role_id" className="text-sm font-medium">
                      Role *
                    </label>

                    <Select
                      value={formData.role_id}
                      onValueChange={(value) =>
                        handleInputChange("role_id", value)
                      }
                      disabled={rolesLoading}
                    >
                      <SelectTrigger
                        className={
                          validationErrors.role_id
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        }
                      >
                        <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select role"} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {validationErrors.role_id && (
                      <p className="text-xs text-red-600">
                        {validationErrors.role_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="expires_in_days"
                      className="text-sm font-medium"
                    >
                      Expires In (Days) *
                    </label>

                    <Select
                      value={formData.expires_in_days}
                      onValueChange={(value) =>
                        handleInputChange("expires_in_days", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          validationErrors.expires_in_days
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>

                    {validationErrors.expires_in_days && (
                      <p className="text-xs text-red-600">
                        {validationErrors.expires_in_days}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="suggested_username"
                      className="text-sm font-medium"
                    >
                      Suggested Username
                    </label>

                    <Input
                      id="suggested_username"
                      placeholder="alex.brown"
                      value={formData.suggested_username}
                      onChange={(e) =>
                        handleInputChange("suggested_username", e.target.value)
                      }
                      className={
                        validationErrors.suggested_username
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }
                    />

                    {validationErrors.suggested_username && (
                      <p className="text-xs text-red-600">
                        {validationErrors.suggested_username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="suggested_title"
                    className="text-sm font-medium"
                  >
                    Title
                  </label>
                  <Select
                    value={formData.suggested_title}
                    onValueChange={(value) =>
                      handleInputChange("suggested_title", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mr">Mr.</SelectItem>
                      <SelectItem value="mrs">Mrs.</SelectItem>
                      <SelectItem value="ms">Ms.</SelectItem>
                      <SelectItem value="dr">Dr.</SelectItem>
                      <SelectItem value="prof">Prof.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="suggested_first_name"
                      className="text-sm font-medium"
                    >
                      First Name *
                    </label>

                    <Input
                      id="suggested_first_name"
                      placeholder="John"
                      value={formData.suggested_first_name}
                      onChange={(e) =>
                        handleInputChange(
                          "suggested_first_name",
                          e.target.value
                        )
                      }
                      className={
                        validationErrors.suggested_first_name
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }
                      required
                    />

                    {validationErrors.suggested_first_name && (
                      <p className="text-xs text-red-600">
                        {validationErrors.suggested_first_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="suggested_last_name"
                      className="text-sm font-medium"
                    >
                      Last Name *
                    </label>

                    <Input
                      id="suggested_last_name"
                      placeholder="Doe"
                      value={formData.suggested_last_name}
                      onChange={(e) =>
                        handleInputChange("suggested_last_name", e.target.value)
                      }
                      className={
                        validationErrors.suggested_last_name
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }
                      required
                    />

                    {validationErrors.suggested_last_name && (
                      <p className="text-xs text-red-600">
                        {validationErrors.suggested_last_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="suggested_phone_number"
                    className="text-sm font-medium"
                  >
                    UK Phone Number
                  </label>

                  <Input
                    id="suggested_phone_number"
                    type="tel"
                    placeholder="+44 20 1234 5678"
                    value={formData.suggested_phone_number}
                    onChange={(e) =>
                      handleInputChange(
                        "suggested_phone_number",
                        e.target.value
                      )
                    }
                    className={
                      validationErrors.suggested_phone_number
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }
                  />

                  {validationErrors.suggested_phone_number && (
                    <p className="text-xs text-red-600">
                      {validationErrors.suggested_phone_number}
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleModalClose(false)}
                    disabled={createInvitationMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvitationMutation.isPending}
                  >
                    {createInvitationMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      "Send Invitation"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* View Invitation Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={handleViewModalClose}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Invitation Details</DialogTitle>
              <DialogDescription>
                View detailed information about this invitation.
              </DialogDescription>
            </DialogHeader>

            {isViewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading invitation details...</span>
                </div>
              </div>
            ) : selectedInvitation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-sm">{selectedInvitation.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Role
                    </label>
                    <p className="text-sm">
                      {roles.find(r => r.id === selectedInvitation.role_id)?.display_name || `Role ${selectedInvitation.role_id}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      First Name
                    </label>
                    <p className="text-sm">{selectedInvitation.suggested_first_name || "Not provided"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Name
                    </label>
                    <p className="text-sm">{selectedInvitation.suggested_last_name || "Not provided"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Username
                    </label>
                    <p className="text-sm">{selectedInvitation.suggested_username || "Not provided"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Title
                    </label>
                    <p className="text-sm">{selectedInvitation.suggested_title || "Not provided"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </label>
                  <p className="text-sm">{selectedInvitation.suggested_phone_number || "Not provided"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <p className="text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${selectedInvitation.is_used
                        ? "bg-green-100 text-green-800"
                        : new Date(selectedInvitation.expires_at) < new Date()
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {selectedInvitation.is_used ? "Accepted" : new Date(selectedInvitation.expires_at) < new Date() ? "Expired" : "Pending"}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Invitation ID
                    </label>
                    <p className="text-sm font-mono">{selectedInvitation.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="text-sm">
                      {new Date(selectedInvitation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Expires At
                    </label>
                    <p className="text-sm">
                      {new Date(selectedInvitation.expires_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedInvitation.is_used && selectedInvitation.used_at && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Used At
                    </label>
                    <p className="text-sm">
                      {new Date(selectedInvitation.used_at).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Invitation Token
                  </label>
                  <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                    {selectedInvitation.token}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">Failed to load invitation details</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleViewModalClose(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid gap-2 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Total Sent</p>
                  <p className="text-2xl font-bold">
                    {transformedInvitations.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Accepted</p>
                  <p className="text-2xl font-bold">
                    {
                      transformedInvitations.filter(
                        (inv) => inv.status === "Accepted"
                      ).length
                    }
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold">
                    {
                      transformedInvitations.filter(
                        (inv) => inv.status === "Pending"
                      ).length
                    }
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Expired/Revoked</p>
                  <p className="text-2xl font-bold">
                    {
                      transformedInvitations.filter(
                        (inv) =>
                          inv.status === "Expired" || inv.status === "Revoked"
                      ).length
                    }
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              All Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading invitations...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-red-600 mb-2">Failed to load invitations</p>
                  <p className="text-sm text-muted-foreground">
                    {error.response?.data?.message || "Please try again later"}
                  </p>
                </div>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No invitations match your search"
                      : "No invitations found"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {invitation.title} {invitation.firstName}{" "}
                              {invitation.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              @{invitation.suggestedUsername}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {invitation.email}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {invitation.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${invitationUtils.getStatusColor(
                              invitation.status
                            )}`}
                          >
                            {invitation.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invitation.phoneNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invitation.sentDate}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invitation.expiresDate}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewInvitation(invitation.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View invitation details</p>
                              </TooltipContent>
                            </Tooltip>
                            {/* Only show action buttons for non-accepted invitations */}
                            {invitation.status !== "Accepted" && (
                              <>
                                {canUpdateInvitation && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleResendInvitation(invitation.id)
                                        }
                                        disabled={resendInvitationMutation.isPending}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Resend invitation email</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {canDeleteInvitation && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            disabled={revokeInvitationMutation.isPending}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Revoke invitation</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Revoke Invitation
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to revoke this
                                          invitation? This action cannot be undone.
                                          <br />
                                          <strong>Email:</strong> {invitation.email}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleRevokeInvitation(invitation.id)
                                          }
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Revoke Invitation
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </>
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
      </div>
    </TooltipProvider>
  );
};

export default InvitationPage;

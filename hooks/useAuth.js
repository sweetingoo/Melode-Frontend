import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { apiUtils } from "@/services/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Auth mutation keys
export const authKeys = {
  all: ["auth"],
  login: () => [...authKeys.all, "login"],
  mfaLogin: () => [...authKeys.all, "mfaLogin"],
  logout: () => [...authKeys.all, "logout"],
  register: () => [...authKeys.all, "register"],
  signup: () => [...authKeys.all, "signup"],
  forgotPassword: () => [...authKeys.all, "forgotPassword"],
  resetPassword: () => [...authKeys.all, "resetPassword"],
  refreshToken: () => [...authKeys.all, "refreshToken"],
  currentUser: () => [...authKeys.all, "currentUser"],
  updateProfile: () => [...authKeys.all, "updateProfile"],
  hijackUser: () => [...authKeys.all, "hijackUser"],
  returnToOriginalUser: () => [...authKeys.all, "returnToOriginalUser"],
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: authKeys.login(),
    mutationFn: async (credentials) => {
      const response = await authService.login(credentials);
      return response.data;
    },
    onSuccess: (data) => {
      // Check if MFA is required - if so, don't redirect
      if (data.requires_mfa) {
        return; // Let the component handle MFA flow
      }

      // Check if assignment selection is required - redirect to role selection page
      // Check for available_assignments first (new format), then available_roles (backward compatibility)
      // Also check if the message indicates multiple assignments
      const errorMessage = data.detail || data.message || "";
      const isMultipleAssignmentsMessage =
        errorMessage.toLowerCase().includes("multiple") &&
        (errorMessage.toLowerCase().includes("assignment") ||
          errorMessage.toLowerCase().includes("role"));

      const hasMultipleAssignments =
        isMultipleAssignmentsMessage ||
        (data.available_assignments &&
          Array.isArray(data.available_assignments) &&
          data.available_assignments.length > 1 &&
          !data.selected_assignment_id) ||
        (data.available_roles &&
          Array.isArray(data.available_roles) &&
          data.available_roles.length > 0 &&
          !data.selected_assignment_id &&
          !data.selected_role_id);

      if (hasMultipleAssignments) {
        // Store tokens if provided (even if we need to select assignment)
        if (data.access_token) {
          apiUtils.setAuthToken(data.access_token);
          if (data.refresh_token) {
            apiUtils.setRefreshToken(data.refresh_token);
          }
          // Set flag to fetch departments if assignments not in response
          if (!data.available_assignments && !data.available_roles) {
            localStorage.setItem("needsAssignmentFetch", "true");
          }
        }
        // Store temporary token and available assignments/roles for role selection page
        if (typeof window !== "undefined") {
          // Store a temporary token if provided (some backends might return a temp token)
          if (data.temp_token) {
            localStorage.setItem("tempAuthToken", data.temp_token);
          }
          // Store available assignments (preferred) or roles (backward compatibility)
          if (data.available_assignments) {
            localStorage.setItem(
              "availableAssignments",
              JSON.stringify(data.available_assignments)
            );
          } else if (data.available_roles) {
            localStorage.setItem(
              "availableRoles",
              JSON.stringify(data.available_roles)
            );
          }
          // Store email for role selection page (get from request if not in response)
          const requestEmail = data.email || "";
          if (requestEmail) {
            localStorage.setItem("pendingLoginEmail", requestEmail);
          }
        }
        // Redirect to role selection page
        if (typeof window !== "undefined") {
          router.push("/auth/select-role");
        }
        return;
      }

      // Only handle successful login (no MFA or role selection required)
      // Store tokens
      apiUtils.setAuthToken(data.access_token);
      if (data.refresh_token) {
        apiUtils.setRefreshToken(data.refresh_token);
      }

      // Store selected assignment_id if provided (preferred)
      if (data.selected_assignment_id && typeof window !== "undefined") {
        localStorage.setItem(
          "assignment_id",
          data.selected_assignment_id.toString()
        );
      }
      // Also store selected_role_id for backward compatibility
      if (data.selected_role_id && typeof window !== "undefined") {
        localStorage.setItem("activeRoleId", data.selected_role_id.toString());
        // If no assignment_id was provided, use role_id as fallback
        if (!data.selected_assignment_id) {
          localStorage.setItem(
            "assignment_id",
            data.selected_role_id.toString()
          );
        }
      }

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      // Show success message
      toast.success("Login successful!", {
        description: "Welcome back to Melode Admin",
      });

      // Redirect to admin page with a small delay
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/admin";
        }, 100);
      }
    },
    onError: (error) => {
      console.error("Login error:", error);

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData?.detail || errorData?.message || "";

        // Check if the error message indicates multiple assignments are available
        const isMultipleAssignmentsError =
          errorMessage.toLowerCase().includes("multiple") &&
          (errorMessage.toLowerCase().includes("assignment") ||
            errorMessage.toLowerCase().includes("role"));

        // Check if assignment selection is required
        // Look for assignments in various possible fields (check nested structures too)
        const availableAssignments =
          errorData?.available_assignments ||
          errorData?.assignments ||
          errorData?.available_assignments_list ||
          errorData?.data?.available_assignments ||
          errorData?.data?.assignments;
        const availableRoles =
          errorData?.available_roles ||
          errorData?.roles ||
          errorData?.data?.available_roles ||
          errorData?.data?.roles;

        const hasMultipleAssignments =
          isMultipleAssignmentsError ||
          (availableAssignments &&
            Array.isArray(availableAssignments) &&
            availableAssignments.length > 0) ||
          (availableRoles &&
            Array.isArray(availableRoles) &&
            availableRoles.length > 0);

        if (hasMultipleAssignments || isMultipleAssignmentsError) {
          // Store available assignments/roles and redirect to role selection page
          if (typeof window !== "undefined") {
            // Check if tokens are in the error response (some APIs return tokens even with 400)
            const accessToken =
              errorData?.access_token || errorData?.data?.access_token;
            const refreshToken =
              errorData?.refresh_token || errorData?.data?.refresh_token;

            if (accessToken) {
              // Store tokens so we can fetch departments
              apiUtils.setAuthToken(accessToken);
              if (refreshToken) {
                apiUtils.setRefreshToken(refreshToken);
              }
              // Set a flag to fetch departments on the select-role page
              localStorage.setItem("needsAssignmentFetch", "true");
            }

            if (availableAssignments && Array.isArray(availableAssignments)) {
              localStorage.setItem(
                "availableAssignments",
                JSON.stringify(availableAssignments)
              );
            } else if (availableRoles && Array.isArray(availableRoles)) {
              localStorage.setItem(
                "availableRoles",
                JSON.stringify(availableRoles)
              );
            } else if (isMultipleAssignmentsError) {
              // If we detected the error message but don't have assignments,
              // the select-role page will fetch them using the stored token
              console.log(
                "Multiple assignments error detected. Will fetch assignments from API."
              );
            }
            // Try to get email from the request if available
            try {
              const requestData = error.config?.data
                ? JSON.parse(error.config.data)
                : null;
              const requestEmail = requestData?.email || null;
              if (requestEmail) {
                localStorage.setItem("pendingLoginEmail", requestEmail);
              }
            } catch (e) {
              console.error("Error parsing request data:", e);
            }
            router.push("/auth/select-role");
          }
          return; // Don't show error toast
        }

        // Check if this is an MFA required error
        if (
          errorMessage.toLowerCase().includes("mfa") ||
          errorMessage.toLowerCase().includes("token required")
        ) {
          // This should be handled by the component, not show an error
          console.log("MFA required - should be handled by component");
          console.log("Full error response:", error.response.data);
          // Don't return here - let the error propagate to the component
        } else {
          toast.error("Login failed", {
            description: errorMessage || "Please check your credentials",
          });
        }
      } else if (error.response?.status === 401) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password",
        });
      } else if (error.response?.status === 422) {
        const errors = error.response.data?.errors;
        if (errors) {
          // Handle validation errors
          Object.keys(errors).forEach((field) => {
            toast.error(`${field}: ${errors[field].join(", ")}`);
          });
        } else {
          toast.error("Validation error", {
            description:
              error.response.data?.message || "Please check your input",
          });
        }
      } else if (error.response?.status === 429) {
        toast.error("Too many attempts", {
          description: "Please wait before trying again",
        });
      } else {
        toast.error("Login failed", {
          description:
            error.response?.data?.message || "An unexpected error occurred",
        });
      }
    },
  });
};

// MFA Login verification mutation
export const useMFALogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: authKeys.mfaLogin(),
    mutationFn: async ({ temp_token, mfa_token }) => {
      const response = await authService.mfaLogin(temp_token, mfa_token);
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens
      apiUtils.setAuthToken(data.access_token);
      if (data.refresh_token) {
        apiUtils.setRefreshToken(data.refresh_token);
      }

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      // Show success message
      toast.success("Login successful!", {
        description: "Welcome back to Melode Admin",
      });

      // Redirect to admin page with a small delay
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/admin";
        }, 100);
      }
    },
    onError: (error) => {
      console.error("MFA Login error:", error);

      if (error.response?.status === 401) {
        toast.error("Invalid MFA token", {
          description: "Please check your MFA token and try again",
        });
      } else if (error.response?.status === 422) {
        toast.error("Invalid MFA token", {
          description: "Please enter a valid 6-digit code",
        });
      } else {
        toast.error("MFA verification failed", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: authKeys.logout(),
    mutationFn: async () => {
      const response = await authService.logout();
      return response.data;
    },
    onSuccess: () => {
      // Clear tokens and user data
      apiUtils.clearAuthToken();
      queryClient.clear();

      // Clear hijack session if exists
      if (typeof window !== "undefined") {
        localStorage.removeItem("hijackSession");
      }

      toast.success("Logged out successfully");

      // Redirect to login page
      router.push("/auth");
    },
    onError: (error) => {
      console.error("Logout error:", error);

      // Even if logout fails on server, clear local data
      apiUtils.clearAuthToken();
      queryClient.clear();

      // Clear hijack session if exists
      if (typeof window !== "undefined") {
        localStorage.removeItem("hijackSession");
      }

      toast.error("Logout failed", {
        description: "You have been logged out locally",
      });

      router.push("/auth");
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationKey: authKeys.forgotPassword(),
    mutationFn: async (email) => {
      const response = await authService.forgotPassword(email);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Reset link sent!", {
        description: "Check your email for password reset instructions",
      });
    },
    onError: (error) => {
      console.error("Forgot password error:", error);

      if (error.response?.status === 404) {
        toast.error("Email not found", {
          description: "No account found with this email address",
        });
      } else if (error.response?.status === 422) {
        toast.error("Invalid email", {
          description: "Please enter a valid email address",
        });
      } else {
        toast.error("Failed to send reset link", {
          description:
            error.response?.data?.message || "Please try again later",
        });
      }
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationKey: authKeys.resetPassword(),
    mutationFn: async ({ token, password }) => {
      const response = await authService.resetPassword(token, password);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password reset successful!", {
        description: "You can now log in with your new password",
      });

      router.push("/auth");
    },
    onError: (error) => {
      console.error("Reset password error:", error);

      if (error.response?.status === 400) {
        toast.error("Invalid or expired token", {
          description: "Please request a new password reset link",
        });
      } else if (error.response?.status === 422) {
        toast.error("Password validation failed", {
          description: "Please check your password requirements",
        });
      } else {
        toast.error("Password reset failed", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Signup mutation (with invitation token)
export const useSignup = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: authKeys.signup(),
    mutationFn: async (signupData) => {
      const response = await authService.signup(signupData);
      return response.data;
    },
    onSuccess: (data) => {
      // Store auth token if provided
      if (data.access_token) {
        apiUtils.setAuthToken(data.access_token);
      }
      if (data.refresh_token) {
        apiUtils.setRefreshToken(data.refresh_token);
      }

      toast.success("Account created successfully!", {
        description: "Welcome to Melode! You can now access your account.",
      });

      // Redirect to dashboard
      if (typeof window !== "undefined") {
        window.location.href = "/admin";
      }
    },
    onError: (error) => {
      console.error("Signup error:", error);

      if (error.response?.status === 400) {
        toast.error("Invalid invitation", {
          description: "The invitation token is invalid or expired",
        });
      } else if (error.response?.status === 422) {
        const errorData = error.response.data;

        // Handle validation errors
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          errorData.detail.forEach((errorItem) => {
            if (errorItem.loc && errorItem.loc.length > 1) {
              const fieldName = errorItem.loc[1];
              toast.error(`${fieldName}: ${errorItem.msg}`);
            }
          });
        } else {
          toast.error("Validation error", {
            description: errorData?.message || "Please check your input",
          });
        }
      } else {
        toast.error("Failed to create account", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Get current user query
export const useCurrentUser = () => {
  const isAuthenticated = apiUtils.isAuthenticated();

  // Debug logging
  console.log("useCurrentUser - isAuthenticated:", isAuthenticated);

  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      console.log("useCurrentUser - Fetching user data...");
      const response = await authService.getCurrentUser();
      console.log("useCurrentUser - User data received:", response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.log(
        "useCurrentUser - Retry attempt:",
        failureCount,
        error?.response?.status
      );
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: authKeys.updateProfile(),
    mutationFn: async (userData) => {
      const response = await authService.updateProfile(userData);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the current user query cache
      queryClient.setQueryData(authKeys.currentUser(), data);

      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      console.error("Update profile error:", error);

      if (error.response?.status === 422) {
        const errors = error.response.data?.errors;
        if (errors) {
          Object.keys(errors).forEach((field) => {
            toast.error(`${field}: ${errors[field].join(", ")}`);
          });
        } else {
          toast.error("Validation error", {
            description:
              error.response.data?.message || "Please check your input",
          });
        }
      } else {
        toast.error("Profile update failed", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Hijack user mutation (Superuser Only)
export const useHijackUser = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: authKeys.hijackUser(),
    mutationFn: async (targetUserId) => {
      const response = await authService.hijackUser(targetUserId);
      return response.data;
    },
    onSuccess: (data) => {
      // Get current user's tokens BEFORE storing hijacked tokens
      // This is the original user's tokens we need to restore later
      const originalAuthToken =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const originalRefreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;

      // Store the hijacked user tokens
      apiUtils.setAuthToken(data.access_token);
      if (data.refresh_token) {
        apiUtils.setRefreshToken(data.refresh_token);
      }

      // Store hijack session info in localStorage for reference
      // IMPORTANT: Store the original user's tokens so we can restore them later
      localStorage.setItem(
        "hijackSession",
        JSON.stringify({
          isHijacked: data.is_hijacked_session,
          originalUser: data.original_user,
          hijackedUser: data.hijacked_user,
          hijackedAt: new Date().toISOString(),
          // Store original user's tokens for restoration
          originalAuthToken: originalAuthToken,
          originalRefreshToken: originalRefreshToken,
        })
      );

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      // Show success message
      toast.success("User hijacked successfully!", {
        description: `Now logged in as ${data.hijacked_user.first_name} ${data.hijacked_user.last_name}`,
      });

      // Redirect to admin page
      if (typeof window !== "undefined") {
        window.location.href = "/admin";
      }
    },
    onError: (error) => {
      console.error("Hijack user error:", error);

      if (error.response?.status === 403) {
        toast.error("Access Denied", {
          description: "Only superusers can hijack user sessions",
        });
      } else if (error.response?.status === 404) {
        toast.error("User Not Found", {
          description: "The target user does not exist",
        });
      } else {
        toast.error("Hijack Failed", {
          description:
            error.response?.data?.message || "Failed to hijack user session",
        });
      }
    },
  });
};

// Return to original user mutation (Superuser Only)
export const useReturnToOriginalUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: authKeys.returnToOriginalUser(),
    mutationFn: async () => {
      // No endpoint exists for this - use localStorage instead
      // This function doesn't make an API call, it just prepares the data
      // The actual restoration happens in onSuccess
      if (typeof window === "undefined") {
        throw new Error("Cannot restore original user session on server");
      }

      const hijackSessionStr = localStorage.getItem("hijackSession");
      if (!hijackSessionStr) {
        throw new Error("No hijack session found");
      }

      const hijackSession = JSON.parse(hijackSessionStr);
      if (!hijackSession.originalAuthToken) {
        throw new Error("Original user tokens not found in hijack session");
      }

      // Return the stored data - we'll restore tokens in onSuccess
      return {
        access_token: hijackSession.originalAuthToken,
        refresh_token: hijackSession.originalRefreshToken,
        user: hijackSession.originalUser,
      };
    },
    onSuccess: (data) => {
      // Data comes from mutationFn which reads from localStorage
      // Restore the original user's tokens
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;

      if (accessToken) {
        apiUtils.setAuthToken(accessToken);
      }
      if (refreshToken) {
        apiUtils.setRefreshToken(refreshToken);
      }

      // Clear hijack session info since we're back to original user
      if (typeof window !== "undefined") {
        localStorage.removeItem("hijackSession");
      }

      // Invalidate and refetch user data to get original user info
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      // Show success message
      const user = data.user || data;
      const userName =
        user?.first_name && user?.last_name
          ? `${user.first_name} ${user.last_name}`
          : user?.email || user?.username || "the original user";

      toast.success("Successfully returned to original user", {
        description: `Now logged in as ${userName}`,
      });

      // Redirect to admin dashboard
      if (typeof window !== "undefined") {
        window.location.href = "/admin";
      }
    },
    onError: (error) => {
      console.error("Return to original user error:", error);

      // Handle different error types
      if (error.message?.includes("No hijack session")) {
        toast.error("No hijack session found", {
          description: "You are not currently in a hijacked session.",
        });
      } else if (error.message?.includes("Original user tokens not found")) {
        toast.error("Cannot restore session", {
          description:
            "Original user tokens not found. Please logout and login again.",
        });
      } else {
        toast.error("Failed to return to original user", {
          description:
            error.message || "Please try again or logout and login again.",
        });
      }
    },
  });
};

// Auth utilities hook
export const useAuth = () => {
  const { data: user, isLoading, error } = useCurrentUser();
  const logoutMutation = useLogout();

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};

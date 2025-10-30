import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { apiUtils } from "@/services/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Auth mutation keys
export const authKeys = {
  all: ["auth"],
  login: () => [...authKeys.all, "login"],
  logout: () => [...authKeys.all, "logout"],
  register: () => [...authKeys.all, "register"],
  signup: () => [...authKeys.all, "signup"],
  forgotPassword: () => [...authKeys.all, "forgotPassword"],
  resetPassword: () => [...authKeys.all, "resetPassword"],
  refreshToken: () => [...authKeys.all, "refreshToken"],
  currentUser: () => [...authKeys.all, "currentUser"],
  updateProfile: () => [...authKeys.all, "updateProfile"],
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

      // Redirect to admin page
      router.push("/admin");
    },
    onError: (error) => {
      console.error("Login error:", error);

      // Handle specific error cases
      if (error.response?.status === 401) {
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

      toast.success("Logged out successfully");

      // Redirect to login page
      router.push("/auth");
    },
    onError: (error) => {
      console.error("Logout error:", error);

      // Even if logout fails on server, clear local data
      apiUtils.clearAuthToken();
      queryClient.clear();

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
      router.push("/admin");
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
  console.log('useCurrentUser - isAuthenticated:', isAuthenticated);
  
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      console.log('useCurrentUser - Fetching user data...');
      const response = await authService.getCurrentUser();
      console.log('useCurrentUser - User data received:', response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.log('useCurrentUser - Retry attempt:', failureCount, error?.response?.status);
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

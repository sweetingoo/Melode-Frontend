"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, ArrowRight, Shield, User } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { assets } from "../../assets/assets";
import Link from "next/link";
import { useSignup } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUtils } from "@/services/api-client";

const SignupContent = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    invitation_token: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const searchParams = useSearchParams();

  // Use the signup mutation from our custom hook
  const signupMutation = useSignup();

  // Redirect if already authenticated
  useEffect(() => {
    const isAuthenticated = apiUtils.isAuthenticated();
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [router]);

  // Get invitation token from URL params
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setFormData(prev => ({ ...prev, invitation_token: token }));
    }
  }, [searchParams]);

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
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number";
    if (!/(?=.*[@$!%*?&])/.test(password)) return "Password must contain at least one special character (@$!%*?&)";
    return "";
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.invitation_token) {
      errors.invitation_token = "Invitation token is required";
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Prepare signup data for API call
    const signupData = {
      invitation_token: formData.invitation_token,
      password: formData.password,
    };

    // Call the signup mutation
    signupMutation.mutate(signupData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Image
                src={assets.favicon.src}
                alt="Melode Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Set Your Password
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your account has been created. Set your password to access your account.
          </p>
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Set Password</CardTitle>
            <p className="text-sm text-center text-muted-foreground">
              Enter your invitation token and create a password to access your account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invitation Token */}
              <div className="space-y-2">
                <Label htmlFor="invitation_token">Invitation Token</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="invitation_token"
                    type="text"
                    placeholder="Enter your invitation token"
                    value={formData.invitation_token}
                    onChange={(e) =>
                      handleInputChange("invitation_token", e.target.value)
                    }
                    className={`pl-10 ${validationErrors.invitation_token
                        ? "border-red-500 focus:border-red-500"
                        : ""
                      }`}
                    required
                  />
                </div>
                {validationErrors.invitation_token && (
                  <p className="text-xs text-red-600">
                    {validationErrors.invitation_token}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Set a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`pl-10 pr-10 ${validationErrors.password
                        ? "border-red-500 focus:border-red-500"
                        : ""
                      }`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-red-600">
                    {validationErrors.password}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`pl-10 ${validationErrors.confirmPassword
                        ? "border-red-500 focus:border-red-500"
                        : ""
                      }`}
                    required
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-600">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Setting Password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Set Password
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

const SignupPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Image
                  src={assets.favicon.src}
                  alt="Melode Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
};

export default SignupPage;

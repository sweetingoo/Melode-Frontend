"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { assets } from "../assets/assets";
import Link from "next/link";
import { useLogin, useCurrentUser } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiUtils } from "@/services/api-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  console.log("LoginPage component rendering");

  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfa_token: "", // MFA token for verification
  });

  // Use the login mutations from our custom hooks
  const loginMutation = useLogin();
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();

  // Check for role_id in URL params (from role selection page)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const roleId = urlParams.get("role_id");
      const email = urlParams.get("email");

      if (roleId && email) {
        // Pre-fill email and attempt login with role_id
        setFormData(prev => ({ ...prev, email: decodeURIComponent(email) }));
        // Get password from localStorage if stored temporarily
        const storedPassword = localStorage.getItem("pendingLoginPassword");
        if (storedPassword) {
          // Complete login with role_id
          loginMutation.mutate({
            email: decodeURIComponent(email),
            password: storedPassword,
            role_id: parseInt(roleId),
          });
          // Clear stored password
          localStorage.removeItem("pendingLoginPassword");
        }
      }
    }
  }, []);

  // Redirect if already authenticated (but only if user data is actually valid)
  // Don't redirect if there's an error fetching user (expired token)
  useEffect(() => {
    // Only redirect if we have valid user data (not just a token)
    // If there's an error, the token is likely expired, so don't redirect
    if (currentUser && !userError && !userLoading) {
      // Check for stored redirect URL
      const redirectUrl = localStorage.getItem('authRedirectUrl');
      if (redirectUrl && !redirectUrl.startsWith('/auth')) {
        // Clear the stored redirect URL and redirect to it
        localStorage.removeItem('authRedirectUrl');
        router.push(redirectUrl);
      } else {
        // Default to admin page
        router.push('/admin');
      }
    } else if (userError) {
      // If there's an error fetching user (expired token), clear the token
      // This prevents redirect loops
      apiUtils.clearAuthToken();
    }
  }, [router, currentUser, userError, userLoading]);

  // Handle MFA requirement from error response
  useEffect(() => {
    console.log("Login mutation error changed:", loginMutation.error);
    if (loginMutation.error?.response?.status === 400) {
      const errorMessage = loginMutation.error.response.data?.detail || "";
      console.log("400 error received, message:", errorMessage);
      if (errorMessage.toLowerCase().includes("mfa") || errorMessage.toLowerCase().includes("token required")) {
        console.log("MFA required from error response - switching to MFA mode");
        setRequiresMFA(true);
        setFormData(prev => ({ ...prev, mfa_token: "" }));
        toast.info("MFA Required", {
          description: "Please enter your MFA token to complete login",
        });
      }
    }
  }, [loginMutation.error]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("Form submitted", { formData, requiresMFA });

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (requiresMFA) {
      // MFA verification step
      if (!formData.mfa_token) {
        toast.error("Please enter your MFA token");
        return;
      }

      // Validate MFA token format (6 digits)
      if (!/^\d{6}$/.test(formData.mfa_token)) {
        toast.error("Please enter a valid 6-digit MFA token");
        return;
      }
    }

    // Store password temporarily if we might need it for role selection
    // This is a security consideration - in production, consider using a temp token from backend
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingLoginPassword", formData.password);
    }

    // Call login mutation with all credentials
    const credentials = {
      email: formData.email,
      password: formData.password,
      ...(requiresMFA && formData.mfa_token && { mfa_token: formData.mfa_token }),
    };

    console.log("Calling login mutation with:", credentials);
    loginMutation.mutate(credentials);
  };

  const handleForgotPassword = () => {
    toast.info("Forgot password functionality");
  };

  const handleGoogleLogin = () => {
    toast.info("Google login functionality");
  };

  const handleMicrosoftLogin = () => {
    toast.info("Microsoft login functionality");
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl">
              <Image
                src={assets.favicon.src}
                alt="Melode Admin"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl bg-card backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            {requiresMFA ? (
              <CardTitle className="text-2xl font-bold text-center text-foreground">
                MFA Verification
              </CardTitle>
            ) : (
              <p className="text-sm text-center text-muted-foreground">
                Enter your credentials to access your account
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Email Field - Only show when not in MFA mode */}
              {!requiresMFA && (
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="pl-10 h-11 border-border focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Field - Only show when not in MFA mode */}
              {!requiresMFA && (
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="pl-10 pr-10 h-11 border-border focus:border-primary focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* MFA Token Field - Only show when MFA is required */}
              {requiresMFA && (
                <div className="space-y-2">
                  <Label
                    htmlFor="mfa_token"
                    className="text-sm font-medium text-foreground"
                  >
                    MFA Token
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mfa_token"
                      type="text"
                      placeholder="Enter 6-digit MFA token"
                      value={formData.mfa_token}
                      onChange={(e) => handleInputChange("mfa_token", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="pl-10 h-11 border-border focus:border-primary focus:ring-primary/20"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}

              {/* Remember Me & Forgot Password - Only show when not in MFA mode */}
              {!requiresMFA && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/auth/forget-password"
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Back to Login Button - Only show in MFA mode */}
              {requiresMFA && (
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setRequiresMFA(false);
                      setFormData(prev => ({ ...prev, mfa_token: "" }));
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Back to login
                  </Button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="button"
                onClick={(e) => handleSubmit(e)}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {requiresMFA ? "Verifying MFA..." : "Signing in..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {requiresMFA ? "Verify MFA" : "Sign In"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="text-center mt-3">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Contact Administrator
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-8">
          <Shield className="h-3 w-3" />
          <span>Secure login with enterprise-grade security</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

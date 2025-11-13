"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { assets } from "../../assets/assets";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLogin } from "@/hooks/useAuth";
import { apiUtils } from "@/services/api-client";

const SelectRolePage = () => {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [pendingEmail, setPendingEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useLogin();

  useEffect(() => {
    // Check if user is already authenticated
    if (apiUtils.isAuthenticated()) {
      router.push("/admin");
      return;
    }

    // Get available roles from localStorage
    const storedRoles = typeof window !== "undefined" ? localStorage.getItem("availableRoles") : null;
    const storedEmail = typeof window !== "undefined" ? localStorage.getItem("pendingLoginEmail") : null;

    if (!storedRoles) {
      toast.error("No roles available", {
        description: "Please login again",
      });
      router.push("/auth");
      return;
    }

    try {
      const roles = JSON.parse(storedRoles);
      setAvailableRoles(roles);
      setPendingEmail(storedEmail || "");
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing available roles:", error);
      toast.error("Invalid role data", {
        description: "Please login again",
      });
      router.push("/auth");
    }
  }, [router]);

  const handleRoleSelect = (roleId) => {
    setSelectedRoleId(roleId);
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedRoleId) {
      toast.error("Please select a role");
      return;
    }

    const email = pendingEmail;
    if (!email) {
      toast.error("Session expired", {
        description: "Please login again",
      });
      router.push("/auth");
      return;
    }

    // Get stored password from localStorage
    const storedPassword = typeof window !== "undefined" ? localStorage.getItem("pendingLoginPassword") : null;
    
    if (!storedPassword) {
      toast.error("Session expired", {
        description: "Please login again",
      });
      // Clear stored data
      if (typeof window !== "undefined") {
        localStorage.removeItem("availableRoles");
        localStorage.removeItem("pendingLoginEmail");
        localStorage.removeItem("tempAuthToken");
      }
      router.push("/auth");
      return;
    }

    // Call login with email, password, and selected role_id
    const credentials = {
      email: email,
      password: storedPassword,
      role_id: parseInt(selectedRoleId),
    };

    loginMutation.mutate(credentials);
  };

  const handleBack = () => {
    // Clear stored data
    if (typeof window !== "undefined") {
      localStorage.removeItem("availableRoles");
      localStorage.removeItem("pendingLoginEmail");
      localStorage.removeItem("tempAuthToken");
      localStorage.removeItem("pendingLoginPassword");
    }
    router.push("/auth");
  };

  // Handle successful login from role selection
  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      // Clear stored data
      if (typeof window !== "undefined") {
        localStorage.removeItem("availableRoles");
        localStorage.removeItem("pendingLoginEmail");
        localStorage.removeItem("tempAuthToken");
        localStorage.removeItem("pendingLoginPassword");
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="border-0 shadow-xl bg-card backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedRole = availableRoles.find((role) => role.id === parseInt(selectedRoleId));

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
            Select Your Role
          </h1>
          <p className="text-muted-foreground">
            You have access to multiple roles. Please select one to continue.
          </p>
        </div>

        {/* Role Selection Card */}
        <Card className="border-0 shadow-xl bg-card backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Choose Role
            </CardTitle>
            <p className="text-sm text-center text-muted-foreground">
              Select the role you want to use for this session
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-3">
                {availableRoles.map((role) => {
                  const isSelected = selectedRoleId === role.id.toString();
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleSelect(role.id.toString())}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {role.display_name || role.name}
                            </span>
                          </div>
                          {role.department_name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{role.department_name}</span>
                            </div>
                          )}
                          {role.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Back Button */}
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={!selectedRoleId || loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Continuing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelectRolePage;


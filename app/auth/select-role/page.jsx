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
import { departmentContextService } from "@/services/departmentContext";

const SelectRolePage = () => {
  const router = useRouter();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [assignmentsByDepartment, setAssignmentsByDepartment] = useState([]);
  const [pendingEmail, setPendingEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useLogin();

  useEffect(() => {
    // Check if user is already authenticated
    if (apiUtils.isAuthenticated()) {
      // Check for stored redirect URL
      const redirectUrl = localStorage.getItem('authRedirectUrl');
      if (redirectUrl && !redirectUrl.startsWith('/auth')) {
        // Clear the stored redirect URL and redirect to it
        localStorage.removeItem('authRedirectUrl');
        router.push(redirectUrl);
      } else {
        // Default to admin page
        router.push("/admin");
      }
      return;
    }

    // Get available assignments from localStorage (preferred) or availableRoles (backward compatibility)
    const storedAssignments =
      typeof window !== "undefined"
        ? localStorage.getItem("availableAssignments")
        : null;
    const storedRoles =
      typeof window !== "undefined"
        ? localStorage.getItem("availableRoles")
        : null;
    const storedEmail =
      typeof window !== "undefined"
        ? localStorage.getItem("pendingLoginEmail")
        : null;

    const needsFetch =
      typeof window !== "undefined"
        ? localStorage.getItem("needsAssignmentFetch") === "true"
        : false;

    // If we have a token and need to fetch assignments, do it now
    if (
      needsFetch &&
      apiUtils.isAuthenticated() &&
      !storedAssignments &&
      !storedRoles
    ) {
      const fetchAssignments = async () => {
        try {
          setIsLoading(true);
          const response = await departmentContextService.getUserDepartments();
          const departments = response?.departments || [];

          // Convert departments format to assignments format
          const assignments = departments.map((dept) => ({
            assignment_id: dept.assignment_id,
            role_id: dept.role?.id,
            role_name: dept.role?.name,
            role_display_name: dept.role?.display_name || dept.role?.name,
            department_id: dept.department?.id,
            department_name: dept.department?.name,
          }));

          if (assignments.length > 0) {
            setAvailableAssignments(assignments);
            localStorage.setItem(
              "availableAssignments",
              JSON.stringify(assignments)
            );
            localStorage.removeItem("needsAssignmentFetch");

            // Group assignments by department
            const grouped = {};
            assignments.forEach((assignment) => {
              const deptId = assignment.department_id;
              const deptName =
                assignment.department_name || "Unknown Department";

              if (!grouped[deptId]) {
                grouped[deptId] = {
                  department_id: deptId,
                  department_name: deptName,
                  assignments: [],
                };
              }

              grouped[deptId].assignments.push(assignment);
            });

            setAssignmentsByDepartment(Object.values(grouped));
            setIsLoading(false);
          } else {
            throw new Error("No assignments found");
          }
        } catch (error) {
          console.error("Error fetching assignments:", error);
          toast.error("Failed to load assignments", {
            description: "Please try logging in again",
          });
          setIsLoading(false);
          setTimeout(() => {
            router.push("/auth");
          }, 2000);
        }
      };

      fetchAssignments();
      return;
    }

    if (!storedAssignments && !storedRoles && !needsFetch) {
      // If no assignments found and we don't need to fetch, show error
      console.warn(
        "No assignments found in localStorage. This might indicate the API didn't include assignments in the error response."
      );
      toast.error("Assignment selection required", {
        description: "Please contact support or try logging in again",
      });
      // Still allow user to go back to login
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
      return;
    }

    try {
      let assignments = [];

      // Try to parse assignments first (new format)
      if (storedAssignments) {
        assignments = JSON.parse(storedAssignments);
      } else if (storedRoles) {
        // Backward compatibility: convert roles to assignments format
        const roles = JSON.parse(storedRoles);
        assignments = roles.map((role) => ({
          assignment_id: role.assignment_id || role.id,
          role_id: role.role_id || role.id,
          role_name: role.role_name || role.name,
          role_display_name:
            role.role_display_name || role.display_name || role.name,
          department_id: role.department_id,
          department_name: role.department_name,
        }));
      }

      setAvailableAssignments(assignments);
      setPendingEmail(storedEmail || "");

      // Group assignments by department
      const grouped = {};
      assignments.forEach((assignment) => {
        const deptId = assignment.department_id;
        const deptName = assignment.department_name || "Unknown Department";

        if (!grouped[deptId]) {
          grouped[deptId] = {
            department_id: deptId,
            department_name: deptName,
            assignments: [],
          };
        }

        grouped[deptId].assignments.push(assignment);
      });

      setAssignmentsByDepartment(Object.values(grouped));
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing available assignments:", error);
      toast.error("Invalid assignment data", {
        description: "Please login again",
      });
      router.push("/auth");
    }
  }, [router]);

  const handleAssignmentSelect = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedAssignmentId) {
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
    const storedPassword =
      typeof window !== "undefined"
        ? localStorage.getItem("pendingLoginPassword")
        : null;

    if (!storedPassword) {
      toast.error("Session expired", {
        description: "Please login again",
      });
      // Clear stored data
      if (typeof window !== "undefined") {
        localStorage.removeItem("availableAssignments");
        localStorage.removeItem("availableRoles");
        localStorage.removeItem("pendingLoginEmail");
        localStorage.removeItem("tempAuthToken");
      }
      router.push("/auth");
      return;
    }

    // Call login with email, password, and selected assignment_id
    const credentials = {
      email: email,
      password: storedPassword,
      assignment_id: parseInt(selectedAssignmentId),
    };

    loginMutation.mutate(credentials);
  };

  const handleBack = () => {
    // Clear stored data
    if (typeof window !== "undefined") {
      localStorage.removeItem("availableAssignments");
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
        localStorage.removeItem("availableAssignments");
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

  const selectedAssignment = availableAssignments.find(
    (assignment) => assignment.assignment_id === parseInt(selectedAssignmentId)
  );

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
              {/* Assignment Selection - Grouped by Department */}
              <div className="space-y-4">
                {assignmentsByDepartment.map((deptGroup) => (
                  <div key={deptGroup.department_id} className="space-y-2">
                    {/* Department Label */}
                    <div className="flex items-center gap-2 px-2 py-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        {deptGroup.department_name}
                      </span>
                    </div>

                    {/* Roles within Department */}
                    <div className="space-y-2 pl-6">
                      {deptGroup.assignments.map((assignment) => {
                        const isSelected =
                          selectedAssignmentId ===
                          assignment.assignment_id.toString();
                        return (
                          <button
                            key={assignment.assignment_id}
                            type="button"
                            onClick={() =>
                              handleAssignmentSelect(
                                assignment.assignment_id.toString()
                              )
                            }
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
                                    {assignment.role_display_name ||
                                      assignment.role_name ||
                                      "Role"}
                                  </span>
                                </div>
                                {assignment.role_name &&
                                  assignment.role_name !==
                                    assignment.role_display_name && (
                                    <p className="text-xs text-muted-foreground">
                                      {assignment.role_name}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
                disabled={!selectedAssignmentId || loginMutation.isPending}
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

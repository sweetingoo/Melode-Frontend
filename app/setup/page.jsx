"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Setup page doesn't require authentication - it's for initial one-time setup
import {
  useSetupStatus,
  useSetupRequirements,
  useRunSetup,
  useCreateSuperuserRole,
  useCreateSuperuserUser,
  useCreateOrganization,
  useInitializePermissions,
  useInitializeConfigurations,
  useMarkSetupComplete,
} from "@/hooks/useSetup";
// Note: Setup page doesn't use authenticated endpoints since it's for initial setup
// All data comes from /setup/status and /setup/requirements endpoints
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Settings,
  User,
  Building2,
  Shield,
  Key,
  AlertCircle,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const SetupPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunningSetup, setIsRunningSetup] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Setup status and requirements - these are the only endpoints we use
  // They should return all necessary data since we can't access authenticated endpoints
  const { data: setupStatus, isLoading: statusLoading } = useSetupStatus();
  const { data: requirements, isLoading: requirementsLoading, refetch: refetchRequirements } = useSetupRequirements();

  // Mutations
  const createSuperuserRoleMutation = useCreateSuperuserRole();
  const createSuperuserUserMutation = useCreateSuperuserUser();
  const createOrganizationMutation = useCreateOrganization();
  const initializePermissionsMutation = useInitializePermissions();
  const initializeConfigurationsMutation = useInitializeConfigurations();
  const markSetupCompleteMutation = useMarkSetupComplete();
  const runSetupMutation = useRunSetup();

  // Form states
  const [superuserForm, setSuperuserForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [organizationForm, setOrganizationForm] = useState({
    organisation_name: "",
    organisation_code: "",
    description: "",
  });

  // Setup page is accessible without authentication - it's for initial one-time setup

  // Auto-refresh requirements after mutations complete
  // We rely on the requirements endpoint to provide all status information

  // Check requirements status - relies entirely on the requirements endpoint
  // The backend should return all necessary information since we can't access authenticated endpoints
  const checkRequirements = () => {
    if (!requirements) {
      // Return default empty state if requirements haven't loaded yet
      return {
        superuserRole: {
          exists: false,
          hasUsers: false,
        },
        organization: {
          exists: false,
        },
        permissions: {
          exists: false,
          count: 0,
        },
        configurations: {
          exists: false,
          count: 0,
        },
      };
    }

    // Use data directly from requirements endpoint
    // Backend should provide all necessary information:
    // - superuser_role.exists: boolean
    // - superuser_role.has_users: boolean
    // - organization.exists: boolean
    // - permissions.exists: boolean
    // - permissions.count: number
    // - configurations.exists: boolean
    // - configurations.count: number
    return {
      superuserRole: {
        exists: requirements.superuser_role?.exists === true || false,
        hasUsers: requirements.superuser_role?.has_users === true || false,
      },
      organization: {
        exists: requirements.organization?.exists === true || false,
      },
      permissions: {
        exists: requirements.permissions?.exists === true || false,
        count: requirements.permissions?.count || 0,
      },
      configurations: {
        exists: requirements.configurations?.exists === true || false,
        count: requirements.configurations?.count || 0,
      },
    };
  };

  const requirementsStatus = checkRequirements() || {
    superuserRole: { exists: false, hasUsers: false },
    organization: { exists: false },
    permissions: { exists: false, count: 0 },
    configurations: { exists: false, count: 0 },
  };

  // Show loading state if requirements are being checked
  if (requirementsLoading && !requirements) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking setup requirements...</p>
        </div>
      </div>
    );
  }

  // Steps configuration
  const steps = [
    {
      id: "superuser-role",
      title: "Superuser Role",
      description: "Create a superuser role for system administration",
      icon: Shield,
      action: async () => {
        try {
          await createSuperuserRoleMutation.mutateAsync();
          // Small delay to ensure backend has processed
          setTimeout(() => {
            refetchRequirements();
          }, 500);
        } catch (error) {
          // Error is already handled by the mutation
          console.error("Failed to create superuser role:", error);
        }
      },
      isComplete: requirementsStatus?.superuserRole?.exists || false,
      isLoading: createSuperuserRoleMutation.isPending,
    },
    {
      id: "superuser-user",
      title: "Superuser Account",
      description: "Create the first superuser account",
      icon: User,
      action: async () => {
        if (!superuserForm.email || !superuserForm.username || !superuserForm.password) {
          toast.error("Please fill in all required fields");
          return;
        }
        if (superuserForm.password !== superuserForm.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        try {
          await createSuperuserUserMutation.mutateAsync({
            email: superuserForm.email,
            username: superuserForm.username,
            password: superuserForm.password,
            first_name: superuserForm.firstName,
            last_name: superuserForm.lastName,
            is_superuser: true,
          });
          // Small delay to ensure backend has processed
          setTimeout(() => {
            refetchRequirements();
          }, 500);
        } catch (error) {
          // Error is already handled by the mutation
          console.error("Failed to create superuser user:", error);
        }
      },
      isComplete: requirementsStatus?.superuserRole?.hasUsers || false,
      isLoading: createSuperuserUserMutation.isPending,
      requiresForm: true,
    },
    {
      id: "organization",
      title: "Organization",
      description: "Create your organization",
      icon: Building2,
      action: async () => {
        if (!organizationForm.organisation_name || !organizationForm.organisation_code) {
          toast.error("Organization name and code are required");
          return;
        }
        try {
          await createOrganizationMutation.mutateAsync(organizationForm);
          // Small delay to ensure backend has processed
          setTimeout(() => {
            refetchRequirements();
          }, 500);
        } catch (error) {
          // Error is already handled by the mutation
          console.error("Failed to create organization:", error);
        }
      },
      isComplete: requirementsStatus?.organization?.exists || false,
      isLoading: createOrganizationMutation.isPending,
      requiresForm: true,
    },
    {
      id: "permissions",
      title: "Permissions",
      description: "Initialize system permissions",
      icon: Key,
      action: async () => {
        try {
          await initializePermissionsMutation.mutateAsync();
          // Small delay to ensure backend has processed
          setTimeout(() => {
            refetchRequirements();
          }, 500);
        } catch (error) {
          // Error is already handled by the mutation
          console.error("Failed to initialize permissions:", error);
        }
      },
      isComplete: requirementsStatus?.permissions?.exists || false,
      isLoading: initializePermissionsMutation.isPending,
    },
    {
      id: "configurations",
      title: "Configurations",
      description: "Initialize system configurations",
      icon: Settings,
      action: async () => {
        try {
          await initializeConfigurationsMutation.mutateAsync();
          // Small delay to ensure backend has processed
          setTimeout(() => {
            refetchRequirements();
          }, 500);
        } catch (error) {
          // Error is already handled by the mutation
          console.error("Failed to initialize configurations:", error);
        }
      },
      isComplete: requirementsStatus?.configurations?.exists || false,
      isLoading: initializeConfigurationsMutation.isPending,
    },
  ];

  const allStepsComplete = steps.every((step) => step.isComplete);

  // Check if setup is complete based on:
  // 1. Backend setup status (if available)
  // 2. All requirements being met (superuser role with users, organization, permissions, configurations)
  const isSetupComplete =
    setupStatus?.is_complete === true ||
    (requirementsStatus?.superuserRole?.exists === true &&
      requirementsStatus?.superuserRole?.hasUsers === true &&
      requirementsStatus?.organization?.exists === true &&
      requirementsStatus?.permissions?.exists === true &&
      requirementsStatus?.configurations?.exists === true);

  // Handle complete setup
  const handleCompleteSetup = async () => {
    if (!allStepsComplete) {
      toast.error("Please complete all setup steps first");
      return;
    }

    try {
      setIsRunningSetup(true);
      await markSetupCompleteMutation.mutateAsync();
      toast.success("Setup completed successfully!", {
        description: "Your organization is now ready to use. Please configure your SendGrid and Twilio credentials to enable email and SMS notifications.",
        duration: 5000,
        action: {
          label: "Configure Now",
          onClick: () => router.push("/admin/configuration?tab=integration"),
        },
      });
      setTimeout(() => {
        router.push("/admin/configuration?tab=integration");
      }, 2000);
    } catch (error) {
      console.error("Failed to complete setup:", error);
    } finally {
      setIsRunningSetup(false);
    }
  };

  // Handle run all setup
  const handleRunAllSetup = async () => {
    try {
      setIsRunningSetup(true);
      await runSetupMutation.mutateAsync({
        superuser: superuserForm,
        organization: organizationForm,
      });
      toast.success("Setup completed successfully!", {
        description: "Your organization has been initialized. Please configure your SendGrid and Twilio credentials to enable email and SMS notifications.",
        duration: 5000,
        action: {
          label: "Configure Now",
          onClick: () => router.push("/admin/configuration?tab=integration"),
        },
      });
      setTimeout(() => {
        router.push("/admin/configuration?tab=integration");
      }, 2000);
    } catch (error) {
      console.error("Failed to run setup:", error);
    } finally {
      setIsRunningSetup(false);
    }
  };

  const currentStepData = steps[currentStep];

  if (statusLoading || requirementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading setup status...</p>
        </div>
      </div>
    );
  }

  // Show setup complete view if everything is already set up (unless user wants to review)
  if (isSetupComplete && !showSetupWizard) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-500/10 border-2 border-green-500">
                <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Setup Complete</h1>
            <p className="text-muted-foreground">
              Your organization has been successfully configured and is ready to use
            </p>
            {setupStatus?.completed_at && (
              <p className="text-sm text-muted-foreground">
                Completed on {new Date(setupStatus.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Status</CardTitle>
              <CardDescription>All required components have been configured</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-green-500/50 bg-green-500/5"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white">
                        <Check className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{step.title}</h3>
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/50">
                            Complete
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.id === "permissions" && requirementsStatus?.permissions?.count > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {requirementsStatus.permissions.count} permissions configured
                          </p>
                        )}
                        {step.id === "configurations" && requirementsStatus?.configurations?.count > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {requirementsStatus.configurations.count} configurations configured
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/admin")}
              className="flex-1 sm:flex-initial h-12 min-h-[48px]"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setShowSetupWizard(true);
                setCurrentStep(0);
                // Force refetch to see current status
                refetchRequirements();
              }}
              variant="outline"
              className="flex-1 sm:flex-initial h-12 min-h-[48px]"
              size="lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              Review Setup
            </Button>
          </div>

          {/* Additional Info */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Need to reconfigure something?</p>
                <p className="text-xs text-muted-foreground">
                  You can review individual setup steps or make changes through the respective management pages.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Organization Setup</h1>
          </div>
          <p className="text-muted-foreground">
            {isSetupComplete
              ? "Review or modify your organization setup configuration"
              : "Complete the setup process to initialize your organization and start using the system"}
          </p>
          {isSetupComplete && (
            <Button
              onClick={() => setShowSetupWizard(false)}
              variant="ghost"
              size="sm"
              className="mt-2 h-10 min-h-[40px]"
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Status View
            </Button>
          )}
        </div>

        {/* Progress Overview */}
        <Card className="w-full">
          <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-lg md:text-xl">Setup Progress</CardTitle>
            <CardDescription className="text-sm">Complete all steps to finish the setup</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="space-y-3 md:space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isPast = index < currentStep || step.isComplete;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-colors w-full ${isActive
                      ? "border-primary bg-primary/5"
                      : isPast
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-border"
                      }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${step.isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {step.isComplete ? (
                        <Check className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <Icon className="h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm md:text-base">{step.title}</h3>
                        {step.isComplete && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/50 text-xs">
                            Complete
                          </Badge>
                        )}
                        {step.isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Card */}
        {currentStepData && (
          <Card className="w-full">
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <div className="flex items-center gap-2">
                <currentStepData.icon className="h-4 w-4 md:h-5 md:w-5" />
                <CardTitle className="text-lg md:text-xl">{currentStepData.title}</CardTitle>
              </div>
              <CardDescription className="text-sm">{currentStepData.description}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
              {currentStepData.id === "superuser-user" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={superuserForm.email}
                        onChange={(e) =>
                          setSuperuserForm({ ...superuserForm, email: e.target.value })
                        }
                        disabled={currentStepData.isComplete || currentStepData.isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        placeholder="admin"
                        value={superuserForm.username}
                        onChange={(e) =>
                          setSuperuserForm({ ...superuserForm, username: e.target.value })
                        }
                        disabled={currentStepData.isComplete || currentStepData.isLoading}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={superuserForm.firstName}
                        onChange={(e) =>
                          setSuperuserForm({ ...superuserForm, firstName: e.target.value })
                        }
                        disabled={currentStepData.isComplete || currentStepData.isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={superuserForm.lastName}
                        onChange={(e) =>
                          setSuperuserForm({ ...superuserForm, lastName: e.target.value })
                        }
                        disabled={currentStepData.isComplete || currentStepData.isLoading}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={superuserForm.password}
                        onChange={(e) =>
                          setSuperuserForm({ ...superuserForm, password: e.target.value })
                        }
                        disabled={currentStepData.isComplete || currentStepData.isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={superuserForm.confirmPassword}
                        onChange={(e) =>
                          setSuperuserForm({ ...superuserForm, confirmPassword: e.target.value })
                        }
                        disabled={currentStepData.isComplete || currentStepData.isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStepData.id === "organization" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      placeholder="Acme Corporation"
                      value={organizationForm.organisation_name}
                      onChange={(e) =>
                        setOrganizationForm({
                          ...organizationForm,
                          organisation_name: e.target.value,
                        })
                      }
                      disabled={currentStepData.isComplete || currentStepData.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgCode">Organization Code *</Label>
                    <Input
                      id="orgCode"
                      placeholder="ACME"
                      value={organizationForm.organisation_code}
                      onChange={(e) =>
                        setOrganizationForm({
                          ...organizationForm,
                          organisation_code: e.target.value.toUpperCase(),
                        })
                      }
                      disabled={currentStepData.isComplete || currentStepData.isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgDescription">Description</Label>
                    <Textarea
                      id="orgDescription"
                      placeholder="Organization description..."
                      value={organizationForm.description}
                      onChange={(e) =>
                        setOrganizationForm({
                          ...organizationForm,
                          description: e.target.value,
                        })
                      }
                      disabled={currentStepData.isComplete || currentStepData.isLoading}
                    />
                  </div>
                </div>
              )}

              {!currentStepData.requiresForm && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.id === "permissions" &&
                      `This will create all necessary system permissions. ${requirementsStatus?.permissions?.count || 0} permissions currently exist.`}
                    {currentStepData.id === "configurations" &&
                      `This will create all necessary system configurations. ${requirementsStatus?.configurations?.count || 0} configurations currently exist.`}
                    {currentStepData.id === "superuser-role" &&
                      "This will create the superuser role with full system access."}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {!currentStepData.isComplete && (
                  <Button
                    onClick={currentStepData.action}
                    disabled={currentStepData.isLoading}
                    className="flex-1 h-12 min-h-[48px]"
                  >
                    {currentStepData.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {currentStepData.id === "superuser-role" && "Create Superuser Role"}
                        {currentStepData.id === "superuser-user" && "Create Superuser Account"}
                        {currentStepData.id === "organization" && "Create Organization"}
                        {currentStepData.id === "permissions" && "Initialize Permissions"}
                        {currentStepData.id === "configurations" && "Initialize Configurations"}
                      </>
                    )}
                  </Button>
                )}
                {currentStepData.isComplete && (
                  <div className="flex items-center gap-2 text-green-600 flex-1 justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Step completed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2 md:gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="h-12 min-h-[48px] flex-1 md:flex-initial"
          >
            Previous
          </Button>
          <div className="flex gap-2 flex-1 md:flex-initial">
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="h-12 min-h-[48px]"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                {allStepsComplete ? (
                  <Button
                    onClick={handleCompleteSetup}
                    disabled={isRunningSetup || markSetupCompleteMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 h-12 min-h-[48px]"
                  >
                    {isRunningSetup || markSetupCompleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Complete all steps to finish setup</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Setup Option */}
        {!allStepsComplete && (
          <Card className="border-dashed w-full">
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-lg md:text-xl">Quick Setup</CardTitle>
              <CardDescription className="text-sm">
                Run all setup steps automatically (requires all forms to be filled)
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <Button
                onClick={handleRunAllSetup}
                disabled={
                  isRunningSetup ||
                  runSetupMutation.isPending ||
                  !superuserForm.email ||
                  !superuserForm.username ||
                  !superuserForm.password ||
                  !organizationForm.organisation_name ||
                  !organizationForm.organisation_code
                }
                variant="outline"
                className="w-full h-12 min-h-[48px]"
              >
                {isRunningSetup || runSetupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Setup...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Complete Setup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Setup page doesn't require authentication - it's for initial one-time setup
export default SetupPage;





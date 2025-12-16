"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ArrowRight,
  Stethoscope,
  User,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const SetupCustomFieldsPage = () => {
  // Permission checks
  const { hasPermission } = usePermissionsCheck();
  const canCreateCustomField = hasPermission("custom_field:create");
  const handleCreateExample = () => {
    toast.success("Healthcare Staff Example created successfully!", {
      description:
        "Personal Details, Security Details, Contact Details, Accreditations, and Recruitment sections have been created.",
    });
  };

  const handleCreateSimple = () => {
    toast.success("Simple Example created successfully!", {
      description:
        "Basic Personal Details section with common fields has been created.",
    });
  };

  const HealthcareTags = [
    "Personal Details",
    "Security Details",
    "Contact Details",
    "Accreditations",
    "Recruitment",
  ];

  const SimpleTags = ["Name", "Email", "Phone", "Address", "Date of Birth"];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Quick Setup
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Setup Custom Fields
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create example custom fields for your organisation with our
            pre-built templates
          </p>
        </div>

        {/* Main Cards Section */}
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Healthcare Staff Example Card */}
          <Card className="bg-blue-500/10 transition-all duration-300 group shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 group-hover:scale-105 transition-transform duration-300">
                    <Stethoscope className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl font-bold text-foreground">
                        Healthcare Staff Example
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 border-blue-200"
                      >
                        Professional
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Creates comprehensive sections for Personal Details,
                      Security Details, Contact Details, Accreditations, and
                      Recruitment with industry-specific fields.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {HealthcareTags.map((tag, index) => (
                        <Badge
                          key={index}
                          className="text-xs text-foreground bg-foreground/10"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {canCreateCustomField && (
                  <Button
                    onClick={handleCreateExample}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                  >
                    Create Example
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Simple Example Card */}
          <Card className="bg-green-500/10 transition-all duration-300 group shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl font-bold text-foreground">
                        Simple Example
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 border-green-200"
                      >
                        Basic
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Creates a basic Personal Details section with common
                      fields perfect for getting started quickly.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {SimpleTags.map((tag, index) => (
                        <Badge
                          key={index}
                          className="text-xs text-foreground bg-foreground/10"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {canCreateCustomField && (
                  <Button
                    onClick={handleCreateSimple}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                  >
                    Create Simple
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Next Steps Card */}
          <Card className="border-0 shadow-lg bg-card backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 shadow-lg">
                  <Settings className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-foreground mb-4">
                    Next Steps
                  </CardTitle>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-card/60 rounded-xl border border-foreground/10">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 shadow-sm">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-foreground font-medium">
                        Click one of the setup buttons above to create your
                        custom fields
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-card/60 rounded-xl border border-foreground/10">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 shadow-sm">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-foreground font-medium">
                        Go to your{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Profile page
                        </Button>{" "}
                        to see the custom fields in action
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-card/60 rounded-xl border border-foreground/10">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 shadow-sm">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-foreground font-medium">
                        Use the{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Custom Fields Admin
                        </Button>{" "}
                        to manage and customize them further
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SetupCustomFieldsPage;

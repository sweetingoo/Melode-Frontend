"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceSection } from "@/components/ComplianceSection";
import EntityCustomFieldsForm from "@/components/EntityCustomFieldsForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { useUser } from "@/hooks/useUsers";

export default function ComplianceMonitoringUserPage() {
  const params = useParams();
  const router = useRouter();
  const userSlug = params.userSlug;
  const [activeTab, setActiveTab] = useState("compliance");

  // Fetch user data - useUser already includes roles in the response
  const { data: userData, isLoading: userLoading } = useUser(userSlug);
  const availableRoles = userData?.roles || [];

  if (userLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading user data...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The user you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push("/admin/compliance-monitoring")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Compliance Monitoring
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/compliance-monitoring")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              {userData.display_name || userData.email || "User"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Compliance and additional information
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="additional">Additional Information</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceSection
            entityType="user"
            entitySlug={userSlug}
            roleSlug={null}
            availableRoles={availableRoles}
            isAdmin={true}
            canUpload={true}
          />
        </TabsContent>

        <TabsContent value="additional" className="space-y-6">
          <EntityCustomFieldsForm
            entityType="user"
            entitySlug={userSlug}
            entityId={userData.id}
            showTitle={true}
            title="Additional Information"
            description="View and manage additional information for this user"
            readOnly={false}
            showSaveButton={true}
            saveButtonText="Save Changes"
            showComplianceFields={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

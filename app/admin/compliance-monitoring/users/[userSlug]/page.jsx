"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ComplianceMonitoringUserPage() {
  const params = useParams();
  const router = useRouter();
  const userSlug = params.userSlug;

  useEffect(() => {
    // Redirect to people-management page with the same user slug and compliance tab
    router.replace(`/admin/people-management/${userSlug}?tab=compliance`);
  }, [userSlug, router]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Redirecting...</span>
      </div>
    </div>
  );
}

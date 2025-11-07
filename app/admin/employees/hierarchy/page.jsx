"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHierarchyImage } from "@/hooks/useEmployees";
import { Loader2, AlertCircle, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

const HierarchyPage = () => {
  const {
    data: imageUrl,
    isLoading,
    error,
    refetch,
  } = useHierarchyImage();

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = "organizational-hierarchy.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Hierarchy chart downloaded");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Organizational Chart
            </h1>
            <p className="text-muted-foreground mt-1">
              View the organizational hierarchy structure.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Organizational Chart
            </h1>
            <p className="text-muted-foreground mt-1">
              View the organizational hierarchy structure.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load hierarchy chart
              </h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the organizational hierarchy. Please
                try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organizational Chart
          </h1>
          <p className="text-muted-foreground mt-1">
            View the organizational hierarchy structure.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Hierarchy Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Organizational Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {imageUrl ? (
            <div className="w-full overflow-auto bg-muted/50 rounded-lg p-4">
              <img
                src={imageUrl}
                alt="Organizational Hierarchy"
                className="w-full h-auto max-w-full"
                style={{ maxHeight: "80vh" }}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No hierarchy chart available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HierarchyPage;


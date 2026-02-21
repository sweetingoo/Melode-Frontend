"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function PublicEntrySubmittedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h1 className="text-2xl font-semibold">Thank you</h1>
          <p className="text-muted-foreground">
            Your response has been submitted successfully.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const FormSubmittedPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const submissionId = searchParams.get("submission_id");

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Form Submitted Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Thank you for your submission. Your form has been received and will be processed.
          </p>
          {submissionId && (
            <p className="text-sm text-muted-foreground">
              Submission ID: <span className="font-mono">{submissionId}</span>
            </p>
          )}
          <div className="pt-4">
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormSubmittedPage;


"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Image, Settings, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PDFGenerationDocumentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">PDF Generation</h1>
        <p className="text-muted-foreground text-lg">
          Generate PDF documents from forms, submissions, and other content with organisation branding
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Overview</CardTitle>
          </div>
          <CardDescription>
            Melode includes comprehensive PDF generation capabilities for forms, submissions, and documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The PDF generation feature allows you to create professional PDF documents from forms, form submissions,
            and other content. PDFs are generated client-side in the browser using advanced PDF libraries,
            ensuring fast generation and consistent formatting.
          </p>
          <p>
            All generated PDFs automatically include your organisation's logo in the header, providing a
            professional branded appearance. The logo is positioned in the top-right corner of each page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Form PDF Generation:</strong> Generate PDFs from form definitions and submissions
            </li>
            <li>
              <strong>Automatic Logo Inclusion:</strong> Organisation logo automatically added to all PDFs
            </li>
            <li>
              <strong>Multi-Page Support:</strong> Automatically handles multi-page documents with consistent
              formatting
            </li>
            <li>
              <strong>Field Preservation:</strong> All form fields, values, and formatting are preserved in
              the PDF
            </li>
            <li>
              <strong>Signature Support:</strong> Digital signatures are included in generated PDFs
            </li>
            <li>
              <strong>File Attachments:</strong> File uploads and attachments are properly represented in PDFs
            </li>
            <li>
              <strong>Client-Side Generation:</strong> PDFs are generated in the browser for fast processing
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where PDFs Are Generated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            PDFs can be generated from several places in the application:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Form Submissions:</strong> From individual form submission pages, you can download
              a PDF of the submission
            </li>
            <li>
              <strong>Form Definitions:</strong> From form detail pages, you can generate a PDF of the
              form structure
            </li>
            <li>
              <strong>Fillable Forms:</strong> Generate fillable PDF forms that can be completed offline
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisation Logo in PDFs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            All generated PDFs automatically include your organisation's logo in the top-right corner of
            each page. The logo is retrieved from your organisation's branding configuration.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Logo Configuration
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  To configure your organisation logo, go to <strong>Configuration → Organisation Settings</strong>
                  and upload your logo. The logo will automatically appear in all generated PDFs.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p><strong>Logo Specifications:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
              <li>Maximum width: 2.5 inches (63.5mm)</li>
              <li>Maximum height: 0.75 inches (19.05mm)</li>
              <li>Position: Top-right corner of each page</li>
              <li>Aspect ratio is maintained automatically</li>
              <li>Supported formats: PNG, JPEG, SVG</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generating a PDF from a Form Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To generate a PDF from a form submission:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the form submission you want to export</li>
            <li>Click the <Badge variant="outline" className="gap-1"><Download className="h-3 w-3" /> Download PDF</Badge> button</li>
            <li>The PDF will be generated and automatically downloaded to your device</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            The PDF will include all form fields, submitted values, file attachments (as references),
            and signatures, along with your organisation logo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generating a PDF from a Form Definition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To generate a PDF of a form definition (the form structure itself):</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the form detail page</li>
            <li>Click the <Badge variant="outline" className="gap-1"><Download className="h-3 w-3" /> Download PDF</Badge> button</li>
            <li>The PDF will be generated showing the form structure and field definitions</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            This is useful for documentation purposes or for printing form templates.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-2">PDF Libraries Used:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li><strong>jsPDF:</strong> Primary PDF generation library for form submissions</li>
                <li><strong>pdf-lib:</strong> Used for fillable form generation and advanced PDF manipulation</li>
                <li><strong>html2canvas:</strong> Converts HTML content to images for PDF embedding</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2">Logo Loading:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>Logo is fetched from organisation branding configuration</li>
                <li>Supports both direct URLs and file references</li>
                <li>Automatically handles S3 signed URLs with CORS</li>
                <li>Falls back gracefully if logo cannot be loaded</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2">CORS Configuration:</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Important: S3 CORS Configuration
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  For the organisation logo to appear in PDFs, your S3 bucket must have CORS configured
                  to allow requests from your frontend domain. If the logo doesn't appear, check your
                  S3 bucket CORS settings.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Logo Not Appearing in PDFs
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Check that an organisation logo is configured in Organisation Settings</li>
                <li>Verify S3 bucket CORS configuration allows your frontend domain</li>
                <li>Check browser console for CORS errors</li>
                <li>Ensure the logo file is accessible and not expired (for signed URLs)</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                PDF Generation Fails
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Check browser console for error messages</li>
                <li>Ensure you have sufficient browser memory for large forms</li>
                <li>Try refreshing the page and generating again</li>
                <li>Check that all form data is valid and complete</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Best Practices
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Use high-quality logo images (PNG or SVG recommended)</li>
                <li>Keep logo file sizes reasonable for faster PDF generation</li>
                <li>Test PDF generation with various form sizes</li>
                <li>Ensure logo aspect ratio works well at the specified size constraints</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Related Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Forms Management:</strong> PDFs are generated from forms and submissions.
              See the <a href="/docs/forms" className="text-primary hover:underline">Forms Management</a> documentation.
            </li>
            <li>
              <strong>Organisation Settings:</strong> Configure your organisation logo in
              <a href="/docs/configuration" className="text-primary hover:underline"> Configuration</a>.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

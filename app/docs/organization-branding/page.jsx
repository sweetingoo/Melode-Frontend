"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Image, Upload, Trash2, Settings, FileText, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function OrganizationBrandingDocumentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Organisation Branding</h1>
        <p className="text-muted-foreground text-lg">
          Customise your organisation's branding with logos and visual identity
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <CardTitle>Overview</CardTitle>
          </div>
          <CardDescription>
            Configure your organisation's visual identity with logos and branding elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Organisation branding allows you to customise your organisation's visual identity throughout
            the application. You can upload logos that appear in generated PDFs, emails, and other
            branded communications.
          </p>
          <p>
            Branding configuration is managed through the Organisation Settings page, accessible to
            superusers only. Changes to branding are immediately reflected across the application.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Organisation Logo:</strong> Main logo used in PDFs and documents
            </li>
            <li>
              <strong>Email Header Logo:</strong> Logo displayed in email communications
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessing Branding Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            To access organisation branding settings:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the Admin panel</li>
            <li>Go to <strong>Configuration</strong> (superuser only)</li>
            <li>Click on the <strong>Organisation</strong> tab</li>
            <li>Scroll to the <strong>Branding Configuration</strong> section</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Only users with superuser role can access and modify organisation branding settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploading Organisation Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To upload or update your organisation logo:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to Configuration → Organisation Settings</li>
            <li>Find the <strong>Organisation Logo</strong> section</li>
            <li>Click the <Badge variant="outline" className="gap-1"><Upload className="h-3 w-3" /> Upload Logo</Badge> button</li>
            <li>Select an image file from your device</li>
            <li>The logo will be uploaded and displayed immediately</li>
            <li>Click <strong>Save</strong> to persist the changes</li>
          </ol>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              📄 Logo Usage
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The organisation logo automatically appears in all generated PDFs in the top-right corner
              of each page. The logo is automatically sized to fit within 2.5 inches width and 0.75 inches
              height while maintaining aspect ratio.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploading Email Header Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To upload or update your email header logo:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to Configuration → Organisation Settings</li>
            <li>Find the <strong>Email Header Logo</strong> section</li>
            <li>Click the <Badge variant="outline" className="gap-1"><Upload className="h-3 w-3" /> Upload Logo</Badge> button</li>
            <li>Select an image file from your device</li>
            <li>The logo will be uploaded and displayed immediately</li>
            <li>Click <strong>Save</strong> to persist the changes</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            The email header logo is used in email communications sent by the system.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-2">Supported Formats:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>PNG (recommended for logos with transparency)</li>
                <li>JPEG (good for photographs)</li>
                <li>SVG (scalable vector graphics, best quality)</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2">Recommended Specifications:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li><strong>Organisation Logo:</strong> Minimum 200x60 pixels, maximum 2.5" x 0.75" at 300 DPI</li>
                <li><strong>Email Header Logo:</strong> Minimum 200x60 pixels, recommended 300x90 pixels</li>
                <li>File size: Keep under 2MB for optimal performance</li>
                <li>Transparent background (PNG) recommended for best appearance</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2">Best Practices:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>Use high-resolution images for crisp display</li>
                <li>Optimise file size to reduce upload and loading times</li>
                <li>Test logo appearance in both light and dark themes</li>
                <li>Ensure logo is readable at small sizes</li>
                <li>Use SVG format when possible for best quality at all sizes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Removing Logos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To remove a logo:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to Configuration → Organisation Settings</li>
            <li>Find the logo you want to remove</li>
            <li>Click the <Badge variant="destructive" className="gap-1"><Trash2 className="h-3 w-3" /> Remove</Badge> button</li>
            <li>Confirm the removal</li>
            <li>Click <strong>Save</strong> to persist the changes</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Removing a logo will stop it from appearing in PDFs and emails. You can always upload a
            new logo later.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo Preview and URL Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            When you upload a logo, the system stores it as a file reference and automatically manages
            the signed URLs needed to display it. The logo preview updates automatically, and URLs are
            refreshed before they expire to ensure continuous display.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Automatic URL Management
            </p>
            <p className="text-sm text-green-700 dark:text-green-700">
              The system automatically refreshes S3 signed URLs before they expire, ensuring your logos
              always display correctly without manual intervention.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            The logo URL is displayed next to the preview (truncated for readability) and is managed
            automatically by the system. You don't need to manually update URLs.
          </p>
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
                <li>Verify the logo is uploaded and saved in Organisation Settings</li>
                <li>Check S3 bucket CORS configuration allows your frontend domain</li>
                <li>Check browser console for CORS or loading errors</li>
                <li>Ensure the logo file format is supported (PNG, JPEG, SVG)</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Logo Preview Not Loading
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Check that the file was uploaded successfully</li>
                <li>Verify file format is supported</li>
                <li>Try refreshing the page</li>
                <li>Check browser console for errors</li>
                <li>Ensure S3 bucket permissions are correct</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Best Practices
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Use SVG format for best quality and scalability</li>
                <li>Optimise file sizes for faster loading</li>
                <li>Test logo appearance in both light and dark themes</li>
                <li>Ensure logo works well at small sizes (for PDF headers)</li>
                <li>Keep backup copies of your logo files</li>
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
              <strong>PDF Generation:</strong> Organisation logo appears in all generated PDFs.
              See the <a href="/docs/pdf-generation" className="text-primary hover:underline">PDF Generation</a> documentation.
            </li>
            <li>
              <strong>Configuration:</strong> Branding is part of organisation configuration.
              See the <a href="/docs/configuration" className="text-primary hover:underline">Configuration</a> documentation.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

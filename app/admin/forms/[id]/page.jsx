"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Edit, FileText, CheckCircle, XCircle, Share2, Copy, Check, Tag, FileDown } from "lucide-react";
import { useForm } from "@/hooks/useForms";
import { useRoles } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { useActiveFormTypes } from "@/hooks/useFormTypes";
import { format } from "date-fns";
import ResourceAuditLogs from "@/components/ResourceAuditLogs";
import { Shield, Users, User } from "lucide-react";
import { generateSlug } from "@/utils/slug";
import { toast } from "sonner";
import { generateFormPDFFromData } from "@/utils/pdf-generator";

const FormDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params.id;
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: form, isLoading, error } = useForm(formId);
  const { data: rolesData } = useRoles();
  const { data: usersResponse } = useUsers();
  const { data: activeFormTypes = [] } = useActiveFormTypes();
  const roles = rolesData || [];
  const users = usersResponse?.users || usersResponse || [];

  // Generate share link using slug
  const getShareLink = () => {
    if (!form?.form_title) return '';
    const slug = generateSlug(form.form_title);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/forms/${slug}/submit`;
  };

  // Copy share link to clipboard
  const handleCopyShareLink = async () => {
    const shareLink = getShareLink();
    if (!shareLink) {
      toast.error("Unable to generate share link");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!form) {
      toast.error("Unable to generate PDF", {
        description: "Form data is missing",
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const filename = `form-${form.form_name || form.id}-${form.form_title || "definition"}.pdf`.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      
      console.log("Starting PDF generation...", { filename, formId: form.id });
      
      await generateFormPDFFromData({
        form,
        roles,
        users,
        filename,
        onDownloadComplete: () => {
          console.log("PDF download triggered");
          toast.success("PDF downloaded successfully");
          setIsGeneratingPDF(false);
        },
      });

      console.log("PDF generation completed");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", {
        description: error.message || "An error occurred while generating the PDF",
      });
      setIsGeneratingPDF(false);
    }
  };

  // Get form type info from active form types
  const getFormTypeInfo = (typeName) => {
    const formType = activeFormTypes.find((ft) => ft.name === typeName);
    if (formType) {
      return {
        displayName: formType.display_name || formType.name,
        icon: formType.icon || "",
        color: formType.color || "#6b7280",
      };
    }
    // Fallback for unknown types
    return {
      displayName: typeName ? typeName.charAt(0).toUpperCase() + typeName.slice(1) : "Unknown",
      icon: "",
      color: "#6b7280",
    };
  };

  const getFormTypeColor = (type) => {
    const formType = activeFormTypes.find((ft) => ft.name === type);
    if (formType && formType.color) {
      // Use the color from the form type
      const hex = formType.color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `bg-[${formType.color}]/10 text-[${formType.color}] border-[${formType.color}]/20`;
    }
    // Fallback colors
    switch (type) {
      case "handover":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "assessment":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "incident":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "maintenance":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "general":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="space-y-4">
        <Link href="/admin/forms">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Form Not Found</h3>
            <p className="text-muted-foreground">
              The form you're looking for doesn't exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{form.form_title || form.form_name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Form Details</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </Button>
          <Link href={`/admin/forms/${formId}/submit`} className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Submit Form</span>
              <span className="sm:hidden">Submit</span>
            </Button>
          </Link>
          <Link href={`/admin/forms/${formId}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Form Information */}
          <Card>
            <CardHeader>
              <CardTitle>Form Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{form.form_description || "No description provided"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form Type</label>
                  <div className="mt-1">
                    {form.form_type ? (
                      <Badge className={getFormTypeColor(form.form_type)}>
                        {(() => {
                          const typeInfo = getFormTypeInfo(form.form_type);
                          return (
                            <>
                              {typeInfo.icon && <span className="mr-1">{typeInfo.icon}</span>}
                              {typeInfo.displayName}
                            </>
                          );
                        })()}
                      </Badge>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {form.is_active ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Template</label>
                  <div className="mt-1">
                    {form.is_template ? (
                      <Badge variant="outline">Yes</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form Name</label>
                  <p className="mt-1 text-sm font-mono">{form.form_name}</p>
                </div>
              </div>

              {/* Assignment Information */}
              {(form.assigned_to_role_id || (form.assigned_user_ids && form.assigned_user_ids.length > 0)) && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Assignment</label>
                  {form.assigned_to_role_id ? (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Assigned to role: {roles.find(r => r.id === form.assigned_to_role_id)?.display_name || roles.find(r => r.id === form.assigned_to_role_id)?.name || `Role #${form.assigned_to_role_id}`}
                      </span>
                    </div>
                  ) : form.assigned_user_ids && form.assigned_user_ids.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Assigned to {form.assigned_user_ids.length} user{form.assigned_user_ids.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {form.create_individual_assignments ? (
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                          Individual Assignments
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                          Collaborative Assignment
                        </Badge>
                      )}
                      <div className="mt-2 space-y-1">
                        {form.assigned_user_ids.slice(0, 5).map((userId) => {
                          const user = users.find(u => u.id === userId);
                          return (
                            <div key={userId} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {user?.display_name ||
                                (user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "") ||
                                user?.email ||
                                `User #${userId}`}
                            </div>
                          );
                        })}
                        {form.assigned_user_ids.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            +{form.assigned_user_ids.length - 5} more user{form.assigned_user_ids.length - 5 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Fields */}
          {form.form_fields && (
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
              </CardHeader>
              <CardContent>
                {form.form_fields.fields && form.form_fields.fields.length > 0 ? (
                  <div className="space-y-4">
                    {form.form_fields.fields.map((field, index) => (
                      <div key={field.field_id || index} className="p-4 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.label || field.field_name}</span>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <Badge variant="outline">{field.field_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Field ID: {field.field_id || field.field_name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No fields defined</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Configuration */}
          {form.form_config && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.form_config.categories && form.form_config.categories.length > 0 ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {form.form_config.categories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      These categories can be assigned to submissions when reviewing them.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Categories
                    </label>
                    <p className="text-sm text-muted-foreground">
                      No categories configured for this form.
                    </p>
                  </div>
                )}
                {form.form_config.statuses && form.form_config.statuses.length > 0 ? (
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Custom Status Options
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {form.form_config.statuses.map((status, index) => (
                        <Badge key={index} variant="secondary">
                          {status}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      These custom statuses will be used for submissions. If not specified, default statuses (draft, submitted, reviewed, approved, rejected) are used.
                    </p>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Status Options
                    </label>
                    <p className="text-sm text-muted-foreground">
                      No custom statuses configured. Default statuses (draft, submitted, reviewed, approved, rejected) will be used.
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Full Configuration (JSON)
                  </label>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(form.form_config, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/forms/${formId}/submit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Form
                </Button>
              </Link>
              <Link href={`/admin/forms/${formId}/submissions`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Submissions
                </Button>
              </Link>
              <Link href={`/admin/forms/${formId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Form
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Share Link */}
          {form?.form_title && (
            <Card>
              <CardHeader>
                <CardTitle>Share Form</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Share this public link to allow anyone to submit the form (no login required)
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-muted rounded-md border text-sm font-mono truncate">
                    {getShareLink()}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyShareLink}
                    title="Copy share link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleCopyShareLink}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {copied ? "Copied!" : "Copy Share Link"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <label className="text-muted-foreground">Created</label>
                <p>
                  {form.created_at
                    ? format(new Date(form.created_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-muted-foreground">Last Updated</label>
                <p>
                  {form.updated_at
                    ? format(new Date(form.updated_at), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity History */}
      <ResourceAuditLogs
        resource="form"
        resourceId={formId}
        title="Activity History"
      />
    </div>
  );
};

export default FormDetailPage;


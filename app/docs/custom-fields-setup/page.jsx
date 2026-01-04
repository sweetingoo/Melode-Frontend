"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Plus, Settings, Sparkles, User, Stethoscope, Check, ArrowRight } from "lucide-react";
import { FormMockup, DialogMockup, FormButton } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CustomFieldsSetupDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Custom Fields Setup</h1>
        <p className="text-lg text-muted-foreground">
          Quick setup guide for creating custom fields
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding custom fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Custom Fields?</h3>
              <p className="text-sm text-muted-foreground">
                Custom fields allow you to extend the system with additional data fields specific to your organisation's needs.
                You can add custom fields to users, tasks, forms, assets, and other entities. This enables you to track
                information that's unique to your business processes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Custom Fields Setup</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Quick Setup" in the sidebar under Custom Fields</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/setup-custom-fields</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">custom_fields:create</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-green-600" />
              <CardTitle>Quick Setup Interface</CardTitle>
            </div>
            <CardDescription>Understanding the setup page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Setup Page Layout</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The Quick Setup page provides pre-configured templates to quickly create custom field sections:
              </p>
              <FormMockup
                title="Custom Fields Quick Setup"
                description="Choose a template to quickly set up custom fields"
              >
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Zap className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="text-xl font-semibold mb-2">Quick Setup Custom Fields</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a template below to automatically create custom field sections
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Stethoscope className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg mb-1">Healthcare Staff Example</h4>
                            <p className="text-sm text-muted-foreground">
                              Comprehensive example for healthcare organisations
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">Includes sections:</p>
                        <div className="flex flex-wrap gap-2">
                          {["Personal Details", "Security Details", "Contact Details", "Accreditations", "Recruitment"].map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <FormButton className="w-full" icon={ArrowRight}>
                        Create Healthcare Staff Example
                      </FormButton>
                    </div>

                    <div className="p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg mb-1">Simple Example</h4>
                            <p className="text-sm text-muted-foreground">
                              Basic personal details for any organisation
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">Includes fields:</p>
                        <div className="flex flex-wrap gap-2">
                          {["Name", "Email", "Phone", "Address", "Date of Birth"].map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <FormButton className="w-full" icon={ArrowRight}>
                        Create Simple Example
                      </FormButton>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">How Quick Setup Works</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Choose a template that matches your needs</li>
                <li>Click the "Create" button for your chosen template</li>
                <li>The system automatically creates all sections and fields</li>
                <li>You'll receive a success notification</li>
                <li>Navigate to "Manage Fields" to customise the created fields</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-blue-600" />
              <CardTitle>Healthcare Staff Example</CardTitle>
            </div>
            <CardDescription>What gets created with this template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Sections Created</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This template creates the following sections with pre-configured fields:
              </p>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Personal Details</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Full Name, Date of Birth, Gender, National ID</li>
                    <li>• Emergency Contact Information</li>
                    <li>• Blood Type, Allergies</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Security Details</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Security Clearance Level</li>
                    <li>• Background Check Status</li>
                    <li>• Access Card Number</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Contact Details</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Primary Phone, Secondary Phone</li>
                    <li>• Home Address, Mailing Address</li>
                    <li>• Emergency Contact</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Accreditations</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• License Numbers</li>
                    <li>• Certification Details</li>
                    <li>• Expiration Dates</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Recruitment</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Hire Date, Start Date</li>
                    <li>• Interview Notes</li>
                    <li>• Reference Information</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">After Creation</h3>
              <p className="text-sm text-muted-foreground">
                Once created, you can customise these fields in the "Manage Fields" page. You can edit field names,
                add validation rules, change field types, reorder fields, and add or remove fields as needed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-green-600" />
              <CardTitle>Simple Example</CardTitle>
            </div>
            <CardDescription>What gets created with this template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Fields Created</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This template creates a basic "Personal Details" section with common fields:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Name:</strong> Full name field (text)</li>
                <li><strong>Email:</strong> Email address field (email)</li>
                <li><strong>Phone:</strong> Phone number field (phone)</li>
                <li><strong>Address:</strong> Address field (textarea)</li>
                <li><strong>Date of Birth:</strong> Date field (date)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Use Cases</h3>
              <p className="text-sm text-muted-foreground">
                The Simple Example is perfect for organisations that need basic additional information without
                complex requirements. It's a good starting point that you can expand later.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-purple-600" />
              <CardTitle>Next Steps After Setup</CardTitle>
            </div>
            <CardDescription>What to do after creating custom fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">After Creating Custom Fields</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Review Created Fields:</strong> Go to "Manage Fields" to see all created sections and fields</li>
                <li><strong>Customize Fields:</strong> Edit field names, descriptions, and properties to match your needs</li>
                <li><strong>Add Validation:</strong> Set up validation rules (required fields, min/max values, etc.)</li>
                <li><strong>Reorder Fields:</strong> Arrange fields in the order you want them to appear</li>
                <li><strong>Add More Fields:</strong> Create additional fields that weren't in the template</li>
                <li><strong>Test Fields:</strong> Go to a user profile or relevant entity to see the fields in action</li>
                <li><strong>Configure Permissions:</strong> Ensure users have permission to view/edit custom fields</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Customization Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                In the "Manage Fields" page, you can:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Edit field labels and descriptions</li>
                <li>Change field types (text, number, date, select, etc.)</li>
                <li>Add or remove fields from sections</li>
                <li>Set fields as required or optional</li>
                <li>Configure field options (for select/radio fields)</li>
                <li>Set validation rules</li>
                <li>Reorder fields within sections</li>
                <li>Delete fields that aren't needed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

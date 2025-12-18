"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Edit, Send, List, Eye, CheckCircle } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect, FormCheckbox } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function FormsDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Forms Management</h1>
        <p className="text-lg text-muted-foreground">
          Create, manage, and submit custom forms for data collection and workflows
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the forms management system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Forms Management?</h3>
              <p className="text-sm text-muted-foreground">
                Forms Management allows you to create custom forms for data collection, surveys, requests,
                approvals, and other workflows. Forms can include various field types and can be submitted
                by users throughout your organisation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Forms</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Forms" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/forms</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">forms:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Forms</CardTitle>
            </div>
            <CardDescription>How to create a new form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Form Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Form Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Create Form" or "New Form" button on the Forms page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Basic Form Information</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Create Form" to open the dialog. Enter basic information about your form:
                  </p>
                  <DialogMockup
                    title="Create New Form"
                    description="Create a custom form for data collection and workflows"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Form
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Form Title"
                        type="text"
                        placeholder="Incident Report"
                        required
                        value="Incident Report"
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="What is this form for?"
                        rows={3}
                        value="Report workplace incidents, accidents, or safety concerns"
                      />
                      <FormSelect
                        label="Category"
                        placeholder="Select category"
                        value="safety"
                        options={[
                          { value: "safety", label: "Safety" },
                          { value: "hr", label: "HR" },
                          { value: "operations", label: "Operations" },
                        ]}
                      />
                    </div>
                  </DialogMockup>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Add Form Fields</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add fields to your form. Here's an example of a completed form:
                  </p>
                  <FormMockup
                    title="Example: Incident Report Form"
                    description="A sample form showing different field types"
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Incident Date"
                        type="date"
                        required
                        value="2024-01-15"
                      />
                      <FormField
                        label="Location"
                        type="text"
                        placeholder="Where did the incident occur?"
                        required
                        value="Main Office - Floor 3"
                      />
                      <FormSelect
                        label="Incident Type"
                        placeholder="Select type"
                        required
                        value="injury"
                        options={[
                          { value: "injury", label: "Injury" },
                          { value: "property", label: "Property Damage" },
                          { value: "near-miss", label: "Near Miss" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Describe what happened..."
                        required
                        rows={5}
                        value="Employee slipped on wet floor in the break room. No serious injury, but reported for safety review."
                      />
                      <FormField
                        label="Witnesses"
                        type="text"
                        placeholder="Names of witnesses (if any)"
                        value="Sarah Williams, James Taylor"
                      />
                      <div className="flex items-center space-x-2">
                        <FormCheckbox label="Immediate action required" checked={false} />
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">File Attachments</p>
                        <div className="p-3 border border-dashed rounded-md bg-muted/50">
                          <p className="text-xs text-muted-foreground">Click to upload photos or documents</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <FormButton variant="outline" className="flex-1">
                          Save Draft
                        </FormButton>
                        <FormButton className="flex-1" icon={Send}>
                          Submit Form
                        </FormButton>
                      </div>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Form Field Types</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Available field types include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Text:</strong> Single-line text input</li>
                <li><strong>Textarea:</strong> Multi-line text input</li>
                <li><strong>Number:</strong> Numeric input with validation</li>
                <li><strong>Email:</strong> Email address input</li>
                <li><strong>Date:</strong> Date picker</li>
                <li><strong>Select:</strong> Dropdown menu</li>
                <li><strong>Radio:</strong> Radio button group</li>
                <li><strong>Checkbox:</strong> Checkbox group</li>
                <li><strong>File Upload:</strong> File attachment field</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-purple-600" />
              <CardTitle>Editing Forms</CardTitle>
            </div>
            <CardDescription>How to modify existing forms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How to Edit a Form</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to the Forms page</li>
                <li>Find the form you want to edit</li>
                <li>Click "Edit" or the form title</li>
                <li>Make your changes:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Modify form title, description, or settings</li>
                    <li>Add, remove, or reorder fields</li>
                    <li>Update field properties and validation</li>
                    <li>Change access permissions</li>
                  </ul>
                </li>
                <li>Click "Save" to apply changes</li>
              </ol>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> Editing a form that already has submissions may affect existing data.
                Be careful when modifying field types or removing required fields. Consider creating a new
                version of the form instead.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Send className="h-6 w-6 text-orange-600" />
              <CardTitle>Submitting Forms</CardTitle>
            </div>
            <CardDescription>How to fill out and submit forms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How to Submit a Form</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to the form you want to submit</li>
                <li>Click "Submit" or "Fill Out Form"</li>
                <li>Fill in all required fields (marked with an asterisk *)</li>
                <li>Upload any required files or attachments</li>
                <li>Review your entries for accuracy</li>
                <li>Click "Submit" to send the form</li>
                <li>You'll receive a confirmation message</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Form Validation</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Forms validate your input before submission:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Required fields must be filled</li>
                <li>Email fields must contain valid email addresses</li>
                <li>Number fields must contain valid numbers</li>
                <li>Date fields must contain valid dates</li>
                <li>File uploads must meet size and type requirements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Saving Drafts</h3>
              <p className="text-sm text-muted-foreground">
                Some forms allow you to save drafts so you can complete them later.
                Look for a "Save Draft" button if this feature is available.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <List className="h-6 w-6 text-indigo-600" />
              <CardTitle>Viewing Submissions</CardTitle>
            </div>
            <CardDescription>How to view and manage form submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Accessing Submissions</h3>
              <p className="text-sm text-muted-foreground mb-2">
                To view form submissions:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to the Forms page</li>
                <li>Click on a form to view its details</li>
                <li>Click "Submissions" to see all submissions for that form</li>
                <li>You can filter and search submissions</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Submission Details</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Each submission shows:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Submitted by (user name and email)</li>
                <li>Submission date and time</li>
                <li>All form field responses</li>
                <li>Attached files</li>
                <li>Submission status (if applicable)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Exporting Submissions</h3>
              <p className="text-sm text-muted-foreground">
                You can export form submissions to CSV or Excel format for analysis or record-keeping.
                Look for the "Export" button on the submissions page.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-teal-600" />
              <CardTitle>Form Access & Permissions</CardTitle>
            </div>
            <CardDescription>Understanding who can view and submit forms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Viewing Forms</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Form visibility can be controlled by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Public:</strong> Visible to all users</li>
                <li><strong>Department:</strong> Visible only to specific departments</li>
                <li><strong>Role-based:</strong> Visible to users with specific roles</li>
                <li><strong>Permission-based:</strong> Requires specific permissions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Submitting Forms</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Submission permissions can be set to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Allow multiple submissions per user</li>
                <li>Allow only one submission per user</li>
                <li>Restrict submissions to specific users or roles</li>
                <li>Require approval before submission is accepted</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Viewing Submissions</h3>
              <p className="text-sm text-muted-foreground">
                Who can view submissions depends on form settings:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Form creators can typically view all submissions</li>
                <li>Users can usually view their own submissions</li>
                <li>Administrators may have access to all submissions</li>
                <li>Department managers may see submissions from their department</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Notifications</CardTitle>
            <CardDescription>Staying informed about form activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Submission Notifications</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  You may receive notifications when:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>A new form submission is received (if you're the form creator)</li>
                  <li>Your form submission is approved or rejected</li>
                  <li>A form you submitted is updated or commented on</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Form creators and administrators can configure email notifications to be sent
                  when forms are submitted, approved, or require action.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Templates</CardTitle>
            <CardDescription>Using and creating form templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Using Templates</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Form templates can help you create forms quickly:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Start from a pre-built template</li>
                  <li>Customize the template to fit your needs</li>
                  <li>Save time by reusing common form structures</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Creating Templates</h3>
                <p className="text-sm text-muted-foreground">
                  If you frequently create similar forms, you can save a form as a template
                  for future use. This is especially useful for recurring forms like incident reports,
                  requests, or surveys.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


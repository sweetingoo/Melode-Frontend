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
                        value="Person slipped on wet floor in the break room. No serious injury, but reported for safety review."
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
              
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Input Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Text:</strong> Single-line text input</li>
                    <li><strong>Textarea:</strong> Multi-line text input</li>
                    <li><strong>Number:</strong> Numeric input with validation</li>
                    <li><strong>Email:</strong> Email address input with validation</li>
                    <li><strong>Phone:</strong> Phone number input</li>
                    <li><strong>Date:</strong> Date picker</li>
                    <li><strong>Date & Time:</strong> Date and time picker</li>
                    <li><strong>Boolean/Checkbox:</strong> Single checkbox for true/false values</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Selection Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Select (Single):</strong> Dropdown menu for single selection</li>
                    <li><strong>Multi-Select:</strong> Dropdown menu for multiple selections</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Special Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>File Upload:</strong> File attachment field with type and size validation</li>
                    <li><strong>Signature:</strong> Canvas-based signature capture field</li>
                    <li><strong>JSON:</strong> JSON data input field</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Display-Only Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Text Block:</strong> Rich text content with formatting (bold, italic, lists, links, images, etc.)</li>
                    <li><strong>Image Block:</strong> Display images with optional alt text (supports upload or direct URL)</li>
                    <li><strong>Line Break:</strong> Visual separator between fields</li>
                    <li><strong>Page Break:</strong> Splits form into multiple pages</li>
                    <li><strong>Download Link:</strong> Link to downloadable files</li>
                  </ul>
                </div>
              </div>
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
                <li>Navigate to the form you want to submit (via admin panel or public link)</li>
                <li>Click "Submit" or "Fill Out Form"</li>
                <li>Fill in all required fields (marked with an asterisk *)</li>
                <li>Upload any required files or attachments</li>
                <li>For multi-page forms, use "Next" and "Previous" buttons to navigate</li>
                <li>Review your entries for accuracy</li>
                <li>Click "Submit" to send the form</li>
                <li>You'll receive a confirmation message</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Public Form Submissions</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Forms can be submitted by both logged-in users and anonymous users:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Public Forms:</strong> Accessible via slug-based URLs (e.g., <code className="bg-muted px-1 py-0.5 rounded">/forms/form-title-slug/submit</code>)</li>
                <li><strong>No Login Required:</strong> Anonymous users can submit forms without authentication</li>
                <li><strong>Logged-in Users:</strong> Submissions are tracked with user information</li>
                <li><strong>Anonymous Users:</strong> Submissions are recorded without user association</li>
                <li>Form creators can share public links from the form details page</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Multi-Page Forms</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Forms can be split into multiple pages using Page Break fields:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use "Page Break" field type to create new pages</li>
                <li>Navigate between pages using "Next" and "Previous" buttons</li>
                <li>Progress indicator shows completion percentage</li>
                <li>All pages must be completed before submission</li>
                <li>Form progress is saved in browser session storage</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Form Validation</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Forms validate your input before submission. Field-level validation options include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Required Fields:</strong> Must be filled before submission</li>
                <li><strong>Min/Max Values:</strong> For number fields (e.g., min: 0, max: 100)</li>
                <li><strong>Min/Max Length:</strong> For text fields (e.g., min: 5 characters, max: 255)</li>
                <li><strong>Pattern Validation:</strong> Custom regex patterns (e.g., phone numbers, postal codes)</li>
                <li><strong>Email Validation:</strong> Automatic validation for email format</li>
                <li><strong>Date Validation:</strong> Ensures valid date format</li>
                <li><strong>File Type Restrictions:</strong> Limit allowed file types (MIME types or extensions)</li>
                <li><strong>File Size Limits:</strong> Maximum file size in MB</li>
                <li><strong>JSON Schema:</strong> For JSON fields, validate against a JSON schema</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Saving Drafts</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Forms can be configured to allow draft saving:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Look for a "Save Draft" button if the form allows drafts</li>
                <li>Drafts are saved to the server and can be resumed later</li>
                <li>Form progress is automatically saved in browser session storage</li>
                <li>If you reload the page, your progress is restored from session storage</li>
                <li>Draft submissions can be completed and submitted later</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Signature Fields</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Forms can include signature fields for digital signatures:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click on the signature field to open the signature canvas</li>
                <li>Draw your signature using mouse or touch</li>
                <li>Clear and redraw if needed</li>
                <li>Save the signature to the form</li>
                <li>Signatures are captured as image data</li>
              </ul>
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
              <h3 className="font-semibold mb-2">Public Form Access</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Forms can be made publicly accessible:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Slug-based URLs:</strong> Forms use URL-friendly slugs derived from form titles</li>
                <li><strong>Public Links:</strong> Share links are available on the form details page</li>
                <li><strong>No Authentication Required:</strong> Anonymous users can access and submit public forms</li>
                <li><strong>Full-width Layout:</strong> Public forms use a full-width layout for better user experience</li>
                <li><strong>Example URL:</strong> <code className="bg-muted px-1 py-0.5 rounded">/forms/my-form-title/submit</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Viewing Forms</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Form visibility can be controlled by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Public:</strong> Accessible via public slug-based URLs</li>
                <li><strong>Admin Panel:</strong> Accessible via admin interface for logged-in users</li>
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
                <li>Allow anonymous submissions (no login required)</li>
                <li>Track logged-in user submissions with user information</li>
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
                <li>Anonymous submissions are visible to form creators and administrators</li>
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
            <CardTitle>Advanced Form Features</CardTitle>
            <CardDescription>Advanced features for building complex forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Rich Text Editor</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Text Block fields support a rich text editor with the following features:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Text formatting: Bold, Italic, Underline, Strikethrough</li>
                  <li>Headings: H1, H2, H3</li>
                  <li>Lists: Ordered and unordered lists</li>
                  <li>Text alignment: Left, Center, Right</li>
                  <li>Text color and styling</li>
                  <li>Links: Add hyperlinks to text</li>
                  <li>Images: Upload images or use direct URLs</li>
                  <li>Image resizing: Drag corners to resize images</li>
                  <li>Inline images: Text can flow around images (left, right, center, inline)</li>
                  <li>Undo/Redo functionality</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Conditional Field Visibility</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Fields can be shown or hidden based on other field values:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Set a field to depend on another field's value</li>
                  <li>Show when conditions: equals, not equals, contains, is empty, is not empty</li>
                  <li>Specify the value that triggers visibility</li>
                  <li>Useful for creating dynamic, context-aware forms</li>
                  <li>Example: Show "Emergency Contact" field only when "Has Emergency Contact" is checked</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Drag-and-Drop Field Reordering</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Fields can be reordered easily:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click and drag the grip handle (⋮⋮) on any field</li>
                  <li>Drop the field in the desired position</li>
                  <li>Field order is saved automatically</li>
                  <li>Works for all field types including display-only fields</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Auto-Generated Field IDs</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Field IDs are automatically generated:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Field IDs are generated from field labels automatically</li>
                  <li>Display-only fields get random IDs with type prefixes (txt_, img_, line_, etc.)</li>
                  <li>IDs are sanitized to contain only alphanumeric characters, hyphens, and underscores</li>
                  <li>Form names are auto-generated from form titles</li>
                  <li>IDs can be manually edited if needed</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Image Blocks</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Image blocks support multiple input methods:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Upload images directly from your device</li>
                  <li>Use direct image URLs</li>
                  <li>Add alt text for accessibility</li>
                  <li>Images are validated for type and size</li>
                  <li>Supported formats: JPEG, PNG, GIF, WebP, SVG</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">File Upload Validation</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  File upload fields support comprehensive validation:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>File type restrictions (MIME types or extensions)</li>
                  <li>Maximum file size limits (in MB)</li>
                  <li>Single or multiple file uploads</li>
                  <li>File expiry dates for temporary files</li>
                  <li>Predefined categories: Images, Documents, Archives, Videos</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Form Templates</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Form templates can help you create forms quickly:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Start from a pre-built template</li>
                  <li>Customize the template to fit your needs</li>
                  <li>Save time by reusing common form structures</li>
                  <li>Mark forms as templates for reuse</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


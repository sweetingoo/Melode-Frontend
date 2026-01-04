"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, FolderTree, FileText, Users, Search, History, Share2, Lock, Plus, Edit, Trash2, Eye } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect } from "@/components/docs/FormMockup";

export default function DocumentsDocumentation() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Documents Management</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Create, organise, and manage documents with hierarchical categories, permissions, and sharing capabilities.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Categories and Subcategories
            </CardTitle>
            <CardDescription>
              Organise documents using a hierarchical category structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating Categories</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Navigate to <code className="bg-muted px-1 rounded">/admin/documents</code></li>
                <li>Click "Create Category" to add a new category</li>
                <li>Set a name, description, and optional parent category</li>
                <li>Configure permissions or inherit from parent category</li>
              </ul>
              <DialogMockup
                title="Create Category"
                description="Add a new document category"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">Cancel</FormButton>
                    <FormButton size="sm" icon={Plus}>Create Category</FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <FormField
                    label="Category Name"
                    type="text"
                    placeholder="e.g., Policies, Handbooks"
                    required
                    value="Employee Policies"
                  />
                  <FormTextarea
                    label="Description"
                    placeholder="Optional description..."
                    rows={3}
                    value="Company policies and procedures for employees"
                  />
                  <FormSelect
                    label="Parent Category"
                    placeholder="Select parent (optional)"
                    value=""
                    options={[
                      { value: "", label: "None (Top Level)" },
                      { value: "1", label: "Company Documents" },
                    ]}
                  />
                </div>
              </DialogMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Permission Inheritance</h3>
              <p className="text-sm text-muted-foreground">
                Subcategories automatically inherit permissions from their parent category by default.
                You can override inherited permissions for specific categories when needed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Category Management</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Edit category details and permissions</li>
                <li>Delete categories (only if they have no documents)</li>
                <li>Reorder categories by dragging in the tree view</li>
              </ul>
              <FormMockup title="Category Tree View" description="Hierarchical category structure">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                    <FolderTree className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Company Documents</span>
                    <Badge variant="outline" className="ml-auto">5 docs</Badge>
                  </div>
                  <div className="ml-6 space-y-1 border-l-2 border-muted pl-2">
                    <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                      <FolderTree className="h-4 w-4 text-primary" />
                      <span className="text-sm">Employee Policies</span>
                      <Badge variant="outline" className="ml-auto text-xs">3 docs</Badge>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                      <FolderTree className="h-4 w-4 text-primary" />
                      <span className="text-sm">Handbooks</span>
                      <Badge variant="outline" className="ml-auto text-xs">2 docs</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                    <FolderTree className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Safety Procedures</span>
                    <Badge variant="outline" className="ml-auto">8 docs</Badge>
                  </div>
                </div>
              </FormMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Creating and Editing Documents
            </CardTitle>
            <CardDescription>
              Use the rich text editor to create comprehensive documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating Documents</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Click "Create Document" in the documents page</li>
                <li>Enter a title (slug is auto-generated)</li>
                <li>Select a category for the document</li>
                <li>Use the rich text editor to add content with formatting, images, and links</li>
                <li>Set document status: Draft, Published, or Archived</li>
                <li>Attach files using the file upload component</li>
              </ul>
              <FormMockup title="Document Editor" description="Create and edit documents">
                <div className="space-y-4">
                  <FormField
                    label="Document Title"
                    type="text"
                    placeholder="Enter document title"
                    required
                    value="Employee Handbook 2024"
                  />
                  <FormSelect
                    label="Category"
                    value="handbooks"
                    options={[
                      { value: "policies", label: "Employee Policies" },
                      { value: "handbooks", label: "Handbooks" },
                      { value: "safety", label: "Safety Procedures" },
                    ]}
                  />
                  <div className="border rounded-lg p-3 bg-muted/20 min-h-[200px]">
                    <div className="text-sm space-y-2">
                      <h2 className="text-lg font-bold">Welcome to Our Company</h2>
                      <p>This handbook contains important information about...</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Company policies</li>
                        <li>Employee benefits</li>
                        <li>Code of conduct</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <FormSelect
                      label="Status"
                      value="published"
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "published", label: "Published" },
                        { value: "archived", label: "Archived" },
                      ]}
                    />
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Rich Text Editor Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Text formatting: bold, italic, underline, strikethrough</li>
                <li>Headings, paragraphs, lists (ordered and unordered)</li>
                <li>Text alignment and colors</li>
                <li>Image insertion with upload and resizing capabilities</li>
                <li>Link creation and management</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Document Status</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Draft</strong>: Work in progress, not visible to others</li>
                <li><strong>Published</strong>: Visible to users with appropriate permissions</li>
                <li><strong>Archived</strong>: Retained but hidden from normal view</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Permissions and Access Control
            </CardTitle>
            <CardDescription>
              Control who can view, edit, and manage documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Category Permissions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Set read, write, and delete permissions per category</li>
                <li>Permissions apply to all documents in that category</li>
                <li>Subcategories inherit permissions unless explicitly overridden</li>
                <li>Manage permissions via the category permissions dialog</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Document Access</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Documents are accessible based on category permissions</li>
                <li>Document authors always have full access to their documents</li>
                <li>Superusers can access and manage all documents</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Document Sharing
            </CardTitle>
            <CardDescription>
              Share documents with specific users or make them publicly accessible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Sharing with Users</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Share" on any document</li>
                <li>Select specific users to share with</li>
                <li>Shared users receive notifications</li>
                <li>Remove sharing access at any time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Public Documents</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Make documents public to allow all authenticated users to view them</li>
                <li>Public documents are accessible via <code className="bg-muted px-1 rounded">/documents/[id]</code></li>
                <li>All users receive notifications when a document is made public</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Functionality
            </CardTitle>
            <CardDescription>
              Find documents quickly using full-text search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Searching Documents</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Use the search bar in the documents list</li>
                <li>Search queries match document titles and content</li>
                <li>Filter results by category and status</li>
                <li>Search respects user permissions - only shows accessible documents</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Search Filters</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Filter by category using the category tree</li>
                <li>Filter by status: Draft, Published, or Archived</li>
                <li>Combine search term with filters for precise results</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit History
            </CardTitle>
            <CardDescription>
              Track document access and modifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Access Logging</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Every document view is automatically logged</li>
                <li>View audit logs on the document detail page</li>
                <li>See who accessed the document and when</li>
                <li>Track access count and last accessed timestamp</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Required Permissions
            </CardTitle>
            <CardDescription>
              Permissions needed to use document management features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Document Permissions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><code className="bg-muted px-1 rounded">document:read</code> - View documents</li>
                <li><code className="bg-muted px-1 rounded">document:create</code> - Create new documents</li>
                <li><code className="bg-muted px-1 rounded">document:update</code> - Edit existing documents</li>
                <li><code className="bg-muted px-1 rounded">document:delete</code> - Delete documents</li>
                <li><code className="bg-muted px-1 rounded">document:search</code> - Search documents</li>
                <li><code className="bg-muted px-1 rounded">document_category:manage</code> - Manage categories</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


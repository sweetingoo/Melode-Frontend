"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Images, Plus, Edit, Search, MapPin, Tag, UserPlus, Trash2, Eye, Settings, Package, TrendingUp, AlertCircle, CheckCircle, Filter, X, User, Shield, Wrench } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AssetsDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Assets Management</h1>
        <p className="text-lg text-muted-foreground">
          Track and manage organisational assets, equipment, and resources
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Images className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding asset management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Assets?</h3>
              <p className="text-sm text-muted-foreground">
                Assets represent physical items owned by your organisation, such as equipment, vehicles,
                tools, furniture, technology devices, or any other valuable resources. The Assets Management
                system helps you track, assign, maintain, and manage all organisational assets.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Assets</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Assets" in the sidebar under Organisation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/assets</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">assets:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Images className="h-6 w-6 text-blue-600" />
              <CardTitle>Assets Dashboard</CardTitle>
            </div>
            <CardDescription>Understanding the assets interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Assets Management Page</h3>
              <p className="text-sm text-muted-foreground mb-4">
                When you navigate to Assets, you'll see a comprehensive dashboard:
              </p>
              <FormMockup
                title="Assets Management Dashboard"
                description="Overview of all assets with statistics and search"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Assets Management</h3>
                    <FormButton icon={Plus}>
                      Create Asset
                    </FormButton>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by asset number, name, or category..."
                      className="w-full px-10 py-2 border rounded-md text-sm"
                      disabled
                      value=""
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Package className="h-4 w-4 text-blue-600" />
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      </div>
                      <h4 className="text-xl font-bold">245</h4>
                      <p className="text-xs text-muted-foreground">Total Assets</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <h4 className="text-xl font-bold">198</h4>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <h4 className="text-xl font-bold">156</h4>
                      <p className="text-xs text-muted-foreground">Assigned</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      </div>
                      <h4 className="text-xl font-bold">12</h4>
                      <p className="text-xs text-muted-foreground">Maintenance Needed</p>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Filters</span>
                      </div>
                      <button className="text-xs text-muted-foreground" disabled>Clear All</button>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FormSelect
                          placeholder="All Locations"
                          value=""
                          options={[
                            { value: "all", label: "All Locations" },
                            { value: "office-1", label: "Main Office" },
                            { value: "warehouse", label: "Warehouse A" },
                          ]}
                          className="flex-1"
                        />
                        <FormButton variant="outline" size="sm">
                          <X className="h-3 w-3" />
                        </FormButton>
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Assets</CardTitle>
            </div>
            <CardDescription>How to create a new asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Asset Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Asset Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Create Asset" button in the top right corner of the Assets page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Asset Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The create asset form includes comprehensive fields:
                  </p>
                  <DialogMockup
                    title="Create New Asset"
                    description="Add a new asset to your organisation"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Asset
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Asset Number"
                        type="text"
                        placeholder="ASSET-001"
                        required
                        value="ASSET-001"
                      />
                      <FormField
                        label="Asset Name"
                        type="text"
                        placeholder="Laptop Computer"
                        required
                        value="Dell Latitude 7420"
                      />
                      <FormSelect
                        label="Category"
                        placeholder="Select category"
                        value="equipment"
                        options={[
                          { value: "equipment", label: "Equipment" },
                          { value: "vehicle", label: "Vehicle" },
                          { value: "furniture", label: "Furniture" },
                          { value: "technology", label: "Technology" },
                          { value: "tool", label: "Tool" },
                        ]}
                      />
                      <FormSelect
                        label="Status"
                        placeholder="Select status"
                        value="active"
                        options={[
                          { value: "active", label: "Active" },
                          { value: "inactive", label: "Inactive" },
                          { value: "maintenance", label: "In Maintenance" },
                          { value: "retired", label: "Retired" },
                        ]}
                      />
                      <FormSelect
                        label="Location"
                        placeholder="Select location"
                        value="office-1"
                        options={[
                          { value: "office-1", label: "Main Office" },
                          { value: "warehouse", label: "Warehouse A" },
                        ]}
                      />
                      <FormField
                        label="Purchase Date"
                        type="date"
                        value="2024-01-15"
                      />
                      <FormField
                        label="Purchase Price"
                        type="number"
                        placeholder="0.00"
                        value="1299.99"
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Asset description..."
                        rows={3}
                        value="Dell Latitude 7420 laptop for office use"
                      />
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-2">File Attachments</p>
                        <div className="p-3 border border-dashed rounded-md bg-background">
                          <p className="text-xs text-muted-foreground">Click to upload photos, documents, or warranty information</p>
                        </div>
                      </div>
                    </div>
                  </DialogMockup>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Required Fields</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Asset Number:</strong> Unique identifier for the asset (required)</li>
                    <li><strong>Asset Name:</strong> Descriptive name of the asset (required)</li>
                    <li><strong>Category:</strong> Asset category for organisation (required)</li>
                    <li><strong>Status:</strong> Current status of the asset (required)</li>
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
              <CardTitle>Editing Assets</CardTitle>
            </div>
            <CardDescription>How to update asset information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Asset Editing</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Find the Asset</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use the search bar or browse the asset list to find the asset you want to edit.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Open Edit Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Edit" button in the actions menu (three dots) next to the asset, or click on the asset row to view details first.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Update Asset Information</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The edit form is pre-filled with current asset data. Update any fields:
                  </p>
                  <DialogMockup
                    title="Edit Asset"
                    description="Update asset information"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Edit}>
                          Save Changes
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Asset Number"
                        type="text"
                        value="ASSET-001"
                        required
                      />
                      <FormField
                        label="Asset Name"
                        type="text"
                        value="Dell Latitude 7420"
                        required
                      />
                      <FormSelect
                        label="Status"
                        value="maintenance"
                        options={[
                          { value: "active", label: "Active" },
                          { value: "inactive", label: "Inactive" },
                          { value: "maintenance", label: "In Maintenance" },
                          { value: "retired", label: "Retired" },
                        ]}
                      />
                      <FormTextarea
                        label="Description"
                        rows={3}
                        value="Dell Latitude 7420 laptop - Currently in maintenance for screen replacement"
                      />
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-blue-600" />
              <CardTitle>Assigning Assets</CardTitle>
            </div>
            <CardDescription>How to assign assets to users or roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Asset Assignment</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Select Asset to Assign</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Find the asset in the list and click "Assign Asset" from the actions menu.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Choose Assignment Type</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can assign assets to individual users or entire roles:
                  </p>
                  <DialogMockup
                    title="Assign Asset"
                    description="Assign asset to a user or role"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={UserPlus}>
                          Assign Asset
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg mb-4">
                        <p className="text-sm font-semibold mb-1">Asset: ASSET-001 - Dell Latitude 7420</p>
                        <p className="text-xs text-muted-foreground">Currently: Unassigned</p>
                      </div>

                      <div className="flex gap-2 mb-4">
                        <FormButton variant="default" size="sm" className="flex-1">
                          Assign to User
                        </FormButton>
                        <FormButton variant="outline" size="sm" className="flex-1">
                          Assign to Role
                        </FormButton>
                      </div>

                      <FormSelect
                        label="Select User"
                        placeholder="Choose a user"
                        value="user-1"
                        options={[
                          { value: "user-1", label: "John Doe" },
                          { value: "user-2", label: "Jane Smith" },
                          { value: "user-3", label: "Bob Johnson" },
                        ]}
                      />

                      <FormSelect
                        label="Location"
                        placeholder="Select location (optional)"
                        value=""
                        options={[
                          { value: "office-1", label: "Main Office" },
                          { value: "warehouse", label: "Warehouse A" },
                        ]}
                      />

                      <FormTextarea
                        label="Assignment Notes"
                        placeholder="Add any notes about this assignment..."
                        rows={2}
                        value=""
                      />
                    </div>
                  </DialogMockup>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Assignment Options</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Assign to User:</strong> Assign the asset to a specific employee</li>
                    <li><strong>Assign to Role:</strong> Assign the asset to all users with a specific role</li>
                    <li><strong>Location:</strong> Optionally specify where the asset is located</li>
                    <li><strong>Notes:</strong> Add notes about the assignment (e.g., reason, duration)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-orange-600" />
              <CardTitle>Asset Attributes & Sensor Data</CardTitle>
            </div>
            <CardDescription>Managing custom attributes and sensor data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Updating Asset Attributes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Assets can have custom attributes stored as JSON. Click "Update Attributes" from the actions menu:
              </p>
              <DialogMockup
                title="Update Asset Attributes"
                description="Update custom attributes for this asset"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Cancel
                    </FormButton>
                    <FormButton size="sm" icon={Settings}>
                      Update Attributes
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg mb-4">
                    <p className="text-sm font-semibold mb-1">Asset: ASSET-001</p>
                    <p className="text-xs text-muted-foreground">Dell Latitude 7420</p>
                  </div>

                  <FormTextarea
                    label="Attributes (JSON)"
                    placeholder='{"warranty_expires": "2025-12-31", "serial_number": "DL7420-12345"}'
                    rows={6}
                    value='{\n  "warranty_expires": "2025-12-31",\n  "serial_number": "DL7420-12345",\n  "manufacturer": "Dell",\n  "model": "Latitude 7420"\n}'
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter valid JSON format for custom attributes
                  </p>
                </div>
              </DialogMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4">Updating Sensor Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For assets with sensors, you can update sensor readings:
              </p>
              <DialogMockup
                title="Update Sensor Data"
                description="Update sensor data for this asset"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Cancel
                    </FormButton>
                    <FormButton size="sm" icon={Settings}>
                      Update Sensor Data
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg mb-4">
                    <p className="text-sm font-semibold mb-1">Asset: ASSET-002</p>
                    <p className="text-xs text-muted-foreground">HVAC System - Main Office</p>
                  </div>

                  <FormTextarea
                    label="Sensor Data (JSON)"
                    placeholder='{"temperature": 72, "humidity": 45}'
                    rows={6}
                    value='{\n  "temperature": 72.5,\n  "humidity": 45.2,\n  "pressure": 1013.25,\n  "last_reading": "2024-01-15T10:30:00Z"\n}'
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter valid JSON format for sensor readings
                  </p>
                </div>
              </DialogMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-indigo-600" />
              <CardTitle>Viewing Asset Details</CardTitle>
            </div>
            <CardDescription>How to view comprehensive asset information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Asset Detail View</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "View Details" from the actions menu to see complete asset information:
              </p>
              <FormMockup
                title="Asset Details"
                description="Comprehensive view of asset information"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">ASSET-001 - Dell Latitude 7420</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">Active</Badge>
                        <Badge variant="secondary">Technology</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FormButton variant="outline" size="sm" icon={Edit}>
                        Edit
                      </FormButton>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Asset Number</p>
                      <p className="text-sm font-medium">ASSET-001</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="text-sm font-medium">Active</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Category</p>
                      <p className="text-sm font-medium">Technology</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="text-sm font-medium">Main Office</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                      <p className="text-sm font-medium">John Doe</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Purchase Date</p>
                      <p className="text-sm font-medium">Jan 15, 2024</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">Dell Latitude 7420 laptop for office use</p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs font-semibold mb-2">Attachments</p>
                    <div className="space-y-2">
                      <div className="p-2 border rounded flex items-center justify-between">
                        <span className="text-xs">warranty.pdf</span>
                        <FormButton variant="ghost" size="sm">Download</FormButton>
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trash2 className="h-6 w-6 text-red-600" />
              <CardTitle>Deleting Assets</CardTitle>
            </div>
            <CardDescription>How to remove assets from the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Asset Deletion</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Select Asset to Delete</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Find the asset and click "Delete" from the actions menu.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Confirm Deletion</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    A confirmation dialog will appear to prevent accidental deletion:
                  </p>
                  <FormMockup
                    title="Delete Asset Confirmation"
                    description="Confirm asset deletion"
                  >
                    <div className="space-y-4">
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <h4 className="font-semibold text-sm">Are you sure?</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          This action cannot be undone. This will permanently delete:
                        </p>
                        <p className="text-sm font-medium">ASSET-001 - Dell Latitude 7420</p>
                      </div>

                      <div className="flex gap-2">
                        <FormButton variant="outline" className="flex-1">
                          Cancel
                        </FormButton>
                        <FormButton variant="destructive" className="flex-1" icon={Trash2}>
                          Delete Asset
                        </FormButton>
                      </div>
                    </div>
                  </FormMockup>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Warning:</strong> Deleting an asset permanently removes it from the system.
                    Make sure the asset is no longer needed and that you have proper authorization before deleting.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-green-600" />
              <CardTitle>Searching & Filtering Assets</CardTitle>
            </div>
            <CardDescription>How to find specific assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Search Functionality</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use the search bar to find assets by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Asset number</li>
                <li>Asset name</li>
                <li>Category</li>
                <li>Description keywords</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Filter Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Filter assets by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Status:</strong> Active, Inactive, In Maintenance, Retired</li>
                <li><strong>Location:</strong> Filter by physical location</li>
                <li><strong>Category:</strong> Equipment, Vehicle, Furniture, etc.</li>
                <li><strong>Assignment:</strong> Assigned, Unassigned, Assigned to specific user/role</li>
                <li><strong>Maintenance Status:</strong> Show only assets needing maintenance</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-orange-600" />
              <CardTitle>Maintenance Tracking</CardTitle>
            </div>
            <CardDescription>Monitoring assets that need maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Maintenance Needed</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The dashboard shows assets that need maintenance. You can:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>View the maintenance needed count in the statistics card</li>
                <li>Filter assets to show only those needing maintenance</li>
                <li>Update asset status to "In Maintenance" when work begins</li>
                <li>Change status back to "Active" when maintenance is complete</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Maintenance Workflow</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Identify asset needing maintenance</li>
                <li>Update asset status to "In Maintenance"</li>
                <li>Add notes or update attributes with maintenance details</li>
                <li>Complete maintenance work</li>
                <li>Update status back to "Active"</li>
                <li>Update maintenance date in attributes if tracking</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

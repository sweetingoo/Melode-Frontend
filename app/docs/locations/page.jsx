"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plus, Edit, Search, Users, Building2 } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";

export default function LocationsDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Locations</h1>
        <p className="text-lg text-muted-foreground">
          Manage physical locations, sites, and facilities in your organisation
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding location management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Locations?</h3>
              <p className="text-sm text-muted-foreground">
                Locations represent physical places where your organisation operates, such as offices,
                facilities, sites, or any other premises. Locations help
                track where work is performed and organise resources geographically.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Locations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Locations" in the sidebar under Organisation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/locations</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">locations:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 text-green-600" />
              <CardTitle>Adding Locations</CardTitle>
            </div>
            <CardDescription>How to create a new location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Location Creation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Location Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Add Location" or "New Location" button on the Locations page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Location Details</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll see the create location form:
                  </p>
                  <DialogMockup
                    title="Create New Location"
                    description="Add a new location to the system. Fill in all required information."
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Plus}>
                          Create Location
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Location Name"
                        type="text"
                        placeholder="Main Office"
                        icon={MapPin}
                        required
                        value="Main Office"
                      />
                      <FormTextarea
                        label="Description"
                        placeholder="Location description..."
                        rows={3}
                        value="Corporate headquarters and main administrative office"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="Address"
                          type="text"
                          placeholder="123 High Street"
                          value="123 High Street"
                        />
                        <FormField
                          label="City"
                          type="text"
                          placeholder="London"
                          value="London"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="State/Province"
                          type="text"
                          placeholder="Greater London"
                          value="Greater London"
                        />
                        <FormField
                          label="Postal Code"
                          type="text"
                          placeholder="SW1A 1AA"
                          value="SW1A 1AA"
                        />
                      </div>
                      <FormSelect
                        label="Country"
                        placeholder="Select country"
                        value="uk"
                        options={[
                          { value: "uk", label: "United Kingdom" },
                          { value: "ca", label: "Canada" },
                        ]}
                      />
                      <FormSelect
                        label="Type"
                        placeholder="Select location type"
                        value="office"
                        options={[
                          { value: "office", label: "Office" },
                          { value: "facility", label: "Facility" },
                          { value: "site", label: "Site" },
                          { value: "factory", label: "Factory" },
                        ]}
                      />
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Location Details</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Fill in the location details including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Name:</strong> Location name (e.g., "Main Office", "Branch Office")</li>
                <li><strong>Address:</strong> Street address</li>
                <li><strong>City:</strong> City name</li>
                <li><strong>State/Province:</strong> State or province</li>
                <li><strong>Postal Code:</strong> Postal code</li>
                <li><strong>Country:</strong> Country</li>
                <li><strong>Coordinates:</strong> Latitude and longitude (optional, for GPS)</li>
                <li><strong>Description:</strong> Additional details about the location</li>
                <li><strong>Type:</strong> Location type (Office, Facility, Site, etc.)</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Location Types</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Common location types include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Office</li>
                <li>Facility</li>
                <li>Site</li>
                <li>Remote/Home Office</li>
                <li>Branch</li>
                <li>Other (custom types may be available)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-purple-600" />
              <CardTitle>Editing Locations</CardTitle>
            </div>
            <CardDescription>How to update location information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">How to Edit a Location</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Find the location in the list</li>
                  <li>Click on the location name or "Edit" button</li>
                  <li>Update any information you need to change</li>
                  <li>Click "Save" to apply changes</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What Can Be Edited</h3>
                <p className="text-sm text-muted-foreground">
                  You can typically update all location fields including name, address, coordinates,
                  description, and type. Some system-generated fields may be read-only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-orange-600" />
              <CardTitle>Viewing & Searching Locations</CardTitle>
            </div>
            <CardDescription>Finding and organising locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Location List</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The locations list displays:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Location name</li>
                <li>Address (full or partial)</li>
                <li>Location type</li>
                <li>Number of employees assigned</li>
                <li>Status (Active/Inactive)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Searching Locations</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Search for locations by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Location name</li>
                <li>Address or city</li>
                <li>Location type</li>
                <li>Postal code</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Filtering Locations</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Filter locations by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Location type</li>
                <li>City or region</li>
                <li>Status (Active/Inactive)</li>
                <li>Department (if locations are assigned to departments)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-indigo-600" />
              <CardTitle>Location Details</CardTitle>
            </div>
            <CardDescription>Understanding location information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Location Information</h3>
              <p className="text-sm text-muted-foreground mb-2">
                A location's detailed view includes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Complete address information</li>
                <li>GPS coordinates (if set)</li>
                <li>Location type and description</li>
                <li>Associated departments</li>
                <li>Employees assigned to this location</li>
                <li>Assets at this location</li>
                <li>Recent activity or check-ins</li>
                <li>Custom field values</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Map View</h3>
              <p className="text-sm text-muted-foreground">
                If GPS coordinates are set, locations may be displayed on a map view,
                making it easy to visualize where your organisation operates geographically.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Using Locations</CardTitle>
            <CardDescription>How locations are used throughout the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Check In/Out</h3>
                <p className="text-sm text-muted-foreground">
                  When employees check in, they may be required to select their work location.
                  This helps track where work is being performed.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Task Assignment</h3>
                <p className="text-sm text-muted-foreground">
                  Tasks can be assigned to specific locations, helping organise work by geographic area.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Asset Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Assets can be assigned to locations, making it easy to track where equipment and resources are located.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Reporting</h3>
                <p className="text-sm text-muted-foreground">
                  Location data is used in various reports to analyze work patterns, resource allocation,
                  and operational efficiency by location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Permissions</CardTitle>
            <CardDescription>Understanding location management permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Viewing Locations</h3>
                <p className="text-sm text-muted-foreground">
                  Requires <code className="bg-muted px-1 py-0.5 rounded">locations:read</code> permission.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Creating Locations</h3>
                <p className="text-sm text-muted-foreground">
                  Requires <code className="bg-muted px-1 py-0.5 rounded">locations:create</code> permission.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Editing Locations</h3>
                <p className="text-sm text-muted-foreground">
                  Requires <code className="bg-muted px-1 py-0.5 rounded">locations:update</code> permission.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Deleting Locations</h3>
                <p className="text-sm text-muted-foreground">
                  Requires <code className="bg-muted px-1 py-0.5 rounded">locations:delete</code> permission.
                  Locations with associated employees or assets may not be deletable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


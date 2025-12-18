"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, Edit, Shield, Building2, Plus, Mail, Phone, User, Lock } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function EmployeeManagementDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Employee Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage employee information, assignments, and organisational structure
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding employee management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Employee Management?</h3>
              <p className="text-sm text-muted-foreground">
                Employee Management allows administrators to view, manage, and update employee information,
                including personal details, role assignments, department memberships, and organisational relationships.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Employee Management</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Manage people" in the sidebar under People & Access</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/employee-management</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">users:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-green-600" />
              <CardTitle>Viewing Employees</CardTitle>
            </div>
            <CardDescription>How to find and view employee information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Employee List Interface</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The employee management page shows a list of all users in your organisation:
              </p>
              <FormMockup
                title="Employee Management"
                description="Manage all employees in your organisation"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                        disabled
                        value=""
                      />
                    </div>
                    <FormButton icon={Plus} size="sm">
                      Create User
                    </FormButton>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Alex Brown</h4>
                            <p className="text-xs text-muted-foreground">alex.brown@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Manager</Badge>
                          <Badge className="text-xs bg-green-500">Active</Badge>
                          <button className="p-2 hover:bg-muted rounded-md" disabled>
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Sarah Williams</h4>
                            <p className="text-xs text-muted-foreground">sarah.williams@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Employee</Badge>
                          <Badge className="text-xs bg-green-500">Active</Badge>
                          <button className="p-2 hover:bg-muted rounded-md" disabled>
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Employee List Information</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The employee list displays all users in your organisation with information such as:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Name and email address</li>
                <li>Current role(s)</li>
                <li>Department(s)</li>
                <li>Account status (Active, Inactive, etc.)</li>
                <li>Last login date</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Searching Employees</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use the search functionality to find employees by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Name (first name, last name, or display name)</li>
                <li>Email address</li>
                <li>Employee ID or user ID</li>
                <li>Department</li>
                <li>Role</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-purple-600" />
              <CardTitle>Creating & Editing Employees</CardTitle>
            </div>
            <CardDescription>How to create and update employee details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Create New Employee</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Create User" to open the employee creation form:
              </p>
              <DialogMockup
                title="Create New User"
                description="Add a new employee to your organisation"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Cancel
                    </FormButton>
                    <FormButton size="sm" icon={Plus}>
                      Create User
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="First Name"
                      type="text"
                      placeholder="Alex"
                      icon={User}
                      required
                      value="Alex"
                    />
                    <FormField
                      label="Last Name"
                      type="text"
                      placeholder="Brown"
                      icon={User}
                      required
                      value="Brown"
                    />
                  </div>
                  <FormField
                    label="Email Address"
                    type="email"
                    placeholder="alex.brown@example.com"
                    icon={Mail}
                    required
                    value="alex.brown@example.com"
                  />
                  <FormField
                    label="Phone Number"
                    type="tel"
                    placeholder="+44 20 1234 5678"
                    icon={Phone}
                    value="+44 20 1234 5678"
                  />
                  <FormField
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    icon={Lock}
                    required
                    value="••••••••"
                  />
                  <FormSelect
                    label="Role"
                    placeholder="Select role"
                    value="employee"
                    options={[
                      { value: "employee", label: "Employee" },
                      { value: "manager", label: "Manager" },
                      { value: "admin", label: "Administrator" },
                    ]}
                  />
                </div>
              </DialogMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">How to Edit an Employee</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Find the employee in the list</li>
                <li>Click on their name or the "Edit" button</li>
                <li>Update the information you need to change</li>
                <li>Click "Save" to apply changes</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-600" />
              <CardTitle>Role & Department Assignments</CardTitle>
            </div>
            <CardDescription>Managing employee role and department assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Viewing Assignments</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Each employee's profile shows their current assignments including roles and departments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div >
    </>
  );
}

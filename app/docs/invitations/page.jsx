"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Mail, Users, Clock, CheckCircle, XCircle, Phone, User } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function InvitationsDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Invitations</h1>
        <p className="text-lg text-muted-foreground">
          Invite new users to join your organisation
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the invitation system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Invitations?</h3>
              <p className="text-sm text-muted-foreground">
                The Invitations feature allows administrators to invite new users to join the organisation.
                Invitations are sent via email and contain a link that allows the recipient to create their account
                and set up their profile.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Invitations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Create invitation" in the sidebar under People & Access</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/invitations</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">invitation:create</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-green-600" />
              <CardTitle>Creating Invitations</CardTitle>
            </div>
            <CardDescription>How to invite a new user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Invitation Process</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Create Invitation Dialog</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Create Invitation" or "Invite User" button on the Invitations page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Fill in Invitation Form</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Create Invitation" to open the dialog. You'll see the invitation form with the following fields:
                  </p>
                  <DialogMockup
                    title="Create New Invitation"
                    description="Send an invitation to a new user to join your organisation."
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Mail}>
                          Send Invitation
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Email Address"
                        type="email"
                        placeholder="user@example.com"
                        icon={Mail}
                        required
                        value="alex.brown@example.com"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="First Name"
                          type="text"
                          placeholder="Alex"
                          icon={User}
                          value="Alex"
                        />
                        <FormField
                          label="Last Name"
                          type="text"
                          placeholder="Brown"
                          icon={User}
                          value="Brown"
                        />
                      </div>
                      <FormField
                        label="Phone Number"
                        type="tel"
                        placeholder="+44 20 1234 5678"
                        icon={Phone}
                        value="+44 20 1234 5678"
                      />
                      <FormSelect
                        label="Role"
                        placeholder="Select role (optional)"
                        value="employee"
                        options={[
                          { value: "employee", label: "Employee" },
                          { value: "manager", label: "Manager" },
                          { value: "admin", label: "Administrator" },
                        ]}
                      />
                      <FormField
                        label="Expires In (Days)"
                        type="number"
                        placeholder="7"
                        value="7"
                      />
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Bulk Invitations</h3>
              <p className="text-sm text-muted-foreground">
                Some systems support bulk invitations where you can invite multiple users at once by uploading
                a CSV file with user information or entering multiple email addresses.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              <CardTitle>Managing Invitations</CardTitle>
            </div>
            <CardDescription>Viewing and managing sent invitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Invitation Status</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Invitations can have different statuses:
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-semibold text-sm">Pending</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Invitation sent but not yet accepted</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-sm">Accepted</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Invitation has been accepted and user account created</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-semibold text-sm">Expired</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Invitation link has expired</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

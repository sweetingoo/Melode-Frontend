"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Edit, Lock, Bell, Shield, Mail, Phone, User, Save } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfileDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Profile Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage your personal profile, account settings, and preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCircle className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding profile management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Profile Management?</h3>
              <p className="text-sm text-muted-foreground">
                Your profile contains your personal information, account settings, preferences, and security options.
                You can update your profile to keep your information current and customize your experience.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Your Profile</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click on your avatar/name in the sidebar footer</li>
                <li>Select "Your Profile" from the dropdown menu</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/profile</code></li>
                <li>Available to all authenticated users</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Edit className="h-6 w-6 text-green-600" />
              <CardTitle>Editing Profile Information</CardTitle>
            </div>
            <CardDescription>How to update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Profile Update</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Navigate to Profile</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click on your avatar/name in the sidebar footer and select "Your Profile".
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Edit Profile Form</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Edit" to open the profile edit form:
                  </p>
                  <FormMockup
                    title="Edit Profile"
                    description="Update your personal information"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                          <FormButton variant="outline" size="sm">
                            Change Photo
                          </FormButton>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="First Name"
                          type="text"
                          placeholder="John"
                          icon={User}
                          required
                          value="John"
                        />
                        <FormField
                          label="Last Name"
                          type="text"
                          placeholder="Doe"
                          icon={User}
                          required
                          value="Doe"
                        />
                      </div>

                      <FormField
                        label="Email Address"
                        type="email"
                        placeholder="john.doe@example.com"
                        icon={Mail}
                        required
                        value="john.doe@example.com"
                      />

                      <FormField
                        label="Phone Number"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        icon={Phone}
                        value="+1 (555) 123-4567"
                      />

                      <FormTextarea
                        label="Bio"
                        placeholder="Tell us about yourself..."
                        rows={4}
                        value="Experienced project manager with 5+ years in software development."
                      />

                      <div className="flex gap-2 pt-2">
                        <FormButton variant="outline" className="flex-1">
                          Cancel
                        </FormButton>
                        <FormButton className="flex-1" icon={Save}>
                          Save Changes
                        </FormButton>
                      </div>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Editable Information</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can typically update the following in your profile:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Display Name:</strong> How your name appears to others</li>
                <li><strong>First Name & Last Name:</strong> Your legal name</li>
                <li><strong>Email Address:</strong> Your contact email (may require verification)</li>
                <li><strong>Phone Number:</strong> Your contact phone number</li>
                <li><strong>Avatar/Profile Picture:</strong> Upload or change your profile image</li>
                <li><strong>Bio/About:</strong> A brief description about yourself</li>
                <li><strong>Custom Fields:</strong> Additional fields configured by your organisation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-purple-600" />
              <CardTitle>Password & Security</CardTitle>
            </div>
            <CardDescription>Managing your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Changing Your Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Go to the Security section and click "Change Password" to open the password change form:
              </p>
              <DialogMockup
                title="Change Password"
                description="Update your account password"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Cancel
                    </FormButton>
                    <FormButton size="sm" icon={Lock}>
                      Update Password
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <FormField
                    label="Current Password"
                    type="password"
                    placeholder="Enter your current password"
                    icon={Lock}
                    required
                    value="••••••••"
                  />
                  <FormField
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    icon={Lock}
                    required
                    value="••••••••"
                  />
                  <FormField
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    icon={Lock}
                    required
                    value="••••••••"
                  />
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold mb-1">Password Requirements:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains at least one number</li>
                      <li>• Contains at least one special character</li>
                    </ul>
                  </div>
                </div>
              </DialogMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Password Requirements</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your new password typically must:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Be at least 8 characters long (may vary)</li>
                <li>Contain both uppercase and lowercase letters</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
                <li>Be different from your previous passwords</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Two-Factor Authentication (2FA)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                If 2FA is available, you can enable it in your profile:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to the Security section</li>
                <li>Click "Enable Two-Factor Authentication"</li>
                <li>Scan the QR code with your authenticator app</li>
                <li>Enter the verification code to confirm</li>
                <li>Save backup codes in a secure location</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-orange-600" />
              <CardTitle>Notifications & Preferences</CardTitle>
            </div>
            <CardDescription>Customizing your notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Notification Settings</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can control how and when you receive notifications:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Email Notifications:</strong> Receive notifications via email</li>
                <li><strong>In-App Notifications:</strong> See notifications within the application</li>
                <li><strong>Task Notifications:</strong> Get notified about task assignments and updates</li>
                <li><strong>Form Notifications:</strong> Receive alerts about form submissions</li>
                <li><strong>System Notifications:</strong> Important system updates and announcements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Language & Regional Settings</h3>
              <p className="text-sm text-muted-foreground">
                Customize your language preference, timezone, date format, and other regional settings
                to match your location and preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-indigo-600" />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>Viewing your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Account Details</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your profile displays important account information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>User ID:</strong> Your unique identifier in the system</li>
                <li><strong>Account Created:</strong> When your account was created</li>
                <li><strong>Last Login:</strong> When you last logged in</li>
                <li><strong>Roles:</strong> Your current roles and assignments</li>
                <li><strong>Departments:</strong> Departments you belong to</li>
                <li><strong>Permissions:</strong> Your current permissions (if visible)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Activity History</h3>
              <p className="text-sm text-muted-foreground">
                Some profiles may show your recent activity, login history, or account changes
                to help you monitor your account security.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

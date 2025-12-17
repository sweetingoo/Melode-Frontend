"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield, Database, Bell, Globe, Lock, Server, Zap, Key, CheckSquare, Search, AlertCircle } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect, FormTextarea, FormCheckbox } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ConfigurationDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Configuration</h1>
        <p className="text-lg text-muted-foreground">
          System-wide configuration and settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Configuration?</h3>
              <p className="text-sm text-muted-foreground">
                Configuration allows superusers to manage system-wide settings, preferences, and behavior.
                This includes organisation settings, feature toggles, integration configurations, security
                settings, email configurations, and other administrative controls that affect how the entire
                system operates.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Configuration</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Configuration" in the sidebar under Settings</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/configuration</code></li>
                <li>Only available to Superusers (requires SUPERUSER_ROLE_ONLY permission)</li>
              </ul>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Warning:</strong> Configuration changes affect the entire system. Only make changes
                if you understand the implications. Incorrect configuration can impact system functionality.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-green-600" />
              <CardTitle>Configuration Interface</CardTitle>
            </div>
            <CardDescription>Understanding the configuration page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Configuration Page Layout</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The configuration page is organized into different tabs:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
                <li><strong>Settings:</strong> General system settings organized by category and group</li>
                <li><strong>Organisation:</strong> Organisation-wide information and settings</li>
                <li><strong>Role Defaults:</strong> Configure default permissions for new roles</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-4">
                Each tab provides access to different configuration areas:
              </p>
              <FormMockup
                title="System Configuration"
                description="Manage system-wide settings and preferences"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">System Configuration</h3>
                      <p className="text-xs text-muted-foreground">Manage system-wide settings</p>
                    </div>
                    <Badge className="bg-red-500 text-xs">Superuser Only</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">Organisation Settings</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Organisation name, logo, and basic information</p>
                      <FormButton variant="outline" size="sm">Configure</FormButton>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Bell className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold">Notification Settings</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Email, SMS, and push notification configurations</p>
                      <FormButton variant="outline" size="sm">Configure</FormButton>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Lock className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold">Security Settings</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Password policies, MFA, session management</p>
                      <FormButton variant="outline" size="sm">Configure</FormButton>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Server className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Integration Settings</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Third-party integrations and API configurations</p>
                      <FormButton variant="outline" size="sm">Configure</FormButton>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-semibold">Feature Toggles</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Enable or disable system features</p>
                      <FormButton variant="outline" size="sm">Configure</FormButton>
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
              <Globe className="h-6 w-6 text-blue-600" />
              <CardTitle>Organisation Settings</CardTitle>
            </div>
            <CardDescription>Configuring organisation information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Configure Organisation</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Organisation Settings</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Configure" on the Organisation Settings card.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Update Organisation Information</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The organisation settings form includes:
                  </p>
                  <DialogMockup
                    title="Organisation Settings"
                    description="Configure organisation-wide settings"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Settings}>
                          Save Settings
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Organisation Name"
                        type="text"
                        placeholder="Acme Corporation"
                        required
                        value="Acme Corporation"
                      />
                      <FormTextarea
                        label="Organisation Description"
                        placeholder="Brief description of your organisation"
                        rows={3}
                        value="Leading provider of business solutions"
                      />
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-2">Organisation Logo</p>
                        <div className="p-4 border border-dashed rounded-md bg-background">
                          <p className="text-xs text-muted-foreground text-center">Click to upload logo</p>
                        </div>
                      </div>
                      <FormField
                        label="Contact Email"
                        type="email"
                        placeholder="admin@example.com"
                        value="admin@example.com"
                      />
                      <FormField
                        label="Contact Phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value="+1 (555) 123-4567"
                      />
                      <FormField
                        label="Website"
                        type="url"
                        placeholder="https://www.example.com"
                        value="https://www.example.com"
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
              <Lock className="h-6 w-6 text-red-600" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Configuring security and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Security Configuration Options</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Security settings control authentication and access policies:
              </p>
              <DialogMockup
                title="Security Settings"
                description="Configure security and authentication policies"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Cancel
                    </FormButton>
                    <FormButton size="sm" icon={Lock}>
                      Save Security Settings
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Password Policy</h4>
                    <div className="space-y-3">
                      <FormField
                        label="Minimum Password Length"
                        type="number"
                        value="8"
                      />
                      <div className="space-y-2">
                        <FormCheckbox label="Require uppercase letters" checked={true} />
                        <FormCheckbox label="Require lowercase letters" checked={true} />
                        <FormCheckbox label="Require numbers" checked={true} />
                        <FormCheckbox label="Require special characters" checked={true} />
                      </div>
                      <FormField
                        label="Password Expiration (days)"
                        type="number"
                        value="90"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Multi-Factor Authentication</h4>
                    <div className="space-y-2">
                      <FormCheckbox label="Enable MFA for all users" checked={false} />
                      <FormCheckbox label="Require MFA for administrators" checked={true} />
                      <FormCheckbox label="Allow backup codes" checked={true} />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Session Management</h4>
                    <div className="space-y-3">
                      <FormField
                        label="Session Timeout (minutes)"
                        type="number"
                        value="30"
                      />
                      <FormField
                        label="Maximum Concurrent Sessions"
                        type="number"
                        value="3"
                      />
                      <FormCheckbox label="Require re-authentication for sensitive actions" checked={true} />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Account Security</h4>
                    <div className="space-y-2">
                      <FormField
                        label="Failed Login Attempts Before Lockout"
                        type="number"
                        value="5"
                      />
                      <FormField
                        label="Account Lockout Duration (minutes)"
                        type="number"
                        value="15"
                      />
                      <FormCheckbox label="Enable IP whitelisting" checked={false} />
                    </div>
                  </div>
                </div>
              </DialogMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-purple-600" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>Configuring notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Notification Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure how the system sends notifications:
              </p>
              <DialogMockup
                title="Notification Settings"
                description="Configure notification delivery methods"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Cancel
                    </FormButton>
                    <FormButton size="sm" icon={Bell}>
                      Save Notification Settings
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Email Notifications</h4>
                    <div className="space-y-3">
                      <FormField
                        label="SMTP Server"
                        type="text"
                        placeholder="smtp.example.com"
                        value="smtp.example.com"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="SMTP Port"
                          type="number"
                          value="587"
                        />
                        <FormCheckbox label="Use TLS" checked={true} />
                      </div>
                      <FormField
                        label="From Email"
                        type="email"
                        placeholder="noreply@example.com"
                        value="noreply@example.com"
                      />
                      <FormField
                        label="From Name"
                        type="text"
                        placeholder="Melode System"
                        value="Melode System"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3">SMS Notifications</h4>
                    <div className="space-y-3">
                      <FormCheckbox label="Enable SMS notifications" checked={false} />
                      <FormField
                        label="SMS Provider API Key"
                        type="password"
                        placeholder="Enter API key"
                        value="••••••••"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Push Notifications</h4>
                    <div className="space-y-2">
                      <FormCheckbox label="Enable push notifications" checked={true} />
                      <FormField
                        label="Push Notification Service URL"
                        type="url"
                        placeholder="https://push.example.com"
                        value=""
                      />
                    </div>
                  </div>
                </div>
              </DialogMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-yellow-600" />
              <CardTitle>Feature Toggles</CardTitle>
            </div>
            <CardDescription>Enabling and disabling system features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Feature Toggle Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable or disable system features:
              </p>
              <DialogMockup
                title="Feature Toggles"
                description="Enable or disable system features"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">
                      Cancel
                    </FormButton>
                    <FormButton size="sm" icon={Zap}>
                      Save Feature Settings
                    </FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg mb-4">
                    <p className="text-xs font-semibold mb-2">System Features</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle features on or off to control system functionality
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-sm">Task Management</h4>
                        <p className="text-xs text-muted-foreground">Enable task creation and management</p>
                      </div>
                      <FormCheckbox checked={true} />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-sm">Form Builder</h4>
                        <p className="text-xs text-muted-foreground">Enable custom form creation</p>
                      </div>
                      <FormCheckbox checked={true} />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-sm">Asset Tracking</h4>
                        <p className="text-xs text-muted-foreground">Enable asset management features</p>
                      </div>
                      <FormCheckbox checked={true} />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-sm">Check In/Out</h4>
                        <p className="text-xs text-muted-foreground">Enable time tracking features</p>
                      </div>
                      <FormCheckbox checked={true} />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-sm">Custom Fields</h4>
                        <p className="text-xs text-muted-foreground">Enable custom field creation</p>
                      </div>
                      <FormCheckbox checked={true} />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div>
                        <h4 className="font-semibold text-sm">Advanced Analytics</h4>
                        <p className="text-xs text-muted-foreground">Enable advanced reporting features</p>
                      </div>
                      <FormCheckbox checked={false} />
                    </div>
                  </div>
                </div>
              </DialogMockup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Server className="h-6 w-6 text-green-600" />
              <CardTitle>Integration Settings</CardTitle>
            </div>
            <CardDescription>Configuring third-party integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Available Integrations</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Configure integrations with external services:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Email Services:</strong> SMTP configuration for email delivery</li>
                <li><strong>Storage Services:</strong> Cloud storage for file uploads</li>
                <li><strong>Authentication Providers:</strong> SSO, OAuth, LDAP integration</li>
                <li><strong>API Keys:</strong> External service API configurations</li>
                <li><strong>Webhooks:</strong> Outgoing webhook configurations</li>
                <li><strong>Analytics:</strong> Analytics service integrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How to Configure Integrations</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click "Configure" on the Integration Settings card</li>
                <li>Select the integration you want to configure</li>
                <li>Enter API keys, endpoints, and configuration details</li>
                <li>Test the connection to verify it works</li>
                <li>Save the configuration</li>
                <li>Monitor integration status and logs</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-purple-600" />
              <CardTitle>Role Defaults Configuration</CardTitle>
            </div>
            <CardDescription>Configuring default permissions for new roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Configure Default Role Permissions</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Open Role Defaults Tab</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Navigate to Configuration and click on the "Role Defaults" tab.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Select Default Permissions</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The Role Defaults interface allows you to select which permissions should be automatically
                    assigned to new roles:
                  </p>
                  <FormMockup
                    title="Default Role Permissions"
                    description="Configure default permissions that will be automatically assigned to new roles when no permissions are specified."
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search permissions..."
                            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                            readOnly
                          />
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-2 text-xs border rounded-md">Select All</button>
                          <button className="px-3 py-2 text-xs border rounded-md">Deselect All</button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>5 of 96 permissions selected</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                          Unsaved changes
                        </Badge>
                      </div>

                      <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                        <div className="divide-y">
                          <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                            <div className="flex items-center justify-center h-5 w-5 rounded border-2 border-primary">
                              <CheckSquare className="h-4 w-4 text-primary fill-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">View Clock Records</div>
                              <div className="text-xs text-muted-foreground">clock:view</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                            <div className="flex items-center justify-center h-5 w-5 rounded border-2 border-primary">
                              <CheckSquare className="h-4 w-4 text-primary fill-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">Clock In</div>
                              <div className="text-xs text-muted-foreground">clock:in</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                            <div className="h-5 w-5 rounded border-2 border-muted"></div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">Create Task</div>
                              <div className="text-xs text-muted-foreground">task:create</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Save Default Permissions
                        </button>
                      </div>

                      <div className="p-3 bg-muted rounded-lg border border-muted-foreground/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">How it works:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>When creating a new role, if no permissions are specified, these default permissions will be automatically assigned.</li>
                              <li>If permissions are explicitly provided during role creation, the defaults will not be used.</li>
                              <li>If no default permissions are configured, new roles will be created with no permissions.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Understanding Default Role Permissions</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Default role permissions streamline the role creation process by automatically assigning
                commonly needed permissions to new roles. This is especially useful when creating multiple
                roles with similar permission sets.
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-2">When Defaults Are Used</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>When creating a role without specifying any permissions</li>
                    <li>When the permission list is empty during role creation</li>
                    <li>Defaults are applied automatically by the system</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">When Defaults Are NOT Used</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>When you explicitly assign permissions during role creation</li>
                    <li>When you specify a non-empty permission list</li>
                    <li>Defaults are ignored if permissions are provided</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Best Practices</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Choose permissions that are commonly needed across most roles</li>
                    <li>Consider basic read permissions (e.g., <code className="bg-muted px-1 py-0.5 rounded">clock:view</code>, <code className="bg-muted px-1 py-0.5 rounded">task:read</code>)</li>
                    <li>Avoid including sensitive permissions (e.g., delete, admin access) in defaults</li>
                    <li>Review and update defaults periodically as your organisation evolves</li>
                    <li>Remember that you can always modify permissions for individual roles after creation</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Best Practices</CardTitle>
            <CardDescription>Guidelines for safe configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Before Making Changes</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Document current settings before making changes</li>
                <li>Test configuration changes in a development environment first</li>
                <li>Understand the impact of each setting</li>
                <li>Have a rollback plan if something goes wrong</li>
                <li>Make changes during low-usage periods when possible</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">After Making Changes</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Verify that changes are working as expected</li>
                <li>Monitor system behavior after changes</li>
                <li>Check for any error messages or warnings</li>
                <li>Inform users of significant changes that affect them</li>
                <li>Keep a log of configuration changes</li>
              </ul>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Important:</strong> Configuration changes can affect all users and system functionality.
                Always test changes thoroughly and have a backup plan. Some changes may require system restart
                or affect active sessions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

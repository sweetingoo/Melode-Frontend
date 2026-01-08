"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Building2, Shield, Key, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default function SetupDocumentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Initial Setup</h1>
        <p className="text-muted-foreground text-lg">
          Complete the one-time initial setup to configure your Melode instance
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Overview</CardTitle>
          </div>
          <CardDescription>
            The initial setup process configures your Melode instance for first-time use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            When you first install Melode, you need to complete a one-time setup process to initialise
            your organisation, create a superuser account, and configure the system. This setup process
            is only accessible before the system is fully configured.
          </p>
          <p>
            The setup process guides you through creating essential system components that are required
            for Melode to function properly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessing the Setup Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The setup page is automatically accessible when the system detects that initial setup has not
            been completed. You can access it at:
          </p>
          <div className="bg-muted rounded-lg p-4">
            <code className="text-sm">/setup</code>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> The setup page does not require authentication. Once setup is complete,
            the page will redirect you to the login page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The setup process consists of the following steps, which must be completed in order:
          </p>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">1. Superuser Role</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  Create the initial superuser role that will have full system access. This role is
                  required for system administration.
                </p>
                <p className="text-xs text-muted-foreground">
                  This step creates a role with all permissions enabled, allowing complete system control.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">2. Superuser Account</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  Create the first user account and assign it to the superuser role. This account will
                  be used to log in and manage the system.
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium">Required Information:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Email address</li>
                    <li>Username</li>
                    <li>Password (and confirmation)</li>
                    <li>First name</li>
                    <li>Last name</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">3. Organisation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  Create your organisation. This represents your company or entity using Melode.
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium">Required Information:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Organisation name</li>
                    <li>Organisation code (unique identifier)</li>
                    <li>Description (optional)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">4. Permissions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  Initialise the permissions system. This creates all the standard permissions used
                  throughout Melode for access control.
                </p>
                <p className="text-xs text-muted-foreground">
                  Permissions define what actions users can perform in the system.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">5. Configurations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  Initialise system configurations. This sets up default configuration values needed
                  for Melode to operate.
                </p>
                <p className="text-xs text-muted-foreground">
                  Configurations can be modified later through the Configuration page.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completing Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Once all setup steps are complete:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click the <strong>Complete Setup</strong> button</li>
            <li>The system will mark setup as complete</li>
            <li>You'll be redirected to the Configuration page to set up integrations</li>
            <li>You can then log in with your superuser account</li>
          </ol>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              💡 Next Steps
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              After completing setup, you should configure SendGrid and Twilio credentials in the
              Configuration page to enable email and SMS notifications.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Option</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            For convenience, you can use the <strong>Run All Setup</strong> option, which completes
            all setup steps at once using the information you provide in the form.
          </p>
          <p>
            To use quick setup:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Fill in the superuser account information</li>
            <li>Fill in the organisation information</li>
            <li>Click <strong>Run All Setup</strong></li>
            <li>The system will complete all steps automatically</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The setup page displays the status of each setup step:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <CheckCircle2 className="h-4 w-4 inline text-green-500 mr-1" />
              <strong>Complete:</strong> Step has been completed successfully
            </li>
            <li>
              <AlertCircle className="h-4 w-4 inline text-orange-500 mr-1" />
              <strong>Pending:</strong> Step needs to be completed
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            You can complete steps individually or use the quick setup option to complete all at once.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ One-Time Process
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Setup can only be completed once. After setup is complete, the setup page will no longer
                be accessible. Make sure to complete all steps correctly.
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                🔒 Security Reminder
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Keep your superuser account credentials secure. This account has full system access and
                should only be used for administrative tasks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Setup Page Not Accessible
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Check if setup has already been completed</li>
                <li>Verify database connection is working</li>
                <li>Check backend logs for errors</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Step Fails to Complete
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Check that all required fields are filled</li>
                <li>Verify database permissions</li>
                <li>Check backend logs for specific error messages</li>
                <li>Try refreshing the page and attempting again</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Best Practices
              </p>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Complete setup in a single session if possible</li>
                <li>Use strong passwords for the superuser account</li>
                <li>Document your organisation code for future reference</li>
                <li>Configure integrations immediately after setup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Related Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Configuration:</strong> After setup, configure integrations and settings.
              See the <a href="/docs/configuration" className="text-primary hover:underline">Configuration</a> documentation.
            </li>
            <li>
              <strong>Authentication:</strong> After setup, log in with your superuser account.
              See the <a href="/docs/authentication" className="text-primary hover:underline">Authentication</a> documentation.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

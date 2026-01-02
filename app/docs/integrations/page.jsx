"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, Mail, Smartphone, Cloud, Settings, Shield, CheckCircle2, AlertCircle, Eye, EyeOff, Switch } from "lucide-react";
import { FormMockup } from "@/components/docs/FormMockup";

export default function IntegrationsDocumentation() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Integrations Configuration</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Configure third-party integrations for email, SMS, file storage, and communication features.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              SendGrid Email Configuration
            </CardTitle>
            <CardDescription>
              Set up SendGrid for email delivery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Getting Your SendGrid API Key</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Sign up or log in to your SendGrid account at <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sendgrid.com</a></li>
                <li>Navigate to <strong>Settings</strong> → <strong>API Keys</strong> in the left sidebar</li>
                <li>Click <strong>"Create API Key"</strong> button</li>
                <li>Enter a name for your API key (e.g., "Melode Production")</li>
                <li>Select <strong>"Full Access"</strong> or <strong>"Restricted Access"</strong> with Mail Send permissions</li>
                <li>Click <strong>"Create & View"</strong> - <strong>Important:</strong> Copy the API key immediately as it won't be shown again</li>
                <li>The API key will start with <code className="bg-muted px-1 rounded">SG.</code> followed by a long string</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Configuring in Melode</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Navigate to <code className="bg-muted px-1 rounded">/admin/configuration?tab=integrations</code></li>
                <li>Enable Email Configuration toggle</li>
                <li>Paste your SendGrid API key in the "SendGrid API Key" field</li>
                <li>Click "Save Integration Configuration"</li>
              </ol>
              <FormMockup title="SendGrid Configuration" description="Email integration settings">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">SendGrid Email Configuration</span>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SendGrid API Key</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="password" 
                        value="SG.xxxxxxxxxxxxxxxxxxxx" 
                        className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                        disabled
                      />
                      <Badge variant="outline">✓ Configured</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for sending emails. Get your API key from SendGrid dashboard.
                    </p>
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Verifying Your Email Domain (Recommended)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For better deliverability, verify your sender domain in SendGrid:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Go to <strong>Settings</strong> → <strong>Sender Authentication</strong></li>
                <li>Click <strong>"Authenticate Your Domain"</strong></li>
                <li>Follow the DNS verification steps</li>
                <li>Once verified, use that domain in the "From Email" field</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Security</h3>
              <p className="text-sm text-muted-foreground">
                API keys are stored securely and masked in the interface. Only superusers can view and modify email configuration.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Twilio SMS Configuration
            </CardTitle>
            <CardDescription>
              Configure Twilio for SMS notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Getting Your Twilio Credentials</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Sign up or log in to your Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">twilio.com</a></li>
                <li>Once logged in, you'll see your <strong>Account SID</strong> and <strong>Auth Token</strong> on the main dashboard</li>
                <li><strong>Account SID</strong>: Starts with <code className="bg-muted px-1 rounded">AC</code> (e.g., <code className="bg-muted px-1 rounded">ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>)</li>
                <li><strong>Auth Token</strong>: A long alphanumeric string (click "Show" to reveal it)</li>
                <li>To get a phone number, go to <strong>Phone Numbers</strong> → <strong>Manage</strong> → <strong>Buy a number</strong></li>
                <li>Select your country and region, then purchase a number</li>
                <li>Copy the phone number in E.164 format (e.g., <code className="bg-muted px-1 rounded">+1234567890</code>)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Configuring in Melode</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Navigate to <code className="bg-muted px-1 rounded">/admin/configuration?tab=integrations</code></li>
                <li>Enable SMS Configuration toggle</li>
                <li>Enter your <strong>Account SID</strong> (starts with <code className="bg-muted px-1 rounded">AC</code>)</li>
                <li>Enter your <strong>Auth Token</strong></li>
                <li>Enter your <strong>Twilio From Number</strong> in E.164 format</li>
                <li>Click "Save Integration Configuration"</li>
              </ol>
              <FormMockup title="Twilio SMS Configuration" description="SMS integration settings">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Twilio SMS Configuration</span>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Twilio Account SID</label>
                      <input 
                        type="text" 
                        value="ACxxxxxxxxxxxxxxxxxxxx" 
                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Twilio Auth Token</label>
                      <input 
                        type="password" 
                        value="••••••••••••" 
                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twilio From Number</label>
                    <input 
                      type="text" 
                      value="+1234567890" 
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: E.164 (e.g., +1234567890)
                    </p>
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Phone Number Format (E.164)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The "From Number" must be in E.164 format:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Start with <code className="bg-muted px-1 rounded">+</code> followed by country code</li>
                <li>No spaces, dashes, or parentheses</li>
                <li>Example: <code className="bg-muted px-1 rounded">+1234567890</code> (US), <code className="bg-muted px-1 rounded">+447911123456</code> (UK)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Twilio Console Locations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Account SID & Auth Token</strong>: Main dashboard (home page after login)</li>
                <li><strong>Phone Numbers</strong>: Left sidebar → Phone Numbers → Manage Numbers</li>
                <li><strong>Account Balance</strong>: Top right corner (ensure you have credits)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              S3 Storage Configuration
            </CardTitle>
            <CardDescription>
              Configure AWS S3 for cloud file storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating an S3 Bucket</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Log in to your AWS account at <a href="https://aws.amazon.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aws.amazon.com</a></li>
                <li>Navigate to <strong>S3</strong> service (search "S3" in the services menu)</li>
                <li>Click <strong>"Create bucket"</strong></li>
                <li>Enter a unique bucket name (must be globally unique across all AWS accounts)</li>
                <li>Select your AWS Region (e.g., <code className="bg-muted px-1 rounded">eu-west-2</code> for London)</li>
                <li>Configure bucket settings (you can use defaults for most cases)</li>
                <li>Click <strong>"Create bucket"</strong></li>
                <li>Note down your bucket name and region</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Creating an IAM User with S3 Access</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Navigate to <strong>IAM</strong> service in AWS Console</li>
                <li>Click <strong>"Users"</strong> in the left sidebar</li>
                <li>Click <strong>"Create user"</strong></li>
                <li>Enter a username (e.g., <code className="bg-muted px-1 rounded">melode-s3-user</code>)</li>
                <li>Click <strong>"Next"</strong></li>
                <li>Under "Set permissions", select <strong>"Attach policies directly"</strong></li>
                <li>Search for and select <strong>"AmazonS3FullAccess"</strong> (or create a custom policy with only your bucket)</li>
                <li>Click <strong>"Next"</strong> → <strong>"Create user"</strong></li>
                <li>Click on the newly created user</li>
                <li>Go to the <strong>"Security credentials"</strong> tab</li>
                <li>Click <strong>"Create access key"</strong></li>
                <li>Select <strong>"Application running outside AWS"</strong> as the use case</li>
                <li>Click <strong>"Next"</strong> → <strong>"Create access key"</strong></li>
                <li><strong>Important:</strong> Copy both the <strong>Access Key ID</strong> and <strong>Secret Access Key</strong> immediately (you won't see the secret again)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Configuring in Melode</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Navigate to <code className="bg-muted px-1 rounded">/admin/configuration?tab=integrations</code></li>
                <li>Enable S3 Storage toggle</li>
                <li>Enter your <strong>AWS Access Key ID</strong> (from the IAM user you created)</li>
                <li>Enter your <strong>AWS Secret Access Key</strong> (click eye icon to view/edit)</li>
                <li>Enter your <strong>S3 Bucket Name</strong> (the bucket you created)</li>
                <li>Enter your <strong>AWS Region</strong> (e.g., <code className="bg-muted px-1 rounded">eu-west-2</code>, must match your bucket's region)</li>
                <li>Click "Save Integration Configuration"</li>
              </ol>
              <FormMockup title="S3 Storage Configuration" description="AWS S3 integration settings">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">S3 Storage Configuration</span>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AWS Access Key ID <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value="AKIAIOSFODNN7EXAMPLE" 
                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AWS Secret Access Key <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="password" 
                          value="••••••••••••••••" 
                          className="w-full px-3 py-2 pr-10 border rounded-md bg-background text-sm"
                          disabled
                        />
                        <Eye className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">S3 Bucket Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value="my-bucket-name" 
                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AWS Region <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value="eu-west-2" 
                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Default: eu-west-2 (London)</p>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Common AWS Regions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><code className="bg-muted px-1 rounded">eu-west-2</code> - London (default)</li>
                <li><code className="bg-muted px-1 rounded">us-east-1</code> - N. Virginia</li>
                <li><code className="bg-muted px-1 rounded">us-west-2</code> - Oregon</li>
                <li><code className="bg-muted px-1 rounded">eu-central-1</code> - Frankfurt</li>
                <li><code className="bg-muted px-1 rounded">ap-southeast-1</code> - Singapore</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Security Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Secret Access Key is masked by default</li>
                <li>Click the eye icon to view or update the secret key</li>
                <li>If unchanged, the existing secret key is preserved</li>
                <li>All fields are required when enabling S3</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Behavior</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>When enabled: All file uploads are stored in your S3 bucket</li>
                <li>When disabled: Files are stored locally on the server</li>
                <li>Existing S3 files remain accessible even after disabling</li>
                <li>A warning is shown when disabling S3 storage</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Sender Settings
            </CardTitle>
            <CardDescription>
              Customize email sender information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Configuration Options</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>From Email</strong>: The email address that appears as the sender</li>
                <li><strong>From Name</strong>: The display name for email sender</li>
                <li><strong>App Name</strong>: Application name used in emails</li>
                <li><strong>Domain Name</strong>: Your organization's domain</li>
                <li><strong>Frontend Base URL</strong>: Base URL for links in emails</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>
              Enable or disable communication features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Two-Way Communication</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When enabled, allows users to reply to messages via email or SMS. This must be enabled before you can use email or SMS replies.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Enable Email Replies</strong>: Allow users to reply via email (requires Two-Way Communication)</li>
                <li><strong>Enable SMS Replies</strong>: Allow users to reply via SMS (requires Two-Way Communication)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Configuration Status
            </CardTitle>
            <CardDescription>
              Monitor the status of your integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Status Badges</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The configuration page shows status badges indicating which integrations are configured:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><CheckCircle2 className="h-4 w-4 inline text-green-600" /> <strong>Configured</strong>: Integration is set up and ready</li>
                <li><AlertCircle className="h-4 w-4 inline text-yellow-600" /> <strong>Not Configured</strong>: Integration needs setup</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Access Requirements</h3>
              <p className="text-sm text-muted-foreground">
                Only users with the <code className="bg-muted px-1 rounded">SUPERUSER_ROLE_ONLY</code> permission can access and modify integration settings.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Troubleshooting
            </CardTitle>
            <CardDescription>
              Common issues and solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Email Not Sending</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Verify SendGrid API key is correct and active</li>
                <li>Check SendGrid dashboard for delivery status</li>
                <li>Ensure "From Email" is verified in SendGrid</li>
                <li>Check email sender settings are configured</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">SMS Not Sending</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Verify Twilio credentials are correct</li>
                <li>Check Twilio account has sufficient credits</li>
                <li>Ensure "From Number" is in E.164 format</li>
                <li>Verify the phone number is active in Twilio</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">S3 Upload Issues</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Verify AWS credentials have S3 read/write permissions</li>
                <li>Check bucket name is correct and exists</li>
                <li>Ensure region matches the bucket's region</li>
                <li>Verify IAM user has proper bucket policies</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus, Key, Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormCheckbox } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function AuthenticationDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Authentication</h1>
        <p className="text-lg text-muted-foreground">
          Learn how to sign in, sign up, recover your password, and manage your account access
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogIn className="h-6 w-6 text-blue-600" />
              <CardTitle>Login</CardTitle>
            </div>
            <CardDescription>Access your Melode account with your credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Login Process</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Navigate to Login Page</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to <code className="bg-muted px-1 py-0.5 rounded">/auth</code> or click the login link
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Login Form</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll see the login form with the following fields:
                  </p>
                  <FormMockup
                    title="Login Form"
                    description="Enter your credentials to access your account"
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Email Address"
                        type="email"
                        placeholder="Enter your email"
                        icon={Mail}
                        required
                        value="user@example.com"
                      />
                      <FormField
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        icon={Lock}
                        required
                        value="••••••••"
                      />
                      <div className="flex items-center justify-between">
                        <FormCheckbox label="Remember me" checked={false} />
                        <a href="#" className="text-sm text-primary hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <FormButton className="w-full" icon={ArrowRight}>
                        Sign In
                      </FormButton>
                    </div>
                  </FormMockup>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Multi-Factor Authentication (if enabled)</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If MFA is enabled, you'll see this verification screen:
                  </p>
                  <FormMockup
                    title="MFA Verification"
                    description="Enter the 6-digit code from your authenticator app"
                  >
                    <div className="space-y-4">
                      <FormField
                        label="MFA Token"
                        type="text"
                        placeholder="Enter 6-digit MFA token"
                        icon={Shield}
                        required
                        value="123456"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code from your authenticator app
                      </p>
                      <div className="flex gap-2">
                        <FormButton variant="ghost" className="flex-1">
                          ← Back to login
                        </FormButton>
                        <FormButton className="flex-1" icon={Shield}>
                          Verify MFA
                        </FormButton>
                      </div>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Secure password-based authentication</li>
                <li>Multi-factor authentication support</li>
                <li>Remember me functionality</li>
                <li>Automatic redirect if already authenticated</li>
                <li>Role selection after login (if multiple roles available)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-green-600" />
              <CardTitle>Sign Up</CardTitle>
            </div>
            <CardDescription>Create a new account in Melode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Sign Up Process</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Access Sign Up Page</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Navigate to <code className="bg-muted px-1 py-0.5 rounded">/auth/signup</code> or use an invitation link
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Sign Up Form</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fill in the sign up form with your information:
                  </p>
                  <FormMockup
                    title="Create Account"
                    description="Fill in all required information to create your account"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="First Name"
                          type="text"
                          placeholder="Alex"
                          required
                          value="Alex"
                        />
                        <FormField
                          label="Last Name"
                          type="text"
                          placeholder="Brown"
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
                        label="Password"
                        type="password"
                        placeholder="Create a strong password"
                        icon={Lock}
                        required
                        value="••••••••"
                      />
                      <FormField
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        icon={Lock}
                        required
                        value="••••••••"
                      />
                      <FormButton className="w-full" icon={ArrowRight}>
                        Sign Up
                      </FormButton>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Account Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Valid email address</li>
                <li>Strong password (typically 8+ characters with mixed case, numbers, and symbols)</li>
                <li>Complete all required profile information</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-orange-600" />
              <CardTitle>Password Recovery</CardTitle>
            </div>
            <CardDescription>Reset your password if you've forgotten it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Password Recovery Flow</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 1: Forgot Password Form</h4>
                  <FormMockup
                    title="Forgot Password"
                    description="Enter your email to receive a password reset link"
                  >
                    <div className="space-y-4">
                      <FormField
                        label="Email Address"
                        type="email"
                        placeholder="Enter your email"
                        icon={Mail}
                        required
                        value="user@example.com"
                      />
                      <FormButton className="w-full">
                        Send Reset Link
                      </FormButton>
                    </div>
                  </FormMockup>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Reset Password Form</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    After clicking the reset link in your email, you'll see:
                  </p>
                  <FormMockup
                    title="Reset Password"
                    description="Enter your new password"
                  >
                    <div className="space-y-4">
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
                      <FormButton className="w-full">
                        Reset Password
                      </FormButton>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-purple-600" />
              <CardTitle>Role Selection</CardTitle>
            </div>
            <CardDescription>Select your role when you have multiple role assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Role Selection Process</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Role Selection Screen</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you have multiple roles, you'll see this selection screen:
                  </p>
                  <FormMockup
                    title="Select Your Role"
                    description="Choose which role you want to use for this session"
                  >
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-sm">Manager</h5>
                            <p className="text-xs text-muted-foreground">Operations Department</p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer bg-accent">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-sm">Person</h5>
                            <p className="text-xs text-muted-foreground">Finance Department</p>
                          </div>
                          <Badge>Selected</Badge>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-sm">Administrator</h5>
                            <p className="text-xs text-muted-foreground">IT Department</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

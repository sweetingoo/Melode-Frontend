"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Shield, CheckCircle } from "lucide-react";
import { useForgotPassword } from "@/hooks/useAuth";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/app/assets/assets";

const ForgetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Use the forgot password mutation from our custom hook
  const forgotPasswordMutation = useForgotPassword();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Call the forgot password mutation
    forgotPasswordMutation.mutate(email, {
      onSuccess: () => {
        setIsEmailSent(true);
      },
    });
  };

  const handleResendEmail = () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }

    forgotPasswordMutation.mutate(email);
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl">
                <Image
                  src={assets.favicon.src}
                  alt="Melode Admin"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-slate-600">
              We've sent password reset instructions to your email
            </p>
          </div>

          {/* Success Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Email Sent Successfully
              </h2>

              <p className="text-slate-600 mb-6">
                We've sent password reset instructions to{" "}
                <span className="font-medium text-slate-900">{email}</span>
              </p>

              <div className="space-y-4">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full h-11"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    "Resend Email"
                  )}
                </Button>

                <Link href="/auth">
                  <Button variant="ghost" className="w-full h-11">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>Secure password reset with enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl">
              <Image
                src={assets.favicon.src}
                alt="Melode Admin"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-slate-600">
            No worries, we'll send you reset instructions
          </p>
        </div>

        {/* Forgot Password Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-slate-900">
              Reset Password
            </CardTitle>
            <p className="text-sm text-center text-slate-600">
              Enter your email address and we'll send you a link to reset your
              password
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 border-slate-200 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">
                  We'll send password reset instructions to this email
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Reset Link...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center">
              <Link href="/auth">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="h-3 w-3" />
            <span>Secure password reset with enterprise-grade security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPasswordPage;

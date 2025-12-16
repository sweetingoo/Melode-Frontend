"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

export function FormMockup({ title, description, children, className = "", asDialog = false }) {
  if (asDialog) {
    return (
      <div className={`relative ${className}`}>
        <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/10">
          <div className="mb-3">
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {/* Dialog Mockup */}
          <div className="relative bg-background rounded-lg border shadow-xl max-w-2xl mx-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity" disabled>
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Dialog Content */}
            <div className="p-6">
              {children}
            </div>
            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <Button variant="outline" disabled size="sm">Cancel</Button>
              <Button disabled size="sm">Save</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 border-dashed border-muted rounded-lg p-4 bg-muted/20 ${className}`}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold mb-1">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="bg-background rounded-md border shadow-sm p-6">
        {children}
      </div>
    </div>
  );
}

export function DialogMockup({ title, description, children, footer, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/10">
        {/* Dialog Mockup with backdrop effect */}
        <div className="relative bg-background rounded-lg border shadow-xl max-w-2xl mx-auto overflow-hidden">
          {/* Dialog Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/30">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity" disabled>
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Dialog Content */}
          <div className="p-6 bg-background">
            {children}
          </div>
          {/* Dialog Footer */}
          {footer !== false && (
            <div className="flex items-center justify-end gap-2 p-6 border-t bg-muted/30">
              {footer || (
                <>
                  <Button variant="outline" disabled size="sm">Cancel</Button>
                  <Button disabled size="sm">Save</Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, type = "text", placeholder, icon: Icon, required = false, value = "", className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          disabled
          className={Icon ? "pl-10" : ""}
          readOnly
        />
      </div>
    </div>
  );
}

export function FormButton({ children, variant = "default", className = "", icon: Icon }) {
  return (
    <Button variant={variant} disabled className={className}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  );
}

export function FormCheckbox({ label, checked = false }) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox checked={checked} disabled />
      <Label className="text-sm font-normal cursor-pointer">{label}</Label>
    </div>
  );
}

export function FormTextarea({ label, placeholder, required = false, value = "", rows = 4, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        placeholder={placeholder}
        value={value}
        disabled
        readOnly
        rows={rows}
        className="resize-none"
      />
    </div>
  );
}

export function FormSelect({ label, placeholder, options = [], value = "", required = false, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value || undefined} disabled>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                index <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <span className="text-xs mt-1 text-muted-foreground">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                index < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}


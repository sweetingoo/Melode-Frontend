"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Send, Users, CheckCircle2, XCircle, Clock, Filter, BarChart3, AlertCircle, Mail, Smartphone, Calendar } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea, FormSelect } from "@/components/docs/FormMockup";

export default function BroadcastsDocumentation() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Megaphone className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Broadcasts</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Send announcements and important messages to multiple recipients with tracking and acknowledgment.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              Understanding the broadcast system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Broadcasts?</h3>
              <p className="text-sm text-muted-foreground">
                Broadcasts are one-to-many messages that allow you to send announcements, updates, or important 
                information to multiple recipients at once. Unlike regular messages, broadcasts support acknowledgment 
                tracking and delivery status monitoring.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Broadcasts</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Broadcasts" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 rounded">/admin/broadcasts</code></li>
                <li>Requires <code className="bg-muted px-1 rounded">message:read</code> or <code className="bg-muted px-1 rounded">broadcast:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Creating Broadcasts
            </CardTitle>
            <CardDescription>
              How to create and send broadcasts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating a New Broadcast</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Click "Create Broadcast" button</li>
                <li>Enter a title for your broadcast</li>
                <li>Write your message content</li>
                <li>Select recipients (users, roles, or departments)</li>
                <li>Set priority level (Low, Normal, High, Urgent)</li>
                <li>Choose category (optional)</li>
                <li>Configure delivery options (email, SMS, or both)</li>
                <li>Set acknowledgment requirements if needed</li>
                <li>Click "Send Broadcast"</li>
              </ol>
              <DialogMockup
                title="Create Broadcast"
                description="Send an announcement to multiple recipients"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">Cancel</FormButton>
                    <FormButton size="sm" icon={Send}>Send Broadcast</FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <FormField
                    label="Title"
                    type="text"
                    placeholder="Enter broadcast title"
                    required
                    value="Important: System Maintenance Scheduled"
                  />
                  <FormTextarea
                    label="Message"
                    placeholder="Enter your broadcast message..."
                    rows={6}
                    value="We will be performing scheduled system maintenance on Saturday, March 15th from 2:00 AM to 4:00 AM. The system will be unavailable during this time. Please plan accordingly."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                      label="Priority"
                      value="high"
                      options={[
                        { value: "low", label: "Low" },
                        { value: "normal", label: "Normal" },
                        { value: "high", label: "High" },
                        { value: "urgent", label: "Urgent" },
                      ]}
                    />
                    <FormSelect
                      label="Category"
                      value="system"
                      options={[
                        { value: "system", label: "System" },
                        { value: "announcement", label: "Announcement" },
                        { value: "alert", label: "Alert" },
                      ]}
                    />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-semibold">Recipients</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>All Users</Badge>
                      <Badge variant="outline">Marketing Team</Badge>
                      <Badge variant="outline">+12 more</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">SMS</span>
                    </div>
                  </div>
                </div>
              </DialogMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Broadcast Options</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Priority</strong>: Set message priority (affects notification urgency)</li>
                <li><strong>Category</strong>: Organize broadcasts by category</li>
                <li><strong>Require Acknowledgment</strong>: Require recipients to acknowledge receipt</li>
                <li><strong>Delivery Methods</strong>: Send via email, SMS, or both</li>
                <li><strong>Scheduled Delivery</strong>: Schedule broadcasts for future delivery</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tracking Broadcasts
            </CardTitle>
            <CardDescription>
              Monitor delivery and acknowledgment status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Viewing Broadcast Status</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Click on any broadcast to view detailed status</li>
                <li>See delivery status for each recipient</li>
                <li>Track acknowledgment status (if required)</li>
                <li>View read receipts and timestamps</li>
              </ul>
              <FormMockup title="Broadcast Status View" description="Monitor delivery and acknowledgment">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold">System Maintenance Scheduled</p>
                      <p className="text-xs text-muted-foreground">Sent to 25 recipients</p>
                    </div>
                    <Badge variant="default">High Priority</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Recipients</span>
                      <span className="font-semibold">25</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Delivered</span>
                      <span className="font-semibold text-green-600">24</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Acknowledged</span>
                      <span className="font-semibold text-blue-600">18</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-semibold text-yellow-600">7</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-sm font-semibold">Acknowledgment Breakdown</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Agreed</span>
                        <Badge variant="outline" className="bg-green-50">15</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Disagreed</span>
                        <Badge variant="outline" className="bg-red-50">3</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Not Acknowledged</span>
                        <Badge variant="outline">7</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Acknowledgment Status</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><CheckCircle2 className="h-4 w-4 inline text-green-600" /> <strong>Acknowledged</strong>: Recipient has acknowledged</li>
                <li><Clock className="h-4 w-4 inline text-yellow-600" /> <strong>Pending</strong>: Waiting for acknowledgment</li>
                <li><XCircle className="h-4 w-4 inline text-red-600" /> <strong>Not Acknowledged</strong>: Not yet acknowledged</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Broadcast Statistics</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Total recipients count</li>
                <li>Number of acknowledgments received</li>
                <li>Delivery success rate</li>
                <li>Read status for each recipient</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtering and Search
            </CardTitle>
            <CardDescription>
              Finding and organizing broadcasts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Filter Options</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Category</strong>: Filter by broadcast category</li>
                <li><strong>Priority</strong>: Filter by priority level</li>
                <li><strong>Unread Only</strong>: Show only unread broadcasts</li>
                <li><strong>Unacknowledged Only</strong>: Show broadcasts requiring acknowledgment</li>
                <li><strong>Search</strong>: Search by title or content</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Broadcast List View</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Sent broadcasts are highlighted in green</li>
                <li>Unread broadcasts are highlighted with a blue border</li>
                <li>Priority badges indicate message urgency</li>
                <li>Category badges help organize broadcasts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipients
            </CardTitle>
            <CardDescription>
              Selecting and managing broadcast recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Selecting Recipients</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Select individual users from the user list</li>
                <li>Select entire roles (all users with that role)</li>
                <li>Select departments (all users in that department)</li>
                <li>Combine multiple selection types</li>
                <li>Preview recipient count before sending</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>
              Required permissions for broadcast features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Broadcast Permissions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><code className="bg-muted px-1 rounded">broadcast:read</code> or <code className="bg-muted px-1 rounded">message:read</code> - View broadcasts</li>
                <li><code className="bg-muted px-1 rounded">broadcast:create</code> or <code className="bg-muted px-1 rounded">BROADCAST_CREATE</code> - Create broadcasts</li>
                <li>All users can receive and view broadcasts sent to them</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


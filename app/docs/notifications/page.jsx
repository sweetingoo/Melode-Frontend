"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, CheckSquare2, FileText, AlertCircle, Filter, Settings, Clock, BookOpen, MessageSquare, CheckCircle2 } from "lucide-react";
import { FormMockup } from "@/components/docs/FormMockup";

export default function NotificationsDocumentation() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Notifications</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Stay informed with real-time notifications for messages, tasks, documents, and system events.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              Understanding the notification system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Notifications?</h3>
              <p className="text-sm text-muted-foreground">
                Notifications keep you informed about important events in the system, including new messages, 
                task assignments, document shares, system alerts, and more. They appear in real-time and can 
                be accessed from the notification dropdown in the header.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Notifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click the bell icon in the header to open the notification dropdown</li>
                <li>View all notifications at <code className="bg-muted px-1 rounded">/admin/notifications</code></li>
                <li>Unread count badge shows number of unread notifications</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Different types of notifications you can receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Message Notifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>New messages in conversations</li>
                <li>Mentions in messages (@username)</li>
                <li>Broadcast announcements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Task Notifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Task assignments</li>
                <li>Task updates and status changes</li>
                <li>Task comments and mentions</li>
                <li>Task due date reminders</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Document Notifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Document shared with you</li>
                <li>Document updates</li>
                <li>Document made public</li>
                <li>Click to navigate directly to the document</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">System Notifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>System alerts and announcements</li>
                <li>Form submissions</li>
                <li>Project updates</li>
                <li>General system events</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Features
            </CardTitle>
            <CardDescription>
              Features and capabilities of the notification system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Real-time Updates</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Notifications appear instantly via Server-Sent Events (SSE)</li>
                <li>No page refresh needed to see new notifications</li>
                <li>Unread count updates automatically</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Notification Dropdown</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Shows recent notifications (typically last 10-20)</li>
                <li>Click on a notification to navigate to related content</li>
                <li>Mark notifications as read by clicking them</li>
                <li>View all notifications link to full notifications page</li>
              </ul>
              <FormMockup title="Notification Dropdown" description="Recent notifications in the header">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b">
                    <span className="text-sm font-semibold">Notifications</span>
                    <Badge variant="secondary">3 new</Badge>
                  </div>
                  <div className="p-3 bg-primary/5 border-l-2 border-primary rounded-lg cursor-pointer hover:bg-primary/10">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">Document Shared with You</span>
                          <Badge variant="outline" className="h-4 px-1 text-xs">Shared</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">John Doe shared "Employee Handbook"</p>
                        <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-semibold">New message from Sarah</span>
                        <p className="text-xs text-muted-foreground mt-1">15 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                    <div className="flex items-start gap-3">
                      <CheckSquare2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-semibold">Task assigned: Complete report</span>
                        <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="text-center">
                    <button className="text-xs text-primary hover:underline">View all notifications</button>
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Notification Badges</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Unread count shown on bell icon</li>
                <li>Badge updates in real-time</li>
                <li>Shows count up to 99, then "99+"</li>
              </ul>
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="relative">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-xs">
                    3
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">Bell Icon with Badge</p>
                  <p className="text-xs text-muted-foreground">Shows unread notification count</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Document Notification Badges</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Document notifications show event type badges</li>
                <li><strong>"Shared"</strong>: Document was shared with you</li>
                <li><strong>"Updated"</strong>: Document you have access to was updated</li>
                <li><strong>"Public"</strong>: Document was made public</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Managing Notifications
            </CardTitle>
            <CardDescription>
              Viewing and organizing your notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Notifications Page</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Access at <code className="bg-muted px-1 rounded">/admin/notifications</code></li>
                <li>View all notifications with pagination</li>
                <li>Filter by message type, priority, category, and read status</li>
                <li>Search notifications by content</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Filtering Options</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Message Type</strong>: Filter by notification, alert, task, general</li>
                <li><strong>Priority</strong>: Filter by priority level</li>
                <li><strong>Category</strong>: Filter by category (document, task, form, project, system)</li>
                <li><strong>Unread Only</strong>: Show only unread notifications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Marking as Read</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click on a notification to mark it as read</li>
                <li>Notifications are automatically marked as read when you navigate to related content</li>
                <li>Unread count decreases when notifications are read</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Notification Metadata
            </CardTitle>
            <CardDescription>
              Additional information in notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Document Notifications</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Document notifications include additional metadata:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><code className="bg-muted px-1 rounded">document_id</code>: ID of the document</li>
                <li><code className="bg-muted px-1 rounded">document_title</code>: Title of the document</li>
                <li><code className="bg-muted px-1 rounded">event_type</code>: Type of event (shared_with_you, updated, made_public)</li>
                <li><code className="bg-muted px-1 rounded">link_url</code>: Direct link to the document</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Navigation</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Clicking a notification navigates to the related content</li>
                <li>Document notifications link directly to <code className="bg-muted px-1 rounded">/documents/{`{id}`}</code></li>
                <li>Message notifications open the conversation</li>
                <li>Task notifications open the task detail page</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


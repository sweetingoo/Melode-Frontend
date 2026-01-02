"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Send, Users, MessageSquare, Search, Filter, Bell, UserPlus, CheckCircle2, Clock } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormTextarea } from "@/components/docs/FormMockup";

export default function MessagesDocumentation() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Messages</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Send and receive messages, manage conversations, and communicate with team members.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              Understanding the messaging system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Messages?</h3>
              <p className="text-sm text-muted-foreground">
                The Messages feature allows you to send direct messages to individual users or groups, 
                manage conversations, and track message history. It supports both one-on-one and group conversations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Messages</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Messages" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 rounded">/admin/messages</code></li>
                <li>Requires <code className="bg-muted px-1 rounded">message:read</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Sending Messages
            </CardTitle>
            <CardDescription>
              How to create and send messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Starting a New Conversation</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Click "Start Chat" or "New Message" button</li>
                <li>Select recipients (users, roles, or a combination)</li>
                <li>Enter your message in the text area</li>
                <li>Optionally attach files</li>
                <li>Click "Send" to deliver the message</li>
              </ol>
              <DialogMockup
                title="Start New Chat"
                description="Select recipients and compose your message"
                footer={
                  <>
                    <FormButton variant="outline" size="sm">Cancel</FormButton>
                    <FormButton size="sm" icon={Send}>Send Message</FormButton>
                  </>
                }
              >
                <div className="space-y-4">
                  <FormField
                    label="To"
                    type="text"
                    placeholder="Search users, roles, or departments..."
                    value="John Doe, Marketing Team"
                  />
                  <FormTextarea
                    label="Message"
                    placeholder="Type your message here..."
                    rows={6}
                    value="Hi team, I wanted to discuss the upcoming project deadline. Can we schedule a meeting this week?"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>💬 Mention users with @username</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>📎 Attach files</span>
                  </div>
                </div>
              </DialogMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Replying to Messages</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li>Click on a conversation to open it</li>
                <li>Type your reply in the message input at the bottom</li>
                <li>Press Enter or click "Send" to reply</li>
                <li>Messages are organized in conversation threads</li>
              </ul>
              <FormMockup title="Conversation View" description="View and reply to messages in a conversation">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">JD</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">John Doe</span>
                        <span className="text-xs text-muted-foreground">2 hours ago</span>
                      </div>
                      <p className="text-sm">Hi team, I wanted to discuss the upcoming project deadline.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">You</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">You</span>
                        <span className="text-xs text-muted-foreground">1 hour ago</span>
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-sm">Sure, let's schedule a meeting. How about Thursday at 2 PM?</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-end gap-2">
                    <FormTextarea
                      placeholder="Type your reply..."
                      rows={2}
                      className="flex-1"
                    />
                    <FormButton size="sm" icon={Send}>Send</FormButton>
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Message Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">User Mentions</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Use @ to mention users in messages</p>
                  <div className="mt-2 p-2 bg-background rounded border text-xs">
                    <span className="text-muted-foreground">Hey </span>
                    <Badge variant="secondary" className="h-4 px-1 text-xs">@john.doe</Badge>
                    <span className="text-muted-foreground">, can you review this?</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Read Receipts</span>
                  </div>
                  <p className="text-xs text-muted-foreground">See when messages are read</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-muted-foreground">Read by John Doe</span>
                    <Clock className="h-3 w-3 text-muted-foreground ml-2" />
                    <span className="text-muted-foreground">2:30 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Managing Conversations
            </CardTitle>
            <CardDescription>
              Organizing and managing your conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Conversation List</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>View all your conversations in the left sidebar</li>
                <li>Unread conversations are highlighted</li>
                <li>Click on a conversation to view messages</li>
                <li>Conversations are sorted by most recent activity</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Search and Filter</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Use the search bar to find specific conversations or messages</li>
                <li>Filter conversations by read/unread status</li>
                <li>Search works across message content and participant names</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Message Status</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Sent</strong>: Message has been delivered</li>
                <li><strong>Read</strong>: Recipient has viewed the message</li>
                <li><strong>Unread</strong>: Message hasn't been viewed yet</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              How messages trigger notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Real-time Notifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Receive instant notifications when you receive new messages</li>
                <li>Notifications appear in the notification dropdown (bell icon)</li>
                <li>Unread message count is shown in the sidebar</li>
                <li>Click on a notification to open the conversation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>
              Required permissions for messaging features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Message Permissions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><code className="bg-muted px-1 rounded">message:read</code> - View messages and conversations</li>
                <li><code className="bg-muted px-1 rounded">message:create</code> - Send new messages</li>
                <li><code className="bg-muted px-1 rounded">message:update</code> - Edit your own messages</li>
                <li><code className="bg-muted px-1 rounded">message:delete</code> - Delete your own messages</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


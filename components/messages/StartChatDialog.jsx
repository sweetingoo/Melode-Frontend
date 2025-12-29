"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  Settings,
  Mail,
  Smartphone,
  Bell,
  Search,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/RichTextEditor";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useAuth";
import { toast } from "sonner";

const StartChatDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  usersData,
  rolesData,
  tasksData,
  replyToMessageId = null, // Optional: message ID to reply to
  initialRecipients = null, // Optional: pre-selected recipients for replies
}) => {
  const { data: currentUser } = useCurrentUser();
  const [step, setStep] = useState("select"); // "select" or "compose"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    content_delivery_mode: "full",
    send_email: false,
    send_sms: false,
    send_push: true,
    alert_via_email: true, // Master switch for email alerts
    priority: "normal",
    message_type: "general",
    requires_acknowledgement: false,
    summary: "",
    image_url: "",
    link_url: "",
    link_text: "",
  });

  // Get users and roles from data, filtering out current user
  const users = useMemo(() => {
    const allUsers = usersData?.users || usersData?.data || [];
    if (!currentUser) return allUsers;
    // Filter out current user to prevent self-messaging
    return allUsers.filter((user) => {
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
      return userId !== currentUserId;
    });
  }, [usersData, currentUser]);

  const roles = useMemo(() => {
    return rolesData?.roles || rolesData || [];
  }, [rolesData]);

  // Filter users and roles based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(
      (role) =>
        role.display_name?.toLowerCase().includes(term) ||
        role.name?.toLowerCase().includes(term) ||
        role.slug?.toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  const handleUserSelect = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRoleId(roleId === selectedRoleId ? null : roleId);
    setSelectedUserIds([]); // Clear user selection when role is selected
  };

  const handleContinueToCompose = () => {
    if (selectedUserIds.length > 0 || selectedRoleId) {
      setStep("compose");
    }
  };

  const handleBackToSelect = () => {
    setStep("select");
  };

  // Initialize recipients if replying
  useEffect(() => {
    if (replyToMessageId && initialRecipients) {
      if (initialRecipients.userIds && initialRecipients.userIds.length > 0) {
        setSelectedUserIds(initialRecipients.userIds);
        setStep("compose"); // Skip selection step for replies
      } else if (initialRecipients.roleId) {
        setSelectedRoleId(initialRecipients.roleId);
        setStep("compose"); // Skip selection step for replies
      }
    }
  }, [replyToMessageId, initialRecipients]);

  const handleSubmit = () => {
    if (!message.trim() || (!selectedUserIds.length && !selectedRoleId && !replyToMessageId)) {
      return;
    }

    // Validate that user is not sending to themselves
    if (selectedUserIds.length > 0 && currentUser) {
      const isSendingToSelf = selectedUserIds.some((userId) => {
        const normalizedUserId = typeof userId === 'string' ? parseInt(userId) : userId;
        const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
        return normalizedUserId === normalizedCurrentUserId;
      });
      
      if (isSendingToSelf) {
        toast.error("Cannot send message", {
          description: "You cannot send a message to yourself.",
        });
        return;
      }
    }

    // Validate that at least one delivery channel is selected
    if (!advancedOptions.send_email && !advancedOptions.send_sms && !advancedOptions.send_push) {
      // Could show a toast/error here, but for now just return
      return;
    }

    // Auto-generate title if not provided
    const finalTitle = title.trim() || message.trim().substring(0, 50) + (message.length > 50 ? "..." : "");

    const submitData = {
      title: finalTitle,
      content: message.trim(),
      content_delivery_mode: advancedOptions.content_delivery_mode,
      send_email: advancedOptions.send_email,
      send_sms: advancedOptions.send_sms,
      send_push: advancedOptions.send_push,
      alert_via_email: advancedOptions.alert_via_email, // Master switch for email alerts
      priority: advancedOptions.priority,
      message_type: advancedOptions.message_type,
      requires_acknowledgement: advancedOptions.requires_acknowledgement,
    };

    // Add reply_to_message_id if replying
    if (replyToMessageId) {
      submitData.reply_to_message_id = replyToMessageId;
    }

    // Set target based on selection - ensure only one target type is set
    if (selectedRoleId) {
      submitData.target_type = "role";
      submitData.target_id = parseInt(selectedRoleId);
      // Explicitly don't send target_user_ids for role-based messages
      delete submitData.target_user_ids;
    } else if (selectedUserIds.length > 0) {
      submitData.target_type = "user";
      // Ensure all user IDs are integers
      submitData.target_user_ids = selectedUserIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      // Explicitly don't send target_id for user-based messages
      delete submitData.target_id;
    }

    // Add optional fields
    if (advancedOptions.summary) submitData.summary = advancedOptions.summary;
    if (advancedOptions.image_url) submitData.image_url = advancedOptions.image_url;
    if (advancedOptions.link_url) submitData.link_url = advancedOptions.link_url;
    if (advancedOptions.link_text) submitData.link_text = advancedOptions.link_text;

    onSubmit(submitData);
  };

  const handleClose = () => {
    setStep("select");
    setSearchTerm("");
    setSelectedUserIds([]);
    setSelectedRoleId(null);
    setMessage("");
    setTitle("");
    setShowAdvanced(false);
    setAdvancedOptions({
      content_delivery_mode: "full",
      send_email: false,
      send_sms: false,
      send_push: true,
      alert_via_email: true,
      priority: "normal",
      message_type: "general",
      requires_acknowledgement: false,
      summary: "",
      image_url: "",
      link_url: "",
      link_text: "",
    });
    onOpenChange(false);
  };

  const selectedUsers = useMemo(() => {
    return users.filter((u) => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id.toString() === selectedRoleId?.toString());
  }, [roles, selectedRoleId]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 flex flex-col h-[80vh]">
        {step === "select" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-xl">Start Chat</DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="px-6 py-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users or roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* Selection Summary */}
              {(selectedUserIds.length > 0 || selectedRoleId) && (
                <div className="px-6 py-4 border-b bg-muted/30 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedRole && (
                      <Badge variant="default" className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {selectedRole.display_name || selectedRole.name} (Group)
                      </Badge>
                    )}
                    {selectedUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="flex items-center gap-1.5"
                      >
                        <User className="h-3 w-3" />
                        {user.first_name} {user.last_name}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Delivery Channel Selection - Required */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-semibold">
                      Choose Delivery Channels <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select at least one channel to deliver your message
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Mail className={cn(
                          "h-4 w-4",
                          advancedOptions.send_email ? "text-primary" : "text-muted-foreground"
                        )} />
                        <Label htmlFor="send_email_select" className="text-sm font-medium cursor-pointer">
                          Email
                        </Label>
                        <Switch
                          id="send_email_select"
                          checked={advancedOptions.send_email}
                          onCheckedChange={(checked) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              send_email: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className={cn(
                          "h-4 w-4",
                          advancedOptions.send_sms ? "text-primary" : "text-muted-foreground"
                        )} />
                        <Label htmlFor="send_sms_select" className="text-sm font-medium cursor-pointer">
                          SMS
                        </Label>
                        <Switch
                          id="send_sms_select"
                          checked={advancedOptions.send_sms}
                          onCheckedChange={(checked) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              send_sms: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className={cn(
                          "h-4 w-4",
                          advancedOptions.send_push ? "text-primary" : "text-muted-foreground"
                        )} />
                        <Label htmlFor="send_push_select" className="text-sm font-medium cursor-pointer">
                          Push
                        </Label>
                        <Switch
                          id="send_push_select"
                          checked={advancedOptions.send_push}
                          onCheckedChange={(checked) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              send_push: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                    {!advancedOptions.send_email && !advancedOptions.send_sms && !advancedOptions.send_push && (
                      <p className="text-xs text-red-500 mt-2">
                        Please select at least one delivery channel
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Users and Roles List */}
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {/* Roles Section */}
                  {filteredRoles.length > 0 && (
                    <div>
                      <div className="px-6 py-2 bg-muted/20">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                          Groups (Roles)
                        </h3>
                      </div>
                      {filteredRoles.map((role) => {
                        const isSelected = selectedRoleId === role.id.toString();
                        return (
                          <div
                            key={role.id}
                            onClick={() => handleRoleSelect(role.id.toString())}
                            className={cn(
                              "px-6 py-4 cursor-pointer transition-colors hover:bg-muted/50 flex items-center gap-3",
                              isSelected && "bg-primary/5 border-l-4 border-l-primary"
                            )}
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">
                                  {role.display_name || role.name}
                                </h3>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {role.description || `Group: ${role.slug || role.name}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Users Section */}
                  {filteredUsers.length > 0 && (
                    <div>
                      <div className="px-6 py-2 bg-muted/20">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                          Users
                        </h3>
                      </div>
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user.id)}
                            className={cn(
                              "px-6 py-4 cursor-pointer transition-colors hover:bg-muted/50 flex items-center gap-3",
                              isSelected && "bg-primary/5 border-l-4 border-l-primary"
                            )}
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">
                                  {user.first_name} {user.last_name}
                                </h3>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filteredUsers.length === 0 && filteredRoles.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        No users or roles found
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex items-center justify-between bg-background">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleContinueToCompose}
                  disabled={
                    (selectedUserIds.length === 0 && !selectedRoleId) ||
                    (!advancedOptions.send_email && !advancedOptions.send_sms && !advancedOptions.send_push)
                  }
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToSelect}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <DialogTitle className="text-xl">New Message</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedRole && (
                      <Badge variant="default" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedRole.display_name || selectedRole.name}
                      </Badge>
                    )}
                    {selectedUsers.map((user) => (
                      <Badge key={user.id} variant="secondary" className="text-xs">
                        {user.first_name} {user.last_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message Composition */}
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Message title (auto-generated if empty)"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <RichTextEditor
                      value={message}
                      onChange={setMessage}
                      placeholder="Type your message..."
                    />
                  </div>
                </div>
              </ScrollArea>

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-6 py-3 border-t rounded-none"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Advanced Options</span>
                    </div>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 py-4 space-y-4 border-t bg-muted/20 max-h-[300px] overflow-y-auto">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Content Delivery Mode</Label>
                    <select
                      value={advancedOptions.content_delivery_mode}
                      onChange={(e) =>
                        setAdvancedOptions({
                          ...advancedOptions,
                          content_delivery_mode: e.target.value,
                        })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="full">Full - Full content in email/SMS</option>
                      <option value="app_only">App Only - Link in email/SMS</option>
                      <option value="hybrid">Hybrid - Summary in email/SMS</option>
                    </select>
                  </div>

                  {advancedOptions.content_delivery_mode === "hybrid" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Summary</Label>
                      <Textarea
                        value={advancedOptions.summary}
                        onChange={(e) =>
                          setAdvancedOptions({
                            ...advancedOptions,
                            summary: e.target.value,
                          })
                        }
                        placeholder="Enter summary for email/SMS..."
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Email Alert Control</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor="alert_via_email" className="text-sm font-medium cursor-pointer">
                            Enable Email Alerts
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Master switch: If disabled, no email will be sent regardless of other settings
                          </p>
                        </div>
                        <Switch
                          id="alert_via_email"
                          checked={advancedOptions.alert_via_email}
                          onCheckedChange={(checked) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              alert_via_email: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Delivery Channels</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="send_email" className="text-sm cursor-pointer">
                            Email
                          </Label>
                        </div>
                        <input
                          type="checkbox"
                          id="send_email"
                          checked={advancedOptions.send_email}
                          onChange={(e) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              send_email: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300"
                          disabled={!advancedOptions.alert_via_email}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="send_sms" className="text-sm cursor-pointer">
                            SMS
                          </Label>
                        </div>
                        <input
                          type="checkbox"
                          id="send_sms"
                          checked={advancedOptions.send_sms}
                          onChange={(e) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              send_sms: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="send_push" className="text-sm cursor-pointer">
                            Push Notification
                          </Label>
                        </div>
                        <input
                          type="checkbox"
                          id="send_push"
                          checked={advancedOptions.send_push}
                          onChange={(e) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              send_push: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Priority</Label>
                      <select
                        value={advancedOptions.priority}
                        onChange={(e) =>
                          setAdvancedOptions({
                            ...advancedOptions,
                            priority: e.target.value,
                          })
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Message Type</Label>
                      <select
                        value={advancedOptions.message_type}
                        onChange={(e) =>
                          setAdvancedOptions({
                            ...advancedOptions,
                            message_type: e.target.value,
                          })
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="general">General</option>
                        <option value="notification">Notification</option>
                        <option value="alert">Alert</option>
                        <option value="task">Task</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requires_acknowledgement"
                      checked={advancedOptions.requires_acknowledgement}
                      onChange={(e) =>
                        setAdvancedOptions({
                          ...advancedOptions,
                          requires_acknowledgement: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="requires_acknowledgement" className="text-sm cursor-pointer">
                      Requires Acknowledgement
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image URL (optional)</Label>
                    <Input
                      value={advancedOptions.image_url}
                      onChange={(e) =>
                        setAdvancedOptions({
                          ...advancedOptions,
                          image_url: e.target.value,
                        })
                      }
                      placeholder="https://example.com/image.jpg"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Link URL (optional)</Label>
                      <Input
                        value={advancedOptions.link_url}
                        onChange={(e) =>
                          setAdvancedOptions({
                            ...advancedOptions,
                            link_url: e.target.value,
                          })
                        }
                        placeholder="https://example.com"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Link Text (optional)</Label>
                      <Input
                        value={advancedOptions.link_text}
                        onChange={(e) =>
                          setAdvancedOptions({
                            ...advancedOptions,
                            link_text: e.target.value,
                          })
                        }
                        placeholder="Click here"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex items-center justify-between bg-background">
                <p className="text-xs text-muted-foreground">
                  Press Cmd/Ctrl + Enter to send
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isLoading ||
                      !message.trim() ||
                      (selectedUserIds.length === 0 && !selectedRoleId) ||
                      (!advancedOptions.send_email && !advancedOptions.send_sms && !advancedOptions.send_push)
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StartChatDialog;

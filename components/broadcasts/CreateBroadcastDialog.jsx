"use client";

import React, { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/RichTextEditor";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useAuth";
import { toast } from "sonner";

const CreateBroadcastDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  usersData,
  rolesData,
}) => {
  const { data: currentUser } = useCurrentUser();
  const [step, setStep] = useState("compose"); // "select" or "compose"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    content_delivery_mode: "full", // "full", "app_only", "hybrid"
    send_email: false,
    send_sms: false,
    send_push: true,
    priority: "normal", // "low", "normal", "high", "urgent"
    requires_acknowledgement: false,
    target_type: "user", // "user", "role", "target_user_ids"
  });

  // Get users and roles from data
  const users = useMemo(() => {
    const allUsers = usersData?.users || usersData?.data || [];
    return allUsers;
  }, [usersData]);

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

  const handleSubmit = () => {
    // Validation
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (formData.target_type === "user" && selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (formData.target_type === "role" && !selectedRoleId) {
      toast.error("Please select a role");
      return;
    }

    if (!formData.send_email && !formData.send_sms && !formData.send_push) {
      toast.error("Please select at least one delivery channel");
      return;
    }

    const submitData = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || undefined,
      content_delivery_mode: formData.content_delivery_mode,
      send_email: formData.send_email,
      send_sms: formData.send_sms,
      send_push: formData.send_push,
      priority: formData.priority,
      requires_acknowledgement: formData.requires_acknowledgement,
      // Explicit null so useCreateMessage routes to /broadcasts, not /messages
      conversation_id: null,
    };

    // Set target based on selection
    // Backend expects target_type to be one of: 'user', 'role', 'department'
    if (formData.target_type === "role" && selectedRoleId) {
      submitData.target_type = "role";
      submitData.target_id = parseInt(selectedRoleId);
    } else if (formData.target_type === "user" && selectedUserIds.length > 0) {
      submitData.target_type = "user";
      submitData.target_user_ids = selectedUserIds.map((id) =>
        typeof id === "string" ? parseInt(id) : id
      );
    } else if (selectedUserIds.length > 0) {
      // If users are selected but target_type wasn't "user", default to "user"
      submitData.target_type = "user";
      submitData.target_user_ids = selectedUserIds.map((id) =>
        typeof id === "string" ? parseInt(id) : id
      );
    }

    onSubmit(submitData);
  };

  const handleClose = () => {
    setStep("compose");
    setSearchTerm("");
    setSelectedUserIds([]);
    setSelectedRoleId(null);
    setTitle("");
    setContent("");
    setCategory("");
    setShowAdvanced(false);
    setFormData({
      content_delivery_mode: "full",
      send_email: false,
      send_sms: false,
      send_push: true,
      priority: "normal",
      requires_acknowledgement: false,
      target_type: "user",
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
      <DialogContent className="max-w-3xl p-0 flex flex-col h-[85vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Create Broadcast</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter broadcast title"
                  className="h-9"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Content <span className="text-red-500">*</span>
                </Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Enter broadcast content..."
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., policy, announcement, training"
                  className="h-9"
                />
              </div>

              {/* Target Type */}
              <div className="space-y-2">
                <Label htmlFor="target_type">Target Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, target_type: value });
                    setSelectedUserIds([]);
                    setSelectedRoleId(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Specific Users</SelectItem>
                    <SelectItem value="role">Role (Group)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Selection */}
              {formData.target_type === "role" && (
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <ScrollArea className="h-48 border rounded-md">
                      <div className="divide-y">
                        {filteredRoles.map((role) => {
                          const isSelected = selectedRoleId === role.id.toString();
                          return (
                            <div
                              key={role.id}
                              onClick={() => handleRoleSelect(role.id.toString())}
                              className={cn(
                                "px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 flex items-center gap-3",
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
                    </ScrollArea>
                    {selectedRole && (
                      <Badge variant="default" className="flex items-center gap-1.5 w-fit">
                        <Users className="h-3 w-3" />
                        {selectedRole.display_name || selectedRole.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {formData.target_type === "user" && (
                <div className="space-y-2">
                  <Label>Select Users</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <ScrollArea className="h-48 border rounded-md">
                      <div className="divide-y">
                        {filteredUsers.map((user) => {
                          const isSelected = selectedUserIds.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              onClick={() => handleUserSelect(user.id)}
                              className={cn(
                                "px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 flex items-center gap-3",
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
                    </ScrollArea>
                    {selectedUsers.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
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
                    )}
                  </div>
                </div>
              )}

              {/* Requires Acknowledgement - Moved to main form */}
              <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                <Switch
                  id="requires_acknowledgement"
                  checked={formData.requires_acknowledgement}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_acknowledgement: checked })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="requires_acknowledgement" className="text-sm font-medium cursor-pointer">
                    Requires Acknowledgement
                  </Label>
                  {formData.requires_acknowledgement && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Users will need to agree/disagree in the app after reading this broadcast.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-0 py-3"
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
                <CollapsibleContent className="space-y-4 pt-2">
                  {/* Content Delivery Mode */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Content Delivery Mode <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.content_delivery_mode}
                      onValueChange={(value) =>
                        setFormData({ ...formData, content_delivery_mode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">
                          Full - Full content in email/SMS (unimportant messages)
                        </SelectItem>
                        <SelectItem value="app_only">
                          App Only - Only link in email/SMS, content in app (important messages)
                        </SelectItem>
                        <SelectItem value="hybrid">
                          Hybrid - Summary in email/SMS, full content link
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.content_delivery_mode === "app_only" && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Content must be read in the app. Users will receive a link in email/SMS.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Delivery Channels */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Delivery Channels <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="send_email" className="text-sm cursor-pointer">
                            Email
                          </Label>
                        </div>
                        <Switch
                          id="send_email"
                          checked={formData.send_email}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, send_email: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="send_sms" className="text-sm cursor-pointer">
                            SMS
                          </Label>
                        </div>
                        <Switch
                          id="send_sms"
                          checked={formData.send_sms}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, send_sms: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="send_push" className="text-sm cursor-pointer">
                            Push Notification
                          </Label>
                        </div>
                        <Switch
                          id="send_push"
                          checked={formData.send_push}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, send_push: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-between bg-background">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                !title.trim() ||
                !content.trim() ||
                (formData.target_type === "user" && selectedUserIds.length === 0) ||
                (formData.target_type === "role" && !selectedRoleId) ||
                (!formData.send_email && !formData.send_sms && !formData.send_push)
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
                  Send Broadcast
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBroadcastDialog;


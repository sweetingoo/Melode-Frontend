"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { getUserDisplayName } from "@/utils/user";

function normalizeRolesListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.roles && Array.isArray(data.roles)) return data.roles;
  return [];
}

/** Job-role row meta: show description and department independently when present. */
function broadcastJobRoleMeta(role) {
  const desc = role.description && String(role.description).trim();
  const deptName = role.department?.name?.trim();
  return { desc: desc || "", deptName: deptName || "" };
}

function compareBroadcastJobRoles(a, b) {
  const deptA = (a.department?.name || "").trim().toLowerCase();
  const deptB = (b.department?.name || "").trim().toLowerCase();
  const noDept = "\uFFFF";
  const keyA = deptA || noDept;
  const keyB = deptB || noDept;
  if (keyA !== keyB) {
    return keyA.localeCompare(keyB, undefined, { sensitivity: "base" });
  }
  const nameA = (a.display_name || a.name || "").toLowerCase();
  const nameB = (b.display_name || b.name || "").toLowerCase();
  return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
}

const CreateBroadcastDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialTitle = "",
  initialContent = "",
}) => {
  const [step, setStep] = useState("compose"); // "select" or "compose"
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userSuggestResults, setUserSuggestResults] = useState([]);
  const [userSuggestLoading, setUserSuggestLoading] = useState(false);
  const [jobRolesResults, setJobRolesResults] = useState([]);
  const [jobRolesLoading, setJobRolesLoading] = useState(false);
  const [jobRolesLoadingMore, setJobRolesLoadingMore] = useState(false);
  const [jobRolesPage, setJobRolesPage] = useState(1);
  const [jobRolesHasMore, setJobRolesHasMore] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedUsersById, setSelectedUsersById] = useState(() => new Map());
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [selectedRolesById, setSelectedRolesById] = useState(() => new Map());
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

  useEffect(() => {
    if (open && (initialTitle || initialContent)) {
      if (initialTitle) setTitle(initialTitle);
      if (initialContent) setContent(initialContent);
    }
  }, [open, initialTitle, initialContent]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!open || formData.target_type !== "user") return;
    let cancelled = false;
    (async () => {
      setUserSuggestLoading(true);
      try {
        const res = await usersService.suggestUsers({
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          is_active: true,
          per_page: 50,
        });
        if (!cancelled) setUserSuggestResults(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch {
        if (!cancelled) setUserSuggestResults([]);
      } finally {
        if (!cancelled) setUserSuggestLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, formData.target_type, debouncedSearch]);

  useEffect(() => {
    if (!open || formData.target_type !== "role") return;
    let cancelled = false;
    setJobRolesLoading(true);
    setJobRolesPage(1);
    (async () => {
      try {
        const res = await rolesService.getRoles({
          page: 1,
          per_page: 50,
          role_type: "job_role",
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        });
        if (cancelled) return;
        const list = normalizeRolesListResponse(res.data);
        setJobRolesResults(list);
        setJobRolesHasMore(list.length >= 50);
      } catch {
        if (!cancelled) {
          setJobRolesResults([]);
          setJobRolesHasMore(false);
        }
      } finally {
        if (!cancelled) setJobRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, formData.target_type, debouncedSearch]);

  const loadMoreJobRoles = useCallback(async () => {
    if (jobRolesLoading || jobRolesLoadingMore || !jobRolesHasMore) return;
    const nextPage = jobRolesPage + 1;
    setJobRolesLoadingMore(true);
    try {
      const res = await rolesService.getRoles({
        page: nextPage,
        per_page: 50,
        role_type: "job_role",
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const list = normalizeRolesListResponse(res.data);
      setJobRolesResults((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const merged = [...prev];
        for (const r of list) {
          if (r?.id != null && !seen.has(r.id)) {
            seen.add(r.id);
            merged.push(r);
          }
        }
        return merged;
      });
      setJobRolesPage(nextPage);
      setJobRolesHasMore(list.length >= 50);
    } catch {
      toast.error("Could not load more roles");
    } finally {
      setJobRolesLoadingMore(false);
    }
  }, [debouncedSearch, jobRolesHasMore, jobRolesLoading, jobRolesLoadingMore, jobRolesPage]);

  const handleUserSelect = (user) => {
    const userId = user?.id;
    if (userId == null) return;
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
      setSelectedUsersById((m) => {
        const next = new Map(m);
        next.delete(userId);
        return next;
      });
      return;
    }
    setSelectedUserIds((prev) => [...prev, userId]);
    setSelectedUsersById((m) => new Map(m).set(userId, user));
  };

  const handleRoleSelect = (role) => {
    if (role?.id == null) return;
    const id = role.id.toString();
    if (selectedRoleIds.includes(id)) {
      setSelectedRoleIds((prev) => prev.filter((r) => r !== id));
      setSelectedRolesById((m) => {
        const next = new Map(m);
        next.delete(role.id);
        return next;
      });
    } else {
      setSelectedRoleIds((prev) => [...prev, id]);
      setSelectedRolesById((m) => new Map(m).set(role.id, role));
    }
    setSelectedUserIds([]);
    setSelectedUsersById(new Map());
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

    if (formData.target_type === "role" && selectedRoleIds.length === 0) {
      toast.error("Please select at least one role");
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
    // Backend expects target_type 'user' with target_user_ids, or 'role' with target_role_ids (multiple roles supported)
    if (formData.target_type === "role" && selectedRoleIds.length > 0) {
      submitData.target_type = "role";
      submitData.target_role_ids = selectedRoleIds.map((id) => (typeof id === "string" ? parseInt(id, 10) : id));
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
    setDebouncedSearch("");
    setUserSuggestResults([]);
    setJobRolesResults([]);
    setJobRolesPage(1);
    setJobRolesHasMore(false);
    setSelectedUserIds([]);
    setSelectedUsersById(new Map());
    setSelectedRoleIds([]);
    setSelectedRolesById(new Map());
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
    return selectedUserIds.map((id) => selectedUsersById.get(id) || { id, display_name: `User #${id}` });
  }, [selectedUserIds, selectedUsersById]);

  const selectedRoles = useMemo(() => {
    return selectedRoleIds.map((idStr) => {
      const idNum = parseInt(idStr, 10);
      const fromMap = selectedRolesById.get(idNum);
      if (fromMap) return fromMap;
      return { id: idNum, display_name: `Role #${idStr}`, name: idStr };
    });
  }, [selectedRoleIds, selectedRolesById]);

  const sortedJobRolesForList = useMemo(() => {
    return [...jobRolesResults].sort(compareBroadcastJobRoles);
  }, [jobRolesResults]);

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
                    setSelectedUsersById(new Map());
                    setSelectedRoleIds([]);
                    setSelectedRolesById(new Map());
                    setSearchTerm("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Specific Users</SelectItem>
                    <SelectItem value="role">Job role</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Selection */}
              {formData.target_type === "role" && (
                <div className="space-y-2">
                  <Label>Select job role(s)</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search job roles…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                        autoComplete="off"
                      />
                    </div>
                    <ScrollArea className="h-48 border rounded-md">
                      <div className="divide-y">
                        {jobRolesLoading ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading roles…
                          </div>
                        ) : jobRolesResults.length === 0 ? (
                          <p className="py-8 px-4 text-center text-sm text-muted-foreground">
                            {debouncedSearch
                              ? "No job roles match. Try another search."
                              : "No job roles found."}
                          </p>
                        ) : (
                          sortedJobRolesForList.map((role) => {
                            const isSelected = selectedRoleIds.includes(role.id.toString());
                            const { desc, deptName } = broadcastJobRoleMeta(role);
                            return (
                              <div
                                key={role.id}
                                onClick={() => handleRoleSelect(role)}
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
                                  {(desc || deptName) ? (
                                    <div className="mt-0.5 space-y-0.5">
                                      {desc ? (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
                                      ) : null}
                                      {deptName ? (
                                        <p className="text-xs text-muted-foreground truncate">{deptName}</p>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    {jobRolesHasMore && !jobRolesLoading && jobRolesResults.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={jobRolesLoadingMore}
                        onClick={() => loadMoreJobRoles()}
                      >
                        {jobRolesLoadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading…
                          </>
                        ) : (
                          "Load more roles"
                        )}
                      </Button>
                    )}
                    {selectedRoles.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedRoles.map((role) => (
                          <Badge key={role.id} variant="default" className="flex items-center gap-1.5 w-fit">
                            <Users className="h-3 w-3" />
                            {role.display_name || role.name}
                          </Badge>
                        ))}
                      </div>
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
                        placeholder="Search by name or email…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                        autoComplete="off"
                      />
                    </div>
                    <ScrollArea className="h-48 border rounded-md">
                      <div className="divide-y">
                        {userSuggestLoading ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading users…
                          </div>
                        ) : userSuggestResults.length === 0 ? (
                          <p className="py-8 px-4 text-center text-sm text-muted-foreground">
                            {debouncedSearch
                              ? "No users match. Try another search."
                              : "Type to search users, or browse the first suggestions below."}
                          </p>
                        ) : (
                          userSuggestResults.map((user) => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                              <div
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
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
                                    <h3 className="font-semibold text-sm">{getUserDisplayName(user)}</h3>
                                    {isSelected && (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  {user.email ? (
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        )}
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
                            {getUserDisplayName(user)}
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
                (formData.target_type === "role" && selectedRoleIds.length === 0) ||
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


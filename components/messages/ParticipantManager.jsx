"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, X, Search, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAddParticipant, useRemoveParticipant } from "@/hooks/useMessages";
import { usePresence } from "@/hooks/usePresence";

const ParticipantManager = ({
  conversationId,
  conversation,
  usersData,
  currentUser,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const addParticipantMutation = useAddParticipant();
  const removeParticipantMutation = useRemoveParticipant();
  const { isUserOnline } = usePresence();

  // Get all users
  const allUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData?.users || usersData?.data || [];
  }, [usersData]);

  // Get participant IDs
  const participantIds = useMemo(() => {
    if (!conversation?.participant_user_ids) return [];
    return conversation.participant_user_ids.map(id =>
      typeof id === 'string' ? parseInt(id) : id
    );
  }, [conversation?.participant_user_ids]);

  // Get participant user objects
  const participants = useMemo(() => {
    return participantIds
      .map(id => {
        const user = allUsers.find(u => {
          const userId = typeof u.id === 'string' ? parseInt(u.id) : id;
          return userId === id;
        });
        return user ? { ...user, id: typeof user.id === 'string' ? parseInt(user.id) : user.id } : null;
      })
      .filter(Boolean);
  }, [participantIds, allUsers]);

  // Check if current user is a participant
  const isCurrentUserParticipant = useMemo(() => {
    if (!currentUser) return false;
    const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
    return participantIds.includes(currentUserId);
  }, [participantIds, currentUser]);

  // Check if can remove (not last participant)
  const canRemove = participantIds.length > 1;

  // Filter users for add dialog (exclude existing participants)
  const availableUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers.filter(user => {
        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        return !participantIds.includes(userId);
      }).slice(0, 50); // Limit to first 50 for performance
    }

    const queryLower = searchQuery.toLowerCase();
    return allUsers.filter(user => {
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      if (participantIds.includes(userId)) return false;
      
      const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
      const displayName = name || user.email || user.username || "";
      return (
        displayName.toLowerCase().includes(queryLower) ||
        user.email?.toLowerCase().includes(queryLower) ||
        user.username?.toLowerCase().includes(queryLower)
      );
    }).slice(0, 50);
  }, [allUsers, participantIds, searchQuery]);

  const handleAddParticipant = async (userId) => {
    if (!conversationId) return;
    
    try {
      await addParticipantMutation.mutateAsync({
        conversationId,
        userId,
      });
      setShowAddDialog(false);
      setSearchQuery("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRemoveClick = (user) => {
    setUserToRemove(user);
    setShowRemoveDialog(true);
  };

  const handleRemoveConfirm = async () => {
    if (!conversationId || !userToRemove) return;
    
    const userId = typeof userToRemove.id === 'string' ? parseInt(userToRemove.id) : userToRemove.id;
    
    try {
      await removeParticipantMutation.mutateAsync({
        conversationId,
        userId,
      });
      setShowRemoveDialog(false);
      setUserToRemove(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isRemovingSelf = useMemo(() => {
    if (!userToRemove || !currentUser) return false;
    const userId = typeof userToRemove.id === 'string' ? parseInt(userToRemove.id) : userToRemove.id;
    const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
    return userId === currentUserId;
  }, [userToRemove, currentUser]);

  // Don't show if current user is not a participant
  if (!isCurrentUserParticipant) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Participants ({participants.length})</span>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <UserPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Participant</DialogTitle>
                <DialogDescription>
                  Search and select a user to add to this conversation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <ScrollArea className="h-[300px]">
                  {availableUsers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {searchQuery ? "No users found" : "No available users"}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableUsers.map((user) => {
                        const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || `User #${user.id}`;
                        const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
                        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                        const isOnline = isUserOnline(userId);
                        
                        return (
                          <button
                            key={user.id}
                            onClick={() => handleAddParticipant(userId)}
                            disabled={addParticipantMutation.isPending}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left",
                              addParticipantMutation.isPending && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{displayName}</span>
                                {isOnline && (
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                )}
                              </div>
                              {user.email && user.email !== displayName && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </div>
                              )}
                            </div>
                            {addParticipantMutation.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {participants.map((user) => {
            const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || `User #${user.id}`;
            const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
            const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
            const isOnline = isUserOnline(userId);
            const isCurrentUser = currentUser && (
              typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id
            ) === userId;
            const canRemoveThis = canRemove && (isCurrentUser || isCurrentUserParticipant);

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {displayName}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                      )}
                    </span>
                    {isOnline && (
                      <div className="h-2 w-2 rounded-full bg-green-500" title="Online" />
                    )}
                  </div>
                  {user.email && user.email !== displayName && (
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  )}
                </div>
                {canRemoveThis && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRemoveClick(user)}
                    disabled={removeParticipantMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRemovingSelf ? "Leave Conversation?" : "Remove Participant?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRemovingSelf ? (
                <>
                  Are you sure you want to leave this conversation? You will no longer receive messages from this thread.
                </>
              ) : (
                <>
                  Are you sure you want to remove <strong>{userToRemove ? `${userToRemove.first_name || ""} ${userToRemove.last_name || ""}`.trim() || userToRemove.email || "this user" : "this participant"}</strong> from this conversation?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToRemove(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeParticipantMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                isRemovingSelf ? "Leave" : "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ParticipantManager;


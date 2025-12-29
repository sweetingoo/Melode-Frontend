"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { X, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRemoveParticipant } from "@/hooks/useMessages";
import { usePresence } from "@/hooks/usePresence";

const ParticipantManager = ({
  conversationId,
  conversation,
  usersData,
  currentUser,
}) => {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  
  const removeParticipantMutation = useRemoveParticipant();
  const { isUserOnline } = usePresence();

  // Get all users
  const allUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData?.users || usersData?.data || [];
  }, [usersData]);

  // Get participant IDs (deduplicated)
  const participantIds = useMemo(() => {
    if (!conversation?.participant_user_ids) return [];
    const ids = conversation.participant_user_ids.map(id =>
      typeof id === 'string' ? parseInt(id, 10) : id
    ).filter(id => !isNaN(id));
    // Remove duplicates
    return [...new Set(ids)];
  }, [conversation?.participant_user_ids]);

  // Get participant user objects (deduplicated by user ID)
  const participants = useMemo(() => {
    const participantMap = new Map();
    
    participantIds.forEach(id => {
      // Skip if we already have this user
      if (participantMap.has(id)) return;
      
      const user = allUsers.find(u => {
        const userId = typeof u.id === 'string' ? parseInt(u.id, 10) : u.id;
        return userId === id;
      });
      
      if (user) {
        const normalizedId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        participantMap.set(normalizedId, { ...user, id: normalizedId });
      }
    });
    
    return Array.from(participantMap.values());
  }, [participantIds, allUsers]);

  // Check if current user is a participant
  const isCurrentUserParticipant = useMemo(() => {
    if (!currentUser) return false;
    const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
    return participantIds.includes(currentUserId);
  }, [participantIds, currentUser]);

  // Check if can remove (not last participant)
  const canRemove = participantIds.length > 1;

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
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Participants ({participants.length})</span>
        </div>

        <div className="space-y-2">
          {participants.map((user, index) => {
            const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || `User #${user.id}`;
            const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
            const isOnline = isUserOnline(userId);
            const isCurrentUser = currentUser && (
              typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id
            ) === userId;
            const canRemoveThis = canRemove && (isCurrentUser || isCurrentUserParticipant);

            return (
              <div
                key={`participant-${user.id}-${index}`}
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


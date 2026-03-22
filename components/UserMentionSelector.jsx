"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, User, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserDisplayName } from "@/utils/user";

/** Account flags from full or minimal GET /users rows */
function UserStatusInline({ user, compact = false }) {
  if (!user) return null;
  const chips = [];

  if (user.is_active === false) {
    chips.push(
      <span
        key="inactive"
        className="text-[10px] font-medium uppercase tracking-wide text-destructive border border-destructive/35 rounded px-1.5 py-0 shrink-0"
      >
        Inactive
      </span>
    );
  } else if (user.is_active === true && !compact) {
    chips.push(
      <span
        key="active"
        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0 shrink-0"
      >
        Active
      </span>
    );
  }

  if (user.is_verified === false) {
    chips.push(
      <span
        key="unverified"
        className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400 border border-amber-500/40 rounded px-1.5 py-0 shrink-0"
      >
        Unverified
      </span>
    );
  } else if (user.is_verified === true && !compact) {
    chips.push(
      <span
        key="verified"
        className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400 border border-emerald-500/35 rounded px-1.5 py-0 shrink-0"
      >
        Verified
      </span>
    );
  }

  if (user.is_superuser) {
    chips.push(
      <span
        key="super"
        className="text-[10px] font-medium uppercase tracking-wide text-primary border border-primary/40 rounded px-1.5 py-0 shrink-0"
      >
        Superuser
      </span>
    );
  }

  if (chips.length === 0) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1",
        compact ? "inline-flex" : "shrink-0"
      )}
    >
      {chips}
    </div>
  );
}

const UserMentionSelector = ({
  users = [],
  selectedUserIds = [],
  onSelectionChange,
  placeholder = "Type to search users...",
  maxHeight = "300px",
  className = "",
  singleSelection = false, // New prop for single selection mode
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  // Filter users based on search term (works for full or minimal user list from API)
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const displayName = getUserDisplayName(user);
    const statusBlob = [
      user.is_active === false ? "inactive" : "",
      user.is_active === true ? "active" : "",
      user.is_verified === true ? "verified" : "",
      user.is_verified === false ? "unverified" : "",
      user.is_superuser ? "superuser" : "",
    ]
      .join(" ")
      .toLowerCase();
    return (
      displayName.toLowerCase().includes(searchLower) ||
      statusBlob.includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  // Get selected users
  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.id)
  );

  // Get unselected filtered users
  const availableUsers = filteredUsers.filter(
    (user) => !selectedUserIds.includes(user.id)
  );

  const handleUserSelect = (userId) => {
    if (singleSelection) {
      // For single selection, replace the selection
      onSelectionChange([userId]);
      setSearchTerm("");
      setIsOpen(false); // Close dropdown after selection
    } else {
      // For multiple selection, add to the list
      const newSelection = [...selectedUserIds, userId];
      onSelectionChange(newSelection);
      setSearchTerm("");
      // Keep popover open for multiple selections
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleUserRemove = (userId, e) => {
    e.stopPropagation();
    const newSelection = selectedUserIds.filter((id) => id !== userId);
    onSelectionChange(newSelection);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("space-y-2 relative", className)}>
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1.5 pr-1 max-w-full flex-wrap h-auto py-1"
            >
              <User className="h-3 w-3 shrink-0" />
              <span className="text-xs break-words text-left">{getUserDisplayName(user)}</span>
              <UserStatusInline user={user} compact />
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => handleUserRemove(user.id, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input with Dropdown */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9"
        />
        
        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden"
            style={{ maxHeight }}
          >
            {availableUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchTerm
                  ? `No users found matching "${searchTerm}"`
                  : selectedUserIds.length === users.length
                  ? "All users are already selected"
                  : "No users available"}
              </div>
            ) : (
              <div className="p-1 overflow-y-auto" style={{ maxHeight }}>
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium truncate min-w-0">
                            {getUserDisplayName(user)}
                          </span>
                          <UserStatusInline user={user} />
                        </div>
                        {user.email && user.email !== getUserDisplayName(user) && (
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check className="h-4 w-4 text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Count - Only show for multiple selection */}
      {!singleSelection && selectedUserIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};

export default UserMentionSelector;


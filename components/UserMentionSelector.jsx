"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, User, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const displayName = user.display_name || 
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || 
      user.email || "";
    return (
      displayName.toLowerCase().includes(searchLower) ||
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

  const getUserDisplayName = (user) => {
    return (
      user.display_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email ||
      `User #${user.id}`
    );
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
              className="flex items-center gap-1 pr-1"
            >
              <User className="h-3 w-3" />
              <span className="text-xs">{getUserDisplayName(user)}</span>
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
                        <div className="font-medium truncate">
                          {getUserDisplayName(user)}
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


"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, User, Search, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserDisplayName } from "@/utils/user";
import { usersService } from "@/services/users";

function idsMatch(a, b) {
  return String(a) === String(b);
}

/** Account flags from GET /users, GET /users/suggest, or transformed user rows (snake_case or camelCase). */
function UserStatusInline({ user, compact = false }) {
  if (!user) return null;
  const isActive = user.is_active ?? user.isActive;
  const isVerified = user.is_verified ?? user.isVerified;
  const isSuperuser = user.is_superuser ?? user.isSuperuser;
  const chips = [];

  if (isActive === false) {
    chips.push(
      <span
        key="inactive"
        className="text-[10px] font-medium uppercase tracking-wide text-destructive border border-destructive/35 rounded px-1.5 py-0 shrink-0"
      >
        Inactive
      </span>
    );
  } else if (isActive === true && !compact) {
    chips.push(
      <span
        key="active"
        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0 shrink-0"
      >
        Active
      </span>
    );
  }

  if (isVerified === false) {
    chips.push(
      <span
        key="unverified"
        className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400 border border-amber-500/40 rounded px-1.5 py-0 shrink-0"
      >
        Unverified
      </span>
    );
  } else if (isVerified === true) {
    chips.push(
      <span
        key="verified"
        className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400 border border-emerald-500/35 rounded px-1.5 py-0 shrink-0"
      >
        Verified
      </span>
    );
  }

  if (isSuperuser) {
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
  singleSelection = false,
  /** When true, loads options via GET /users/suggest (debounced); not limited to first page of GET /users */
  lazyUserSuggest = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestResults, setSuggestResults] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [knownUsersById, setKnownUsersById] = useState(() => new Map());
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!users?.length) return;
    setKnownUsersById((prev) => {
      const next = new Map(prev);
      for (const u of users) {
        if (u?.id != null) next.set(Number(u.id), u);
      }
      return next;
    });
  }, [users]);

  useEffect(() => {
    if (!lazyUserSuggest || !isOpen) return;
    let cancelled = false;
    setSuggestLoading(true);
    (async () => {
      try {
        const res = await usersService.suggestUsers({
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          is_active: true,
          per_page: 100,
        });
        const list = Array.isArray(res.data?.users) ? res.data.users : [];
        if (cancelled) return;
        setSuggestResults(list);
        setKnownUsersById((prev) => {
          const next = new Map(prev);
          for (const u of list) {
            if (u?.id != null) next.set(Number(u.id), u);
          }
          return next;
        });
      } catch {
        if (!cancelled) setSuggestResults([]);
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lazyUserSuggest, isOpen, debouncedSearch]);

  const filteredUsers = useMemo(() => {
    if (lazyUserSuggest) return suggestResults;
    return users.filter((user) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const displayName = getUserDisplayName(user);
      const statusBlob = [
        (user.is_active ?? user.isActive) === false ? "inactive" : "",
        (user.is_active ?? user.isActive) === true ? "active" : "",
        (user.is_verified ?? user.isVerified) === true ? "verified" : "",
        (user.is_verified ?? user.isVerified) === false ? "unverified" : "",
        user.is_superuser || user.isSuperuser ? "superuser" : "",
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
  }, [lazyUserSuggest, suggestResults, users, searchTerm]);

  const selectedUsers = useMemo(() => {
    if (lazyUserSuggest) {
      return selectedUserIds.map((rawId) => {
        const idNum = Number(rawId);
        return (
          knownUsersById.get(idNum) ||
          users.find((u) => idsMatch(u.id, rawId)) || {
            id: idNum,
            display_name: `User #${rawId}`,
          }
        );
      });
    }
    return users.filter((user) => selectedUserIds.some((id) => idsMatch(id, user.id)));
  }, [lazyUserSuggest, knownUsersById, users, selectedUserIds]);

  const availableUsers = useMemo(
    () =>
      filteredUsers.filter(
        (user) => !selectedUserIds.some((id) => idsMatch(id, user.id))
      ),
    [filteredUsers, selectedUserIds]
  );

  const handleUserSelect = (user) => {
    const userId = user?.id;
    if (userId == null) return;
    if (lazyUserSuggest && user) {
      setKnownUsersById((m) => new Map(m).set(Number(user.id), user));
    }
    if (singleSelection) {
      onSelectionChange([userId]);
      setSearchTerm("");
      setIsOpen(false);
    } else {
      const newSelection = [...selectedUserIds, userId];
      onSelectionChange(newSelection);
      setSearchTerm("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleUserRemove = (userId, e) => {
    e.stopPropagation();
    const newSelection = selectedUserIds.filter((id) => !idsMatch(id, userId));
    onSelectionChange(newSelection);
  };

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

  const listSourceLength = lazyUserSuggest ? suggestResults.length : users.length;

  return (
    <div ref={containerRef} className={cn("space-y-2 relative", className)}>
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

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden"
            style={{ maxHeight }}
          >
            {lazyUserSuggest && suggestLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users…
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {lazyUserSuggest && debouncedSearch
                  ? `No users found matching "${debouncedSearch}"`
                  : searchTerm && !lazyUserSuggest
                    ? `No users found matching "${searchTerm}"`
                    : selectedUserIds.length === listSourceLength && !lazyUserSuggest
                      ? "All users are already selected"
                      : lazyUserSuggest
                        ? "No users match. Try another search."
                        : "No users available"}
              </div>
            ) : (
              <div className="p-1 overflow-y-auto" style={{ maxHeight }}>
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
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

      {!singleSelection && selectedUserIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};

export default UserMentionSelector;

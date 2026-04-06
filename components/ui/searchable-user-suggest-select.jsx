"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usersService } from "@/services/users";
import { getUserDisplayName } from "@/utils/user";

/**
 * Searchable lazy-loaded user picker (GET /users/suggest). Layout matches SearchableFieldSelect.
 *
 * @param {Object} props
 * @param {string} props.value - Selected user id, or ""
 * @param {string} [props.displayLabel] - Label to show on the trigger when `value` is set
 * @param {function({ id: string, user: object }): void} props.onValueChange
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {boolean} [props.compact]
 * @param {string} [props.roleIds] - Comma-separated role ids for suggest API
 */
export function SearchableUserSuggestSelect({
  value,
  displayLabel = "",
  onValueChange,
  placeholder = "Search and select user…",
  disabled = false,
  className,
  compact = false,
  roleIds,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = debouncedSearch.trim();
        const res = await usersService.suggestUsers({
          ...(q ? { search: q } : {}),
          ...(roleIds ? { role_ids: roleIds } : {}),
          is_active: true,
        });
        if (!cancelled) setResults(res.data?.users || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch, roleIds]);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const visible = results.filter((u) => u?.id);

  return (
    <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between font-normal",
            compact && "h-7 text-xs w-40",
            !compact && "h-9 w-full min-w-[160px]",
            className
          )}
        >
          <span className="truncate">
            {value ? displayLabel || `User #${value}` : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[var(--radix-popover-trigger-width)] p-0", compact && "max-h-[280px]")}
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="relative border-b px-2 py-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-0 bg-transparent pl-9 pr-2 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <ScrollArea className="max-h-[240px]">
          <div className="p-1">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : visible.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No users found</div>
            ) : (
              visible.map((u) => {
                const idStr = String(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={cn(
                      "w-full cursor-pointer truncate rounded-sm px-2 py-1.5 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      value === idStr && "bg-accent"
                    )}
                    onClick={() => {
                      onValueChange({ id: idStr, user: u });
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {getUserDisplayName(u)}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

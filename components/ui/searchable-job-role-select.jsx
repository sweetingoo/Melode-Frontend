"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRolePickerLabel } from "@/hooks/useRoles";

/**
 * Searchable picker for a flat list of job roles (client-side filter).
 *
 * @param {Object} props
 * @param {string} props.value - Selected role id, or ""
 * @param {string} [props.displayLabel]
 * @param {function({ id: string, role: object }): void} props.onValueChange
 * @param {Array<object>} props.roles
 * @param {boolean} [props.loading]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {boolean} [props.compact]
 */
export function SearchableJobRoleSelect({
  value,
  displayLabel = "",
  onValueChange,
  roles = [],
  loading = false,
  placeholder = "Search and select role…",
  disabled = false,
  className,
  compact = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(roles) ? roles : [];
    if (!q) return list;
    return list.filter((r) => {
      if (!r?.id) return false;
      const label = formatRolePickerLabel(r).toLowerCase();
      const name = `${r.display_name || ""} ${r.name || ""} ${r.slug || ""}`.toLowerCase();
      return label.includes(q) || name.includes(q);
    });
  }, [roles, search]);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) setSearch("");
  };

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
          <span className="truncate">{value ? displayLabel || `Role #${value}` : placeholder}</span>
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
            placeholder="Search by role or department…"
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
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No roles found</div>
            ) : (
              filtered.map((r) => {
                const idStr = String(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={cn(
                      "w-full cursor-pointer truncate rounded-sm px-2 py-1.5 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      value === idStr && "bg-accent"
                    )}
                    onClick={() => {
                      onValueChange({ id: idStr, role: r });
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {formatRolePickerLabel(r)}
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

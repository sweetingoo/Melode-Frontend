"use client";

import * as React from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Normalize field to { value, label } for display. value = field_id | id | name.
 */
function getFieldValue(f) {
  return String(f.field_id ?? f.id ?? f.name ?? "");
}

function getFieldLabel(f) {
  return f.label ?? f.field_label ?? f.field_id ?? f.id ?? f.name ?? "";
}

/**
 * Searchable dropdown for choosing a form/tracker field (e.g. conditional visibility "depends on").
 * Use when the field list can be long (50+) so users can type to filter.
 *
 * @param {Object} props
 * @param {Array} props.fields - List of field objects (field_id/id/name, label, field_type, etc.)
 * @param {string} props.value - Selected value (field id or "__none__")
 * @param {function(string): void} props.onValueChange - Called with selected value
 * @param {string} [props.placeholder] - Trigger placeholder when nothing selected
 * @param {boolean} [props.noneOption] - If true, show "Always show" / "Select field" with value "__none__"
 * @param {string} [props.noneLabel] - Label for the none option (default "Always show" or "Select field")
 * @param {string} [props.excludeFieldId] - Field id to exclude from the list (e.g. current field)
 * @param {string[]} [props.excludeTypes] - Field types to exclude (e.g. display-only types)
 * @param {string} [props.className] - Class for the trigger button
 * @param {function(): void} [props.onCreateNew] - Optional: show a footer action to create a new field (e.g. tracker layout editor)
 * @param {string} [props.createNewLabel] - Label for the create action (default "Create new field…")
 * @param {boolean} [props.compact] - Use smaller trigger (h-7 text-xs)
 */
export function SearchableFieldSelect({
  fields = [],
  value,
  onValueChange,
  placeholder = "Select field...",
  noneOption = false,
  noneLabel = "Always show",
  excludeFieldId,
  excludeTypes = [],
  className,
  compact = false,
  onCreateNew,
  createNewLabel = "Create new field…",
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    let list = fields.filter((f) => {
      const val = getFieldValue(f);
      if (!val) return false;
      if (excludeFieldId && val === String(excludeFieldId)) return false;
      if (excludeTypes.length) {
        const type = (f.field_type ?? f.type ?? "").toLowerCase();
        if (excludeTypes.some((t) => t.toLowerCase() === type)) return false;
      }
      return true;
    });
    const q = (search || "").trim().toLowerCase();
    if (q) {
      list = list.filter((f) => {
        const label = getFieldLabel(f).toLowerCase();
        const val = getFieldValue(f).toLowerCase();
        return label.includes(q) || val.includes(q);
      });
    }
    return list;
  }, [fields, search, excludeFieldId, excludeTypes]);

  const selectedField = value === "__none__" || !value
    ? null
    : fields.find((f) => getFieldValue(f) === value);
  const displayLabel = selectedField ? getFieldLabel(selectedField) : (noneOption && value === "__none__" ? noneLabel : null);

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            compact && "h-7 text-xs w-40",
            !compact && "h-9 w-full min-w-[160px]",
            className
          )}
        >
          <span className="truncate">
            {displayLabel ?? placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", compact && "max-h-[280px]")} align="start">
        <div className="flex items-center border-b px-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="max-h-[240px]">
          <div className="p-1">
            {noneOption && (
              <button
                type="button"
                className={cn(
                  "w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  (value === "__none__" || !value) && "bg-accent"
                )}
                onClick={() => handleSelect("__none__")}
              >
                {noneLabel}
              </button>
            )}
            {filtered.map((f) => {
              const val = getFieldValue(f);
              const label = getFieldLabel(f);
              return (
                <button
                  key={val}
                  type="button"
                  className={cn(
                    "w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value === val && "bg-accent"
                  )}
                  onClick={() => handleSelect(val)}
                >
                  {label || val}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No fields found.
              </div>
            )}
          </div>
        </ScrollArea>
        {typeof onCreateNew === "function" && (
          <div className="border-t border-border p-1">
            <Button
              type="button"
              variant="ghost"
              className={cn("w-full justify-start font-normal h-9 text-sm", compact && "h-8 text-xs")}
              onClick={() => {
                onCreateNew();
                setOpen(false);
                setSearch("");
              }}
            >
              <Plus className="mr-2 h-4 w-4 shrink-0 opacity-70" />
              {createNewLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

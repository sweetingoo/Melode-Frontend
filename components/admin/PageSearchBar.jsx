"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable search bar component for admin pages
 * Displays search input, optional filters button, and optional create button
 */
export const PageSearchBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  showFilters = false,
  isFiltersOpen = false,
  onToggleFilters,
  showCreateButton = false,
  onCreateClick,
  createButtonText = "Create",
  createButtonIcon: CreateIcon = Plus,
  className,
  inputRef,
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {showSearch && (
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 w-full h-10"
                />
              </div>
            )}
            <div className="flex gap-3">
              {showFilters && (
                <Button
                  variant="outline"
                  onClick={onToggleFilters}
                  className="flex-1 sm:flex-none sm:w-auto shrink-0 h-10 whitespace-nowrap"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              )}
              {showCreateButton && (
                <Button
                  onClick={onCreateClick}
                  className="flex-1 sm:flex-none sm:w-auto shrink-0 h-10 whitespace-nowrap"
                >
                  <CreateIcon className="mr-2 h-4 w-4" />
                  {createButtonText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

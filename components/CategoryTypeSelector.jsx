"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveCategoryTypes } from "@/hooks/useCategoryTypes";
import { Loader2 } from "lucide-react";

const CategoryTypeSelector = ({
  value,
  onValueChange,
  placeholder = "Select category type",
  disabled = false,
  showIcon = true,
  showColor = false,
  useSlug = false, // If true, uses slug as value instead of ID
  className,
}) => {
  const { data: categoryTypesData, isLoading } = useActiveCategoryTypes();

  // Extract category types from response
  let categoryTypes = [];
  if (categoryTypesData) {
    if (Array.isArray(categoryTypesData)) {
      categoryTypes = categoryTypesData;
    } else if (categoryTypesData.category_types && Array.isArray(categoryTypesData.category_types)) {
      categoryTypes = categoryTypesData.category_types;
    } else if (categoryTypesData.data && Array.isArray(categoryTypesData.data)) {
      categoryTypes = categoryTypesData.data;
    } else if (categoryTypesData.results && Array.isArray(categoryTypesData.results)) {
      categoryTypes = categoryTypesData.results;
    }
  }

  // Sort by sort_order, then by display_name
  // Note: The /active/all endpoint already sorts by sort_order, but we do a secondary
  // sort by display_name for consistency and to handle any edge cases
  const sortedCategoryTypes = [...categoryTypes].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  // Get the value to use for the select
  const getSelectValue = (categoryType) => {
    return useSlug ? (categoryType.slug || categoryType.name) : categoryType.id.toString();
  };

  return (
    <Select
      value={value?.toString() || ""}
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
      className={className}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading categories..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading category types...</span>
            </div>
          </SelectItem>
        ) : sortedCategoryTypes.length === 0 ? (
          <SelectItem value="none" disabled>
            No category types available
          </SelectItem>
        ) : (
          sortedCategoryTypes.map((categoryType) => (
            <SelectItem key={categoryType.id} value={getSelectValue(categoryType)}>
              <div className="flex items-center gap-2">
                {showIcon && categoryType.icon && (
                  <span className="text-base">{categoryType.icon}</span>
                )}
                {showColor && categoryType.color && (
                  <div
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: categoryType.color }}
                  />
                )}
                <span>{categoryType.display_name || categoryType.name}</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default CategoryTypeSelector;

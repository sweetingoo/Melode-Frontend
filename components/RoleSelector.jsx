"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Building2,
  Users,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useUserDepartments, useSwitchDepartment, departmentContextUtils } from "@/hooks/useDepartmentContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RoleSelector = ({ 
  variant = "default", // "default" | "compact" | "dropdown"
  showLabel = true,
  className,
  onDepartmentChange,
}) => {
  const { data: departmentsData, isLoading, error } = useUserDepartments();
  const switchDepartmentMutation = useSwitchDepartment();
  const [activeRoleId, setActiveRoleId] = useState(null);

  // Debug: Log the API response to understand the structure
  useEffect(() => {
    if (departmentsData) {
      console.log("RoleSelector - API Response:", departmentsData);
    }
  }, [departmentsData]);

  const departments = departmentsData?.departments || [];
  const currentRoleId = departmentsData?.current_role_id;

  // Initialize active role from localStorage or API response
  useEffect(() => {
    if (!departments || departments.length === 0) return;

    const savedRoleId = departmentContextUtils.getActiveRoleId();
    
    // Priority: savedRoleId > currentRoleId > first department's role
    if (savedRoleId) {
      // Verify saved role still exists in user's departments
      const roleExists = departments.some(
        (d) => d.role?.id === savedRoleId
      );
      if (roleExists) {
        setActiveRoleId(savedRoleId);
        return;
      }
    }

    // Use current role from API if available
    if (currentRoleId) {
      setActiveRoleId(currentRoleId);
      departmentContextUtils.setActiveRoleId(currentRoleId);
      return;
    }

    // Auto-select first department's role if none is selected
    const firstRoleId = departments[0]?.role?.id;
    if (firstRoleId) {
      setActiveRoleId(firstRoleId);
      departmentContextUtils.setActiveRoleId(firstRoleId);
    }
  }, [departments, currentRoleId]);

  const handleDepartmentChange = async (departmentId) => {
    // Find the department and get its role_id
    const selectedDept = departments.find(
      (d) => d.department?.id === parseInt(departmentId)
    );
    
    if (!selectedDept?.role?.id) {
      console.error("No role found for selected department");
      return;
    }

    const roleId = selectedDept.role.id;
    setActiveRoleId(roleId);
    
    try {
      await switchDepartmentMutation.mutateAsync(roleId);
      if (onDepartmentChange) {
        onDepartmentChange(parseInt(departmentId));
      }
    } catch (error) {
      // Error is handled by the mutation's onError
      // Revert the selection on error
      const previousRoleId = departmentContextUtils.getActiveRoleId();
      setActiveRoleId(previousRoleId);
    }
  };

  // Find current department based on active role
  const currentDepartment = departments.find(
    (d) => d.role?.id === activeRoleId || d.role?.id === currentRoleId
  );

  const currentRole = currentDepartment?.role;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        {showLabel && <span className="text-sm text-muted-foreground">Loading roles...</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-red-500", className)}>
        <AlertCircle className="h-4 w-4" />
        {showLabel && <span className="text-sm">Failed to load roles</span>}
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Building2 className="h-4 w-4" />
        {showLabel && <span className="text-sm">No roles assigned</span>}
      </div>
    );
  }

  if (departments.length === 1) {
    // Only one role - show it as read-only
    const dept = departments[0];
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          {showLabel && (
            <span className="text-xs text-muted-foreground">Role</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{dept.department?.name}</span>
            {dept.role && (
              <Badge variant="outline" className="text-xs">
                {dept.role.display_name || dept.role.name || dept.role.role_name}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Multiple departments - show selector
  if (variant === "compact") {
    // Determine what to display
    const displayDepartment = currentDepartment || departments[0];
    const displayRole = currentRole || departments[0]?.role;
    const displayText = displayDepartment?.department?.name || departments[0]?.department?.name || "Select role";
    const roleText = displayRole?.display_name || displayRole?.name || displayRole?.role_name || departments[0]?.role?.display_name || departments[0]?.role?.name || departments[0]?.role?.role_name;

    return (
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center",
                    className
                  )}
                  disabled={switchDepartmentMutation.isPending}
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="ml-2 truncate min-w-0 flex-1 block group-data-[collapsible=icon]:hidden">
                    {displayText}
                  </span>
                  {roleText && (
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-xs shrink-0 block group-data-[collapsible=icon]:hidden"
                    >
                      {roleText}
                    </Badge>
                  )}
                  {switchDepartmentMutation.isPending && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin shrink-0" />
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent 
              side="right"
              className="hidden group-data-[collapsible=icon]:block"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {displayDepartment?.department?.name || departments[0]?.department?.name || "Select role"}
                </span>
                {displayRole && (
                  <span className="text-xs text-muted-foreground">
                    {displayRole.display_name || displayRole.name || displayRole.role_name}
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-[280px]" align="start">
          <div className="space-y-2">
            <div className="font-semibold text-sm mb-3">Switch Role</div>
            {departments.map((dept) => {
              const isActive = dept.role?.id === activeRoleId || dept.role?.id === currentRoleId;
              return (
                <Button
                  key={dept.department?.id}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleDepartmentChange(dept.department?.id)}
                  disabled={switchDepartmentMutation.isPending || isActive}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{dept.department?.name}</span>
                        {dept.role && (
                          <span className="text-xs text-muted-foreground">
                            {dept.role.display_name || dept.role.name || dept.role.role_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4" />}
                  </div>
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === "dropdown") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-start", className)}
            disabled={switchDepartmentMutation.isPending}
          >
            <Building2 className="mr-2 h-4 w-4" />
            {currentDepartment?.department?.name || "Select department"}
            {currentRole && (
              <Badge variant="secondary" className="ml-2">
                {currentRole.display_name || currentRole.name || currentRole.role_name}
              </Badge>
            )}
            {switchDepartmentMutation.isPending && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px]" align="start">
          <div className="space-y-2">
            <div className="font-semibold text-sm mb-3">Switch Role</div>
            {departments.map((dept) => {
              const isActive = dept.role?.id === activeRoleId || dept.role?.id === currentRoleId;
              return (
                <Button
                  key={dept.department?.id}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleDepartmentChange(dept.department?.id)}
                  disabled={switchDepartmentMutation.isPending || isActive}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{dept.department?.name}</span>
                        {dept.role && (
                          <span className="text-xs text-muted-foreground">
                            {dept.role.display_name || dept.role.name || dept.role.role_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4" />}
                  </div>
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <label className="text-sm font-medium">Active Role</label>
      )}
      <Select
        value={currentDepartment?.department?.id?.toString() || ""}
        onValueChange={handleDepartmentChange}
        disabled={switchDepartmentMutation.isPending}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select department">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {currentDepartment?.department?.name || "Select department"}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {departments.map((dept) => {
            const isActive = dept.role?.id === activeRoleId || dept.role?.id === currentRoleId;
            return (
              <SelectItem
                key={dept.department?.id}
                value={dept.department?.id?.toString()}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{dept.department?.name}</span>
                    {dept.role && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {dept.role.display_name || dept.role.name || dept.role.role_name}
                      </Badge>
                    )}
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {currentRole && (
        <p className="text-xs text-muted-foreground">
          Current role: <span className="font-medium">{currentRole.display_name || currentRole.name || currentRole.role_name}</span>
        </p>
      )}
    </div>
  );
};

export default RoleSelector;


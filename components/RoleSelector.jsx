"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Shield,
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
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);

  // Debug: Log the API response to understand the structure
  useEffect(() => {
    if (departmentsData) {
      console.log("RoleSelector - API Response:", departmentsData);
    }
  }, [departmentsData]);

  const assignments = departmentsData?.departments || [];
  const currentAssignmentId = departmentsData?.current_assignment_id;

  // Group assignments by department
  const assignmentsByDepartment = useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return [];

    const grouped = {};
    assignments.forEach((assignment) => {
      const deptId = assignment.department?.id;
      if (!deptId) return;

      if (!grouped[deptId]) {
        grouped[deptId] = {
          department: assignment.department,
          roles: [],
        };
      }

      if (assignment.assignment_id && assignment.role) {
        grouped[deptId].roles.push({
          assignment_id: assignment.assignment_id,
          role: assignment.role,
          is_active: assignment.is_active,
        });
      }
    });

    return Object.values(grouped);
  }, [assignments]);

  // Initialize active assignment from localStorage or API response
  useEffect(() => {
    if (!assignments || assignments.length === 0) return;

    const savedAssignmentId = typeof window !== "undefined" 
      ? localStorage.getItem("assignment_id") 
      : null;
    
    // Priority: savedAssignmentId > currentAssignmentId > first assignment
    if (savedAssignmentId) {
      const assignmentId = parseInt(savedAssignmentId);
      // Verify saved assignment still exists
      const assignmentExists = assignments.some(
        (a) => a.assignment_id === assignmentId
      );
      if (assignmentExists) {
        setActiveAssignmentId(assignmentId);
        return;
      }
    }

    // Use current assignment from API if available
    if (currentAssignmentId) {
      setActiveAssignmentId(currentAssignmentId);
      if (typeof window !== "undefined") {
        localStorage.setItem("assignment_id", currentAssignmentId.toString());
      }
      return;
    }

    // Auto-select first assignment if none is selected
    const firstAssignmentId = assignments[0]?.assignment_id;
    if (firstAssignmentId) {
      setActiveAssignmentId(firstAssignmentId);
      if (typeof window !== "undefined") {
        localStorage.setItem("assignment_id", firstAssignmentId.toString());
      }
    }
  }, [assignments, currentAssignmentId]);

  const handleRoleSwitch = async (assignmentId) => {
    setActiveAssignmentId(assignmentId);
    
    try {
      await switchDepartmentMutation.mutateAsync(assignmentId);
      if (onDepartmentChange) {
        onDepartmentChange(assignmentId);
      }
    } catch (error) {
      // Error is handled by the mutation's onError
      // Revert the selection on error
      const previousAssignmentId = typeof window !== "undefined"
        ? localStorage.getItem("assignment_id")
        : null;
      if (previousAssignmentId) {
        setActiveAssignmentId(parseInt(previousAssignmentId));
      }
    }
  };

  // Find current assignment
  const currentAssignment = assignments.find(
    (a) => a.assignment_id === activeAssignmentId || a.assignment_id === currentAssignmentId
  );

  const currentDepartment = currentAssignment?.department;
  const currentRole = currentAssignment?.role;

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

  if (assignments.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Building2 className="h-4 w-4" />
        {showLabel && <span className="text-sm">No roles assigned</span>}
      </div>
    );
  }

  // If only one assignment, show it as read-only
  if (assignments.length === 1) {
    const assignment = assignments[0];
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          {showLabel && (
            <span className="text-xs text-muted-foreground">Role</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{assignment.department?.name}</span>
            {assignment.role && (
              <Badge variant="outline" className="text-xs">
                {assignment.role.display_name || assignment.role.name || assignment.role.role_name}
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
    const displayText = currentDepartment?.name || assignmentsByDepartment[0]?.department?.name || "Select role";
    const roleText = currentRole?.display_name || currentRole?.name || currentRole?.role_name || "";

    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
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
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent 
              side="right"
              className="hidden group-data-[collapsible=icon]:block"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {displayText}
                </span>
                {currentRole && (
                  <span className="text-xs text-muted-foreground">
                    {currentRole.display_name || currentRole.name || currentRole.role_name}
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {assignmentsByDepartment.map((deptGroup) => (
            <div key={deptGroup.department.id}>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                {deptGroup.department.name}
              </DropdownMenuLabel>
              {deptGroup.roles.map((roleAssignment) => {
                const isActive = roleAssignment.assignment_id === activeAssignmentId || 
                                 roleAssignment.assignment_id === currentAssignmentId;
                return (
                  <DropdownMenuItem
                    key={roleAssignment.assignment_id}
                    className={cn(
                      "cursor-pointer pl-6",
                      isActive && "bg-accent"
                    )}
                    onClick={() => handleRoleSwitch(roleAssignment.assignment_id)}
                    disabled={switchDepartmentMutation.isPending || isActive}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {roleAssignment.role.display_name || roleAssignment.role.name || roleAssignment.role.role_name}
                        </span>
                      </div>
                      {isActive && <Check className="h-3 w-3 text-primary" />}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              {assignmentsByDepartment.indexOf(deptGroup) < assignmentsByDepartment.length - 1 && (
                <DropdownMenuSeparator />
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-start", className)}
            disabled={switchDepartmentMutation.isPending}
          >
            <Building2 className="mr-2 h-4 w-4" />
            {currentDepartment?.name || "Select department"}
            {currentRole && (
              <Badge variant="secondary" className="ml-2">
                {currentRole.display_name || currentRole.name || currentRole.role_name}
              </Badge>
            )}
            {switchDepartmentMutation.isPending && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {assignmentsByDepartment.map((deptGroup) => (
            <div key={deptGroup.department.id}>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                {deptGroup.department.name}
              </DropdownMenuLabel>
              {deptGroup.roles.map((roleAssignment) => {
                const isActive = roleAssignment.assignment_id === activeAssignmentId || 
                                 roleAssignment.assignment_id === currentAssignmentId;
                return (
                  <DropdownMenuItem
                    key={roleAssignment.assignment_id}
                    className={cn(
                      "cursor-pointer pl-6",
                      isActive && "bg-accent"
                    )}
                    onClick={() => handleRoleSwitch(roleAssignment.assignment_id)}
                    disabled={switchDepartmentMutation.isPending || isActive}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {roleAssignment.role.display_name || roleAssignment.role.name || roleAssignment.role.role_name}
                        </span>
                      </div>
                      {isActive && <Check className="h-3 w-3 text-primary" />}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              {assignmentsByDepartment.indexOf(deptGroup) < assignmentsByDepartment.length - 1 && (
                <DropdownMenuSeparator />
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <label className="text-sm font-medium">Active Role</label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start" disabled={switchDepartmentMutation.isPending}>
            <Building2 className="mr-2 h-4 w-4" />
            {currentDepartment?.name || "Select role"}
            {currentRole && (
              <Badge variant="secondary" className="ml-2">
                {currentRole.display_name || currentRole.name || currentRole.role_name}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {assignmentsByDepartment.map((deptGroup) => (
            <div key={deptGroup.department.id}>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                {deptGroup.department.name}
              </DropdownMenuLabel>
              {deptGroup.roles.map((roleAssignment) => {
                const isActive = roleAssignment.assignment_id === activeAssignmentId || 
                                 roleAssignment.assignment_id === currentAssignmentId;
                return (
                  <DropdownMenuItem
                    key={roleAssignment.assignment_id}
                    className={cn(
                      "cursor-pointer pl-6",
                      isActive && "bg-accent"
                    )}
                    onClick={() => handleRoleSwitch(roleAssignment.assignment_id)}
                    disabled={switchDepartmentMutation.isPending || isActive}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {roleAssignment.role.display_name || roleAssignment.role.name || roleAssignment.role.role_name}
                        </span>
                      </div>
                      {isActive && <Check className="h-3 w-3 text-primary" />}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              {assignmentsByDepartment.indexOf(deptGroup) < assignmentsByDepartment.length - 1 && (
                <DropdownMenuSeparator />
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {currentRole && (
        <p className="text-xs text-muted-foreground">
          Current role: <span className="font-medium">{currentRole.display_name || currentRole.name || currentRole.role_name}</span>
        </p>
      )}
    </div>
  );
};

export default RoleSelector;


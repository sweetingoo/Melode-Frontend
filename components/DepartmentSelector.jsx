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

const DepartmentSelector = ({ 
  variant = "default", // "default" | "compact" | "dropdown"
  showLabel = true,
  className,
  onDepartmentChange,
}) => {
  const { data: departmentsData, isLoading, error } = useUserDepartments();
  const switchDepartmentMutation = useSwitchDepartment();
  const [activeDepartmentId, setActiveDepartmentId] = useState(null);

  const departments = departmentsData?.departments || [];
  const currentDepartmentId = departmentsData?.current_department_id || activeDepartmentId;

  // Initialize active department from localStorage or API response
  useEffect(() => {
    if (!departments || departments.length === 0) return;

    const savedDeptId = departmentContextUtils.getActiveDepartmentId();
    
    // Priority: savedDeptId > currentDepartmentId > first department
    if (savedDeptId) {
      // Verify saved department still exists in user's departments
      const deptExists = departments.some(
        (d) => d.department?.id === savedDeptId
      );
      if (deptExists) {
        setActiveDepartmentId(savedDeptId);
        return;
      }
    }

    // Use current department from API if available
    if (currentDepartmentId) {
      setActiveDepartmentId(currentDepartmentId);
      departmentContextUtils.setActiveDepartmentId(currentDepartmentId);
      return;
    }

    // Auto-select first department if none is selected
    const firstDeptId = departments[0]?.department?.id;
    if (firstDeptId) {
      setActiveDepartmentId(firstDeptId);
      departmentContextUtils.setActiveDepartmentId(firstDeptId);
    }
  }, [departments, currentDepartmentId]);

  const handleDepartmentChange = async (departmentId) => {
    const deptId = parseInt(departmentId);
    setActiveDepartmentId(deptId);
    
    try {
      await switchDepartmentMutation.mutateAsync(deptId);
      if (onDepartmentChange) {
        onDepartmentChange(deptId);
      }
    } catch (error) {
      // Error is handled by the mutation's onError
      // Revert the selection on error
      const previousDeptId = departmentContextUtils.getActiveDepartmentId();
      setActiveDepartmentId(previousDeptId);
    }
  };

  const currentDepartment = departments.find(
    (d) => d.department?.id === activeDepartmentId || d.department?.id === currentDepartmentId
  );

  const currentRole = currentDepartment?.role;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        {showLabel && <span className="text-sm text-muted-foreground">Loading departments...</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-red-500", className)}>
        <AlertCircle className="h-4 w-4" />
        {showLabel && <span className="text-sm">Failed to load departments</span>}
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Building2 className="h-4 w-4" />
        {showLabel && <span className="text-sm">No departments assigned</span>}
      </div>
    );
  }

  if (departments.length === 1) {
    // Only one department - show it as read-only
    const dept = departments[0];
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          {showLabel && (
            <span className="text-xs text-muted-foreground">Department</span>
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
    return (
      <Select
        value={activeDepartmentId?.toString() || currentDepartmentId?.toString() || ""}
        onValueChange={handleDepartmentChange}
        disabled={switchDepartmentMutation.isPending}
      >
        <SelectTrigger className={cn("w-[200px]", className)}>
          <SelectValue placeholder="Select department">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {currentDepartment?.department?.name || "Select department"}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {departments.map((dept) => {
            const isActive = dept.department?.id === activeDepartmentId || dept.department?.id === currentDepartmentId;
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
                      <Badge variant="outline" className="text-xs">
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
            <div className="font-semibold text-sm mb-3">Switch Department</div>
            {departments.map((dept) => {
              const isActive = dept.department?.id === activeDepartmentId || dept.department?.id === currentDepartmentId;
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
        <label className="text-sm font-medium">Active Department</label>
      )}
      <Select
        value={activeDepartmentId?.toString() || currentDepartmentId?.toString() || ""}
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
            const isActive = dept.department?.id === activeDepartmentId || dept.department?.id === currentDepartmentId;
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

export default DepartmentSelector;


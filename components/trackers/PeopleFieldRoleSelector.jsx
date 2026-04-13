"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRolesAll } from "@/hooks/useRoles";

export function PeopleFieldRoleSelector({ selectedRoleIds, onChange }) {
  const { data: rolesData, isLoading } = useRolesAll();
  const roles = Array.isArray(rolesData)
    ? rolesData
    : rolesData?.roles || rolesData?.items || [];

  const handleRoleToggle = (roleId) => {
    const roleIdNum = typeof roleId === "string" ? parseInt(roleId, 10) : roleId;
    const currentIds = Array.isArray(selectedRoleIds) ? selectedRoleIds.map((r) => (typeof r === "object" ? r.id : r)) : [];

    if (currentIds.includes(roleIdNum)) {
      onChange(currentIds.filter((id) => id !== roleIdNum));
    } else {
      onChange([...currentIds, roleIdNum]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading roles...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="max-h-48 overflow-auto border rounded-md p-2 space-y-1">
        {roles.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">No roles available</div>
        ) : (
          roles.map((role) => {
            const roleId = role.id;
            const isSelected =
              Array.isArray(selectedRoleIds) && selectedRoleIds.some((r) => (typeof r === "object" ? r.id : r) === roleId);
            return (
              <div key={roleId} className="flex items-center space-x-2">
                <Checkbox id={`role-${roleId}`} checked={isSelected} onCheckedChange={() => handleRoleToggle(roleId)} />
                <Label htmlFor={`role-${roleId}`} className="cursor-pointer text-sm flex-1">
                  {role.display_name || role.name || `Role ${roleId}`}
                </Label>
              </div>
            );
          })
        )}
      </div>
      {selectedRoleIds && selectedRoleIds.length > 0 && (
        <p className="text-xs text-muted-foreground">{selectedRoleIds.length} role(s) selected</p>
      )}
    </div>
  );
}

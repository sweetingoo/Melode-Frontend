"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRolePickerLabel, getRoleDepartmentLabel } from "@/hooks/useRoles";
import { Search, Shield, X } from "lucide-react";

function roleSearchText(role) {
  if (!role) return "";
  const parts = [
    role.name,
    role.slug,
    role.display_name,
    role.description,
    getRoleDepartmentLabel(role),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/**
 * Hierarchical role picker: job roles with nested shift roles (checkbox per row).
 * Selecting a job role adds the job name plus every shift role name to `selectedRoleNames`.
 */
export function JobShiftRoleAccessPicker({
  selectedRoleNames = [],
  onChange,
  standaloneRoles = [],
  jobRoleGroups = [],
  idPrefix = "roles",
}) {
  const allowed = selectedRoleNames;
  const jobRoleCheckboxRefs = useRef({});
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.trim().toLowerCase();

  const filteredJobDisplay = useMemo(() => {
    const shiftsFor = (jobRole) =>
      jobRole.shiftRolesForPicker || jobRole.shift_roles || jobRole.shiftRoles || [];

    return jobRoleGroups
      .map((jobRole) => {
        const allShifts = shiftsFor(jobRole);
        if (!query) return { jobRole, displayShifts: allShifts };

        if (roleSearchText(jobRole).includes(query)) {
          return { jobRole, displayShifts: allShifts };
        }
        const matching = allShifts.filter((s) => roleSearchText(s).includes(query));
        if (matching.length === 0) return null;
        return { jobRole, displayShifts: matching };
      })
      .filter(Boolean);
  }, [jobRoleGroups, query]);

  const filteredStandaloneRoles = useMemo(() => {
    if (!query) return standaloneRoles;
    return standaloneRoles.filter((r) => roleSearchText(r).includes(query));
  }, [standaloneRoles, query]);

  useEffect(() => {
    jobRoleGroups.forEach((jobRole) => {
      const el = jobRoleCheckboxRefs.current[jobRole.id];
      if (!el) return;
      const shiftRoles = jobRole.shiftRolesForPicker || jobRole.shift_roles || jobRole.shiftRoles || [];
      const allNames = [jobRole.name, ...shiftRoles.map((s) => s.name)];
      const selectedCount = allNames.filter((n) => n && allowed.includes(n)).length;
      el.indeterminate = selectedCount > 0 && selectedCount < allNames.length;
    });
  }, [jobRoleGroups, allowed]);

  const roleByName = useMemo(() => {
    const m = new Map();
    standaloneRoles.forEach((r) => {
      if (r.name) m.set(r.name, r);
    });
    jobRoleGroups.forEach((j) => {
      if (j.name) m.set(j.name, j);
      const shifts = j.shiftRolesForPicker || j.shift_roles || j.shiftRoles || [];
      shifts.forEach((s) => {
        if (s.name) m.set(s.name, s);
      });
    });
    return m;
  }, [standaloneRoles, jobRoleGroups]);

  const removeName = (name) => {
    onChange(allowed.filter((r) => r !== name));
  };

  const hasAnyRoles = standaloneRoles.length > 0 || jobRoleGroups.length > 0;
  const hasVisibleRows =
    filteredJobDisplay.length > 0 || filteredStandaloneRoles.length > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Job role</span> — selects that job and all
        shift roles below it. <span className="font-medium text-foreground">Shift role</span> — only
        that shift. Labels show role type so you can tell them apart.
      </p>
      {hasAnyRoles && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search by role name, department, or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            aria-label="Search roles"
          />
        </div>
      )}
      <div className="border rounded-md max-h-[min(24rem,55vh)] overflow-y-auto p-3 space-y-3">
        {!hasAnyRoles ? (
          <p className="text-sm text-muted-foreground py-2">No roles available</p>
        ) : !hasVisibleRows ? (
          <p className="text-sm text-muted-foreground py-2">No roles match your search.</p>
        ) : (
          <>
            {filteredJobDisplay.map(({ jobRole, displayShifts }) => {
              const allShifts =
                jobRole.shiftRolesForPicker ||
                jobRole.shift_roles ||
                jobRole.shiftRoles ||
                [];
              const shiftNames = allShifts.map((s) => s.name).filter(Boolean);
              const allNames = [jobRole.name, ...shiftNames].filter(Boolean);
              const selectedCount = allNames.filter((n) => allowed.includes(n)).length;
              const allSelected = selectedCount === allNames.length && allNames.length > 0;

              return (
                <div key={jobRole.id} className="space-y-1.5 border-t first:border-t-0 pt-3 first:pt-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`${idPrefix}-job-${jobRole.id}`}
                      ref={(el) => {
                        if (el) jobRoleCheckboxRefs.current[jobRole.id] = el;
                        else delete jobRoleCheckboxRefs.current[jobRole.id];
                      }}
                      checked={allSelected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        let next = allowed.filter((r) => !allNames.includes(r));
                        if (checked) next = [...next, ...allNames];
                        onChange([...new Set(next)]);
                      }}
                      className="h-4 w-4 rounded border border-primary shrink-0"
                    />
                    <Label
                      htmlFor={`${idPrefix}-job-${jobRole.id}`}
                      className="cursor-pointer font-medium flex flex-wrap items-center gap-2"
                    >
                      <span>{formatRolePickerLabel(jobRole)}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground border rounded px-1.5 py-0">
                        Job role
                      </span>
                    </Label>
                  </div>
                  <div className="pl-6 space-y-1 border-l-2 border-muted ml-2">
                    {displayShifts.map((shift) => {
                      if (!shift.name) return null;
                      const shiftSelected = allowed.includes(shift.name);
                      return (
                        <div key={shift.id ?? shift.name} className="flex items-center gap-2">
                          <Checkbox
                            id={`${idPrefix}-shift-${jobRole.id}-${shift.id}`}
                            checked={shiftSelected}
                            onCheckedChange={(checked) => {
                              let next = allowed.filter((r) => r !== shift.name);
                              if (checked) next = [...next, shift.name];
                              onChange([...new Set(next)]);
                            }}
                          />
                          <Label
                            htmlFor={`${idPrefix}-shift-${jobRole.id}-${shift.id}`}
                            className="cursor-pointer font-normal text-muted-foreground flex flex-wrap items-center gap-2"
                          >
                            <span>{formatRolePickerLabel(shift)}</span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/90 border rounded px-1.5 py-0">
                              Shift role
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredStandaloneRoles.length > 0 && (
              <div
                className={
                  filteredJobDisplay.length > 0 ? "space-y-2 border-t pt-3 mt-1" : "space-y-2"
                }
              >
                {filteredJobDisplay.length > 0 && (
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Other roles
                  </p>
                )}
                {filteredStandaloneRoles.map((role) => {
                  const name = role.name || role.slug;
                  if (!name) return null;
                  const isSelected = allowed.includes(name);
                  return (
                    <div key={role.id ?? name} className="flex items-center gap-2">
                      <Checkbox
                        id={`${idPrefix}-standalone-${role.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...allowed, name]
                            : allowed.filter((r) => r !== name);
                          onChange([...new Set(next)]);
                        }}
                      />
                      <Label
                        htmlFor={`${idPrefix}-standalone-${role.id}`}
                        className="cursor-pointer font-normal flex flex-wrap items-center gap-2"
                      >
                        <span>{formatRolePickerLabel(role)}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground border rounded px-1.5 py-0">
                          {(role.role_type || role.roleType || "job_role") === "job_role"
                            ? "Job role"
                            : "Role"}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {allowed.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {allowed.map((roleName) => {
            const role = roleByName.get(roleName);
            return (
              <Badge key={roleName} variant="secondary" className="flex items-center gap-1 pr-1">
                <Shield className="h-3 w-3" />
                <span className="text-xs">
                  {role ? formatRolePickerLabel(role) : roleName}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeName(roleName)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

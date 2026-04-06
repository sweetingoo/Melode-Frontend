"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatRolePickerLabel,
  getRoleDepartmentLabel,
  sortRolesForPicker,
  splitRolesJobShiftGroups,
} from "@/hooks/useRoles";
import { rolesService } from "@/services/roles";
import { Loader2, Search, Shield, X } from "lucide-react";
import { toast } from "sonner";

function normalizeRolesListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.roles && Array.isArray(data.roles)) return data.roles;
  return [];
}

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

function roleRowKey(role, selectionMode) {
  if (!role) return "";
  if (selectionMode === "id") {
    if (role.id == null) return "";
    return String(role.id);
  }
  return role.name || role.slug || "";
}

function mergeRolesIntoCatalog(list, setCatalog) {
  setCatalog((prev) => {
    const next = new Map(prev);
    for (const r of list) {
      if (r?.id != null) next.set(r.id, r);
      const shifts = r.shift_roles || r.shiftRoles || [];
      for (const s of shifts) {
        if (s?.id != null) next.set(s.id, s);
      }
    }
    return next;
  });
}

/**
 * Hierarchical role picker: job roles with nested shift roles (checkbox per row).
 * - **selectionMode "name"** (default): values are role `name` strings (form access / allowed_roles).
 * - **selectionMode "id"**: values are numeric role ids as numbers via `selectedRoleIds` / `onRoleIdsChange` (e.g. task assignment API).
 * - **lazyLoad**: fetch job roles from `GET /roles` in pages (debounced search + load more) instead of requiring a full list from the parent.
 */
export function JobShiftRoleAccessPicker({
  selectedRoleNames = [],
  onChange,
  selectedRoleIds = [],
  onRoleIdsChange,
  selectionMode = "name",
  standaloneRoles = [],
  jobRoleGroups = [],
  idPrefix = "roles",
  lazyLoad = false,
  /** When false, lazy fetches are skipped (e.g. dialog closed). */
  lazyEnabled = true,
  lazyPerPage = 50,
}) {
  const isIdMode = selectionMode === "id";
  const useLazy = lazyLoad && lazyEnabled;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accumulatedRoles, setAccumulatedRoles] = useState([]);
  const [lazyPage, setLazyPage] = useState(1);
  const [lazyHasMore, setLazyHasMore] = useState(false);
  const [lazyLoading, setLazyLoading] = useState(false);
  const [lazyLoadingMore, setLazyLoadingMore] = useState(false);
  const [roleCatalogById, setRoleCatalogById] = useState(() => new Map());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (!lazyLoad || !lazyEnabled) {
      setAccumulatedRoles([]);
      setLazyPage(1);
      setLazyHasMore(false);
      return;
    }
    let cancelled = false;
    setLazyLoading(true);
    (async () => {
      try {
        const res = await rolesService.getRoles({
          page: 1,
          per_page: lazyPerPage,
          role_type: "job_role",
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        });
        if (cancelled) return;
        const list = normalizeRolesListResponse(res.data);
        setAccumulatedRoles(list);
        setLazyPage(1);
        setLazyHasMore(list.length >= lazyPerPage);
        mergeRolesIntoCatalog(list, setRoleCatalogById);
      } catch {
        if (!cancelled) {
          setAccumulatedRoles([]);
          setLazyHasMore(false);
        }
      } finally {
        if (!cancelled) setLazyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lazyLoad, lazyEnabled, debouncedSearch, lazyPerPage]);

  const loadMoreLazy = useCallback(async () => {
    if (!useLazy || lazyLoading || lazyLoadingMore || !lazyHasMore) return;
    const nextPage = lazyPage + 1;
    setLazyLoadingMore(true);
    try {
      const res = await rolesService.getRoles({
        page: nextPage,
        per_page: lazyPerPage,
        role_type: "job_role",
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const list = normalizeRolesListResponse(res.data);
      setAccumulatedRoles((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const merged = [...prev];
        for (const r of list) {
          if (r?.id != null && !seen.has(r.id)) {
            seen.add(r.id);
            merged.push(r);
          }
        }
        mergeRolesIntoCatalog(list, setRoleCatalogById);
        return merged;
      });
      setLazyPage(nextPage);
      setLazyHasMore(list.length >= lazyPerPage);
    } catch {
      toast.error("Could not load more roles");
    } finally {
      setLazyLoadingMore(false);
    }
  }, [
    useLazy,
    lazyLoading,
    lazyLoadingMore,
    lazyHasMore,
    lazyPage,
    lazyPerPage,
    debouncedSearch,
  ]);

  const { standaloneRoles: lazyStandalone, jobRoleGroups: lazyJobGroups } = useMemo(() => {
    if (!useLazy) {
      return { standaloneRoles: [], jobRoleGroups: [] };
    }
    const sorted = sortRolesForPicker(accumulatedRoles);
    return splitRolesJobShiftGroups(sorted);
  }, [useLazy, accumulatedRoles]);

  const effectiveStandalone = useLazy ? lazyStandalone : standaloneRoles;
  const effectiveJobGroups = useLazy ? lazyJobGroups : jobRoleGroups;

  const allowedKeys = useMemo(() => {
    if (isIdMode) {
      return (selectedRoleIds || []).filter((id) => id != null).map((id) => String(id));
    }
    return (selectedRoleNames || []).filter(Boolean);
  }, [isIdMode, selectedRoleIds, selectedRoleNames]);

  const emitKeys = (nextKeys) => {
    const unique = [...new Set(nextKeys.filter(Boolean))];
    if (isIdMode) {
      const ids = unique.map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n));
      onRoleIdsChange?.(ids);
    } else {
      onChange?.(unique);
    }
  };

  const jobRoleCheckboxRefs = useRef({});

  const query = searchQuery.trim().toLowerCase();

  const filteredJobDisplay = useMemo(() => {
    const shiftsFor = (jobRole) =>
      jobRole.shiftRolesForPicker || jobRole.shift_roles || jobRole.shiftRoles || [];

    return effectiveJobGroups
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
  }, [effectiveJobGroups, query]);

  const filteredStandaloneRoles = useMemo(() => {
    if (!query) return effectiveStandalone;
    return effectiveStandalone.filter((r) => roleSearchText(r).includes(query));
  }, [effectiveStandalone, query]);

  useEffect(() => {
    effectiveJobGroups.forEach((jobRole) => {
      const el = jobRoleCheckboxRefs.current[jobRole.id];
      if (!el) return;
      const shiftRoles = jobRole.shiftRolesForPicker || jobRole.shift_roles || jobRole.shiftRoles || [];
      const jobKey = roleRowKey(jobRole, selectionMode);
      const shiftKeys = shiftRoles.map((s) => roleRowKey(s, selectionMode)).filter(Boolean);
      const allRowKeys = [jobKey, ...shiftKeys].filter(Boolean);
      if (allRowKeys.length === 0) return;
      const selectedCount = allRowKeys.filter((k) => allowedKeys.includes(k)).length;
      el.indeterminate = selectedCount > 0 && selectedCount < allRowKeys.length;
    });
  }, [effectiveJobGroups, allowedKeys, selectionMode]);

  const roleByKey = useMemo(() => {
    const m = new Map();
    effectiveStandalone.forEach((r) => {
      const k = roleRowKey(r, selectionMode);
      if (k) m.set(k, r);
    });
    effectiveJobGroups.forEach((j) => {
      const jk = roleRowKey(j, selectionMode);
      if (jk) m.set(jk, j);
      const shifts = j.shiftRolesForPicker || j.shift_roles || j.shiftRoles || [];
      shifts.forEach((s) => {
        const sk = roleRowKey(s, selectionMode);
        if (sk) m.set(sk, s);
      });
    });
    return m;
  }, [effectiveStandalone, effectiveJobGroups, selectionMode]);

  const resolveRoleForBadge = (key) => {
    const fromList = roleByKey.get(key);
    if (fromList) return fromList;
    if (isIdMode) {
      const n = parseInt(key, 10);
      if (!Number.isNaN(n)) return roleCatalogById.get(n);
    }
    return undefined;
  };

  const removeKey = (key) => {
    emitKeys(allowedKeys.filter((r) => r !== key));
  };

  const hasAnyRoles = effectiveStandalone.length > 0 || effectiveJobGroups.length > 0;
  const hasVisibleRows =
    filteredJobDisplay.length > 0 || filteredStandaloneRoles.length > 0;
  const showSearch = useLazy || hasAnyRoles;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Job role</span> — selects that job and all
        shift roles below it. <span className="font-medium text-foreground">Shift role</span> — only
        that shift. Labels show role type so you can tell them apart.
        {useLazy ? (
          <>
            {" "}
            <span className="text-muted-foreground/90">
              Roles load in pages; refine with search or load more.
            </span>
          </>
        ) : null}
      </p>
      {showSearch && (
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
        {useLazy && lazyLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading roles…
          </div>
        ) : !hasAnyRoles ? (
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
              const jobKey = roleRowKey(jobRole, selectionMode);
              const shiftRowKeys = allShifts.map((s) => roleRowKey(s, selectionMode)).filter(Boolean);
              const allRowKeys = [jobKey, ...shiftRowKeys].filter(Boolean);
              const selectedCount = allRowKeys.filter((k) => allowedKeys.includes(k)).length;
              const allSelected = selectedCount === allRowKeys.length && allRowKeys.length > 0;

              return (
                <div key={jobRole.id} className="space-y-1.5 border-t first:border-t-0 pt-3 first:pt-0">
                  {jobKey ? (
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
                          let next = allowedKeys.filter((r) => !allRowKeys.includes(r));
                          if (checked) next = [...next, ...allRowKeys];
                          emitKeys(next);
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
                  ) : null}
                  <div className="pl-6 space-y-1 border-l-2 border-muted ml-2">
                    {displayShifts.map((shift) => {
                      const shiftKey = roleRowKey(shift, selectionMode);
                      if (!shiftKey) return null;
                      const shiftSelected = allowedKeys.includes(shiftKey);
                      return (
                        <div key={shift.id ?? shiftKey} className="flex items-center gap-2">
                          <Checkbox
                            id={`${idPrefix}-shift-${jobRole.id}-${shift.id ?? shiftKey}`}
                            checked={shiftSelected}
                            onCheckedChange={(checked) => {
                              let next = allowedKeys.filter((r) => r !== shiftKey);
                              if (checked) next = [...next, shiftKey];
                              emitKeys(next);
                            }}
                          />
                          <Label
                            htmlFor={`${idPrefix}-shift-${jobRole.id}-${shift.id ?? shiftKey}`}
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
                  const rowKey = roleRowKey(role, selectionMode);
                  if (!rowKey) return null;
                  const isSelected = allowedKeys.includes(rowKey);
                  return (
                    <div key={role.id ?? rowKey} className="flex items-center gap-2">
                      <Checkbox
                        id={`${idPrefix}-standalone-${role.id ?? rowKey}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...allowedKeys, rowKey]
                            : allowedKeys.filter((r) => r !== rowKey);
                          emitKeys(next);
                        }}
                      />
                      <Label
                        htmlFor={`${idPrefix}-standalone-${role.id ?? rowKey}`}
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

            {useLazy && lazyHasMore && (
              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={lazyLoadingMore}
                  onClick={() => loadMoreLazy()}
                >
                  {lazyLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more roles"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {allowedKeys.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {allowedKeys.map((key) => {
            const role = resolveRoleForBadge(key);
            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1 pr-1">
                <Shield className="h-3 w-3" />
                <span className="text-xs">
                  {role ? formatRolePickerLabel(role) : key}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeKey(key)}
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

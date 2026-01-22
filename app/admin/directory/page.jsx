"use client";

import React, { useState, useMemo, createContext, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  List,
  Network,
  Search,
  Loader2,
  Users,
  Building2,
  Filter,
  X,
  Maximize,
  Minimize,
} from "lucide-react";
import { useDirectory } from "@/hooks/useDirectory";
import { useRoles } from "@/hooks/useRoles";
import { useDepartments } from "@/hooks/useDepartments";
import { DirectoryList } from "@/components/directory/DirectoryList";
import { useSidebar } from "@/components/ui/sidebar";
import dynamicImport from "next/dynamic";

// Force dynamic rendering to prevent SSR issues with document access
export const dynamic = 'force-dynamic';

// Lazy load DirectoryGraph to avoid SSR issues
const DirectoryGraph = dynamicImport(
  () => import("@/components/directory/DirectoryGraph").then((mod) => ({ default: mod.DirectoryGraph })),
  { ssr: false }
);

// Context for full screen mode
const FullScreenContext = createContext({
  isFullScreen: false,
  setIsFullScreen: () => {},
});

export const useFullScreen = () => useContext(FullScreenContext);

const DirectoryPage = () => {
  const [viewType, setViewType] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [excludedRoleIds, setExcludedRoleIds] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { setOpen: setSidebarOpen } = useSidebar();

  // Handle full screen mode - hide sidebar and header
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const sidebar = document.getElementById("admin-sidebar");
    const header = document.getElementById("admin-header");
    const wrapper = document.getElementById("admin-layout-wrapper");

    if (isFullScreen) {
      setSidebarOpen(false);
      if (sidebar) sidebar.style.display = "none";
      if (header) header.style.display = "none";
      if (wrapper) {
        wrapper.style.position = "fixed";
        wrapper.style.inset = "0";
        wrapper.style.zIndex = "50";
      }
      document.body.style.overflow = "hidden";
    } else {
      if (sidebar) sidebar.style.display = "";
      if (header) header.style.display = "";
      if (wrapper) {
        wrapper.style.position = "";
        wrapper.style.inset = "";
        wrapper.style.zIndex = "";
      }
      document.body.style.overflow = "";
    }

    return () => {
      // Cleanup on unmount
      if (typeof window === "undefined") return;
      if (sidebar) sidebar.style.display = "";
      if (header) header.style.display = "";
      if (wrapper) {
        wrapper.style.position = "";
        wrapper.style.inset = "";
        wrapper.style.zIndex = "";
      }
      document.body.style.overflow = "";
    };
  }, [isFullScreen, setSidebarOpen]);

  // Fetch directory data
  const directoryParams = useMemo(() => {
    const params = {};
    if (selectedDepartment) {
      params.department_id = selectedDepartment;
    }
    if (excludedRoleIds.length > 0) {
      params.exclude_role_ids = excludedRoleIds.join(",");
    }
    return params;
  }, [selectedDepartment, excludedRoleIds]);

  const { data: directoryData, isLoading: isLoadingDirectory } = useDirectory(directoryParams);
  const { data: departmentsData } = useDepartments({ per_page: 100 });
  const { data: rolesData } = useRoles();

  const departments = departmentsData?.departments || departmentsData?.data || [];
  const roles = rolesData || [];

  // Filter roles for exclusion dropdown (only show roles that exist in directory)
  const availableRoles = useMemo(() => {
    if (!directoryData?.departments) return [];
    const roleIds = new Set();
    directoryData.departments.forEach((dept) => {
      // Add job role IDs
      dept.job_roles?.forEach((jobRoleGroup) => {
        if (jobRoleGroup.job_role?.role?.id) {
          roleIds.add(jobRoleGroup.job_role.role.id);
        }
        // Add shift role IDs
        jobRoleGroup.shift_roles?.forEach((shiftRoleGroup) => {
          if (shiftRoleGroup.role?.id) {
            roleIds.add(shiftRoleGroup.role.id);
          }
        });
      });
      // Add orphan shift role IDs
      dept.orphan_shift_roles?.forEach((shiftRoleGroup) => {
        if (shiftRoleGroup.role?.id) {
          roleIds.add(shiftRoleGroup.role.id);
        }
      });
    });
    return roles.filter((role) => roleIds.has(role.id));
  }, [directoryData, roles]);

  // Filter directory data by search term
  const filteredDirectoryData = useMemo(() => {
    if (!directoryData || !searchTerm) return directoryData;

    const searchLower = searchTerm.toLowerCase();
    const filtered = {
      ...directoryData,
      departments: directoryData.departments
        .map((dept) => {
          // Filter job roles
          const filteredJobRoles = dept.job_roles
            ?.map((jobRoleGroup) => {
              // Filter job role users
              const filteredJobUsers = jobRoleGroup.job_role?.users?.filter(
                (user) =>
                  user.display_name?.toLowerCase().includes(searchLower) ||
                  user.first_name?.toLowerCase().includes(searchLower) ||
                  user.last_name?.toLowerCase().includes(searchLower) ||
                  user.job_title?.toLowerCase().includes(searchLower) ||
                  jobRoleGroup.job_role.role.display_name?.toLowerCase().includes(searchLower) ||
                  dept.department.name?.toLowerCase().includes(searchLower)
              ) || [];

              // Filter shift roles under job role
              const filteredShiftRoles = jobRoleGroup.shift_roles
                ?.map((shiftRoleGroup) => {
                  const filteredShiftUsers = shiftRoleGroup.users?.filter(
                    (user) =>
                      user.display_name?.toLowerCase().includes(searchLower) ||
                      user.first_name?.toLowerCase().includes(searchLower) ||
                      user.last_name?.toLowerCase().includes(searchLower) ||
                      user.job_title?.toLowerCase().includes(searchLower) ||
                      shiftRoleGroup.role.display_name?.toLowerCase().includes(searchLower) ||
                      dept.department.name?.toLowerCase().includes(searchLower)
                  ) || [];
                  return filteredShiftUsers.length > 0
                    ? { ...shiftRoleGroup, users: filteredShiftUsers }
                    : null;
                })
                .filter(Boolean) || [];

              const hasJobUsers = filteredJobUsers.length > 0;
              const hasShiftRoles = filteredShiftRoles.length > 0;
              const matchesJobRole = jobRoleGroup.job_role.role.display_name?.toLowerCase().includes(searchLower);

              if (hasJobUsers || hasShiftRoles || matchesJobRole) {
                return {
                  ...jobRoleGroup,
                  job_role: { ...jobRoleGroup.job_role, users: filteredJobUsers },
                  shift_roles: filteredShiftRoles,
                };
              }
              return null;
            })
            .filter(Boolean) || [];

          // Filter orphan shift roles
          const filteredOrphanShiftRoles = dept.orphan_shift_roles
            ?.map((shiftRoleGroup) => {
              const filteredUsers = shiftRoleGroup.users?.filter(
                (user) =>
                  user.display_name?.toLowerCase().includes(searchLower) ||
                  user.first_name?.toLowerCase().includes(searchLower) ||
                  user.last_name?.toLowerCase().includes(searchLower) ||
                  user.job_title?.toLowerCase().includes(searchLower) ||
                  shiftRoleGroup.role.display_name?.toLowerCase().includes(searchLower) ||
                  dept.department.name?.toLowerCase().includes(searchLower)
              ) || [];
              return filteredUsers.length > 0
                ? { ...shiftRoleGroup, users: filteredUsers }
                : null;
            })
            .filter(Boolean) || [];

          const matchesDept = dept.department.name?.toLowerCase().includes(searchLower);
          const hasJobRoles = filteredJobRoles.length > 0;
          const hasOrphanShiftRoles = filteredOrphanShiftRoles.length > 0;

          return (hasJobRoles || hasOrphanShiftRoles || matchesDept)
            ? {
                ...dept,
                job_roles: filteredJobRoles,
                orphan_shift_roles: filteredOrphanShiftRoles,
              }
            : null;
        })
        .filter(Boolean),
    };

    return filtered;
  }, [directoryData, searchTerm]);

  const handleRemoveExcludedRole = (roleId) => {
    setExcludedRoleIds(excludedRoleIds.filter((id) => id !== roleId));
  };

  const handleAddExcludedRole = (roleId) => {
    if (roleId && !excludedRoleIds.includes(parseInt(roleId))) {
      setExcludedRoleIds([...excludedRoleIds, parseInt(roleId)]);
    }
  };

  return (
    <FullScreenContext.Provider value={{ isFullScreen, setIsFullScreen }}>
      <div className={isFullScreen ? "fixed inset-0 z-50 bg-background" : "space-y-6 p-6"}>
        {/* Header */}
        <div className={`flex items-center justify-between ${isFullScreen ? "p-6 border-b" : ""}`}>
          <div>
            <h1 className="text-3xl font-bold">Directory</h1>
            <p className="text-muted-foreground mt-1">
              Browse people by department and role
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              {directoryData?.total_users || 0} people
            </Badge>
            <Badge variant="outline" className="gap-2">
              <Building2 className="h-4 w-4" />
              {directoryData?.total_departments || 0} departments
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="gap-2"
            >
              {isFullScreen ? (
                <>
                  <Minimize className="h-4 w-4" />
                  Exit Full Screen
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4" />
                  Full Screen
                </>
              )}
            </Button>
          </div>
        </div>

        <div className={isFullScreen ? "h-[calc(100vh-120px)] overflow-auto p-6" : ""}>
          {/* Filters */}
          <Card className={isFullScreen ? "mb-6" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, role, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department Filter */}
                <div>
                  <Label htmlFor="department-filter">Department</Label>
                  <Select
                    value={selectedDepartment?.toString() || undefined}
                    onValueChange={(value) =>
                      setSelectedDepartment(value === "all" ? null : (value ? parseInt(value) : null))
                    }
                  >
                    <SelectTrigger id="department-filter">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Exclusion (for graph view) */}
                {viewType === "graph" && (
                  <div>
                    <Label htmlFor="exclude-role">Exclude Role (Graph View)</Label>
                    <Select
                      value={undefined}
                      onValueChange={handleAddExcludedRole}
                    >
                      <SelectTrigger id="exclude-role">
                        <SelectValue placeholder="Select role to exclude" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles
                          .filter((role) => !excludedRoleIds.includes(role.id))
                          .map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.display_name || role.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Excluded Roles Display */}
              {excludedRoleIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Label className="w-full">Excluded Roles:</Label>
                  {excludedRoleIds.map((roleId) => {
                    const role = availableRoles.find((r) => r.id === roleId);
                    return (
                      <Badge
                        key={roleId}
                        variant="secondary"
                        className="gap-2 cursor-pointer"
                        onClick={() => handleRemoveExcludedRole(roleId)}
                      >
                        {role?.display_name || role?.name || `Role ${roleId}`}
                        <X className="h-3 w-3" />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Tabs */}
          <Tabs value={viewType} onValueChange={setViewType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="graph" className="gap-2">
                <Network className="h-4 w-4" />
                Graph View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              {isLoadingDirectory ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </CardContent>
                </Card>
              ) : (
                <DirectoryList data={filteredDirectoryData} />
              )}
            </TabsContent>

            <TabsContent value="graph" className="mt-4">
              {isLoadingDirectory ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </CardContent>
                </Card>
              ) : (
                <DirectoryGraph data={filteredDirectoryData} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FullScreenContext.Provider>
  );
};

export default DirectoryPage;

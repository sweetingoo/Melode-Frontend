"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarWithUrl } from "@/components/AvatarWithUrl";
import { Building2, Users, ChevronDown, ChevronRight, AlertTriangle, Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Tree, TreeNode } from "react-organizational-chart";
import { useOrganisation } from "@/hooks/useConfiguration";

export const DirectoryGraph = ({ data }) => {
  // Get organisation name from settings
  const { data: organisationData } = useOrganisation();
  const organisationName = organisationData?.organisation_name || organisationData?.organization_name || "Organisation";

  // State for expanded/collapsed nodes
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [expandedJobRoles, setExpandedJobRoles] = useState(new Set());
  const [userDisplayLimit, setUserDisplayLimit] = useState(50); // Limit users per role initially

  // State for drag/pan functionality
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Calculate total nodes for performance warning
  const totalNodes = useMemo(() => {
    if (!data?.departments) return 0;
    let count = 1; // Organization
    count += data.departments.length; // Departments
    data.departments.forEach((dept) => {
      dept.job_roles?.forEach((jr) => {
        count += 1; // Job role
        count += (jr.job_role?.users?.length || 0); // Users
      });
    });
    return count;
  }, [data]);

  const toggleDepartment = (deptId) => {
    const newSet = new Set(expandedDepartments);
    if (newSet.has(deptId)) {
      newSet.delete(deptId);
    } else {
      newSet.add(deptId);
    }
    setExpandedDepartments(newSet);
  };

  const toggleJobRole = (roleId) => {
    const newSet = new Set(expandedJobRoles);
    if (newSet.has(roleId)) {
      newSet.delete(roleId);
    } else {
      newSet.add(roleId);
    }
    setExpandedJobRoles(newSet);
  };

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    // Don't start drag if clicking on buttons or interactive elements
    if (
      e.button !== 0 || // Only left mouse button
      e.target.closest("button") || // Don't drag if clicking a button
      e.target.closest("a") || // Don't drag if clicking a link
      e.target.closest("[role='button']") // Don't drag if clicking interactive element
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.max(0.5, Math.min(2, prev + delta)));
    }
  }, []);

  if (!data || !data.departments || data.departments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No people found in directory</p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user.display_name) {
      return user.display_name[0].toUpperCase();
    }
    return "U";
  };

  // Helper to calculate department users
  const calculateDeptUsers = (deptGroup) => {
    const jobRoleUsers = deptGroup.job_roles?.reduce((sum, jr) => {
      const jobUsers = jr.job_role?.users?.length || 0;
      return sum + jobUsers;
    }, 0) || 0;
    return jobRoleUsers;
  };

  // Organization Node Component
  const OrganizationNode = () => (
    <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary rounded-xl p-6 shadow-lg min-w-[300px] text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Building2 className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold">{organisationName}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {data.total_departments} {data.total_departments === 1 ? "department" : "departments"} • {data.total_users} {data.total_users === 1 ? "person" : "people"}
      </p>
      {totalNodes > 500 && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2 justify-center">
          <AlertTriangle className="h-3 w-3" />
          Large dataset: Use filters to improve performance
        </div>
      )}
    </div>
  );

  // Department Node Component
  const DepartmentNode = ({ deptGroup }) => {
    const totalUsers = calculateDeptUsers(deptGroup);
    const isExpanded = expandedDepartments.has(deptGroup.department.id);
    const hasChildren = (deptGroup.job_roles?.length > 0);
    
    return (
      <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 shadow-md min-w-[250px] text-center relative group">
        <div className="flex items-center justify-center gap-2 mb-2 flex-nowrap">
          <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
          <h3 className="text-lg font-semibold whitespace-nowrap">{deptGroup.department.name}</h3>
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleDepartment(deptGroup.department.id);
              }}
              className="h-6 w-6 p-0 rounded-full bg-background border border-border hover:bg-accent hover:border-primary/50 shadow-sm flex items-center justify-center flex-shrink-0"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {deptGroup.department.code && (
          <Badge variant="outline" className="mb-2">
            {deptGroup.department.code}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground">
          {totalUsers} {totalUsers === 1 ? "person" : "people"}
        </p>
      </div>
    );
  };

  // Job Role Node Component
  const JobRoleNode = ({ jobRole }) => {
    const isExpanded = expandedJobRoles.has(jobRole.role.id);
    const userCount = jobRole.users?.length || 0;
    const hasUsers = userCount > 0;
    
    return (
      <div className="bg-secondary/50 border-2 border-border rounded-lg p-3 shadow-sm min-w-[200px] text-center relative group">
        <div className="flex items-center justify-center gap-2 flex-nowrap">
          <Users className="h-4 w-4 text-primary flex-shrink-0" />
          <Badge variant="default" className="font-medium text-xs whitespace-nowrap">
            {jobRole.role.display_name || jobRole.role.name}
          </Badge>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded whitespace-nowrap">
            Job Role
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            ({userCount})
          </span>
          {hasUsers && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleJobRole(jobRole.role.id);
              }}
              className="h-5 w-5 p-0 rounded-full bg-background border border-border hover:bg-accent hover:border-primary/50 shadow-sm flex items-center justify-center flex-shrink-0"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // User Node Component
  const UserNode = ({ user }) => (
    <div className="flex flex-col items-center p-3 rounded-lg border-2 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer min-w-[120px] group">
      <AvatarWithUrl
        avatarValue={user.avatar_url}
        alt={user.display_name}
        fallback={getInitials(user)}
        className="h-12 w-12 mb-1 border-2 border-background group-hover:border-primary/50 transition-colors"
      />
      <p className="font-semibold text-xs text-center truncate w-full group-hover:text-primary transition-colors">
        {user.display_name}
      </p>
      {user.job_title && (
        <p className="text-xs text-muted-foreground text-center truncate w-full mt-0.5">
          {user.job_title}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full relative" style={{ minHeight: "600px", height: "80vh" }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs flex items-center px-2">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground border-l pl-2">
          <Move className="h-3 w-3" />
          <span>Drag to pan</span>
        </div>
      </div>

      {/* Draggable Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          touchAction: "none",
        }}
      >
        <div
          className="py-6"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "top left",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <Tree
            label={<OrganizationNode />}
            lineColor="#e5e7eb"
            lineWidth="2px"
            nodePadding="20px"
            lineBorderRadius="10px"
            lineHeight="50px"
          >
        {data.departments.map((deptGroup) => {
          const isDeptExpanded = expandedDepartments.has(deptGroup.department.id);
          const hasDeptChildren = (deptGroup.job_roles?.length > 0);
          
          // Only render children if department is expanded or has no children
          if (!hasDeptChildren) {
            return (
              <TreeNode key={deptGroup.department.id} label={<DepartmentNode deptGroup={deptGroup} />} />
            );
          }
          
          if (!isDeptExpanded) {
            return (
              <TreeNode key={deptGroup.department.id} label={<DepartmentNode deptGroup={deptGroup} />} />
            );
          }

          return (
            <TreeNode key={deptGroup.department.id} label={<DepartmentNode deptGroup={deptGroup} />}>
              {/* Job Roles */}
              {deptGroup.job_roles?.map((jobRoleGroup) => {
                const jobRole = jobRoleGroup.job_role;
                const isJobRoleExpanded = expandedJobRoles.has(jobRole.role.id);
                const hasJobRoleChildren = (jobRole.users?.length > 0);
                const displayedUsers = isJobRoleExpanded 
                  ? (jobRole.users?.slice(0, userDisplayLimit) || [])
                  : [];
                const hasMoreUsers = (jobRole.users?.length || 0) > userDisplayLimit;

                if (!hasJobRoleChildren) {
                  return (
                    <TreeNode key={jobRole.role.id} label={<JobRoleNode jobRole={jobRole} />} />
                  );
                }

                if (!isJobRoleExpanded) {
                  return (
                    <TreeNode key={jobRole.role.id} label={<JobRoleNode jobRole={jobRole} />} />
                  );
                }

                return (
                  <TreeNode key={jobRole.role.id} label={<JobRoleNode jobRole={jobRole} />}>
                    {/* Users directly under job role - limited */}
                    {displayedUsers.map((user) => (
                      <TreeNode key={user.id} label={<UserNode user={user} />} />
                    ))}
                    {hasMoreUsers && (
                      <TreeNode 
                        label={
                          <div className="p-2 text-center text-xs text-muted-foreground">
                            +{(jobRole.users?.length || 0) - userDisplayLimit} more users
                            <br />
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setUserDisplayLimit(userDisplayLimit + 50)}
                              className="text-xs h-auto p-0"
                            >
                              Show more
                            </Button>
                          </div>
                        } 
                      />
                    )}
                  </TreeNode>
                );
              })}
            </TreeNode>
          );
        })}
          </Tree>
        </div>
      </div>
    </div>
  );
};

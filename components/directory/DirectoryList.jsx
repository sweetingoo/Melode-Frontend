"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarWithUrl } from "@/components/AvatarWithUrl";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DirectoryList = ({ data }) => {
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [expandedRoles, setExpandedRoles] = useState(new Set());

  if (!data || !data.departments || data.departments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No people found in directory</p>
        </CardContent>
      </Card>
    );
  }

  const toggleDepartment = (deptId) => {
    const newSet = new Set(expandedDepartments);
    if (newSet.has(deptId)) {
      newSet.delete(deptId);
    } else {
      newSet.add(deptId);
    }
    setExpandedDepartments(newSet);
  };

  const toggleRole = (roleId) => {
    const newSet = new Set(expandedRoles);
    if (newSet.has(roleId)) {
      newSet.delete(roleId);
    } else {
      newSet.add(roleId);
    }
    setExpandedRoles(newSet);
  };

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

  return (
    <div className="space-y-4">
      {data.departments.map((deptGroup) => {
        const isDeptExpanded = expandedDepartments.has(deptGroup.department.id);
        // Total users from job roles only (shift roles duplicate the same people)
        const totalUsers =
          deptGroup.job_roles?.reduce((sum, jr) => sum + (jr.job_role?.users?.length || 0), 0) || 0;

        return (
          <Card key={deptGroup.department.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDepartment(deptGroup.department.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isDeptExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-xl">
                    {deptGroup.department.name}
                  </CardTitle>
                  {deptGroup.department.code && (
                    <Badge variant="outline">{deptGroup.department.code}</Badge>
                  )}
                </div>
                <Badge variant="secondary" className="gap-2">
                  <Users className="h-3 w-3" />
                  {totalUsers} {totalUsers === 1 ? "person" : "people"}
                </Badge>
              </div>
            </CardHeader>

            {isDeptExpanded && (
              <CardContent className="space-y-6">
                {/* Job Roles */}
                {deptGroup.job_roles?.map((jobRoleGroup, jobRoleIndex) => {
                  const jobRole = jobRoleGroup.job_role;
                  const isJobRoleExpanded = expandedRoles.has(jobRole.role.id);

                  return (
                    <div key={jobRole.role.id} className="relative">
                      {/* Connection line from department to job role */}
                      {jobRoleIndex > 0 && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border -ml-4" />
                      )}
                      
                      <div className="relative border-l-2 border-primary/30 pl-6 space-y-3">
                        {/* Job Role Header */}
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRole(jobRole.role.id)}
                            className="h-7 w-7 p-0 -ml-8"
                          >
                            {isJobRoleExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="flex items-center gap-2 flex-1">
                            <Users className="h-4 w-4 text-primary" />
                            <Badge variant="default" className="font-medium">
                              {jobRole.role.display_name || jobRole.role.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              Job Role
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {jobRole.users?.length || 0}{" "}
                              {jobRole.users?.length === 1 ? "person" : "people"}
                            </span>
                          </div>
                        </div>

                        {/* Job Role Users */}
                        {isJobRoleExpanded && jobRole.users && jobRole.users.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 ml-4">
                            {jobRole.users.map((user) => (
                              <div
                                key={user.id}
                                className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                              >
                                <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-border group-hover:bg-primary/50 transition-colors" />
                                <AvatarWithUrl
                                  avatarValue={user.avatar_url}
                                  alt={user.display_name}
                                  fallback={getInitials(user)}
                                  className="h-11 w-11 border-2 border-background group-hover:border-primary/50 transition-colors"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                    {user.display_name}
                                  </p>
                                  {user.job_title && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                      {user.job_title}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

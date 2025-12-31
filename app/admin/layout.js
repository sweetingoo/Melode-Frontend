"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Shield,
  Key,
  Settings,
  ChevronDown,
  Images,
  MapPin,
  Building2,
  Check,
  Loader2,
  CheckSquare,
  Type,
  FileText,
  ClipboardList,
  Clock,
  History,
  Crown,
  FileSpreadsheet,
  BarChart3,
  Activity,
  Database,
  Mail,
  FolderKanban,
  Bell,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import { assets } from "../assets/assets";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ClockInOutButton } from "@/components/ClockInOutButton";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  useAuth,
  useCurrentUser,
  useReturnToOriginalUser,
} from "@/hooks/useAuth";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { useTokenManager } from "@/hooks/useTokenManager";
import { apiUtils } from "@/services/api-client";
import AuthGuard from "@/components/AuthGuard";
import { useSSE } from "@/hooks/useSSE";
import {
  useUserDepartments,
  useSwitchDepartment,
} from "@/hooks/useDepartmentContext";
import { useRoles } from "@/hooks/useRoles";
import { useUnreadMessagesCount } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

// Main navigation items (always visible, no grouping)
const mainMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/admin",
    permission: null, // Dashboard is always visible
  },
  {
    title: "My Tasks",
    icon: ClipboardList,
    url: "/admin/my-tasks",
    permission: null, // My Tasks is visible to all users
  },
  {
    title: "Check In/Out",
    icon: Clock,
    url: "/clock",
    permission: "clock:in", // Permission to clock in
  },
  {
    title: "Session History",
    icon: History,
    url: "/clock/history",
    permission: "clock:view", // Permission to view clock records
  },
  {
    title: "Tasks",
    icon: CheckSquare,
    url: "/admin/tasks",
    permission: "tasks:read", // Permission to read tasks
  },
  {
    title: "Projects",
    icon: FolderKanban,
    url: "/admin/projects",
    permission: "project:read", // Permission to read projects
  },
  {
    title: "Forms",
    icon: FileText,
    url: "/admin/forms",
    permission: "forms:read", // Permission to read forms
  },
  {
    title: "Messages",
    icon: Mail,
    url: "/admin/messages",
    permission: "message:read", // Permission to read messages
  },
  {
    title: "Broadcasts",
    icon: Megaphone,
    url: "/admin/broadcasts",
    permission: "message:read", // Permission to read messages (same as messages)
  },
  {
    title: "Notifications",
    icon: Bell,
    url: "/admin/notifications",
    permission: null, // Notifications are visible to all users
  },
  {
    title: "Preferences",
    icon: Settings,
    url: "/admin/preferences",
    permission: null, // Preferences are visible to all users
  },
];

// People & Access Management group
const peopleAndAccessItems = [
  {
    title: "Manage people",
    icon: Users,
    url: "/admin/people-management",
    permission: "users:read", // Permission to read users
  },
  {
    title: "Manage Roles",
    icon: Shield,
    url: "/admin/role-management",
    permission: "roles:read", // Permission to read roles
  },
  {
    title: "Manage Permissions",
    icon: Key,
    url: "/admin/permissions-management",
    permission: "permissions:read", // Permission to read permissions
  },
];

// Organisation Management group
const organisationItems = [
  {
    title: "Locations",
    icon: MapPin,
    url: "/admin/locations",
    permission: "locations:read", // Permission to read locations
  },
  {
    title: "Assets",
    icon: Images,
    url: "/admin/assets",
    permission: "assets:read", // Permission to read assets
  },
  {
    title: "Departments",
    icon: Building2,
    url: "/admin/departments",
    permission: "departments:read", // Permission to read departments
  },
  {
    title: "Task Types",
    icon: Type,
    url: "/admin/task-types",
    permission: "task_types:read", // Permission to read task types
  },
  {
    title: "Form Types",
    icon: FileText,
    url: "/admin/form-types",
    permission: "form_type:list", // Permission to list form types
  },
  {
    title: "Custom Fields",
    icon: Database,
    url: "/admin/custom-fields-admin",
    permission: "custom_field:read", // Permission to read custom fields
  },
];

// Monitoring & Reports group
const monitoringAndReportsItems = [
  {
    title: "Active People",
    icon: Activity,
    url: "/admin/clock",
    permission: "clock:view_all", // Permission to view all active people
  },
  {
    title: "Reports",
    icon: FileSpreadsheet,
    url: "/admin/reports",
    permission: "SUPERUSER_OR_REPORTS", // Superuser or reports:read permission
  },
  {
    title: "Audit Logs",
    icon: FileText,
    url: "/admin/audit-logs",
    permission: "SYSTEM_MONITOR", // Permission to view audit logs
  },
];

// Settings group
const settingsItems = [
  {
    title: "Configuration",
    icon: Settings,
    url: "/admin/configuration",
    permission: "SUPERUSER_ROLE_ONLY", // Only visible when assigned to Superuser role
  },
];

// Quick Setup removed - functionality moved to other sections

// Helper component for collapsible menu items that work in both expanded and collapsed states
function CollapsibleMenuItem({ title, icon: Icon, items, pathname }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    // When collapsed, show a dropdown menu
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={title}>
              <Icon className="h-4 w-4" />
              <span>{title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>{title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.map((item) => {
              const isActive = pathname === item.url;
              return (
                <DropdownMenuItem key={item.title} asChild>
                  <Link
                    href={item.url}
                    className="flex items-center gap-2 w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  // When expanded, show the normal collapsible
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title}>
            <Icon className="h-4 w-4" />
            <span>{title}</span>
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((item) => {
              const isActive = pathname === item.url;
              return (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuSubButton asChild isActive={isActive}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isLoggingOut } = useAuth();
  const {
    data: currentUserData,
    isLoading: currentUserLoading,
    error: currentUserError,
  } = useCurrentUser();
  const returnToOriginalUserMutation = useReturnToOriginalUser();

  // Initialize token manager
  const { sessionModal } = useTokenManager();

  // Initialize SSE for real-time updates
  useSSE();

  // Get unread messages count for sidebar badge
  const { data: unreadMessagesData } = useUnreadMessagesCount();
  const unreadMessagesCount = unreadMessagesData?.unread_count || 0;

  // Role switching hooks
  const { data: departmentsData, isLoading: departmentsLoading } =
    useUserDepartments();
  const { data: allRolesDataRaw } = useRoles(); // Get all roles to find shift roles hierarchy
  // Handle both array and object response formats
  const allRolesData = Array.isArray(allRolesDataRaw)
    ? allRolesDataRaw
    : allRolesDataRaw?.roles || allRolesDataRaw?.items || [];
  const switchDepartmentMutation = useSwitchDepartment();

  // Client-side state to prevent hydration mismatch
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log("AdminLayout - User data state:", {
      currentUserData,
      currentUserLoading,
      currentUserError,
      isClient,
      hasAuthToken:
        typeof window !== "undefined"
          ? !!localStorage.getItem("authToken")
          : "SSR",
    });
  }, [currentUserData, currentUserLoading, currentUserError, isClient]);

  // Debug authentication state
  React.useEffect(() => {
    if (isClient) {
      console.log("AdminLayout - Authentication check:", {
        hasToken: !!localStorage.getItem("authToken"),
        token: localStorage.getItem("authToken"),
        isAuthenticated: apiUtils.isAuthenticated(),
      });
    }
  }, [isClient]);

  // Get current user's permissions - only when data is loaded
  // Extract permissions from roles if top-level permissions array is empty
  const currentUserPermissions = React.useMemo(() => {
    if (!currentUserData) return [];
    
    // If top-level permissions exist, use them
    if (currentUserData.permissions && currentUserData.permissions.length > 0) {
      return currentUserData.permissions;
    }
    
    // Otherwise, extract from roles
    if (currentUserData.roles && Array.isArray(currentUserData.roles)) {
      const allRolePermissions = [];
      currentUserData.roles.forEach((role) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          allRolePermissions.push(...role.permissions);
        }
      });
      return allRolePermissions;
    }
    
    return [];
  }, [currentUserData]);
  
  const currentUserDirectPermissions =
    currentUserData?.direct_permissions || [];

  // Check if current user has wildcard permissions - only when user data is available
  const hasWildcardPermissions = React.useMemo(() => {
    if (!currentUserData || currentUserLoading) {
      return { rolePermissions: false, directPermissions: false };
    }

    const rolePermissions = currentUserPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    const directPermissions = currentUserDirectPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    return { rolePermissions, directPermissions };
  }, [
    currentUserData,
    currentUserLoading,
    currentUserPermissions,
    currentUserDirectPermissions,
  ]);

  // Get all permission names/slugs that the user has
  const userPermissionNames = React.useMemo(() => {
    // If user data is not loaded yet, return empty array
    if (!currentUserData || currentUserLoading) {
      return [];
    }

    // If user has wildcard permissions, they have all permissions
    if (
      hasWildcardPermissions.rolePermissions ||
      hasWildcardPermissions.directPermissions
    ) {
      return ["*"]; // Wildcard means all permissions
    }

    // Extract permission names/slugs from both role and direct permissions
    const rolePerms = currentUserPermissions
      .map((p) => {
        if (typeof p === "string") return p;
        if (typeof p === "object")
          return p.name || p.slug || p.permission || p.display_name;
        return null;
      })
      .filter(Boolean);

    const directPerms = currentUserDirectPermissions
      .map((p) => {
        if (typeof p === "string") return p;
        if (typeof p === "object")
          return p.name || p.slug || p.permission || p.display_name;
        return null;
      })
      .filter(Boolean);

    return [...new Set([...rolePerms, ...directPerms])];
  }, [
    currentUserData,
    currentUserLoading,
    currentUserPermissions,
    currentUserDirectPermissions,
    hasWildcardPermissions,
  ]);

  // Group assignments by department for role switcher
  const assignments = departmentsData?.departments || [];

  // Get current assignment ID from localStorage (preferred) or API response (fallback)
  const currentAssignmentId = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const storedAssignmentId = localStorage.getItem("assignment_id");
      if (storedAssignmentId) {
        return parseInt(storedAssignmentId);
      }
    }
    // Fallback to API response
    return departmentsData?.current_assignment_id;
  }, [departmentsData?.current_assignment_id]);

  const assignmentsByDepartment = React.useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return [];

    const grouped = {};
    assignments.forEach((assignment) => {
      const deptId = assignment.department?.id;
      if (!deptId) return;

      if (!grouped[deptId]) {
        grouped[deptId] = {
          department: assignment.department,
          jobRoles: new Map(), // Use Map to group by job role
          roles: [], // Flat list for roles without department
        };
      }

      if (assignment.assignment_id && assignment.role) {
        const role = assignment.role;
        const roleData = {
          assignment_id: assignment.assignment_id,
          role: role,
          is_active: assignment.is_active,
        };

        // If it's a shift role, we'll handle it when processing the parent job role
        // This prevents duplicates when shift roles appear both as assignments and in shift_roles array
        if (role.role_type === "shift_role" && role.parent_role_id) {
          // Skip processing shift roles here - they'll be added when we process their parent job role
          // The parent job role processing will merge shift roles from both assignments and shift_roles array
        } else if (role.role_type === "job_role") {
          // Job role - add to map if not exists, or update if exists
          if (!grouped[deptId].jobRoles.has(role.id)) {
            // Get shift roles from allRolesData if available
            const fullRoleData = Array.isArray(allRolesData)
              ? allRolesData.find((r) => r.id === role.id)
              : null;
            // Handle both transformed and raw role data - check multiple possible property names
            const shiftRolesFromData = fullRoleData?.shiftRoles ||
              fullRoleData?.shift_roles ||
              (fullRoleData && Array.isArray(fullRoleData.shift_roles) ? fullRoleData.shift_roles : null) ||
              role.shift_roles ||
              role.shiftRoles ||
              (Array.isArray(role.shift_roles) ? role.shift_roles : []) ||
              [];

            // Find shift role assignments for this job role
            const shiftRoleAssignments = assignments
              .filter(
                (a) =>
                  a.role?.parent_role_id === role.id &&
                  a.role?.role_type === "shift_role" &&
                  a.department?.id === deptId
              )
              .map((a) => ({
                assignment_id: a.assignment_id,
                role: a.role,
                is_active: a.is_active,
              }));

            // Use Map to deduplicate shift roles by role ID
            // This prevents duplicates when shift roles appear both as assignments and in shift_roles array
            const shiftRolesMap = new Map();

            // First, add shift roles from assignments (these have assignment_id)
            shiftRoleAssignments.forEach((sr) => {
              if (sr.role?.id) {
                // Ensure consistent key type (always use number)
                const roleId = typeof sr.role.id === "string" ? parseInt(sr.role.id) : sr.role.id;
                if (roleId && !isNaN(roleId)) {
                  shiftRolesMap.set(roleId, sr);
                }
              }
            });

            // Then, add shift roles from role data that aren't already in the map
            // This ensures we show all shift roles, even if user doesn't have assignments for them
            if (Array.isArray(shiftRolesFromData) && shiftRolesFromData.length > 0) {
              shiftRolesFromData.forEach((shiftRole) => {
                // Ensure consistent key type (always use number)
                const shiftRoleId = typeof shiftRole.id === "string" ? parseInt(shiftRole.id) : shiftRole.id;
                // Only add if not already in map (prevents duplicates)
                if (shiftRoleId && !isNaN(shiftRoleId) && !shiftRolesMap.has(shiftRoleId)) {
                  shiftRolesMap.set(shiftRoleId, {
                    assignment_id: null, // No assignment
                    role: {
                      id: shiftRole.id,
                      name: shiftRole.name,
                      display_name: shiftRole.display_name || shiftRole.name,
                      role_type: shiftRole.role_type || "shift_role",
                      parent_role_id: shiftRole.parent_role_id || role.id,
                      ...shiftRole,
                    },
                    is_active: false,
                  });
                }
              });
            }

            // Final deduplication: convert to array and remove any remaining duplicates by role.id
            const shiftRolesArray = Array.from(shiftRolesMap.values());
            const uniqueShiftRoles = [];
            const seenIds = new Set();
            shiftRolesArray.forEach((sr) => {
              const roleId = typeof sr.role?.id === "string" ? parseInt(sr.role.id) : sr.role?.id;
              if (roleId && !isNaN(roleId) && !seenIds.has(roleId)) {
                seenIds.add(roleId);
                uniqueShiftRoles.push(sr);
              }
            });

            grouped[deptId].jobRoles.set(role.id, {
              assignment_id: assignment.assignment_id,
              role: role,
              is_active: assignment.is_active,
              shiftRoles: uniqueShiftRoles,
            });
          } else {
            // Update existing job role assignment
            const existing = grouped[deptId].jobRoles.get(role.id);
            existing.assignment_id = assignment.assignment_id;
            existing.is_active = assignment.is_active;

            // Rebuild shift roles list to ensure no duplicates
            // Get shift roles from allRolesData
            const fullRoleData = Array.isArray(allRolesData)
              ? allRolesData.find((r) => r.id === role.id)
              : null;
            // Handle both transformed and raw role data - check multiple possible property names
            const shiftRolesFromData = fullRoleData?.shiftRoles ||
              fullRoleData?.shift_roles ||
              (fullRoleData && Array.isArray(fullRoleData.shift_roles) ? fullRoleData.shift_roles : null) ||
              role.shift_roles ||
              role.shiftRoles ||
              (Array.isArray(role.shift_roles) ? role.shift_roles : []) ||
              [];

            // Find shift role assignments for this job role
            const shiftRoleAssignments = assignments
              .filter(
                (a) =>
                  a.role?.parent_role_id === role.id &&
                  a.role?.role_type === "shift_role" &&
                  a.department?.id === deptId
              )
              .map((a) => ({
                assignment_id: a.assignment_id,
                role: a.role,
                is_active: a.is_active,
              }));

            // Use Map to deduplicate shift roles by role ID
            // This prevents duplicates when shift roles appear both as assignments and in shift_roles array
            const shiftRolesMap = new Map();

            // First, add shift roles from assignments (these have assignment_id)
            shiftRoleAssignments.forEach((sr) => {
              if (sr.role?.id) {
                // Ensure consistent key type (always use number)
                const roleId = typeof sr.role.id === "string" ? parseInt(sr.role.id) : sr.role.id;
                if (roleId && !isNaN(roleId)) {
                  shiftRolesMap.set(roleId, sr);
                }
              }
            });

            // Then, add shift roles from role data that aren't already in the map
            if (Array.isArray(shiftRolesFromData) && shiftRolesFromData.length > 0) {
              shiftRolesFromData.forEach((shiftRole) => {
                // Ensure consistent key type (always use number)
                const shiftRoleId = typeof shiftRole.id === "string" ? parseInt(shiftRole.id) : shiftRole.id;
                // Only add if not already in map (prevents duplicates)
                if (shiftRoleId && !isNaN(shiftRoleId) && !shiftRolesMap.has(shiftRoleId)) {
                  shiftRolesMap.set(shiftRoleId, {
                    assignment_id: null,
                    role: {
                      id: shiftRole.id,
                      name: shiftRole.name,
                      display_name: shiftRole.display_name || shiftRole.name,
                      role_type: shiftRole.role_type || "shift_role",
                      parent_role_id: shiftRole.parent_role_id || role.id,
                      ...shiftRole,
                    },
                    is_active: false,
                  });
                }
              });
            }

            // Final deduplication: convert to array and remove any remaining duplicates by role.id
            const shiftRolesArray = Array.from(shiftRolesMap.values());
            const uniqueShiftRoles = [];
            const seenIds = new Set();
            shiftRolesArray.forEach((sr) => {
              const roleId = typeof sr.role?.id === "string" ? parseInt(sr.role.id) : sr.role?.id;
              if (roleId && !isNaN(roleId) && !seenIds.has(roleId)) {
                seenIds.add(roleId);
                uniqueShiftRoles.push(sr);
              }
            });

            // Replace existing shiftRoles with deduplicated list
            existing.shiftRoles = uniqueShiftRoles;
          }
        } else {
          // Other roles (fallback)
          grouped[deptId].roles.push(roleData);
        }
      }
    });

    // Convert Maps to arrays and structure for display
    const departmentGroups = Object.values(grouped).map((deptGroup) => ({
      department: deptGroup.department,
      jobRoles: Array.from(deptGroup.jobRoles.values()),
      roles: deptGroup.roles,
    }));

    // Add Superuser role if user is a superuser
    // Superuser role doesn't need a department or assignment
    if (currentUserData?.is_superuser) {
      // Check if superuser role already exists in assignments
      // Superuser might be in assignments or might be a system role without assignment
      const superuserAssignment = assignments.find(
        (a) =>
          a.role?.slug === "superuser" ||
          a.role?.name === "superuser" ||
          a.role?.role_type === "superuser" ||
          a.role?.id === "superuser" ||
          (typeof a.role === "object" && (a.role.slug === "superuser" || a.role.name === "superuser"))
      );

      // Find superuser role from all roles data
      // Check multiple possible identifiers for superuser role
      const superuserRole = Array.isArray(allRolesData)
        ? allRolesData.find(
          (r) =>
            r.slug === "superuser" ||
            r.name === "superuser" ||
            r.role_type === "superuser" ||
            r.id === "superuser" ||
            (typeof r === "object" && r.display_name?.toLowerCase() === "superuser")
        )
        : null;

      if (superuserRole || currentUserData.is_superuser) {
        // Use the actual role data from API if found, otherwise create a fallback
        const roleToUse = superuserRole || {
          id: "superuser",
          name: "Superuser",
          display_name: "Superuser",
          slug: "superuser",
          role_type: "superuser",
          isSystem: true,
        };

        // Add superuser as a special group at the beginning
        departmentGroups.unshift({
          department: {
            id: "superuser",
            name: "Superuser",
            code: "SU",
            description: "System administrator role",
          },
          jobRoles: [],
          roles: [
            {
              assignment_id: superuserAssignment?.assignment_id || null,
              role: roleToUse,
              is_active: true,
            },
          ],
        });
      }
    }

    return departmentGroups;
  }, [assignments, allRolesData, currentUserData]);

  // Find current assignment
  const currentAssignment = assignments.find(
    (a) => a.assignment_id === currentAssignmentId
  );
  const currentDepartment = currentAssignment?.department;
  const currentRole = currentAssignment?.role;

  // Helper function to check if current role is a Superuser role
  const isCurrentRoleSuperuser = React.useMemo(() => {
    // First check if user is a superuser (regardless of assignment)
    if (currentUserData?.is_superuser) return true;

    // Then check if current role is superuser
    if (!currentRole) return false;
    return (
      currentRole.slug === "superuser" ||
      currentRole.name === "superuser" ||
      currentRole.role_type === "superuser" ||
      currentRole.id === "superuser" ||
      (typeof currentRole === "object" && currentRole.display_name?.toLowerCase() === "superuser")
    );
  }, [currentRole, currentUserData?.is_superuser]);

  // Helper function to filter items based on permissions
  const filterItemsByPermission = (items) => {
    // During SSR or while loading, show all items to prevent hydration mismatch
    if (!isClient || currentUserLoading || !currentUserData) {
      return items;
    }

    // If user is a superuser (by flag), show all items
    if (currentUserData.is_superuser) {
      return items;
    }

    return items.filter((item) => {
      // Special case: SUPERUSER_OR_REPORTS - show if:
      // 1. User has wildcard (*) permission
      // 2. User is a superuser (by role or is_superuser flag)
      // 3. User has reports:read or reports:* permission
      if (item.permission === "SUPERUSER_OR_REPORTS") {
        // Check wildcard permission first
        if (userPermissionNames.includes("*")) return true;

        // Check if user is superuser
        if (isCurrentRoleSuperuser || currentUserData.is_superuser) return true;

        // Check for reports-related permissions
        const hasReportsPermission = userPermissionNames.some((perm) => {
          return (
            perm === "reports:read" ||
            perm === "reports:*" ||
            perm === "reports:view" ||
            perm.startsWith("reports:")
          );
        });

        return hasReportsPermission;
      }

      // Special case: SUPERUSER_ROLE_ONLY - show if:
      // 1. User has wildcard (*) permission
      // 2. User is a superuser (by role or is_superuser flag)
      // 3. User has a specific permission for configuration (e.g., "configuration:read", "configuration:*", etc.)
      if (item.permission === "SUPERUSER_ROLE_ONLY") {
        // Check wildcard permission first
        if (userPermissionNames.includes("*")) return true;

        // Check if user is superuser
        if (isCurrentRoleSuperuser || currentUserData.is_superuser) return true;

        // Check for configuration-related permissions
        const hasConfigurationPermission = userPermissionNames.some((perm) => {
          return (
            perm === "configuration:read" ||
            perm === "configuration:*" ||
            perm === "configuration:write" ||
            perm === "configuration:update" ||
            perm.startsWith("configuration:")
          );
        });

        return hasConfigurationPermission;
      }

      // Items with null or undefined permission are always visible (Dashboard, My Tasks, etc.)
      // This ensures these items are visible to ALL users regardless of roles/permissions
      if (item.permission === null || item.permission === undefined) {
        return true;
      }

      // Special case: clock:in - allow superusers even if they don't have the permission
      if (item.permission === "clock:in") {
        // If user is superuser, allow access
        if (isCurrentRoleSuperuser || currentUserData.is_superuser) return true;
        // Otherwise check for permission
      }

      // If user has wildcard permissions, show all
      if (userPermissionNames.includes("*")) return true;

      // Check if user has the specific permission
      return userPermissionNames.some((perm) => {
        // Exact match
        if (perm === item.permission) return true;

        // Resource match (e.g., invitation:create matches invitations:create)
        const itemResource = item.permission.split(":")[0];
        const permResource = perm.split(":")[0];
        if (
          permResource === itemResource ||
          permResource === itemResource + "s" ||
          permResource + "s" === itemResource
        ) {
          return true;
        }

        // Check if permission contains the resource
        return perm.includes(itemResource);
      });
    });
  };

  // Filter all menu groups based on permissions
  // Only filter after client-side hydration to prevent SSR/client mismatch
  const visibleMainMenuItems = React.useMemo(
    () => filterItemsByPermission(mainMenuItems),
    [userPermissionNames, currentUserLoading, isCurrentRoleSuperuser, isClient, currentUserData]
  );

  const visiblePeopleAndAccessItems = React.useMemo(
    () => filterItemsByPermission(peopleAndAccessItems),
    [userPermissionNames, currentUserLoading, isCurrentRoleSuperuser, isClient, currentUserData]
  );

  const visibleOrganisationItems = React.useMemo(
    () => filterItemsByPermission(organisationItems),
    [userPermissionNames, currentUserLoading, isCurrentRoleSuperuser, isClient, currentUserData]
  );

  const visibleMonitoringAndReportsItems = React.useMemo(
    () => filterItemsByPermission(monitoringAndReportsItems),
    [userPermissionNames, currentUserLoading, isCurrentRoleSuperuser, isClient, currentUserData]
  );

  const visibleSettingsItems = React.useMemo(
    () => filterItemsByPermission(settingsItems),
    [userPermissionNames, currentUserLoading, isCurrentRoleSuperuser, isClient, currentUserData]
  );

  // Quick Setup section removed

  // Handle role switch
  const handleRoleSwitch = async (assignmentId) => {
    try {
      // Handle null assignmentId (for Superuser without assignment)
      if (assignmentId === null || assignmentId === undefined) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("assignment_id");
          localStorage.removeItem("activeRoleId");
        }
        // Invalidate queries to refresh
        switchDepartmentMutation.mutate(null);
        return;
      }
      await switchDepartmentMutation.mutateAsync(assignmentId);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src={assets.favicon.src}
                    alt={
                      !isClient || currentUserLoading
                        ? "Melode Portal"
                        : hasWildcardPermissions.rolePermissions ||
                          hasWildcardPermissions.directPermissions
                          ? "Melode Admin"
                          : "Melode Portal"
                    }
                    width={32}
                    height={32}
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold">
                    {!isClient || currentUserLoading
                      ? "Melode Portal"
                      : hasWildcardPermissions.rolePermissions ||
                        hasWildcardPermissions.directPermissions
                        ? "Melode Admin"
                        : "Melode Portal"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {!isClient || currentUserLoading
                      ? "User Portal"
                      : hasWildcardPermissions.rolePermissions ||
                        hasWildcardPermissions.directPermissions
                        ? "Management Panel"
                        : "User Portal"}
                  </span>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* Main Navigation Items */}
                    {visibleMainMenuItems.map((item) => {
                      const isActive = pathname === item.url;
                      // Show unread count badge for Messages menu item
                      const showUnreadBadge = item.url === "/admin/messages" && unreadMessagesCount > 0;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            isActive={isActive}
                          >
                            <Link
                              href={item.url}
                              className="flex items-center gap-2 relative"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {showUnreadBadge && (
                                <span className="ml-auto h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}

                    {/* People & Access Management - Collapsible */}
                    {visiblePeopleAndAccessItems.length > 0 && (
                      <CollapsibleMenuItem
                        title="People & Access"
                        icon={Users}
                        items={visiblePeopleAndAccessItems}
                        pathname={pathname}
                      />
                    )}

                    {/* Organisation Management - Collapsible */}
                    {visibleOrganisationItems.length > 0 && (
                      <CollapsibleMenuItem
                        title="Organisation"
                        icon={Building2}
                        items={visibleOrganisationItems}
                        pathname={pathname}
                      />
                    )}

                    {/* Monitoring & Reports - Collapsible */}
                    {visibleMonitoringAndReportsItems.length > 0 && (
                      <CollapsibleMenuItem
                        title="Monitoring & Reports"
                        icon={BarChart3}
                        items={visibleMonitoringAndReportsItems}
                        pathname={pathname}
                      />
                    )}

                    {/* Settings - Collapsible */}
                    {visibleSettingsItems.length > 0 && (
                      <CollapsibleMenuItem
                        title="Settings"
                        icon={Settings}
                        items={visibleSettingsItems}
                        pathname={pathname}
                      />
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              {/* Role Switcher - Before Profile */}
              {assignmentsByDepartment.length > 0 && (
                <div className="px-2 py-2 border-b">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-2 py-2 h-auto group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center"
                        disabled={
                          switchDepartmentMutation.isPending ||
                          departmentsLoading
                        }
                      >
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className=" truncate min-w-0  block group-data-[collapsible=icon]:hidden">
                          {currentDepartment?.name || (currentUserData?.is_superuser ? "Superuser" : "Select role")}
                        </span>
                        {(currentRole || (currentUserData?.is_superuser && !currentRole)) && (
                          <span className="text-xs flex-1 text-right text-muted-foreground flex items-center justify-end gap-1 block group-data-[collapsible=icon]:hidden">
                            {currentUserData?.is_superuser && !currentRole ? (
                              <>
                                <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                                <span>Superuser</span>
                              </>
                            ) : (
                              currentRole?.display_name ||
                              currentRole?.name ||
                              currentRole?.role_name
                            )}
                          </span>
                        )}
                        {switchDepartmentMutation.isPending && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin shrink-0" />
                        )}
                        <ChevronDown className="ml-auto h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {assignmentsByDepartment.map((deptGroup) => (
                        <div key={deptGroup.department.id || deptGroup.department.name}>
                          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                            {deptGroup.department.name}
                            {deptGroup.department.id === "superuser" && (
                              <Crown className="h-3 w-3 inline-block ml-1 text-yellow-600" />
                            )}
                          </DropdownMenuLabel>

                          {/* Job Roles Only - Shift roles are automatically available when job role is assigned */}
                          {deptGroup.jobRoles.map((jobRoleAssignment) => {
                            const isJobRoleActive =
                              jobRoleAssignment.assignment_id === currentAssignmentId;

                            return (
                              jobRoleAssignment.assignment_id && (
                                <DropdownMenuItem
                                  key={jobRoleAssignment.assignment_id}
                                  className={`cursor-pointer pl-6 ${isJobRoleActive ? "bg-accent" : ""}`}
                                  onClick={() =>
                                    handleRoleSwitch(jobRoleAssignment.assignment_id)
                                  }
                                  disabled={
                                    switchDepartmentMutation.isPending || isJobRoleActive
                                  }
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        {jobRoleAssignment.role.display_name ||
                                          jobRoleAssignment.role.name ||
                                          jobRoleAssignment.role.role_name}
                                      </span>
                                    </div>
                                    {isJobRoleActive && (
                                      <Check className="h-3 w-3 text-primary" />
                                    )}
                                  </div>
                                </DropdownMenuItem>
                              )
                            );
                          })}

                          {/* Other roles (fallback for roles without hierarchy) */}
                          {deptGroup.roles.map((roleAssignment) => {
                            const isSuperuserRole =
                              roleAssignment.role.slug === "superuser" ||
                              roleAssignment.role.name === "superuser" ||
                              roleAssignment.role.role_type === "superuser" ||
                              deptGroup.department.id === "superuser";

                            // For Superuser role, check if it's active (no assignment_id means superuser mode)
                            const isActive = isSuperuserRole
                              ? (!roleAssignment.assignment_id && !currentAssignmentId) ||
                              (roleAssignment.assignment_id === currentAssignmentId)
                              : roleAssignment.assignment_id === currentAssignmentId;

                            return (
                              <DropdownMenuItem
                                key={roleAssignment.assignment_id || `role-${roleAssignment.role.id}`}
                                className={`cursor-pointer pl-6 ${isActive ? "bg-accent" : ""}`}
                                onClick={() => {
                                  // For superuser role, handle specially
                                  if (isSuperuserRole) {
                                    // Superuser doesn't need an assignment_id - it's a system role
                                    // If there's an assignment_id, use it; otherwise use a special value
                                    if (roleAssignment.assignment_id) {
                                      handleRoleSwitch(roleAssignment.assignment_id);
                                    } else {
                                      // For Superuser without assignment_id, clear assignment_id to switch to superuser mode
                                      // This means no assignment_id in localStorage = superuser mode
                                      if (typeof window !== "undefined") {
                                        localStorage.removeItem("assignment_id");
                                        localStorage.removeItem("activeRoleId");
                                      }
                                      // Invalidate queries to refresh
                                      switchDepartmentMutation.mutate(null);
                                    }
                                    return;
                                  }
                                  if (roleAssignment.assignment_id) {
                                    handleRoleSwitch(roleAssignment.assignment_id);
                                  }
                                }}
                                disabled={
                                  switchDepartmentMutation.isPending ||
                                  // Disable if this role is already active
                                  isActive ||
                                  // For non-superuser roles, disable if no assignment_id
                                  (!isSuperuserRole && !roleAssignment.assignment_id)
                                }
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    {isSuperuserRole ? (
                                      <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                                    ) : (
                                      <Shield className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {roleAssignment.role.display_name ||
                                        roleAssignment.role.name ||
                                        roleAssignment.role.role_name}
                                    </span>
                                  </div>
                                  {(isActive || (isSuperuserRole && currentUserData?.is_superuser && !roleAssignment.assignment_id && !currentAssignmentId)) && (
                                    <Check className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                              </DropdownMenuItem>
                            );
                          })}

                          {assignmentsByDepartment.indexOf(deptGroup) <
                            assignmentsByDepartment.length - 1 && (
                              <DropdownMenuSeparator />
                            )}
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-2 py-2 h-auto"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            currentUserData?.avatar_url ||
                            currentUserData?.avatar ||
                            "/placeholder-avatar.jpg"
                          }
                          alt="User avatar"
                        />
                        <AvatarFallback className="text-sm font-semibold">
                          {currentUserData
                            ? (
                              currentUserData.first_name?.[0] ||
                              currentUserData.email?.[0] ||
                              "U"
                            ).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden min-w-0 flex-1">
                        <span
                          className="text-sm font-medium truncate w-full"
                          title={
                            currentUserData
                              ? currentUserData.display_name ||
                              `${currentUserData.first_name || ""} ${currentUserData.last_name || ""
                                }`.trim() ||
                              currentUserData.email ||
                              "User"
                              : "Loading..."
                          }
                        >
                          {currentUserData
                            ? currentUserData.display_name ||
                            `${currentUserData.first_name || ""} ${currentUserData.last_name || ""
                              }`.trim() ||
                            currentUserData.email ||
                            "User"
                            : "Loading..."}
                        </span>
                        <span
                          className="text-xs text-muted-foreground truncate w-full"
                          title={
                            currentUserData
                              ? currentUserData.email || "No email"
                              : "Loading..."
                          }
                        >
                          {currentUserData
                            ? currentUserData.email || "No email"
                            : "Loading..."}
                        </span>
                      </div>
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
                    </div>

                    {/* Hijack Session Indicator */}
                    {typeof window !== "undefined" &&
                      localStorage.getItem("hijackSession") && (
                        <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md group-data-[collapsible=icon]:hidden">
                          <div className="flex items-center gap-2 text-xs text-orange-800 dark:text-orange-200">
                            <Shield className="h-3 w-3" />
                            <span className="font-medium">
                              Hijacked Session
                            </span>
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                            Acting as another user
                          </div>
                        </div>
                      )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <Link href="/admin/profile">Your Profile</Link>
                  </DropdownMenuItem>

                  {/* Return to Original User - only show if hijacked */}
                  {typeof window !== "undefined" &&
                    localStorage.getItem("hijackSession") && (
                      <DropdownMenuItem
                        className="cursor-pointer text-orange-600"
                        onClick={() => returnToOriginalUserMutation.mutate()}
                        disabled={returnToOriginalUserMutation.isPending}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {returnToOriginalUserMutation.isPending
                          ? "Returning..."
                          : "Return to Original User"}
                      </DropdownMenuItem>
                    )}

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600"
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  {(() => {
                    // Show page-specific titles
                    if (pathname === "/admin/messages") {
                      return "Messages";
                    }
                    if (pathname === "/admin/broadcasts" || pathname?.startsWith("/admin/broadcasts/")) {
                      return "Broadcasts";
                    }
                    if (pathname === "/admin/notifications") {
                      return "Notifications";
                    }
                    if (pathname === "/admin/tasks") {
                      return "Tasks";
                    }
                    if (pathname === "/admin/projects") {
                      return "Projects";
                    }
                    if (pathname === "/admin/forms") {
                      return "Forms";
                    }
                    if (pathname === "/admin/my-tasks") {
                      return "My Tasks";
                    }
                    if (pathname === "/admin/preferences") {
                      return "Preferences";
                    }
                    // Default dashboard title
                    if (!isClient || currentUserLoading) {
                      return "User Dashboard";
                    }
                    return hasWildcardPermissions.rolePermissions ||
                      hasWildcardPermissions.directPermissions
                      ? "Admin Dashboard"
                      : "User Dashboard";
                  })()}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationsDropdown />
                <ClockInOutButton />
                <ThemeToggle />
              </div>
            </header>

            <main className={cn(
              "flex-1 overflow-x-hidden",
              pathname === "/admin/messages" ? "p-0" : "p-4"
            )}>{children}</main>
          </SidebarInset>
        </div>

        {/* Session Continuation Modal */}
        {sessionModal}
        
      </SidebarProvider>
    </AuthGuard>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Zap,
  ChevronDown,
} from "lucide-react";
import { assets } from "../assets/assets";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, useCurrentUser, useReturnToOriginalUser } from "@/hooks/useAuth";
import { useTokenManager } from "@/hooks/useTokenManager";
import { apiUtils } from "@/services/api-client";
import AuthGuard from "@/components/AuthGuard";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/admin",
    permission: null, // Dashboard is always visible
  },
  {
    title: "Create invitation",
    icon: UserPlus,
    url: "/admin/invitations",
    permission: "invitation:create", // Permission to create invitations
  },
  {
    title: "Manage users",
    icon: Users,
    url: "/admin/user-management",
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
  {
    title: "Configure",
    icon: Settings,
    url: "/admin/configure",
    permission: "system:configure", // Permission to configure system
  },
];

const quickSetupItems = [
  {
    title: "Quick Setup",
    icon: Zap,
    url: "/admin/setup-custom-fields",
    permission: "custom_fields:create", // Permission to create custom fields
  },
  {
    title: "Manage Fields",
    icon: Settings,
    url: "/admin/custom-fields-admin",
    permission: "custom_fields:read", // Permission to read custom fields
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();
  const { data: currentUserData, isLoading: currentUserLoading, error: currentUserError } = useCurrentUser();
  const returnToOriginalUserMutation = useReturnToOriginalUser();
  
  // Initialize token manager
  const { sessionModal } = useTokenManager();
  
  // Client-side state to prevent hydration mismatch
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log('AdminLayout - User data state:', {
      currentUserData,
      currentUserLoading,
      currentUserError,
      isClient,
      hasAuthToken: typeof window !== 'undefined' ? !!localStorage.getItem("authToken") : 'SSR'
    });
  }, [currentUserData, currentUserLoading, currentUserError, isClient]);

  // Debug authentication state
  React.useEffect(() => {
    if (isClient) {
      console.log('AdminLayout - Authentication check:', {
        hasToken: !!localStorage.getItem("authToken"),
        token: localStorage.getItem("authToken"),
        isAuthenticated: apiUtils.isAuthenticated()
      });
    }
  }, [isClient]);

  // Get current user's permissions - only when data is loaded
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions = currentUserData?.direct_permissions || [];

  // Check if current user has wildcard permissions - only when user data is available
  const hasWildcardPermissions = React.useMemo(() => {
    if (!currentUserData || currentUserLoading) {
      return { rolePermissions: false, directPermissions: false };
    }
    
    const rolePermissions = currentUserPermissions.some(p => 
      p === '*' || p.id === '*' || p.permission_id === '*' || 
      (typeof p === 'object' && (p.permission === '*' || p.name === '*'))
    );
    const directPermissions = currentUserDirectPermissions.some(p => 
      p === '*' || p.id === '*' || p.permission_id === '*' || 
      (typeof p === 'object' && (p.permission === '*' || p.name === '*'))
    );
    return { rolePermissions, directPermissions };
  }, [currentUserData, currentUserLoading, currentUserPermissions, currentUserDirectPermissions]);

  // Get all permission names/slugs that the user has
  const userPermissionNames = React.useMemo(() => {
    // If user data is not loaded yet, return empty array
    if (!currentUserData || currentUserLoading) {
      return [];
    }

    // If user has wildcard permissions, they have all permissions
    if (hasWildcardPermissions.rolePermissions || hasWildcardPermissions.directPermissions) {
      return ['*']; // Wildcard means all permissions
    }

    // Extract permission names/slugs from both role and direct permissions
    const rolePerms = currentUserPermissions.map(p => {
      if (typeof p === 'string') return p;
      if (typeof p === 'object') return p.name || p.slug || p.permission || p.display_name;
      return null;
    }).filter(Boolean);

    const directPerms = currentUserDirectPermissions.map(p => {
      if (typeof p === 'string') return p;
      if (typeof p === 'object') return p.name || p.slug || p.permission || p.display_name;
      return null;
    }).filter(Boolean);

    return [...new Set([...rolePerms, ...directPerms])];
  }, [currentUserData, currentUserLoading, currentUserPermissions, currentUserDirectPermissions, hasWildcardPermissions]);

  // Filter menu items based on permissions
  const visibleMenuItems = React.useMemo(() => {
    if (currentUserLoading) return menuItems; // Show all while loading
    
    return menuItems.filter(item => {
      // Dashboard is always visible
      if (!item.permission) return true;
      
      // If user has wildcard permissions, show all
      if (userPermissionNames.includes('*')) return true;
      
      // Check if user has the specific permission
      return userPermissionNames.some(perm => {
        // Exact match
        if (perm === item.permission) return true;
        
        // Resource match (e.g., invitation:create matches invitations:create)
        const itemResource = item.permission.split(':')[0];
        const permResource = perm.split(':')[0];
        if (permResource === itemResource || permResource === itemResource + 's' || permResource + 's' === itemResource) {
          return true;
        }
        
        // Check if permission contains the resource
        return perm.includes(itemResource);
      });
    });
  }, [userPermissionNames, currentUserLoading]);

  // Filter quick setup items based on permissions
  const visibleQuickSetupItems = React.useMemo(() => {
    if (currentUserLoading) return quickSetupItems; // Show all while loading
    
    return quickSetupItems.filter(item => {
      // If user has wildcard permissions, show all
      if (userPermissionNames.includes('*')) return true;
      
      // Check if user has the specific permission
      return userPermissionNames.some(perm => 
        perm === item.permission || 
        perm.includes(item.permission.split(':')[0]) // Check resource match
      );
    });
  }, [userPermissionNames, currentUserLoading]);

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
                  alt={!isClient || currentUserLoading 
                    ? "Melode Portal" 
                    : (hasWildcardPermissions.rolePermissions || hasWildcardPermissions.directPermissions)
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
                    : (hasWildcardPermissions.rolePermissions || hasWildcardPermissions.directPermissions)
                      ? "Melode Admin" 
                      : "Melode Portal"
                  }
                </span>
                <span className="text-xs text-muted-foreground">
                  {!isClient || currentUserLoading 
                    ? "User Portal" 
                    : (hasWildcardPermissions.rolePermissions || hasWildcardPermissions.directPermissions)
                      ? "Management Panel" 
                      : "User Portal"
                  }
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleMenuItems.map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={isActive}
                        >
                          <Link
                            href={item.url}
                            className="flex items-center gap-2"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}

                  {visibleQuickSetupItems.length > 0 && (
                    <Collapsible defaultOpen className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip="Custom Fields">
                            <Zap className="h-4 w-4" />
                            <span>Custom Fields</span>
                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {visibleQuickSetupItems.map((item) => {
                              const isActive = pathname === item.url;
                              return (
                                <SidebarMenuSubItem key={item.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive}
                                  >
                                    <Link
                                      href={item.url}
                                      className="flex items-center gap-2"
                                    >
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
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-2 h-auto"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={currentUserData?.avatar_url || currentUserData?.avatar || "/placeholder-avatar.jpg"}
                        alt="User avatar"
                      />
                      <AvatarFallback className="text-sm font-semibold">
                        {currentUserData ? 
                          (currentUserData.first_name?.[0] || currentUserData.email?.[0] || 'U').toUpperCase() 
                          : 'U'
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden min-w-0 flex-1">
                      <span className="text-sm font-medium truncate w-full" title={
                        currentUserData ? 
                          (currentUserData.display_name || 
                           `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || 
                           currentUserData.email || 
                           'User') 
                          : 'Loading...'
                      }>
                        {currentUserData ? 
                          (currentUserData.display_name || 
                           `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || 
                           currentUserData.email || 
                           'User') 
                          : 'Loading...'
                        }
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full" title={
                        currentUserData ? 
                          currentUserData.email || 'No email' 
                          : 'Loading...'
                      }>
                        {currentUserData ? 
                          currentUserData.email || 'No email' 
                          : 'Loading...'
                        }
                      </span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
                  </div>
                  
                  
                  {/* Hijack Session Indicator */}
                  {typeof window !== 'undefined' && localStorage.getItem('hijackSession') && (
                    <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md group-data-[collapsible=icon]:hidden">
                      <div className="flex items-center gap-2 text-xs text-orange-800 dark:text-orange-200">
                        <Shield className="h-3 w-3" />
                        <span className="font-medium">Hijacked Session</span>
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
                {typeof window !== 'undefined' && localStorage.getItem('hijackSession') && (
                  <DropdownMenuItem 
                    className="cursor-pointer text-orange-600"
                    onClick={() => returnToOriginalUserMutation.mutate()}
                    disabled={returnToOriginalUserMutation.isPending}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {returnToOriginalUserMutation.isPending ? "Returning..." : "Return to Original User"}
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
                {!isClient || currentUserLoading 
                  ? "User Dashboard" 
                  : (hasWildcardPermissions.rolePermissions || hasWildcardPermissions.directPermissions)
                    ? "Admin Dashboard" 
                    : "User Dashboard"
                }
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </div>
      
        {/* Session Continuation Modal */}
        {sessionModal}
      </SidebarProvider>
    </AuthGuard>
  );
}

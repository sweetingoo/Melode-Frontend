"use client";

import React, { useState } from "react";
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
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    LayoutDashboard,
    UserPlus,
    Users,
    Shield,
    Key,
    Settings,
    Zap,
    Images,
    MapPin,
    Building2,
    CheckSquare,
    FileText,
    ClipboardList,
    Clock,
    History,
    BookOpen,
    LogIn,
    UserCircle,
    Type,
    ChevronDown,
    Sparkles,
    Tag,
    Calendar,
    ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Version information
const versions = [
    {
        version: "1.0.0",
        label: "v1.0.0",
        releaseDate: "2024-01-15",
        status: "current",
        isLatest: true,
    },
    {
        version: "0.9.0",
        label: "v0.9.0",
        releaseDate: "2023-12-10",
        status: "stable",
        isLatest: false,
    },
    {
        version: "0.8.0",
        label: "v0.8.0",
        releaseDate: "2023-11-05",
        status: "stable",
        isLatest: false,
    },
];

// Release notes for the latest version
const releaseNotes = [
    {
        version: "1.0.0",
        date: "2024-01-15",
        highlights: [
            {
                type: "feature",
                title: "Enhanced Documentation System",
                description: "Complete documentation overhaul with improved navigation and search",
            },
            {
                type: "feature",
                title: "Version Management",
                description: "Version selector and release notes for better documentation tracking",
            },
            {
                type: "improvement",
                title: "Improved Sidebar Navigation",
                description: "Better organisation and collapsible sections for easier navigation",
            },
        ],
    },
    {
        version: "0.9.0",
        date: "2023-12-10",
        highlights: [
            {
                type: "feature",
                title: "Custom Fields Management",
                description: "Added comprehensive custom fields setup and management",
            },
            {
                type: "improvement",
                title: "Task Management Enhancements",
                description: "Improved task creation, assignment, and tracking workflows",
            },
        ],
    },
];

const documentationCategories = [
    {
        title: "Getting Started",
        icon: BookOpen,
        features: [
            {
                title: "Dashboard",
                href: "/docs/dashboard",
                icon: LayoutDashboard,
            },
            {
                title: "Authentication",
                href: "/docs/authentication",
                icon: LogIn,
            },
            {
                title: "Profile Management",
                href: "/docs/profile",
                icon: UserCircle,
            },
            {
                title: "User Preferences",
                href: "/docs/user-preferences",
                icon: Settings,
            },
        ],
    },
    {
        title: "Core Features",
        icon: CheckSquare,
        features: [
            {
                title: "My Tasks",
                href: "/docs/my-tasks",
                icon: ClipboardList,
            },
            {
                title: "Check In/Out",
                href: "/docs/clock-in-out",
                icon: Clock,
            },
            {
                title: "Clock History",
                href: "/docs/clock-history",
                icon: History,
            },
        ],
    },
    {
        title: "Task & Form Management",
        icon: FileText,
        features: [
            {
                title: "Tasks Management",
                href: "/docs/tasks",
                icon: CheckSquare,
            },
            {
                title: "Task Types",
                href: "/docs/task-types",
                icon: Type,
            },
            {
                title: "Forms Management",
                href: "/docs/forms",
                icon: FileText,
            },
        ],
    },
    {
        title: "People & Access",
        icon: Users,
        features: [
            {
                title: "Invitations",
                href: "/docs/invitations",
                icon: UserPlus,
            },
            {
                title: "Employee Management",
                href: "/docs/employee-management",
                icon: Users,
            },
            {
                title: "Role Management",
                href: "/docs/role-management",
                icon: Shield,
            },
            {
                title: "Permissions Management",
                href: "/docs/permissions-management",
                icon: Key,
            },
        ],
    },
    {
        title: "Organisation",
        icon: Building2,
        features: [
            {
                title: "Locations",
                href: "/docs/locations",
                icon: MapPin,
            },
            {
                title: "Assets",
                href: "/docs/assets",
                icon: Images,
            },
            {
                title: "Departments",
                href: "/docs/departments",
                icon: Building2,
            },
        ],
    },
    {
        title: "Settings",
        icon: Settings,
        features: [
            {
                title: "Active People",
                href: "/docs/active-clocks",
                icon: Clock,
            },
            {
                title: "Configuration",
                href: "/docs/configuration",
                icon: Settings,
            },
            {
                title: "Audit Logs",
                href: "/docs/audit-logs",
                icon: FileText,
            },
        ],
    },
    {
        title: "Custom Fields",
        icon: Zap,
        features: [
            {
                title: "Custom Fields Setup",
                href: "/docs/custom-fields-setup",
                icon: Zap,
            },
            {
                title: "Custom Fields Management",
                href: "/docs/custom-fields-management",
                icon: Settings,
            },
        ],
    },
];

function CollapsibleMenuItem({ title, icon: Icon, items, pathname }) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const isActive = items.some((item) => pathname === item.href);

    return (
        <Collapsible defaultOpen={isActive} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={title} isActive={isActive}>
                        <Icon className="h-4 w-4" />
                        <span>{title}</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {items.map((item) => {
                            const ItemIcon = item.icon;
                            const isItemActive = pathname === item.href;
                            return (
                                <SidebarMenuSubItem key={item.title}>
                                    <SidebarMenuSubButton asChild isActive={isItemActive}>
                                        <Link href={item.href} className="flex items-center gap-2">
                                            <ItemIcon className="h-4 w-4" />
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

export default function DocsLayout({ children }) {
    const pathname = usePathname();
    const isHomePage = pathname === "/docs";
    const [selectedVersion, setSelectedVersion] = useState(versions[0].version);
    const currentVersion = versions.find((v) => v.version === selectedVersion) || versions[0];
    const currentReleaseNotes = releaseNotes.find((r) => r.version === selectedVersion);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar collapsible="icon" className="border-r">
                    <SidebarHeader className="border-b">
                        <div className="flex items-center gap-2 px-2 py-3 group-data-[collapsible=icon]:justify-center">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary">
                                <BookOpen className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                                <span className="text-sm font-semibold">Documentation</span>
                                <span className="text-xs text-muted-foreground">Melode Platform</span>
                            </div>
                        </div>

                        {/* Version Selector */}
                        <div className="px-2 pb-3 group-data-[collapsible=icon]:hidden">
                            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                                <SelectTrigger className="h-8 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-3 w-3" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {versions.map((version) => (
                                        <SelectItem key={version.version} value={version.version}>
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span>{version.label}</span>
                                                {version.isLatest && (
                                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                        Latest
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {currentVersion && (
                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Released {new Date(currentVersion.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            )}
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        {/* What's New Section */}
                        {currentReleaseNotes && currentVersion.isLatest && (
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <div className="px-2 py-2">
                                        <Link
                                            href="/docs/release-notes"
                                            className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors group"
                                        >
                                            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-primary">What's New</span>
                                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                        {currentVersion.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {currentReleaseNotes.highlights[0]?.title || "Latest updates and improvements"}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </Link>
                                    </div>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}

                        <SidebarGroup>
                            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Documentation Home"
                                            isActive={isHomePage}
                                        >
                                            <Link href="/docs" className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                <span>Home</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {documentationCategories.map((category) => {
                                        const Icon = category.icon;
                                        return (
                                            <CollapsibleMenuItem
                                                key={category.title}
                                                title={category.title}
                                                icon={Icon}
                                                items={category.features}
                                                pathname={pathname}
                                            />
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Release Notes Link */}
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Release Notes">
                                            <Link href="/docs/release-notes" className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" />
                                                <span>Release Notes</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t p-2">
                        <div className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span>Version</span>
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {currentVersion.label}
                                </Badge>
                            </div>
                            <div className="text-[10px]">
                                Last updated {new Date(currentVersion.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>

                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <SidebarTrigger className="-ml-1" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-semibold">Documentation</h1>
                                <Badge variant="outline" className="text-xs">
                                    {currentVersion.label}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto">
                        <div className="container mx-auto py-8 px-4 max-w-4xl">
                            {children}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  X,
} from "lucide-react";

const documentationCategories = [
  {
    title: "Getting Started",
    description: "Learn the basics of using Melode",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    features: [
      {
        title: "Dashboard",
        description: "Overview of your workspace and key metrics",
        href: "/docs/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Authentication",
        description: "Login, signup, password recovery, and role selection",
        href: "/docs/authentication",
        icon: LogIn,
      },
      {
        title: "Profile Management",
        description: "Manage your personal profile and account settings",
        href: "/docs/profile",
        icon: UserCircle,
      },
    ],
  },
  {
    title: "Core Features",
    description: "Essential features for daily operations",
    icon: CheckSquare,
    color: "text-green-600 dark:text-green-400",
    features: [
      {
        title: "My Tasks",
        description: "View and manage your assigned tasks",
        href: "/docs/my-tasks",
        icon: ClipboardList,
      },
      {
        title: "Check In/Out",
        description: "Track your work hours and attendance",
        href: "/docs/clock-in-out",
        icon: Clock,
      },
      {
        title: "Clock History",
        description: "View your check in/out history and records",
        href: "/docs/clock-history",
        icon: History,
      },
    ],
  },
  {
    title: "Task & Form Management",
    description: "Create and manage tasks and forms",
    icon: FileText,
    color: "text-purple-600 dark:text-purple-400",
    features: [
      {
        title: "Tasks Management",
        description: "Create, assign, and track tasks across your organisation",
        href: "/docs/tasks",
        icon: CheckSquare,
      },
      {
        title: "Task Types",
        description: "Configure and manage different types of tasks",
        href: "/docs/task-types",
        icon: Settings,
      },
      {
        title: "Forms Management",
        description: "Create, manage, and submit custom forms",
        href: "/docs/forms",
        icon: FileText,
      },
    ],
  },
  {
    title: "People & Access Management",
    description: "Manage users, roles, and permissions",
    icon: Users,
    color: "text-orange-600 dark:text-orange-400",
    features: [
      {
        title: "Invitations",
        description: "Invite new users to join your organisation",
        href: "/docs/invitations",
        icon: UserPlus,
      },
      {
        title: "Employee Management",
        description: "Manage employee information and assignments",
        href: "/docs/employee-management",
        icon: Users,
      },
      {
        title: "Role Management",
        description: "Create and manage roles within your organisation",
        href: "/docs/role-management",
        icon: Shield,
      },
      {
        title: "Permissions Management",
        description: "Configure and manage user permissions",
        href: "/docs/permissions-management",
        icon: Key,
      },
    ],
  },
  {
    title: "Organisation Management",
    description: "Manage organisational structure and resources",
    icon: Building2,
    color: "text-indigo-600 dark:text-indigo-400",
    features: [
      {
        title: "Locations",
        description: "Manage physical locations and sites",
        href: "/docs/locations",
        icon: MapPin,
      },
      {
        title: "Assets",
        description: "Track and manage organisational assets",
        href: "/docs/assets",
        icon: Images,
      },
      {
        title: "Departments",
        description: "Organize your company into departments",
        href: "/docs/departments",
        icon: Building2,
      },
    ],
  },
  {
    title: "Settings & Configuration",
    description: "System settings and administrative tools",
    icon: Settings,
    color: "text-gray-600 dark:text-gray-400",
    features: [
      {
        title: "Active People",
        description: "Monitor active check-in sessions across the organisation",
        href: "/docs/active-clocks",
        icon: Clock,
      },
      {
        title: "Configuration",
        description: "System-wide configuration and settings",
        href: "/docs/configuration",
        icon: Settings,
      },
      {
        title: "Audit Logs",
        description: "View system activity and audit trails",
        href: "/docs/audit-logs",
        icon: FileText,
      },
    ],
  },
  {
    title: "Custom Fields",
    description: "Extend functionality with custom fields",
    icon: Zap,
    color: "text-yellow-600 dark:text-yellow-400",
    features: [
      {
        title: "Custom Fields Setup",
        description: "Quick setup guide for custom fields",
        href: "/docs/custom-fields-setup",
        icon: Zap,
      },
      {
        title: "Custom Fields Management",
        description: "Manage and configure custom fields",
        href: "/docs/custom-fields-management",
        icon: Settings,
      },
    ],
  },
];

export default function DocumentationPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  // Check for search query in URL
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // Flatten all documentation items for search
  const allDocsItems = useMemo(() => {
    const items = [];
    documentationCategories.forEach((category) => {
      // Add category itself
      items.push({
        type: "category",
        title: category.title,
        description: category.description,
        href: null,
        category: category.title,
        icon: category.icon,
        color: category.color,
      });

      // Add all features in the category
      category.features.forEach((feature) => {
        items.push({
          type: "feature",
          title: feature.title,
          description: feature.description,
          href: feature.href,
          category: category.title,
          icon: feature.icon,
          color: category.color,
        });
      });
    });
    return items;
  }, []);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return null; // Return null to show all categories normally
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return allDocsItems.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(searchLower);
      const descriptionMatch = item.description.toLowerCase().includes(searchLower);
      const categoryMatch = item.category.toLowerCase().includes(searchLower);
      return titleMatch || descriptionMatch || categoryMatch;
    });
  }, [searchTerm, allDocsItems]);

  // Group filtered results by category
  const groupedResults = useMemo(() => {
    if (!filteredItems) return null;

    const grouped = {};
    filteredItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = {
          category: documentationCategories.find((cat) => cat.title === item.category),
          items: [],
        };
      }
      grouped[item.category].items.push(item);
    });
    return Object.values(grouped);
  }, [filteredItems]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Comprehensive guides for all Melode features and functionality
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 h-12 text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results or All Categories */}
      {filteredItems && filteredItems.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching with different keywords or browse the categories below.
            </p>
          </div>
        </Card>
      ) : groupedResults ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} for "{searchTerm}"
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupedResults.map((group) => {
              const Icon = group.category.icon;
              return (
                <Card key={group.category.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`h-6 w-6 ${group.category.color}`} />
                      <CardTitle className="text-xl">{group.category.title}</CardTitle>
                    </div>
                    <CardDescription>{group.category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const FeatureIcon = item.icon;
                        if (item.type === "category") {
                          return (
                            <div
                              key={item.title}
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                            >
                              <FeatureIcon className={`h-5 w-5 ${item.color} mt-0.5`} />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm">{item.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={item.title}
                            href={item.href}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                          >
                            <FeatureIcon className="h-5 w-5 text-muted-foreground mt-0.5 group-hover:text-foreground transition-colors" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documentationCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`h-6 w-6 ${category.color}`} />
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.features.map((feature) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <Link
                          key={feature.title}
                          href={feature.href}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <FeatureIcon className="h-5 w-5 text-muted-foreground mt-0.5 group-hover:text-foreground transition-colors" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {feature.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {feature.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


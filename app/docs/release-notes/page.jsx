"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Calendar, Tag, ArrowRight, CheckCircle, Zap, AlertCircle, Shield } from "lucide-react";

const releaseNotes = [
    {
        version: "1.0.0",
        date: "2024-01-15",
        status: "current",
        isLatest: true,
        highlights: [
            {
                type: "feature",
                title: "Enhanced Documentation System",
                description: "Complete documentation overhaul with improved navigation, versioning, and release notes tracking. New sidebar with collapsible sections and better organisation.",
                icon: Sparkles,
            },
            {
                type: "feature",
                title: "Version Management",
                description: "Version selector and release notes for better documentation tracking. Users can now view documentation for different versions and see what's new in each release.",
                icon: Tag,
            },
            {
                type: "improvement",
                title: "Improved Sidebar Navigation",
                description: "Better organisation with collapsible sections, active page highlighting, and visual indicators for easier navigation throughout the documentation.",
                icon: ArrowRight,
            },
            {
                type: "improvement",
                title: "Release Notes Integration",
                description: "Dedicated release notes page showing all version updates, new features, improvements, and bug fixes in an organized, easy-to-read format.",
                icon: CheckCircle,
            },
        ],
    },
    {
        version: "0.9.0",
        date: "2023-12-10",
        status: "stable",
        isLatest: false,
        highlights: [
            {
                type: "feature",
                title: "Custom Fields Management",
                description: "Added comprehensive custom fields setup and management system. Users can now create, configure, and manage custom fields for various entities.",
                icon: Zap,
            },
            {
                type: "improvement",
                title: "Task Management Enhancements",
                description: "Improved task creation, assignment, and tracking workflows. Better filtering, sorting, and status management capabilities.",
                icon: CheckCircle,
            },
            {
                type: "improvement",
                title: "Form Builder Improvements",
                description: "Enhanced form builder with more field types, better validation options, and improved submission management.",
                icon: CheckCircle,
            },
        ],
    },
    {
        version: "0.8.0",
        date: "2023-11-05",
        status: "stable",
        isLatest: false,
        highlights: [
            {
                type: "feature",
                title: "Check In/Out System",
                description: "New time tracking system with check in/out functionality, location tracking, and comprehensive history views.",
                icon: CheckCircle,
            },
            {
                type: "feature",
                title: "Asset Management",
                description: "Complete asset tracking system for managing organisational equipment, vehicles, and resources.",
                icon: CheckCircle,
            },
            {
                type: "improvement",
                title: "Role-Based Access Control",
                description: "Enhanced permission system with more granular controls and better role management capabilities.",
                icon: Shield,
            },
        ],
    },
];

const getTypeColor = (type) => {
    switch (type) {
        case "feature":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "improvement":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "bugfix":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        case "breaking":
            return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
};

const getTypeLabel = (type) => {
    switch (type) {
        case "feature":
            return "New Feature";
        case "improvement":
            return "Improvement";
        case "bugfix":
            return "Bug Fix";
        case "breaking":
            return "Breaking Change";
        default:
            return type;
    }
};

export default function ReleaseNotesPage() {
    return (
        <>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold">Release Notes</h1>
                        <p className="text-lg text-muted-foreground mt-1">
                            Stay updated with the latest features, improvements, and changes
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {releaseNotes.map((release, index) => {
                    const ReleaseIcon = release.isLatest ? Sparkles : Tag;
                    return (
                        <Card key={release.version} className="relative">
                            {release.isLatest && (
                                <div className="absolute -top-3 -right-3">
                                    <Badge className="bg-primary text-primary-foreground">
                                        Latest
                                    </Badge>
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <ReleaseIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                Version {release.version}
                                                {release.isLatest && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Current
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Calendar className="h-4 w-4" />
                                                Released on {new Date(release.date).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {release.highlights.map((highlight, highlightIndex) => {
                                        const HighlightIcon = highlight.icon || CheckCircle;
                                        return (
                                            <div
                                                key={highlightIndex}
                                                className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                        <HighlightIcon className="h-4 w-4 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h3 className="font-semibold text-sm">{highlight.title}</h3>
                                                        <Badge
                                                            className={`text-xs ${getTypeColor(highlight.type)}`}
                                                        >
                                                            {getTypeLabel(highlight.type)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {highlight.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="mt-8 border-dashed">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                            Want to see what's coming next?
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Check back regularly for updates on upcoming features and improvements.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}


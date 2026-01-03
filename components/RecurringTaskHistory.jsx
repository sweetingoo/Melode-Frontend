"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { useRecurringTaskHistory } from "@/hooks/useTasks";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const RecurringTaskHistory = ({ taskSlug, taskId, onClose, isOpen }) => {
    // Support both slug and id for backward compatibility
    const identifier = taskSlug || taskId;
    const { data: history, isLoading, error } = useRecurringTaskHistory(
        identifier,
        {
            enabled: isOpen && !!identifier,
        }
    );

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return "bg-green-500/10 text-green-600 border-green-500/20";
            case "in_progress":
                return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "cancelled":
                return "bg-gray-500/10 text-gray-600 border-gray-500/20";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const getStatusIcon = (status, isOverdue) => {
        if (isOverdue) {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        }
        switch (status?.toLowerCase()) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "in_progress":
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-600" />;
            default:
                return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Recurring Task History</DialogTitle>
                    <DialogDescription>
                        View all occurrences of this recurring task
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="py-12 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Failed to load task history. Please try again.
                        </p>
                    </div>
                ) : !history ? (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">No history available</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Occurrences
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {history.total_occurrences || 0}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Completed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {history.completed_count || 0}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Pending
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {history.pending_count || 0}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Overdue
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        {history.overdue_count || 0}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Occurrences Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Occurrences</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!history.occurrences || history.occurrences.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No occurrences found
                                    </p>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Due Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Completed At</TableHead>
                                                    <TableHead>Assigned To</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {history.occurrences
                                                    .sort((a, b) => {
                                                        const dateA = a.due_date
                                                            ? new Date(a.due_date)
                                                            : new Date(0);
                                                        const dateB = b.due_date
                                                            ? new Date(b.due_date)
                                                            : new Date(0);
                                                        return dateA - dateB;
                                                    })
                                                    .map((occurrence) => (
                                                        <TableRow
                                                            key={occurrence.id}
                                                            className={
                                                                occurrence.is_overdue
                                                                    ? "bg-red-50 dark:bg-red-950/20"
                                                                    : ""
                                                            }
                                                        >
                                                            <TableCell>
                                                                {occurrence.due_date
                                                                    ? format(
                                                                        new Date(occurrence.due_date),
                                                                        "MMM dd, yyyy HH:mm"
                                                                    )
                                                                    : "N/A"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {getStatusIcon(
                                                                        occurrence.status,
                                                                        occurrence.is_overdue
                                                                    )}
                                                                    <Badge
                                                                        className={getStatusColor(occurrence.status)}
                                                                    >
                                                                        {occurrence.status || "N/A"}
                                                                    </Badge>
                                                                    {occurrence.is_overdue && (
                                                                        <Badge variant="destructive">
                                                                            Overdue
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {occurrence.completed_at
                                                                    ? format(
                                                                        new Date(occurrence.completed_at),
                                                                        "MMM dd, yyyy HH:mm"
                                                                    )
                                                                    : "—"}
                                                            </TableCell>
                                                            <TableCell>
                                                                {occurrence.assigned_user_ids?.length > 0 ? (
                                                                    <span className="text-sm">
                                                                        {occurrence.assigned_user_ids.length} User(s)
                                                                    </span>
                                                                ) : occurrence.assignee_display ? (
                                                                    <span className="text-sm">
                                                                        {occurrence.assignee_display}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">
                                                                        Unassigned
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Link href={`/admin/tasks/${occurrence.id}`}>
                                                                    <Button variant="ghost" size="sm">
                                                                        View
                                                                    </Button>
                                                                </Link>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RecurringTaskHistory;


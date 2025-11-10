"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEmployeeAssignments } from "@/hooks/useAssignments";
import { Loader2, Edit, Trash2, Plus, Building2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ViewEmployeeAssignmentsModal = ({
  isOpen,
  onClose,
  employeeId,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const { data: assignmentsData, isLoading, error } = useEmployeeAssignments(
    employeeId
  );

  const assignments = assignmentsData || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Assignments
          </DialogTitle>
          <DialogDescription>
            View and manage all department assignments for this employee.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-500">
                Failed to load assignments. Please try again.
              </p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                This employee is not assigned to any departments yet.
              </p>
              <Button onClick={onAddNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Assign to Department
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.department?.name || "Unknown"}
                        {assignment.department?.code && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({assignment.department.code})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assignment.role?.display_name ||
                            assignment.role?.name ||
                            assignment.role?.role_name ||
                            "No Role"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.start_date
                          ? format(new Date(assignment.start_date), "MMM dd, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {assignment.end_date
                          ? format(new Date(assignment.end_date), "MMM dd, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {assignment.is_active !== false ? (
                          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEdit(assignment)}
                            title="Edit assignment"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Remove assignment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Assignment?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this employee
                                  from{" "}
                                  <strong>
                                    {assignment.department?.name || "this department"}
                                  </strong>
                                  ? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(assignment)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {assignments.length > 0 && (
            <Button onClick={onAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Assign to Another Department
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEmployeeAssignmentsModal;


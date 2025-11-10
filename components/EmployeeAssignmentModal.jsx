"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAssignment, useUpdateAssignment, useAssignment } from "@/hooks/useAssignments";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useRoles";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const EmployeeAssignmentModal = ({
  isOpen,
  onClose,
  employeeId = null,
  departmentId = null,
  assignmentId = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    employee_id: employeeId?.toString() || "",
    department_id: departmentId?.toString() || "",
    role_id: "",
    start_date: null,
    end_date: null,
    notes: "",
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState({});

  const { data: departmentsResponse } = useDepartments();
  const { data: employeesResponse } = useEmployees();
  const { data: rolesData } = useRoles();
  const { data: assignmentData } = useAssignment(assignmentId);
  const createAssignmentMutation = useCreateAssignment();
  const updateAssignmentMutation = useUpdateAssignment();

  const departments = departmentsResponse?.departments || departmentsResponse?.data || [];
  const employees = employeesResponse?.employees || employeesResponse?.data || [];
  const roles = rolesData || [];

  useEffect(() => {
    if (isOpen) {
      if (assignmentId && assignmentData) {
        // Load existing assignment data for editing
        setFormData({
          employee_id: assignmentData.employee_id?.toString() || employeeId?.toString() || "",
          department_id: assignmentData.department_id?.toString() || departmentId?.toString() || "",
          role_id: assignmentData.role_id?.toString() || "",
          start_date: assignmentData.start_date ? new Date(assignmentData.start_date) : null,
          end_date: assignmentData.end_date ? new Date(assignmentData.end_date) : null,
          notes: assignmentData.notes || "",
          is_active: assignmentData.is_active !== undefined ? assignmentData.is_active : true,
        });
      } else {
        // New assignment
        setFormData({
          employee_id: employeeId?.toString() || "",
          department_id: departmentId?.toString() || "",
          role_id: "",
          start_date: null,
          end_date: null,
          notes: "",
          is_active: true,
        });
      }
      setValidationErrors({});
    }
  }, [isOpen, employeeId, departmentId, assignmentId, assignmentData]);

  const validateForm = () => {
    const errors = {};

    if (!formData.employee_id) {
      errors.employee_id = "Employee selection is required";
    }

    if (!formData.department_id) {
      errors.department_id = "Department selection is required";
    }

    if (!formData.role_id) {
      errors.role_id = "Role is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const assignmentData = {
      employee_id: parseInt(formData.employee_id),
      department_id: parseInt(formData.department_id),
      role_id: parseInt(formData.role_id),
      ...(formData.start_date && {
        start_date: formData.start_date.toISOString(),
      }),
      ...(formData.end_date && {
        end_date: formData.end_date.toISOString(),
      }),
      ...(formData.notes?.trim() && {
        notes: formData.notes.trim(),
      }),
      is_active: formData.is_active,
    };

    if (assignmentId) {
      // Update existing assignment - don't include employee_id or department_id per API docs
      const updateData = {
        role_id: parseInt(formData.role_id),
        ...(formData.start_date && {
          start_date: formData.start_date.toISOString(),
        }),
        ...(formData.end_date && {
          end_date: formData.end_date.toISOString(),
        }),
        ...(formData.notes?.trim() && {
          notes: formData.notes.trim(),
        }),
        is_active: formData.is_active,
      };
      updateAssignmentMutation.mutate(
        { id: assignmentId, assignmentData: updateData },
        {
          onSuccess: () => {
            toast.success("Assignment updated successfully");
            onClose();
            if (onSuccess) onSuccess();
          },
          onError: (error) => {
            if (error.response?.status === 422 || error.response?.status === 400) {
              const errorData = error.response.data;
              const newValidationErrors = {};

              if (errorData?.detail && Array.isArray(errorData.detail)) {
                errorData.detail.forEach((errorItem) => {
                  if (errorItem.loc && errorItem.loc.length > 1) {
                    const fieldName = errorItem.loc[1];
                    newValidationErrors[fieldName] = errorItem.msg;
                  }
                });
              } else if (errorData?.errors) {
                Object.assign(newValidationErrors, errorData.errors);
              } else if (errorData?.message) {
                newValidationErrors._general = errorData.message;
              }

              if (Object.keys(newValidationErrors).length > 0) {
                setValidationErrors(newValidationErrors);
              }
            }
          },
        }
      );
    } else {
      // Create new assignment
      createAssignmentMutation.mutate(assignmentData, {
        onSuccess: () => {
          toast.success("Assignment created successfully");
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          if (error.response?.status === 422 || error.response?.status === 400) {
            const errorData = error.response.data;
            const newValidationErrors = {};

            if (errorData?.detail && Array.isArray(errorData.detail)) {
              errorData.detail.forEach((errorItem) => {
                if (errorItem.loc && errorItem.loc.length > 1) {
                  const fieldName = errorItem.loc[1];
                  newValidationErrors[fieldName] = errorItem.msg;
                }
              });
            } else if (errorData?.errors) {
              Object.assign(newValidationErrors, errorData.errors);
            } else if (errorData?.message) {
              newValidationErrors._general = errorData.message;
            }

            if (Object.keys(newValidationErrors).length > 0) {
              setValidationErrors(newValidationErrors);
            }
          }
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {assignmentId ? "Edit Assignment" : "Assign Employee to Department"}
          </DialogTitle>
          <DialogDescription>
            {assignmentId
              ? "Update the employee's department assignment."
              : "Assign an employee to a department with a specific role."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!employeeId && (
            <div className="space-y-2">
              <Label htmlFor="employee_id">
                Employee <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, employee_id: value })
                }
              >
                <SelectTrigger
                  className={
                    validationErrors.employee_id ? "border-red-500" : ""
                  }
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="no-employees" disabled>
                      No employees available
                    </SelectItem>
                  ) : (
                    employees.map((employee) => {
                      const employeeName = employee.user
                        ? `${employee.user.first_name || ""} ${employee.user.last_name || ""}`.trim() ||
                          employee.user.email ||
                          "Unknown"
                        : "Unknown";
                      return (
                        <SelectItem
                          key={employee.id}
                          value={employee.id.toString()}
                        >
                          {employeeName} ({employee.employee_id})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {validationErrors.employee_id && (
                <p className="text-sm text-red-500">
                  {validationErrors.employee_id}
                </p>
              )}
            </div>
          )}
          {!departmentId && (
            <div className="space-y-2">
              <Label htmlFor="department_id">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, department_id: value })
                }
              >
                <SelectTrigger
                  className={
                    validationErrors.department_id ? "border-red-500" : ""
                  }
                >
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 ? (
                    <SelectItem value="no-departments" disabled>
                      No departments available
                    </SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {validationErrors.department_id && (
                <p className="text-sm text-red-500">
                  {validationErrors.department_id}
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role_id">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) =>
                setFormData({ ...formData, role_id: value })
              }
            >
              <SelectTrigger
                className={validationErrors.role_id ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.length === 0 ? (
                  <SelectItem value="no-roles" disabled>
                    No roles available
                  </SelectItem>
                ) : (
                  roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.display_name || role.name || role.role_name || `Role ${role.id}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {validationErrors.role_id && (
              <p className="text-sm text-red-500">{validationErrors.role_id}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    {formData.start_date ? (
                      format(formData.start_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) =>
                      setFormData({ ...formData, start_date: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    {formData.end_date ? (
                      format(formData.end_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) =>
                      setFormData({ ...formData, end_date: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about the assignment..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active Status</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>
          {validationErrors._general && (
            <p className="text-sm text-red-500">
              {validationErrors._general}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createAssignmentMutation.isPending ||
              updateAssignmentMutation.isPending
            }
          >
            {(createAssignmentMutation.isPending ||
              updateAssignmentMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {assignmentId ? "Update Assignment" : "Create Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAssignmentModal;


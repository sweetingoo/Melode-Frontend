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
import { useCreateAssignment, useUpdateAssignment } from "@/hooks/useAssignments";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
    role: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  const { data: departmentsResponse } = useDepartments();
  const { data: employeesResponse } = useEmployees();
  const createAssignmentMutation = useCreateAssignment();
  const updateAssignmentMutation = useUpdateAssignment();

  const departments = departmentsResponse?.departments || departmentsResponse?.data || [];
  const employees = employeesResponse?.employees || employeesResponse?.data || [];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employee_id: employeeId?.toString() || "",
        department_id: departmentId?.toString() || "",
        role: "",
      });
      setValidationErrors({});
    }
  }, [isOpen, employeeId, departmentId]);

  const validateForm = () => {
    const errors = {};

    if (!formData.employee_id) {
      errors.employee_id = "Employee selection is required";
    }

    if (!formData.department_id) {
      errors.department_id = "Department selection is required";
    }

    if (!formData.role?.trim()) {
      errors.role = "Role is required";
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
      role: formData.role.trim(),
    };

    if (assignmentId) {
      // Update existing assignment
      updateAssignmentMutation.mutate(
        { id: assignmentId, assignmentData },
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
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger
                className={validationErrors.role ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                <SelectItem value="head">Head</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.role && (
              <p className="text-sm text-red-500">{validationErrors.role}</p>
            )}
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


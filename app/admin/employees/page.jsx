"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  Network,
  UserPlus,
} from "lucide-react";
import {
  useEmployees,
  useDeleteEmployee,
  useCreateEmployee,
  useUpdateEmployee,
} from "@/hooks/useEmployees";
import { useUsers, useCreateUser } from "@/hooks/useUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployeeAssignments, useDeleteAssignment } from "@/hooks/useAssignments";
import EmployeeAssignmentModal from "@/components/EmployeeAssignmentModal";
import ViewEmployeeAssignmentsModal from "@/components/ViewEmployeeAssignmentsModal";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EmployeesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isViewAssignmentsModalOpen, setIsViewAssignmentsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [userSelectionMode, setUserSelectionMode] = useState("existing"); // "existing" or "new"
  const [employeeFormData, setEmployeeFormData] = useState({
    user_id: "",
    employee_id: "",
    employee_number: "",
    hire_date: null,
    termination_date: null,
    job_title: "",
    manager_id: "",
    employment_status: "active",
    is_active: true,
  });
  const [userFormData, setUserFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    title: "",
    phone_number: "",
    password: "",
    bio: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const itemsPerPage = 10;

  // API hooks
  const { data: employeesResponse, isLoading, error, refetch } = useEmployees({
    page: currentPage,
    per_page: itemsPerPage,
    search: searchTerm || undefined,
    employment_status: statusFilter !== "all" ? statusFilter : undefined,
    department_id: departmentFilter !== "all" ? departmentFilter : undefined,
  });
  const { data: usersResponse } = useUsers();
  const { data: departmentsResponse } = useDepartments();
  const deleteEmployeeMutation = useDeleteEmployee();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const createUserMutation = useCreateUser();
  const deleteAssignmentMutation = useDeleteAssignment();

  const users = usersResponse?.users || [];
  const departments = departmentsResponse?.departments || departmentsResponse?.data || [];

  // Extract employees and pagination data from response
  const employees = employeesResponse?.employees || employeesResponse?.data || [];
  const pagination = {
    page: employeesResponse?.page || 1,
    per_page: employeesResponse?.per_page || itemsPerPage,
    total: employeesResponse?.total || 0,
    total_pages: employeesResponse?.total_pages || 1,
  };

  const totalPages = pagination.total_pages;

  // Filter employees based on search term (client-side fallback)
  const filteredEmployees = React.useMemo(() => {
    let filtered = employees;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employee_id?.toLowerCase().includes(searchLower) ||
          emp.employee_number?.toLowerCase().includes(searchLower) ||
          emp.job_title?.toLowerCase().includes(searchLower) ||
          emp.user?.first_name?.toLowerCase().includes(searchLower) ||
          emp.user?.last_name?.toLowerCase().includes(searchLower) ||
          emp.user?.email?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (emp) => emp.employment_status === statusFilter
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) =>
        emp.departments?.some((dept) => dept.id === parseInt(departmentFilter))
      );
    }

    return filtered;
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      await deleteEmployeeMutation.mutateAsync(employeeId);
      refetch();
    } catch (error) {
      console.error("Failed to delete employee:", error);
    }
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeFormData({
      user_id: employee.user_id?.toString() || "",
      employee_id: employee.employee_id || "",
      employee_number: employee.employee_number || "",
      hire_date: employee.hire_date ? new Date(employee.hire_date) : null,
      termination_date: employee.termination_date
        ? new Date(employee.termination_date)
        : null,
      job_title: employee.job_title || "",
      manager_id: employee.manager_id?.toString() || "",
      employment_status: employee.employment_status || "active",
      is_active: employee.is_active !== undefined ? employee.is_active : true,
    });
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setUserSelectionMode("existing");
    setEmployeeFormData({
      user_id: "",
      employee_id: "",
      employee_number: "",
      hire_date: null,
      termination_date: null,
      job_title: "",
      manager_id: "",
      employment_status: "active",
      is_active: true,
    });
    setUserFormData({
      email: "",
      username: "",
      first_name: "",
      last_name: "",
      title: "",
      phone_number: "",
      password: "",
      bio: "",
    });
    setValidationErrors({});
    setIsCreateModalOpen(true);
  };

  const validateEmployeeForm = () => {
    const errors = {};

    if (userSelectionMode === "existing") {
      if (!employeeFormData.user_id) {
        errors.user_id = "User selection is required";
      }
    } else {
      // Validate new user fields
      if (!userFormData.email) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) {
        errors.email = "Please enter a valid email address";
      }

      if (!userFormData.first_name) {
        errors.first_name = "First name is required";
      }

      if (!userFormData.last_name) {
        errors.last_name = "Last name is required";
      }

      if (!userFormData.password) {
        errors.password = "Password is required";
      } else if (userFormData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      if (
        userFormData.phone_number &&
        !/^\+?[\d\s-()]+$/.test(userFormData.phone_number)
      ) {
        errors.phone_number = "Please enter a valid phone number";
      }
    }

    // All employee fields are optional according to API documentation
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEmployee = () => {
    if (!validateEmployeeForm()) {
      return;
    }

    let employeeData;

    if (selectedEmployee) {
      // Update: Don't include user_id (not allowed in update per API docs)
      employeeData = {
        ...(employeeFormData.employee_id?.trim() && {
          employee_id: employeeFormData.employee_id.trim(),
        }),
        ...(employeeFormData.employee_number?.trim() && {
          employee_number: employeeFormData.employee_number.trim(),
        }),
        ...(employeeFormData.hire_date && {
          hire_date: employeeFormData.hire_date.toISOString(),
        }),
        ...(employeeFormData.termination_date && {
          termination_date: employeeFormData.termination_date.toISOString(),
        }),
        ...(employeeFormData.job_title?.trim() && {
          job_title: employeeFormData.job_title.trim(),
        }),
        ...(employeeFormData.manager_id && {
          manager_id: parseInt(employeeFormData.manager_id),
        }),
        employment_status: employeeFormData.employment_status,
        is_active: employeeFormData.is_active,
      };
    } else {
      // Create employee - handle both existing and new user modes
      if (userSelectionMode === "existing") {
        // Use existing user
        employeeData = {
          user_id: parseInt(employeeFormData.user_id),
          ...(employeeFormData.employee_id?.trim() && {
            employee_id: employeeFormData.employee_id.trim(),
          }),
          ...(employeeFormData.employee_number?.trim() && {
            employee_number: employeeFormData.employee_number.trim(),
          }),
          ...(employeeFormData.hire_date && {
            hire_date: employeeFormData.hire_date.toISOString(),
          }),
          ...(employeeFormData.termination_date && {
            termination_date: employeeFormData.termination_date.toISOString(),
          }),
          ...(employeeFormData.job_title?.trim() && {
            job_title: employeeFormData.job_title.trim(),
          }),
          ...(employeeFormData.manager_id && {
            manager_id: parseInt(employeeFormData.manager_id),
          }),
          employment_status: employeeFormData.employment_status,
          is_active: employeeFormData.is_active,
        };

        // Create employee with existing user
        createEmployeeMutation.mutate(employeeData, {
          onSuccess: () => {
            setIsCreateModalOpen(false);
            setEmployeeFormData({
              user_id: "",
              employee_id: "",
              employee_number: "",
              hire_date: null,
              termination_date: null,
              job_title: "",
              manager_id: "",
              employment_status: "active",
              is_active: true,
            });
            setUserFormData({
              email: "",
              username: "",
              first_name: "",
              last_name: "",
              title: "",
              phone_number: "",
              password: "",
              bio: "",
            });
            setUserSelectionMode("existing");
            setValidationErrors({});
            refetch();
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
      } else {
        // Create new user first, then create employee
        const userData = {
          email: userFormData.email,
          username: userFormData.username || undefined,
          first_name: userFormData.first_name,
          last_name: userFormData.last_name,
          title: userFormData.title || undefined,
          phone_number: userFormData.phone_number || undefined,
          password: userFormData.password,
          bio: userFormData.bio || undefined,
          send_invite: false, // Don't send invite when creating employee
        };

        createUserMutation.mutate(userData, {
          onSuccess: (newUser) => {
            // After user is created, create employee with the new user_id
            const employeeData = {
              user_id: newUser.id,
              ...(employeeFormData.employee_id?.trim() && {
                employee_id: employeeFormData.employee_id.trim(),
              }),
              ...(employeeFormData.employee_number?.trim() && {
                employee_number: employeeFormData.employee_number.trim(),
              }),
              ...(employeeFormData.hire_date && {
                hire_date: employeeFormData.hire_date.toISOString(),
              }),
              ...(employeeFormData.termination_date && {
                termination_date: employeeFormData.termination_date.toISOString(),
              }),
              ...(employeeFormData.job_title?.trim() && {
                job_title: employeeFormData.job_title.trim(),
              }),
              ...(employeeFormData.manager_id && {
                manager_id: parseInt(employeeFormData.manager_id),
              }),
              employment_status: employeeFormData.employment_status,
              is_active: employeeFormData.is_active,
            };

            createEmployeeMutation.mutate(employeeData, {
              onSuccess: () => {
                setIsCreateModalOpen(false);
                setEmployeeFormData({
                  user_id: "",
                  employee_id: "",
                  employee_number: "",
                  hire_date: null,
                  termination_date: null,
                  job_title: "",
                  manager_id: "",
                  employment_status: "active",
                  is_active: true,
                });
                setUserFormData({
                  email: "",
                  username: "",
                  first_name: "",
                  last_name: "",
                  title: "",
                  phone_number: "",
                  password: "",
                  bio: "",
                });
                setUserSelectionMode("existing");
                setValidationErrors({});
                refetch();
              },
              onError: (error) => {
                if (error.response?.status === 422 || error.response?.status === 400) {
                  const errorData = error.response.data;
                  const newValidationErrors = {};

                  // Handle detail as string (e.g., "User with email 'xxx' already exists")
                  if (errorData?.detail && typeof errorData.detail === "string") {
                    newValidationErrors._general = errorData.detail;
                    toast.error("Error", {
                      description: errorData.detail,
                    });
                  }
                  // Handle detail as array (validation errors)
                  else if (errorData?.detail && Array.isArray(errorData.detail)) {
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
                    toast.error("Error", {
                      description: errorData.message,
                    });
                  }

                  if (Object.keys(newValidationErrors).length > 0) {
                    setValidationErrors(newValidationErrors);
                  }
                } else {
                  toast.error("Error", {
                    description: error.response?.data?.message || error.response?.data?.detail || "An unexpected error occurred",
                  });
                }
              },
            });
          },
          onError: (error) => {
            if (error.response?.status === 422 || error.response?.status === 400) {
              const errorData = error.response.data;
              const newValidationErrors = {};

              // Handle detail as string (e.g., "User with email 'xxx' already exists")
              if (errorData?.detail && typeof errorData.detail === "string") {
                // Try to map to a field if it mentions email
                if (errorData.detail.toLowerCase().includes("email")) {
                  newValidationErrors.email = errorData.detail;
                } else {
                  newValidationErrors._general = errorData.detail;
                }
                // Also show toast for visibility
                toast.error("Error", {
                  description: errorData.detail,
                });
              }
              // Handle detail as array (validation errors)
              else if (errorData?.detail && Array.isArray(errorData.detail)) {
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
                toast.error("Error", {
                  description: errorData.message,
                });
              }

              if (Object.keys(newValidationErrors).length > 0) {
                setValidationErrors(newValidationErrors);
              }
            } else {
              toast.error("Error", {
                description: error.response?.data?.message || error.response?.data?.detail || "An unexpected error occurred",
              });
            }
          },
        });
      }
      return; // Exit early for create flow
    }

    if (selectedEmployee) {
      updateEmployeeMutation.mutate(
        { id: selectedEmployee.id, employeeData },
        {
          onSuccess: () => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
            setEmployeeFormData({
              user_id: "",
              employee_id: "",
              employee_number: "",
              hire_date: null,
              termination_date: null,
              job_title: "",
              manager_id: "",
              employment_status: "active",
              is_active: true,
            });
            setValidationErrors({});
            refetch();
          },
          onError: (error) => {
            if (error.response?.status === 422 || error.response?.status === 400) {
              const errorData = error.response.data;
              const newValidationErrors = {};

              // Handle detail as string (e.g., "User with email 'xxx' already exists")
              if (errorData?.detail && typeof errorData.detail === "string") {
                newValidationErrors._general = errorData.detail;
                toast.error("Error", {
                  description: errorData.detail,
                });
              }
              // Handle detail as array (validation errors)
              else if (errorData?.detail && Array.isArray(errorData.detail)) {
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
                toast.error("Error", {
                  description: errorData.message,
                });
              }

              if (Object.keys(newValidationErrors).length > 0) {
                setValidationErrors(newValidationErrors);
              }
            } else {
              toast.error("Error", {
                description: error.response?.data?.message || error.response?.data?.detail || "An unexpected error occurred",
              });
            }
          },
        }
      );
    } else {
      createEmployeeMutation.mutate(employeeData, {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          setEmployeeFormData({
            user_id: "",
            employee_id: "",
            employee_number: "",
            hire_date: null,
            termination_date: null,
            job_title: "",
            manager_id: "",
            employment_status: "active",
            is_active: true,
          });
          setValidationErrors({});
          refetch();
        },
        onError: (error) => {
          if (error.response?.status === 422 || error.response?.status === 400) {
            const errorData = error.response.data;
            const newValidationErrors = {};

            // Handle detail as string (e.g., "User with email 'xxx' already exists")
            if (errorData?.detail && typeof errorData.detail === "string") {
              newValidationErrors._general = errorData.detail;
              toast.error("Error", {
                description: errorData.detail,
              });
            }
            // Handle detail as array (validation errors)
            else if (errorData?.detail && Array.isArray(errorData.detail)) {
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
              toast.error("Error", {
                description: errorData.message,
              });
            }

            if (Object.keys(newValidationErrors).length > 0) {
              setValidationErrors(newValidationErrors);
            }
          } else {
            toast.error("Error", {
              description: error.response?.data?.message || error.response?.data?.detail || "An unexpected error occurred",
            });
          }
        },
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1">
              Manage employees and their information.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1">
              Manage employees and their information.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to load employees
              </h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the employee data. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    const currentApiPage = pagination.page;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentApiPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentApiPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentApiPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentApiPage - 1);
      const end = Math.min(totalPages - 1, currentApiPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentApiPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentApiPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentApiPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: "Active", className: "bg-green-500/10 text-green-600" },
      inactive: { label: "Inactive", className: "bg-red-500/10 text-red-600" },
      terminated: {
        label: "Terminated",
        className: "bg-gray-500/10 text-gray-600",
      },
      on_leave: {
        label: "On Leave",
        className: "bg-yellow-500/10 text-yellow-600",
      },
    };

    const statusInfo = statusMap[status] || statusMap.active;
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage employees and their information.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/employees/hierarchy">
            <Button variant="outline">
              <Network className="mr-2 h-4 w-4" />
              View Hierarchy
            </Button>
          </Link>
          <Button onClick={handleCreateEmployee}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search employees by name, ID, number, or job title..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first employee."}
              </p>
              {!searchTerm && statusFilter === "all" && departmentFilter === "all" && (
                <Button onClick={handleCreateEmployee}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Employee Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => {
                      const userName = employee.user
                        ? `${employee.user.first_name || ""} ${employee.user.last_name || ""}`.trim() ||
                        employee.user.email ||
                        "Unknown"
                        : "Unknown";
                      const departments = employee.departments || [];
                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.employee_id}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {employee.employee_number}
                            </code>
                          </TableCell>
                          <TableCell>{userName}</TableCell>
                          <TableCell>{employee.job_title || "—"}</TableCell>
                          <TableCell>
                            {departments.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {departments.slice(0, 2).map((dept) => (
                                  <Badge
                                    key={dept.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {dept.name}
                                  </Badge>
                                ))}
                                {departments.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{departments.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {employee.hire_date
                              ? format(new Date(employee.hire_date), "MMM dd, yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(employee.employment_status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEditEmployee(employee)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedEmployeeForAssignment(employee);
                                    setIsViewAssignmentsModalOpen(true);
                                  }}
                                >
                                  <Building2 className="mr-2 h-4 w-4" />
                                  View Departments
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedEmployeeForAssignment(employee);
                                    setSelectedAssignment(null);
                                    setIsAssignmentModalOpen(true);
                                  }}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Assign to Department
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the employee{" "}
                                        <strong>{employee.employee_id}</strong>. This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteEmployee(employee.id)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(1, pagination.page - 1))
                          }
                          className={
                            pagination.page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(totalPages, pagination.page + 1)
                            )
                          }
                          className={
                            pagination.page === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Employee Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Employee</DialogTitle>
            <DialogDescription>
              Add a new employee to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* User Selection Mode Toggle */}
            <div className="space-y-3">
              <Label>User Selection</Label>
              <RadioGroup
                value={userSelectionMode}
                onValueChange={setUserSelectionMode}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing-user" />
                  <Label htmlFor="existing-user" className="cursor-pointer">
                    Select Existing User
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new-user" />
                  <Label htmlFor="new-user" className="cursor-pointer">
                    Create New User
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Existing User Selection */}
            {userSelectionMode === "existing" && (
              <div className="space-y-2">
                <Label htmlFor="user_id">
                  User <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={employeeFormData.user_id}
                  onValueChange={(value) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      user_id: value,
                    })
                  }
                >
                  <SelectTrigger
                    className={validationErrors.user_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="no-users" disabled>
                        No users available
                      </SelectItem>
                    ) : (
                      users.map((user) => {
                        const fullName =
                          [user.first_name, user.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                          user.username ||
                          user.email ||
                          "User";
                        return (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {fullName} {user.email && `(${user.email})`}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.user_id && (
                  <p className="text-sm text-red-500">
                    {validationErrors.user_id}
                  </p>
                )}
              </div>
            )}

            {/* New User Form */}
            {userSelectionMode === "new" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="user_email"
                      type="email"
                      placeholder="user@example.com"
                      value={userFormData.email}
                      onChange={(e) => {
                        setUserFormData({ ...userFormData, email: e.target.value });
                        if (validationErrors.email) {
                          setValidationErrors({ ...validationErrors, email: "" });
                        }
                      }}
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_username">Username</Label>
                    <Input
                      id="user_username"
                      placeholder="username"
                      value={userFormData.username}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_first_name">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="user_first_name"
                      placeholder="John"
                      value={userFormData.first_name}
                      onChange={(e) => {
                        setUserFormData({
                          ...userFormData,
                          first_name: e.target.value,
                        });
                        if (validationErrors.first_name) {
                          setValidationErrors({
                            ...validationErrors,
                            first_name: "",
                          });
                        }
                      }}
                      className={
                        validationErrors.first_name ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.first_name && (
                      <p className="text-sm text-red-500">
                        {validationErrors.first_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_last_name">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="user_last_name"
                      placeholder="Doe"
                      value={userFormData.last_name}
                      onChange={(e) => {
                        setUserFormData({
                          ...userFormData,
                          last_name: e.target.value,
                        });
                        if (validationErrors.last_name) {
                          setValidationErrors({
                            ...validationErrors,
                            last_name: "",
                          });
                        }
                      }}
                      className={validationErrors.last_name ? "border-red-500" : ""}
                    />
                    {validationErrors.last_name && (
                      <p className="text-sm text-red-500">
                        {validationErrors.last_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_title">Title</Label>
                    <Select
                      value={userFormData.title}
                      onValueChange={(value) =>
                        setUserFormData({ ...userFormData, title: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Prof">Prof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_phone_number">Phone Number</Label>
                    <Input
                      id="user_phone_number"
                      type="tel"
                      placeholder="+44 20 7946 0958"
                      value={userFormData.phone_number}
                      onChange={(e) => {
                        setUserFormData({
                          ...userFormData,
                          phone_number: e.target.value,
                        });
                        if (validationErrors.phone_number) {
                          setValidationErrors({
                            ...validationErrors,
                            phone_number: "",
                          });
                        }
                      }}
                      className={
                        validationErrors.phone_number ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.phone_number && (
                      <p className="text-sm text-red-500">
                        {validationErrors.phone_number}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user_password"
                    type="password"
                    placeholder="Enter password"
                    value={userFormData.password}
                    onChange={(e) => {
                      setUserFormData({
                        ...userFormData,
                        password: e.target.value,
                      });
                      if (validationErrors.password) {
                        setValidationErrors({ ...validationErrors, password: "" });
                      }
                    }}
                    className={validationErrors.password ? "border-red-500" : ""}
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-red-500">
                      {validationErrors.password}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_bio">Bio</Label>
                  <Textarea
                    id="user_bio"
                    placeholder="Brief description about the user"
                    value={userFormData.bio}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, bio: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={employeeFormData.employee_id}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      employee_id: e.target.value,
                    })
                  }
                  placeholder="e.g., EMP001"
                  className={validationErrors.employee_id ? "border-red-500" : ""}
                />
                {validationErrors.employee_id && (
                  <p className="text-sm text-red-500">
                    {validationErrors.employee_id}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_number">Employee Number</Label>
                <Input
                  id="employee_number"
                  value={employeeFormData.employee_number}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      employee_number: e.target.value,
                    })
                  }
                  placeholder="e.g., 12345"
                  className={
                    validationErrors.employee_number ? "border-red-500" : ""
                  }
                />
                {validationErrors.employee_number && (
                  <p className="text-sm text-red-500">
                    {validationErrors.employee_number}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={employeeFormData.job_title}
                onChange={(e) =>
                  setEmployeeFormData({
                    ...employeeFormData,
                    job_title: e.target.value,
                  })
                }
                placeholder="e.g., Software Engineer"
                className={validationErrors.job_title ? "border-red-500" : ""}
              />
              {validationErrors.job_title && (
                <p className="text-sm text-red-500">
                  {validationErrors.job_title}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !employeeFormData.hire_date && "text-muted-foreground"
                      )}
                    >
                      {employeeFormData.hire_date ? (
                        format(employeeFormData.hire_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={employeeFormData.hire_date}
                      onSelect={(date) =>
                        setEmployeeFormData({
                          ...employeeFormData,
                          hire_date: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="termination_date">Termination Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !employeeFormData.termination_date && "text-muted-foreground"
                      )}
                    >
                      {employeeFormData.termination_date ? (
                        format(employeeFormData.termination_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={employeeFormData.termination_date}
                      onSelect={(date) =>
                        setEmployeeFormData({
                          ...employeeFormData,
                          termination_date: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employment_status">Employment Status</Label>
                <Select
                  value={employeeFormData.employment_status}
                  onValueChange={(value) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      employment_status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active Status</Label>
                <Switch
                  id="is_active"
                  checked={employeeFormData.is_active}
                  onCheckedChange={(checked) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      is_active: checked,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager_id">Manager</Label>
              <Select
                value={employeeFormData.manager_id || "__none__"}
                onValueChange={(value) =>
                  setEmployeeFormData({
                    ...employeeFormData,
                    manager_id: value === "__none__" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Manager</SelectItem>
                  {employees
                    .filter((emp) => emp.id !== selectedEmployee?.id)
                    .map((emp) => {
                      const empName = emp.user
                        ? `${emp.user.first_name || ""} ${emp.user.last_name || ""}`.trim() ||
                        emp.user.email ||
                        "Unknown"
                        : "Unknown";
                      return (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {empName} ({emp.employee_id})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            {validationErrors._general && (
              <p className="text-sm text-red-500">
                {validationErrors._general}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setValidationErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEmployee}
              disabled={createEmployeeMutation.isPending || createUserMutation.isPending}
            >
              {(createEmployeeMutation.isPending || createUserMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-user_id">
                User <span className="text-red-500">*</span>
              </Label>
              <Select
                value={employeeFormData.user_id}
                onValueChange={(value) =>
                  setEmployeeFormData({
                    ...employeeFormData,
                    user_id: value,
                  })
                }
              >
                <SelectTrigger
                  className={validationErrors.user_id ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => {
                    const fullName =
                      [user.first_name, user.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      user.username ||
                      user.email ||
                      "User";
                    return (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {fullName} {user.email && `(${user.email})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {validationErrors.user_id && (
                <p className="text-sm text-red-500">
                  {validationErrors.user_id}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-employee_id">Employee ID</Label>
                <Input
                  id="edit-employee_id"
                  value={employeeFormData.employee_id}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      employee_id: e.target.value,
                    })
                  }
                  placeholder="e.g., EMP001"
                  className={validationErrors.employee_id ? "border-red-500" : ""}
                />
                {validationErrors.employee_id && (
                  <p className="text-sm text-red-500">
                    {validationErrors.employee_id}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-employee_number">Employee Number</Label>
                <Input
                  id="edit-employee_number"
                  value={employeeFormData.employee_number}
                  onChange={(e) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      employee_number: e.target.value,
                    })
                  }
                  placeholder="e.g., 12345"
                  className={
                    validationErrors.employee_number ? "border-red-500" : ""
                  }
                />
                {validationErrors.employee_number && (
                  <p className="text-sm text-red-500">
                    {validationErrors.employee_number}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job_title">Job Title</Label>
              <Input
                id="edit-job_title"
                value={employeeFormData.job_title}
                onChange={(e) =>
                  setEmployeeFormData({
                    ...employeeFormData,
                    job_title: e.target.value,
                  })
                }
                placeholder="e.g., Software Engineer"
                className={validationErrors.job_title ? "border-red-500" : ""}
              />
              {validationErrors.job_title && (
                <p className="text-sm text-red-500">
                  {validationErrors.job_title}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hire_date">Hire Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !employeeFormData.hire_date && "text-muted-foreground"
                      )}
                    >
                      {employeeFormData.hire_date ? (
                        format(employeeFormData.hire_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={employeeFormData.hire_date}
                      onSelect={(date) =>
                        setEmployeeFormData({
                          ...employeeFormData,
                          hire_date: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-termination_date">Termination Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !employeeFormData.termination_date && "text-muted-foreground"
                      )}
                    >
                      {employeeFormData.termination_date ? (
                        format(employeeFormData.termination_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={employeeFormData.termination_date}
                      onSelect={(date) =>
                        setEmployeeFormData({
                          ...employeeFormData,
                          termination_date: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-employment_status">Employment Status</Label>
                <Select
                  value={employeeFormData.employment_status}
                  onValueChange={(value) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      employment_status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-is_active">Active Status</Label>
                <Switch
                  id="edit-is_active"
                  checked={employeeFormData.is_active}
                  onCheckedChange={(checked) =>
                    setEmployeeFormData({
                      ...employeeFormData,
                      is_active: checked,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager_id">Manager</Label>
              <Select
                value={employeeFormData.manager_id || "__none__"}
                onValueChange={(value) =>
                  setEmployeeFormData({
                    ...employeeFormData,
                    manager_id: value === "__none__" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Manager</SelectItem>
                  {employees
                    .filter((emp) => emp.id !== selectedEmployee?.id)
                    .map((emp) => {
                      const empName = emp.user
                        ? `${emp.user.first_name || ""} ${emp.user.last_name || ""}`.trim() ||
                        emp.user.email ||
                        "Unknown"
                        : "Unknown";
                      return (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {empName} ({emp.employee_id})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            {validationErrors._general && (
              <p className="text-sm text-red-500">
                {validationErrors._general}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
                setValidationErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEmployee}
              disabled={updateEmployeeMutation.isPending}
            >
              {updateEmployeeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <EmployeeAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setSelectedEmployeeForAssignment(null);
          setSelectedAssignment(null);
        }}
        employeeId={selectedEmployeeForAssignment?.id}
        assignmentId={selectedAssignment?.id}
        departmentId={selectedAssignment?.department_id}
        onSuccess={() => {
          refetch();
          // If we were viewing assignments, reopen that modal
          if (isViewAssignmentsModalOpen) {
            // Keep it open - the modal will refresh automatically
          }
        }}
      />

      {/* View Assignments Modal */}
      <ViewEmployeeAssignmentsModal
        isOpen={isViewAssignmentsModalOpen}
        onClose={() => {
          setIsViewAssignmentsModalOpen(false);
          setSelectedEmployeeForAssignment(null);
          setSelectedAssignment(null);
        }}
        employeeId={selectedEmployeeForAssignment?.id}
        onEdit={(assignment) => {
          setSelectedAssignment(assignment);
          setIsViewAssignmentsModalOpen(false);
          setIsAssignmentModalOpen(true);
        }}
        onDelete={(assignment) => {
          deleteAssignmentMutation.mutate(
            {
              employeeId: assignment.employee_id,
              departmentId: assignment.department_id,
            },
            {
              onSuccess: () => {
                refetch();
              },
            }
          );
        }}
        onAddNew={() => {
          setSelectedAssignment(null);
          setIsViewAssignmentsModalOpen(false);
          setIsAssignmentModalOpen(true);
        }}
      />
    </div>
  );
};

export default EmployeesPage;


"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  Shield,
  Eye,
  Check,
  Crown,
  Key,
  RefreshCw,
  Info,
  Leaf,
  Plus,
  X,
  Trash2,
  Search,
  AlertCircle,
  Building2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  ClipboardList,
  Edit,
  Camera,
  MessageSquare,
  FileText,
  CheckCircle,
} from "lucide-react";
import {
  useUser,
  useUpdateUser,
  useDeleteUser,
  useDeactivateUser,
  useActivateUser,
  useVerifyUser,
  useUserPermissions,
  useUserDirectPermissions,
  useUserRoles,
  useAssignDirectPermission,
  useRemoveDirectPermission,
  useResetUserPassword,
  userUtils,
} from "@/hooks/useUsers";
import { useRolesAll } from "@/hooks/useRoles";
import { usePermissionsAll } from "@/hooks/usePermissions";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import {
  useEmployeeAssignments,
  useCreateAssignment,
  useDeleteAssignment,
} from "@/hooks/useAssignments";
import { useDepartments } from "@/hooks/useDepartments";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hooks/useUsers";
import UserAuditLogs from "@/components/UserAuditLogs";
import { ComplianceSection } from "@/components/ComplianceSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithUrl } from "@/components/AvatarWithUrl";
import EntityCustomFieldsForm from "@/components/EntityCustomFieldsForm";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
import RichTextEditor from "@/components/RichTextEditor";
import { 
  useUserCustomFieldsHierarchy, 
  useUserCustomFields, 
  useBulkUpdateUserCustomFields,
  useUploadFile,
} from "@/hooks/useProfile";
import { useEntityCompliance, useComplianceHistory } from "@/hooks/useCompliance";
import { useCustomFieldValueHistory } from "@/hooks/useProfile";
import { ComplianceHistory } from "@/components/ComplianceHistory";
import { cn } from "@/lib/utils";
import { HolidayBalanceCard } from "@/components/attendance/HolidayBalanceCard";
import { ShiftRecordList } from "@/components/attendance/ShiftRecordList";
import { LeaveRequestList } from "@/components/attendance/LeaveRequestList";
import { EmployeeSettingsForm } from "@/components/attendance/EmployeeSettingsForm";
import { HolidayEntitlementForm } from "@/components/attendance/HolidayEntitlementForm";
import {
  useEmployeeSettings,
  useContractTypes,
  useHolidayEntitlements,
  useHolidayYears,
  useRecalculateHolidayEntitlementHours,
  useLeaveApproverDepartments,
  useSetLeaveApproverDepartments,
} from "@/hooks/useAttendance";
import { filesService } from "@/services/files";
import { useDocuments, useCreateDocument } from "@/hooks/useDocuments";
import {
  useCreateDocumentCategory,
  useDeleteDocumentCategory,
  useDocumentCategories,
} from "@/hooks/useDocumentCategories";
import { useTasksByUser } from "@/hooks/useTasks";
import { Calendar } from "@/components/ui/calendar";
import CommentThread from "@/components/CommentThread";
import { api } from "@/services/api-client";

const TasksForUser = ({ userSlug }) => {
  const [statusFilter, setStatusFilter] = React.useState("pending");
  const [selectedDate, setSelectedDate] = React.useState(null);

  const { data, isLoading, error } = useTasksByUser(userSlug, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 200,
  });

  const tasks = React.useMemo(() => {
    const raw = data?.tasks ?? data?.items ?? data?.data ?? data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    if (!selectedDate) return list;
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();
    return list.filter((t) => {
      if (!t.due_date) return false;
      const dt = new Date(t.due_date);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    });
  }, [data, selectedDate]);

  const hasError = !!error;

  const getStatusBadgeClass = (status) => {
    const value = (status || "").toLowerCase();
    if (value === "completed") return "bg-green-500/10 text-green-700";
    if (value === "overdue") return "bg-red-500/10 text-red-700";
    if (value === "in_progress" || value === "in-progress") return "bg-blue-500/10 text-blue-700";
    if (value === "cancelled") return "bg-gray-500/10 text-gray-700";
    return "bg-amber-500/10 text-amber-700";
  };

  const tasksByDate = React.useMemo(() => {
    const map = new Map();
    const raw = data?.tasks ?? data?.items ?? data?.data ?? data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    list.forEach((t) => {
      if (!t.due_date) return;
      const dt = new Date(t.due_date);
      if (isNaN(dt.getTime())) return;
      const key = dt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [data]);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedDate && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => setSelectedDate(null)}
            >
              Clear date filter
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading tasks…</p>
        ) : hasError ? (
          <p className="text-sm text-destructive py-4">
            Failed to load tasks. Please try again.
          </p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No tasks found for this person{selectedDate ? " on this date" : ""}.
          </p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.title || t.name || `Task #${t.id}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.task_type_display_name || t.task_type || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.due_date
                        ? new Date(t.due_date).toLocaleDateString()
                        : "No due date"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                          t.status
                        )}`}
                      >
                        {t.status || "pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                      >
                        <Link href={`/admin/my-tasks${t.slug ? `?task=${t.slug}` : ""}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground">
          Calendar view
        </Label>
        <div className="border rounded-md p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="w-full"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Click a day to filter the list by due date.
          </p>
        </div>
      </div>
    </div>
  );
};

const PersonnelCategoryManagerDialog = ({
  open,
  onOpenChange,
  personnelRootCategory,
  personnelFlatCategories,
  onCreateRoot,
  onCreateChild,
  onDeleteCategory,
  isCreating,
  isDeleting,
}) => {
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    const created = await onCreateChild(name);
    if (created) {
      setNewCategoryName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage personnel file categories</DialogTitle>
          <DialogDescription>
            These categories are used only for Personnel File documents.
          </DialogDescription>
        </DialogHeader>

        {!personnelRootCategory ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A root category named "Personnel File" is required before adding personnel
              categories.
            </p>
            <Button onClick={onCreateRoot} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Personnel File category set"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New personnel category name"
              />
              <Button type="submit" disabled={!newCategoryName.trim() || isCreating}>
                Add
              </Button>
            </form>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {personnelFlatCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No personnel categories yet. Add one above.
                </p>
              ) : (
                personnelFlatCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between border rounded-md px-3 py-2"
                  >
                    <span className="text-sm">{cat.displayName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteCategory(cat.slug)}
                      disabled={isDeleting}
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const UserEditPage = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userSlug = params.userId || params.slug;

  // Check if tab parameter is in URL (for redirects from compliance-monitoring)
  const tabParam = searchParams?.get("tab");
  
  // Get stored tab state from localStorage
  const getStoredTabState = (key, defaultValue) => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(`people-management-${userSlug}-${key}`);
      return stored || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Initialize tab states from URL param, localStorage, or default
  const [activeTab, setActiveTab] = useState(() => {
    return tabParam || getStoredTabState('activeTab', 'basic');
  });
  
  // Nested tabs state for compliance tab (My Information / My Compliance) - always default to My Information on load
  const [complianceSubTab, setComplianceSubTab] = useState('additional');
  const [activeSectionTab, setActiveSectionTab] = useState(() => {
    return getStoredTabState('activeSectionTab', null);
  });

  // Update tab if URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Redirect removed hierarchy tab to basic
  useEffect(() => {
    if (activeTab === "hierarchy") {
      setActiveTab("basic");
    }
  }, [activeTab]);

  // Persist activeTab to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      try {
        localStorage.setItem(`people-management-${userSlug}-activeTab`, activeTab);
      } catch (error) {
        console.warn('Failed to save activeTab to localStorage:', error);
      }
    }
  }, [activeTab, userSlug]);

  // Persist active tab in URL query (?tab=...) so refresh keeps the active tab via GET.
  useEffect(() => {
    if (!activeTab || !pathname) return;
    if (tabParam === activeTab) return;

    const nextParams = new URLSearchParams(searchParams?.toString() || "");
    nextParams.set("tab", activeTab);
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [activeTab, tabParam, pathname, router, searchParams]);

  // Persist activeSectionTab to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (activeSectionTab) {
          localStorage.setItem(`people-management-${userSlug}-activeSectionTab`, activeSectionTab);
        } else {
          localStorage.removeItem(`people-management-${userSlug}-activeSectionTab`);
        }
      } catch (error) {
        console.warn('Failed to save activeSectionTab to localStorage:', error);
      }
    }
  }, [activeSectionTab, userSlug]);
  const [isCustomPermissionModalOpen, setIsCustomPermissionModalOpen] =
    useState(false);
  const [searchPermissionTerm, setSearchPermissionTerm] = useState("");
  const [isAssignDepartmentModalOpen, setIsAssignDepartmentModalOpen] =
    useState(false);
  const [isAddRoleToDepartmentModalOpen, setIsAddRoleToDepartmentModalOpen] =
    useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDepartmentForRole, setSelectedDepartmentForRole] =
    useState(null);
  const [selectedRoleForDepartment, setSelectedRoleForDepartment] =
    useState("");
  const [selectedEmployeeSetting, setSelectedEmployeeSetting] = useState(null);
  const [isEmployeeSettingsFormOpen, setIsEmployeeSettingsFormOpen] = useState(false);
  const [selectedEntitlement, setSelectedEntitlement] = useState(null);
  const [isEntitlementFormOpen, setIsEntitlementFormOpen] = useState(false);
  const [entitlementFilterYearId, setEntitlementFilterYearId] = useState("all");
  const [leaveApproverSelectedIds, setLeaveApproverSelectedIds] = useState([]);
  const [isPersonnelDocDialogOpen, setIsPersonnelDocDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [manualResetPassword, setManualResetPassword] = useState("");
  const [manualResetPasswordConfirm, setManualResetPasswordConfirm] = useState("");
  const [manualResetPasswordError, setManualResetPasswordError] = useState("");
  const [personnelCategoryId, setPersonnelCategoryId] = useState(null);
  const [personnelTitle, setPersonnelTitle] = useState("");
  const [personnelDescription, setPersonnelDescription] = useState("");
  const [isManagePersonnelCategoriesOpen, setIsManagePersonnelCategoriesOpen] = useState(false);
  const isCreatingPersonnelRootRef = useRef(false);
  const isCreatingPersonnelChildRef = useRef(false);

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useUser(userSlug);

  // Extract roles, permissions, and direct_permissions from the main user data
  const userRoles = userData?.roles || [];
  const userPermissions = userData?.permissions || [];
  const userDirectPermissions = userData?.direct_permissions || [];

  // Transform user data
  const transformedUser = React.useMemo(() => {
    return userData ? userUtils.transformUser(userData) : null;
  }, [userData]);

  // Use the actual slug from user data if available, otherwise fall back to params
  // This ensures we always use the slug for API calls, even if the URL had an ID
  const actualUserSlug = React.useMemo(() => {
    return transformedUser?.slug || userData?.slug || userSlug;
  }, [transformedUser, userData, userSlug]);

  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const verifyUserMutation = useVerifyUser();
  const resetUserPasswordMutation = useResetUserPassword();
  const assignDirectPermissionMutation = useAssignDirectPermission();
  const removeDirectPermissionMutation = useRemoveDirectPermission();

  // Department and Assignment hooks
  const { data: departmentsData, isLoading: departmentsLoading } =
    useDepartments();
  // Handle different response structures - could be array or object with departments property
  const departments = React.useMemo(() => {
    if (!departmentsData) return [];
    if (Array.isArray(departmentsData)) return departmentsData;
    if (
      departmentsData.departments &&
      Array.isArray(departmentsData.departments)
    ) {
      return departmentsData.departments;
    }
    return [];
  }, [departmentsData]);
  const {
    data: employeeAssignmentsData,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useEmployeeAssignments(actualUserSlug);
  const createAssignmentMutation = useCreateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();
  const queryClient = useQueryClient();

  // Employee job role settings and holiday entitlements (Shifts & Attendance tab)
  const { data: employeeSettingsData, isLoading: employeeSettingsLoading } = useEmployeeSettings(
    userData?.id ?? null,
    {},
    { enabled: !!userData?.id }
  );
  const employeeSettingsList = Array.isArray(employeeSettingsData) ? employeeSettingsData : (employeeSettingsData ?? []);
  const { data: yearsData } = useHolidayYears({});
  const years = Array.isArray(yearsData) ? yearsData : (yearsData?.years ?? yearsData ?? []);
  const entitlementParams = React.useMemo(
    () => ({
      user_id: userData?.id,
      ...(entitlementFilterYearId && entitlementFilterYearId !== "all"
        ? { holiday_year_id: parseInt(entitlementFilterYearId, 10) }
        : {}),
    }),
    [userData?.id, entitlementFilterYearId]
  );
  const { data: entitlementsData, isLoading: entitlementsLoading } = useHolidayEntitlements(entitlementParams, {
    enabled: !!userData?.id,
  });
  const entitlementsList = Array.isArray(entitlementsData) ? entitlementsData : (entitlementsData ?? []);
  const recalculateHoursMutation = useRecalculateHolidayEntitlementHours();
  const { data: leaveApproverDeptsData } = useLeaveApproverDepartments(userData?.id ?? null, { enabled: !!userData?.id });
  const leaveApproverDepartmentsList = React.useMemo(
    () => (Array.isArray(leaveApproverDeptsData) ? leaveApproverDeptsData : []),
    [leaveApproverDeptsData]
  );
  const setLeaveApproverDepartmentsMutation = useSetLeaveApproverDepartments();

  useEffect(() => {
    setLeaveApproverSelectedIds(leaveApproverDepartmentsList.map((d) => d.id));
  }, [leaveApproverDepartmentsList]);

  // Get available roles from API (needed for Superuser role lookup and Assign Department modal)
  const { data: rolesData, isLoading: rolesLoading } = useRolesAll();

  // Custom Fields hooks for Additional Information tab
  const { data: customFieldsHierarchy, isLoading: customFieldsHierarchyLoading } = 
    useUserCustomFieldsHierarchy(actualUserSlug);
  const { data: userCustomFields } = useUserCustomFields(actualUserSlug);
  const bulkUpdateUserCustomFieldsMutation = useBulkUpdateUserCustomFields();
  const uploadFileMutation = useUploadFile({ silent: true });

  // Fetch compliance data to filter out compliance fields from custom fields
  const { data: complianceData } = useEntityCompliance(
    "user",
    actualUserSlug,
    null,
    null
  );

  // Custom Fields State
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [initialCustomFieldsData, setInitialCustomFieldsData] = useState({});
  const [customFieldsErrors, setCustomFieldsErrors] = useState({});
  const [hasCustomFieldsChanges, setHasCustomFieldsChanges] = useState(false);
  const [isUpdatingCustomFields, setIsUpdatingCustomFields] = useState(false);

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryField, setSelectedHistoryField] = useState(null);

  // Helper function to extract value from API response
  const extractValueFromAPIResponse = (field, valueData) => {
    if (!valueData) return "";
    
    if (field.field_type === "file" || field.field_type === "image") {
      return null;
    }
    
    if (field.field_type === "select" || field.field_type === "multi_select") {
      return valueData.selected_options || valueData.value || "";
    }
    
    if (field.field_type === "date") {
      return valueData.date || valueData.value || "";
    }
    
    if (field.field_type === "boolean") {
      return valueData.value !== undefined ? valueData.value : "";
    }
    
    return valueData.value || valueData || "";
  };

  // Initialize custom fields data from API response
  useEffect(() => {
    if (userCustomFields && userCustomFields.sections) {
      const fieldsMap = {};
      userCustomFields.sections.forEach(section => {
        section.fields?.forEach(field => {
          const fieldType = field.field_type?.toLowerCase();
          
          if (fieldType === 'file' || fieldType === 'image') {
            if (field.file_id) {
              fieldsMap[field.id] = field.file_id;
            } else {
              fieldsMap[field.id] = null;
            }
          } else if (field.value_data) {
            const extractedValue = extractValueFromAPIResponse(field, field.value_data);
            fieldsMap[field.id] = extractedValue;
          } else {
            fieldsMap[field.id] = "";
          }
        });
      });
      setCustomFieldsData(fieldsMap);
      const deepCopy = {};
      Object.entries(fieldsMap).forEach(([key, value]) => {
        if (value instanceof File || (value && typeof value === 'object' && value.file instanceof File)) {
          deepCopy[key] = null;
        } else {
          try {
            deepCopy[key] = JSON.parse(JSON.stringify(value));
          } catch (e) {
            deepCopy[key] = value;
          }
        }
      });
      setInitialCustomFieldsData(deepCopy);
    }
  }, [userCustomFields]);

  // Set default active section tab (only if not already set from localStorage)
  useEffect(() => {
    if (customFieldsHierarchy?.sections && !activeSectionTab) {
      const activeSections = customFieldsHierarchy.sections
        .filter(section => section.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      if (activeSections.length > 0) {
        // Check if stored section tab is still valid
        if (typeof window !== 'undefined') {
          try {
            const storedSectionTab = localStorage.getItem(`people-management-${userSlug}-activeSectionTab`);
            if (storedSectionTab && activeSections.some(s => s.id.toString() === storedSectionTab)) {
              setActiveSectionTab(storedSectionTab);
              return;
            }
          } catch (error) {
            // Ignore localStorage errors
          }
        }
        setActiveSectionTab(activeSections[0].id.toString());
      }
    }
  }, [customFieldsHierarchy, activeSectionTab, userSlug]);

  // Create a map of compliance fields by field ID
  const complianceFieldsMap = React.useMemo(() => {
    const map = new Map();
    if (complianceData?.compliance_fields) {
      complianceData.compliance_fields.forEach((cf) => {
        map.set(cf.custom_field_id, cf);
      });
    }
    return map;
  }, [complianceData]);

  // Create a map of ALL fields across ALL sections
  const allSectionsFieldsMap = React.useMemo(() => {
    const map = new Map();
    if (customFieldsHierarchy?.sections) {
      customFieldsHierarchy.sections
        .filter(section => section.is_active !== false)
        .forEach(section => {
          (section.fields || [])
            .filter(field => field.is_active !== false)
            .filter(field => !complianceFieldsMap.has(field.id))
            .forEach(field => {
              map.set(field.id, field);
            });
        });
    }
    return map;
  }, [customFieldsHierarchy, complianceFieldsMap]);

  // Set of field IDs that are read-only (API is_editable === false) – do not update state for these
  const readOnlyFieldIds = React.useMemo(() => {
    const ids = new Set();
    const collectReadOnly = (sections) => {
      if (!Array.isArray(sections)) return;
      sections.filter(s => s.is_active !== false).forEach(section => {
        (section.fields || []).forEach(f => {
          if (f.is_editable === false || f.isEditable === false) ids.add(f.id);
        });
        collectReadOnly(section.subsections);
      });
    };
    collectReadOnly(customFieldsHierarchy?.sections);
    return ids;
  }, [customFieldsHierarchy]);

  const handleCustomFieldChange = (fieldId, value) => {
    if (readOnlyFieldIds.has(fieldId)) return; // API says field is not editable
    setCustomFieldsData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    setCustomFieldsErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  // Handle viewing field history
  const handleViewHistory = (field) => {
    setSelectedHistoryField(field);
    setHistoryModalOpen(true);
  };

  // Handle downloading files from history
  const handleDownloadHistoryFile = async (file) => {
    if (file?.id) {
      try {
        const response = await filesService.getFileUrl(file.id);
        const url = response.url || response;
        if (url) {
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error("Failed to get file URL:", error);
        toast.error("Failed to download file", {
          description: "Could not retrieve the file. Please try again.",
        });
      }
    }
  };

  // Get history for selected field - use custom field history for all fields
  const { data: customFieldHistoryData, isLoading: customFieldHistoryLoading, error: customFieldHistoryError } = useCustomFieldValueHistory(
    "user",
    actualUserSlug,
    selectedHistoryField?.slug || "",
    1,
    50
  );

  // For compliance fields, also try compliance history API (for backward compatibility)
  const isComplianceField = selectedHistoryField && (selectedHistoryField.is_compliance || selectedHistoryField.compliance_config || complianceFieldsMap.has(selectedHistoryField.id));
  const { data: complianceHistoryData, isLoading: complianceHistoryLoading } = useComplianceHistory(
    isComplianceField ? (selectedHistoryField?.slug || "") : "",
    "user",
    actualUserSlug,
    1,
    50
  );

  // Use custom field history if available, otherwise fall back to compliance history
  const historyData = customFieldHistoryData || (isComplianceField ? complianceHistoryData : null);
  const historyLoading = customFieldHistoryLoading || (isComplianceField ? complianceHistoryLoading : false);
  const historyError = customFieldHistoryError;

  // Debug logging
  useEffect(() => {
    if (selectedHistoryField) {
      console.log("Viewing history for field:", {
        field: selectedHistoryField,
        slug: selectedHistoryField.slug,
        isCompliance: isComplianceField,
        customFieldHistoryData,
        complianceHistoryData,
        historyData,
        historyError,
      });
    }
  }, [selectedHistoryField, customFieldHistoryData, complianceHistoryData, historyData, historyError, isComplianceField]);

  // Check for changes in custom fields
  useEffect(() => {
    if (!customFieldsHierarchy?.sections) {
      setHasCustomFieldsChanges(false);
      return;
    }

    let hasChanges = false;
    customFieldsHierarchy.sections
      .filter(section => section.is_active !== false)
      .forEach(section => {
        section.fields
          ?.filter(field => field.is_active !== false)
          .forEach(field => {
            // Skip compliance fields
            const isComplianceField = complianceData?.compliance_fields?.some(
              cf => cf.custom_field_id === field.id
            );
            if (isComplianceField) return;

            const currentValue = customFieldsData[field.id];
            const initialValue = initialCustomFieldsData[field.id];
            
            // Normalize values for comparison
            const normalizeValue = (val) => {
              if (val === null || val === undefined || val === '') return null;
              // Don't compare File objects - they're handled separately
              if (val instanceof File || (val && typeof val === 'object' && val.file instanceof File)) {
                return null; // File objects will be uploaded, so we can't compare them directly
              }
              // Filter out empty arrays like [{}] or empty objects
              if (Array.isArray(val)) {
                const validEntries = val.filter(v => 
                  v instanceof File || 
                  (v && typeof v === 'object' && v.file instanceof File) ||
                  (v && typeof v === 'object' && Object.keys(v).length > 0)
                );
                if (validEntries.length === 0) return null; // Empty or invalid array
                return val; // Has valid entries
              }
              if (val && typeof val === 'object' && Object.keys(val).length === 0) {
                return null; // Empty object
              }
              return val;
            };
            
            const normalizedCurrent = normalizeValue(currentValue);
            const normalizedInitial = normalizeValue(initialValue);
            
            // Only mark as changed if values are actually different
            if (normalizedCurrent !== normalizedInitial) {
              hasChanges = true;
            }
          });
      });

    setHasCustomFieldsChanges(hasChanges);
  }, [customFieldsHierarchy, initialCustomFieldsData, customFieldsData, complianceData]);

  // Handle bulk update of custom fields
  const handleCustomFieldsBulkUpdate = async () => {
    if (!actualUserSlug) return;

    setIsUpdatingCustomFields(true);
    try {
      // Create a map of valid field IDs to slugs from the hierarchy (excluding compliance fields)
      const fieldIdToSlugMap = new Map();
      if (customFieldsHierarchy?.sections) {
        customFieldsHierarchy.sections
          .filter(section => section.is_active !== false)
          .forEach(section => {
            section.fields
              ?.filter(field => field.is_active !== false)
              .forEach(field => {
                // Skip compliance fields
                const isComplianceField = complianceData?.compliance_fields?.some(
                  cf => cf.custom_field_id === field.id
                );
                if (!isComplianceField && field.slug) {
                  fieldIdToSlugMap.set(field.id, field.slug);
                }
              });
          });
      }

      // Helper: get field from hierarchy (for is_editable check)
      const getFieldFromHierarchy = (fieldIdInt) =>
        customFieldsHierarchy?.sections
          ?.flatMap(section => section.fields || [])
          ?.find(f => f.id === fieldIdInt);

      // Prepare updates array - only include fields that have actually changed and are editable
      const updates = Object.entries(customFieldsData)
        .filter(([fieldId, currentValue]) => {
          const fieldIdInt = parseInt(fieldId);
          // Only include fields that are in the hierarchy and have slugs
          if (!fieldIdToSlugMap.has(fieldIdInt)) {
            return false;
          }
          // Exclude read-only fields (Field Visibility: not editable)
          const field = getFieldFromHierarchy(fieldIdInt);
          if (field?.is_editable === false) {
            return false;
          }
          
          // Get initial value for this field
          const initialValue = initialCustomFieldsData[fieldId];
          
          // Normalize values for comparison
          const normalizeValue = (val) => {
            if (val === null || val === undefined || val === '') return null;
            if (val instanceof File || (val && typeof val === 'object' && val.file instanceof File)) {
              return null; // File objects are handled separately
            }
            return val;
          };
          
          const normalizedCurrent = normalizeValue(currentValue);
          const normalizedInitial = normalizeValue(initialValue);
          
          // Only include if value has actually changed
          return normalizedCurrent !== normalizedInitial;
        })
        .map(([fieldId, value]) => {
          const fieldIdInt = parseInt(fieldId);
          const fieldSlug = fieldIdToSlugMap.get(fieldIdInt);
          
          // Get field definition to check field type
          const field = customFieldsHierarchy?.sections
            ?.flatMap(section => section.fields || [])
            ?.find(f => f.id === fieldIdInt);
          
          // Filter out invalid values
          let finalValue = value;
          if (Array.isArray(value)) {
            const validEntries = value.filter(v => 
              v instanceof File || 
              (v && typeof v === 'object' && (v.file instanceof File || Object.keys(v).length > 0))
            );
            if (validEntries.length === 0) {
              finalValue = null; // Empty or invalid array
            }
          } else if (value && typeof value === 'object' && Object.keys(value).length === 0) {
            finalValue = null; // Empty object
          } else if (value === undefined || value === '') {
            finalValue = null;
          }
          
          // If this is a file field and we don't have a file_id, don't send invalid values
          if (field && field.field_type?.toLowerCase() === 'file') {
            const isValidFileValue = 
              finalValue instanceof File || 
              (finalValue && typeof finalValue === 'object' && finalValue.file instanceof File) ||
              typeof finalValue === 'number' || 
              finalValue === null;
            
            if (!isValidFileValue) {
              console.warn(`Skipping invalid file field value for ${fieldSlug}:`, finalValue);
              return null; // Filter this out
            }
          }
          
          return {
            field_slug: fieldSlug,
            value: finalValue,
          };
        })
        .filter(update => update !== null); // Remove null entries (filtered out invalid values)

      if (updates.length === 0) {
        toast.info("No changes to save");
        setIsUpdatingCustomFields(false);
        return;
      }

      await bulkUpdateUserCustomFieldsMutation.mutateAsync({
        userSlug: actualUserSlug,
        updates: updates,
      });

      toast.success("Custom fields updated successfully");
      
      // Update initial data to reflect saved state
      setInitialCustomFieldsData({ ...customFieldsData });
      setHasCustomFieldsChanges(false);
    } catch (error) {
      console.error("Failed to update custom fields:", error);
      toast.error("Failed to update custom fields", {
        description: error.response?.data?.detail || error.message || "An error occurred",
      });
    } finally {
      setIsUpdatingCustomFields(false);
    }
  };

  // Group assignments by department
  const assignmentsByDepartment = React.useMemo(() => {
    if (!employeeAssignmentsData || !Array.isArray(employeeAssignmentsData)) {
      return [];
    }

    // Group assignments by department_id, then by job role with nested shift roles
    const grouped = {};

    employeeAssignmentsData.forEach((assignment) => {
      const deptId = assignment.department_id || assignment.department?.id;
      if (!deptId || !assignment.role) return;

      if (!grouped[deptId]) {
        grouped[deptId] = {
          department: assignment.department || {
            id: deptId,
            name: assignment.department_name || "Unknown Department",
            code: assignment.department_code || "",
          },
          jobRoles: new Map(), // Use Map to group by job role ID
        };
      }

      const role = assignment.role;
      const roleType = role.role_type || role.roleType;
      const assignmentId = assignment.assignment_id || assignment.id;

      if (roleType === "job_role") {
        // Job role - add to map if not exists
        if (!grouped[deptId].jobRoles.has(role.id)) {
          grouped[deptId].jobRoles.set(role.id, {
            role: role,
            assignment_id: assignmentId,
            shiftRoles: [],
          });
        } else {
          // Update existing job role assignment
          const existing = grouped[deptId].jobRoles.get(role.id);
          existing.assignment_id = assignmentId;
        }
      } else if (roleType === "shift_role" && role.parent_role_id) {
        // Shift role - find parent job role and add to its shiftRoles array
        const parentJobRoleId = role.parent_role_id;

        // Ensure parent job role exists in the map (might not have assignment)
        if (!grouped[deptId].jobRoles.has(parentJobRoleId)) {
          // Try to find parent job role from other assignments
          const parentAssignment = employeeAssignmentsData.find(
            (a) =>
              a.role?.id === parentJobRoleId &&
              a.role?.role_type === "job_role" &&
              (a.department_id === deptId || a.department?.id === deptId)
          );

          if (parentAssignment) {
            grouped[deptId].jobRoles.set(parentJobRoleId, {
              role: parentAssignment.role,
              assignment_id: parentAssignment.assignment_id || parentAssignment.id,
              shiftRoles: [],
            });
          } else {
            // Create placeholder for parent job role (might not be assigned)
            grouped[deptId].jobRoles.set(parentJobRoleId, {
              role: {
                id: parentJobRoleId,
                name: role.parent_role?.name || "Unknown Job Role",
                display_name: role.parent_role?.display_name || "Unknown Job Role",
                role_type: "job_role",
              },
              assignment_id: null,
              shiftRoles: [],
            });
          }
        }

        // Add shift role to parent's shiftRoles array (deduplicate by role.id)
        const jobRoleGroup = grouped[deptId].jobRoles.get(parentJobRoleId);
        const existingShiftRole = jobRoleGroup.shiftRoles.find(
          (sr) => sr.role?.id === role.id
        );

        if (!existingShiftRole) {
          jobRoleGroup.shiftRoles.push({
            role: role,
            assignment_id: assignmentId,
          });
        }
      } else {
        // Other roles (fallback - shouldn't happen with current structure)
        if (!grouped[deptId].otherRoles) {
          grouped[deptId].otherRoles = [];
        }
        grouped[deptId].otherRoles.push({
          ...role,
          assignment_id: assignmentId,
        });
      }
    });

    // Convert Maps to arrays and structure for display
    const departmentGroups = Object.values(grouped).map((deptGroup) => ({
      department: deptGroup.department,
      jobRoles: Array.from(deptGroup.jobRoles.values()),
      otherRoles: deptGroup.otherRoles || [],
    }));

    // Add Superuser role if user is a superuser
    // Superuser role doesn't need a department or parent job role
    if (transformedUser?.isSuperuser) {
      // Check if superuser role already exists in assignments
      const superuserAssignment = employeeAssignmentsData?.find(
        (a) =>
          a.role?.slug === "superuser" ||
          a.role?.name === "superuser" ||
          a.role?.role_type === "superuser" ||
          a.role?.id === "superuser" ||
          (typeof a.role === "object" && (a.role.slug === "superuser" || a.role.name === "superuser"))
      );

      // Find superuser role from roles data (support array or wrapped { roles: [...] })
      const rolesList = Array.isArray(rolesData) ? rolesData : rolesData?.roles ?? rolesData?.items ?? [];
      const superuserRole = rolesList.find(
        (r) =>
          r.slug === "superuser" ||
          r.name === "superuser" ||
          r.role_type === "superuser" ||
          r.id === "superuser" ||
          (typeof r === "object" && r.display_name?.toLowerCase() === "superuser")
      ) || {
        id: "superuser",
        name: "superuser",
        display_name: "Superuser",
        slug: "superuser",
        role_type: "superuser",
        isSystem: true,
        description: "Full system access with all permissions",
      };

      // Prepend Superuser department group
      departmentGroups.unshift({
        department: {
          id: "superuser",
          name: "Superuser",
          code: "SU",
          description: "System administrator role",
        },
        jobRoles: [
          {
            role: superuserRole,
            assignment_id: superuserAssignment?.assignment_id || superuserAssignment?.id || null,
            shiftRoles: [],
          },
        ],
        otherRoles: [],
      });
    }

    return departmentGroups;
  }, [employeeAssignmentsData, transformedUser, rolesData]);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    title: "",
    phoneNumber: "",
    avatarUrl: "",
    bio: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef(null);

  // Update form data when user data loads
  React.useEffect(() => {
    if (transformedUser) {
      const newFormData = {
        email: transformedUser.email || "",
        username: transformedUser.username || "",
        firstName: transformedUser.firstName || "",
        lastName: transformedUser.lastName || "",
        title: transformedUser.title || "",
        phoneNumber: transformedUser.phoneNumber || "",
        avatarUrl: transformedUser.avatarUrl || "",
        bio: transformedUser.bio || "",
      };

      // Only update if the data has actually changed
      setFormData((prevFormData) => {
        const hasChanged = Object.keys(newFormData).some(
          (key) => prevFormData[key] !== newFormData[key]
        );
        return hasChanged ? newFormData : prevFormData;
      });
    }
  }, [transformedUser]);

  // Normalize roles: API may return array or wrapped { roles: [...] }
  const rolesArray = React.useMemo(() => {
    if (!rolesData) return [];
    if (Array.isArray(rolesData)) return rolesData;
    return rolesData?.roles ?? rolesData?.items ?? rolesData?.data ?? [];
  }, [rolesData]);

  const availableRoles = React.useMemo(() => {
    if (!rolesArray.length) return [];
    // All job roles (including those with a parent, e.g. Service lead in Gastro) can be assigned to a department
    return rolesArray.filter(
      (role) =>
        role.role_type !== "shift_role" &&
        role.roleType !== "shift_role"
    );
  }, [rolesArray]);

  // Lookup maps to resolve job role and department names by ID (for Employee job role settings / entitlements)
  const departmentById = React.useMemo(() => {
    const map = new Map();
    departments.forEach((d) => map.set(Number(d.id), d));
    return map;
  }, [departments]);
  const roleById = React.useMemo(() => {
    const map = new Map();
    rolesArray.forEach((r) => map.set(Number(r.id), r));
    return map;
  }, [rolesArray]);

  // Role label for dropdowns: always include department when available
  const getRoleDisplayLabel = React.useCallback(
    (role) => {
      const deptId = role.department_id ?? role.departmentId ?? role.department?.id;
      const dept = deptId != null ? departmentById.get(Number(deptId)) : null;
      const deptName = dept?.name ?? role.department?.name;
      const roleName = role.display_name || role.name || "";
      if (deptName) {
        return `${roleName} - ${deptName}`;
      }
      if (role.description) {
        return `${roleName} - ${role.description}`;
      }
      return roleName;
    },
    [departmentById]
  );

  const { data: contractTypesData } = useContractTypes({});
  const contractTypesList = Array.isArray(contractTypesData) ? contractTypesData : contractTypesData?.data ?? [];
  const contractTypeById = React.useMemo(() => {
    const map = new Map();
    contractTypesList.forEach((ct) => map.set(Number(ct.id), ct));
    return map;
  }, [contractTypesList]);

  // Get all permissions from API (all pages so "Available to Assign" shows full list)
  const { data: allPermissionsData, isLoading: permissionsLoading } =
    usePermissionsAll();

  // Handle new paginated response structure: { permissions: [], total: 96, ... }
  const allPermissionsArray = allPermissionsData?.permissions || (Array.isArray(allPermissionsData) ? allPermissionsData : []);

  // Get current user (admin) data to check what permissions they can assign
  const { data: currentUserData, isLoading: currentUserLoading } = useCurrentUser();

  // Get current user's permissions to determine what they can assign
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions =
    currentUserData?.direct_permissions || [];

  // Extract permission names for permission checks (canUpdateUser, canDeleteUser, etc.)
  const userPermissionNames = React.useMemo(() => {
    const allPermissions = [...currentUserPermissions, ...currentUserDirectPermissions];
    return allPermissions.map((p) => {
      if (typeof p === "string") return p;
      if (typeof p === "object") {
        return p.permission || p.name || p.permission_id || p.id || "";
      }
      return String(p);
    }).filter(Boolean);
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Check if user has wildcard permissions for permission checks
  const hasWildcardPermissions = userPermissionNames.includes("*");

  // Permission check helper
  const hasPermission = React.useCallback((permission) => {
    if (hasWildcardPermissions) return true;
    return userPermissionNames.some((perm) => {
      if (perm === permission) return true;
      // Resource match (e.g., user:create matches users:create)
      const permResource = perm.split(":")[0];
      const checkResource = permission.split(":")[0];
      if (permResource === checkResource || permResource === checkResource + "s" || permResource + "s" === checkResource) {
        return true;
      }
      return perm.includes(checkResource);
    });
  }, [userPermissionNames, hasWildcardPermissions]);

  // User management permissions
  const canUpdateUser = hasPermission("user:update");
  const canDeleteUser = hasPermission("user:delete");
  const canAssignRole = hasPermission("role:assign");
  const canAssignEmployee = hasPermission("employee:assign");

  // Current user permission check (for tab visibility)
  const { hasPermission: currentUserHasPermission, isSuperuser: currentUserIsSuperuser } = usePermissionsCheck();
  const canViewAttendance = currentUserHasPermission("attendance:view") || currentUserIsSuperuser;
  const canManageAttendanceSettings = currentUserHasPermission("attendance:settings") || currentUserIsSuperuser;
  const isViewingSelf = currentUserData?.id === userData?.id;

  // Personnel file / document permissions for current user
  const canManagePersonnelDocuments = hasPermission("document:create");
  const canEditPersonnelDocuments = hasPermission("document:update");
  const canDeletePersonnelDocuments = hasPermission("document:delete");

  // Personnel File: shared documents for this user
  const personnelUserId = userData?.id ?? null;

  const { data: personnelCategoriesData } = useDocumentCategories();
  const createDocumentCategoryMutation = useCreateDocumentCategory();
  const deleteDocumentCategoryMutation = useDeleteDocumentCategory();

  const personnelRootCategory = React.useMemo(() => {
    const categories = personnelCategoriesData?.categories || [];
    const queue = [...categories];

    while (queue.length > 0) {
      const cat = queue.shift();
      const slug = String(cat?.slug || "").trim().toLowerCase();
      const name = String(cat?.name || "").trim().toLowerCase();
      if (
        slug === "personnel-file" ||
        slug === "personnel-files" ||
        slug === "personnel-file-categories" ||
        name === "personnel file" ||
        name === "personnel files"
      ) {
        return cat;
      }
      if (Array.isArray(cat?.children) && cat.children.length > 0) {
        queue.push(...cat.children);
      }
    }
    return null;
  }, [personnelCategoriesData]);

  const personnelFlatCategories = React.useMemo(() => {
    const categories = personnelRootCategory?.children || [];
    const result = [];

    const flatten = (cats, depth = 0) => {
      cats.forEach((cat) => {
        result.push({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          displayName: `${"  ".repeat(depth)}${cat.name}`,
        });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, depth + 1);
        }
      });
    };

    flatten(categories);
    return result;
  }, [personnelRootCategory]);

  const personnelCategoryIds = React.useMemo(
    () => new Set(personnelFlatCategories.map((cat) => cat.id)),
    [personnelFlatCategories]
  );

  const personnelCategoryNameById = React.useMemo(() => {
    const map = new Map();
    personnelFlatCategories.forEach((cat) => {
      map.set(cat.id, cat.name);
    });
    return map;
  }, [personnelFlatCategories]);

  const personnelDocumentsParams = React.useMemo(
    () => ({
      page: 1,
      per_page: 100,
    }),
    []
  );

  const {
    data: personnelDocumentsResponse,
    isLoading: personnelDocsLoading,
  } = useDocuments(personnelDocumentsParams, {
    enabled: !!personnelUserId && activeTab === "compliance",
  });

  const personnelDocuments = React.useMemo(() => {
    const docs = personnelDocumentsResponse?.documents || [];
    if (!personnelUserId) return [];
    return docs.filter(
      (doc) =>
        Array.isArray(doc.shared_with_user_ids) &&
        doc.shared_with_user_ids.includes(personnelUserId) &&
        personnelCategoryIds.has(doc.category_id)
    );
  }, [personnelDocumentsResponse, personnelUserId, personnelCategoryIds]);

  const createPersonnelDocument = useCreateDocument();

  const handleCreatePersonnelDocument = async (e) => {
    e.preventDefault();
    if (!personnelUserId || !personnelCategoryId || !personnelTitle.trim()) {
      return;
    }
    try {
      await createPersonnelDocument.mutateAsync({
        title: personnelTitle.trim(),
        content: personnelDescription || "",
        category_id: Number(personnelCategoryId),
        status: "published",
        is_public: false,
        shared_with_user_ids: [personnelUserId],
        youtube_videos: [],
      });
      setIsPersonnelDocDialogOpen(false);
      setPersonnelTitle("");
      setPersonnelDescription("");
      setPersonnelCategoryId(null);
    } catch (error) {
      // Errors are handled by the mutation's toast
    }
  };

  const handleCreatePersonnelRootCategory = async () => {
    if (createDocumentCategoryMutation.isPending || isCreatingPersonnelRootRef.current) {
      return;
    }
    isCreatingPersonnelRootRef.current = true;
    try {
      await createDocumentCategoryMutation.mutateAsync({
        name: "Personnel File",
        description: "Root category for personnel file categories",
        parent_id: null,
      });
      toast.success("Personnel category set created");
      return true;
    } catch (error) {
      // handled by mutation toast
      return false;
    } finally {
      isCreatingPersonnelRootRef.current = false;
    }
  };

  const handleCreatePersonnelChildCategory = async (name) => {
    const normalizedName = String(name || "").trim();
    if (
      createDocumentCategoryMutation.isPending ||
      isCreatingPersonnelChildRef.current
    ) {
      return false;
    }
    const categoryName = normalizedName;
    if (!personnelRootCategory?.id || !categoryName) return false;
    isCreatingPersonnelChildRef.current = true;
    try {
      await createDocumentCategoryMutation.mutateAsync({
        name: categoryName,
        parent_id: personnelRootCategory.id,
      });
      return true;
    } catch (error) {
      // handled by mutation toast
      return false;
    } finally {
      isCreatingPersonnelChildRef.current = false;
    }
  };

  const handleDeletePersonnelCategory = async (categorySlug) => {
    if (!categorySlug) return;
    try {
      await deleteDocumentCategoryMutation.mutateAsync(categorySlug);
    } catch (error) {
      // handled by mutation toast
    }
  };

  // Check if current user has wildcard permissions
  const currentUserHasWildcardPermissions = React.useMemo(() => {
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
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Get current user's permission IDs (what they can assign)
  const currentUserPermissionIds = React.useMemo(() => {
    // If current user has wildcard permissions, they can assign all permissions
    if (
      currentUserHasWildcardPermissions.rolePermissions ||
      currentUserHasWildcardPermissions.directPermissions
    ) {
      console.log(
        "Current user has wildcard permissions - can assign all permissions"
      );
      return allPermissionsArray.map((p) => p.id);
    }

    // Otherwise, get their specific permission IDs
    const roleIds = currentUserPermissions
      .map(
        (p) =>
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
      )
      .filter(Boolean);

    const directIds = currentUserDirectPermissions
      .map(
        (p) =>
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
      )
      .filter(Boolean);

    // Combine and deduplicate
    const allIds = [...new Set([...roleIds, ...directIds])];
    console.log("Current user permission IDs (can assign):", allIds);
    return allIds;
  }, [
    currentUserPermissions,
    currentUserDirectPermissions,
    currentUserHasWildcardPermissions,
    allPermissionsArray,
  ]);

  // Check if user being edited has wildcard permissions (e.g., superuser with "*")
  const editedUserHasWildcardPermissions = React.useMemo(() => {
    const rolePermissions = userPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    const directPermissions = userDirectPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    console.log("Has wildcard role permissions:", rolePermissions);
    console.log("Has wildcard direct permissions:", directPermissions);
    return { rolePermissions, directPermissions };
  }, [userPermissions, userDirectPermissions]);

  // Get user's current permissions from roles (to check for conflicts)
  const userRolePermissionIds = React.useMemo(() => {
    // If user has wildcard permissions, they have all permissions
    if (editedUserHasWildcardPermissions.rolePermissions) {
      console.log(
        "User has wildcard role permissions - treating as having all permissions"
      );
      return allPermissionsArray.map((p) => p.id);
    }

    const ids = userPermissions
      .map((p) => {
        // Try multiple ways to get the permission ID
        return (
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
        );
      })
      .filter(Boolean);
    console.log("User role permission IDs:", ids);
    console.log("User permissions data:", userPermissions);
    return ids;
  }, [
    userPermissions,
    editedUserHasWildcardPermissions.rolePermissions,
    allPermissionsArray,
  ]);

  // Get user's current direct permissions (to mark as already assigned)
  const userDirectPermissionIds = React.useMemo(() => {
    // If user has wildcard direct permissions, they have all permissions
    if (editedUserHasWildcardPermissions.directPermissions) {
      console.log(
        "User has wildcard direct permissions - treating as having all permissions"
      );
      return allPermissionsArray.map((p) => p.id);
    }

    const ids = userDirectPermissions
      .map((p) => {
        // Try multiple ways to get the permission ID
        return (
          p.id ||
          p.permission_id ||
          (typeof p === "object" && p.permission?.id) ||
          (typeof p === "string" ? parseInt(p) : null)
        );
      })
      .filter(Boolean);
    console.log("User direct permission IDs:", ids);
    console.log("User direct permissions data:", userDirectPermissions);
    return ids;
  }, [
    userDirectPermissions,
    editedUserHasWildcardPermissions.directPermissions,
    allPermissionsArray,
  ]);

  // Filter available permissions (exclude those already assigned through roles)
  // Only show permissions that the current user can actually assign
  // Split into assigned direct permissions and available to assign
  const { assignedPermissions, availablePermissions } = React.useMemo(() => {
    if (!allPermissionsArray || !currentUserPermissionIds)
      return { assignedPermissions: [], availablePermissions: [] };

    console.log("All permissions data:", allPermissionsArray);
    console.log(
      "Current user can assign permission IDs:",
      currentUserPermissionIds
    );
    console.log(
      "Matching against direct permission IDs:",
      userDirectPermissionIds
    );

    // First filter to only permissions the current user can assign
    const assignablePermissions = allPermissionsArray.filter((permission) =>
      currentUserPermissionIds.includes(permission.id)
    );

    console.log("Assignable permissions count:", assignablePermissions.length);

    const allMapped = assignablePermissions
      .map((permission) => {
        const permId = permission.id;
        const isAdded = userDirectPermissionIds.includes(permId);
        const isFromRole = userRolePermissionIds.includes(permId);

        return {
          id: permId,
          permission: permission.display_name || permission.name,
          description: permission.description || "No description available",
          resource: permission.resource || permission.resource_name,
          action: permission.action || permission.action_name,
          isAdded: isAdded,
          isFromRole: isFromRole,
        };
      })
      .filter((permission) => !permission.isFromRole); // Exclude permissions already from roles

    const assigned = allMapped.filter((p) => {
      const isMatch = p.isAdded;
      if (isMatch) {
        console.log("Found assigned direct permission:", p);
      }
      return isMatch;
    });
    const available = allMapped.filter((p) => !p.isAdded);

    console.log("Assigned direct permissions count:", assigned.length);
    console.log("Available permissions count:", available.length);

    return { assignedPermissions: assigned, availablePermissions: available };
  }, [
    allPermissionsArray,
    currentUserPermissionIds,
    userRolePermissionIds,
    userDirectPermissionIds,
  ]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
              } else {
                reject(new Error("Failed to compress image"));
              }
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const processAvatarFile = async (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Please select a JPG, PNG, GIF, or WebP image." });
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", { description: "Please select an image smaller than 10MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
    try {
      const compressedFile = await compressImage(file, 800, 800, 0.85);
      setAvatarUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append("file", compressedFile);
      const uploadResponse = await api.post("/settings/files/upload", formDataUpload);
      const uploadData = uploadResponse?.data ?? uploadResponse;
      const fileId = uploadData?.id ?? uploadData?.file_id ?? uploadData?.file_reference_id;
      if (!fileId) {
        toast.error("Upload failed", { description: "No file ID received." });
        return;
      }
      await updateUserMutation.mutateAsync({
        slug: actualUserSlug,
        userData: { avatar_url: String(fileId) },
      });
      setFormData((prev) => ({ ...prev, avatarUrl: String(fileId) }));
      setAvatarPreview(null);
      toast.success("Photo updated", { description: "Profile photo has been updated." });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(actualUserSlug) });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Failed to update photo", { description: err?.response?.data?.detail || err?.message || "Please try again." });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processAvatarFile(file);
    e.target.value = "";
  };

  const handleAvatarDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleAvatarDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processAvatarFile(files[0]);
  };

  const handleSave = async () => {
    if (!transformedUser || !actualUserSlug) {
      toast.error("Cannot save: User data not loaded");
      return;
    }

    try {
      const userDataPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        title: formData.title,
        phone_number: formData.phoneNumber,
        avatar_url: formData.avatarUrl,
        bio: formData.bio,
      };
      if (canUpdateUser && formData.email !== undefined) {
        userDataPayload.email = formData.email?.trim() || null;
      }
      await updateUserMutation.mutateAsync({
        slug: actualUserSlug,
        userData: userDataPayload,
      });
      // Success toast is handled by the mutation hook
    } catch (error) {
      console.error("Failed to update user:", error);
      // Error toast is handled by the mutation hook
    }
  };

  const handleDeactivate = async () => {
    if (!transformedUser) return;

    try {
      await deactivateUserMutation.mutateAsync(actualUserSlug);
    } catch (error) {
      console.error("Failed to deactivate user:", error);
    }
  };

  const handleActivate = async () => {
    if (!transformedUser) return;

    try {
      await activateUserMutation.mutateAsync(actualUserSlug);
    } catch (error) {
      console.error("Failed to activate user:", error);
    }
  };

  const handleVerify = async () => {
    if (!transformedUser) return;

    try {
      await verifyUserMutation.mutateAsync(actualUserSlug);
    } catch (error) {
      console.error("Failed to verify user:", error);
    }
  };

  const handleManualResetPassword = async () => {
    const pwd = (manualResetPassword || "").trim();
    const confirm = (manualResetPasswordConfirm || "").trim();

    if (pwd.length < 8) {
      setManualResetPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (pwd !== confirm) {
      setManualResetPasswordError("Password confirmation does not match.");
      return;
    }

    try {
      await resetUserPasswordMutation.mutateAsync({
        userSlug: actualUserSlug,
        newPassword: pwd,
      });
      setIsResetPasswordDialogOpen(false);
      setManualResetPassword("");
      setManualResetPasswordConfirm("");
      setManualResetPasswordError("");
      refetch();
    } catch (error) {
      const detail = error?.response?.data?.detail;
      if (detail) setManualResetPasswordError(detail);
    }
  };

  const handleDelete = async () => {
    if (!transformedUser) return;

    try {
      await deleteUserMutation.mutateAsync(actualUserSlug);
      router.push("/admin/people-management");
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleAddCustomPermission = async (permissionId) => {
    if (!actualUserSlug) return;

    const permission = availablePermissions.find((p) => p.id === permissionId);
    if (permission) {
      // Check if permission is already assigned through a role
      if (permission.isFromRole) {
        toast.error("Permission already assigned through role", {
          description:
            "This permission is already available to the user through their assigned roles and cannot be assigned directly.",
        });
        return;
      }

      // Check if permission is already assigned directly
      if (permission.isAdded) {
        toast.error("Permission already assigned", {
          description:
            "This permission is already assigned directly to the user.",
        });
        return;
      }

      try {
        await assignDirectPermissionMutation.mutateAsync({
          slug: actualUserSlug,
          permissionSlug: permission?.slug || permissionId,
        });

        // The mutation will automatically refresh the data, so we don't need to manually update state
      } catch (error) {
        console.error("Failed to assign permission:", error);
      }
    }
  };

  const handleRemoveCustomPermission = async (permissionId) => {
    if (!actualUserSlug) return;

    const permission = availablePermissions.find((p) => p.id === permissionId);
    if (permission) {
      try {
        await removeDirectPermissionMutation.mutateAsync({
          slug: actualUserSlug,
          permissionSlug: permission?.slug || permissionId,
        });

        // The mutation will automatically refresh the data, so we don't need to manually update state
      } catch (error) {
        console.error("Failed to remove permission:", error);
      }
    }
  };

  const handleAssignDepartment = async () => {
    if (!userData?.id || !selectedDepartmentId || !selectedRoleForDepartment) return;

    try {
      await createAssignmentMutation.mutateAsync({
        user_id: userData.id, // Use ID in request body (correct)
        department_id: parseInt(selectedDepartmentId),
        role_id: parseInt(selectedRoleForDepartment),
      });
      setIsAssignDepartmentModalOpen(false);
      setSelectedDepartmentId("");
      setSelectedRoleForDepartment("");
      refetchAssignments();
      // Invalidate user query to refresh permissions - use slug for query key
      queryClient.invalidateQueries({ queryKey: userKeys.detail(actualUserSlug) });
    } catch (error) {
      console.error("Failed to assign department:", error);
    }
  };

  const handleAddRoleToDepartment = async () => {
    if (!userData?.id || !selectedDepartmentForRole || !selectedRoleForDepartment)
      return;

    try {
      await createAssignmentMutation.mutateAsync({
        user_id: userData.id, // Use ID in request body (correct)
        department_id: selectedDepartmentForRole.department.id,
        role_id: parseInt(selectedRoleForDepartment),
      });
      setIsAddRoleToDepartmentModalOpen(false);
      setSelectedDepartmentForRole(null);
      setSelectedRoleForDepartment("");
      refetchAssignments();
      // Invalidate user query to refresh permissions - use slug for query key
      queryClient.invalidateQueries({ queryKey: userKeys.detail(actualUserSlug) });
    } catch (error) {
      console.error("Failed to add role to department:", error);
    }
  };

  const handleRemoveAssignment = async (departmentId, assignmentId) => {
    if (!actualUserSlug) return;

    // Find the department to get its slug - check both assignmentsByDepartment and departments list
    let departmentSlug = departmentId;
    
    // First try to find in assignmentsByDepartment
    const deptFromAssignments = assignmentsByDepartment.find(
      (dept) => dept.department.id === departmentId || dept.department.slug === departmentId
    );
    if (deptFromAssignments?.department?.slug) {
      departmentSlug = deptFromAssignments.department.slug;
    } else {
      // Try to find in departments list
      const deptFromList = departments.find(
        (dept) => dept.id === departmentId || dept.slug === departmentId
      );
      if (deptFromList?.slug) {
        departmentSlug = deptFromList.slug;
      } else {
        // Try to find in employeeAssignmentsData
        const assignment = employeeAssignmentsData?.find(
          (a) => (a.department_id === departmentId || a.department?.id === departmentId) &&
                 (a.assignment_id === assignmentId || a.id === assignmentId)
        );
        if (assignment?.department?.slug) {
          departmentSlug = assignment.department.slug;
        }
      }
    }

    try {
      await deleteAssignmentMutation.mutateAsync({
        userSlug: actualUserSlug,
        departmentSlug: departmentSlug,
      });
      refetchAssignments();
      // Invalidate user query to refresh permissions - use slug for query key
      queryClient.invalidateQueries({ queryKey: userKeys.detail(actualUserSlug) });
    } catch (error) {
      console.error("Failed to remove assignment:", error);
    }
  };

  // Get available departments (not already assigned)
  const availableDepartments = React.useMemo(() => {
    const assignedDeptIds = assignmentsByDepartment.map(
      (dept) => dept.department.id
    );
    return departments.filter((dept) => !assignedDeptIds.includes(dept.id));
  }, [departments, assignmentsByDepartment]);

  // Roles available in the Assign Department modal: only roles that belong to the selected department (or system roles with no department), sorted A–Z
  const rolesForAssignDepartmentModal = React.useMemo(() => {
    if (!selectedDepartmentId || !availableRoles.length) return [];
    const deptIdNum = Number(selectedDepartmentId);
    return availableRoles
      .filter((role) => {
        const roleDeptId = role.department_id ?? role.departmentId ?? role.department?.id;
        return roleDeptId == null || roleDeptId === undefined || Number(roleDeptId) === deptIdNum;
      })
      .slice()
      .sort((a, b) =>
        (a.display_name || a.name || "").localeCompare(b.display_name || b.name || "", undefined, { sensitivity: "base" })
      );
  }, [selectedDepartmentId, availableRoles]);

  // Get available roles for a department (not already assigned in that department)
  const getAvailableRolesForDepartment = (departmentId) => {
    const departmentAssignments = assignmentsByDepartment.find(
      (dept) => dept.department.id === departmentId
    );

    // Collect all assigned role IDs from job roles and their shift roles
    const assignedRoleIds = new Set();

    if (departmentAssignments) {
      // Add job role IDs
      departmentAssignments.jobRoles?.forEach((jobRoleGroup) => {
        if (jobRoleGroup.role?.id) {
          assignedRoleIds.add(jobRoleGroup.role.id);
        }
        // Add shift role IDs
        jobRoleGroup.shiftRoles?.forEach((shiftRoleAssignment) => {
          if (shiftRoleAssignment.role?.id) {
            assignedRoleIds.add(shiftRoleAssignment.role.id);
          }
        });
      });

      // Add other role IDs (fallback)
      departmentAssignments.otherRoles?.forEach((role) => {
        if (role.id) {
          assignedRoleIds.add(role.id);
        }
      });
    }

    // Only show job roles that belong to this department (and not already assigned here)
    const deptIdNum = Number(departmentId);
    return availableRoles
      .filter(
        (role) =>
          !assignedRoleIds.has(role.id) &&
          role.role_type !== "shift_role" &&
          role.roleType !== "shift_role" &&
          (role.department_id ?? role.departmentId ?? role.department?.id) != null &&
          Number(role.department_id ?? role.departmentId ?? role.department?.id) === deptIdNum
      )
      .slice()
      .sort((a, b) =>
        (a.display_name || a.name || "").localeCompare(b.display_name || b.name || "", undefined, { sensitivity: "base" })
      );
  };

  // Filter permissions based on search term (for both assigned and available)
  const filterPermission = (permission) => {
    const searchLower = searchPermissionTerm.toLowerCase();
    return (
      permission.permission.toLowerCase().includes(searchLower) ||
      permission.description.toLowerCase().includes(searchLower) ||
      permission.resource.toLowerCase().includes(searchLower) ||
      permission.action?.toLowerCase().includes(searchLower)
    );
  };

  const filteredAssignedPermissions =
    assignedPermissions.filter(filterPermission);
  const filteredAvailablePermissions =
    availablePermissions.filter(filterPermission);

  const handleBackToPeopleManagement = React.useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/admin/people-management");
  }, [router]);

  // Loading state
  if (userLoading || currentUserLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
            <p className="text-muted-foreground mt-1">Manage Person</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (userError || !transformedUser) {
    const is404Error = userError?.response?.status === 404;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {is404Error ? "Person not found" : "Error loading person"}
            </h1>
            <p className="text-muted-foreground mt-1">Manage Person</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {is404Error ? "Person not found" : "Error loading person"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {is404Error
                  ? "The person you're looking for doesn't exist in the system."
                  : "There was an error loading the person data. Please try again."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => router.push("/admin/people-management")}
                  variant="outline"
                >
                  Back to People Management
                </Button>
                {!is404Error && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="default"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-wrap items-start md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-4 min-w-0 flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={handleBackToPeopleManagement}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {transformedUser && (
            <AvatarWithUrl
              avatarValue={transformedUser.avatarUrl}
              alt={transformedUser.name || "User"}
              fallback={
                transformedUser.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"
              }
              className="h-12 w-12"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight break-words md:break-normal">
              {transformedUser?.name || transformedUser?.email || "Loading..."}
            </h1>
            <p className="text-muted-foreground mt-1">Manage Person</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 w-auto max-w-full shrink-0 whitespace-nowrap"
          disabled={updateUserMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div>
          <TabsList
            className={cn(
              "grid w-full h-auto gap-1 p-1",
              canViewAttendance ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            )}
          >
            <TabsTrigger value="basic" className="flex items-center justify-center gap-2 whitespace-nowrap">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center justify-center gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles & Permissions</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center justify-center gap-2 whitespace-nowrap">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Info & Compliance</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center justify-center gap-2 whitespace-nowrap">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
              <span className="sm:hidden">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center justify-center gap-2 whitespace-nowrap">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Notes</span>
              <span className="sm:hidden">Notes</span>
            </TabsTrigger>
            {canViewAttendance && (
              <TabsTrigger value="attendance" className="flex items-center justify-center gap-2 whitespace-nowrap">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Shifts & Attendance</span>
                <span className="sm:hidden">Attendance</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="status" className="flex items-center justify-center gap-2 whitespace-nowrap">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Account & Security</span>
              <span className="sm:hidden">Account</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center justify-center gap-2 whitespace-nowrap">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Audit & Activity</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Person Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Large avatar + upload (main field) */}
              <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                <div className="shrink-0">
                  {avatarPreview ? (
                    <Avatar className="h-32 w-32 sm:h-40 sm:w-40">
                      <AvatarImage src={avatarPreview} alt="Preview" />
                      <AvatarFallback className="text-3xl">
                        {transformedUser?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <AvatarWithUrl
                      avatarValue={formData.avatarUrl || transformedUser?.avatarUrl}
                      alt={transformedUser?.name || "User"}
                      fallback={
                        transformedUser?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"
                      }
                      className="h-32 w-32 sm:h-40 sm:w-40"
                      fallbackProps={{ className: "text-3xl" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 w-full sm:max-w-sm">
                  <Label className="text-sm font-medium">Profile photo</Label>
                  <p className="text-xs text-muted-foreground mb-3">Upload a photo so it’s easy to recognise this person. No link needed.</p>
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                      isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    )}
                    onDragOver={handleAvatarDragOver}
                    onDragLeave={handleAvatarDragLeave}
                    onDrop={handleAvatarDrop}
                    onClick={() => !avatarUploading && avatarFileInputRef.current?.click()}
                  >
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={avatarUploading || !canUpdateUser}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 rounded-full bg-muted">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">
                        {avatarUploading ? "Uploading…" : isDragOver ? "Drop image here" : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP · Max 10MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Email, Title, First Name, Last Name, Bio (mobile: First Name above Last Name) */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email ?? ""}
                      onChange={(e) => canUpdateUser && handleInputChange("email", e.target.value)}
                      disabled={!canUpdateUser}
                      className={!canUpdateUser ? "bg-muted" : ""}
                      placeholder={!canUpdateUser ? "" : "user@example.com"}
                    />
                    {!canUpdateUser && (
                      <p className="text-xs text-muted-foreground">Only users with update permission can change the login email.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <select
                      value={formData.title || ""}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Right column: Username, Phone */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      placeholder="+44 20 1234 5678"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Permission States Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {/* From Roles Card */}
            <Card className="bg-blue-500/10 border-blue-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      From Roles
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {userPermissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Permissions Card */}
            <Card className="bg-green-500/10 border-green-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Custom</p>
                    <p className="text-2xl font-bold text-foreground">
                      {userDirectPermissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Permissions Card */}
            <Card className="bg-purple-500/10 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Check className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total</p>
                    <p className="text-2xl font-bold text-foreground">
                      {userPermissions.length + userDirectPermissions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Departments & Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Departments & Roles</CardTitle>
                {canAssignEmployee && (
                  <Button
                    onClick={() => setIsAssignDepartmentModalOpen(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Department
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {assignmentsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading assignments...
                  </div>
                ) : assignmentsByDepartment.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No departments assigned to this person.
                  </div>
                ) : (
                  assignmentsByDepartment.map((deptGroup) => (
                    <div
                      key={deptGroup.department.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      {/* Department Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {deptGroup.department.id === "superuser" ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                              <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {deptGroup.department.name}
                              </h3>
                              {deptGroup.department.id === "superuser" && (
                                <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              )}
                            </div>
                            {deptGroup.department.code && (
                              <p className="text-sm text-muted-foreground">
                                Code: {deptGroup.department.code}
                              </p>
                            )}
                            {deptGroup.department.id === "superuser" && (
                              <p className="text-sm text-muted-foreground">
                                {deptGroup.department.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {deptGroup.department.id !== "superuser" && (
                          (<> {canAssignRole && (
                            <Button
                              onClick={() => {
                                setSelectedDepartmentForRole(deptGroup);
                                setIsAddRoleToDepartmentModalOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Role
                            </Button>
                          )} </>)
                        )}
                      </div>

                      {/* Roles in this Department - Hierarchical Display */}
                      <div className="ml-16 space-y-4">
                        {deptGroup.jobRoles.length === 0 && (!deptGroup.otherRoles || deptGroup.otherRoles.length === 0) ? (
                          <div className="text-sm text-muted-foreground py-2">
                            No roles assigned in this department.
                          </div>
                        ) : (
                          <>
                            {/* Job Roles with nested Shift Roles */}
                            {deptGroup.jobRoles.map((jobRoleGroup) => {
                              const jobRole = jobRoleGroup.role;
                              const shiftRoles = jobRoleGroup.shiftRoles || [];

                              return (
                                <div
                                  key={jobRole.id}
                                  className="space-y-2"
                                >
                                  {/* Job Role (or Superuser) */}
                                  {(jobRoleGroup.assignment_id || deptGroup.department.id === "superuser") && (
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                      <div className="flex items-center gap-3">
                                        {deptGroup.department.id === "superuser" ? (
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                                            <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                          </div>
                                        ) : (
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                            <Shield className="h-4 w-4 text-primary" />
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-medium">
                                              {jobRole.display_name || jobRole.name}
                                            </h4>
                                            {deptGroup.department.id === "superuser" ? (
                                              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                Superuser
                                              </Badge>
                                            ) : (
                                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                                Job Role
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            {jobRole.description || "No description"}
                                          </p>
                                          <div className="flex items-center gap-1 mt-1">
                                            <Key className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                              {jobRole.permissions_count || jobRole.permissions?.length || "All"} permissions
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {deptGroup.department.id !== "superuser" && jobRoleGroup.assignment_id && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-600 hover:text-red-700"
                                              disabled={
                                                deleteAssignmentMutation.isPending
                                              }
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Remove Job Role
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to remove the "
                                                {jobRole.display_name || jobRole.name}" job role
                                                from {deptGroup.department.name}?
                                                {shiftRoles.length > 0 && (
                                                  <>
                                                    <br />
                                                    <br />
                                                    <strong>Warning:</strong> This will also automatically remove {shiftRoles.length} shift role(s) under this job role.
                                                  </>
                                                )}
                                                <br />
                                                <br />
                                                <strong>Person:</strong>{" "}
                                                {transformedUser.name} (
                                                {transformedUser.email})
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleRemoveAssignment(
                                                    deptGroup.department.id,
                                                    jobRoleGroup.assignment_id
                                                  )
                                                }
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                Remove Job Role
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    </div>
                                  )}

                                  {/* Shift Roles (nested under job role) - Auto-assigned, read-only */}
                                  {shiftRoles.length > 0 && (
                                    <div className="ml-8 space-y-2">
                                      {shiftRoles.map((shiftRoleAssignment) => {
                                        const shiftRole = shiftRoleAssignment.role;

                                        return (
                                          <div
                                            key={shiftRole.id}
                                            className="flex items-center p-2 pl-4 border-l-2 border-muted rounded-r-lg bg-muted/20"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                                <span className="text-xs text-blue-600 dark:text-blue-400">└</span>
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <h5 className="text-sm font-medium">
                                                    {shiftRole.display_name || shiftRole.name}
                                                  </h5>
                                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    Auto-assigned
                                                  </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                  {shiftRole.description || "No description"}
                                                </p>
                                                <p className="text-xs text-muted-foreground italic mt-1">
                                                  Automatically removed when job role is removed
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Other roles (fallback for roles without hierarchy) */}
                            {deptGroup.otherRoles && deptGroup.otherRoles.length > 0 && (
                              <div className="space-y-2">
                                {deptGroup.otherRoles.map((role) => (
                                  <div
                                    key={role.assignment_id || role.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <Shield className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium">
                                          {role.display_name || role.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                          {role.description || "No description"}
                                        </p>
                                      </div>
                                    </div>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700"
                                          disabled={
                                            deleteAssignmentMutation.isPending
                                          }
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Remove Role
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to remove the "
                                            {role.display_name || role.name}" role
                                            from {deptGroup.department.name}?
                                            <br />
                                            <strong>Person:</strong>{" "}
                                            {transformedUser.name} (
                                            {transformedUser.email})
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleRemoveAssignment(
                                                deptGroup.department.id,
                                                role.assignment_id
                                              )
                                            }
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Remove Role
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Permissions</CardTitle>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Permissions from Roles ({userPermissions.length} unique
                      permissions)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Last updated: 10:29:37
                  </span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Permissions
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PERMISSION</TableHead>
                        <TableHead>RESOURCE:ACTION</TableHead>
                        <TableHead>GRANTED BY</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Show message when no permissions exist at all */}
                      {userPermissions.length === 0 &&
                        userDirectPermissions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No permissions assigned to this person.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {/* Role-based permissions */}
                          {userPermissions.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center py-4 text-muted-foreground bg-blue-500/10"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <Shield className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">
                                    No permissions from roles
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            userPermissions.map((permission, index) => (
                              <TableRow key={`role-${index}`}>
                                <TableCell className="font-medium">
                                  {permission.name ||
                                    permission.permission_name}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800"
                                  >
                                    {permission.resource ||
                                      permission.resource_name}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {permission.granted_by || "Role"}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}

                          {/* Custom permissions */}
                          {userDirectPermissions.length > 0 &&
                            userDirectPermissions.map((permission, index) => (
                              <TableRow
                                key={`custom-${permission.id || index}`}
                                className="bg-green-500/5"
                              >
                                <TableCell className="font-medium">
                                  {permission.name ||
                                    permission.permission_name}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-500/10 text-green-600"
                                  >
                                    {permission.resource ||
                                      permission.resource_name}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Leaf className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-700">
                                      Custom Assignment
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        From {userRoles.length} role(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">
                        Custom Permissions (Direct Assignment) (
                        {userDirectPermissions.length} permissions)
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => setIsCustomPermissionModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Permission
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts & Attendance Tab */}
        {canViewAttendance && (
          <TabsContent value="attendance" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Holiday Balance</CardTitle>
                  <CardDescription>Holiday entitlement and usage for this person</CardDescription>
                </CardHeader>
                <CardContent>
                  <HolidayBalanceCard userId={userData?.id} showYearSelector />
                </CardContent>
              </Card>

              {/* Employee job role settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Employee job role settings</CardTitle>
                      <CardDescription>Start date, hours per day and normal working days per job role</CardDescription>
                    </div>
                    {canManageAttendanceSettings && (
                      <Button
                        onClick={() => {
                          setSelectedEmployeeSetting(null);
                          setIsEmployeeSettingsFormOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add settings
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!userData?.id ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : employeeSettingsLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : employeeSettingsList.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <p className="text-sm text-muted-foreground">No job role settings for this person</p>
                      {canManageAttendanceSettings && (
                        <Button
                          onClick={() => {
                            setSelectedEmployeeSetting(null);
                            setIsEmployeeSettingsFormOpen(true);
                          }}
                          className="mt-2"
                          variant="outline"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add settings
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Hours/day</TableHead>
                            <TableHead>Monthly contracted</TableHead>
                            <TableHead>Contract type</TableHead>
                            <TableHead>Working days</TableHead>
                            {canManageAttendanceSettings && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employeeSettingsList.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.job_role?.display_name || s.job_role?.name || s.role?.display_name || s.role?.name || roleById.get(Number(s.job_role_id))?.display_name || roleById.get(Number(s.job_role_id))?.name || s.job_role_id}</TableCell>
                              <TableCell>{s.department?.name || departmentById.get(Number(s.department_id))?.name || s.department_id}</TableCell>
                              <TableCell>{s.start_date ? String(s.start_date).slice(0, 10) : "—"}</TableCell>
                              <TableCell>{s.end_date ? String(s.end_date).slice(0, 10) : "—"}</TableCell>
                              <TableCell>{s.hours_per_day ?? "—"}</TableCell>
                              <TableCell>{s.monthly_contracted_hours != null ? Number(s.monthly_contracted_hours) : "—"}</TableCell>
                              <TableCell>{s.contract_type?.name || (s.contract_type_id != null ? contractTypeById.get(Number(s.contract_type_id))?.name : null) || "—"}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {Array.isArray(s.normal_working_days) ? s.normal_working_days.map((d) => d.slice(0, 2)).join(", ") : "—"}
                              </TableCell>
                              {canManageAttendanceSettings && (
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEmployeeSetting(s);
                                      setIsEmployeeSettingsFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Holiday entitlements */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>Holiday entitlements</CardTitle>
                      <CardDescription>Annual allowance (hours) per job role and holiday year. Used and pending hours are calculated from leave each time you view this.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canManageAttendanceSettings && entitlementsList.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            for (const ent of entitlementsList) {
                              await recalculateHoursMutation.mutateAsync(ent.id ?? ent.slug);
                            }
                          }}
                          disabled={recalculateHoursMutation.isPending}
                        >
                          {recalculateHoursMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                          Recalculate hours from leave
                        </Button>
                      )}
                      {canManageAttendanceSettings && (
                        <Button onClick={() => { setSelectedEntitlement(null); setIsEntitlementFormOpen(true); }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add entitlement
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userData?.id && (
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="space-y-2">
                        <Label>Filter by holiday year</Label>
                        <Select
                          value={
                            entitlementFilterYearId === "all" ||
                            years.some((y) => String(y.id) === entitlementFilterYearId)
                              ? entitlementFilterYearId
                              : "all"
                          }
                          onValueChange={setEntitlementFilterYearId}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All years</SelectItem>
                            {years.map((y) => (
                              <SelectItem key={y.id} value={String(y.id)}>
                                {y.year_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {!userData?.id ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : entitlementsLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : entitlementsList.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <p className="text-sm text-muted-foreground">No holiday entitlements for this person</p>
                      {canManageAttendanceSettings && (
                        <Button onClick={() => { setSelectedEntitlement(null); setIsEntitlementFormOpen(true); }} className="mt-2" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add entitlement
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job role</TableHead>
                            <TableHead>Holiday year</TableHead>
                            <TableHead>Allowance (h)</TableHead>
                            <TableHead>Carried</TableHead>
                            <TableHead>Used</TableHead>
                            <TableHead>Remaining</TableHead>
                            {canManageAttendanceSettings && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entitlementsList.map((ent) => (
                            <TableRow key={ent.id}>
                              <TableCell>{ent.job_role?.display_name || ent.job_role?.name || ent.role?.display_name || ent.role?.name || roleById.get(Number(ent.job_role_id))?.display_name || roleById.get(Number(ent.job_role_id))?.name || ent.job_role_id}</TableCell>
                              <TableCell>{ent.holiday_year?.year_name || ent.holiday_year_id}</TableCell>
                              <TableCell>{ent.annual_allowance_hours ?? "—"}</TableCell>
                              <TableCell>{ent.carried_forward_hours ?? "0"}</TableCell>
                              <TableCell>{ent.used_hours ?? "—"}</TableCell>
                              <TableCell>{ent.remaining_hours ?? "—"}</TableCell>
                              {canManageAttendanceSettings && (
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEntitlement(ent);
                                      setIsEntitlementFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {canManageAttendanceSettings && (
                <Card>
                  <CardHeader>
                    <CardTitle>Leave approval</CardTitle>
                    <CardDescription>
                      Departments this person can approve annual leave for. Empty = all departments. Only applies when they have the Leave Approve permission.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {leaveApproverSelectedIds.length === 0
                        ? "All departments (no restriction)"
                        : `${leaveApproverSelectedIds.length} department(s) selected`}
                    </p>
                    <div className="max-h-[200px] overflow-y-auto rounded-md border p-3 space-y-2">
                      {(departments || []).filter((d) => d.is_active !== false).map((dept) => (
                        <div key={dept.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`leave-approver-dept-${dept.id}`}
                            checked={leaveApproverSelectedIds.includes(dept.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setLeaveApproverSelectedIds((prev) => (prev.includes(dept.id) ? prev : [...prev, dept.id]));
                              } else {
                                setLeaveApproverSelectedIds((prev) => prev.filter((id) => id !== dept.id));
                              }
                            }}
                          />
                          <label htmlFor={`leave-approver-dept-${dept.id}`} className="text-sm cursor-pointer">
                            {dept.name ?? `Department ${dept.id}`}
                          </label>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      disabled={setLeaveApproverDepartmentsMutation.isPending}
                      onClick={async () => {
                        try {
                          await setLeaveApproverDepartmentsMutation.mutateAsync({
                            userId: userData.id,
                            department_ids: leaveApproverSelectedIds,
                          });
                        } catch (_) {
                          // toast handled in hook
                        }
                      }}
                    >
                      {setLeaveApproverDepartmentsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>Approved, pending, and past leave for this person</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaveRequestList
                    userId={userData?.id}
                    showCreateButton={isViewingSelf}
                    compactHeader
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Shift Records</CardTitle>
                  <CardDescription>Forthcoming shifts, attendance, and leave shift records</CardDescription>
                </CardHeader>
                <CardContent>
                  <ShiftRecordList
                    userId={userData?.id}
                    showCreateButton={isViewingSelf}
                    allowUserSelect={false}
                    compactHeader
                  />
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Link href="/admin/attendance">
                  <Button variant="outline" size="sm">
                    View full Attendance & Leave <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <EmployeeSettingsForm
                open={isEmployeeSettingsFormOpen}
                onOpenChange={setIsEmployeeSettingsFormOpen}
                setting={selectedEmployeeSetting}
                preselectedUserId={userData?.id}
              />
              <HolidayEntitlementForm
                open={isEntitlementFormOpen}
                onOpenChange={setIsEntitlementFormOpen}
                entitlement={selectedEntitlement}
                preselectedUserId={userData?.id}
              />
            </div>
          </TabsContent>
        )}

        {/* Account Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Active Status */}
                <div className="relative p-6 border rounded-lg">
                  <div className="absolute top-4 right-4">
                    {transformedUser.isActive ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {transformedUser.isActive ? "Active" : "Inactive"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transformedUser.isActive
                      ? "Person can log in and access the system"
                      : "Person cannot log in to the system"}
                  </p>
                  {transformedUser.isActive ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deactivateUserMutation.isPending}
                        >
                          {deactivateUserMutation.isPending
                            ? "Deactivating..."
                            : "Deactivate"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to deactivate this user? They
                            will not be able to log in to the system.
                            <br />
                            <strong>User:</strong> {transformedUser.name} (
                            {transformedUser.email})
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeactivate}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Deactivate User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={activateUserMutation.isPending}
                        >
                          {activateUserMutation.isPending
                            ? "Activating..."
                            : "Activate"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Activate User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to activate this user? They
                            will be able to log in to the system.
                            <br />
                            <strong>User:</strong> {transformedUser.name} (
                            {transformedUser.email})
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleActivate}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Activate User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Verified Status */}
                <div className="relative p-6 border rounded-lg">
                  <div className="absolute top-4 right-4">
                    {transformedUser.isVerified ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {transformedUser.isVerified ? "Verified" : "Unverified"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transformedUser.isVerified
                      ? "User's email has been verified"
                      : "User's email has not been verified"}
                  </p>
                  {transformedUser.isVerified ? (
                    <Button variant="outline" size="sm" disabled>
                      Verified
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerify}
                      disabled={verifyUserMutation.isPending}
                    >
                      {verifyUserMutation.isPending ? "Verifying..." : "Verify"}
                    </Button>
                  )}
                </div>

                {/* Superuser Status */}
                <div className="relative p-6 border rounded-lg">
                  <div className="absolute top-4 right-4">
                    {transformedUser.isSuperuser ? (
                      <Crown className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {transformedUser.isSuperuser ? "Superuser" : "Regular User"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transformedUser.isSuperuser
                      ? "Has full system access"
                      : "Has standard user access"}
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    {transformedUser.isSuperuser
                      ? "Admin User"
                      : "Regular User"}
                  </Button>
                </div>

                {/* MFA Status */}
                <div className="relative p-6 border rounded-lg">
                  <div className="absolute top-4 right-4">
                    {transformedUser.mfaEnabled ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {transformedUser.mfaEnabled ? "MFA Enabled" : "MFA Not Enabled"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transformedUser.mfaEnabled
                      ? "User has set up multi-factor authentication."
                      : "User can log in without MFA unless policy requires it."}
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    {transformedUser.mfaEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      User ID
                    </Label>
                    <p className="text-lg font-mono">{transformedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </Label>
                    <p className="text-lg">{transformedUser.updatedAt}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </Label>
                    <p className="text-lg">{transformedUser.createdAt}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Last Login
                    </Label>
                    <p className="text-lg">{transformedUser.lastLogin}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Access</CardTitle>
              <CardDescription>
                Manually set a password when email reset is unavailable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setManualResetPassword("");
                  setManualResetPasswordConfirm("");
                  setManualResetPasswordError("");
                  setIsResetPasswordDialogOpen(true);
                }}
              >
                <Key className="h-4 w-4" />
                Set Password Manually
              </Button>
            </CardContent>
          </Card>

          <Dialog
            open={isResetPasswordDialogOpen}
            onOpenChange={(open) => {
              setIsResetPasswordDialogOpen(open);
              if (!open) setManualResetPasswordError("");
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Set Password Manually
                </DialogTitle>
                <DialogDescription>
                  User: <strong>{transformedUser.name}</strong>
                  {transformedUser.email ? ` (${transformedUser.email})` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="user-detail-manual-password">New password</Label>
                  <Input
                    id="user-detail-manual-password"
                    type="password"
                    value={manualResetPassword}
                    onChange={(e) => {
                      setManualResetPassword(e.target.value);
                      if (manualResetPasswordError) setManualResetPasswordError("");
                    }}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-detail-manual-password-confirm">Confirm new password</Label>
                  <Input
                    id="user-detail-manual-password-confirm"
                    type="password"
                    value={manualResetPasswordConfirm}
                    onChange={(e) => {
                      setManualResetPasswordConfirm(e.target.value);
                      if (manualResetPasswordError) setManualResetPasswordError("");
                    }}
                    placeholder="Re-enter new password"
                  />
                </div>
                {manualResetPasswordError ? (
                  <p className="text-sm text-red-600">{manualResetPasswordError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Password must satisfy the system password policy.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleManualResetPassword}
                  disabled={resetUserPasswordMutation.isPending}
                >
                  {resetUserPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Set Password
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Danger Zone */}
          <Card className="bg-red-500/5 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Permanent actions that cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2"
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteUserMutation.isPending
                        ? "Deleting..."
                        : "Delete Person Account"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete Person Account
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this person account?
                        This action cannot be undone and will permanently remove
                        the person from the system.
                        <br />
                        <strong>Person:</strong> {transformedUser.name} (
                        {transformedUser.email})
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Person Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Tabs value={complianceSubTab} onValueChange={setComplianceSubTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-1">
              <TabsTrigger value="additional" className="whitespace-normal text-center px-2 py-2 text-xs sm:text-sm">
                My Information
              </TabsTrigger>
              <TabsTrigger value="compliance" className="whitespace-normal text-center px-2 py-2 text-xs sm:text-sm">
                My Compliance
              </TabsTrigger>
              <TabsTrigger value="personnel" className="whitespace-normal text-center px-2 py-2 text-xs sm:text-sm">
                Personnel File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compliance" className="space-y-6">
              <ComplianceSection
                entityType="user"
                entitySlug={actualUserSlug}
                roleSlug={null}
                availableRoles={userRoles}
                isAdmin={true}
                canUpload={true}
              />
            </TabsContent>

            <TabsContent value="additional" className="space-y-6">
              {customFieldsHierarchyLoading ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading custom fields...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : customFieldsHierarchy?.sections && 
                customFieldsHierarchy.sections.filter(section => section.is_active !== false).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      My Information
                    </CardTitle>
                    <CardDescription>
                      View and manage information for this user
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const activeSections = (customFieldsHierarchy.sections || [])
                        .filter(section => section.is_active !== false)
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                      
                      if (activeSections.length === 0) {
                        return null;
                      }
                      
                      // If only one section, don't show tabs - just render it
                      if (activeSections.length === 1) {
                        const section = activeSections[0];
                        return (
                          <div className="space-y-6">
                            {(() => {
                              const allFields = (section.fields || [])
                                .filter(field => field.is_active !== false)
                                .filter(field => !complianceFieldsMap.has(field.id));

                              if (allFields.length === 0) {
                                return (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No fields in this section
                                  </div>
                                );
                              }

                              const allFieldsMap = allSectionsFieldsMap;
                              const relatedFieldsGroups = new Map();
                              const standaloneFields = [];
                              const fieldsInGroups = new Set();
                              
                              allFields.forEach((field) => {
                                const relationshipConfig = field.relationship_config;
                                if (relationshipConfig && relationshipConfig.target_field_id) {
                                  const targetFieldId = relationshipConfig.target_field_id;
                                  const parentField = allFieldsMap.get(targetFieldId);
                                  
                                  if (!relatedFieldsGroups.has(targetFieldId)) {
                                    relatedFieldsGroups.set(targetFieldId, {
                                      parentField: parentField || null,
                                      relatedFields: []
                                    });
                                  }
                                  relatedFieldsGroups.get(targetFieldId).relatedFields.push(field);
                                  fieldsInGroups.add(field.id);
                                  
                                  if (parentField) {
                                    if (!relatedFieldsGroups.get(targetFieldId).parentField) {
                                      relatedFieldsGroups.get(targetFieldId).parentField = parentField;
                                    }
                                    fieldsInGroups.add(parentField.id);
                                  }
                                }
                              });
                              
                              allFields.forEach((field) => {
                                const isParent = Array.from(allFieldsMap.values()).some(f => 
                                  f.relationship_config?.target_field_id === field.id
                                );
                                if (isParent) {
                                  if (!relatedFieldsGroups.has(field.id)) {
                                    relatedFieldsGroups.set(field.id, {
                                      parentField: field,
                                      relatedFields: []
                                    });
                                  } else {
                                    relatedFieldsGroups.get(field.id).parentField = field;
                                  }
                                  fieldsInGroups.add(field.id);
                                }
                              });
                              
                              allFields.forEach((field) => {
                                if (!fieldsInGroups.has(field.id)) {
                                  standaloneFields.push(field);
                                }
                              });

                              return (
                                <div className="space-y-4">
                                  {section.section_description && (
                                    <p className="text-sm text-muted-foreground">
                                      {section.section_description}
                                    </p>
                                  )}
                                  
                                  {standaloneFields.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {standaloneFields.map((field) => {
                                        const isReadOnly = field.is_editable === false || field.isEditable === false;
                                        return (
                                        <div key={field.id} className={cn("space-y-2", isReadOnly && "opacity-90 pointer-events-none select-none")}>
                                          <div className="flex items-center gap-2">
                                            <Label className="text-sm font-medium">
                                              {field.field_label || field.field_name || field.name}
                                              {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                            </Label>
                                            {isReadOnly && <span className="text-xs text-muted-foreground">(read-only)</span>}
                                            {field.slug && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 cursor-pointer"
                                                onClick={() => handleViewHistory(field)}
                                                title="View history"
                                              >
                                                <Clock className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                              </Button>
                                            )}
                                          </div>
                                          <CustomFieldRenderer
                                            field={field}
                                            value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                            onChange={handleCustomFieldChange}
                                            error={customFieldsErrors[field.id]}
                                            hideLabel={true}
                                            readOnly={isReadOnly}
                                          />
                                        </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {Array.from(relatedFieldsGroups.entries()).map(([targetFieldId, group]) => {
                                    const { parentField, relatedFields } = group;
                                    
                                    if (!parentField && relatedFields.length === 0) {
                                      return null;
                                    }
                                    
                                    const allGroupFields = parentField 
                                      ? [parentField, ...relatedFields]
                                      : relatedFields;
                                    
                                    const groupTitle = parentField 
                                      ? (parentField.field_label || parentField.field_name || "Related Fields")
                                      : "Related Fields";
                                    
                                    return (
                                      <div 
                                        key={`related-group-${targetFieldId}`} 
                                        className="mt-6 space-y-4 border-2 border-primary/20 rounded-lg p-6 bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm"
                                      >
                                        <div className="border-b border-primary/10 pb-3 mb-4">
                                          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                                            {groupTitle}
                                            {relatedFields.length > 0 && (
                                              <span className="text-xs font-normal text-muted-foreground ml-2">
                                                ({allGroupFields.length} {allGroupFields.length === 1 ? 'field' : 'fields'})
                                              </span>
                                            )}
                                          </h4>
                                        </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {allGroupFields.map((field) => {
                                              const isReadOnly = field.is_editable === false || field.isEditable === false;
                                              return (
                                              <div key={field.id} className={cn("space-y-2", isReadOnly && "opacity-90 pointer-events-none select-none")}>
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-sm font-medium">
                                                    {field.field_label || field.field_name || field.name}
                                                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                                  </Label>
                                                  {isReadOnly && <span className="text-xs text-muted-foreground">(read-only)</span>}
                                                  {field.slug && (
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-6 w-6 p-0 cursor-pointer"
                                                      onClick={() => handleViewHistory(field)}
                                                      title="View history"
                                                    >
                                                      <Clock className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                    </Button>
                                                  )}
                                                </div>
                                                <CustomFieldRenderer
                                                  field={field}
                                                  value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                                  onChange={handleCustomFieldChange}
                                                  error={customFieldsErrors[field.id]}
                                                  hideLabel={true}
                                                  readOnly={isReadOnly}
                                                />
                                              </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                      }
                      
                      // Multiple sections - show ribbon navigation
                      const currentSectionIndex = activeSections.findIndex(s => s.id.toString() === activeSectionTab);
                      const hasPrevious = currentSectionIndex > 0;
                      const hasNext = currentSectionIndex < activeSections.length - 1;
                      
                      const handlePrevious = () => {
                        if (hasPrevious) {
                          setActiveSectionTab(activeSections[currentSectionIndex - 1].id.toString());
                        }
                      };
                      
                      const handleNext = () => {
                        if (hasNext) {
                          setActiveSectionTab(activeSections[currentSectionIndex + 1].id.toString());
                        }
                      };
                      
                      return (
                        <Tabs value={activeSectionTab || undefined} onValueChange={setActiveSectionTab} className="space-y-6">
                          <div className="flex items-center gap-2">
                            {/* Scrollable Tabs Container */}
                            <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                              <TabsList className="inline-flex min-w-max w-full">
                                {activeSections.map((section) => (
                                  <TabsTrigger 
                                    key={section.id} 
                                    value={section.id.toString()}
                                    className="text-sm whitespace-nowrap flex-shrink-0"
                                  >
                                    {section.section_name}
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                            </div>
                            
                            {/* Navigation Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handlePrevious}
                                disabled={!hasPrevious}
                                className="flex items-center gap-1"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Previous</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleNext}
                                disabled={!hasNext}
                                className="flex items-center gap-1"
                              >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {activeSections.map((section) => (
                            <TabsContent key={section.id} value={section.id.toString()} className="space-y-6 mt-6">
                              {section.section_description && (
                                <p className="text-sm text-muted-foreground">
                                  {section.section_description}
                                </p>
                              )}
                              
                              {(() => {
                                const allFields = (section.fields || [])
                                  .filter(field => field.is_active !== false)
                                  .filter(field => !complianceFieldsMap.has(field.id));

                                if (allFields.length === 0) {
                                  return (
                                    <div className="text-center py-8 text-muted-foreground">
                                      No fields in this section
                                    </div>
                                  );
                                }

                                const allFieldsMap = allSectionsFieldsMap;
                                const relatedFieldsGroups = new Map();
                                const standaloneFields = [];
                                const fieldsInGroups = new Set();
                                
                                allFields.forEach((field) => {
                                  const relationshipConfig = field.relationship_config;
                                  if (relationshipConfig && relationshipConfig.target_field_id) {
                                    const targetFieldId = relationshipConfig.target_field_id;
                                    const parentField = allFieldsMap.get(targetFieldId);
                                    
                                    if (!relatedFieldsGroups.has(targetFieldId)) {
                                      relatedFieldsGroups.set(targetFieldId, {
                                        parentField: parentField || null,
                                        relatedFields: []
                                      });
                                    }
                                    relatedFieldsGroups.get(targetFieldId).relatedFields.push(field);
                                    fieldsInGroups.add(field.id);
                                    
                                    if (parentField) {
                                      if (!relatedFieldsGroups.get(targetFieldId).parentField) {
                                        relatedFieldsGroups.get(targetFieldId).parentField = parentField;
                                      }
                                      fieldsInGroups.add(parentField.id);
                                    }
                                  }
                                });
                                
                                allFields.forEach((field) => {
                                  const isParent = Array.from(allFieldsMap.values()).some(f => 
                                    f.relationship_config?.target_field_id === field.id
                                  );
                                  if (isParent) {
                                    if (!relatedFieldsGroups.has(field.id)) {
                                      relatedFieldsGroups.set(field.id, {
                                        parentField: field,
                                        relatedFields: []
                                      });
                                    } else {
                                      relatedFieldsGroups.get(field.id).parentField = field;
                                    }
                                    fieldsInGroups.add(field.id);
                                  }
                                });
                                
                                allFields.forEach((field) => {
                                  if (!fieldsInGroups.has(field.id)) {
                                    standaloneFields.push(field);
                                  }
                                });

                                return (
                                  <div className="space-y-4">
                                    {standaloneFields.length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {standaloneFields.map((field) => {
                                          const isReadOnly = field.is_editable === false || field.isEditable === false;
                                          return (
                                          <div key={field.id} className={cn("space-y-2", isReadOnly && "opacity-90 pointer-events-none select-none")}>
                                            <div className="flex items-center gap-2">
                                              <Label className="text-sm font-medium">
                                                {field.field_label || field.field_name || field.name}
                                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                              </Label>
                                              {isReadOnly && <span className="text-xs text-muted-foreground">(read-only)</span>}
                                              {field.slug && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0 cursor-pointer"
                                                  onClick={() => handleViewHistory(field)}
                                                  title="View history"
                                                >
                                                  <Clock className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                </Button>
                                              )}
                                            </div>
                                            <CustomFieldRenderer
                                              field={field}
                                              value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                              onChange={handleCustomFieldChange}
                                              error={customFieldsErrors[field.id]}
                                              hideLabel={true}
                                              readOnly={isReadOnly}
                                            />
                                          </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {Array.from(relatedFieldsGroups.entries()).map(([targetFieldId, group]) => {
                                      const { parentField, relatedFields } = group;
                                      
                                      if (!parentField && relatedFields.length === 0) {
                                        return null;
                                      }
                                      
                                      const allGroupFields = parentField 
                                        ? [parentField, ...relatedFields]
                                        : relatedFields;
                                      
                                      const groupTitle = parentField 
                                        ? (parentField.field_label || parentField.field_name || "Related Fields")
                                        : "Related Fields";
                                      
                                      return (
                                        <div 
                                          key={`related-group-${targetFieldId}`} 
                                          className="mt-6 space-y-4 border-2 border-primary/20 rounded-lg p-6 bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm"
                                        >
                                          <div className="border-b border-primary/10 pb-3 mb-4">
                                            <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                                              {groupTitle}
                                              {relatedFields.length > 0 && (
                                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                                  ({allGroupFields.length} {allGroupFields.length === 1 ? 'field' : 'fields'})
                                                </span>
                                              )}
                                            </h4>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {allGroupFields.map((field) => {
                                              const isReadOnly = field.is_editable === false || field.isEditable === false;
                                              return (
                                              <div key={field.id} className={cn("space-y-2", isReadOnly && "opacity-90 pointer-events-none select-none")}>
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-sm font-medium">
                                                    {field.field_label || field.field_name || field.name}
                                                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                                  </Label>
                                                  {isReadOnly && <span className="text-xs text-muted-foreground">(read-only)</span>}
                                                  {field.slug && (
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-6 w-6 p-0 cursor-pointer"
                                                      onClick={() => handleViewHistory(field)}
                                                      title="View history"
                                                    >
                                                      <Clock className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                    </Button>
                                                  )}
                                                </div>
                                                <CustomFieldRenderer
                                                  field={field}
                                                  value={customFieldsData[field.id] !== undefined ? customFieldsData[field.id] : (field.field_type?.toLowerCase() === 'file' ? null : '')}
                                                  onChange={handleCustomFieldChange}
                                                  error={customFieldsErrors[field.id]}
                                                  hideLabel={true}
                                                  readOnly={isReadOnly}
                                                />
                                              </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </TabsContent>
                          ))}
                        </Tabs>
                      );
                    })()}
                    
                    {/* Save Changes Button - Always visible at the bottom */}
                    <div className="flex justify-between items-center pt-6 mt-6 border-t">
                      <div className="text-sm text-muted-foreground">
                        {hasCustomFieldsChanges && (
                          <span className="text-amber-600 dark:text-amber-400">
                            You have unsaved changes
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={handleCustomFieldsBulkUpdate}
                        disabled={isUpdatingCustomFields || !hasCustomFieldsChanges}
                        variant={hasCustomFieldsChanges ? "default" : "outline"}
                      >
                        {isUpdatingCustomFields ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {hasCustomFieldsChanges ? "Save Changes" : "Save Custom Fields"}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      No additional information fields configured
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="personnel" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Personnel File
                      </CardTitle>
                      <CardDescription>
                        Store HR documents for this person, such as reviews, grievances, and disciplinary records.
                      </CardDescription>
                    </div>
                    {canManagePersonnelDocuments && (
                      <div className="flex w-full sm:w-auto flex-wrap justify-end gap-2 min-w-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto max-w-full shrink-0 whitespace-normal text-center"
                          onClick={() => setIsManagePersonnelCategoriesOpen(true)}
                        >
                          Manage Categories
                        </Button>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto max-w-full shrink-0 whitespace-normal text-center"
                          onClick={() => setIsPersonnelDocDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Document
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {personnelDocsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : personnelDocuments.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground space-y-3">
                      <FileText className="h-10 w-10 mx-auto opacity-50" />
                      <p className="text-sm">
                        No documents have been added to this person&apos;s personnel file yet.
                      </p>
                      {canManagePersonnelDocuments && (
                        <div className="flex w-full flex-wrap items-stretch sm:items-center justify-center gap-2 min-w-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto max-w-full shrink-0 whitespace-normal text-center"
                            onClick={() => setIsManagePersonnelCategoriesOpen(true)}
                          >
                            Manage Categories
                          </Button>
                          <Button
                            size="sm"
                            className="w-full sm:w-auto max-w-full shrink-0 whitespace-normal text-center"
                            onClick={() => setIsPersonnelDocDialogOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add first document
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Views</TableHead>
                              <TableHead>Last Updated</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {personnelDocuments.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {doc.title}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {personnelCategoryNameById.get(doc.category_id) ||
                                      (doc.category_id ? `Category ${doc.category_id}` : "N/A")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.status || "published"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {doc.access_count || 0}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {doc.updated_at
                                    ? formatDistanceToNow(parseUTCDate(doc.updated_at), {
                                        addSuffix: true,
                                      })
                                    : "N/A"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(`/documents/${doc.slug || doc.id}`)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Open a document to upload files and view detailed access history. All actions are audited.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Dialog open={isPersonnelDocDialogOpen} onOpenChange={setIsPersonnelDocDialogOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add document to personnel file</DialogTitle>
                    <DialogDescription>
                      Create a private HR document for this person. Files can be attached after saving the document.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreatePersonnelDocument}>
                    <div className="space-y-2">
                      <Label htmlFor="personnel-category">Category</Label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Select
                          value={personnelCategoryId ? String(personnelCategoryId) : ""}
                          onValueChange={(value) => setPersonnelCategoryId(Number(value))}
                        >
                          <SelectTrigger id="personnel-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {!personnelRootCategory ? (
                              <SelectItem value="none" disabled>
                                Create "Personnel File" category set first
                              </SelectItem>
                            ) : personnelFlatCategories.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No categories available
                              </SelectItem>
                            ) : (
                              personnelFlatCategories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                  {cat.displayName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto sm:shrink-0 max-w-full whitespace-normal text-center"
                          onClick={() => setIsManagePersonnelCategoriesOpen(true)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="personnel-title">Title</Label>
                      <Input
                        id="personnel-title"
                        value={personnelTitle}
                        onChange={(e) => setPersonnelTitle(e.target.value)}
                        placeholder="e.g. Performance Review 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="personnel-description">Content / notes (optional)</Label>
                      <RichTextEditor
                        value={personnelDescription}
                        onChange={(html) => setPersonnelDescription(html)}
                        placeholder="Enter the details for this document..."
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsPersonnelDocDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          !personnelUserId ||
                          !personnelCategoryId ||
                          !personnelTitle.trim() ||
                          createPersonnelDocument.isPending
                        }
                      >
                        {createPersonnelDocument.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <PersonnelCategoryManagerDialog
                open={isManagePersonnelCategoriesOpen}
                onOpenChange={setIsManagePersonnelCategoriesOpen}
                personnelRootCategory={personnelRootCategory}
                personnelFlatCategories={personnelFlatCategories}
                onCreateRoot={handleCreatePersonnelRootCategory}
                onCreateChild={handleCreatePersonnelChildCategory}
                onDeleteCategory={handleDeletePersonnelCategory}
                isCreating={createDocumentCategoryMutation.isPending}
                isDeleting={deleteDocumentCategoryMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Tasks Tab - tasks assigned to this person */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks for this person</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View all tasks assigned to this person, with due dates and quick access to task details.
              </p>
            </CardHeader>
            <CardContent>
              <TasksForUser userSlug={actualUserSlug} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab - person-specific notes, comments & files (separate from Personnel File) */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes, Comments & Files</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Use this space for general notes and discussions about this person. Files here are attached to the note thread,
                not to the personnel file.
              </p>
            </CardHeader>
            <CardContent>
              <CommentThread
                entityType="user"
                entitySlug={actualUserSlug}
                className="max-w-3xl"
                noteCategories={[]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity History Tab */}
        <TabsContent value="activity" className="space-y-6">
          <UserAuditLogs userSlug={actualUserSlug} userId={userData?.id} title="User Activity History" pageSize={10} />
        </TabsContent>
      </Tabs>

      {/* History Modal */}
      {selectedHistoryField && (
        <ComplianceHistory
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
          field={selectedHistoryField}
          history={historyData?.history || (Array.isArray(historyData) ? historyData : [])}
          isLoading={historyLoading}
          onDownload={handleDownloadHistoryFile}
          isAdmin={true}
        />
      )}
      
      {/* Show error toast if history fetch fails */}
      {historyError && historyModalOpen && (
        <div className="hidden">
          {toast.error("Failed to load field history", {
            description: historyError.message || "Could not retrieve history for this field. It may not have any history yet.",
          })}
        </div>
      )}

      {/* Custom Permission Modal */}
      <Dialog
        open={isCustomPermissionModalOpen}
        onOpenChange={setIsCustomPermissionModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Assign Custom Permission
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchPermissionTerm}
              onChange={(e) => setSearchPermissionTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Permissions List */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {permissionsLoading || currentUserLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                Loading permissions...
              </div>
            ) : (
              <>
                {/* Assigned Direct Permissions Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-semibold text-green-700">
                      Currently Assigned Direct Permissions (
                      {filteredAssignedPermissions.length})
                    </h3>
                  </div>
                  {editedUserHasWildcardPermissions.directPermissions ? (
                    <div className="border rounded-lg bg-yellow-50/50 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Wildcard Permissions
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        This person has wildcard direct permissions (*) - they
                        have access to all permissions directly.
                      </p>
                    </div>
                  ) : filteredAssignedPermissions.length > 0 ? (
                    <div className="border rounded-lg bg-green-50/50">
                      {filteredAssignedPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-green-50/80"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {permission.permission}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                {permission.resource}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700"
                              >
                                {permission.action}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {permission.resource}:{permission.action}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() =>
                                handleRemoveCustomPermission(permission.id)
                              }
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg bg-green-50/30 p-4 text-center text-sm text-muted-foreground">
                      No direct permissions assigned. All permissions are from
                      roles.
                    </div>
                  )}
                </div>

                {/* Available Permissions Section */}
                {!editedUserHasWildcardPermissions.rolePermissions &&
                  !editedUserHasWildcardPermissions.directPermissions &&
                  (filteredAvailablePermissions.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <Plus className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-700">
                          Available to Assign (
                          {filteredAvailablePermissions.length})
                        </h3>
                      </div>
                      <div className="border rounded-lg">
                        {filteredAvailablePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium">
                                {permission.permission}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  {permission.resource}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-100 text-gray-700"
                                >
                                  {permission.action}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {permission.resource}:{permission.action}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddCustomPermission(permission.id)
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <Plus className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-700">
                          Available to Assign (0)
                        </h3>
                      </div>
                      <div className="border rounded-lg bg-blue-50/30 p-4 text-center text-sm text-muted-foreground">
                        No additional permissions available to assign. All
                        permissions are already available through roles.
                      </div>
                    </div>
                  ))}

                {/* Wildcard Role Permissions Message */}
                {editedUserHasWildcardPermissions.rolePermissions && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <h3 className="text-sm font-semibold text-yellow-700">
                        Role Permissions
                      </h3>
                    </div>
                    <div className="border rounded-lg bg-yellow-50/50 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Wildcard Role Permissions
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        This person has wildcard role permissions (*) - they
                        have access to all permissions through their roles.
                      </p>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredAssignedPermissions.length === 0 &&
                  filteredAvailablePermissions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground border rounded-lg">
                      {currentUserPermissionIds.length === 0 ? (
                        <div className="space-y-2">
                          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="font-medium">No Permission to Assign</p>
                          <p className="text-sm">
                            You don't have permission to assign any permissions
                            to people.
                          </p>
                        </div>
                      ) : (
                        "No permissions found matching your search."
                      )}
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">
                  About Direct Permissions
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  Direct permissions are assigned directly to the person,
                  independent of their roles. They provide granular access
                  control for specific use cases.
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Permissions already assigned through
                  roles are not shown here to prevent conflicts. Only
                  permissions not available through the person's current roles
                  can be assigned directly.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCustomPermissionModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Department Modal */}
      <Dialog
        open={isAssignDepartmentModalOpen}
        onOpenChange={setIsAssignDepartmentModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Department & Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={(value) => {
                  setSelectedDepartmentId(value);
                  setSelectedRoleForDepartment(""); // Reset role when department changes
                }}
                disabled={
                  departmentsLoading || createAssignmentMutation.isPending
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name} {dept.code && `(${dept.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRoleForDepartment}
                onValueChange={setSelectedRoleForDepartment}
                disabled={
                  !selectedDepartmentId ||
                  rolesLoading ||
                  createAssignmentMutation.isPending
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {rolesForAssignDepartmentModal.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {getRoleDisplayLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDepartmentModalOpen(false);
                setSelectedDepartmentId("");
                setSelectedRoleForDepartment("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignDepartment}
              disabled={
                !selectedDepartmentId ||
                !selectedRoleForDepartment ||
                createAssignmentMutation.isPending
              }
            >
              {createAssignmentMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role to Department Modal */}
      <Dialog
        open={isAddRoleToDepartmentModalOpen}
        onOpenChange={setIsAddRoleToDepartmentModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Role to {transformedUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRoleForDepartment}
                onValueChange={setSelectedRoleForDepartment}
                disabled={
                  !selectedDepartmentForRole ||
                  rolesLoading ||
                  createAssignmentMutation.isPending
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedDepartmentForRole &&
                    getAvailableRolesForDepartment(
                      selectedDepartmentForRole.department.id
                    ).map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {getRoleDisplayLabel(role)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRoleToDepartmentModalOpen(false);
                setSelectedDepartmentForRole(null);
                setSelectedRoleForDepartment("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRoleToDepartment}
              disabled={
                !selectedDepartmentForRole ||
                !selectedRoleForDepartment ||
                createAssignmentMutation.isPending
              }
            >
              {createAssignmentMutation.isPending ? "Adding..." : "Add Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default UserEditPage;

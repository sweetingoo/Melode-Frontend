"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  userUtils,
} from "@/hooks/useUsers";
import { useRolesAll } from "@/hooks/useRoles";
import { usePermissions } from "@/hooks/usePermissions";
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
import { AvatarWithUrl } from "@/components/AvatarWithUrl";
import EntityCustomFieldsForm from "@/components/EntityCustomFieldsForm";
import CustomFieldRenderer from "@/components/CustomFieldRenderer";
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
  useHolidayEntitlements,
  useHolidayYears,
  useRecalculateHolidayEntitlementHours,
} from "@/hooks/useAttendance";
import { filesService } from "@/services/files";

const UserEditPage = () => {
  const params = useParams();
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
  const entitlementParams = {
    user_id: userData?.id,
    ...(entitlementFilterYearId && entitlementFilterYearId !== "all" ? { holiday_year_id: parseInt(entitlementFilterYearId, 10) } : {}),
  };
  const { data: entitlementsData, isLoading: entitlementsLoading } = useHolidayEntitlements(entitlementParams, {
    enabled: !!userData?.id,
  });
  const entitlementsList = Array.isArray(entitlementsData) ? entitlementsData : (entitlementsData ?? []);
  const recalculateHoursMutation = useRecalculateHolidayEntitlementHours();

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

  const handleCustomFieldChange = (fieldId, value) => {
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

      // Prepare updates array - only include fields that have actually changed
      const updates = Object.entries(customFieldsData)
        .filter(([fieldId, currentValue]) => {
          const fieldIdInt = parseInt(fieldId);
          // Only include fields that are in the hierarchy and have slugs
          if (!fieldIdToSlugMap.has(fieldIdInt)) {
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

      // Find superuser role from rolesData if available
      const superuserRole = rolesData?.find(
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

  const availableRoles = React.useMemo(() => {
    if (!rolesData) return [];
    // All job roles (including those with a parent, e.g. Service lead in Gastro) can be assigned to a department
    return rolesData.filter(
      (role) =>
        role.role_type !== "shift_role" &&
        role.roleType !== "shift_role"
    );
  }, [rolesData]);

  // Get all permissions from API
  const { data: allPermissionsData, isLoading: permissionsLoading } =
    usePermissions();

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

  const handleSave = async () => {
    if (!transformedUser || !actualUserSlug) {
      toast.error("Cannot save: User data not loaded");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        slug: actualUserSlug,
        userData: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          title: formData.title,
          phone_number: formData.phoneNumber,
          avatar_url: formData.avatarUrl,
          bio: formData.bio,
        },
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

  // Roles available in the Assign Department modal: only roles that belong to the selected department (or system roles with no department)
  const rolesForAssignDepartmentModal = React.useMemo(() => {
    if (!selectedDepartmentId || !availableRoles.length) return [];
    const deptId = parseInt(selectedDepartmentId, 10);
    return availableRoles.filter((role) => {
      const roleDeptId = role.department_id ?? role.departmentId ?? role.department?.id;
      return roleDeptId === deptId || roleDeptId == null;
    });
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

    // Filter to roles that belong to this department (or system roles), exclude shift roles and already assigned
    const deptIdNum = typeof departmentId === "string" ? parseInt(departmentId, 10) : departmentId;
    return availableRoles.filter(
      (role) => {
        const roleDeptId = role.department_id ?? role.departmentId ?? role.department?.id;
        const belongsToDepartment = roleDeptId === deptIdNum || roleDeptId == null;
        return (
          belongsToDepartment &&
          !assignedRoleIds.has(role.id) &&
          role.role_type !== "shift_role" &&
          role.roleType !== "shift_role"
        );
      }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {transformedUser?.name || transformedUser?.email || "Loading..."}
            </h1>
            <p className="text-muted-foreground mt-1">Manage Person</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="flex items-center gap-2"
          disabled={updateUserMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide">
            <TabsList className={cn("inline-flex w-auto flex-nowrap gap-1 sm:gap-0 lg:grid lg:w-full", canViewAttendance ? "lg:grid-cols-6" : "lg:grid-cols-5")}>
            <TabsTrigger value="basic" className="flex items-center gap-2 whitespace-nowrap">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Basic Information</span>
              <span className="sm:hidden">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles & Permissions</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2 whitespace-nowrap">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Information</span>
              <span className="sm:hidden">Information</span>
            </TabsTrigger>
            {canViewAttendance && (
              <TabsTrigger value="attendance" className="flex items-center gap-2 whitespace-nowrap">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Shifts & Attendance</span>
                <span className="sm:hidden">Attendance</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="status" className="flex items-center gap-2 whitespace-nowrap">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Account Status</span>
              <span className="sm:hidden">Status</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 whitespace-nowrap">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Activity History</span>
              <span className="sm:hidden">Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Person Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
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
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        handleInputChange("avatarUrl", e.target.value)
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

                {/* Right Column */}
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
                  <HolidayBalanceCard userId={userData?.id} />
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
                            <TableHead>Working days</TableHead>
                            {canManageAttendanceSettings && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employeeSettingsList.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.job_role?.display_name || s.job_role?.name || s.role?.display_name || s.role?.name || s.job_role_id}</TableCell>
                              <TableCell>{s.department?.name || s.department_id}</TableCell>
                              <TableCell>{s.start_date ? String(s.start_date).slice(0, 10) : "—"}</TableCell>
                              <TableCell>{s.end_date ? String(s.end_date).slice(0, 10) : "—"}</TableCell>
                              <TableCell>{s.hours_per_day ?? "—"}</TableCell>
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
                        <Select value={entitlementFilterYearId} onValueChange={setEntitlementFilterYearId}>
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
                              <TableCell>{ent.job_role?.display_name || ent.job_role?.name || ent.role?.display_name || ent.role?.name || ent.job_role_id}</TableCell>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <TabsList>
              <TabsTrigger value="additional">My Information</TabsTrigger>
              <TabsTrigger value="compliance">My Compliance</TabsTrigger>
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
                                      {standaloneFields.map((field) => (
                                        <div key={field.id} className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Label className="text-sm font-medium">
                                              {field.field_label || field.field_name || field.name}
                                              {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                            </Label>
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
                                          />
                                        </div>
                                      ))}
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
                                          {allGroupFields.map((field) => (
                                            <div key={field.id} className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <Label className="text-sm font-medium">
                                                  {field.field_label || field.field_name || field.name}
                                                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                                </Label>
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
                                              />
                                            </div>
                                          ))}
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
                                        {standaloneFields.map((field) => (
                                          <div key={field.id} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Label className="text-sm font-medium">
                                                {field.field_label || field.field_name || field.name}
                                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                              </Label>
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
                                            />
                                          </div>
                                        ))}
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
                                            {allGroupFields.map((field) => (
                                              <div key={field.id} className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Label className="text-sm font-medium">
                                                    {field.field_label || field.field_name || field.name}
                                                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                                  </Label>
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
                                                />
                                              </div>
                                            ))}
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
          </Tabs>
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
                      {role.display_name || role.name} -{" "}
                      {role.description || "No description"}
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
              Add Role to {selectedDepartmentForRole?.department.name}
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
                        {role.display_name || role.name} -{" "}
                        {role.description || "No description"}
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

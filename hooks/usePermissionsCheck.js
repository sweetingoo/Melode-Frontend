import { useMemo, useCallback } from "react";
import { useCurrentUser } from "@/hooks/useAuth";

/**
 * Custom hook for checking user permissions
 * Provides a consistent way to check permissions across the application
 * 
 * @returns {Object} Permission checking utilities
 */
export const usePermissionsCheck = () => {
  const { data: currentUserData } = useCurrentUser();
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions = currentUserData?.direct_permissions || [];

  // Extract permission names
  const userPermissionNames = useMemo(() => {
    const allPermissions = [...currentUserPermissions, ...currentUserDirectPermissions];
    return allPermissions.map((p) => {
      if (typeof p === "string") return p;
      if (typeof p === "object") {
        return p.permission || p.name || p.permission_id || p.id || "";
      }
      return String(p);
    }).filter(Boolean);
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Check if user has wildcard permissions
  const hasWildcardPermissions = useMemo(() => {
    return userPermissionNames.includes("*");
  }, [userPermissionNames]);

  // Permission check helper
  const hasPermission = useCallback((permission) => {
    if (hasWildcardPermissions) return true;
    if (!permission) return false;

    return userPermissionNames.some((perm) => {
      if (perm === permission) return true;

      // Resource match (e.g., task:create matches tasks:create)
      const permResource = perm.split(":")[0];
      const checkResource = permission.split(":")[0];

      if (
        permResource === checkResource ||
        permResource === checkResource + "s" ||
        permResource + "s" === checkResource
      ) {
        return true;
      }

      // Check if permission contains the resource
      return perm.includes(checkResource);
    });
  }, [userPermissionNames, hasWildcardPermissions]);

  // Check multiple permissions (OR logic - returns true if any permission matches)
  const hasAnyPermission = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some((perm) => hasPermission(perm));
  }, [hasPermission]);

  // Check multiple permissions (AND logic - returns true if all permissions match)
  const hasAllPermissions = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every((perm) => hasPermission(perm));
  }, [hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasWildcardPermissions,
    userPermissionNames,
    isSuperuser: currentUserData?.is_superuser || false,
  };
};









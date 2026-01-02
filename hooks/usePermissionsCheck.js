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

  // Extract permissions from roles if top-level permissions array is empty
  const currentUserPermissions = useMemo(() => {
    if (!currentUserData) return [];

    // If top-level permissions exist, use them
    if (currentUserData.permissions && currentUserData.permissions.length > 0) {
      return currentUserData.permissions;
    }

    // Otherwise, extract from roles
    if (currentUserData.roles && Array.isArray(currentUserData.roles)) {
      const allRolePermissions = [];
      currentUserData.roles.forEach((role) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          allRolePermissions.push(...role.permissions);
        }
      });
      return allRolePermissions;
    }

    return [];
  }, [currentUserData]);

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
    // If user is a superuser, they have all permissions
    if (currentUserData?.is_superuser) return true;

    if (hasWildcardPermissions) return true;
    if (!permission) return false;

    return userPermissionNames.some((perm) => {
      if (perm === permission) return true;

      // Check for resource-specific wildcard (e.g., form_type:* matches form_type:create)
      const permParts = perm.split(":");
      const checkParts = permission.split(":");

      if (permParts.length === 2 && checkParts.length === 2) {
        const permResource = permParts[0];
        const permAction = permParts[1];
        const checkResource = checkParts[0];
        const checkAction = checkParts[1];

        // Check if user has resource:* wildcard for this resource
        if (permAction === "*" && permResource === checkResource) {
          return true;
        }
      }

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

  // Check if user is superuser (either by flag or by having "*" permission)
  const isSuperuser = useMemo(() => {
    return currentUserData?.is_superuser || hasWildcardPermissions;
  }, [currentUserData?.is_superuser, hasWildcardPermissions]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasWildcardPermissions,
    userPermissionNames,
    isSuperuser,
  };
};















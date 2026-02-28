/**
 * Permission and role checking hook
 * Supports both free and Pro version role systems
 */

import { useMemo } from "react";

// Types are now in i18n.ts

interface UsePermissionsReturn {
  can: (capability: string) => boolean;
  hasRole: (role: string) => boolean;
  isPro: boolean;
  permissions: string[];
  roles: string[];
}

/**
 * Hook to check user permissions and roles
 * @returns Permission checking functions
 */
export const usePermissions = (): UsePermissionsReturn => {
  const permissions = useMemo(() => {
    return window.yatraAdmin?.permissions || [];
  }, []);

  const roles = useMemo(() => {
    return window.yatraAdmin?.roles || [];
  }, []);

  const capabilities = useMemo(() => {
    return window.yatraAdmin?.capabilities || {};
  }, []);

  const isPro = useMemo(() => {
    return window.yatraAdmin?.isPro || false;
  }, []);

  /**
   * Check if user has a specific capability
   * @param capability - Capability to check
   * @returns True if user has capability
   */
  const can = (capability: string): boolean => {
    // Check direct capabilities
    if (capabilities[capability] === true) {
      return true;
    }

    // Check permissions array
    if (permissions.includes(capability)) {
      return true;
    }

    // Check for Pro-only features
    if (capability.startsWith("yatra_pro_") && !isPro) {
      return false;
    }

    // Default capabilities
    const defaultCapabilities: Record<string, boolean> = {
      manage_yatra: true, // Default admin capability
      yatra_view_trips: true,
      yatra_edit_trips: true,
      yatra_delete_trips: true,
      yatra_view_bookings: true,
      yatra_edit_bookings: true,
      yatra_delete_bookings: true,
      yatra_view_customers: true,
      yatra_edit_customers: true,
      yatra_delete_customers: true,
      yatra_view_reviews: true,
      yatra_edit_reviews: true,
      yatra_delete_reviews: true,
    };

    return defaultCapabilities[capability] || false;
  };

  /**
   * Check if user has a specific role
   * @param role - Role to check
   * @returns True if user has role
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  return {
    can,
    hasRole,
    isPro,
    permissions,
    roles,
  };
};

/**
 * Permission and role checking hook
 * Supports both free and Pro version role systems
 */

import { useCallback, useMemo } from "react";

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
   * Check if the current user has a specific capability.
   *
   * Sources, in order:
   *   1. `window.yatraAdmin.capabilities` — server-built map of every
   *      `yatra_*` cap the user passes via WP-native `current_user_can`.
   *      Built by AdminAssetsProvider from `$current_user->allcaps`,
   *      filtered to the `yatra_` prefix.
   *   2. `window.yatraAdmin.userCaps` — Team module's enriched list,
   *      includes the same caps + anything added via the user_has_cap
   *      filter (admin fallback, per-user grants, derived caps).
   *   3. `window.yatraAdmin.isWpAdmin` — last-resort fallback for site
   *      owners so they're never locked out of anything.
   *
   * Default-deny when none match. The previous implementation had a
   * hardcoded "every user gets yatra_view_trips / yatra_edit_trips /
   * yatra_view_bookings" map that broke the Team & Access module — an
   * Accountant calling `can('yatra_edit_trips')` returned true via that
   * defaults map, leaking Tools / Modules / etc. into their UI even
   * though their role doesn't grant edit_trips.
   *
   * @param capability - Capability to check
   * @returns True if user has capability
   */
  const can = useCallback(
    (capability: string): boolean => {
      // 1) Server-built per-user cap map (yatra_* only).
      if (capabilities[capability] === true) {
        return true;
      }

      // 2) Team module's enriched userCaps list.
      const userCaps = (
        window.yatraAdmin as { userCaps?: string[] } | undefined
      )?.userCaps;
      if (Array.isArray(userCaps) && userCaps.includes(capability)) {
        return true;
      }

      // 3) Legacy permissions array (kept for back-compat with any
      //    code path that pre-dates the capabilities map).
      if (permissions.includes(capability)) {
        return true;
      }

      // 4) WP admin fallback — site owners pass everything.
      //
      // Belt-and-suspenders: we check THREE signals in case one of
      // them goes missing on a particular install. All three are
      // injected by AdminAssetsProvider, but defense in depth is
      // cheap and protects against:
      //   - server-side filters stripping isWpAdmin from localized data
      //   - JSON-encoding edge cases where booleans get coerced
      //   - roles arrays that contain admin even when capabilities map
      //     was built from a stale $current_user (page-cache + role
      //     changes)
      const adm = window.yatraAdmin as
        | {
            isWpAdmin?: unknown;
            roles?: unknown;
            capabilities?: Record<string, unknown>;
          }
        | undefined;
      if (adm) {
        if (
          adm.isWpAdmin === true ||
          adm.isWpAdmin === "1" ||
          adm.isWpAdmin === 1
        ) {
          return true;
        }
        if (Array.isArray(adm.roles) && adm.roles.includes("administrator")) {
          return true;
        }
        if (adm.capabilities && adm.capabilities["manage_options"] === true) {
          return true;
        }
      }

      // 5) Pro-only check stays for completeness.
      if (capability.startsWith("yatra_pro_") && !isPro) {
        return false;
      }

      return false;
    },
    [capabilities, permissions, isPro],
  );

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

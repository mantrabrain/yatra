import { useMemo, useSyncExternalStore } from "react";

/**
 * Capability awareness — reads from window.yatraAdmin.userCaps which is
 * server-injected at first paint by the Team module's LocalizedData
 * service. Falls back to "everything allowed" when:
 *
 *   - The Team module isn't installed (no team slot in localized data) —
 *     in which case the server already enforced WP-native cap checks.
 *     UI-side hiding is a UX nicety, not the security boundary.
 *   - The current user has `isWpAdmin = true` — WP administrators always
 *     pass every cap check on the server, so the UI should mirror that.
 *
 * Mutability:
 *   When the user's role or scopes change (e.g. an Owner updates their
 *   own profile in a long-lived tab), the Team page invalidates the
 *   "team-current-user-caps" React Query and writes the fresh caps back
 *   into window.yatraAdmin.userCaps via `setUserCaps()`. Subscribers
 *   re-render via useSyncExternalStore.
 *
 * @since 3.5.0
 */

/**
 * The shape of window.yatraAdmin that THIS module cares about. The
 * full definition lives in types/global.d.ts; we narrow to the
 * Team-relevant subset here so the rest of the module reads cleanly.
 */
type YatraAdminCapSlice = Pick<
  NonNullable<Window["yatraAdmin"]>,
  "teamEnabled" | "isWpAdmin" | "userCaps" | "userScopes"
>;

const subscribers = new Set<() => void>();

function getSnapshot(): YatraAdminCapSlice {
  const w = window.yatraAdmin;
  if (!w) return {} as YatraAdminCapSlice;
  return {
    teamEnabled: w.teamEnabled,
    isWpAdmin: w.isWpAdmin,
    userCaps: w.userCaps,
    userScopes: w.userScopes,
  };
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/** Notify all subscribers — call after mutating window.yatraAdmin. */
function emit(): void {
  subscribers.forEach((cb) => cb());
}

/**
 * Replace the cached cap list. Call from mutation handlers after a
 * /team/users/{id} update so the UI updates without a page reload.
 */
export function setUserCaps(caps: string[]): void {
  if (window.yatraAdmin) {
    window.yatraAdmin.userCaps = [...caps];
    emit();
  }
}

/**
 * Replace the cached scope state. Same triggering pattern as setUserCaps.
 */
export function setUserScopes(scopes: YatraAdminCapSlice["userScopes"]): void {
  if (window.yatraAdmin) {
    window.yatraAdmin.userScopes = scopes;
    emit();
  }
}

/**
 * Returns true if the current user passes a Yatra capability check.
 *
 * Important contract:
 *   This is a UI gate, not a security boundary. The server's REST
 *   permission_callback is the actual access check — useCanCap mirrors
 *   it so the UI doesn't surface controls that would 403. If the two
 *   ever disagree, the server wins.
 */
export function useCanCap(cap: string): boolean {
  // The store snapshot is recreated each call (object literal), so we
  // can't use Object.is identity. Lift the relevant primitives so
  // useSyncExternalStore sees stable references.
  const caps = useSyncExternalStore(
    subscribe,
    () => getSnapshot().userCaps,
    () => getSnapshot().userCaps,
  );
  const teamEnabled = useSyncExternalStore(
    subscribe,
    () => getSnapshot().teamEnabled,
    () => getSnapshot().teamEnabled,
  );
  const isWpAdmin = useSyncExternalStore(
    subscribe,
    () => getSnapshot().isWpAdmin,
    () => getSnapshot().isWpAdmin,
  );
  return useMemo(
    () => evaluateCap({ userCaps: caps, teamEnabled, isWpAdmin }, cap),
    [caps, teamEnabled, isWpAdmin, cap],
  );
}

/**
 * Same logic, exposed as a plain function for non-hook call sites
 * (e.g. inside event handlers that build menu items at render time).
 */
export function canCap(cap: string): boolean {
  return evaluateCap(getSnapshot(), cap);
}

/**
 * Filter a list of items to those whose `cap` field the current user
 * has. Sidebar menu items, table action items, etc. use this.
 */
export function filterByCap<T extends { cap?: string }>(items: T[]): T[] {
  const snapshot = getSnapshot();
  return items.filter((item) => !item.cap || evaluateCap(snapshot, item.cap));
}

function evaluateCap(snapshot: YatraAdminCapSlice, cap: string): boolean {
  if (!cap) return true;

  // WP admin always passes (mirrors the admin fallback in
  // Capabilities::filterUserHasCap). Site owner can never be locked out.
  if (snapshot.isWpAdmin === true) return true;

  // No userCaps array in the localized data → we have no information
  // to filter on. This happens on:
  //   - non-Pro installs (no team module ships userCaps)
  //   - Pro installs where the Team module isn't enabled
  //   - The TeamModule failed to boot for some reason
  // In all those cases, the SERVER-SIDE cap check is still the
  // security boundary — REST routes still enforce permission_callback,
  // page handlers still enforce manage_options. UI default-allow here
  // is just so we don't hide things the user can actually access.
  const caps = snapshot.userCaps;
  if (!Array.isArray(caps)) return true;

  // We have the user's caps from the server. Show only what's in the
  // list. This is the team-module-enabled path — every Yatra cap the
  // user has been granted server-side is included by LocalizedData.
  return caps.includes(cap);
}

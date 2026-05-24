import { apiClient } from "../lib/api-client";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** Module-level gate state — drives the upgrade card / module-disabled card. */
export interface TeamMeta {
  is_agency_active: boolean;
  is_module_enabled: boolean;
  upgrade_url: string;
  docs_url: string;
  audit_log_enabled: boolean;
  invitation_default_expiry_seconds: number;
}

/** One capability in the registry. */
export interface CapabilityDef {
  category: string;
  sensitivity: "low" | "medium" | "high" | "critical";
  module: string;
  label: string;
}

export interface CapabilityRegistryResponse {
  capabilities: Record<string, CapabilityDef>;
  by_category: Record<string, Record<string, CapabilityDef>>;
  version: number;
}

/** Per-user scope assignment. */
export interface UserScopes {
  destinations: number[];
  activities: number[];
  trips: number[];
  categories: number[];
}

export interface TeamRole {
  slug: string;
  display_name: string;
  description: string;
  is_system: boolean;
  capabilities: string[];
  capability_count: number;
  member_count: number;
}

export interface TeamUser {
  id: number;
  display_name: string;
  user_login: string;
  email: string;
  roles: string[];
  primary_role: string;
  is_wp_admin: boolean;
  effective_caps: string[];
  caps_grant: string[];
  caps_revoke: string[];
  scopes: UserScopes;
  has_scope: boolean;
  last_login: string;
  /**
   * Time-windowed access. Unix seconds; 0 = permanent (no expiry).
   * When the timestamp is in the past, the server has soft-stripped
   * yatra_* caps in-memory and the hourly ExpiryCron is queued to
   * hard-remove the role + grants on its next run.
   */
  expires_at: number;
  is_expired: boolean;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role_slug: string;
  invited_by: number;
  created_at: number;
  expires_at: number;
  status: "pending" | "accepted" | "revoked" | "expired";
  accepted_at?: number;
  accepted_user_id?: number;
}

export interface AuditLogRow {
  id: number;
  occurred_at: string;
  actor_user_id: number | null;
  actor_display_name: string;
  actor_ip: string | null;
  actor_user_agent: string | null;
  action: string;
  capability: string | null;
  entity_type: string | null;
  entity_id: number | null;
  context: Record<string, unknown>;
  result: "allowed" | "denied";
}

export interface TeamUserWritePayload {
  role_slug?: string;
  caps_grant?: string[];
  caps_revoke?: string[];
  scopes?: Partial<UserScopes>;
  /**
   * Time-windowed access. Accept unix seconds, ISO-8601, or null/0
   * to clear. Owners cannot set this on themselves — the server
   * rejects with 409. Omit the field to leave expiry unchanged.
   */
  expires_at?: number | string | null;
}

export interface SendInvitationPayload {
  email: string;
  role: string;
  expires_in?: number;
  scopes?: Partial<UserScopes>;
}

/* -------------------------------------------------------------------------- */
/*  Client                                                                    */
/* -------------------------------------------------------------------------- */

export const teamApi = {
  getMeta: () => apiClient.get("/team/meta") as Promise<TeamMeta>,

  listCapabilities: () =>
    apiClient.get("/team/capabilities") as Promise<CapabilityRegistryResponse>,

  listRoles: () =>
    apiClient.get("/team/roles") as Promise<{ data: TeamRole[] }>,

  createRole: (payload: {
    display_name: string;
    capabilities: string[];
    slug?: string;
  }) =>
    apiClient.post("/team/roles", payload) as Promise<{
      data: TeamRole;
      message: string;
    }>,

  getRole: (slug: string) =>
    apiClient.get(`/team/roles/${encodeURIComponent(slug)}`) as Promise<{
      data: TeamRole;
    }>,

  updateRole: (
    slug: string,
    payload: { display_name?: string; capabilities?: string[] },
  ) =>
    apiClient.put(
      `/team/roles/${encodeURIComponent(slug)}`,
      payload,
    ) as Promise<{ data: TeamRole; message: string }>,

  deleteRole: (slug: string, reassignTo: string | null = null) =>
    apiClient.delete(
      `/team/roles/${encodeURIComponent(slug)}`,
      reassignTo ? { data: { reassign_to: reassignTo } } : undefined,
    ) as Promise<{ message: string }>,

  listUsers: () =>
    apiClient.get("/team/users") as Promise<{ data: TeamUser[] }>,

  /** WP users not yet on the Yatra team — for the "Add existing user"
   *  picker. `q` is an optional type-ahead query (search by login /
   *  email / display name). */
  listAvailableUsers: (q = "", limit = 50) =>
    apiClient.get("/team/users/available", {
      params: q ? { q, limit } : { limit },
    }) as Promise<{
      data: Array<{
        id: number;
        display_name: string;
        email: string;
        login: string;
      }>;
    }>,

  /** Create a brand-new WP user + assign a Yatra role in one shot.
   *  Sister flow to invitations — invitations send an email that
   *  creates the user on accept; this one provisions immediately. */
  createUser: (payload: {
    email: string;
    role_slug: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    password?: string;
    send_reset_email?: boolean;
    scopes?: Partial<UserScopes>;
  }) =>
    apiClient.post("/team/users/create", payload) as Promise<{
      data: TeamUser;
      message: string;
    }>,

  getUser: (id: number) =>
    apiClient.get(`/team/users/${id}`) as Promise<{ data: TeamUser }>,

  updateUser: (id: number, payload: TeamUserWritePayload) =>
    apiClient.put(`/team/users/${id}`, payload) as Promise<{
      data: TeamUser;
      message: string;
    }>,

  forceLogout: (id: number) =>
    apiClient.post(`/team/users/${id}/force-logout`, {}) as Promise<{
      message: string;
    }>,

  removeUser: (id: number) =>
    apiClient.delete(`/team/users/${id}`) as Promise<{ message: string }>,

  /**
   * Bulk operations on members.
   *
   * Response shape includes per-id success/failure so the UI can
   * highlight rows that didn't complete (e.g. last-admin guard
   * blocking a remove). `ok_count` is the convenience aggregate.
   */
  /** Curated role-creation templates served read-only from the server. */
  listRoleTemplates: () =>
    apiClient.get("/team/role-templates") as Promise<{
      data: Array<{
        id: string;
        label: string;
        description: string;
        capabilities: string[];
      }>;
    }>,

  /**
   * Module-level settings. Currently surfaces a single forward-looking
   * toggle: what should happen to non-admin team members' Yatra access
   * if the operator ever turns the Team & Access module off?
   *
   * Returns an object (not a flat boolean) so future settings can be
   * added without rev-bumping the response shape.
   */
  getSettings: () =>
    apiClient.get("/team/settings") as Promise<{
      data: {
        keep_access_on_module_disable: boolean;
        /** Comma-separated CIDR list. Empty = no restriction. Empty
         *  string is the safe default — operators opt in deliberately
         *  because misconfiguration locks staff out. WordPress
         *  administrators are always exempt regardless. */
        login_ip_allowlist: string;
      };
    }>,

  /** Partial update — every key is optional. Backend persists only
   *  the keys present and writes an audit row when the diff is
   *  meaningful (e.g. login_ip_allowlist normalizes to a different
   *  list of CIDRs). */
  updateSettings: (payload: {
    keep_access_on_module_disable?: boolean;
    login_ip_allowlist?: string;
  }) =>
    apiClient.put("/team/settings", payload) as Promise<{
      data: {
        keep_access_on_module_disable: boolean;
        login_ip_allowlist: string;
      };
      message: string;
    }>,

  bulkUsers: (payload: {
    action: "change_role" | "remove" | "force_logout" | "set_expiry";
    user_ids: number[];
    role_slug?: string;
    expires_at?: number | string | null;
  }) =>
    apiClient.post("/team/users/bulk", payload) as Promise<{
      data: {
        results: Array<{ id: number; ok: boolean; error?: string }>;
        ok_count: number;
        fail_count: number;
      };
      message: string;
    }>,

  listInvitations: () =>
    apiClient.get("/team/invitations") as Promise<{
      data: Record<string, TeamInvitation>;
    }>,

  sendInvitation: (payload: SendInvitationPayload) =>
    apiClient.post("/team/invitations", payload) as Promise<{
      data: TeamInvitation & { accept_url: string; email_sent: boolean };
      message: string;
    }>,

  /**
   * Revoke or delete an invitation.
   *
   *   purge=false (default): the invitation must be `pending`. Marks
   *     it `revoked` (the magic-link token is invalidated) and keeps
   *     the row so the operator can still see it in the list.
   *   purge=true: deletes the row entirely. If the invitation was
   *     still pending, it's revoked first so the token can never be
   *     redeemed after the record is gone.
   */
  revokeInvitation: (id: string, opts: { purge?: boolean } = {}) =>
    apiClient.delete(
      `/team/invitations/${encodeURIComponent(id)}${opts.purge ? "?purge=1" : ""}`,
    ) as Promise<{
      data: {
        /** revoked | revoked_and_deleted | deleted */
        action: "revoked" | "revoked_and_deleted" | "deleted";
        invitation_id: string;
        previous_status?: string;
      };
      message: string;
    }>,

  acceptInvitation: (token: string) =>
    apiClient.post("/team/invitations/accept", { token }) as Promise<{
      user_id: number;
      role_slug: string;
      message: string;
    }>,

  listAuditLog: (
    filters: {
      page?: number;
      per_page?: number;
      actor_user_id?: number;
      action?: string;
      entity_type?: string;
      entity_id?: number;
      result?: "allowed" | "denied";
      date_from?: string;
      date_to?: string;
    } = {},
  ) =>
    apiClient.get("/team/audit-log", { params: filters }) as Promise<{
      data: AuditLogRow[];
      total: number;
      page: number;
      per_page: number;
    }>,

  auditFacets: () =>
    apiClient.get("/team/audit-log/facets") as Promise<{
      actions: string[];
      entity_types: string[];
    }>,

  /**
   * Wipe every audit-log entry. Server requires `confirm: true` in the
   * body as a safety belt against accidental DELETEs. The wipe itself
   * is recorded as a new audit entry so the operator who cleared
   * history is documented.
   */
  clearAuditLog: () =>
    apiClient.delete("/team/audit-log", { data: { confirm: true } }) as Promise<{
      data: { rows_deleted: number };
      message: string;
    }>,

  /**
   * Delete a specific set of audit-log rows by id. Server caps at 500
   * ids per request. The deletion is recorded as a new audit entry.
   */
  bulkDeleteAuditLog: (ids: number[]) =>
    apiClient.post("/team/audit-log/bulk-delete", { ids }) as Promise<{
      data: { rows_deleted: number; requested: number };
      message: string;
    }>,
};

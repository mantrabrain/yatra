import { apiClient } from "../lib/api-client";

/** WhatsApp module meta — drives gate states on the settings page. */
export interface WhatsappMeta {
  is_eligible: boolean;
  is_module_enabled: boolean;
  is_configured: boolean;
  providers: Array<{ id: string; label: string; disabled?: boolean }>;
  /** Meta webhook setup info — operator pastes these into WhatsApp
   *  Business Manager → Webhooks subscription. `app_secret_configured`
   *  is a visibility flag only; the secret itself is encrypted at rest
   *  and never sent to the client. */
  webhook: {
    url: string;
    verify_token: string;
    app_secret_configured: boolean;
  };
  upgrade_url: string;
  docs_url: string;
}

/** Public-facing click-to-WhatsApp widget configuration. */
export interface WhatsappWidgetSettings {
  enabled: boolean;
  /** E.164 phone the widget opens against. */
  contact_phone: string;
  /** Pre-filled message body. Supports `{{trip_name}}` on trip pages. */
  prefilled_message: string;
  /** 'all' = every frontend page, 'trips_only' = single-trip pages only. */
  display_on: "all" | "trips_only";
  position: "bottom-right" | "bottom-left";
  /** Pill label next to the WhatsApp icon. Empty = icon only. */
  label: string;
  /** Render an in-page CTA inside the single-trip sidebar. */
  show_on_trip_sidebar: boolean;
}

/** Non-template settings (provider config + opt-in + admin phone). */
export interface WhatsappSettings {
  active_provider: string;
  phone_number_id: string;
  business_account_id: string;
  sender_display_name: string;
  default_country_code: string;
  /** Destination phone for templates with recipient_type=admin. E.164. */
  admin_phone: string;
  opt_in_required: boolean;
  opt_in_copy: string;
  reminder_hours_before: number;
  review_hours_after: number;
  widget: WhatsappWidgetSettings;
}

export interface WhatsappCredentialStatus {
  configured: boolean;
  hint: string;
}

export interface WhatsappSettingsResponse {
  settings: WhatsappSettings;
  credentials: Record<string, Record<string, WhatsappCredentialStatus>>;
}

/** One row from /whatsapp/events — drives the Trigger Event dropdown. */
export interface WhatsappEvent {
  key: string;
  name: string;
  description: string;
  kind: "action" | "time";
  wp_hook: string | null;
  /** Per-event variables. Each `{ key, description }` becomes a sidebar button. */
  variables: Array<{ key: string; description: string }>;
}

/** A DB row from `yatra_whatsapp_templates`. */
export interface WhatsappTemplate {
  id: number;
  template_key: string;
  event_key: string;
  is_system: boolean;
  is_active: boolean;
  name: string;
  description: string | null;
  body: string | null;
  recipient_type: "customer" | "admin";
  /** Flattened Cloud-API specifics for convenience (also in settings JSON). */
  meta_template_name: string;
  language_code: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WhatsappMessageRow {
  id: number;
  direction: "outbound" | "inbound";
  phone: string;
  customer_id: number | null;
  booking_id: number | null;
  template_key: string | null;
  body: string | null;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsappOptInRow {
  phone: string;
  opted_in: boolean;
  source: string;
  updated_at: string;
}

export interface WhatsappTestSendResult {
  ok: boolean;
  provider_message_id?: string;
  error?: string;
}

export const whatsappApi = {
  getMeta: () => apiClient.get("/whatsapp/meta") as Promise<WhatsappMeta>,

  getSettings: () =>
    apiClient.get("/whatsapp/settings") as Promise<WhatsappSettingsResponse>,

  updateSettings: (patch: Partial<WhatsappSettings>) =>
    apiClient.put("/whatsapp/settings", { settings: patch }) as Promise<{
      settings: WhatsappSettings;
      message: string;
    }>,

  updateCredential: (provider: string, field: string, value: string) =>
    apiClient.put("/whatsapp/credentials", { provider, field, value }) as Promise<{
      credentials: Record<string, Record<string, WhatsappCredentialStatus>>;
      message: string;
    }>,

  listEvents: () =>
    apiClient.get("/whatsapp/events") as Promise<{ data: WhatsappEvent[] }>,

  listTemplates: () =>
    apiClient.get("/whatsapp/templates") as Promise<{ data: WhatsappTemplate[] }>,

  getTemplate: (id: number) =>
    apiClient.get(`/whatsapp/templates/${id}`) as Promise<{ data: WhatsappTemplate }>,

  createTemplate: (payload: Partial<WhatsappTemplate>) =>
    apiClient.post("/whatsapp/templates", payload) as Promise<{
      data: WhatsappTemplate;
      message: string;
    }>,

  updateTemplate: (id: number, payload: Partial<WhatsappTemplate>) =>
    apiClient.put(`/whatsapp/templates/${id}`, payload) as Promise<{
      data: WhatsappTemplate;
      message: string;
    }>,

  deleteTemplate: (id: number) =>
    apiClient.delete(`/whatsapp/templates/${id}`) as Promise<{ message: string }>,

  /**
   * Re-seed the bundled defaults. Useful when the operator has missed
   * a system template (deleted accidentally pre-lockdown, or a
   * first-install race left them with none).
   */
  restoreDefaults: () =>
    apiClient.post("/whatsapp/templates/restore-defaults", {}) as Promise<{
      data: WhatsappTemplate[];
      message: string;
    }>,

  testSendTemplate: (id: number, params: { phone?: string; booking_id?: number }) =>
    apiClient.post(
      `/whatsapp/templates/${id}/test-send`,
      params,
    ) as Promise<WhatsappTestSendResult>,

  /**
   * Paginated message log. Returns `total` so the UI can render correct
   * page counts without local slicing. `page` is 1-indexed.
   */
  listMessages: (params: { page?: number; per_page?: number; status?: string; phone?: string } = {}) =>
    apiClient.get("/whatsapp/messages", {
      params: {
        page: params.page ?? 1,
        per_page: params.per_page ?? 20,
        ...(params.status ? { status: params.status } : {}),
        ...(params.phone ? { phone: params.phone } : {}),
      },
    }) as Promise<{
      data: WhatsappMessageRow[];
      total: number;
      page: number;
      per_page: number;
    }>,

  listOptIns: () =>
    apiClient.get("/whatsapp/opt-ins") as Promise<{ data: WhatsappOptInRow[] }>,

  /* ----------------------- template versions ----------------------- */
  /**
   * Append-only edit history for a template. Returned newest-first.
   * Operators restore from this list when a recent edit needs rollback.
   */
  listTemplateVersions: (id: number) =>
    apiClient.get(`/whatsapp/templates/${id}/versions`) as Promise<{
      data: WhatsappTemplateVersion[];
    }>,

  /**
   * Restore the template to a prior snapshot. Server snapshots the
   * CURRENT state first so the chain stays linear ("undo this restore"
   * is just another restore from the most-recent row).
   */
  restoreTemplateVersion: (id: number, versionId: number) =>
    apiClient.post(
      `/whatsapp/templates/${id}/versions/${versionId}/restore`,
      {},
    ) as Promise<{
      data: WhatsappTemplate;
      message: string;
    }>,
};

/* -------------------------------------------------------------------------- */
/*  Template version-history shape                                            */
/* -------------------------------------------------------------------------- */

/** One snapshot of a template at a moment in time. */
export interface WhatsappTemplateVersion {
  id: number;
  template_id: number;
  /** Monotonic per template — UI displays as "v3". */
  version_number: number;
  /** Frozen copy of the row state at the time of the change. Subset
   *  of the fields on WhatsappTemplate plus settings as plain object. */
  snapshot: {
    name?: string;
    description?: string;
    body?: string;
    event_key?: string;
    recipient_type?: "customer" | "admin";
    is_active?: boolean;
    settings?: Record<string, unknown>;
    is_system?: boolean;
  };
  /** Short human hint of what changed in THIS edit (e.g. "edited:
   *  body, is_active") or "Restored from vN" for restore rows. */
  change_summary: string | null;
  created_by: number | null;
  created_at: string;
}

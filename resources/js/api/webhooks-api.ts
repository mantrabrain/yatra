import { apiClient } from "../lib/api-client";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** Module-level gate state, drives the Webhooks page upgrade / setup cards. */
export interface WebhooksMeta {
  is_agency_active: boolean;
  is_module_enabled: boolean;
  api_version: string;
  upgrade_url: string;
  docs_url: string;
  signature_header: string;
  event_count: number;
}

/** One row from the event catalog — what the operator can subscribe to. */
export interface WebhookEvent {
  key: string;
  name: string;
  description: string;
  wp_hook: string;
  entity: string;
}

/** An operator-configured destination URL. */
export interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  description: string;
  /** Exactly ONE event per endpoint (1:1 mapping, mirrors the Email
   *  Automation pattern). The field selector + sample payload viewer
   *  show data for THIS event only — multi-event endpoints would make
   *  field selection ambiguous. */
  event: string;
  /** Outbound HTTP verb. POST is the universal webhook default;
   *  PUT/PATCH suit upsert/partial-update receivers; DELETE for
   *  object-removal mirrors; GET moves the payload to a
   *  `?payload=<json>` query parameter and the body becomes empty
   *  (so the HMAC signature is then over `timestamp + '.'` — i.e.
   *  empty body). Defaults to POST. */
  http_method: "POST" | "PUT" | "PATCH" | "DELETE" | "GET";
  /** Static custom HTTP headers POSTed alongside Yatra's signed headers.
   *  Reserved header names (`X-Yatra-*`, Content-Length, Host, Cookie)
   *  are blocked server-side. */
  headers: Record<string, string>;
  /** Static fields merged into every payload's `data` block — e.g.
   *  `{tenant_id: "acme", environment: "production"}`. Operator-extras
   *  never overwrite Yatra's canonical entity fields. */
  additional_payload_fields: Record<string, string>;
  /** Pabbly-style field filter. Empty list = "send the entire data
   *  block". Populated = "send only these dot-paths". The envelope
   *  (id/type/api_version/occurred_at) is ALWAYS preserved regardless
   *  — receivers route on those. */
  selected_fields: string[];
  secret_hint: string;
  is_active: boolean;
  /** When false, the dispatcher persists delivery metadata (status,
   *  attempts, duration) but strips the payload + response bodies.
   *  High-volume endpoints turn this off to control disk usage. */
  log_deliveries: boolean;
  consecutive_failures: number;
  last_delivered_at: string | null;
  last_status: string | null;
  created_at: string;
  updated_at: string;
  /** Rolling success-rate snapshot over the last 100 terminal-state
   *  deliveries. `success_rate` is null when no deliveries exist yet. */
  health: {
    total: number;
    delivered: number;
    failed: number;
    success_rate: number | null;
  };
}

/**
 * Create / update payload — same as WebhookEndpoint but with the
 * write-only `custom_secret` field. The server NEVER reads this back
 * (it lives only in the encrypted SecretStore), so it's omitted from
 * WebhookEndpoint itself.
 */
export type WebhookEndpointWriteInput = Partial<WebhookEndpoint> & {
  /** Optional. If provided (min 24 chars), uses this as the signing
   *  secret instead of auto-generating one. Useful when the receiver
   *  already has a secret configured. */
  custom_secret?: string;
};

/** Lightweight delivery log row for the list view. */
export interface WebhookDeliveryRow {
  id: number;
  endpoint_id: number;
  event_key: string;
  delivery_id: string;
  http_status: number | null;
  attempts: number;
  status:
    | "queued"
    | "delivering"
    | "delivered"
    | "failed"
    | "permanent_failure";
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  delivered_at: string | null;
  next_attempt_at: string | null;
}

/** Full delivery detail including the canonical payload — used by the inspect view. */
export interface WebhookDeliveryDetail extends WebhookDeliveryRow {
  payload: Record<string, unknown>;
  response_body: string | null;
  response_headers: string | null;
}

/** Real-time capture state for one event key. Polled by the form while
 *  the operator is waiting for a sample. */
export interface ListenStatus {
  armed: boolean;
  expires_at: number | null;
  captured: {
    captured_at: number;
    payload: Record<string, unknown>;
    paths: Array<{ path: string; sample: unknown }>;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*  Client                                                                    */
/* -------------------------------------------------------------------------- */

export const webhooksApi = {
  getMeta: () => apiClient.get("/webhooks/meta") as Promise<WebhooksMeta>,

  listEvents: () =>
    apiClient.get("/webhooks/events") as Promise<{ data: WebhookEvent[] }>,

  /** Returns the latest REAL payload for this event — either explicitly
   *  captured via {@link startListen} or pulled from a prior delivery.
   *  `payload` is null if no sample exists yet (UI prompts to Listen). */
  getEventSample: (key: string) =>
    apiClient.get(
      `/webhooks/events/${encodeURIComponent(key)}/sample`,
    ) as Promise<{
      event: WebhookEvent;
      payload: Record<string, unknown> | null;
      paths: Array<{ path: string; sample: unknown }>;
      /** "captured" (operator-driven listen) | "delivery_log" (prior real send) | null. */
      source: "captured" | "delivery_log" | null;
      captured_at: number | null;
    }>,

  /** Real-time capture flow (Pabbly/Zapier-style "listen for sample"):
   *  arm a capture, the next firing of the event records its real
   *  payload, the UI polls until it shows up. Zero guesswork. */
  startListen: (key: string) =>
    apiClient.post(
      `/webhooks/events/${encodeURIComponent(key)}/listen`,
      {},
    ) as Promise<ListenStatus>,

  getListenStatus: (key: string) =>
    apiClient.get(
      `/webhooks/events/${encodeURIComponent(key)}/listen`,
    ) as Promise<ListenStatus>,

  /** Cancel an active capture. Pass forget=true to also discard the
   *  previously-captured sample (gives a clean slate). */
  stopListen: (key: string, forget = false) =>
    apiClient.delete(
      `/webhooks/events/${encodeURIComponent(key)}/listen${forget ? "?forget=1" : ""}`,
    ) as Promise<ListenStatus>,

  listEndpoints: () =>
    apiClient.get("/webhooks/endpoints") as Promise<{
      data: WebhookEndpoint[];
    }>,

  getEndpoint: (id: number) =>
    apiClient.get(`/webhooks/endpoints/${id}`) as Promise<{
      data: WebhookEndpoint;
    }>,

  /** Returns the plaintext signing secret ONCE — show in a copy dialog
   *  unless the operator provided a custom_secret (in which case they
   *  already know it; the server still echoes it back for confirmation). */
  createEndpoint: (payload: WebhookEndpointWriteInput) =>
    apiClient.post("/webhooks/endpoints", payload) as Promise<{
      data: WebhookEndpoint;
      secret: string;
      message: string;
    }>,

  updateEndpoint: (id: number, payload: WebhookEndpointWriteInput) =>
    apiClient.put(`/webhooks/endpoints/${id}`, payload) as Promise<{
      data: WebhookEndpoint;
      message: string;
    }>,

  deleteEndpoint: (id: number) =>
    apiClient.delete(`/webhooks/endpoints/${id}`) as Promise<{
      message: string;
    }>,

  /** Generates a fresh secret — shown ONCE. Invalidates the previous one. */
  regenerateSecret: (id: number) =>
    apiClient.post(
      `/webhooks/endpoints/${id}/regenerate-secret`,
      {},
    ) as Promise<{
      secret: string;
      message: string;
    }>,

  /** Queues a synthetic `webhook.ping` event — operator inspects the result
   *  in the Deliveries tab afterwards. */
  pingEndpoint: (id: number) =>
    apiClient.post(`/webhooks/endpoints/${id}/ping`, {}) as Promise<{
      delivery_id: string;
      row_id: number;
      message: string;
    }>,

  listDeliveries: (
    params: {
      page?: number;
      per_page?: number;
      endpoint_id?: number;
      event_key?: string;
      status?: string;
    } = {},
  ) =>
    apiClient.get("/webhooks/deliveries", { params }) as Promise<{
      data: WebhookDeliveryRow[];
      total: number;
      page: number;
      per_page: number;
    }>,

  /** Returns the FULL payload — the "listen mode" view. */
  getDelivery: (id: number) =>
    apiClient.get(`/webhooks/deliveries/${id}`) as Promise<{
      data: WebhookDeliveryDetail;
    }>,

  /** Re-queues a delivery for a fresh attempt. Attempt counter preserved. */
  replayDelivery: (id: number) =>
    apiClient.post(`/webhooks/deliveries/${id}/replay`, {}) as Promise<{
      message: string;
    }>,

  /**
   * Bulk replay. Accepts either explicit ids[] (cap 200) or a filter
   * descriptor (cap 500). Rows whose endpoint is inactive or deleted
   * are skipped and counted separately so the UI can show a partial-
   * success summary.
   */
  bulkReplayDeliveries: (input: {
    ids?: number[];
    filter?: {
      endpoint_id?: number;
      event_key?: string;
      status?: "failed" | "permanent_failure" | "delivered";
      before?: string;
      after?: string;
    };
  }) =>
    apiClient.post("/webhooks/deliveries/bulk-replay", input) as Promise<{
      requeued: number;
      skipped: number;
      skipped_inactive_endpoint?: number;
      skipped_missing?: number;
      /** When the filter matched more than the 500-row cap, this is
       *  the total match count so the UI can suggest a narrower filter. */
      capped_total: number | null;
      message: string;
    }>,

  /**
   * Aggregated buried-deliveries snapshot. Pairs with bulkReplay above
   * — operators triage from this summary, then bulk-replay either by
   * explicit ids picked from `recent[]` or by filter (e.g. "every
   * permanent_failure for endpoint 7 from the last 24h").
   */
  getDeadLetterSummary: () =>
    apiClient.get("/webhooks/deliveries/dead-letter") as Promise<{
      data: {
        total: number;
        by_endpoint: Array<{ endpoint_id: number; count: number }>;
        by_event: Array<{ event_key: string; count: number }>;
        /** Error-message prefix grouping — clusters HTTP 503 / timeout
         *  variants so the operator sees the pattern, not 1000 rows. */
        by_error: Array<{ fingerprint: string; count: number }>;
        recent: WebhookDeliveryRow[];
      };
    }>,

  /* ----------------------------- mTLS ------------------------------ */
  /** Per-endpoint client-cert state. Returns `configured: false` when
   *  nothing's been uploaded. Never returns the key/cert PEM — only
   *  fingerprint + expiry hint. */
  getMtlsHint: (id: number) =>
    apiClient.get(`/webhooks/endpoints/${id}/mtls`) as Promise<{
      data: {
        configured: boolean;
        fingerprint: string;
        expires_at: string | null;
      };
    }>,

  /** Upload a PEM cert + private key (+ optional passphrase). The
   *  server validates the pair matches with openssl_x509_check_private_key
   *  before persisting, so a mismatched-pair mistake is caught at save
   *  time rather than at delivery time. */
  setMtls: (
    id: number,
    payload: { cert: string; key: string; passphrase?: string },
  ) =>
    apiClient.post(`/webhooks/endpoints/${id}/mtls`, payload) as Promise<{
      data: {
        configured: boolean;
        fingerprint: string;
        expires_at: string | null;
      };
      message: string;
    }>,

  clearMtls: (id: number) =>
    apiClient.delete(`/webhooks/endpoints/${id}/mtls`) as Promise<{
      message: string;
    }>,
};

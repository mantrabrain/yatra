import { apiClient } from "../lib/api-client";

export interface AiKeyStatus {
  configured: boolean;
  hint: string;
}

export interface AiProvider {
  id: string;
  label: string;
  default_model: string;
  models: Array<{ id: string; label: string }>;
}

export interface AiLicenseInfo {
  is_agency?: boolean;
  tier?: string;
  plan_name?: string;
  price_id?: number | string | null;
}

export interface AiChatLimits {
  per_trip_day: number;
  per_ip_hour: number;
  per_session: number;
  per_session_booking: number;
  max_message_chars: number;
  history_turns: number;
}

export interface AiChatLimitMeta {
  default: number;
  min: number;
  max: number;
}

export interface AiMeta {
  is_pro_active: boolean;
  is_ai_eligible: boolean;
  is_module_enabled: boolean;
  license: AiLicenseInfo;
  providers: AiProvider[];
  keys: Record<string, AiKeyStatus>;
  allowed_tasks: string[];
  upgrade_url: string;
  license_page_url: string;
  trip_chat_enabled?: boolean;
  trip_chat_limits?: AiChatLimits;
  trip_chat_limits_schema?: Record<keyof AiChatLimits, AiChatLimitMeta>;
}

export interface AiBrandVoice {
  tone: string;
  examples: string[];
  forbidden: string[];
  required: string[];
  language: string;
  default_provider: string;
  default_model: string;
}

export interface AiGenerateResponse {
  text: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface AiUsageBucket {
  prompt: number;
  completion: number;
  calls: number;
  tasks: Record<string, number>;
}

export interface AiUsageSummary {
  current_month: string;
  months: Record<string, Record<string, AiUsageBucket>>;
  totals: { prompt: number; completion: number; calls: number };
}

/* -------------------------------------------------------------------------- */
/*  Operations AI (Phase A)                                                   */
/* -------------------------------------------------------------------------- */

export interface AiDigestMetrics {
  today_date: string;
  enquiries_unresponded_count: string;
  enquiries_oldest_waiting_hours: string;
  recent_enquiries_block: string;
  bookings_payment_pending_count: string;
  bookings_departing_soon_count: string;
  departing_soon_block: string;
  high_value_pending_block: string;
}

export type AiDigestState =
  | "ready"
  | "all_caught_up"
  | "no_api_key"
  | "module_disabled"
  | "upgrade_required"
  | "error";

export interface AiDigest {
  text: string;
  metrics: AiDigestMetrics;
  has_material: boolean;
  generated_at: number;
  cached: boolean;
  state: AiDigestState;
  error?: string;
}

export type EnquiryReplyVariant = "fresh" | "warmer" | "shorter";

/**
 * One row in the Prompts settings list — covers single-shot prompt
 * templates (trip-description, enquiry-reply, etc.) AND the new
 * multi-step agent system prompts (agent-trip-chat, agent-trip-
 * creation, agent-itinerary, agent-email-template). The `description`
 * field is operator-facing: explains WHERE the prompt applies in
 * the product, so the editor knows what they're about to change.
 */
export interface AiPromptRow {
  task: string;
  category: string;
  label: string;
  /** One-line operator-facing explanation of where the prompt
   *  applies. Empty string when no description is registered. */
  description?: string;
  default: {
    system: string;
    user: string;
    max_tokens: number;
    temperature: number;
  };
  override: {
    system: string;
    user: string;
    max_tokens: number | null;
    temperature: number | null;
  };
  has_override: boolean;
}

export interface AiPromptOverridePayload {
  system?: string;
  user?: string;
  max_tokens?: number | null;
  temperature?: number | null;
}

export interface EnquiryReplyOptions {
  variant?: EnquiryReplyVariant;
  current_value?: string;
  include_sensitive?: boolean;
}

export const aiApi = {
  meta: () => apiClient.get("/ai/meta") as Promise<AiMeta>,
  generate: (
    task: string,
    context: Record<string, unknown>,
    options: Record<string, unknown> = {},
  ) =>
    apiClient.post("/ai/generate", {
      task,
      context,
      options,
    }) as Promise<AiGenerateResponse>,
  improve: (
    task: string,
    currentValue: string,
    options: Record<string, unknown> = {},
  ) =>
    apiClient.post("/ai/improve", {
      task,
      current_value: currentValue,
      options,
    }) as Promise<AiGenerateResponse>,
  getBrandVoice: () =>
    apiClient.get("/ai/brand-voice") as Promise<{ data: AiBrandVoice }>,
  saveBrandVoice: (data: AiBrandVoice) =>
    apiClient.put("/ai/brand-voice", data) as Promise<{
      data: AiBrandVoice;
      message: string;
    }>,
  setKey: (provider: string, apiKey: string) =>
    apiClient.post(`/ai/keys/${encodeURIComponent(provider)}`, {
      api_key: apiKey,
    }) as Promise<{
      keys: Record<string, AiKeyStatus>;
      message: string;
    }>,
  deleteKey: (provider: string) =>
    apiClient.delete(`/ai/keys/${encodeURIComponent(provider)}`) as Promise<{
      keys: Record<string, AiKeyStatus>;
      message: string;
    }>,
  testKey: (provider: string) =>
    apiClient.post(
      `/ai/keys/${encodeURIComponent(provider)}/test`,
      {},
    ) as Promise<{
      ok: boolean;
      message: string;
    }>,
  getUsage: () =>
    apiClient.get("/ai/usage") as Promise<{ data: AiUsageSummary }>,

  // Operations AI
  draftEnquiryReply: (enquiryId: number, opts: EnquiryReplyOptions = {}) =>
    apiClient.post(
      `/ai/enquiry/${encodeURIComponent(String(enquiryId))}/draft-reply`,
      {
        variant: opts.variant ?? "fresh",
        current_value: opts.current_value ?? "",
        include_sensitive: opts.include_sensitive ?? false,
      },
    ) as Promise<AiGenerateResponse>,
  getDashboardDigest: () =>
    apiClient.get("/ai/dashboard/digest") as Promise<{ data: AiDigest }>,
  /**
   * AI customer summary — 3-line operator-facing snapshot
   * (status / history, last trip, operationally-relevant notes).
   * Sensitive fields (medical / dietary / notes) only flow when
   * `include_sensitive` is true.
   */
  getCustomerSummary: (customerId: number, includeSensitive = false) =>
    apiClient.post(
      `/ai/customer/${encodeURIComponent(String(customerId))}/summary`,
      { include_sensitive: includeSensitive },
    ) as Promise<{
      data: {
        text: string;
        generated_at: number;
        customer_id: number;
        sensitive_included: boolean;
      };
    }>,
  refreshDashboardDigest: () =>
    apiClient.post("/ai/dashboard/digest/refresh", {}) as Promise<{
      data: AiDigest;
    }>,

  // Prompt overrides
  listPrompts: () =>
    apiClient.get("/ai/prompts") as Promise<{ data: AiPromptRow[] }>,
  savePromptOverride: (task: string, override: AiPromptOverridePayload) =>
    apiClient.put(
      `/ai/prompts/${encodeURIComponent(task)}`,
      override,
    ) as Promise<{
      task: string;
      override: AiPromptOverridePayload;
      has_override: boolean;
      message: string;
    }>,
  resetPrompt: (task: string) =>
    apiClient.delete(`/ai/prompts/${encodeURIComponent(task)}`) as Promise<{
      task: string;
      message: string;
    }>,
  resetAllPrompts: () =>
    apiClient.delete("/ai/prompts") as Promise<{ message: string }>,

  // Public chat toggle
  setTripChatEnabled: (enabled: boolean) =>
    apiClient.put("/ai/trip-chat-toggle", { enabled }) as Promise<{
      enabled: boolean;
      message: string;
    }>,
  setTripChatLimits: (patch: Partial<AiChatLimits>) =>
    apiClient.put("/ai/trip-chat-limits", patch) as Promise<{
      limits: AiChatLimits;
      message: string;
    }>,

  /**
   * Trip Creation agent — generates every section in one coherent
   * agent run instead of N parallel single-shot calls. Replaces the
   * old fire-10-parallel-`generate()` design in the wizard.
   *
   * Response shape:
   *   { wizard_session_id, sections: { description, short_description,
   *     trip_details, what_makes_special, trip_story, highlights,
   *     included_items, excluded_items, cancellation_policy, faqs,
   *     itinerary, starting_location, ending_location,
   *     accommodation_type, meta_title, meta_description },
   *     missing[], tool_trace[], prompt_tokens, completion_tokens, … }
   */
  wizardCreateTrip: (setup: Record<string, unknown>) =>
    apiClient.post("/ai/wizard/trip", { setup }) as Promise<{
      wizard_session_id: string;
      text: string;
      sections: Record<string, unknown>;
      missing: string[];
      tool_trace: Array<{ name: string; args: Record<string, unknown> }>;
      prompt_tokens: number;
      completion_tokens: number;
      provider: string;
      model: string;
      turns: number;
    }>,

  /**
   * Regenerate one wizard section, keeping the others. The agent
   * reads the existing sections so the new one stays consistent.
   */
  wizardRegenSection: (
    section: string,
    setup: Record<string, unknown>,
    sections: Record<string, unknown>,
    guidance = "",
  ) =>
    apiClient.post("/ai/wizard/trip/section", {
      section,
      setup,
      sections,
      guidance,
    }) as Promise<{
      section: string;
      content: unknown;
      tool_trace: Array<{ name: string; args: Record<string, unknown> }>;
      prompt_tokens: number;
      completion_tokens: number;
      provider: string;
      model: string;
    }>,

  /**
   * Generate a {subject, body} pair for an email template. Caller
   * passes the template_key + catalog metadata + the operator's
   * tone/extra-context. The agent references only the merge tags
   * supplied in `merge_tags`.
   */
  generateEmailTemplate: (request: {
    template_key: string;
    template_name?: string;
    template_description?: string;
    recipient_type?: "customer" | "admin";
    merge_tags?: string[];
    current_subject?: string;
    current_body?: string;
    tone?: string;
    extra_context?: string;
  }) =>
    apiClient.post("/ai/email-template/generate", request) as Promise<{
      subject: string;
      body: string;
      provider: string;
      model: string;
      prompt_tokens: number;
      completion_tokens: number;
      turns: number;
    }>,

  // Standalone itinerary builder
  draftItinerary: (
    tripId: number,
    extraContextOrSetup: string | Record<string, unknown> = "",
  ) =>
    apiClient.post(
      `/ai/itinerary/${encodeURIComponent(String(tripId))}/draft`,
      typeof extraContextOrSetup === "string"
        ? { extra_context: extraContextOrSetup }
        : { setup: extraContextOrSetup },
    ) as Promise<{
      text: string;
      days: Array<{
        day: number;
        day_title: string;
        description: string;
        activities?: Array<{
          title: string;
          description?: string;
          item_type?: string;
          item_name?: string;
          start_time?: string;
          end_time?: string;
          duration?: string;
          location?: string;
        }>;
      }>;
      trip: { id: number; name: string; duration_days: number };
      prompt_tokens: number;
      completion_tokens: number;
    }>,
  applyItinerary: (
    tripId: number,
    days: Array<{
      day: number;
      day_title: string;
      description: string;
      activities?: Array<{
        title: string;
        description?: string;
        item_type?: string;
        item_name?: string;
        start_time?: string;
        end_time?: string;
        duration?: string;
        location?: string;
      }>;
    }>,
    replace: boolean,
  ) =>
    apiClient.post(
      `/ai/itinerary/${encodeURIComponent(String(tripId))}/apply`,
      {
        days,
        replace,
      },
    ) as Promise<{
      created: Array<{ id: number; day: number; day_title: string }>;
      count: number;
      message: string;
    }>,
};

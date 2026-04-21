/**
 * Centralized REST calls for plugin settings (`/settings`).
 */

import { apiClient } from "../lib/api-client";
import { API_ENDPOINTS } from "../lib/api-endpoints";
import { unwrapApiPayload } from "../lib/unwrap-api-payload";

export type CoreEmailTemplatePreviewPayload = {
  template_key: string;
  subject: string;
  body: string;
  /** Optional Yatra trip ID — merges real trip_name, trip_url, trip_id into preview samples. */
  trip_id?: number;
};

export type EmailPreviewResult = {
  subject: string;
  body: string;
};

export async function fetchSettings(): Promise<Record<string, unknown>> {
  return unwrapApiPayload<Record<string, unknown>>(
    await apiClient.get(API_ENDPOINTS.SETTINGS),
  );
}

export async function saveSettings(
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiClient.put(API_ENDPOINTS.SETTINGS, data);
}

export async function previewCoreEmailTemplate(
  payload: CoreEmailTemplatePreviewPayload,
): Promise<EmailPreviewResult> {
  const response = await apiClient.post(
    API_ENDPOINTS.SETTINGS_EMAIL_TEMPLATE_PREVIEW,
    payload,
  );
  return unwrapApiPayload<EmailPreviewResult>(response);
}

export async function fetchWordPressPages(): Promise<unknown> {
  return apiClient.get(API_ENDPOINTS.SETTINGS_PAGES);
}

export async function postFlushRewriteRules(): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.SETTINGS_FLUSH_REWRITE_RULES);
}

export async function fetchBookingPageShortcodeStatus(
  pageId: number,
): Promise<unknown> {
  return apiClient.get(API_ENDPOINTS.SETTINGS_CHECK_SHORTCODE(pageId));
}

export async function postInsertBookingShortcode(
  pageId: number,
): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.SETTINGS_INSERT_SHORTCODE(pageId));
}

export async function fetchPaymentGatewayDefinitions(): Promise<unknown> {
  return apiClient.get(API_ENDPOINTS.PAYMENT_GATEWAY_DEFINITIONS);
}

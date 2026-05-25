/**
 * Centralized REST calls for Email Automation (Yatra Pro).
 */

import { apiClient } from "../lib/api-client";
import { API_ENDPOINTS } from "../lib/api-endpoints";
import { unwrapApiPayload } from "../lib/unwrap-api-payload";

export type EmailTemplateVariableMap = Record<
  string,
  { key: string; description?: string }[]
>;

export type EmailPreviewPayload = {
  subject: string;
  body: string;
};

export async function fetchEmailTemplates(): Promise<unknown[]> {
  const raw = await apiClient.get(API_ENDPOINTS.EMAIL_TEMPLATES);
  const unwrapped = unwrapApiPayload<unknown>(raw);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export async function fetchEmailTemplate(
  id: string | number,
): Promise<Record<string, unknown> | null> {
  return unwrapApiPayload<Record<string, unknown> | null>(
    await apiClient.get(API_ENDPOINTS.EMAIL_TEMPLATE_GET(id)),
  );
}

/**
 * Fetch the merge-tag catalog for the Template Editor "Available
 * Variables" sidebar.
 *
 * Pass `eventKey` to get only the variables that apply to that
 * automation event (e.g. `booking.created` returns the booking +
 * customer + payment tags but skips enquiry / consent). Omit it
 * (or pass an empty string) to get the full union of all tags —
 * matches the pre-3.0.5 behavior for callers that haven't been
 * updated.
 */
export async function fetchEmailTemplateVariables(
  eventKey?: string,
): Promise<EmailTemplateVariableMap> {
  const url =
    eventKey && eventKey.trim() !== ""
      ? `${API_ENDPOINTS.EMAIL_TEMPLATE_VARIABLES}?event_key=${encodeURIComponent(eventKey.trim())}`
      : API_ENDPOINTS.EMAIL_TEMPLATE_VARIABLES;
  return unwrapApiPayload<EmailTemplateVariableMap>(await apiClient.get(url));
}

export async function createEmailTemplate(data: unknown): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.EMAIL_TEMPLATES, data);
}

export async function updateEmailTemplate(
  id: string | number,
  data: unknown,
): Promise<unknown> {
  return apiClient.put(API_ENDPOINTS.EMAIL_TEMPLATE_GET(id), data);
}

export async function setEmailTemplateActive(
  id: number,
  is_active: boolean,
): Promise<unknown> {
  return apiClient.put(API_ENDPOINTS.EMAIL_TEMPLATE_GET(id), { is_active });
}

export async function deleteEmailTemplate(id: number): Promise<unknown> {
  return apiClient.delete(API_ENDPOINTS.EMAIL_TEMPLATE_GET(id));
}

export async function duplicateEmailTemplate(id: number): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.EMAIL_TEMPLATE_DUPLICATE(id));
}

export async function previewEmailTemplate(
  id: string | number,
): Promise<EmailPreviewPayload> {
  const response = await apiClient.post(
    API_ENDPOINTS.EMAIL_TEMPLATE_PREVIEW(id),
    {},
  );
  return unwrapApiPayload<EmailPreviewPayload>(response);
}

export async function sendEmailTemplateTest(
  id: string | number,
  email: string,
): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.EMAIL_TEMPLATE_TEST(id), { email });
}

export async function fetchEmailSequences(): Promise<unknown[]> {
  const raw = await apiClient.get(API_ENDPOINTS.EMAIL_SEQUENCES);
  const unwrapped = unwrapApiPayload<unknown>(raw);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export async function fetchEmailSequence(
  id: string | number,
): Promise<unknown> {
  return unwrapApiPayload(
    await apiClient.get(API_ENDPOINTS.EMAIL_SEQUENCE_GET(id)),
  );
}

export async function createEmailSequence(data: unknown): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.EMAIL_SEQUENCES, data);
}

export async function updateEmailSequence(
  id: string | number,
  data: unknown,
): Promise<unknown> {
  return apiClient.put(API_ENDPOINTS.EMAIL_SEQUENCE_GET(id), data);
}

export async function deleteEmailSequence(id: number): Promise<unknown> {
  return apiClient.delete(API_ENDPOINTS.EMAIL_SEQUENCE_GET(id));
}

export async function updateEmailSequenceStatus(
  id: number,
  status: string,
): Promise<unknown> {
  return apiClient.put(API_ENDPOINTS.EMAIL_SEQUENCE_GET(id), { status });
}

export type EmailLogsPageResult = {
  items: unknown[];
  total: number;
  per_page: number;
  current_page: number;
};

export async function fetchEmailLogs(params?: {
  page?: number;
  per_page?: number;
  template_key?: string;
  recipient_email?: string;
  status?: string;
}): Promise<EmailLogsPageResult> {
  const raw = await apiClient.get(API_ENDPOINTS.EMAIL_LOGS, { params });
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (r.success === true && "data" in r) {
      const meta = (r.meta as Record<string, unknown>) || {};
      const items = Array.isArray(r.data) ? r.data : [];
      return {
        items,
        total: Number(meta.total) || items.length,
        per_page: Number(meta.per_page) || params?.per_page || 20,
        current_page: Number(meta.current_page) || params?.page || 1,
      };
    }
  }
  const fallback = unwrapApiPayload<unknown>(raw);
  const items = Array.isArray(fallback) ? fallback : [];
  return {
    items,
    total: items.length,
    per_page: params?.per_page || 20,
    current_page: params?.page || 1,
  };
}

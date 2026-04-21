/**
 * Opt-in usage telemetry REST API.
 */

import { apiClient } from "../lib/api-client";
import { API_ENDPOINTS } from "../lib/api-endpoints";
import { unwrapApiPayload } from "../lib/unwrap-api-payload";

export type UsageTrackingStatus = {
  enabled: boolean;
  last_sync: number;
  next_scheduled: number;
  retry_count: number;
  next_retry: number;
  instance_id: string;
};

export async function fetchUsageTrackingStatus(): Promise<UsageTrackingStatus> {
  return unwrapApiPayload<UsageTrackingStatus>(
    await apiClient.get(API_ENDPOINTS.USAGE_TRACKING_STATUS),
  );
}

export async function postUsageTrackingSettings(enabled: boolean): Promise<{
  enabled: boolean;
}> {
  return unwrapApiPayload<{ enabled: boolean }>(
    await apiClient.post(API_ENDPOINTS.USAGE_TRACKING_SETTINGS, { enabled }),
  );
}

export async function postUsageTrackingSend(options?: {
  force?: boolean;
}): Promise<{ success: boolean; message?: string }> {
  const body: { force?: boolean } = {};
  if (options?.force) {
    body.force = true;
  }
  return apiClient.post(API_ENDPOINTS.USAGE_TRACKING_SEND, body) as Promise<{
    success: boolean;
    message?: string;
  }>;
}

export async function fetchUsageTrackingPreview(): Promise<{ json: string }> {
  return unwrapApiPayload<{ json: string }>(
    await apiClient.get(API_ENDPOINTS.USAGE_TRACKING_PREVIEW),
  );
}

export async function postUsageTrackingClearCache(): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.USAGE_TRACKING_CLEAR_CACHE, {});
}

export async function postUsageTrackingDeleteSnapshots(): Promise<unknown> {
  return apiClient.post(API_ENDPOINTS.USAGE_TRACKING_DELETE_SNAPSHOTS, {});
}

import { apiClient } from "../lib/api-client";

export interface ChannelTypeDef {
  type: string;
  name: string;
  description: string;
  docs_url: string;
  signup_url: string;
  credentials: Record<
    string,
    { label: string; description: string; required: boolean; docs_url?: string }
  >;
  capabilities: Record<string, boolean>;
}

export interface ChannelManagerMeta {
  is_eligible: boolean;
  is_module_enabled: boolean;
  channel_types: ChannelTypeDef[];
  upgrade_url: string;
  docs_url: string;
  webhook_url: string;
}

export interface ChannelHealth {
  status: "green" | "amber" | "red";
  breaker: {
    state: "closed" | "open" | "half_open";
    failure_count: number;
    opened_at: number;
    last_failure: string;
    updated_at: number;
  };
  recent: { ok: number; fail: number; total: number };
}

export interface ChannelRow {
  id: number;
  channel_type: string;
  display_name: string;
  account_label: string;
  is_enabled: boolean;
  is_test_mode: boolean;
  currency: string;
  default_offset_percent: number;
  commission_percent: number;
  inventory_buffer: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  settings: Record<string, unknown>;
  credentials?: Record<string, { configured: boolean; hint: string }>;
  health?: ChannelHealth;
}

export interface MappingRow {
  id: number;
  channel_id: number;
  trip_id: number;
  external_product_id: string;
  external_url: string | null;
  price_offset_percent: number;
  is_active: boolean;
  sync_inventory: boolean;
  sync_pricing: boolean;
  last_synced_at: string | null;
  last_sync_status: string | null;
  external_data: Record<string, unknown>;
}

export interface ChannelBookingRow {
  id: number;
  channel_id: number;
  mapping_id: number | null;
  trip_id: number | null;
  yatra_booking_id: number | null;
  external_booking_id: string;
  external_status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  departure_date: string | null;
  travelers_total: number;
  total_amount: number;
  currency: string;
  commission_amount: number | null;
  net_amount: number | null;
  processing_status: string;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

export interface SyncLogRow {
  id: number;
  channel_id: number | null;
  mapping_id: number | null;
  trip_id: number | null;
  booking_id: number | null;
  direction: "push" | "pull";
  operation: string;
  status: string;
  http_status: number | null;
  external_id: string | null;
  summary: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export const channelManagerApi = {
  getMeta: () =>
    apiClient.get("/channel-manager/meta") as Promise<ChannelManagerMeta>,

  listChannels: () =>
    apiClient.get("/channel-manager/channels") as Promise<{ data: ChannelRow[] }>,

  createChannel: (payload: Partial<ChannelRow> & { channel_type: string }) =>
    apiClient.post("/channel-manager/channels", payload) as Promise<{
      data: ChannelRow;
      message: string;
    }>,

  updateChannel: (id: number, payload: Partial<ChannelRow>) =>
    apiClient.put(`/channel-manager/channels/${id}`, payload) as Promise<{
      data: ChannelRow;
      message: string;
    }>,

  deleteChannel: (id: number) =>
    apiClient.delete(`/channel-manager/channels/${id}`) as Promise<{ message: string }>,

  updateCredential: (id: number, field: string, value: string) =>
    apiClient.put(`/channel-manager/channels/${id}/credential`, {
      field,
      value,
    }) as Promise<{
      credentials: Record<string, { configured: boolean; hint: string }>;
      message: string;
    }>,

  testConnection: (id: number) =>
    apiClient.post(`/channel-manager/channels/${id}/test-connection`, {}) as Promise<{
      ok: boolean;
      http_status: number | null;
      error: string;
    }>,

  syncChannel: (id: number) =>
    apiClient.post(`/channel-manager/channels/${id}/sync`, {}) as Promise<{
      ok: boolean;
      pushed: number;
      failed: number;
      message: string;
    }>,

  channelHealth: (id: number) =>
    apiClient.get(`/channel-manager/channels/${id}/health`) as Promise<{
      data: ChannelHealth;
    }>,

  testWebhook: (id: number) =>
    apiClient.post(`/channel-manager/channels/${id}/test-webhook`, {}) as Promise<{
      ok: boolean;
      http_status: number;
      response: Record<string, unknown>;
      webhook_url: string;
      error?: string;
    }>,

  bulkMappings: (action: "sync" | "enable" | "disable" | "delete", ids: number[]) =>
    apiClient.post("/channel-manager/mappings/bulk", { action, ids }) as Promise<{
      ok: boolean;
      action: string;
      succeeded: number;
      failed: number;
      results: Array<{ id: number; ok: boolean; message: string }>;
      message: string;
    }>,

  listMappings: (channelId?: number) =>
    apiClient.get("/channel-manager/mappings", {
      params: channelId ? { channel_id: channelId } : {},
    }) as Promise<{ data: MappingRow[] }>,

  createMapping: (payload: Partial<MappingRow>) =>
    apiClient.post("/channel-manager/mappings", payload) as Promise<{
      data: MappingRow;
      message: string;
    }>,

  updateMapping: (id: number, payload: Partial<MappingRow>) =>
    apiClient.put(`/channel-manager/mappings/${id}`, payload) as Promise<{
      data: MappingRow;
      message: string;
    }>,

  deleteMapping: (id: number) =>
    apiClient.delete(`/channel-manager/mappings/${id}`) as Promise<{ message: string }>,

  syncMapping: (id: number) =>
    apiClient.post(`/channel-manager/mappings/${id}/sync`, {}) as Promise<{
      ok: boolean;
      http_status: number | null;
      error: string;
    }>,

  listBookings: (filters: {
    channel_id?: number;
    processing_status?: string;
    per_page?: number;
  } = {}) =>
    apiClient.get("/channel-manager/bookings", { params: filters }) as Promise<{
      data: ChannelBookingRow[];
    }>,

  listLogs: (filters: {
    channel_id?: number;
    operation?: string;
    status?: string;
    per_page?: number;
  } = {}) =>
    apiClient.get("/channel-manager/logs", { params: filters }) as Promise<{
      data: SyncLogRow[];
    }>,
};

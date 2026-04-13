/**
 * API Client for WordPress REST API
 * Centralized API service with proper URL handling and authentication
 */

import { API_ENDPOINTS } from "./api-endpoints";

type RequestInfo = {
  url: string;
  method: string;
  payload?: string;
};

const serializePayload = (
  body: BodyInit | null | undefined,
): string | undefined => {
  if (!body) {
    return undefined;
  }

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const entries: Record<string, unknown> = {};
    body.forEach((value, key) => {
      entries[key] = value;
    });
    try {
      return JSON.stringify(entries, null, 2);
    } catch {
      return "[FormData]";
    }
  }

  if (typeof body === "object") {
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }

  return String(body);
};

const formatRequestUrl = (rawUrl: string): string => {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const params = new URLSearchParams(parsed.search);
    const restRoute = params.get("rest_route");

    if (restRoute) {
      params.delete("rest_route");
      const decodedRoute = decodeURIComponent(restRoute);
      const normalizedRoute = decodedRoute.startsWith("/")
        ? decodedRoute
        : `/${decodedRoute}`;
      const remainingParams = params.toString();
      return `${parsed.origin}${normalizedRoute}${remainingParams ? `?${remainingParams}` : ""}`;
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

class ApiError extends Error {
  response: {
    status: number;
    statusText: string;
    data: any;
  };
  requestInfo?: RequestInfo;

  constructor(
    message: string,
    response: { status: number; statusText: string; data: any },
    requestInfo?: RequestInfo,
  ) {
    super(message);
    this.name = "ApiError";
    this.response = response;
    this.requestInfo = requestInfo;
  }
}

type YatraWindowGlobals = Window & {
  yatraAccountPage?: { apiUrl?: string; nonce?: string };
  yatraAdmin?: { apiUrl?: string; nonce?: string };
};

class ApiClient {
  /** Public account page uses `yatraAccountPage`; admin uses `yatraAdmin`. Resolve per request so module load order never leaves an empty nonce. */
  private resolveBaseUrl(): string {
    if (typeof window === "undefined") {
      return "/wp-json/yatra/v1";
    }
    const w = window as YatraWindowGlobals;
    const raw =
      w.yatraAccountPage?.apiUrl || w.yatraAdmin?.apiUrl || "/wp-json/yatra/v1";
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }

  private resolveNonce(): string {
    if (typeof window === "undefined") {
      return "";
    }
    const w = window as YatraWindowGlobals;
    return w.yatraAccountPage?.nonce || w.yatraAdmin?.nonce || "";
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    queryParams?: URLSearchParams,
  ): Promise<any> {
    // Extract endpoint path (remove any query params that might have been appended)
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/")
      ? endpointPath
      : `/${endpointPath}`;

    // Build URL properly - handle query string format (rest_route) vs pretty permalinks
    let url: string;
    const baseUrl = this.resolveBaseUrl();

    // Check if baseUrl uses query string format (contains ?rest_route=)
    if (baseUrl.includes("?rest_route=")) {
      // Query string format: append endpoint to rest_route value, then add other params with &
      const [base, queryString] = baseUrl.split("?");
      const params = new URLSearchParams(queryString);
      const restRoute = params.get("rest_route") || "";
      params.set("rest_route", restRoute + cleanEndpoint);

      // Add any query params from endpoint or passed separately
      if (endpointQuery) {
        const endpointParams = new URLSearchParams(endpointQuery);
        endpointParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      if (queryParams) {
        queryParams.forEach((value, key) => {
          params.append(key, value);
        });
      }

      url = `${base}?${params.toString()}`;
    } else {
      // Pretty permalink format: append endpoint and add query params with ?
      url = `${baseUrl}${cleanEndpoint}`;
      if (endpointQuery || queryParams) {
        const params = new URLSearchParams();
        if (endpointQuery) {
          const endpointParams = new URLSearchParams(endpointQuery);
          endpointParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        if (queryParams) {
          queryParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        url += `?${params.toString()}`;
      }
    }

    const isFormDataBody =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    // Build headers
    const headers: HeadersInit = {
      "X-WP-Nonce": this.resolveNonce(),
      ...options.headers,
    };

    // Only set JSON content-type when we're not sending FormData and caller didn't override.
    if (!isFormDataBody) {
      const hasContentTypeHeader =
        (headers instanceof Headers && headers.has("Content-Type")) ||
        (!(headers instanceof Headers) &&
          Object.keys(headers as Record<string, any>).some(
            (k) => k.toLowerCase() === "content-type",
          ));

      if (!hasContentTypeHeader) {
        (headers as any)["Content-Type"] = "application/json";
      }
    }

    const method = (options.method || "GET").toUpperCase();
    const serializedPayload = serializePayload(options.body);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const raw = await response.text();
      let data: any = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
      }
      const message =
        (typeof data === "object" && data?.message) ||
        (typeof data === "string" && data) ||
        response.statusText ||
        `HTTP error! status: ${response.status}`;

      throw new ApiError(
        message,
        {
          status: response.status,
          statusText: response.statusText,
          data,
        },
        {
          url: formatRequestUrl(url),
          method,
          payload: serializedPayload,
        },
      );
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async requestBlob(
    endpoint: string,
    options: RequestInit = {},
    queryParams?: URLSearchParams,
  ): Promise<Blob> {
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/")
      ? endpointPath
      : `/${endpointPath}`;

    let url: string;
    const baseUrl = this.resolveBaseUrl();
    if (baseUrl.includes("?rest_route=")) {
      const [base, queryString] = baseUrl.split("?");
      const params = new URLSearchParams(queryString);
      const restRoute = params.get("rest_route") || "";
      params.set("rest_route", restRoute + cleanEndpoint);

      if (endpointQuery) {
        const endpointParams = new URLSearchParams(endpointQuery);
        endpointParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      if (queryParams) {
        queryParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      url = `${base}?${params.toString()}`;
    } else {
      url = `${baseUrl}${cleanEndpoint}`;
      if (endpointQuery || queryParams) {
        const params = new URLSearchParams();
        if (endpointQuery) {
          const endpointParams = new URLSearchParams(endpointQuery);
          endpointParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        if (queryParams) {
          queryParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        url += `?${params.toString()}`;
      }
    }

    const isFormDataBody =
      typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers: HeadersInit = {
      "X-WP-Nonce": this.resolveNonce(),
      ...options.headers,
    };
    if (!isFormDataBody) {
      const hasContentTypeHeader =
        (headers instanceof Headers && headers.has("Content-Type")) ||
        (!(headers instanceof Headers) &&
          Object.keys(headers as Record<string, any>).some(
            (k) => k.toLowerCase() === "content-type",
          ));
      if (!hasContentTypeHeader) {
        (headers as any)["Content-Type"] = "application/json";
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`,
      );
    }

    return response.blob();
  }

  async get(
    endpoint: string,
    config?: { params?: Record<string, any> },
  ): Promise<any> {
    // Build query parameters
    let queryParams: URLSearchParams | undefined;

    if (config?.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams!.append(key, String(value));
        }
      });
    }

    return this.request(
      endpoint,
      {
        method: "GET",
      },
      queryParams,
    );
  }

  async getBlob(
    endpoint: string,
    config?: { params?: Record<string, any> },
  ): Promise<Blob> {
    let queryParams: URLSearchParams | undefined;

    if (config?.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams!.append(key, String(value));
        }
      });
    }

    return this.requestBlob(endpoint, { method: "GET" }, queryParams);
  }

  async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete(endpoint: string, config?: { data?: any }): Promise<any> {
    return this.request(endpoint, {
      method: "DELETE",
      body: config?.data ? JSON.stringify(config.data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();

/**
 * GET /payments/{id} returns the payment entity as the JSON body. Some admin screens expect
 * { success: true, data: payment }; normalize so both shapes work.
 */
async function fetchPaymentNormalized(
  id: string | number,
): Promise<
  | { success: true; data: Record<string, unknown> }
  | { success: false; message: string }
  | null
> {
  const raw = await apiClient.get(API_ENDPOINTS.PAYMENT_GET(id));
  if (raw == null) {
    return null;
  }
  if (typeof raw !== "object") {
    return null;
  }
  const r = raw as Record<string, unknown>;
  if (r.success === true && r.data != null && typeof r.data === "object") {
    return { success: true, data: r.data as Record<string, unknown> };
  }
  if (r.id !== undefined && r.id !== null) {
    return { success: true, data: r as Record<string, unknown> };
  }
  return {
    success: false,
    message: String(r.message ?? "Payment not found"),
  };
}

class WpApiClient {
  private baseUrl: string;
  private nonce: string;

  constructor() {
    const rawUrl = (window as any)?.yatraAdmin?.restUrl || "/wp-json";
    this.baseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
    this.nonce = (window as any)?.yatraAdmin?.nonce || "";
  }

  async get(endpoint: string): Promise<any> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-WP-Nonce": this.nonce,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  }
}

const wpClient = new WpApiClient();

export const wpService = {
  getMedia: (id: string | number) => wpClient.get(`/wp/v2/media/${id}`),
};

export const ajaxService = {
  post: async (action: string, data: Record<string, any>) => {
    const siteUrl = (window as any)?.yatraAdmin?.siteUrl || "";
    const url = `${siteUrl}/wp-admin/admin-ajax.php`;

    const body = new URLSearchParams({
      action,
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v == null ? "" : String(v)]),
      ),
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      credentials: "include",
    });

    return response.json();
  },
};

// Convenience methods for common operations
export const apiService = {
  // Bookings
  getBookings: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.BOOKINGS, { params }),
  getBooking: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.BOOKING_GET(id)),
  createBooking: (data: any) => apiClient.post(API_ENDPOINTS.BOOKINGS, data),
  updateBooking: (id: string | number, data: any) =>
    apiClient.put(API_ENDPOINTS.BOOKING_GET(id), data),
  updateBookingStatus: (id: string | number, status: string) =>
    apiClient.put(API_ENDPOINTS.BOOKING_STATUS(id), { status }),
  deleteBooking: (id: string | number) =>
    apiClient.delete(API_ENDPOINTS.BOOKING_DELETE(id)),
  getBookingsStats: () => apiClient.get(API_ENDPOINTS.BOOKINGS_STATS),

  // Customers
  getCustomers: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.CUSTOMERS, { params }),
  getCustomer: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.CUSTOMER_GET(id)),
  deleteCustomer: (id: string | number) =>
    apiClient.delete(API_ENDPOINTS.CUSTOMER_DELETE(id)),
  updateCustomer: (id: string | number, data: any) =>
    apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), data),
  updateCustomerStatus: (id: string | number, status: string) =>
    apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), { status }),
  getCustomerBookings: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.CUSTOMER_BOOKINGS(id)),
  getCustomerStats: () => apiClient.get(API_ENDPOINTS.CUSTOMER_STATS),

  // Travelers
  getTravelers: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.TRAVELERS, { params }),
  bulkTravelersAction: (action: string, ids: (string | number)[]) =>
    apiClient.put(API_ENDPOINTS.TRAVELERS_BULK, { action, ids }),

  // Reviews
  getReviews: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.REVIEWS, { params }),
  deleteReview: (id: string | number) =>
    apiClient.delete(API_ENDPOINTS.REVIEW_DELETE(id)),
  updateReviewStatus: (id: string | number, status: string) =>
    apiClient.put(API_ENDPOINTS.REVIEW_STATUS(id), { status }),
  bulkReviewsAction: (action: string, ids: (string | number)[]) =>
    apiClient.put(API_ENDPOINTS.REVIEWS_BULK, { action, ids }),

  // Trips
  getTrips: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.TRIPS, { params }),
  getTrip: (id: string | number) => apiClient.get(API_ENDPOINTS.TRIP_GET(id)),
  deleteTrip: (id: string | number) =>
    apiClient.delete(API_ENDPOINTS.TRIP_DELETE(id)),
  duplicateTrip: (id: string | number) =>
    apiClient.post(API_ENDPOINTS.TRIP_DUPLICATE(id)),

  // Settings
  getSettings: (group?: string) =>
    apiClient.get(
      group ? API_ENDPOINTS.SETTINGS_GROUP(group) : API_ENDPOINTS.SETTINGS,
    ),

  // Payments
  getPayment: (id: string | number) => fetchPaymentNormalized(id),
  deletePayment: (id: string | number) =>
    apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id)),
  getPayments: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.PAYMENTS, { params }),
  getPaymentsStats: () => apiClient.get(API_ENDPOINTS.PAYMENTS_STATS),
  createPayment: (data: any) => apiClient.post(API_ENDPOINTS.PAYMENTS, data),
  updatePayment: (id: string | number, data: any) =>
    apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), data),
  updatePaymentStatus: (id: string | number, status: string) =>
    apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), { status }),
  bulkPaymentsAction: (action: string, ids: (string | number)[]) =>
    Promise.all(
      ids.map((id) => {
        if (action === "delete") {
          return apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id));
        } else {
          return apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), {
            status: action,
          });
        }
      }),
    ),

  // Modules
  getModules: () => apiClient.get(API_ENDPOINTS.MODULES),

  // Facebook Pixel
  getFacebookPixelSettings: () =>
    apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_SETTINGS),
  testFacebookPixel: (pixelId: string) =>
    apiClient.post(API_ENDPOINTS.FACEBOOK_PIXEL_TEST, { pixel_id: pixelId }),
  testFacebookPixelToken: (accessToken: string) =>
    apiClient.post(API_ENDPOINTS.FACEBOOK_PIXEL_TEST_TOKEN, {
      access_token: accessToken,
    }),
  getFacebookPixelEvents: () =>
    apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_EVENTS),
  getFacebookPixelEventLogs: () =>
    apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_EVENT_LOGS),
  clearFacebookPixelEventLogs: () =>
    apiClient.delete(API_ENDPOINTS.FACEBOOK_PIXEL_EVENT_LOGS),

  // Google Analytics 4
  getGoogleAnalyticsSettings: () =>
    apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_SETTINGS),
  testGoogleAnalytics: (measurementId: string) =>
    apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_TEST, {
      measurement_id: measurementId,
    }),
  validateGoogleAnalyticsMeasurementId: (measurementId: string) =>
    apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_VALIDATE_MEASUREMENT_ID, {
      measurement_id: measurementId,
    }),
  validateGoogleAnalyticsApiSecret: (
    measurementId: string,
    apiSecret: string,
  ) =>
    apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_VALIDATE_API_SECRET, {
      measurement_id: measurementId,
      api_secret: apiSecret,
    }),
  getGoogleAnalyticsEvents: () =>
    apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENTS),
  getGoogleAnalyticsEventLogs: () =>
    apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENT_LOGS),
  clearGoogleAnalyticsEventLogs: () =>
    apiClient.delete(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENT_LOGS),

  // Payment Gateways
  getPaymentGateways: () => apiClient.get(API_ENDPOINTS.PAYMENT_GATEWAYS),

  // Abandoned Bookings
  getAbandonedBookings: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS, { params }),
  getAbandonedBooking: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.ABANDONED_BOOKING_GET(id)),
  deleteAbandonedBooking: (id: string | number) =>
    apiClient.delete(API_ENDPOINTS.ABANDONED_BOOKING_DELETE(id)),
  getAbandonedBookingsSettings: () =>
    apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS),
  saveAbandonedBookingsSettings: (data: any) =>
    apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS, data),
  getAbandonedBookingsStatistics: () =>
    apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_STATISTICS),
  sendAbandonedBookingEmail: (id: string | number) =>
    apiClient.post(API_ENDPOINTS.ABANDONED_BOOKING_SEND_EMAIL(id)),
  getAbandonedBookingCampaigns: () =>
    apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS),
  getAbandonedBookingCampaign: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id)),
  createAbandonedBookingCampaign: (data: any) =>
    apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS, data),
  updateAbandonedBookingCampaign: (id: string | number, data: any) =>
    apiClient.put(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id), data),

  // Enquiries
  getEnquiries: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.ENQUIRIES, { params }),
  getEnquiry: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.ENQUIRY_GET(id)),
  deleteEnquiry: (id: string | number) =>
    apiClient.delete(API_ENDPOINTS.ENQUIRY_DELETE(id)),
  createEnquiry: (data: any) => apiClient.post(API_ENDPOINTS.ENQUIRIES, data),
  updateEnquiry: (id: string | number, data: any) =>
    apiClient.put(API_ENDPOINTS.ENQUIRY_GET(id), data),
  getEnquiriesStats: () => apiClient.get(API_ENDPOINTS.ENQUIRY_STATS),
  bulkEnquiriesAction: (action: string, ids: (string | number)[]) =>
    apiClient.put(API_ENDPOINTS.ENQUIRIES_BULK, { action, ids }),
  respondToEnquiry: (id: string | number, data: any) =>
    apiClient.post(API_ENDPOINTS.ENQUIRY_RESPOND(id), data),

  // Google Calendar
  getGoogleCalendarSettings: () =>
    apiClient.get(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS),
  connectGoogleCalendar: () =>
    apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_CONNECT),
  disconnectGoogleCalendar: () =>
    apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_DISCONNECT),
  syncAllGoogleCalendar: () =>
    apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SYNC_ALL),
  updateGoogleCalendarSettings: (data: any) =>
    apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS, data),

  // Signed Consents
  getSignedConsents: (params?: Record<string, any>) =>
    apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS, { params }),
  getSignedConsent: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_GET(id)),
  downloadSignedConsentPdf: (id: string | number) =>
    apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_PDF(id)),
  previewSignedConsent: () =>
    apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS_PREVIEW),

  // Tools
  getSystemStatus: () => apiClient.get(API_ENDPOINTS.TOOLS_SYSTEM_STATUS),
  getActiveJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ACTIVE_JOBS),
  getLogs: (type: string, page: number) =>
    apiClient.get(API_ENDPOINTS.TOOLS_LOGS(type, page)),
  clearLogs: (type: string) =>
    apiClient.delete(API_ENDPOINTS.TOOLS_LOGS_CLEAR(type)),
  createExportJob: (data: any) =>
    apiClient.post(API_ENDPOINTS.TOOLS_EXPORT_JOB, data),
  performJobAction: (endpoint: string, jobId: string) =>
    apiClient.get(API_ENDPOINTS.TOOLS_JOB_ACTION(endpoint, jobId)),
  downloadExportJob: (jobId: string) =>
    apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_DOWNLOAD(jobId)),
  downloadExportJobBlob: (jobId: string) =>
    apiClient.getBlob(API_ENDPOINTS.TOOLS_EXPORT_DOWNLOAD(jobId)),
  deleteExportJob: (jobId: string) =>
    apiClient.delete(API_ENDPOINTS.TOOLS_EXPORT_DELETE(jobId)),
  getExportJobStatus: (jobId: string) =>
    apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_STATUS(jobId)),
  createImportJob: (data: any) =>
    apiClient.post(API_ENDPOINTS.TOOLS_IMPORT_JOB, data),
  getImportJob: (jobId: string) =>
    apiClient.get(API_ENDPOINTS.TOOLS_IMPORT_JOB_GET(jobId)),
  deleteImportJob: (jobId: string) =>
    apiClient.delete(API_ENDPOINTS.TOOLS_IMPORT_JOB_GET(jobId)),
  getAllJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ALL_JOBS),
  getCronJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_CRON_JOBS),
  runCronJob: (hook: string) =>
    apiClient.post(API_ENDPOINTS.TOOLS_CRON_RUN(hook)),
  clearCache: () => apiClient.delete(API_ENDPOINTS.TOOLS_CLEAR_CACHE),
  getCacheView: () => apiClient.get(API_ENDPOINTS.TOOLS_CACHE_VIEW),
  clearCacheItem: (key: string, type: string) =>
    apiClient.delete(
      `${API_ENDPOINTS.TOOLS_CACHE_CLEAR_ITEM}?key=${encodeURIComponent(key)}&type=${encodeURIComponent(type)}`,
    ),

  // Migration
  getMigrationStatus: () => apiClient.get(API_ENDPOINTS.MIGRATION_STATUS),
  clearMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CLEAR),
  getMigrationProgress: () => apiClient.get(API_ENDPOINTS.MIGRATION_PROGRESS),
  runMigrationAll: (data?: any) =>
    apiClient.post(API_ENDPOINTS.MIGRATION_MIGRATE_ALL, data),
  cancelMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CANCEL),

  // Sample Data
  importSampleData: (data: any) => apiClient.post("/sample-data/import", data),
  getSampleDataStatus: () => apiClient.get("/sample-data/status"),
  cleanupSampleData: () => apiClient.delete("/sample-data/cleanup"),

  // Common bulk operations
  bulkDelete: (endpoint: string, ids: (string | number)[]) =>
    Promise.all(ids.map((id) => apiClient.delete(`${endpoint}/${id}`))),

  bulkUpdateStatus: (
    endpoint: string,
    ids: (string | number)[],
    status: string,
  ) =>
    Promise.all(
      ids.map((id) => apiClient.put(`${endpoint}/${id}/status`, { status })),
    ),
};

// Format time with AM/PM for display
export const formatTimeForDisplay = (timeString: string): string => {
  if (!timeString) return "";

  // Try to parse the time string
  const time = new Date(`1970-01-01T${timeString}`);
  if (isNaN(time.getTime())) {
    return timeString; // Return original if invalid
  }

  // Format using JavaScript's Intl.DateTimeFormat for localized time display
  return time.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

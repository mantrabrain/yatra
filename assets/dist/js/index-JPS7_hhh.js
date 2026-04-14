import { r as reactExports, j as jsxRuntimeExports, ar as X, ak as Info, as as AlertTriangle, bh as AlertCircle, bs as CheckCircle2 } from "./react-vendor-D4Bz_CyV.js";
import { _ as __$1 } from "./default-i18n-DxhLUi3L.js";
function __(key, textDomain) {
  var _a, _b;
  if (typeof window !== "undefined" && ((_b = (_a = window.wp) == null ? void 0 : _a.i18n) == null ? void 0 : _b.__)) {
    return window.wp.i18n.__(key, textDomain || "yatra");
  }
  return __$1(key, textDomain || "yatra");
}
const API_ENDPOINTS = {
  // Bookings
  BOOKINGS: "/bookings",
  BOOKING_GET: (id) => `/bookings/${id}`,
  BOOKING_STATUS: (id) => `/bookings/${id}/status`,
  BOOKING_DELETE: (id) => `/bookings/${id}`,
  BOOKINGS_BULK: "/bookings/bulk",
  BOOKINGS_STATS: "/bookings/stats",
  /** POST body: `{ booking_id }` — returns `{ checkout_url }` in `data`. */
  PAYMENT_REMAINING_SESSION: "/payment/remaining/session",
  BOOKING_CONSENT_STATUS: (id) => `/bookings/${id}/consent-status`,
  // Customers
  CUSTOMERS: "/customers",
  CUSTOMER_GET: (id) => `/customers/${id}`,
  CUSTOMER_DELETE: (id) => `/customers/${id}`,
  CUSTOMERS_BULK: "/customers/bulk",
  CUSTOMER_STATS: "/customers/stats",
  CUSTOMER_BOOKINGS: (id) => `/customers/${id}/bookings`,
  CUSTOMER_ME: "/customers/me",
  CUSTOMER_MY_BOOKINGS: "/customers/my-bookings",
  CUSTOMER_MY_PAYMENTS: "/customers/my-payments",
  CUSTOMER_MY_DOCUMENTS: "/customers/my-documents",
  CUSTOMER_MY_SUPPORT_TICKETS: "/customers/my-support-tickets",
  /** GET single booking for current user (details view). */
  CUSTOMER_MY_BOOKING: (id) => `/customers/my-bookings/${id}`,
  // Travelers
  TRAVELERS: "/travelers",
  TRAVELERS_BULK: "/travelers/bulk",
  // Reviews
  REVIEWS: "/reviews",
  REVIEW_DELETE: (id) => `/reviews/${id}`,
  REVIEW_STATUS: (id) => `/reviews/${id}/status`,
  REVIEWS_BULK: "/reviews/bulk",
  // Trips
  TRIPS: "/trips",
  TRIP_GET: (id) => `/trips/${id}`,
  TRIP_DELETE: (id) => `/trips/${id}`,
  TRIP_PERMANENT_DELETE: (id) => `/trips/${id}/permanent-delete`,
  TRIP_DUPLICATE: (id) => `/trips/${id}/duplicate`,
  TRIPS_STATS: "/trips/stats",
  TRIP_ATTRIBUTES: (id) => `/trips/${id}/attributes`,
  // Departures
  DEPARTURES: "/departures",
  TRIP_DEPARTURES: (tripId) => `/trips/${tripId}/departures`,
  DEPARTURE_GET: (tripId, id) => `/trips/${tripId}/departures/${id}`,
  DEPARTURE_UPDATE: (tripId, id) => `/trips/${tripId}/departures/${id}`,
  DEPARTURE_DELETE: (tripId, id) => `/trips/${tripId}/departures/${id}`,
  TRIP_DEPARTURES_PAST: (tripId) => `/trips/${tripId}/departures/past`,
  // Recurring Rules
  RECURRING_RULES: (tripId) => `/trips/${tripId}/recurring-rules`,
  RECURRING_RULE_GET: (tripId, ruleId) => `/trips/${tripId}/recurring-rules/${ruleId}`,
  // Payments
  PAYMENTS: "/payments",
  PAYMENT_GET: (id) => `/payments/${id}`,
  PAYMENT_DELETE: (id) => `/payments/${id}`,
  // Usage tracking (opt-in telemetry)
  USAGE_TRACKING_STATUS: "/usage-tracking/status",
  USAGE_TRACKING_SETTINGS: "/usage-tracking/settings",
  USAGE_TRACKING_SEND: "/usage-tracking/send",
  USAGE_TRACKING_PREVIEW: "/usage-tracking/preview",
  USAGE_TRACKING_CLEAR_CACHE: "/usage-tracking/clear-cache",
  USAGE_TRACKING_DELETE_SNAPSHOTS: "/usage-tracking/delete-snapshots",
  // Settings
  SETTINGS: "/settings",
  SETTINGS_GROUP: (group) => `/settings?group=${group}`,
  SETTINGS_PAGES: "/settings/pages",
  SETTINGS_FLUSH_REWRITE_RULES: "/settings/flush-rewrite-rules",
  SETTINGS_CHECK_SHORTCODE: (pageId) => `/settings/check-shortcode/${pageId}`,
  SETTINGS_INSERT_SHORTCODE: (pageId) => `/settings/insert-shortcode/${pageId}`,
  SETTINGS_EMAIL_TEMPLATE_PREVIEW: "/settings/email-template-preview",
  // Payment (definitions for admin Settings UI)
  PAYMENT_GATEWAY_DEFINITIONS: "/payment/gateways/definitions",
  // Enquiries
  ENQUIRIES: "/enquiries",
  ENQUIRY_GET: (id) => `/enquiries/${id}`,
  ENQUIRY_DELETE: (id) => `/enquiries/${id}`,
  ENQUIRIES_BULK: "/enquiries/bulk",
  ENQUIRY_STATS: "/enquiries/stats",
  ENQUIRY_RESPOND: (id) => `/enquiries/${id}/respond`,
  // Reports
  REPORTS: "/reports",
  REPORTS_EXPORT: (type) => `/reports/export?type=${type}`,
  // Modules
  MODULES: "/modules",
  // Facebook Pixel
  FACEBOOK_PIXEL_SETTINGS: "/facebook-pixel/settings",
  FACEBOOK_PIXEL_TEST: "/facebook-pixel/test",
  FACEBOOK_PIXEL_TEST_TOKEN: "/facebook-pixel/test-token",
  FACEBOOK_PIXEL_EVENTS: "/facebook-pixel/events",
  FACEBOOK_PIXEL_EVENT_LOGS: "/facebook-pixel/event-logs",
  // Google Analytics 4
  GOOGLE_ANALYTICS_SETTINGS: "/google-analytics/settings",
  GOOGLE_ANALYTICS_TEST: "/google-analytics/test",
  GOOGLE_ANALYTICS_VALIDATE_MEASUREMENT_ID: "/google-analytics/validate/measurement-id",
  GOOGLE_ANALYTICS_VALIDATE_API_SECRET: "/google-analytics/validate/api-secret",
  GOOGLE_ANALYTICS_EVENTS: "/google-analytics/events",
  GOOGLE_ANALYTICS_EVENT_LOGS: "/google-analytics/logs",
  // Abandoned Bookings
  ABANDONED_BOOKINGS: "/abandoned-bookings",
  ABANDONED_BOOKING_GET: (id) => `/abandoned-bookings/${id}`,
  ABANDONED_BOOKING_DELETE: (id) => `/abandoned-bookings/${id}`,
  ABANDONED_BOOKINGS_SETTINGS: "/abandoned-bookings/settings",
  ABANDONED_BOOKINGS_STATISTICS: "/abandoned-bookings/statistics",
  ABANDONED_BOOKING_SEND_EMAIL: (id) => `/abandoned-bookings/${id}/send-email`,
  ABANDONED_BOOKINGS_CAMPAIGNS: "/abandoned-bookings/campaigns",
  ABANDONED_BOOKINGS_CAMPAIGN_GET: (id) => `/abandoned-bookings/campaigns/${id}`,
  // Google Calendar
  GOOGLE_CALENDAR_SETTINGS: "/google-calendar/settings",
  GOOGLE_CALENDAR_CONNECT: "/google-calendar/connect",
  GOOGLE_CALENDAR_DISCONNECT: "/google-calendar/disconnect",
  GOOGLE_CALENDAR_SYNC_ALL: "/google-calendar/sync-all",
  // Tools
  TOOLS_SYSTEM_STATUS: "/tools/system-status",
  TOOLS_ACTIVE_JOBS: "/tools/active-jobs",
  TOOLS_LOGS: (type, page) => `/tools/logs/${type}?page=${page}`,
  TOOLS_LOGS_CLEAR: (type) => `/tools/logs/${type}/clear`,
  TOOLS_EXPORT_JOB: "/tools/export-job",
  TOOLS_JOB_ACTION: (endpoint, jobId) => `/tools/${endpoint}/${jobId}`,
  TOOLS_EXPORT_DOWNLOAD: (jobId) => `/tools/export-job/${jobId}/download`,
  TOOLS_EXPORT_DELETE: (jobId) => `/tools/export-job/${jobId}`,
  TOOLS_EXPORT_STATUS: (jobId) => `/tools/export-job/${jobId}`,
  TOOLS_IMPORT_JOB: "/tools/import-job",
  TOOLS_IMPORT_JOB_GET: (jobId) => `/tools/import-job/${jobId}`,
  TOOLS_ALL_JOBS: "/tools/all-jobs",
  TOOLS_CRON_JOBS: "/tools/cron-jobs",
  TOOLS_CRON_RUN: (hook) => `/tools/cron-jobs/${hook}/run`,
  TOOLS_CLEAR_CACHE: "/tools/clear-cache",
  TOOLS_CACHE_VIEW: "/cache/view",
  TOOLS_CACHE_CLEAR_ITEM: "/cache/clear-item",
  // Migration
  MIGRATION_STATUS: "/migration/status",
  MIGRATION_CLEAR: "/migration/clear",
  MIGRATION_PROGRESS: "/migration/progress",
  MIGRATION_MIGRATE_ALL: "/migration/migrate-all",
  MIGRATION_CANCEL: "/migration/cancel",
  // Payment Gateways
  PAYMENT_GATEWAYS: "/payment/gateways",
  // Signed Consents
  SIGNED_CONSENTS: "/signed-consents",
  SIGNED_CONSENT_GET: (id) => `/signed-consents/${id}`,
  SIGNED_CONSENT_PDF: (id) => `/signed-consents/${id}/pdf`,
  SIGNED_CONSENTS_PREVIEW: "/signed-consents/preview",
  // Dynamic Pricing
  DYNAMIC_PRICING_SETTINGS: "/dynamic-pricing/settings",
  // Availability
  AVAILABILITY: (tripId) => `/trips/${tripId}/availability`,
  // Itinerary
  ITINERARY: "/itinerary",
  ITINERARY_GET: (id, mode) => mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_DELETE: (id, mode) => mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_BY_TRIP: (tripId) => `/itinerary?trip_id=${tripId}`,
  ITINERARY_DAY_ENTRY_BY_DAY_ID: (dayId) => `/itinerary/day-entry-by-day-id/${dayId}`,
  // Saved Trips
  SAVED_TRIPS: "/saved-trips",
  // Email automation (Yatra Pro module — routes registered when module is active)
  EMAIL_TEMPLATES: "/email-templates",
  EMAIL_TEMPLATE_GET: (id) => `/email-templates/${id}`,
  EMAIL_TEMPLATE_PREVIEW: (id) => `/email-templates/${id}/preview`,
  EMAIL_TEMPLATE_TEST: (id) => `/email-templates/${id}/test`,
  EMAIL_TEMPLATE_DUPLICATE: (id) => `/email-templates/${id}/duplicate`,
  EMAIL_TEMPLATE_VARIABLES: "/email-templates/variables",
  EMAIL_SEQUENCES: "/email-sequences",
  EMAIL_SEQUENCE_GET: (id) => `/email-sequences/${id}`,
  EMAIL_LOGS: "/email-logs"
};
const serializePayload = (body) => {
  if (!body) {
    return void 0;
  }
  if (typeof body === "string") {
    return body;
  }
  if (body instanceof URLSearchParams) {
    return body.toString();
  }
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const entries = {};
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
const formatRequestUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const params = new URLSearchParams(parsed.search);
    const restRoute = params.get("rest_route");
    if (restRoute) {
      params.delete("rest_route");
      const decodedRoute = decodeURIComponent(restRoute);
      const normalizedRoute = decodedRoute.startsWith("/") ? decodedRoute : `/${decodedRoute}`;
      const remainingParams = params.toString();
      return `${parsed.origin}${normalizedRoute}${remainingParams ? `?${remainingParams}` : ""}`;
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};
class ApiError extends Error {
  constructor(message, response, requestInfo) {
    super(message);
    this.name = "ApiError";
    this.response = response;
    this.requestInfo = requestInfo;
  }
}
class ApiClient {
  /** Public account page uses `yatraAccountPage`; admin uses `yatraAdmin`. Resolve per request so module load order never leaves an empty nonce. */
  resolveBaseUrl() {
    var _a, _b;
    if (typeof window === "undefined") {
      return "/wp-json/yatra/v1";
    }
    const w = window;
    const raw = ((_a = w.yatraAccountPage) == null ? void 0 : _a.apiUrl) || ((_b = w.yatraAdmin) == null ? void 0 : _b.apiUrl) || "/wp-json/yatra/v1";
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }
  resolveNonce() {
    var _a, _b;
    if (typeof window === "undefined") {
      return "";
    }
    const w = window;
    return ((_a = w.yatraAccountPage) == null ? void 0 : _a.nonce) || ((_b = w.yatraAdmin) == null ? void 0 : _b.nonce) || "";
  }
  async request(endpoint, options = {}, queryParams) {
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    let url;
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
    const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers = {
      "X-WP-Nonce": this.resolveNonce(),
      ...options.headers
    };
    if (!isFormDataBody) {
      const hasContentTypeHeader = headers instanceof Headers && headers.has("Content-Type") || !(headers instanceof Headers) && Object.keys(headers).some(
        (k) => k.toLowerCase() === "content-type"
      );
      if (!hasContentTypeHeader) {
        headers["Content-Type"] = "application/json";
      }
    }
    const method = (options.method || "GET").toUpperCase();
    const serializedPayload = serializePayload(options.body);
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });
    if (!response.ok) {
      const raw = await response.text();
      let data = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
      }
      const message = typeof data === "object" && (data == null ? void 0 : data.message) || typeof data === "string" && data || response.statusText || `HTTP error! status: ${response.status}`;
      throw new ApiError(
        message,
        {
          status: response.status,
          statusText: response.statusText,
          data
        },
        {
          url: formatRequestUrl(url),
          method,
          payload: serializedPayload
        }
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
  async requestBlob(endpoint, options = {}, queryParams) {
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    let url;
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
    const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers = {
      "X-WP-Nonce": this.resolveNonce(),
      ...options.headers
    };
    if (!isFormDataBody) {
      const hasContentTypeHeader = headers instanceof Headers && headers.has("Content-Type") || !(headers instanceof Headers) && Object.keys(headers).some(
        (k) => k.toLowerCase() === "content-type"
      );
      if (!hasContentTypeHeader) {
        headers["Content-Type"] = "application/json";
      }
    }
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.blob();
  }
  async get(endpoint, config) {
    let queryParams;
    if (config == null ? void 0 : config.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.request(
      endpoint,
      {
        method: "GET"
      },
      queryParams
    );
  }
  async getBlob(endpoint, config) {
    let queryParams;
    if (config == null ? void 0 : config.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.requestBlob(endpoint, { method: "GET" }, queryParams);
  }
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }
  async delete(endpoint, config) {
    return this.request(endpoint, {
      method: "DELETE",
      body: (config == null ? void 0 : config.data) ? JSON.stringify(config.data) : void 0
    });
  }
}
const apiClient = new ApiClient();
async function fetchPaymentNormalized(id) {
  const raw = await apiClient.get(API_ENDPOINTS.PAYMENT_GET(id));
  if (raw == null) {
    return null;
  }
  if (typeof raw !== "object") {
    return null;
  }
  const r = raw;
  if (r.success === true && r.data != null && typeof r.data === "object") {
    return { success: true, data: r.data };
  }
  if (r.id !== void 0 && r.id !== null) {
    return { success: true, data: r };
  }
  return {
    success: false,
    message: String(r.message ?? "Payment not found")
  };
}
class WpApiClient {
  constructor() {
    var _a, _b;
    const rawUrl = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.restUrl) || "/wp-json";
    this.baseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
    this.nonce = ((_b = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _b.nonce) || "";
  }
  async get(endpoint) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-WP-Nonce": this.nonce
      },
      credentials: "include"
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }
}
const wpClient = new WpApiClient();
const wpService = {
  getMedia: (id) => wpClient.get(`/wp/v2/media/${id}`)
};
const ajaxService = {
  post: async (action, data) => {
    var _a;
    const siteUrl = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.siteUrl) || "";
    const url = `${siteUrl}/wp-admin/admin-ajax.php`;
    const body = new URLSearchParams({
      action,
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v == null ? "" : String(v)])
      )
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body,
      credentials: "include"
    });
    return response.json();
  }
};
const apiService = {
  // Bookings
  getBookings: (params) => apiClient.get(API_ENDPOINTS.BOOKINGS, { params }),
  getBooking: (id) => apiClient.get(API_ENDPOINTS.BOOKING_GET(id)),
  createBooking: (data) => apiClient.post(API_ENDPOINTS.BOOKINGS, data),
  updateBooking: (id, data) => apiClient.put(API_ENDPOINTS.BOOKING_GET(id), data),
  updateBookingStatus: (id, status) => apiClient.put(API_ENDPOINTS.BOOKING_STATUS(id), { status }),
  deleteBooking: (id) => apiClient.delete(API_ENDPOINTS.BOOKING_DELETE(id)),
  getBookingsStats: () => apiClient.get(API_ENDPOINTS.BOOKINGS_STATS),
  // Customers
  getCustomers: (params) => apiClient.get(API_ENDPOINTS.CUSTOMERS, { params }),
  getCustomer: (id) => apiClient.get(API_ENDPOINTS.CUSTOMER_GET(id)),
  deleteCustomer: (id) => apiClient.delete(API_ENDPOINTS.CUSTOMER_DELETE(id)),
  updateCustomer: (id, data) => apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), data),
  updateCustomerStatus: (id, status) => apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), { status }),
  getCustomerBookings: (id) => apiClient.get(API_ENDPOINTS.CUSTOMER_BOOKINGS(id)),
  getCustomerStats: () => apiClient.get(API_ENDPOINTS.CUSTOMER_STATS),
  // Travelers
  getTravelers: (params) => apiClient.get(API_ENDPOINTS.TRAVELERS, { params }),
  bulkTravelersAction: (action, ids) => apiClient.put(API_ENDPOINTS.TRAVELERS_BULK, { action, ids }),
  // Reviews
  getReviews: (params) => apiClient.get(API_ENDPOINTS.REVIEWS, { params }),
  deleteReview: (id) => apiClient.delete(API_ENDPOINTS.REVIEW_DELETE(id)),
  updateReviewStatus: (id, status) => apiClient.put(API_ENDPOINTS.REVIEW_STATUS(id), { status }),
  bulkReviewsAction: (action, ids) => apiClient.put(API_ENDPOINTS.REVIEWS_BULK, { action, ids }),
  // Trips
  getTrips: (params) => apiClient.get(API_ENDPOINTS.TRIPS, { params }),
  getTrip: (id) => apiClient.get(API_ENDPOINTS.TRIP_GET(id)),
  deleteTrip: (id) => apiClient.delete(API_ENDPOINTS.TRIP_DELETE(id)),
  duplicateTrip: (id) => apiClient.post(API_ENDPOINTS.TRIP_DUPLICATE(id)),
  // Settings
  getSettings: (group) => apiClient.get(
    group ? API_ENDPOINTS.SETTINGS_GROUP(group) : API_ENDPOINTS.SETTINGS
  ),
  // Payments
  getPayment: (id) => fetchPaymentNormalized(id),
  deletePayment: (id) => apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id)),
  getPayments: (params) => apiClient.get(API_ENDPOINTS.PAYMENTS, { params }),
  createPayment: (data) => apiClient.post(API_ENDPOINTS.PAYMENTS, data),
  updatePayment: (id, data) => apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), data),
  updatePaymentStatus: (id, status) => apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), { status }),
  bulkPaymentsAction: (action, ids) => Promise.all(
    ids.map((id) => {
      if (action === "delete") {
        return apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id));
      } else {
        return apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), {
          status: action
        });
      }
    })
  ),
  // Modules
  getModules: () => apiClient.get(API_ENDPOINTS.MODULES),
  // Facebook Pixel
  getFacebookPixelSettings: () => apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_SETTINGS),
  testFacebookPixel: (pixelId) => apiClient.post(API_ENDPOINTS.FACEBOOK_PIXEL_TEST, { pixel_id: pixelId }),
  testFacebookPixelToken: (accessToken) => apiClient.post(API_ENDPOINTS.FACEBOOK_PIXEL_TEST_TOKEN, { access_token: accessToken }),
  getFacebookPixelEvents: () => apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_EVENTS),
  getFacebookPixelEventLogs: () => apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_EVENT_LOGS),
  clearFacebookPixelEventLogs: () => apiClient.delete(API_ENDPOINTS.FACEBOOK_PIXEL_EVENT_LOGS),
  // Google Analytics 4
  getGoogleAnalyticsSettings: () => apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_SETTINGS),
  testGoogleAnalytics: (measurementId) => apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_TEST, { measurement_id: measurementId }),
  validateGoogleAnalyticsMeasurementId: (measurementId) => apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_VALIDATE_MEASUREMENT_ID, { measurement_id: measurementId }),
  validateGoogleAnalyticsApiSecret: (measurementId, apiSecret) => apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_VALIDATE_API_SECRET, { measurement_id: measurementId, api_secret: apiSecret }),
  getGoogleAnalyticsEvents: () => apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENTS),
  getGoogleAnalyticsEventLogs: () => apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENT_LOGS),
  clearGoogleAnalyticsEventLogs: () => apiClient.delete(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENT_LOGS),
  // Payment Gateways
  getPaymentGateways: () => apiClient.get(API_ENDPOINTS.PAYMENT_GATEWAYS),
  // Abandoned Bookings
  getAbandonedBookings: (params) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS, { params }),
  getAbandonedBooking: (id) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKING_GET(id)),
  deleteAbandonedBooking: (id) => apiClient.delete(API_ENDPOINTS.ABANDONED_BOOKING_DELETE(id)),
  getAbandonedBookingsSettings: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS),
  saveAbandonedBookingsSettings: (data) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS, data),
  getAbandonedBookingsStatistics: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_STATISTICS),
  sendAbandonedBookingEmail: (id) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKING_SEND_EMAIL(id)),
  getAbandonedBookingCampaigns: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS),
  getAbandonedBookingCampaign: (id) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id)),
  createAbandonedBookingCampaign: (data) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS, data),
  updateAbandonedBookingCampaign: (id, data) => apiClient.put(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id), data),
  // Enquiries
  getEnquiries: (params) => apiClient.get(API_ENDPOINTS.ENQUIRIES, { params }),
  getEnquiry: (id) => apiClient.get(API_ENDPOINTS.ENQUIRY_GET(id)),
  deleteEnquiry: (id) => apiClient.delete(API_ENDPOINTS.ENQUIRY_DELETE(id)),
  createEnquiry: (data) => apiClient.post(API_ENDPOINTS.ENQUIRIES, data),
  updateEnquiry: (id, data) => apiClient.put(API_ENDPOINTS.ENQUIRY_GET(id), data),
  getEnquiriesStats: () => apiClient.get(API_ENDPOINTS.ENQUIRY_STATS),
  bulkEnquiriesAction: (action, ids) => apiClient.put(API_ENDPOINTS.ENQUIRIES_BULK, { action, ids }),
  respondToEnquiry: (id, data) => apiClient.post(API_ENDPOINTS.ENQUIRY_RESPOND(id), data),
  // Google Calendar
  getGoogleCalendarSettings: () => apiClient.get(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS),
  connectGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_CONNECT),
  disconnectGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_DISCONNECT),
  syncAllGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SYNC_ALL),
  updateGoogleCalendarSettings: (data) => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS, data),
  // Signed Consents
  getSignedConsents: (params) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS, { params }),
  getSignedConsent: (id) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_GET(id)),
  downloadSignedConsentPdf: (id) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_PDF(id)),
  previewSignedConsent: () => apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS_PREVIEW),
  // Tools
  getSystemStatus: () => apiClient.get(API_ENDPOINTS.TOOLS_SYSTEM_STATUS),
  getActiveJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ACTIVE_JOBS),
  getLogs: (type, page) => apiClient.get(API_ENDPOINTS.TOOLS_LOGS(type, page)),
  clearLogs: (type) => apiClient.delete(API_ENDPOINTS.TOOLS_LOGS_CLEAR(type)),
  createExportJob: (data) => apiClient.post(API_ENDPOINTS.TOOLS_EXPORT_JOB, data),
  performJobAction: (endpoint, jobId) => apiClient.get(API_ENDPOINTS.TOOLS_JOB_ACTION(endpoint, jobId)),
  downloadExportJob: (jobId) => apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_DOWNLOAD(jobId)),
  downloadExportJobBlob: (jobId) => apiClient.getBlob(API_ENDPOINTS.TOOLS_EXPORT_DOWNLOAD(jobId)),
  deleteExportJob: (jobId) => apiClient.delete(API_ENDPOINTS.TOOLS_EXPORT_DELETE(jobId)),
  getExportJobStatus: (jobId) => apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_STATUS(jobId)),
  createImportJob: (data) => apiClient.post(API_ENDPOINTS.TOOLS_IMPORT_JOB, data),
  getImportJob: (jobId) => apiClient.get(API_ENDPOINTS.TOOLS_IMPORT_JOB_GET(jobId)),
  deleteImportJob: (jobId) => apiClient.delete(API_ENDPOINTS.TOOLS_IMPORT_JOB_GET(jobId)),
  getAllJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ALL_JOBS),
  getCronJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_CRON_JOBS),
  runCronJob: (hook) => apiClient.post(API_ENDPOINTS.TOOLS_CRON_RUN(hook)),
  clearCache: () => apiClient.delete(API_ENDPOINTS.TOOLS_CLEAR_CACHE),
  getCacheView: () => apiClient.get(API_ENDPOINTS.TOOLS_CACHE_VIEW),
  clearCacheItem: (key, type) => apiClient.delete(
    `${API_ENDPOINTS.TOOLS_CACHE_CLEAR_ITEM}?key=${encodeURIComponent(key)}&type=${encodeURIComponent(type)}`
  ),
  // Migration
  getMigrationStatus: () => apiClient.get(API_ENDPOINTS.MIGRATION_STATUS),
  clearMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CLEAR),
  getMigrationProgress: () => apiClient.get(API_ENDPOINTS.MIGRATION_PROGRESS),
  runMigrationAll: (data) => apiClient.post(API_ENDPOINTS.MIGRATION_MIGRATE_ALL, data),
  cancelMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CANCEL),
  // Sample Data
  importSampleData: (data) => apiClient.post("/sample-data/import", data),
  getSampleDataStatus: () => apiClient.get("/sample-data/status"),
  cleanupSampleData: () => apiClient.delete("/sample-data/cleanup"),
  // Common bulk operations
  bulkDelete: (endpoint, ids) => Promise.all(ids.map((id) => apiClient.delete(`${endpoint}/${id}`))),
  bulkUpdateStatus: (endpoint, ids, status) => Promise.all(
    ids.map((id) => apiClient.put(`${endpoint}/${id}/status`, { status }))
  )
};
const ToastContext = reactExports.createContext(void 0);
const useToast = () => {
  const context = reactExports.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
const ToastProvider = ({
  children
}) => {
  const [toasts, setToasts] = reactExports.useState([]);
  const showToast = reactExports.useCallback(
    (message, type = "success", duration = 4e3) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );
  const removeToast = reactExports.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ToastContext.Provider, { value: { showToast, removeToast }, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, { toasts, onRemove: removeToast })
  ] });
};
const ToastContainer = ({
  toasts,
  onRemove
}) => {
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none", children: toasts.map((toast) => /* @__PURE__ */ jsxRuntimeExports.jsx(ToastItem, { toast, onRemove }, toast.id)) });
};
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);
  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-green-600" });
      case "error":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-red-600" });
      case "warning":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600" });
      case "info":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-blue-600" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-gray-600" });
    }
  };
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
      case "error":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400";
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `
        pointer-events-auto
        flex items-start gap-3
        p-4 rounded-lg border
        shadow-lg backdrop-blur-sm
        min-w-[320px] max-w-[400px]
        transition-all duration-300 ease-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        ${getStyles()}
      `,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mt-0.5", children: getIcon() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-sm font-medium", children: toast.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleRemove,
            className: "flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
            "aria-label": __("Close", "yatra"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ]
    }
  );
};
const CURRENCIES = {
  // Major Currencies
  USD: { code: "USD", name: "US Dollar", symbol: "$", decimalDigits: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", decimalDigits: 2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", decimalDigits: 2 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", decimalDigits: 0 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimalDigits: 2 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalDigits: 2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimalDigits: 2 },
  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    decimalDigits: 2
  },
  NZD: {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
    decimalDigits: 2
  },
  // Asian Currencies
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", decimalDigits: 2 },
  NPR: { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", decimalDigits: 2 },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "₨", decimalDigits: 2 },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", decimalDigits: 2 },
  LKR: {
    code: "LKR",
    name: "Sri Lankan Rupee",
    symbol: "Rs",
    decimalDigits: 2
  },
  MMK: { code: "MMK", name: "Myanmar Kyat", symbol: "K", decimalDigits: 2 },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿", decimalDigits: 2 },
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "₫", decimalDigits: 0 },
  IDR: {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    decimalDigits: 2
  },
  MYR: {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    decimalDigits: 2
  },
  SGD: {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    decimalDigits: 2
  },
  PHP: { code: "PHP", name: "Philippine Peso", symbol: "₱", decimalDigits: 2 },
  KRW: { code: "KRW", name: "South Korean Won", symbol: "₩", decimalDigits: 0 },
  TWD: { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", decimalDigits: 2 },
  HKD: {
    code: "HKD",
    name: "Hong Kong Dollar",
    symbol: "HK$",
    decimalDigits: 2
  },
  MOP: {
    code: "MOP",
    name: "Macanese Pataca",
    symbol: "MOP$",
    decimalDigits: 2
  },
  KHR: { code: "KHR", name: "Cambodian Riel", symbol: "៛", decimalDigits: 2 },
  LAK: { code: "LAK", name: "Lao Kip", symbol: "₭", decimalDigits: 2 },
  BND: { code: "BND", name: "Brunei Dollar", symbol: "B$", decimalDigits: 2 },
  MNT: { code: "MNT", name: "Mongolian Tugrik", symbol: "₮", decimalDigits: 2 },
  KZT: {
    code: "KZT",
    name: "Kazakhstani Tenge",
    symbol: "₸",
    decimalDigits: 2
  },
  UZS: {
    code: "UZS",
    name: "Uzbekistani Som",
    symbol: "сўм",
    decimalDigits: 2
  },
  KGS: {
    code: "KGS",
    name: "Kyrgyzstani Som",
    symbol: "сом",
    decimalDigits: 2
  },
  TJS: {
    code: "TJS",
    name: "Tajikistani Somoni",
    symbol: "ЅМ",
    decimalDigits: 2
  },
  TMT: {
    code: "TMT",
    name: "Turkmenistani Manat",
    symbol: "m",
    decimalDigits: 2
  },
  AFN: { code: "AFN", name: "Afghan Afghani", symbol: "؋", decimalDigits: 2 },
  // Middle Eastern Currencies
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimalDigits: 2 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "﷼", decimalDigits: 2 },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "﷼", decimalDigits: 2 },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", decimalDigits: 3 },
  BHD: {
    code: "BHD",
    name: "Bahraini Dinar",
    symbol: ".د.ب",
    decimalDigits: 3
  },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "﷼", decimalDigits: 3 },
  JOD: {
    code: "JOD",
    name: "Jordanian Dinar",
    symbol: "د.ا",
    decimalDigits: 3
  },
  ILS: { code: "ILS", name: "Israeli Shekel", symbol: "₪", decimalDigits: 2 },
  LBP: { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", decimalDigits: 2 },
  SYP: { code: "SYP", name: "Syrian Pound", symbol: "£S", decimalDigits: 2 },
  IQD: { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", decimalDigits: 3 },
  IRR: { code: "IRR", name: "Iranian Rial", symbol: "﷼", decimalDigits: 2 },
  YER: { code: "YER", name: "Yemeni Rial", symbol: "﷼", decimalDigits: 2 },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "E£", decimalDigits: 2 },
  TRY: { code: "TRY", name: "Turkish Lira", symbol: "₺", decimalDigits: 2 },
  // European Currencies
  SEK: { code: "SEK", name: "Swedish Krona", symbol: "kr", decimalDigits: 2 },
  NOK: { code: "NOK", name: "Norwegian Krone", symbol: "kr", decimalDigits: 2 },
  DKK: { code: "DKK", name: "Danish Krone", symbol: "kr", decimalDigits: 2 },
  ISK: { code: "ISK", name: "Icelandic Króna", symbol: "kr", decimalDigits: 0 },
  PLN: { code: "PLN", name: "Polish Zloty", symbol: "zł", decimalDigits: 2 },
  CZK: { code: "CZK", name: "Czech Koruna", symbol: "Kč", decimalDigits: 2 },
  HUF: {
    code: "HUF",
    name: "Hungarian Forint",
    symbol: "Ft",
    decimalDigits: 2
  },
  RON: { code: "RON", name: "Romanian Leu", symbol: "lei", decimalDigits: 2 },
  BGN: { code: "BGN", name: "Bulgarian Lev", symbol: "лв", decimalDigits: 2 },
  HRK: { code: "HRK", name: "Croatian Kuna", symbol: "kn", decimalDigits: 2 },
  RSD: { code: "RSD", name: "Serbian Dinar", symbol: "дин.", decimalDigits: 2 },
  MKD: {
    code: "MKD",
    name: "Macedonian Denar",
    symbol: "ден",
    decimalDigits: 2
  },
  BAM: {
    code: "BAM",
    name: "Bosnia-Herzegovina Mark",
    symbol: "KM",
    decimalDigits: 2
  },
  ALL: { code: "ALL", name: "Albanian Lek", symbol: "L", decimalDigits: 2 },
  MDL: { code: "MDL", name: "Moldovan Leu", symbol: "L", decimalDigits: 2 },
  UAH: {
    code: "UAH",
    name: "Ukrainian Hryvnia",
    symbol: "₴",
    decimalDigits: 2
  },
  BYN: {
    code: "BYN",
    name: "Belarusian Ruble",
    symbol: "Br",
    decimalDigits: 2
  },
  RUB: { code: "RUB", name: "Russian Ruble", symbol: "₽", decimalDigits: 2 },
  GEL: { code: "GEL", name: "Georgian Lari", symbol: "₾", decimalDigits: 2 },
  AMD: { code: "AMD", name: "Armenian Dram", symbol: "֏", decimalDigits: 2 },
  AZN: {
    code: "AZN",
    name: "Azerbaijani Manat",
    symbol: "₼",
    decimalDigits: 2
  },
  // African Currencies
  ZAR: {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    decimalDigits: 2
  },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", decimalDigits: 2 },
  KES: {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    decimalDigits: 2
  },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", decimalDigits: 2 },
  TZS: {
    code: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    decimalDigits: 2
  },
  UGX: {
    code: "UGX",
    name: "Ugandan Shilling",
    symbol: "USh",
    decimalDigits: 0
  },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "FRw", decimalDigits: 0 },
  ETB: { code: "ETB", name: "Ethiopian Birr", symbol: "Br", decimalDigits: 2 },
  MAD: {
    code: "MAD",
    name: "Moroccan Dirham",
    symbol: "د.م.",
    decimalDigits: 2
  },
  TND: { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", decimalDigits: 3 },
  DZD: { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", decimalDigits: 2 },
  LYD: { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", decimalDigits: 3 },
  SDG: {
    code: "SDG",
    name: "Sudanese Pound",
    symbol: "ج.س.",
    decimalDigits: 2
  },
  XOF: {
    code: "XOF",
    name: "West African CFA Franc",
    symbol: "CFA",
    decimalDigits: 0
  },
  XAF: {
    code: "XAF",
    name: "Central African CFA Franc",
    symbol: "FCFA",
    decimalDigits: 0
  },
  MUR: { code: "MUR", name: "Mauritian Rupee", symbol: "₨", decimalDigits: 2 },
  SCR: {
    code: "SCR",
    name: "Seychellois Rupee",
    symbol: "₨",
    decimalDigits: 2
  },
  MGA: { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", decimalDigits: 2 },
  MZN: {
    code: "MZN",
    name: "Mozambican Metical",
    symbol: "MT",
    decimalDigits: 2
  },
  ZMW: { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", decimalDigits: 2 },
  BWP: { code: "BWP", name: "Botswana Pula", symbol: "P", decimalDigits: 2 },
  NAD: { code: "NAD", name: "Namibian Dollar", symbol: "N$", decimalDigits: 2 },
  AOA: { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", decimalDigits: 2 },
  CDF: { code: "CDF", name: "Congolese Franc", symbol: "FC", decimalDigits: 2 },
  // Americas Currencies
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", decimalDigits: 2 },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "$", decimalDigits: 2 },
  ARS: { code: "ARS", name: "Argentine Peso", symbol: "$", decimalDigits: 2 },
  CLP: { code: "CLP", name: "Chilean Peso", symbol: "$", decimalDigits: 0 },
  COP: { code: "COP", name: "Colombian Peso", symbol: "$", decimalDigits: 2 },
  PEN: { code: "PEN", name: "Peruvian Sol", symbol: "S/", decimalDigits: 2 },
  UYU: { code: "UYU", name: "Uruguayan Peso", symbol: "$U", decimalDigits: 2 },
  PYG: {
    code: "PYG",
    name: "Paraguayan Guarani",
    symbol: "₲",
    decimalDigits: 0
  },
  BOB: {
    code: "BOB",
    name: "Bolivian Boliviano",
    symbol: "Bs.",
    decimalDigits: 2
  },
  VES: {
    code: "VES",
    name: "Venezuelan Bolívar",
    symbol: "Bs.S",
    decimalDigits: 2
  },
  CRC: {
    code: "CRC",
    name: "Costa Rican Colón",
    symbol: "₡",
    decimalDigits: 2
  },
  PAB: {
    code: "PAB",
    name: "Panamanian Balboa",
    symbol: "B/.",
    decimalDigits: 2
  },
  GTQ: {
    code: "GTQ",
    name: "Guatemalan Quetzal",
    symbol: "Q",
    decimalDigits: 2
  },
  HNL: { code: "HNL", name: "Honduran Lempira", symbol: "L", decimalDigits: 2 },
  NIO: {
    code: "NIO",
    name: "Nicaraguan Córdoba",
    symbol: "C$",
    decimalDigits: 2
  },
  SVC: { code: "SVC", name: "Salvadoran Colón", symbol: "₡", decimalDigits: 2 },
  DOP: { code: "DOP", name: "Dominican Peso", symbol: "RD$", decimalDigits: 2 },
  CUP: { code: "CUP", name: "Cuban Peso", symbol: "₱", decimalDigits: 2 },
  HTG: { code: "HTG", name: "Haitian Gourde", symbol: "G", decimalDigits: 2 },
  JMD: { code: "JMD", name: "Jamaican Dollar", symbol: "J$", decimalDigits: 2 },
  TTD: {
    code: "TTD",
    name: "Trinidad & Tobago Dollar",
    symbol: "TT$",
    decimalDigits: 2
  },
  BBD: {
    code: "BBD",
    name: "Barbadian Dollar",
    symbol: "Bds$",
    decimalDigits: 2
  },
  BSD: { code: "BSD", name: "Bahamian Dollar", symbol: "B$", decimalDigits: 2 },
  BZD: { code: "BZD", name: "Belize Dollar", symbol: "BZ$", decimalDigits: 2 },
  GYD: { code: "GYD", name: "Guyanese Dollar", symbol: "G$", decimalDigits: 2 },
  SRD: {
    code: "SRD",
    name: "Surinamese Dollar",
    symbol: "$",
    decimalDigits: 2
  },
  XCD: {
    code: "XCD",
    name: "East Caribbean Dollar",
    symbol: "EC$",
    decimalDigits: 2
  },
  AWG: { code: "AWG", name: "Aruban Florin", symbol: "ƒ", decimalDigits: 2 },
  ANG: {
    code: "ANG",
    name: "Netherlands Antillean Guilder",
    symbol: "ƒ",
    decimalDigits: 2
  },
  KYD: {
    code: "KYD",
    name: "Cayman Islands Dollar",
    symbol: "CI$",
    decimalDigits: 2
  },
  BMD: { code: "BMD", name: "Bermudian Dollar", symbol: "$", decimalDigits: 2 },
  // Oceania Currencies
  FJD: { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", decimalDigits: 2 },
  PGK: {
    code: "PGK",
    name: "Papua New Guinean Kina",
    symbol: "K",
    decimalDigits: 2
  },
  SBD: {
    code: "SBD",
    name: "Solomon Islands Dollar",
    symbol: "SI$",
    decimalDigits: 2
  },
  VUV: { code: "VUV", name: "Vanuatu Vatu", symbol: "VT", decimalDigits: 0 },
  WST: { code: "WST", name: "Samoan Tala", symbol: "WS$", decimalDigits: 2 },
  TOP: { code: "TOP", name: "Tongan Paʻanga", symbol: "T$", decimalDigits: 2 },
  XPF: { code: "XPF", name: "CFP Franc", symbol: "₣", decimalDigits: 0 },
  // Crypto
  BTC: { code: "BTC", name: "Bitcoin", symbol: "₿", decimalDigits: 8 },
  ETH: { code: "ETH", name: "Ethereum", symbol: "Ξ", decimalDigits: 8 }
};
const getCurrencyOptions = () => {
  return Object.values(CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.symbol})`
  }));
};
const getCurrency = (code) => {
  return CURRENCIES[code.toUpperCase()];
};
const getCurrencySymbol = (code) => {
  var _a;
  return ((_a = CURRENCIES[code.toUpperCase()]) == null ? void 0 : _a.symbol) || code;
};
export {
  API_ENDPOINTS as A,
  ToastProvider as T,
  __ as _,
  apiClient as a,
  getCurrency as b,
  apiService as c,
  getCurrencyOptions as d,
  ajaxService as e,
  getCurrencySymbol as g,
  useToast as u,
  wpService as w
};
//# sourceMappingURL=index-JPS7_hhh.js.map

/**
 * API Endpoints Configuration
 *
 * Central path definitions for `yatra/v1`. Use `resources/js/api/*-api.ts`
 * modules for typed `apiClient` calls instead of hardcoding strings in pages.
 */

export const API_ENDPOINTS = {
  // Bookings
  BOOKINGS: "/bookings",
  BOOKING_GET: (id: string | number) => `/bookings/${id}`,
  BOOKING_STATUS: (id: string | number) => `/bookings/${id}/status`,
  BOOKING_DELETE: (id: string | number) => `/bookings/${id}`,
  BOOKINGS_BULK: "/bookings/bulk",
  BOOKINGS_STATS: "/bookings/stats",
  /** POST body: `{ booking_id }` — returns `{ checkout_url }` in `data`. */
  PAYMENT_REMAINING_SESSION: "/payment/remaining/session",
  BOOKING_CONSENT_STATUS: (id: string | number) =>
    `/bookings/${id}/consent-status`,

  // Customers
  CUSTOMERS: "/customers",
  CUSTOMER_GET: (id: string | number) => `/customers/${id}`,
  CUSTOMER_DELETE: (id: string | number) => `/customers/${id}`,
  CUSTOMERS_BULK: "/customers/bulk",
  CUSTOMER_STATS: "/customers/stats",
  CUSTOMER_BOOKINGS: (id: string | number) => `/customers/${id}/bookings`,
  CUSTOMER_ME: "/customers/me",
  CUSTOMER_MY_BOOKINGS: "/customers/my-bookings",
  CUSTOMER_MY_PAYMENTS: "/customers/my-payments",
  CUSTOMER_MY_DOCUMENTS: "/customers/my-documents",
  CUSTOMER_MY_SUPPORT_TICKETS: "/customers/my-support-tickets",
  /** GET single booking for current user (details view). */
  CUSTOMER_MY_BOOKING: (id: string | number) =>
    `/customers/my-bookings/${id}`,

  // Travelers
  TRAVELERS: "/travelers",
  TRAVELERS_BULK: "/travelers/bulk",

  // Reviews
  REVIEWS: "/reviews",
  REVIEW_DELETE: (id: string | number) => `/reviews/${id}`,
  REVIEW_STATUS: (id: string | number) => `/reviews/${id}/status`,
  REVIEWS_BULK: "/reviews/bulk",

  // Trips
  TRIPS: "/trips",
  TRIP_GET: (id: string | number) => `/trips/${id}`,
  TRIP_DELETE: (id: string | number) => `/trips/${id}`,
  TRIP_PERMANENT_DELETE: (id: string | number) =>
    `/trips/${id}/permanent-delete`,
  TRIP_DUPLICATE: (id: string | number) => `/trips/${id}/duplicate`,
  TRIPS_STATS: "/trips/stats",
  TRIP_ATTRIBUTES: (id: string | number) => `/trips/${id}/attributes`,

  // Departures
  DEPARTURES: "/departures",
  TRIP_DEPARTURES: (tripId: string | number) => `/trips/${tripId}/departures`,
  DEPARTURE_GET: (tripId: string | number, id: string | number) =>
    `/trips/${tripId}/departures/${id}`,
  DEPARTURE_UPDATE: (tripId: string | number, id: string | number) =>
    `/trips/${tripId}/departures/${id}`,
  DEPARTURE_DELETE: (tripId: string | number, id: string | number) =>
    `/trips/${tripId}/departures/${id}`,
  TRIP_DEPARTURES_PAST: (tripId: string | number) =>
    `/trips/${tripId}/departures/past`,

  // Recurring Rules
  RECURRING_RULES: (tripId: string | number) =>
    `/trips/${tripId}/recurring-rules`,
  RECURRING_RULE_GET: (tripId: string | number, ruleId: string | number) =>
    `/trips/${tripId}/recurring-rules/${ruleId}`,

  // Payments
  PAYMENTS: "/payments",
  PAYMENT_GET: (id: string | number) => `/payments/${id}`,
  PAYMENT_DELETE: (id: string | number) => `/payments/${id}`,

  // Settings
  SETTINGS: "/settings",
  SETTINGS_GROUP: (group: string) => `/settings?group=${group}`,
  SETTINGS_PAGES: "/settings/pages",
  SETTINGS_FLUSH_REWRITE_RULES: "/settings/flush-rewrite-rules",
  SETTINGS_CHECK_SHORTCODE: (pageId: string | number) =>
    `/settings/check-shortcode/${pageId}`,
  SETTINGS_INSERT_SHORTCODE: (pageId: string | number) =>
    `/settings/insert-shortcode/${pageId}`,
  SETTINGS_EMAIL_TEMPLATE_PREVIEW: "/settings/email-template-preview",

  // Payment (definitions for admin Settings UI)
  PAYMENT_GATEWAY_DEFINITIONS: "/payment/gateways/definitions",

  // Enquiries
  ENQUIRIES: "/enquiries",
  ENQUIRY_GET: (id: string | number) => `/enquiries/${id}`,
  ENQUIRY_DELETE: (id: string | number) => `/enquiries/${id}`,
  ENQUIRIES_BULK: "/enquiries/bulk",
  ENQUIRY_STATS: "/enquiries/stats",
  ENQUIRY_RESPOND: (id: string | number) => `/enquiries/${id}/respond`,

  // Reports
  REPORTS: "/reports",
  REPORTS_EXPORT: (type: string) => `/reports/export?type=${type}`,

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
  ABANDONED_BOOKING_GET: (id: string | number) => `/abandoned-bookings/${id}`,
  ABANDONED_BOOKING_DELETE: (id: string | number) =>
    `/abandoned-bookings/${id}`,
  ABANDONED_BOOKINGS_SETTINGS: "/abandoned-bookings/settings",
  ABANDONED_BOOKINGS_STATISTICS: "/abandoned-bookings/statistics",
  ABANDONED_BOOKING_SEND_EMAIL: (id: string | number) =>
    `/abandoned-bookings/${id}/send-email`,
  ABANDONED_BOOKINGS_CAMPAIGNS: "/abandoned-bookings/campaigns",
  ABANDONED_BOOKINGS_CAMPAIGN_GET: (id: string | number) =>
    `/abandoned-bookings/campaigns/${id}`,

  // Google Calendar
  GOOGLE_CALENDAR_SETTINGS: "/google-calendar/settings",
  GOOGLE_CALENDAR_CONNECT: "/google-calendar/connect",
  GOOGLE_CALENDAR_DISCONNECT: "/google-calendar/disconnect",
  GOOGLE_CALENDAR_SYNC_ALL: "/google-calendar/sync-all",

  // Tools
  TOOLS_SYSTEM_STATUS: "/tools/system-status",
  TOOLS_ACTIVE_JOBS: "/tools/active-jobs",
  TOOLS_LOGS: (type: string, page: number) =>
    `/tools/logs/${type}?page=${page}`,
  TOOLS_LOGS_CLEAR: (type: string) => `/tools/logs/${type}/clear`,
  TOOLS_EXPORT_JOB: "/tools/export-job",
  TOOLS_JOB_ACTION: (endpoint: string, jobId: string) =>
    `/tools/${endpoint}/${jobId}`,
  TOOLS_EXPORT_DOWNLOAD: (jobId: string) =>
    `/tools/export-job/${jobId}/download`,
  TOOLS_EXPORT_DELETE: (jobId: string) => `/tools/export-job/${jobId}`,
  TOOLS_EXPORT_STATUS: (jobId: string) => `/tools/export-job/${jobId}`,
  TOOLS_IMPORT_JOB: "/tools/import-job",
  TOOLS_IMPORT_JOB_GET: (jobId: string) => `/tools/import-job/${jobId}`,
  TOOLS_ALL_JOBS: "/tools/all-jobs",
  TOOLS_CRON_JOBS: "/tools/cron-jobs",
  TOOLS_CRON_RUN: (hook: string) => `/tools/cron-jobs/${hook}/run`,
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
  SIGNED_CONSENT_GET: (id: string | number) => `/signed-consents/${id}`,
  SIGNED_CONSENT_PDF: (id: string | number) => `/signed-consents/${id}/pdf`,
  SIGNED_CONSENTS_PREVIEW: "/signed-consents/preview",

  // Dynamic Pricing
  DYNAMIC_PRICING_SETTINGS: "/dynamic-pricing/settings",

  // Availability
  AVAILABILITY: (tripId: string | number) => `/trips/${tripId}/availability`,

  // Itinerary
  ITINERARY: "/itinerary",
  ITINERARY_GET: (id: string | number, mode?: string) =>
    mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_DELETE: (id: string | number, mode?: string) =>
    mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_BY_TRIP: (tripId: string | number) =>
    `/itinerary?trip_id=${tripId}`,
  ITINERARY_DAY_ENTRY_BY_DAY_ID: (dayId: string | number) =>
    `/itinerary/day-entry-by-day-id/${dayId}`,

  // Saved Trips
  SAVED_TRIPS: "/saved-trips",

  // Email automation (Yatra Pro module — routes registered when module is active)
  EMAIL_TEMPLATES: "/email-templates",
  EMAIL_TEMPLATE_GET: (id: string | number) => `/email-templates/${id}`,
  EMAIL_TEMPLATE_PREVIEW: (id: string | number) =>
    `/email-templates/${id}/preview`,
  EMAIL_TEMPLATE_TEST: (id: string | number) =>
    `/email-templates/${id}/test`,
  EMAIL_TEMPLATE_DUPLICATE: (id: string | number) =>
    `/email-templates/${id}/duplicate`,
  EMAIL_TEMPLATE_VARIABLES: "/email-templates/variables",
  EMAIL_SEQUENCES: "/email-sequences",
  EMAIL_SEQUENCE_GET: (id: string | number) => `/email-sequences/${id}`,
  EMAIL_LOGS: "/email-logs",
} as const;

// Type for endpoint keys
export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

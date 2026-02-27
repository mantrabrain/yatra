/**
 * API Endpoints Configuration
 * Central place for all API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_GET: (id: string | number) => `/bookings/${id}`,
  BOOKING_STATUS: (id: string | number) => `/bookings/${id}/status`,
  BOOKING_DELETE: (id: string | number) => `/bookings/${id}`,
  BOOKINGS_BULK: '/bookings/bulk',
  BOOKINGS_STATS: '/bookings/stats',
  BOOKING_PAY_REMAINING: (id: string | number) => `/bookings/${id}/pay-remaining`,
  BOOKING_CONSENT_STATUS: (id: string | number) => `/bookings/${id}/consent-status`,
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_GET: (id: string | number) => `/customers/${id}`,
  CUSTOMER_DELETE: (id: string | number) => `/customers/${id}`,
  CUSTOMERS_BULK: '/customers/bulk',
  CUSTOMER_STATS: '/customers/stats',
  CUSTOMER_BOOKINGS: (id: string | number) => `/customers/${id}/bookings`,
  CUSTOMER_ME: '/customers/me',
  CUSTOMER_MY_BOOKINGS: '/customers/my-bookings',
  CUSTOMER_MY_PAYMENTS: '/customers/my-payments',
  CUSTOMER_MY_DOCUMENTS: '/customers/my-documents',
  CUSTOMER_MY_SUPPORT_TICKETS: '/customers/my-support-tickets',
  CUSTOMER_BOOKING_DOCUMENTS: (bookingId: string | number) => `/customer/bookings/${bookingId}/documents`,
  
  // Travelers
  TRAVELERS: '/travelers',
  TRAVELERS_BULK: '/travelers/bulk',
  
  // Reviews
  REVIEWS: '/reviews',
  REVIEW_DELETE: (id: string | number) => `/reviews/${id}`,
  REVIEW_STATUS: (id: string | number) => `/reviews/${id}/status`,
  REVIEWS_BULK: '/reviews/bulk',

  // Trips
  TRIPS: '/trips',
  TRIP_GET: (id: string | number) => `/trips/${id}`,
  TRIP_DELETE: (id: string | number) => `/trips/${id}`,
  TRIP_PERMANENT_DELETE: (id: string | number) => `/trips/${id}/permanent-delete`,
  TRIP_DUPLICATE: (id: string | number) => `/trips/${id}/duplicate`,
  TRIPS_STATS: '/trips/stats',
  TRIP_ATTRIBUTES: (id: string | number) => `/trips/${id}/attributes`,
  
  // Departures
  DEPARTURES: '/departures',
  TRIP_DEPARTURES: (tripId: string | number) => `/trips/${tripId}/departures`,
  DEPARTURE_GET: (tripId: string | number, id: string | number) => `/trips/${tripId}/departures/${id}`,
  DEPARTURE_UPDATE: (tripId: string | number, id: string | number) => `/trips/${tripId}/departures/${id}`,
  DEPARTURE_DELETE: (tripId: string | number, id: string | number) => `/trips/${tripId}/departures/${id}`,
  TRIP_DEPARTURES_PAST: (tripId: string | number) => `/trips/${tripId}/departures/past`,
  
  // Recurring Rules
  RECURRING_RULES: (tripId: string | number) => `/trips/${tripId}/recurring-rules`,
  RECURRING_RULE_GET: (tripId: string | number, ruleId: string | number) => `/trips/${tripId}/recurring-rules/${ruleId}`,
  
  // Payments
  PAYMENTS: '/payments',
  PAYMENT_GET: (id: string | number) => `/payments/${id}`,
  PAYMENT_DELETE: (id: string | number) => `/payments/${id}`,
  
  // Settings
  SETTINGS: '/settings',
  SETTINGS_GROUP: (group: string) => `/settings?group=${group}`,
  
  // Enquiries
  ENQUIRIES: '/enquiries',
  ENQUIRY_GET: (id: string | number) => `/enquiries/${id}`,
  ENQUIRY_DELETE: (id: string | number) => `/enquiries/${id}`,
  ENQUIRIES_BULK: '/enquiries/bulk',
  ENQUIRY_STATS: '/enquiries/stats',
  ENQUIRY_RESPOND: (id: string | number) => `/enquiries/${id}/respond`,
  
  // Reports
  REPORTS: '/reports',
  REPORTS_EXPORT: (type: string) => `/reports/export?type=${type}`,
  
  // Modules
  MODULES: '/modules',
  
  // Abandoned Bookings
  ABANDONED_BOOKINGS: '/abandoned-bookings',
  ABANDONED_BOOKING_GET: (id: string | number) => `/abandoned-bookings/${id}`,
  ABANDONED_BOOKING_DELETE: (id: string | number) => `/abandoned-bookings/${id}`,
  ABANDONED_BOOKINGS_SETTINGS: '/abandoned-bookings/settings',
  ABANDONED_BOOKINGS_STATISTICS: '/abandoned-bookings/statistics',
  ABANDONED_BOOKING_SEND_EMAIL: (id: string | number) => `/abandoned-bookings/${id}/send-email`,
  ABANDONED_BOOKINGS_CAMPAIGNS: '/abandoned-bookings/campaigns',
  ABANDONED_BOOKINGS_CAMPAIGN_GET: (id: string | number) => `/abandoned-bookings/campaigns/${id}`,

  // Google Calendar
  GOOGLE_CALENDAR_SETTINGS: '/google-calendar/settings',
  GOOGLE_CALENDAR_CONNECT: '/google-calendar/connect',
  GOOGLE_CALENDAR_DISCONNECT: '/google-calendar/disconnect',
  GOOGLE_CALENDAR_SYNC_ALL: '/google-calendar/sync-all',

  // Tools
  TOOLS_SYSTEM_STATUS: '/tools/system-status',
  TOOLS_ACTIVE_JOBS: '/tools/active-jobs',
  TOOLS_LOGS: (type: string, page: number) => `/tools/logs/${type}?page=${page}`,
  TOOLS_LOGS_CLEAR: (type: string) => `/tools/logs/${type}/clear`,
  TOOLS_EXPORT_JOB: '/tools/export-job',
  TOOLS_JOB_ACTION: (endpoint: string, jobId: string) => `/tools/${endpoint}/${jobId}`,
  TOOLS_EXPORT_DOWNLOAD: (jobId: string) => `/tools/export-job/${jobId}/download`,
  TOOLS_EXPORT_DELETE: (jobId: string) => `/tools/export-job/${jobId}`,
  TOOLS_EXPORT_STATUS: (jobId: string) => `/tools/export-job/${jobId}`,
  TOOLS_IMPORT_JOB: '/tools/import-job',
  TOOLS_IMPORT_JOB_GET: (jobId: string) => `/tools/import-job/${jobId}`,
  TOOLS_ALL_JOBS: '/tools/all-jobs',
  TOOLS_CRON_JOBS: '/tools/cron-jobs',
  TOOLS_CRON_RUN: (hook: string) => `/tools/cron-jobs/${hook}/run`,
  TOOLS_CLEAR_CACHE: '/tools/clear-cache',

  // Migration
  MIGRATION_STATUS: '/migration/status',
  MIGRATION_CLEAR: '/migration/clear',
  MIGRATION_PROGRESS: '/migration/progress',
  MIGRATION_MIGRATE_ALL: '/migration/migrate-all',
  MIGRATION_CANCEL: '/migration/cancel',
  
  // Payment Gateways
  PAYMENT_GATEWAYS: '/payment/gateways',
  
  // Signed Consents
  SIGNED_CONSENTS: '/signed-consents',
  SIGNED_CONSENT_GET: (id: string | number) => `/signed-consents/${id}`,
  SIGNED_CONSENT_PDF: (id: string | number) => `/signed-consents/${id}/pdf`,
  SIGNED_CONSENTS_PREVIEW: '/signed-consents/preview',
  
  // Dynamic Pricing
  DYNAMIC_PRICING_SETTINGS: '/dynamic-pricing/settings',
  
  // Availability
  AVAILABILITY: (tripId: string | number) => `/trips/${tripId}/availability`,
  
  // Itinerary
  ITINERARY: '/itinerary',
  ITINERARY_GET: (id: string | number, mode?: string) => mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_DELETE: (id: string | number, mode?: string) => mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_BY_TRIP: (tripId: string | number) => `/itinerary?trip_id=${tripId}`,
  ITINERARY_DAY_ENTRY_BY_DAY_ID: (dayId: string | number) => `/itinerary/day-entry-by-day-id/${dayId}`,
  
  // Saved Trips
  SAVED_TRIPS: '/saved-trips',
} as const;

// Type for endpoint keys
export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

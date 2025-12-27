/**
 * API Client for WordPress REST API
 * Centralized API service with proper URL handling and authentication
 */

import { API_ENDPOINTS } from './api-endpoints';

class ApiClient {
  private baseUrl: string;
  private nonce: string;

  constructor() {
    // Ensure baseUrl doesn't have trailing slash
    const rawUrl = window.yatraAdmin?.apiUrl || '/wp-json/yatra/v1';
    this.baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    this.nonce = window.yatraAdmin?.nonce || '';
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    queryParams?: URLSearchParams
  ): Promise<any> {
    // Extract endpoint path (remove any query params that might have been appended)
    const [endpointPath, endpointQuery] = endpoint.split('?');
    const cleanEndpoint = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    
    // Build URL properly - handle query string format (rest_route) vs pretty permalinks
    let url: string;
    
    // Check if baseUrl uses query string format (contains ?rest_route=)
    if (this.baseUrl.includes('?rest_route=')) {
      // Query string format: append endpoint to rest_route value, then add other params with &
      const [base, queryString] = this.baseUrl.split('?');
      const params = new URLSearchParams(queryString);
      const restRoute = params.get('rest_route') || '';
      params.set('rest_route', restRoute + cleanEndpoint);
      
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
      url = `${this.baseUrl}${cleanEndpoint}`;
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
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': this.nonce,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get(endpoint: string, config?: { params?: Record<string, any> }): Promise<any> {
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

    return this.request(endpoint, {
      method: 'GET',
    }, queryParams);
  }

  async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string, config?: { data?: any }): Promise<any> {
    return this.request(endpoint, {
      method: 'DELETE',
      body: config?.data ? JSON.stringify(config.data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();

// Convenience methods for common operations
export const apiService = {
  // Bookings
  getBookings: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.BOOKINGS, { params }),
  getBooking: (id: string | number) => apiClient.get(API_ENDPOINTS.BOOKING_GET(id)),
  createBooking: (data: any) => apiClient.post(API_ENDPOINTS.BOOKINGS, data),
  updateBooking: (id: string | number, data: any) => apiClient.put(API_ENDPOINTS.BOOKING_GET(id), data),
  updateBookingStatus: (id: string | number, status: string) => 
    apiClient.put(API_ENDPOINTS.BOOKING_STATUS(id), { status }),
  deleteBooking: (id: string | number) => apiClient.delete(API_ENDPOINTS.BOOKING_DELETE(id)),
  getBookingsStats: () => apiClient.get(API_ENDPOINTS.BOOKINGS_STATS),
  
  // Customers
  getCustomers: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.CUSTOMERS, { params }),
  getCustomer: (id: string | number) => apiClient.get(API_ENDPOINTS.CUSTOMER_GET(id)),
  deleteCustomer: (id: string | number) => apiClient.delete(API_ENDPOINTS.CUSTOMER_DELETE(id)),
  updateCustomer: (id: string | number, data: any) => apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), data),
  updateCustomerStatus: (id: string | number, status: string) => apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), { status }),
  getCustomerBookings: (id: string | number) => apiClient.get(API_ENDPOINTS.CUSTOMER_BOOKINGS(id)),
  
  // Travelers
  getTravelers: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.TRAVELERS, { params }),
  bulkTravelersAction: (action: string, ids: (string | number)[]) => 
    apiClient.put(API_ENDPOINTS.TRAVELERS_BULK, { action, ids }),
  
  // Reviews
  getReviews: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.REVIEWS, { params }),
  deleteReview: (id: string | number) => apiClient.delete(API_ENDPOINTS.REVIEW_DELETE(id)),
  updateReviewStatus: (id: string | number, status: string) => apiClient.put(API_ENDPOINTS.REVIEW_STATUS(id), { status }),
  bulkReviewsAction: (action: string, ids: (string | number)[]) => 
    apiClient.put(API_ENDPOINTS.REVIEWS_BULK, { action, ids }),
  
  // Trips
  getTrips: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.TRIPS, { params }),
  getTrip: (id: string | number) => apiClient.get(API_ENDPOINTS.TRIP_GET(id)),
  deleteTrip: (id: string | number) => apiClient.delete(API_ENDPOINTS.TRIP_DELETE(id)),
  duplicateTrip: (id: string | number) => apiClient.post(API_ENDPOINTS.TRIP_DUPLICATE(id)),
  
  // Settings
  getSettings: (group?: string) => apiClient.get(group ? API_ENDPOINTS.SETTINGS_GROUP(group) : API_ENDPOINTS.SETTINGS),
  
  // Payments
  getPayment: (id: string | number) => apiClient.get(API_ENDPOINTS.PAYMENT_GET(id)),
  deletePayment: (id: string | number) => apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id)),
  getPayments: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.PAYMENTS, { params }),
  createPayment: (data: any) => apiClient.post(API_ENDPOINTS.PAYMENTS, data),
  updatePayment: (id: string | number, data: any) => apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), data),
  updatePaymentStatus: (id: string | number, status: string) => apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), { status }),
  bulkPaymentsAction: (action: string, ids: (string | number)[]) => 
    Promise.all(ids.map(id => {
      if (action === 'delete') {
        return apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id));
      } else {
        return apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), { status: action });
      }
    })),
  
  // Modules
  getModules: () => apiClient.get(API_ENDPOINTS.MODULES),
  
  // Payment Gateways
  getPaymentGateways: () => apiClient.get(API_ENDPOINTS.PAYMENT_GATEWAYS),
  
  // Abandoned Bookings
  getAbandonedBookings: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS, { params }),
  getAbandonedBooking: (id: string | number) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKING_GET(id)),
  deleteAbandonedBooking: (id: string | number) => apiClient.delete(API_ENDPOINTS.ABANDONED_BOOKING_DELETE(id)),
  getAbandonedBookingsSettings: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS),
  saveAbandonedBookingsSettings: (data: any) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS, data),
  getAbandonedBookingsStatistics: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_STATISTICS),
  sendAbandonedBookingEmail: (id: string | number) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKING_SEND_EMAIL(id)),
  getAbandonedBookingCampaigns: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS),
  getAbandonedBookingCampaign: (id: string | number) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id)),
  createAbandonedBookingCampaign: (data: any) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS, data),
  updateAbandonedBookingCampaign: (id: string | number, data: any) => apiClient.put(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id), data),

  // Enquiries
  getEnquiries: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.ENQUIRIES, { params }),
  getEnquiry: (id: string | number) => apiClient.get(API_ENDPOINTS.ENQUIRY_GET(id)),
  deleteEnquiry: (id: string | number) => apiClient.delete(API_ENDPOINTS.ENQUIRY_DELETE(id)),
  createEnquiry: (data: any) => apiClient.post(API_ENDPOINTS.ENQUIRIES, data),
  updateEnquiry: (id: string | number, data: any) => apiClient.put(API_ENDPOINTS.ENQUIRY_GET(id), data),
  getEnquiriesStats: () => apiClient.get(API_ENDPOINTS.ENQUIRY_STATS),
  bulkEnquiriesAction: (action: string, ids: (string | number)[]) => 
    apiClient.put(API_ENDPOINTS.ENQUIRIES_BULK, { action, ids }),
  respondToEnquiry: (id: string | number, data: any) => apiClient.post(API_ENDPOINTS.ENQUIRY_RESPOND(id), data),

  // Google Calendar
  getGoogleCalendarSettings: () => apiClient.get(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS),
  connectGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_CONNECT),
  disconnectGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_DISCONNECT),
  syncAllGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SYNC_ALL),
  updateGoogleCalendarSettings: (data: any) => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS, data),
  
  // Signed Consents
  getSignedConsents: (params?: Record<string, any>) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS, { params }),
  getSignedConsent: (id: string | number) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_GET(id)),
  downloadSignedConsentPdf: (id: string | number) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_PDF(id)),
  previewSignedConsent: () => apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS_PREVIEW),

  // Tools
  getSystemStatus: () => apiClient.get(API_ENDPOINTS.TOOLS_SYSTEM_STATUS),
  getActiveJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ACTIVE_JOBS),
  getLogs: (type: string, page: number) => apiClient.get(API_ENDPOINTS.TOOLS_LOGS(type, page)),
  createExportJob: (data: any) => apiClient.post(API_ENDPOINTS.TOOLS_EXPORT_JOB, data),
  performJobAction: (endpoint: string, jobId: string) => apiClient.post(API_ENDPOINTS.TOOLS_JOB_ACTION(endpoint, jobId)),
  downloadExportJob: (jobId: string) => apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_DOWNLOAD(jobId)),
  deleteExportJob: (jobId: string) => apiClient.delete(API_ENDPOINTS.TOOLS_EXPORT_DELETE(jobId)),
  getExportJobStatus: (jobId: string) => apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_STATUS(jobId)),
  createImportJob: (data: any) => apiClient.post(API_ENDPOINTS.TOOLS_IMPORT_JOB, data),
  getAllJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ALL_JOBS),
  getCronJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_CRON_JOBS),
  runCronJob: (hook: string) => apiClient.post(API_ENDPOINTS.TOOLS_CRON_RUN(hook)),
  clearCache: () => apiClient.post(API_ENDPOINTS.TOOLS_CLEAR_CACHE),

  // Migration
  getMigrationStatus: () => apiClient.get(API_ENDPOINTS.MIGRATION_STATUS),
  clearMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CLEAR),
  getMigrationProgress: () => apiClient.get(API_ENDPOINTS.MIGRATION_PROGRESS),
  runMigrationAll: () => apiClient.post(API_ENDPOINTS.MIGRATION_MIGRATE_ALL),
  cancelMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CANCEL),

  // Common bulk operations
  bulkDelete: (endpoint: string, ids: (string | number)[]) => 
    Promise.all(ids.map(id => apiClient.delete(`${endpoint}/${id}`))),
    
  bulkUpdateStatus: (endpoint: string, ids: (string | number)[], status: string) => 
    Promise.all(ids.map(id => apiClient.put(`${endpoint}/${id}/status`, { status }))),
};

// Format time with AM/PM for display
export const formatTimeForDisplay = (timeString: string): string => {
  if (!timeString) return '';
  
  // Try to parse the time string
  const time = new Date(`1970-01-01T${timeString}`);
  if (isNaN(time.getTime())) {
    return timeString; // Return original if invalid
  }
  
  // Format using JavaScript's Intl.DateTimeFormat for localized time display
  return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

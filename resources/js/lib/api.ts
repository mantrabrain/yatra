/**
 * API Client for WordPress REST API
 */

// Types are now in i18n.ts

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

  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();


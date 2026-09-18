import { ApiError } from '../types/api';

function getRawBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== '')
    ? String(import.meta.env.VITE_API_BASE_URL).trim()
    : '/api';
  
  if (!envUrl) return '/api';
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl.replace(/\/$/, '');
  }
  const withSlash = envUrl.startsWith('/') ? envUrl : `/${envUrl}`;
  return withSlash.replace(/\/$/, '');
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

class ApiClient {
  public getBaseUrl(): string {
    return getRawBaseUrl();
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('who_know_auth_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private buildUrlWithBase(baseUrl: string, endpoint: string, params?: RequestOptions['params']): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fullUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
      ? new URL(`${baseUrl}${cleanEndpoint}`)
      : new URL(`${baseUrl}${cleanEndpoint}`, baseOrigin);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          fullUrl.searchParams.append(key, String(val));
        }
      });
    }
    return fullUrl.toString();
  }

  private buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    return this.buildUrlWithBase(this.getBaseUrl(), endpoint, params);
  }

  public isBackendConfigured(): boolean {
    return true;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...customOptions } = options;
    const url = this.buildUrl(endpoint, params);

    // If no backend is configured, throw a distinct unconfigured error so callers handle gracefully
    if (!this.isBackendConfigured()) {
      const unconfiguredError: ApiError = {
        message: 'Backend REST API not connected. Displaying local data.',
        statusCode: 503,
      };
      throw unconfiguredError;
    }

    try {
      let response = await fetch(url, {
        ...customOptions,
        headers: {
          ...this.getHeaders(),
          ...customOptions.headers,
        },
      });

      // If custom base (e.g. /sid1720) returned 404, fallback to standard /api
      const currentBase = this.getBaseUrl();
      if (response.status === 404 && currentBase !== '/api' && !currentBase.startsWith('http')) {
        try {
          const fallbackUrl = this.buildUrlWithBase('/api', endpoint, params);
          const fallbackRes = await fetch(fallbackUrl, {
            ...customOptions,
            headers: {
              ...this.getHeaders(),
              ...customOptions.headers,
            },
          });
          if (fallbackRes.ok || fallbackRes.status !== 404) {
            response = fallbackRes;
          }
        } catch {
          // ignore fallback failure and handle original response
        }
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // ignore non-json error responses
        }

        const apiError: ApiError = {
          message: errorData.message || `Request failed with status ${response.status}`,
          statusCode: response.status,
          details: errorData,
        };
        throw apiError;
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.statusCode) {
        throw err;
      }
      const genericError: ApiError = {
        message: err.message || 'Unable to connect to the safety server.',
        statusCode: 0,
      };
      throw genericError;
    }
  }

  public get<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

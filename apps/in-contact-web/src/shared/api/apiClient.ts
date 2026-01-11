/**
 * @fileoverview Centralized HTTP client for API communication
 * @summary Pre-configured Axios instance with authentication and error handling
 * @description Provides a centralized HTTP client that handles authentication,
 * error transformation, and request configuration. All API requests throughout
 * the application should use this client instance to maintain consistency.
 * 
 * Features:
 * - Automatic Bearer token injection via registered token getter function
 * - HTTP error transformation into typed error classes (UnauthorizedError, NotFoundError, etc.)
 * - Preservation of original API error messages and response data
 * - Configurable request timeout (default: 30 seconds)
 * - Centralized error handling and logging
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import { logWarn, logError } from '../utils/logger';
import type { IApiErrorResponse } from '../types/apiTypes';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  RequestTimeoutError,
  NetworkError,
  ConfigurationError,
} from '../errors';

/**
 * Default request timeout in milliseconds
 * 
 * Prevents requests from hanging indefinitely if the server doesn't respond.
 * After this duration, the request will be cancelled and a timeout error will be thrown.
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Main Axios instance configured for API requests
 * 
 * Created with validated base URL from environment configuration and default timeout.
 * All requests made through this instance will automatically go through the registered
 * request and response interceptors for token injection and error transformation.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Token getter function for retrieving access tokens
 * 
 * Stores the registered function that will be invoked before each API request
 * to retrieve the current access token. Set to null initially and should be
 * configured using setTokenGetter() during application initialization.
 * 
 * When a request is made, this function is called to get a fresh token, allowing
 * for automatic token refresh without manual token management in each API call.
 */
let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Registers the function used to retrieve access tokens for authenticated requests
 * 
 * Sets up automatic Bearer token injection for all API requests. The registered
 * function is called before each request to get the current access token. This
 * allows for automatic token refresh without manual token management in each API call.
 * 
 * Should be called once during application initialization after authentication
 * is ready and the token retrieval mechanism is available.
 * 
 * @param getter - Async function that returns the current access token string or null
 * @returns void
 * @throws {Error} If getter parameter is not a function
 * 
 * @example
 * ```typescript
 * // In app initialization (e.g., App.tsx or auth setup)
 * setTokenGetter(async () => {
 *   const response = await msalInstance.acquireTokenSilent({
 *     scopes: ['api://your-api-id/.default'],
 *     account: accounts[0],
 *   });
 *   return response.accessToken;
 * });
 * ```
 */
export function setTokenGetter(getter: () => Promise<string | null>): void {
  if (typeof getter !== 'function') {
    throw new ConfigurationError('tokenGetter must be a function');
  }
  tokenGetter = getter;
}

/**
 * Checks if token getter is registered and attempts to retrieve a token
 * 
 * This is useful for determining if authentication is ready before making API calls.
 * Returns true if token getter is registered and can successfully retrieve a token.
 * 
 * @returns Promise resolving to true if token is available, false otherwise
 */
export async function isTokenAvailable(): Promise<boolean> {
  if (!tokenGetter) {
    return false;
  }

  try {
    const token = await tokenGetter();
    return Boolean(token);
  } catch {
    return false;
  }
}

/**
 * Request interceptor: automatically injects authentication tokens
 * 
 * Intercepts all outgoing requests before they are sent. Retrieves the current
 * access token using the registered token getter function and attaches it to the
 * Authorization header as a Bearer token.
 * 
 * If token retrieval fails, logs a warning but allows the request to proceed.
 * The request will likely fail with 401 Unauthorized, which is then handled
 * appropriately by the response interceptor.
 * 
 * @param config - Axios request configuration object
 * @returns Modified request configuration with Authorization header (if token available)
 * @throws {NetworkError} If request configuration fails before sending
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (!tokenGetter) {
      return config;
    }

    try {
      const token = await tokenGetter();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Token retrieval failed - log warning but allow request to proceed
      // The 401 Unauthorized response will be handled by response interceptor
      logWarn('Failed to retrieve access token for request', {
        url: config.url,
        method: config.method,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return config;
  },
  (error: AxiosError) => {
    // Request configuration error - reject immediately with NetworkError
    logError('Request configuration failed', {
      message: error.message,
      code: error.code,
    });
    return Promise.reject(new NetworkError('Failed to configure request', error));
  }
);

/**
 * Response interceptor: transforms HTTP errors into typed exception classes
 * 
 * Intercepts all error responses from the server and converts them into
 * domain-specific error classes (UnauthorizedError, NotFoundError, ServerError, etc.)
 * for easier error handling in application code.
 * 
 * Preserves the original API error messages and full response data, allowing
 * clients to access error codes and additional structured error information.
 * Network-level errors (no response received) and timeout errors are handled
 * separately from HTTP status code errors.
 * 
 * @param response - Successful Axios response
 * @returns Unmodified successful response
 * 
 * @param error - Axios error with optional response data
 * @returns Promise rejected with typed error class based on HTTP status code
 * @throws {RequestTimeoutError} If request timed out
 * @throws {NetworkError} If no response received from server
 * @throws {UnauthorizedError} For 401 status codes
 * @throws {ForbiddenError} For 403 status codes
 * @throws {NotFoundError} For 404 status codes
 * @throws {RequestTimeoutError} For 408 status codes
 * @throws {ServerError} For 500, 502, 503, 504 status codes
 * @throws {ApiError} For other HTTP error status codes (400, 409, etc.)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<IApiErrorResponse>) => {
    // Handle network-level errors (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        logWarn('Request timed out', {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
        });
        return Promise.reject(new RequestTimeoutError('Request timed out', undefined, error));
      }

      logError('Network error - no response received', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
      });
      return Promise.reject(new NetworkError('Network error occurred', error));
    }

    const { status, data } = error.response;
    
    // Extract error message from API response
    // Prioritize 'error' field, fallback to 'message' field, then use default message
    const apiErrorMessage = data?.error || data?.message;
    
    // Map HTTP status codes to appropriate typed error classes
    switch (status) {
      case 401: {
        logWarn('Unauthorized request', {
          url: error.config?.url,
          message: apiErrorMessage,
        });
        return Promise.reject(
          new UnauthorizedError(
            apiErrorMessage || 'Authentication required. Please sign in again.',
            data,
            error
          )
        );
      }

      case 403: {
        logWarn('Forbidden request', {
          url: error.config?.url,
          message: apiErrorMessage,
        });
        return Promise.reject(
          new ForbiddenError(
            apiErrorMessage || 'You do not have permission to perform this action.',
            data,
            error
          )
        );
      }

      case 404: {
        logWarn('Resource not found', {
          url: error.config?.url,
          message: apiErrorMessage,
        });
        return Promise.reject(
          new NotFoundError(
            apiErrorMessage || 'The requested resource was not found.',
            data,
            error
          )
        );
      }

      case 408: {
        logWarn('Request timeout from server', {
          url: error.config?.url,
          message: apiErrorMessage,
        });
        return Promise.reject(
          new RequestTimeoutError(
            apiErrorMessage || 'Request timed out',
            data,
            error
          )
        );
      }

      case 500:
      case 502:
      case 503:
      case 504: {
        logError('Server error', {
          status,
          url: error.config?.url,
          message: apiErrorMessage,
        });
        return Promise.reject(
          new ServerError(
            apiErrorMessage || 'A server error occurred. Please try again later.',
            status,
            data,
            error
          )
        );
      }

      default: {
        // Handle client errors (400, 409, etc.) and any other status codes
        logWarn('API request failed', {
          status,
          url: error.config?.url,
          message: apiErrorMessage,
        });
        return Promise.reject(
          new ApiError(
            apiErrorMessage || `Request failed with status ${status}`,
            status,
            data,
            error
          )
        );
      }
    }
  }
);

/**
 * Pre-configured Axios instance for making API requests
 * 
 * This is the default export and should be imported and used for all API calls
 * throughout the application. It includes automatic authentication token injection
 * and error transformation via registered interceptors.
 * 
 * @example
 * ```typescript
 * import apiClient from '@/shared/api/apiClient';
 * 
 * // Make a GET request
 * const response = await apiClient.get('/api/users');
 * 
 * // Make a POST request with body
 * const result = await apiClient.post('/api/users', { name: 'John' });
 * ```
 */
export default apiClient;

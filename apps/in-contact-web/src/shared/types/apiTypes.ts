/**
 * @fileoverview API type definitions
 * @summary Type definitions for API requests and responses
 * @description Common type definitions used across API clients and error handling
 */

/**
 * Standard API error response structure from backend
 * 
 * This structure represents the standard error response format returned by the
 * backend API when an error occurs. Used for type safety when extracting error
 * messages and details from API responses.
 * 
 * The backend may return either an 'error' field (primary) or a 'message' field
 * (fallback), so this interface supports both. Additional fields may be present
 * for specific error types (error codes, details, etc.).
 */
export interface IApiErrorResponse {
  /** Error message or error type identifier (primary field) */
  error?: string;
  
  /** Human-readable error message (fallback field) */
  message?: string;
  
  /** HTTP status code of the error response */
  statusCode?: number;
  
  /** Additional error properties (error codes, details, etc.) */
  [key: string]: unknown;
}


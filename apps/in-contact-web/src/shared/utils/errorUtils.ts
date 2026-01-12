/**
 * @fileoverview Error handling utilities for API clients
 * @summary Helper functions for extracting and processing error information
 * @description Common utilities for working with API errors, extracting error messages,
 * and identifying error types. These utilities are used across all API clients to
 * provide consistent error handling throughout the application.
 */

import { AxiosError } from 'axios';
import { ApiError } from '../errors';
import type { IApiErrorResponse } from '../types/apiTypes';
import { logError } from './logger';

/**
 * Extracts error message from ApiError instance
 * @param error - Error instance that might be ApiError
 * @returns Error message if ApiError with valid message, null otherwise
 */
function extractApiErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error && 'statusCode' in error)) {
    return null;
  }
  const apiError = error as unknown as ApiError;
  if (apiError.message && apiError.message.trim() !== '') {
    return apiError.message;
  }
  return null;
}

/**
 * Extracts error message from AxiosError response data
 * @param error - Error instance that might be AxiosError
 * @returns Error message from response data, null otherwise
 */
function extractAxiosErrorMessage(error: unknown): string | null {
  if (!(error instanceof AxiosError && error.response?.data)) {
    return null;
  }
  const data = error.response.data as IApiErrorResponse;
  if (data.error && typeof data.error === 'string' && data.error.trim() !== '') {
    return data.error;
  }
  if (data.message && typeof data.message === 'string' && data.message.trim() !== '') {
    return data.message;
  }
  return null;
}

/**
 * Extracts error message from standard Error instance
 * @param error - Error instance that might be Error
 * @returns Error message if valid, null otherwise
 */
function extractStandardErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message && error.message.trim() !== '') {
    return error.message;
  }
  return null;
}

/**
 * Extracts error message from string error
 * @param error - Error that might be a string
 * @returns Error message if valid string, null otherwise
 */
function extractStringErrorMessage(error: unknown): string | null {
  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }
  return null;
}

/**
 * Extracts error message from various error types
 * 
 * Handles multiple error types that may be encountered when working with API calls:
 * - ApiError instances (and subclasses) transformed by apiClient interceptors
 * - Raw AxiosError instances with response data
 * - Standard Error instances
 * - String errors
 * - Unknown error types (with fallback)
 * 
 * Since apiClient interceptors transform AxiosError into typed error classes
 * (ApiError, UnauthorizedError, etc.), this function prioritizes those transformed
 * errors but also handles raw AxiosError instances that might slip through.
 * 
 * Message extraction priority:
 * 1. ApiError.message (if already transformed by apiClient interceptor)
 * 2. AxiosError response data (error field, then message field)
 * 3. Error.message property
 * 4. String error value
 * 5. Default fallback message
 * 
 * @param error - Error instance of any type (ApiError, AxiosError, Error, string, unknown)
 * @param defaultMessage - Fallback message to return if no message can be extracted
 * @returns Extracted error message string, or defaultMessage if extraction fails
 * 
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   // Works with ApiError, UnauthorizedError, AxiosError, Error, or string
 *   const message = extractErrorMessage(error, 'Operation failed');
 *   throw new ModuleSpecificError(message, error);
 * }
 * ```
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): string {
  return (
    extractApiErrorMessage(error) ||
    extractAxiosErrorMessage(error) ||
    extractStandardErrorMessage(error) ||
    extractStringErrorMessage(error) ||
    defaultMessage
  );
}

/**
 * Type guard to check if an error is an API error from our error classes
 * 
 * Determines if an error instance is an ApiError or one of its subclasses
 * (UnauthorizedError, NotFoundError, ServerError, etc.) that were created
 * by the apiClient response interceptor.
 * 
 * @param error - Error instance to check
 * @returns True if error is an instance of ApiError or its subclasses, false otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   if (isApiError(error)) {
 *     // error is ApiError, can access error.statusCode, error.response
 *     console.log('HTTP status:', error.statusCode);
 *   }
 * }
 * ```
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    'response' in error &&
    error.constructor.name !== 'Error'
  );
}

/**
 * Extracts HTTP status code from various error types
 * 
 * Attempts to extract the HTTP status code from ApiError instances or
 * raw AxiosError instances. Returns undefined if no status code is available.
 * 
 * @param error - Error instance to extract status code from
 * @returns HTTP status code if available, undefined otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const statusCode = extractErrorStatusCode(error);
 *   if (statusCode === 401) {
 *     // Handle unauthorized
 *   }
 * }
 * ```
 */
export function extractErrorStatusCode(error: unknown): number | undefined {
  if (isApiError(error)) {
    return error.statusCode;
  }

  if (error instanceof AxiosError && error.response) {
    return error.response.status;
  }

  return undefined;
}

/**
 * Handles API errors consistently across all API clients
 *
 * Logs the error with context and re-throws or wraps it as ApiError.
 * Since apiClient interceptors transform AxiosError into ApiError instances,
 * this function primarily re-throws ApiError instances while also handling
 * edge cases where raw errors might slip through.
 *
 * @param operation - Name of the operation that failed (e.g., 'fetch users by role')
 * @param error - The error that occurred (should be ApiError from apiClient interceptor)
 * @param defaultMessage - Default error message to use if error is not an ApiError
 * @param context - Optional context object for logging (e.g., { role, page, pageSize })
 * @returns Never returns, always throws ApiError
 * @throws {ApiError} Always throws an ApiError instance
 *
 * @example
 * ```typescript
 * try {
 *   const response = await apiClient.get('/api/users');
 *   return response.data;
 * } catch (error) {
 *   throw handleApiError('fetch users', error, 'Failed to fetch users', { userId });
 * }
 * ```
 */
export function handleApiError(
  operation: string,
  error: unknown,
  defaultMessage: string,
  context?: Record<string, unknown>
): never {
  logError(`Failed to ${operation}`, { error, ...context });

  if (error instanceof ApiError) {
    throw error;
  }

  throw new ApiError(
    defaultMessage,
    500,
    undefined,
    error instanceof Error ? error : new Error(String(error))
  );
}


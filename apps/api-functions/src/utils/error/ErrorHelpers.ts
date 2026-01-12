/**
 * @fileoverview ErrorHelpers - Utility functions for error handling
 * @summary Provides helpers for extracting and wrapping errors from unknown types
 * @description Generic and domain-specific helpers for type-safe error handling
 */

import { DomainError } from '../../domain/errors/DomainError';
import { ErrorDetails, AxiosErrorResponse } from '../../domain/types/ErrorTypes';
import { EgressErrorDetails } from '../../domain/types/LiveKitTypes';
import {
  WebPubSubTokenError,
  WebPubSubBroadcastError,
  WebPubSubSyncError,
  LiveKitOperationError,
  GraphServiceError,
  ChatServiceError,
  BlobStorageUploadError,
  BlobStorageDownloadError,
  BlobStorageDeleteError
} from '../../domain/errors/InfrastructureErrors';
import {
  DatabaseQueryError,
  EntityCreationError,
  EntityUpdateError,
  EntityDeletionError,
  PsoFetchError,
  SupervisorFetchError,
  StreamingSessionFetchError
} from '../../domain/errors/RepositoryErrors';

/**
 * Extracts error message and cause from unknown error type
 * @description Safely extracts error information from any unknown type,
 * ensuring type safety while handling errors from catch blocks
 * @param error - Unknown error value (can be Error, string, object, etc.)
 * @returns Error details with message and cause
 */
export function extractErrorDetails(error: unknown): ErrorDetails {
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : new Error(String(error));
  
  return { message, cause };
}

/**
 * Extracts only the error message from unknown error type
 * @param error - Unknown error value
 * @returns Error message string
 */
export function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Extracts only the error cause from unknown error type
 * @param error - Unknown error value
 * @returns Error instance (always an Error, never undefined)
 */
export function extractErrorCause(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Type guard to check if error has specific properties
 * @param error - Unknown error value
 * @param properties - Array of property names to check
 * @returns True if error is an object with all specified properties
 */
export function hasErrorProperties(
  error: unknown,
  ...properties: string[]
): error is Record<string, unknown> {
  return (
    typeof error === 'object' &&
    error !== null &&
    properties.every(prop => prop in error)
  );
}

/**
 * Extracts specific property from error object if it exists
 * @param error - Unknown error value
 * @param property - Property name to extract
 * @returns Property value or undefined if not present
 */
export function extractErrorProperty(
  error: unknown,
  property: string
): unknown {
  if (hasErrorProperties(error, property)) {
    return error[property];
  }
  return undefined;
}

/**
 * Extracts HTTP status code from error object
 * @description Attempts to extract HTTP status code from common error properties
 * in priority order: 'code', 'statusCode', 'status'
 * @param error - Unknown error value
 * @returns HTTP status code as number, or undefined if not found
 * @example
 * const code = extractHttpStatusCode(error);
 * if (code === 409) {
 *   // Handle conflict
 * }
 */
export function extractHttpStatusCode(error: unknown): number | undefined {
  const code = extractErrorProperty(error, 'code') as number | undefined;
  if (typeof code === 'number') {
    return code;
  }

  const statusCode = extractErrorProperty(error, 'statusCode') as number | undefined;
  if (typeof statusCode === 'number') {
    return statusCode;
  }

  const status = extractErrorProperty(error, 'status') as number | undefined;
  if (typeof status === 'number') {
    return status;
  }

  return undefined;
}

/**
 * Extracts formatted error message from axios error
 * @description Centralizes the logic for extracting and formatting error messages from axios errors.
 * If the error has a response property, formats it as "HTTP {status} - {data}".
 * Otherwise, extracts the error message using extractErrorMessage.
 * @param error - Unknown error value (likely an axios error)
 * @returns Formatted error message string
 * @example
 * try {
 *   await axios.get(url);
 * } catch (err: unknown) {
 *   const message = extractAxiosErrorMessage(err);
 *   throw new GraphServiceError(`Request failed: ${message}`, err);
 * }
 */
export function extractAxiosErrorMessage(error: unknown): string {
  if (hasErrorProperties(error, 'response')) {
    const axiosError = error as { response?: AxiosErrorResponse };
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    return `HTTP ${status} - ${JSON.stringify(data)}`;
  }
  return extractErrorMessage(error);
}

/**
 * Extracts error details from LiveKit EgressInfo or error object
 * @description Extracts all available error context from LiveKit Egress errors
 * including status, error messages, room information, and timing data
 * @param info - EgressInfo object or error object (unknown type)
 * @returns Object with all available error context from Egress
 * @example
 * const errorDetails = extractEgressErrorDetails(error);
 * const message = extractEgressErrorMessage(errorDetails, error, 'Default message');
 */
export function extractEgressErrorDetails(info: unknown): EgressErrorDetails {
  if (!info || typeof info !== 'object') return {};
  
  const infoObj = info as Record<string, unknown>;
  
  return {
    status: (infoObj.status as string) || (infoObj.state as string) || (infoObj.egressStatus as string),
    statusDetail: (infoObj.statusDetail as string),
    error: (infoObj.error as string),
    errorMessage: (infoObj.errorMessage as string) || (infoObj.message as string),
    roomName: (infoObj.roomName as string),
    roomId: (infoObj.roomId as string),
    startedAt: (infoObj.startedAt as string | number) || (infoObj.startedAtMs as number),
    endedAt: (infoObj.endedAt as string | number) || (infoObj.endedAtMs as number),
    duration: (extractErrorProperty(info, 'duration') as number | undefined) || 
              (extractErrorProperty(info, 'durationMs') as number | undefined),
    sourceType: extractErrorProperty(info, 'sourceType') as string | undefined,
    fileResults: (() => {
      const fileResults = extractErrorProperty(info, 'fileResults');
      if (fileResults) return fileResults;
      const result = extractErrorProperty(info, 'result') as Record<string, unknown> | undefined;
      return result?.['fileResults'];
    })(),
    streamResults: extractErrorProperty(info, 'streamResults'),
    segmentResults: extractErrorProperty(info, 'segmentResults'),
  };
}

/**
 * Extracts error message from LiveKit Egress error details
 * @description Centralizes the logic for extracting error messages from egress error details
 * with fallback options in priority order
 * @param errorDetails - Egress error details object from extractEgressErrorDetails
 * @param error - Original error object for fallback
 * @param defaultMessage - Default message if no error details found
 * @returns Error message string
 * @example
 * const errorDetails = extractEgressErrorDetails(error);
 * const message = extractEgressErrorMessage(errorDetails, error, 'Failed to start egress');
 */
export function extractEgressErrorMessage(
  errorDetails: EgressErrorDetails,
  error: unknown,
  defaultMessage: string
): string {
  return errorDetails.error ||
         errorDetails.statusDetail ||
         errorDetails.errorMessage ||
         extractErrorMessage(error) ||
         defaultMessage;
}

/**
 * Generic error wrapper that creates domain-specific errors
 * @description Generic helper that works with any DomainError subclass
 * that accepts (message: string, cause?: Error) constructor
 * @param ErrorClass - Domain error class constructor
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns Instance of the specified error class
 */
export function wrapError<T extends DomainError>(
  ErrorClass: new (message: string, cause?: Error) => T,
  baseMessage: string,
  error: unknown
): T {
  const { message, cause } = extractErrorDetails(error);
  return new ErrorClass(`${baseMessage}: ${message}`, cause);
}

// Domain-specific error wrappers for common patterns

/**
 * Wraps errors in WebPubSub token error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns WebPubSubTokenError instance
 */
export function wrapWebPubSubTokenError(
  baseMessage: string,
  error: unknown
): WebPubSubTokenError {
  return wrapError(WebPubSubTokenError, baseMessage, error);
}

/**
 * Wraps errors in WebPubSub broadcast error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns WebPubSubBroadcastError instance
 */
export function wrapWebPubSubBroadcastError(
  baseMessage: string,
  error: unknown
): WebPubSubBroadcastError {
  return wrapError(WebPubSubBroadcastError, baseMessage, error);
}

/**
 * Wraps errors in WebPubSub sync error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns WebPubSubSyncError instance
 */
export function wrapWebPubSubSyncError(
  baseMessage: string,
  error: unknown
): WebPubSubSyncError {
  return wrapError(WebPubSubSyncError, baseMessage, error);
}

/**
 * Wraps errors in database query error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns DatabaseQueryError instance
 */
export function wrapDatabaseQueryError(
  baseMessage: string,
  error: unknown
): DatabaseQueryError {
  return wrapError(DatabaseQueryError, baseMessage, error);
}

/**
 * Wraps errors in entity creation error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns EntityCreationError instance
 */
export function wrapEntityCreationError(
  baseMessage: string,
  error: unknown
): EntityCreationError {
  return wrapError(EntityCreationError, baseMessage, error);
}

/**
 * Wraps errors in entity update error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns EntityUpdateError instance
 */
export function wrapEntityUpdateError(
  baseMessage: string,
  error: unknown
): EntityUpdateError {
  return wrapError(EntityUpdateError, baseMessage, error);
}

/**
 * Wraps errors in entity deletion error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns EntityDeletionError instance
 */
export function wrapEntityDeletionError(
  baseMessage: string,
  error: unknown
): EntityDeletionError {
  return wrapError(EntityDeletionError, baseMessage, error);
}

/**
 * Wraps errors in PSO fetch error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns PsoFetchError instance
 */
export function wrapPsoFetchError(
  baseMessage: string,
  error: unknown
): PsoFetchError {
  return wrapError(PsoFetchError, baseMessage, error);
}

/**
 * Wraps errors in supervisor fetch error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns SupervisorFetchError instance
 */
export function wrapSupervisorFetchError(
  baseMessage: string,
  error: unknown
): SupervisorFetchError {
  return wrapError(SupervisorFetchError, baseMessage, error);
}

/**
 * Wraps errors in streaming session fetch error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns StreamingSessionFetchError instance
 */
export function wrapStreamingSessionFetchError(
  baseMessage: string,
  error: unknown
): StreamingSessionFetchError {
  return wrapError(StreamingSessionFetchError, baseMessage, error);
}

/**
 * Wraps errors in LiveKit operation error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns LiveKitOperationError instance
 */
export function wrapLiveKitOperationError(
  baseMessage: string,
  error: unknown
): LiveKitOperationError {
  return wrapError(LiveKitOperationError, baseMessage, error);
}

/**
 * Wraps errors in Graph service error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns GraphServiceError instance
 */
export function wrapGraphServiceError(
  baseMessage: string,
  error: unknown
): GraphServiceError {
  return wrapError(GraphServiceError, baseMessage, error);
}

/**
 * Wraps errors in Chat service error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns ChatServiceError instance
 */
export function wrapChatServiceError(
  baseMessage: string,
  error: unknown
): ChatServiceError {
  return wrapError(ChatServiceError, baseMessage, error);
}

/**
 * Wraps errors in Blob storage upload error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns BlobStorageUploadError instance
 */
export function wrapBlobStorageUploadError(
  baseMessage: string,
  error: unknown
): BlobStorageUploadError {
  return wrapError(BlobStorageUploadError, baseMessage, error);
}

/**
 * Wraps errors in Blob storage download error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns BlobStorageDownloadError instance
 */
export function wrapBlobStorageDownloadError(
  baseMessage: string,
  error: unknown
): BlobStorageDownloadError {
  return wrapError(BlobStorageDownloadError, baseMessage, error);
}

/**
 * Wraps errors in Blob storage delete error
 * @param baseMessage - Base error message
 * @param error - Unknown error to wrap
 * @returns BlobStorageDeleteError instance
 */
export function wrapBlobStorageDeleteError(
  baseMessage: string,
  error: unknown
): BlobStorageDeleteError {
  return wrapError(BlobStorageDeleteError, baseMessage, error);
}


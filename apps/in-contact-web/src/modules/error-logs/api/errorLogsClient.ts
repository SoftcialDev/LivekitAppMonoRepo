/**
 * @fileoverview errorLogsClient - API client for error log operations
 * @description Client for interacting with error logs REST API
 */

import apiClient from '@/shared/api/apiClient';
import { extractErrorMessage } from '@/shared/utils/errorUtils';
import type {
  ErrorLog,
  ErrorLogQueryParams,
  GetErrorLogsResponse,
  DeleteErrorLogsResponse,
} from '../types/errorLogsTypes';
import {
  ErrorLogsFetchError,
  ErrorLogByIdFetchError,
  ErrorLogResolveError,
  ErrorLogsDeleteError,
  ErrorLogsDeleteAllError,
} from '../errors';

/**
 * Fetches all error logs with optional filtering
 * @param params - Optional query parameters for filtering
 * @returns Promise that resolves to error logs response
 * @throws ErrorLogsFetchError if the request fails
 */
export async function getErrorLogs(
  params?: ErrorLogQueryParams
): Promise<GetErrorLogsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.source) queryParams.append('source', params.source);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.endpoint) queryParams.append('endpoint', params.endpoint);
    if (params?.resolved !== undefined) {
      queryParams.append('resolved', String(params.resolved));
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate.toISOString());
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate.toISOString());
    }
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    const url = `/api/error-logs${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<GetErrorLogsResponse>(url);
    return response.data;
  } catch (error) {
    // apiClient interceptor already transforms errors to typed classes
    // Extract message and wrap in module-specific error
    const errorMessage = extractErrorMessage(error, 'Failed to fetch error logs');
    throw new ErrorLogsFetchError(errorMessage, error instanceof Error ? error : new Error(errorMessage));
  }
}

/**
 * Fetches a single error log by ID
 * @param id - Error log identifier
 * @returns Promise that resolves to error log
 * @throws ErrorLogByIdFetchError if the request fails
 */
export async function getErrorLogById(id: string): Promise<ErrorLog> {
  try {
    const response = await apiClient.get<ErrorLog>(`/api/error-logs/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error, `Failed to fetch error log with ID: ${id}`);
    throw new ErrorLogByIdFetchError(id, error instanceof Error ? error : new Error(errorMessage));
  }
}

/**
 * Marks an error log as resolved
 * @param id - Error log identifier
 * @returns Promise that resolves when the operation completes
 * @throws ErrorLogResolveError if the request fails
 */
export async function resolveErrorLog(id: string): Promise<void> {
  try {
    await apiClient.patch(`/api/error-logs/${id}/resolve`);
  } catch (error) {
    const errorMessage = extractErrorMessage(error, `Failed to resolve error log with ID: ${id}`);
    throw new ErrorLogResolveError(id, error instanceof Error ? error : new Error(errorMessage));
  }
}

/**
 * Deletes error logs (supports single or batch deletion)
 * @param ids - Single ID or array of IDs to delete
 * @returns Promise that resolves to deletion response
 * @throws ErrorLogsDeleteError if the request fails
 */
export async function deleteErrorLogs(
  ids: string | string[]
): Promise<DeleteErrorLogsResponse> {
  try {
    const response = await apiClient.delete<DeleteErrorLogsResponse>('/api/error-logs', {
      data: { ids }
    });
    return response.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error, 'Failed to delete error logs');
    throw new ErrorLogsDeleteError(ids, error instanceof Error ? error : new Error(errorMessage));
  }
}

/**
 * Deletes all error logs
 * @returns Promise that resolves to deletion response
 * @throws ErrorLogsDeleteAllError if the request fails
 */
export async function deleteAllErrorLogs(): Promise<DeleteErrorLogsResponse> {
  try {
    const response = await apiClient.delete<DeleteErrorLogsResponse>('/api/error-logs', {
      data: { deleteAll: true }
    });
    return response.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error, 'Failed to delete all error logs');
    throw new ErrorLogsDeleteAllError(error instanceof Error ? error : new Error(errorMessage));
  }
}


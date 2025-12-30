/**
 * @fileoverview errorLogsClient - API client for error log operations
 * @description Client for interacting with error logs REST API
 */

import apiClient from './apiClient';
import { ErrorSeverity } from './types/errorLogs';
import { ErrorSource } from './types/errorLogs';

/**
 * Error log entry interface
 */
export interface ErrorLog {
  id: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  endpoint?: string;
  functionName?: string;
  errorName: string;
  errorMessage: string;
  stackTrace?: string;
  httpStatusCode?: number;
  userId?: string;
  userEmail?: string;
  requestId?: string;
  context?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

/**
 * Query parameters for fetching error logs
 */
export interface ErrorLogQueryParams {
  source?: ErrorSource;
  severity?: ErrorSeverity;
  endpoint?: string;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Response from GET /api/error-logs
 */
export interface GetErrorLogsResponse {
  logs: ErrorLog[];
  count: number;
  total: number;
  limit?: number;
  offset?: number;
  hasMore: boolean;
}

/**
 * Request body for DELETE /api/error-logs
 */
export interface DeleteErrorLogsRequest {
  ids?: string | string[];
  deleteAll?: boolean;
}

/**
 * Response from DELETE /api/error-logs
 */
export interface DeleteErrorLogsResponse {
  message: string;
  deletedIds?: string[];
  deletedAll?: boolean;
}

/**
 * Fetches all error logs with optional filtering
 * @param params - Optional query parameters for filtering
 * @returns Promise that resolves to error logs response
 * @throws Error if the request fails
 */
export async function getErrorLogs(
  params?: ErrorLogQueryParams
): Promise<GetErrorLogsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.source) queryParams.append('source', params.source);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.endpoint) queryParams.append('endpoint', params.endpoint);
    if (params?.resolved !== undefined) queryParams.append('resolved', String(params.resolved));
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    const url = `/api/error-logs${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<GetErrorLogsResponse>(url);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch error logs';
    throw new Error(errorMessage);
  }
}

/**
 * Fetches a single error log by ID
 * @param id - Error log identifier
 * @returns Promise that resolves to error log
 * @throws Error if the request fails
 */
export async function getErrorLogById(id: string): Promise<ErrorLog> {
  try {
    const response = await apiClient.get<ErrorLog>(`/api/error-logs/${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch error log';
    throw new Error(errorMessage);
  }
}

/**
 * Marks an error log as resolved
 * @param id - Error log identifier
 * @returns Promise that resolves when the operation completes
 * @throws Error if the request fails
 */
export async function resolveErrorLog(id: string): Promise<void> {
  try {
    await apiClient.patch(`/api/error-logs/${id}/resolve`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to resolve error log';
    throw new Error(errorMessage);
  }
}

/**
 * Deletes error logs (supports single or batch deletion)
 * @param ids - Single ID or array of IDs to delete
 * @returns Promise that resolves to deletion response
 * @throws Error if the request fails
 */
export async function deleteErrorLogs(
  ids: string | string[]
): Promise<DeleteErrorLogsResponse> {
  try {
    const response = await apiClient.delete<DeleteErrorLogsResponse>('/api/error-logs', {
      data: { ids }
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to delete error logs';
    throw new Error(errorMessage);
  }
}

/**
 * Deletes all error logs
 * @returns Promise that resolves to deletion response
 * @throws Error if the request fails
 */
export async function deleteAllErrorLogs(): Promise<DeleteErrorLogsResponse> {
  try {
    const response = await apiClient.delete<DeleteErrorLogsResponse>('/api/error-logs', {
      data: { deleteAll: true }
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to delete all error logs';
    throw new Error(errorMessage);
  }
}


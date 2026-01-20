/**
 * @fileoverview Camera Failures API client
 * @summary API functions for camera failure reports
 * @description Provides API functions for fetching and reporting camera failure reports
 */

import apiClient from '@/shared/api/apiClient';
import { extractErrorMessage } from '@/shared/utils/errorUtils';
import { logError } from '@/shared/utils/logger';
import type {
  CameraFailureReport,
  CameraFailureQueryParams,
  GetCameraFailuresResponse,
  ReportCameraFailureRequest,
} from '../types/cameraFailureTypes';
import {
  CameraFailuresFetchError,
  CameraFailureByIdFetchError,
} from '../errors';

/**
 * Fetches camera failure logs with optional filtering and pagination
 * 
 * @param params - Optional query parameters for filtering and pagination
 * @returns Promise that resolves to camera failure logs response
 * @throws {CameraFailuresFetchError} If the request fails
 */
export async function getCameraFailures(
  params?: CameraFailureQueryParams
): Promise<GetCameraFailuresResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.stage) {
      queryParams.append('stage', params.stage);
    }
    if (params?.userEmail) {
      queryParams.append('userEmail', params.userEmail);
    }
    if (params?.userAdId) {
      queryParams.append('userAdId', params.userAdId);
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', String(params.limit));
    }
    if (params?.offset !== undefined) {
      queryParams.append('offset', String(params.offset));
    }

    const queryString = queryParams.toString();
    const baseUrl = '/api/GetCameraFailures';
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    const response = await apiClient.get<GetCameraFailuresResponse>(url);
    return response.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error, 'Failed to fetch camera failure logs');
    throw new CameraFailuresFetchError(errorMessage, error instanceof Error ? error : new Error(errorMessage));
  }
}

/**
 * Fetches a single camera failure log by ID
 * 
 * @param id - Camera failure log identifier
 * @returns Promise that resolves to camera failure log
 * @throws {CameraFailureByIdFetchError} If the request fails
 */
export async function getCameraFailureById(id: string): Promise<CameraFailureReport> {
  try {
    const response = await apiClient.get<CameraFailureReport>(`/api/GetCameraFailures/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error, 'Failed to fetch camera failure log');
    throw new CameraFailureByIdFetchError(errorMessage, error instanceof Error ? error : new Error(errorMessage));
  }
}

/**
 * Reports a camera failure to the backend
 * 
 * @param failure - Camera failure data to report
 * @returns Promise that resolves when the report is sent successfully
 * @remarks This function fails silently to avoid disrupting user experience
 */
export async function reportCameraFailure(failure: ReportCameraFailureRequest): Promise<void> {
  try {
    await apiClient.post<{ stored: boolean }>('/api/CameraStartFailures', failure);
  } catch (error) {
    // Fail silently - we don't want error reporting failures to disrupt user experience
    logError('[reportCameraFailure] Failed to report camera failure', {
      error,
      stage: failure.stage,
      errorName: failure.errorName,
    });
  }
}


/**
 * @fileoverview cameraFailuresClient - API client for camera failure logs
 * @description Provides functions to interact with camera failure log endpoints
 */

import apiClient from "./apiClient";



export interface CameraFailure {
  id: string;
  userId: string | null;
  userAdId: string;
  userEmail: string | null;
  stage: string;
  errorName: string | null;
  errorMessage: string | null;
  deviceCount: number | null;
  devicesSnapshot: any;
  attempts: any;
  metadata: any;
  createdAt: string;
  createdAtCentralAmerica: string | null;
}

export interface CameraFailureQueryParams {
  stage?: string;
  userEmail?: string;
  userAdId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface GetCameraFailuresResponse {
  failures: CameraFailure[];
  count: number;
  total: number;
  limit?: number;
  offset?: number;
  hasMore: boolean;
}

/**
 * Fetches camera failure logs with optional filtering and pagination
 * @param params - Query parameters for filtering and pagination
 * @returns Promise that resolves to camera failure logs response
 */
export async function getCameraFailures(params?: CameraFailureQueryParams): Promise<GetCameraFailuresResponse> {
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
    const url = `/api/GetCameraFailures${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<GetCameraFailuresResponse>(url);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch camera failure logs';
    throw new Error(errorMessage);
  }
}

/**
 * Fetches a single camera failure log by ID
 * @param id - Camera failure log identifier
 * @returns Promise that resolves to camera failure log
 */
export async function getCameraFailureById(id: string): Promise<CameraFailure> {
  try {
    const response = await apiClient.get<CameraFailure>(`/api/GetCameraFailures/${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch camera failure log';
    throw new Error(errorMessage);
  }
}


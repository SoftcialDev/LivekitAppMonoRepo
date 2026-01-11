/**
 * @fileoverview Talk session API client
 * @summary API client for talk session management
 * @description Provides methods to start, stop, and check talk sessions via the backend API
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import { config } from '@/shared/config';
import { TalkStopReason } from '../../talk-sessions/enums/talkStopReason';
import type {
  TalkSessionStartRequest,
  TalkSessionStartResponse,
  TalkSessionStopRequest,
  TalkSessionStopResponse,
  CheckActiveSessionResponse,
} from './types/talkSessionClientTypes';

/**
 * Client for managing talk sessions with the backend API
 */
export class TalkSessionClient {
  private readonly startEndpoint = '/api/TalkSessionStart';
  private readonly stopEndpoint = '/api/TalkSessionStop';
  private readonly checkActiveEndpoint = '/api/GetActiveTalkSession';

  /**
   * Starts a talk session with the specified PSO
   * 
   * @param psoEmail - Email address of the PSO to start a talk session with
 * @returns Promise resolving to the talk session start response
 * @throws {Error} If the API request fails
   */
  public async start(psoEmail: string): Promise<TalkSessionStartResponse> {
    const payload: TalkSessionStartRequest = {
      psoEmail: psoEmail.toLowerCase().trim(),
    };

    try {
      const response = await apiClient.post<TalkSessionStartResponse>(
        this.startEndpoint,
        payload
      );
      return response.data;
    } catch (error) {
      throw handleApiError(
        'start talk session',
        error,
        'Failed to start talk session'
      );
    }
  }

  /**
   * Stops an active talk session
   * 
   * @param talkSessionId - ID of the talk session to stop
   * @param stopReason - Reason for stopping the session
   * @returns Promise resolving to the talk session stop response
   * @throws {TalkSessionError} If the API request fails
   */
  public async stop(
    talkSessionId: string,
    stopReason: TalkStopReason
  ): Promise<TalkSessionStopResponse> {
    const payload: TalkSessionStopRequest = {
      talkSessionId,
      stopReason,
    };

    try {
      const response = await apiClient.post<TalkSessionStopResponse>(
        this.stopEndpoint,
        payload
      );
      return response.data;
    } catch (error) {
      throw handleApiError(
        'stop talk session',
        error,
        'Failed to stop talk session'
      );
    }
  }

  /**
   * Checks if there is an active talk session for a PSO
   * 
   * @param psoEmail - Email address of the PSO to check
   * @returns Promise resolving to active session information
   * @throws {Error} If the API request fails
   */
  public async checkActiveSession(psoEmail: string): Promise<CheckActiveSessionResponse> {
    try {
      const response = await apiClient.get<CheckActiveSessionResponse>(
        this.checkActiveEndpoint,
        {
          params: {
            psoEmail: psoEmail.toLowerCase().trim(),
          },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(
        'check active talk session',
        error,
        'Failed to check active talk session'
      );
    }
  }

  /**
   * Sends a request to stop a talk session on browser refresh/unload
   * 
   * Uses fetch with keepalive for reliable delivery during page unload.
   * This method should be used in beforeunload handlers where regular async
   * requests may not complete before the page closes. Uses fetch with keepalive
   * instead of sendBeacon to support authentication headers.
   * 
   * Note: This requires access to the token getter. If token is not available,
   * the request will fail silently as this is called during page unload.
   * 
   * @param talkSessionId - ID of the talk session to stop
   * @param stopReason - Reason for stopping the session
   * @param getToken - Optional function to retrieve access token. If not provided, request will be unauthenticated.
   * @returns Promise that resolves when request is sent (fire-and-forget)
   */
  public async sendBeaconStop(
    talkSessionId: string,
    stopReason: TalkStopReason,
    getToken?: () => Promise<string | null>
  ): Promise<void> {
    const url = `${config.apiUrl}${this.stopEndpoint}`;
    const payload: TalkSessionStopRequest = {
      talkSessionId,
      stopReason,
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Try to get token if getter is provided
    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        // Ignore token errors during page unload
      }
    }

    // Use fetch with keepalive for reliable delivery during page unload
    // This is better than sendBeacon because it supports custom headers
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Ignore errors - this is fire-and-forget during page unload
    });
  }
}


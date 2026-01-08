/**
 * @fileoverview talkSessionClient.ts - API client for talk session management
 * @summary Provides methods to start and stop talk sessions via the backend API
 * @description This client handles HTTP requests to the TalkSessionStart and
 * TalkSessionStop endpoints, managing the communication between supervisors
 * and PSOs for two-way audio sessions.
 */

import apiClient from './apiClient';
import {
  TalkSessionStartRequest,
  TalkSessionStartResponse,
  TalkSessionStopRequest,
  TalkSessionStopResponse
} from '../types/talkSession';

/**
 * Client for managing talk sessions with the backend API.
 */
export class TalkSessionClient {
  private readonly startEndpoint = '/api/TalkSessionStart';
  private readonly stopEndpoint = '/api/TalkSessionStop';

  /**
   * Starts a talk session with the specified PSO
   * @param psoEmail - Email address of the PSO to start a talk session with
   * @returns Promise resolving to the talk session start response
   * @throws {Error} If the API request fails
   */
  public async start(psoEmail: string): Promise<TalkSessionStartResponse> {
    const payload: TalkSessionStartRequest = {
      psoEmail: psoEmail.toLowerCase().trim()
    };

    const response = await apiClient.post<TalkSessionStartResponse>(
      this.startEndpoint,
      payload
    );

    return response.data;
  }

  /**
   * Stops an active talk session
   * @param talkSessionId - ID of the talk session to stop
   * @param stopReason - Reason for stopping the session
   * @returns Promise resolving to the talk session stop response
   * @throws {Error} If the API request fails
   */
  public async stop(
    talkSessionId: string,
    stopReason: string
  ): Promise<TalkSessionStopResponse> {
    const payload: TalkSessionStopRequest = {
      talkSessionId,
      stopReason: stopReason as any
    };

    const response = await apiClient.post<TalkSessionStopResponse>(
      this.stopEndpoint,
      payload
    );

    return response.data;
  }

  /**
   * Gets all talk sessions with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Promise resolving to paginated talk sessions response
   * @throws {Error} If the API request fails
   */
  public async getTalkSessions(page: number = 1, limit: number = 10): Promise<{
    sessions: TalkSessionReport[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const response = await apiClient.get<{
      sessions: TalkSessionReport[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    }>('/api/TalkSessions', {
      params: { page, limit }
    });

    return response.data;
  }

  /**
   * Checks if there is an active talk session for a PSO
   * @param psoEmail - Email address of the PSO to check
   * @returns Promise resolving to active session information
   * @throws {Error} If the API request fails
   */
  public async checkActiveSession(psoEmail: string): Promise<{
    hasActiveSession: boolean;
    sessionId?: string;
    supervisorEmail?: string;
    supervisorName?: string;
    startedAt?: string;
  }> {
    const response = await apiClient.get<{
      hasActiveSession: boolean;
      sessionId?: string;
      supervisorEmail?: string;
      supervisorName?: string;
      startedAt?: string;
    }>(`/api/GetActiveTalkSession?psoEmail=${encodeURIComponent(psoEmail.toLowerCase().trim())}`);

    return response.data;
  }
}

/**
 * Talk session report DTO from the API.
 */
export interface TalkSessionReport {
  id: string;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  psoId: string;
  psoName: string;
  psoEmail: string;
  startedAt: string;
  stoppedAt: string | null;
  stopReason: string | null;
  createdAt: string;
  updatedAt: string;
}


/**
 * @fileoverview Streaming API client for PSO Dashboard
 * @summary API client for streaming session status operations
 * @description Handles notifying the backend about streaming status changes
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type { StreamingSessionUpdateResponse } from './types/streamingClientTypes';

/**
 * Client for notifying the backend about the user's video streaming state
 */
export class StreamingClient {
  private readonly updateEndpoint = '/api/StreamingSessionUpdate';

  /**
   * Notify the backend that the user has started streaming video
   *
   * @returns Promise that resolves when the request completes
   * @throws Will propagate any network or API errors
   */
  public async setActive(): Promise<void> {
    try {
      await apiClient.post<unknown>(this.updateEndpoint, { status: 'started' });
    } catch (error) {
      throw handleApiError(
        'set streaming active',
        error,
        'Failed to notify backend of streaming start'
      );
    }
  }

  /**
   * Notify the backend that the user has stopped streaming video
   *
   * @param reason - Optional stop reason (e.g., 'QUICK_BREAK', 'LUNCH_BREAK', etc.)
   * @param isCommand - Whether this stop was triggered by a command
   * @returns Promise that resolves to the response containing stoppedAt timestamp
   * @throws Will propagate any network or API errors
   */
  public async setInactive(
    reason?: string,
    isCommand?: boolean
  ): Promise<StreamingSessionUpdateResponse> {
    try {
      const payload: any = { status: 'stopped' };
      if (reason) {
        payload.reason = reason;
      }
      if (isCommand !== undefined) {
        payload.isCommand = isCommand;
      }

      const response = await apiClient.post<StreamingSessionUpdateResponse>(
        this.updateEndpoint,
        payload
      );
      return response.data;
    } catch (error) {
      throw handleApiError(
        'set streaming inactive',
        error,
        'Failed to notify backend of streaming stop'
      );
    }
  }
}


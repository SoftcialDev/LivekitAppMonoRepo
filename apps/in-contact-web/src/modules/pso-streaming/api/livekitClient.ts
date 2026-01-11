/**
 * @fileoverview LiveKit API client
 * @summary API client for LiveKit token operations
 * @description Handles fetching LiveKit access tokens from the backend
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import { LiveKitTokenError } from '../errors';
import type { LiveKitTokenResponse } from './types';

/**
 * Fetches LiveKit access tokens from the backend.
 *
 * If `roomName` is provided, returns a single-room token for that room.
 * Otherwise, returns one entry per room the caller is allowed to join
 * (e.g. Admin/Supervisor sees all other rooms; PSO sees only their own).
 *
 * @param roomName - Optional LiveKit room identifier to scope token to.
 *                   When omitted, backend decides which rooms to return
 *                   based on the caller's role.
 * @returns Promise resolving to:
 *   - `rooms`: array of `{ room, token }`
 *   - `livekitUrl`: base URL for the LiveKit WS endpoint
 * @throws Error if the response is malformed or missing expected fields.
 */
export async function getLiveKitToken(
  roomName?: string
): Promise<LiveKitTokenResponse> {
  try {
    // Build query string if a specific room was requested
    const query = roomName
      ? `?room=${encodeURIComponent(roomName)}`
      : '';

    // Request per-room tokens from our API
    const res = await apiClient.get<LiveKitTokenResponse>(`/api/LiveKitToken${query}`);

    const { data } = res;
    if (
      !data ||
      !Array.isArray(data.rooms) ||
      typeof data.livekitUrl !== 'string'
    ) {
      throw new LiveKitTokenError(
        'Invalid LiveKitToken response: missing required fields',
        new Error('Response missing rooms array or livekitUrl')
      );
    }

    for (const entry of data.rooms) {
      if (typeof entry.room !== 'string' || typeof entry.token !== 'string') {
        throw new LiveKitTokenError(
          'Invalid room/token entry in LiveKitToken response',
          new Error(`Invalid entry: ${JSON.stringify(entry)}`)
        );
      }
    }

    return data;
  } catch (error) {
    if (error instanceof LiveKitTokenError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new LiveKitTokenError(
      `Failed to fetch LiveKit token: ${errorMessage}`,
      error instanceof Error ? error : new Error(errorMessage)
    );
  }
}


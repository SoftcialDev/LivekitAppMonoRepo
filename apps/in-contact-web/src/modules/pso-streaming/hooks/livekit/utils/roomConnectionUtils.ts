/**
 * @fileoverview Room connection utilities
 * @summary Utility functions for room connection logic
 * @description Pure functions for room connection validation and state management
 */

import { Room } from 'livekit-client';
import { logDebug, logWarn } from '@/shared/utils/logger';

/**
 * Validates connection parameters
 * @param shouldStream - Whether streaming should be active
 * @param accessToken - Access token
 * @param roomName - Room name
 * @param livekitUrl - LiveKit URL
 * @returns True if all parameters are valid
 */
export function validateConnectionParams(
  shouldStream: boolean,
  accessToken: string | null,
  roomName: string | null,
  livekitUrl: string | null
): boolean {
  if (!shouldStream) {
    return false;
  }

  if (!accessToken || !roomName || !livekitUrl) {
    logDebug('[roomConnectionUtils] Missing connection parameters', {
      hasAccessToken: !!accessToken,
      hasRoomName: !!roomName,
      hasLivekitUrl: !!livekitUrl,
    });
    return false;
  }

  return true;
}

/**
 * Creates a new Room instance with optimized configuration
 * @returns Configured Room instance
 */
export function createOptimizedRoom(): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: {
      simulcast: false,
    },
    reconnectPolicy: {
      nextRetryDelayInMs: (context: { retryCount: number }) => {
        return Math.min(1000 * Math.pow(2, context.retryCount), 8000);
      },
    },
  });
}

/**
 * Cleans up a room instance
 * @param room - Room instance to clean up
 */
export async function cleanupRoom(room: Room | null): Promise<void> {
  if (!room) {
    return;
  }

  try {
    room.removeAllListeners();
    await room.disconnect();
  } catch (err) {
    logWarn('[roomConnectionUtils] Error cleaning up room', { error: err });
  }
}


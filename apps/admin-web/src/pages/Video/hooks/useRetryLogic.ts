/**
 * @fileoverview useRetryLogic - Connection retry helper for LiveKit
 * @summary Wraps LiveKit room connection with timeout, backoff and cleanup.
 */

import { useCallback } from 'react';
import type { LocalVideoTrack, Room } from 'livekit-client';

type GetTokenFn = () => Promise<{ livekitUrl: string; rooms: { token: string }[] }>;

type LiveKitApi = {
  connectToRoom: (livekitUrl: string, token: string, roomConfig?: any) => Promise<Room>;
  disconnectFromRoom: () => Promise<void>;
};

export function useRetryLogic(liveKit: LiveKitApi) {
  /** Connects to LiveKit with timeout/backoff and runs onSuccess on success. */
  const connectWithRetry = useCallback(
    async (
      getToken: GetTokenFn,
      onSuccess: (room: Room) => Promise<void>,
      videoTrack?: LocalVideoTrack,
      maxRetries: number = 5,
    ): Promise<boolean> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { livekitUrl, rooms } = await getToken();
          const timeoutMs = Math.min(5000 + attempt * 2000, 15000);
          const connectPromise = liveKit.connectToRoom(livekitUrl, rooms[0].token);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`timeout-${timeoutMs}`)), timeoutMs),
          );
          const room = (await Promise.race([connectPromise, timeoutPromise])) as Room;
          await onSuccess(room);
          return true;
        } catch (err) {
          // cleanup between attempts
          try {
            await liveKit.disconnectFromRoom();
          } catch {}
          if (attempt === maxRetries - 1) return false;
          const backoff = Math.min(2000 * Math.pow(2, attempt), 10000);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
      return false;
    },
    [liveKit],
  );

  return { connectWithRetry };
}



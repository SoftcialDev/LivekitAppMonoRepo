import { useState, useEffect } from 'react';
import { getLiveKitToken, RoomWithToken } from '../services/livekitClient';

interface LiveKitCreds {
  /** JWT to connect to LiveKit */
  accessToken?: string;
  /** The LiveKit room name (The user’s ID) */
  roomName?: string;
  /** URL of the LiveKit WebSocket server */
  livekitUrl?: string;
  /** True while fetching a new token */
  loading: boolean;
}

/**
 * Hook to fetch and refresh a single LiveKit token for a given user.
 *
 * - Calls your backend `getLiveKitToken(userId)` to retrieve `rooms` + `livekitUrl`.
 * - Exposes `{ accessToken, roomName, livekitUrl, loading }`.
 * - Automatically refetches whenever `userId` changes.
 *
 * @param userId  The unique identifier for the target user/room.
 * @returns       Current LiveKit credentials and loading state.
 */
export function useLiveKit(userId: string): LiveKitCreds {
  const [creds, setCreds] = useState<LiveKitCreds>({ loading: true });

  useEffect(() => {
    if (!userId) {
      setCreds({ loading: false });
      return;
    }

    let cancelled = false;
    setCreds({ loading: true });

    getLiveKitToken(userId)
      .then(response => {
        if (cancelled) return;
        // assume response.rooms: RoomWithToken[] and .livekitUrl
        const roomEntry = response.rooms.find((r: RoomWithToken) => r.room === userId);
        setCreds({
          accessToken: roomEntry?.token,
          roomName:    userId,
          livekitUrl:  response.livekitUrl,
          loading:     false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCreds({ loading: false });
      });

    return () => { cancelled = true; };
  }, [userId]);

  return creds;
}

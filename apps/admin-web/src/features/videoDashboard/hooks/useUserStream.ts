import { useEffect, useRef, useState, useCallback } from 'react';
import { WebPubSubClientService, MessageHandler } from '../../../services/webpubsubClient';
import { fetchStreamingSessions } from '../../../services/streamingStatusClient';
import { getLiveKitToken, RoomWithToken } from '../../../services/livekitClient';

const STREAM_FETCH_DEBOUNCE_MS = 500;

/**
 * Hook that manages LiveKit credentials for one target user.
 *
 * - On mount: does a one-time REST lookup to catch any in-flight session.
 * - Listens for real-time “started”/“stopped” events over WebPubSub.
 * - Exposes `{ accessToken, roomName, livekitUrl, loading }`.
 *
 * @param viewerEmail  Email of the current viewer (used for your own WS group).
 * @param targetEmail  Email of the user whose stream you want to watch.
 */
export function useUserStream(
  viewerEmail: string,
  targetEmail: string
): {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
} {
  const [accessToken, setAccessToken] = useState<string>();
  const [roomName,    setRoomName]    = useState<string>();
  const [livekitUrl,  setLivekitUrl]  = useState<string>();
  const [loading,     setLoading]     = useState(false);

  const wsRef = useRef<WebPubSubClientService>();
  const fetchTimer = useRef<number>();

  // central fetcher: get sessionId + token + URL
  const fetchAndSet = useCallback(async () => {
    setLoading(true);
    try {
      const sessions = await fetchStreamingSessions();
      const sess = sessions.find(s => s.email === targetEmail);
      if (!sess) throw new Error('No open streaming session');
      const { rooms, livekitUrl } = await getLiveKitToken(sess.userId);
      const entry = rooms.find((r: RoomWithToken) => r.room === sess.userId);
      if (!entry) throw new Error('Missing LiveKit token');
      setRoomName(entry.room);
      setAccessToken(entry.token);
      setLivekitUrl(livekitUrl);
    } catch (err) {
      console.warn('[useUserStream] fetch failed:', err);
      setAccessToken(undefined);
      setRoomName(undefined);
      setLivekitUrl(undefined);
    } finally {
      setLoading(false);
    }
  }, [targetEmail]);

  // WS message handler for this target
  const handleStreamEvent: MessageHandler<{
    email: string;
    status: 'started' | 'stopped';
  }> = useCallback(({ email, status }) => {
    if (email !== targetEmail) return;
    window.clearTimeout(fetchTimer.current);
    if (status === 'started') {
      // debounce rapid back-to-back events
      fetchTimer.current = window.setTimeout(fetchAndSet, STREAM_FETCH_DEBOUNCE_MS);
    } else {
      setAccessToken(undefined);
      setRoomName(undefined);
      setLivekitUrl(undefined);
    }
  }, [targetEmail, fetchAndSet]);

  useEffect(() => {
    const client = new WebPubSubClientService();
    wsRef.current = client;

    client
      .connect(viewerEmail)
      .then(() => {
        // you’re now in your own presence group
        client.onMessage(handleStreamEvent);
        // **also** join the target’s group so we get their “started/stopped”
        return client['client']?.joinGroup?.(targetEmail);  
        // note: if your wrapper doesn’t expose joinGroup, you can add a small helper
      })
      .catch(err => {
        console.error('[useUserStream] WS connect error', err);
      });

    // initial REST pass in case they were already live
    fetchAndSet();

    return () => {
      window.clearTimeout(fetchTimer.current);
      wsRef.current?.disconnect();
      setLoading(false);
      setAccessToken(undefined);
      setRoomName(undefined);
      setLivekitUrl(undefined);
    };
  }, [viewerEmail, targetEmail, handleStreamEvent, fetchAndSet]);

  return { accessToken, roomName, livekitUrl, loading };
}

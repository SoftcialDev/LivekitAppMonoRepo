// src/features/video/hooks/useMultiUserStreams.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { WebPubSubClientService }   from '@/services/webpubsubClient';
import { fetchStreamingSessions }   from '@/services/streamingStatusClient';
import { getLiveKitToken, RoomWithToken } from '@/services/livekitClient';
import { usePresenceStore }         from '@/stores/usePresenceStore';

interface StreamCreds {
  accessToken?: string;
  roomName?:    string;
  livekitUrl?:  string;
  loading:      boolean;
}
export type CredsMap = Record<string, StreamCreds>;

/**
 * Custom hook to maintain LiveKit credentials for multiple PSOs.
 *
 * - Connects once to each PSO’s PubSub group on mount (and when `emails` changes).
 * - Listens for “started” / “stopped” messages and fetches / clears tokens accordingly.
 * - Initial token fetch if already live at mount.
 *
 * @param viewerEmail  Email of the current viewer (for WS identity)
 * @param emails       Lowercase PSO emails to monitor
 * @returns            Map of PSO email → current stream credentials
 */
export function useMultiUserStreams(
  viewerEmail: string,
  emails: string[],
): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const servicesRef = useRef<Record<string, WebPubSubClientService>>({});
  const streamingMap = usePresenceStore(s => s.streamingMap);

  const fetchFor = useCallback(async (email: string) => {
    setCredsMap(prev => ({
      ...prev,
      [email]: { ...prev[email], loading: true }
    }));
    try {
      const sessions = await fetchStreamingSessions();
      const sess = sessions.find(s => s.email.toLowerCase() === email);
      if (!sess) throw new Error('No active session');
      const { rooms, livekitUrl } = await getLiveKitToken(sess.userId);
      const entry = (rooms as RoomWithToken[]).find(r => r.room === sess.userId);
      if (!entry) throw new Error('Missing LiveKit token');
      setCredsMap(prev => ({
        ...prev,
        [email]: {
          accessToken: entry.token,
          roomName:    sess.userId,
          livekitUrl,
          loading:     false,
        }
      }));
    } catch {
      setCredsMap(prev => ({
        ...prev,
        [email]: { loading: false }
      }));
    }
  }, []);

  useEffect(() => {
    // Tear down any old connections
    Object.values(servicesRef.current).forEach(svc => svc.disconnect());
    servicesRef.current = {};

    emails.forEach(email => {
      const client = new WebPubSubClientService();
      servicesRef.current[email] = client;

      client.connect(viewerEmail)
        .then(() => client.joinGroup(email))
        .then(() => {
          client.onMessage<{ email?: string; status: 'started'|'stopped' }>(msg => {
            if (typeof msg.email !== 'string') return;
            if (msg.email.toLowerCase() !== email) return;
            if (msg.status === 'started') {
              fetchFor(email);
            } else {
              // ONLY here limpiamos
              setCredsMap(prev => ({
                ...prev,
                [email]: { loading: false }
              }));
            }
          });
          // initial fetch if already live
          if (streamingMap[email]) {
            fetchFor(email);
          }
        })
        .catch(err => console.error(`[multiStream][${email}] setup failed`, err));
    });

    return () => {
      Object.values(servicesRef.current).forEach(svc => svc.disconnect());
      servicesRef.current = {};
    };
  }, [
    viewerEmail,
    emails.join(','),                          // re-run when list changes
    JSON.stringify(Object.keys(streamingMap)
      .filter(e => streamingMap[e])),          // to capture initial live set
    fetchFor
  ]);

  // <-- Aquí ELIMINAMOS cualquier useEffect que limpiara en base a streamingMap

  return credsMap;
}

// src/features/video/hooks/useMultiUserStreams.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { WebPubSubClientService } from '@/services/webpubsubClient';
import { fetchStreamingSessions } from '@/services/streamingStatusClient';
import { getLiveKitToken, RoomWithToken } from '@/services/livekitClient';
import { usePresenceStore } from '@/stores/usePresenceStore';

interface StreamCreds {
  accessToken?: string;
  roomName?:    string;
  livekitUrl?:  string;
  loading:      boolean;
}
export type CredsMap = Record<string, StreamCreds>;

/**
 * Custom hook to maintain LiveKit credentials for multiple PSOs,
 * reacting only when their streaming state truly changes.
 */
export function useMultiUserStreams(
  viewerEmail: string,
  emails: string[],
): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const servicesRef = useRef<Record<string, WebPubSubClientService>>({});
  const prevStreamingRef = useRef<Record<string, boolean>>({});

  const streamingMap = usePresenceStore(s => s.streamingMap);

  // REST-fetch helper
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

  // Effect: watch for *transitions* in streamingMap[email]
  useEffect(() => {
    const prev = prevStreamingRef.current;
    const next: Record<string, boolean> = {};

    emails.forEach(email => {
      const isStreaming = Boolean(streamingMap[email]);
      next[email] = isStreaming;

      const wasStreaming = Boolean(prev[email]);
      // started streaming
      if (isStreaming && !wasStreaming) {
        const client = new WebPubSubClientService();
        servicesRef.current[email] = client;
        client.connect(viewerEmail)
          .then(() => client.joinGroup(email))
          .then(() => {
            client.onMessage<{ email: string; status: 'started'|'stopped' }>(msg => {
              if (msg.email.toLowerCase() !== email) return;
              if (msg.status === 'started') fetchFor(email);
              else setCredsMap(p => ({
                ...p,
                [email]: { loading: false }
              }));
            });
            // initial fetch
            fetchFor(email);
          })
          .catch(err => console.error(`[multiStream][${email}]`, err));
      }

      // stopped streaming
      if (!isStreaming && wasStreaming) {
        const svc = servicesRef.current[email];
        svc?.disconnect();
        delete servicesRef.current[email];
        setCredsMap(p => ({
          ...p,
          [email]: { loading: false }
        }));
      }
    });

    prevStreamingRef.current = next;

    // cleanup on unmount
    return () => {
      Object.values(servicesRef.current).forEach(svc => svc.disconnect());
      servicesRef.current = {};
    };
  }, [streamingMap, emails, viewerEmail, fetchFor]);

  return credsMap;
}

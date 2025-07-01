// src/features/video/hooks/useMultiUserStreams.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  WebPubSubClientService,
  MessageHandler,
} from '@/services/webpubsubClient';
import { fetchStreamingSessions } from '@/services/streamingStatusClient';
import { getLiveKitToken, RoomWithToken } from '@/services/livekitClient';
import { usePresenceWebSocket } from '@/features/navigation/hooks/usePresenceWebSocket';
import type { UserStatus } from '@/features/navigation/types/types';

interface StreamCreds {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
}
export type CredsMap = Record<string, StreamCreds>;

/**
 * Custom hook to maintain LiveKit credentials for many PSOs:
 * 1) Subscribes to presence updates (online/offline).
 * 2) On each PSO-online, opens a WebPubSub client to their group,
 *    listens for START/STOP commands, and fetches tokens.
 * 3) On mount & whenever `emails` changes, triggers an initial fetch
 *    for any already‐online PSOs.
 */
export function useMultiUserStreams(
  viewerEmail: string,
  emails: string[],    // lowercase PSO emails that are "online"
): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  // One WebPubSubService per PSO:
  const servicesRef = useRef<Record<string, WebPubSubClientService>>({});

  /**
   * Fetch LiveKit creds for one PSO via REST.
   */
  const fetchFor = useCallback(async (email: string) => {
    console.log(`[multiStream][${email}] fetching creds…`);
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
          roomName: sess.userId,
          livekitUrl,
          loading: false,
        }
      }));
      console.log(`[multiStream][${email}] creds ready`);
    } catch (err) {
      console.warn(`[multiStream][${email}] fetch error:`, err);
      setCredsMap(prev => ({
        ...prev,
        [email]: { loading: false }
      }));
    }
  }, []);

  /**
   * Handle a presence event for one PSO.
   * - online → spin up a WS, subscribe, listen for START/STOP, and initial fetch.
   * - offline → tear down WS and clear creds.
   */
  const handlePresence = useCallback(
    (user: UserStatus, status: 'online' | 'offline') => {
      const email = user.email.toLowerCase();
      if (!emails.includes(email)) return;

      if (status === 'online') {
        console.log(`[multiStream][${email}] ONLINE detected`);
        const svc = new WebPubSubClientService();
        servicesRef.current[email] = svc;

        svc.connect(viewerEmail)
          .then(() => {
            console.log(`[multiStream][${email}] WS connected`);
            return svc.joinGroup(email);
          })
          .then(() => {
            console.log(`[multiStream][${email}] joined group`);
            svc.onMessage<{ email: string; status: 'started'|'stopped' }>(msg => {
              if (msg.email.toLowerCase() !== email) return;
              console.log(`[multiStream][${email}] command ${msg.status}`);
              if (msg.status === 'started') {
                fetchFor(email);
              } else {
                console.log(`[multiStream][${email}] clearing creds`);
                setCredsMap(prev => ({
                  ...prev,
                  [email]: { loading: false }
                }));
              }
            });
            // initial fetch in case they were already live
            fetchFor(email);
          })
          .catch(err => {
            console.error(`[multiStream][${email}] setup failed:`, err);
          });
      } else {
        console.log(`[multiStream][${email}] OFFLINE detected`);
        servicesRef.current[email]?.disconnect();
        delete servicesRef.current[email];
        setCredsMap(prev => ({
          ...prev,
          [email]: { loading: false }
        }));
      }
    },
    [emails, viewerEmail, fetchFor]
  );

  // Subscribe to presence WS:
  usePresenceWebSocket({
    currentEmail: viewerEmail,
    onPresence: handlePresence,
  });

  // **Initial pass** on mount & whenever `emails` changes:
  // for each PSO currently online, trigger the same logic as if we just saw them come online.
  useEffect(() => {
    for (const email of emails) {
      handlePresence({ 
        email, 
        name: email, 
        fullName: email, 
        azureAdObjectId: null, 
        status: 'online' 
      }, 'online');
    }
  }, [emails, handlePresence]);

  // Cleanup _all_ WS clients on unmount:
  useEffect(() => {
    return () => {
      Object.values(servicesRef.current).forEach(svc => svc.disconnect());
      servicesRef.current = {};
    };
  }, []);

  return credsMap;
}

import { getLiveKitToken, RoomWithToken } from '@/shared/api/livekitClient';
import { fetchStreamingSessions } from '@/shared/api/streamingStatusClient';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { usePresenceStore } from '@/shared/presence/usePresenceStore';
import { useState, useRef, useCallback, useEffect } from 'react';


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
    // Only update if not already loading or if we don't have credentials
    setCredsMap(prev => {
      const current = prev[email];
      if (current?.loading || current?.accessToken) {
        return prev; // Return same reference to avoid re-renders
      }
      
      return {
        ...prev,
        [email]: { ...current, loading: true }
      };
    });
    
    try {
      const sessions = await fetchStreamingSessions();
      const sess = sessions.find(s => s.email.toLowerCase() === email);
      if (!sess) throw new Error('No active session');
      const { rooms, livekitUrl } = await getLiveKitToken(sess.userId);
      const entry = (rooms as RoomWithToken[]).find(r => r.room === sess.userId);
      if (!entry) throw new Error('Missing LiveKit token');
      
      setCredsMap(prev => {
        const current = prev[email];
        // Only update if we don't already have the same credentials
        if (current?.accessToken === entry.token && current?.roomName === sess.userId) {
          return prev; // Return same reference to avoid re-renders
        }
        
        return {
          ...prev,
          [email]: {
            accessToken: entry.token,
            roomName:    sess.userId,
            livekitUrl,
            loading:     false,
          }
        };
      });
    } catch {
      setCredsMap(prev => ({
        ...prev,
        [email]: { loading: false }
      }));
    }
  }, []);

  // Separate effect for managing connections - only runs when emails list changes
  useEffect(() => {
    // ✅ CLEANUP - Limpiar referencias anteriores
    servicesRef.current = {};

    // ✅ USAR SINGLETON - Una sola instancia para todos los grupos
    const client = WebPubSubClientService.getInstance();
    
    // Conectar una sola vez
    client.connect(viewerEmail)
      .then(() => {
        // Unirse a todos los grupos de usuarios
        return Promise.all(emails.map(email => client.joinGroup(email)));
      })
      .then(() => {
        // Configurar listener una sola vez
        client.onMessage<{ email?: string; status: 'started'|'stopped' }>(msg => {
          if (typeof msg.email !== 'string') return;
          const targetEmail = msg.email.toLowerCase();
          if (!emails.includes(targetEmail)) return;
          
          if (msg.status === 'started') {
            fetchFor(targetEmail);
          } else {
            // ONLY here limpiamos
            setCredsMap(prev => ({
              ...prev,
              [targetEmail]: { loading: false }
            }));
          }
        });
      })
      .catch(err => console.error(`[multiStream] setup failed`, err));

    return () => {
      // ✅ CLEANUP - Solo desconectar si es necesario
      // El singleton se maneja en usePresenceStore
      servicesRef.current = {};
    };
  }, [viewerEmail, emails.join(',')]);

  // Separate effect for initial token fetch - only runs when streamingMap changes
  useEffect(() => {
    const streamingEmails = Object.keys(streamingMap).filter(e => streamingMap[e]);
    
    emails.forEach(email => {
      if (streamingMap[email] && !credsMap[email]?.accessToken) {
        fetchFor(email);
      }
    });
  }, [emails.join(','), Object.keys(streamingMap).filter(e => streamingMap[e]).join(','), fetchFor]);



  return credsMap;
}

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

  const fetchFor = useCallback(async (email: string, retryCount = 0) => {
    console.log(`[FETCH START] ${email} - attempt ${retryCount + 1}`);
    
    // Only update if not already loading or if we don't have credentials
    setCredsMap(prev => {
      const current = prev[email];
      if (current?.loading) {
        console.log(`[FETCH SKIP] ${email} - already loading`);
        return prev; // Return same reference to avoid re-renders
      }
      
      // ✅ PERMITIR FETCH SI NO TIENE TOKEN VÁLIDO (incluso si tiene credenciales viejas)
      if (current?.accessToken && current?.roomName && current?.livekitUrl) {
        console.log(`[FETCH SKIP] ${email} - already has valid credentials`);
        return prev; // Return same reference to avoid re-renders
      }
      
      console.log(`[FETCH LOADING] ${email} - setting loading: true`);
      return {
        ...prev,
        [email]: { ...current, loading: true }
      };
    });
    
    // ✅ Verificar si ya conectó DESPUÉS de poner loading: true
    const currentCreds = credsMap[email];
    if (currentCreds?.accessToken) {
      console.log(`[FETCH CANCEL] ${email} already connected, canceling fetch`);
      setCredsMap(prev => ({
        ...prev,
        [email]: { loading: false }
      }));
      return;
    }
    
    try {
      console.log(`[FETCH API] ${email} - calling fetchStreamingSessions`);
      const sessions = await fetchStreamingSessions();
      const sess = sessions.find(s => s.email.toLowerCase() === email);
      if (!sess) {
        console.log(`[FETCH ERROR] ${email} - No active session found`);
        throw new Error('No active session');
      }
      
      console.log(`[FETCH TOKEN] ${email} - calling getLiveKitToken for ${sess.userId}`);
      const { rooms, livekitUrl } = await getLiveKitToken(sess.userId);
      const entry = (rooms as RoomWithToken[]).find(r => r.room === sess.userId);
      if (!entry) {
        console.log(`[FETCH ERROR] ${email} - Missing LiveKit token`);
        throw new Error('Missing LiveKit token');
      }
      
      setCredsMap(prev => {
        const current = prev[email];
        // Only update if we don't already have the same credentials
        if (current?.accessToken === entry.token && current?.roomName === sess.userId) {
          return prev; // Return same reference to avoid re-renders
        }
        
        console.log(`[TOKEN SUCCESS] ${email} got token, should exit black screen`);
        
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
    } catch (error) {
      // ✅ REINTENTOS CON LÍMITE - máximo 20 intentos para evitar loops infinitos
      if ((error as Error).message.includes('No active session') && retryCount < 19) {
        const delay = Math.min((retryCount + 1) * 500, 2000); // 0.5s, 1s, 1.5s, 2s, 2s, 2s...
        console.log(`[multiStream] Retrying fetchFor(${email}) in ${delay}ms (attempt ${retryCount + 1}/20)`);
        // ✅ MANTENER LOADING: TRUE DURANTE REINTENTOS
        setTimeout(() => fetchFor(email, retryCount + 1), delay);
        return; // No cambiar loading a false durante reintentos
      }
      
      // ✅ LÍMITE ALCANZADO - Limpiar estado después de 20 intentos
      if (retryCount >= 19) {
        console.log(`[multiStream] Max retries reached for ${email} (20 attempts), giving up`);
        setCredsMap(prev => ({
          ...prev,
          [email]: { loading: false }
        }));
        return;
      }
      
      // ✅ SOLO PONER LOADING: FALSE SI ES OTRO ERROR (no "No active session")
      console.log(`[multiStream] Final failure for ${email} - different error:`, (error as Error).message);
      setCredsMap(prev => ({
        ...prev,
        [email]: { loading: false }
      }));
    }
  }, [credsMap]);

  // Separate effect for managing connections - only runs when emails list changes
  useEffect(() => {
    // ✅ CLEANUP - Limpiar referencias anteriores
    servicesRef.current = {};

    // ✅ USAR SINGLETON - Una sola instancia para todos los grupos
    const client = WebPubSubClientService.getInstance();
    
    // Conectar una sola vez
    client.connect(viewerEmail)
      .then(() => {
        // ✅ REGISTRAR LISTENER ANTES DE JOIN - Evitar perder eventos "started"
        client.onMessage<{ email?: string; status: 'started'|'stopped' }>(msg => {
          console.log(`[WS MESSAGE] Received message:`, msg);
          
          if (typeof msg.email !== 'string') {
            console.log(`[WS MESSAGE] Invalid email in message:`, msg.email);
            return;
          }
          
          const targetEmail = msg.email.toLowerCase();
          console.log(`[WS MESSAGE] Processing message for ${targetEmail}, status: ${msg.status}`);
          
          if (!emails.includes(targetEmail)) {
            console.log(`[WS MESSAGE] Email ${targetEmail} not in current emails list:`, emails);
            return;
          }
          
          if (msg.status === 'started') {
            console.log(`[START EVENT] ${targetEmail} received started event, calling fetchFor`);
            fetchFor(targetEmail);
          } else if (msg.status === 'stopped') {
            // ✅ LIMPIAR COMPLETAMENTE las credenciales al recibir 'stopped'
            console.log(`[STOP EVENT] ${targetEmail} received stopped event, clearing credentials`);
            setCredsMap(prev => ({
              ...prev,
              [targetEmail]: { 
                loading: false,
                accessToken: undefined,
                roomName: undefined,
                livekitUrl: undefined
              }
            }));
          } else {
            console.log(`[WS MESSAGE] Unknown status: ${msg.status} for ${targetEmail}`);
          }
        });
        
        // Unirse a todos los grupos de usuarios DESPUÉS del listener
        return Promise.all(emails.map(email => client.joinGroup(email)));
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

// ✅ EXPORTAR fetchFor para uso optimista desde handlePlay
export const fetchForOptimistic = async (email: string) => {
  try {
    const sessions = await fetchStreamingSessions();
    const sess = sessions.find(s => s.email.toLowerCase() === email);
    if (!sess) throw new Error('No active session');
    const { rooms, livekitUrl } = await getLiveKitToken(sess.userId);
    const entry = (rooms as RoomWithToken[]).find(r => r.room === sess.userId);
    if (!entry) throw new Error('Missing LiveKit token');
    
    console.log(`[fetchForOptimistic] Successfully fetched token for ${email}`);
    return {
      accessToken: entry.token,
      roomName: sess.userId,
      livekitUrl
    };
  } catch (error) {
    console.log(`[fetchForOptimistic] Failed to fetch token for ${email}:`, (error as Error).message);
    throw error;
  }
};

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
  const [canceledUsers, setCanceledUsers] = useState<Set<string>>(new Set());
  const servicesRef = useRef<Record<string, WebPubSubClientService>>({});
  const streamingMap = usePresenceStore(s => s.streamingMap);

  const fetchFor = useCallback(async (email: string, retryCount = 0) => {

    
    // ✅ VERIFICAR SI FUE CANCELADO MANUALMENTE
    if (canceledUsers.has(email)) {

      return;
    }
    
    // Only update if not already loading or if we don't have credentials
    setCredsMap(prev => {
      const current = prev[email];
      if (current?.loading) {

        return prev; // Return same reference to avoid re-renders
      }
      
      // ✅ PERMITIR FETCH SI NO TIENE TOKEN VÁLIDO (incluso si tiene credenciales viejas)
      if (current?.accessToken && current?.roomName && current?.livekitUrl) {

        return prev; // Return same reference to avoid re-renders
      }
      

      return {
        ...prev,
        [email]: { ...current, loading: true }
      };
    });
    
    // ✅ Verificar si ya conectó DESPUÉS de poner loading: true
    const currentCreds = credsMap[email];
    if (currentCreds?.accessToken) {

      setCredsMap(prev => ({
        ...prev,
        [email]: { loading: false }
      }));
      return;
    }
    
    try {

      const sessions = await fetchStreamingSessions();

      const sess = sessions.find(s => s.email.toLowerCase() === email);
      if (!sess) {

        throw new Error('No active session');
      }

      

      const { rooms, livekitUrl } = await getLiveKitToken(sess.userId);
      const entry = (rooms as RoomWithToken[]).find(r => r.room === sess.userId);
      if (!entry) {

        throw new Error('Missing LiveKit token');
      }
      
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
    } catch (error) {
      // ✅ REINTENTOS CON LÍMITE - máximo 20 intentos para evitar loops infinitos
      if ((error as Error).message.includes('No active session') && retryCount < 19) {
        const delay = Math.min((retryCount + 1) * 500, 2000); // 0.5s, 1s, 1.5s, 2s, 2s, 2s...

        // ✅ MANTENER LOADING: TRUE DURANTE REINTENTOS
        setTimeout(() => fetchFor(email, retryCount + 1), delay);
        return; // No cambiar loading a false durante reintentos
      }
      
      // ✅ LÍMITE ALCANZADO - Limpiar estado después de 20 intentos
      if (retryCount >= 19) {

        setCredsMap(prev => ({
          ...prev,
          [email]: { loading: false }
        }));
        return;
      }
      
      // ✅ SOLO PONER LOADING: FALSE SI ES OTRO ERROR (no "No active session")

      setCredsMap(prev => ({
        ...prev,
        [email]: { loading: false }
      }));
    }
  }, [credsMap, canceledUsers]);

  // ✅ PERIODIC FETCH - Intentar fetch periódicamente para PSOs online sin credenciales
  useEffect(() => {
    const interval = setInterval(() => {
      emails.forEach(email => {
        const creds = credsMap[email];
        const isOnline = streamingMap[email];
        
        // Si el PSO está online pero no tiene credenciales, intentar fetch
        if (isOnline && (!creds?.accessToken || !creds?.roomName)) {

          fetchFor(email);
        }
      });
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [emails, credsMap, streamingMap, fetchFor]);

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
        client.onMessage<any>(msg => {

          
          // ✅ MANEJAR AMBOS FORMATOS: comando y estado
          let targetEmail: string | null = null;
          let messageType: 'command' | 'status' | 'unknown' = 'unknown';
          
          // Formato 1: Mensaje de comando { command: 'START', employeeEmail: '...' }
          if (msg.command && msg.employeeEmail) {
            targetEmail = msg.employeeEmail.toLowerCase();
            messageType = 'command';

          }
          // Formato 2: Mensaje de estado { email: '...', status: 'started'|'stopped' }
          else if (msg.email && msg.status) {
            targetEmail = msg.email.toLowerCase();
            messageType = 'status';

          }
          // Formato desconocido
          else {

            return;
          }
          
          if (!targetEmail) {

            return;
          }
          
          if (!emails.includes(targetEmail)) {

            return;
          }
          
          // ✅ PROCESAR MENSAJES DE COMANDO
          if (messageType === 'command') {
            if (msg.command === 'START') {
              // ✅ QUITAR MARCA DE CANCELADO AL RECIBIR START
              setCanceledUsers(prev => {
                const newSet = new Set(prev);
                if (targetEmail) {
                  newSet.delete(targetEmail);
                }
                return newSet;
              });
              // ✅ IMMEDIATE FETCH - Intentar fetch inmediatamente
              if (targetEmail) {
                fetchFor(targetEmail);
              }
              
              // ✅ DELAYED RETRY - Si el fetch inmediato falla, reintentar después de un delay
              setTimeout(() => {
                if (targetEmail) {
                  fetchFor(targetEmail);
                }
              }, 2000);
            } else if (msg.command === 'STOP') {
              // ✅ MARCAR COMO CANCELADO PARA EVITAR REINTENTOS
              if (targetEmail) {
                const email = targetEmail; // Type assertion to help TypeScript
                setCanceledUsers(prev => new Set([...prev, email]));
                setCredsMap(prev => ({
                  ...prev,
                  [email]: { 
                    loading: false,
                    accessToken: undefined,
                    roomName: undefined,
                    livekitUrl: undefined
                  }
                }));
              }
            }
          }
          // ✅ PROCESAR MENSAJES DE ESTADO
          else if (messageType === 'status') {
            if (msg.status === 'started') {
              // ✅ QUITAR MARCA DE CANCELADO AL RECIBIR START
              setCanceledUsers(prev => {
                const newSet = new Set(prev);
                if (targetEmail) {
                  newSet.delete(targetEmail);
                }
                return newSet;
              });
              // ✅ IMMEDIATE FETCH - Intentar fetch inmediatamente
              if (targetEmail) {
                fetchFor(targetEmail);
              }
              
              // ✅ DELAYED RETRY - Si el fetch inmediato falla, reintentar después de un delay
              setTimeout(() => {
                if (targetEmail) {
                  fetchFor(targetEmail);
                }
              }, 2000);
            } else if (msg.status === 'stopped') {
              // ✅ MARCAR COMO CANCELADO PARA EVITAR REINTENTOS
              if (targetEmail) {
                const email = targetEmail; // Type assertion to help TypeScript
                setCanceledUsers(prev => new Set([...prev, email]));
                setCredsMap(prev => ({
                  ...prev,
                  [email]: { 
                    loading: false,
                    accessToken: undefined,
                    roomName: undefined,
                    livekitUrl: undefined
                  }
                }));
              }
            }
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
    

    return {
      accessToken: entry.token,
      roomName: sess.userId,
      livekitUrl
    };
  } catch (error) {

    throw error;
  }
};

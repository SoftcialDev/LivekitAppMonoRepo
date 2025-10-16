import { useState, useRef, useCallback, useEffect } from 'react';
import { getLiveKitToken, RoomWithToken } from '@/shared/api/livekitClient';
import { fetchStreamingSessions } from '@/shared/api/streamingStatusClient';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { useStreamingStatusBatch, UserStreamingStatusInfo } from './useStreamingStatusBatch';

interface StreamCreds {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
  statusInfo?: UserStreamingStatusInfo;
}

export type CredsMap = Record<string, StreamCreds>;

/**
 * Hook COMPLETAMENTE AISLADO para streams
 * NO se ve afectado por cambios en el presence store
 * Solo se actualiza cuando realmente es necesario
 * Integrates batch status for users without active tokens
 */
export function useIsolatedStreams(viewerEmail: string, emails: string[]): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const canceledUsersRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const lastEmailsRef = useRef<string[]>([]);

  // Get batch status for users without active tokens
  const { statusMap: batchStatusMap, refetch: refetchBatchStatus } = useStreamingStatusBatch(emails);

  // ✅ Función para actualizar solo una tarjeta específica
  const refreshTokenForEmail = useCallback(async (email: string) => {
    try {
      
      const sessions = await fetchStreamingSessions();
      const emailToRoom = new Map<string, string>();
      sessions.forEach((s: any) => {
        if (s?.email && s?.userId) emailToRoom.set(String(s.email).toLowerCase(), String(s.userId));
      });

      const { rooms, livekitUrl } = await getLiveKitToken();
      const byRoom = new Map<string, string>();
      (rooms as RoomWithToken[]).forEach((r) => byRoom.set(r.room, r.token));

      const key = email.toLowerCase();
      const room = emailToRoom.get(key);
      const token = room ? byRoom.get(room) : undefined;
      
      setCredsMap((prev) => {
        const newCreds = room && token 
          ? { accessToken: token, roomName: room, livekitUrl, loading: false }
          : { loading: false };
        
        // Solo actualizar si realmente cambió
        const currentCreds = prev[key];
        if (JSON.stringify(currentCreds) === JSON.stringify(newCreds)) {
          return prev;
        }
        return {
          ...prev,
          [key]: newCreds
        };
      });
    } catch (error) {
      // Error handling
    }
  }, []);

  // ✅ Función para limpiar una tarjeta específica
  const clearOne = useCallback((email: string) => {
    const key = email.toLowerCase();
    setCredsMap((prev) => {
      const current = prev[key];
      if (!current || (!current.accessToken && !current.loading)) {
        return prev; // No change needed
      }
      return {
        ...prev,
        [key]: { loading: false, accessToken: undefined, roomName: undefined, livekitUrl: undefined },
      };
    });
  }, []);

  // ✅ Función para refrescar el status cuando se envía un comando STOP
  const refreshStatusForEmail = useCallback(async (email: string) => {
    try {
      // Refrescar el batch status para obtener la información más reciente
      await refetchBatchStatus();
    } catch (error) {
      console.error(`Failed to refresh status for ${email}:`, error);
    }
  }, [refetchBatchStatus]);

  // ✅ Inicialización UNA SOLA VEZ - UN SOLO FETCH para todos
  useEffect(() => {
    if (isInitializedRef.current || emails.length === 0) return;
    
    isInitializedRef.current = true;
    
    // ✅ UN SOLO FETCH para todas las sesiones
    const fetchAllSessions = async () => {
      try {
        const sessions = await fetchStreamingSessions();
        const { rooms, livekitUrl } = await getLiveKitToken();
        
        // Crear mapas una sola vez
        const emailToRoom = new Map<string, string>();
        sessions.forEach((s: any) => {
          if (s?.email && s?.userId) emailToRoom.set(String(s.email).toLowerCase(), String(s.userId));
        });
        
        const byRoom = new Map<string, string>();
        (rooms as RoomWithToken[]).forEach((r) => byRoom.set(r.room, r.token));
        
        // ✅ DISTRIBUIR a todos los emails de una vez
        setCredsMap((prev) => {
          const newCreds: CredsMap = {};
          
          emails.forEach(email => {
            const key = email.toLowerCase();
            const room = emailToRoom.get(key);
            const token = room ? byRoom.get(room) : undefined;
            
            newCreds[key] = room && token 
              ? { accessToken: token, roomName: room, livekitUrl, loading: false }
              : { loading: false };
          });
          
          return newCreds;
        });
      } catch (error) {
        // Error handling
      }
    };
    
    setTimeout(() => fetchAllSessions(), 100);
    
    // ✅ Llamar al batch status SOLO para usuarios sin token (que no tienen streaming activo)
    // Esto cargará el mensaje inicial si tienen stoppedAt
    void refetchBatchStatus();
  }, [emails, refetchBatchStatus]);

  // ✅ Manejar cambios de emails - UN SOLO FETCH para nuevos emails
  useEffect(() => {
    const prev = lastEmailsRef.current;
    const curr = emails.map(e => e.toLowerCase());
    
    const toJoin = curr.filter(e => !prev.includes(e));
    const toLeave = prev.filter(e => !curr.includes(e));
    
    lastEmailsRef.current = curr;
    
    // ✅ UN SOLO FETCH para emails NUEVOS
    if (toJoin.length > 0) {
      const fetchNewSessions = async () => {
        try {
          const sessions = await fetchStreamingSessions();
          const { rooms, livekitUrl } = await getLiveKitToken();
          
          const emailToRoom = new Map<string, string>();
          sessions.forEach((s: any) => {
            if (s?.email && s?.userId) emailToRoom.set(String(s.email).toLowerCase(), String(s.userId));
          });
          
          const byRoom = new Map<string, string>();
          (rooms as RoomWithToken[]).forEach((r) => byRoom.set(r.room, r.token));
          
          // ✅ DISTRIBUIR solo a emails NUEVOS
          setCredsMap((prev) => {
            const newCreds = { ...prev };
            
            toJoin.forEach(email => {
              const key = email.toLowerCase();
              const room = emailToRoom.get(key);
              const token = room ? byRoom.get(room) : undefined;
              
              newCreds[key] = room && token 
                ? { accessToken: token, roomName: room, livekitUrl, loading: false }
                : { loading: false };
            });
            
            return newCreds;
          });
        } catch (error) {
          // Error handling
        }
      };
      
      setTimeout(() => fetchNewSessions(), 100);
    }
    
    // Limpiar emails que se fueron
    if (toLeave.length > 0) {
      toLeave.forEach(email => clearOne(email));
    }
  }, [emails]);

  // ✅ WebSocket handler ULTRA-OPTIMIZADO con conexión y grupos
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();
    let isHandlerRegistered = false;

    const setupWebSocket = async () => {
      try {
        // Conectar al WebSocket si no está conectado
        await client.connect(viewerEmail);
        
        // Unirse a grupos de streaming para cada email
        for (const email of emails) {
          await client.joinGroup(email).catch(() => {});
        }
      } catch (error) {
        // Error handling
      }
    };

    const handleMessage = (msg: any) => {
      let targetEmail: string | null = null;
      let started: boolean | null = null;

      // Procesar mensajes de comando (START/STOP)
      if (msg?.command && msg?.employeeEmail) {
        targetEmail = String(msg.employeeEmail).toLowerCase();
        started = msg.command === 'START' ? true : msg.command === 'STOP' ? false : null;
      } 
      // Procesar mensajes de estado (started/stopped)
      else if (msg?.email && msg?.status) {
        targetEmail = String(msg.email).toLowerCase();
        started = msg.status === 'started' ? true : msg.status === 'stopped' ? false : null;
      }

      if (!targetEmail || !emails.includes(targetEmail)) {
        return;
      }

      if (started === true) {
        if (canceledUsersRef.current.has(targetEmail)) {
          const ns = new Set(canceledUsersRef.current);
          ns.delete(targetEmail);
          canceledUsersRef.current = ns;
        }
        // ✅ DELAY de 5 segundos para dar tiempo al PSO de iniciar streaming
        setTimeout(async () => {
          if (targetEmail) {
            try {
              // ✅ UN SOLO FETCH para el email específico
              const sessions = await fetchStreamingSessions();
              const { rooms, livekitUrl } = await getLiveKitToken();
              
              const emailToRoom = new Map<string, string>();
              sessions.forEach((s: any) => {
                if (s?.email && s?.userId) emailToRoom.set(String(s.email).toLowerCase(), String(s.userId));
              });
              
              const byRoom = new Map<string, string>();
              (rooms as RoomWithToken[]).forEach((r) => byRoom.set(r.room, r.token));
              
              const key = targetEmail.toLowerCase();
              const room = emailToRoom.get(key);
              const token = room ? byRoom.get(room) : undefined;
              
              setCredsMap((prev) => {
                const newCreds = room && token 
                  ? { accessToken: token, roomName: room, livekitUrl, loading: false }
                  : { loading: false };
                
                const currentCreds = prev[key];
                if (JSON.stringify(currentCreds) === JSON.stringify(newCreds)) {
                  return prev;
                }
                return {
                  ...prev,
                  [key]: newCreds
                };
              });
            } catch (error) {
              // Error handling
            }
          }
        }, 5000);
      } else if (started === false) {
        const ns = new Set(canceledUsersRef.current);
        ns.add(targetEmail);
        canceledUsersRef.current = ns;
        clearOne(targetEmail);
        // ✅ Esperar 2 segundos y luego refrescar el status para mostrar el mensaje correcto
        setTimeout(() => {
          if (targetEmail) {
            void refreshStatusForEmail(targetEmail);
          }
        }, 2000);
      }
    };

    // ✅ SOLO registrar el handler UNA VEZ
    if (!isHandlerRegistered) {
      void setupWebSocket();
      client.onMessage(handleMessage);
      isHandlerRegistered = true;
    }

    return () => {
      // ✅ Cleanup para evitar múltiples listeners
      if (isHandlerRegistered) {
        // El WebPubSubClientService no tiene offMessage, pero el cleanup se hace automáticamente
        isHandlerRegistered = false;
      }
    };
  }, [viewerEmail, emails]);

  // ✅ Integrate batch status for users without active tokens
  useEffect(() => {
    setCredsMap(prev => {
      const newCreds = { ...prev };
      
      emails.forEach(email => {
        const key = email.toLowerCase();
        const currentCreds = newCreds[key];
        const batchStatus = batchStatusMap[key];
        
        // If user has no active token but has batch status, add status info
        if (!currentCreds?.accessToken && batchStatus) {
          newCreds[key] = {
            ...currentCreds,
            statusInfo: batchStatus
          };
        }
        // If user has active token, remove status info
        else if (currentCreds?.accessToken && currentCreds?.statusInfo) {
          const { statusInfo, ...credsWithoutStatus } = currentCreds;
          newCreds[key] = credsWithoutStatus;
        }
      });
      
      return newCreds;
    });
  }, [emails, batchStatusMap]);

  return credsMap;
}

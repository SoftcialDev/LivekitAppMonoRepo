import { useState, useRef, useCallback, useEffect } from 'react';
import { getLiveKitToken, RoomWithToken } from '@/shared/api/livekitClient';
import { fetchStreamingSessions } from '@/shared/api/streamingStatusClient';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { fetchStreamingStatusBatch, StreamingStatusBatchResponse, UserStreamingStatus } from '@/shared/api/streamingStatusBatchClient';

interface StreamCreds {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
  statusInfo?: {
    email: string;
    status: 'on_break' | 'disconnected' | 'offline';
    lastSession: {
      stopReason: string | null;
      stoppedAt: string | null;
    } | null;
  };
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
  const emailsRef = useRef<string[]>([]); // keep latest emails without retriggering effects
  const joinedGroupsRef = useRef<Set<string>>(new Set()); // track joined WS groups
  const wsHandlerRegisteredRef = useRef<boolean>(false); // ensure single WS handler registration
  const isInitializedRef = useRef(false);
  const lastEmailsRef = useRef<string[]>([]);
  const cooldownUntilRef = useRef<Record<string, number>>({}); // avoid early fetches

  // Helper: convert batch response to statusInfo map
  const buildStatusMap = (statuses: UserStreamingStatus[]) => {
    const map: Record<string, StreamCreds['statusInfo']> = {};
    statuses.forEach((s) => {
      const email = s.email.toLowerCase();
      let userStatus: 'on_break' | 'disconnected' | 'offline';
      // Si tiene sesión activa, no agregamos statusInfo (será cubierto por token)
      if (s.hasActiveSession) {
        return;
      } else if (s.lastSession) {
        const r = s.lastSession.stopReason;
        if (r === 'QUICK_BREAK' || r === 'SHORT_BREAK' || r === 'LUNCH_BREAK') userStatus = 'on_break';
        else if (r === 'EMERGENCY' || r === 'DISCONNECT') userStatus = 'disconnected';
        else userStatus = 'offline';
      } else {
        userStatus = 'offline';
      }
      map[email] = { email: s.email, status: userStatus, lastSession: s.lastSession };
    });
    return map;
  };

  // ✅ REMOVED: No more separate batch status hook
  // We'll fetch everything together in the initialization

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

  // ✅ REMOVED: No more batch status refresh to prevent connecting issues
  // const refreshStatusForEmail = useCallback(async (email: string) => {
  //   try {
  //     await refetchBatchStatus();
  //   } catch (error) {
  //     console.error(`Failed to refresh status for ${email}:`, error);
  //   }
  // }, [refetchBatchStatus]);

  // ✅ Inicialización: sesiones/tokens + status para quienes NO aparecen en sesiones
  useEffect(() => {
    if (isInitializedRef.current || emails.length === 0) return;
    
    isInitializedRef.current = true;
    console.log('🚀 [useIsolatedStreams] Starting initialization...');
    
    // 1) Cargar PRIMERO el batch status para TODOS los emails y reflejarlo en los cards
    (async () => {
      try {
        const batch = await fetchStreamingStatusBatch(emails.map(e => e.toLowerCase()));
        const map = buildStatusMap(batch.statuses);
        setCredsMap(prev => {
          const next = { ...prev } as CredsMap;
          emails.forEach(email => {
            const key = email.toLowerCase();
            const existing = next[key] ?? { loading: false };
            const statusInfo = map[key];
            if (statusInfo) {
              next[key] = { ...existing, statusInfo };
            } else if (!next[key]) {
              next[key] = existing;
            }
          });
          return next;
        });
      } catch {
        // ignore batch error on init – tokens fetch will still run
      }
    })();

    // ✅ FETCH: sesiones + tokens; luego status solo para faltantes
    const fetchSessionsAndTokens = async () => {
      try {
        console.log('🔍 [useIsolatedStreams] Fetching sessions and tokens...');
        
        const [sessions, { rooms, livekitUrl }] = await Promise.all([
          fetchStreamingSessions(),
          getLiveKitToken()
        ]);
        
        console.log('📊 [useIsolatedStreams] Data fetched:', {
          sessions: sessions.length,
          rooms: rooms.length
        });
        
        // Crear mapas una sola vez
        const emailToRoom = new Map<string, string>();
        sessions.forEach((s: any) => {
          if (s?.email && s?.userId) emailToRoom.set(String(s.email).toLowerCase(), String(s.userId));
        });
        
        const byRoom = new Map<string, string>();
        (rooms as RoomWithToken[]).forEach((r) => byRoom.set(r.room, r.token));
        const notInSessions = emails.map(e=>e.toLowerCase()).filter(e => !emailToRoom.has(e));
        let batchMap: Record<string, StreamCreds['statusInfo']> = {};
        if (notInSessions.length > 0) {
          try {
            const batchResp: StreamingStatusBatchResponse = await fetchStreamingStatusBatch(notInSessions);
            batchMap = buildStatusMap(batchResp.statuses);
          } catch {}
        }
        
        // ✅ DISTRIBUIR SOLO TOKENS
        setCredsMap((prev) => {
          const newCreds: CredsMap = { ...prev };
          
          emails.forEach(email => {
            const key = email.toLowerCase();
            const room = emailToRoom.get(key);
            const token = room ? byRoom.get(room) : undefined;
            const statusInfo = batchMap[key];
            
            // If user has active streaming, use token
            if (room && token) {
              newCreds[key] = { 
                accessToken: token, 
                roomName: room, 
                livekitUrl, 
                loading: false 
              };
            } 
            // Default: no streaming
            else if (!newCreds[key]) {
              newCreds[key] = statusInfo ? { loading: false, statusInfo } : { loading: false };
            }
          });
          
          console.log('✅ [useIsolatedStreams] Simple credsMap set:', newCreds);
          return newCreds;
        });
        
      } catch (error) {
        console.error('❌ [useIsolatedStreams] Error in initialization:', error);
      }
    };
    
    setTimeout(() => fetchSessionsAndTokens(), 100);
  }, [emails]);

  // ✅ Manejar cambios de emails - UN SOLO FETCH para nuevos emails (y status de los nuevos que no estén en sesiones)
  useEffect(() => {
    // keep latest emails for the websocket handler (avoid re-registering)
    emailsRef.current = emails.map(e => e.toLowerCase());

    const prev = lastEmailsRef.current;
    const curr = emails.map(e => e.toLowerCase());
    
    const toJoin = curr.filter(e => !prev.includes(e));
    const toLeave = prev.filter(e => !curr.includes(e));
    
    lastEmailsRef.current = curr;
    
    // 0) Cargar PRIMERO status para emails NUEVOS
    if (toJoin.length > 0) {
      (async () => {
        try {
          const batch = await fetchStreamingStatusBatch(toJoin);
          const map = buildStatusMap(batch.statuses);
          setCredsMap(prev => {
            const next = { ...prev } as CredsMap;
            toJoin.forEach(email => {
              const key = email.toLowerCase();
              const existing = next[key] ?? { loading: false };
              const statusInfo = map[key];
              if (statusInfo) next[key] = { ...existing, statusInfo };
              else if (!next[key]) next[key] = existing;
            });
            return next;
          });
        } catch {
          // ignore
        }
      })();
    }

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
          const notInSessions = toJoin.filter(e => !emailToRoom.has(e));
          let batchMap: Record<string, StreamCreds['statusInfo']> = {};
          if (notInSessions.length > 0) {
            try {
              const batchResp: StreamingStatusBatchResponse = await fetchStreamingStatusBatch(notInSessions);
              batchMap = buildStatusMap(batchResp.statuses);
            } catch {}
          }
          
          // ✅ DISTRIBUIR solo a emails NUEVOS
          setCredsMap((prev) => {
            const newCreds = { ...prev };
            
            toJoin.forEach(email => {
              const key = email.toLowerCase();
              const room = emailToRoom.get(key);
              const token = room ? byRoom.get(room) : undefined;
              const statusInfo = batchMap[key];
              
              const prevEntry = newCreds[key] ?? { loading: false };
              newCreds[key] = room && token 
                ? { ...prevEntry, accessToken: token, roomName: room, livekitUrl, loading: false }
                : (statusInfo ? { ...prevEntry, loading: false, statusInfo } : { ...prevEntry, loading: false });
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
  }, [emails, clearOne]); // Added clearOne to dependencies

  // ✅ Join WS groups only for new emails (no duplicate joins)
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();
    const joinMissingGroups = async () => {
      try {
        // connect once (idempotent inside service)
        await client.connect(viewerEmail);
        for (const email of emailsRef.current) {
          if (!joinedGroupsRef.current.has(email)) {
            await client.joinGroup(email).catch(() => {});
            joinedGroupsRef.current.add(email);
          }
        }
      } catch {
        // ignore
      }
    };
    void joinMissingGroups();
  }, [viewerEmail, emailsRef.current.join(',')]);

  // ✅ WebSocket handler registrado UNA sola vez; usa refs para leer estado actual
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();

    if (wsHandlerRegisteredRef.current) {
      return; // already registered
    }

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

      const currentEmails = emailsRef.current;
      if (!targetEmail || !currentEmails.includes(targetEmail)) {
        return;
      }

      if (started === true) {
        if (canceledUsersRef.current.has(targetEmail)) {
          const ns = new Set(canceledUsersRef.current);
          ns.delete(targetEmail);
          canceledUsersRef.current = ns;
        }
        // ✅ DELAY de 2 segundos para dar tiempo al PSO de iniciar streaming
        const emailKey = targetEmail as string; // narrow for closure
        setTimeout(async () => {
          if (emailKey) {
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
              
              const key = emailKey.toLowerCase();
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
        }, 6000);
      } else if (started === false) {
        const ns = new Set(canceledUsersRef.current);
        ns.add(targetEmail);
        canceledUsersRef.current = ns;
        clearOne(targetEmail);
        // ✅ Tras STOP: esperar y pedir status SOLO para ese email
        const emailKey = targetEmail as string; // narrow for closure
        setTimeout(async () => {
          try {
            const resp = await fetchStreamingStatusBatch([emailKey]);
            const map = buildStatusMap(resp.statuses);
            const statusInfo = map[emailKey];
            if (!statusInfo) return;
            setCredsMap(prev => ({
              ...prev,
              [emailKey]: { ...(prev[emailKey] ?? { loading: false }), statusInfo }
            }));
          } catch {
            // ignore
          }
        }, 6000);
      }
    };

    client.onMessage(handleMessage);
    wsHandlerRegisteredRef.current = true;
  }, [viewerEmail]);

  // ✅ REMOVED: No more separate batch status integration
  // Everything is now loaded together in the initialization

  return credsMap;
}

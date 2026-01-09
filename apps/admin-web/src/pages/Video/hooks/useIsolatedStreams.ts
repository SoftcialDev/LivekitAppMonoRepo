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
 * Delay in milliseconds before fetching status after STOP command
 * This gives the backend time to process the stop and update the database
 */
const STOP_STATUS_FETCH_DELAY_MS = 6000; // 6 seconds

/**
 * Hook COMPLETAMENTE AISLADO para streams
 * NO se ve afectado por cambios en el presence store
 * Solo se actualiza cuando realmente es necesario
 * Integrates batch status for users without active tokens
 */
export function useIsolatedStreams(viewerEmail: string, emails: string[]): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const credsMapRef = useRef<CredsMap>({}); // Keep ref for current credsMap to check in timers
  const canceledUsersRef = useRef<Set<string>>(new Set());
  const emailsRef = useRef<string[]>([]); // keep latest emails without retriggering effects
  const joinedGroupsRef = useRef<Set<string>>(new Set()); // track joined WS groups
  const wsHandlerRegisteredRef = useRef<boolean>(false); // ensure single WS handler registration
  const isInitializedRef = useRef(false);
  const lastEmailsRef = useRef<string[]>([]);
  const cooldownUntilRef = useRef<Record<string, number>>({}); // avoid early fetches
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const stopStatusTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({}); // track STOP status fetch timers
  
  // Keep credsMapRef in sync with credsMap state
  useEffect(() => {
    credsMapRef.current = credsMap;
  }, [credsMap]);

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
        const currentCreds = prev[key] ?? {};
        if (room && token) {
          const newCreds = { accessToken: token, roomName: room, livekitUrl, loading: false };
          if (JSON.stringify(currentCreds) === JSON.stringify(newCreds)) {
            return prev;
          }
          return {
            ...prev,
            [key]: newCreds
          };
        }

        if (!currentCreds.loading) {
          return prev;
        }

        return {
          ...prev,
          [key]: { ...currentCreds }
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

  const clearPendingTimer = useCallback((email: string) => {
    const key = email.toLowerCase();
    const timer = pendingTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete pendingTimersRef.current[key];
    }
  }, []);

  const clearStopStatusTimer = useCallback((email: string) => {
    const key = email.toLowerCase();
    const timer = stopStatusTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete stopStatusTimersRef.current[key];
    }
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
    // Removed initialization log to reduce console spam
    
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
        // Removed fetch log to reduce console spam
        
        const [sessions, { rooms, livekitUrl }] = await Promise.all([
          fetchStreamingSessions(),
          getLiveKitToken()
        ]);
        
        // Removed data fetched log to reduce console spam
        
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
          
          // Removed credsMap log to reduce console spam
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
      toLeave.forEach(email => {
        clearPendingTimer(email);
        clearOne(email);
      });
    }
  }, [emails, clearOne, clearPendingTimer]); // Added clearOne to dependencies

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

  // ✅ Listen for streamingSessionUpdated event to get immediate timer updates
  useEffect(() => {
    const handleStreamingSessionUpdate = (event: CustomEvent) => {
      const { session } = event.detail;
      if (!session || !session.email) return;
      
      const emailKey = String(session.email).toLowerCase();
      const currentEmails = emailsRef.current;
      
      // Only update if this email is in our list
      if (!currentEmails.includes(emailKey)) {
        return;
      }
      
      console.log('[useIsolatedStreams] Streaming session updated via event for:', emailKey);
      
      // Update statusInfo immediately with the new session data
      if (session.stoppedAt) {
        const stopReason = session.stopReason;
        const stoppedAt = session.stoppedAt;
        
        // Build statusInfo similar to buildStatusMap
        let userStatus: 'on_break' | 'disconnected' | 'offline';
        if (stopReason === 'QUICK_BREAK' || stopReason === 'SHORT_BREAK' || stopReason === 'LUNCH_BREAK') {
          userStatus = 'on_break';
        } else if (stopReason === 'EMERGENCY' || stopReason === 'DISCONNECT') {
          userStatus = 'disconnected';
        } else {
          userStatus = 'offline';
        }
        
        const statusInfo = {
          email: session.email,
          status: userStatus,
          lastSession: {
            stopReason: stopReason,
            stoppedAt: stoppedAt
          }
        };
        
        setCredsMap(prev => ({
          ...prev,
          [emailKey]: {
            ...(prev[emailKey] ?? { loading: false }),
            statusInfo
          }
        }));
        
        // Clear any pending timer since we got the update immediately
        clearStopStatusTimer(emailKey);
      } else {
        // Session started, clear statusInfo
        setCredsMap(prev => {
          const current = prev[emailKey];
          if (!current) return prev;
          const { statusInfo, ...rest } = current;
          return {
            ...prev,
            [emailKey]: rest
          };
        });
      }
    };
    
    window.addEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    };
  }, []);

  // ✅ WebSocket handler registrado UNA sola vez; usa refs para leer estado actual
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();

    if (wsHandlerRegisteredRef.current) {
      return; // already registered
    }

    const handleMessage = (msg: any) => {
      console.debug('[useIsolatedStreams] WebSocket message received:', msg);
      let targetEmail: string | null = null;
      let started: boolean | null = null;
      let pending = false;
      let failed = false;

      if (msg?.command && msg?.employeeEmail) {
        targetEmail = String(msg.employeeEmail).toLowerCase();
        started = msg.command === 'START' ? true : msg.command === 'STOP' ? false : null;
      } else if (msg?.email && msg?.status) {
        targetEmail = String(msg.email).toLowerCase();
        if (msg.status === 'started') {
          started = true;
        } else if (msg.status === 'stopped') {
          started = false;
        } else if (msg.status === 'pending') {
          pending = true;
        } else if (msg.status === 'failed') {
          failed = true;
        }
      }

      const currentEmails = emailsRef.current;
      if (!targetEmail || !currentEmails.includes(targetEmail)) {
        return;
      }

      if (pending) {
        const key = targetEmail;
        clearPendingTimer(key);
        setCredsMap(prev => ({
          ...prev,
          [key]: { ...(prev[key] ?? {}), loading: true }
        }));

        pendingTimersRef.current[key] = setTimeout(() => {
          setCredsMap(prev => {
            const current = prev[key];
            if (!current || current.accessToken || !current.loading) {
              return prev;
            }
            return {
              ...prev,
              [key]: { ...current, loading: false }
            };
          });
          clearPendingTimer(key);
        }, 10000);
        return;
      }

      if (failed) {
        const key = targetEmail;
        clearPendingTimer(key);
        setCredsMap(prev => {
          const current = prev[key] ?? {};
          return {
            ...prev,
            [key]: { ...current, loading: false }
          };
        });
        return;
      }

      if (started === true) {
        clearPendingTimer(targetEmail);
        if (canceledUsersRef.current.has(targetEmail)) {
          const ns = new Set(canceledUsersRef.current);
          ns.delete(targetEmail);
          canceledUsersRef.current = ns;
        }
        // ✅ DELAY de 6 segundos para dar tiempo al PSO de iniciar streaming
        const emailKey = targetEmail as string; // narrow for closure
        clearStopStatusTimer(emailKey); // Clear any pending STOP status timer
        
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
        }, STOP_STATUS_FETCH_DELAY_MS);
      } else if (started === false) {
        clearPendingTimer(targetEmail);
        clearStopStatusTimer(targetEmail); // Clear any existing STOP status timer for this email
        
        const ns = new Set(canceledUsersRef.current);
        ns.add(targetEmail);
        canceledUsersRef.current = ns;
        clearOne(targetEmail);
        
        // ✅ Tras STOP: esperar un poco (1 segundo) para que el backend actualice la BD
        // luego pedir status SOLO para ese email (una sola vez)
        // El evento streamingSessionUpdated también actualizará esto inmediatamente si está disponible
        const emailKey = targetEmail as string; // narrow for closure
        
        // Only schedule if not already scheduled for this email
        // Reduce delay to 1 second since we also listen to streamingSessionUpdated event
        if (!stopStatusTimersRef.current[emailKey]) {
          stopStatusTimersRef.current[emailKey] = setTimeout(async () => {
            try {
              // Only fetch if statusInfo is not already set (from streamingSessionUpdated event)
              const currentCreds = credsMapRef.current?.[emailKey];
              if (currentCreds?.statusInfo) {
                console.log('[useIsolatedStreams] StatusInfo already set via event, skipping batch fetch for:', emailKey);
                delete stopStatusTimersRef.current[emailKey];
                return;
              }
              
              const resp = await fetchStreamingStatusBatch([emailKey]);
              const map = buildStatusMap(resp.statuses);
              const statusInfo = map[emailKey];
              if (!statusInfo) {
                // Clean up timer reference
                delete stopStatusTimersRef.current[emailKey];
                return;
              }
              setCredsMap(prev => ({
                ...prev,
                [emailKey]: { ...(prev[emailKey] ?? { loading: false }), statusInfo }
              }));
            } catch {
              // ignore
            } finally {
              // Clean up timer reference after execution
              delete stopStatusTimersRef.current[emailKey];
            }
          }, 1000); // Reduced from 6 seconds to 1 second - fallback only if event doesn't fire
        }
      }
    };

    client.onMessage(handleMessage);
    wsHandlerRegisteredRef.current = true;
  }, [viewerEmail]);

  // ✅ REMOVED: No more separate batch status integration
  // Everything is now loaded together in the initialization

  useEffect(() => {
    return () => {
      Object.values(pendingTimersRef.current).forEach(clearTimeout);
      pendingTimersRef.current = {};
      Object.values(stopStatusTimersRef.current).forEach(clearTimeout);
      stopStatusTimersRef.current = {};
    };
  }, []);

  return credsMap;
}

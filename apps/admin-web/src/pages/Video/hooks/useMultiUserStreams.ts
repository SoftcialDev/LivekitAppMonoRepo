// shared/presence/hooks/useMultiUserStreams.ts
import { getLiveKitToken, RoomWithToken } from '@/shared/api/livekitClient';
import { fetchStreamingSessions } from '@/shared/api/streamingStatusClient';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { useState, useRef, useCallback, useEffect } from 'react';

interface StreamCreds {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
}
export type CredsMap = Record<string, StreamCreds>;

/**
 * Streams hook OPTIMIZADO:
 * - Solo actualiza tarjetas específicas que realmente cambiaron
 * - Evita re-renders globales cuando se inicia streaming de un usuario
 * - Cada tarjeta maneja su estado de manera aislada
 * - Refresh triggers solo para la tarjeta específica afectada
 */
export function useMultiUserStreams(viewerEmail: string, emails: string[]): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const canceledUsersRef = useRef<Set<string>>(new Set());

  // Guards
  const inflightRef = useRef<Promise<void> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEmailsRef = useRef<Set<string>>(new Set());

  // Clear creds for one email (sync)
  const clearOne = useCallback((email: string) => {
    const key = email.toLowerCase();
    setCredsMap((prev) => {
      // ✅ OPTIMIZACIÓN: Solo actualizar si realmente cambió
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

  // ✅ OPTIMIZADO: Actualizar solo una tarjeta específica SIN afectar las demás
  const refreshTokenForEmail = useCallback(async (email: string) => {
    try {
      console.log(`🔄 [useMultiUserStreams] Refreshing token ONLY for ${email}`);
      
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
        
        // ✅ CRÍTICO: Solo actualizar si realmente cambió para esta tarjeta específica
        const currentCreds = prev[key];
        if (JSON.stringify(currentCreds) === JSON.stringify(newCreds)) {
          console.log(`✅ [useMultiUserStreams] No change needed for ${email}, skipping update`);
          return prev; // No change needed
        }
        
        console.log(`🔄 [useMultiUserStreams] Updating ONLY ${email} with new credentials`);
        return {
          ...prev,
          [key]: newCreds
        };
      });
    } catch (error) {
      console.error(`❌ [useMultiUserStreams] Failed to refresh token for ${email}:`, error);
    }
  }, []);

  // Refresh all tokens once and fold into map for the current `emails` list
  const refreshAllTokens = useCallback(async () => {
    if (inflightRef.current) {
      await inflightRef.current;
      return;
    }
    const runner = (async () => {
      try {
        // Build email -> room lookup from sessions
        const sessions = await fetchStreamingSessions();
        const emailToRoom = new Map<string, string>();
        sessions.forEach((s: any) => {
          if (s?.email && s?.userId) emailToRoom.set(String(s.email).toLowerCase(), String(s.userId));
        });

        // ONE call: all rooms + tokens
        const { rooms, livekitUrl } = await getLiveKitToken();
        const byRoom = new Map<string, string>(); // roomId -> token
        (rooms as RoomWithToken[]).forEach((r) => byRoom.set(r.room, r.token));

        // ✅ ULTRA-OPTIMIZACIÓN: Solo actualizar tarjetas que realmente cambiaron
        setCredsMap((prev) => {
          const next: CredsMap = { ...prev };
          let hasChanges = false;

          // Keep only the current emails
          const currentEmailSet = new Set(emails.map((e) => e.toLowerCase()));
          for (const k of Object.keys(next)) {
            if (!currentEmailSet.has(k)) {
              delete next[k];
              hasChanges = true;
              console.log(`🗑️ [useMultiUserStreams] Removed stale email: ${k}`);
            }
          }

          // Update/insert creds for each tracked email
          for (const email of currentEmailSet) {
            if (canceledUsersRef.current.has(email)) {
              const newCreds = { loading: false };
              if (JSON.stringify(next[email]) !== JSON.stringify(newCreds)) {
                next[email] = newCreds;
                hasChanges = true;
                console.log(`🚫 [useMultiUserStreams] Canceled user: ${email}`);
              }
              continue;
            }
            
            const room = emailToRoom.get(email);
            const token = room ? byRoom.get(room) : undefined;
            const newCreds = room && token 
              ? { accessToken: token, roomName: room, livekitUrl, loading: false }
              : { loading: false };
            
            // ✅ CRÍTICO: Solo actualizar si realmente cambió
            if (JSON.stringify(next[email]) !== JSON.stringify(newCreds)) {
              next[email] = newCreds;
              hasChanges = true;
              console.log(`🔄 [useMultiUserStreams] Updated credentials for: ${email}`);
            } else {
              console.log(`✅ [useMultiUserStreams] No change needed for: ${email}`);
            }
          }

          // ✅ Solo retornar nuevo objeto si hubo cambios reales
          if (hasChanges) {
            console.log(`🔄 [useMultiUserStreams] State updated with changes`);
            return next;
          } else {
            console.log(`✅ [useMultiUserStreams] No changes needed, keeping previous state`);
            return prev;
          }
        });
      } finally {
        inflightRef.current = null;
      }
    })();

    inflightRef.current = runner;
    await runner;
  }, [emails]);

  // Debounced refresh scheduler
  const scheduleRefresh = useCallback((delayMs = 300) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void refreshAllTokens();
    }, delayMs);
  }, [refreshAllTokens]);

  // Connect socket ONCE per viewer (singleton) and attach streaming message handlers
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();

    (async () => {
      try {
        await client.connect(viewerEmail);
      } catch (e) {
        console.error('[useMultiUserStreams] connect failed', e);
      }

      client.onMessage<any>((msg) => {
        // Accept {command:'START'|'STOP', employeeEmail} or {email,status:'started'|'stopped'}
        let targetEmail: string | null = null;
        let started: boolean | null = null;

        if (msg?.command && msg?.employeeEmail) {
          targetEmail = String(msg.employeeEmail).toLowerCase();
          started = msg.command === 'START' ? true : msg.command === 'STOP' ? false : null;
        } else if (msg?.email && msg?.status) {
          targetEmail = String(msg.email).toLowerCase();
          started = msg.status === 'started' ? true : msg.status === 'stopped' ? false : null;
        }

        if (!targetEmail || !emails.includes(targetEmail)) return;

        if (started === true) {
          // ✅ ULTRA-OPTIMIZACIÓN: Solo actualizar la tarjeta específica
          console.log(`🔄 [useMultiUserStreams] WebSocket START received for: ${targetEmail}`);
          
          if (canceledUsersRef.current.has(targetEmail)) {
            const ns = new Set(canceledUsersRef.current);
            ns.delete(targetEmail);
            canceledUsersRef.current = ns;
            console.log(`✅ [useMultiUserStreams] Un-canceled user: ${targetEmail}`);
          }
          
          // ✅ CRÍTICO: Solo refrescar token para esta tarjeta específica
          // NO hacer refreshAllTokens() que afectaría todas las tarjetas
          void refreshTokenForEmail(targetEmail);
        } else if (started === false) {
          // ✅ ULTRA-OPTIMIZACIÓN: Solo limpiar la tarjeta específica
          console.log(`🚫 [useMultiUserStreams] WebSocket STOP received for: ${targetEmail}`);
          
          const ns = new Set(canceledUsersRef.current);
          ns.add(targetEmail);
          canceledUsersRef.current = ns;
          clearOne(targetEmail);
        }
      });
    })();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [viewerEmail, scheduleRefresh, clearOne, emails, refreshTokenForEmail]);

  // Join/leave streaming groups incrementally when `emails` changes
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();
    const prev = prevEmailsRef.current;
    const curr = new Set(emails.map((e) => e.toLowerCase()));

    const toJoin: string[] = [];
    const toLeave: string[] = [];

    curr.forEach((e) => { if (!prev.has(e)) toJoin.push(e); });
    prev.forEach((e) => { if (!curr.has(e)) toLeave.push(e); });

    prevEmailsRef.current = curr;

    // Best-effort join/leave; ignore errors
    toJoin.forEach((e) => { client.joinGroup(e).catch(() => {}); });
    toLeave.forEach((e) => { client.leaveGroup?.(e).catch?.(() => {}); });

    // ✅ ULTRA-OPTIMIZADO: Solo refrescar emails NUEVOS, NO todos
    if (toJoin.length > 0) {
      console.log('🔄 [useMultiUserStreams] New emails detected, refreshing only new ones:', toJoin);
      toJoin.forEach(email => {
        setTimeout(() => refreshTokenForEmail(email), 100);
      });
    }

    // Also clear stale creds for removed emails
    if (toLeave.length > 0) {
      setCredsMap((prev) => {
        const copy = { ...prev };
        toLeave.forEach((e) => delete copy[e]);
        return copy;
      });
    }
  }, [emails, refreshTokenForEmail]);

  // ✅ OPTIMIZADO: Solo hacer refresh inicial, NO en cada cambio de emails
  useEffect(() => {
    if (emails.length > 0) {
      console.log('🔄 [useMultiUserStreams] Initial hydration for emails:', emails.length);
      void refreshAllTokens();
    }
  }, []); // ✅ CRÍTICO: Solo ejecutar una vez al montar

  return credsMap;
}

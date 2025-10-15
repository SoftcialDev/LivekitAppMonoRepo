import { useState, useRef, useCallback, useEffect } from 'react';
import { getLiveKitToken, RoomWithToken } from '@/shared/api/livekitClient';
import { fetchStreamingSessions } from '@/shared/api/streamingStatusClient';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';

interface StreamCreds {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
}

export type CredsMap = Record<string, StreamCreds>;

/**
 * Hook COMPLETAMENTE AISLADO para streams
 * NO se ve afectado por cambios en el presence store
 * Solo se actualiza cuando realmente es necesario
 */
export function useIsolatedStreams(viewerEmail: string, emails: string[]): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const canceledUsersRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const lastEmailsRef = useRef<string[]>([]);

  // ✅ Función para actualizar solo una tarjeta específica
  const refreshTokenForEmail = useCallback(async (email: string) => {
    try {
      console.log(`🔄 [useIsolatedStreams] Refreshing token ONLY for ${email}`);
      
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
          console.log(`✅ [useIsolatedStreams] No change needed for ${email}, skipping update`);
          return prev;
        }
        
        console.log(`🔄 [useIsolatedStreams] Updating ONLY ${email} with new credentials`);
        return {
          ...prev,
          [key]: newCreds
        };
      });
    } catch (error) {
      console.error(`❌ [useIsolatedStreams] Failed to refresh token for ${email}:`, error);
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

  // ✅ Inicialización UNA SOLA VEZ
  useEffect(() => {
    if (isInitializedRef.current || emails.length === 0) return;
    
    console.log('🔄 [useIsolatedStreams] Initial setup for emails:', emails.length);
    isInitializedRef.current = true;
    
    // Solo hacer refresh inicial para emails que no tienen credenciales
    emails.forEach(email => {
      const key = email.toLowerCase();
      const currentCreds = credsMap[key];
      if (!currentCreds?.accessToken) {
        setTimeout(() => refreshTokenForEmail(email), 100);
      }
    });
  }, [emails, refreshTokenForEmail, credsMap]);

  // ✅ Manejar cambios de emails SIN refresh global
  useEffect(() => {
    const prev = lastEmailsRef.current;
    const curr = emails.map(e => e.toLowerCase());
    
    const toJoin = curr.filter(e => !prev.includes(e));
    const toLeave = prev.filter(e => !curr.includes(e));
    
    lastEmailsRef.current = curr;
    
    // Solo refrescar emails NUEVOS
    if (toJoin.length > 0) {
      console.log('🔄 [useIsolatedStreams] New emails detected, refreshing only new ones:', toJoin);
      toJoin.forEach(email => {
        setTimeout(() => refreshTokenForEmail(email), 100);
      });
    }
    
    // Limpiar emails que se fueron
    if (toLeave.length > 0) {
      console.log('🗑️ [useIsolatedStreams] Emails removed, clearing credentials:', toLeave);
      toLeave.forEach(email => clearOne(email));
    }
  }, [emails, refreshTokenForEmail, clearOne]);

  // ✅ WebSocket handler ULTRA-OPTIMIZADO con conexión y grupos
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();

    const setupWebSocket = async () => {
      try {
        // Conectar al WebSocket si no está conectado
        await client.connect(viewerEmail);
        console.log('✅ [useIsolatedStreams] WebSocket connected');
        
        // Unirse a grupos de streaming para cada email
        for (const email of emails) {
          await client.joinGroup(email).catch(() => {});
        }
        console.log('✅ [useIsolatedStreams] Joined streaming groups for emails:', emails.length);
      } catch (error) {
        console.error('❌ [useIsolatedStreams] Failed to setup WebSocket:', error);
      }
    };

    const handleMessage = (msg: any) => {
      console.log('🔌 [useIsolatedStreams] WebSocket message received:', {
        type: msg?.type,
        command: msg?.command,
        status: msg?.status,
        email: msg?.email,
        employeeEmail: msg?.employeeEmail
      });

      let targetEmail: string | null = null;
      let started: boolean | null = null;

      // Procesar mensajes de comando (START/STOP)
      if (msg?.command && msg?.employeeEmail) {
        targetEmail = String(msg.employeeEmail).toLowerCase();
        started = msg.command === 'START' ? true : msg.command === 'STOP' ? false : null;
        console.log('🔌 [useIsolatedStreams] Command message:', { targetEmail, started });
      } 
      // Procesar mensajes de estado (started/stopped)
      else if (msg?.email && msg?.status) {
        targetEmail = String(msg.email).toLowerCase();
        started = msg.status === 'started' ? true : msg.status === 'stopped' ? false : null;
        console.log('🔌 [useIsolatedStreams] Status message:', { targetEmail, started });
      }

      if (!targetEmail || !emails.includes(targetEmail)) {
        console.log('🔌 [useIsolatedStreams] Ignoring message for unknown email:', targetEmail);
        return;
      }

      if (started === true) {
        console.log(`🔄 [useIsolatedStreams] WebSocket START/started received for: ${targetEmail}`);
        if (canceledUsersRef.current.has(targetEmail)) {
          const ns = new Set(canceledUsersRef.current);
          ns.delete(targetEmail);
          canceledUsersRef.current = ns;
        }
        void refreshTokenForEmail(targetEmail);
      } else if (started === false) {
        console.log(`🚫 [useIsolatedStreams] WebSocket STOP/stopped received for: ${targetEmail}`);
        const ns = new Set(canceledUsersRef.current);
        ns.add(targetEmail);
        canceledUsersRef.current = ns;
        clearOne(targetEmail);
      }
    };

    // Configurar WebSocket y listener
    void setupWebSocket();
    client.onMessage(handleMessage);

    return () => {
      // No cleanup para evitar desconectar otros listeners
    };
  }, [viewerEmail, emails, refreshTokenForEmail, clearOne]);

  return credsMap;
}

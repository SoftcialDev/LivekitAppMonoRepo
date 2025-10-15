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

  // ✅ Inicialización UNA SOLA VEZ
  useEffect(() => {
    if (isInitializedRef.current || emails.length === 0) return;
    
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
      toJoin.forEach(email => {
        setTimeout(() => refreshTokenForEmail(email), 100);
      });
    }
    
    // Limpiar emails que se fueron
    if (toLeave.length > 0) {
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
        setTimeout(() => {
          if (targetEmail) {
            void refreshTokenForEmail(targetEmail);
          }
        }, 5000);
      } else if (started === false) {
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

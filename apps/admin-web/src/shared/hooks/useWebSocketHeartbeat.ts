import { useEffect } from 'react';
import { WebPubSubClientService } from '../api/webpubsubClient';

/**
 * useWebSocketHeartbeat
 * ---------------------
 * Hook that maintains WebSocket connection active through periodic heartbeat.
 * 
 * Features:
 * - Verifies connection every 30 seconds
 * - Automatically reconnects if connection is lost
 * - Works continuously (even when tab is hidden)
 * - Reuses existing connection (singleton)
 * 
 * @param userEmail - User email for the connection
 * 
 * @example
 * ```tsx
 * const PsoDashboard = () => {
 *   const { account } = useAuth();
 *   const userEmail = account?.username ?? '';
 *   
 *   useWebSocketHeartbeat(userEmail);
 *   // ... rest of component
 * };
 * ```
 */
export function useWebSocketHeartbeat(userEmail: string): void {
  useEffect(() => {
    if (!userEmail) {
      console.log('[Heartbeat] No userEmail provided, skipping heartbeat');
      return;
    }

    console.log('[Heartbeat] Starting WebSocket heartbeat for:', userEmail);

    const heartbeat = setInterval(() => {
      const client = WebPubSubClientService.getInstance();
      
      if (client.isConnected()) {
        console.log('[Heartbeat] ✅ WebSocket connected, sending ping...');
        // Ping is handled automatically by the client
        // No need to send explicit message
      } else {
        console.log('[Heartbeat] ❌ WebSocket disconnected, reconnecting...');
        client.connect(userEmail)
          .then(async () => {
            console.log('[Heartbeat] ✅ Reconnection successful');
            
            // ✅ RECONECTAR A TODOS LOS GRUPOS después de reconectar
            try {
              await client.joinGroup('presence');
              console.log('[Heartbeat] ✅ Rejoined presence group');
              
              // ✅ RECONECTAR AL GRUPO DE COMANDOS DEL USUARIO
              await client.joinGroup(`commands:${userEmail}`);
              console.log('[Heartbeat] ✅ Rejoined commands group');
            } catch (error) {
              console.error('[Heartbeat] ❌ Failed to rejoin groups:', error);
            }
          })
          .catch((error) => {
            console.error('[Heartbeat] ❌ Reconnection failed:', error);
          });
      }
    }, 30000); // Every 30 seconds

    // Cleanup on unmount
    return () => {
      console.log('[Heartbeat] Cleaning up heartbeat for:', userEmail);
      clearInterval(heartbeat);
    };
  }, [userEmail]);
}

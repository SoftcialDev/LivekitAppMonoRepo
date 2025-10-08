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

      return;
    }



    const heartbeat = setInterval(() => {
      const client = WebPubSubClientService.getInstance();
      
      if (client.isConnected()) {

        // Ping is handled automatically by the client
        // No need to send explicit message
      } else {

        client.connect(userEmail)
          .then(async () => {

            
            // ✅ RECONECTAR A TODOS LOS GRUPOS después de reconectar
            try {
              await client.joinGroup('presence');

              
              // ✅ RECONECTAR AL GRUPO DE COMANDOS DEL USUARIO
              await client.joinGroup(`commands:${userEmail}`);

            } catch (error) {

            }
          })
          .catch((error) => {

          });
      }
    }, 30000); // Every 30 seconds

    // Cleanup on unmount
    return () => {

      clearInterval(heartbeat);
    };
  }, [userEmail]);
}

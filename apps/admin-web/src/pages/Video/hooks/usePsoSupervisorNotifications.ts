import { useEffect, useCallback } from 'react';
import { webPubSubClient as pubSubService } from '@/shared/api/webpubsubClient';

/**
 * Hook to handle supervisor change notifications for PSOs
 * 
 * @param userEmail - PSO's email address
 * @param onSupervisorChanged - Callback to trigger when supervisor changes
 */
export function usePsoSupervisorNotifications(
  userEmail: string, 
  onSupervisorChanged: () => void
) {
  
  const handleSupervisorChange = useCallback((msg: any) => {
    console.log(`[SUPERVISOR_NOTIFICATION] Received supervisor change notification:`, msg);
    console.log(`[SUPERVISOR_NOTIFICATION] New supervisor: ${msg.newSupervisorName || 'none'}`);
    
    // Trigger the callback to refetch supervisor info
    onSupervisorChanged();
  }, [onSupervisorChanged]);

  useEffect(() => {
    if (!userEmail) return;

    console.log(`[SUPERVISOR_NOTIFICATION] Setting up supervisor change listener for ${userEmail}`);
    
    // Listen for supervisor change notifications
    const offMsg = pubSubService.onMessage((msg: any) => {
      // Only process supervisor change notifications for this user
      if (msg?.type === 'SUPERVISOR_CHANGED') {
        console.log(`[SUPERVISOR_NOTIFICATION] Processing supervisor change for ${userEmail}`);
        handleSupervisorChange(msg);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log(`[SUPERVISOR_NOTIFICATION] Cleaning up supervisor change listener for ${userEmail}`);
      offMsg();
    };
  }, [userEmail, handleSupervisorChange]);
}

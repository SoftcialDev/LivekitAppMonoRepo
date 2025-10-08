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
    
    // Trigger the callback to refetch supervisor info
    onSupervisorChanged();
  }, [onSupervisorChanged]);

  useEffect(() => {
    if (!userEmail) return;

    
    // Listen for supervisor change notifications
    const offMsg = pubSubService.onMessage((msg: any) => {
      // Only process supervisor change notifications for this user
      if (msg?.type === 'SUPERVISOR_CHANGED') {
        handleSupervisorChange(msg);
      }
    });

    // Cleanup on unmount
    return () => {
      offMsg();
    };
  }, [userEmail, handleSupervisorChange]);
}

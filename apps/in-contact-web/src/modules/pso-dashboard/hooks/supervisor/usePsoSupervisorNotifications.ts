/**
 * @fileoverview usePsoSupervisorNotifications - Hook for supervisor change notifications
 * @summary Listens to WebSocket notifications for supervisor changes
 * @description Subscribes to supervisor change notifications and refetches supervisor data when changes occur
 */

import { useEffect, useRef } from 'react';
import { useSupervisorChange } from '@/modules/supervisor';
import { logDebug } from '@/shared/utils/logger';
import type { IUsePsoSupervisorNotificationsOptions } from './types/usePsoSupervisorNotificationsTypes';

/**
 * Hook for listening to supervisor change notifications via WebSocket
 * 
 * @param options - Configuration options
 * @remarks
 * Uses the supervisor store's change notification system to detect when
 * the supervisor assignment changes and triggers a refetch of supervisor data.
 */
export function usePsoSupervisorNotifications(
  options: IUsePsoSupervisorNotificationsOptions
): void {
  const { psoEmail, refetchSupervisor } = options;
  const lastSupervisorChangeRef = useRef<unknown>(null);
  
  // Get supervisor change notifications from supervisor store
  const lastSupervisorChange = useSupervisorChange();
  
  useEffect(() => {
    // Only refetch if supervisor change notification is new and affects this PSO
    if (
      lastSupervisorChange && 
      lastSupervisorChangeRef.current !== lastSupervisorChange
    ) {
      lastSupervisorChangeRef.current = lastSupervisorChange;
      
      // Check if this change affects the current PSO
      const psoEmailLower = psoEmail.toLowerCase();
      const affectedPsoEmails = lastSupervisorChange.psoEmails || [];
      const isAffected = affectedPsoEmails.some(
        (email: string) => email.toLowerCase() === psoEmailLower
      );
      
      if (isAffected) {
        logDebug('[usePsoSupervisorNotifications] Supervisor change detected, refetching', {
          psoEmail,
          newSupervisor: lastSupervisorChange.newSupervisorEmail,
        });
        void refetchSupervisor();
      }
    }
  }, [lastSupervisorChange, psoEmail, refetchSupervisor]);
}


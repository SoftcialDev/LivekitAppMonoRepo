/**
 * @fileoverview useSupervisorChangeNotifications - Hook for listening to supervisor change notifications
 * @summary Custom hook for handling supervisor change notifications from WebSocket
 * @description Provides a way for components to listen and react to supervisor change notifications
 */

import { useCallback } from 'react';
import { useToast } from '../ui/ToastContext';
import { useSupervisorChangeNotifications as useGenericSupervisorChangeNotifications } from './useWebSocketNotifications';

/**
 * Interface for supervisor change notification data
 */
export interface SupervisorChangeData {
  psoEmails: string[];
  oldSupervisorEmail?: string;
  newSupervisorEmail: string;
  newSupervisorId?: string;
  psoNames: string[];
  newSupervisorName: string;
}

/**
 * Hook for listening to supervisor change notifications
 * @param onSupervisorChange - Callback function to handle supervisor changes
 * @param viewerEmail - Current user's email
 * @param viewerRole - Current user's role
 * @returns void
 */
export function useSupervisorChangeNotifications(
  onSupervisorChange?: (data: SupervisorChangeData) => void,
  viewerEmail?: string,
  viewerRole?: string | null
): void {
  const { showToast } = useToast();

  /**
   * Handles supervisor change events from WebSocket
   * @param data - Supervisor change data
   */
  const handleSupervisorChange = useCallback((data: SupervisorChangeData) => {
    // Determine if this user should be notified
    const shouldNotify = 
      viewerRole === 'Admin' || 
      viewerRole === 'SuperAdmin' ||
      viewerEmail === data.oldSupervisorEmail ||
      viewerEmail === data.newSupervisorEmail;
      
    if (shouldNotify) {
      // Call custom handler if provided (toast will be shown by the component that handles the change)
      if (onSupervisorChange) {
        onSupervisorChange(data);
      }
      
      console.log(`🔄 [useSupervisorChangeNotifications] Supervisor change processed: ${data.psoNames.join(', ')} transferred to ${data.newSupervisorName}`);
    }
  }, [onSupervisorChange, viewerEmail, viewerRole, showToast]);

  // Use the new generic WebSocket notification system
  useGenericSupervisorChangeNotifications(handleSupervisorChange, viewerEmail, viewerRole);
}
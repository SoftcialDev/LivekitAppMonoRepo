import { useEffect, useCallback } from 'react';

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
  console.log(`📡 [usePsoSupervisorNotifications] Setting up notifications for PSO: ${userEmail}`);
  
  const handleSupervisorChange = useCallback((event: CustomEvent) => {
    const data = event.detail;
    console.log(`🔄 [usePsoSupervisorNotifications] Supervisor change event received:`, data);
    
    // Check if this PSO is affected by the change
    if (data.psoEmails && data.psoEmails.includes(userEmail)) {
      console.log(`🔄 [usePsoSupervisorNotifications] PSO ${userEmail} is affected by supervisor change`);
      onSupervisorChanged();
    }
  }, [userEmail, onSupervisorChanged]);

  useEffect(() => {
    // Listen for supervisor change events
    window.addEventListener('supervisorChange', handleSupervisorChange as EventListener);
    
    console.log(`📡 [usePsoSupervisorNotifications] Event listener registered for PSO: ${userEmail}`);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('supervisorChange', handleSupervisorChange as EventListener);
      console.log(`📡 [usePsoSupervisorNotifications] Event listener removed for PSO: ${userEmail}`);
    };
  }, [handleSupervisorChange, userEmail]);
}

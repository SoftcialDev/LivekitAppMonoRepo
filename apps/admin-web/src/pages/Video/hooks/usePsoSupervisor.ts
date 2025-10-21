import { useState, useEffect, useCallback } from 'react';
import { getSupervisorForPso, Supervisor } from '@/shared/api/userClient';

/**
 * Hook to manage PSO supervisor information with real-time updates
 * 
 * @param userEmail - PSO's email address
 * @returns Object containing supervisor data, loading state, and refetch function
 */
export function usePsoSupervisor(userEmail: string) {
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSupervisor = useCallback(async () => {
    if (!userEmail) {
      setSupervisor(null);
      setLoading(false);
      return;
    }
    
    console.log(`🔄 [usePsoSupervisor] Fetching supervisor for PSO: ${userEmail}`);
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSupervisorForPso(userEmail);
      
      if ('supervisor' in result) {
        console.log(`✅ [usePsoSupervisor] Supervisor found: ${result.supervisor.fullName || result.supervisor.email}`);
        setSupervisor(result.supervisor);
      } else {
        console.log(`⚠️ [usePsoSupervisor] No supervisor assigned to PSO: ${userEmail}`);
        setSupervisor(null);
      }
    } catch (err: any) {
      console.error(`❌ [usePsoSupervisor] Failed to fetch supervisor:`, err);
      setError(err.message || 'Failed to fetch supervisor');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);
  
  useEffect(() => {
    fetchSupervisor();
  }, [fetchSupervisor]);
  
  return { 
    supervisor, 
    loading, 
    error, 
    refetchSupervisor: fetchSupervisor 
  };
}

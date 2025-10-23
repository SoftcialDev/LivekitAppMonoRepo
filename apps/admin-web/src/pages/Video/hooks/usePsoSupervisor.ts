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
    
    // Removed fetch log to reduce console spam
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSupervisorForPso(userEmail);
      
      if ('supervisor' in result) {
        // Removed success log to reduce console spam
        setSupervisor(result.supervisor);
      } else {
        // Removed warning log to reduce console spam
        setSupervisor(null);
      }
    } catch (err: any) {

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

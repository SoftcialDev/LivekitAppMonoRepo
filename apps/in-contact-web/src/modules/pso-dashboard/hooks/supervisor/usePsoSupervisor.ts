/**
 * @fileoverview usePsoSupervisor - Hook for fetching PSO supervisor information
 * @summary Fetches and manages supervisor information for a PSO
 * @description Provides supervisor data with loading state and refetch capability
 */

import { useState, useEffect, useCallback } from 'react';
import { logError } from '@/shared/utils/logger';
import { getSupervisorForPso } from '../../api';
import type { ISupervisor } from '../../types';
import type { IUsePsoSupervisorReturn } from './types/usePsoSupervisorTypes';

/**
 * Hook for managing PSO supervisor information with real-time updates
 * 
 * @param userEmail - PSO's email address (identifier)
 * @returns Object containing supervisor data, loading state, and refetch function
 */
export function usePsoSupervisor(userEmail: string): IUsePsoSupervisorReturn {
  const [supervisor, setSupervisor] = useState<ISupervisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSupervisor = useCallback(async () => {
    if (!userEmail) {
      setSupervisor(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSupervisorForPso(userEmail);
      
      if ('supervisor' in result) {
        setSupervisor(result.supervisor);
      } else {
        // No supervisor assigned or error message
        setSupervisor(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch supervisor';
      logError('Failed to fetch supervisor for PSO', { error: err, userEmail });
      setError(errorMessage);
      setSupervisor(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);
  
  useEffect(() => {
    fetchSupervisor().catch((err) => {
      logError('Error in fetchSupervisor effect', { error: err, userEmail });
    });
  }, [fetchSupervisor, userEmail]);
  
  return { 
    supervisor, 
    loading, 
    error, 
    refetchSupervisor: fetchSupervisor 
  };
}


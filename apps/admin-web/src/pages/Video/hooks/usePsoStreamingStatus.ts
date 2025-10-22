import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/shared/api/apiClient';

export interface PsoStreamingSession {
  id: string;
  userId: string;
  startedAt: string;
  stoppedAt: string | null;
  stopReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PsoStreamingStatus {
  email: string;
  hasActiveSession: boolean;
  lastSession: {
    stopReason: string | null;
    stoppedAt: string | null;
  } | null;
}

/**
 * Hook para obtener el streaming status de un PSO específico
 * Usa FetchStreamingSessionHistory endpoint específico para PSOs
 */
export function usePsoStreamingStatus(psoEmail: string) {
  const [status, setStatus] = useState<PsoStreamingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!psoEmail) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`📡 [usePsoStreamingStatus] Fetching session history for PSO: ${psoEmail}`);
      
      // Usar FetchStreamingSessionHistory endpoint específico para PSOs
      const response = await apiClient.get(`/api/FetchStreamingSessionHistory?email=${encodeURIComponent(psoEmail)}`);
      
      console.log(`📡 [usePsoStreamingStatus] Raw response:`, response.data);
      
      if (response.data && response.data.session) {
        const session: PsoStreamingSession = response.data.session;
        
        // Convertir a formato compatible con useSynchronizedTimer
        const psoStatus: PsoStreamingStatus = {
          email: psoEmail,
          hasActiveSession: !session.stoppedAt, // Si no hay stoppedAt, está activo
          lastSession: {
            stopReason: session.stopReason,
            stoppedAt: session.stoppedAt
          }
        };
        
        console.log(`📡 [usePsoStreamingStatus] Processed status:`, psoStatus);
        setStatus(psoStatus);
      } else {
        console.warn(`📡 [usePsoStreamingStatus] No session found for PSO: ${psoEmail}`);
        setStatus({
          email: psoEmail,
          hasActiveSession: false,
          lastSession: null
        });
      }
    } catch (err: any) {
      console.error(`📡 [usePsoStreamingStatus] Error fetching session history:`, err);
      setError(err.message || 'Failed to fetch streaming session history');
      setStatus({
        email: psoEmail,
        hasActiveSession: false,
        lastSession: null
      });
    } finally {
      setLoading(false);
    }
  }, [psoEmail]);

  // Fetch status on mount and when email changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-refresh every 30 seconds to keep timer updated
  useEffect(() => {
    if (!psoEmail) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [psoEmail, fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus
  };
}

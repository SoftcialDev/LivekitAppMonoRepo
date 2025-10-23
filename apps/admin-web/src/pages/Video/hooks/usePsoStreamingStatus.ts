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
 * @param psoEmail - Email del PSO
 * @param isStreaming - Estado actual del streaming para detectar cambios inmediatos
 */
export function usePsoStreamingStatus(psoEmail: string, isStreaming?: boolean) {
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
      
      // Removed fetch log to reduce console spam
      
      // Usar FetchStreamingSessionHistory endpoint específico para PSOs
      const response = await apiClient.get(`/api/FetchStreamingSessionHistory?email=${encodeURIComponent(psoEmail)}`);
      
      // Removed raw response log to reduce console spam
      
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
        
        // Removed processed status log to reduce console spam
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

  // Escuchar eventos de actualización inmediata del streaming session
  useEffect(() => {
    const handleStreamingSessionUpdate = (event: CustomEvent) => {
      const { session } = event.detail;
      // Removed immediate update log to reduce console spam
      
      if (session) {
        const psoStatus: PsoStreamingStatus = {
          email: psoEmail,
          hasActiveSession: !session.stoppedAt,
          lastSession: {
            stopReason: session.stopReason,
            stoppedAt: session.stoppedAt
          }
        };
        
        // Removed updated status log to reduce console spam
        setStatus(psoStatus);
      }
    };

    window.addEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    };
  }, [psoEmail]);

  // ✅ Removed 30-second interval - now using immediate updates via events

  // Si el streaming está activo, limpiar el timer inmediatamente
  useEffect(() => {
    if (isStreaming && status?.lastSession) {
      console.log(`📡 [usePsoStreamingStatus] Streaming started, clearing timer for ${psoEmail}`);
      setStatus(prev => prev ? { ...prev, hasActiveSession: true, lastSession: null } : null);
    }
  }, [isStreaming, psoEmail, status?.lastSession]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus
  };
}

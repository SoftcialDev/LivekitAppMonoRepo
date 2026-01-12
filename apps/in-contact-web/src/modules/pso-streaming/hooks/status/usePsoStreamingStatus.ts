/**
 * @fileoverview usePsoStreamingStatus hook
 * @summary Hook for obtaining streaming status of a specific PSO
 * @description Uses FetchStreamingSessionHistory endpoint to get the most recent streaming session
 * for a PSO. Listens to streamingSessionUpdated events for immediate updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { logWarn, logDebug, logError } from '@/shared/utils/logger';
import { fetchStreamingSessionHistoryByEmail } from '../../api/streamingSessionHistoryClient';
import type {
  IPsoStreamingStatus,
  IPsoStreamingSession,
} from './types/psoStreamingStatusTypes';

/**
 * Hook for obtaining streaming status of a specific PSO
 * 
 * @param psoEmail - Email of the PSO
 * @param isStreaming - Current streaming state to detect immediate changes
 * @returns Object containing status, loading, error, and refetch function
 */
export function usePsoStreamingStatus(
  psoEmail: string,
  isStreaming?: boolean
): {
  status: IPsoStreamingStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [status, setStatus] = useState<IPsoStreamingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (): Promise<void> => {
    if (!psoEmail) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchStreamingSessionHistoryByEmail(psoEmail);

      if (response.session) {
        const session: IPsoStreamingSession = response.session;

        const psoStatus: IPsoStreamingStatus = {
          email: psoEmail,
          hasActiveSession: !session.stoppedAt,
          lastSession: {
            stopReason: session.stopReason,
            stoppedAt: session.stoppedAt,
          },
        };

        setStatus(psoStatus);
      } else {
        logWarn('[usePsoStreamingStatus] No session found for PSO', { psoEmail });
        setStatus({
          email: psoEmail,
          hasActiveSession: false,
          lastSession: null,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch streaming session history';
      logError('[usePsoStreamingStatus] Error fetching session history', { error: err, psoEmail });
      setError(errorMessage);
      setStatus({
        email: psoEmail,
        hasActiveSession: false,
        lastSession: null,
      });
    } finally {
      setLoading(false);
    }
  }, [psoEmail]);

  useEffect(() => {
    fetchStatus().catch((err: unknown) => {
      logError('[usePsoStreamingStatus] Error in fetchStatus effect', { error: err, psoEmail });
    });
  }, [fetchStatus, psoEmail]);

  useEffect(() => {
    const handleStreamingSessionUpdate = (event: CustomEvent): void => {
      const { session } = event.detail as { session?: IPsoStreamingSession & { email?: string } };

      if (session) {
        // Filter by email if provided in event (for multi-user scenarios)
        if (session.email && session.email.toLowerCase() !== psoEmail.toLowerCase()) {
          return;
        }

        const psoStatus: IPsoStreamingStatus = {
          email: psoEmail,
          hasActiveSession: !session.stoppedAt,
          lastSession: {
            stopReason: session.stopReason,
            stoppedAt: session.stoppedAt,
          },
        };

        setStatus(psoStatus);
        logDebug('[usePsoStreamingStatus] Updated status from streamingSessionUpdated event', {
          psoEmail,
          stopReason: session.stopReason,
          stoppedAt: session.stoppedAt,
        });
      }
    };

    globalThis.addEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);

    return () => {
      globalThis.removeEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    };
  }, [psoEmail]);

  useEffect(() => {
    if (isStreaming && status?.lastSession) {
      logDebug('[usePsoStreamingStatus] Streaming started, clearing timer', { psoEmail });
      setStatus((prev) =>
        prev ? { ...prev, hasActiveSession: true, lastSession: null } : null
      );
    } else if (!isStreaming && status && !status.lastSession) {
      // When streaming stops, refresh status to get the latest session info
      logDebug('[usePsoStreamingStatus] Streaming stopped, refreshing status', { psoEmail });
      fetchStatus().catch((err: unknown) => {
        logError('[usePsoStreamingStatus] Error refreshing status after streaming stopped', { error: err, psoEmail });
      });
    }
  }, [isStreaming, psoEmail, status?.lastSession, fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
}


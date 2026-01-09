/**
 * @fileoverview useTalkSessionStatus - Hook for checking active talk session status for a PSO
 * @summary Monitors whether a PSO has an active talk session
 * @description Provides polling-based status checking for active talk sessions,
 * updating the status at regular intervals to keep the UI in sync with the backend.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { TalkSessionClient } from '@/shared/api/talkSessionClient';

/**
 * Options for useTalkSessionStatus hook
 */
export interface UseTalkSessionStatusOptions {
  /**
   * Email of the PSO to check for active talk sessions
   */
  psoEmail: string | null | undefined;
  /**
   * Whether polling is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Polling interval in milliseconds (default: 5000)
   */
  pollInterval?: number;
}

/**
 * Return type for useTalkSessionStatus hook
 */
export interface UseTalkSessionStatus {
  /**
   * Whether the PSO has an active talk session
   */
  hasActiveSession: boolean;
  /**
   * ID of the active session (if any)
   */
  sessionId: string | null;
  /**
   * Email of the supervisor in the active session (if any)
   */
  supervisorEmail: string | null;
  /**
   * Name of the supervisor in the active session (if any)
   */
  supervisorName: string | null;
  /**
   * Whether the status is currently being fetched
   */
  loading: boolean;
  /**
   * Error message if status check failed
   */
  error: string | null;
  /**
   * Manually refresh the status
   */
  refetch: () => Promise<void>;
}

/**
 * Hook for checking active talk session status for a PSO
 * @param options - Configuration options
 * @returns Object containing active session status and metadata
 */
export function useTalkSessionStatus(
  options: UseTalkSessionStatusOptions
): UseTalkSessionStatus {
  const { psoEmail, enabled = true, pollInterval = 5000 } = options;

  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [supervisorEmail, setSupervisorEmail] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef(new TalkSessionClient());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetches the active session status from the API
   */
  const fetchStatus = useCallback(async (): Promise<void> => {
    if (!psoEmail || !enabled) {
      setHasActiveSession(false);
      setSessionId(null);
      setSupervisorEmail(null);
      setSupervisorName(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await clientRef.current.checkActiveSession(psoEmail);

      setHasActiveSession(result.hasActiveSession);
      setSessionId(result.sessionId || null);
      setSupervisorEmail(result.supervisorEmail || null);
      setSupervisorName(result.supervisorName || null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check active session';
      setError(errorMessage);
      console.error('[useTalkSessionStatus] Error checking active session:', err);
      // Don't clear state on error - keep last known state
    } finally {
      setLoading(false);
    }
  }, [psoEmail, enabled]);

  /**
   * Manual refresh function
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchStatus();
  }, [fetchStatus]);

  /**
   * Set up polling when enabled and psoEmail is available
   * Only fetches once when enabled becomes true, no continuous polling
   */
  useEffect(() => {
    if (!enabled || !psoEmail) {
      // Clear interval if disabled or no email
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Only fetch once when enabled becomes true (during countdown)
    // No need for continuous polling since we're the ones starting the session
    fetchStatus();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, psoEmail, fetchStatus]);

  return {
    hasActiveSession,
    sessionId,
    supervisorEmail,
    supervisorName,
    loading,
    error,
    refetch
  };
}


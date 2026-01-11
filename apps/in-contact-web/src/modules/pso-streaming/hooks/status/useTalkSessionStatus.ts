/**
 * @fileoverview useTalkSessionStatus hook
 * @summary Hook for checking active talk session status for a PSO
 * @description Monitors whether a PSO has an active talk session.
 * Provides status checking for active talk sessions, updating the status to keep the UI in sync.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { logError, logDebug } from '@/shared/utils/logger';
import { TalkSessionClient } from '../../api/talkSessionClient';
import type {
  IUseTalkSessionStatusOptions,
  IUseTalkSessionStatusReturn,
} from './types/talkSessionStatusTypes';

/**
 * Hook for checking active talk session status for a PSO
 * 
 * @param options - Configuration options
 * @returns Object containing active session status and metadata
 */
export function useTalkSessionStatus(
  options: IUseTalkSessionStatusOptions
): IUseTalkSessionStatusReturn {
  const { psoEmail, enabled = true } = options;

  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [supervisorEmail, setSupervisorEmail] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef(new TalkSessionClient());

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
      logError('[useTalkSessionStatus] Error checking active session', { error: err, psoEmail });
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

  useEffect(() => {
    if (!enabled || !psoEmail) {
      return;
    }

    void fetchStatus();
  }, [enabled, psoEmail, fetchStatus]);

  return {
    hasActiveSession,
    sessionId,
    supervisorEmail,
    supervisorName,
    loading,
    error,
    refetch,
  };
}


/**
 * @fileoverview useIsolatedStreams hook
 * @description Manages LiveKit stream credentials for multiple PSOs independently of presence store changes.
 * Integrates batch status for users without active tokens and handles WebSocket messages, timers, and status updates.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { logDebug, logError, logWarn } from '@/shared/utils/logger';
import { fetchCredentialsForEmail, buildStatusMap } from './utils';
import { fetchStreamingStatusBatch } from '../../api/streamingStatusBatchClient';
import type { CredsMap, StreamCreds, StreamingStatusInfo } from '../../types';
import { useStreamWebSocketMessages } from './useStreamWebSocketMessages';
import { useStreamTimers } from './useStreamTimers';
import { useStreamInitialization } from './useStreamInitialization';
import { useStreamEmailChanges } from './useStreamEmailChanges';
import { useStreamWebSocketGroups } from './useStreamWebSocketGroups';
import { useStreamSessionEvents } from './useStreamSessionEvents';

/**
 * Manages stream credentials for multiple PSOs independently of presence store changes
 * @param viewerEmail - Email of the viewer
 * @param emails - Array of PSO emails to manage streams for
 * @returns Map of email to stream credentials
 */
export function useIsolatedStreams(viewerEmail: string, emails: string[]): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const credsMapRef = useRef<CredsMap>({});
  const canceledUsersRef = useRef<Set<string>>(new Set());
  const emailsRef = useRef<string[]>([]);
  const joinedGroupsRef = useRef<Set<string>>(new Set());
  const wsHandlerRegisteredRef = useRef<boolean>(false);
  const isInitializedRef = useRef(false);
  const lastEmailsRef = useRef<string[]>([]);
  const fetchingTokensRef = useRef<Set<string>>(new Set());
  
  const {
    pendingTimersRef,
    stopStatusTimersRef,
    retryTimersRef,
    startConnectionTimersRef,
    clearPendingTimer,
    clearStopStatusTimer,
    clearRetryTimer,
    clearStartConnectionTimer,
    clearAllTimers,
  } = useStreamTimers();
  
  useEffect(() => {
    credsMapRef.current = credsMap;
  }, [credsMap]);

  /**
   * Refreshes token for a specific email
   * @param email - Email to refresh token for
   */
  const refreshTokenForEmail = useCallback(async (email: string): Promise<void> => {
    const key = email.toLowerCase();
    
    if (fetchingTokensRef.current.has(key)) {
      logDebug('[useIsolatedStreams] Token fetch already in progress, skipping duplicate call', { email: key });
      return;
    }
    
    fetchingTokensRef.current.add(key);
    
    try {
      const creds = await fetchCredentialsForEmail(email);
      fetchingTokensRef.current.delete(key);
      
      if (!creds) {
        setCredsMap((prev) => {
          const currentCreds = prev[key];
          if (!currentCreds || currentCreds.loading === false) {
            return prev;
          }
          return {
            ...prev,
            [key]: { ...currentCreds, loading: false }
          };
        });
        return;
      }

      setCredsMap((prev) => {
        const currentCreds = prev[key] ?? {};
        const newCreds: StreamCreds = { ...creds, loading: false };
        if (JSON.stringify(currentCreds) === JSON.stringify(newCreds)) {
          return prev;
        }
        return {
          ...prev,
          [key]: newCreds
        };
      });
    } catch (error) {
      fetchingTokensRef.current.delete(key);
      logError('Failed to refresh token for email', { error, email });
      
      setCredsMap((prev) => {
        const currentCreds = prev[key];
        if (!currentCreds) {
          return prev;
        }
        return {
          ...prev,
          [key]: { ...currentCreds, loading: false }
        };
      });
    }
  }, []);

  const clearOne = useCallback((email: string): void => {
    const key = email.toLowerCase();
    setCredsMap((prev) => {
      const current = prev[key];
      if (!current || (!current.accessToken && !current.loading)) {
        return prev;
      }
      return {
        ...prev,
        [key]: { loading: false, accessToken: undefined, roomName: undefined, livekitUrl: undefined },
      };
    });
  }, []);


  /**
   * Handles error from retry attempt
   * @param err - Error that occurred
   * @param emailKey - Email key that failed
   * @param attempt - Attempt number
   */
  const handleRetryError = useCallback((err: unknown, emailKey: string, attempt: number): void => {
    logError('[useIsolatedStreams] Error in attemptFetchWithRetry retry', { error: err, email: emailKey, attempt });
  }, []);

  /**
   * Sets loading to false for an email after max retries
   * @param emailKey - Email key to update
   */
  const setLoadingFalseAfterMaxRetries = useCallback((emailKey: string): void => {
    setCredsMap(prev => {
      const current = prev[emailKey];
      if (!current) return prev;
      return {
        ...prev,
        [emailKey]: { ...current, loading: false }
      };
    });
  }, []);

  /**
   * Schedules a retry attempt with exponential backoff
   * @param emailKey - Email key to retry for
   * @param nextAttempt - Next attempt number
   * @param delay - Delay in milliseconds
   * @param retryFn - Function to call on retry
   */
  const scheduleRetryAttempt = useCallback((
    emailKey: string,
    nextAttempt: number,
    delay: number,
    retryFn: () => Promise<void>
  ): void => {
    clearRetryTimer(emailKey);
    retryTimersRef.current[emailKey] = setTimeout(() => {
      delete retryTimersRef.current[emailKey];
      retryFn().catch((err: unknown) => {
        handleRetryError(err, emailKey, nextAttempt);
      });
    }, delay);
  }, [clearRetryTimer, handleRetryError]);

  /**
   * Creates a retry function for fetching credentials with exponential backoff
   * @param emailKey - Email key to fetch credentials for
   * @returns Function that attempts to fetch credentials with retry logic
   */
  const createAttemptFetchWithRetry = useCallback((emailKey: string): (attempt?: number) => Promise<void> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [500, 1000, 2000]; // Exponential backoff: 500ms, 1s, 2s
    
    const attemptFetchWithRetry = async (attempt: number = 0): Promise<void> => {
      const currentAttempt = attempt;
      try {
        const creds = await fetchCredentialsForEmail(emailKey);
        if (creds) {
          setCredsMap(prev => ({
            ...prev,
            [emailKey]: { ...creds, loading: true }
          }));
          logDebug('[useIsolatedStreams] Token fetched for pending status, keeping loading state', {
            email: emailKey,
            attempt: currentAttempt,
          });
          clearRetryTimer(emailKey);
          return;
        }
        
        if (currentAttempt < MAX_RETRIES) {
          const delay: number = RETRY_DELAYS[currentAttempt] ?? RETRY_DELAYS.at(-1) ?? 2000;
          logDebug('[useIsolatedStreams] Token not available yet, scheduling retry', {
            email: emailKey,
            attempt: currentAttempt + 1,
            delayMs: delay,
          });
          
          const nextAttemptNumber = currentAttempt + 1;
          scheduleRetryAttempt(emailKey, nextAttemptNumber, delay, async () => {
            await attemptFetchWithRetry(nextAttemptNumber);
          });
        } else {
          logDebug('[useIsolatedStreams] Max retries reached, waiting for started status', {
            email: emailKey,
            attempt: currentAttempt,
          });
          clearRetryTimer(emailKey);
        }
      } catch (error) {
        logError('[useIsolatedStreams] Failed to fetch token for pending status', { error, email: emailKey, attempt: currentAttempt });
        clearRetryTimer(emailKey);
        if (currentAttempt >= MAX_RETRIES) {
          setLoadingFalseAfterMaxRetries(emailKey);
        }
      }
    };
    
    return attemptFetchWithRetry;
  }, [clearRetryTimer, handleRetryError, setLoadingFalseAfterMaxRetries, scheduleRetryAttempt]);

  /**
   * Handles pending timeout
   * @param emailKey - Email key that timed out
   */
  const handlePendingTimeout = useCallback((emailKey: string): void => {
    const current = credsMapRef.current[emailKey];
    if (current?.accessToken) {
      clearPendingTimer(emailKey);
      return;
    }
    logWarn('[useIsolatedStreams] Pending status timeout, but keeping loading state - waiting for started/failed message', { email: emailKey });
    clearPendingTimer(emailKey);
  }, [clearPendingTimer]);

  /**
   * Handles start connection timeout
   * @param emailKey - Email key that timed out
   */
  const handleStartConnectionTimeout = useCallback((emailKey: string): void => {
    setCredsMap(prev => {
      const current = prev[emailKey];
      if (!current) return prev;
      
      if (current.loading && !current.accessToken) {
        logWarn('[useIsolatedStreams] Start connection timeout - no started message received within 15 seconds', { email: emailKey });
        return {
          ...prev,
          [emailKey]: { ...current, loading: false }
        };
      }
      return prev;
    });
  }, []);

  /**
   * Updates credsMap with statusInfo for a single email
   * @param emailKey - Email key to update
   * @param statusInfo - Status info to set
   */
  const updateCredsWithStatusInfo = useCallback((emailKey: string, statusInfo: StreamingStatusInfo): void => {
    setCredsMap(prev => {
      const existing = prev[emailKey] ?? { loading: false };
      return {
        ...prev,
        [emailKey]: { ...existing, statusInfo }
      };
    });
  }, []);

  /**
   * Handles stop status timeout by fetching batch status
   * @param emailKey - Email key to fetch status for
   */
  const handleStopStatusTimeout = useCallback(async (emailKey: string): Promise<void> => {
    try {
      const currentCreds = credsMapRef.current?.[emailKey];
      if (currentCreds?.statusInfo) {
        logDebug('StatusInfo already set via event, skipping batch fetch', { email: emailKey });
        delete stopStatusTimersRef.current[emailKey];
        return;
      }
      
      const resp = await fetchStreamingStatusBatch([emailKey]);
      const map = buildStatusMap(resp.statuses);
      const statusInfo = map[emailKey];
      if (!statusInfo) {
        delete stopStatusTimersRef.current[emailKey];
        return;
      }
      updateCredsWithStatusInfo(emailKey, statusInfo);
    } catch (error) {
      logError('Failed to fetch status after STOP', { error, email: emailKey });
    } finally {
      delete stopStatusTimersRef.current[emailKey];
    }
  }, [updateCredsWithStatusInfo]);

  /**
   * Updates credsMap with status info for multiple emails
   * @param emails - Array of emails to update
   * @param statusMap - Map of email to status info
   */
  const updateCredsMapWithStatusInfo = useCallback((emails: string[], statusMap: Record<string, StreamingStatusInfo>): void => {
    setCredsMap(prev => {
      const next = { ...prev } as CredsMap;
      emails.forEach(email => {
        const key = email.toLowerCase();
        const existing = next[key] ?? { loading: false };
        const statusInfo = statusMap[key];
        if (statusInfo) {
          next[key] = { ...existing, statusInfo };
        } else if (!next[key]) {
          next[key] = existing;
        }
      });
      return next;
    });
  }, []);

  /**
   * Merges new credentials into credsMap for specified emails
   * @param newCreds - New credentials map
   * @param targetEmails - Emails to merge credentials for
   */
  const mergeNewCredentials = useCallback((newCreds: CredsMap, targetEmails: string[]): void => {
    setCredsMap((prev) => {
      const merged = { ...prev };
      Object.keys(newCreds).forEach(key => {
        if (targetEmails.includes(key)) {
          merged[key] = newCreds[key];
        }
      });
      return merged;
    });
  }, []);

  /**
   * Handles error when refreshing token fails
   * @param emailKey - Email key that failed
   */
  const handleRefreshTokenError = useCallback((emailKey: string): void => {
    setCredsMap(prev => {
      const current = prev[emailKey];
      if (!current) return prev;
      return {
        ...prev,
        [emailKey]: { ...current, loading: false }
      };
    });
  }, []);

  useStreamInitialization({
    emails,
    credsMapRef,
    setCredsMap,
    updateCredsMapWithStatusInfo,
    isInitializedRef,
  });

  useStreamEmailChanges({
    emails,
    emailsRef,
    credsMapRef,
    lastEmailsRef,
    setCredsMap,
    updateCredsMapWithStatusInfo,
    mergeNewCredentials,
    clearPendingTimer,
    clearRetryTimer,
    clearStartConnectionTimer,
    clearOne,
  });

  useStreamWebSocketGroups({
    viewerEmail,
    emailsRef,
    joinedGroupsRef,
    emails,
  });

  useStreamSessionEvents({
    emailsRef,
    setCredsMap,
    clearStopStatusTimer,
  });

  useStreamWebSocketMessages({
    emailsRef,
    credsMapRef,
    setCredsMap,
    pendingTimersRef,
    stopStatusTimersRef,
    startConnectionTimersRef,
    fetchingTokensRef,
    canceledUsersRef,
    clearPendingTimer,
    clearRetryTimer,
    clearStartConnectionTimer,
    clearStopStatusTimer,
    clearOne,
    createAttemptFetchWithRetry,
    handlePendingTimeout,
    handleStartConnectionTimeout,
    handleStopStatusTimeout,
    refreshTokenForEmail,
    handleRefreshTokenError,
    wsHandlerRegisteredRef,
  });

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return credsMap;
}


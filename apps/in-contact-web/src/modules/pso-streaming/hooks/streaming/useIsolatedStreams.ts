/**
 * @fileoverview useIsolatedStreams hook
 * @summary Isolated hook for managing stream credentials
 * @description Manages LiveKit stream credentials for multiple PSOs independently of presence store changes.
 * Only updates when necessary, integrates batch status for users without active tokens.
 * Handles WebSocket messages, timers, and status updates efficiently.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { fetchStreamingStatusBatch } from '../../api/streamingStatusBatchClient';
import { StreamingStatus, StreamingStopReason } from '../../enums';
import type { CredsMap, StreamCreds, StreamingStatusInfo } from '../../types';
import { STOP_STATUS_FETCH_DELAY_MS, INIT_FETCH_DELAY_MS, PENDING_TIMEOUT_MS } from '../../constants';
import { logDebug, logError, logWarn } from '@/shared/utils/logger';
import {
  buildStatusMap,
  parseWebSocketMessage,
  fetchAndDistributeCredentials,
  fetchCredentialsForEmail,
  getStatusFromStopReason,
} from './utils';

/**
 * Completely isolated hook for streams
 * NOT affected by presence store changes
 * Only updates when really necessary
 * Integrates batch status for users without active tokens
 * 
 * @param viewerEmail - Email of the viewer (current user)
 * @param emails - Array of PSO emails to manage streams for
 * @returns Map of email to stream credentials
 */
export function useIsolatedStreams(viewerEmail: string, emails: string[]): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const credsMapRef = useRef<CredsMap>({}); // Keep ref for current credsMap to check in timers
  const canceledUsersRef = useRef<Set<string>>(new Set());
  const emailsRef = useRef<string[]>([]); // Keep latest emails without retriggering effects
  const joinedGroupsRef = useRef<Set<string>>(new Set()); // Track joined WS groups
  const wsHandlerRegisteredRef = useRef<boolean>(false); // Ensure single WS handler registration
  const isInitializedRef = useRef(false);
  const lastEmailsRef = useRef<string[]>([]);
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const stopStatusTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({}); // Track STOP status fetch timers
  const fetchingTokensRef = useRef<Set<string>>(new Set()); // Track emails currently fetching tokens to prevent duplicate calls
  const retryTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({}); // Track retry timers for pending token fetches
  
  useEffect(() => {
    credsMapRef.current = credsMap;
  }, [credsMap]);

  const refreshTokenForEmail = useCallback(async (email: string): Promise<void> => {
    const key = email.toLowerCase();
    
    // Prevent duplicate concurrent calls for the same email
    if (fetchingTokensRef.current.has(key)) {
      logDebug('[useIsolatedStreams] Token fetch already in progress, skipping duplicate call', { email: key });
      return;
    }
    
    fetchingTokensRef.current.add(key);
    
    try {
      const creds = await fetchCredentialsForEmail(email);
      fetchingTokensRef.current.delete(key);
      
      if (!creds) {
        // No creds found - update state to remove loading flag
        // This ensures state is consistent even when token is not available
        setCredsMap((prev) => {
          const currentCreds = prev[key];
          if (!currentCreds || currentCreds.loading === false) {
            return prev; // Already in correct state or no current creds
          }
          // Update loading state to false even if no token
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
      
      // On error, ensure loading state is set to false
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

  const clearPendingTimer = useCallback((email: string): void => {
    const key = email.toLowerCase();
    const timer = pendingTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete pendingTimersRef.current[key];
    }
  }, []);

  const clearStopStatusTimer = useCallback((email: string): void => {
    const key = email.toLowerCase();
    const timer = stopStatusTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete stopStatusTimersRef.current[key];
    }
  }, []);

  const clearRetryTimer = useCallback((email: string): void => {
    const key = email.toLowerCase();
    const timer = retryTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete retryTimersRef.current[key];
    }
  }, []);

  useEffect(() => {
    if (isInitializedRef.current || emails.length === 0) return;
    
    isInitializedRef.current = true;
    
    (async () => {
      try {
        const batch = await fetchStreamingStatusBatch(emails.map(e => e.toLowerCase()));
        const map = buildStatusMap(batch.statuses);
        setCredsMap(prev => {
          const next = { ...prev } as CredsMap;
          emails.forEach(email => {
            const key = email.toLowerCase();
            const existing = next[key] ?? { loading: false };
            const statusInfo = map[key];
            if (statusInfo) {
              next[key] = { ...existing, statusInfo };
            } else if (!next[key]) {
              next[key] = existing;
            }
          });
          return next;
        });
      } catch (error) {
        logWarn('Failed to fetch batch status on init', { error });
      }
    })();

    const fetchSessionsAndTokens = async (): Promise<void> => {
      try {
        const newCreds = await fetchAndDistributeCredentials(emails, credsMapRef.current);
        setCredsMap(newCreds);
      } catch (error) {
        logError('Error in initialization', { error });
      }
    };
    
    setTimeout(() => void fetchSessionsAndTokens(), INIT_FETCH_DELAY_MS);
  }, [emails]);

  useEffect(() => {
    emailsRef.current = emails.map(e => e.toLowerCase());

    const prev = lastEmailsRef.current;
    const curr = emails.map(e => e.toLowerCase());
    
    const toJoin = curr.filter(e => !prev.includes(e));
    const toLeave = prev.filter(e => !curr.includes(e));
    
    lastEmailsRef.current = curr;
    
    if (toJoin.length > 0) {
      (async () => {
        try {
          const batch = await fetchStreamingStatusBatch(toJoin);
          const map = buildStatusMap(batch.statuses);
          setCredsMap(prev => {
            const next = { ...prev } as CredsMap;
            toJoin.forEach(email => {
              const key = email.toLowerCase();
              const existing = next[key] ?? { loading: false };
              const statusInfo = map[key];
              if (statusInfo) next[key] = { ...existing, statusInfo };
              else if (!next[key]) next[key] = existing;
            });
            return next;
          });
        } catch {
          // Ignore
        }
      })();
    }

    if (toJoin.length > 0) {
      const fetchNewSessions = async (): Promise<void> => {
        try {
          const newCreds = await fetchAndDistributeCredentials(toJoin, credsMapRef.current);
          setCredsMap((prev) => {
            const merged = { ...prev };
            Object.keys(newCreds).forEach(key => {
              if (toJoin.includes(key)) {
                merged[key] = newCreds[key];
              }
            });
            return merged;
          });
        } catch (error) {
          logError('Error fetching new sessions', { error });
        }
      };
      
      setTimeout(() => void fetchNewSessions(), INIT_FETCH_DELAY_MS);
    }
    
    if (toLeave.length > 0) {
      toLeave.forEach(email => {
        clearPendingTimer(email);
        clearRetryTimer(email);
        clearOne(email);
      });
    }
  }, [emails, clearOne, clearPendingTimer, clearRetryTimer]);

  useEffect(() => {
    const joinMissingGroups = async (): Promise<void> => {
      try {
        await webSocketService.connect(viewerEmail);
        for (const email of emailsRef.current) {
          if (!joinedGroupsRef.current.has(email)) {
            try {
              await webSocketService.joinGroup(email);
              joinedGroupsRef.current.add(email);
            } catch {
              // Ignore join errors
            }
          }
        }
      } catch (error) {
        logWarn('Failed to join WebSocket groups', { error });
      }
    };
    void joinMissingGroups();
  }, [viewerEmail, emails.join(',')]);

  useEffect(() => {
    const handleStreamingSessionUpdate = (event: CustomEvent): void => {
      const { session } = event.detail;
      if (!session || !session.email) return;
      
      const emailKey = String(session.email).toLowerCase();
      const currentEmails = emailsRef.current;
      
      if (!currentEmails.includes(emailKey)) {
        return;
      }
      
      logDebug('Streaming session updated via event', { email: emailKey });
      
      if (session.stoppedAt) {
        const stopReason = session.stopReason;
        const stoppedAt = session.stoppedAt;
        const userStatus = getStatusFromStopReason(stopReason);
        
        const statusInfo: StreamingStatusInfo = {
          email: session.email,
          status: userStatus,
          lastSession: {
            stopReason: stopReason as StreamingStopReason | null,
            stoppedAt: stoppedAt
          }
        };
        
        setCredsMap(prev => ({
          ...prev,
          [emailKey]: {
            ...(prev[emailKey] ?? { loading: false }),
            statusInfo
          }
        }));
        
        clearStopStatusTimer(emailKey);
      } else {
        setCredsMap(prev => {
          const current = prev[emailKey];
          if (!current) return prev;
          const { statusInfo, ...rest } = current;
          return {
            ...prev,
            [emailKey]: rest
          };
        });
      }
    };
    
    window.addEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    };
  }, [clearStopStatusTimer]);

  useEffect(() => {
    if (wsHandlerRegisteredRef.current) {
      return;
    }

    const handleMessage = (msg: unknown): void => {
      logDebug('WebSocket message received', { msg });
      
      const parsed = parseWebSocketMessage(msg);
      const currentEmails = emailsRef.current;
      
      if (!parsed.targetEmail || !currentEmails.includes(parsed.targetEmail)) {
        return;
      }

      if (parsed.pending) {
        const key = parsed.targetEmail;
        clearPendingTimer(key);
        clearRetryTimer(key); // Clear any existing retry timers
        
        logDebug('[useIsolatedStreams] Received pending status, starting optimistic connection', {
          email: key,
        });
        
        // Mark as loading immediately
        setCredsMap(prev => ({
          ...prev,
          [key]: { ...(prev[key] ?? {}), loading: true }
        }));

        // Optimistic connection: start fetching access token with retry logic
        // The first call might return null because session isn't created yet, so we retry with backoff
        const attemptFetchWithRetry = async (attempt: number = 0): Promise<void> => {
          const MAX_RETRIES = 3;
          const RETRY_DELAYS = [500, 1000, 2000]; // Exponential backoff: 500ms, 1s, 2s
          
          try {
            const creds = await fetchCredentialsForEmail(key);
            if (creds) {
              // Token fetched successfully - keep loading: true until 'started' message arrives
              const currentCreds = credsMapRef.current[key] ?? {};
              setCredsMap(prev => ({
                ...prev,
                [key]: { ...creds, loading: true }
              }));
              logDebug('[useIsolatedStreams] Token fetched for pending status, keeping loading state', {
                email: key,
                attempt,
              });
              clearRetryTimer(key);
              return;
            }
            
            // Token not available yet (session not created)
            if (attempt < MAX_RETRIES) {
              const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
              logDebug('[useIsolatedStreams] Token not available yet, scheduling retry', {
                email: key,
                attempt: attempt + 1,
                delayMs: delay,
              });
              
              clearRetryTimer(key);
              retryTimersRef.current[key] = setTimeout(() => {
                delete retryTimersRef.current[key];
                void attemptFetchWithRetry(attempt + 1);
              }, delay);
            } else {
              // Max retries reached, keep loading state and wait for 'started' message
              logDebug('[useIsolatedStreams] Max retries reached, waiting for started status', {
                email: key,
                attempt,
              });
              clearRetryTimer(key);
            }
          } catch (error) {
            logError('[useIsolatedStreams] Failed to fetch token for pending status', { error, email: key, attempt });
            clearRetryTimer(key);
            // Don't set loading to false yet - wait for 'started' message or timeout
            if (attempt >= MAX_RETRIES) {
              // Only set loading to false if we've exhausted retries and there's an error
              setCredsMap(prev => {
                const current = prev[key];
                if (!current) return prev;
                return {
                  ...prev,
                  [key]: { ...current, loading: false }
                };
              });
            }
          }
        };
        
        void attemptFetchWithRetry();

        // Fallback timeout if status never changes to 'started' and token fetch fails
        // Note: We don't set loading: false here because the 'started' message might arrive soon after.
        // Only the 'failed' message should set loading: false.
        pendingTimersRef.current[key] = setTimeout(() => {
          setCredsMap(prev => {
            const current = prev[key];
            // If we have token, keep it (optimistic worked)
            if (current?.accessToken) {
              clearPendingTimer(key);
              return prev; // Already connected, token available
            }
            // Don't set loading to false on timeout - wait for 'started' or 'failed' message
            // This prevents flickering when 'started' arrives right after timeout
            logWarn('[useIsolatedStreams] Pending status timeout, but keeping loading state - waiting for started/failed message', { email: key });
            return prev; // Keep loading: true, wait for 'started' or 'failed' message
          });
          clearPendingTimer(key);
        }, PENDING_TIMEOUT_MS);
        return;
      }

      if (parsed.failed) {
        const key = parsed.targetEmail;
        clearPendingTimer(key);
        setCredsMap(prev => {
          const current = prev[key] ?? {};
          return {
            ...prev,
            [key]: { ...current, loading: false }
          };
        });
        return;
      }

      if (parsed.started === true) {
        clearPendingTimer(parsed.targetEmail);
        clearRetryTimer(parsed.targetEmail);
        if (canceledUsersRef.current.has(parsed.targetEmail)) {
          const ns = new Set(canceledUsersRef.current);
          ns.delete(parsed.targetEmail);
          canceledUsersRef.current = ns;
        }
        
        const emailKey = parsed.targetEmail;
        clearStopStatusTimer(emailKey);
        
        // Check current state using ref to avoid unnecessary state updates
        const currentCreds = credsMapRef.current[emailKey];
        
        if (fetchingTokensRef.current.has(emailKey)) {
          // Token fetch already in progress, wait for it to complete
          // The fetch will update the state when it completes in refreshTokenForEmail
          // We just need to ensure loading state is correct while waiting
          logDebug('[useIsolatedStreams] Token fetch already in progress for started status, ensuring loading state is correct', {
            email: emailKey,
          });
          
          // Ensure loading state reflects that we're waiting for token
          setCredsMap(prev => {
            const current = prev[emailKey];
            if (!current) {
              return {
                ...prev,
                [emailKey]: { loading: true }
              };
            }
            // If already loading, keep it loading until fetch completes
            // If not loading but we have accessToken, keep it (token from previous fetch)
            // If not loading and no accessToken, mark as loading (waiting for fetch)
            if (current.loading || current.accessToken) {
              return prev; // Already in correct state
            }
            // Not loading and no token - mark as loading while waiting
            return {
              ...prev,
              [emailKey]: { ...current, loading: true }
            };
          });
          
          // The fetch will complete and update the state automatically
          // When refreshTokenForEmail completes, it will set loading: false and update the token
          return;
        }
        
        if (currentCreds?.accessToken) {
          // Token already available (from optimistic fetch or previous call), just update loading state if needed
          logDebug('[useIsolatedStreams] Token already available, updating loading state', {
            email: emailKey,
          });
          setCredsMap(prev => {
            const current = prev[emailKey];
            if (!current || current.loading === false) {
              return prev; // No change needed
            }
            return {
              ...prev,
              [emailKey]: { ...current, loading: false }
            };
          });
        } else {
          // Token not available and no fetch in progress, fetch it now
          setCredsMap(prev => ({
            ...prev,
            [emailKey]: { ...(prev[emailKey] ?? {}), loading: true }
          }));
          
          void refreshTokenForEmail(emailKey).catch((error) => {
            logError('[useIsolatedStreams] Failed to fetch token after started status', { error, email: emailKey });
            setCredsMap(prev => {
              const current = prev[emailKey];
              if (!current) return prev;
              return {
                ...prev,
                [emailKey]: { ...current, loading: false }
              };
            });
          });
        }
      } else if (parsed.started === false) {
        clearPendingTimer(parsed.targetEmail);
        clearStopStatusTimer(parsed.targetEmail);
        
        const ns = new Set(canceledUsersRef.current);
        ns.add(parsed.targetEmail);
        canceledUsersRef.current = ns;
        clearOne(parsed.targetEmail);
        
        const emailKey = parsed.targetEmail;
        
        if (!stopStatusTimersRef.current[emailKey]) {
          stopStatusTimersRef.current[emailKey] = setTimeout(async () => {
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
              setCredsMap(prev => ({
                ...prev,
                [emailKey]: { ...(prev[emailKey] ?? { loading: false }), statusInfo }
              }));
            } catch (error) {
              logError('Failed to fetch status after STOP', { error, email: emailKey });
            } finally {
              delete stopStatusTimersRef.current[emailKey];
            }
          }, 1000);
        }
      }
    };

    const unsubscribe = webSocketService.onMessage(handleMessage);
    wsHandlerRegisteredRef.current = true;
    
    return () => {
      unsubscribe();
      wsHandlerRegisteredRef.current = false;
    };
  }, [viewerEmail, clearPendingTimer, clearStopStatusTimer, clearOne]);

  useEffect(() => {
    return () => {
      Object.values(pendingTimersRef.current).forEach(clearTimeout);
      pendingTimersRef.current = {};
      Object.values(stopStatusTimersRef.current).forEach(clearTimeout);
      stopStatusTimersRef.current = {};
      Object.values(retryTimersRef.current).forEach(clearTimeout);
      retryTimersRef.current = {};
    };
  }, []);

  return credsMap;
}


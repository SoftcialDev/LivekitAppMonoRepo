/**
 * @fileoverview useStreamingStatusBatch - Hook for batch streaming status queries
 * @summary Manages streaming status for users without active tokens
 * @description Provides streaming status information for users who are not currently streaming
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStreamingStatusBatch, UserStreamingStatus } from '@/shared/api/streamingStatusBatchClient';

/**
 * Streaming status for a user without active session
 */
export interface UserStreamingStatusInfo {
  email: string;
  status: 'on_break' | 'disconnected' | 'offline';
  lastSession: {
    stopReason: string | null;
    stoppedAt: string | null;
  } | null;
}

/**
 * Hook for managing batch streaming status queries
 * @param emails - Array of email addresses to query
 * @returns Object containing status map and loading state
 */
export function useStreamingStatusBatch(emails: string[]): {
  statusMap: Record<string, UserStreamingStatusInfo>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [statusMap, setStatusMap] = useState<Record<string, UserStreamingStatusInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const cacheTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Fetches streaming status for provided emails
   * @param targetEmails - Array of email addresses to query
   */
  const fetchStatus = useCallback(async (targetEmails: string[]) => {
    if (targetEmails.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchStreamingStatusBatch(targetEmails);
      
      const newStatusMap: Record<string, UserStreamingStatusInfo> = {};
      
      response.statuses.forEach((status: UserStreamingStatus) => {
        const email = status.email.toLowerCase();
        let userStatus: 'on_break' | 'disconnected' | 'offline';
        
        if (status.hasActiveSession) {
          // This shouldn't happen for users without tokens, but handle gracefully
          userStatus = 'offline';
        } else if (status.lastSession) {
          // Determine status based on stop reason
          if (status.lastSession.stopReason === 'COMMAND') {
            userStatus = 'on_break';
          } else if (status.lastSession.stopReason === 'DISCONNECT') {
            userStatus = 'disconnected';
          } else {
            userStatus = 'offline';
          }
        } else {
          userStatus = 'offline';
        }

        newStatusMap[email] = {
          email: status.email,
          status: userStatus,
          lastSession: status.lastSession
        };
      });

      setStatusMap(prev => ({ ...prev, ...newStatusMap }));
      lastFetchRef.current = Date.now();
      
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch streaming status batch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetches streaming status for all emails
   */
  const refetch = useCallback(async () => {
    await fetchStatus(emails);
  }, [emails, fetchStatus]);

  /**
   * Effect to fetch status when emails change
   */
  useEffect(() => {
    if (emails.length === 0) return;

    // Clear existing cache timeout
    if (cacheTimeoutRef.current) {
      clearTimeout(cacheTimeoutRef.current);
    }

    // Check if we need to fetch (cache for 30 seconds)
    const now = Date.now();
    const shouldFetch = now - lastFetchRef.current > 30000;

    if (shouldFetch) {
      fetchStatus(emails);
    } else {
      // Set timeout to refetch when cache expires
      cacheTimeoutRef.current = setTimeout(() => {
        fetchStatus(emails);
      }, 30000 - (now - lastFetchRef.current));
    }

    return () => {
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current);
      }
    };
  }, [emails, fetchStatus]);

  return {
    statusMap,
    loading,
    error,
    refetch
  };
}

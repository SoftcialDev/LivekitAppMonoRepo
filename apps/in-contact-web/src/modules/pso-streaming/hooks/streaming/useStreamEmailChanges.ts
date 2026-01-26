/**
 * @fileoverview useStreamEmailChanges - Hook for handling PSO email list changes
 * @description Monitors changes in the PSO email list and handles initialization for new PSOs
 * and cleanup for removed PSOs. Fetches streaming status and credentials for newly added PSOs.
 */

import { useEffect } from 'react';
import { fetchStreamingStatusBatch } from '../../api/streamingStatusBatchClient';
import { INIT_FETCH_DELAY_MS } from '../../constants';
import { logError, logDebug } from '@/shared/utils/logger';
import { buildStatusMap, fetchAndDistributeCredentials } from './utils';
import type { IUseStreamEmailChangesOptions } from './types/useStreamEmailChangesTypes';

/**
 * Handles changes in the PSO email list by fetching status and credentials for new PSOs
 * and cleaning up resources for removed PSOs
 * @param options - Configuration options including email lists, refs, and callback functions
 */
export function useStreamEmailChanges(options: IUseStreamEmailChangesOptions): void {
  const {
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
  } = options;

  useEffect(() => {
    emailsRef.current = emails.map(e => e.toLowerCase());

    const prev = lastEmailsRef.current;
    const curr = emails.map(e => e.toLowerCase());
    
    const toJoin = curr.filter(e => !prev.includes(e));
    const toLeave = prev.filter(e => !curr.includes(e));
    
    lastEmailsRef.current = curr;
    
    if (toJoin.length > 0) {
      logDebug('[useStreamEmailChanges] New PSOs detected, fetching status and credentials', { 
        newPSOs: toJoin,
        totalPSOs: curr.length 
      });
      
      (async () => {
        try {
          const batch = await fetchStreamingStatusBatch(toJoin);
          const map = buildStatusMap(batch.statuses);
          updateCredsMapWithStatusInfo(toJoin, map);
        } catch (error) {
          logError('[useStreamEmailChanges] Failed to fetch batch status for new PSOs', { error, emails: toJoin });
        }
      })();
    }

    if (toJoin.length > 0) {
      const fetchNewSessions = async (): Promise<void> => {
        try {
          const newCreds = await fetchAndDistributeCredentials(toJoin, credsMapRef.current);
          mergeNewCredentials(newCreds, toJoin);
          logDebug('[useStreamEmailChanges] Successfully fetched credentials for new PSOs', { emails: toJoin });
        } catch (error) {
          logError('[useStreamEmailChanges] Error fetching new sessions', { error, emails: toJoin });
        }
      };
      
      setTimeout(() => {
        fetchNewSessions().catch((err: unknown) => {
          logError('[useStreamEmailChanges] Error in fetchNewSessions', { error: err, emails: toJoin });
        });
      }, INIT_FETCH_DELAY_MS);
    }
    
    if (toLeave.length > 0) {
      logDebug('[useStreamEmailChanges] PSOs removed, cleaning up', { removedPSOs: toLeave });
      toLeave.forEach(email => {
        clearPendingTimer(email);
        clearRetryTimer(email);
        clearStartConnectionTimer(email);
        clearOne(email);
      });
    }
  }, [
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
  ]);
}


/**
 * @fileoverview useStreamEmailChanges hook
 * @description Handles email list changes: fetching status for new emails and cleaning up removed emails
 */

import { useEffect } from 'react';
import { fetchStreamingStatusBatch } from '../../api/streamingStatusBatchClient';
import { INIT_FETCH_DELAY_MS } from '../../constants';
import { logError } from '@/shared/utils/logger';
import { buildStatusMap, fetchAndDistributeCredentials } from './utils';
import type { IUseStreamEmailChangesOptions } from './types/useStreamEmailChangesTypes';

/**
 * Handles email list changes: fetching status for new emails and cleaning up removed emails
 * @param options - Configuration options for email changes handling
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
      (async () => {
        try {
          const batch = await fetchStreamingStatusBatch(toJoin);
          const map = buildStatusMap(batch.statuses);
          updateCredsMapWithStatusInfo(toJoin, map);
        } catch {
          // Ignore
        }
      })();
    }

    if (toJoin.length > 0) {
      const fetchNewSessions = async (): Promise<void> => {
        try {
          const newCreds = await fetchAndDistributeCredentials(toJoin, credsMapRef.current);
          mergeNewCredentials(newCreds, toJoin);
        } catch (error) {
          logError('Error fetching new sessions', { error });
        }
      };
      
      setTimeout(() => {
        fetchNewSessions().catch((err: unknown) => {
          logError('[useStreamEmailChanges] Error in fetchNewSessions', { error: err });
        });
      }, INIT_FETCH_DELAY_MS);
    }
    
    if (toLeave.length > 0) {
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


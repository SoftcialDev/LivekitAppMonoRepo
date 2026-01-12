/**
 * @fileoverview useStreamInitialization hook
 * @description Handles initial batch status fetch and credential loading
 */

import { useEffect } from 'react';
import { fetchStreamingStatusBatch } from '../../api/streamingStatusBatchClient';
import { INIT_FETCH_DELAY_MS } from '../../constants';
import { logError, logWarn } from '@/shared/utils/logger';
import { buildStatusMap, fetchAndDistributeCredentials } from './utils';
import type { IUseStreamInitializationOptions } from './types/useStreamInitializationTypes';

/**
 * Handles initial batch status fetch and credential loading
 * @param options - Configuration options for initialization
 */
export function useStreamInitialization(options: IUseStreamInitializationOptions): void {
  const {
    emails,
    credsMapRef,
    setCredsMap,
    updateCredsMapWithStatusInfo,
    isInitializedRef,
  } = options;

  useEffect(() => {
    if (isInitializedRef.current || emails.length === 0) return;
    
    isInitializedRef.current = true;
    
    (async () => {
      try {
        const batch = await fetchStreamingStatusBatch(emails.map(e => e.toLowerCase()));
        const map = buildStatusMap(batch.statuses);
        updateCredsMapWithStatusInfo(emails, map);
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
    
    setTimeout(() => {
      fetchSessionsAndTokens().catch((err: unknown) => {
        logError('[useStreamInitialization] Error in fetchSessionsAndTokens', { error: err });
      });
    }, INIT_FETCH_DELAY_MS);
  }, [emails, credsMapRef, setCredsMap, updateCredsMapWithStatusInfo, isInitializedRef]);
}


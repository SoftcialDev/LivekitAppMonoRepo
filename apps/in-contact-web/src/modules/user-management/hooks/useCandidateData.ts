/**
 * @fileoverview useCandidateData Hook
 * @summary Hook for fetching and managing candidate data
 * @description Provides state and handlers for fetching candidates
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import type {
  BaseUserManagementItem,
  CandidateUser,
  UserManagementConfig,
} from '../types';
import type { UseCandidateDataReturn } from './types/useCandidateDataTypes';

/**
 * Hook for fetching and managing candidate data
 *
 * Provides state and handlers for fetching candidates from API.
 * Handles loading state and error notifications.
 * Optionally filters out current user from candidates (for ContactManager).
 *
 * @template T - Type of items being managed (must extend BaseUserManagementItem)
 * @param config - Configuration object with API functions
 * @param filterCurrentUser - Whether to filter out current user (default: false)
 * @returns Hook return value with candidates state and fetch handler
 *
 * @example
 * ```typescript
 * const { candidates, candidatesLoading, fetchCandidates } = useCandidateData(config, true);
 * ```
 */
export function useCandidateData<T extends BaseUserManagementItem>(
  config: UserManagementConfig<T>,
  filterCurrentUser: boolean = false
): UseCandidateDataReturn {
  const { account } = useAuth();
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const fetchCandidates = useCallback(async (): Promise<void> => {
    setCandidatesLoading(true);
    try {
      const fetchedCandidates = await config.api.fetchCandidates();
      
      // Filter out current user if requested (for ContactManager)
      let filtered = fetchedCandidates;
      if (filterCurrentUser && account?.username) {
        const currentEmail = account.username.toLowerCase();
        filtered = fetchedCandidates.filter(
          (user) => user.email?.toLowerCase() !== currentEmail
        );
      }
      
      setCandidates(filtered);
    } catch (error) {
      logError('Failed to fetch candidate users', {
        error,
        title: config.ui.title,
      });
      showToast('Failed to load candidate users', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  }, [config.api, config.ui, showToast, filterCurrentUser, account]);

  return {
    candidates,
    candidatesLoading,
    fetchCandidates,
  };
}


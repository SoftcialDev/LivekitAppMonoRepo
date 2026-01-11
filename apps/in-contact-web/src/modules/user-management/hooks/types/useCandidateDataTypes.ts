/**
 * @fileoverview useCandidateData Hook Types
 * @summary Type definitions for useCandidateData hook
 */

import type { CandidateUser } from '../../types';

/**
 * Return type from useCandidateData hook
 */
export interface UseCandidateDataReturn {
  /**
   * Candidate users for add modal
   */
  candidates: CandidateUser[];

  /**
   * Whether candidates are currently loading
   */
  candidatesLoading: boolean;

  /**
   * Fetches candidates from API
   */
  fetchCandidates: () => Promise<void>;
}


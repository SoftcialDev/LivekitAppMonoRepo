/**
 * @fileoverview useCandidateSelection Hook
 * @summary Hook for managing candidate selection in add modal
 * @description Provides state and handlers for selecting candidates
 */

import { useState, useCallback } from 'react';
import type { UseCandidateSelectionReturn } from './types/useCandidateSelectionTypes';

/**
 * Hook for managing candidate selection in add modal
 *
 * Provides state and handlers for managing selected candidate emails.
 * Handles individual selection, select all, and deselection.
 *
 * @returns Hook return value with selection state and handlers
 *
 * @example
 * ```typescript
 * const { selectedEmails, setSelectedEmails, clearSelection } = useCandidateSelection();
 * ```
 */
export function useCandidateSelection(): UseCandidateSelectionReturn {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const clearSelection = useCallback((): void => {
    setSelectedEmails([]);
  }, []);

  return {
    selectedEmails,
    setSelectedEmails,
    clearSelection,
  };
}


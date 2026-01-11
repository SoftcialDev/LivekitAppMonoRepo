/**
 * @fileoverview useCandidateSelection Hook Types
 * @summary Type definitions for useCandidateSelection hook
 */

/**
 * Return type from useCandidateSelection hook
 */
export interface UseCandidateSelectionReturn {
  /**
   * Currently selected candidate emails
   */
  selectedEmails: string[];

  /**
   * Updates selected candidate emails
   */
  setSelectedEmails: (emails: string[]) => void;

  /**
   * Clears all selected candidates
   */
  clearSelection: () => void;
}


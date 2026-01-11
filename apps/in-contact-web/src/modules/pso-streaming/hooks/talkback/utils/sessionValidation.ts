/**
 * @fileoverview Session validation utilities
 * @summary Helper functions for validating talk sessions
 * @description Utilities for checking active sessions before starting new ones
 */

import { logWarn } from '@/shared/utils/logger';
import { TalkbackActiveSessionError } from '../../../errors';
import type { CheckActiveSessionResponse } from '../../../api/types/talkSessionClientTypes';

/**
 * Checks if a PSO already has an active talk session
 * 
 * @param checkActiveSession - Function to check active session
 * @param psoEmail - Email of the PSO to check
 * @returns Promise resolving to void if no active session, throws if active session exists
 * @throws {TalkbackActiveSessionError} If PSO already has an active talk session
 */
export async function validateNoActiveSession(
  checkActiveSession: (email: string) => Promise<CheckActiveSessionResponse>,
  psoEmail: string
): Promise<void> {
  try {
    const activeSession = await checkActiveSession(psoEmail);
    if (activeSession.hasActiveSession) {
      const supervisorDisplayName =
        activeSession.supervisorName ||
        activeSession.supervisorEmail ||
        'another supervisor';
      throw new TalkbackActiveSessionError(
        `PSO already has an active talk session with ${supervisorDisplayName}. Please wait for it to end.`
      );
    }
  } catch (checkError: unknown) {
    // If the error is about active session, propagate it
    if (
      checkError instanceof TalkbackActiveSessionError
    ) {
      throw checkError;
    }
    // Other errors (network, etc.) we ignore and continue
    logWarn('Failed to check active session, continuing anyway', { error: checkError });
  }
}


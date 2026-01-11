/**
 * @fileoverview useParticipantSetup hook
 * @summary Hook for setting up remote participants
 * @description Handles participant setup and existing tracks attachment
 */

import { useRef, useCallback } from 'react';
import type { RemoteParticipant } from 'livekit-client';
import { logDebug } from '@/shared/utils/logger';
import type {
  IUseParticipantSetupOptions,
  IUseParticipantSetupReturn,
} from '../types/participantSetupTypes';

/**
 * Hook for managing participant setup
 * @param options - Configuration options
 * @returns Participant setup functions
 */
export function useParticipantSetup(
  options: IUseParticipantSetupOptions
): IUseParticipantSetupReturn {
  const { targetIdentity, onTrackReady } = options;

  const setupParticipantsRef = useRef<Set<string>>(new Set());

  const setupParticipant = useCallback(
    (participant: RemoteParticipant): void => {
      const participantKey = participant.identity;

      if (participantKey !== targetIdentity) {
        return;
      }

      if (setupParticipantsRef.current.has(participantKey)) {
        logDebug('[useParticipantSetup] Participant already set up, skipping', {
          identity: participantKey,
          trackCount: participant.trackPublications.size,
        });
        return;
      }

      logDebug('[useParticipantSetup] Setting up participant', {
        identity: participantKey,
        trackPublicationsCount: participant.trackPublications.size,
      });

      setupParticipantsRef.current.add(participantKey);

      // Attach existing subscribed tracks
      let attachedCount = 0;
      for (const pub of participant.getTrackPublications().values()) {
        if (pub.isSubscribed && pub.track && pub.trackSid) {
          onTrackReady(pub);
          attachedCount++;
        }
      }

      logDebug('[useParticipantSetup] Participant setup complete', {
        identity: participantKey,
        tracksAttached: attachedCount,
        totalTracks: participant.trackPublications.size,
      });
    },
    [targetIdentity, onTrackReady]
  );

  const isParticipantSetup = useCallback((participantIdentity: string): boolean => {
    return setupParticipantsRef.current.has(participantIdentity);
  }, []);

  const resetParticipantSetup = useCallback((participantIdentity: string): void => {
    setupParticipantsRef.current.delete(participantIdentity);
  }, []);

  const clearAllSetups = useCallback((): void => {
    setupParticipantsRef.current.clear();
  }, []);

  return {
    setupParticipant,
    isParticipantSetup,
    resetParticipantSetup,
    clearAllSetups,
  };
}


/**
 * @fileoverview useTrackSubscriptions hook
 * @summary Hook for managing track subscription events
 * @description Handles TrackPublished and TrackSubscribed events with polling fallback
 */

import { useRef, useCallback } from 'react';
import type { RemoteParticipant } from 'livekit-client';
import { ParticipantEvent } from 'livekit-client';
import { logDebug } from '@/shared/utils/logger';
import { pollTrackSubscription } from '../utils/trackSubscriptionUtils';
import type {
  IUseTrackSubscriptionsOptions,
  IUseTrackSubscriptionsReturn,
} from '../types/trackSubscriptionTypes';

/**
 * Hook for managing track subscriptions
 * @param options - Configuration options
 * @returns Subscription management functions
 */
export function useTrackSubscriptions(
  options: IUseTrackSubscriptionsOptions
): IUseTrackSubscriptionsReturn {
  const { targetIdentity, onTrackReady } = options;

  const participantTrackHandlersRef = useRef(new Map<RemoteParticipant, (pub: any) => void>());
  const pollIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const handleTrackSubscribed = useCallback(
    (pub: any, participant: RemoteParticipant): void => {
      // Verify track is completely ready
      if (!pub.trackSid || !pub.isSubscribed || !pub.track) {
        logDebug('[useTrackSubscriptions] Track subscribed event but not ready yet', {
          trackSid: pub.trackSid,
          kind: pub.kind,
          isSubscribed: pub.isSubscribed,
          hasTrack: !!pub.track,
          participantIdentity: participant.identity,
        });
        return;
      }

      logDebug('[useTrackSubscriptions] Track subscribed event (ready)', {
        trackSid: pub.trackSid,
        kind: pub.kind,
        participantIdentity: participant.identity,
      });

      onTrackReady(pub, participant);
    },
    [onTrackReady]
  );

  const setupTrackSubscriptions = useCallback(
    (participant: RemoteParticipant): void => {
      if (participantTrackHandlersRef.current.has(participant)) {
        return;
      }

      const handler = (pub: any): void => {
        handleTrackSubscribed(pub, participant);
      };

      participantTrackHandlersRef.current.set(participant, handler);
      participant.on(ParticipantEvent.TrackSubscribed, handler);
    },
    [handleTrackSubscribed]
  );

  const handleTrackPublished = useCallback(
    (publication: any, participant: RemoteParticipant): void => {
      if (participant.identity !== targetIdentity) {
        return;
      }

      const trackSid = publication.trackSid;

      logDebug('[useTrackSubscriptions] Track published', {
        kind: publication.kind,
        isSubscribed: publication.isSubscribed,
        trackSid,
      });

      // Setup subscription handler for this participant
      setupTrackSubscriptions(participant);

      // If track is already subscribed and ready, notify immediately
      if (publication.isSubscribed && publication.track && publication.trackSid) {
        logDebug('[useTrackSubscriptions] Track published and already subscribed', {
          trackSid: publication.trackSid,
          kind: publication.kind,
        });
        onTrackReady(publication, participant);
      } else if (publication.trackSid) {
        // Track published but not subscribed yet - poll until subscribed
        logDebug('[useTrackSubscriptions] Track published but not subscribed, polling', {
          trackSid: publication.trackSid,
          kind: publication.kind,
        });

        pollTrackSubscription({
          participant,
          trackSid: publication.trackSid,
          kind: publication.kind as 'video' | 'audio',
          onSubscribed: (pub) => onTrackReady(pub, participant),
          pollIntervals: pollIntervalsRef.current,
        });
      }
    },
    [targetIdentity, setupTrackSubscriptions, onTrackReady]
  );

  const cleanup = useCallback((): void => {
    participantTrackHandlersRef.current.forEach((handler, participant) => {
      participant.off(ParticipantEvent.TrackSubscribed, handler);
    });
    participantTrackHandlersRef.current.clear();

    pollIntervalsRef.current.forEach((interval) => {
      clearInterval(interval);
    });
    pollIntervalsRef.current.clear();
  }, []);

  return {
    setupTrackSubscriptions,
    handleTrackPublished,
    cleanup,
  };
}


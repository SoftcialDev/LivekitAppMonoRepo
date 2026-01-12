/**
 * @fileoverview Track subscription utilities
 * @summary Utility functions for track subscription polling
 * @description Handles polling logic for tracks that are not yet subscribed.
 * Attempts to actively subscribe the track once, then polls quickly for 5 seconds.
 */

import { logDebug, logWarn } from '@/shared/utils/logger';
import { MAX_AUDIO_SUBSCRIPTION_DURATION_MS, AUDIO_CHECK_INTERVAL_MS } from '../constants/remoteTracksConstants';
import type { IPollTrackSubscriptionOptions } from '../types/trackSubscriptionTypes';

/**
 * Polls until a track becomes subscribed
 * Attempts to actively subscribe the track once, then polls quickly for 5 seconds
 * @param options - Polling options
 */
export function pollTrackSubscription(options: IPollTrackSubscriptionOptions): void {
  const { participant, trackSid, kind, onSubscribed, pollIntervals, onTimeout } = options;

  // Find track publication by trackSid
  const publication = Array.from(participant.getTrackPublications().values()).find(
    (pub) => pub.trackSid === trackSid && pub.kind === kind
  );

  if (!publication) {
    logWarn('[trackSubscriptionUtils] Track publication not found', { trackSid, kind });
    return;
  }

  // If already subscribed, notify immediately
  if (publication.isSubscribed && publication.track && publication.trackSid) {
    logDebug('[trackSubscriptionUtils] Track already subscribed', { trackSid, kind });
    onSubscribed(publication);
    return;
  }

  // Note: LiveKit handles subscriptions automatically. We just need to poll quickly
  // to catch when the subscription becomes available.

  const startTime = Date.now();
  let checkCount = 0;

  const checkInterval = setInterval(() => {
    checkCount++;
    const elapsed = Date.now() - startTime;

    // Find track publication again (it might have changed)
    const currentPub = Array.from(participant.getTrackPublications().values()).find(
      (pub) => pub.trackSid === trackSid && pub.kind === kind
    );

    if (currentPub?.isSubscribed && currentPub.track && currentPub.trackSid) {
      logDebug('[trackSubscriptionUtils] Track became subscribed after polling', {
        trackSid: currentPub.trackSid,
        kind,
        checkCount,
        elapsedMs: elapsed,
      });
      onSubscribed(currentPub);
      clearInterval(checkInterval);
      pollIntervals.delete(checkInterval);
    } else if (elapsed >= MAX_AUDIO_SUBSCRIPTION_DURATION_MS) {
      logWarn('[trackSubscriptionUtils] Track did not become subscribed after 5 seconds', {
        trackSid,
        kind,
        checkCount,
        elapsedMs: elapsed,
      });
      clearInterval(checkInterval);
      pollIntervals.delete(checkInterval);
      if (onTimeout) {
        onTimeout();
      }
    }
  }, AUDIO_CHECK_INTERVAL_MS);

  pollIntervals.add(checkInterval);
}


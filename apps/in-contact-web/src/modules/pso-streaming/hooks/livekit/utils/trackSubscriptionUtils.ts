/**
 * @fileoverview Track subscription utilities
 * @summary Utility functions for track subscription polling
 * @description Handles polling logic for tracks that are not yet subscribed
 */

import { logDebug, logWarn } from '@/shared/utils/logger';
import { MAX_AUDIO_CHECK_COUNT, AUDIO_CHECK_INTERVAL_MS } from '../constants/remoteTracksConstants';
import type { IPollTrackSubscriptionOptions } from '../types/trackSubscriptionTypes';

/**
 * Polls until a track becomes subscribed
 * @param options - Polling options
 */
export function pollTrackSubscription(options: IPollTrackSubscriptionOptions): void {
  const { participant, trackSid, kind, onSubscribed, pollIntervals } = options;

  let checkCount = 0;
  const checkInterval = setInterval(() => {
    checkCount++;

    // Find track publication by trackSid
    const currentPub = Array.from(participant.getTrackPublications().values()).find(
      (pub) => pub.trackSid === trackSid && pub.kind === kind
    );

    if (currentPub && currentPub.isSubscribed && currentPub.track && currentPub.trackSid) {
      logDebug('[trackSubscriptionUtils] Track became subscribed after polling', {
        trackSid: currentPub.trackSid,
        kind,
        checkCount,
      });
      onSubscribed(currentPub);
      clearInterval(checkInterval);
      pollIntervals.delete(checkInterval);
    } else if (checkCount >= MAX_AUDIO_CHECK_COUNT) {
      logWarn('[trackSubscriptionUtils] Track did not become subscribed after polling', {
        trackSid,
        kind,
        checkCount,
      });
      clearInterval(checkInterval);
      pollIntervals.delete(checkInterval);
    }
  }, AUDIO_CHECK_INTERVAL_MS);

  pollIntervals.add(checkInterval);
}


/**
 * @fileoverview Track subscription types
 * @summary Type definitions for track subscription hook and utilities
 * @description Types for managing track subscriptions and polling
 */

import type { Room, RemoteParticipant } from 'livekit-client';

/**
 * Options for useTrackSubscriptions hook
 */
export interface IUseTrackSubscriptionsOptions {
  roomRef: React.RefObject<Room | null>;
  targetIdentity: string | null;
  onTrackReady: (publication: any, participant: RemoteParticipant) => void;
}

/**
 * Return type for useTrackSubscriptions hook
 */
export interface IUseTrackSubscriptionsReturn {
  setupTrackSubscriptions: (participant: RemoteParticipant) => void;
  handleTrackPublished: (publication: any, participant: RemoteParticipant) => void;
  cleanup: () => void;
}

/**
 * Options for polling track subscription
 */
export interface IPollTrackSubscriptionOptions {
  participant: RemoteParticipant;
  trackSid: string;
  kind: 'video' | 'audio';
  onSubscribed: (publication: any) => void;
  pollIntervals: Set<NodeJS.Timeout>;
}


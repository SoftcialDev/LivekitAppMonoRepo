/**
 * @fileoverview Participant setup types
 * @summary Type definitions for participant setup hook
 * @description Types for managing participant setup
 */

import type { RemoteParticipant } from 'livekit-client';

/**
 * Options for useParticipantSetup hook
 */
export interface IUseParticipantSetupOptions {
  targetIdentity: string | null;
  onTrackReady: (publication: any) => void;
}

/**
 * Return type for useParticipantSetup hook
 */
export interface IUseParticipantSetupReturn {
  setupParticipant: (participant: RemoteParticipant) => void;
  isParticipantSetup: (participantIdentity: string) => boolean;
  resetParticipantSetup: (participantIdentity: string) => void;
  clearAllSetups: () => void;
}


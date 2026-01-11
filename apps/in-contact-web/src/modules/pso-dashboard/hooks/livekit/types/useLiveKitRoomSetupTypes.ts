/**
 * @fileoverview useLiveKitRoomSetup types
 * @summary Type definitions for useLiveKitRoomSetup hook
 * @description Types for LiveKit room setup configuration
 */

/**
 * Options for setupRoomEventListeners
 */
export interface ISetupRoomEventListenersOptions {
  streamingRef: React.MutableRefObject<boolean>;
  manualStopRef: React.MutableRefObject<boolean>;
  onDisconnected?: () => void;
  onTrackEnded?: () => void;
}

/**
 * Options for useLiveKitRoomSetup hook
 */
export interface IUseLiveKitRoomSetupOptions {
  streamingRef: React.MutableRefObject<boolean>;
  manualStopRef: React.MutableRefObject<boolean>;
  onDisconnected?: () => void;
  onTrackEnded?: () => void;
}


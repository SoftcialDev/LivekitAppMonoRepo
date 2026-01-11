/**
 * @fileoverview PSO Streaming hooks barrel export
 * @summary Barrel export for all PSO streaming hooks
 * @description Organized by category following Screaming Architecture
 */

// PSO List hooks
export { useStablePSOs } from './pso-list';

// Action hooks
export { useVideoActions } from './actions';

// Streaming hooks
export { useIsolatedStreams } from './streaming';

// Chat hooks
export { useChat } from './chat';

// Optimization hooks
export { useVideoCardOptimization } from './optimization';

// Timer hooks
export { useSynchronizedTimer } from './timer';

// Snapshot hooks
export { useSnapshot } from './snapshot';
export type { IUseSnapshotReturn } from './snapshot';

// Recording hooks
export { useRecording } from './recording';
export type { IUseRecordingReturn } from './recording';

// Talkback hooks
export { useTalkback } from './talkback';
export type { IUseTalkbackOptions, IUseTalkbackReturn } from './talkback';

// LiveKit hooks
export { useLiveKitRoomConnection, useRemoteTracks } from './livekit';
export type {
  IUseLiveKitRoomConnectionOptions,
  IUseLiveKitRoomConnectionReturn,
  IUseRemoteTracksOptions,
  IUseRemoteTracksReturn,
} from './livekit';

// Audio hooks
export { useAudioPlay, useAudioAttachment } from './audio';
export type {
  IUseAudioPlayOptions,
  IUseAudioPlayReturn,
  IUseAudioAttachmentOptions,
  IUseAudioAttachmentReturn,
} from './audio';

// Status hooks
export { usePsoStreamingStatus, useTalkSessionStatus } from './status';
export type {
  IPsoStreamingStatus,
  IPsoStreamingSession,
  IUseTalkSessionStatusOptions,
  IUseTalkSessionStatusReturn,
} from './status';


/**
 * @fileoverview useVideoCardLogic - Composite hook for VideoCard component
 * @summary Encapsulates all VideoCard logic and state management
 * @description Centralizes all VideoCard business logic, hooks coordination, and state management in a single composite hook to reduce component complexity
 */

import { useRef, useEffect, useState } from 'react';
import { Room } from 'livekit-client';
import { useAuth, useUserInfo } from '@/modules/auth';
import { useSnapshot } from '../../../hooks/snapshot';
import { useRecording } from '../../../hooks/recording';
import { useTalkback } from '../../../hooks/talkback';
import { useSynchronizedTimer } from '../../../hooks/timer';
import { useSnapshotReasonsStore } from '../../../stores/snapshot-reasons-store';
import { useTalkSessionStatus } from '../../../hooks/status';
import { useAudioAttachment } from '../../../hooks/audio';
import { useRemoteTracks, useLiveKitRoomConnection } from '../../../hooks/livekit';
import { logDebug } from '@/shared/utils/logger';
import { useVideoCardHandlers, useVideoCardCleanup, useVideoCardState } from './index';
import type { IUseVideoCardLogicOptions, IUseVideoCardLogicReturn } from '../types/useVideoCardLogicTypes';

/**
 * Composite hook that encapsulates all VideoCard logic and state management
 * 
 * @param options - Component props
 * @returns Object containing props for all sub-components
 */
export function useVideoCardLogic(
  options: IUseVideoCardLogicOptions
): IUseVideoCardLogicReturn {
  const {
    name,
    email,
    onChat,
    showHeader = true,
    stopReason,
    stoppedAt,
    accessToken,
    roomName,
    livekitUrl,
    disableControls = false,
    shouldStream = false,
    connecting = false,
    onToggle,
    statusMessage,
    psoName,
    supervisorEmail,
    supervisorName,
    onSupervisorChange,
    portalMinWidthPx,
  } = options;

  const { account } = useAuth();
  const { userInfo } = useUserInfo();
  const { reasons: snapshotReasons } = useSnapshotReasonsStore();

  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioMuted] = useState(false);
  
  // Refs to access current values without triggering useEffect re-runs
  const hasActiveSessionRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const activeSupervisorEmailRef = useRef<string | null>(null);
  
  const {
    isRecording,
    loading: recordingLoading,
    toggleRecording,
    stopRecordingIfActive,
  } = useRecording(roomName || '', email);
  
  const {
    isTalking,
    loading: talkLoading,
    countdown,
    isCountdownActive,
    start: startTalk,
    stop: stopTalk,
    cancel: cancelTalk,
  } = useTalkback({ roomRef, targetIdentity: roomName, psoEmail: email });
  
  const { hasActiveSession, sessionId: activeSessionId, supervisorEmail: activeSupervisorEmail, supervisorName: activeSupervisorName } = useTalkSessionStatus({
    psoEmail: email || null,
    enabled: isCountdownActive && !!email,
    pollInterval: 5000
  });
  
  const currentAdminEmail = (account?.username || userInfo?.email || null) as string | null;
  
  // Update refs when values change
  useEffect(() => {
    hasActiveSessionRef.current = hasActiveSession;
  }, [hasActiveSession]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    activeSupervisorEmailRef.current = activeSupervisorEmail;
  }, [activeSupervisorEmail]);

  // Audio attachment hook - handles conditional audio attachment
  const audioAttachment = useAudioAttachment({
    audioRef,
    isTalking,
    hasActiveSession,
    activeSupervisorEmail,
    currentAdminEmail,
    isAudioMuted,
    roomRef,
    roomName: roomName || null,
  });

  // LiveKit room connection hook
  const { isConnected, isConnecting, isDisconnecting } = useLiveKitRoomConnection({
    shouldStream,
    accessToken: accessToken || null,
    roomName: roomName || null,
    livekitUrl: livekitUrl || null,
    roomRef,
    onRoomConnected: (_room) => {
      logDebug('[VideoCard] Room connected successfully', { roomName, email });
    },
    onRoomDisconnected: () => {
      logDebug('[VideoCard] Room disconnected', { roomName, email });
    },
  });

  /**
   * Synchronized timer for break/lunch/emergency
   */
  const timerInfo = useSynchronizedTimer(stopReason, stoppedAt);

  /** Reflect mute state in the hidden <audio> element. */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isAudioMuted;
      if (!isAudioMuted) {
        audioRef.current.play?.().catch(() => {});
      }
    }
  }, [isAudioMuted]);

  /** Automatically unmute audio when Talk is active */
  useEffect(() => {
    if (isTalking && audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play?.().catch(() => {});
    }
  }, [isTalking]);

  /**
   * Snapshot helpers (provides `videoRef` used to capture frames).
   */
  const {
    videoRef,
    isModalOpen,
    screenshot,
    reason,
    description,
    setReason,
    setDescription,
    isSubmitting,
    openModal,
    closeModal,
    confirm,
  } = useSnapshot(email);
  
  // Remote tracks hook - handles track attachment/detachment
  useRemoteTracks({
    roomRef,
    targetIdentity: roomName || null,
    videoRef,
    audioRef,
    audioAttachment,
    isConnected,
  });
  
  // Computed state values - use isConnecting from hook as primary source
  // connecting prop from parent is only for initial loading state (fetching token)
  // If accessToken exists (even if shouldStream hasn't updated yet), we're in transition to streaming
  // When shouldStream is true, use isConnecting or !isConnected (waiting for connection)
  // When shouldStream is false but accessToken exists, also show connecting (transition state)
  // When shouldStream is false and no accessToken, use connecting prop (fetching creds)
  const hasAccessToken = Boolean(accessToken);
  const actualConnecting = hasAccessToken
    ? (isConnecting || !isConnected)
    : (connecting || (shouldStream && !isConnected));
  const state = useVideoCardState({
    shouldStream,
    connecting: actualConnecting,
    disconnecting: isDisconnecting,
    disableControls,
    currentRole: userInfo?.role,
    isTalking,
    isCountdownActive,
    countdown,
    talkLoading,
    recordingLoading,
    isRecording,
  });

  // Button handlers
  const handlers = useVideoCardHandlers({
    email,
    onToggle,
    onChat,
    isCountdownActive,
    isTalking,
    cancelTalk,
    stopTalk,
    startTalk,
    activeSupervisorName,
    activeSupervisorEmail,
    openModal,
    toggleRecording,
  });

  // Cleanup logic
  useVideoCardCleanup({
    roomRef,
    roomName,
    email,
    hasActiveSessionRef,
    activeSessionIdRef,
    videoRef,
    audioRef,
    shouldStream,
    isRecording,
    isTalking,
    stopRecordingIfActive,
    stopTalk,
  });

  return {
    headerProps: {
      showHeader,
      psoName,
      name,
      supervisorEmail,
      supervisorName,
      onSupervisorChange,
      email,
      disableControls,
      portalMinWidthPx,
    },
    displayProps: {
      shouldStream,
      accessToken,
      videoRef,
      statusMessage,
      timerInfo,
      email,
      audioRef,
    },
    controlsProps: {
      shouldStream,
      connecting: actualConnecting || isDisconnecting,
      disableControls,
      recordingLoading,
      talkLoading,
      playLabel: state.playLabel,
      onToggle,
      email,
      onStopReasonSelect: handlers.handleStopReasonSelect,
      onChat: handlers.handleChatClick,
      canTalkControl: state.canTalkControl,
      isCountdownActive,
      isTalking,
      countdown,
      talkLabel: state.talkLabel,
      talkDisabled: state.talkDisabled,
      onTalkClick: handlers.handleTalkClick,
      canSnapshot: state.canSnapshot,
      snapshotDisabled: state.snapshotDisabled,
      onSnapshotClick: handlers.handleSnapshotClick,
      canRecord: state.canRecord,
      recordDisabled: state.recordDisabled,
      isRecording,
      onRecordClick: handlers.handleRecordClick,
    },
    modalProps: {
      isModalOpen,
      email,
      screenshot,
      reason,
      description,
      snapshotReasons,
      isSubmitting,
      onClose: closeModal,
      onConfirm: confirm,
      onReasonSelect: setReason,
      onDescriptionChange: setDescription,
    },
  };
}


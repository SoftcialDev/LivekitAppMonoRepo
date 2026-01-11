/**
 * @fileoverview VideoCard - React component for displaying LiveKit video/audio streams
 * @summary Displays a video/audio stream for one remote user with controls
 * @description This component renders a LiveKit video/audio stream card with controls for
 * play/stop, chat, mute/unmute, snapshot capture, talkback (two-way audio), and recording.
 * It handles connection management, participant setup, and provides a synchronized timer
 * display for break/lunch/emergency statuses.
 */

import React, { useRef, useEffect, useState, memo } from 'react';
import { Room } from 'livekit-client';
import { useAuth } from '@/modules/auth';
import { useUserInfo } from '@/modules/auth';
import { useSnapshot } from '../hooks/snapshot';
import { useRecording } from '../hooks/recording';
import { useTalkback } from '../hooks/talkback';
import { useSynchronizedTimer } from '../hooks/timer';
import { useSnapshotReasonsStore } from '../stores/snapshot-reasons-store';
import { useTalkSessionStatus } from '../hooks/status';
import { useAudioAttachment } from '../hooks/audio';
import { useRemoteTracks } from '../hooks/livekit';
import { useLiveKitRoomConnection } from '../hooks/livekit';
import { logDebug } from '@/shared/utils/logger';
import { VideoCardHeader, VideoCardDisplay, VideoCardControls, VideoCardSnapshotModal } from './VideoCard/components';
import { useVideoCardHandlers, useVideoCardCleanup, useVideoCardState } from './VideoCard/hooks';
import type { IVideoCardProps } from './types/videoCardTypes';

/**
 * VideoCard component
 * 
 * Displays a video/audio stream for one remote user with full controls:
 * - Play/Stop with stop reason selection
 * - Chat
 * - Talk (two-way audio) with permission checks
 * - Snapshot capture with modal
 * - Recording
 * - Supervisor selector
 * - Refresh button
 * - Timer display for breaks
 * 
 * @param props - Component props
 * @returns React element rendering the video card
 */
const VideoCard: React.FC<IVideoCardProps> = memo(({
  name,
  email,
  onChat,
  showHeader = true,
  stopReason,
  stoppedAt,
  className = '',
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
}) => {
  const { account } = useAuth();
  const { userInfo } = useUserInfo();
  const { reasons: snapshotReasons } = useSnapshotReasonsStore();

  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  
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
    onRoomConnected: (room) => {
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

  return (
    <>
      <div className={`flex flex-col bg-(--color-primary-dark) rounded-xl overflow-visible ${className}`}>
        <VideoCardHeader
          showHeader={showHeader}
          psoName={psoName}
          name={name}
          supervisorEmail={supervisorEmail}
          supervisorName={supervisorName}
          onSupervisorChange={onSupervisorChange}
          email={email}
          disableControls={disableControls}
          portalMinWidthPx={portalMinWidthPx}
        />

        <VideoCardDisplay
          shouldStream={shouldStream}
          accessToken={accessToken}
          videoRef={videoRef}
          statusMessage={statusMessage}
          timerInfo={timerInfo}
          email={email}
          audioRef={audioRef}
        />

        <VideoCardControls
          shouldStream={shouldStream}
          connecting={actualConnecting || isDisconnecting}
          disableControls={disableControls}
          recordingLoading={recordingLoading}
          talkLoading={talkLoading}
          playLabel={state.playLabel}
          onToggle={onToggle}
          email={email}
          onStopReasonSelect={handlers.handleStopReasonSelect}
          onChat={handlers.handleChatClick}
          canTalkControl={state.canTalkControl}
          isCountdownActive={isCountdownActive}
          isTalking={isTalking}
          countdown={countdown}
          talkLabel={state.talkLabel}
          talkDisabled={state.talkDisabled}
          onTalkClick={handlers.handleTalkClick}
          canSnapshot={state.canSnapshot}
          snapshotDisabled={state.snapshotDisabled}
          onSnapshotClick={handlers.handleSnapshotClick}
          canRecord={state.canRecord}
          recordDisabled={state.recordDisabled}
          isRecording={isRecording}
          onRecordClick={handlers.handleRecordClick}
        />
      </div>

      <VideoCardSnapshotModal
        isModalOpen={isModalOpen}
        email={email}
        screenshot={screenshot}
        reason={reason}
        description={description}
        snapshotReasons={snapshotReasons}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onConfirm={confirm}
        onReasonSelect={setReason}
        onDescriptionChange={setDescription}
      />
    </>
  );
}, (prevProps, nextProps) => {
  const criticalProps: Array<keyof IVideoCardProps> = ['email', 'accessToken', 'roomName', 'livekitUrl', 'shouldStream', 'connecting', 'statusMessage'];
  
  for (const prop of criticalProps) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false; // Props changed, should re-render
    }
  }
  
  return true; // Props are the same, skip re-render
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;

/**
 * @fileoverview VideoCard.tsx - React component for displaying LiveKit video/audio streams
 * @summary Displays a video/audio stream for one remote user with controls
 * @description This component renders a LiveKit video/audio stream card with controls for
 * play/stop, chat, mute/unmute, snapshot capture, talkback (two-way audio), and recording.
 * It handles connection management, participant setup, and provides a synchronized timer
 * display for break/lunch/emergency statuses.
 */

import React, { useRef, useEffect, useState, memo } from 'react'
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from 'livekit-client'
import { useSnapshot } from '../hooks/useSnapshot'
import { useAuth } from '@/shared/auth/useAuth'
import { useUserInfo } from '@/shared/hooks/useUserInfo'
import { usePermissions } from '@/shared/auth/usePermissions'
import { Permission } from '@/shared/auth/permissions'
import { VideoCardProps } from '@/shared/types/VideoCardProps'
import AddModal from '@/shared/ui/ModalComponent'
import { useRecording } from '../hooks/useRecording'
import { useTalkback } from '../hooks/useTalkback'
import StopReasonButton, { StopReason } from '@/shared/ui/Buttons/StopReasonButton'
import SupervisorSelector from './SupervisorSelector'
import { useSynchronizedTimer } from '../hooks/useSynchronizedTimer'
import {  CompactTimer } from './TimerDisplay'
import { Dropdown } from '@/shared/ui/Dropdown'
import { SnapshotReason } from '@/shared/types/snapshot'
import { useSnapshotReasons } from '@/shared/context/SnapshotReasonsContext'
import { RefreshButton } from './RefreshButton'
import { useAudioPlay } from '../hooks/useAudioPlay'
import { useTalkSessionStatus } from '../hooks/useTalkSessionStatus'
import { TalkSessionClient } from '@/shared/api/talkSessionClient'
import { TalkStopReason } from '@/shared/types/talkSession'
import { useAudioAttachment } from '../hooks/useAudioAttachment'
import { useRemoteTracks } from '../hooks/useRemoteTracks'
import { useLiveKitRoomConnection } from '../hooks/useLiveKitRoomConnection'
import { useToast } from '@/shared/ui/ToastContext'
const VideoCard: React.FC<VideoCardProps & { 
  livekitUrl?: string;
  psoName?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  onSupervisorChange?: (psoEmail: string, newSupervisorEmail: string) => void;
  portalMinWidthPx?: number;
  // Timer props
  stopReason?: string | null;
  stoppedAt?: string | null;
}> = memo(({
  name,
  email,
  onPlay,
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
  const isBlackScreen = !shouldStream || connecting || !accessToken || !roomName || !livekitUrl;
  
  const { account } = useAuth();
  const { userInfo } = useUserInfo();
  const { reasons: snapshotReasons } = useSnapshotReasons();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { showToast } = useToast();

  const canTalkControl = hasAnyPermission([
    Permission.TalkSessionsStart,
    Permission.TalkSessionsStop,
    Permission.TalkSessionsMute,
    Permission.TalkSessionsUnmute,
  ]);
  const canSnapshot = hasPermission(Permission.SnapshotsCreate);
  const canRecord = hasAnyPermission([
    Permission.RecordingsStart,
    Permission.RecordingsStop,
    Permission.RecordingsDelete,
    Permission.RecordingsRead,
  ]);
  
  const roomRef = useRef<Room | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const [isAudioMuted, setIsAudioMuted] = useState(false)
  
  // Refs to access current values without triggering useEffect re-runs
  const hasActiveSessionRef = useRef(false)
  const activeSessionIdRef = useRef<string | null>(null)
  const activeSupervisorEmailRef = useRef<string | null>(null)
  
  const {
    isRecording,
    loading: recordingLoading,
    toggleRecording,
    stopRecordingIfActive,
  } = useRecording(roomName!, email!)
  const {
    isTalking,
    loading: talkLoading,
    countdown,
    isCountdownActive,
    start: startTalk,
    stop: stopTalk,
    cancel: cancelTalk,
  } = useTalkback({ roomRef, targetIdentity: roomName, psoEmail: email })
  
  // Check if there's an active talk session for this PSO
  // Used to prevent multiple sessions BEFORE starting a new one
  // Only poll during countdown to verify no other session exists
  // Once we start talking (isTalking = true), we don't need to poll because we know the session is active
  const { hasActiveSession, sessionId: activeSessionId, supervisorEmail: activeSupervisorEmail, supervisorName: activeSupervisorName } = useTalkSessionStatus({
    psoEmail: email || null,
    enabled: isCountdownActive && !!email, // Only poll during countdown, not during active talk session
    pollInterval: 5000
  })
  
  const talkSessionClientRef = useRef(new TalkSessionClient())
  const currentAdminEmail = (account?.username || userInfo?.email || null) as string | null
  
  // Update refs when values change
  useEffect(() => {
    hasActiveSessionRef.current = hasActiveSession
  }, [hasActiveSession])
  
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId
  }, [activeSessionId])
  
  useEffect(() => {
    activeSupervisorEmailRef.current = activeSupervisorEmail
  }, [activeSupervisorEmail])
  
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
  })
  
  // LiveKit room connection hook
  const { isConnected, isConnecting: roomConnecting, error: connectionError } = useLiveKitRoomConnection({
    shouldStream,
    accessToken: accessToken || null,
    roomName: roomName || null,
    livekitUrl: livekitUrl || null,
    roomRef,
    onRoomConnected: (room) => {
      console.log('[VideoCard] Room connected successfully');
    },
    onRoomDisconnected: () => {
      console.log('[VideoCard] Room disconnected');
    },
  })

  /**
   * Synchronized timer for break/lunch/emergency
   */
  const timerInfo = useSynchronizedTimer(stopReason, stoppedAt);

  /** Reflect mute state in the hidden <audio> element. */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isAudioMuted
      if (!isAudioMuted) {
        audioRef.current.play?.().catch(() => {})
      }
    }
  }, [isAudioMuted])

  /** Automatically unmute audio when Talk is active */
  useEffect(() => {
    if (isTalking && audioRef.current) {
      audioRef.current.muted = false
      audioRef.current.play?.().catch(() => {})
    }
  }, [isTalking])

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
  } = useSnapshot(email)
  
  // Remote tracks hook - handles track attachment/detachment
  // Initialize after videoRef is available from useSnapshot
  useRemoteTracks({
    roomRef,
    targetIdentity: roomName || null,
    videoRef,
    audioRef,
    audioAttachment,
  })
  /**
   * Handle PSO disconnection - close talk session if active
   */
  useEffect(() => {
    const room = roomRef.current;
    if (!room || !roomName) {
      return;
    }

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      if (participant.identity === roomName) {
        console.log('[VideoCard] PSO disconnected from LiveKit');
        // PSO se desconectó - cerrar talk session si está activa
        const currentHasActiveSession = hasActiveSessionRef.current;
        const currentActiveSessionId = activeSessionIdRef.current;
        if (currentHasActiveSession && currentActiveSessionId) {
          talkSessionClientRef.current
            .stop(currentActiveSessionId, TalkStopReason.PSO_DISCONNECTED)
            .catch((err: unknown) => {
              console.error('[VideoCard] Failed to stop talk session on PSO disconnect:', err);
            });
        }
      }
    };

    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    };
  }, [roomRef, roomName]);

  /**
   * Cleanup: Close talk session and clean elements when component unmounts
   */
  useEffect(() => {
    return () => {
      // Close talk session if active when component unmounts
      const currentHasActiveSession = hasActiveSessionRef.current;
      const currentActiveSessionId = activeSessionIdRef.current;
      if (currentHasActiveSession && currentActiveSessionId) {
        talkSessionClientRef.current
          .stop(currentActiveSessionId, TalkStopReason.SUPERVISOR_DISCONNECTED)
          .catch((err: unknown) => {
            console.error('[VideoCard] Failed to stop talk session on cleanup:', err);
          });
      }

      // Clean elements
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = '';
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null;
        audioRef.current.src = '';
      }
    };
  }, []);

  /**
   * Safety net: if an external change flips shouldStream true → false,
   * stop recording first and then stop talkback before teardown.
   */
  const prevShouldRef = useRef<boolean>(shouldStream)
  useEffect(() => {
    const prev = prevShouldRef.current
    prevShouldRef.current = shouldStream
    if (prev && !shouldStream) {
      if (isRecording) {
        void stopRecordingIfActive() // stop recording first
      }
      if (isTalking) {
        void stopTalk()        // then stop talkback
      }
    }
  }, [shouldStream, isRecording, isTalking, stopTalk, toggleRecording])

  /** Media is available when actively streaming and not connecting. */
  const mediaReady = shouldStream && !connecting

  // Labels and disabled states
  const playLabel      = connecting ? 'Connecting…' : (shouldStream ? 'Stop' : 'Play')
  const isPlayDisabled = disableControls || connecting
  const talkLabel = isCountdownActive
    ? `Starting... ${countdown}`
    : isTalking
    ? 'Stop Talk'
    : 'Talk'
  const talkDisabled = !mediaReady || talkLoading
  const recordDisabled = !mediaReady || recordingLoading
  const snapshotDisabled = !mediaReady

  /**
   * Handles stop reason selection
   */
  const handleStopReasonSelect = (reason: StopReason) => {
    onToggle?.(email, reason);
  };

  return (
    <>
      <div className={`flex flex-col bg-[var(--color-primary-dark)] rounded-xl overflow-visible ${className}`}>
        {showHeader && (
          <div className="flex items-center px-2 py-1 relative z-50">
            {psoName && onSupervisorChange ? (
              <SupervisorSelector
                psoName={psoName}
                currentSupervisorEmail={supervisorEmail || ''}
                currentSupervisorName={supervisorName || ''}
                psoEmail={email}
                onSupervisorChange={onSupervisorChange}
                disabled={disableControls}
                className="w-full"
                portalMinWidthPx={portalMinWidthPx}
              />
            ) : (
              <div className="text-white truncate">{name}</div>
            )}
            
            {/* Timer Display - REMOVED from header */}
          </div>
        )}

        {/* Video (16:9) */}
        <div className="relative w-full pb-[56.25%] bg-black rounded-xl">
          {(shouldStream || Boolean(accessToken)) ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {(() => {
                const text = statusMessage || '';
                return (
                  <>
                    <span className="text-xl font-medium text-yellow-400 mb-2">
                      {text}
                    </span>
                    {/* Timer Display in content area - Solo números grandes */}
                    {timerInfo && (
                      <div className="mt-2">
                        <CompactTimer timerInfo={timerInfo} />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <RefreshButton email={email || ''} />

          {/* Hidden audio element for remote mic */}
          <audio ref={audioRef} autoPlay className="hidden" />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Play / Stop — enforce: stop recording -> stop talk -> toggle */}
          <div className="flex-1 relative">
            {shouldStream ? (
              <StopReasonButton
                onSelect={handleStopReasonSelect}
                disabled={isPlayDisabled || recordingLoading || talkLoading}
                className="w-full"
              >
                {recordingLoading || talkLoading ? '...' : playLabel}
              </StopReasonButton>
            ) : (
              <button
                onClick={async () => {
                  // Start stream normally
                  onToggle?.(email);
                }}
                disabled={isPlayDisabled || recordingLoading || talkLoading}
                className="w-full py-2 bg-white text-[var(--color-primary-dark)] rounded-xl disabled:opacity-50"
                title="Start stream"
              >
                {recordingLoading || talkLoading ? '...' : playLabel}
              </button>
            )}
          </div>

          <button
            onClick={() => onChat(email)}
            className="flex-1 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded-xl"
          >
            Chat
          </button>

          {/* Mute/Unmute button - Audio is automatically unmuted when Talk is active */}
          {/* <button
            onClick={() => setIsAudioMuted(prev => !prev)}
            className="flex-1 py-2 bg-gray-700 text-white rounded-xl"
          >
            {isAudioMuted ? 'Unmute' : 'Mute'}
          </button> */}

          {/* Talkback - permission gated */}
          {canTalkControl && (
            <button
              onClick={async () => {
                if (isCountdownActive) {
                  cancelTalk()
                } else if (isTalking) {
                  await stopTalk()
                } else {
                  try {
                    await startTalk()
                  } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to start talk session'
                    
                    // Check if error is about active session and extract supervisor name
                    if (errorMessage.includes('already has an active talk session')) {
                      // Get supervisor name from activeSession response or use default
                      const supervisorDisplayName = activeSupervisorName || activeSupervisorEmail || 'another supervisor'
                      showToast(
                        `PSO already has an active talk session with ${supervisorDisplayName}. Please wait for it to end.`,
                        'error'
                      )
                    } else {
                      showToast(errorMessage, 'error')
                    }
                  }
                }
              }}
              disabled={talkDisabled && !isCountdownActive}
              className="flex-1 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
              title={isCountdownActive ? 'Cancel talk session' : 'Publish your microphone to this user'}
            >
              {talkLoading ? '...' : talkLabel}
            </button>
          )}

          {canSnapshot && (
            <button
              onClick={openModal}
              disabled={snapshotDisabled}
              className="flex-1 py-2 bg-yellow-400 rounded-xl disabled:opacity-50"
              title={!mediaReady ? 'Snapshot is available only while streaming' : undefined}
            >
              Snapshot
            </button>
          )}

          {canRecord && (
            <button
              onClick={toggleRecording}
              disabled={recordDisabled}
              className={`flex-1 py-2 rounded-xl ${isRecording ? 'bg-red-500 text-white' : 'bg-[#BBA6CF] text-white'} disabled:opacity-50`}
              title={!mediaReady ? 'Recording is available only while streaming' : undefined}
            >
              {recordingLoading ? '...' : isRecording ? 'Stop Rec' : 'Start Rec'}
            </button>
          )}
        </div>
      </div>

      {/* Snapshot Modal */}
      <AddModal
        open={isModalOpen}
        title={<strong className="text-xl">Report</strong>}
        onClose={closeModal}
        onConfirm={confirm}
        confirmLabel="Send"
        loading={isSubmitting}
        className="w-[600px] max-w-[90vw]"
        loadingAction="Sending…"
      >
        <div className="space-y-4 text-white overflow-y-auto w-full mx-auto">
          <p><strong>PSO:</strong> {email}</p>
          {screenshot && (
            <img
              src={screenshot}
              alt="Snapshot preview"
              className="max-w-full w-fit h-auto object-contain rounded mx-auto"
            />
          )}
          
          <div>
            <label className="block mb-2 text-sm font-medium"><strong>Reason *</strong></label>
              <div className="w-full">
                <Dropdown
                  value={reason?.id || ''}
                  onSelect={(value) => {
                    const selectedReason = snapshotReasons.find(r => r.id === value);
                    setReason(selectedReason || null);
                  }}
                  label="Select a reason"
                  options={snapshotReasons.map(r => ({
                    label: r.label,
                    value: r.id
                  }))}
                  className="w-full"
                  buttonClassName="w-full flex items-center justify-between px-4 py-2 bg-[var(--color-tertiary)] text-[var(--color-primary-dark)] rounded-lg focus:ring-0 focus:border-transparent"
                  menuClassNameOverride="absolute left-0 mt-1 bg-[var(--color-tertiary)] text-[var(--color-primary-dark)] border border-gray-200 rounded-lg shadow-lg z-50 divide-y divide-gray-100"
                  menuStyle={{ width: '-webkit-fill-available', marginLeft: '24px', marginRight: '24px' }}
                  menuBgClassName="bg-[var(--color-tertiary)] text-[var(--color-primary-dark)]"
                />
              </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              {reason?.code === 'OTHER' ? (
                <strong>Description * (mandatory)</strong>
              ) : (
                'Description (optional)'
              )}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={reason?.code === 'OTHER' ? 'Enter description (required)' : 'Enter additional details (optional)'}
              className="w-full h-32 p-2 rounded border bg-[var(--color-tertiary)] text-[var(--color-primary-dark)] placeholder-[var(--color-primary-dark)]/70 focus:outline-none focus:ring-0 focus:border-[var(--color-tertiary)] border-[var(--color-tertiary)] resize-none overflow-wrap break-words"
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            />
          </div>
        </div>
      </AddModal>

    </>
  )
}, (prevProps, nextProps) => {
  const criticalProps = ['email', 'accessToken', 'roomName', 'livekitUrl', 'shouldStream', 'connecting', 'statusMessage'];
  
  for (const prop of criticalProps) {
    if (prevProps[prop as keyof typeof prevProps] !== nextProps[prop as keyof typeof nextProps]) {
      return false; // Props changed, should re-render
    }
  }
  
  return true; // Props are the same, skip re-render
})

export default VideoCard

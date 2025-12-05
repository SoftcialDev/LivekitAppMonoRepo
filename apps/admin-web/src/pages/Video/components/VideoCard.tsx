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

  const [isAudioMuted, setIsAudioMuted] = useState(true)

  const {
    isRecording,
    loading: recordingLoading,
    toggleRecording,
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

  /**
   * Synchronized timer for break/lunch/emergency
   */
  const timerInfo = useSynchronizedTimer(stopReason, stoppedAt);

  /** Reflect mute state in the hidden <audio> element. */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isAudioMuted
    }
  }, [isAudioMuted])

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
  /**
   * Connect to LiveKit and subscribe to the target participant.
   * - Attaches video/audio tracks on subscription.
   * - Calls `onPlay` on the first video attachment (no auto-recording).
   * - Cleans up on unmount or when streaming stops.
   */
  useEffect(() => {
    
    if (!shouldStream) {

      roomRef.current?.disconnect()
      roomRef.current = null
      return
    }
    if (!accessToken || !roomName || !livekitUrl) {
      return
    }

    let lkRoom: Room | null = null
    let canceled = false


    const attachTrack = (pub: any) => {
      const { track, kind, isSubscribed } = pub
      if (!isSubscribed || !track) return

      if (kind === 'video') {
        (track as RemoteVideoTrack).attach(videoRef.current!)
        
      } else if (kind === 'audio') {
        (track as RemoteAudioTrack).attach(audioRef.current!)
        if (audioRef.current) {
          audioRef.current.muted = isAudioMuted
        }
      }
    }

    // Keep track of per-participant handlers to remove them on cleanup
    const participantTrackHandlers = new Map<RemoteParticipant, (pub: any) => void>()

    const setupParticipant = (p: RemoteParticipant) => {
      // Attach existing publications
      for (const pub of p.getTrackPublications().values()) {
        attachTrack(pub)
      }
      // Subscribe handler (stable reference) and remember it for cleanup
      const handleTrackSubscribed = (pub: any) => attachTrack(pub)
      participantTrackHandlers.set(p, handleTrackSubscribed)
      p.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed)
    }

    const connectAndWatch = async (retryCount = 0) => {
      const room = new Room()
      try {
        await room.connect(livekitUrl!, accessToken!)
      } catch (error) {
        if (retryCount < 2 && !canceled) {
          const delay = (retryCount + 1) * 1500;
          setTimeout(() => connectAndWatch(retryCount + 1), delay);
          return;
        }
      }
      
      if (canceled) {
        room.disconnect()
        return
      }
      
      lkRoom = room
      roomRef.current = room

      room.remoteParticipants.forEach(p => {
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      })
      
      const onParticipantConnected = (p: RemoteParticipant) => {
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      }
      room.on(RoomEvent.ParticipantConnected, onParticipantConnected)
      
      const onTrackPublished = (_publication: any, participant: RemoteParticipant) => {
        if (participant.identity === roomName) {
          setupParticipant(participant)
        }
      }
      room.on(RoomEvent.TrackPublished, onTrackPublished)

      // Cleanup: remove listeners when effect cleans up
      const cleanupListeners = () => {
        room.off(RoomEvent.ParticipantConnected, onParticipantConnected)
        room.off(RoomEvent.TrackPublished, onTrackPublished)
        participantTrackHandlers.forEach((handler, participant) => {
          participant.off(ParticipantEvent.TrackSubscribed, handler)
        })
        participantTrackHandlers.clear()
      }

      // Store cleanup on lkRoom for later
      ;(room as any).__cleanupListeners = cleanupListeners
    }

    void connectAndWatch()

    return () => {

      canceled = true
      // Remove per-room listeners before disconnect to avoid leaks
      const roomCleanup = (lkRoom as any)?.__cleanupListeners as (() => void) | undefined
      if (roomCleanup) {
        roomCleanup()
      }
      lkRoom?.disconnect()
      roomRef.current = null

      // Clean elements
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = ''
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null
        audioRef.current.src = ''
      }
    }
  }, [
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    email,
  ])

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
        void toggleRecording() // stop recording first
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
              className="absolute inset-0 w-full h-full object-contain"
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

          {/*  <button
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
                  await startTalk()
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
              className="w-full max-w-md h-48 object-cover rounded mx-auto"
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

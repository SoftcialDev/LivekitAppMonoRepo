/**
 * @fileoverview PsoDashboardPage - Personal dashboard for PSO users
 * @summary Displays supervisor information, live video stream, and management tools
 * @description Renders a dashboard showing the PSO's assigned supervisor, live streaming
 * status with timer information. Listens for talk session notifications and plays audio alerts.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Room } from 'livekit-client';
import { useAuth } from '@/modules/auth';
import { usePsoStreamingStatus } from '@/modules/pso-streaming/hooks/status';
import { useSynchronizedTimer } from '@/modules/pso-streaming/hooks/timer';
import { CompactTimer } from '@/modules/pso-streaming/components/TimerDisplay';
import { TimerType, StreamingStopReason } from '@/modules/pso-streaming/enums';
import {
  useStreamingDashboard,
  usePsoSupervisor,
  usePsoSupervisorNotifications,
  useAutoReloadWhenIdle,
  useTalkSessionNotifications,
  usePsoTalkResponse,
  useStreamCommandHandling,
} from '../hooks';
import { TalkActiveBanner, MediaPermissionsModal } from '../components';
import { AUTO_RELOAD_INTERVAL_MS } from '../constants';
import { logDebug, logError } from '@/shared/utils/logger';
import { isWithinCentralAmericaWindow } from '@/shared/utils/time';
import { MediaPermissionError } from '@/shared/errors';

/**
 * Personal dashboard for PSO users
 *
 * Displays:
 * - Assigned supervisor information
 * - Live video stream with controls
 * - Timer information for breaks
 * - Talk session notifications
 */
const PsoDashboardPage: React.FC = () => {
  const { account } = useAuth();
  const psoEmail = account?.username?.toLowerCase() ?? '';

  // Media permissions modal state
  const [mediaPermissionsModalOpen, setMediaPermissionsModalOpen] = useState(false);
  const [mediaPermissionError, setMediaPermissionError] = useState<MediaPermissionError | null>(null);

  // Supervisor information
  const { supervisor, refetchSupervisor } = usePsoSupervisor(psoEmail);
  usePsoSupervisorNotifications({ psoEmail, refetchSupervisor });

  // Streaming dashboard
  const { videoRef, audioRef, isStreaming, getCurrentRoom, startStream: startStreamBase, stopStream } = useStreamingDashboard();

  // Wrap startStream to catch media permission errors
  const startStream = useCallback(async (): Promise<void> => {
    try {
      await startStreamBase();
    } catch (error) {
      if (error instanceof MediaPermissionError) {
        setMediaPermissionError(error);
        setMediaPermissionsModalOpen(true);
      } else {
        logError('[PsoDashboardPage] Failed to start stream', { error, psoEmail });
        throw error; // Re-throw other errors
      }
    }
  }, [startStreamBase, psoEmail]);
  useAutoReloadWhenIdle(isStreaming, { intervalMs: AUTO_RELOAD_INTERVAL_MS, onlyWhenVisible: false });

  // Handle START/STOP commands from WebSocket
  useStreamCommandHandling({
    userEmail: psoEmail,
    onStartCommand: startStream,
    onStopCommand: stopStream,
  });

  // Talk session notifications
  const talkNotifications = useTalkSessionNotifications({
    psoEmail,
    onTalkSessionStart: (message) => {
      // Talk session started callback
    },
    onTalkSessionEnd: () => {
      // Talk session ended callback
    },
  });

  // Room ref for talk response
  const roomRef = useRef<Room | null>(null);
  useEffect(() => {
    roomRef.current = getCurrentRoom();
  }, [getCurrentRoom, isStreaming]);

  // PSO talk response (microphone publishing)
  usePsoTalkResponse({
    roomRef,
    isTalkActive: talkNotifications.isTalkActive,
  });

  // Streaming status and timer
  const { status: streamingStatus, loading: streamingStatusLoading } = usePsoStreamingStatus(psoEmail, isStreaming);
  const timerInfo = useSynchronizedTimer(
    streamingStatus?.lastSession?.stopReason || null,
    streamingStatus?.lastSession?.stoppedAt || null
  );

  // Auto-resume logic: if session was active or disconnected with DISCONNECT reason within 5 minutes, auto-start streaming
  // Similar to admin-web useBootstrap logic
  const hasInitializedRef = useRef<boolean>(false);
  useEffect(() => {
    // Skip if already initialized, currently streaming, status is loading, or missing required data
    if (hasInitializedRef.current || isStreaming || streamingStatusLoading || !streamingStatus || !psoEmail) {
      return;
    }

    const RESUME_WINDOW_MS = 5 * 60_000; // 5 minutes

    // If session was active (hasActiveSession is true), auto-resume immediately
    if (streamingStatus.hasActiveSession) {
      logDebug('[PsoDashboardPage] Auto-resuming stream - session was active', { psoEmail });
      hasInitializedRef.current = true;
      startStream().catch((error) => {
        logError('[PsoDashboardPage] Failed to auto-resume stream', { error, psoEmail });
      });
      return;
    }

    // Otherwise, check lastSession for DISCONNECT within window
    const lastSession = streamingStatus.lastSession;
    if (!lastSession) {
      hasInitializedRef.current = true;
      return;
    }

    const { stopReason, stoppedAt } = lastSession;
    
    // Only resume if stopped by DISCONNECT and within 5 minutes (using Costa Rica timezone)
    const withinWindow = stoppedAt
      ? isWithinCentralAmericaWindow(stoppedAt, RESUME_WINDOW_MS)
      : false;

    if (stopReason === StreamingStopReason.DISCONNECT && withinWindow) {
      logDebug('[PsoDashboardPage] Auto-resuming stream - DISCONNECT within window', { 
        reason: stopReason, 
        psoEmail,
        stoppedAt,
        withinWindow
      });
      hasInitializedRef.current = true;
      startStream().catch((error) => {
        logError('[PsoDashboardPage] Failed to auto-resume stream', { error, psoEmail });
      });
    } else {
      logDebug('[PsoDashboardPage] Not auto-resuming stream', {
        reason: stopReason,
        psoEmail,
        stoppedAt,
        withinWindow
      });
      hasInitializedRef.current = true;
    }
  }, [streamingStatus, streamingStatusLoading, isStreaming, psoEmail, startStream]);

  return (
    <>
      <MediaPermissionsModal
        open={mediaPermissionsModalOpen}
        onClose={() => setMediaPermissionsModalOpen(false)}
        cameras={mediaPermissionError?.cameras || []}
        microphones={mediaPermissionError?.microphones || []}
        cameraBlocked={mediaPermissionError?.cameraBlocked || false}
        microphoneBlocked={mediaPermissionError?.microphoneBlocked || false}
      />
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#542187]">
      {supervisor && (
        <div className="mb-4 text-white text-lg font-semibold">
          Supervisor: {supervisor.fullName}
        </div>
      )}

      <div className="relative w-full max-w-4xl mb-4 rounded-xl overflow-hidden bg-black h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]">
        <TalkActiveBanner
          isActive={talkNotifications.isTalkActive}
          isIncoming={talkNotifications.isIncoming}
          justEnded={talkNotifications.justEnded}
          supervisorName={talkNotifications.supervisorName || 'Supervisor'}
        />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          controls={false}
          className="w-full h-full"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect fill='%23000' width='640' height='360'/%3E%3Ctext fill='%23fff' font-family='Arial' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Stream%3C/text%3E%3C/svg%3E"
        >
          <track kind="captions" srcLang="en" label="English" />
        </video>
        <audio ref={audioRef} autoPlay hidden>
          <track kind="captions" srcLang="en" label="English" />
        </audio>

        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="mb-4">
                Streaming: <span className="text-red-400">OFF</span>
              </div>

              {timerInfo && (
                <div className="mt-4">
                  <div className="text-xl font-medium text-yellow-400 mb-2">
                    {timerInfo.type === TimerType.LUNCH_BREAK && 'Lunch Break'}
                    {timerInfo.type === TimerType.SHORT_BREAK && 'Short Break'}
                    {timerInfo.type === TimerType.QUICK_BREAK && 'Quick Break'}
                    {timerInfo.type === TimerType.EMERGENCY && 'Emergency'}
                    {timerInfo.type === TimerType.DISCONNECT && 'Disconnect'}
                  </div>
                  <CompactTimer timerInfo={timerInfo} />
                  {timerInfo.isNegative && (
                    <div className="text-sm text-red-400 mt-2">Overdue</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default PsoDashboardPage;

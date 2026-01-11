/**
 * @fileoverview PsoDashboardPage - Personal dashboard for PSO users
 * @summary Displays supervisor information, live video stream, and management tools
 * @description Renders a dashboard showing the PSO's assigned supervisor, live streaming
 * status with timer information. Listens for talk session notifications and plays audio alerts.
 */

import React, { useEffect, useRef } from 'react';
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
import { TalkActiveBanner } from '../components';
import { AUTO_RELOAD_INTERVAL_MS } from '../constants';
import { logDebug } from '@/shared/utils/logger';

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

  // Supervisor information
  const { supervisor, refetchSupervisor } = usePsoSupervisor(psoEmail);
  usePsoSupervisorNotifications({ psoEmail, refetchSupervisor });

  // Streaming dashboard
  const { videoRef, audioRef, isStreaming, getCurrentRoom, startStream, stopStream } = useStreamingDashboard();
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
  const { status: streamingStatus } = usePsoStreamingStatus(psoEmail, isStreaming);
  const timerInfo = useSynchronizedTimer(
    streamingStatus?.lastSession?.stopReason || null,
    streamingStatus?.lastSession?.stoppedAt || null
  );

  // Auto-resume logic: if disconnected with DISCONNECT reason within 5 minutes, auto-start streaming
  // Similar to admin-web useBootstrap logic
  const hasInitializedRef = useRef<boolean>(false);
  useEffect(() => {
    // Skip if already initialized, currently streaming, or missing required data
    if (hasInitializedRef.current || isStreaming || !streamingStatus || !psoEmail) {
      return;
    }

    const RESUME_WINDOW_MS = 5 * 60_000; // 5 minutes

    const lastSession = streamingStatus.lastSession;
    if (!lastSession) {
      hasInitializedRef.current = true;
      return;
    }

    const { stopReason, stoppedAt } = lastSession;
    
    // Only resume if:
    // 1. No stop time (session was active)
    // 2. OR stopped by DISCONNECT and within 5 minutes
    const withinWindow = stoppedAt
      ? Date.now() - new Date(stoppedAt).getTime() < RESUME_WINDOW_MS
      : true;

    if (!stoppedAt || (stopReason === StreamingStopReason.DISCONNECT && withinWindow)) {
      logDebug('[PsoDashboardPage] Auto-resuming stream', { 
        reason: stopReason || 'active', 
        psoEmail,
        stoppedAt,
        withinWindow,
        elapsedMs: stoppedAt ? Date.now() - new Date(stoppedAt).getTime() : null
      });
      hasInitializedRef.current = true;
      void startStream();
    } else {
      logDebug('[PsoDashboardPage] Not auto-resuming stream', {
        reason: stopReason,
        psoEmail,
        stoppedAt,
        withinWindow,
        elapsedMs: stoppedAt ? Date.now() - new Date(stoppedAt).getTime() : null
      });
      hasInitializedRef.current = true;
    }
  }, [streamingStatus, isStreaming, psoEmail, startStream]);

  return (
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
        />
        <audio ref={audioRef} autoPlay hidden />

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
  );
};

export default PsoDashboardPage;

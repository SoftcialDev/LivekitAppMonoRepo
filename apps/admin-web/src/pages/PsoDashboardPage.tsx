import React, { useEffect, useState } from 'react';
import { Room } from 'livekit-client';
import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/ui/ToastContext';
import { useContactManagerStatus } from './ContactManager/hooks/useContactManagerStatus';
import { useStreamingDashboard } from './Video/hooks/useCamara';
import { usePsoSupervisor } from './Video/hooks/usePsoSupervisor';
import { usePsoSupervisorNotifications } from './Video/hooks/usePsoSupervisorNotifications';
import { useAutoReloadWhenIdle } from './Video/hooks/useAutoReloadWhenIdle';
import { useWebSocketHeartbeat } from '@/shared/hooks/useWebSocketHeartbeat';
import { usePsoStreamingStatus } from './Video/hooks/usePsoStreamingStatus';
import { useSynchronizedTimer } from './Video/hooks/useSynchronizedTimer';
import { CompactTimer } from './Video/components/TimerDisplay';
import { useTalkSessionNotifications } from './Video/hooks/useTalkSessionNotifications';
import { usePsoTalkResponse } from './Video/hooks/usePsoTalkResponse';
import { TalkActiveBanner } from './Video/components/TalkActiveBanner';

/**
 * @fileoverview PsoDashboardPage - Personal dashboard for PSO users
 * @summary Displays supervisor information, live video stream, and management tools
 * @description Renders a dashboard showing the PSO's assigned supervisor, live streaming
 * status with timer information, and provides access to Contact Managers and action forms.
 * Listens for talk session notifications and plays audio alerts.
 */


const PsoDashboard: React.FC = () => {
  const { account } = useAuth();
  const psoEmail = account?.username ?? '';
  const senderName = account?.name ?? '';
  const { showToast } = useToast();

  const { supervisor, loading: supervisorLoading, refetchSupervisor } = usePsoSupervisor(psoEmail);
  
  usePsoSupervisorNotifications(psoEmail, refetchSupervisor);
  useWebSocketHeartbeat(psoEmail);

  const { videoRef, audioRef, isStreaming, videoTrack, getCurrentRoom } = useStreamingDashboard();
  useAutoReloadWhenIdle(isStreaming, { intervalMs: 120_000, onlyWhenVisible: false });
  
  const talkNotifications = useTalkSessionNotifications({
    psoEmail,
    onTalkSessionStart: (message) => {
      console.log('[PsoDashboard] Talk session started:', message);
    },
    onTalkSessionEnd: () => {
      console.log('[PsoDashboard] Talk session ended');
    }
  });

  const roomRef = React.useRef<Room | null>(null);
  React.useEffect(() => {
    roomRef.current = getCurrentRoom();
  }, [getCurrentRoom, isStreaming]);

  usePsoTalkResponse({
    roomRef,
    isTalkActive: talkNotifications.isTalkActive
  });

  const { status: streamingStatus, loading: statusLoading, error: statusError } = usePsoStreamingStatus(psoEmail, isStreaming);

  const timerInfo = useSynchronizedTimer(
    streamingStatus?.lastSession?.stopReason || null,
    streamingStatus?.lastSession?.stoppedAt || null
  );

  const { error: cmError } = useContactManagerStatus(psoEmail);

  useEffect(() => {
    if (cmError) {
      // Contact Manager error handling
    }
  }, [cmError, showToast]);                                    


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
          autoPlay playsInline muted={false} controls={false}
          className="w-full h-full"
          poster="https://via.placeholder.com/640x360?text=No+Stream"
        />
        <audio ref={audioRef} autoPlay hidden />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="mb-4">
                Streaming:{' '}
                <span className="text-red-400">
                  OFF
                </span>
              </div>
              
              {timerInfo && (
                <div className="mt-4">
                  <div className="text-xl font-medium text-yellow-400 mb-2">
                    {timerInfo.type === 'LUNCH_BREAK' && 'Lunch Break'}
                    {timerInfo.type === 'SHORT_BREAK' && 'Short Break'}
                    {timerInfo.type === 'QUICK_BREAK' && 'Quick Break'}
                    {timerInfo.type === 'EMERGENCY' && 'Emergency'}
                  </div>
                  <CompactTimer timerInfo={timerInfo} />
                  {timerInfo.isNegative && (
                    <div className="text-sm text-red-400 mt-2">
                      Overdue
                    </div>
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

export default PsoDashboard;

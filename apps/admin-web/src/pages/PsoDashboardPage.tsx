import React, { useEffect, useState } from 'react';
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



////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * PsoDashboard
 *
 * Renders a personal dashboard for a PSO (Public Safety Officer) user.
 * It displays the current user's supervisor (if available), embeds a live
 * video/audio stream, and provides two actions: opening the Contact Managers
 * modal and using the PSO actions form.
 *
 * Data sources:
 * - `useAuth()` provides `username` and `name` used as PSO identity.
 * - `getSupervisorForPso(email)` fetches the assigned supervisor.
 * - `useContactManagerStatus(email)` retrieves Contact Managers with status.
 * - `useStreamingDashboard()` supplies media refs and streaming state.
 *
 * UI:
 * - Main video container with an overlay showing streaming ON/OFF.
 * - Button to open the Contact Managers table inside a modal.
 * - `<PsoDashboardForm />` which includes its own “Actions” button and modal.
 *
 * Errors:
 * - Contact Manager load errors are surfaced via a toast notification.
 *
 * @returns The PSO dashboard screen with streaming preview and management tools.
 */


const PsoDashboard: React.FC = () => {
  const { account } = useAuth();

  /**
   * PSO identity derived from the authenticated account.
   * - `psoEmail` is used for data fetches.
   * - `senderName` is passed to forms or messages that need a display name.
   */
  const psoEmail   = account?.username ?? '';
  const senderName = account?.name ?? '';

  const { showToast } = useToast();                           

  /**
   * Supervisor information with real-time updates
   */
  const { supervisor, loading: supervisorLoading, refetchSupervisor } = usePsoSupervisor(psoEmail);
  
  /**
   * Listen for supervisor change notifications
   */
  usePsoSupervisorNotifications(psoEmail, refetchSupervisor);

  /**
   * WebSocket heartbeat to maintain connection in inactive tabs
   */
  useWebSocketHeartbeat(psoEmail);

  /**
   * Media streaming hooks:
   * - `videoRef` attaches to the <video> element.
   * - `audioRef` attaches to the <audio> element.
   * - `isStreaming` toggles the status indicator.
   */
  const { videoRef, audioRef, isStreaming, videoTrack } = useStreamingDashboard();
  useAutoReloadWhenIdle(isStreaming, { intervalMs: 120_000, onlyWhenVisible: false  });

  /**
   * PSO Streaming Status - para obtener información del timer
   * Pasar isStreaming para detectar cambios inmediatos
   */
  const { status: streamingStatus, loading: statusLoading, error: statusError } = usePsoStreamingStatus(psoEmail, isStreaming);

  /**
   * Timer sincronizado basado en el streaming status
   */
  const timerInfo = useSynchronizedTimer(
    streamingStatus?.lastSession?.stopReason || null,
    streamingStatus?.lastSession?.stoppedAt || null
  );

  // Debug logging (only log when streaming status changes significantly)
  useEffect(() => {
  }, [psoEmail, streamingStatus?.lastSession?.stopReason, statusLoading, statusError, timerInfo]);

  /**
   * Contact Manager data feed for the given PSO.
   * - `managers`: array of ContactManagerProfile records.
   * - `cmLoading`: loading state for table and modal.
   * - `cmError`: error object/string used to trigger toast and fallback UI.
   */
  const {                                  
    error: cmError
  } = useContactManagerStatus(psoEmail);                     

  /**
   * When Contact Manager loading fails, show a toast message once per error.
   */
  useEffect(() => {
    if (cmError) {

    }
  }, [cmError, showToast]);                                    


  return (
    <>
      {/* Main wrapper with centered layout and purple background */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#542187]">
        {/* Supervisor banner (only shown when available) */}
        {supervisor && (
          <div className="mb-4 text-white text-lg font-semibold">
            Supervisor: {supervisor.fullName}
          </div>
        )}

         {/* Streaming viewport: responsive height, black background */}
         <div className="relative w-full max-w-4xl mb-4 rounded-xl overflow-hidden bg-black h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]">
           <video
             ref={videoRef}
             autoPlay playsInline muted={false} controls={false}
             className="w-full h-full"
             poster="https://via.placeholder.com/640x360?text=No+Stream"
           />
           <audio ref={audioRef} autoPlay hidden />
           
           {/* Status overlay - CENTRADO como VideoCard */}
           {!isStreaming && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
               <div className="text-center text-white">
                 <div className="mb-4">
                   Streaming:{' '}
                   <span className="text-red-400">
                     OFF
                   </span>
                 </div>
                 
                 {/* Status and Timer Display - Solo cuando hay timer activo */}
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

        {/* Bitrate Dashboard - Hidden to avoid interference */}
        {/* <div className="w-full max-w-4xl mb-4">
          <BitrateDashboard videoRef={videoRef} isStreaming={isStreaming} videoTrack={videoTrack} />
        </div> */}
      </div>

    </>
  );
};

export default PsoDashboard;

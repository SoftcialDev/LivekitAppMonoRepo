/**
 * @fileoverview useBootstrap - manages application initialization and event handlers
 * @summary Handles WebSocket connection, presence, auto-resume, and event listeners
 * @description Provides centralized bootstrap logic for WebSocket connection, presence management,
 * auto-resume functionality, and event handlers for visibility, connectivity, and page lifecycle.
 */

import { useCallback, useRef, useEffect } from 'react';
import { webPubSubClient as pubSubService } from '@/shared/api/webpubsubClient';
import { PresenceClient } from '@/shared/api/presenceClient';
import { StreamingClient } from '@/shared/api/streamingClient';
import { PendingCommand } from '@/shared/api/pendingCommandsClient';
import { isWithinCentralAmericaWindow, formatIsoToCR } from '@/shared/utils/time';

export interface UseBootstrapProps {
  userEmail: string;
  streamingRef: React.MutableRefObject<boolean>;
  videoRef: React.RefObject<HTMLVideoElement>;
  liveKit: any; // LiveKit connection hook
  presenceClient: PresenceClient;
  streamingClient: StreamingClient;
  requestWakeLock: () => Promise<void>;
  releaseWakeLock: () => Promise<void>;
  onStartStream: () => Promise<void>;
  onStopStream: () => Promise<void>;
  onHandleCommand: (cmd: PendingCommand) => Promise<void>;
  onFetchMissedCommands: () => Promise<void>;
  KEEP_AWAKE_WHEN_IDLE: boolean;
}

/**
 * Hook for managing application bootstrap and event handlers
 * 
 * @param props - Configuration for bootstrap functionality
 * @returns Object containing bootstrap functions
 */
export function useBootstrap({
  userEmail,
  streamingRef,
  videoRef,
  liveKit,
  presenceClient,
  streamingClient,
  requestWakeLock,
  releaseWakeLock,
  onStartStream,
  onStopStream,
  onHandleCommand,
  onFetchMissedCommands,
  KEEP_AWAKE_WHEN_IDLE
}: UseBootstrapProps) {
  const RESUME_WINDOW_MS = 5 * 60_000; // 10 minutes
  const bootRef = useRef<boolean>(false);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sleepDetectorRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initializes WebSocket connection and sets up event handlers
   */
  const initialize = useCallback(async (): Promise<() => void> => {
    if (bootRef.current) return () => {};
    bootRef.current = true;
    let mounted = true;

    // Removed initialization log to reduce console spam

    // WebSocket connection
    if (!pubSubService.isConnected()) {
      await pubSubService.connect(userEmail);
      await new Promise((r) => setTimeout(r, 200));
      try { await pubSubService.joinGroup('presence'); } catch {}
      try { await pubSubService.joinGroup(`commands:${userEmail}`); } catch {}
      // Removed connection log to reduce console spam
    }

    // Wake lock
    if (KEEP_AWAKE_WHEN_IDLE && !streamingRef.current) {
      await requestWakeLock();
    }

    // Auto-resume logic
    try {
      const last = await streamingClient.fetchLastSessionWithReason();
      const stoppedAt = last.stoppedAt ? new Date(last.stoppedAt) : null;
      const stopReason = last.stopReason;
      
      // Removed debug log to reduce console spam
      
      // Only resume if:
      // 1. No stop time (session was active)
      // 2. OR stopped by DISCONNECT and within 5 minutes
      // Compare using Central America wall clock window OR raw UTC diff as fallback
      const withinWindow = last.stoppedAt
        ? (isWithinCentralAmericaWindow(last.stoppedAt, RESUME_WINDOW_MS) ||
           (Date.now() - new Date(last.stoppedAt).getTime() < RESUME_WINDOW_MS))
        : true;

      if (!stoppedAt || (stopReason === 'DISCONNECT' && withinWindow)) {
        console.info(`[Streaming] resuming (reason: ${stopReason || 'active'})`);
        await onStartStream();
      } else if (stopReason === 'COMMAND') {
        console.info('[Streaming] NOT resuming - stopped by external command');
      } else {
        console.info(`[Streaming] NOT resuming - stopped too long ago (${stopReason})`);
      }
    } catch (error) {
      console.warn('[Bootstrap] Failed to check last session:', error);
    }

    // Event handlers
    const offDisc = pubSubService.onDisconnected(() => {
      if (!mounted) return;
      console.warn('[WS] disconnected');
      void presenceClient.setOffline();
      void onStopStream();
    });

    /**
     * Checks if streaming should be resumed after WebSocket reconnection
     */
    const checkAndResumeStreaming = async (): Promise<void> => {
      try {

        // Only check if not already streaming
        if (streamingRef.current) {

          return;
        }
        
        const lastSession = await streamingClient.fetchLastSessionWithReason();
        const stoppedAt = lastSession.stoppedAt ? new Date(lastSession.stoppedAt) : null;
        const stopReason = lastSession.stopReason;

        
        // Resume if:
        // 1. Session was stopped due to disconnect
        // 2. Stop was recent (within 5 minutes)
        // 3. Not already streaming
        const shouldResume = !!(lastSession.stoppedAt &&
          stopReason === 'DISCONNECT' && (
            isWithinCentralAmericaWindow(lastSession.stoppedAt, RESUME_WINDOW_MS) ||
            (Date.now() - new Date(lastSession.stoppedAt).getTime() < RESUME_WINDOW_MS)
          ));
        
        if (shouldResume) {
  await onStartStream();
        } else {
        }
      } catch (error) {
        console.warn('[Bootstrap] Failed to check streaming status after reconnection:', error);
      }
    };

    const offConn = pubSubService.onConnected(async () => {
      if (!mounted) return;
      console.info('[WS] reconnected');
      await pubSubService.joinGroup('presence');
      await pubSubService.joinGroup(`commands:${userEmail}`);
      if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
        await requestWakeLock();
      }
      
      // Auto-resume streaming if it was active before disconnection
      await checkAndResumeStreaming();
    });

    const offMsg = pubSubService.onMessage((msg: any) => {
      
      if (msg?.employeeEmail && msg.employeeEmail.toLowerCase() !== userEmail) {
        return;
      }

      if (msg?.command === 'START' || msg?.command === 'STOP') {
        console.log('[WebSocket] Processing command:', msg);
        void onHandleCommand(msg as PendingCommand);
      }
    });

    // Missed commands
    try {
      await onFetchMissedCommands();
    } catch (error) {
      console.warn('[Bootstrap] Failed to fetch missed commands:', error);
    }

    // Event listeners
    const onVisible = async (): Promise<void> => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      

      
      try {
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
        
        // Restore video if streaming
        if (streamingRef.current && !videoRef.current?.srcObject) {
          try {
            const localParticipant = liveKit.getCurrentRoom()?.localParticipant;
            if (localParticipant) {
              const videoTracks = Array.from(localParticipant.videoTrackPublications.values());
              if (videoTracks.length > 0) {
                const videoTrackPub: any = videoTracks[0];
                if (videoTrackPub.track && videoRef.current) {
                  const mediaStreamTrack = videoTrackPub.track.mediaStreamTrack;
                  if (mediaStreamTrack) {
                    videoRef.current.srcObject = new MediaStream([mediaStreamTrack]);
                  }
                }
              }
            }
          } catch (e) {
            console.error('[WS] Failed to restore video:', e);
          }
        }
      } catch (e) {
        console.warn('[WS] onVisible handler failed', e);
      }
    };

    const onHidden = async (): Promise<void> => {
      if (document.visibilityState !== 'hidden') {
        return;
      }
      

      // Optional: You could reduce health check frequency here
      // or implement other optimizations for inactive tabs
    };

    const onOnline = async (): Promise<void> => {
      try {
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
      } catch (e) {
        console.warn('[WS] onOnline handler failed', e);
      }
    };

    const onPageShow = async (): Promise<void> => {
      try {
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
      } catch (e) {
        console.warn('[WS] onPageShow handler failed', e);
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        onVisible();
      } else {
        onHidden();
      }
    });
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);

    // Keep alive interval
    keepAliveIntervalRef.current = setInterval(() => {
      if (streamingRef.current) {
        // Force tab to stay active
        if (document.visibilityState === 'hidden') {
          document.title = document.title === 'In Contact' ? 'In Contact - Active' : 'In Contact';
          
          if (videoRef.current && videoRef.current.srcObject) {
            const currentStream = videoRef.current.srcObject;
            videoRef.current.srcObject = currentStream;
          }
        }
        
        // Proactive video restoration
        if (streamingRef.current && videoRef.current && !videoRef.current.srcObject) {
          try {
            const localParticipant = liveKit.getCurrentRoom()?.localParticipant;
            if (localParticipant) {
              const videoTracks = Array.from(localParticipant.videoTrackPublications.values());
              if (videoTracks.length > 0) {
                const videoTrackPub: any = videoTracks[0];
                if (videoTrackPub.track && videoRef.current) {
                  const mediaStreamTrack = videoTrackPub.track.mediaStreamTrack;
                  if (mediaStreamTrack) {
                    videoRef.current.srcObject = new MediaStream([mediaStreamTrack]);
                  }
                }
              }
            }
          } catch (e) {
            console.error('[WS] Keep alive: Failed to restore video:', e);
          }
        }
      }
    }, 2_000);

    // Sleep detector
    let lastTick = Date.now();
    sleepDetectorRef.current = setInterval(async () => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;

      if (delta > 60_000) {
        console.warn('[WS] sleep detected, forcing reconnect');
        await pubSubService.reconnect();
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
      }
      
      // Video health check
      if (streamingRef.current && videoRef.current && !videoRef.current.srcObject) {
        try {
          const localParticipant = liveKit.getCurrentRoom()?.localParticipant;
          if (localParticipant) {
            const videoTracks = Array.from(localParticipant.videoTrackPublications.values());
            if (videoTracks.length > 0) {
              const videoTrackPub: any = videoTracks[0];
              if (videoTrackPub.track && videoRef.current) {
                const mediaStreamTrack = videoTrackPub.track.mediaStreamTrack;
                if (mediaStreamTrack) {
                  videoRef.current.srcObject = new MediaStream([mediaStreamTrack]);
                }
              }
            }
          }
        } catch (e) {
          console.error('[WS] Health check: Failed to restore video:', e);
        }
      }
    }, 15_000);

    // Cleanup function
    return () => {
      mounted = false;
      window.removeEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          onVisible();
        } else {
          onHidden();
        }
      });
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onPageShow);
      
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
      
      if (sleepDetectorRef.current) {
        clearInterval(sleepDetectorRef.current);
        sleepDetectorRef.current = null;
      }
      
      console.debug('[Bootstrap] cleanup');
      (async () => {
        await releaseWakeLock();
        await liveKit.disconnectFromRoom();
        await presenceClient.setOffline();
        offMsg?.();
        offConn?.();
        offDisc?.();
      })();
    };
  }, [
    userEmail,
    streamingRef,
    videoRef,
    liveKit,
    presenceClient,
    streamingClient,
    requestWakeLock,
    releaseWakeLock,
    onStartStream,
    onStopStream,
    onHandleCommand,
    onFetchMissedCommands,
    KEEP_AWAKE_WHEN_IDLE
  ]);

  /**
   * Cleans up all bootstrap resources
   */
  const cleanup = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    
    if (sleepDetectorRef.current) {
      clearInterval(sleepDetectorRef.current);
      sleepDetectorRef.current = null;
    }
  }, []);

  return {
    initialize,
    cleanup
  };
}

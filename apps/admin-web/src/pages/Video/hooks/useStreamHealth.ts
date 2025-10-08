/**
 * @fileoverview useStreamHealth - monitors room/track health and restores preview.
 */

import { useCallback, useRef } from 'react';
import type { Room, LocalVideoTrack } from 'livekit-client';
import { webPubSubClient as pubSubService } from '@/shared/api/webpubsubClient';

export function useStreamHealth() {
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastConnectionStateRef = useRef<boolean>(false);

  const start = useCallback(
    (
      getRoom: () => Room | null,
      getVideoTrack: () => LocalVideoTrack | undefined,
      videoRef: React.RefObject<HTMLVideoElement>,
      streamingRef: React.MutableRefObject<boolean>,
      onDisconnected: () => void,
      onTrackEnded: () => void,
    ) => {
      if (healthTimerRef.current) return;
      healthTimerRef.current = setInterval(() => {
        if (!streamingRef.current) return;
        
        // Check WebSocket connection state
        const isWebSocketConnected = pubSubService.isConnected();
        const wasDisconnected = !lastConnectionStateRef.current && isWebSocketConnected;
        lastConnectionStateRef.current = isWebSocketConnected;
        
        if (wasDisconnected) {
          console.log('[StreamHealth] WebSocket reconnected - checking stream health');
        }
        
        const room = getRoom();
        const track = getVideoTrack();
        const state = room?.state;
        const ready = track?.mediaStreamTrack?.readyState;

        if (state === 'disconnected') {
          onDisconnected();
          return;
        }

        if (ready === 'ended') {
          onTrackEnded();
          return;
        }

        if (videoRef.current && track && !videoRef.current.srcObject) {
          try {
            videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
          } catch {}
        }
      }, 5000);
    },
    [],
  );

  const stop = useCallback(() => {
    if (healthTimerRef.current) {
      clearInterval(healthTimerRef.current);
      healthTimerRef.current = null;
    }
  }, []);

  return { start, stop };
}



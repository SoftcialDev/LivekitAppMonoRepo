/**
 * @fileoverview useLiveKitRoomSetup - LiveKit room setup hook for PSO Dashboard
 * @summary Handles room configuration, event listeners, and track publishing
 * @description Provides functionality to set up LiveKit room with proper configuration,
 * event listeners, audio routing, and video track publishing with 240p at 15 fps encoding.
 */

import { useCallback } from 'react';
import type { Room, LocalVideoTrack, RemoteParticipant, RemoteAudioTrack } from 'livekit-client';
import { ParticipantEvent, RoomEvent } from 'livekit-client';
import { logWarn, logError, logDebug, logInfo } from '@/shared/utils/logger';
import { VIDEO_ENCODING } from '../../constants';
import type { IUseLiveKitRoomSetupOptions, ISetupRoomEventListenersOptions } from './types/useLiveKitRoomSetupTypes';

/**
 * Sets up room event listeners for connection state changes and participant management
 *
 * @param room - LiveKit room instance
 * @param options - Configuration options
 */
function setupRoomEventListeners(
  room: Room,
  options: ISetupRoomEventListenersOptions
): void {
  const { streamingRef, manualStopRef, onDisconnected } = options;

  room.on('connectionStateChanged', (state) => {
    logDebug('[LiveKit] Connection state changed', { state });
    
    if (state === 'disconnected' && streamingRef.current) {
      // Check if this was a manual stop
      if (manualStopRef.current) {
        logDebug('[LiveKit] Manual stop detected, skipping auto-reconnect');
        return;
      }
      
      logInfo('[LiveKit] Room disconnected during streaming, triggering reconnection');
      if (onDisconnected) {
        // Delay to avoid immediate reconnect during normal disconnection sequence
        setTimeout(() => {
          onDisconnected();
        }, 1000);
      }
    }
  });

  room.on('participantConnected', (participant) => {
    logDebug('[LiveKit] Participant connected', { identity: participant.identity });
  });

  room.on('participantDisconnected', (participant) => {
    logDebug('[LiveKit] Participant disconnected', { identity: participant.identity });
  });

  room.on('trackUnpublished', (publication, participant) => {
    logDebug('[LiveKit] Track unpublished', { 
      trackSid: publication.trackSid,
      identity: participant.identity 
    });
  });

  room.on('disconnected', (reason) => {
    logDebug('[LiveKit] Room disconnected', { reason });
  });
}

/**
 * Sets up video track monitoring for ended events
 *
 * @param videoTrack - Local video track to monitor
 * @param streamingRef - Ref to streaming state
 * @param manualStopRef - Ref to manual stop flag
 * @param onTrackEnded - Callback when track ends
 */
function setupVideoTrackMonitoring(
  videoTrack: LocalVideoTrack,
  streamingRef: React.MutableRefObject<boolean>,
  manualStopRef: React.MutableRefObject<boolean>,
  onTrackEnded?: () => void
): void {
  // Monitor track ended event
  videoTrack.on('ended', () => {
    if (streamingRef.current && !manualStopRef.current) {
      logInfo('[LiveKit] Video track ended during streaming, triggering reconnection');
      if (onTrackEnded) {
        onTrackEnded();
      }
    }
  });

  // Also check mediaStreamTrack readyState periodically as backup
  const checkInterval = setInterval(() => {
    if (!streamingRef.current || manualStopRef.current) {
      clearInterval(checkInterval);
      return;
    }

    const mediaStreamTrack = videoTrack.mediaStreamTrack;
    if (mediaStreamTrack?.readyState === 'ended') {
      logInfo('[LiveKit] Video track mediaStreamTrack ended, triggering reconnection');
      clearInterval(checkInterval);
      if (onTrackEnded) {
        onTrackEnded();
      }
    }
  }, 2000); // Check every 2 seconds

  // Cleanup interval when track is ended
  videoTrack.on('ended', () => {
    clearInterval(checkInterval);
  });
}

/**
 * Attaches remote participant audio to an audio element
 *
 * @param participant - Remote participant whose audio should be rendered
 * @param audioElement - HTML audio element to attach audio to
 */
function attachParticipantAudio(
  participant: RemoteParticipant, 
  audioElement: HTMLAudioElement
): void {
  // Attach already-subscribed audio
  participant.getTrackPublications().forEach((pub: any) => {
    if (pub?.kind === 'audio' && pub.isSubscribed && pub.audioTrack && audioElement) {
      (pub.audioTrack as RemoteAudioTrack).attach(audioElement);
      audioElement.muted = false;
      audioElement.play?.().catch(() => {});
    }
  });

  // New audio subscriptions
  participant.on(ParticipantEvent.TrackSubscribed, (track) => {
    if (track.kind === 'audio' && audioElement) {
      (track as RemoteAudioTrack).attach(audioElement);
      audioElement.muted = false;
      audioElement.play?.().catch(() => {});
    }
  });

  // Audio unsubscriptions
  participant.on(ParticipantEvent.TrackUnsubscribed, (track) => {
    if (track.kind === 'audio' && audioElement) {
      try {
        (track as RemoteAudioTrack).detach(audioElement);
      } catch {
        // Ignore detach errors
      }
    }
  });
}

/**
 * Sets up audio routing for all remote participants in the room
 *
 * @param room - LiveKit room instance
 * @param audioElement - HTML audio element to attach audio to
 */
function setupAudioRouting(room: Room, audioElement: HTMLAudioElement): void {
  try {
    // Attach audio for participants already in the room (exclude self)
    room.remoteParticipants.forEach((p) => {
      if (p.sid !== room.localParticipant.sid) {
        attachParticipantAudio(p, audioElement);
      }
    });

    // Attach audio for participants that join later (exclude self)
    room.on(RoomEvent.ParticipantConnected, (p) => {
      if (p.sid !== room.localParticipant.sid) {
        attachParticipantAudio(p, audioElement);
      }
    });
    
    logDebug('[LiveKit] Audio routing configured for remote participants');
  } catch (err) {
    logWarn('[LiveKit] Failed to configure audio routing', { error: err });
  }
}

/**
 * Hook for setting up LiveKit room with proper configuration
 *
 * @remarks
 * Provides functionality to set up room event listeners, audio routing,
 * and publish video tracks with encoding configuration (240p at 15 fps, 150 kbps).
 *
 * @param options - Configuration options for room setup
 * @returns Object containing room setup functions
 */
export function useLiveKitRoomSetup(options?: IUseLiveKitRoomSetupOptions) {
  /**
   * Publishes a video track to the room with proper encoding configuration
   * 
   * @param room - The LiveKit room instance
   * @param videoTrack - The video track to publish (240p at 15 fps)
   * @returns Promise that resolves when track is published
   * @throws {Error} When track publication fails
   */
  const publishVideoTrack = useCallback(async (
    room: Room, 
    videoTrack: LocalVideoTrack
  ): Promise<void> => {
    logDebug('[LiveKit] Publishing video track', {
      resolution: `${VIDEO_ENCODING.maxFramerate}fps`,
      bitrate: VIDEO_ENCODING.maxBitrate
    });
    
    try {
      await room.localParticipant.publishTrack(videoTrack, {
        name: 'camera',
        simulcast: false,
        videoEncoding: {
          maxBitrate: VIDEO_ENCODING.maxBitrate,
          maxFramerate: VIDEO_ENCODING.maxFramerate,
        }
      });
      logDebug('[LiveKit] Video track published successfully');
      
      // Verify publication
      const publishedTracks = room.localParticipant.getTrackPublications();
      const videoPublication = publishedTracks.find(pub => pub.kind === 'video');
      
      if (!videoPublication) {
        const error = new Error('Video track publication verification failed');
        logError('[LiveKit] Video track publication verification failed');
        throw error;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logError('[LiveKit] Failed to publish video track', { error });
      throw error;
    }
  }, []);

  /**
   * Sets up a complete LiveKit room with all necessary configuration
   * 
   * @param room - The LiveKit room instance
   * @param videoTrack - The video track to publish (240p at 15 fps)
   * @param audioRef - Optional reference to HTML audio element for remote participant audio
   * @returns Promise that resolves when setup is complete
   */
  const setupRoom = useCallback(async (
    room: Room, 
    videoTrack: LocalVideoTrack,
    audioRef?: React.RefObject<HTMLAudioElement>
  ): Promise<void> => {
    logDebug('[LiveKit] Setting up room');
    
    // Set up event listeners with callbacks if provided
    if (options) {
      setupRoomEventListeners(room, {
        streamingRef: options.streamingRef,
        manualStopRef: options.manualStopRef,
        onDisconnected: options.onDisconnected,
        onTrackEnded: options.onTrackEnded,
      });
      
      // Set up video track monitoring
      setupVideoTrackMonitoring(
        videoTrack,
        options.streamingRef,
        options.manualStopRef,
        options.onTrackEnded
      );
    } else {
      // Legacy behavior: just log events
      setupRoomEventListeners(room, {
        streamingRef: { current: false },
        manualStopRef: { current: false },
      });
    }
    
    // Set up audio routing for remote participants
    if (audioRef?.current) {
      setupAudioRouting(room, audioRef.current);
    }
    
    // Publish video track
    await publishVideoTrack(room, videoTrack);
    
    logDebug('[LiveKit] Room setup completed');
  }, [publishVideoTrack, options]);

  return {
    setupRoom,
    publishVideoTrack,
  };
}

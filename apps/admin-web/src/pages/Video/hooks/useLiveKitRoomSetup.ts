/**
 * @fileoverview useLiveKitRoomSetup - handles LiveKit room configuration and setup
 * @summary Manages room event listeners, audio routing, and video track publishing
 * @description Provides centralized LiveKit room setup functionality including event listeners,
 * audio routing for remote participants, and video track publishing with proper error handling.
 */

import { useCallback } from 'react';
import { Room, LocalVideoTrack, LocalAudioTrack, RoomEvent, ParticipantEvent, RemoteParticipant, RemoteAudioTrack } from 'livekit-client';

export interface UseLiveKitRoomSetupProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  streamingRef: React.MutableRefObject<boolean>;
  manualStopRef: React.MutableRefObject<boolean>;
  onDisconnected: () => void;
  onTrackEnded: () => void;
}

/**
 * Hook for managing LiveKit room setup and configuration
 * 
 * @param props - Configuration object for room setup
 * @returns Object containing room setup functions
 */
export function useLiveKitRoomSetup({
  audioRef,
  videoRef,
  streamingRef,
  manualStopRef,
  onDisconnected,
  onTrackEnded
}: UseLiveKitRoomSetupProps) {
  
  /**
   * Sets up event listeners for the LiveKit room
   * 
   * @param room - The LiveKit room instance
   */
  const setupRoomEventListeners = useCallback((room: Room) => {
    // Connection state changes
    room.on('connectionStateChanged', (state) => {
      console.log('[LiveKit] Connection state changed:', state);
      
      if (state === 'connected' && streamingRef.current) {
        console.log('[LiveKit] Reconnected, ensuring video continues');
      } else if (state === 'disconnected' && streamingRef.current) {
        // Check if this was a manual stop
        if (manualStopRef.current) {
          console.log('[LiveKit] Manual stop detected, skipping auto-reconnect');
          return;
        }
        
        console.log('[LiveKit] Disconnected during streaming, triggering reconnection...');
        setTimeout(() => {
          onDisconnected();
        }, 1000);
      }
    });
    
    // Participant events
    room.on('participantConnected', (participant) => {
      console.log('[LiveKit] Participant connected:', participant.identity);
    });
    
    room.on('participantDisconnected', (participant) => {
      console.log('[LiveKit] Participant disconnected:', participant.identity);
    });
    
    // Video track monitoring
    room.on(RoomEvent.TrackUnpublished, (track, participant) => {
      if (participant.sid === room.localParticipant.sid && track.kind === 'video') {
        console.log('[LiveKit] Local video track unpublished');
        
        // If track was unpublished and we're streaming, try to reconnect
        if (streamingRef.current && (track as any).mediaStreamTrack?.readyState === 'ended') {
          console.log('[LiveKit] Video track ended during streaming, triggering reconnection...');
          setTimeout(() => {
            onTrackEnded();
          }, 1000);
        }
      }
    });
  }, [streamingRef, manualStopRef, onDisconnected, onTrackEnded]);

  /**
   * Attaches remote participant audio to the audio element
   * 
   * @param participant - Remote participant whose audio should be rendered
   */
  const attachParticipantAudio = useCallback((participant: RemoteParticipant) => {
    // Attach already-subscribed audio
    participant.getTrackPublications().forEach((pub: any) => {
      if (pub?.kind === 'audio' && pub.isSubscribed && pub.audioTrack && audioRef.current) {
        (pub.audioTrack as RemoteAudioTrack).attach(audioRef.current);
        audioRef.current.muted = false;
        audioRef.current.play?.().catch(() => {});
      }
    });

    // New audio subscriptions
    participant.on(ParticipantEvent.TrackSubscribed, (track) => {
      const kind = (track as any)?.kind;
      if (kind === 'audio' && audioRef.current) {
        (track as RemoteAudioTrack).attach(audioRef.current);
        audioRef.current.muted = false;
        audioRef.current.play?.().catch(() => {});
      }
    });

    // Audio unsubscriptions
    participant.on(ParticipantEvent.TrackUnsubscribed, (track) => {
      const kind = (track as any)?.kind;
      if (kind === 'audio' && audioRef.current) {
        try {
          (track as RemoteAudioTrack).detach(audioRef.current);
        } catch {}
      }
    });
  }, [audioRef]);

  /**
   * Sets up audio routing for all participants in the room
   * 
   * @param room - The LiveKit room instance
   */
  const setupAudioRouting = useCallback((room: Room) => {
    // Attach audio for participants already in the room (exclude self)
    room.remoteParticipants.forEach((participant) => {
      if (participant.sid !== room.localParticipant.sid) {
        attachParticipantAudio(participant);
      }
    });

    // Attach audio for participants that join later (exclude self)
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      if (participant.sid !== room.localParticipant.sid) {
        attachParticipantAudio(participant);
      }
    });
  }, [attachParticipantAudio]);

  /**
   * Publishes a video track to the room
   * 
   * @param room - The LiveKit room instance
   * @param videoTrack - The video track to publish
   * @returns Promise that resolves when track is published
   */
  const publishVideoTrack = useCallback(async (room: Room, videoTrack: LocalVideoTrack): Promise<void> => {
    console.log('[LiveKit] Publishing video track...');
    
    try {
      await room.localParticipant.publishTrack(videoTrack, {
        name: 'camera',
        simulcast: false,
        videoEncoding: {
          maxBitrate: 150_000, // 150 kbps max for 240p (maximum efficiency)
          maxFramerate: 15
        }
      });
      console.log('[LiveKit] Video track published successfully');
      
      // Verify publication
      const publishedTracks = room.localParticipant.getTrackPublications();
      const videoPublication = publishedTracks.find(pub => pub.kind === 'video');
      
      if (!videoPublication) {
        console.warn('[LiveKit] Video track publication verification failed');
        throw new Error('Video track publication failed');
      }
      
    } catch (err) {
      console.error('[LiveKit] Failed to publish video track:', err);
      throw err;
    }
  }, []);

  /**
   * Sets up a complete LiveKit room with all necessary configuration
   * 
   * @param room - The LiveKit room instance
   * @param videoTrack - The video track to publish
   * @returns Promise that resolves when setup is complete
   */
  const setupRoom = useCallback(async (room: Room, videoTrack: LocalVideoTrack): Promise<void> => {
    console.log('[LiveKit] Setting up room...');
    
    // Set up event listeners
    setupRoomEventListeners(room);
    
    // Set up audio routing
    setupAudioRouting(room);
    
    // Publish video track
    await publishVideoTrack(room, videoTrack);
    
    console.log('[LiveKit] Room setup completed');
  }, [setupRoomEventListeners, setupAudioRouting, publishVideoTrack]);

  return {
    setupRoom,
    setupRoomEventListeners,
    setupAudioRouting,
    publishVideoTrack,
    attachParticipantAudio
  };
}

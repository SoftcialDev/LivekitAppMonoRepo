/**
 * @fileoverview useLiveKitConnection - LiveKit room connection and management hook
 * @summary Handles LiveKit room connection, track publishing, participant management, and audio routing
 * @description Provides functionality to connect to LiveKit rooms, publish video/audio tracks,
 * manage remote participants, handle audio routing, and manage room lifecycle.
 */

import { useRef, useCallback } from 'react';
import {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteAudioTrack,
} from 'livekit-client';
import { getLiveKitToken } from '@/shared/api/livekitClient';

/**
 * Hook for managing LiveKit room connections and track publishing
 *
 * @remarks
 * Provides functionality to connect to LiveKit rooms, publish video/audio tracks,
 * manage remote participants, handle audio routing, and manage room lifecycle.
 *
 * @returns Object containing LiveKit connection management functions
 */
export function useLiveKitConnection() {
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<{ video?: LocalVideoTrack; audio?: LocalAudioTrack }>({});
  const isConnectingRef = useRef<boolean>(false);

  /**
   * Connects to a LiveKit room with the provided token
   *
   * @param livekitUrl - LiveKit server URL
   * @param token - Authentication token for the room
   * @param roomConfig - Optional room configuration
   * @returns Promise that resolves to the connected room
   * @throws {Error} When connection fails
   */
  const connectToRoom = useCallback(async (
    livekitUrl: string, 
    token: string, 
    roomConfig: any = {}
  ): Promise<Room> => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current) {
      console.warn('[LiveKit] Connection already in progress, skipping...');
      throw new Error('Connection already in progress');
    }

    if (roomRef.current && roomRef.current.state === 'connected') {
      console.warn('[LiveKit] Already connected to room, skipping...');
      return roomRef.current;
    }

    isConnectingRef.current = true;

    try {
      // Clean up any existing room first
      if (roomRef.current) {
        try {
          await roomRef.current.disconnect();
        } catch (e) {
          console.warn('[LiveKit] Error disconnecting existing room:', e);
        }
        roomRef.current = null;
      }

      const room = new Room();
      
      // Set up connection state tracking
      room.on('connectionStateChanged', (state) => {
        console.log('[LiveKit] Connection state changed:', state);
        if (state === 'disconnected') {
          isConnectingRef.current = false;
          
          // Check if disconnection was due to tab inactivity
          if (document.visibilityState === 'hidden') {
            console.log('[LiveKit] Disconnected due to tab inactivity');
          }
        }
      });

      // Configure room with retry settings
      const enhancedRoomConfig = {
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: false,
          videoEncoding: {
            maxBitrate: 150_000,
            maxFramerate: 15
          }
        },
        // Configure connection retry settings
        reconnectPolicy: {
          nextRetryDelayInMs: (context: any) => {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            return Math.min(1000 * Math.pow(2, context.retryCount), 16000);
          },
          maxRetries: 3
        },
        ...roomConfig
      };

      await room.connect(livekitUrl, token, enhancedRoomConfig);
      roomRef.current = room;
      isConnectingRef.current = false;
      return room;
    } catch (error) {
      isConnectingRef.current = false;
      console.error('[LiveKit] Connection failed:', error);
      throw error;
    }
  }, []);

  /**
   * Sets up room event listeners for connection state changes and participant management
   *
   * @param room - LiveKit room instance
   * @param onConnectionStateChanged - Callback for connection state changes
   * @param onParticipantConnected - Callback for participant connections
   * @param onParticipantDisconnected - Callback for participant disconnections
   * @param onTrackUnpublished - Callback for track unpublishing events
   */
  const setupRoomEventListeners = useCallback((
    room: Room,
    onConnectionStateChanged?: (state: string) => void,
    onParticipantConnected?: (participant: RemoteParticipant) => void,
    onParticipantDisconnected?: (participant: RemoteParticipant) => void,
    onTrackUnpublished?: (track: any, participant: any) => void
  ): void => {
    try {
      // Set up event listeners to handle connection state changes
      room.on('connectionStateChanged', (state) => {
        onConnectionStateChanged?.(state);
      });
      
      room.on('participantConnected', (participant) => {
        onParticipantConnected?.(participant);
      });
      
      room.on('participantDisconnected', (participant) => {
        onParticipantDisconnected?.(participant);
      });
      
      // Video track monitoring
      room.on(RoomEvent.TrackUnpublished, (track, participant) => {
        onTrackUnpublished?.(track, participant);
      });
    } catch (e) {
      console.warn('[LiveKit] Failed to configure event listeners:', e);
    }
  }, []);

  /**
   * Attaches remote participant audio to an audio element
   *
   * @param participant - Remote participant whose audio should be rendered
   * @param audioElement - HTML audio element to attach audio to
   */
  const attachParticipantAudio = useCallback((
    participant: RemoteParticipant, 
    audioElement: HTMLAudioElement
  ): void => {
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
      const kind = (track as any)?.kind;
      if (kind === 'audio' && audioElement) {
        (track as RemoteAudioTrack).attach(audioElement);
        audioElement.muted = false;
        audioElement.play?.().catch(() => {});
      }
    });

    // Audio unsubscriptions
    participant.on(ParticipantEvent.TrackUnsubscribed, (track) => {
      const kind = (track as any)?.kind;
      if (kind === 'audio' && audioElement) {
        try {
          (track as RemoteAudioTrack).detach(audioElement);
        } catch {}
      }
    });
  }, []);

  /**
   * Sets up audio routing for all remote participants in the room
   *
   * @param room - LiveKit room instance
   * @param audioElement - HTML audio element to attach audio to
   */
  const setupAudioRouting = useCallback((
    room: Room, 
    audioElement: HTMLAudioElement
  ): void => {
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
  }, [attachParticipantAudio]);

  /**
   * Publishes a video track to the room
   *
   * @param room - LiveKit room instance
   * @param videoTrack - Video track to publish
   * @param options - Publishing options
   * @returns Promise that resolves when track is published
   * @throws {Error} When publishing fails
   */
  const publishVideoTrack = useCallback(async (
    room: Room, 
    videoTrack: LocalVideoTrack, 
    options: any = {}
  ): Promise<void> => {
    const defaultOptions = {
      name: 'camera',
      simulcast: false,
      videoEncoding: {
        maxBitrate: 150_000, // 150 kbps max for 240p (maximum efficiency)
        maxFramerate: 15
      },
      ...options
    };

    await room.localParticipant.publishTrack(videoTrack, defaultOptions);
    
    // Verify publication
    const publishedTracks = room.localParticipant.getTrackPublications();
    const videoPublication = publishedTracks.find(pub => pub.kind === 'video');
    
    if (!videoPublication) {
      throw new Error('Video track publication verification failed');
    }
    
    // Store track reference
    tracksRef.current.video = videoTrack;
  }, []);

  /**
   * Publishes an audio track to the room
   *
   * @param room - LiveKit room instance
   * @param audioTrack - Audio track to publish
   * @param options - Publishing options
   * @returns Promise that resolves when track is published
   * @throws {Error} When publishing fails
   */
  const publishAudioTrack = useCallback(async (
    room: Room, 
    audioTrack: LocalAudioTrack, 
    options: any = {}
  ): Promise<void> => {
    await room.localParticipant.publishTrack(audioTrack, options);
    tracksRef.current.audio = audioTrack;
  }, []);

  /**
   * Unpublishes a video track from the room
   *
   * @param room - LiveKit room instance
   * @param videoTrack - Video track to unpublish
   * @param stopOnUnpublish - Whether to stop the track when unpublishing
   */
  const unpublishVideoTrack = useCallback((
    room: Room, 
    videoTrack: LocalVideoTrack, 
    stopOnUnpublish: boolean = false
  ): void => {
    try {
      room.localParticipant.unpublishTrack(videoTrack, stopOnUnpublish);
    } catch (err) {
      console.warn('[LiveKit] Failed to unpublish video track:', err);
    }
  }, []);

  /**
   * Unpublishes an audio track from the room
   *
   * @param room - LiveKit room instance
   * @param audioTrack - Audio track to unpublish
   * @param stopOnUnpublish - Whether to stop the track when unpublishing
   */
  const unpublishAudioTrack = useCallback((
    room: Room, 
    audioTrack: LocalAudioTrack, 
    stopOnUnpublish: boolean = true
  ): void => {
    try {
      room.localParticipant.unpublishTrack(audioTrack, stopOnUnpublish);
    } catch (err) {
      console.warn('[LiveKit] Failed to unpublish audio track:', err);
    }
  }, []);

  /**
   * Disconnects from the current room
   *
   * @returns Promise that resolves when disconnected
   */
  const disconnectFromRoom = useCallback(async (): Promise<void> => {
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } finally {
        roomRef.current = null;
      }
    }
  }, []);

  /**
   * Gets the current room instance
   *
   * @returns Current room instance or null if not connected
   */
  const getCurrentRoom = useCallback((): Room | null => {
    return roomRef.current;
  }, []);

  /**
   * Gets the current video track
   *
   * @returns Current video track or undefined if not published
   */
  const getCurrentVideoTrack = useCallback((): LocalVideoTrack | undefined => {
    return tracksRef.current.video;
  }, []);

  /**
   * Gets the current audio track
   *
   * @returns Current audio track or undefined if not published
   */
  const getCurrentAudioTrack = useCallback((): LocalAudioTrack | undefined => {
    return tracksRef.current.audio;
  }, []);

  /**
   * Clears all track references
   */
  const clearTracks = useCallback((): void => {
    tracksRef.current = {};
  }, []);

  /**
   * High-level room setup: event listeners, audio routing and initial publish.
   */
  const setupRoom = useCallback(
    async (
      room: Room,
      videoTrack: LocalVideoTrack,
      audioRef?: React.RefObject<HTMLAudioElement>,
      onStateChange?: (state: string) => void,
      onTrackUnpublished?: (track: any, participant: any) => void,
    ): Promise<void> => {
      setupRoomEventListeners(
        room,
        (state) => onStateChange?.(state),
        undefined,
        undefined,
        (track, participant) => onTrackUnpublished?.(track, participant),
      );
      if (audioRef?.current) {
        setupAudioRouting(room, audioRef.current);
      }
      await publishVideoTrack(room, videoTrack);
    },
    [setupRoomEventListeners, setupAudioRouting, publishVideoTrack],
  );

  /**
   * Gets a fresh LiveKit token
   *
   * @returns Promise that resolves to token information
   * @throws {Error} When token retrieval fails
   */
  const getFreshToken = useCallback(async () => {
    return await getLiveKitToken();
  }, []);

  /**
   * Checks if currently connected to a room
   *
   * @returns True if connected to a room
   */
  const isConnected = useCallback((): boolean => {
    return roomRef.current !== null && roomRef.current.state === 'connected';
  }, []);

  /**
   * Gets the connection state of the current room
   *
   * @returns Connection state or null if no room
   */
  const getConnectionState = useCallback((): string | null => {
    return roomRef.current?.state || null;
  }, []);

  return {
    connectToRoom,
    setupRoom,
    setupRoomEventListeners,
    attachParticipantAudio,
    setupAudioRouting,
    publishVideoTrack,
    publishAudioTrack,
    unpublishVideoTrack,
    unpublishAudioTrack,
    disconnectFromRoom,
    getCurrentRoom,
    getCurrentVideoTrack,
    getCurrentAudioTrack,
    clearTracks,
    getFreshToken,
    isConnected,
    getConnectionState,
  };
}

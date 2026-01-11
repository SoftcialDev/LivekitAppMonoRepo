/**
 * @fileoverview useStreamingDashboard - Main orchestrator hook for PSO Dashboard streaming
 * @summary Orchestrates video streaming functionality for PSO Dashboard
 * @description Main hook that coordinates LiveKit connection, media devices, room setup,
 * and streaming state management. Provides unified interface for starting/stopping streams.
 * Uses 240p at 15 fps encoding configuration.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Room, LocalVideoTrack } from 'livekit-client';
import { logError, logDebug, logInfo } from '@/shared/utils/logger';
import { useAuth } from '@/modules/auth';
import { getLiveKitToken } from '@/modules/pso-streaming/api';
import { useLiveKitRoomSetup } from '../livekit';
import { useMediaDevices } from '../media/useMediaDevices';
import { StreamingClient } from '../../api';
import type { IUseStreamingDashboardReturn } from './types/useStreamingDashboardTypes';

/**
 * Main streaming dashboard hook that orchestrates video streaming functionality
 *
 * @remarks
 * Coordinates:
 * - LiveKit room connection
 * - Media device access (camera)
 * - Room setup and track publishing
 * - Streaming state management
 * - Backend status updates
 * - Automatic reconnection on disconnect/track end
 *
 * @returns Object containing video/audio refs, streaming state, and control functions
 */
export function useStreamingDashboard(): IUseStreamingDashboardReturn {
  const { account } = useAuth();
  const userEmail = account?.username?.toLowerCase() ?? '';
  const userAdId = account?.localAccountId ?? '';

  // Refs for DOM elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);

  // Track references
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const streamingRef = useRef<boolean>(false);
  const roomRef = useRef<Room | null>(null);
  const manualStopRef = useRef<boolean>(false);
  const isReconnectingRef = useRef<boolean>(false);

  // Clients
  const streamingClientRef = useRef(new StreamingClient());

  // Hooks
  const mediaDevices = useMediaDevices();
  
  // Ref for handleReconnection to avoid circular dependency
  const handleReconnectionRef = useRef<(() => Promise<void>) | null>(null);
  
  // LiveKit room setup hook
  const roomSetup = useLiveKitRoomSetup({
    streamingRef,
    manualStopRef,
    onDisconnected: () => {
      logDebug('[useStreamingDashboard] Room disconnected, triggering reconnect');
      void handleReconnectionRef.current?.();
    },
    onTrackEnded: () => {
      logDebug('[useStreamingDashboard] Video track ended, triggering reconnect');
      void handleReconnectionRef.current?.();
    },
  });
  
  // Ref for roomSetup to use in callbacks
  const roomSetupRef = useRef(roomSetup);
  useEffect(() => {
    roomSetupRef.current = roomSetup;
  }, [roomSetup]);

  /**
   * Handles automatic reconnection when room disconnects or track ends
   * Uses retry logic with exponential backoff (similar to admin-web useRetryLogic)
   */
  const handleReconnection = useCallback(async (): Promise<void> => {
    if (isReconnectingRef.current || !streamingRef.current) {
      return;
    }

    const maxRetries = 5;
    isReconnectingRef.current = true;
    logInfo('[useStreamingDashboard] Starting automatic reconnection with retry logic');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Clean up existing room connection (but keep video track if still alive)
        const oldRoom = roomRef.current;
        if (oldRoom) {
          try {
            await oldRoom.disconnect();
          } catch (err) {
            logDebug('[useStreamingDashboard] Error disconnecting old room during reconnect', { error: err });
          }
          roomRef.current = null;
        }

        // Get fresh LiveKit token
        logDebug('[useStreamingDashboard] Fetching fresh LiveKit token for reconnection', { attempt: attempt + 1 });
        const tokenResponse = await getLiveKitToken();
        const roomEntry = tokenResponse.rooms[0];
        if (!roomEntry) {
          throw new Error('No room token available for reconnection');
        }

        const currentRoomName = roomEntry.room;
        const token = roomEntry.token;
        const livekitUrl = tokenResponse.livekitUrl || import.meta.env.VITE_LIVEKIT_URL;
        
        if (!livekitUrl) {
          throw new Error('LiveKit URL not configured');
        }

        // Reuse existing video track if still alive, otherwise create new one
        let track = videoTrackRef.current;
        if (!track || track.mediaStreamTrack?.readyState === 'ended') {
          logDebug('[useStreamingDashboard] Video track ended, creating new track for reconnection');
          track = await mediaDevices.createVideoTrackFromDevices();
          videoTrackRef.current = track;
          setVideoTrack(track);

          // Reattach to video element
          if (videoRef.current) {
            track.attach(videoRef.current);
          }
        }

        // Create and connect to new room with timeout
        logDebug('[useStreamingDashboard] Connecting to LiveKit room for reconnection', { 
          currentRoomName, 
          attempt: attempt + 1,
          timeoutMs: Math.min(5000 + attempt * 2000, 15000)
        });
        const room = new Room();

        room.on('connected', () => {
          logDebug('[useStreamingDashboard] Room reconnected', { currentRoomName });
        });

        room.on('disconnected', (reason) => {
          logDebug('[useStreamingDashboard] Room disconnected after reconnect', { reason });
          if (streamingRef.current && !manualStopRef.current) {
            roomRef.current = null;
          }
        });

        // Connection with timeout (similar to admin-web useRetryLogic)
        const timeoutMs = Math.min(5000 + attempt * 2000, 15000);
        const connectPromise = room.connect(livekitUrl, token);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        roomRef.current = room;

        // Set up room and publish video track using roomSetupRef
        const currentRoomSetup = roomSetupRef.current;
        if (!currentRoomSetup) {
          throw new Error('Room setup not available for reconnection');
        }
        await currentRoomSetup.setupRoom(room, track);

        // Notify backend of reconnection (like admin-web)
        try {
          await streamingClientRef.current.setActive();
        } catch (err) {
          logError('[useStreamingDashboard] Error notifying backend of reconnection', { error: err });
          // Continue even if backend notification fails
        }

        logInfo('[useStreamingDashboard] Automatic reconnection successful', { 
          userEmail, 
          currentRoomName,
          attempt: attempt + 1
        });
        isReconnectingRef.current = false;
        return; // Success, exit retry loop
      } catch (error) {
        logError('[useStreamingDashboard] Automatic reconnection attempt failed', { 
          error, 
          userEmail,
          attempt: attempt + 1,
          maxRetries
        });
        
        // Cleanup between attempts
        if (roomRef.current) {
          try {
            await roomRef.current.disconnect();
          } catch {}
          roomRef.current = null;
        }

        // If this was the last attempt, stop streaming
        if (attempt === maxRetries - 1) {
          logError('[useStreamingDashboard] All reconnection attempts failed, stopping stream', { userEmail });
          streamingRef.current = false;
          setIsStreaming(false);
          isReconnectingRef.current = false;
          return;
        }

        // Exponential backoff before next attempt (like admin-web)
        const backoffMs = Math.min(2000 * Math.pow(2, attempt), 10000);
        logDebug('[useStreamingDashboard] Waiting before retry', { backoffMs, nextAttempt: attempt + 2 });
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    isReconnectingRef.current = false;
  }, [userEmail, mediaDevices, roomSetup]);

  /**
   * Starts a streaming session with camera and LiveKit connection
   */
  const startStream = useCallback(async (): Promise<void> => {
    if (streamingRef.current) {
      logDebug('[useStreamingDashboard] Already streaming, skipping start');
      return;
    }

    // Reset manual stop flag
    manualStopRef.current = false;
    isReconnectingRef.current = false;

    try {
      logDebug('[useStreamingDashboard] Starting stream', { userEmail });

      // Request camera permission
      await mediaDevices.requestCameraPermission();

      // Create video track (240p at 15 fps)
      const track = await mediaDevices.createVideoTrackFromDevices();
      videoTrackRef.current = track;
      setVideoTrack(track);

      // Attach video track to video element
      if (videoRef.current) {
        track.attach(videoRef.current);
      }

      // Get LiveKit token
      logDebug('[useStreamingDashboard] Fetching LiveKit token');
      const tokenResponse = await getLiveKitToken();
      const roomEntry = tokenResponse.rooms[0];
      if (!roomEntry) {
        throw new Error('No room token available');
      }

      const currentRoomName = roomEntry.room;
      const token = roomEntry.token;
      const livekitUrl = tokenResponse.livekitUrl || import.meta.env.VITE_LIVEKIT_URL;
      
      if (!livekitUrl) {
        throw new Error('LiveKit URL not configured');
      }

      // Create and connect to LiveKit room
      logDebug('[useStreamingDashboard] Connecting to LiveKit room', { currentRoomName });
      const room = new Room();
      
      // Set up connection state tracking
      room.on('connected', () => {
        logDebug('[useStreamingDashboard] Room connected', { currentRoomName });
      });

      room.on('disconnected', (reason) => {
        logDebug('[useStreamingDashboard] Room disconnected', { reason });
        if (streamingRef.current) {
          logInfo('[useStreamingDashboard] Streaming was active, connection lost', { reason });
        }
        roomRef.current = null;
      });

      await room.connect(livekitUrl, token);
      roomRef.current = room;

      // Set up room and publish video track
      await roomSetup.setupRoom(room, track);

      // Notify backend
      await streamingClientRef.current.setActive();

      // Update state
      streamingRef.current = true;
      setIsStreaming(true);

      logInfo('[useStreamingDashboard] Stream started successfully', { userEmail, currentRoomName });
    } catch (error) {
      logError('[useStreamingDashboard] Failed to start stream', { error, userEmail });
      
      // Cleanup on error
      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.detach();
          videoTrackRef.current.stop();
        } catch {}
        videoTrackRef.current = null;
        setVideoTrack(null);
      }
      
      throw error;
    }
  }, [userEmail, mediaDevices, roomSetup]);

  /**
   * Stops an active streaming session
   * @param reason - Optional stop reason (e.g., 'EMERGENCY', 'QUICK_BREAK', etc.)
   */
  const stopStream = useCallback(async (reason?: string): Promise<void> => {
    if (!streamingRef.current) {
      logDebug('[useStreamingDashboard] Not streaming, skipping stop');
      return;
    }

    // Mark as manual stop to prevent auto-reconnect
    manualStopRef.current = true;

    try {
      logDebug('[useStreamingDashboard] Stopping stream', { userEmail, reason });

      const room = roomRef.current;
      const track = videoTrackRef.current;

      // Unpublish and stop tracks
      if (room && track) {
        try {
          await room.localParticipant.unpublishTrack(track, true);
        } catch (err) {
          logError('[useStreamingDashboard] Error unpublishing track', { error: err });
        }
      }

      if (track) {
        try {
          track.detach();
          track.stop();
        } catch (err) {
          logError('[useStreamingDashboard] Error stopping track', { error: err });
        }
        videoTrackRef.current = null;
        setVideoTrack(null);
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = '';
      }

      // Disconnect from room
      if (room) {
        try {
          await room.disconnect();
        } catch (err) {
          logError('[useStreamingDashboard] Error disconnecting from room', { error: err });
        }
        roomRef.current = null;
      }

      // Notify backend and dispatch event for status update
      try {
        const response = await streamingClientRef.current.setInactive(reason, true);
        
        // Dispatch event to update streaming status immediately (like admin-web)
        if (response.stoppedAt && response.stopReason) {
          const event = new CustomEvent('streamingSessionUpdated', {
            detail: {
              session: {
                stopReason: response.stopReason,
                stoppedAt: response.stoppedAt,
                email: userEmail,
              },
            },
          });
          window.dispatchEvent(event);
          logDebug('[useStreamingDashboard] Dispatched streamingSessionUpdated event', {
            stopReason: response.stopReason,
            stoppedAt: response.stoppedAt,
            reason,
          });
        }
      } catch (err) {
        logError('[useStreamingDashboard] Error notifying backend of stop', { error: err, reason });
      }

      // Update state
      streamingRef.current = false;
      setIsStreaming(false);
      manualStopRef.current = false; // Reset after stop completes

      logInfo('[useStreamingDashboard] Stream stopped successfully', { userEmail, reason });
    } catch (error) {
      logError('[useStreamingDashboard] Error stopping stream', { error, userEmail, reason });
      // Still update state even on error
      streamingRef.current = false;
      setIsStreaming(false);
      manualStopRef.current = false; // Reset even on error
    }
  }, [userEmail]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        stopStream().catch(() => {});
      }
    };
  }, [stopStream]);

  /**
   * Gets the current room instance
   */
  const getCurrentRoom = useCallback((): Room | null => {
    return roomRef.current;
  }, []);

  return {
    videoRef,
    audioRef,
    isStreaming,
    videoTrack,
    getCurrentRoom,
    startStream,
    stopStream,
  };
}

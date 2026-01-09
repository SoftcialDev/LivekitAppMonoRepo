/**
 * @fileoverview useLiveKitRoomConnection - Hook for managing LiveKit room connection
 * @summary Handles room connection, disconnection, and lifecycle management
 * @description Provides connection management for LiveKit rooms with retry logic
 * and cleanup. Does not handle track management - that's handled by useRemoteTracks.
 */

import { useRef, useEffect, useCallback } from 'react';
import { Room } from 'livekit-client';

export interface UseLiveKitRoomConnectionOptions {
  /**
   * Whether streaming should be active
   */
  shouldStream: boolean;
  /**
   * LiveKit access token
   */
  accessToken: string | null;
  /**
   * Room name/identity
   */
  roomName: string | null;
  /**
   * LiveKit server URL
   */
  livekitUrl: string | null;
  /**
   * Reference to store the room instance
   */
  roomRef: React.RefObject<Room | null>;
  /**
   * Callback when room is connected
   */
  onRoomConnected?: (room: Room) => void;
  /**
   * Callback when room is disconnected
   */
  onRoomDisconnected?: () => void;
}

export interface UseLiveKitRoomConnection {
  /**
   * Whether the room is currently connected
   */
  isConnected: boolean;
  /**
   * Whether connection is in progress
   */
  isConnecting: boolean;
  /**
   * Connection error if any
   */
  error: Error | null;
  /**
   * Manually disconnect the room
   */
  disconnect: () => void;
}

/**
 * Hook for managing LiveKit room connection
 * @param options - Configuration options
 * @returns Object containing connection state and functions
 */
export function useLiveKitRoomConnection(
  options: UseLiveKitRoomConnectionOptions
): UseLiveKitRoomConnection {
  const {
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    roomRef,
    onRoomConnected,
    onRoomDisconnected,
  } = options;

  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const errorRef = useRef<Error | null>(null);
  const lkRoomRef = useRef<Room | null>(null);
  const canceledRef = useRef(false);

  // Store all dependencies in refs to avoid recreating callbacks
  const onRoomConnectedRef = useRef(onRoomConnected);
  const onRoomDisconnectedRef = useRef(onRoomDisconnected);
  const shouldStreamRef = useRef(shouldStream);
  const accessTokenRef = useRef(accessToken);
  const roomNameRef = useRef(roomName);
  const livekitUrlRef = useRef(livekitUrl);
  
  // Track previous values to detect actual changes
  const prevShouldStreamRef = useRef(shouldStream);
  const prevAccessTokenRef = useRef(accessToken);
  const prevRoomNameRef = useRef(roomName);
  const prevLivekitUrlRef = useRef(livekitUrl);
  
  // Update callback refs on every render (callbacks may be inline)
  // But don't update prev* refs here - those should only be updated in the main effect
  useEffect(() => {
    onRoomConnectedRef.current = onRoomConnected;
    onRoomDisconnectedRef.current = onRoomDisconnected;
  }, [onRoomConnected, onRoomDisconnected]);
  
  // Update current value refs separately (these are used by connectAndWatch)
  useEffect(() => {
    shouldStreamRef.current = shouldStream;
    accessTokenRef.current = accessToken;
    roomNameRef.current = roomName;
    livekitUrlRef.current = livekitUrl;
    // DO NOT update prev* refs here - they should only be updated in the main effect
    // to properly detect changes
  }, [shouldStream, accessToken, roomName, livekitUrl]);

  /**
   * Connects to the LiveKit room with retry logic
   * Uses refs for all dependencies to avoid recreating the callback
   */
  const connectAndWatch = useCallback(
    async (retryCount = 0) => {
      if (!shouldStreamRef.current || !accessTokenRef.current || !roomNameRef.current || !livekitUrlRef.current) {
        return;
      }

      // Don't connect if already connected
      if (lkRoomRef.current && isConnectedRef.current) {
        console.log('[useLiveKitRoomConnection] Already connected, skipping');
        return;
      }

      if (canceledRef.current) {
        return;
      }

      isConnectingRef.current = true;
      errorRef.current = null;

      const room = new Room();
      try {
        await room.connect(livekitUrlRef.current, accessTokenRef.current);
        isConnectedRef.current = true;
        isConnectingRef.current = false;
        lkRoomRef.current = room;
        if (roomRef) {
          (roomRef as React.MutableRefObject<Room | null>).current = room;
        }

        onRoomConnectedRef.current?.(room);
      } catch (error) {
        isConnectingRef.current = false;
        const err = error instanceof Error ? error : new Error(String(error));
        errorRef.current = err;

        if (retryCount < 2 && !canceledRef.current) {
          const delay = (retryCount + 1) * 1500;
          setTimeout(() => connectAndWatch(retryCount + 1), delay);
          return;
        }

        console.error('[useLiveKitRoomConnection] Failed to connect after retries:', err);
      }
    },
    [] // No dependencies - uses refs instead
  );

  /**
   * Disconnects from the room
   * Uses refs for all dependencies to avoid recreating the callback
   */
  const disconnect = useCallback(() => {
    console.log('[useLiveKitRoomConnection] disconnect() called', {
      hasRoom: !!lkRoomRef.current,
      isConnected: isConnectedRef.current,
      shouldStream: shouldStreamRef.current,
    });
    
    canceledRef.current = true;
    isConnectingRef.current = false;

    if (lkRoomRef.current) {
      try {
        lkRoomRef.current.disconnect();
      } catch (err) {
        console.warn('[useLiveKitRoomConnection] Error disconnecting:', err);
      }
      lkRoomRef.current = null;
    }

    if (roomRef) {
      (roomRef as React.MutableRefObject<Room | null>).current = null;
    }
    isConnectedRef.current = false;
    onRoomDisconnectedRef.current?.();
  }, []); // No dependencies - uses refs instead

  /**
   * Main effect for connection management
   * Only runs when critical connection parameters change
   * This prevents disconnection when other state changes (like isTalking, hasActiveSession, etc.)
   */
  useEffect(() => {
    console.log('[useLiveKitRoomConnection] Main effect executed', {
      shouldStream,
      hasAccessToken: !!accessToken,
      roomName,
      hasLivekitUrl: !!livekitUrl,
      prevShouldStream: prevShouldStreamRef.current,
      prevAccessToken: prevAccessTokenRef.current,
      prevRoomName: prevRoomNameRef.current,
      prevLivekitUrl: prevLivekitUrlRef.current,
      isConnected: isConnectedRef.current,
      hasRoom: !!lkRoomRef.current,
    });

    canceledRef.current = false;

    // Update refs immediately
    shouldStreamRef.current = shouldStream;
    accessTokenRef.current = accessToken;
    roomNameRef.current = roomName;
    livekitUrlRef.current = livekitUrl;

    if (!shouldStream) {
      // Only disconnect if actually connected
      if (lkRoomRef.current && isConnectedRef.current) {
        console.log('[useLiveKitRoomConnection] shouldStream is false, disconnecting');
        disconnect();
      }
      // Update prev values before return
      prevShouldStreamRef.current = shouldStream;
      prevAccessTokenRef.current = accessToken;
      prevRoomNameRef.current = roomName;
      prevLivekitUrlRef.current = livekitUrl;
      return;
    }

    if (!accessToken || !roomName || !livekitUrl) {
      console.log('[useLiveKitRoomConnection] Missing critical params, skipping connection');
      // Update prev values before return
      prevShouldStreamRef.current = shouldStream;
      prevAccessTokenRef.current = accessToken;
      prevRoomNameRef.current = roomName;
      prevLivekitUrlRef.current = livekitUrl;
      return;
    }

    // Check if we need to reconnect (critical params changed)
    const needsReconnect = 
      shouldStream !== prevShouldStreamRef.current ||
      accessToken !== prevAccessTokenRef.current ||
      roomName !== prevRoomNameRef.current ||
      livekitUrl !== prevLivekitUrlRef.current;

    console.log('[useLiveKitRoomConnection] Connection check', {
      needsReconnect,
      hasRoom: !!lkRoomRef.current,
      isConnected: isConnectedRef.current,
    });

    // If parameters changed, disconnect first then reconnect
    if (needsReconnect && lkRoomRef.current && isConnectedRef.current) {
      console.log('[useLiveKitRoomConnection] Critical parameters changed, reconnecting...', {
        shouldStreamChanged: shouldStream !== prevShouldStreamRef.current,
        accessTokenChanged: accessToken !== prevAccessTokenRef.current,
        roomNameChanged: roomName !== prevRoomNameRef.current,
        livekitUrlChanged: livekitUrl !== prevLivekitUrlRef.current,
      });
      // Disconnect first
      if (lkRoomRef.current) {
        try {
          lkRoomRef.current.disconnect();
        } catch (err) {
          console.warn('[useLiveKitRoomConnection] Error disconnecting before reconnect:', err);
        }
        lkRoomRef.current = null;
      }
      if (roomRef) {
        (roomRef as React.MutableRefObject<Room | null>).current = null;
      }
      isConnectedRef.current = false;
      
      // Reset canceled flag for reconnection
      canceledRef.current = false;
      
      // Small delay before reconnecting to ensure cleanup
      setTimeout(() => {
        console.log('[useLiveKitRoomConnection] Attempting reconnection after parameter change');
        void connectAndWatch();
      }, 100);
    } else if (!lkRoomRef.current || !isConnectedRef.current) {
      // Only connect if not already connected
      console.log('[useLiveKitRoomConnection] No room connected, connecting...');
      canceledRef.current = false;
      void connectAndWatch();
    } else {
      console.log('[useLiveKitRoomConnection] Room already connected, no action needed');
    }

    // Cleanup: Capture prev values BEFORE updating them so cleanup can compare properly
    const prevShouldStreamBeforeUpdate = prevShouldStreamRef.current;
    
    // Update previous values for next comparison (at the end, after all checks)
    prevShouldStreamRef.current = shouldStream;
    prevAccessTokenRef.current = accessToken;
    prevRoomNameRef.current = roomName;
    prevLivekitUrlRef.current = livekitUrl;

    // Cleanup: Only disconnect if component unmounts or shouldStream becomes false
    // This prevents disconnection when other state changes (like isTalking, hasActiveSession)
    return () => {
      console.log('[useLiveKitRoomConnection] Cleanup function executed', {
        shouldStream,
        prevShouldStreamBeforeUpdate,
        hasRoom: !!lkRoomRef.current,
        isConnected: isConnectedRef.current,
      });
      
      // Only disconnect if shouldStream became false (was true, now false)
      // Don't disconnect if parameters changed but shouldStream is still true
      const shouldStreamBecameFalse = prevShouldStreamBeforeUpdate && !shouldStream;
      
      if (shouldStreamBecameFalse && lkRoomRef.current && isConnectedRef.current) {
        console.log('[useLiveKitRoomConnection] Cleanup: disconnecting because shouldStream became false');
        disconnect();
      } else {
        console.log('[useLiveKitRoomConnection] Cleanup: NOT disconnecting', {
          shouldStreamBecameFalse,
          prevShouldStream: prevShouldStreamBeforeUpdate,
          currentShouldStream: shouldStream,
          hasRoom: !!lkRoomRef.current,
          isConnected: isConnectedRef.current,
        });
      }
    };
  }, [shouldStream, accessToken, roomName, livekitUrl]); // Only critical parameters - disconnect and connectAndWatch use refs internally

  return {
    isConnected: isConnectedRef.current,
    isConnecting: isConnectingRef.current,
    error: errorRef.current,
    disconnect,
  };
}


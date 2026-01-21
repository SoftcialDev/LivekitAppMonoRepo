/**
 * @fileoverview useLiveKitRoomConnection hook
 * @summary Hook for managing LiveKit room connection
 * @description Orchestrates room connection, reconnection, and lifecycle management.
 * Uses smaller hooks following SRP to reduce complexity.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Room } from 'livekit-client';
import { DisconnectReason } from 'livekit-client';
import { logError, logWarn, logDebug } from '@/shared/utils/logger';
import { useRoomConnection } from './hooks/useRoomConnection';
import { useRoomReconnection } from './hooks/useRoomReconnection';
import { cleanupRoom } from './utils/roomConnectionUtils';
import { reportLiveKitConnectionFailure } from '@/modules/camera-failures/utils/cameraFailureReporting';
import type {
  IUseLiveKitRoomConnectionOptions,
  IUseLiveKitRoomConnectionReturn,
} from './types/roomConnectionTypes';

/**
 * Hook for managing LiveKit room connection
 * 
 * @param options - Configuration options
 * @returns Object containing connection state and functions
 */
export function useLiveKitRoomConnection(
  options: IUseLiveKitRoomConnectionOptions
): IUseLiveKitRoomConnectionReturn {
  const {
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    roomRef,
    onRoomConnected,
    onRoomDisconnected,
    userAdId,
    userEmail,
    userRole,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const isDisconnectingRef = useRef(false);
  const errorRef = useRef<Error | null>(null);
  const lkRoomRef = useRef<Room | null>(null);
  const canceledRef = useRef(false);
  const hasDisconnectedRef = useRef<boolean>(false); // Track if disconnect has been called to avoid repeated disconnects

  const shouldStreamRef = useRef(shouldStream);
  const accessTokenRef = useRef(accessToken);
  const roomNameRef = useRef(roomName);
  const livekitUrlRef = useRef(livekitUrl);

  const prevShouldStreamRef = useRef(shouldStream);
  const prevAccessTokenRef = useRef(accessToken);
  const prevRoomNameRef = useRef(roomName);
  const prevLivekitUrlRef = useRef(livekitUrl);

  // Update refs when props change
  useEffect(() => {
    shouldStreamRef.current = shouldStream;
    accessTokenRef.current = accessToken;
    roomNameRef.current = roomName;
    livekitUrlRef.current = livekitUrl;
  }, [shouldStream, accessToken, roomName, livekitUrl]);

  // Ref to store roomReconnection for use in handleRoomConnected
  const roomReconnectionRef = useRef<ReturnType<typeof useRoomReconnection> | null>(null);

  // Handle room connected
  const handleRoomConnected = useCallback(
    (room: Room): void => {
      if (canceledRef.current || !shouldStreamRef.current) {
        logDebug('[useLiveKitRoomConnection] Connection succeeded but was canceled, disconnecting');
        cleanupRoom(room).catch((err) => {
          logError('[useLiveKitRoomConnection] Error cleaning up canceled room', { error: err });
        });
        return;
      }

      // Cancel any pending reconnection attempts when connection succeeds
      // This prevents scheduled reconnections from executing after a successful connection
      if (roomReconnectionRef.current) {
        roomReconnectionRef.current.cancel();
        roomReconnectionRef.current.reset();
      }

      isConnectedRef.current = true;
      setIsConnected(true);
      isConnectingRef.current = false;
      setIsConnecting(false);
      lkRoomRef.current = room;

      if (roomRef) {
        (roomRef as React.MutableRefObject<Room | null>).current = room;
      }

      onRoomConnected?.(room);
      logDebug('[useLiveKitRoomConnection] Room connected successfully', {
        roomName: roomNameRef.current,
        roomState: room.state,
      });
    },
    [roomRef, onRoomConnected]
  );

  // Handle room disconnected
  const handleRoomDisconnected = useCallback(
    (reason?: DisconnectReason): void => {
      const reasonCode = reason ? String(reason) : 'unknown';
      const isExpected = canceledRef.current || !shouldStreamRef.current;

      if (isExpected) {
        logDebug('[useLiveKitRoomConnection] Disconnection event received (expected)', {
          reason: reasonCode,
          roomName: roomNameRef.current,
        });
        return;
      }

      logWarn('[useLiveKitRoomConnection] Room disconnected unexpectedly', {
        reason: reasonCode,
        roomName: roomNameRef.current,
        shouldStream: shouldStreamRef.current,
      });

      isConnectedRef.current = false;
      setIsConnected(false);
      isConnectingRef.current = false;
      setIsConnecting(false);

      // Clear global connection attempt on disconnect to allow reconnection
      const currentRoomName = roomNameRef.current;
      if (currentRoomName) {
        globalConnectionAttempts.current.delete(currentRoomName);
        logDebug('[useLiveKitRoomConnection] Cleared global connection attempt (disconnect)', { roomName: currentRoomName });
      }

      const roomToCleanup = lkRoomRef.current;
      lkRoomRef.current = null;

      if (roomRef) {
        (roomRef as React.MutableRefObject<Room | null>).current = null;
      }

      if (roomToCleanup) {
        cleanupRoom(roomToCleanup).catch((err) => {
          logError('[useLiveKitRoomConnection] Error cleaning up room on disconnect', { error: err });
        });
      }

      onRoomDisconnected?.();
      
      // Trigger reconnection if needed (handled by roomReconnection hook via enhanced handler)
    },
    [roomRef, onRoomDisconnected]
  );

  // Handle reconnecting
  const handleReconnecting = useCallback((): void => {
    logDebug('[useLiveKitRoomConnection] Room reconnecting...', { roomName: roomNameRef.current });
  }, []);

  // Room reconnection hook (defined first to be used in enhanced handler)
  // Note: We need to define this after connectAndWatchReconnect, but we'll use a ref pattern
  const connectAndWatchReconnectRef = useRef<(() => Promise<void>) | null>(null);
  
  const roomReconnection = useRoomReconnection({
    shouldStream,
    onReconnect: () => {
      if (canceledRef.current || !shouldStreamRef.current) {
        return;
      }

      // Check if another component is already connecting to this room
      const currentRoomName = roomNameRef.current;
      if (currentRoomName && globalConnectionAttempts.current.get(currentRoomName)) {
        logDebug('[useLiveKitRoomConnection] Skipping reconnection - another component is connecting', { roomName: currentRoomName });
        return;
      }

      // Check if we're already connecting or connected
      if (isConnectingRef.current || isConnectedRef.current) {
        logDebug('[useLiveKitRoomConnection] Skipping reconnection - already connecting or connected');
        return;
      }

      // Use the reconnect wrapper if available, otherwise fall back to direct connection
      if (connectAndWatchReconnectRef.current) {
        connectAndWatchReconnectRef.current().catch((err) => {
          logError('[useLiveKitRoomConnection] Reconnection failed', { error: err });
        });
      } else {
        // Fallback: direct connection (shouldn't happen in normal flow)
        roomConnection.connect()
          .then((room) => {
            if (room) {
              handleRoomConnected(room);
            }
          })
          .catch((err) => {
            logError('[useLiveKitRoomConnection] Reconnection failed', { error: err });
          });
      }
    },
  });

  // Update ref for handleRoomConnected
  useEffect(() => {
    roomReconnectionRef.current = roomReconnection;
  }, [roomReconnection]);

  // Enhanced disconnected handler that includes reconnection logic
  const enhancedHandleDisconnected = useCallback(
    (reason?: DisconnectReason): void => {
      handleRoomDisconnected(reason);
      
      const reasonCode = reason ? String(reason) : 'unknown';
      const isDuplicateIdentity = reason === DisconnectReason.DUPLICATE_IDENTITY;
      
      // For DUPLICATE_IDENTITY, be more conservative - only reconnect if:
      // 1. Not canceled
      // 2. Should stream
      // 3. Not already connecting (to avoid competing with initial connections)
      // 4. Not already connected (shouldn't happen, but safety check)
      // 5. No other component is connecting to this room
      if (!canceledRef.current && shouldStreamRef.current && !isConnectingRef.current && !isConnectedRef.current) {
        // Check if another component is already connecting to this room
        const currentRoomName = roomNameRef.current;
        if (currentRoomName && globalConnectionAttempts.current.get(currentRoomName)) {
          logDebug('[useLiveKitRoomConnection] Skipping reconnection - another component is connecting', { 
            roomName: currentRoomName,
            reason: reasonCode,
          });
          return;
        }
        
        // For DUPLICATE_IDENTITY, wait a bit longer before attempting reconnection
        // This gives time for the winning connection to stabilize
        if (isDuplicateIdentity) {
          logDebug('[useLiveKitRoomConnection] DUPLICATE_IDENTITY detected, will reconnect after delay', {
            roomName: currentRoomName,
          });
        }
        
        roomReconnection.handleDisconnection(reason);
      } else {
        logDebug('[useLiveKitRoomConnection] Skipping reconnection', {
          canceled: canceledRef.current,
          shouldStream: shouldStreamRef.current,
          isConnecting: isConnectingRef.current,
          isConnected: isConnectedRef.current,
          reason: reasonCode,
        });
      }
    },
    [handleRoomDisconnected, roomReconnection]
  );

  // Room connection hook (uses enhanced handler for reconnection)
  const roomConnection = useRoomConnection({
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    onConnected: handleRoomConnected,
    onDisconnected: enhancedHandleDisconnected,
    onReconnecting: handleReconnecting,
    userAdId,
    userEmail,
    userRole,
  });

  /**
   * Global map to track ongoing connection attempts per room
   * This prevents multiple components from connecting to the same room simultaneously
   */
  const globalConnectionAttempts = useRef<Map<string, boolean>>(new Map());

  /**
   * Calculates a deterministic delay based on roomName to stagger initial connections
   * This prevents multiple simultaneous connection attempts that cause DUPLICATE_IDENTITY
   * Only used for initial connections, not reconnections
   */
  const calculateStaggeredDelay = useCallback((roomName: string | null): number => {
    if (!roomName) return 0;
    // Use a simple hash of the roomName to generate a consistent delay (0-800ms)
    // Increased delay to better distribute connection attempts
    let hash = 0;
    for (let i = 0; i < roomName.length; i++) {
      hash = ((hash << 5) - hash) + roomName.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 800; // Delay between 0-800ms (increased from 300ms)
  }, []);

  // Connect function
  const connectAndWatch = useCallback(async (isInitialConnection: boolean = false): Promise<void> => {
    const currentRoomName = roomNameRef.current;
    
    if (isConnectingRef.current || isConnectedRef.current) {
      logDebug('[useLiveKitRoomConnection] Already connecting or connected, skipping', { roomName: currentRoomName });
      return;
    }

    // Check global connection attempts to prevent multiple components connecting to same room
    if (currentRoomName && globalConnectionAttempts.current.get(currentRoomName)) {
      logDebug('[useLiveKitRoomConnection] Another component is already connecting to this room, skipping', { roomName: currentRoomName });
      return;
    }

    // Clean up existing room
    if (lkRoomRef.current) {
      logDebug('[useLiveKitRoomConnection] Cleaning up existing room before connecting');
      await cleanupRoom(lkRoomRef.current);
      lkRoomRef.current = null;
      if (roomRef) {
        (roomRef as React.MutableRefObject<Room | null>).current = null;
      }
      isConnectedRef.current = false;
      setIsConnected(false);
    }

    // Mark global connection attempt BEFORE delay to prevent other components from starting
    // This must happen before the delay so other components can see it
    if (currentRoomName) {
      globalConnectionAttempts.current.set(currentRoomName, true);
      logDebug('[useLiveKitRoomConnection] Marked global connection attempt (before delay)', { roomName: currentRoomName });
    }

    // Add staggered delay ONLY for initial connections to prevent DUPLICATE_IDENTITY
    // Reconnections should happen immediately to restore connection quickly
    if (isInitialConnection) {
      const delay = calculateStaggeredDelay(currentRoomName);
      if (delay > 0) {
        logDebug('[useLiveKitRoomConnection] Staggering initial connection', { delay, roomName: currentRoomName });
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Double-check after delay (another component might have connected in the meantime)
      if (isConnectingRef.current || isConnectedRef.current) {
        logDebug('[useLiveKitRoomConnection] Connection already in progress after delay, skipping');
        // Clear global attempt if we're skipping
        if (currentRoomName) {
          globalConnectionAttempts.current.delete(currentRoomName);
        }
        return;
      }
      
      // Verify we still have the global lock (should always be true, but check anyway)
      if (currentRoomName && !globalConnectionAttempts.current.get(currentRoomName)) {
        logDebug('[useLiveKitRoomConnection] Lost global connection lock during delay, skipping');
        return;
      }
    }

    // Mark as connecting BEFORE the actual connection attempt
    // This prevents other components from starting a connection
    isConnectingRef.current = true;
    setIsConnecting(true);
    errorRef.current = null;
    setError(null);
    
    logDebug('[useLiveKitRoomConnection] Starting connection attempt', { 
      roomName: currentRoomName,
      isInitialConnection,
    });

    try {
      const room = await roomConnection.connect();
      if (room) {
        handleRoomConnected(room);
        roomReconnection.reset();
        // Clear global connection attempt on success
        if (currentRoomName) {
          globalConnectionAttempts.current.delete(currentRoomName);
          logDebug('[useLiveKitRoomConnection] Cleared global connection attempt (success)', { roomName: currentRoomName });
        }
      }
    } catch (err) {
      isConnectingRef.current = false;
      setIsConnecting(false);
      // Clear global connection attempt on failure
      if (currentRoomName) {
        globalConnectionAttempts.current.delete(currentRoomName);
        logDebug('[useLiveKitRoomConnection] Cleared global connection attempt (failure)', { roomName: currentRoomName });
      }
      const connectionError = err instanceof Error ? err : new Error('Connection failed');
      errorRef.current = connectionError;
      setError(connectionError);
      logError('[useLiveKitRoomConnection] Connection failed', { error: connectionError });

      // Report failure to backend only if user is a PSO (not admin/supervisor)
      // Admins viewing PSO streams should not report connection failures
      if (userAdId && userEmail && userRole === 'PSO') {
        reportLiveKitConnectionFailure({
          userAdId,
          userEmail,
          error: err,
          roomName: roomNameRef.current || undefined,
          livekitUrl: livekitUrlRef.current || undefined,
        }).catch((reportError) => {
          logDebug('[useLiveKitRoomConnection] Failed to report camera failure', { error: reportError });
        });
      }
    }
  }, [roomConnection, roomReconnection, handleRoomConnected, roomRef, calculateStaggeredDelay, userAdId, userEmail, userRole]);

  // Wrapper for initial connections (with delay)
  const connectAndWatchInitial = useCallback(async (): Promise<void> => {
    return connectAndWatch(true);
  }, [connectAndWatch]);

  // Wrapper for reconnections (without delay)
  const connectAndWatchReconnect = useCallback(async (): Promise<void> => {
    return connectAndWatch(false);
  }, [connectAndWatch]);

  // Update ref for roomReconnection hook
  useEffect(() => {
    connectAndWatchReconnectRef.current = connectAndWatchReconnect;
  }, [connectAndWatchReconnect]);

  // Disconnect function
  const disconnect = useCallback(async (): Promise<void> => {
    logDebug('[useLiveKitRoomConnection] disconnect() called', {
      hasRoom: !!lkRoomRef.current,
      isConnected: isConnectedRef.current,
      shouldStream: shouldStreamRef.current,
      roomName: roomNameRef.current,
    });

    canceledRef.current = true;
    isConnectingRef.current = false;
    setIsConnecting(false);
    isDisconnectingRef.current = true;
    setIsDisconnecting(true);

    roomReconnection.cancel();
    roomReconnection.reset();

    const roomToCleanup = lkRoomRef.current;
    lkRoomRef.current = null;

    if (roomRef) {
      (roomRef as React.MutableRefObject<Room | null>).current = null;
    }

    isConnectedRef.current = false;
    setIsConnected(false);

    if (roomToCleanup) {
      await cleanupRoom(roomToCleanup);
    }

    isDisconnectingRef.current = false;
    setIsDisconnecting(false);
    onRoomDisconnected?.();
  }, [roomRef, roomReconnection, onRoomDisconnected]);

  /**
   * Handles disconnection when shouldStream is false
   */
  const handleDisconnectWhenShouldStreamFalse = useCallback((): void => {
    if (lkRoomRef.current && isConnectedRef.current && !hasDisconnectedRef.current) {
      logDebug('[useLiveKitRoomConnection] shouldStream is false, disconnecting');
      hasDisconnectedRef.current = true;
      disconnect().finally(() => {
        hasDisconnectedRef.current = false;
      }).catch((err) => {
        logError('[useLiveKitRoomConnection] Error in disconnect when shouldStream is false', { error: err });
        hasDisconnectedRef.current = false;
      });
    }
  }, [disconnect]);

  /**
   * Updates previous refs with current values
   */
  const updatePreviousRefs = useCallback((): void => {
    prevShouldStreamRef.current = shouldStream;
    prevAccessTokenRef.current = accessToken;
    prevRoomNameRef.current = roomName;
    prevLivekitUrlRef.current = livekitUrl;
  }, [shouldStream, accessToken, roomName, livekitUrl]);

  /**
   * Checks if critical parameters are missing
   */
  const areCriticalParamsMissing = useCallback((): boolean => {
    return !accessToken || !roomName || !livekitUrl;
  }, [accessToken, roomName, livekitUrl]);

  /**
   * Checks if reconnection is needed due to parameter changes
   */
  const checkNeedsReconnect = useCallback((): boolean => {
    return (
      shouldStream !== prevShouldStreamRef.current ||
      accessToken !== prevAccessTokenRef.current ||
      roomName !== prevRoomNameRef.current ||
      livekitUrl !== prevLivekitUrlRef.current
    );
  }, [shouldStream, accessToken, roomName, livekitUrl]);

  /**
   * Handles cleanup and reconnection after parameter changes
   */
  const handleParameterChangeReconnection = useCallback(async (): Promise<void> => {
    logDebug('[useLiveKitRoomConnection] Critical parameters changed, reconnecting...', {
      shouldStreamChanged: shouldStream !== prevShouldStreamRef.current,
      accessTokenChanged: accessToken !== prevAccessTokenRef.current,
      roomNameChanged: roomName !== prevRoomNameRef.current,
      livekitUrlChanged: livekitUrl !== prevLivekitUrlRef.current,
    });

    canceledRef.current = true;
    roomReconnection.cancel();

    const roomToCleanup = lkRoomRef.current;
    lkRoomRef.current = null;

    if (roomRef) {
      (roomRef as React.MutableRefObject<Room | null>).current = null;
    }

    isConnectedRef.current = false;
    setIsConnected(false);
    isConnectingRef.current = false;
    setIsConnecting(false);

    roomReconnection.reset();
    canceledRef.current = false;

    // Wait for cleanup before reconnecting
    if (roomToCleanup) {
      try {
        await cleanupRoom(roomToCleanup);
        if (shouldStreamRef.current && !canceledRef.current && !isConnectingRef.current) {
          logDebug('[useLiveKitRoomConnection] Attempting reconnection after parameter change');
          connectAndWatchReconnect().catch((err) => {
            logError('[useLiveKitRoomConnection] Error in connectAndWatch after parameter change', { error: err });
          });
        }
      } catch (err) {
        logError('[useLiveKitRoomConnection] Error cleaning up room for parameter change', { error: err });
      }
      return;
    }
    
    // No room to cleanup, reconnect immediately (no delay for reconnections)
    if (shouldStreamRef.current && !canceledRef.current && !isConnectingRef.current) {
      logDebug('[useLiveKitRoomConnection] Attempting reconnection after parameter change');
      connectAndWatchReconnect().catch((err) => {
        logError('[useLiveKitRoomConnection] Error in connectAndWatch after parameter change', { error: err });
      });
    }
  }, [shouldStream, accessToken, roomName, livekitUrl, roomRef, roomReconnection, connectAndWatchReconnect]);

  /**
   * Handles initial connection when no room exists
   */
  const handleInitialConnection = useCallback((): void => {
    // Double-check that we still need to connect (another component might have connected)
    if (isConnectingRef.current || isConnectedRef.current || lkRoomRef.current) {
      logDebug('[useLiveKitRoomConnection] Connection already in progress or connected, skipping initial connection');
      return;
    }
    
    logDebug('[useLiveKitRoomConnection] No room connected, connecting...');
    canceledRef.current = false;
    connectAndWatchInitial().catch((err) => {
      logError('[useLiveKitRoomConnection] Error in initial connectAndWatch', { error: err });
    });
  }, [connectAndWatchInitial]);

  // Main effect: handle parameter changes and connection lifecycle
  useEffect(() => {
    canceledRef.current = false;

    if (!shouldStream) {
      handleDisconnectWhenShouldStreamFalse();
      updatePreviousRefs();
      return;
    }

    // Reset disconnect flag when shouldStream becomes true (new connection)
    hasDisconnectedRef.current = false;

    logDebug('[useLiveKitRoomConnection] Main effect executed', {
      shouldStream,
      hasAccessToken: !!accessToken,
      roomName,
      hasLivekitUrl: !!livekitUrl,
      prevShouldStream: prevShouldStreamRef.current,
      isConnected: isConnectedRef.current,
      hasRoom: !!lkRoomRef.current,
    });

    if (areCriticalParamsMissing()) {
      logDebug('[useLiveKitRoomConnection] Missing critical params, skipping connection');
      updatePreviousRefs();
      return;
    }

    const needsReconnect = checkNeedsReconnect();

    logDebug('[useLiveKitRoomConnection] Connection check', {
      needsReconnect,
      hasRoom: !!lkRoomRef.current,
      isConnected: isConnectedRef.current,
      isConnecting: isConnectingRef.current,
    });

    // If already connected and parameters haven't changed, do nothing
    if (isConnectedRef.current && lkRoomRef.current && !needsReconnect) {
      logDebug('[useLiveKitRoomConnection] Already connected with same parameters, skipping');
      updatePreviousRefs();
      return;
    }

    // If parameters changed and we have a room, reconnect
    if (needsReconnect && (lkRoomRef.current || isConnectingRef.current)) {
      handleParameterChangeReconnection().catch((err) => {
        logError('[useLiveKitRoomConnection] Error in handleParameterChangeReconnection', { error: err });
      });
    } else if (!lkRoomRef.current && !isConnectingRef.current && !isConnectedRef.current) {
      // Only attempt initial connection if we're not already connecting or connected
      handleInitialConnection();
    }

    updatePreviousRefs();

    return () => {
      // Only disconnect in cleanup if shouldStream is false AND we have a room
      // This prevents disconnecting when component unmounts due to layout change
      // but shouldStream is still true (PSO is still streaming)
      if (!shouldStream && lkRoomRef.current) {
        logDebug('[useLiveKitRoomConnection] Cleanup: shouldStream is false, disconnecting', {
          roomName: roomNameRef.current,
        });
        disconnect().catch((err) => {
          logError('[useLiveKitRoomConnection] Error in cleanup disconnect', { error: err });
        });
      } else {
        logDebug('[useLiveKitRoomConnection] Cleanup: skipping disconnect', {
          shouldStream,
          hasRoom: !!lkRoomRef.current,
          roomName: roomNameRef.current,
        });
      }
    };
  }, [
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    roomRef,
    roomReconnection,
    handleDisconnectWhenShouldStreamFalse,
    updatePreviousRefs,
    areCriticalParamsMissing,
    checkNeedsReconnect,
    handleParameterChangeReconnection,
    handleInitialConnection,
    disconnect,
  ]);


  return {
    isConnected,
    isConnecting,
    isDisconnecting,
    error,
    disconnect,
  };
}

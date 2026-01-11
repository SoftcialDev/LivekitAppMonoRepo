/**
 * @fileoverview useLiveKitRoomConnection hook
 * @summary Hook for managing LiveKit room connection
 * @description Orchestrates room connection, reconnection, and lifecycle management.
 * Uses smaller hooks following SRP to reduce complexity.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Room, DisconnectReason } from 'livekit-client';
import { logError, logWarn, logDebug } from '@/shared/utils/logger';
import { RECONNECT_DELAY_MS } from './constants/roomConnectionConstants';
import { useRoomConnection } from './hooks/useRoomConnection';
import { useRoomReconnection } from './hooks/useRoomReconnection';
import { cleanupRoom } from './utils/roomConnectionUtils';
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
  const handleDisconnectedWithReconnectionRef = useRef<((reason?: DisconnectReason) => void) | null>(null);
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

  // Handle room connected
  const handleRoomConnected = useCallback(
    (room: Room): void => {
      if (canceledRef.current || !shouldStreamRef.current) {
        logDebug('[useLiveKitRoomConnection] Connection succeeded but was canceled, disconnecting');
        void cleanupRoom(room);
        return;
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

      const roomToCleanup = lkRoomRef.current;
      lkRoomRef.current = null;

      if (roomRef) {
        (roomRef as React.MutableRefObject<Room | null>).current = null;
      }

      if (roomToCleanup) {
        void cleanupRoom(roomToCleanup);
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
  const roomReconnection = useRoomReconnection({
    shouldStream,
    onReconnect: async () => {
      if (canceledRef.current || !shouldStreamRef.current) {
        return;
      }

      try {
        const room = await roomConnection.connect();
        if (room) {
          handleRoomConnected(room);
        }
      } catch (err) {
        logError('[useLiveKitRoomConnection] Reconnection failed', { error: err });
      }
    },
  });

  // Enhanced disconnected handler that includes reconnection logic
  const enhancedHandleDisconnected = useCallback(
    (reason?: DisconnectReason): void => {
      handleRoomDisconnected(reason);
      if (!canceledRef.current && shouldStreamRef.current) {
        roomReconnection.handleDisconnection(reason);
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
  });

  // Connect function
  const connectAndWatch = useCallback(async (): Promise<void> => {
    if (isConnectingRef.current || isConnectedRef.current) {
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

    isConnectingRef.current = true;
    setIsConnecting(true);
    errorRef.current = null;
    setError(null);

    try {
      const room = await roomConnection.connect();
      if (room) {
        handleRoomConnected(room);
        roomReconnection.reset();
      }
    } catch (err) {
      isConnectingRef.current = false;
      setIsConnecting(false);
      const connectionError = err instanceof Error ? err : new Error('Connection failed');
      errorRef.current = connectionError;
      setError(connectionError);
      logError('[useLiveKitRoomConnection] Connection failed', { error: connectionError });
    }
  }, [roomConnection, roomReconnection, handleRoomConnected, roomRef]);

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

  // Main effect: handle parameter changes and connection lifecycle
  useEffect(() => {
    canceledRef.current = false;

    if (!shouldStream) {
      // Only disconnect if not already disconnected (avoid repeated disconnects and logs)
      if (lkRoomRef.current && isConnectedRef.current && !hasDisconnectedRef.current) {
        logDebug('[useLiveKitRoomConnection] shouldStream is false, disconnecting');
        hasDisconnectedRef.current = true;
        void disconnect().finally(() => {
          hasDisconnectedRef.current = false;
        });
      }
      prevShouldStreamRef.current = shouldStream;
      prevAccessTokenRef.current = accessToken;
      prevRoomNameRef.current = roomName;
      prevLivekitUrlRef.current = livekitUrl;
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

    if (!accessToken || !roomName || !livekitUrl) {
      logDebug('[useLiveKitRoomConnection] Missing critical params, skipping connection');
      prevShouldStreamRef.current = shouldStream;
      prevAccessTokenRef.current = accessToken;
      prevRoomNameRef.current = roomName;
      prevLivekitUrlRef.current = livekitUrl;
      return;
    }

    const needsReconnect =
      shouldStream !== prevShouldStreamRef.current ||
      accessToken !== prevAccessTokenRef.current ||
      roomName !== prevRoomNameRef.current ||
      livekitUrl !== prevLivekitUrlRef.current;

    logDebug('[useLiveKitRoomConnection] Connection check', {
      needsReconnect,
      hasRoom: !!lkRoomRef.current,
      isConnected: isConnectedRef.current,
    });

    if (needsReconnect && (lkRoomRef.current || isConnectingRef.current)) {
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
        void cleanupRoom(roomToCleanup).then(() => {
          if (shouldStreamRef.current && !canceledRef.current && !isConnectingRef.current) {
            logDebug('[useLiveKitRoomConnection] Attempting reconnection after parameter change');
            void connectAndWatch();
          }
        });
      } else {
        // No room to cleanup, reconnect immediately
        if (shouldStreamRef.current && !canceledRef.current && !isConnectingRef.current) {
          logDebug('[useLiveKitRoomConnection] Attempting reconnection after parameter change');
          void connectAndWatch();
        }
      }
    } else if (!lkRoomRef.current && !isConnectingRef.current && !isConnectedRef.current) {
      logDebug('[useLiveKitRoomConnection] No room connected, connecting...');
      canceledRef.current = false;
      void connectAndWatch();
    }

    prevShouldStreamRef.current = shouldStream;
    prevAccessTokenRef.current = accessToken;
    prevRoomNameRef.current = roomName;
    prevLivekitUrlRef.current = livekitUrl;

    return () => {
      if (!shouldStream) {
        logDebug('[useLiveKitRoomConnection] Cleanup: shouldStream is false, disconnecting');
        void disconnect();
      }
    };
  }, [
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    roomRef,
    roomReconnection,
    connectAndWatch,
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

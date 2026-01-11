/**
 * @fileoverview useRoomConnection hook
 * @summary Hook for initial room connection
 * @description Handles initial connection to LiveKit room
 */

import { useRef, useCallback } from 'react';
import type { Room, DisconnectReason } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { logError, logWarn, logDebug } from '@/shared/utils/logger';
import { LiveKitConnectionError } from '../errors/livekitErrors';
import { MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY_MS } from '../constants/roomConnectionConstants';
import { validateConnectionParams, createOptimizedRoom, cleanupRoom } from '../utils/roomConnectionUtils';
import type {
  IUseRoomConnectionOptions,
  IUseRoomConnectionReturn,
} from '../types/roomConnectionTypes';

/**
 * Hook for managing initial room connection
 * @param options - Configuration options
 * @returns Connection functions
 */
export function useRoomConnection(
  options: IUseRoomConnectionOptions
): IUseRoomConnectionReturn {
  const {
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    onConnected,
    onDisconnected,
    onReconnecting,
  } = options;

  const isConnectingRef = useRef(false);
  const errorRef = useRef<Error | null>(null);

  const connect = useCallback(async (): Promise<Room | null> => {
    if (!validateConnectionParams(shouldStream, accessToken, roomName, livekitUrl)) {
      return null;
    }

    if (isConnectingRef.current) {
      logDebug('[useRoomConnection] Connection already in progress');
      return null;
    }

    isConnectingRef.current = true;
    errorRef.current = null;

    try {
      const room = createOptimizedRoom();

      // Setup event handlers
      const handleDisconnected = (reason?: DisconnectReason): void => {
        onDisconnected(reason);
      };

      const handleReconnecting = (): void => {
        logDebug('[useRoomConnection] Room reconnecting...', { roomName });
        onReconnecting();
      };

      room.on(RoomEvent.Disconnected, handleDisconnected);
      room.on(RoomEvent.Reconnecting, handleReconnecting);

      // Connect to room
      await room.connect(livekitUrl!, accessToken!);

      if (room.state !== 'connected') {
        logWarn('[useRoomConnection] Room connected but state is not connected', {
          roomState: room.state,
          roomName,
        });
      }

      isConnectingRef.current = false;
      onConnected(room);
      return room;
    } catch (error) {
      isConnectingRef.current = false;
      const connectionError = new LiveKitConnectionError(
        `Failed to connect to room: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
      errorRef.current = connectionError;
      logError('[useRoomConnection] Connection failed', { error: connectionError, roomName });
      throw connectionError;
    }
  }, [shouldStream, accessToken, roomName, livekitUrl, onConnected, onDisconnected, onReconnecting]);

  return {
    connect,
    isConnecting: isConnectingRef.current,
    error: errorRef.current,
  };
}


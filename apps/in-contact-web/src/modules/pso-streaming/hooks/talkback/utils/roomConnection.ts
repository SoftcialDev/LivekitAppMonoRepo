/**
 * @fileoverview Room connection utilities
 * @summary Helper functions for waiting for LiveKit room connection
 * @description Utilities for checking and waiting for room connection state
 */

import type { Room } from 'livekit-client';
import { logError, logWarn } from '@/shared/utils/logger';
import {
  MAX_ROOM_WAIT_ATTEMPTS,
  ROOM_WAIT_INTERVAL_MS,
  ROOM_CONNECTION_WAIT_MS,
} from '../constants/talkbackConstants';
import { TalkbackRoomNotConnectedError } from '../../../errors';

/**
 * Waits for a room to become available
 * 
 * @param getRoom - Function that returns the current room reference
 * @returns Promise resolving to the connected room
 * @throws {TalkbackRoomNotConnectedError} If room is not available after waiting
 */
export async function waitForRoomConnection(
  getRoom: () => Room | null
): Promise<Room> {
  let room = getRoom();
  let attempts = 0;

  while (!room && attempts < MAX_ROOM_WAIT_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, ROOM_WAIT_INTERVAL_MS));
    room = getRoom();
    attempts++;
  }

  if (!room) {
    logError('Room not available after waiting', {
      attempts,
      hasRoomRef: !!getRoom(),
    });
    throw new TalkbackRoomNotConnectedError(
      'Room is not connected - please wait for connection'
    );
  }

  // Double check that room is actually connected
  if (room.state !== 'connected') {
    logWarn('Room exists but not connected, waiting...', {
      roomState: room.state,
    });
    // Wait a bit more for connection
    await new Promise((resolve) => setTimeout(resolve, ROOM_CONNECTION_WAIT_MS));
    room = getRoom();
    if (!room || room.state !== 'connected') {
      throw new TalkbackRoomNotConnectedError(
        'Room is not connected - connection in progress'
      );
    }
  }

  return room;
}


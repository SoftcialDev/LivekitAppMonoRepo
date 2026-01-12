/**
 * @fileoverview Stream status helper functions
 * @summary Helper functions for processing stream status
 * @description Utility functions for converting streaming status data
 */

import { StreamingStatus, StreamingStopReason } from '../../../enums';
import type { StreamingStatusInfo } from '../../../types';
import type { UserStreamingStatus } from '../../../api/types';

/**
 * Determines streaming status based on stop reason
 */
export function getStatusFromStopReason(stopReason: StreamingStopReason | null): StreamingStatus {
  if (!stopReason) {
    return StreamingStatus.OFFLINE;
  }

  const breakReasons = [
    StreamingStopReason.QUICK_BREAK,
    StreamingStopReason.SHORT_BREAK,
    StreamingStopReason.LUNCH_BREAK,
  ];

  const disconnectReasons = [
    StreamingStopReason.EMERGENCY,
    StreamingStopReason.DISCONNECT,
  ];

  if (breakReasons.includes(stopReason)) {
    return StreamingStatus.ON_BREAK;
  }

  if (disconnectReasons.includes(stopReason)) {
    return StreamingStatus.DISCONNECTED;
  }

  return StreamingStatus.OFFLINE;
}

/**
 * Builds a status map from batch response statuses
 */
export function buildStatusMap(statuses: UserStreamingStatus[]): Record<string, StreamingStatusInfo> {
  const map: Record<string, StreamingStatusInfo> = {};

  statuses.forEach((status) => {
    const email = status.email.toLowerCase();

    if (status.hasActiveSession) {
      return;
    }

    const userStatus = status.lastSession
      ? getStatusFromStopReason(status.lastSession.stopReason)
      : StreamingStatus.OFFLINE;

    map[email] = {
      email: status.email,
      status: userStatus,
      lastSession: status.lastSession,
    };
  });

  return map;
}

/**
 * Builds email to room mapping from streaming sessions
 */
export function buildEmailToRoomMap(sessions: unknown[]): Map<string, string> {
  const emailToRoom = new Map<string, string>();

  sessions.forEach((session) => {
    if (
      typeof session === 'object' &&
      session !== null &&
      'email' in session &&
      'userId' in session
    ) {
      const email = String(session.email).toLowerCase();
      const userId = String(session.userId);
      emailToRoom.set(email, userId);
    }
  });

  return emailToRoom;
}

/**
 * Builds room to token mapping from LiveKit rooms
 */
export function buildRoomToTokenMap(rooms: unknown[]): Map<string, string> {
  const byRoom = new Map<string, string>();

  rooms.forEach((room) => {
    if (
      typeof room === 'object' &&
      room !== null &&
      'room' in room &&
      'token' in room
    ) {
      const roomName = String(room.room);
      const token = String(room.token);
      byRoom.set(roomName, token);
    }
  });

  return byRoom;
}


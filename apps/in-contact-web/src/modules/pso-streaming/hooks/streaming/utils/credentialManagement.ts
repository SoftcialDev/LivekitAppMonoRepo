/**
 * @fileoverview Credential management utilities
 * @summary Helper functions for managing stream credentials
 * @description Utilities for fetching and updating stream credentials
 */

import { getLiveKitToken } from '../../../api/livekitClient';
import { fetchStreamingSessions } from '../../../api/streamingStatusClient';
import { fetchStreamingStatusBatch } from '../../../api/streamingStatusBatchClient';
import type { StreamingStatusBatchResponse } from '../../../api/types';
import type { CredsMap, StreamCreds, StreamingStatusInfo } from '../../../types';
import { buildStatusMap, buildEmailToRoomMap, buildRoomToTokenMap } from './streamStatusHelpers';

/**
 * Fetches and distributes credentials for a list of emails
 */
export async function fetchAndDistributeCredentials(
  emails: string[],
  existingCreds: CredsMap
): Promise<CredsMap> {
  try {
    const [sessions, { rooms, livekitUrl }] = await Promise.all([
      fetchStreamingSessions(),
      getLiveKitToken(),
    ]);

    const emailToRoom = buildEmailToRoomMap(sessions);
    const roomToToken = buildRoomToTokenMap(rooms);

    const notInSessions = emails.filter((e) => !emailToRoom.has(e.toLowerCase()));
    let batchMap: Record<string, StreamingStatusInfo> = {};

    if (notInSessions.length > 0) {
      try {
        const batchResp: StreamingStatusBatchResponse = await fetchStreamingStatusBatch(notInSessions);
        batchMap = buildStatusMap(batchResp.statuses);
      } catch {
        // Ignore batch errors
      }
    }

    const newCreds: CredsMap = { ...existingCreds };

    emails.forEach((email) => {
      const key = email.toLowerCase();
      const room = emailToRoom.get(key);
      const token = room ? roomToToken.get(room) : undefined;
      const statusInfo = batchMap[key];

      if (room && token) {
        newCreds[key] = {
          accessToken: token,
          roomName: room,
          livekitUrl,
          loading: false,
        };
      } else if (!newCreds[key]) {
        newCreds[key] = statusInfo
          ? { loading: false, statusInfo }
          : { loading: false };
      }
    });

    return newCreds;
  } catch {
    // Return existing creds on error
    return existingCreds;
  }
}

/**
 * Fetches credentials for a single email
 * Optimized to minimize API calls by first getting the room name,
 * then fetching only the token for that specific room.
 */
export async function fetchCredentialsForEmail(
  email: string
): Promise<StreamCreds | null> {
  try {
    // First, get sessions to find the room name for this email
    const sessions = await fetchStreamingSessions();
    const emailToRoom = buildEmailToRoomMap(sessions);
    const key = email.toLowerCase();
    const room = emailToRoom.get(key);

    // If no room found, the email doesn't have an active session
    if (!room) {
      return null;
    }

    // Now fetch token only for this specific room (more efficient than getting all tokens)
    const { rooms, livekitUrl } = await getLiveKitToken(room);
    const roomToToken = buildRoomToTokenMap(rooms);
    const token = roomToToken.get(room);

    if (token) {
      return {
        accessToken: token,
        roomName: room,
        livekitUrl,
        loading: false,
      };
    }

    return null;
  } catch {
    return null;
  }
}


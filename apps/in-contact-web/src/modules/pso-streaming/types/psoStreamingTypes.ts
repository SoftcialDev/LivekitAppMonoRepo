/**
 * @fileoverview PSO Streaming types
 * @summary Type definitions for PSO streaming module
 * @description Type definitions for PSO streaming functionality including streaming status, credentials, and PSO data structures
 */

import { StreamingStopReason, StreamingStatus } from '../enums';

/**
 * PSO with status information
 */
export interface PSOWithStatus {
  email: string;
  fullName: string;
  name: string;
  status: 'online' | 'offline';
  isOnline: boolean;
  supervisorName: string;
  supervisorEmail?: string;
}

/**
 * Streaming status information
 */
export interface StreamingStatusInfo {
  email: string;
  status: StreamingStatus;
  lastSession: {
    stopReason: StreamingStopReason | null;
    stoppedAt: string | null;
  } | null;
}

/**
 * Stream credentials for LiveKit
 */
export interface StreamCreds {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
  statusInfo?: StreamingStatusInfo;
}

/**
 * Map of email to stream credentials
 */
export type CredsMap = Record<string, StreamCreds>;

/**
 * Available grid layout options
 */
export type LayoutOption = 1 | 2 | 3 | 4 | 5 | 6 | 9 | 12 | 20 | 200;


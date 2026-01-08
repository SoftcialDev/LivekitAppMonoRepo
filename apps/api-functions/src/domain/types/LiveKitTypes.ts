/**
 * @fileoverview LiveKitTypes - Type definitions for LiveKit operations
 * @summary Defines types and interfaces for LiveKit egress results
 * @description Encapsulates LiveKit egress operation result structures
 */

import type { EgressInfo } from 'livekit-server-sdk';

/**
 * Result of starting an egress
 * @description Contains information about a successfully started egress
 */
export interface EgressStartResult {
  /**
   * Egress identifier
   */
  egressId: string;

  /**
   * Blob storage object key
   */
  objectKey: string;
}

/**
 * Result of stopping an egress
 * @description Contains information about a stopped egress
 */
export interface EgressStopResult {
  /**
   * Egress information from LiveKit
   */
  info: EgressInfo;

  /**
   * Blob storage URL if available
   */
  blobUrl?: string;
}

/**
 * Egress error details extracted from EgressInfo or error object
 * @description Type definition for LiveKit Egress error details
 */
export interface EgressErrorDetails {
  /**
   * Egress status
   */
  status?: string;
  /**
   * Status detail message
   */
  statusDetail?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Error message (alternative field)
   */
  errorMessage?: string;
  /**
   * Room name
   */
  roomName?: string;
  /**
   * Room ID
   */
  roomId?: string;
  /**
   * Start timestamp
   */
  startedAt?: string | number;
  /**
   * End timestamp
   */
  endedAt?: string | number;
  /**
   * Duration in milliseconds
   */
  duration?: number;
  /**
   * Source type
   */
  sourceType?: string;
  /**
   * File results
   */
  fileResults?: unknown;
  /**
   * Stream results
   */
  streamResults?: unknown;
  /**
   * Segment results
   */
  segmentResults?: unknown;
}


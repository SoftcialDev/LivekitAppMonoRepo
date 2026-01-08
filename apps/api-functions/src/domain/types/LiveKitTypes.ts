/**
 * @fileoverview LiveKitTypes - Type definitions for LiveKit operations
 * @summary Defines types and interfaces for LiveKit egress results
 * @description Encapsulates LiveKit egress operation result structures
 */

import type { EgressInfo } from 'livekit-server-sdk';

/**
 * File result from LiveKit egress
 */
export interface LiveKitFileResult {
  location?: string;
  filename?: string;
  startedAt?: number;
  endedAt?: number;
  duration?: number;
  size?: number;
}

/**
 * Extended EgressInfo with file results
 * @description Type that represents EgressInfo with additional properties that may be present
 */
export type ExtendedEgressInfo = EgressInfo & {
  fileResults?: LiveKitFileResult[];
  result?: {
    fileResults?: LiveKitFileResult[];
  };
  results?: Array<{
    location?: string;
  }>;
  id?: string;
  egress_id?: string;
}

/**
 * Response from listEgress operation
 */
export interface ListEgressResponse {
  items?: ExtendedEgressInfo[];
}

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


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


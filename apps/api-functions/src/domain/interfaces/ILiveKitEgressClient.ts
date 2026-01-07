/**
 * @fileoverview ILiveKitEgressClient - Interface for LiveKit Egress client operations
 * @summary Defines contract for LiveKit Egress infrastructure operations
 * @description Provides abstraction for LiveKit Egress client in infrastructure layer
 */

import { EgressInfo } from 'livekit-server-sdk';
import { EgressStartResult, EgressStopResult } from '../types/LiveKitTypes';

/**
 * Interface for LiveKit Egress client operations
 * @description Pure infrastructure interface - only handles communication with LiveKit SDK
 */
export interface ILiveKitEgressClient {
  /**
   * Starts a participant-only egress and uploads directly to Azure Blob Storage
   * @param roomName - LiveKit room (and participant identity) to record
   * @param ownerLabel - Human-friendly label used to build the folder prefix
   * @returns Egress identifier and blob object key
   * @throws Error if egress fails to start
   */
  startEgress(roomName: string, ownerLabel: string): Promise<EgressStartResult>;

  /**
   * Stops an active egress
   * @param egressId - Identifier of the egress to stop
   * @returns Egress info and blob URL if available
   * @throws Error if stop operation fails
   */
  stopEgress(egressId: string): Promise<EgressStopResult>;

  /**
   * Gets the current status of an egress from LiveKit cluster
   * @param egressId - Identifier of the egress
   * @returns EgressInfo with current status and details, or null if not found
   */
  getEgressInfo(egressId: string): Promise<EgressInfo | null>;
}


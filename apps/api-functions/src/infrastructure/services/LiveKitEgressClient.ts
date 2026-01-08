/**
 * @fileoverview LiveKitEgressClient - Infrastructure client for LiveKit Egress operations
 * @summary Handles direct communication with LiveKit Egress SDK
 * @description Pure infrastructure client that only communicates with LiveKit Egress API, no business logic
 */

import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  AzureBlobUpload,
  type EncodedOutputs,
  type EgressInfo,
  EncodingOptions,
  type RoomCompositeOptions,
} from "livekit-server-sdk";
import { config } from '../../config';
import { slugify, datePrefixUTC } from '../../index';
import { getValidatedStorageCredentials } from './recordingCredentialValidator';
import { ILiveKitEgressClient, type EgressStartResult, type EgressStopResult } from '../../index';
import { LiveKitOperationError } from '../../index';

/**
 * Infrastructure client for LiveKit Egress operations
 * @description Pure infrastructure layer - only handles communication with LiveKit SDK
 */
export class LiveKitEgressClient implements ILiveKitEgressClient {
  private readonly egressClient: EgressClient;

  constructor() {
    this.egressClient = new EgressClient(
      config.livekitApiUrl,
      config.livekitApiKey,
      config.livekitApiSecret
    );
  }

  /**
   * Builds blob object key for recording
   * @param ownerLabel - Human-friendly label for folder prefix
   * @param roomName - LiveKit room name
   * @returns Object key path
   */
  private buildObjectKey(ownerLabel: string, roomName: string): string {
    const ownerSlug = slugify(ownerLabel);
    const prefix = `${ownerSlug}/${datePrefixUTC()}`;
    return `${prefix}/${roomName}-${Date.now()}.mp4`;
  }

  /**
   * Starts a participant-only egress and uploads directly to Azure Blob Storage
   * @param roomName - LiveKit room (and participant identity) to record
   * @param ownerLabel - Human-friendly label used to build the folder prefix
   * @returns Egress identifier and blob object key
   * @throws Error if egress fails to start
   */
  async startEgress(roomName: string, ownerLabel: string): Promise<EgressStartResult> {
    const { accountName, accountKey, containerName } = getValidatedStorageCredentials();
    const objectKey = this.buildObjectKey(ownerLabel, roomName);
    
    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: objectKey,
      output: {
        case: "azure",
        value: new AzureBlobUpload({
          accountName: accountName,
          accountKey: accountKey,
          containerName: containerName,
        }),
      },
    });

    const outputs: EncodedOutputs = { file: fileOutput };

    const opts: Partial<RoomCompositeOptions> = {
      audioOnly: false,
      videoOnly: false,
      encodingOptions: new EncodingOptions({
        width: 854,
        height: 480,
        framerate: 24,
        videoBitrate: 800,
        audioBitrate: 48,
        keyFrameInterval: 2,
      }),
    };

    const info = await this.egressClient.startParticipantEgress(
      roomName,
      roomName,
      outputs,
      opts as any
    );

    if (!info.egressId) {
      throw new LiveKitOperationError("LiveKit did not return an egressId.");
    }

    return {
      egressId: info.egressId,
      objectKey,
    };
  }

  /**
   * Stops an active egress
   * @param egressId - Identifier of the egress to stop
   * @returns Egress info and blob URL if available
   * @throws Error if stop operation fails
   */
  async stopEgress(egressId: string): Promise<EgressStopResult> {
    const info = await this.egressClient.stopEgress(egressId);

    const blobUrl =
      (info as any)?.fileResults?.[0]?.location ??
      (info as any)?.result?.fileResults?.[0]?.location ??
      (info as any)?.results?.[0]?.location ??
      undefined;

    return { info, blobUrl };
  }

  /**
   * Gets the current status of an egress from LiveKit cluster
   * @param egressId - Identifier of the egress
   * @returns EgressInfo with current status and details, or null if not found
   */
  async getEgressInfo(egressId: string): Promise<EgressInfo | null> {
    try {
      let egressList: any;
      
      try {
        egressList = await (this.egressClient as any).listEgress({ egressId });
      } catch {
        try {
          egressList = await (this.egressClient as any).listEgress();
        } catch {
          return null;
        }
      }
      
      const items = egressList?.items || egressList || [];
      
      if (Array.isArray(items)) {
        const matching = items.find((item: any) => 
          item.egressId === egressId || 
          (item as any).id === egressId ||
          item.egress_id === egressId
        );
        if (matching) return matching as EgressInfo;
      } else if (items.egressId === egressId || (items as any).id === egressId) {
        return items as EgressInfo;
      }
      
      return null;
    } catch {
      return null;
    }
  }
}


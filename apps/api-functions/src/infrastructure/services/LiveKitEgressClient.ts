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
import { getValidatedStorageCredentials } from './recordingCredentialValidator';
import { ILiveKitEgressClient } from '../../domain/interfaces/ILiveKitEgressClient';
import { EgressStartResult, EgressStopResult, ExtendedEgressInfo, ListEgressResponse } from '../../domain/types/LiveKitTypes';
import { LiveKitOperationError } from '../../domain/errors/InfrastructureErrors';
import { slugify,datePrefixUTC } from '../../utils/fileNameUtils';



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
      opts
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
    const extendedInfo = info as unknown as ExtendedEgressInfo;

    const blobUrl =
      extendedInfo?.fileResults?.[0]?.location ??
      extendedInfo?.result?.fileResults?.[0]?.location ??
      extendedInfo?.results?.[0]?.location ??
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
      let egressList: ListEgressResponse | ExtendedEgressInfo[] | ExtendedEgressInfo | null = null;
      
      try {
        // Try to use listEgress if available (may not be in SDK types)
        const client = this.egressClient as unknown as { listEgress?: (options?: { egressId?: string }) => Promise<ListEgressResponse | ExtendedEgressInfo[]> };
        if (client.listEgress) {
          egressList = await client.listEgress({ egressId });
        }
      } catch {
        try {
          const client = this.egressClient as unknown as { listEgress?: () => Promise<ListEgressResponse | ExtendedEgressInfo[]> };
          if (client.listEgress) {
            egressList = await client.listEgress();
          }
        } catch {
          return null;
        }
      }
      
      if (!egressList) return null;
      
      const items = (egressList as ListEgressResponse)?.items || (Array.isArray(egressList) ? egressList : [egressList]);
      
      if (Array.isArray(items)) {
        const matching = items.find((item) => {
          const extendedItem = item as unknown as ExtendedEgressInfo;
          return extendedItem.egressId === egressId || 
                 extendedItem.id === egressId ||
                 extendedItem.egress_id === egressId;
        });
        if (matching) return matching as unknown as EgressInfo;
      } else {
        const extendedItems = items as unknown as ExtendedEgressInfo;
        if (extendedItems.egressId === egressId || extendedItems.id === egressId) {
          return extendedItems as unknown as EgressInfo;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }
}


/**
 * @fileoverview LivekitRecordingResponse - Value Object for LivekitRecording responses
 * @summary Encapsulates response data for recording command operations
 * @description Provides structured response format for recording command results
 */

/**
 * Interface for recording result item
 */
export interface RecordingResultItem {
  sessionId: string;
  egressId: string;
  status: string;
  blobPath?: string;
  blobUrl?: string;
  sasUrl?: string;
  roomName: string;
  initiatorUserId: string;
  subjectUserId?: string | null;
}

/**
 * Interface for LivekitRecording response payload
 */
export interface LivekitRecordingResponsePayload {
  message: string;
  roomName: string;
  egressId?: string;
  blobPath?: string;
  results?: RecordingResultItem[];
  sasUrl?: string;
}

/**
 * Value Object for LivekitRecording response
 * 
 * @param message - Human-readable response message
 * @param roomName - LiveKit room name
 * @param egressId - LiveKit egress identifier (for start commands)
 * @param blobPath - Blob storage path (for start commands)
 * @param results - Array of recording results (for stop commands)
 * @param sasUrl - SAS URL for playback (for stop commands)
 */
export class LivekitRecordingResponse {
  constructor(
    public readonly message: string,
    public readonly roomName: string,
    public readonly egressId?: string,
    public readonly blobPath?: string,
    public readonly results?: RecordingResultItem[],
    public readonly sasUrl?: string
  ) {}

  /**
   * Creates response for start recording command
   * @param message - Success message
   * @param roomName - Room name
   * @param egressId - Egress identifier
   * @param blobPath - Blob storage path
   * @returns LivekitRecordingResponse for start command
   */
  static forStartCommand(
    message: string,
    roomName: string,
    egressId: string,
    blobPath: string
  ): LivekitRecordingResponse {
    return new LivekitRecordingResponse(message, roomName, egressId, blobPath);
  }

  /**
   * Creates response for stop recording command
   * @param message - Success message
   * @param roomName - Room name
   * @param results - Recording results
   * @param sasUrl - SAS URL for playback
   * @returns LivekitRecordingResponse for stop command
   */
  static forStopCommand(
    message: string,
    roomName: string,
    results: RecordingResultItem[],
    sasUrl?: string
  ): LivekitRecordingResponse {
    return new LivekitRecordingResponse(message, roomName, undefined, undefined, results, sasUrl);
  }

  /**
   * Converts response to payload format
   * @returns Structured payload for API response
   */
  toPayload(): LivekitRecordingResponsePayload {
    return {
      message: this.message,
      roomName: this.roomName,
      ...(this.egressId && { egressId: this.egressId }),
      ...(this.blobPath && { blobPath: this.blobPath }),
      ...(this.results && { results: this.results }),
      ...(this.sasUrl && { sasUrl: this.sasUrl }),
    };
  }
}


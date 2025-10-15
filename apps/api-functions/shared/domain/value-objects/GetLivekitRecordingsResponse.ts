/**
 * @fileoverview GetLivekitRecordingsResponse - Value Object for GetLivekitRecordings responses
 * @summary Encapsulates response data for LiveKit recordings list
 * @description Provides structured response format for recording session data with UI-ready fields
 */

/**
 * Interface for recording list item payload
 */
export interface RecordingListItemPayload {
  id: string;
  roomName: string;
  roomId?: string | null;
  egressId: string;
  userId: string;
  status: string;
  startedAt: string;
  stoppedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  username?: string;
  recordedBy?: string;
  blobPath?: string | null;
  blobUrl?: string | null;
  playbackUrl?: string;
  duration: number;
}

/**
 * Interface for GetLivekitRecordings response payload
 */
export interface GetLivekitRecordingsResponsePayload {
  items: RecordingListItemPayload[];
  count: number;
}

/**
 * Value Object for GetLivekitRecordings response
 * 
 * @param items - Array of recording session items with UI-ready data
 * @param count - Total number of recordings returned
 */
export class GetLivekitRecordingsResponse {
  constructor(
    public readonly items: RecordingListItemPayload[],
    public readonly count: number
  ) {}

  /**
   * Creates response with recording items
   * @param items - Array of recording session items
   * @returns GetLivekitRecordingsResponse instance
   */
  static withItems(items: RecordingListItemPayload[]): GetLivekitRecordingsResponse {
    return new GetLivekitRecordingsResponse(items, items.length);
  }

  /**
   * Creates empty response
   * @returns GetLivekitRecordingsResponse with empty items
   */
  static withNoItems(): GetLivekitRecordingsResponse {
    return new GetLivekitRecordingsResponse([], 0);
  }

  /**
   * Converts response to payload format
   * @returns Structured payload for API response
   */
  toPayload(): GetLivekitRecordingsResponsePayload {
    return {
      items: this.items,
      count: this.count,
    };
  }
}

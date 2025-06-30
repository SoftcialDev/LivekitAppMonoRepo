import apiClient from './apiClient';

/**
 * Payload for updating the streaming status.
 *
 * @remarks
 * This payload is sent to the backend endpoint to indicate
 * whether the user has started or stopped streaming.
 */
export interface StreamingStatusPayload {
  /**
   * The new streaming status.
   * - `"started"`: indicates that streaming has begun.
   * - `"stopped"`: indicates that streaming has ended.
   */
  status: 'started' | 'stopped';
}

/**
 * Data transfer object representing a single streaming session history entry.
 */
export interface StreamingSessionHistoryDto {
  /** Primary key of the session record. */
  id: string;
  /** Identifier of the user, which corresponds to the LiveKit room name. */
  userId: string;
  /** ISO-8601 timestamp marking when the session started. */
  startedAt: string;
  /**
   * ISO-8601 timestamp marking when the session stopped.
   * Will be `null` if the session is still active.
   */
  stoppedAt: string | null;
  /** ISO-8601 timestamp when this record was created. */
  createdAt: string;
  /** ISO-8601 timestamp when this record was last updated. */
  updatedAt: string;
}

/**
 * Client for notifying the backend about the user's video streaming state
 * and for fetching the user's streaming session history.
 */
export class StreamingClient {
  /**
   * Notify the backend that the user has started streaming video.
   *
   * @returns A promise that resolves when the request completes.
   * @throws Will propagate any network or API errors.
   */
  public async setActive(): Promise<void> {
    await apiClient.post<unknown>(
      '/api/StreamingSessionUpdate',
      { status: 'started' } as StreamingStatusPayload
    );
  }

  /**
   * Notify the backend that the user has stopped streaming video.
   *
   * @returns A promise that resolves when the request completes.
   * @throws Will propagate any network or API errors.
   */
  public async setInactive(): Promise<void> {
    await apiClient.post<unknown>(
      '/api/StreamingSessionUpdate',
      { status: 'stopped' } as StreamingStatusPayload
    );
  }

  /**
   * Fetch the most recent streaming session history entry
   * for the currently authenticated user.
   *
   * @returns A promise that resolves to the latest {@link StreamingSessionHistoryDto}.
   * @throws If the API response is invalid or if no history entries are found.
   */
  public async fetchLastSession(): Promise<StreamingSessionHistoryDto> {
    const res = await apiClient.get<{ sessions: StreamingSessionHistoryDto[] }>(
      '/api/FetchStreamingSessions'
    );

    if (
      !res.data ||
      !Array.isArray(res.data.sessions)
    ) {
      throw new Error('Invalid StreamingSessionHistory response');
    }

    const [latest] = res.data.sessions;
    if (!latest) {
      throw new Error('No streaming session history found');
    }

    return latest;
  }
}

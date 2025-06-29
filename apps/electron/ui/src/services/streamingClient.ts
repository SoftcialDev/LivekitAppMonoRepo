import apiClient from './apiClient';

/**
 * Payload for streaming‐status updates.
 */
interface StreamingStatusPayload {
  status: 'started' | 'stopped';
}

/**
 * Client for notifying the backend about actual
 * video‐stream state (separate from WS presence).
 */
export class StreamingClient {
  /**
   * Tell the backend “I’m now streaming video.”
   */
  public async setActive(): Promise<void> {
    await apiClient.post<unknown>(
      '/api/StreamingSessionUpdate',
      { status: 'started' } as StreamingStatusPayload
    );
  }

  /**
   * Tell the backend “I’ve stopped streaming video.”
   */
  public async setInactive(): Promise<void> {
    await apiClient.post<unknown>(
      '/api/StreamingSessionUpdate',
      { status: 'stopped' } as StreamingStatusPayload
    );
  }
}

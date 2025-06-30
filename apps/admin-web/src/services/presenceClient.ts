import apiClient from './apiClient';

/**
 * Shapes the presence status.
 */
export type PresenceStatus = 'online' | 'offline';

/**
 * Client for updating the employee's presence status on the server.
 *
 * Calls the PresenceUpdate endpoint whenever the application
 * starts or stops streaming.
 */
export class PresenceClient {
  /**
   * Marks the authenticated user as online.
   *
   * @returns void
   * @throws HTTPError if the request fails or returns non-200.
   */
  async setOnline(): Promise<void> {
    await apiClient.post('/api/PresenceUpdate', { status: 'online' });
  }

  /**
   * Marks the authenticated user as offline.
   *
   * @returns void
   * @throws HTTPError if the request fails or returns non-200.
   */
  async setOffline(): Promise<void> {
    await apiClient.post('/api/PresenceUpdate', { status: 'offline' });
  }
}

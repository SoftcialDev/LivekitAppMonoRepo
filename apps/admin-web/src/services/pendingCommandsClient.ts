import apiClient from './apiClient';

/**
 * Represents a camera command that has been issued by an admin
 * but not yet acknowledged by the client app.
 */
export interface PendingCommand {
  /** Unique identifier of the pending command record */
  id: string;
  /** One of "START" or "STOP" */
  command: 'START' | 'STOP';
  /** ISO‐8601 timestamp when the command was issued */
  timestamp: string;
}

/**
 * Client for interacting with the pending‐commands REST API.
 *
 * Supports fetching unacknowledged commands and marking them acknowledged.
 */
export class PendingCommandsClient {
  /**
   * Fetches all pending commands for the authenticated user.
   *
   * The server may return:
   * - `pending` as an array
   * - `pending` as a single object
   * - `pending` omitted (no commands)
   *
   * This method normalizes all cases into an array.
   *
   * @returns Array of `PendingCommand`, oldest first. Empty if none.
   * @throws HTTPError if the request fails or returns a non-200 status.
   */
  public async fetch(): Promise<PendingCommand[]> {
    const response = await apiClient.get<{
      pending?: PendingCommand | PendingCommand[];
    }>('/api/FetchPendingCommands');

    const raw = response.data.pending;
    if (Array.isArray(raw)) {
      return raw;
    } else if (raw) {
      return [raw];
    } else {
      return [];
    }
  }

  /**
   * Acknowledges that the given commands have been received and processed.
   *
   * @param ids — Array of command IDs to mark acknowledged.
   * @returns Number of records successfully updated.
   * @throws HTTPError if the request fails or returns a non-200 status.
   */
  public async acknowledge(ids: string[]): Promise<number> {
    const response = await apiClient.post<{ updatedCount: number }>(
      '/api/AcknowledgeCommand',
      { ids }
    );
    return response.data.updatedCount;
  }
}

import apiClient from './apiClient';

/**
 * Represents a pending camera command fetched from the server.
 */
export interface PendingCommand {
  /** UUID of the pending command record */
  id: string;
  /** Type of command: 'START' or 'STOP' */
  command: 'START' | 'STOP';
  /** ISO timestamp when the admin issued the command */
  timestamp: string;
}

/**
 * Client for interacting with the PendingCommand REST endpoints.
 *
 * Provides methods to fetch unacknowledged commands and
 * to acknowledge processing of commands by ID.
 */
export class PendingCommandsClient {
  /**
   * Fetches all pending commands (not yet acknowledged) for the
   * authenticated employee.
   *
   * @returns An array of PendingCommand objects, sorted oldest first.
   * @throws HTTPError if the request fails or returns non-200.
   */
  async fetch(): Promise<PendingCommand[]> {
    const response = await apiClient.get<{ pending: PendingCommand[] }>(
      '/api/FetchPendingCommands'
    );
       return response.data.pending ?? [];
  }

  /**
   * Acknowledges that the given commands have been received and processed.
   *
   * @param ids Array of PendingCommand.id to mark as acknowledged.
   * @returns The number of records successfully updated.
   * @throws HTTPError if the request fails or returns non-200.
   */
  async acknowledge(ids: string[]): Promise<number> {
    const response = await apiClient.post<{ updatedCount: number }>(
      '/api/AcknowledgeCommand',
      { ids }
    );
    return response.data.updatedCount;
  }
}

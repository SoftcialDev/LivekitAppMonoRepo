/**
 * @fileoverview GetPsosBySupervisorRequest - Value object for PSOs lookup requests
 * @summary Encapsulates PSOs by supervisor request data
 * @description Value object representing a PSOs lookup request
 */

/**
 * Value object representing a PSOs lookup request
 * @description Encapsulates the caller ID and optional supervisor ID for PSOs lookup
 */
export class GetPsosBySupervisorRequest {
  /**
   * Creates a new GetPsosBySupervisorRequest instance
   * @param callerId - The ID of the caller making the request
   * @param supervisorId - Optional supervisor ID to filter PSOs
   */
  constructor(
    public readonly callerId: string,
    public readonly supervisorId?: string
  ) {}

  /**
   * Creates a GetPsosBySupervisorRequest from query parameters
   * @param callerId - The ID of the caller making the request
   * @param query - Query parameters containing optional supervisorId
   * @returns GetPsosBySupervisorRequest instance
   */
  static fromQuery(callerId: string, query: { supervisorId?: string }): GetPsosBySupervisorRequest {
    return new GetPsosBySupervisorRequest(callerId, query.supervisorId);
  }
}

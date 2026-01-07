/**
 * @fileoverview GetSupervisorForPsoRequest - Value object for supervisor lookup requests
 * @summary Encapsulates supervisor lookup request data
 * @description Value object representing a supervisor lookup request by PSO identifier
 */

/**
 * Value object representing a supervisor lookup request
 * @description Encapsulates the identifier for supervisor lookup
 */
export class GetSupervisorForPsoRequest {
  /**
   * Creates a new GetSupervisorForPsoRequest instance
   * @param identifier - The PSO identifier (ID, Azure AD Object ID, or email)
   */
  constructor(
    public readonly identifier: string
  ) {}

  /**
   * Creates a GetSupervisorForPsoRequest from query parameters
   * @param query - Query parameters containing identifier
   * @returns GetSupervisorForPsoRequest instance
   */
  static fromQuery(query: { identifier: string }): GetSupervisorForPsoRequest {
    return new GetSupervisorForPsoRequest(query.identifier.trim());
  }
}

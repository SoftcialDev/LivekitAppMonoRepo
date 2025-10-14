/**
 * @fileoverview GetSupervisorByIdentifierRequest - Value object for supervisor lookup requests
 * @summary Encapsulates supervisor identifier request data
 * @description Value object representing a supervisor lookup request
 */

/**
 * Value object representing a supervisor lookup request
 * @description Encapsulates the identifier for supervisor lookup
 */
export class GetSupervisorByIdentifierRequest {
  /**
   * Creates a new GetSupervisorByIdentifierRequest instance
   * @param identifier - The identifier to search for (ID, Azure AD Object ID, or email)
   */
  constructor(
    public readonly identifier: string
  ) {}

  /**
   * Creates a GetSupervisorByIdentifierRequest from query parameters
   * @param query - Query parameters containing identifier
   * @returns GetSupervisorByIdentifierRequest instance
   */
  static fromQuery(query: { identifier: string }): GetSupervisorByIdentifierRequest {
    return new GetSupervisorByIdentifierRequest(query.identifier.trim());
  }
}

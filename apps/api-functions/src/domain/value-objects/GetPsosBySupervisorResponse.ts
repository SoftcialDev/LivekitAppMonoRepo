/**
 * @fileoverview GetPsosBySupervisorResponse - Value object for PSOs lookup responses
 * @summary Encapsulates PSOs lookup response data
 * @description Value object representing the response after PSOs lookup
 */

/**
 * Value object representing a PSOs lookup response
 * @description Encapsulates the list of PSOs with their supervisor information
 */
export class GetPsosBySupervisorResponse {
  /**
   * Creates a new GetPsosBySupervisorResponse instance
   * @param psos - Array of PSOs with their supervisor information
   */
  constructor(
    public readonly psos: Array<{
      email: string;
      supervisorName: string;
    }>
  ) {}

  /**
   * Converts the response to a plain object for HTTP response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      psos: this.psos
    };
  }

  /**
   * Creates a success response with PSOs data
   * @param psos - Array of PSOs with supervisor information
   * @returns GetPsosBySupervisorResponse instance
   */
  static withPsos(psos: Array<{ email: string; supervisorName: string }>): GetPsosBySupervisorResponse {
    return new GetPsosBySupervisorResponse(psos);
  }
}

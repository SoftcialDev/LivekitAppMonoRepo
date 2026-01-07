/**
 * @fileoverview GetSupervisorByIdentifierResponse - Value object for supervisor lookup responses
 * @summary Encapsulates supervisor lookup response data
 * @description Value object representing the response after supervisor lookup
 */

/**
 * Value object representing a supervisor lookup response
 * @description Encapsulates the supervisor data or message for supervisor lookup
 */
export class GetSupervisorByIdentifierResponse {
  /**
   * Creates a new GetSupervisorByIdentifierResponse instance
   * @param supervisor - Supervisor data if found
   * @param message - Message if no supervisor found
   */
  constructor(
    public readonly supervisor?: {
      id: string;
      azureAdObjectId: string;
      email: string;
      fullName: string;
    },
    public readonly message?: string
  ) {}

  /**
   * Converts the response to a plain object for HTTP response
   * @returns Plain object representation of the response
   */
  toPayload() {
    if (this.supervisor) {
      return {
        supervisor: this.supervisor
      };
    }
    return {
      message: this.message
    };
  }

  /**
   * Creates a success response with supervisor data
   * @param supervisor - Supervisor data
   * @returns GetSupervisorByIdentifierResponse instance
   */
  static withSupervisor(supervisor: {
    id: string;
    azureAdObjectId: string;
    email: string;
    fullName: string;
  }): GetSupervisorByIdentifierResponse {
    return new GetSupervisorByIdentifierResponse(supervisor);
  }

  /**
   * Creates a response with message (no supervisor assigned)
   * @param message - Message to return
   * @returns GetSupervisorByIdentifierResponse instance
   */
  static withMessage(message: string): GetSupervisorByIdentifierResponse {
    return new GetSupervisorByIdentifierResponse(undefined, message);
  }
}

/**
 * @fileoverview GetSupervisorForPsoResponse - Value object for supervisor lookup responses
 * @summary Encapsulates supervisor lookup response data
 * @description Value object representing the response after supervisor lookup
 */

/**
 * Value object representing a supervisor lookup response
 * @description Encapsulates the supervisor information or error message
 */
export class GetSupervisorForPsoResponse {
  /**
   * Creates a new GetSupervisorForPsoResponse instance
   * @param supervisor - Optional supervisor information
   * @param message - Optional message for special cases
   * @param error - Optional error message
   */
  constructor(
    public readonly supervisor?: {
      id: string;
      azureAdObjectId: string;
      email: string;
      fullName: string;
    },
    public readonly message?: string,
    public readonly error?: string
  ) {}

  /**
   * Converts the response to a plain object for HTTP response
   * @returns Plain object representation of the response
   */
  toPayload() {
    if (this.supervisor) {
      return { supervisor: this.supervisor };
    }
    if (this.message) {
      return { message: this.message };
    }
    if (this.error) {
      return { error: this.error };
    }
    return {};
  }

  /**
   * Creates a success response with supervisor data
   * @param supervisor - Supervisor information
   * @returns GetSupervisorForPsoResponse instance
   */
  static withSupervisor(supervisor: {
    id: string;
    azureAdObjectId: string;
    email: string;
    fullName: string;
  }): GetSupervisorForPsoResponse {
    return new GetSupervisorForPsoResponse(supervisor);
  }

  /**
   * Creates a response with a message
   * @param message - The message to include
   * @returns GetSupervisorForPsoResponse instance
   */
  static withMessage(message: string): GetSupervisorForPsoResponse {
    return new GetSupervisorForPsoResponse(undefined, message);
  }

  /**
   * Creates an error response
   * @param error - The error message
   * @returns GetSupervisorForPsoResponse instance
   */
  static withError(error: string): GetSupervisorForPsoResponse {
    return new GetSupervisorForPsoResponse(undefined, undefined, error);
  }
}

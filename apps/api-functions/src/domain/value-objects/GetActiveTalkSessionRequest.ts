/**
 * @fileoverview GetActiveTalkSessionRequest - Value object for GetActiveTalkSession requests
 * @summary Encapsulates GetActiveTalkSession request data
 * @description Represents a request to check if a PSO has an active talk session
 */

import { GetActiveTalkSessionParams } from '../schemas/GetActiveTalkSessionSchema';

/**
 * Value object representing a GetActiveTalkSession request
 * @description Encapsulates the caller ID and PSO email
 */
export class GetActiveTalkSessionRequest {
  /**
   * Creates a new GetActiveTalkSessionRequest instance
   * @param callerId - The Azure AD Object ID of the caller
   * @param psoEmail - The email of the PSO to check
   */
  constructor(
    public readonly callerId: string,
    public readonly psoEmail: string
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a GetActiveTalkSessionRequest from validated query parameters
   * @param callerId - The Azure AD Object ID of the caller
   * @param params - Validated query parameters
   * @returns A new GetActiveTalkSessionRequest instance
   */
  static fromQuery(callerId: string, params: GetActiveTalkSessionParams): GetActiveTalkSessionRequest {
    return new GetActiveTalkSessionRequest(
      callerId,
      params.psoEmail.toLowerCase().trim()
    );
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { callerId: string; psoEmail: string } {
    return {
      callerId: this.callerId,
      psoEmail: this.psoEmail
    };
  }
}


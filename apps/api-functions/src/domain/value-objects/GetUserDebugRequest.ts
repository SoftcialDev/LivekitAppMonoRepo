/**
 * @fileoverview GetUserDebugRequest - Value object for get user debug requests
 * @description Encapsulates the request to get comprehensive user debug information
 */

import { InvalidFormatError } from '../errors/EntityValidationErrors';

/**
 * Request to get user debug information
 */
export class GetUserDebugRequest {
  /**
   * Creates a new GetUserDebugRequest instance
   * @param userIdentifier - User email or Azure AD Object ID
   * @throws InvalidFormatError if user identifier is empty
   */
  constructor(
    public readonly userIdentifier: string
  ) {
    if (!userIdentifier || userIdentifier.trim() === '') {
      throw new InvalidFormatError('User identifier is required');
    }
  }

  /**
   * Creates a GetUserDebugRequest from user identifier
   * @param userIdentifier - User email or Azure AD Object ID
   * @returns GetUserDebugRequest instance
   */
  static fromIdentifier(userIdentifier: string): GetUserDebugRequest {
    return new GetUserDebugRequest(userIdentifier.trim());
  }
}


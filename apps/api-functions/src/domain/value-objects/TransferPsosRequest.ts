/**
 * @fileoverview TransferPsosRequest - Value object for PSO transfer requests
 * @summary Encapsulates PSO transfer request data
 * @description Value object representing a request to transfer PSOs to a new supervisor
 */

import { TransferPsosParams } from "../schemas/TransferPsosSchema";

/**
 * Value object representing a PSO transfer request
 * @description Encapsulates the caller ID and new supervisor email for PSO transfer
 */
export class TransferPsosRequest {
  /**
   * Creates a new TransferPsosRequest instance
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param newSupervisorEmail - The email of the new supervisor to transfer PSOs to
   */
  constructor(
    public readonly callerId: string,
    public readonly newSupervisorEmail: string
  ) {}

  /**
   * Creates a TransferPsosRequest from validated parameters
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param params - Validated request parameters
   * @returns TransferPsosRequest instance
   */
  static fromBody(callerId: string, params: TransferPsosParams): TransferPsosRequest {
    return new TransferPsosRequest(callerId, params.newSupervisorEmail);
  }
}

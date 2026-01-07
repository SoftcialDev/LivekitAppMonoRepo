/**
 * @fileoverview TransferPsosResponse - Value object for PSO transfer responses
 * @summary Encapsulates PSO transfer response data
 * @description Value object representing the response after transferring PSOs
 */

/**
 * Value object representing a PSO transfer response
 * @description Encapsulates the number of PSOs moved and success message
 */
export class TransferPsosResponse {
  /**
   * Creates a new TransferPsosResponse instance
   * @param movedCount - The number of PSOs successfully transferred
   * @param message - Success message describing the transfer
   */
  constructor(
    public readonly movedCount: number,
    public readonly message: string
  ) {}

  /**
   * Converts the response to a plain object for API response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      movedCount: this.movedCount,
      message: this.message
    };
  }
}

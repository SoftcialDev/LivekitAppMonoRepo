/**
 * @fileoverview SupervisorChangeResult - Domain value object for supervisor change results
 * @description Represents the result of a supervisor change operation
 */

/**
 * Value object representing the result of a supervisor change operation.
 */
export class SupervisorChangeResult {
  /**
   * The number of users successfully updated.
   * @type {number}
   */
  public readonly updatedCount: number;

  /**
   * The number of users skipped (non-employees).
   * @type {number}
   */
  public readonly skippedCount: number;

  /**
   * The total number of users processed.
   * @type {number}
   */
  public readonly totalProcessed: number;

  /**
   * Creates an instance of SupervisorChangeResult.
   * @param updatedCount - Number of users successfully updated.
   * @param skippedCount - Number of users skipped.
   * @param totalProcessed - Total number of users processed.
   */
  constructor(
    updatedCount: number,
    skippedCount: number = 0,
    totalProcessed: number = updatedCount + skippedCount
  ) {
    this.updatedCount = updatedCount;
    this.skippedCount = skippedCount;
    this.totalProcessed = totalProcessed;
  }

  /**
   * Creates a successful result with updated count.
   * @param updatedCount - Number of users updated.
   * @returns Successful supervisor change result.
   */
  static success(updatedCount: number): SupervisorChangeResult {
    return new SupervisorChangeResult(updatedCount);
  }

  /**
   * Creates a result with both updated and skipped counts.
   * @param updatedCount - Number of users updated.
   * @param skippedCount - Number of users skipped.
   * @returns Supervisor change result with detailed counts.
   */
  static withSkipped(updatedCount: number, skippedCount: number): SupervisorChangeResult {
    return new SupervisorChangeResult(updatedCount, skippedCount);
  }
}

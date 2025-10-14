/**
 * @fileoverview IPendingCommandRepository - Interface for pending command data access
 * @description Defines the contract for pending command repository operations
 */

/**
 * Interface for pending command repository
 */
export interface IPendingCommandRepository {
  /**
   * Marks multiple pending commands as acknowledged
   * @param commandIds - Array of command IDs to acknowledge
   * @returns Promise that resolves to number of updated records
   * @throws Error if database operation fails
   */
  markAsAcknowledged(commandIds: string[]): Promise<number>;

  /**
   * Finds pending commands by IDs
   * @param commandIds - Array of command IDs to find
   * @returns Promise that resolves to array of found command IDs
   * @throws Error if database operation fails
   */
  findByIds(commandIds: string[]): Promise<string[]>;

  /**
   * Gets pending commands for an employee
   * @param employeeId - The employee's database ID
   * @returns Promise that resolves to array of pending command entities
   * @throws Error if database operation fails
   */
  getPendingCommandsForEmployee(employeeId: string): Promise<Array<{
    id: string;
    employeeId: string;
    command: string;
    timestamp: Date;
    acknowledged: boolean;
  }>>;
}

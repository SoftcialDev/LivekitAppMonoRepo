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

  /**
   * Deletes all pending commands for an employee
   * @param employeeId - The ID of the employee
   * @returns Promise that resolves when the operation completes
   * @throws Error if database operation fails
   */
  deletePendingCommandsForEmployee(employeeId: string): Promise<void>;

  /**
   * Creates a new pending command
   * @param employeeId - The ID of the employee
   * @param command - The command type
   * @param timestamp - When the command was issued
   * @param reason - Optional reason for the command
   * @returns Promise that resolves to the created pending command
   * @throws Error if database operation fails
   */
  createPendingCommand(employeeId: string, command: any, timestamp: Date, reason?: string): Promise<{ id: string; employeeId: string; command: string; timestamp: Date; reason?: string }>;

  /**
   * Marks a pending command as published
   * @param commandId - The ID of the command to mark as published
   * @returns Promise that resolves when the operation completes
   * @throws Error if database operation fails
   */
  markAsPublished(commandId: string): Promise<void>;
}

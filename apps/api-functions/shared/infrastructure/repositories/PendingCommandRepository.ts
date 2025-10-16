/**
 * @fileoverview PendingCommandRepository - Repository for pending command data access
 * @description Implements data access operations for pending commands using Prisma
 */

import { IPendingCommandRepository } from '../../domain/interfaces/IPendingCommandRepository';
import prisma from '../database/PrismaClientService';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Repository for pending command data access operations
 */
export class PendingCommandRepository implements IPendingCommandRepository {
  /**
   * Marks multiple pending commands as acknowledged
   * @param commandIds - Array of command IDs to acknowledge
   * @returns Promise that resolves to number of updated records
   * @throws Error if database operation fails
   */
  async markAsAcknowledged(commandIds: string[]): Promise<number> {
    try {
      const result = await prisma.pendingCommand.updateMany({
        where: { 
          id: { in: commandIds } 
        },
        data: {
          acknowledged: true,
          acknowledgedAt: getCentralAmericaTime()
        }
      });

      return result.count;
    } catch (error: any) {
      throw new Error(`Failed to mark commands as acknowledged: ${error.message}`);
    }
  }

  /**
   * Finds pending commands by IDs
   * @param commandIds - Array of command IDs to find
   * @returns Promise that resolves to array of found command IDs
   * @throws Error if database operation fails
   */
  async findByIds(commandIds: string[]): Promise<string[]> {
    try {
      const commands = await prisma.pendingCommand.findMany({
        where: { 
          id: { in: commandIds } 
        },
        select: { id: true }
      });

      return commands.map((command: any) => command.id);
    } catch (error: any) {
      throw new Error(`Failed to find commands by IDs: ${error.message}`);
    }
  }

  /**
   * Gets pending commands for an employee
   * @param employeeId - The employee's database ID
   * @returns Promise that resolves to array of pending command entities
   * @throws Error if database operation fails
   */
  async getPendingCommandsForEmployee(employeeId: string): Promise<Array<{
    id: string;
    employeeId: string;
    command: string;
    timestamp: Date;
    acknowledged: boolean;
  }>> {
    try {
      const commands = await prisma.pendingCommand.findMany({
        where: {
          employeeId: employeeId,
          acknowledged: false
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return commands.map(cmd => ({
        id: cmd.id,
        employeeId: cmd.employeeId,
        command: cmd.command,
        timestamp: cmd.timestamp,
        acknowledged: cmd.acknowledged
      }));
    } catch (error: any) {
      throw new Error(`Failed to get pending commands for employee: ${error.message}`);
    }
  }

  /**
   * Deletes all pending commands for an employee
   * @param employeeId - The ID of the employee
   * @returns Promise that resolves when the operation completes
   * @throws Error if database operation fails
   */
  async deletePendingCommandsForEmployee(employeeId: string): Promise<void> {
    try {
      await prisma.pendingCommand.deleteMany({
        where: { employeeId }
      });
    } catch (error: any) {
      throw new Error(`Failed to delete pending commands for employee: ${error.message}`);
    }
  }

  /**
   * Creates a new pending command
   * @param employeeId - The ID of the employee
   * @param command - The command type
   * @param timestamp - When the command was issued
   * @param reason - Optional reason for the command
   * @returns Promise that resolves to the created pending command
   * @throws Error if database operation fails
   */
  async createPendingCommand(employeeId: string, command: any, timestamp: Date, reason?: string): Promise<{ id: string; employeeId: string; command: string; timestamp: Date; reason?: string }> {
    try {
      const pendingCommand = await prisma.pendingCommand.create({
        data: {
          employeeId,
          command,
          timestamp,
          reason,
          createdAt: getCentralAmericaTime(),
          updatedAt: getCentralAmericaTime()
        }
      });

      return {
        id: pendingCommand.id,
        employeeId: pendingCommand.employeeId,
        command: pendingCommand.command,
        timestamp: pendingCommand.timestamp,
        reason: pendingCommand.reason || undefined
      };
    } catch (error: any) {
      throw new Error(`Failed to create pending command: ${error.message}`);
    }
  }

  /**
   * Marks a pending command as published
   * @param commandId - The ID of the command to mark as published
   * @returns Promise that resolves when the operation completes
   * @throws Error if database operation fails
   */
  async markAsPublished(commandId: string): Promise<void> {
    try {
      await prisma.pendingCommand.update({
        where: { id: commandId },
        data: {
          published: true,
          publishedAt: getCentralAmericaTime(),
          attemptCount: { increment: 1 }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to mark command as published: ${error.message}`);
    }
  }
}

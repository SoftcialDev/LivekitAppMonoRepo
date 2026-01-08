/**
 * @fileoverview PendingCommandRepository - Repository for pending command data access
 * @description Implements data access operations for pending commands using Prisma
 */

import { IPendingCommandRepository } from '../../domain/interfaces/IPendingCommandRepository';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapEntityUpdateError, wrapDatabaseQueryError, wrapEntityDeletionError, wrapEntityCreationError } from '../../utils/error/ErrorHelpers';
import prisma from '../database/PrismaClientService';

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
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to mark commands as acknowledged', error);
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

      return commands.map(command => command.id);
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find commands by IDs', error);
    }
  }

  /**
   * Gets pending commands for a PSO
   * @param employeeId - The PSO's database ID
   * @returns Promise that resolves to array of pending command entities
   * @throws Error if database operation fails
   */
  async getPendingCommandsForPso(psoId: string): Promise<Array<{
    id: string;
    employeeId: string;
    command: string;
    timestamp: Date;
    acknowledged: boolean;
  }>> {
    try {
      const commands = await prisma.pendingCommand.findMany({
        where: {
          employeeId: psoId,
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
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to get pending commands for PSO', error);
    }
  }

  /**
   * Deletes all pending commands for a PSO
   * @param psoId - The ID of the PSO
   * @returns Promise that resolves when the operation completes
   * @throws Error if database operation fails
   */
  async deletePendingCommandsForPso(psoId: string): Promise<void> {
    try {
      await prisma.pendingCommand.deleteMany({
        where: { employeeId: psoId }
      });
    } catch (error: unknown) {
      throw wrapEntityDeletionError('Failed to delete pending commands for PSO', error);
    }
  }

  /**
   * Creates a new pending command
   * @param psoId - The ID of the PSO
   * @param command - The command type
   * @param timestamp - When the command was issued
   * @param reason - Optional reason for the command
   * @returns Promise that resolves to the created pending command
   * @throws Error if database operation fails
   */
  async createPendingCommand(psoId: string, command: any, timestamp: Date, reason?: string): Promise<{ id: string; employeeId: string; command: string; timestamp: Date; reason?: string }> {
    try {
      const pendingCommand = await prisma.pendingCommand.create({
        data: {
          employeeId: psoId,
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
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to create pending command', error);
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
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to mark command as published', error);
    }
  }
}

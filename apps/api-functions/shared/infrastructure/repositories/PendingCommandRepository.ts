/**
 * @fileoverview PendingCommandRepository - Repository for pending command data access
 * @description Implements data access operations for pending commands using Prisma
 */

import { IPendingCommandRepository } from '../../domain/interfaces/IPendingCommandRepository';
import prisma from '../../services/prismaClienService';
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
}

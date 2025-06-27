import prisma from "./prismaClienService";
import { sendToGroup } from "./webPubSubService";
import { getPresenceStatus } from "./presenceService";
import type { PendingCommand, CommandType } from "@prisma/client";

/**
 * Persists a new pending command for an employee.
 *
 * @param employeeId – UUID of the target employee.
 * @param command    – “START” to begin streaming or “STOP” to end it.
 * @param timestamp  – Date or ISO-string when the admin issued the command.
 * @returns Promise<PendingCommand> – The newly created PendingCommand record.
 */
export async function createPendingCommand(
  employeeId: string,
  command: CommandType,
  timestamp: string | Date
): Promise<PendingCommand> {
  const ts = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return await prisma.pendingCommand.create({
    data: {
      employeeId,
      command,
      timestamp: ts,
      // published and acknowledged default to false
      // attemptCount defaults to 0
    },
  });
}

/**
 * Attempts immediate delivery of a pending command.
 *
 * - Checks if employee is online via presenceService.
 * - If online, sends the command over Web PubSub, marks it published.
 * - If offline, leaves it pending for later retry.
 *
 * @param pendingCmd – An object containing at least:
 *   • id          – PendingCommand.id  
 *   • employeeId  – PendingCommand.employeeId  
 *   • command     – PendingCommand.command  
 *   • timestamp   – PendingCommand.timestamp  
 * @returns Promise<boolean> – True if sent now; false if left pending.
 */
export async function tryDeliverCommand(pendingCmd: {
  id: string;
  employeeId: string;
  command: CommandType;
  timestamp: Date;
}): Promise<boolean> {
  const status = await getPresenceStatus(pendingCmd.employeeId);
  if (status === "online") {
    await sendToGroup(pendingCmd.employeeId, {
      id: pendingCmd.id,
      command: pendingCmd.command,
      timestamp: pendingCmd.timestamp.toISOString(),
    });
    await prisma.pendingCommand.update({
      where: { id: pendingCmd.id },
      data: {
        published: true,
        publishedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    return true;
  }
  return false;
}

/**
 * Retrieves all commands that have not yet been acknowledged.
 *
 * @param employeeId – UUID of the employee whose commands to fetch.
 * @returns Promise<PendingCommand[]> – List of pending commands, oldest first.
 */
export async function getPendingCommandsForEmployee(
  employeeId: string
): Promise<PendingCommand[]> {
  return await prisma.pendingCommand.findMany({
    where: {
      employeeId,
      acknowledged: false,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Marks a batch of commands as acknowledged.
 *
 * @param ids – Array of PendingCommand.id strings to acknowledge.
 * @returns Promise<number> – Count of records updated.
 */
export async function markCommandsDelivered(ids: string[]): Promise<number> {
  const result = await prisma.pendingCommand.updateMany({
    where: { id: { in: ids } },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });
  return result.count;
}

import prisma from "./prismaClienService";
import { sendToGroup } from "./webPubSubService";
import { getPresenceStatus } from "./presenceService";
import type { PendingCommand, CommandType } from "@prisma/client";

/**
 * Persists a new pending command for an employee.
 *
 * @param employeeId UUID of the target employee.
 * @param command    “START” to begin streaming or “STOP” to end it.
 * @param timestamp  Date or ISO-string when the admin issued the command.
 * @returns The newly created PendingCommand record.
 */
export async function createPendingCommand(
  employeeId: string,
  command: CommandType,
  timestamp: string | Date
): Promise<PendingCommand> {
  const ts = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  const [_, newCmd] = await prisma.$transaction([
    // a) borrar anteriores
    prisma.pendingCommand.deleteMany({
      where: {
        employeeId,
      },
    }),
    // b) crear el nuevo
    prisma.pendingCommand.create({
      data: {
        employeeId,
        command,
        timestamp: ts,
      },
    }),
  ]);

  return newCmd;
}


/**
 * Attempts immediate delivery of a pending command.
 *
 * 1. Checks if the employee is currently online (via presenceService).
 * 2. If online, looks up their email, sends the command over Web PubSub
 *    to the email-based group, and marks the PendingCommand as published.
 * 3. If offline, leaves it pending for later delivery.
 *
 * @param pendingCmd Object containing:
 *   - id:         PendingCommand.id  
 *   - employeeId: PendingCommand.employeeId  
 *   - command:    PendingCommand.command  
 *   - timestamp:  PendingCommand.timestamp  
 * @returns `true` if the command was sent immediately; otherwise `false`.
 */
export async function tryDeliverCommand(pendingCmd: {
  id: string;
  employeeId: string;
  command: CommandType;
  timestamp: Date;
}): Promise<boolean> {
  // 1) Check online status
  const status = await getPresenceStatus(pendingCmd.employeeId);
  console.log(`Presence status for ${pendingCmd.employeeId}: ${status}`);
  if (status !== "online") {
    return false;
  }

  // 2) Retrieve the employee's email to use as the group name
  const user = await prisma.user.findUnique({
    where: { id: pendingCmd.employeeId },
    select: { email: true },
  });
  if (!user) {
    console.error(`tryDeliverCommand: user ${pendingCmd.employeeId} not found`);
    return false;
  }
  const groupName = user.email.trim().toLowerCase();

  // 3) Send over Web PubSub and mark as published
  await sendToGroup(groupName, {
    id:        pendingCmd.id,
    command:   pendingCmd.command,
    timestamp: pendingCmd.timestamp.toISOString(),
  });

  await prisma.pendingCommand.update({
    where: { id: pendingCmd.id },
    data: {
      published:    true,
      publishedAt:  new Date(),
      attemptCount: { increment: 1 },
    },
  });

  console.log(`Sent to group ${groupName}`);
  return true;
}

/**
 * Fetches all un-acknowledged commands for a given employee, oldest first.
 *
 * @param employeeId UUID of the employee whose commands to retrieve.
 * @returns Array of PendingCommand objects.
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
 * @param ids Array of PendingCommand.id strings to acknowledge.
 * @returns Number of records successfully updated.
 */
export async function markCommandsDelivered(ids: string[]): Promise<number> {
  const result = await prisma.pendingCommand.updateMany({
    where: { id: { in: ids } },
    data: {
      acknowledged:   true,
      acknowledgedAt: new Date(),
    },
  });
  return result.count;
}

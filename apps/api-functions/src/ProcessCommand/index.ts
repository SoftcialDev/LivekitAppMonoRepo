import { Context } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { createPendingCommand } from "../shared/services/pendingCommandService";
import { sendToGroup } from "../shared/services/webPubSubService";

/**
 * Payload for the Service Bus message consumed by ProcessCommand.
 */
export interface ProcessCommandMessage {
  command: "START" | "STOP";
  employeeEmail: string;
  timestamp: string;
}

/**
 * Azure Function: ProcessCommand
 *
 * Triggered by Service Bus messages for camera commands.
 *
 * Workflow:
 * 1. Deserialize the Service Bus message into ProcessCommandMessage.
 * 2. Lookup the user by email (no HTTP auth middleware here).
 * 3. Persist a new PendingCommand.
 * 4. Normalize email → groupName and broadcast via Web PubSub.
 * 5. If broadcast succeeds, mark the command as published.
 * 6. Errors just log and leave the command pending.
 *
 * @param context - Azure Functions execution context.
 * @param message - The Service Bus message payload.
 */
export default async function processCommand(
  context: Context,
  message: unknown
): Promise<void> {
  context.log.info("ProcessCommand received:", message);
  const { command, employeeEmail, timestamp } =
    message as ProcessCommandMessage;

  try {
    // 2) Lookup user by email
    const email = employeeEmail.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      context.log.error(`User not found for email: ${email}`);
      return;
    }

    // 3) Persist the command
    const pending = await createPendingCommand(user.id, command, timestamp);

    // 4) Broadcast via Web PubSub
    const groupName = email;
    try {
      await sendToGroup(groupName, {
        id: pending.id,
        command: pending.command,
        timestamp: pending.timestamp,
      });

      // 5) Mark as published
      await prisma.pendingCommand.update({
        where: { id: pending.id },
        data: { published: true, publishedAt: new Date() },
      });
      context.log.info(`Delivered command ${pending.id} to group ${groupName}`);
    } catch (err) {
      context.log.error(
        `Failed to deliver command ${pending.id}; left pending.`,
        err
      );
    }
  } catch (err) {
    context.log.error("Unhandled error in processCommand:", err);
    throw err; // let the runtime retry or DLQ
  }
}

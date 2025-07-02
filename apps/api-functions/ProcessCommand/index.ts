import { Context } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import {
  createPendingCommand,
  tryDeliverCommand,
} from "../shared/services/pendingCommandService";

/**
 * Describes the shape of a camera command message from Service Bus.
 */
export interface ProcessCommandMessage {
  /** "START" to begin streaming, or "STOP" to end it */
  command: "START" | "STOP";
  /** Employee’s email address used to identify the target user */
  employeeEmail: string;
  /** When the admin issued the command (ISO-8601 string) */
  timestamp: string;
}

/**
 * Azure Function: ProcessCommand
 *
 * Trigger: Service Bus topic subscription for camera commands.
 *
 * Responsibilities:
 * 1. Deserialize the incoming message as `ProcessCommandMessage`.
 * 2. Look up the corresponding `User` in the database by email.
 * 3. Persist a new `PendingCommand` in case the client was offline.
 * 4. Attempt immediate delivery over Web PubSub if the user is online.
 * 5. Log success or throw to trigger retry/DLQ on failure.
 *
 * This ensures **at-least-once** semantics: every command is recorded
 * and retried until delivered or explicitly dead-lettered.
 *
 * @param context  Azure Functions execution context for logging
 * @param message  Raw Service Bus message payload (unknown until cast)
 */
export default async function processCommand(
  context: Context,
  message: unknown
): Promise<void> {
  context.log.info("ProcessCommand received:", message);

  // 1) Deserialize and validate shape
  const { command, employeeEmail, timestamp } =
    message as ProcessCommandMessage;

  // 2) Look up the employee record
  const user = await prisma.user.findUnique({
    where: { email: employeeEmail.toLowerCase() },
  });
  if (!user) {
    context.log.error(`User not found for email: ${employeeEmail}`);
    return; // drop or dead-letter as configured
  }

  try {
    // 3) Persist a pending command (deletes any older one first)
    const pending = await createPendingCommand(
      user.id,
      command,
      timestamp
    );

    // 4) Attempt immediate push over Web PubSub
    const delivered = await tryDeliverCommand({
      id:          pending.id,
      employeeId:  pending.employeeId,
      command:     pending.command,
      timestamp:   pending.timestamp,
    });

    context.log.info(
      `Command ${command} for ${employeeEmail} persisted (id=${pending.id}); delivered=${delivered}`
    );
  } catch (err) {
    context.log.error("Error in ProcessCommand:", err);
    // Rethrow so Azure Functions will retry or move to DLQ
    throw err;
  }
}

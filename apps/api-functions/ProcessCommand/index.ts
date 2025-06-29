import { Context } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import {
  createPendingCommand,
  tryDeliverCommand,
} from "../shared/services/pendingCommandService";

/**
 * Payload for messages arriving on the Service Bus queue.
 */
export interface ProcessCommandMessage {
  /** "START" to begin streaming, or "STOP" to end it */
  command: "START" | "STOP";
  /** Employee’s email address to identify the user */
  employeeEmail: string;
  /** ISO‐8601 timestamp when the admin issued the command */
  timestamp: string;
}

/**
 * Azure Function: ProcessCommand
 *
 * Triggered by Service Bus messages containing camera commands.
 *
 * Workflow:
 * 1. Deserialize the incoming message as ProcessCommandMessage.
 * 2. Look up the User by their `employeeEmail`.
 * 3. Persist a new PendingCommand record.
 * 4. Attempt immediate delivery via Web PubSub if the user is online.
 * 5. Log success or let any error bubble up for retry/DLQ.
 *
 * Note: This is a non-HTTP trigger, so we do NOT use `withAuth`.
 *
 * @param context Azure Functions execution context
 * @param message The raw message payload
 */
export default async function processCommand(
  context: Context,
  message: unknown
): Promise<void> {
  context.log.info("ProcessCommand received:", message);

  // Validate shape of the message
  const { command, employeeEmail, timestamp } =
    message as ProcessCommandMessage;

  // 1) Lookup the employee in our database
  console.log(employeeEmail)
  const user = await prisma.user.findUnique({
    where: { email: employeeEmail },
  });
  if (!user) {
    context.log.error(`User not found for email: ${employeeEmail}`);
    return; // drop or DLQ as configured
  }

  try {
    // 2) Persist the pending command
    const pending = await createPendingCommand(
      user.id,
      command,
      timestamp
    );

    // 3) Attempt immediate delivery via Web PubSub
    const delivered = await tryDeliverCommand({
      id: pending.id,
      employeeId: pending.employeeId,
      command: pending.command,
      timestamp: pending.timestamp,
    });

    context.log.info(
      `Command ${command} for ${employeeEmail} persisted (id=${pending.id}); delivered=${delivered}`
    );
  } catch (err) {
    context.log.error("Error in ProcessCommand:", err);
    // Rethrow to trigger retry or DLQ
    throw err;
  }
}

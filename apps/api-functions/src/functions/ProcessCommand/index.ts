import { Context } from "@azure/functions";
import prisma from "../../services/prismaClienService";
import { createPendingCommand, tryDeliverCommand } from "../../services/pendingCommandService";

/**
 * Payload for the Service Bus message consumed by the ProcessCommand function.
 *
 * @public
 */
export interface ProcessCommandMessage {
  /**
   * Administrative command to execute.
   * - `"START"`: begin the employee’s session.
   * - `"STOP"`: end the employee’s session.
   */
  command: "START" | "STOP";

  /**
   * Identifier of the target employee.
   * Can be either their email address or Azure AD object ID.
   */
  employeeEmail: string;

  /**
   * ISO-8601 timestamp indicating when the command was issued.
   */
  timestamp: string;
}

/**
 * Azure Function: ProcessCommand
 *
 * 1. Persists an incoming admin command as “pending” in storage.
 * 2. Attempts immediate delivery if the target user is currently online.
 * 3. (Legacy) Removed updating of the `publishing` flag—no longer part of the schema.
 *
 * If you introduce a replacement field (e.g. `isActive`, `status`), update the user record
 * in the commented block below.
 *
 * @param context - Azure Functions execution context.
 * @param message - The raw message body from Service Bus; should conform to {@link ProcessCommandMessage}.
 * @returns A promise that resolves when processing is complete.
 * @throws Any error during persistence, delivery, or database operations will bubble up
 *        and cause the function to retry or move the message to the dead-letter queue.
 */
export default async function processCommand(
  context: Context,
  message: unknown
): Promise<void> {
  context.log.info("ProcessCommand received:", message);

  // Cast and validate the incoming message
  const { command, employeeEmail, timestamp } = message as ProcessCommandMessage;

  try {
    // 1) Persist the pending command
    const pending = await createPendingCommand(employeeEmail, command, timestamp);

    // 2) Attempt immediate delivery if the user is online
    const delivered = await tryDeliverCommand(pending);

    // 3) Update user status in the database (legacy publishing flag removed)
    // ---------------------------------------------------------------------
    // If you now have a different column (e.g. `isActive` or `status`),
    // uncomment and adapt the code below:
    //
    // const user = await prisma.user.findFirst({
    //   where: {
    //     OR: [
    //       { email: employeeEmail },
    //       { azureAdObjectId: employeeEmail },
    //     ],
    //     deletedAt: null,
    //   },
    // });
    //
    // if (user) {
    //   const newValue = command === "START";
    //   await prisma.user.update({
    //     where: { id: user.id },
    //     data: {
    //       // Replace `newField` with your actual column name:
    //       // newField: newValue,
    //     },
    //   });
    // } else {
    //   context.log.warn(`User not found when updating status: ${employeeEmail}`);
    // }

    context.log.info(
      `Command ${command} persisted; delivered=${delivered}`
    );
  } catch (error: any) {
    context.log.error("Error in ProcessCommand:", error);
    // Throw to allow Azure Functions runtime to handle retries or DLQ
    throw error;
  }
}

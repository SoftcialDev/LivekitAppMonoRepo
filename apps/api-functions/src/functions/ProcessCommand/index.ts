import { Context } from "@azure/functions";
import prisma from "../../services/prismaClienService";
import { createPendingCommand, tryDeliverCommand } from "../../services/pendingCommandService";

/**
 * Processes a Service Bus message containing an admin command.
 *
 * Persists the command as pending, attempts immediate delivery if the user is online,
 * and updates the user's publishing status in the database.
 *
 * @param context - Azure Functions execution context.
 * @param message - Payload with properties:
 *   - command: "START" | "STOP"
 *   - employeeEmail: string
 *   - timestamp: string (ISO timestamp when the command was issued)
 * @returns A promise that resolves when processing is complete.
 * @throws Errors from pending command persistence, delivery attempt, or database updates.
 */
export default async function (context: Context, message: any): Promise<void> {
  context.log.info("ProcessCommand received:", message);
  const { command, employeeEmail, timestamp } = message as {
    command: "START" | "STOP";
    employeeEmail: string;
    timestamp: string;
  };

  try {
    // Persist the pending command
    const pending = await createPendingCommand(employeeEmail, command, timestamp);

    // Attempt immediate delivery if the user is online
    const delivered = await tryDeliverCommand(pending);

    // Update user's publishing status based on the command
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: employeeEmail },
          { azureAdObjectId: employeeEmail }
        ],
        deletedAt: null
      }
    });
    if (user) {
      const publishing = command === "START";
      await prisma.user.update({
        where: { id: user.id },
        data: { publishing }
      });
    } else {
      context.log.warn(`User not found when updating publishing status: ${employeeEmail}`);
    }

    context.log.info(`Command ${command} persisted; delivered=${delivered}`);
  } catch (err) {
    context.log.error("Error in ProcessCommand:", err);
    throw err;
  }
}

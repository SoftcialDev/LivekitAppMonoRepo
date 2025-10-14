import { Context } from "@azure/functions";
import prisma from "../infrastructure/database/PrismaClientService";
import { ContactManagerStatus } from "@prisma/client";
import { CommandMessagingService } from "../infrastructure/messaging/CommandMessagingService";

/**
 * Handles Web PubSub “disconnected” events for Contact Managers.
 *
 * If the disconnected user has a ContactManagerProfile, this will:
 * 1. Update their `status` to `Unavailable` in the database.
 * 2. Broadcast a JSON message to the “employees” group with the new status.
 *
 * Always sets `context.res = { status: 200 }` to prevent retries.
 *
 * @param context - Azure Functions execution context, with 
 *                  `context.bindingData.connectionContext.userId` and 
 *                  WebPubSub event data in `connectionContext`.
 */
export async function handleCmDisconnect(context: Context): Promise<void> {
  const c = context.bindingData.connectionContext as Record<string, any>;
  const phase = (
    (c.eventType ?? "").toLowerCase() ||
    (c.eventName ?? "").toLowerCase()
  ) as string;
  const userId = c.userId as string;

  if (phase === "disconnected") {
    // 1) Check if this user is a Contact Manager
    const profile = await prisma.contactManagerProfile.findUnique({
      where: { userId },
    });

    if (profile) {
      // 2) Mark status = Unavailable
      const updated = await prisma.contactManagerProfile.update({
        where: { userId },
        data: { status: ContactManagerStatus.Unavailable },
      });

      // 3) Notify all Employees in real time
      const messagingService = new CommandMessagingService();
      void messagingService.sendToGroup("cm-status-updates", {
        managerId: updated.userId,
        status:    updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
  }

  // Always return 200 OK
  context.res = { status: 200, body: "OK" };
}

// src/functions/CamaraCommand/index.ts
import { Context } from "@azure/functions";
import { z } from "zod";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest, unauthorized } from "../shared/utils/response";
import { sendAdminCommand } from "../shared/services/busService";
import { sendToGroup } from "../shared/services/webPubSubService";
import type { JwtPayload } from "jsonwebtoken";

const schema = z.object({
  command: z.enum(["START", "STOP"]),
  employeeEmail: z.string().email()
});

/**
 * Azure Function: CamaraCommand
 *
 * **HTTP POST** `/api/CamaraCommand`
 *
 * Allows Admins and Supervisors to start or stop an employee’s camera stream.
 *
 * @logic
 * 1. Authenticate caller via Azure AD (`withAuth`).
 * 2. Authorize only users with `Admin` or `Supervisor` roles.
 * 3. Validate payload `{ command, employeeEmail }`.
 * 4. Verify the target exists and has role `Employee`.
 * 5. Attempt **immediate** broadcast over Web PubSub:
 *    - If it succeeds, respond `{ sentVia: "ws" }`.
 *    - If it fails, catch the error, log a warning, and fall back.
 * 6. On fallback, enqueue the command to Service Bus via `sendAdminCommand()`:
 *    - If enqueue succeeds, respond `{ sentVia: "bus" }`.
 *    - If enqueue fails, return **400 Bad Request**.
 *
 * This ensures low-latency delivery when possible, with durable
 * fallback for reliability.
 *
 * @param ctx Azure Functions execution context.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = ctx.bindings.user as JwtPayload;
    const callerAdId = (claims.oid ?? claims.sub) as string | undefined;
    if (!callerAdId) {
      return unauthorized(ctx, "Cannot determine caller identity");
    }

    // 1️⃣ Load caller record
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: callerAdId }
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, "Caller not found or deleted");
    }
    if (caller.role !== "Admin" && caller.role !== "Supervisor" && caller.role !== "SuperAdmin") {
      return unauthorized(ctx, "Insufficient privileges");
    }

    // 2️⃣ Validate request body
    await withBodyValidation(schema)(ctx, async () => {
      const { command, employeeEmail } = ctx.bindings.validatedBody as {
        command: "START" | "STOP";
        employeeEmail: string;
      };

      // 3️⃣ Verify target user
      const target = await prisma.user.findUnique({
        where: { email: employeeEmail.toLowerCase() }
      });
      if (!target || target.deletedAt || target.role !== "Employee") {
        return badRequest(ctx, "Target user not found or not an Employee");
      }

      const timestamp = new Date().toISOString();

      // 4️⃣ Immediate Web PubSub broadcast (best-effort)
      try {
        await sendToGroup(
          employeeEmail.toLowerCase(),
          { command, employeeEmail, timestamp }
        );
        // 5️⃣ Respond to client indicating WS delivery
        return ok(ctx, {
          message: `Command "${command}" sent to ${employeeEmail} via WebSocket`,
          sentVia: "ws"
        });
      } catch (wsErr) {
        ctx.log.warn("Immediate WS send failed, will fallback to queue:", wsErr);
      }

      // 6️⃣ Fallback: enqueue in Service Bus
      try {
        await sendAdminCommand(command, employeeEmail);
        return ok(ctx, {
          message: `Command "${command}" sent to ${employeeEmail} via Service Bus`,
          sentVia: "bus"
        });
      } catch (busErr: any) {
        ctx.log.error("Failed to enqueue command:", busErr);
        return badRequest(ctx, "Unable to publish command");
      }
    });
  });
});

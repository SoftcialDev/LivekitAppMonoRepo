import { Context } from "@azure/functions";
import { z } from "zod";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest, unauthorized } from "../shared/utils/response";
import { sendAdminCommand } from "../shared/services/busService";
import { JwtPayload } from "jsonwebtoken";

const schema = z.object({
  command: z.enum(["START", "STOP"]),
  employeeEmail: z.string().email()
});

/**
 * Azure Function: CamaraCommand
 *
 * **HTTP POST** `/api/CamaraCommand`
 *
 * Allows users with **Admin** or **Supervisor** role to send a
 * `START` or `STOP` command to an employee’s camera. The target
 * must exist and have the `Employee` role. Enqueues the full
 * `{ command, employeeEmail, timestamp }` payload onto Service Bus.
 *
 * Workflow:
 * 1. Authenticate caller via Azure AD (`withAuth`).
 * 2. Ensure caller has `Admin` or `Supervisor` role.
 * 3. Validate request body `{ command, employeeEmail }`.
 * 4. Verify target user exists and `role === Employee`.
 * 5. Publish the command via `sendAdminCommand`, including the ISO timestamp.
 * 6. Return **200 OK** on success or appropriate error code.
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

    // 1) Verify caller in DB
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: callerAdId }
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, "Caller not found or deleted");
    }
    if (caller.role !== "Admin" && caller.role !== "Supervisor") {
      return unauthorized(ctx, "Insufficient privileges");
    }

    // 2) Validate request body
    await withBodyValidation(schema)(ctx, async () => {
      const { command, employeeEmail } = ctx.bindings.validatedBody as {
        command: "START" | "STOP";
        employeeEmail: string;
      };

      // 3) Verify target exists and is Employee
      const target = await prisma.user.findUnique({
        where: { email: employeeEmail }
      });
      if (!target || target.deletedAt || target.role !== "Employee") {
        return badRequest(ctx, "Target user not found or not an Employee");
      }

      try {
        // 4) Enqueue command with timestamp
        await sendAdminCommand(command, employeeEmail);
        return ok(ctx, { message: `Command "${command}" sent to ${employeeEmail}` });
      } catch (err: any) {
        ctx.log.error("Failed to send admin command:", err);
        return badRequest(ctx, "Unable to publish command");
      }
    });
  });
});

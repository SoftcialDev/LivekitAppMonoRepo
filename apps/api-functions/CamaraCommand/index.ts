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
 * HTTP POST /api/CamaraCommand
 *
 * Allows users with Admin or Supervisor role to send a START or STOP
 * command to an employee’s camera. The target must exist and have the
 * Employee role.
 *
 * Workflow:
 * 1. Authenticate caller via Azure AD (withAuth).
 * 2. Ensure caller has Admin or Supervisor role.
 * 3. Validate request body { command, employeeEmail }.
 * 4. Verify target user exists and role === Employee.
 * 5. Publish the command via Service Bus (sendAdminCommand).
 * 6. Return 200 OK or appropriate error.
 *
 * @param ctx - Azure Function execution context.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = ctx.bindings.user as JwtPayload;
    const azureAdId = (claims.oid ?? claims.sub) as string | undefined;
    if (!azureAdId) {
      unauthorized(ctx, "Cannot determine caller identity");
      return;
    }

    // Verify caller in database
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!caller || caller.deletedAt) {
      unauthorized(ctx, "Caller not found or deleted");
      return;
    }

    // Only Admin or Supervisor can send commands
    if (caller.role !== "Admin" && caller.role !== "Supervisor") {
      unauthorized(ctx, "Insufficient privileges");
      return;
    }

    // Validate request body
    await withBodyValidation(schema)(ctx, async () => {
      const { command, employeeEmail } = ctx.bindings.validatedBody as {
        command: "START" | "STOP";
        employeeEmail: string;
      };

      // Verify target user exists and is Employee
      const target = await prisma.user.findUnique({
        where: { email: employeeEmail }
      });
      if (!target || target.deletedAt || target.role !== "Employee") {
        badRequest(ctx, "Target user not found or not an Employee");
        return;
      }

      try {
        await sendAdminCommand(command, employeeEmail);
        ok(ctx, { message: `Command "${command}" sent to ${employeeEmail}` });
      } catch (err: any) {
        ctx.log.error("Failed to send admin command:", err);
        badRequest(ctx, "Unable to publish command");
      }
    });
  });
});
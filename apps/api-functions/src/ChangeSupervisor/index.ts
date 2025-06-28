import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest, forbidden } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Request body for ChangeSupervisorFunction. */
const schema = z.object({
  /** List of employee emails to reassign */
  userEmails: z.array(z.string().email()).min(1),
  /** Email of the new supervisor */
  newSupervisorEmail: z.string().email(),
});

/**
 * ChangeSupervisorFunction
 *
 * HTTP POST /api/ChangeSupervisor
 *
 * Reassigns one or more employees from their current supervisor a
 * to a new supervisor.
 *
 * Caller must authenticate via Azure AD JWT and have the "Admin" role.
 *
 * Body:
 *   {
 *     userEmails: string[],          // one or more employee emails
 *     newSupervisorEmail: string     // target supervisor's email
 *   }
 *
 * Steps:
 *   1. Validate caller identity and Admin role.
 *   2. Validate request body.
 *   3. Lookup new supervisor in the database and confirm they exist and have role "Supervisor".
 *   4. Update each employee record in the database to set `supervisorId` to the new supervisor's ID.
 *
 * Responses:
 *   200 OK   — `{ updatedCount: number }`
 *   400 Bad  — validation or operation error
 *   401 Unauth — missing/invalid JWT
 *   403 Forbidden — caller not Admin
 */
const changeSupervisor: AzureFunction = withErrorHandler(async (ctx: Context) => {
  const req = ctx.req!;

  // 1. Authenticate and authorize caller
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const callerAdId = (claims.oid || claims.sub) as string;
    if (!callerAdId) {
      return unauthorized(ctx, "Cannot determine caller identity");
    }

    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: callerAdId },
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, "User not found or deleted");
    }
    if (caller.role !== "Admin") {
      return forbidden(ctx, "Only Admin may reassign supervisors");
    }

    // 2. Validate input
    await withBodyValidation(schema)(ctx, async () => {
      const { userEmails, newSupervisorEmail } = ctx.bindings.validatedBody as {
        userEmails: string[];
        newSupervisorEmail: string;
      };

      // 3. Lookup new supervisor
      const supervisor = await prisma.user.findUnique({
        where: { email: newSupervisorEmail },
      });
      if (!supervisor || supervisor.deletedAt) {
        return badRequest(ctx, "Supervisor not found or deleted");
      }
      if (supervisor.role !== "Supervisor") {
        return badRequest(ctx, "Target user is not a Supervisor");
      }

      // 4. Reassign employees
      let updatedCount = 0;
      try {
        const result = await prisma.user.updateMany({
          where: {
            email: { in: userEmails },
            deletedAt: null,
          },
          data: {
            supervisorId: supervisor.id,
          },
        });
        updatedCount = result.count;
      } catch (err: any) {
        ctx.log.error("ChangeSupervisor: DB updateMany error", err);
        return badRequest(ctx, `Failed to reassign employees: ${err.message}`);
      }

      return ok(ctx, { updatedCount });
    });
  });
}, {
  genericMessage: "Internal Server Error in ChangeSupervisor",
  showStackInDev: true,
});

export default changeSupervisor;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { badRequest, forbidden, ok } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * TransferPsos
 *
 * HTTP-triggered Azure Function that reassigns ALL PSOs currently
 * reporting to the caller (who must be a Supervisor) to a new supervisor.
 *
 * @remarks
 * - Secured via JWT bearer auth (withAuth).
 * - Caller must have role = "Supervisor".
 * - Expects JSON body: `{ newSupervisorEmail: string }`.
 * - Finds the caller’s user record, then finds the target supervisor by email.
 * - Updates all Employee users with `supervisorId = caller.id`
 *   to have `supervisorId = newSupervisor.id`.
 * - Returns 200 with `{ movedCount: number }`.
 * - Returns 400 if request body is invalid or target supervisor not found.
 * - Returns 403 if caller is not a Supervisor.
 */
const transferPsosFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    return withAuth(ctx, async () => {
      const claims = (ctx as any).bindings.user as JwtPayload;
      const callerOid = (claims.oid || claims.sub) as string;
      if (!callerOid) {
        return forbidden(ctx, "Unable to determine caller identity");
      }

      // 1) Load caller user
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: callerOid },
      });
      if (!caller || caller.deletedAt) {
        return forbidden(ctx, "Caller not found or deleted");
      }
      if (caller.role !== "Supervisor") {
        return forbidden(ctx, "Only Supervisors may transfer PSOs");
      }

      // 2) Validate request body
      const { newSupervisorEmail } = req.body ?? {};
      if (typeof newSupervisorEmail !== "string" || !newSupervisorEmail) {
        return badRequest(ctx, "Missing or invalid 'newSupervisorEmail' in request body");
      }

      // 3) Find target supervisor
      const newSup = await prisma.user.findUnique({
        where: { email: newSupervisorEmail.toLowerCase() },
      });
      if (!newSup || newSup.deletedAt || newSup.role !== "Supervisor") {
        return badRequest(ctx, "Target supervisor not found or not a Supervisor");
      }

      // 4) Reassign PSOs
      const result = await prisma.user.updateMany({
        where: {
          role: "Employee",
          supervisorId: caller.id,
          deletedAt: null,
        },
        data: { supervisorId: newSup.id },
      });

      return ok(ctx, { movedCount: result.count });
    });
  },
  {
    genericMessage: "Internal Server Error in TransferPsos",
    showStackInDev: true,
  }
);

export default transferPsosFunction;

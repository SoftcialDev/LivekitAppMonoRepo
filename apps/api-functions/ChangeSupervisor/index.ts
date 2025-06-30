import { AzureFunction, Context } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest, forbidden } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import type { JwtPayload } from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/*  📝 Request body validation                                                */
/* -------------------------------------------------------------------------- */
const schema = z.object({
  /** List of employee emails to reassign */
  userEmails: z.array(z.string().email()).min(1),
  /**
   * Email of the new supervisor.
   * Send `null` to remove the current supervisor.
   */
  newSupervisorEmail: z.string().email().nullable(),   // ← no default("")
});

/* -------------------------------------------------------------------------- */
/*  🏗️  ChangeSupervisorFunction                                             */
/* -------------------------------------------------------------------------- */
const changeSupervisor: AzureFunction = withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    /* ---------------------------------------------------------------------- */
    /*  1. Caller validation                                                  */
    /* ---------------------------------------------------------------------- */
    const claims = (ctx as any).bindings.user as JwtPayload;
    const callerAdId = (claims.oid || claims.sub) as string | undefined;
    if (!callerAdId) return unauthorized(ctx, "Cannot determine caller identity");

    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: callerAdId },
    });
    if (!caller || caller.deletedAt)
      return unauthorized(ctx, "User not found or deleted");

    if (caller.role !== "Admin" && caller.role !== "Supervisor")
      return forbidden(ctx, "Only Admins or Supervisors may reassign employees");

    /* ---------------------------------------------------------------------- */
    /*  2. Body validation                                                    */
    /* ---------------------------------------------------------------------- */
    await withBodyValidation(schema)(ctx, async () => {
      const { userEmails, newSupervisorEmail } = ctx.bindings
        .validatedBody as {
        userEmails: string[];
        newSupervisorEmail: string | null;
      };

      ctx.log.info("ChangeSupervisor → userEmails %o", userEmails);
      ctx.log.info(
        "ChangeSupervisor → newSupervisorEmail: %s",
        newSupervisorEmail ?? "(remove)"
      );

      /* -------------------------------------------------------------------- */
      /*  3. Determine supervisorId                                           */
      /* -------------------------------------------------------------------- */
      let supervisorId: string | null;
      if (newSupervisorEmail === null) {
        supervisorId = null; // explicit removal
      } else {
        // newSupervisorEmail must be a valid email here
        const sup = await prisma.user.findUnique({
          where: { email: newSupervisorEmail },
        });
        if (!sup || sup.deletedAt)
          return badRequest(ctx, "Supervisor not found or deleted");
        if (sup.role !== "Supervisor")
          return badRequest(ctx, "Target user is not a Supervisor");
        supervisorId = sup.id;
      }

      /* -------------------------------------------------------------------- */
      /* 4. Perform update inside a transaction                               */
      /* -------------------------------------------------------------------- */
      try {
        const [updateRes, stillWithSupervisorAfter] = await prisma.$transaction([
          prisma.user.updateMany({
            where: { email: { in: userEmails }, deletedAt: null },
            data: { supervisorId },
          }),
          prisma.user.count({
            where: { supervisorId: { not: null }, deletedAt: null },
          }),
        ]);

        ctx.log.info(
          "ChangeSupervisor → updateMany count: %d",
          updateRes.count
        );

        // Defensive: row-count mismatch → rollback by throwing
        if (updateRes.count !== userEmails.length) {
          throw new Error(
            `Row mismatch – expected ${userEmails.length}, got ${updateRes.count}`
          );
        }

        ctx.log.info(
          "ChangeSupervisor → employees still WITH supervisor: %d",
          stillWithSupervisorAfter
        );

        return ok(ctx, { updatedCount: updateRes.count });
      } catch (err: any) {
        ctx.log.error("ChangeSupervisor → transaction error", err);
        return badRequest(ctx, `Failed to reassign employees: ${err.message}`);
      }
    });
  });
}, {
  genericMessage: "Internal Server Error in ChangeSupervisor",
  showStackInDev: true,
});

export default changeSupervisor;

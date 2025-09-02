import { AzureFunction, Context } from "@azure/functions";
import { z } from "zod";
import { randomUUID } from "crypto";

import { withAuth }          from "../shared/middleware/auth";
import { withErrorHandler }  from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import {
  ok, unauthorized, badRequest, forbidden,
} from "../shared/utils/response";

import {
  getUserByAzureOid,
  getUserByEmail,
  upsertUserRole,
  findOrCreateAdmin,
} from "../shared/services/userService";
import type { JwtPayload } from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/*  ChangeSupervisorFunction .                                                */
/* -------------------------------------------------------------------------- */

const changeSupervisor: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
      /* ───────────────── 1. Resolve caller ───────────────────────────── */
      const claims = (ctx as any).bindings.user as JwtPayload;
      const oid   = claims.oid || claims.sub;
      const upn   = (claims.preferred_username ?? claims.email) as string | undefined;
      const name  = (claims.name ?? upn ?? "Unknown") as string;

      if (!oid) return unauthorized(ctx, "Missing OID in token");

      // Ensure caller exists in DB (auto-create Admin if absent)
      const caller =
        (await getUserByAzureOid(oid)) ??
        (upn && (await getUserByEmail(upn))) ??
        (await findOrCreateAdmin(oid, upn ?? `${oid}@tenant`, name));

      if (!caller || caller.deletedAt)         return unauthorized(ctx, "Caller not found");
      if (caller.role !== "Admin" && caller.role !== "Supervisor" && caller.role !== "SuperAdmin") {
        return forbidden(ctx, "Caller must be Admin or Supervisor");
      }

      /* ───────────────── 2. Validate body ────────────────────────────── */
      const schema = z.object({
        userEmails:          z.array(z.string().email()).min(1),
        newSupervisorEmail:  z.string().email().nullable(),
      });

      await withBodyValidation(schema)(ctx, async () => {
        const {
          userEmails:        raw,
          newSupervisorEmail,
        } = ctx.bindings.validatedBody as {
          userEmails: string[];
          newSupervisorEmail: string | null;
        };

        const userEmails = raw.map(e => e.toLowerCase());
        const supEmail   = newSupervisorEmail?.toLowerCase() ?? null;

        /* ─────────────── 3. Resolve supervisorId (or null) ───────────── */
        let supervisorId: string | null = null;
        if (supEmail) {
          const sup = await getUserByEmail(supEmail);
          if (!sup || sup.deletedAt)             return badRequest(ctx, "Supervisor not found");
          if (sup.role !== "Supervisor")         return badRequest(ctx, "Target is not a Supervisor");
          supervisorId = sup.id;
        }

        /* ─────────────── 4. Upsert ONLY the target employees ─────────── */
        let updatedCount = 0;

        for (const email of userEmails) {
          const existing = await getUserByEmail(email);

          // If user already exists *with* a non-Employee role, skip.
          if (existing && existing.role && existing.role !== "Employee") {
            ctx.log.warn(`Skipping ${email} (role = ${existing.role})`);
            continue;
          }

          // Choose a safe OID when we must create a brand-new tenant user
          const oidForCreate =
            existing?.azureAdObjectId ?? randomUUID();   // unique every time

          await upsertUserRole(
            email,
            oidForCreate,
            existing?.fullName ?? email,   // placeholder name if none
            "Employee",
            supervisorId                   // defined ⇒ set / clear link
          );

          updatedCount += 1;
        }

        /* ─────────────── 5. Done ─────────────────────────────────────── */
        ctx.log.info(`ChangeSupervisor → updated ${updatedCount} row(s).`);
        return ok(ctx, { updatedCount });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in ChangeSupervisor",
    showStackInDev: true,
  }
);

export default changeSupervisor;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { getUserByAzureOid } from "../shared/services/userService";
import type { JwtPayload } from "jsonwebtoken";

/**
 * GET /api/MyPsos
 *
 * Returns the canonical, lower‐cased email addresses of the PSOs
 * that the calling user is allowed to see.
 *
 * - If caller is Admin → returns every Employee’s email.
 * - If caller is Supervisor → returns only those users whose
 *   `supervisorId` matches the caller’s User.id.
 *
 * Response JSON shape:
 * ```json
 * {
 *   "psos": [
 *     "alice@example.com",
 *     "bob@example.com",
 *     …
 *   ]
 * }
 * ```
 */
const GetPsosBySupervisor: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    return withAuth(ctx, async () => {
      const claims = (ctx as any).bindings.user as JwtPayload;
      const oid    = claims.oid || claims.sub;
      if (!oid) {
        return unauthorized(ctx, "Cannot determine caller OID");
      }

      // 1) Lookup our User record
      const caller = await getUserByAzureOid(oid as string);
      if (!caller) {
        return unauthorized(ctx, "User not found in application database");
      }

      let psos: string[];

      if (caller.role === "Admin") {
        // Admin sees all Employees
        const employees = await prisma.user.findMany({
          where: { role: "Employee", deletedAt: null },
          select: { email: true },
        });
        psos = employees.map(e => e.email);
      } else if (caller.role === "Supervisor") {
        // Supervisor sees only their own
        const myTeam = await prisma.user.findMany({
          where: {
            supervisorId: caller.id,
            role:         "Employee",
            deletedAt:    null,
          },
          select: { email: true },
        });
        psos = myTeam.map(e => e.email);
      } else {
        return unauthorized(ctx, "Insufficient privileges");
      }

      // Always lower-case for canonical lookups
      psos = psos.map(e => e.toLowerCase());
      return ok(ctx, { psos });
    });
  }
);

export default GetPsosBySupervisor;

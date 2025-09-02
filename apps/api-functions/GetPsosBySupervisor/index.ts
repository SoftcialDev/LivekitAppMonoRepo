import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { getUserByAzureOid } from "../shared/services/userService";
import type { JwtPayload } from "jsonwebtoken";

export interface PsoWithSupervisor {
  /** The PSO’s email address, always lower‑cased */
  email: string;
  /** The full name of this PSO’s supervisor (e.g. "Ana Gómez") */
  supervisorName: string;
}

/**
 * GET /api/GetPsosBySupervisor
 *
 * Returns the list of PSOs (employees) the caller is allowed to see,
 * each with their supervisor’s full name.
 *
 * Behavior:
 * - If caller.role === "Admin":
 *   • returns every Employee’s email + that employee’s supervisor fullName.
 * - If caller.role === "Supervisor":
 *   • returns only those Employees whose supervisorId === caller.id,
 *     and each entry carries the caller’s own fullName as supervisorName.
 *
 * Response JSON:
 * ```json
 * {
 *   "psos": [
 *     { "email": "alice@example.com", "supervisorName": "Carlos Pérez" },
 *     { "email": "bob@example.com",   "supervisorName": "María Rodrí­guez" }
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

      // 1) Lookup caller in our Users table
      const caller = await getUserByAzureOid(oid as string);
      if (!caller) {
        return unauthorized(ctx, "User not found in application database");
      }

      // 2) Build base filter for Employees only
      const baseWhere: Record<string, any> = {
        role:      "Employee",
        deletedAt: null,
      };

      // 3) If Supervisor, restrict to their team
      if (caller.role === "Supervisor") {
        baseWhere.supervisorId = caller.id;
      } else if (caller.role !== "Admin" && caller.role !== "SuperAdmin") {
        return unauthorized(ctx, "Insufficient privileges");
      }

      // 4) Fetch matching Users plus their supervisor’s fullName
      const employees = await prisma.user.findMany({
        where: baseWhere,
        select: {
          email:      true,
          supervisor: {
            select: { fullName: true }
          }
        }
      });

      // 5) Map to DTO shape
      const psos: PsoWithSupervisor[] = employees.map(e => ({
        email: e.email.toLowerCase(),
        supervisorName: e.supervisor
          ? e.supervisor.fullName
          : ""
      }));

      return ok(ctx, { psos });
    });
  }
);

export default GetPsosBySupervisor;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, forbidden } from "../shared/utils/response";
import { listSuperAdmins } from "../shared/services/SuperAdminService";
import prisma from "../shared/services/prismaClienService";

/**
 * GET /api/superAdmins
 *
 * Only users with the `SuperAdmin` role in your database may list other Super Admins.
 *
 * @remarks
 * 1. Validates the caller’s AAD token via {@link withAuth}.
 * 2. Extracts the caller’s Azure AD Object ID (OID) from token claims.
 * 3. Looks up the caller in the local database via Prisma.
 * 4. Ensures the caller’s role is `SuperAdmin`.
 * 5. Fetches and returns all users with the SuperAdmin role.
 *
 * @param ctx - Azure Functions execution context (includes `ctx.bindings.user` with token claims).
 * @param req - The incoming HTTP request.
 * @returns 200 OK with `{ superAdmins: SuperAdminDto[] }` or 403 Forbidden.
 */
const getAllSuperAdmins: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1. Extract OID from the token claims
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid = claims.oid || claims.sub;
      if (!oid) {
        // Shouldn’t happen, withAuth would already reject, but guard anyway
        return forbidden(ctx, "Cannot determine caller identity");
      }

      // 2. Look up the user in your database to get their role
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: oid },
      });
      if (!caller) {
        return forbidden(ctx, "Caller not found in database");
      }

      // 3. Only SuperAdmins may list
      if (caller.role !== "SuperAdmin") {
        return forbidden(ctx, "Only SuperAdmins may list Super Admin users");
      }

      // 4. Fetch and return
      const items = await listSuperAdmins();
      return ok(ctx, { superAdmins: items });
    });
  },
  { genericMessage: "Failed to fetch Super Admins" }
);

export default getAllSuperAdmins;

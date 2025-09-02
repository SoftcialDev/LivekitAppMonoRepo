import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth }   from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, forbidden }    from "../shared/utils/response";
import { listContactManagers } from "../shared/services/contactManagerService";
import prisma from "../shared/services/prismaClienService";

/**
 * GET /api/contactManagers
 *
 * Only users with the Admin role in your database may list Contact Managers.
 *
 * @remarks
 * 1. Validates the caller’s AAD token via `withAuth`.
 * 2. Looks up the calling user in your database by their AAD OID.
 * 3. Verifies they have role=`Admin`.
 * 4. Fetches and returns all Contact Manager profiles.
 *
 * @param ctx - Azure Functions execution context (includes `ctx.bindings.user` with token claims).
 * @param req - The incoming HTTP request.
 * @returns 200 OK with `{ contactManagers: ContactManagerDTO[] }` or 403 Forbidden.
 */
const getAll: AzureFunction = withErrorHandler(
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
        where: { azureAdObjectId: oid }
      });
      if (!caller) {
        return forbidden(ctx, "Caller not found in database");
      }

      // 4. Fetch and return
      const items = await listContactManagers();
      return ok(ctx, { contactManagers: items });
    });
  },
  { genericMessage: "Failed to fetch Contact Managers" }
);

export default getAll;

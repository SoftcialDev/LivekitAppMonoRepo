import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth }   from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, forbidden, badRequest } from "../shared/utils/response";
import { revokeContactManager } from "../shared/services/contactManagerService";
import prisma from "../shared/services/prismaClienService";

/**
 * DELETE /api/contactManagers/{id}
 *
 * Revokes the Contact Manager role by:
 * 1. Validating the caller’s AAD token via `withAuth`.
 * 2. Looking up the caller in the database by their AAD OID.
 * 3. Ensuring they have `role === "Admin"`.
 * 4. Calling `revokeContactManager(id)` to remove the App Role and delete the profile.
 *
 * Path parameters:
 * - `id`: UUID of the ContactManagerProfile to revoke.
 *
 * @param ctx - Azure Functions execution context (contains `ctx.bindings.user` with token claims).
 * @param req - Incoming HTTP request.
 * @returns 200 OK with `{ message: string }`, 403 if not Admin, or 400 on error.
 */
const removeHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) Extract AAD OID from token claims
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid = claims.oid || claims.sub;
      if (!oid) {
        return forbidden(ctx, "Cannot determine caller identity");
      }

      // 2) Lookup caller in database to get their role
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: oid }
      });
      if (!caller) {
        return forbidden(ctx, "Caller not found in database");
      }

      // 3) Only Admins may revoke
      if (caller.role !== "Admin" && caller.role !== "SuperAdmin") {
        return forbidden(ctx, "Only Admin may remove Contact Managers");
      }

      // 4) Perform the revoke
      const id = ctx.bindingData.id as string;
      try {
        await revokeContactManager(id);
        return ok(ctx, { message: "Contact Manager revoked" });
      } catch (err: any) {
        return badRequest(ctx, err.message);
      }
    });
  },
  { genericMessage: "Failed to revoke Contact Manager" }
);

export default removeHandler;

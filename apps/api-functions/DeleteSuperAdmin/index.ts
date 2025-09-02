import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, forbidden, badRequest } from "../shared/utils/response";
import { revokeSuperAdmin } from "../shared/services/SuperAdminService";
import prisma from "../shared/services/prismaClienService";

/**
 * HTTP DELETE `/api/superAdmins/{id}`
 *
 * Revokes the **SuperAdmin** role from a user.
 *
 * Execution flow:
 * 1. Validate the caller’s AAD token using `withAuth`.
 * 2. Retrieve the caller from the database by their AAD OID.
 * 3. Verify that the caller has `role === "SuperAdmin"`.
 * 4. Call `revokeSuperAdmin(id)` to remove the role / downgrade the user.
 *
 * @param ctx - Azure Functions execution context (bindings, loggers, etc.).
 * @param req - Incoming HTTP request object.
 *
 * @pathParam id - UUID of the user (or profile) whose SuperAdmin role will be revoked.
 *
 * @returns
 * - **200 OK** → `{ message: string }` when revocation succeeds.
 * - **403 Forbidden** → if the caller is not a SuperAdmin or unauthorized.
 * - **400 Bad Request** → if a service error occurs during the operation.
 *
 * @remarks
 * This handler is wrapped by `withErrorHandler` to catch unhandled errors
 * and return a generic message `"Failed to revoke SuperAdmin"` if needed.
 */
const removeHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) Extract AAD OID from token
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid = claims.oid || claims.sub;
      if (!oid) {
        return forbidden(ctx, "Cannot determine caller identity");
      }

      // 2) Lookup caller in database and confirm role
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: oid }
      });
      if (!caller) {
        return forbidden(ctx, "Caller not found in database");
      }

      // 3) Only SuperAdmins may revoke SuperAdmins
      if (caller.role !== "SuperAdmin") {
        return forbidden(ctx, "Only SuperAdmin may remove SuperAdmins");
      }

      // 4) Revoke target user’s SuperAdmin role
      const id = ctx.bindingData.id as string;
      try {
        await revokeSuperAdmin(id);
        return ok(ctx, { message: "SuperAdmin revoked" });
      } catch (err: any) {
        return badRequest(ctx, err.message);
      }
    });
  },
  { genericMessage: "Failed to revoke SuperAdmin" }
);

export default removeHandler;

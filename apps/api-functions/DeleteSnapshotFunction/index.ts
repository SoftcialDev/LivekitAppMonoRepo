import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth }         from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import prisma               from "../shared/services/prismaClienService";
// import { blobService }    from "../shared/services/blobStorageService"; // optional

/**
 * HTTP DELETE /api/snapshots/{id}
 *
 * Deletes a single snapshot report by its ID.
 * Only users with the "Admin" role may call this endpoint.
 *
 * @remarks
 * 1. Authenticates the caller via JWT (On-Behalf-Of).  
 * 2. Looks up the calling user by Azure AD Object ID.  
 * 3. Verifies the caller’s role is "Admin"; otherwise returns 401.  
 * 4. Validates the `id` route parameter and looks up the snapshot.  
 * 5. (Optional) Deletes the underlying blob from storage.  
 * 6. Deletes the snapshot record from PostgreSQL.  
 * 7. Returns `{ deletedId: string }` on success.
 *
 * @param ctx - The Azure Functions execution context.
 * @param req - The incoming HTTP request.
 * @returns A 200 OK response with `{ deletedId }`, or 401/400 on error.
 */
const deleteSnapshotFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) Identify caller
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid    = claims.oid || claims.sub;
      if (!oid) {
        return unauthorized(ctx, "Missing OID in token");
      }

      // 2) Load user record
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: oid }
      });
      if (!caller) {
        return unauthorized(ctx, "User not found");
      }

      // 3) Enforce Admin role
      if (caller.role !== "Admin" && caller.role !== "SuperAdmin") {
        return unauthorized(ctx, "Admins only");
      }

      // 4) Validate route parameter
      const id = ctx.bindingData.id as string;
      if (!id) {
        return badRequest(ctx, "Missing snapshot ID");
      }

      // 5) Lookup snapshot record
      const snap = await prisma.snapshot.findUnique({ where: { id } });
      if (!snap) {
        return badRequest(ctx, "Snapshot not found");
      }

      // 6) Optionally delete blob
      // await blobService.deleteSnapshot(snap.imageUrl);

      // 7) Remove DB record
      await prisma.snapshot.delete({ where: { id } });

      return ok(ctx, { deletedId: id });
    });
  },
  {
    genericMessage: "Internal error deleting snapshot",
    showStackInDev: true
  }
);

export default deleteSnapshotFunction;

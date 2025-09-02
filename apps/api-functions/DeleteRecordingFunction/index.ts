import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, forbidden, notFound } from "../shared/utils/response";
import { LiveKitRecordingService } from "../shared/services/livekitRecordingService";
import { UserRepository } from "../shared/repositories/userRepo";

/**
 * Azure Function HTTP trigger to delete a recording by id.
 *
 * @route DELETE /api/recordings/{id}
 *
 * Security:
 * - Caller must be authenticated via `withAuth`.
 * - Only users with role Admin or Supervisor are authorized.
 *
 * Behavior:
 * - Deletes the blob from Azure Blob Storage (when path can be determined).
 * - Deletes the DB row for the session.
 * - Returns a summary indicating blob and DB deletion outcome.
 */
const deleteRecordingFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid = claims.oid || claims.sub;
      if (!oid) return forbidden(ctx, "Cannot determine caller identity");

      const caller = await UserRepository.findByAzureAdOid(oid);
      if (!caller) return forbidden(ctx, "Caller not found in database");
      if (!["SuperAdmin"].includes((caller as any).role as string)) {
        return forbidden(ctx, "Insufficient permissions");
      }

      const id = req.params?.id;
      if (!id) return badRequest(ctx, "Missing recording id in route");

      try {
        const result = await LiveKitRecordingService.deleteRecordingById(id);
        return ok(ctx, {
          message: "Recording deleted",
          ...result,
        });
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("not found")) {
          return notFound(ctx, "Recording session not found");
        }
        throw err;
      }
    });
  },
  { genericMessage: "Error deleting recording", showStackInDev: true }
);

export default deleteRecordingFunction;

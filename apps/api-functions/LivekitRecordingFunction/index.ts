import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest, forbidden } from "../shared/utils/response";
import { LiveKitRecordingService } from "../shared/services/livekitRecordingService";
import { UserRepository } from "../shared/repositories/userRepo";

/**
 * Zod schema for the recording command payload.
 *
 * Expected request body:
 * ```json
 * { "command": "start" | "stop", "roomName": "string" }
 * ```
 */
const RecordingCommandSchema = z.object({
  command: z.enum(["start", "stop"]),
  roomName: z.string().min(1),
});

/**
 * Azure Function HTTP trigger for LiveKit Room Composite recording control.
 *
 * @route POST /api/livekit/recording
 *
 * Security:
 * - Caller must be authenticated via `withAuth`.
 * - Only users with role Admin or Supervisor are authorized.
 *
 * Behavior:
 * - Owner resolution: determines the subject by matching `roomName` against `user.id`
 *   or `user.azureAdObjectId`. If not found, falls back to the caller.
 * - On `start`: calls `LiveKitRecordingService.startAndPersist(...)`.
 * - On `stop`: calls `LiveKitRecordingService.stopAndPersist(...)`.
 */
const liveKitRecordingFunction: AzureFunction = withErrorHandler(
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

      await withBodyValidation(RecordingCommandSchema)(ctx, async () => {
        const { command, roomName } = (ctx as any).bindings
          .validatedBody as z.infer<typeof RecordingCommandSchema>;

        const subject =
          (await UserRepository.findByIdOrOid(roomName)) || caller;

        const subjectLabel =
          (subject as any).username ||
          (subject as any).name ||
          (subject as any).fullName ||
          subject.email ||
          subject.id;

        if (command === "start") {
          const result = await LiveKitRecordingService.startAndPersist({
            roomName,
            subjectLabel,
            initiatorUserId: caller.id,
            subjectUserId: subject.id,
          });

          return ok(ctx, {
            message: `Recording started for room "${roomName}".`,
            roomName: result.roomName,
            egressId: result.egressId,
            blobPath: result.blobPath,
          });
        }

        if (command === "stop") {
          try {
            const summary = await LiveKitRecordingService.stopAndPersist({
              roomName,
              initiatorUserId: caller.id,
              sasMinutes: 60,
            });
            return ok(ctx, summary);
          } catch (err: any) {
            if (String(err?.message || "").includes("No active recordings")) {
              return badRequest(ctx, "No active recordings found for this room/user");
            }
            throw err;
          }
        }
      });
    });
  },
  { genericMessage: "Error processing LiveKit recording request", showStackInDev: true }
);

export default liveKitRecordingFunction;

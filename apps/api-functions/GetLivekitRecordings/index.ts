import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, forbidden } from "../shared/utils/response";
import { LiveKitRecordingService } from "../shared/services/livekitRecordingService";
import { UserRepository } from "../shared/repositories/userRepo";

/**
 * Zod schema for query parameters to list recordings.
 *
 * Supported querystring:
 * - roomName?: string
 * - limit?: number (default 50, max 200)
 * - order?: "asc" | "desc" (default "desc")
 * - includeSas?: boolean (default true)
 * - sasMinutes?: number (default 60, min 1)
 */
const ListRecordingsQuerySchema = z.object({
  roomName: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  order: z.enum(["asc", "desc"]).default("desc"),
  includeSas: z.coerce.boolean().default(true),
  sasMinutes: z.coerce.number().int().positive().default(60),
});

/**
 * Azure Function HTTP trigger for listing LiveKit recording sessions.
 *
 * @route GET /api/recordings
 *
 * Security:
 * - Caller must be authenticated via `withAuth`.
 * - Only users with role Admin or Supervisor are authorized.
 *
 * Behavior:
 * - Validates query parameters using Zod.
 * - Delegates to `LiveKitRecordingService.listRecordings` to build UI-ready items.
 * - Returns `{ items, count }`.
 *
 * Responses:
 * - 200 OK with items and count.
 * - 403 Forbidden when the caller is not found or lacks permissions.
 * - 400 Bad Request when query parameters are invalid.
 */
const listRecordingsFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid = claims.oid || claims.sub;
      if (!oid) return forbidden(ctx, "Cannot determine caller identity");

      const caller = await UserRepository.findByAzureAdOid(oid);
      if (!caller) return forbidden(ctx, "Caller not found in database");
      if (!["Admin", "SuperAdmin"].includes((caller as any).role as string)) {
        return forbidden(ctx, "Insufficient permissions");
      }

      const parsed = ListRecordingsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const issues = parsed.error.issues.map(i => i.path.join(".") + ": " + i.message);
        return badRequest(ctx, `Invalid query: ${issues.join(", ")}`);
      }

      const { roomName, limit, order, includeSas, sasMinutes } = parsed.data;

      const items = await LiveKitRecordingService.listRecordings({
        roomName,
        limit,
        order,
        includeSas,
        sasMinutes,
      });

      return ok(ctx, { items, count: items.length });
    });
  },
  { genericMessage: "Error listing recordings", showStackInDev: true }
);

export default listRecordingsFunction;

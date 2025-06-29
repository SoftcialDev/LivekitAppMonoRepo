import { Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest, unauthorized } from "../shared/utils/response";
import { startStreamingSession, stopStreamingSession } from "../shared/services/streamingService";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Schema for validating the body of a streaming session update request.
 *
 * @remarks
 * The request body must be a JSON object with a single property `status`,
 * whose value is either `"started"` or `"stopped"`.
 */
const schema = z.object({
  /** Indicates whether to start or stop the streaming session. */
  status: z.enum(["started", "stopped"])
});

/**
 * HTTP-triggered Azure Function that updates the streaming session for the authenticated user.
 *
 * - **Endpoint:** POST `/api/StreamingSessionUpdate`
 * - **Authentication:** Azure AD JWT
 * - **Request Body:** `{ status: "started" | "stopped" }`
 * - **Behavior:**
 *   1. Validates the JWT and parses the user’s Azure AD Object ID.
 *   2. Validates the request body against the `schema`.
 *   3. Looks up the user in the database by `azureAdObjectId`.
 *   4. Calls `startStreamingSession(user.id)` if `status === "started"`.
 *      Otherwise calls `stopStreamingSession(user.id)`.
 *   5. Returns a 200 OK response with a confirmation message.
 *
 * @param ctx - The Azure Functions execution context.
 * @param ctx.req - The incoming HTTP request.
 * @throws 401 Unauthorized if the user's identity cannot be determined or the user record is missing/deleted.
 * @throws 400 Bad Request if the streaming service call fails.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;

  await withAuth(ctx, async () => {
    await withBodyValidation(schema)(ctx, async () => {
      const { status } = (ctx as any).bindings.validatedBody as { status: "started" | "stopped" };

      const claims = (ctx as any).bindings.user as JwtPayload;
      const azureAdId = (claims.oid || claims.sub) as string;
      if (!azureAdId) {
        unauthorized(ctx, "Cannot determine user identity");
        return;
      }

      // Find user by Azure AD object ID
      const user = await prisma.user.findUnique({
        where: { azureAdObjectId: azureAdId }
      });
      if (!user || user.deletedAt) {
        unauthorized(ctx, "User not found or deleted");
        return;
      }

      try {
        if (status === "started") {
          await startStreamingSession(user.id);
          ok(ctx, { message: "Streaming session started" });
        } else {
          await stopStreamingSession(user.id);
          ok(ctx, { message: "Streaming session stopped" });
        }
      } catch (err: any) {
        ctx.log.error("StreamingSessionUpdate error:", err);
        badRequest(ctx, `Failed to update streaming session: ${err.message}`);
      }
    });
  });
});

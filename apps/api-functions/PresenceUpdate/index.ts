import { Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest, unauthorized } from "../shared/utils/response";
import { setUserOnline, setUserOffline } from "../shared/services/presenceService";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Zod schema for PresenceUpdate request.
 *
 * @remarks
 * Body must be `{ status: "online" | "offline" }`.
 */
const schema = z.object({
  status: z.enum(["online", "offline"])
});

/**
 * PresenceUpdateFunction
 *
 * HTTP POST /api/PresenceUpdate,
 *
 * Authenticates via Azure AD JWT.
 * Body must include `{ status: "online" | "offline" }`.
 * Determines the user by Azure AD object ID from token,
 * then calls presenceService.setUserOnline or setUserOffline.
 *
 * @param ctx - Azure Functions execution context containing HTTP request.
 * @returns Promise<void> - 200 OK on success, or appropriate 4xx/5xx on error.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;
  await withAuth(ctx, async () => {
    await withBodyValidation(schema)(ctx, async () => {
      const { status } = (ctx as any).bindings.validatedBody as { status: "online" | "offline" };

      const claims = (ctx as any).bindings.user as JwtPayload;
      const azureAdId = (claims.oid || claims.sub) as string;
      if (!azureAdId) {
        unauthorized(ctx, "Cannot determine user identity");
        return;
      }
      const user = await prisma.user.findUnique({
        where: { azureAdObjectId: azureAdId }
      });
      if (!user || user.deletedAt) {
        unauthorized(ctx, "User not found or deleted");
        return;
      }

      try {
        if (status === "online") {
          await setUserOnline(azureAdId);
          ok(ctx, { message: "Presence set to online" });
        } else {
          await setUserOffline(azureAdId);
          ok(ctx, { message: "Presence set to offline" });
        }
      } catch (err: any) {
        ctx.log.error("PresenceUpdate error:", err);
        badRequest(ctx, `Failed to update presence: ${err.message}`);
      }
    });
  });
});

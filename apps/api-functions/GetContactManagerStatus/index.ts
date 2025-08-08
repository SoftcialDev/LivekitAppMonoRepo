import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, forbidden, notFound } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { getMyContactManagerProfile, ContactManagerProfileDto } from "../shared/services/contactManagerService";
import { getUserByAzureOid } from "../shared/services/userService";
import type { JwtPayload } from "jsonwebtoken";

/**
 * HTTP-triggered Azure Function to fetch the current user’s Contact Manager status.
 *
 * @remarks
 * - Caller must first be authenticated, then looked up in the Users table.
 * - Only users whose `role === "ContactManager"` in your DB may call.
 * - Returns:
 *    - 200 + profile DTO on success,
 *    - 403 if caller isn’t a Contact Manager,
 *    - 404 if no profile exists for them,
 *    - 405 for non-GET methods.
 */
const getMyStatusFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    // 1) Only GET allowed
    if (req.method !== "GET") {
      ctx.res = { status: 405, body: { error: "Method Not Allowed" } };
      return;
    }

    // 2) Authenticate
    await withAuth(ctx, async () => {
      const claims = ctx.bindings.user as JwtPayload;
      const azureAdOid = (claims.oid ?? claims.sub) as string | undefined;
      if (!azureAdOid) {
        // Shouldn’t happen if withAuth enforced properly
        return forbidden(ctx, "Unable to determine caller identity");
      }

      // 3) Lookup user in your DB
      const caller = await getUserByAzureOid(azureAdOid);
      if (!caller) {
        return forbidden(ctx, "User not found in application database");
      }

      // 4) Check role in your DB
      if (caller.role !== "ContactManager") {
        return forbidden(
          ctx,
          `Access denied: user role is "${caller.role}", must be ContactManager`
        );
      }

      // 5) Fetch their ContactManagerProfile
      try {
        const profile: ContactManagerProfileDto =
          await getMyContactManagerProfile(azureAdOid);
        return ok(ctx, profile);
      } catch (err: any) {
        return notFound(ctx, err.message);
      }
    });
  },
  {
    genericMessage: "Internal error fetching Contact Manager status",
    showStackInDev: true,
  }
);

export default getMyStatusFunction;

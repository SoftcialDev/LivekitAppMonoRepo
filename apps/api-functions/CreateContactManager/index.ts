import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth }   from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, forbidden, badRequest } from "../shared/utils/response";
import { addContactManager } from "../shared/services/contactManagerService";
import prisma from "../shared/services/prismaClienService";

/**
 * Request schema for creating a Contact Manager profile.
 */
const schema = z.object({
  /** The user's email to promote */
  email:  z.string().email(),
  /** Initial status for the new Contact Manager */
  status: z.enum(["Available","Unavailable","OnBreak","OnAnotherTask"]),
});

/**
 * POST /api/contactManagers
 *
 * Promotes an existing user to ContactManager by:
 * 1. Validating the caller’s AAD token.
 * 2. Looking up the caller in the database to verify `role==="Admin"`.
 * 3. Validating the request body.
 * 4. Calling `addContactManager(email, status)` to assign the AppRole and upsert the profile.
 *
 * Body:
 *   `{ email: "user@example.com", status: "Available" }`
 *
 * Response:
 *   `{ id: "<new‑profile‑uuid>" }`
 *
 * Errors:
 *   - 403 Forbidden if caller is not Admin.
 *   - 400 Bad Request if validation or service errors occur.
 */
const create: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) Extract AAD OID from token claims
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid = claims.oid || claims.sub;
      if (!oid) {
        return forbidden(ctx, "Cannot determine caller identity");
      }

      // 2) Lookup caller in DB to confirm Admin role
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: oid }
      });
      if (!caller) {
        return forbidden(ctx, "Caller not found");
      }
      if (caller.role !== "Admin" && caller.role !== "SuperAdmin") {
        return forbidden(ctx, "Only Admin may add Contact Managers");
      }

      // 3) Body validation
      await withBodyValidation(schema)(ctx, async () => {
        const { email, status } = ctx.bindings.validatedBody as z.infer<typeof schema>;
        try {
          // 4) Promote to Contact Manager
          const profile = await addContactManager(email.toLowerCase(), status);
          return ok(ctx, { id: profile.id });
        } catch (err: any) {
          return badRequest(ctx, err.message);
        }
      });
    });
  },
  { genericMessage: "Failed to add Contact Manager" }
);

export default create;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, forbidden, badRequest } from "../shared/utils/response";
import { addSuperAdmin } from "../shared/services/SuperAdminService";

/**
 * Request schema for creating a SuperAdmin profile.
 */
const schema = z.object({
  /** The user's email to promote */
  email: z.string().email(),
});

/**
 * POST /api/superAdmins
 *
 * Promotes a user to SuperAdmin. If the user does not exist in the local DB,
 * it is created from Microsoft Graph data. The handler delegates to
 * `addSuperAdmin(email)`, which:
 *  - Ensures the user exists locally (create if needed from Graph).
 *  - Clears existing AppRole assignments for THIS app's Service Principal.
 *  - Assigns the SuperAdmin App Role in Azure AD.
 *  - Updates the local role to SuperAdmin.
 *
 * Body:
 *   { "email": "user@example.com" }
 *
 * Response:
 *   { "id": "<user-uuid>" }
 *
 * Errors:
 *   - 403 Forbidden if caller is not SuperAdmin.
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

      const prisma = (await import("../shared/services/prismaClienService")).default;
      const caller = await prisma.user.findUnique({ where: { azureAdObjectId: oid } });
      if (!caller) return forbidden(ctx, "Caller not found");
      if (caller.role !== "SuperAdmin") {
        return forbidden(ctx, "Only SuperAdmin may add other SuperAdmins");
      }

      // 3) Validate body and promote/create via service
      await withBodyValidation(schema)(ctx, async () => {
        const { email } = ctx.bindings.validatedBody as z.infer<typeof schema>;
        try {
          const dto = await addSuperAdmin(email.toLowerCase());
          return ok(ctx, { id: dto.id });
        } catch (err: any) {
          return badRequest(ctx, err?.message ?? "Failed to add SuperAdmin");
        }
      });
    });
  },
  { genericMessage: "Failed to add SuperAdmin" }
);

export default create;

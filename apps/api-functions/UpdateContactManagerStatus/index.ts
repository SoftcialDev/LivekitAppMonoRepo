import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, forbidden, badRequest } from "../shared/utils/response";
import { getUserByAzureOid } from "../shared/services/userService";
import {
  updateMyContactManagerStatus,
  ContactManagerProfileDto
} from "../shared/services/contactManagerService";

/**
 * Zod schema for the request body.
 * Only the new status is expected here.
 */
const StatusUpdateBody = z.object({
  /** The new status to set. */
  status: z.enum(["Unavailable", "Available", "OnBreak", "OnAnotherTask"]),
});

/**
 * HTTP-triggered Azure Function to allow the *current* Contact Manager
 * to update their own status.
 *
 * @remarks
 * - Supports CORS preflight (OPTIONS) and POST.
 * - URL: `/api/contact-managers/me/status`
 * - Body: `{ "status": "<Available|Unavailable|OnBreak|OnAnotherTask>" }`
 * - Caller must be authenticated and have `role === "ContactManager"` in our DB.
 *
 * @param ctx – Azure Functions context (with `ctx.bindings.user` from AD middleware).
 * @param req – The incoming HTTP request.
 */
const updateMyStatusFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    // 1) Handle CORS preflight
    if (req.method === "OPTIONS") {
      ctx.res = {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS, POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      };
      return;
    }

    // 2) Only POST is allowed
    if (req.method !== "POST") {
      ctx.res = {
        status: 405,
        headers: { "Content-Type": "application/json" },
        body: { error: "Method Not Allowed" },
      };
      return;
    }

    await withAuth(ctx, async () => {
      // 3) Extract caller’s Azure AD OID
      const claims = ctx.bindings.user as { oid?: string };
      const azureAdOid = claims.oid;
      if (!azureAdOid) {
        return forbidden(ctx, "Cannot determine caller identity");
      }

      // 4) Lookup caller in our Users table
      const caller = await getUserByAzureOid(azureAdOid);
      if (!caller) {
        return forbidden(ctx, "User not found in application database");
      }

      // 5) Verify their role in our DB
      if (caller.role !== "ContactManager") {
        return forbidden(
          ctx,
          `Access denied: user role is "${caller.role}", must be ContactManager`
        );
      }

      // 6) Parse & validate body
      let parsed: z.infer<typeof StatusUpdateBody>;
      try {
        parsed = StatusUpdateBody.parse(req.body);
      } catch (err: any) {
        return badRequest(ctx, err.errors || err.message);
      }
      const { status } = parsed;

      // 7) Perform the update directly with caller.id
      try {
        const updated: ContactManagerProfileDto =
          await updateMyContactManagerStatus(caller.id, status);
        return ok(ctx, updated);
      } catch (err: any) {
        const msg = err.message || "Unknown error";
        if (msg.includes("not found")) {
          return badRequest(ctx, msg);
        }
        if (msg.includes("not allowed")) {
          return forbidden(ctx, msg);
        }
        return badRequest(ctx, msg);
      }
    });
  },
  {
    genericMessage: "Internal error updating Contact Manager status",
    showStackInDev: true,
  }
);

export default updateMyStatusFunction;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, unauthorized, forbidden } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

const querySchema = z.object({
  page:      z.string().regex(/^\d+$/).optional(),
  pageSize:  z.string().regex(/^\d+$/).optional(),
});

/**
 * GetPresenceStatusesFunction
 *
 * HTTP-triggered Azure Function that returns a paginated list of presence statuses
 * for users with the "Employee" role.
 *
 * - **Admin** callers see *all* employees.
 * - **Supervisor** callers see only their direct-report employees.
 *
 * Authentication:
 * - Requires a valid Azure AD JWT.
 *
 * Query Parameters:
 * - `page` (optional, default `1`): 1-based page number
 * - `pageSize` (optional, default `50`): items per page, capped at 100
 *
 * Response (200):
 * ```json
 * {
 *   "total": 123,
 *   "page": 1,
 *   "pageSize": 50,
 *   "items": [
 *     {
 *       "email": "employee1@foo.com",
 *       "fullName": "Employee One",
 *       "azureAdObjectId": "7f849383-fc13-40a7-9dfe-764eea83a610",
 *       "status": "online",
 *       "lastSeenAt": "2025-06-25T13:45:30.000Z"
 *     },
 *     …
 *   ]
 * }
 * ```
 *
 * Errors:
 * - `400 Bad Request` – invalid query parameters
 * - `401 Unauthorized` – missing/invalid JWT or user deleted
 * - `403 Forbidden` – caller not Admin or Supervisor
 */
const getPresenceStatusesFunction: AzureFunction = withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;

  // 1) Validate and parse query params
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    return badRequest(ctx, "Invalid query parameters: page and pageSize must be positive integers");
  }
  const { page = "1", pageSize = "50" } = parse.data;
  const p    = Math.max(1, parseInt(page, 10));
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10))); // cap at 100

  // 2) Authenticate
  return  withAuth(ctx, async () => {
    const claims   = (ctx as any).bindings.user as JwtPayload;
    const callerId = (claims.oid || claims.sub) as string;
    if (!callerId) {
      return unauthorized(ctx, "Unable to determine caller identity");
    }

    // 3) Fetch caller and check role
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: callerId },
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, "Caller not found or deleted");
    }
    if (caller.role !== "Admin" && caller.role !== "Supervisor") {
      return forbidden(ctx, "Insufficient privileges");
    }

    // 4) Build filter for employees
    const where: any = { deletedAt: null, role: "Employee" };
    if (caller.role === "Supervisor") {
      where.supervisorId = caller.id;
    }

    // 5) Count total
    const total = await prisma.user.count({ where });

    // 6) Fetch page of users + their presence + Azure AD object ID
    const users = await prisma.user.findMany({
      where,
      skip: (p - 1) * size,
      take: size,
      select: {
        email:             true,
        fullName:          true,
        azureAdObjectId:   true,  
        presence: {
          select: {
            status:     true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { email: "asc" },
    });

    // 7) Map into response items
    const items = users.map(u => ({
      email:            u.email,
      fullName:         u.fullName ?? "",
      azureAdObjectId:  u.azureAdObjectId,
      status:           u.presence?.status   ?? "offline",
      lastSeenAt:       u.presence?.lastSeenAt?.toISOString() ?? null,
    }));

    // 8) Return paginated result
    return ok(ctx, {
      total,
      page:     p,
      pageSize: size,
      items,
    });
  });
});

export default getPresenceStatusesFunction;

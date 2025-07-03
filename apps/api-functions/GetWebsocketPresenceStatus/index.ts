import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, unauthorized, forbidden } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Schema for validating pagination query parameters:
 * - `page`: 1-based page number (string of digits)
 * - `pageSize`: number of items per page (string of digits, max 100)
 */
const querySchema = z.object({
  page:     z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
});

/**
 * Represents a single user's presence status in the paginated response.
 */
interface PresenceItem {
  /** User's email address */
  email: string;
  /** User's full name (empty string if null) */
  fullName: string;
  /** Azure AD object ID */
  azureAdObjectId: string;
  /** Presence status, e.g. "online", "offline", etc. */
  status: string;
  /** ISO timestamp of last seen, or null if unavailable */
  lastSeenAt: string | null;
}

/**
 * Structure of the paginated presence response.
 */
interface PaginatedPresence {
  /** Total number of matching users */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Array of presence items */
  items: PresenceItem[];
}

/**
 * HTTP-triggered Azure Function that returns a paginated list of presence statuses for all users.
 *
 * - **Admin** callers see all users.
 * - **Supervisor** callers see only their direct reports.
 *
 * @param {Context} ctx - Azure Functions execution context.
 * @param {HttpRequest} ctx.req - HTTP request object.
 * @param {string} [ctx.req.query.page] - 1-based page number as string (default "1").
 * @param {string} [ctx.req.query.pageSize] - Number of items per page as string (default "50", max 100).
 *
 * @returns {Promise<import("../shared/utils/response").Response>}  
 *   - 200 OK with PaginatedPresence on success.  
 *   - 400 Bad Request if parameters are invalid or a DB error occurs.  
 *   - 401 Unauthorized if caller identity is missing or user is deleted.  
 *   - 403 Forbidden if caller lacks Admin or Supervisor role.
 */
const getWebsocketPresenceStatuses: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    const req: HttpRequest = ctx.req!;

    // 1) Validate & parse query parameters
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return badRequest(
        ctx,
        "Invalid query parameters: page and pageSize must be positive integers"
      );
    }
    const { page = "1", pageSize = "50" } = parseResult.data;
    const p = Math.max(1, parseInt(page, 10));
    const size = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

    // 2) Authenticate caller
    return withAuth(ctx, async () => {
      const claims = (ctx as any).bindings.user as JwtPayload;
      const callerId = (claims.oid || claims.sub) as string;
      if (!callerId) {
        return unauthorized(ctx, "Unable to determine caller identity");
      }

      // 3) Fetch caller record & verify role
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: callerId },
      });
      if (!caller || caller.deletedAt) {
        return unauthorized(ctx, "Caller not found or deleted");
      }
      if (caller.role !== "Admin" && caller.role !== "Supervisor") {
        return forbidden(ctx, "Insufficient privileges");
      }

      // 4) Build base filter to include all non-deleted users
      const baseWhere = { deletedAt: null };

      try {
        // 5) Count total matching users
        const total = await prisma.user.count({ where: baseWhere });

        // 6) Fetch paginated users with their presence
        const users = await prisma.user.findMany({
          where: baseWhere,
          skip: (p - 1) * size,
          take: size,
          select: {
            email:           true,
            fullName:        true,
            azureAdObjectId: true,
            role:            true,   
            presence: { select: { status: true, lastSeenAt: true } },
          },
          orderBy: { email: "asc" },
        });

        // 7) Map database records to response items
        const items: PresenceItem[] = users.map(u => ({
          email:           u.email,
          fullName:        u.fullName ?? "",
          azureAdObjectId: u.azureAdObjectId,
          status:          u.presence?.status   ?? "offline",
          role:            u.role,   
          lastSeenAt:      u.presence?.lastSeenAt?.toISOString() ?? null,
        }));

        // 8) Return paginated presence
        const response: PaginatedPresence = { total, page: p, pageSize: size, items };
        return ok(ctx, response);
      } catch (err: any) {
        ctx.log.error("Fetch presence statuses error:", err);
        return badRequest(
          ctx,
          `Failed to fetch presence statuses: ${err.message}`
        );
      }
    });
  }
);

export default getWebsocketPresenceStatuses;

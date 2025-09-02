import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, unauthorized, forbidden } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * A single user’s presence status in the paginated response,
 * including their supervisor’s email and name if assigned.
 */
interface PresenceItem {
  /** User’s email address */
  email: string;
  /** User’s full name (empty string if null) */
  fullName: string;
  /** Azure AD object ID */
  azureAdObjectId: string;
  /** User role, e.g. "Admin", "Supervisor", or "Employee" */
  role: string;
  /** Presence status, e.g. "online" or "offline" */
  status: string;
  /** ISO timestamp of last seen, or null if unavailable */
  lastSeenAt: string | null;
  /** Supervisor’s email address, or null if none assigned */
  supervisorEmail: string | null;
  /** Supervisor’s full name, or null if none assigned */
  supervisorName: string | null;
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

////////////////////////////////////////////////////////////////////////////////
// Validation schema
////////////////////////////////////////////////////////////////////////////////

const querySchema = z.object({
  page:     z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
});

////////////////////////////////////////////////////////////////////////////////
// Function
////////////////////////////////////////////////////////////////////////////////

/**
 * HTTP‐triggered Azure Function that returns a paginated list of presence
 * statuses for all users, including each user’s supervisor info.
 *
 * - **Admin** callers see all users.
 * - **Supervisor** callers see only their direct reports on the client side,
 *   but this endpoint returns everyone.
 *
 * @param ctx  Azure Functions execution context
 * @param ctx.req  HTTP request with optional `page` and `pageSize` query params
 * @returns 200 OK with PaginatedPresence, or 4xx on error
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


      try {
        // 4) Count total matching users
        const total = await prisma.user.count({
          where: { deletedAt: null },
        });

        // 5) Fetch paginated users with presence + supervisor
        const users = await prisma.user.findMany({
          where: { deletedAt: null },
          skip: (p - 1) * size,
          take: size,
          orderBy: { email: "asc" },
          select: {
            email:           true,
            fullName:        true,
            azureAdObjectId: true,
            role:            true,
            presence: {
              select: { status: true, lastSeenAt: true },
            },
            supervisor: {
              select: { email: true, fullName: true },
            },
          },
        });

        // 6) Map database records to response items
        const items: PresenceItem[] = users.map(u => ({
          email:           u.email,
          fullName:        u.fullName ?? "",
          azureAdObjectId: u.azureAdObjectId,
          role:            u.role,
          status:          u.presence?.status   ?? "offline",
          lastSeenAt:      u.presence?.lastSeenAt?.toISOString() ?? null,
          supervisorEmail: u.supervisor?.email   ?? null,
          supervisorName:  u.supervisor?.fullName ?? null,
        }));

        // 7) Return paginated presence
        const response: PaginatedPresence = {
          total,
          page:     p,
          pageSize: size,
          items,
        };
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

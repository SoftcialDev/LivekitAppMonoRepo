import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, unauthorized, forbidden } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

const querySchema = z.object({
  page:     z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
});

/**
 * HTTP-triggered Azure Function that returns a paginated list of presence statuses
 * for users with the "Employee" role.
 *
 * Admin callers see all employees; Supervisor callers see only their direct-report employees.
 *
 * @param ctx - The Azure Functions execution context.
 * @param ctx.req - The incoming HTTP request.
 * @param ctx.req.query.page - (optional) 1-based page number. Defaults to "1" if not provided.
 * @param ctx.req.query.pageSize - (optional) Number of items per page (max 100). Defaults to "50".
 * @returns A 200 OK response with the following JSON payload:
 * ```json
 * {
 *   "total": number,
 *   "page": number,
 *   "pageSize": number,
 *   "items": Array<{
 *     email: string;
 *     fullName: string;
 *     azureAdObjectId: string;
 *     status: string;
 *     lastSeenAt: string | null;
 *   }>
 * }
 * ```
 * @throws 400 Bad Request if `page` or `pageSize` are invalid or if the database query fails.
 * @throws 401 Unauthorized if the caller’s identity cannot be determined or the caller is deleted.
 * @throws 403 Forbidden if the caller is neither Admin nor Supervisor.
 */
const getWebsocketPresenceStatusesFunction: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    const req: HttpRequest = ctx.req!;

    // 1) Validate and parse query parameters
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return badRequest(ctx, "Invalid query parameters: page and pageSize must be positive integers");
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

      // 3) Fetch caller record and verify role
      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: callerId },
      });
      if (!caller || caller.deletedAt) {
        return unauthorized(ctx, "Caller not found or deleted");
      }
      if (caller.role !== "Admin" && caller.role !== "Supervisor") {
        return forbidden(ctx, "Insufficient privileges");
      }

      // 4) Build filter for employee users
      const where: any = { deletedAt: null, role: "Employee" };
      if (caller.role === "Supervisor") {
        where.supervisorId = caller.id;
      }

      try {
        // 5) Count total matching users
        const total = await prisma.user.count({ where });

        // 6) Fetch paginated users and their presence
        const users = await prisma.user.findMany({
          where,
          skip: (p - 1) * size,
          take: size,
          select: {
            email: true,
            fullName: true,
            azureAdObjectId: true,
            presence: {
              select: {
                status: true,
                lastSeenAt: true,
              },
            },
          },
          orderBy: { email: "asc" },
        });

        // 7) Map to response items
        const items = users.map(u => ({
          email:           u.email,
          fullName:        u.fullName ?? "",
          azureAdObjectId: u.azureAdObjectId,
          status:          u.presence?.status   ?? "offline",
          lastSeenAt:      u.presence?.lastSeenAt?.toISOString() ?? null,
        }));

        // 8) Return paginated result
        return ok(ctx, {
          total,
          page:     p,
          pageSize: size,
          items,
        });
      } catch (err: any) {
        ctx.log.error("Fetch presence statuses error:", err);
        return badRequest(ctx, `Failed to fetch presence statuses: ${err.message}`);
      }
    });
  }
);

export default getWebsocketPresenceStatusesFunction;

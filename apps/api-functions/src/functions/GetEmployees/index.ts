import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../../middleware/auth";
import { withErrorHandler } from "../../middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../../utils/response";
import prisma from "../../services/prismaClienService";
import { getPresenceStatus } from "../../services/presenceService";
import { JwtPayload } from "jsonwebtoken";

/**
 * GetEmployeesFunction
 *
 * HTTP GET /api/GetEmployees
 *
 * Authenticates via Azure AD JWT.
 * Ensures the caller has role Admin or SuperAdmin.
 * Retrieves all users assigned to this admin (where adminId = caller’s id), excluding deleted users.
 * For each employee, includes:
 *  - email: string
 *  - fullName: string
 *  - assignedAt: Date
 *  - presenceStatus: "online" | "offline"
 *
 * @param ctx - Azure Functions execution context containing HTTP request.
 * @returns Promise<void> - 200 OK with `{ employees: Array<{ email: string; fullName: string; assignedAt: Date; presenceStatus: "online" | "offline" }> }`,
 *   or appropriate error response.
 * @throws Errors from database or presenceService bubble up to the error handler.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      unauthorized(ctx, "Cannot determine user identity");
      return;
    }
    // Fetch the admin user record
    const adminUser = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!adminUser || adminUser.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }
    const role = adminUser.role;
    const isAdminUser = role === "Admin" || role === "SuperAdmin";
    if (!isAdminUser) {
      unauthorized(ctx, "Insufficient privileges");
      return;
    }
    try {
      // Fetch employees assigned to this admin
      const employees = await prisma.user.findMany({
        where: {
          adminId: adminUser.id,
          deletedAt: null
        },
        select: {
          email: true,
          fullName: true,
          assignedAt: true
        }
      });
      // For each employee, resolve presence status
      const result = await Promise.all(
        employees.map(async (emp: { email: string; fullName: string; assignedAt: Date }) => {
          let presenceStatus: "online" | "offline";
          try {
            presenceStatus = await getPresenceStatus(emp.email);
          } catch {
            presenceStatus = "offline";
          }
          return {
            email: emp.email,
            fullName: emp.fullName,
            assignedAt: emp.assignedAt,
            presenceStatus
          };
        })
      );
      ok(ctx, { employees: result });
    } catch (err: any) {
      ctx.log.error("GetEmployees error:", err);
      badRequest(ctx, `Failed to get employees: ${err.message}`);
    }
  });
});

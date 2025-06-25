import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { getPresenceStatus } from "../shared/services/presenceService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Data returned for a single user.
 */
export interface UserResponse {
  email: string;
  firstName: string;
  lastName: string;
  role: "Admin" | "Supervisor" | "Employee";
  assignedAt: Date;
  presenceStatus: "online" | "offline";
  supervisorAdId: string;
  supervisorName: string;
}

/**
 * Azure Function: GetUsersByRole
 *
 * Returns users filtered by role type.
 *
 * Query parameters:
 *   - role (string, optional):
 *       "Employee" | "Supervisor" | "Admin" | "All"
 *     Defaults to "Employee" if omitted or unrecognized.
 *
 * Caller must present a valid Azure AD JWT and have
 * the "Admin" or "Supervisor" role.
 *
 * @param context.bindings.user  JWT payload with `oid` or `sub`
 * @param context.req.query.role The desired role filter
 *
 * @returns 200 OK with `{ users: UserResponse[] }`,
 *          401 Unauthorized, or 400 Bad Request on error.
 */
const getUsersByRole: AzureFunction = withErrorHandler(async (context: Context) => {
  const req: HttpRequest = context.req!;

  await withAuth(context, async () => {
    const claims = (context as any).bindings.user as JwtPayload;
    const callerAdId = (claims.oid || claims.sub) as string;
    if (!callerAdId) {
      return unauthorized(context, "Cannot determine caller identity");
    }

    // 1) Verify caller exists & has Admin/Supervisor privileges
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: callerAdId },
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(context, "User not found or deleted");
    }
    if (caller.role !== "Admin" && caller.role !== "Supervisor") {
      return unauthorized(context, "Insufficient privileges");
    }

    // 2) Determine role filter from query param
    const allowed = ["Employee", "Supervisor", "Admin", "All"];
    let roleParam = (req.query.role as string || "Employee").trim();
    if (!allowed.includes(roleParam)) {
      roleParam = "Employee";
    }

    // 3) Build Prisma filter
    const whereClause: any = { deletedAt: null };
    if (roleParam !== "All") {
      whereClause.role = roleParam;
    }

    try {
      // 4) Fetch matching users including supervisor info
      const raw = await prisma.user.findMany({
        where: whereClause,
        select: {
          email:         true,
          fullName:      true,
          role:          true,
          roleChangedAt: true,
          supervisor: {
            select: {
              azureAdObjectId: true,
              fullName:        true,
            }
          }
        }
      });

      // 5) Map to response shape
      const users: UserResponse[] = await Promise.all(
        raw.map(async u => {
          const parts = (u.fullName || "").trim().split(/\s+/);
          const firstName = parts.shift() || "";
          const lastName  = parts.join(" ");

          let presenceStatus: "online" | "offline";
          try {
            presenceStatus = await getPresenceStatus(u.email);
          } catch {
            presenceStatus = "offline";
          }

          const sup = u.supervisor;
          return {
            email:           u.email,
            firstName,
            lastName,
            role:            u.role,
            assignedAt:      u.roleChangedAt!,
            presenceStatus,
            supervisorAdId:  sup?.azureAdObjectId || "",
            supervisorName:  sup?.fullName        || ""
          };
        })
      );

      return ok(context, { users });
    } catch (err: any) {
      context.log.error("GetUsersByRole error:", err);
      return badRequest(context, `Failed to retrieve users: ${err.message}`);
    }
  });
});

export default getUsersByRole;

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import {
  getGraphToken,
  fetchAllUsers,
  fetchAppRoleMemberIds,
} from "../shared/services/graphService";
import { JwtPayload } from "jsonwebtoken";

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * @interface CandidateUser
 * Represents a user eligible for assignment to an App Role.
 */
export interface CandidateUser {
  /** Azure AD object ID */
  azureAdObjectId: string;
  /** User’s email or UPN */
  email: string;
  /** First name parsed from display name */
  firstName: string;
  /**
   * Last name parsed from display name.
   * If the user has multiple surnames, only the first is taken.
   */
  lastName: string;
  /**
   * Current App Role, or `null` if unassigned (tenant user).
   * One of `"Admin" | "Supervisor" | "Employee" | null`
   */
  role: "Admin" | "Supervisor" | "Employee" | null;
  /** (Employees only) Azure AD object ID of their assigned supervisor */
  supervisorAdId?: string;
  /** (Employees only) Display name of their assigned supervisor */
  supervisorName?: string;
}

/**
 * @function splitName
 * Splits a full display name into first and last name parts.
 * Only the first surname is kept if there are multiple.
 *
 * @param fullName - Raw display name, e.g. "Alice María García Pérez"
 * @returns An object `{ firstName, lastName }`,
 *   e.g. `{ firstName: "Alice", lastName: "María" }`
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName = "", second = ""] = fullName.trim().split(/\s+/);
  return { firstName, lastName: second };
}

////////////////////////////////////////////////////////////////////////////////
// Function
////////////////////////////////////////////////////////////////////////////////

/**
 * @constant getRoleCandidates
 * HTTP-triggered Azure Function returning users matching any of the requested App Roles,
 * with optional pagination.
 *
 * Query string parameters:
 *  - `role` (required): comma-separated list of
 *      "Admin", "Supervisor", "Employee", "Tenant"
 *    e.g. `role=Supervisor,Tenant`
 *  - `page` (optional): 1-based page number; defaults to 1.
 *  - `pageSize` (optional): number of items per page; defaults to 50.
 *
 * Response JSON:
 * ```
 * {
 *   total: number,            // total matching users before paging
 *   page: number,             // current page
 *   pageSize: number,         // page size
 *   users: CandidateUser[]    // items for this page
 * }
 * ```
 *
 * Caller must be authenticated and have the "Admin" or "Supervisor" role.
 */
const getRoleCandidates: AzureFunction = withErrorHandler(
  async (context: Context, req: HttpRequest) => {
    return withAuth(context, async () => {
      // 1. Authorization
      const claims = (context as any).bindings.user as JwtPayload;
      const callerId = (claims.oid || claims.sub) as string;
      if (!callerId) return unauthorized(context, "Unable to determine caller");
      const caller = await prisma.user.findUnique({ where: { azureAdObjectId: callerId } });
      if (!caller || caller.deletedAt) return unauthorized(context, "Caller not found or deleted");
      if (caller.role !== "Admin" && caller.role !== "Supervisor")
        return unauthorized(context, "Insufficient privileges");

      // 2. Parse query params
      const rawRoles = (req.query.role as string || "").trim();
      const requested = rawRoles.split(",").map(r => r.trim());
      const prismaRoles = requested.filter(r =>
        ["Admin", "Supervisor", "Employee"].includes(r)
      ) as Array<"Admin" | "Supervisor" | "Employee">;
      const includeTenant = requested.includes("Tenant");

      const page     = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.max(1, parseInt(req.query.pageSize as string) || 50);

      const candidates: CandidateUser[] = [];

      // 3. Fetch DB users for requested roles
      if (prismaRoles.length) {
        const dbUsers = await prisma.user.findMany({
          where: {
            deletedAt: null,
            role:      { in: prismaRoles },
          },
          select: {
            azureAdObjectId: true,
            email:           true,
            fullName:        true,
            role:            true,
            supervisor: {
              select: {
                azureAdObjectId: true,
                fullName:        true,
              },
            },
          },
        });
        for (const u of dbUsers) {
          const { firstName, lastName } = splitName(u.fullName);
          candidates.push({
            azureAdObjectId: u.azureAdObjectId,
            email:           u.email,
            firstName,
            lastName,
            role:            u.role,
            supervisorAdId:  u.supervisor?.azureAdObjectId,
            supervisorName:  u.supervisor?.fullName,
          });
        }
      }

      // 4. Fetch tenant users via Graph if requested
      if (includeTenant) {
        let token: string;
        try {
          token = await getGraphToken();
        } catch (err: any) {
          return badRequest(context, `Graph token error: ${err.message}`);
        }
        const spId    = process.env.SERVICE_PRINCIPAL_OBJECT_ID!;
        const roleIds = [
          process.env.SUPERVISORS_GROUP_ID!,
          process.env.ADMINS_GROUP_ID!,
          process.env.EMPLOYEES_GROUP_ID!,
        ];

        let supIds: Set<string>, adminIds: Set<string>, empIds: Set<string>;
        try {
          [supIds, adminIds, empIds] = await Promise.all([
            fetchAppRoleMemberIds(token, spId, roleIds[0]),
            fetchAppRoleMemberIds(token, spId, roleIds[1]),
            fetchAppRoleMemberIds(token, spId, roleIds[2]),
          ]);
        } catch (err: any) {
          return badRequest(context, `Graph role fetch error: ${err.message}`);
        }

        let all: Array<{
          id: string;
          displayName?: string;
          mail?: string;
          userPrincipalName?: string;
          accountEnabled?: boolean;
        }>;
        try {
          all = await fetchAllUsers(token);
        } catch (err: any) {
          return badRequest(context, `Graph users fetch error: ${err.message}`);
        }

        for (const u of all) {
          if (u.accountEnabled === false) continue;
          if (supIds.has(u.id) || adminIds.has(u.id) || empIds.has(u.id)) continue;
          const email = u.mail || u.userPrincipalName || "";
          if (!email) continue;
          const { firstName, lastName } = splitName(u.displayName || "");
          candidates.push({
            azureAdObjectId: u.id,
            email,
            firstName,
            lastName,
            role: null,
          });
        }
      }

      // 5. Deduplicate by Azure AD object ID
      const seen = new Set<string>();
      const unique = candidates.filter(u => {
        if (seen.has(u.azureAdObjectId)) return false;
        seen.add(u.azureAdObjectId);
        return true;
      });

      // 6. Paginate
      const total = unique.length;
      const start = (page - 1) * pageSize;
      const paged = unique.slice(start, start + pageSize);

      return ok(context, {
        total,
        page,
        pageSize,
        users: paged,
      });
    });
  },
  {
    genericMessage: "Internal server error in GetRoleCandidates",
    showStackInDev: true,
  }
);

export default getRoleCandidates;

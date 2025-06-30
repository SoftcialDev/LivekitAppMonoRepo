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

// import your user‐service helpers:
import {
  findOrCreateAdmin,
  upsertUserRole,
} from "../shared/services/userService";

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export interface CandidateUser {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  role:            "Admin" | "Supervisor" | "Employee" | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName = "", second = ""] = fullName.trim().split(/\s+/);
  return { firstName, lastName: second };
}

////////////////////////////////////////////////////////////////////////////////
// Function
////////////////////////////////////////////////////////////////////////////////

const getRoleCandidates: AzureFunction = withErrorHandler(
  async (context: Context, req: HttpRequest) => {
    return withAuth(context, async () => {
      // 1) AUTHZ & ensure caller in DB
      const claims = (context as any).bindings.user as JwtPayload;
      const callerOid = (claims.oid || claims.sub) as string;
      if (!callerOid) {
        return unauthorized(context, "Unable to determine caller");
      }

      // ensure an Admin record exists for caller
      const callerUpn = claims.preferred_username as string;
      const callerName = claims.name as string;
      const caller = await findOrCreateAdmin(callerOid, callerUpn, callerName);

      if (caller.role !== "Admin" && caller.role !== "Supervisor") {
        return unauthorized(context, "Insufficient privileges");
      }

      // 2) Parse query params
      const rawRoles     = (req.query.role as string || "").trim();
      const requested    = rawRoles.split(",").map(r => r.trim());
      const prismaRoles  = requested.filter(r =>
        ["Admin", "Supervisor", "Employee"].includes(r)
      ) as Array<"Admin"|"Supervisor"|"Employee">;
      const includeTenant = requested.includes("Tenant");

      const page     = Math.max(1, parseInt(req.query.page as string)    || 1);
      const pageSize = Math.max(1, parseInt(req.query.pageSize as string)|| 50);

      const candidates: CandidateUser[] = [];

      // 3) Fetch existing DB users for requested roles
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
            role: u.role,
            supervisorAdId: u.supervisor?.azureAdObjectId ?? undefined,
            supervisorName: u.supervisor?.fullName           ?? undefined,
          });
        }
      }

      // 4) Fetch tenant users via Graph if requested
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

        // fetch membership sets
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

        // fetch all AAD users
        let allUsers: Array<{
          id: string;
          displayName?: string;
          mail?: string;
          userPrincipalName?: string;
          accountEnabled?: boolean;
        }>;
        try {
          allUsers = await fetchAllUsers(token);
        } catch (err: any) {
          return badRequest(context, `Graph users fetch error: ${err.message}`);
        }

        // process each user: if not in any role-sets above, treat as tenant
        for (const u of allUsers) {
          if (u.accountEnabled === false) continue;

          // skip those already in App Roles
          if (supIds.has(u.id) || adminIds.has(u.id) || empIds.has(u.id)) {
            // but if they’re in a role but missing in DB, upsert them too
            let role: "Supervisor"|"Admin"|"Employee" = "Employee";
            if (adminIds.has(u.id))      role = "Admin";
            else if (supIds.has(u.id))   role = "Supervisor";

            // derive email & name
            const email = u.mail || u.userPrincipalName || "";
            if (!email) continue;
            const fullName = u.displayName || email;
            // upsert into DB with correct role
            await upsertUserRole(email, u.id, fullName, role, null);
            continue;
          }

          // this is a pure tenant user
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

      // 5) Dedupe by Azure AD ID
      const seen = new Set<string>();
      const unique = candidates.filter(u => {
        if (seen.has(u.azureAdObjectId)) return false;
        seen.add(u.azureAdObjectId);
        return true;
      });

      // 6) Paginate
      const total = unique.length;
      const start = (page - 1) * pageSize;
      const pageItems = unique.slice(start, start + pageSize);

      return ok(context, {
        total,
        page,
        pageSize,
        users: pageItems,
      });
    });
  },
  {
    genericMessage: "Internal server error in GetRoleCandidates",
    showStackInDev: true,
  }
);

export default getRoleCandidates;

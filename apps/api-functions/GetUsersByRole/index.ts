import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth }           from "../shared/middleware/auth";
import { withErrorHandler }   from "../shared/middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../shared/utils/response";

import prisma from "../shared/services/prismaClienService";
import {
  getGraphToken,
  fetchAllUsers,
  fetchAppRoleMemberIds,
} from "../shared/services/graphService";

import {
  findOrCreateAdmin,
  upsertUserRole,
  getUserByAzureOid,
} from "../shared/services/userService";

import type { JwtPayload } from "jsonwebtoken";

////////////////////////////////////////////////////////////////////////////////
// helpers
////////////////////////////////////////////////////////////////////////////////

interface CandidateUser {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  role:            "ContactManager" | "Admin" | "Supervisor" | "Employee" | "SuperAdmin" |null;
  supervisorAdId?: string;
  supervisorName?: string;
}

const splitName = (n = ""): { firstName: string; lastName: string } => {
  const [firstName = "", lastName = ""] = n.trim().split(/\s+/);
  return { firstName, lastName };
};

////////////////////////////////////////////////////////////////////////////////
// function
////////////////////////////////////////////////////////////////////////////////

const getRoleCandidates: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    return withAuth(ctx, async () => {
      /* ─────────────── 1. Caller authentication / authorisation ─────── */
      const claims = (ctx as any).bindings.user as JwtPayload;
      const oid   = claims.oid || claims.sub;
      if (!oid) return unauthorized(ctx, "Unable to determine caller OID");

      const callerUpn  = claims.preferred_username as string | undefined;
      const callerName = (claims.name ?? callerUpn ?? "Unknown") as string;
      const caller =
        (await getUserByAzureOid(oid)) ??
        (callerUpn && (await prisma.user.findUnique({ where: { email: callerUpn.toLowerCase() } }))) ??
        (await findOrCreateAdmin(oid, callerUpn ?? `${oid}@tenant`, callerName));

      if (!caller || typeof caller !== "object" || caller.role !== "Admin" && caller.role !== "Supervisor" && caller.role !== "SuperAdmin") {
        return unauthorized(ctx, "Insufficient privileges");
      }

      /* ─────────────── 2. Query-string params ────────────────────────── */
      const rawRoleParam = (req.query.role as string | "")              .trim();
      const requested    = rawRoleParam ? rawRoleParam.split(",").map(r => r.trim()) : ["All"];

      const prismaRoles = requested.filter(r =>
        ["Admin","ContactManager","SuperAdmin", "Supervisor", "Employee"].includes(r)
      ) as Array<"Admin" | "Supervisor" | "Employee" | "SuperAdmin" | "ContactManager">;

      const includeTenant = requested.includes("Tenant") || requested.includes("All");

      const page     = Math.max(1, parseInt(req.query.page     as string) || 1);
      const pageSize = Math.max(1, parseInt(req.query.pageSize as string) || 50);

      const candidates: CandidateUser[] = [];

      /* ─────────────── 3. Users already in DB (incl. supervisor link) ── */
      if (prismaRoles.length) {
        const dbUsers = await prisma.user.findMany({
          where: { deletedAt: null, role: { in: prismaRoles } },
          select: {
            azureAdObjectId: true,
            email:           true,
            fullName:        true,
            role:            true,
            supervisor: {
              select: { azureAdObjectId: true, fullName: true },
            },
          },
        });

        dbUsers.forEach(u => {
          const { firstName, lastName } = splitName(u.fullName);
          candidates.push({
            azureAdObjectId: u.azureAdObjectId,
            email:           u.email,
            firstName,
            lastName,
            role: u.role,
            supervisorAdId:  u.supervisor?.azureAdObjectId,
            supervisorName:  u.supervisor?.fullName,
          });
        });
      }

      /* ─────────────── 4. Optional tenant discovery via Graph ────────── */
if (includeTenant) {
  let token: string;
  try {
    token = await getGraphToken();
  } catch (err: any) {
    return badRequest(ctx, `Graph token error: ${err.message}`);
  }

  const spId = process.env.SERVICE_PRINCIPAL_OBJECT_ID!;
  const [supIds, adminIds, empIds] = await Promise.all([
    fetchAppRoleMemberIds(token, spId, process.env.SUPERVISORS_GROUP_ID!),
    fetchAppRoleMemberIds(token, spId, process.env.ADMINS_GROUP_ID!),
    fetchAppRoleMemberIds(token, spId, process.env.EMPLOYEES_GROUP_ID!),
    fetchAppRoleMemberIds(token, spId, process.env.CONTACT_MANAGER_GROUP_ID!),
    fetchAppRoleMemberIds(token, spId, process.env.SUPER_ADMIN_GROUP_ID!)
  ]);

  // fetch all tenant users once
  const graphUsers = await fetchAllUsers(token);

  for (const gu of graphUsers) {
    if (gu.accountEnabled === false) continue;
    const email = gu.mail || gu.userPrincipalName || "";
    if (!email) continue;

    // skip anyone already in an App-role group
    const inAnyRole = supIds.has(gu.id) || adminIds.has(gu.id) || empIds.has(gu.id);
    if (inAnyRole) continue;

    // **skip if already materialized in our DB**
    const alreadyInDb = await prisma.user.findUnique({
      where: { azureAdObjectId: gu.id }
    });
    if (alreadyInDb) continue;

    // now this is a pure “tenant” never seen before
    const { firstName, lastName } = splitName(gu.displayName);
    candidates.push({
      azureAdObjectId: gu.id,
      email,
      firstName,
      lastName,
      role: null,
    });
  }
}

      /* ─────────────── 5. Deduplicate by OID ─────────────────────────── */
      const dedup: CandidateUser[] = [];
      const seen = new Set<string>();
      for (const c of candidates) {
        if (!seen.has(c.azureAdObjectId)) {
          seen.add(c.azureAdObjectId);
          dedup.push(c);
        }
      }

      /* ─────────────── 6. Pagination ─────────────────────────────────── */
      const total   = dedup.length;
      const startIx = (page - 1) * pageSize;
      const users   = dedup.slice(startIx, startIx + pageSize);

      return ok(ctx, { total, page, pageSize, users });
    });
  },
  {
    genericMessage: "Internal server error in GetUsersByRole",
    showStackInDev: true,
  }
);

export default getRoleCandidates;

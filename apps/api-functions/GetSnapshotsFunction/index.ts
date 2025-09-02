import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth }         from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import prisma               from "../shared/services/prismaClienService";

interface SnapshotReport {
  id:             string;
  supervisorName: string;
  psoFullName:    string;
  psoEmail:       string;
  reason:         string;
  imageUrl:       string;
  takenAt:        string;  // ISO timestamp
}

/**
 * HTTP GET /api/snapshots
 *
 * Returns all snapshot reports, newest first.  
 * Only users with User.role === "Admin" may call this.
 *
 * @param ctx – Function context, with OBO claims on ctx.bindings.user.
 * @param req – Incoming HTTP request.
 * @returns 200 OK with `{ reports: SnapshotReport[] }`, or 401 if not Admin.
 */
const getSnapshotsFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) Identify caller
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid    = claims.oid || claims.sub;
      if (!oid) {
        return unauthorized(ctx, "Missing OID in token");
      }

      // 2) Load caller record and enforce Admin role
      const caller = await prisma.user.findUnique({ where: { azureAdObjectId: oid } });
      if (!caller || caller.role !== "Admin" && caller.role !== "SuperAdmin") {
        return unauthorized(ctx, "Admins only");
      }

      // 3) Fetch snapshots with supervisor & pso relations
      const snaps = await prisma.snapshot.findMany({
        include: {
          supervisor: { select: { fullName: true } },
          pso:        { select: { fullName: true, email: true } },
        },
        orderBy: { takenAt: "desc" },
      });

      // 4) Map to transport DTO
      const reports: SnapshotReport[] = snaps.map(s => ({
        id:             s.id,
        supervisorName: s.supervisor.fullName,
        psoFullName:    s.pso.fullName,
        psoEmail:       s.pso.email,
        reason:         s.reason,
        imageUrl:       s.imageUrl,
        takenAt:        s.takenAt.toISOString(),
      }));

      return ok(ctx, { reports });
    });
  },
  {
    genericMessage: "Internal error fetching snapshots",
    showStackInDev: true,
  }
);

export default getSnapshotsFunction;
